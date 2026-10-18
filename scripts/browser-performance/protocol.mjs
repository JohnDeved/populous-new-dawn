// Shared only by trusted harness/reporter code. Artifact input cannot add metrics,
// labels, templates, URLs, executable paths or additional comparison policies.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

export const repository = 'JohnDeved/populous-new-dawn'
export const shards = Object.freeze({ world: ['world-hover', 'camera-world'], recovery: ['hud', 'world-recovery', 'menu-recovery'] })
export const order = Object.freeze(['base', 'head', 'head', 'base', 'base', 'head'])
export const metrics = Object.freeze({
  simulation: ['simulationCpuMs'], render: ['sceneRenderCpuMs'], pointer: ['pointerTooltipCpuMs'],
  callback: ['callbackCpuMs'], raf: ['rafIntervalMs'],
  terrainPick: ['pointerBreakdown', 'terrainPickMs'], objectPick: ['pointerBreakdown', 'objectPickMs'],
  model: ['pointerBreakdown', 'objectModelsMs'], nativeOcclusion: ['pointerBreakdown', 'objectOcclusionMs'],
  ordinaryVisibility: ['pointerBreakdown', 'ordinaryTerrain', 'visibilityMs'],
  ordinaryProjection: ['pointerBreakdown', 'ordinaryTerrain', 'projectionMs'],
  ordinaryTriangles: ['pointerBreakdown', 'ordinaryTerrain', 'triangleScanMs'],
  nativeKey: ['pointerBreakdown', 'nativeOcclusion', 'submissionKeyMs'],
  nativeProjection: ['pointerBreakdown', 'nativeOcclusion', 'projectionMs'],
  nativeTriangles: ['pointerBreakdown', 'nativeOcclusion', 'triangleScanMs'],
})
export const workMetrics = Object.freeze({
  drawCalls: ['sceneDrawCalls'], terrainCalls: ['pointerBreakdown', 'terrainPickCalls'],
  objectCalls: ['pointerBreakdown', 'objectPickCalls'],
  ordinaryVertices: ['pointerBreakdown', 'ordinaryTerrain', 'projectedVertices'],
  ordinaryTriangles: ['pointerBreakdown', 'ordinaryTerrain', 'visitedTriangles'],
  nativeVertices: ['pointerBreakdown', 'nativeOcclusion', 'projectedVertices'],
  nativeTriangles: ['pointerBreakdown', 'nativeOcclusion', 'submittedTriangles'],
  modelBuilds: ['pointerBreakdown', 'modelWork', 0], modelFaces: ['pointerBreakdown', 'modelWork', 1],
  moving: ['pointerBreakdown', 'interaction', 'pointerMoved'],
  cameraChanged: ['pointerBreakdown', 'interaction', 'viewChanged'],
})
export const queryCounters = Object.freeze(Object.fromEntries(Object.keys(metrics).map(key => [key,
  ['terrainPick', 'ordinaryVisibility', 'ordinaryProjection', 'ordinaryTriangles'].includes(key) ? 'terrainPickCalls'
    : ['objectPick', 'model', 'nativeOcclusion', 'nativeKey', 'nativeProjection', 'nativeTriangles'].includes(key) ? 'objectPickCalls' : null])))
export const policy = Object.freeze({ pairs: 3, minimumFrames: 8, minimumCoverage: 0.75,
  workTolerance: 0.2, durationTolerance: 0.1, baselineSpread: 0.15,
  minimumEffect: 0.05, absoluteFloorMs: 0.1, noiseMultiplier: 2 })
export const maxReportBytes = 512 * 1024
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
export const protocolHash = plan => sha256(JSON.stringify({ version: 1, plan, shards, order, metrics, workMetrics, queryCounters, policy }))
export const metricLabels = Object.freeze({ simulation: 'Simulation CPU', render: 'Render submission CPU', pointer: 'Pointer CPU',
  callback: 'Callback CPU (includes stages)', raf: 'RAF interval (not FPS)', terrainPick: 'Terrain pick CPU', objectPick: 'Object pick CPU',
  model: 'Model pick CPU', nativeOcclusion: 'Native occlusion CPU', ordinaryVisibility: 'Ordinary visibility CPU',
  ordinaryProjection: 'Ordinary projection CPU', ordinaryTriangles: 'Ordinary triangle scan CPU', nativeKey: 'Native key CPU',
  nativeProjection: 'Native projection CPU', nativeTriangles: 'Native triangle scan CPU' })

export function statistics(values) {
  if (!values.length || values.some(value => typeof value !== 'number' || !Number.isFinite(value) || value < 0)) return null
  const sorted = [...values].sort((a, b) => a - b)
  return { n: values.length, mean: values.reduce((a, b) => a + b, 0) / values.length,
    p50: sorted[Math.ceil(values.length * 0.5) - 1], p95: sorted[Math.ceil(values.length * 0.95) - 1], max: sorted.at(-1) }
}
const valueAt = (frame, path) => path.reduce((value, key) => value?.[key], frame)
export function summarizeMetrics(frames, paths) {
  return Object.fromEntries(Object.entries(paths).map(([key, path]) => {
    const values = frames.map(frame => valueAt(frame, path)).map(value => typeof value === 'boolean' ? Number(value) : value)
    // A metric is unknown if any selected frame omits it. Never zero-fill.
    return [key, statistics(values)]
  }))
}

export function summarizeTimings(frames) {
  return Object.fromEntries(Object.entries(metrics).map(([key, path]) => {
    const values = frames.map(frame => valueAt(frame, path)), all = statistics(values)
    if (!all) return [key, { all: null, nonzero: null, perQuery: null }]
    const counter = queryCounters[key]
    const calls = counter ? frames.map(frame => frame.pointerBreakdown?.[counter]) : null
    const perQuery = calls && calls.every(value => Number.isSafeInteger(value) && value >= 0)
      ? statistics(values.flatMap((value, index) => calls[index] > 0 ? [value / calls[index]] : [])) : null
    return [key, { all, nonzero: statistics(values.filter(value => value > 0)), perQuery }]
  }))
}

function keys(value, expected) {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), 'Expected object')
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort(), 'Unexpected or missing fields')
}
function number(value, maximum = 1e9, integer = false) {
  assert.ok(typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= maximum && (!integer || Number.isSafeInteger(value)), 'Invalid bounded number')
}
const hash = (value, length) => assert.ok(typeof value === 'string' && new RegExp(`^[a-f0-9]{${length}}$`).test(value), 'Invalid digest')
export function validateIdentity(identity) {
  keys(identity, ['repository', 'prNumber', 'headSha', 'baseSha', 'harnessSha', 'runId', 'runAttempt'])
  assert.equal(identity.repository, repository)
  for (const key of ['headSha', 'baseSha', 'harnessSha']) hash(identity[key], 40)
  assert.equal(identity.harnessSha, identity.baseSha, 'Both arms must use base harness')
  for (const key of ['prNumber', 'runId', 'runAttempt']) { number(identity[key], Number.MAX_SAFE_INTEGER, true); assert.ok(identity[key] > 0) }
}
function validateStats(value, frames, exact = true) {
  if (value === null) return
  keys(value, ['n', 'mean', 'p50', 'p95', 'max'])
  number(value.n, frames, true); assert.ok(value.n > 0); if (exact) assert.equal(value.n, frames)
  for (const key of ['mean', 'p50', 'p95', 'max']) number(value[key])
  assert.ok(value.p50 <= value.p95 && value.p95 <= value.max && value.mean <= value.max)
}
export function validateReport(report) {
  keys(report, ['version', 'identity', 'protocolSha256', 'runtimeSha256', 'shard', 'status', 'runs'])
  assert.equal(report.version, 1); validateIdentity(report.identity); hash(report.protocolSha256, 64)
  assert.ok(Object.hasOwn(shards, report.shard)); assert.ok(['complete', 'incomplete', 'incompatible-dependencies'].includes(report.status))
  if (report.runtimeSha256 !== null) hash(report.runtimeSha256, 64)
  assert.ok(Array.isArray(report.runs) && report.runs.length <= order.length)
  for (const [index, run] of report.runs.entries()) {
    keys(run, ['index', 'side', 'revision', 'status', 'environmentSha256', 'phases'])
    assert.equal(run.index, index); assert.equal(run.side, order[index]); assert.equal(run.revision, report.identity[`${run.side}Sha`])
    assert.ok(['complete', 'incomplete'].includes(run.status))
    if (run.environmentSha256 !== null) hash(run.environmentSha256, 64)
    assert.ok(Array.isArray(run.phases) && run.phases.length <= shards[report.shard].length)
    for (const [offset, phase] of run.phases.entries()) {
      keys(phase, ['name', 'frames', 'startTurn', 'endTurn', 'durationMs', 'coveredSpanMs', 'point', 'inputOffsetsMs', 'camera', 'metrics', 'work'])
      assert.equal(phase.name, shards[report.shard][offset]); number(phase.frames, 1200, true); assert.ok(phase.frames >= policy.minimumFrames)
      number(phase.startTurn, 1e8, true); number(phase.endTurn, 1e8, true); assert.ok(phase.endTurn > phase.startTurn)
      number(phase.durationMs, 180000); assert.ok(phase.durationMs >= 1600)
      number(phase.coveredSpanMs, phase.durationMs); assert.ok(phase.coveredSpanMs >= policy.minimumCoverage * phase.durationMs)
      keys(phase.point, ['x', 'y', 'id']); number(phase.point.x, 1440); number(phase.point.y, 1000)
      if (phase.point.id !== null) number(phase.point.id, 1e9, true)
      assert.ok(Array.isArray(phase.inputOffsetsMs) && phase.inputOffsetsMs.length <= 12)
      for (const offset of phase.inputOffsetsMs) number(offset, 180000)
      assert.ok(Array.isArray(phase.camera) && phase.camera.length === 6)
      for (const coordinate of phase.camera) assert.ok(typeof coordinate === 'number' && Number.isFinite(coordinate) && Math.abs(coordinate) <= 1e6)
      keys(phase.work, Object.keys(workMetrics))
      for (const stats of Object.values(phase.work)) validateStats(stats, phase.frames)
      keys(phase.metrics, Object.keys(metrics))
      for (const metric of Object.values(phase.metrics)) {
        keys(metric, ['all', 'nonzero', 'perQuery'])
        validateStats(metric.all, phase.frames); validateStats(metric.nonzero, phase.frames, false); validateStats(metric.perQuery, phase.frames, false)
        if (metric.all === null) assert.ok(metric.nonzero === null && metric.perQuery === null)
      }
    }
    if (run.status === 'complete') { assert.equal(run.phases.length, shards[report.shard].length); assert.notEqual(run.environmentSha256, null) }
  }
  if (report.status === 'complete') {
    assert.notEqual(report.runtimeSha256, null); assert.equal(report.runs.length, order.length)
    assert.ok(report.runs.every(run => run.status === 'complete'))
  }
  return report
}
export function parseReport(text) {
  assert.ok(typeof text === 'string' && Buffer.byteLength(text) <= maxReportBytes, 'Oversized report')
  return validateReport(JSON.parse(text))
}

const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
const spread = values => Math.max(...values) - Math.min(...values)
const differs = (a, b, tolerance, floor = 0) => Math.abs(a - b) > Math.max(floor, tolerance * Math.max(a, b))
export function comparableWork(phases) {
  const first = phases[0]
  if (!first || phases.length !== 6) return false
  for (const phase of phases.slice(1)) {
    if (differs(first.durationMs, phase.durationMs, policy.durationTolerance) ||
      Math.abs(first.startTurn - phase.startTurn) > 2 || Math.abs(first.endTurn - phase.endTurn) > 2 ||
      first.point.id !== phase.point.id || Math.abs(first.point.x - phase.point.x) > 6 || Math.abs(first.point.y - phase.point.y) > 6) return false
    if (phase.inputOffsetsMs.length !== first.inputOffsetsMs.length ||
      phase.inputOffsetsMs.some((value, index) => Math.abs(value - first.inputOffsetsMs[index]) > 150) ||
      phase.camera.some((value, index) => Math.abs(value - first.camera[index]) > (index % 3 === 2 ? 0.1 : 0.5))) return false
    // Query presence is an input guard. Internal projected/cache/model counts are
    // outcomes of the implementation and can legitimately fall after optimization.
    for (const key of ['terrainCalls', 'objectCalls']) {
      const a = first.work[key]?.mean, b = phase.work[key]?.mean
      if (a === undefined || b === undefined || (a > 0) !== (b > 0)) return false
    }
  }
  return true
}
export function classify(base, head) {
  if (base.length !== 3 || head.length !== 3 || [...base, ...head].some(value => value === null)) return { status: 'unknown' }
  const baseline = median(base), candidate = median(head), baselineRange = spread(base), candidateRange = spread(head)
  const deltas = base.map((value, index) => head[index] - value), delta = median(deltas)
  const effectFloor = Math.max(policy.absoluteFloorMs, policy.minimumEffect * baseline, policy.noiseMultiplier * baselineRange)
  const noisy = baselineRange > Math.max(policy.absoluteFloorMs, policy.baselineSpread * baseline) ||
    candidateRange > Math.max(policy.absoluteFloorMs, policy.baselineSpread * candidate)
  const status = noisy ? 'noisy' : Math.abs(delta) <= effectFloor ? 'within-noise' :
    deltas.every(value => value > effectFloor) ? 'possible-regression' :
    deltas.every(value => value < -effectFloor) ? 'possible-improvement' : 'inconclusive'
  return { status, baseline, candidate, delta, percent: baseline > 0 ? delta / baseline * 100 : null,
    baselineRange, candidateRange, deltaMin: Math.min(...deltas), deltaMax: Math.max(...deltas) }
}
export function compareReports(reports, expectedIdentity, expectedProtocol) {
  const byShard = new Map()
  for (const report of reports) {
    validateReport(report); assert.deepEqual(report.identity, expectedIdentity, 'Identity mismatch')
    assert.equal(report.protocolSha256, expectedProtocol, 'Protocol mismatch'); assert.ok(!byShard.has(report.shard), 'Duplicate shard'); byShard.set(report.shard, report)
  }
  const missing = Object.keys(shards).filter(shard => !byShard.has(shard))
  const runtimes = new Set(reports.map(report => report.runtimeSha256).filter(Boolean))
  const incompatibleRuntime = runtimes.size !== 1
  const complete = missing.length === 0 && !incompatibleRuntime && reports.every(report => report.status === 'complete')
  const rows = []
  for (const [shard, names] of Object.entries(shards)) for (const name of names) {
    const report = byShard.get(shard), phases = report?.runs.map(run => run.phases.find(phase => phase.name === name)) ?? []
    const incomplete = !report || report.status !== 'complete' || phases.some(phase => !phase)
    const environments = new Set(report?.runs.map(run => run.environmentSha256))
    const workload = !incomplete && comparableWork(phases)
    for (const metric of Object.keys(metrics)) {
      const row = { shard, phase: name, metric, basis: queryCounters[metric] ? 'per-query frame average' : 'per-frame' }
      for (const statistic of ['p50', 'p95']) {
        if (incomplete) row[statistic] = { status: report?.status === 'incompatible-dependencies' ? 'incompatible-dependencies' : 'incomplete' }
        else if (incompatibleRuntime || environments.size !== 1 || environments.has(null)) row[statistic] = { status: 'environment-mismatch' }
        else if (!workload) row[statistic] = { status: 'workload-mismatch' }
        else {
          const get = side => report.runs.filter(run => run.side === side).map(run => run.phases.find(phase => phase.name === name).metrics[metric]?.[queryCounters[metric] ? 'perQuery' : 'all']?.[statistic] ?? null)
          row[statistic] = classify(get('base'), get('head'))
          // No exported per-frame turn count exists. Frame sampling frequency can
          // change the mixture of tick/no-tick callbacks; do not call it faster simulation.
          if (metric === 'simulation' && row[statistic].baseline !== undefined)
            row[statistic].status = `${row[statistic].status === 'noisy' ? 'noisy-' : ''}observed-only-no-per-turn-attribution`
          if (!complete && row[statistic].status.startsWith('possible-'))
            row[statistic].status = 'incomplete-shards-observation-only'
        }
      }
      rows.push(row)
    }
  }
  return { complete, missing, rows }
}
