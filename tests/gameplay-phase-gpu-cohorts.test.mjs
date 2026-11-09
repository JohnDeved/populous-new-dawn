import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import { createPointerFrameMetrics } from '../app/pointer-frame-metrics.ts'
import { summarizeFrameExportCohorts } from '../app/frame-export-cohorts.ts'
import { gameplayFramePlan as plan, summarizeGameplayPhase } from '../scripts/tutorial-browser/gameplay-frame-evidence.mjs'

const revision = 'a'.repeat(40)
const statuses = ['available', 'pending', 'unsupported', 'disjoint', 'context-lost', 'busy', 'failed', 'missing']
const counts = { missing: 1, pending: 1, available: 1, unsupported: 1, disjoint: 1, 'context-lost': 1, busy: 1, failed: 1 }
const group = (summary, name) => summary.cohorts.find(row => row.name === name)

function fixture({ length = 200, route = 'world', camera = false, missing = false } = {}) {
  const makeFrame = (start, end, status, index) => {
    const pointer = createPointerFrameMetrics(true)
    Object.assign(pointer.interaction, { route, pointerMoved: index % 2 === 0, viewChanged: camera || index < 3 })
    pointer.terrainPickCalls = 1; pointer.objectPickCalls = 1
    pointer.nativeOcclusion.submittedTriangles = 1; pointer.ordinaryTerrain.visitedTriangles = 1
    return { timestampMs: end, rafIntervalMs: end - start, simulationCpuMs: 1,
      sceneRenderCpuMs: 1, sceneDrawCalls: 1, callbackCpuMs: 4,
      pointerTooltipCpuMs: 0, otherCallbackCpuMs: 2, pointerBreakdown: pointer, state: 'live',
      ...(status === 'missing' ? {} : { sceneRenderGpu: { status, ...(status === 'available' ? { milliseconds: 0 } : {}) } }) }
  }
  const selected = statuses.map((status, index) => makeFrame(400 + index * 200 - length, 400 + index * 200, missing ? 'missing' : status, index))
  const boundary = [makeFrame(0, 200, 'available', 0), makeFrame(1800, 2000, 'available', 1)]
  boundary[0].sceneRenderGpu.milliseconds = 900; boundary[1].sceneRenderGpu.milliseconds = 800
  boundary[0].state = 'paused'; boundary[1].state = 'menu'
  const frames = [boundary[0], ...selected, boundary[1]]
  const before = { timestampMs: 200, timeOriginUnixMs: 10000, level: 2, turn: 1,
    paused: false, inputMask: 0, speed: 1, sameScene: true,
    camera: { x: 0, y: 0, angle: 0 }, viewport: plan.viewport, visibility: 'visible' }
  const after = { ...before, timestampMs: 1800, turn: 2,
    camera: camera ? { x: 1, y: 1, angle: 1 } : before.camera }
  const raw = { schema: 'populous-new-dawn/frame-performance', schemaVersion: 1, buildRevision: revision,
    units: { durations: 'milliseconds', timestamps: 'milliseconds since performance.timeOrigin', counters: 'per frame' },
    session: { level: 2 }, environment: { viewportCssPixels: plan.viewport, devicePixelRatio: 1, visibility: 'visible' },
    timing: { timeOriginUnixMs: 10000, capacityFrames: 1200, count: frames.length,
      startTimestampMs: 0, endTimestampMs: 2000, capturedSpanMs: 2000 },
    retention: { availableFrames: 12, droppedOldestFrames: 2, reason: 'serialized-size-limit' }, frames }
  return { raw, before, after }
}

const summarize = (value, phase = plan.phases[0]) => summarizeGameplayPhase(JSON.stringify(value.raw), phase, value.before, value.after, revision)

function assertStatusPartitions(summary) {
  for (const cohort of summary.cohorts.cohorts) {
    assert.equal(Object.values(cohort.gpuStatusCounts).reduce((sum, count) => sum + count, 0), cohort.sampleCount)
    assert.equal(cohort.gpuStatusCounts.available, cohort.metrics['sceneRenderGpu.milliseconds'].sampleCount)
  }
}

test('phase caller scopes GPU statuses to accepted intervals and preserves raw provenance', () => {
  const value = fixture(), original = JSON.stringify(value), rawJson = JSON.stringify(value.raw)
  const summary = summarize(value), rawSummary = summarizeFrameExportCohorts(rawJson)
  assert.equal(summary.coveredIntervalMs, 1600)
  assert.equal(summary.coveredSpanMs, 1600)
  assert.equal(summary.rawFrameCount, 10)
  assert.equal(summary.rawAnalysis.sampleCount, 10)
  assert.equal(summary.analysis.sampleCount, 8)
  assert.deepEqual(summary.selectedRawFrameIndices, [1, 2, 3, 4, 5, 6, 7, 8])
  assert.deepEqual(group(summary.cohorts, 'all').gpuStatusCounts, counts)
  assert.equal(group(rawSummary, 'all').gpuStatusCounts.available, 3)
  assert.equal(group(rawSummary, 'all').metrics['sceneRenderGpu.milliseconds'].max, 900)
  assert.deepEqual(group(summary.cohorts, 'all').metrics['sceneRenderGpu.milliseconds'], { unit: 'milliseconds', sampleCount: 1, p50: 0, p95: 0, p99: 0, max: 0 })
  assert.deepEqual(summary.rawAnalysis.retention, value.raw.retention)
  assert.equal(summary.analysis.retention, undefined)
  assert.equal(summary.rawSha256, createHash('sha256').update(rawJson).digest('hex'))
  assert.equal(summary.work.nativeTriangles, 8)
  assertStatusPartitions(summary)
  assert.equal(JSON.stringify(value), original)
})

test('overlapping phase cohorts keep status populations separate rather than additive', () => {
  const summary = summarize(fixture())
  assert.equal(summary.cohorts.groupsOverlap, true)
  assert.equal(group(summary.cohorts, 'worldPointerMoving').gpuStatusCounts.available, 1)
  assert.equal(group(summary.cohorts, 'cameraChanged').gpuStatusCounts.available, 1)
  assert.equal(group(summary.cohorts, 'all').gpuStatusCounts.available, 1)
  assert.equal(group(summary.cohorts, 'worldPointerStationary').gpuStatusCounts.pending, 1)
  assert.equal(group(summary.cohorts, 'worldPointerStationary').gpuStatusCounts.missing, 1)
  assert.equal(group(summary.cohorts, 'hud').sampleCount, 0)
  assertStatusPartitions(summary)
})

test('75-percent interval threshold does not change GPU status sample counts', () => {
  const value = fixture({ length: 150 }), summary = summarize(value)
  assert.equal(summary.coveredIntervalMs, 1200)
  assert.equal(summary.coveredSpanMs, 1550)
  assert.deepEqual(group(summary.cohorts, 'all').gpuStatusCounts, counts)
  assertStatusPartitions(summary)
})

test('available GPU timing cannot make sparse RAF coverage pass', () => {
  const value = fixture({ length: 1 })
  for (const frame of value.raw.frames) frame.sceneRenderGpu = { status: 'available', milliseconds: 0 }
  assert.throws(() => summarize(value), /cover at least 75%/)
})

test('boundary-frame GPU measurements cannot rescue just-below-threshold coverage', () => {
  assert.throws(() => summarize(fixture({ length: 149.875 })), /cover at least 75%/)
})

test('missing GPU data stays unknown when valid RAF coverage passes', () => {
  const summary = summarize(fixture({ missing: true }))
  assert.equal(summary.coveredIntervalMs, 1600)
  assert.deepEqual(group(summary.cohorts, 'all').gpuStatusCounts, { missing: 8, pending: 0, available: 0, unsupported: 0, disjoint: 0, 'context-lost': 0, busy: 0, failed: 0 })
  assert.deepEqual(group(summary.cohorts, 'all').metrics['sceneRenderGpu.milliseconds'], { unit: 'milliseconds', sampleCount: 0, p50: null, p95: null, p99: null, max: null })
  assertStatusPartitions(summary)
})

test('malformed GPU fields outside the selected phase still fail raw validation', () => {
  for (const invalid of [{ status: 'available' }, { status: 'pending', milliseconds: 0 }, { status: 'unknown' }]) {
    const value = fixture(); value.raw.frames[0].sceneRenderGpu = invalid
    assert.throws(() => summarize(value), /sceneRenderGpu/)
  }
})

for (const [name, options, phase] of [['HUD', { route: 'hud' }, plan.phases[2]], ['camera', { camera: true }, plan.phases[1]]]) {
  test(`${name} phase preserves route/work requirements and scoped GPU counts`, () => {
    const summary = summarize(fixture(options), phase)
    assert.equal(summary.coveredIntervalMs, 1600)
    assert.deepEqual(group(summary.cohorts, 'all').gpuStatusCounts, counts)
    assert.equal(name === 'HUD' ? summary.work.hudFrames : summary.work.cameraChangedFrames, 8)
    assertStatusPartitions(summary)
  })
}

test('GPU observations do not weaken build or ring-retention admission', () => {
  const wrongBuild = fixture(); wrongBuild.raw.buildRevision = 'b'.repeat(40)
  assert.throws(() => summarize(wrongBuild), /actual build/)
  const overwritten = fixture(); overwritten.raw.retention.availableFrames = 1200; overwritten.raw.retention.droppedOldestFrames = 1190
  assert.throws(() => summarize(overwritten), /overwrite/)
})
