import assert from 'node:assert/strict'
import { assertResourceLive, gameplayResourceLimits } from './gameplay-resource-observer.mjs'

// Metadata only, after all original samples and their observer cleanup. Never
// call HeapProfiler, allocate game handles, or treat this as capture readiness.
export const gameplayProducerPreflightPolicy = Object.freeze({ version: 1,
  operationsMs: 2000, cleanupMs: 3000, reportBytes: 4096, browserCapMs: 180000 })
const producerPin = Object.freeze({ product: 'Chrome/155.0.8059.39',
  revision: '3ff7ac5a9224be9156d7f8703a06e22890aafd34', jsVersion: '15.5.35.20', protocolVersion: '1.3',
  executableSha256: '9bfb381296dffe75f3419d07b6cc64525105ed117d1453a4ef3b291cb97d2b58' })
const preflightCodes = new Set(['HEADROOM', 'CONTRACT', 'METRICS', 'OBSERVER_CLEANUP',
  'PROTOCOL', 'IDENTITY', 'DEADLINE', 'CLEANUP', 'ABORTED', 'CLOCK'])
const preflightNumber = value => Number.isFinite(value) && value >= 0
function preflightRequire(ok, code = 'CONTRACT') { if (!ok) throw new Error(code) }
function preflightText(value) {
  preflightRequire(typeof value === 'string' && value.length > 0 && value.length <= 256)
  preflightRequire(/^[\x20-\x7e]+$/.test(value)); return value
}
function preflightVersion(value) {
  return Object.fromEntries(['product', 'revision', 'jsVersion', 'protocolVersion']
    .map(key => [key, preflightText(value?.[key])]))
}
function preflightTarget(value) {
  preflightRequire(value?.targetInfo?.type === 'page', 'IDENTITY')
  return { targetId: preflightText(value.targetInfo.targetId), type: 'page' }
}
function preflightMetric(report) {
  preflightRequire(report?.status === 'passed' && report.cycles?.length === 3 &&
    report.resources?.heap?.status === 'passed-three-cycle-descriptive-observations' &&
    report.resources.heap.samples?.length === 3, 'METRICS')
  preflightRequire(report.resources.heap.sessionDetached === true &&
    !report.resourceObserverCleanupFailure && !report.heapObserverCleanupFailure, 'OBSERVER_CLEANUP')
  preflightRequire(report.resources.heap.samples.every((sample, index) => sample.status === 'passed' &&
    sample.boundary === `after-cycle-${index + 1}-workload` && sample.isolateBefore === sample.isolateAfter), 'METRICS')
  const sample = report.resources.heap.samples[2]
  preflightRequire(sample.status === 'passed' && sample.boundary === 'after-cycle-3-workload' &&
    sample.isolateBefore === sample.isolateAfter && preflightNumber(sample.after?.timeOriginUnixMs) &&
    preflightNumber(sample.timing?.endedMs), 'METRICS')
  return { isolateId: preflightText(sample.isolateAfter), timeOriginUnixMs: sample.after.timeOriginUnixMs,
    endedMs: sample.timing.endedMs }
}
// Fresh macrotask; own-property checks never read or dereference game values.
function preflightPageTask() {
  return new Promise(resolve => setTimeout(() => resolve({ timeOriginUnixMs: performance.timeOrigin,
    aliasesAbsent: ['testScene', 'testSceneRef', 'testStore', '__populousGameplayOwnershipV1']
      .every(key => !Object.hasOwn(window, key)) }), 0))
}

export async function observeGameplayProducerPreflight({ browser, page, report, budget,
  executableSha256, signal, now = () => performance.now(), schedule = setTimeout, cancel = clearTimeout }) {
  const startedMs = now()
  preflightRequire(preflightNumber(startedMs) && preflightNumber(budget?.startedMs) &&
    budget.deadlineMs === budget.startedMs + gameplayProducerPreflightPolicy.browserCapMs &&
    preflightNumber(budget.deadlineUnixMs) && startedMs >= budget.startedMs)
  const operationsDeadlineMs = Math.min(startedMs + 2000, budget.deadlineMs)
  const cleanupDeadlineMs = Math.min(startedMs + 3000, budget.deadlineMs)
  const receipt = { version: 1, mode: 'metadata-only', snapshot_attempted: false, capture_ready: false,
    status: 'failed', code: null, expectedPinMatched: null, browser: null, target: null,
    isolateId: null, timeOriginUnixMs: null,
    timing: { clock: 'driver-performance.now-milliseconds', browserStartedMs: budget.startedMs,
      browserDeadlineMs: budget.deadlineMs, browserDeadlineUnixMs: budget.deadlineUnixMs,
      lastMetricEndedMs: null, observerCleanupCompletedMs: startedMs, startedMs,
      operationsDeadlineMs, cleanupDeadlineMs, metadataCompletedMs: null, endedMs: null, remainingAfterPreflightMs: null,
      ordinaryCleanupEndedMs: null, remainingAfterOrdinaryCleanupMs: null,
      ordinaryCleanupVerified: null, cleanupDeadlineEnforced: false },
    sessionCleanup: { created: 0, detached: 0, promisesSettled: true } }
  let lastNow = startedMs, operating = true, code = null
  const tasks = [], sessions = []
  const clock = () => {
    const value = now(); preflightRequire(preflightNumber(value) && value >= lastNow, 'CLOCK')
    lastNow = value; return value
  }
  // A rejection is converted immediately to a fixed code, never an exception,
  // protocol reply, title, URL or stack in the public receipt.
  const track = (action, project = value => value) => {
    const task = { settled: false, ok: false }
    tasks.push(task)
    task.promise = Promise.resolve().then(action).then(value => {
      const result = project(value); task.settled = true; task.ok = true
      return { ok: true, value: result }
    }).catch(error => { task.settled = true
      return { ok: false, code: preflightCodes.has(error?.message) ? error.message : 'PROTOCOL' } })
    return task
  }
  const detach = entry => {
    if (entry.detachTask || clock() >= cleanupDeadlineMs) return
    entry.detachTask = track(() => {
      preflightRequire(clock() < cleanupDeadlineMs, 'DEADLINE'); return entry.session.detach()
    }, () => { entry.detached = true })
  }
  const attach = action => track(() => {
    preflightRequire(operating && clock() < operationsDeadlineMs, 'DEADLINE')
    preflightRequire(!signal?.aborted, 'ABORTED'); return action()
  }, session => {
    preflightRequire(session && typeof session.send === 'function' && typeof session.detach === 'function')
    const entry = { session, detached: false }; sessions.push(entry)
    if (!operating) detach(entry)
    return session
  })
  async function until(promise, deadline, withAbort = true) {
    preflightRequire(clock() < deadline, 'DEADLINE')
    if (withAbort) preflightRequire(!signal?.aborted, 'ABORTED')
    let timer, listener
    try {
      const timeout = new Promise(resolve => { timer = schedule(() => resolve({ timeout: true }), deadline - clock()) })
      const abort = new Promise(resolve => {
        if (withAbort && signal) {
          listener = () => resolve({ aborted: true }); signal.addEventListener('abort', listener, { once: true })
        }
      })
      const result = await Promise.race([promise, timeout, abort])
      preflightRequire(!result.aborted && !(withAbort && signal?.aborted), 'ABORTED')
      preflightRequire(!result.timeout && clock() < deadline, 'DEADLINE')
      if (withAbort) preflightRequire(result.ok, result.code ?? 'PROTOCOL')
      return result.value
    } finally {
      if (timer !== undefined) cancel(timer)
      if (listener) signal.removeEventListener('abort', listener)
    }
  }
  const read = (action, project) => {
    preflightRequire(operating && clock() < operationsDeadlineMs, 'DEADLINE')
    return until(track(() => {
      preflightRequire(operating && clock() < operationsDeadlineMs, 'DEADLINE')
      preflightRequire(!signal?.aborted, 'ABORTED'); return action()
    }, project).promise, operationsDeadlineMs)
  }
  try {
    const metric = preflightMetric(report); receipt.timing.lastMetricEndedMs = metric.endedMs
    preflightRequire(metric.endedMs <= startedMs, 'METRICS')
    if (budget.deadlineMs - startedMs < 3000) {
      receipt.status = 'not-started-headroom'; code = 'HEADROOM'
    } else {
      preflightRequire(!signal?.aborted, 'ABORTED')
      const checkPage = value => {
        preflightRequire(value?.aliasesAbsent === true, 'OBSERVER_CLEANUP')
        preflightRequire(value?.timeOriginUnixMs === metric.timeOriginUnixMs, 'IDENTITY')
        return metric.timeOriginUnixMs
      }
      await read(() => page.evaluate(preflightPageTask), checkPage)
      const root = await until(attach(() => browser.newBrowserCDPSession()).promise, operationsDeadlineMs)
      const target = await until(attach(() => page.context().newCDPSession(page)).promise, operationsDeadlineMs)
      receipt.browser = await read(() => root.send('Browser.getVersion'), preflightVersion)
      receipt.target = await read(() => target.send('Target.getTargetInfo'), preflightTarget)
      receipt.isolateId = await read(() => target.send('Runtime.getIsolateId'), value => preflightText(value?.id))
      preflightRequire(receipt.isolateId === metric.isolateId, 'IDENTITY')
      const finalTarget = await read(() => target.send('Target.getTargetInfo'), preflightTarget)
      const finalIsolate = await read(() => target.send('Runtime.getIsolateId'), value => preflightText(value?.id))
      preflightRequire(finalTarget.targetId === receipt.target.targetId && finalIsolate === receipt.isolateId, 'IDENTITY')
      receipt.timeOriginUnixMs = await read(() => page.evaluate(preflightPageTask), checkPage)
      const metadataCompletedMs = clock()
      preflightRequire(metadataCompletedMs < operationsDeadlineMs, 'DEADLINE')
      receipt.timing.metadataCompletedMs = metadataCompletedMs
      receipt.expectedPinMatched = executableSha256 === producerPin.executableSha256 &&
        ['product', 'jsVersion', 'protocolVersion'].every(key => receipt.browser[key] === producerPin[key]) &&
        [producerPin.revision, '@' + producerPin.revision].includes(receipt.browser.revision)
    }
  } catch (error) {
    code = preflightCodes.has(error?.message) ? error.message : 'CONTRACT'
  } finally {
    operating = false
    try {
      for (const entry of sessions) detach(entry)
      // Late creation adds its detach task before its creation promise settles.
      // Every loop consumes a settlement; no active polling or renewed budget.
      while (tasks.some(task => !task.settled)) {
        await until(Promise.race(tasks.filter(task => !task.settled).map(task => task.promise)), cleanupDeadlineMs, false)
      }
      if (tasks.length) preflightRequire(clock() < cleanupDeadlineMs, 'DEADLINE')
      preflightRequire(sessions.every(entry => entry.detached), 'CLEANUP')
    } catch { code ??= 'CLEANUP' }
    receipt.sessionCleanup = { created: sessions.length, detached: sessions.filter(entry => entry.detached).length,
      promisesSettled: tasks.every(task => task.settled) }
    try { receipt.timing.endedMs = clock() } catch { code ??= 'CLOCK'; receipt.timing.endedMs = lastNow }
    receipt.timing.remainingAfterPreflightMs = budget.deadlineMs - receipt.timing.endedMs
    if (receipt.status !== 'not-started-headroom') receipt.status = code ? 'failed' : 'observed'
    receipt.code = code
  }
  preflightRequire(Buffer.byteLength(JSON.stringify(receipt)) <= gameplayProducerPreflightPolicy.reportBytes)
  return receipt
}

export function recordGameplayProducerCleanup(receipt, nowMs, cleanupVerified) {
  preflightRequire(preflightNumber(nowMs) && nowMs >= receipt.timing.endedMs)
  receipt.timing.ordinaryCleanupEndedMs = nowMs
  receipt.timing.remainingAfterOrdinaryCleanupMs = receipt.timing.browserDeadlineMs - nowMs
  receipt.timing.ordinaryCleanupVerified = cleanupVerified === true
}

export function validateGameplayProducerPreflight(receipt, report, { requireObserved = false, executableSha256 } = {}) {
  const keys = (object, expected) => assert.deepEqual(Object.keys(object).sort(), expected.split(' ').sort())
  keys(receipt, 'version mode snapshot_attempted capture_ready status code expectedPinMatched browser target isolateId timeOriginUnixMs timing sessionCleanup')
  assert.ok(Buffer.byteLength(JSON.stringify(receipt)) <= gameplayProducerPreflightPolicy.reportBytes)
  assert.equal(receipt.version, 1); assert.equal(receipt.mode, 'metadata-only')
  assert.equal(receipt.snapshot_attempted, false); assert.equal(receipt.capture_ready, false)
  assert.ok(['observed', 'failed', 'not-started-headroom'].includes(receipt.status))
  assert.ok(receipt.code === null || preflightCodes.has(receipt.code))
  assert.ok(receipt.expectedPinMatched === null || typeof receipt.expectedPinMatched === 'boolean')
  if (receipt.browser !== null) { keys(receipt.browser, 'product revision jsVersion protocolVersion'); preflightVersion(receipt.browser) }
  if (receipt.target !== null) { keys(receipt.target, 'targetId type'); preflightTarget({ targetInfo: receipt.target }) }
  if (receipt.isolateId !== null) preflightText(receipt.isolateId)
  assert.ok(receipt.timeOriginUnixMs === null || preflightNumber(receipt.timeOriginUnixMs))
  const t = receipt.timing, s = receipt.sessionCleanup
  keys(t, 'clock browserStartedMs browserDeadlineMs browserDeadlineUnixMs lastMetricEndedMs observerCleanupCompletedMs startedMs operationsDeadlineMs cleanupDeadlineMs metadataCompletedMs endedMs remainingAfterPreflightMs ordinaryCleanupEndedMs remainingAfterOrdinaryCleanupMs ordinaryCleanupVerified cleanupDeadlineEnforced')
  keys(s, 'created detached promisesSettled')
  assert.equal(t.clock, 'driver-performance.now-milliseconds'); assert.equal(t.cleanupDeadlineEnforced, false)
  for (const key of ['browserStartedMs', 'browserDeadlineMs', 'browserDeadlineUnixMs', 'observerCleanupCompletedMs',
    'startedMs', 'operationsDeadlineMs', 'cleanupDeadlineMs', 'endedMs', 'ordinaryCleanupEndedMs']) assert.ok(preflightNumber(t[key]))
  assert.equal(t.browserDeadlineMs, t.browserStartedMs + 180000)
  assert.equal(t.observerCleanupCompletedMs, t.startedMs); assert.ok(t.startedMs >= t.browserStartedMs)
  assert.equal(t.operationsDeadlineMs, Math.min(t.startedMs + 2000, t.browserDeadlineMs))
  assert.equal(t.cleanupDeadlineMs, Math.min(t.startedMs + 3000, t.browserDeadlineMs))
  assert.ok(t.endedMs >= t.startedMs && t.ordinaryCleanupEndedMs >= t.endedMs)
  assert.equal(t.remainingAfterPreflightMs, t.browserDeadlineMs - t.endedMs)
  assert.equal(t.remainingAfterOrdinaryCleanupMs, t.browserDeadlineMs - t.ordinaryCleanupEndedMs)
  assert.ok(t.metadataCompletedMs === null || (preflightNumber(t.metadataCompletedMs) &&
    t.metadataCompletedMs >= t.startedMs && t.metadataCompletedMs < t.operationsDeadlineMs))
  assert.equal(t.ordinaryCleanupVerified, true)
  for (const value of [s.created, s.detached]) assert.ok(Number.isSafeInteger(value) && value >= 0 && value <= 2)
  assert.ok(s.detached <= s.created); assert.equal(typeof s.promisesSettled, 'boolean')
  const metric = preflightMetric(report)
  assert.equal(t.lastMetricEndedMs, metric.endedMs); assert.ok(metric.endedMs <= t.startedMs)
  if (receipt.expectedPinMatched !== null) {
    assert.ok(receipt.browser); assert.match(executableSha256, /^[a-f0-9]{64}$/)
    assert.equal(receipt.expectedPinMatched, executableSha256 === producerPin.executableSha256 &&
      ['product', 'jsVersion', 'protocolVersion'].every(key => receipt.browser[key] === producerPin[key]) &&
      [producerPin.revision, '@' + producerPin.revision].includes(receipt.browser.revision))
  }
  if (receipt.status === 'observed') {
    assert.equal(receipt.code, null); assert.equal(typeof receipt.expectedPinMatched, 'boolean')
    assert.ok(receipt.browser && receipt.target); assert.equal(receipt.isolateId, metric.isolateId)
    assert.equal(receipt.timeOriginUnixMs, metric.timeOriginUnixMs)
    assert.ok(t.metadataCompletedMs !== null && t.metadataCompletedMs <= t.endedMs)
    assert.ok(t.browserDeadlineMs - t.startedMs >= 3000 && t.endedMs < t.cleanupDeadlineMs)
    assert.deepEqual(s, { created: 2, detached: 2, promisesSettled: true })
  } else {
    assert.ok(receipt.code !== null)
    if (receipt.status === 'not-started-headroom') {
      assert.equal(receipt.code, 'HEADROOM'); assert.ok(t.browserDeadlineMs - t.startedMs < 3000)
      assert.deepEqual(s, { created: 0, detached: 0, promisesSettled: true })
      for (const key of ['browser', 'target', 'isolateId', 'timeOriginUnixMs', 'expectedPinMatched']) assert.equal(receipt[key], null)
    }
  }
  if (requireObserved) assert.equal(receipt.status, 'observed', 'Producer preflight not observed')
  return { metadataObserved: receipt.status === 'observed', snapshotAttempted: false, captureReady: false }
}

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
function assertHeapSample(sample, policy) {
  assert.equal(sample.status, 'passed'); assert.equal(sample.failure, undefined)
  assert.ok(policy.boundaries.includes(sample.boundary))
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
async function captureHeapSample({ session, boundary, observe, assertF8Hidden,
  now = () => performance.now(), onSample = () => {}, afterHeapRead }, policy) {
  assert.ok(policy.boundaries.includes(boundary))
  assert.ok(afterHeapRead === undefined || (policy.version === 3 && typeof afterHeapRead === 'function'), 'Ownership reader requires three-cycle policy')
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
    if (afterHeapRead) {
      sample.ownershipTiming = { startedMs: now() }
      sample.ownership = await afterHeapRead()
      sample.ownershipTiming.completedMs = now()
      // Fixed three-cycle boundaries require exactly 0/1/2 retirements. Missing
      // page state after restart must not masquerade as a clean empty result.
      assert.equal(sample.ownership?.version, 1, 'Ownership diagnostic version missing')
      assert.ok(Array.isArray(sample.ownership.records), 'Ownership diagnostic records missing')
      const expectedRetirements = policy.boundaries.indexOf(boundary)
      assert.deepEqual(sample.ownership.records.map(record => record.retirement),
        Array.from({ length: expectedRetirements }, (_, index) => index + 1),
        'Ownership diagnostic retirement count/order does not match fixed boundary')
    }
    sample.isolateAfter = (await session.send('Runtime.getIsolateId')).id
    sample.after = await observe()
    await assertF8Hidden()
    sample.timing.endedMs = now(); sample.status = 'passed'
    assertHeapSample(sample, policy)
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

// Separate entry points preserve historical v1 capability semantics. Callers cannot
// weaken either policy with a feature flag or substitute their own boundary list.
export const assertGameplayHeapSample = sample => assertHeapSample(sample, gameplayHeapPolicy)
export const captureGameplayHeapSample = options => captureHeapSample(options, gameplayHeapPolicy)
export const gameplayMatchedHeapPolicy = Object.freeze({ ...gameplayHeapPolicy, version: 2,
  boundaries: ['after-cycle-1-workload', 'after-cycle-2-workload'] })
export const gameplayMatchedProtocol = Object.freeze({ version: 1, cycles: 2, publicRestarts: 1,
  setup: 'authored-mission-2-startup-ready-public-skip-normal-speed', pointerReset: { x: 900, y: 400 },
  restartPreconditioning: 'additional-live-settling-interval-before-second-cycle-pointer-reset-and-warmup',
  workload: 'complete-five-phase-plan-per-cycle', sampleEndpoint: 'after-final-screenshot-and-live-resource-observation',
  equivalence: 'same-input-recipe-not-identical-observed-work', interpretation: 'two-cycle-descriptive-isolate-byte-change-only' })
export const gameplayMatchedHeapLimits = Object.freeze([
  'Two complete same-input-recipe workloads are not identical observed work: turns, frames, target, camera and query differences are retained.',
  'Two post-workload samples describe finite isolate-byte change across one public restart, not a plateau, leak, memory reduction or bound.',
  'The replacement Scene has an additional recorded live settling interval before its repeated pointer reset and warmup; preconditioning histories are not identical.',
  'First-use caches, instrumentation retention and cumulative session history may differ. No matched baseline/candidate improvement is established.',
  ...gameplayHeapLimits.slice(1),
])
export const captureGameplayMatchedHeapSample = options => captureHeapSample(options, gameplayMatchedHeapPolicy)
export function summarizeGameplayMatchedWorkload(cycles) {
  assert.equal(cycles.length, 2)
  return cycles[0].phases.map((first, index) => {
    const second = cycles[1].phases[index]
    assert.equal(first.name, second.name)
    const observed = record => ({ point: record.point, before: record.before, after: record.after,
      turnsAdvanced: record.turnsAdvanced, frameCount: record.frameCount, work: record.work })
    return { phase: first.name, first: observed(first), second: observed(second),
      secondMinusFirst: { turnsAdvanced: second.turnsAdvanced - first.turnsAdvanced,
        frameCount: second.frameCount - first.frameCount,
        work: Object.fromEntries(Object.keys(first.work).map(key => [key, second.work[key] - first.work[key]])) } }
  })
}
export function validateGameplayMatchedHeapProbe(probe, resources, cycles) {
  assert.equal(probe.version, 2); assert.equal(probe.status, 'passed-two-cycle-descriptive-observations')
  assert.deepEqual(probe.policy, gameplayMatchedHeapPolicy); assert.deepEqual(probe.limits, gameplayMatchedHeapLimits)
  assert.equal(probe.sessionDetached, true)
  assert.deepEqual(probe.samples.map(sample => sample.boundary), gameplayMatchedHeapPolicy.boundaries)
  assert.equal(cycles.length, 2)
  for (const [index, sample] of probe.samples.entries()) {
    assertHeapSample(sample, gameplayMatchedHeapPolicy)
    const endpoint = cycles[index].resources.afterWorkload
    assert.equal(sample.before.sceneUuid, endpoint.sceneUuid)
    assert.equal(sample.before.timeOriginUnixMs, endpoint.timeOriginUnixMs)
    assert.ok(sample.before.timestampMs >= endpoint.timestampMs && sample.before.turn >= endpoint.turn)
  }
  const [first, second] = probe.samples
  assert.equal(first.isolateBefore, second.isolateBefore)
  assert.equal(first.before.timeOriginUnixMs, second.before.timeOriginUnixMs)
  assert.notEqual(first.before.sceneUuid, second.before.sceneUuid)
  assert.equal(second.before.sceneUuid, resources.restart.settled.sceneUuid)
  assert.ok(first.after.timestampMs < resources.restart.after.timestampMs)
  assert.ok(cycles[1].resources.beforeWarmup.timestampMs >= resources.restart.settled.timestampMs)
  assert.ok(cycles[1].resources.beforeWarmup.turn >= resources.restart.settled.turn)
  assert.ok(second.timing.startedMs >= first.timing.endedMs)
  return { capabilityVerified: true, matchedProtocolVerified: true, sampleCount: 2, scope: gameplayHeapPolicy.scope,
    interpretation: gameplayMatchedProtocol.interpretation,
    secondMinusFirstBytes: Object.fromEntries(gameplayHeapPolicy.fields.map(key => [key, second.bytes[key] - first.bytes[key]])) }
}

// Separate fixed profile: historical two-cycle constants and validators stay unchanged.
export const gameplayThreeCycleHeapPolicy = Object.freeze({ ...gameplayHeapPolicy, version: 3,
  boundaries: ['after-cycle-1-workload', 'after-cycle-2-workload', 'after-cycle-3-workload'] })
export const gameplayThreeCycleProtocol = Object.freeze({ ...gameplayMatchedProtocol, version: 2,
  cycles: 3, publicRestarts: 2,
  restartPreconditioning: 'additional-live-settling-interval-before-each-replacement-cycle-pointer-reset-and-warmup',
  interpretation: 'three-cycle-descriptive-isolate-byte-change-only' })
export const gameplayThreeCycleHeapLimits = Object.freeze([
  'Three complete same-input-recipe workloads are not identical observed work: turns, frames, target, camera and query differences are retained.',
  'Three post-workload samples describe finite isolate-byte change across two public restarts, not a plateau, leak, memory reduction or bound.',
  'Each replacement Scene has an additional recorded live settling interval before its repeated pointer reset and warmup; preconditioning histories are not identical.',
  ...gameplayMatchedHeapLimits.slice(3),
])
export const gameplayThreeCycleResourceLimits = Object.freeze([
  'Two same-document public Restart Level episodes between three complete unchanged gameplay workloads; not a leak slope, long-session plateau, heap/RSS reduction or memory cap.',
  ...gameplayHeapResourceLimits.slice(1),
])
export const captureGameplayThreeCycleHeapSample = options => captureHeapSample(options, gameplayThreeCycleHeapPolicy)
export function summarizeGameplayThreeCycleWorkload(cycles) {
  assert.deepEqual(cycles.map(cycle => cycle.id), ['cycle-1', 'cycle-2', 'cycle-3'])
  return { cycle2MinusCycle1: summarizeGameplayMatchedWorkload(cycles.slice(0, 2)),
    cycle3MinusCycle2: summarizeGameplayMatchedWorkload(cycles.slice(1, 3)) }
}
export function validateGameplayThreeCycleHeapProbe(probe, resources, cycles) {
  assert.equal(probe.version, 3); assert.equal(probe.status, 'passed-three-cycle-descriptive-observations')
  assert.deepEqual(probe.policy, gameplayThreeCycleHeapPolicy); assert.deepEqual(probe.limits, gameplayThreeCycleHeapLimits)
  assert.equal(probe.sessionDetached, true)
  assert.deepEqual(probe.samples.map(sample => sample.boundary), gameplayThreeCycleHeapPolicy.boundaries)
  assert.deepEqual(cycles.map(cycle => cycle.id), ['cycle-1', 'cycle-2', 'cycle-3'])
  assert.equal(resources.restart, undefined)
  assert.deepEqual(resources.restarts.map(restart => [restart.fromCycle, restart.toCycle]),
    [['cycle-1', 'cycle-2'], ['cycle-2', 'cycle-3']])
  assert.equal(new Set(probe.samples.map(sample => sample.before.sceneUuid)).size, 3)
  for (const [index, sample] of probe.samples.entries()) {
    assertHeapSample(sample, gameplayThreeCycleHeapPolicy)
    const endpoint = cycles[index].resources.afterWorkload
    assert.equal(sample.before.sceneUuid, endpoint.sceneUuid)
    assert.equal(sample.before.timeOriginUnixMs, endpoint.timeOriginUnixMs)
    assert.ok(sample.before.timestampMs >= endpoint.timestampMs && sample.before.turn >= endpoint.turn)
    assert.equal(sample.isolateBefore, probe.samples[0].isolateBefore)
    assert.equal(sample.before.timeOriginUnixMs, probe.samples[0].before.timeOriginUnixMs)
    if (index) {
      const previous = probe.samples[index - 1], restart = resources.restarts[index - 1]
      assert.equal(sample.before.sceneUuid, restart.settled.sceneUuid)
      assert.ok(previous.after.timestampMs < restart.after.timestampMs)
      assert.ok(cycles[index].resources.beforeWarmup.timestampMs >= restart.settled.timestampMs)
      assert.ok(cycles[index].resources.beforeWarmup.turn >= restart.settled.turn)
      assert.ok(sample.timing.startedMs >= previous.timing.endedMs)
    }
  }
  const delta = (before, after) => Object.fromEntries(gameplayHeapPolicy.fields.map(key =>
    [key, probe.samples[after].bytes[key] - probe.samples[before].bytes[key]]))
  return { capabilityVerified: true, threeCycleProtocolVerified: true, sampleCount: 3, scope: gameplayHeapPolicy.scope,
    interpretation: gameplayThreeCycleProtocol.interpretation,
    cycle2MinusCycle1Bytes: delta(0, 1), cycle3MinusCycle2Bytes: delta(1, 2), cycle3MinusCycle1Bytes: delta(0, 2) }
}
