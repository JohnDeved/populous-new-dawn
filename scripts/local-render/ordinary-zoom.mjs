import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { installOrdinaryZoomWitness } from './ordinary-zoom-witness.mjs'

export function assertOrdinaryZoomEvidence(evidence) {
  assert.deepEqual(evidence.errors, [])
  assert.equal(evidence.cleanupError, null)
  assert.equal(evidence.closed, true)
  assert.deepEqual(evidence.cases.map(phase => phase.name), ['out', 'reversal', 'combined'])
  for (const phase of evidence.cases) assert.ok(phase.before && phase.started && phase.done, `Incomplete ${phase.name}`)
  assert.equal(evidence.cases[1].reversal?.fractional, true, 'Fractional reversal missed; no retry or forced fraction')
  assert.equal(evidence.cases[2].moving, true, 'No natural combined pan/rotation/zoom frame')
  const keys = evidence.records.filter(row => row.kind === 'keyboard')
  assert.deepEqual(keys.map(row => [row.type, row.key]), [
    ['keydown', '-'], ['keyup', '-'], ['keydown', '='], ['keyup', '='],
    ['keydown', '-'], ['keyup', '-'], ['keydown', '='], ['keyup', '='],
    ['keydown', 'w'], ['keydown', 'q'], ['keydown', '-'], ['keyup', '-'], ['keyup', 'q'], ['keyup', 'w'],
  ])
  for (const row of keys) {
    assert.ok(row.trusted && !row.repeat && row.after, 'Keyboard delivery missing trusted before/after boundary')
    assert.ok(Object.values(row.modifiers).every(value => !value), 'Unexpected keyboard modifier')
    if (row.type === 'keydown' && ['-', '='].includes(row.key)) assert.ok(row.defaultPrevented, 'Zoom input was not consumed')
  }
  for (const name of ['out-before', 'out-early', 'out-middle', 'out-late', 'out-endpoint',
    'reversal-before', 'reversal-outgoing', 'reversal-reversed', 'reversal-endpoint',
    'combined-before', 'combined-moving', 'combined-endpoint']) assert.ok(evidence.frames[name], `Natural frame missing: ${name}`)
  assert.ok(evidence.records.length <= 512 && Object.keys(evidence.frames).length <= 12)
}

// Invoked by the existing owned local-render harness. No Scene/World mutations,
// clock control, forced drawing, synthetic dispatch or private picking queries.
export default async function ordinaryZoom({ page, openMission, output, signal, receipt }) {
  const report = { status: 'running', method: 'One ordinary M1 opening; actual delivered keyboard and natural render-return observation.',
    limits: 'Sampled current-port visual evidence only. Readback perturbs scheduling. No pointer-picking proof, native raster/timing equivalence, hardware FPS or performance nonregression.' }
  let installed = false, failure
  const save = () => writeFileSync(resolve(output, 'ordinary-zoom.json'), JSON.stringify(report, null, 2) + '\n')
  const wait = condition => page.waitForFunction(condition => {
    const status = window.ordinaryZoom.status()
    if (status.errors.length) throw Error(status.errors.join('\n'))
    return !!status.phase?.[condition]
  }, condition, { polling: 25, timeout: 5000 })
  const key = async value => { signal.throwIfAborted(); await page.keyboard.press(value); signal.throwIfAborted() }
  const arm = async name => { await page.evaluate(name => window.ordinaryZoom.arm(name), name); await wait('before') }
  const settle = () => page.waitForFunction(() => {
    const scene = window.testSceneRef.current
    return !scene.world.inputMask && !scene.viewTransition && !scene.cameraMotion.active && !scene.resultCamera.active && !(scene.world.flyby.flags & 1)
  }, undefined, { polling: 25, timeout: 5000 })
  try {
    await openMission(1); await settle(); signal.throwIfAborted()
    report.entry = await page.evaluate(() => {
      const scene = window.testSceneRef.current, world = scene.world, gl = scene.renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info')
      if (world !== window.testStore.getWorld() || world.outcome.level !== 1 || world.speed !== 1 || world.paused ||
        scene.viewPreset !== 0 || scene.overviewActive || document.querySelector('.loading-world,dialog[open]')) throw Error('Ordinary M1 opening unavailable')
      return { level: 1, turn: world.turn, viewport: [innerWidth, innerHeight], dpr: devicePixelRatio,
        canvas: [gl.drawingBufferWidth, gl.drawingBufferHeight], renderer: gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) }
    })
    const canvas = await page.locator('.world-viewport canvas[data-engine]').boundingBox()
    assert.ok(canvas); await page.mouse.move(canvas.x + canvas.width / 2, canvas.y + canvas.height / 2)
    await page.evaluate(installOrdinaryZoomWitness)
    installed = true
    await arm('out'); await key('-'); await wait('done')
    await key('='); await settle()
    await arm('reversal'); await key('-'); await wait('fractionSeen'); await key('='); await wait('done')
    assert.equal((await page.evaluate(() => window.ordinaryZoom.status())).phase.reversal?.fractional, true,
      'Fractional reversal missed; stop without retry')
    await arm('combined')
    await page.keyboard.down('w'); await page.keyboard.down('q'); await key('-'); await wait('moving')
    await page.keyboard.up('q'); await page.keyboard.up('w'); await wait('done')
    signal.throwIfAborted()
    report.status = 'observed'
  } catch (error) {
    failure = error; report.status = 'failed'; report.failure = String(error.stack ?? error)
  } finally {
    // These releases are delivered input, never direct mutation of Scene.keys.
    // Do not add duplicate keyup receipts on the successful route.
    if (report.status !== 'observed') for (const key of ['q', 'w']) {
      try { await page.keyboard.up(key) } catch (error) { report.releaseFailure = String(error) }
    }
    if (installed) {
      try {
        report.observation = await page.evaluate(() => {
          const witness = window.ordinaryZoom
          let cleanupError = null
          try { witness.close() } catch (error) { cleanupError = String(error.stack ?? error) }
          const observation = { ...witness.read(), cleanupError }
          delete window.ordinaryZoom
          return observation
        })
        for (const [name, frame] of Object.entries(report.observation.frames)) {
          const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(frame.png)
          assert.ok(match, 'Natural render capture must be PNG')
          writeFileSync(resolve(output, `${name}.png`), Buffer.from(match[1], 'base64')); frame.png = `${name}.png`
        }
        if (report.status === 'observed') { assertOrdinaryZoomEvidence(report.observation); assert.deepEqual(receipt.errors, []); report.status = 'passed' }
      } catch (error) { failure ??= error; report.status = 'failed'; report.captureFailure = String(error.stack ?? error) }
    }
    save()
  }
  if (failure) throw failure
  return report
}
