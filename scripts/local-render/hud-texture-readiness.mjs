import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// Bounded asset-readiness smoke only. The harness owns browser/server cleanup and
// the terminal outcome. No image, module, world, storage, or clock state is faked.
export default async function ({ page, openMission, root, output, receipt, signal }) {
  const helperPath = resolve(root, 'scripts/hud-texture-readiness.mjs'),
    { waitForHudTexture } = await import(pathToFileURL(helperPath).href),
    hash = path => createHash('sha256').update(readFileSync(path)).digest('hex'),
    report = {
      scenarioSha256: hash(new URL(import.meta.url)),
      helperSha256: hash(helperPath),
      method: 'Ordinary Mission 1 startup, repeated HUD reads, then full-page reload and ordinary startup again. Actual page.evaluate, module import, and HTMLImageElement.',
      limits: 'Asset-readiness smoke, not the full historical building/worship routes, pixel parity, gameplay completion, or hardware performance. False-to-true is claimed only if actually observed.',
      documents: [],
    },
    save = () => writeFileSync(resolve(output, 'hud-texture-readiness.json'), JSON.stringify(report, null, 2) + '\n')
  save()
  for (const name of ['initial', 'reloaded']) {
    signal.throwIfAborted()
    if (name === 'reloaded') {
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.getByRole('dialog', { name: 'Start game', exact: true }).waitFor({ state: 'visible' })
    }
    const timeOrigin = await page.evaluate(() => performance.timeOrigin)
    if (name === 'reloaded') assert.notEqual(timeOrigin, report.documents[0].timeOrigin, 'Reload must replace the document')
    const document = { name, timeOrigin, gates: [] }
    report.documents.push(document)
    save()
    await openMission(1)
    for (const [phase, timeout] of [['startup', 30000], ['repeated', 20000]]) {
      signal.throwIfAborted()
      const gate = { phase, timeout, samples: [] }, started = performance.now()
      document.gates.push(gate)
      save()
      // Record actual returned observations without substituting the predicate,
      // import, image, or clock. The maintained helper still owns all polling.
      const ready = await waitForHudTexture({
        async evaluate(observe) {
          signal.throwIfAborted()
          const value = await page.evaluate(observe)
          gate.samples.push({ ready: value, elapsedMs: performance.now() - started })
          save()
          return value
        },
        async waitForTimeout(ms) {
          signal.throwIfAborted()
          await page.waitForTimeout(ms)
        },
      }, { timeout })
      assert.equal(ready, true)
      gate.elapsedMs = performance.now() - started
      gate.observedFalseToTrue = gate.samples.some(sample => sample.ready === false)
      save()
    }
    document.state = await page.evaluate(() => {
      const scene = window.testSceneRef.current, gl = scene.renderer.getContext(),
        debug = gl.getExtension('WEBGL_debug_renderer_info')
      return {
        level: scene.world.outcome.level,
        status: scene.world.status,
        attachedCanvas: scene.renderer.domElement.isConnected,
        contextLost: gl.isContextLost(),
        webglVersion: gl.getParameter(gl.VERSION),
        renderer: gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
      }
    })
    assert.equal(document.state.level, 1)
    assert.equal(document.state.status, 'playing')
    assert.equal(document.state.attachedCanvas, true)
    assert.equal(document.state.contextLost, false)
    assert.ok(document.state.webglVersion.startsWith('WebGL 2.0'))
    save()
  }
  assert.deepEqual(receipt.errors, [])
  return report
}
