import assert from 'node:assert/strict'
import { assertResourceLive, gameplayResourceLimits } from './gameplay-resource-observer.mjs'

export const gameplayHeapLimits = Object.freeze([
  'Two capability samples after different workload histories: not comparable retention endpoints, a reduction, leak slope, plateau or memory cap.',
  'One explicit HeapProfiler.collectGarbage call per boundary is an intervention outside F8 windows, not ordinary gameplay or natural idle memory.',
  'Runtime.getHeapUsage describes the corresponding V8 isolate, not the whole page, browser, process RSS, GPU, host or cgroup. Byte fields remain separate and are not additive.',
  'The game remains live during commands. State and monotonic timing bracket asynchronous observations; the samples are not atomic or sampled workload peaks.',
  'Successful collection commands do not prove every retired Scene or external resource was collected. Optional process-memory measurement is not part of this probe.',
])
export const gameplayHeapResourceLimits = Object.freeze(gameplayResourceLimits.map(value => value.replace(
  'No GC or collection claim.', 'Lifecycle observations make no collection claim; the separate byte probe explicitly requests GC.')))
export const gameplayHeapPolicy = Object.freeze({ version: 1,
  scope: 'target-v8-isolate', gc: 'one-explicit-HeapProfiler.collectGarbage-per-boundary',
  boundaries: ['after-workload', 'after-restart-settled'], units: 'bytes', timingClock: 'driver-performance.now-milliseconds',
  fields: ['usedSize', 'totalSize', 'embedderHeapUsedSize', 'backingStorageSize'],
})
const finite = value => assert.ok(Number.isFinite(value) && value >= 0)
export function assertGameplayHeapSample(sample) {
  assert.equal(sample.status, 'passed'); assert.equal(sample.failure, undefined)
  assert.ok(gameplayHeapPolicy.boundaries.includes(sample.boundary))
  assert.equal(sample.scope, gameplayHeapPolicy.scope)
  assert.equal(sample.gc.method, 'HeapProfiler.collectGarbage'); assert.equal(sample.gc.calls, 1)
  assert.equal(sample.gc.completed, true); assert.equal(sample.f8Hidden, true)
  assert.ok(typeof sample.isolateBefore === 'string' && sample.isolateBefore.length > 0)
  assert.equal(sample.isolateAfter, sample.isolateBefore)
  assert.deepEqual(Object.keys(sample.bytes), gameplayHeapPolicy.fields)
  for (const value of Object.values(sample.bytes)) finite(value)
  assert.ok(sample.bytes.usedSize > 0 && sample.bytes.totalSize >= sample.bytes.usedSize)
  const keys = ['startedMs', 'gcStartedMs', 'gcCompletedMs', 'heapReadCompletedMs', 'endedMs']
  assert.deepEqual(Object.keys(sample.timing), keys)
  for (const [index, key] of keys.entries()) {
    finite(sample.timing[key])
    if (index) assert.ok(sample.timing[key] >= sample.timing[keys[index - 1]])
  }
  for (const state of [sample.before, sample.after]) assertResourceLive(state)
  assert.equal(sample.after.sceneUuid, sample.before.sceneUuid)
  assert.equal(sample.after.timeOriginUnixMs, sample.before.timeOriginUnixMs)
  assert.ok(sample.after.timestampMs >= sample.before.timestampMs)
  assert.ok(sample.after.turn >= sample.before.turn)
}

// All returned values are data. No remote object handles or Scene references.
// send failures propagate; unsupported commands/fields never become zero bytes.
export async function captureGameplayHeapSample({ session, boundary, observe, assertF8Hidden,
  now = () => performance.now(), onSample = () => {} }) {
  assert.ok(gameplayHeapPolicy.boundaries.includes(boundary))
  const sample = { status: 'running', boundary, scope: gameplayHeapPolicy.scope,
    gc: { method: 'HeapProfiler.collectGarbage', calls: 0, completed: false },
    timing: { startedMs: now() } }
  onSample(sample)
  try {
    await assertF8Hidden()
    sample.f8Hidden = true
    sample.before = await observe(); assertResourceLive(sample.before)
    sample.isolateBefore = (await session.send('Runtime.getIsolateId')).id
    assert.ok(typeof sample.isolateBefore === 'string' && sample.isolateBefore.length > 0)
    sample.timing.gcStartedMs = now(); sample.gc.calls = 1
    await session.send('HeapProfiler.collectGarbage')
    sample.gc.completed = true; sample.timing.gcCompletedMs = now()
    const heap = await session.send('Runtime.getHeapUsage')
    sample.timing.heapReadCompletedMs = now()
    sample.bytes = Object.fromEntries(gameplayHeapPolicy.fields.map(key => [key, heap[key]]))
    sample.isolateAfter = (await session.send('Runtime.getIsolateId')).id
    sample.after = await observe()
    await assertF8Hidden()
    sample.timing.endedMs = now(); sample.status = 'passed'
    assertGameplayHeapSample(sample)
    return sample
  } catch (error) {
    sample.status = 'failed'; sample.failure = String(error)
    throw error
  }
}

export function validateGameplayHeapProbe(probe, resources) {
  assert.equal(probe.version, 1); assert.equal(probe.status, 'passed-capability-only')
  assert.deepEqual(probe.policy, gameplayHeapPolicy); assert.deepEqual(probe.limits, gameplayHeapLimits)
  assert.equal(probe.sessionDetached, true)
  assert.deepEqual(probe.samples.map(sample => sample.boundary), gameplayHeapPolicy.boundaries)
  for (const sample of probe.samples) assertGameplayHeapSample(sample)
  const [first, second] = probe.samples
  assert.equal(first.isolateBefore, second.isolateBefore)
  assert.equal(first.before.timeOriginUnixMs, resources.afterWorkload.timeOriginUnixMs)
  assert.equal(second.before.timeOriginUnixMs, first.before.timeOriginUnixMs)
  assert.equal(first.before.sceneUuid, resources.afterWorkload.sceneUuid)
  assert.equal(second.before.sceneUuid, resources.restart.settled.sceneUuid)
  assert.notEqual(first.before.sceneUuid, second.before.sceneUuid)
  assert.ok(first.before.timestampMs >= resources.afterWorkload.timestampMs)
  assert.ok(first.before.turn >= resources.afterWorkload.turn)
  assert.ok(first.after.timestampMs < resources.restart.after.timestampMs)
  assert.ok(second.before.timestampMs >= resources.restart.settled.timestampMs)
  assert.ok(second.before.turn >= resources.restart.settled.turn)
  assert.ok(second.timing.startedMs >= first.timing.endedMs)
  return { capabilityVerified: true, sampleCount: 2, scope: gameplayHeapPolicy.scope,
    interpretation: 'different-workload-history-capability-only-not-retention-comparison' }
}
