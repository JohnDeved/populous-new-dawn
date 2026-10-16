import assert from 'node:assert/strict'
import test from 'node:test'
import { FramePerformance } from '../app/frame-performance.ts'

test('frame telemetry computes time-weighted cadence and per-frame CPU/call means at four Hz', () => {
  const sample = new FramePerformance()
  for (let i = 0; i < 24; i++) assert.equal(sample.sample(10, 2, 3, 100), false)
  assert.equal(sample.sample(10, 4, 8, 200), true)
  assert.equal(sample.fps, 100)
  assert.equal(sample.frameMs, 10)
  assert.equal(sample.simulationMs, 52 / 25)
  assert.equal(sample.renderMs, 80 / 25)
  assert.equal(sample.drawCalls, 2600 / 25)
  assert.equal(sample.elapsed, 0)
  assert.equal(sample.frames, 0)
})

test('a slow frame remains visible and affects cadence rather than being clamped away', () => {
  const sample = new FramePerformance()
  for (let i = 0; i < 10; i++) sample.sample(10, 1, 2, 3)
  assert.equal(sample.sample(150, 1, 2, 3), true)
  assert.equal(sample.fps, 44)
  assert.equal(sample.frameMs, 250 / 11)
  assert.equal(sample.frame(10), 150)
  assert.equal(Math.max(...Array.from({ length: sample.count }, (_, i) => sample.frame(i))), 150)
})

test('history is one fixed 240-frame chronological ring and reset exposes no old window', () => {
  const sample = new FramePerformance(), storage = sample.history
  for (let i = 1; i <= 601; i++) sample.sample(i, 1, 2, 3)
  assert.equal(sample.history, storage)
  assert.equal(sample.history.length, 240)
  assert.equal(sample.count, 240)
  assert.equal(sample.frame(0), 362)
  assert.equal(sample.frame(239), 601)
  sample.reset()
  assert.equal(sample.history, storage)
  for (const field of ['count', 'cursor', 'elapsed', 'frames', 'fps', 'frameMs', 'simulationMs', 'renderMs', 'drawCalls']) assert.equal(sample[field], 0, field)
  sample.sample(16, 1, 2, 3)
  assert.equal(sample.count, 1)
  assert.equal(sample.frame(0), 16)
})

test('invalid or nonpositive frame intervals cannot poison telemetry', () => {
  const sample = new FramePerformance()
  for (const interval of [0, -1, NaN, Infinity, -Infinity]) assert.equal(sample.sample(interval, 1, 2, 3), false)
  assert.equal(sample.count, 0)
  assert.equal(sample.sample(250, 1, 2, 3), true)
  assert.equal(sample.fps, 4)
})

import { readHardwareInfo, readHeapEstimate } from '../app/performance-hardware.ts'

test('hardware hints use the supplied live context and explicit approximate units', () => {
  const calls = [], gl = { RENDERER: 1, getExtension(name) { calls.push(name); return { UNMASKED_RENDERER_WEBGL: 2 } }, getParameter(name) { calls.push(name); return '  Test renderer  ' } }
  assert.deepEqual(readHardwareInfo(gl, { hardwareConcurrency: 12, deviceMemory: 8 }), { renderer: 'Test renderer', cores: '12', memory: '~8 GiB' })
  assert.deepEqual(calls, ['WEBGL_debug_renderer_info', 2])
  assert.equal(readHeapEstimate({ memory: { usedJSHeapSize: 1572864 } }), '~2 MiB')
  assert.equal(readHeapEstimate({ memory: { usedJSHeapSize: 0 } }), '~0 MiB')
})

test('unsupported or privacy-restricted telemetry never fabricates hardware numbers', () => {
  const unsupported = { getExtension: () => null, getParameter: () => null }
  assert.deepEqual(readHardwareInfo(unsupported, {}), { renderer: 'Unavailable', cores: 'Unavailable', memory: 'Unavailable' })
  const denied = { getExtension() { throw Error('privacy') } }, navigator = { get hardwareConcurrency() { throw Error('privacy') }, get deviceMemory() { throw Error('privacy') } }
  assert.deepEqual(readHardwareInfo(denied, navigator), { renderer: 'Unavailable', cores: 'Unavailable', memory: 'Unavailable' })
  assert.equal(readHeapEstimate({ get memory() { throw Error('privacy') } }), 'Unavailable')
  assert.equal(readHeapEstimate({ memory: { get usedJSHeapSize() { throw Error('privacy') } } }), 'Unavailable')
  assert.equal(readHeapEstimate({}), 'Unavailable')
  for (const value of [NaN, Infinity, -1]) {
    const info = readHardwareInfo(unsupported, { hardwareConcurrency: value, deviceMemory: value })
    assert.equal(info.cores, 'Unavailable'); assert.equal(info.memory, 'Unavailable')
    assert.equal(readHeapEstimate({ memory: { usedJSHeapSize: value } }), 'Unavailable')
  }
  const masked = { RENDERER: 5, getExtension: () => null, getParameter: name => name === 5 ? 'WebKit WebGL' : null }
  assert.equal(readHardwareInfo(masked, {}).renderer, 'WebKit WebGL')
})
