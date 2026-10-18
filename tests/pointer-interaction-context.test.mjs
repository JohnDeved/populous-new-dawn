import assert from 'node:assert/strict'
import test from 'node:test'
import { createPointerFrameMetrics, resetPointerFrameMetrics } from '../app/pointer-frame-metrics.ts'
import { capturePointerInteraction } from '../app/pointer-interaction-context.ts'
import { FramePerformance, RECENT_FRAME_CAPACITY } from '../app/frame-performance.ts'

test('interaction snapshots are bounded, omit coordinates, and separate view from simulation changes', () => {
  const context = createPointerFrameMetrics(true).interaction, recording = {}, inputs = Array(20).fill(0)
  capturePointerInteraction(context, recording, { clientX: 10, clientY: 20 }, inputs, 'world')
  assert.equal(context.pointerMoved, null)
  assert.equal(context.viewChanged, null)
  inputs[3]++ // simulation turn invalidates queries but is not camera motion
  capturePointerInteraction(context, recording, { clientX: 10, clientY: 20 }, inputs, 'world')
  assert.equal(context.pointerMoved, false)
  assert.equal(context.viewChanged, false)
  inputs[10]++
  capturePointerInteraction(context, recording, { clientX: 11, clientY: 20 }, inputs, 'unmapped-hud')
  assert.equal(context.pointerMoved, true)
  assert.equal(context.viewChanged, true)
  assert.equal(context.route, 'hud')
  capturePointerInteraction(context, {}, { clientX: 11, clientY: 20 }, inputs, 'outside')
  assert.equal(context.pointerMoved, null, 'new F8 graph resets comparison baseline')
  assert.equal(context.viewChanged, null)
  capturePointerInteraction(context, recording, null, inputs, undefined)
  assert.equal(context.pointerMoved, null)
  assert.equal(context.route, 'unknown')
  assert.deepEqual(Object.keys(context).sort(), ['version', 'route', 'pointerMoved', 'viewChanged', 'dragQuery', 'placementQuery', 'sharedTerrain'].sort())
})

test('fixed ring preserves optional context through wrap, reset and old captures', () => {
  const samples = new FramePerformance(), metrics = createPointerFrameMetrics(true)
  for (let i = 0; i < RECENT_FRAME_CAPACITY + 3; i++) {
    resetPointerFrameMetrics(metrics)
    metrics.interaction.route = i % 2 ? 'hud' : 'world'
    metrics.interaction.pointerMoved = i % 3 === 0 ? null : !!(i % 2)
    metrics.interaction.viewChanged = !!(i % 2)
    metrics.interaction.sharedTerrain = true
    samples.sample(10, 0, 0, 0, 1, 1, (i + 1) * 10, 'live', metrics)
  }
  const frames = samples.recentFrames()
  assert.equal(frames.length, RECENT_FRAME_CAPACITY)
  assert.equal(frames[0].timestampMs, 40)
  assert.equal(frames[0].pointerBreakdown.interaction.route, 'hud')
  assert.equal(frames[0].pointerBreakdown.interaction.pointerMoved, null)
  resetPointerFrameMetrics(metrics)
  assert.equal(frames.at(-1).pointerBreakdown.interaction.sharedTerrain, true)
  frames[0].pointerBreakdown.interaction.route = 'unknown'
  assert.equal(samples.recentFrames()[0].pointerBreakdown.interaction.route, 'hud')
  samples.sample(10, 0, 0, 0, 1, 1, 13000, 'live', createPointerFrameMetrics())
  assert.equal(samples.recentFrames().at(-1).pointerBreakdown.interaction, undefined)
  for (const invalid of [null, { ...metrics.interaction, version: 2 }, { ...metrics.interaction, pointerMoved: 1 }]) {
    const count = samples.recentFrames().length
    const timestamp = samples.recentFrames().at(-1).timestampMs
    metrics.interaction = invalid
    samples.sample(10, 0, 0, 0, 1, 1, 14000, 'live', metrics)
    assert.equal(samples.recentFrames().length, count)
    assert.equal(samples.recentFrames().at(-1).timestampMs, timestamp)
  }
  samples.reset()
  assert.deepEqual(samples.recentFrames(), [])
})

test('real pointer caller publishes movement, routed HUD/world and actual sharing without disabled clocks', async t => {
  const { tooltipCallerFixture } = await import('./support/tooltip-scene.mjs')
  const { scene, point, hut } = await tooltipCallerFixture(t)
  const { GameScene } = await import('../app/scene.ts')
  const { updatePointerFrame, pointerMove } = await import('../app/scene-input-runtime.ts')
  const metrics = createPointerFrameMetrics(true)
  scene.navigationPointer = null
  scene.pointerScreen = { ...point }
  scene.pointerState = ''
  scene.picking.pick = () => null
  scene.pick = () => null
  const sample = () => {
    resetPointerFrameMetrics(metrics)
    updatePointerFrame(scene, 100, metrics)
    return { ...metrics.interaction }
  }
  assert.equal(sample().route, 'world')
  assert.equal(sample().pointerMoved, false)
  pointerMove(scene, { ...point, clientX: point.clientX + 1, buttons: 0 })
  assert.equal(sample().pointerMoved, true)
  scene.cameraBearing += 0.1
  assert.equal(sample().viewChanged, true)
  scene.world.turn++
  assert.equal(sample().viewChanged, false)
  const documentObject = document, originalHit = documentObject.elementFromPoint
  t.after(() => { documentObject.elementFromPoint = originalHit })
  document.elementFromPoint = () => ({ closest: selector => selector === 'aside' ? {} : null })
  assert.equal(sample().route, 'hud')
  document.elementFromPoint = () => null
  scene.pointerScreen = null
  assert.equal(sample().route, 'outside')
  scene.pointerScreen = { ...point }
  scene.pointerState = ''
  scene.pointerButtons = 1
  scene.world.mode = ''
  scene.down = { unit: undefined }
  scene.drag = { start: { x: 512, y: 0 }, end: { x: 512, y: 0 }, active: false }
  scene.updateDrag = GameScene.prototype.updateDrag.bind(scene)
  const drag = sample()
  assert.equal(drag.dragQuery, true, 'a terrain miss still executes the drag query')
  assert.equal(drag.sharedTerrain, true, 'tooltip consumes the shared miss')
  scene.pointerButtons = 0
  scene.world.mode = 'hut'
  scene.pointerState = ''
  scene.pick = () => hut
  const placement = sample()
  assert.equal(placement.placementQuery, true)
  assert.equal(placement.sharedTerrain, true)
  // Even with a different view and pointer, disabled diagnostics must not touch
  // the metric object or read a clock; game/tooltip behavior remains unchanged.
  const before = structuredClone(metrics.interaction), tooltip = structuredClone(scene.tooltipInput)
  const originalNow = performance.now
  Object.defineProperty(performance, 'now', { configurable: true, value: () => { throw new Error('unexpected timer') } })
  t.after(() => Object.defineProperty(performance, 'now', { configurable: true, value: originalNow }))
  scene.pointerState = ''
  updatePointerFrame(scene, 100)
  assert.deepEqual(scene.tooltipInput, tooltip)
  assert.deepEqual(metrics.interaction, before)
})
