import test from 'node:test'
import assert from 'node:assert/strict'
import { analyzeFrameExport } from '../app/frame-export-analysis.ts'
import { createPointerFrameMetrics } from '../app/pointer-frame-metrics.ts'

function report() {
  return {
    schema: 'populous-new-dawn/frame-performance', schemaVersion: 1,
    units: { durations: 'milliseconds', timestamps: 'milliseconds since performance.timeOrigin', counters: 'per frame' },
    timing: { timeOriginUnixMs: 1234, capacityFrames: 1200, count: 3, startTimestampMs: 0, endTimestampMs: 60, capturedSpanMs: 60 },
    frames: [10, 20, 30].map((raf, i) => ({
      timestampMs: [10, 30, 60][i], rafIntervalMs: raf,
      simulationCpuMs: 1, sceneRenderCpuMs: 2, sceneDrawCalls: 3,
      callbackCpuMs: i + 10, pointerTooltipCpuMs: 6, otherCallbackCpuMs: i + 1,
      state: 'live', pointerBreakdown: { ...createPointerFrameMetrics(), objectPickMs: i + 1, tooltipInputMs: 5 },
    })),
  }
}
const summarize = value => analyzeFrameExport(JSON.stringify(value))

test('ranks only disjoint callback stages and reports nearest-rank distributions and span', () => {
  const result = summarize(report())
  assert.equal(result.sampleCount, 3)
  assert.equal(result.capturedSpanMs, 60)
  assert.deepEqual(result.raf, { sampleCount: 3, mean: 20, p50: 20, p95: 30, max: 30 })
  assert.deepEqual(result.callback, { sampleCount: 3, mean: 11, p50: 11, p95: 12, max: 12 })
  assert.equal(result.topCpuPhases[0].phase, 'pointerTooltipCpuMs')
  assert.equal(result.topCpuPhases.length, 4)
  assert.equal(result.pointerPhases[0].phase, 'tooltipInputMs')
  assert.ok(result.warnings.some(warning => warning.includes('Do not sum')))
})

test('preserves signed residual and excludes unmeasured pointer frames from summaries', () => {
  const value = report()
  value.frames[0].otherCallbackCpuMs = -2
  value.frames[0].pointerBreakdown = null
  const result = summarize(value)
  assert.equal(result.pointerPhases[0].sampleCount, 2)
  assert.ok(result.warnings.some(warning => warning.includes('Negative callback residual')))
  assert.ok(result.warnings.some(warning => warning.includes('not zero-filled')))
  for (const frame of value.frames) frame.pointerBreakdown = null
  assert.deepEqual(summarize(value).pointerPhases, [])
})

test('rejects unsupported schemas, units, invalid fields and inconsistent capture metadata', () => {
  for (const mutate of [
    value => { value.schema = 'other' },
    value => { value.schemaVersion = 2 },
    value => { value.units.durations = 'seconds' },
    value => { value.frames = [] },
    value => { value.timing.count = 2 },
    value => { value.timing.capacityFrames = 240 },
    value => { value.timing.capturedSpanMs = 59 },
    value => { value.frames[0].callbackCpuMs = null },
    value => { value.frames[0].pointerBreakdown.objectUnitsMs = -1 },
    value => { delete value.frames[0].pointerBreakdown },
    value => { value.frames[0].rafIntervalMs = 0 },
    value => { value.frames[1].timestampMs = 9 },
    value => { value.frames[0].state = 'unsupported' },
  ]) {
    const value = report()
    mutate(value)
    assert.throws(() => summarize(value), undefined, mutate.toString())
  }
  assert.throws(() => analyzeFrameExport('{'))
  assert.throws(() => analyzeFrameExport(' '.repeat(2 * 1024 * 1024 + 1)))
  assert.throws(() => analyzeFrameExport(JSON.stringify(report()).replace('"callbackCpuMs":10', '"callbackCpuMs":1e999')))
  assert.throws(() => analyzeFrameExport(JSON.stringify({ ...report(), environment: { devicePixelRatio: 42 } }).replace('"devicePixelRatio":42', '"devicePixelRatio":1e999')))
})

test('single-frame capture uses its RAF interval, not a zero timestamp difference', () => {
  const value = report()
  value.frames = value.frames.slice(0, 1)
  Object.assign(value.timing, { count: 1, endTimestampMs: 10, capturedSpanMs: 10 })
  const result = summarize(value)
  assert.equal(result.capturedSpanMs, 10)
  assert.equal(result.raf.p50, 10)
})
