import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createPointerFrameMetrics,
  measurePointerQuery,
  resetPointerFrameMetrics,
} from '../app/pointer-frame-metrics.ts'

test('pointer query metrics preserve return identity and count inclusive repeated queries', () => {
  const metrics = createPointerFrameMetrics(), result = { hit: 2 }
  let time = 0, calls = 0
  const clock = () => time
  assert.equal(measurePointerQuery(metrics, 'object', () => {
    calls++
    time += 2
    measurePointerQuery(metrics, 'terrain', () => { time += 5 }, clock)
    time += 3
    return result
  }, clock), result)
  assert.equal(calls, 1)
  assert.equal(metrics.objectPickMs, 10)
  assert.equal(metrics.terrainPickMs, 5)
  assert.equal(metrics.objectPickCalls, 1)
  assert.equal(metrics.terrainPickCalls, 1)
})

test('query errors propagate unchanged and metrics retain the attempted query', () => {
  const metrics = createPointerFrameMetrics(), error = new Error('query failed')
  let time = 0
  assert.throws(() => measurePointerQuery(metrics, 'terrain', () => {
    time = 3
    throw error
  }, () => time), candidate => candidate === error)
  assert.equal(metrics.terrainPickMs, 3)
  assert.equal(metrics.terrainPickCalls, 1)
})

test('reset clears every field without replacing fixed storage or affecting another scene', () => {
  const metrics = createPointerFrameMetrics(), other = createPointerFrameMetrics()
  for (const key of Object.keys(metrics)) metrics[key] = 42
  other.tooltipRenderMs = 9
  resetPointerFrameMetrics(metrics)
  assert.ok(Object.values(metrics).every(value => value === 0))
  assert.equal(other.tooltipRenderMs, 9)
})

test('actual pointer input preserves picking with diagnostics and skips clocks when disabled', async t => {
  const { tooltipCallerFixture } = await import('./support/tooltip-scene.mjs')
  const { scene, point } = await tooltipCallerFixture(t)
  const { updatePointerFrame, renderTooltip } = await import('../app/scene-input-runtime.ts')
  const metrics = createPointerFrameMetrics(true)
  const originalNow = performance.now
  let clockReads = 0
  Object.defineProperty(performance, 'now', { configurable: true, value: () => ++clockReads })
  t.after(() => Object.defineProperty(performance, 'now', { configurable: true, value: originalNow }))
  scene.pointerScreen = { ...point }
  scene.pointerState = ''
  scene.picking.lastKey = ''
  scene.picking.groundHits.clear()
  updatePointerFrame(scene, 100, metrics)
  const enabled = { hovered: scene.hoveredObject, picked: scene.tooltipInput.picked, cell: scene.tooltipInput.cell, route: scene.tooltipInput.route }
  assert.ok(metrics.objectPickCalls > 0)
  assert.ok(metrics.objectPickMs > 0)
  assert.ok(metrics.objectUnitsMs > 0)
  assert.ok(metrics.objectModelsMs > 0)
  assert.ok(metrics.objectCacheHits > 0, 'tooltip reuses the same-frame object pick')
  assert.ok(metrics.tooltipInputMs > 0)
  assert.ok(metrics.nativeOcclusion.pixelCacheMisses > 0)
  assert.ok(metrics.nativeOcclusion.submissionKeyMs > 0)
  scene.frame++
  scene.picking.lastKey = ''
  scene.picking.pick(point, metrics)
  assert.ok(metrics.nativeOcclusion.pixelCacheHits > 0)
  scene.pointerState = ''
  scene.picking.lastKey = ''
  clockReads = 0
  updatePointerFrame(scene, 100)
  assert.deepEqual({ hovered: scene.hoveredObject, picked: scene.tooltipInput.picked, cell: scene.tooltipInput.cell, route: scene.tooltipInput.route }, enabled)
  assert.equal(clockReads, 0, 'diagnostic-off pointer path performs no timing calls')
  scene.tooltip.draw = 0
  renderTooltip(scene)
  assert.equal(clockReads, 0, 'diagnostic-off tooltip paint performs no timing calls')
  renderTooltip(scene, metrics)
  assert.ok(metrics.tooltipRenderMs > 0, 'early-return hidden tooltip is still timed')
})

test('held-selection drag forwards metrics for ground and person queries with unchanged results', async t => {
  const { tooltipCallerFixture } = await import('./support/tooltip-scene.mjs')
  const { scene, point } = await tooltipCallerFixture(t)
  const { updatePointerFrame, updateDrag, pickUnit } = await import('../app/scene-input-runtime.ts')
  // Bind the production runtime functions as the scene facade does; the fixture
  // ordinarily disables drag rendering as unrelated to tooltip acceptance.
  scene.updateDrag = (event, metrics) => updateDrag(scene, event, metrics)
  scene.pickUnit = (event, metrics) => pickUnit(scene, event, metrics)
  scene.pointerScreen = { ...point }
  scene.pointerButtons = 1
  scene.world.mode = ''
  scene.down = { unit: -999 }
  let groundCalls = 0, personCalls = 0
  scene.pick = () => { groundCalls++; return null }
  const original = scene.picking.pickPerson.bind(scene.picking)
  scene.picking.pickPerson = (event, metrics) => { personCalls++; return original(event, metrics) }
  const run = metrics => {
    scene.pointerState = ''
    scene.picking.lastKey = ''
    scene.drag = { start: { x: 0, y: 0 }, end: { x: 0, y: 0 }, active: false }
    updatePointerFrame(scene, 100, metrics)
    return { active: scene.drag.active, visible: scene.selectionOverlay.visible }
  }
  const metrics = createPointerFrameMetrics()
  const enabled = run(metrics)
  assert.equal(personCalls, 1)
  assert.ok(groundCalls >= 1)
  assert.equal(metrics.terrainPickCalls, groundCalls)
  assert.ok(metrics.objectPickCalls >= personCalls)
  const disabled = run()
  assert.deepEqual(disabled, enabled)
  assert.equal(personCalls, 2)
})

test('native diagnostics are opt-in and reset fixed nested storage', () => {
  assert.equal(createPointerFrameMetrics().nativeOcclusion, undefined)
  const metrics = createPointerFrameMetrics(true), native = metrics.nativeOcclusion
  native.cacheCold = 2
  native.projectionMs = 7
  resetPointerFrameMetrics(metrics)
  assert.strictEqual(metrics.nativeOcclusion, native)
  assert.equal(native.version, 1)
  assert.equal(native.cacheCold, 0)
  assert.equal(native.projectionMs, 0)
})
