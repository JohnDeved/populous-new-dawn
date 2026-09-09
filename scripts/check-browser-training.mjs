// Live original warrior training: queue, visible admission, whole-batch replacement and exit.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const headed = process.argv.includes('--headed')
const browser = await chromium.launch({ headless: !headed })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(async () => {
    const s = window.testScene, w = s.world, m = await import('/app/model.ts')
    w.speed = 0; w.manaWorld.gameFlags = 32
    const b = m.addBuilding(w, 'blue', 'camp', { x: -2, z: 32 }, true, { angle: Math.PI })
    const people = Array.from({ length: 8 }, (_, i) => m.addUnit(w, 'blue', 'brave', { x: 7 + i * .4, z: 33 }))
    w.selected = people.map(u => u.id)
    window.training = { b, people, frames: [], m }
    s.focus(b); s.startGroundView(2)
    for (let i = 0; i < 18; i++) s.updateCameraMotion(1 / 24)
    s.onChange()
  })
  await page.waitForFunction(() => !window.testScene.cameraMotion.active)
  const target = await page.evaluate(() => {
    const s = window.testScene, p = s.screen(window.training.b), r = s.container.getBoundingClientRect()
    return { x: r.left + (p.x + 1) * r.width / 2, y: r.top + (1 - p.y) * r.height / 2 }
  })
  await page.mouse.click(target.x, target.y, { button: 'right' })
  await page.mouse.move(1400, 50)
  await page.evaluate(() => {
    const s = window.testScene, h = window.training, animate = s.animate, afterTurn = s.gameClock.afterTurn
    h.commanded = h.people.every(u => u.work === h.b.id)
    s.animate = now => {
      const start = performance.now(); animate(now)
      if (!h.paused) h.frames.push({ time: now, cpu: performance.now() - start, calls: s.renderer.info.render.calls })
    }
    s.gameClock.afterTurn = () => {
      afterTurn()
      if (!h.paused && h.b.admission?.inside === 5 && h.people.every(u => u.entry && !u.entry.person.speed)) {
        h.paused = true; s.world.speed = 0
      }
      if (h.converting && s.world.stats.trained >= 5) { h.converting = false; s.world.speed = 0 }
    }
    s.world.speed = 1
  })
  await page.waitForFunction(() => window.training.paused)
  const queued = await page.evaluate(() => {
    const s = window.testScene, h = window.training, gl = s.renderer.getContext(), info = gl.getExtension('WEBGL_debug_renderer_info')
    const queue = h.people.filter(u => u.inside === null), groups = queue.map(u => s.unitMeshes.get(u.id))
    const read = () => {
      s.renderer.render(s.scene, s.camera)
      const p = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
      gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, p)
      return p
    }
    const before = read(); groups.forEach(g => { g.visible = false }); const after = read(); groups.forEach(g => { g.visible = true })
    let pixels = 0
    for (let i = 0; i < before.length; i += 4) if (before[i] !== after[i] || before[i + 1] !== after[i + 1] || before[i + 2] !== after[i + 2]) pixels++
    const frames = h.frames, gaps = frames.slice(1).map((f, i) => f.time - frames[i].time)
    const q = (a, n) => a.sort((a, b) => a - b)[Math.floor((a.length - 1) * n)]
    return { commanded: h.commanded, inside: h.b.admission.inside, queue: queue.map(u => u.id), pixels,
      people: h.people.map(u => ({ id: u.id, substate: u.entry.person.substate, visible: s.unitMeshes.get(u.id).visible,
        object: u.entry.person.object, frame: s.unitMeshes.get(u.id).userData.frame, layers: s.unitMeshes.get(u.id).children.filter(c => c.isSprite && c.visible).length })),
      performance: { userAgent: navigator.userAgent, renderer: gl.getParameter(info.UNMASKED_RENDERER_WEBGL), viewport: [innerWidth, innerHeight], dpr: devicePixelRatio,
        frames: frames.length, cpu: { p50: q(frames.map(f => f.cpu), .5), p95: q(frames.map(f => f.cpu), .95) },
        gaps: { p50: q(gaps, .5), p95: q(gaps, .95), max: Math.max(...gaps) }, maxDrawCalls: Math.max(...frames.map(f => f.calls)) } }
  })
  assert.ok(queued.commanded)
  assert.equal(queued.inside, 5); assert.equal(queued.queue.length, 3)
  assert.ok(queued.pixels > 50)
  assert.ok(queued.people.every(p => p.visible && p.layers > 0))
  await page.screenshot({ path: '/private/tmp/populous-training-queue.png' })
  await page.evaluate(() => {
    const s = window.testScene, h = window.training
    h.sources = h.b.admission.occupants.filter(Boolean)
    h.converting = true; h.b.timer = 65535; s.world.manaWorld.gameFlags = 0; s.world.speed = 1
  })
  await page.waitForFunction(() => !window.training.converting)
  const converted = await page.evaluate(async () => {
    const s = window.testScene, h = window.training, w = s.world
    const sprites = (await import('/app/original-units.json')).default
    const walk = new Set(sprites.animations['blue-warrior'].walk.flatMap(d => d.frames))
    const warriors = w.units.filter(u => u.team === 'blue' && u.kind === 'warrior')
    h.warriors = warriors; h.positions = warriors.map(u => [u.x, u.z])
    return { replaced: h.sources.every(id => !w.units.some(u => u.id === id)), count: warriors.length,
      warriors: warriors.map(u => ({ visible: s.unitMeshes.get(u.id).visible, walking: walk.has(s.unitMeshes.get(u.id).userData.frame), path: u.path.length, x: u.x, z: u.z })) }
  })
  assert.ok(converted.replaced); assert.equal(converted.count, 5)
  assert.ok(converted.warriors.every(u => u.visible && u.walking && u.path > 0))
  await page.evaluate(() => { window.testScene.world.speed = 1 })
  await page.waitForFunction(() => window.training.warriors.every(u => !u.path.length))
  const moved = await page.evaluate(() => window.training.warriors.map((u, i) => Math.hypot(u.x - window.training.positions[i][0], u.z - window.training.positions[i][1])))
  assert.ok(moved.every(d => d > 1))
  await page.screenshot({ path: '/private/tmp/populous-trained-warriors.png' })
  assert.deepEqual(errors, [])
  writeFileSync('/private/tmp/populous-training-browser.json', JSON.stringify({ headed, queued, converted, moved }, null, 2) + '\n')
  console.log('PASS: real training input, five visible residents, native queue pixels, original warrior walk frames, five replacement identities and actual exit movement', { queued, converted, moved })
} finally { await browser.close() }
