import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import vm from 'node:vm'
import { FramePerformance, RECENT_FRAME_CAPACITY } from '../app/frame-performance.ts'
import { validSceneUpdateMetrics } from '../app/scene-update-metrics.ts'

const sample = (ring, metrics, gpu) => ring.sample(10, 1, 2, 3, 20, 4, undefined, 'live', undefined, undefined, undefined, gpu, metrics)
test('optional CPU regions snapshot by value, retain GPU identity and clear across ring/reset', () => {
  const ring = new FramePerformance(), metrics = { terrainCpuMs: 2, waterCpuMs: 3, hudCpuMs: 4 }
  const token = ring.reserveGpuFrame()
  assert.equal(sample(ring, metrics, { token, timing: { status: 'pending' } }), false)
  assert.deepEqual(ring.recentFrames()[0].sceneRenderGpu, { status: 'pending' })
  metrics.waterCpuMs = 999
  assert.deepEqual(ring.recentFrames()[0].sceneUpdateCpu, { terrainCpuMs: 2, waterCpuMs: 3, hudCpuMs: 4 })
  assert.equal(ring.completeGpuFrame(token, { status: 'available', milliseconds: 1 }), true)
  assert.deepEqual(ring.recentFrames()[0].sceneRenderGpu, { status: 'available', milliseconds: 1 })
  assert.equal(ring.recentFrames()[0].otherCallbackCpuMs, 13)
  for (let i = 0; i < RECENT_FRAME_CAPACITY; i++) sample(ring)
  assert.ok(ring.recentFrames().every(frame => frame.sceneUpdateCpu === undefined))
  ring.reset(); sample(ring, { terrainCpuMs: 0, waterCpuMs: 0, hudCpuMs: 0 })
  assert.deepEqual(ring.recentFrames()[0].sceneUpdateCpu, { terrainCpuMs: 0, waterCpuMs: 0, hudCpuMs: 0 })
})
test('malformed CPU regions reject the frame; missing is not zero', () => {
  for (const value of [null, {}, [], { terrainCpuMs: -1, waterCpuMs: 0, hudCpuMs: 0 }, { terrainCpuMs: 0, waterCpuMs: Infinity, hudCpuMs: 0 }]) {
    assert.equal(validSceneUpdateMetrics(value), false)
    const ring = new FramePerformance(); sample(ring, value); assert.equal(ring.recentFrames().length, 0)
  }
  const ring = new FramePerformance(); sample(ring); assert.equal(ring.recentFrames()[0].sceneUpdateCpu, undefined)
})
test('actual complete environment caller times only water, leaves disabled path clock-free and preserves errors', () => {
  const source = readFileSync(new URL('../app/scene-camera-runtime.ts', import.meta.url), 'utf8')
  const start = source.indexOf('export function updateEnvironmentFrame('), end = source.indexOf('\nexport function updateView(', start)
  let clock = 0, reads = 0, waterCalls = 0, skyCalls = 0
  const run = vm.runInNewContext(stripTypeScriptTypes(`(${source.slice(start, end).replace('export function', 'function')})`), {
    performance: { now() { reads++; return clock } }, defeatSky: () => null, skyPalette: { colors: [] },
  })
  const scene = { ground: {}, globe: {}, scene: {}, world: { outcome: {} }, view: { config: { horizon: 1 } }, container: { clientWidth: 100, clientHeight: 100 }, skyFlash: {},
    updateWater() { waterCalls++; clock += 4 }, updateSky() { skyCalls++; clock += 7 } }
  run(scene, 0)
  assert.equal(reads, 0)
  const metrics = { terrainCpuMs: 0, waterCpuMs: 0, hudCpuMs: 0 }
  run(scene, 0, undefined, metrics)
  assert.equal(reads, 2); assert.equal(metrics.waterCpuMs, 4)
  assert.equal(waterCalls, 2); assert.equal(skyCalls, 2)
  const error = Error('water failed'); scene.updateWater = () => { throw error }
  assert.throws(() => run(scene, 0, undefined, metrics), error)
  assert.equal(skyCalls, 2)
})
