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
  value.frames[0].callbackCpuMs = 7
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
    value => { value.frames[0].otherCallbackCpuMs = 123 },
    value => { value.frames[0].sceneDrawCalls = 1.5 },
    value => { value.frames[0].sceneDrawCalls = -1 },
    value => { value.frames[0].pointerBreakdown.terrainPickCalls = 0.5 },
    value => { value.frames[0].pointerBreakdown.objectPickCalls = -1 },
    value => { value.frames[0].pointerBreakdown.objectCacheHits = 0.1 },
    value => { value.frames[1].timestampMs = 10 },
    value => { value.buildRevision = 'https://not-a-commit.example' },
    value => { value.session = { level: 256 } },
    value => { value.session = { level: 1.5 } },
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

test('accepts a production FpsGraph export contract fixture and exposes bounded provenance', async () => {
  // Generated with FpsGraph.exportRecentFrames source from commit 194e914b
  // from FramePerformance samples. Date/timeOrigin/userAgent normalized only.
  // Supplied environment and timings are contract data, not a gameplay benchmark.
  const { readFileSync } = await import('node:fs')
  const json = readFileSync(new URL('./fixtures/frame-performance-export-v1.json', import.meta.url), 'utf8')
  const result = analyzeFrameExport(json)
  assert.equal(result.sampleCount, 2)
  assert.equal(result.capturedSpanMs, 34)
  assert.equal(result.level, 2)
  assert.equal(result.buildRevision, 'unknown')
  assert.equal(result.topCpuPhases[0].phase, 'pointerTooltipCpuMs')
  const value = report()
  value.buildRevision = '91a68d9e6add75b11caee0d04d83cc51d0520c56'
  value.session = { level: 2, ignoredPrivateField: 'do not copy' }
  const withProvenance = summarize(value)
  assert.equal(withProvenance.buildRevision, value.buildRevision)
  assert.equal(withProvenance.level, 2)
  assert.ok(!JSON.stringify(withProvenance).includes('do not copy'))
})

test('accepts small floating-point residual roundoff without concealing signed values', () => {
  const value = report()
  value.frames[0].otherCallbackCpuMs += 1e-10
  assert.doesNotThrow(() => summarize(value))
  value.frames[0].otherCallbackCpuMs += 0.01
  assert.throws(() => summarize(value), /remainder/)
})


test('preserves the exporter dirty-build provenance suffix', () => {
  const value = report()
  value.buildRevision = '91a68d9e6add75b11caee0d04d83cc51d0520c56-dirty'
  assert.equal(summarize(value).buildRevision, value.buildRevision)
  for (const invalid of ['91a68d9e-dirty', value.buildRevision + '-extra', 'dirty']) {
    value.buildRevision = invalid
    assert.throws(() => summarize(value), /buildRevision/)
  }
})

test('reports separate strict RAF/callback budget counts and independent worst-frame rankings', () => {
  const value = report()
  let now = 0
  value.frames = [8.33, 16.67, 40, 10].map((rafIntervalMs, index) => {
    now += rafIntervalMs
    const callbackCpuMs = [8.33, 16.67, 2, 30][index]
    const pointerTooltipCpuMs = [0, 1, 0, 6][index]
    return {
      ...report().frames[0], timestampMs: now, rafIntervalMs, callbackCpuMs,
      pointerTooltipCpuMs, simulationCpuMs: 0, sceneRenderCpuMs: 0,
      otherCallbackCpuMs: callbackCpuMs - pointerTooltipCpuMs,
      state: index === 2 ? 'paused' : 'live',
    }
  })
  Object.assign(value.timing, { count: 4, endTimestampMs: now, capturedSpanMs: now })
  const result = summarize(value)
  assert.deepEqual(result.thresholdCounts, [
    { thresholdMs: 8.33, rafFramesAbove: 3, callbackFramesAbove: 2 },
    { thresholdMs: 16.67, rafFramesAbove: 1, callbackFramesAbove: 1 },
  ])
  assert.equal(result.worstFrames.raf[0].frameIndex, 2)
  assert.equal(result.worstFrames.raf[0].state, 'paused')
  assert.equal(result.worstFrames.callback[0].frameIndex, 3)
  assert.equal(result.worstFrames.pointer[0].frameIndex, 3)
  assert.deepEqual(result.spikeContexts.find(group => group.frameIndex === 0).frames.map(frame => frame.frameIndex), [0, 1, 2])
  assert.deepEqual(result.spikeContexts.find(group => group.frameIndex === 3).frames.map(frame => frame.frameIndex), [1, 2, 3])
  assert.ok(result.warnings.some(warning => warning.includes('not display-FPS guarantees')))
})

test('worst-frame evidence is bounded, tie-stable, whitelist-only and keeps nested phase values', () => {
  const value = report()
  value.frames = Array.from({ length: 30 }, (_, index) => ({
    ...report().frames[0], timestampMs: (index + 1) * 10,
    arbitraryPrivateContent: 'not exported',
    pointerBreakdown: { ...createPointerFrameMetrics(), objectPickMs: 4, objectUnitsMs: 2, arbitraryPrivateContent: 'not exported' },
  }))
  Object.assign(value.timing, { count: 30, endTimestampMs: 300, capturedSpanMs: 300 })
  const result = summarize(value)
  for (const ranking of Object.values(result.worstFrames)) {
    assert.equal(ranking.length, 10)
    assert.deepEqual(ranking.map(frame => frame.frameIndex), [0,1,2,3,4,5,6,7,8,9])
    assert.equal(ranking[0].pointerBreakdown.objectPickMs, 4)
    assert.equal(ranking[0].pointerBreakdown.objectUnitsMs, 2)
  }
  assert.equal(result.spikeContexts.length, 10)
  assert.equal(new Set(result.spikeContexts.map(group => group.frameIndex)).size, 10)
  assert.ok(result.spikeContexts.every(group => group.frames.length <= 5))
  assert.ok(!JSON.stringify(result).includes('not exported'))
  assert.ok(!JSON.stringify(result).includes('arbitraryPrivateContent'))
})

test('context selection retains CPU-only spikes even when RAF gaps occupy the top cadence ranking', () => {
  const value = report()
  let now = 0
  value.frames = Array.from({ length: 30 }, (_, index) => {
    const rafIntervalMs = index < 15 ? 100 - index : 10
    now += rafIntervalMs
    const pointerTooltipCpuMs = index === 29 ? 40 : 0
    const callbackCpuMs = index === 28 ? 60 : pointerTooltipCpuMs + 1
    return {
      ...report().frames[0], timestampMs: now, rafIntervalMs,
      callbackCpuMs, pointerTooltipCpuMs, simulationCpuMs: 0, sceneRenderCpuMs: 0,
      otherCallbackCpuMs: callbackCpuMs - pointerTooltipCpuMs, pointerBreakdown: null,
    }
  })
  Object.assign(value.timing, { count: 30, endTimestampMs: now, capturedSpanMs: now })
  const result = summarize(value)
  assert.deepEqual(result.spikeContexts.slice(0, 3).map(group => group.frameIndex), [0, 28, 29])
  assert.equal(result.spikeContexts.length, 10)
  assert.equal(result.worstFrames.pointer[0].pointerBreakdown, null)
})

test('optional versioned native diagnostics preserve old v1 and sanitize new evidence', () => {
  const old = summarize(report())
  assert.equal(old.worstFrames.pointer[0].pointerBreakdown.nativeOcclusion, undefined)
  const value = report(), native = createPointerFrameMetrics(true).nativeOcclusion
  native.cacheCold = 1
  native.projectedVertices = 24
  native.privateExtra = 'must not be copied'
  value.frames[0].pointerBreakdown.nativeOcclusion = native
  const result = summarize(value)
  const evidence = result.worstFrames.pointer.find(frame => frame.frameIndex === 0)
  assert.equal(evidence.pointerBreakdown.nativeOcclusion.projectedVertices, 24)
  assert.equal(evidence.pointerBreakdown.nativeOcclusion.privateExtra, undefined)
  for (const mutate of [
    n => { n.version = 2 }, n => { delete n.projectionMs },
    n => { n.projectedVertices = 0.5 }, n => { n.cacheHits = -1 },
    n => { n.triangleScanMs = null }, n => { n.submittedTriangles = Number.MAX_SAFE_INTEGER + 1 },
  ]) {
    const invalid = structuredClone(value)
    mutate(invalid.frames[0].pointerBreakdown.nativeOcclusion)
    assert.throws(() => summarize(invalid))
  }
})

test('full native and ordinary-detail ring remains within the existing 2 MiB JSON bound', async t => {
  const { FramePerformance } = await import('../app/frame-performance.ts')
  const { NATIVE_OCCLUSION_FIELDS } = await import('../app/native-occlusion-metrics.ts')
  const { ORDINARY_TERRAIN_FIELDS } = await import('../app/ordinary-terrain-metrics.ts')
  const samples = new FramePerformance(), metrics = createPointerFrameMetrics(true)
  // Long numeric representations, large finite durations and largest supported
  // counters are deliberately less compact than ordinary millisecond recordings.
  for (const key of Object.keys(metrics))
    if (key !== 'nativeOcclusion' && key !== 'ordinaryTerrain') metrics[key] = key.endsWith('Ms') ? 1234567.8901234567 : Number.MAX_SAFE_INTEGER
  for (const key of NATIVE_OCCLUSION_FIELDS)
    metrics.nativeOcclusion[key] = key.endsWith('Ms') ? 1234567.8901234567 : Number.MAX_SAFE_INTEGER
  for (const key of ORDINARY_TERRAIN_FIELDS)
    metrics.ordinaryTerrain[key] = key.endsWith('Ms') ? 1234567.8901234567 : Number.MAX_SAFE_INTEGER
  for (let i = 1; i <= 1200; i++)
    samples.sample(16.666666666666668, 1234567.8901234567, 1234567.8901234567,
      Number.MAX_SAFE_INTEGER, 4938281.560493827, 1234567.8901234567, i * 16.666666666666668, 'live', metrics)
  const value = report()
  value.frames = samples.recentFrames()
  const last = value.frames.at(-1)
  Object.assign(value.timing, { count: 1200, startTimestampMs: 0, endTimestampMs: last.timestampMs,
    capturedSpanMs: last.timestampMs })
  const json = JSON.stringify(value)
  const bytes = Buffer.byteLength(json, 'utf8')
  t.diagnostic(`${bytes} bytes for 1200 populated native and ordinary-detail frames`)
  assert.ok(bytes < 2 * 1024 * 1024)
  assert.equal(analyzeFrameExport(json).sampleCount, 1200)
})


test('optional ordinary terrain v1 accepts old captures and validates new nested detail', () => {
  assert.equal(summarize(report()).sampleCount, 3)
  const value = report()
  value.frames[0].pointerBreakdown.ordinaryTerrain = createPointerFrameMetrics(true).ordinaryTerrain
  value.frames[0].pointerBreakdown.ordinaryTerrain.visitedTriangles = 7
  const result = summarize(value)
  assert.ok(JSON.stringify(result).includes('"visitedTriangles":7'))
  for (const invalid of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1]) {
    value.frames[0].pointerBreakdown.ordinaryTerrain.visitedTriangles = invalid
    assert.throws(() => summarize(value), /visitedTriangles/)
  }
  value.frames[0].pointerBreakdown.ordinaryTerrain.visitedTriangles = 7
  value.frames[0].pointerBreakdown.ordinaryTerrain.version = 2
  assert.throws(() => summarize(value), /version/)
})
