// v2 is a separate controlled, paused workload. The live v1 policy is unchanged.
import assert from 'node:assert/strict'
import { analyzeFrameExport } from '../../app/frame-export-analysis.ts'
import { repository, order, metrics, metricLabels, workMetrics, queryCounters, policy,
  sha256, summarizeTimings, summarizeMetrics, validateIdentity, classify, maxReportBytes } from './protocol.mjs'
export { repository, order, metrics, metricLabels, workMetrics, queryCounters, sha256, maxReportBytes }
export const shards = Object.freeze({ world: ['native-hover', 'ordinary-hover'], recovery: ['hud', 'world-recovery', 'menu-recovery'] })
export const plan = Object.freeze({ version: 2, kind: 'paused-authored-snapshot-cpu', level: 2,
  viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, warmupMs: 2000,
  steps: 6, callbacksPerStep: 4, firstCallbacks: 1, settledCallbacks: 3,
  pointerOffsets: [[3, 0], [3, 3], [0, 3], [-3, 0], [0, -3], [0, 0]],
  nativePointerOffsets: [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]],
  cohortRevision: 2, nativePixelQuantization: 'truncate-css-minus-canvas-origin', nativeViewInvalidation: 'unsupported-unmeasured', observerVersion: 1, geometryVersion: 1, nativeTargetId: 54, snapshotAuthoringVersion: 1, authoredTurn: 70,
  coverage: 'exact-4-of-4-contiguous-recorded-callbacks-per-input', menuRecovery: 'first-subsequent-world-pointer-input-not-first-close-callback',
  simulation: 'not-measured-paused', waterAdvance: 'not-measured-paused',
  renderCallbackRaf: 'observation-only-presentation-clocks-advance',
  pointerObjectModel: 'observation-only-unverified-nonterrain-inputs' })
export const strata = Object.freeze(['first', 'settled'])
export const metricEligibility = Object.freeze({
  simulation: 'not-measured-paused', render: 'observation-only-presentation-clocks',
  callback: 'observation-only-presentation-clocks', raf: 'observation-only-presentation-clocks',
  pointer: 'observation-only-unverified-nonterrain-inputs', objectPick: 'observation-only-unverified-nonterrain-inputs',
  model: 'observation-only-unverified-nonterrain-inputs', nativeOcclusion: 'observation-only-unverified-nonterrain-inputs',
  terrainPick: 'terrain-input-matched', ordinaryVisibility: 'terrain-input-matched', ordinaryProjection: 'terrain-input-matched',
  ordinaryTriangles: 'terrain-input-matched', nativeKey: 'terrain-input-matched', nativeProjection: 'observation-only-warm-projection-cache', nativeTriangles: 'terrain-input-matched',
})
export const classificationPolicy = Object.freeze(Object.fromEntries(['pairs', 'baselineSpread', 'minimumEffect', 'absoluteFloorMs', 'noiseMultiplier'].map(key => [key, policy[key]])))
export const protocolHash = () => sha256(JSON.stringify({ plan, shards, order, metrics, workMetrics, queryCounters, classificationPolicy, metricEligibility }))
const keys = (value, names) => { assert.ok(value && typeof value === 'object' && !Array.isArray(value)); assert.deepEqual(Object.keys(value).sort(), [...names].sort()) }
const number = (value, max = 1e9, integer = false) => assert.ok(typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max && (!integer || Number.isSafeInteger(value)))
const digest = value => assert.match(value, /^[a-f0-9]{64}$/)
function stats(value, n, exact = true) {
  if (value === null) return
  keys(value, ['n', 'mean', 'p50', 'p95', 'max']); number(value.n, n, true); assert.ok(value.n > 0)
  if (exact) assert.equal(value.n, n)
  for (const key of ['mean', 'p50', 'p95', 'max']) number(value[key])
  assert.ok(value.mean <= value.max && value.p50 <= value.p95 && value.p95 <= value.max)
}
function timings(value, n) {
  keys(value, Object.keys(metrics))
  for (const item of Object.values(value)) { keys(item, ['all', 'nonzero', 'perQuery']); stats(item.all, n); stats(item.nonzero, n, false); stats(item.perQuery, n, false)
    if (item.all === null) assert.ok(item.nonzero === null && item.perQuery === null) }
}
export function validateReport(report) {
  keys(report, ['version', 'identity', 'protocolSha256', 'runtimeSha256', 'snapshotSha256', 'shard', 'status', 'runs'])
  assert.equal(report.version, 2); validateIdentity(report.identity); digest(report.protocolSha256)
  for (const key of ['runtimeSha256', 'snapshotSha256']) if (report[key] !== null) digest(report[key])
  assert.ok(Object.hasOwn(shards, report.shard)); assert.ok(['complete', 'incomplete', 'incompatible-dependencies'].includes(report.status))
  assert.ok(Array.isArray(report.runs) && report.runs.length <= 6)
  for (const [index, run] of report.runs.entries()) {
    keys(run, ['index', 'side', 'revision', 'status', 'environmentSha256', 'phases'])
    assert.equal(run.index, index); assert.equal(run.side, order[index]); assert.equal(run.revision, report.identity[`${run.side}Sha`])
    assert.ok(['complete', 'incomplete'].includes(run.status)); if (run.environmentSha256 !== null) digest(run.environmentSha256)
    assert.ok(Array.isArray(run.phases) && run.phases.length <= shards[report.shard].length)
    for (const [offset, phase] of run.phases.entries()) {
      keys(phase, ['name', 'stateSha256', 'viewConfigSha256', 'targetId', 'point', 'frames', 'rawFrames', 'durationMs', 'blocks', 'timings', 'work'])
      assert.equal(phase.name, shards[report.shard][offset]); digest(phase.stateSha256); digest(phase.viewConfigSha256)
      if (phase.targetId !== null) number(phase.targetId, 1e9, true)
      assert.ok(Array.isArray(phase.point) && phase.point.length === 2); phase.point.forEach((x, i) => number(x, i ? 1000 : 1440))
      assert.equal(phase.frames, plan.steps * plan.callbacksPerStep); number(phase.rawFrames, 1199, true); assert.ok(phase.rawFrames >= phase.frames)
      number(phase.durationMs, 90000); assert.ok(phase.durationMs > 0)
      assert.ok(Array.isArray(phase.blocks) && phase.blocks.length === plan.steps)
      for (const [step, block] of phase.blocks.entries()) {
        keys(block, ['step', 'event', 'point', 'poses', 'inventory', 'geometrySha256'])
        digest(block.geometrySha256)
        assert.equal(block.step, step); assert.equal(block.event, 'pointermove')
        assert.ok(Array.isArray(block.point) && block.point.length === 2); block.point.forEach((x, i) => number(x, i ? 1000 : 1440))
        assert.ok(Array.isArray(block.poses) && block.poses.length === plan.callbacksPerStep); block.poses.forEach(digest)
        assert.ok(Array.isArray(block.inventory) && block.inventory.length === 4)
        for (const [index, item] of block.inventory.entries()) {
          assert.ok(Array.isArray(item) && item.length === 3)
          item.forEach(x => { if (x !== null) number(x, 1e8, true) })
          assert.ok(item[0] !== null && item[1] !== null)
          if (phase.name === 'hud') assert.deepEqual(item.slice(0, 2), [0, 0])
          else if (index === 0) assert.ok(item[0] > 0 && item[1] > 0)
          if (phase.name === 'native-hover' && index === 0) assert.ok(item[2] > 0)
        }
      }
      keys(phase.timings, strata); keys(phase.work, strata)
      for (const stratum of strata) {
        const n = plan.steps * (stratum === 'first' ? 1 : 3)
        timings(phase.timings[stratum], n); keys(phase.work[stratum], Object.keys(workMetrics)); Object.values(phase.work[stratum]).forEach(value => stats(value, n))
      }
    }
    if (run.status === 'complete') { assert.equal(run.phases.length, shards[report.shard].length); assert.notEqual(run.environmentSha256, null) }
  }
  if (report.status === 'complete') { assert.equal(report.runs.length, 6); assert.ok(report.runs.every(run => run.status === 'complete')); assert.ok(report.runtimeSha256 && report.snapshotSha256) }
  return report
}
export function parseReport(text) { assert.ok(typeof text === 'string' && Buffer.byteLength(text) <= maxReportBytes); return validateReport(JSON.parse(text)) }

export function invariant(state) {
  assert.equal(state.level, 2); assert.equal(state.paused, true); assert.equal(state.sameScene, true); assert.equal(state.sceneConnected, true)
  assert.equal(state.latchRemoved, true); assert.equal(state.inputMask, 0); assert.equal(state.flybyActive, false); assert.equal(state.modalSuspended, false)
  assert.equal(state.visibility, 'visible'); assert.equal(state.viewport.width, plan.viewport.width); assert.equal(state.viewport.height, plan.viewport.height); assert.equal(state.viewport.devicePixelRatio, 1)
  assert.deepEqual(state.selected, []); assert.equal(state.mode, null)
  for (const key of ['turn', 'time', 'pendingTime', 'randomState']) number(state[key], 0xffffffff)
  for (const key of ['simulationSha256', 'unitsSha256', 'terrainSha256', 'geometrySha256']) digest(state[key])
  return sha256(JSON.stringify([state.level, state.turn, state.time, state.pendingTime, state.randomState,
    state.simulationSha256, state.unitsSha256, state.terrainSha256, state.geometrySha256]))
}
export function summarizeSnapshotPhase(json, recording, revision) {
  assert.match(revision, /^[a-f0-9]{40}$/)
  analyzeFrameExport(json) // Validate actual downloaded schema/limits, never a synthetic replacement.
  const raw = JSON.parse(json), before = recording.before, after = recording.after
  assert.equal(raw.buildRevision, revision); assert.equal(raw.session.level, 2)
  assert.deepEqual(raw.environment.viewportCssPixels, plan.viewport); assert.equal(raw.environment.devicePixelRatio, 1); assert.equal(raw.environment.visibility, 'visible')
  assert.equal(raw.timing.timeOriginUnixMs, before.timeOriginUnixMs); assert.equal(after.timeOriginUnixMs, before.timeOriginUnixMs)
  const stateSha256 = invariant(before); assert.equal(invariant(after), stateSha256, 'Authored simulation state changed')
  assert.deepEqual(before.camera.config, after.camera.config)
  if (raw.retention !== undefined) {
    keys(raw.retention, ['availableFrames', 'droppedOldestFrames', 'reason'])
    number(raw.retention.availableFrames, 1200, true); number(raw.retention.droppedOldestFrames, 1199, true)
    assert.ok(raw.retention.droppedOldestFrames > 0)
    assert.equal(raw.retention.reason, 'serialized-size-limit')
    assert.equal(raw.retention.availableFrames, raw.frames.length + raw.retention.droppedOldestFrames)
  }
  assert.ok((raw.retention?.availableFrames ?? raw.frames.length) < 1200, 'Recorder ring must not wrap')
  assert.ok(Object.values(shards).flat().includes(recording.name))
  assert.equal(recording.blocks.length, plan.steps)
  assert.equal(recording.observer.error, null)
  assert.ok(after.observationStartTimestampMs >= before.timestampMs)
  const dropped = raw.retention?.droppedOldestFrames ?? 0
  const indexed = new Map(raw.frames.map((frame, index) => [frame.timestampMs, { frame, index }]))
  const selected = { first: [], settled: [] }, selectedRawFrameIndices = [], blocks = []
  for (const [step, block] of recording.blocks.entries()) {
    const { event, frames, geometryBefore, geometryAfter } = block;
    digest(geometryBefore.fingerprintSha256); assert.equal(geometryBefore.fingerprintSha256, geometryAfter.fingerprintSha256, 'Actual terrain submission geometry changed')
    assert.ok(Array.isArray(geometryBefore.witness) && geometryBefore.witness.length === 113 && geometryBefore.witness.every(Number.isFinite))
    assert.deepEqual(geometryBefore.witness, geometryAfter.witness, 'Geometry version/identity changed during selected block')
    assert.ok(geometryBefore.timestampMs <= event.timestampMs)
    assert.ok(geometryAfter.observationStartTimestampMs >= frames.at(-1).timestampMs); assert.equal(frames.length, plan.callbacksPerStep)
    assert.equal(event.sequence, step + 1)
    const [dx, dy] = (recording.name === 'native-hover' ? plan.nativePointerOffsets : plan.pointerOffsets)[step]
    assert.deepEqual([event.x, event.y], [recording.point.x + dx, recording.point.y + dy])
    if (recording.name === 'native-hover') {
      const { canvas, nativePixels, initialNativePixel } = recording.point, prep = block.preparation
      keys(canvas, ['left', 'top']); number(canvas.left, plan.viewport.width); number(canvas.top, plan.viewport.height)
      assert.ok(Array.isArray(nativePixels) && nativePixels.length === plan.steps)
      for (const pixel of [...nativePixels, initialNativePixel]) {
        assert.ok(Array.isArray(pixel) && pixel.length === 2)
        pixel.forEach((value, i) => number(value, i ? plan.viewport.height : plan.viewport.width, true))
      }
      keys(prep, ['pixel', 'cached', 'timestampMs']); number(prep.timestampMs)
      const expected = [Math.trunc(event.x - canvas.left), Math.trunc(event.y - canvas.top)]
      assert.deepEqual(initialNativePixel, [Math.trunc(recording.point.x - canvas.left), Math.trunc(recording.point.y - canvas.top)])
      assert.equal(new Set(nativePixels.map(p => p.join(','))).size, plan.steps)
      assert.ok(nativePixels.every(p => p.join(',') !== initialNativePixel.join(',')))
      assert.deepEqual(expected, nativePixels[step]); assert.deepEqual(prep.pixel, expected)
      assert.equal(prep.cached, false, 'Measured native pixel was already warmed')
      assert.ok(prep.timestampMs <= event.timestampMs)
    } else assert.equal(block.preparation, null)
    assert.equal(raw.frames[event.anchorSerial - dropped - 1]?.timestampMs, event.anchorTimestampMs, 'Exact pre-input raw anchor missing')
    if (step) assert.ok(event.anchorSerial >= recording.blocks[step - 1].frames.at(-1).serial)
    number(event.anchorSerial, 1199, true); number(event.anchorTimestampMs); number(event.sequence, 1000, true)
    assert.equal(event.type, 'pointermove'); assert.equal(event.buttons, 0)
    const poses = [], inventory = []
    for (const [i, observed] of frames.entries()) {
      assert.equal(observed.serial, event.anchorSerial + i + 1, 'Never skip the first post-input callback')
      assert.deepEqual(observed.geometryWitness, geometryBefore.witness, 'Per-callback geometry witness mismatch')
      assert.equal(observed.sequence, event.sequence); assert.ok(observed.timestampMs > event.anchorTimestampMs)
      const found = indexed.get(observed.timestampMs); assert.ok(found, 'Attributed callback missing from raw download')
      assert.equal(found.index, observed.serial - dropped - 1, 'Recorder serial must match raw chronological index')
      assert.ok(observed.timestampMs <= after.observationStartTimestampMs)
      assert.ok(!selectedRawFrameIndices.includes(found.index)); selectedRawFrameIndices.push(found.index)
      const { frame } = found, p = observed.pose; assert.ok(Array.isArray(p) && p.length === 27 && p.every(Number.isFinite))
      assert.equal(p[10], 0); assert.equal(p[11], 1); assert.equal(p[12], before.turn); assert.deepEqual(p.slice(13, 26), Array(13).fill(0))
      const c = before.camera, angle = c.position.angle
      assert.deepEqual(p.slice(0, 8), [c.position.x, c.position.y, angle, c.viewPoint.x, c.viewPoint.z, angle * Math.PI / 1024, c.zoom, c.preset])
      assert.equal(frame.state, 'paused'); assert.ok(frame.sceneDrawCalls > 0)
      const route = recording.name === 'hud' ? 'hud' : 'world'
      assert.equal(frame.pointerBreakdown?.interaction?.route, route)
      assert.deepEqual(p.slice(8, 10), route === 'hud' ? [-1, -1] : [event.x, event.y])
      const terrain = frame.pointerBreakdown.terrainPickCalls, object = frame.pointerBreakdown.objectPickCalls
      if (route === 'world' && i === 0) assert.ok(terrain > 0 && object > 0)
      if (route === 'hud') assert.ok(terrain === 0 && object === 0)
      if (recording.name === 'native-hover') { assert.equal(recording.point.id, plan.nativeTargetId); assert.equal(p[26], plan.nativeTargetId, 'Actual production hover must own authored target 54') }
      if (recording.name === 'native-hover' && i === 0)
        assert.ok(frame.pointerBreakdown.nativeOcclusion?.submittedTriangles > 0 && frame.pointerBreakdown.nativeOcclusion.pixelCacheMisses > 0, 'First native hover query work unsupported/missing')
      // The sidecar establishes a fixed camera/input state for every selected CPU callback.
      // Timestamp and observer sequence are deliberately excluded from the workload digest.
      poses.push(sha256(JSON.stringify(p))); inventory.push([terrain, object, frame.pointerBreakdown.nativeOcclusion?.submittedTriangles ?? null])
      selected[i === 0 ? 'first' : 'settled'].push(frame)
    }
    blocks.push({ step, event: event.type, point: [event.x, event.y], poses, inventory, geometrySha256: geometryBefore.fingerprintSha256 })
  }
  const phase = { name: recording.name, stateSha256, viewConfigSha256: sha256(JSON.stringify(before.camera.config)),
    targetId: recording.point.id ?? null, point: [recording.point.x, recording.point.y], frames: selectedRawFrameIndices.length,
    rawFrames: raw.frames.length, durationMs: after.timestampMs - before.timestampMs, blocks,
    timings: Object.fromEntries(strata.map(key => [key, summarizeTimings(selected[key])])),
    work: Object.fromEntries(strata.map(key => [key, summarizeMetrics(selected[key], workMetrics)])) }
  return { version: 2, rawSha256: sha256(json), selectedRawFrameIndices, phase }
}

export function comparableWork(phases) {
  if (phases.length !== 6 || phases.some(phase => !phase)) return false
  const shape = phase => [phase.stateSha256, phase.viewConfigSha256, phase.targetId, phase.point,
    phase.blocks.map(block => [block.step, block.event, block.point, block.poses, block.inventory, block.geometrySha256])]
  return phases.every(phase => JSON.stringify(shape(phase)) === JSON.stringify(shape(phases[0])))
}
export function compareReports(reports, identity, trustedProtocol = protocolHash()) {
  const map = new Map()
  for (const report of reports) { validateReport(report); assert.deepEqual(report.identity, identity); assert.equal(report.protocolSha256, trustedProtocol); assert.ok(!map.has(report.shard)); map.set(report.shard, report) }
  const missing = Object.keys(shards).filter(shard => !map.has(shard))
  const runtime = new Set(reports.map(r => r.runtimeSha256).filter(Boolean)), snapshots = new Set(reports.map(r => r.snapshotSha256).filter(Boolean))
  const complete = !missing.length && runtime.size === 1 && snapshots.size === 1 && reports.every(r => r.status === 'complete')
  const rows = []
  for (const [shard, names] of Object.entries(shards)) for (const phase of names) {
    const report = map.get(shard), phases = report?.runs.map(run => run.phases.find(p => p.name === phase)) ?? []
    const environments = new Set(report?.runs.map(run => run.environmentSha256))
    for (const stratum of strata) for (const metric of Object.keys(metrics)) {
      const row = { shard, phase, stratum, metric, basis: queryCounters[metric] ? 'per-query frame average' : 'per-frame' }
      for (const statistic of ['p50', 'p95']) {
        let result
        if (!report || report.status !== 'complete' || phases.some(p => !p)) result = { status: report?.status === 'incompatible-dependencies' ? report.status : 'incomplete' }
        else if (runtime.size !== 1 || environments.size !== 1 || environments.has(null)) result = { status: 'environment-mismatch' }
        else if (snapshots.size !== 1 || !comparableWork(phases)) result = { status: phases.some(p => p.blocks.some((b, i) => b.geometrySha256 !== phases[0].blocks[i].geometrySha256)) ? 'geometry-input-mismatch' : 'workload-mismatch' }
        else {
          const get = side => report.runs.filter(r => r.side === side).map(r => r.phases.find(p => p.name === phase).timings[stratum][metric][queryCounters[metric] ? 'perQuery' : 'all']?.[statistic] ?? null)
          result = classify(get('base'), get('head'))
          if (result.baseline !== undefined && metricEligibility[metric] !== 'terrain-input-matched') result.status = metricEligibility[metric]
          else if (!complete && result.status.startsWith('possible-')) result.status = 'incomplete-shards-observation-only'
        }
        row[statistic] = result
      }
      rows.push(row)
    }
  }
  return { complete, missing, rows }
}
