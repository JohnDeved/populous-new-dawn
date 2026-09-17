// Timed, isolated issue28 integration check. Reference provenance is explicit:
// either original-byte static submissions or the separately granted native oracle.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { chromium } from '@playwright/test'
import { bindGame } from './browser-game.mjs'
import units from '../app/original-units.json' with { type: 'json' }
import provenance from '../public/original/provenance.json' with { type: 'json' }

const option = name => process.argv[process.argv.indexOf(name) + 1]
assert.ok((process.argv.includes('--native-report') || process.argv.includes('--reference-report')) && process.argv.includes('--output-dir'), 'Supply --reference-report (or --native-report) and a new --output-dir')
const output = resolve(option('--output-dir')), nativePath = resolve(option(process.argv.includes('--reference-report') ? '--reference-report' : '--native-report'))
const native = JSON.parse(readFileSync(nativePath, 'utf8'))
assert.ok(['PASS_FOUR_TRIBE_ORIGINAL_SHAMAN_SUBMISSIONS', 'PASS_STATIC_SHAMAN_ASSETS'].includes(native.status))
assert.equal(native.atlasSha256, provenance.unitAtlasSha256)
const url = process.env.POPULOUS_URL ?? 'http://127.0.0.1:4318'
assert.equal(new URL(url).port, '4318', 'Issue28 uses its own reserved port4318')
mkdirSync(output, { recursive: false })
const report = { startedAt: new Date().toISOString(), url, viewport: { width: 1440, height: 1000 }, headed: process.argv.includes('--headed'), stages: [], referenceKind: native.referenceKind ?? 'Original executable HUD oracle', limits: ['Normal Mission23 UI/roster and live renderer are exercised; pose/death edge cases are explicitly fixture-controlled.', 'GPU pixel oracle is isolated at1:1, separate from full-scene screenshots.', 'RAF/full-frame samples are observations, not an achieved144fps or paired-regression claim.'] }
const browser = await chromium.launch({ headless: !report.headed })
let expired = false
const deadline = setTimeout(() => { expired = true; void browser.close() }, 90_000)
try {
  const context = await browser.newContext({ viewport: report.viewport, deviceScaleFactor: 1 })
  const page = await context.newPage(), errors = []
  report.consoleAndPageErrors = errors
  page.setDefaultTimeout(20_000)
  report.requests = []
  page.on('requestfailed', request => report.requests.push({ url: request.url(), error: request.failure()?.errorText }))
  page.on('response', response => { if (response.request().isNavigationRequest()) report.requests.push({ url: response.url(), status: response.status() }) })
  page.on('pageerror', error => errors.push(error.stack ?? error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  // Development sockets and optional traffic do not define game readiness.
  // Wait for the actual startup UI, retaining a bounded navigation timeout.
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await page.getByRole('button', { name: 'Mission 23', exact: true }).waitFor({ timeout: 20_000 })
  report.stages.push('Actual Mission23 startup UI ready')
  await page.getByRole('button', { name: 'Mission 23', exact: true }).click()
  await bindGame(page)
  if (await page.evaluate(() => !!window.testScene.world.inputMask)) await page.keyboard.press('Escape')
  await page.waitForFunction(() => !window.testScene.world.inputMask)
  await page.waitForFunction(() => [...window.testScene.unitMeshes.values()].some(g => g.userData.layers?.[0]?.material.map.image?.complete))
  const served = await page.request.get(url + '/original/unit-layers.png')
  assert.equal(createHash('sha256').update(await served.body()).digest('hex'), provenance.unitAtlasSha256)
  report.environment = await page.evaluate(() => {
    const s = window.testScene, gl = s.renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info')
    return { userAgent: navigator.userAgent, DPR: devicePixelRatio, renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR), maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE), framebuffer: [gl.drawingBufferWidth, gl.drawingBufferHeight], draw: { ...s.renderer.info.render }, memory: { ...s.renderer.info.memory } }
  })
  assert.ok(report.environment.maxTextureSize >= units.height)
  report.frameSamples = await page.evaluate(async () => {
    const s = window.testScene, original = s.animate, rows = []
    return await new Promise(resolve => {
      s.animate = stamp => {
        const start = performance.now()
        original(stamp)
        rows.push({ stamp, fullFrameMs: performance.now() - start })
        if (rows.length === 16) { s.animate = original; resolve(rows) }
      }
    })
  })
  const teams = ['blue', 'red', 'yellow', 'green']
  report.roster = await page.evaluate(() => window.testScene.world.units.filter(u => u.kind === 'shaman').map(u => ({ id: u.id, team: u.team, x: u.x, z: u.z })))
  assert.deepEqual(report.roster.map(u => u.team).sort(), teams.slice().sort())
  report.natural = []
  for (const team of teams) {
    const row = await page.evaluate(async team => {
      const s = window.testScene, w = s.world, u = w.units.find(u => u.team === team && u.kind === 'shaman')
      const art = (await import('/app/original-units.json')).default
      w.paused = true
      cancelAnimationFrame(s.frame)
      s.focus(u)
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
      const g = s.unitMeshes.get(u.id)
      return { team, id: u.id, signature: g.userData.signature, frame: g.userData.frame, rawFrame: art.frames[g.userData.frame].source, visible: g.visible, layers: g.userData.layers.filter(l => l.visible).length }
    }, team)
    assert.equal(row.signature, team + '-shaman')
    const allowed = new Set(Object.values(units.animations[team + '-shaman']).flatMap(d => d.flatMap(c => c.frames.map(i => units.frames[i].source))))
    assert.ok(allowed.has(row.rawFrame), 'Natural Shaman frame must belong to its actual tribe')
    assert.ok(row.visible && row.layers > 0)
    report.natural.push(row)
    await page.screenshot({ path: join(output, `natural-${team}.png`) })
  }
  report.stages.push('Original four-tribe mission roster rendered through shipped selection')

  // Use the shipped menu/store checkpoint before changing diagnostic pose fields.
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
  await page.waitForFunction(() => window.testStore.hasCheckpoint())
  await page.getByRole('button', { name: /Return to the world/ }).click()
  report.poseMatrix = await page.evaluate(async ({ teams, units }) => {
    const s = window.testScene, w = s.world, { createLivePerson } = await import('/app/live-people.ts')
    w.paused = true; cancelAnimationFrame(s.frame); s.cameraBearing = 0
    const rows = []
    for (const [tribe, team] of teams.entries()) {
      const u = w.units.find(u => u.team === team && u.kind === 'shaman')
      const p = u.native ?? createLivePerson(w, u)
      Object.assign(u, { native: p, flight: null, fight: null, entry: null, builder: null, casting: null, lift: 0, inside: null, fighting: false })
      p.state = 11; p.renderFlags = 0; p.draw = 14
      for (const base of [424, 456, 488, 552, 584, 616, 648, 744]) for (let direction = 0; direction < 8; direction++) {
        const cycle = units.shamanSources[base + tribe * 8][direction]
        for (const step of [...new Set([0, cycle.frames.length - 1])]) {
          p.object = base; p.f2 = step; p.f1 = 0
          u.heading = Math.PI + (direction * 256 + 0x380) * Math.PI / 1024
          s.updateUnitsFrame()
          const g = s.unitMeshes.get(u.id)
          if (g.userData.frame !== cycle.frames[step] || g.userData.frameFlip !== cycle.flip) throw Error(`Live source mismatch ${team}/${base}/${direction}/${step}`)
          rows.push({ team, base, direction, step, frame: g.userData.frame, flip: g.userData.frameFlip })
        }
      }
    }
    return rows
  }, { teams, units })
  report.stages.push('Native object/f2 and all eight directions through updateUnitsFrame')
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByRole('button', { name: 'Load checkpoint', exact: true }).click()
  await bindGame(page)
  const restored = await page.evaluate(() => window.testScene.world.units.filter(u => u.kind === 'shaman').map(u => ({ id: u.id, team: u.team })))
  assert.deepEqual(restored, report.roster.map(({ id, team }) => ({ id, team })))
  report.stages.push('Shipped checkpoint menu restores original tribe/ID after diagnostic poses')

  // Actual camera input and ordinary player command reach the live scene.
  await page.evaluate(() => { const s = window.testScene; s.world.paused = false; s.world.speed = 0; s.previous = performance.now(); s.frame = requestAnimationFrame(s.animate) })
  const oldBearing = await page.evaluate(() => window.testScene.cameraBearing)
  await page.locator('.world-viewport canvas.battlefield').focus()
  await page.keyboard.down('q')
  await page.waitForFunction(old => window.testScene.cameraBearing !== old, oldBearing)
  await page.keyboard.up('q')
  report.cameraInput = { before: oldBearing, after: await page.evaluate(() => window.testScene.cameraBearing) }
  report.command = await page.evaluate(async () => {
    const s = window.testScene, w = s.world, { command, tick } = await import('/app/model.ts')
    const u = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    w.paused = false; w.speed = 0; cancelAnimationFrame(s.frame)
    const before = { x: u.x, z: u.z }
    w.selected = [u.id]
    command(w, { x: u.x + 4, z: u.z })
    for (let i = 0; i < 36; i++) tick(w, 1 / 12)
    w.paused = true; s.focus(u); s.animate(s.previous); cancelAnimationFrame(s.frame)
    return { before, after: { x: u.x, z: u.z }, id: u.id, team: u.team, frame: s.unitMeshes.get(u.id).userData.frame, adapter: 'normal command/tick on the original mission Shaman; target is fixture supplied' }
  })
  assert.ok(report.command.before.x !== report.command.after.x || report.command.before.z !== report.command.after.z, 'Normal command must move the original player Shaman')

  // Fixture-controlled HP reaches the normal death producer; original Mission23
  // already has population and enabled reincarnation for all four tribes.
  report.lifecycle = await page.evaluate(async ({ teams, units }) => {
    const s = window.testScene, w = s.world, { tick } = await import('/app/model.ts'), rows = []
    const original = teams.map(team => w.units.find(u => u.team === team && u.kind === 'shaman'))
    original.forEach((u, tribe) => { u.heading = tribe * Math.PI / 4; u.hp = 0 })
    w.paused = false; tick(w, 1 / 12); w.paused = true
    const effects = teams.map(team => w.effects.find(f => f.reincarnation?.team === team))
    if (effects.some(f => !f)) throw Error('Missing normal reincarnation producer')
    let visits = 0
    for (const target of [0, 5, 133, 136, 469]) {
      w.paused = false
      while (visits < target) { tick(w, 1 / 12); visits++ }
      w.paused = true; s.animate(s.previous); cancelAnimationFrame(s.frame)
      for (const [tribe, team] of teams.entries()) {
        const effect = w.effects.find(f => f.id === effects[tribe].id)
        if (!effect) {
          const reborn = w.units.find(u => u.team === team && u.kind === 'shaman')
          if (!reborn || reborn.id === original[tribe].id) throw Error('Missing same-tribe respawn ' + team)
          rows.push({ target, team, rebornId: reborn.id }); continue
        }
        const g = s.fxMeshes.get(effect.id), phase = effect.reincarnation.phase
        const source = phase === 0 ? 680 + tribe * 8 : phase === 1 ? 352 : 360
        if (g.userData.directions[0].source !== source || g.userData.layerOwner !== (phase === 0 ? -1 : tribe)) throw Error('Wrong reincarnation appearance ' + team)
        if (effect.unit?.heading !== original[tribe].heading) throw Error('Death heading metadata lost')
        if (!units.shamanSources[source].some(c => c.frames.includes(g.userData.frame))) throw Error('Packed/source confusion')
        rows.push({ target, team, phase, source, frame: g.userData.frame, heading: effect.unit.heading, visible: g.visible })
      }
    }
    return rows
  }, { teams, units })
  assert.equal(report.lifecycle.filter(r => r.rebornId).length, 4)
  await page.screenshot({ path: join(output, 'after-reappearance.png') })
  report.stages.push('Four normal death/phase/respawn paths preserve tribe and heading')

  // Pixel oracle on a small target. These original native submissions are
  // independent of the live lookup test above. Select unique representative poses.
  const unique = new Map()
  for (const c of (native.nativeCases ?? native.pixelCases)) if (['idle', 'walk', 'attack', 'cast', 'launch', 'bodyDeath'].includes(c.action)) unique.set(`${c.team}/${c.base}/${c.direction}/${c.step}`, c)
  report.gpu = await page.evaluate(({ units, cases }) => {
    const s = window.testScene, renderer = s.renderer, gl = renderer.getContext()
    s.world.paused = true; cancelAnimationFrame(s.frame)
    renderer.setPixelRatio(1); renderer.setSize(128, 128, false); renderer.setClearColor(0xff00ff, 1)
    s.view.update(128, 128, { x: 0, z: 0 }, 0, 0, false, 640)
    s.view.projection.centerX = 64; s.view.projection.centerY = 80
    s.view.uniforms.nativeScreen.value.set([128, 128, 64, 80]); s.cameraBearing = 0
    s.view.config.scaledSprites = 0; s.view.config.shamanScale = 256
    const isolated = new s.scene.constructor(), g = new ([...s.unitMeshes.values()][0].constructor)()
    g.userData.layers = []; g.userData.draw = 14; g.userData.drawFlags = 2; isolated.add(g)
    const atlas = [...s.unitMeshes.values()].find(g => g.userData.layers.length).userData.layers[0].material.map.image
    const source = document.createElement('canvas'); source.width = units.width; source.height = units.height
    const ctx = source.getContext('2d'); ctx.drawImage(atlas, 0, 0)
    const rgba = ctx.getImageData(0, 0, source.width, source.height).data
    const tile = document.createElement('canvas'); tile.width = tile.height = 128
    const tc = tile.getContext('2d'), sheet = document.createElement('canvas')
    sheet.width = 16 * 64; sheet.height = Math.ceil(cases.length / 16) * 64
    const contact = sheet.getContext('2d'), failures = []
    let paintedTotal = 0
    for (const [index, c] of cases.entries()) {
      const tribe = ['blue', 'red', 'yellow', 'green'].indexOf(c.team)
      g.userData.signature = c.team + '-shaman'; g.userData.owner = tribe
      const heading = Math.PI + (c.direction * 256 + 0x380) * Math.PI / 1024
      s.animatePerson(g, heading, units.shamanSources[c.base + tribe * 8], 0, false, c.step)
      const origin = s.view.project(g.position, 0)
      s.view.prepare(isolated); renderer.render(isolated, s.camera)
      const gpu = new Uint8Array(128 * 128 * 4), actual = new Uint8ClampedArray(gpu.length)
      gl.readPixels(0, 0, 128, 128, gl.RGBA, gl.UNSIGNED_BYTE, gpu)
      for (let y = 0; y < 128; y++) actual.set(gpu.subarray(y * 512, (y + 1) * 512), (127 - y) * 512)
      const expected = new Uint8ClampedArray(gpu.length)
      for (let i = 0; i < expected.length; i += 4) expected.set([255, 0, 255, 255], i)
      for (const draw of c.draws) {
        const p = units.pieces[draw.piece]
        for (let y = 0; y < draw.h; y++) for (let x = 0; x < draw.w; x++) {
          const px = origin.screenX + draw.x + x, py = origin.screenY + draw.y + y
          if (px < 0 || px >= 128 || py < 0 || py >= 128) continue
          const ax = draw.piece % units.columns * units.cell + (draw.flags & 1 ? p.w - 1 - x : x)
          const ay = Math.floor(draw.piece / units.columns) * units.cell + y
          const src = (ay * units.width + ax) * 4
          if (rgba[src + 3]) expected.set(rgba.subarray(src, src + 4), (py * 128 + px) * 4)
        }
      }
      let different = 0, painted = 0
      for (let i = 0; i < actual.length; i += 4) {
        if (expected[i] !== 255 || expected[i + 1] !== 0 || expected[i + 2] !== 255) painted++
        if ([0, 1, 2].some(k => Math.abs(expected[i + k] - actual[i + k]) > 1)) different++
      }
      paintedTotal += painted
      if (!painted || different) failures.push({ team: c.team, base: c.base, direction: c.direction, step: c.step, painted, different })
      tc.putImageData(new ImageData(actual, 128, 128), 0, 0)
      contact.drawImage(tile, 32, 24, 64, 64, index % 16 * 64, Math.floor(index / 16) * 64, 64, 64)
    }
    return { cases: cases.length, failures, paintedTotal, sheet: sheet.toDataURL('image/png') }
  }, { units, cases: [...unique.values()] })
  writeFileSync(join(output, 'original-shaman-gpu-poses.png'), Buffer.from(report.gpu.sheet.split(',')[1], 'base64'))
  delete report.gpu.sheet
  assert.equal(report.gpu.failures.length, 0, JSON.stringify(report.gpu.failures.slice(0, 8)))
  assert.deepEqual(errors, [])
  assert.equal(expired, false)
  report.status = 'PASS_LIVE_FOUR_TRIBE_SHAMAN_APPEARANCE'
  report.stages.push('Original-byte submission GPU pixels match; reference provenance recorded separately')
} catch (error) {
  report.status = expired ? 'BLOCKED_BROWSER_TIME_LIMIT' : 'FAIL_LIVE_SHAMAN_CHECK'
  report.error = error.stack ?? String(error)
  process.exitCode = 1
} finally {
  clearTimeout(deadline)
  await browser.close()
  report.finishedAt = new Date().toISOString()
  report.browserClosed = true
  writeFileSync(join(output, 'evidence.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify({ status: report.status, stages: report.stages, environment: report.environment, gpu: report.gpu, error: report.error, output, browserClosed: true }, null, 2))
}
