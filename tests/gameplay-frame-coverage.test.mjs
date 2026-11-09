import assert from 'node:assert/strict'
import test from 'node:test'
import { createPointerFrameMetrics } from '../app/pointer-frame-metrics.ts'
import { gameplayFramePlan, summarizeGameplayPhase } from '../scripts/tutorial-browser/gameplay-frame-evidence.mjs'

const revision = 'a'.repeat(40)

function fixture(intervals, duration = 1600) {
  const frames = intervals.map(([start, end]) => {
    const pointerBreakdown = createPointerFrameMetrics(true)
    Object.assign(pointerBreakdown.interaction, { route: 'world', pointerMoved: true })
    pointerBreakdown.terrainPickCalls = 1
    pointerBreakdown.objectPickCalls = 1
    pointerBreakdown.nativeOcclusion.submittedTriangles = 1
    pointerBreakdown.ordinaryTerrain.visitedTriangles = 1
    return { timestampMs: end, rafIntervalMs: end - start,
      simulationCpuMs: 1, sceneRenderCpuMs: 1, sceneDrawCalls: 1,
      callbackCpuMs: 4, pointerTooltipCpuMs: 0, otherCallbackCpuMs: 2,
      pointerBreakdown, state: 'live' }
  })
  const before = { timestampMs: 0, timeOriginUnixMs: 10000, level: 2, turn: 1,
    paused: false, inputMask: 0, speed: 1, sameScene: true,
    camera: { x: 0, y: 0, angle: 0 }, viewport: gameplayFramePlan.viewport, visibility: 'visible' }
  const after = { ...before, timestampMs: duration, turn: 2 }
  const report = { schema: 'populous-new-dawn/frame-performance', schemaVersion: 1,
    buildRevision: revision,
    units: { durations: 'milliseconds', timestamps: 'milliseconds since performance.timeOrigin', counters: 'per frame' },
    session: { level: 2 },
    environment: { viewportCssPixels: gameplayFramePlan.viewport, devicePixelRatio: 1, visibility: 'visible' },
    timing: { timeOriginUnixMs: 10000, capacityFrames: 1200, count: frames.length,
      startTimestampMs: intervals[0][0], endTimestampMs: intervals.at(-1)[1],
      capturedSpanMs: intervals.at(-1)[1] - intervals[0][0] }, frames }
  return { report, before, after }
}

function summarize({ report, before, after }) {
  return summarizeGameplayPhase(JSON.stringify(report), gameplayFramePlan.phases[0], before, after, revision)
}

function spaced(length, step = 200) {
  return Array.from({ length: 8 }, (_, index) => [(index + 1) * step - length, (index + 1) * step])
}

test('eight sparse complete intervals do not turn their envelope into measured coverage', () => {
  const value = fixture(spaced(1)), original = JSON.stringify(value)
  assert.throws(() => summarize(value), /cover at least 75%/)
  assert.equal(JSON.stringify(value), original)
})

test('continuous accepted intervals preserve full coverage and envelope metadata', () => {
  const summary = summarize(fixture(spaced(200)))
  assert.equal(summary.coveredSpanMs, 1600)
  assert.equal(summary.coveredIntervalMs, 1600)
  assert.equal(summary.analysis.sampleCount, 8)
})

test('gapped captures at exactly 75 percent pass without counting their gaps', () => {
  const summary = summarize(fixture(spaced(150)))
  assert.equal(summary.coveredSpanMs, 1550)
  assert.equal(summary.coveredIntervalMs, 1200)
})

test('gapped captures below 75 percent fail despite a long envelope', () => {
  assert.throws(() => summarize(fixture(spaced(149.875))), /cover at least 75%/)
})

test('overlapping clusters cannot count the same time twice to fill a gap', () => {
  const intervals = [200, 210, 220, 230, 1370, 1380, 1390, 1400].map(end => [end - 200, end])
  // Summed interval lengths are 1600 ms and the envelope is 1400 ms,
  // but the two disjoint cluster unions contain only 460 ms.
  assert.throws(() => summarize(fixture(intervals)), /cover at least 75%/)
})

test('nested and overlapping starts are merged independently of timestamp ordering', () => {
  const intervals = [[0, 1000], [900, 1100], [100, 1200], [1300, 1400],
    [1350, 1450], [1400, 1500], [1450, 1550], [1500, 1600]]
  const value = fixture(intervals), original = JSON.stringify(value)
  const summary = summarize(value)
  assert.equal(summary.coveredSpanMs, 1600)
  assert.equal(summary.coveredIntervalMs, 1500)
  assert.deepEqual(summary.selectedRawFrameIndices, [0, 1, 2, 3, 4, 5, 6, 7])
  assert.equal(JSON.stringify(value), original)
})

test('boundary-straddling intervals cannot rescue sparse complete in-phase coverage', () => {
  const intervals = [[-100, 100], ...spaced(1), [1600, 1700]]
  assert.throws(() => summarize(fixture(intervals)), /cover at least 75%/)
})

test('coverage uses the full observed duration and preserves raw retention provenance', () => {
  const value = fixture(spaced(1125, 1500), 12000)
  value.report.retention = { availableFrames: 10, droppedOldestFrames: 2, reason: 'serialized-size-limit' }
  const original = JSON.stringify(value), summary = summarize(value)
  assert.equal(summary.coveredIntervalMs, 9000)
  assert.equal(summary.coveredSpanMs, 11625)
  assert.deepEqual(summary.rawAnalysis.retention, value.report.retention)
  assert.equal(summary.analysis.retention, undefined)
  assert.equal(JSON.stringify(value), original)
  value.after.timestampMs++
  assert.throws(() => summarize(value), /cover at least 75%/)
})
