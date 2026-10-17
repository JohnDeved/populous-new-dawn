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
