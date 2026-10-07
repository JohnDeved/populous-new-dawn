// One ordinary Mission1 startup, using the existing sandbox/profile/cleanup harness.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame, showAllMissions, waitForShamanReadiness } from '../browser-game.mjs'

export default async function startupBurst({ page, output, signal, receipt }) {
  const report = { status: 'running', method: 'Public Mission1 and Skip; ordinary elapsed RAF, passive actual-render PNGs. No injected world, seed, effect, speed or frame clock.' }
  let armed = false
  const save = () => writeFileSync(resolve(output, 'startup-burst.json'), JSON.stringify(report, null, 2) + '\n')
  const retainFrames = async () => {
    const observed = await page.evaluate(() => window.startupBurstFrames.read())
    for (const [label, frame] of Object.entries(observed.frames)) {
      const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(frame.png)
      assert.ok(match, 'Actual-render readback must be a PNG')
      const name = `mission-1-startup-${label}.png`
      writeFileSync(resolve(output, name), Buffer.from(match[1], 'base64'))
      frame.png = name
    }
    report.observation = observed
  }
  try {
    signal.throwIfAborted()
    // openMission also delivers Skip and waits for input readiness; install first
    // so the transient burst remains observable on slow or fast render schedules.
    await showAllMissions(page)
    await page.getByRole('button', { name: 'Mission 1', exact: true }).focus()
    await page.keyboard.press('Enter')
    await bindGame(page)
    report.initial = await page.evaluate(async () => {
      const scene = window.testSceneRef.current, world = scene.world
      if (world.outcome.level !== 1 || world.turn >= 30 || world.speed !== 1 || world.paused)
        throw new Error('Ordinary Mission1 startup has already passed the bounded before-frame window')
      const { observeStartupBurstFrames } = await import('/scripts/local-render/startup-burst-observer.mjs')
      const gl = scene.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
      const initial = { turn: world.turn, speed: world.speed, viewport: [innerWidth, innerHeight], dpr: devicePixelRatio,
        canvas: [gl.drawingBufferWidth, gl.drawingBufferHeight], webglVersion: gl.getParameter(gl.VERSION),
        renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), contextLost: gl.isContextLost() }
      window.startupBurstFrames = observeStartupBurstFrames(scene)
      return initial
    })
    armed = true
    save()
    assert.equal(report.initial.contextLost, false)
    await page.waitForFunction(() => window.startupBurstFrames.status().before, undefined, { timeout: 10000 })
    await page.locator('.skip-introduction').click({ noWaitAfter: true })
    await page.waitForFunction(() => {
      const observed = window.startupBurstFrames.status()
      if (observed.errors.length) throw new Error(observed.errors.join('\n'))
      return observed.before && observed.burst && observed.after
    }, undefined, { timeout: 60000, polling: 50 })
    report.readiness = await waitForShamanReadiness(page, { timeout: 10000 })
    signal.throwIfAborted()
    await retainFrames()
    assert.deepEqual(report.observation.errors, [])
    assert.ok(report.observation.records.every(row => row.speed === 1 && !row.paused))
    assert.deepEqual(receipt.errors, [])
    report.status = 'passed'
    report.limits = 'Ordinary startup rendering/phase consistency only. Native angle evidence is separate and uses declared original birth origins; existing root-height clamp difference remains. Software rendering is not hardware performance or original raster equality.'
    return report
  } catch (error) {
    report.status = 'failed'
    report.failure = String(error.stack ?? error)
    throw error
  } finally {
    if (armed && !report.observation) {
      try { await retainFrames() } catch (error) { report.readbackFailure = String(error) }
    }
    try {
      if (armed) await page.evaluate(() => { window.startupBurstFrames.close(); delete window.startupBurstFrames })
    } catch (error) {
      report.cleanupFailure = String(error)
      if (report.status === 'passed') { report.status = 'failed'; throw error }
    } finally { save() }
  }
}
