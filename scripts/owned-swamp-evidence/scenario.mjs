import assert from 'node:assert/strict'
import { writeFileSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { bindGame } from '../browser-game.mjs'
import { waitForStartupMenu } from '../browser-new-game.mjs'
import { assertLive, assertCancelled, assertRetired, readWitness } from './witness.mjs'

// First bounded rendered episode only. Not the full PR acceptance suite.
// The owner supplies a reviewed browser, built URL and outer deadline; this module never launches one.
export default async function ownedSwampEpisode({ browser, url, output, deadlineAt }) {
  assert.ok(Number.isFinite(deadlineAt) && deadlineAt > Date.now())
  const report = { status: 'running', stages: [], errors: [], screenshots: [], limits: [
    'Supplied trap allocation, camera focus and frozen simulation speed; not ordinary earning/casting or native allocation parity',
    'Actual mounted Home/Scene, DOM mouse/key delivery and production advanceGame/render retirement',
    'This first episode covers plain-right, modifier-right and stationary Shift-right only',
    'Out-and-back drag, focus loss, pointer cancellation, modal/navigation and save/load/restart/new-game remain unimplemented',
    'No full dependency integrity, performance, deployment or current-main integration claim',
  ] }
  const save = () => writeFileSync(resolve(output, 'owned-swamp-episode.json'), JSON.stringify(report, null, 2) + '\n')
  const stage = (name, data) => { report.stages.push({ name, time: new Date().toISOString(), data }); save() }
  let context, page, failure, timer
  const closeBounded = async () => {
    if (!context) return true
    let closeTimer
    try {
      await Promise.race([context.close(), new Promise((_, reject) => {
        closeTimer = setTimeout(() => reject(Error('Context close exceeded 5s; outer owner must finish teardown')), 5000)
      })])
      return true
    } catch (error) { report.errors.push(String(error)); return false }
    finally { clearTimeout(closeTimer) }
  }
  try {
    // Keep 10 seconds of the inherited budget for diagnostics and context teardown.
    const budget = Math.min(90000, deadlineAt - Date.now() - 10000)
    assert.ok(budget > 0, 'No episode budget remains')
    context = await browser.newContext({ viewport: { width: 960, height: 720 }, deviceScaleFactor: 1 })
    context.on('page', p => {
      p.on('pageerror', e => report.errors.push(String(e)))
      p.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()) })
      p.on('crash', () => report.errors.push('Page crashed'))
    })
    timer = setTimeout(() => { report.timedOut = true; save(); void closeBounded() }, budget)
    page = await context.newPage()
    page.setDefaultTimeout(Math.min(10000, budget))
    const target = new URL(url); target.searchParams.set('owned-swamp-evidence', '1')
    await page.goto(target.href, { waitUntil: 'domcontentloaded' })
    const button = name => page.getByRole('button', { name, exact: true })
    await waitForStartupMenu(page); await button('New Game').click()
    await page.locator('[data-original-tutorial-recommendation]').waitFor()
    await button('No').click(); await button('Start Mission 1').click(); await bindGame(page)
    const startup = await page.waitForFunction(() => {
      const w = window.testStore.getWorld(), skip = document.querySelector('button.skip-introduction')
      if (!w.inputMask && w.levelStart.every(s => s.phase === 4)) return 'ready'
      return skip && skip.getClientRects().length && !skip.disabled ? 'skip' : false
    })
    const startupValue = await startup.jsonValue(); await startup.dispose()
    if (startupValue === 'skip') await page.getByRole('button', { name: /^Skip introduction/ }).click()
    await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
    await page.evaluate(async () => {
      const fixture = await window.__pndOwnedSwampFixtureReady
      if (typeof fixture?.advanceGame !== 'function') throw Error('Production clock fixture unavailable')
    })
    stage('bootstrap', await page.evaluate(() => {
      const s = window.testSceneRef.current, gl = s.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
      return { level: s.world.outcome.level, turn: s.world.turn,
        vendor: gl.getParameter(gl.VENDOR), renderer: gl.getParameter(gl.RENDERER),
        unmaskedRenderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null }
    }))
    // Clear ordinary selection through actual right click before supplying the trap.
    const canvas = page.locator('.world-viewport canvas').first()
    await canvas.click({ button: 'right', position: { x: 400, y: 300 } })
    const setup = await page.evaluate(() => {
      const s = window.testSceneRef.current, w = s.world
      if (w !== window.testStore.getWorld() || w.paused || w.inputMask || w.mode || w.selected.length)
        throw Error('Playable unselected current world required')
      const oldSpeed = w.speed
      w.speed = 0
      const x = 12, z = 31, center = { x: (x * 256 + 2048) & 65535, y: (-z * 256 - 2048) & 65535, h: 0 }
      const cell = (center.y >>> 9) * 128 + (center.x >>> 9)
      if (w.land.flags[cell] & 0x400) throw Error('Supplied target cell contains building flag')
      // Supplied allocation, not a production allocation/casting claim. No cancellation/retirement mutation.
      const fx = { id: w.nextId++, x, z, kind: 'swamp', age: 0, duration: Infinity, height: 0,
        swamp: { center, tribe: w.manaWorld.playerTribe, counter: 1, remaining: 32000, kills: 0, variant: 0 } }
      w.effects.push(fx); s.focus(fx); s.onChange()
      window.__ownedSwampWitness = { scene: s, world: w, fx, oldSpeed, group: null }
      return { id: fx.id, cell, supplied: 'trap fields/nextId/speed0/focus; center h0', originalSpeed: oldSpeed }
    })
    stage('supplied-setup', setup)
    await page.waitForFunction(() => {
      const h = window.__ownedSwampWitness
      const group = h.scene.fxMeshes.get(h.fx.id)
      if (!group || !group.children.every(c => !c.material?.map || c.material.map.image?.complete)) return false
      h.group = group; return true
    })
    const capture = async name => {
      const file = `owned-swamp-${name}.png`, path = resolve(output, file)
      await page.screenshot({ path, timeout: 5000 })
      report.screenshots.push({ file, sha256: createHash('sha256').update(readFileSync(path)).digest('hex') }); save()
    }
    const point = await page.evaluate(() => {
      const h = window.__ownedSwampWitness, s = h.scene, p = s.screen(h.fx), r = s.renderer.domElement.getBoundingClientRect()
      const x = r.left + (p.x + 1) * r.width / 2, y = r.top + (1 - p.y) * r.height / 2
      if (document.elementFromPoint(x, y) !== s.renderer.domElement) throw Error('Trap point is not owned by canvas')
      const hit = s.pick({ clientX: x, clientY: y })
      if (!hit || Math.hypot(hit.x - h.fx.x, hit.z - h.fx.z) > 0.5) throw Error('Actual terrain pick misses supplied trap')
      return { x, y, hit }
    })
    assertLive(await page.evaluate(readWitness))
    const pixels = await page.evaluate(() => {
      const h = window.__ownedSwampWitness, s = h.scene, gl = s.renderer.getContext()
      const read = () => {
        s.view.painter.render(s.renderer, s.scene, s.camera)
        const bytes = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
        gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, bytes)
        return bytes
      }
      const before = read(), visible = h.group.visible
      let hidden
      try { h.group.visible = false; hidden = read() }
      finally { h.group.visible = visible; read() }
      let count = 0
      for (let i = 0; i < before.length; i += 4)
        if (before[i] !== hidden[i] || before[i + 1] !== hidden[i + 1] || before[i + 2] !== hidden[i + 2]) count++
      return count
    })
    stage('trap-pixel-contribution', { pixels, method: 'same-frame group visibility differential; no screenshot fabrication' })
    assert.ok(pixels > 20, 'Trap must visibly contribute actual renderer pixels')
    await capture('before')
    for (const modifiers of [[], ['Shift', 'Control'], ['Shift', 'Alt'], ['Shift', 'Meta']]) {
      for (const modifier of modifiers) await page.keyboard.down(modifier)
      try { await page.mouse.click(point.x, point.y, { button: 'right' }) }
      finally { for (const modifier of [...modifiers].reverse()) await page.keyboard.up(modifier) }
      const w = await page.evaluate(readWitness); assertLive(w); stage('live-control-' + (modifiers.join('-') || 'plain'), w)
    }
    await page.keyboard.down('Shift')
    try { await page.mouse.click(point.x, point.y, { button: 'right' }) }
    finally { await page.keyboard.up('Shift') }
    const cancelled = await page.evaluate(readWitness); assertCancelled(cancelled); stage('immediate-cancellation', cancelled)
    await page.evaluate(async () => {
      const h = window.__ownedSwampWitness, { advanceGame } = await window.__pndOwnedSwampFixtureReady
      h.world.speed = 1
      try { advanceGame(h.world, h.scene.gameClock, 1 / 12) } finally { h.world.speed = 0 }
    })
    await page.waitForFunction(() => {
      const h = window.__ownedSwampWitness
      return !h.world.effects.includes(h.fx) && !h.scene.fxMeshes.has(h.fx.id)
    })
    const retired = await page.evaluate(readWitness); assertRetired(retired); stage('logical-renderer-retirement', retired)
    await capture('after')
    assert.deepEqual(report.errors, [])
    assert.notEqual(report.timedOut, true)
    report.status = 'passed'
  } catch (error) { failure = error; report.errors.push(String(error)); report.status = 'failed'; save() }
  finally {
    clearTimeout(timer)
    if (page && failure) {
      try { await page.screenshot({ path: resolve(output, 'owned-swamp-failure.png'), timeout: 2000 }) }
      catch (e) { report.diagnosticError = String(e) }
    }
    report.contextClosed = await closeBounded()
    if (!report.contextClosed || report.errors.length || report.timedOut) report.status = 'failed'
    save()
  }
  assert.equal(report.status, 'passed', 'Owned Swamp episode failed; inspect retained receipt')
  return report
}
