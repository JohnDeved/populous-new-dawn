import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const nativeTimers = ['submissionKeyMs', 'projectionMs', 'triangleScanMs']
const nativeCounters = ['pixelCacheHits', 'pixelCacheMisses', 'cacheCold',
  'cachePositionChanged', 'cacheKeyChanged', 'cacheHits', 'projectedVertices', 'submittedTriangles']

// Inspect actual downloaded bytes. Quantized zero times are valid; use counters for work.
export function assertNativeFrameExport(frames) {
  const measured = frames.filter(frame => frame.pointerBreakdown !== null)
  assert.ok(measured.length > 0, 'export contains pointer diagnostics')
  const totals = Object.fromEntries(nativeCounters.map(key => [key, 0]))
  let nativeWorkFrames = 0
  for (const frame of measured) {
    const native = frame.pointerBreakdown.nativeOcclusion
    assert.ok(native && typeof native === 'object', 'actual export includes native diagnostics')
    assert.equal(native.version, 1)
    for (const key of nativeTimers)
      assert.ok(Number.isFinite(native[key]) && native[key] >= 0, `finite nonnegative ${key}`)
    for (const key of nativeCounters) {
      assert.ok(Number.isSafeInteger(native[key]) && native[key] >= 0, `safe counter ${key}`)
      totals[key] += native[key]
    }
    if (native.submittedTriangles > 0) nativeWorkFrames++
  }
  return { measuredFrames: measured.length, nativeWorkFrames, counters: totals }
}

// Reuse the existing paused M2 scene and its deadline. No new navigation, world,
// profiler, startup, timer window or simulation-state injection.
export async function checkFrameExport({ page, output, keyboard }) {
  const button = page.getByRole('button', { name: 'Export recent frames', exact: true })
  await button.waitFor({ state: 'visible' })
  await page.waitForFunction(() => window.testSceneRef.current.fpsGraph.samples.count > 0)
  const snapshot = () => page.evaluate(() => {
    const scene = window.testSceneRef.current
    return { turn: scene.world.turn, paused: scene.world.paused, selected: [...scene.world.selected],
      camera: { ...scene.cameraPosition }, mode: scene.world.mode }
  })
  // Settle pre-existing edge input before comparing the export action itself.
  await button.hover()
  if (keyboard) await button.focus()
  await page.waitForFunction(() => {
    const scene = window.testSceneRef.current
    return scene.navigationPointer === null && scene.cameraPreviewButtons === null && scene.keys.size === 0 &&
      Object.values(scene.cameraVelocity).every(value => value === 0)
  })
  const before = await snapshot()
  await page.evaluate(() => {
    window.frameExportInputs = []
    window.frameExportInputListener = event => window.frameExportInputs.push(event.type)
    for (const type of ['pointerdown', 'pointerup', 'click', 'keydown', 'keyup'])
      window.addEventListener(type, window.frameExportInputListener)
  })
  let summary
  try {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      keyboard ? page.keyboard.press('Space') : button.click(),
    ])
    assert.match(download.suggestedFilename(), /^populous-frames-.*\.json$/)
    const report = JSON.parse(readFileSync(await download.path(), 'utf8'))
    assert.equal(report.schema, 'populous-new-dawn/frame-performance')
    assert.equal(report.schemaVersion, 1)
    assert.equal(report.session.level, 2)
    assert.match(report.buildRevision, /^(?:[0-9a-f]{40}(?:-dirty)?|unknown)$/)
    assert.ok(report.frames.length > 0 && report.frames.length <= 1200)
    assert.equal(report.frames.length, report.timing.count)
    assert.ok(report.timing.capturedSpanMs > 0)
    assert.ok(report.frames.every(frame => Number.isFinite(frame.pointerTooltipCpuMs)))
    assert.ok(report.frames.some(frame => frame.pointerBreakdown !== null))
    const nativeDiagnostics = assertNativeFrameExport(report.frames)
    assert.ok(nativeDiagnostics.nativeWorkFrames > 0,
      'existing M2 pointer/camera inputs must export actual native triangle work')
    assert.deepEqual(await page.evaluate(() => window.frameExportInputs), [], 'export inputs must not bubble into gameplay')
    assert.deepEqual(await snapshot(), before, 'export preserves paused simulation, selection, camera and command mode')
    const bounds = await button.evaluate(el => {
      const r = el.getBoundingClientRect()
      const status = document.querySelector('[data-metric="export-status"]').getBoundingClientRect()
      return { buttonFits: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
        statusFits: status.bottom <= innerHeight, hit: el.contains(document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2)) }
    })
    assert.equal(bounds.buttonFits, true)
    assert.equal(bounds.statusFits, true)
    assert.equal(bounds.hit, true)
    const filename = keyboard ? 'm2-frame-export-keyboard.json' : 'm2-frame-export-pointer.json'
    await download.saveAs(resolve(output, filename))
    summary = { filename, keyboard, frameCount: report.frames.length, capturedSpanMs: report.timing.capturedSpanMs,
      buildRevision: report.buildRevision, viewport: report.environment.viewportCssPixels, bounds, nativeDiagnostics }
  } finally {
    await page.evaluate(() => {
      for (const type of ['pointerdown', 'pointerup', 'click', 'keydown', 'keyup'])
        window.removeEventListener(type, window.frameExportInputListener)
      document.activeElement?.blur()
    })
  }
  return summary
}
