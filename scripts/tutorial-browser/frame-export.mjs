import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
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

// Read one rendered person target, not a synthetic picker invocation. The public
// pointer event still has to traverse ordinary gameplay picking and frame export.
export function m2NativePointerTarget() {
  const scene = window.testSceneRef.current, canvas = scene.renderer.domElement
  const rect = canvas.getBoundingClientRect()
  let examined = 0
  for (const [id, group] of scene.unitMeshes) {
    if (++examined > 128) break
    if (!group.visible || group.userData.pickable === false) continue
    const layer = group.userData.layers?.findLast(piece => piece.visible)
    if (!layer || !scene.view.painter.source(layer)) continue
    const bounds = scene.picking.personBounds(id, rect)
    if (!bounds || bounds.width < 2 || bounds.height < 2) continue
    const x = rect.left + Math.floor(bounds.x + bounds.width / 2)
    const y = rect.top + Math.floor(bounds.y + bounds.height / 2)
    if (x <= rect.left || y <= rect.top || x >= rect.right || y >= rect.bottom) continue
    if (document.elementFromPoint(x, y) !== canvas) continue
    return { x, y, id, examined }
  }
  return null
}

// These snapshots preserve the original read ordering around the one real
// export action. Only the already-existing passive private observer is installed.
export function beginFrameExportObservation() {
  const scene = window.testSceneRef.current
  const state = { turn: scene.world.turn, paused: scene.world.paused, selected: [...scene.world.selected],
    camera: { ...scene.cameraPosition }, mode: scene.world.mode }
  window.frameExportInputs = []
  window.frameExportInputListener = event => window.frameExportInputs.push(event.type)
  for (const type of ['pointerdown', 'pointerup', 'click', 'keydown', 'keyup'])
    window.addEventListener(type, window.frameExportInputListener)
  return state
}

export function readFrameExportObservation(button) {
  const scene = window.testSceneRef.current
  const state = { turn: scene.world.turn, paused: scene.world.paused, selected: [...scene.world.selected],
    camera: { ...scene.cameraPosition }, mode: scene.world.mode }
  const r = button.getBoundingClientRect()
  const status = document.querySelector('[data-metric="export-status"]').getBoundingClientRect()
  return { inputs: window.frameExportInputs, state,
    bounds: { buttonFits: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
      statusFits: status.bottom <= innerHeight,
      hit: button.contains(document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2)) } }
}

export function assertFrameExportObservation(before, after) {
  assert.deepEqual(after.inputs, [], 'export inputs must not bubble into gameplay')
  assert.deepEqual(after.state, before, 'export preserves paused simulation, selection, camera and command mode')
  assert.equal(after.bounds.buttonFits, true)
  assert.equal(after.bounds.statusFits, true)
  assert.equal(after.bounds.hit, true)
}

// Reuse the existing paused M2 scene and its deadline. No new navigation, world,
// profiler, startup, timer window or simulation-state injection.
export async function checkFrameExport({ page, output, keyboard }) {
  const button = page.getByRole('button', { name: 'Export recent frames', exact: true })
  await button.waitFor({ state: 'visible' })
  await page.waitForFunction(() => window.testSceneRef.current.fpsGraph.samples.count > 0)
  // Settle pre-existing edge input before comparing the export action itself.
  await button.hover()
  if (keyboard) await button.focus()
  await page.waitForFunction(() => {
    const scene = window.testSceneRef.current
    return scene.navigationPointer === null && scene.cameraPreviewButtons === null && scene.keys.size === 0 &&
      Object.values(scene.cameraVelocity).every(value => value === 0)
  })
  const before = await page.evaluate(beginFrameExportObservation)
  let summary
  try {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      keyboard ? page.keyboard.press('Space') : button.click(),
    ])
    assert.match(download.suggestedFilename(), /^populous-frames-.*\.json$/)
    const filename = keyboard ? 'm2-frame-export-keyboard.json' : 'm2-frame-export-pointer.json'
    // Preserve the actual hosted download even when a later assertion fails.
    await download.saveAs(resolve(output, filename))
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
    writeFileSync(resolve(output, filename.replace('.json', '-native-summary.json')),
      JSON.stringify({ frameCount: report.frames.length, nativeDiagnostics }, null, 2))
    assert.ok(nativeDiagnostics.nativeWorkFrames > 0,
      'existing M2 pointer/camera inputs must export actual native triangle work')
    const after = await button.evaluate(readFrameExportObservation)
    assertFrameExportObservation(before, after)
    const { bounds } = after
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
