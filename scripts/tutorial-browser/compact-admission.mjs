import assert from 'node:assert/strict'
import { compactAggregateBudget as budget } from './scenario-policy.mjs'

// New functional admission policy, not a latency or rendering-performance SLA.
// A timer wakes cancellation; monotonic checks make late success impossible.
export function createCompactAdmission({ deadlineAt, onExpire, signal, onUpdate = () => {},
  now = () => performance.now(), wallNow = Date.now, schedule = setTimeout, cancel = clearTimeout }) {
  assert.ok(Number.isFinite(deadlineAt), 'An absolute host deadline is required')
  const started = now(), allowance = Math.min(budget.totalBrowserMs, deadlineAt - wallNow())
  const aggregateDeadline = started + allowance
  const report = { version: 1, status: 'running', budget, allowanceMs: allowance,
    episodes: [], resources: [], closes: [], cleanupErrors: [], persistenceErrors: [] }
  let failure, disposed = false, closeRequested = false, phaseTimer, compactTimer, compactDeadline, phaseDeadline
  let rejectExpiry
  const expired = new Promise((_, reject) => { rejectExpiry = reject })
  void expired.catch(() => {})
  const elapsed = () => now() - started
  const fail = error => { failure ??= error; report.status = 'failed'; report.failure = String(failure); return failure }
  const publish = () => {
    try { onUpdate(report) }
    catch (error) { report.persistenceErrors.push(String(error)); fail(error) }
  }
  const cleanupFailed = error => { report.cleanupErrors.push(String(error)); return fail(error) }
  const trackClose = (name, close) => {
    const record = { name, status: 'pending', startedMs: elapsed() }; report.closes.push(record)
    let closing
    try { closing = close() } catch (error) { closing = Promise.reject(error) }
    const settled = Promise.resolve(closing).then(() => {
      record.status = 'closed'; record.finishedMs = elapsed(); publish()
    }, error => {
      record.status = 'failed'; record.error = String(error); record.finishedMs = elapsed()
      cleanupFailed(error); publish(); throw error
    })
    void settled.catch(() => {})
    publish()
    return { record, settled }
  }
  const shutdown = error => {
    fail(error); rejectExpiry(failure)
    if (closeRequested) return
    closeRequested = true
    trackClose('deadline-browser', () => onExpire(error))
  }
  const expire = scope => {
    if (disposed) return failure
    const error = Object.assign(new Error(`Compact ${scope} deadline exceeded`), { code: 'COMPACT_ADMISSION_TIMEOUT' })
    if (!report.timedOut) { report.timedOut = scope; report.expiredMs = elapsed(); report.timeoutFailure = String(error) }
    shutdown(error)
    return failure
  }
  const abort = () => shutdown(signal.reason ?? new Error('Compact aggregate aborted'))
  const deadlines = () => {
    const at = now()
    if (at >= aggregateDeadline) throw expire('aggregate')
    if (compactDeadline !== undefined && at >= compactDeadline) throw expire('episode')
    if (phaseDeadline !== undefined && at >= phaseDeadline) throw expire(report.episodes[0].phases.at(-1).name)
    return at
  }
  const check = () => {
    if (signal?.aborted) abort()
    assert.equal(disposed, false, 'Compact admission is closed')
    const at = deadlines()
    if (failure) throw failure
    return aggregateDeadline - at
  }
  const wait = async promise => {
    // Observe an already-started operation even if the entry check rejects.
    const observed = Promise.resolve(promise); void observed.catch(() => {})
    check()
    const value = await Promise.race([observed, expired])
    check(); return value
  }
  const acquire = async (kind, create, close, active = check) => {
    active()
    const record = { kind, status: 'pending', startedMs: elapsed() }; report.resources.push(record)
    const creation = Promise.resolve().then(() => { active(); return create() }).then(async resource => {
      record.createdMs = elapsed()
      try { active(); record.status = 'acquired'; return resource } catch (error) {
        record.status = 'late-cleanup-pending'; record.lateCloseAttempted = true
        const closing = trackClose(`late-${kind}`, () => close(resource))
        try { await closing.settled; record.lateClosed = true; record.status = 'late-closed' }
        catch (cleanup) { record.cleanupError = String(cleanup); record.status = 'late-close-failed' }
        publish(); throw fail(error)
      }
    }, error => {
      record.status = 'failed'; record.error = String(error); fail(error); publish(); throw error
    })
    return wait(creation)
  }
  const waitCleanup = async promise => {
    // Cleanup is allowed after a primary failure, but never receives extra time.
    // Its actual rejection is independently retained by trackClose's handler.
    if (disposed) throw failure ?? new Error('Compact admission is closed')
    deadlines()
    const result = await Promise.race([promise, expired])
    deadlines(); return result
  }
  const close = async (name, resource) => {
    const operation = trackClose(name, () => resource.close())
    await waitCleanup(operation.settled)
  }
  const armPhase = (name, allowanceMs) => {
    phaseDeadline = Math.min(compactDeadline, now() + allowanceMs)
    const phase = { name, startedMs: elapsed(), deadlineMs: phaseDeadline - started, status: 'running' }
    report.episodes[0].phases.push(phase)
    phaseTimer = schedule(() => {
      if (phase.status === 'running') expire(name)
    }, Math.max(0, phaseDeadline - now()))
  }
  const beginCompact = () => {
    check(); assert.deepEqual(report.episodes, [])
    compactDeadline = Math.min(aggregateDeadline, now() + budget.compactMs)
    report.episodes.push({ name: 'compact', status: 'running', startedMs: elapsed(), deadlineMs: compactDeadline - started, phases: [] })
    compactTimer = schedule(() => {
      if (report.episodes[0].status === 'running') expire('episode')
    }, Math.max(0, compactDeadline - now()))
    armPhase('preparation', budget.preparationMs)
  }
  const beginLayouts = evidence => {
    check()
    const episode = report.episodes[0], phase = episode?.phases.at(-1)
    assert.equal(episode?.status, 'running'); assert.equal(phase?.name, 'preparation'); assert.equal(phase.status, 'running')
    assert.equal(evidence.loadBoundaryMatched, true)
    assert.equal(evidence.introductionReady, true)
    assert.equal(evidence.compactViewportReady, true)
    assert.equal(evidence.before?.level, 2); assert.equal(evidence.before.paused, true); assert.equal(evidence.before.sameScene, true)
    assert.equal(evidence.popupRestored, true, 'The same retained authored popup must be publicly restored')
    assert.match(evidence.popupSerial, /^\d+$/)
    phase.status = 'passed'; phase.finishedMs = elapsed(); phase.evidence = evidence
    cancel(phaseTimer)
    armPhase('layouts', budget.layoutsMs)
  }
  const finishCompact = result => {
    check()
    const episode = report.episodes[0], phase = episode?.phases.at(-1)
    assert.equal(phase?.name, 'layouts'); assert.equal(phase.status, 'running')
    assert.equal(result.status, 'passed'); assert.equal(result.contextClosed, true)
    assert.deepEqual(result.compactMessages.cases.map(c => [c.preference, ...c.viewport]), [
      ['4', 900, 360], ['4', 640, 480], ['auto', 900, 360], ['auto', 640, 480],
    ])
    for (const sample of result.compactMessages.cases) assert.ok(sample.restored, 'Every complete F8-off restoration is required')
    phase.status = 'passed'; phase.finishedMs = elapsed(); episode.status = 'passed'; episode.finishedMs = elapsed()
    cancel(phaseTimer); cancel(compactTimer); phaseDeadline = compactDeadline = undefined
  }
  const finishCompanion = (name, result) => {
    check()
    assert.equal(report.episodes.at(-1)?.status, 'passed')
    assert.equal(name, report.episodes.length === 1 ? 'picking' : report.episodes.length === 2 ? 'hypnotise' : null)
    assert.equal(result.status, 'passed'); assert.equal(result.contextClosed, true)
    if (name === 'hypnotise') assert.ok(Number.isFinite(result.capMs) && result.capMs > 0 && result.capMs <= budget.hypnotiseMs,
      'Hypnotise retains its 75s maximum clipped by the existing outer deadline')
    report.episodes.push({ name, status: 'passed', finishedMs: elapsed() })
  }
  const cleanup = async resources => {
    // Start every close before awaiting one. A rejecting or stalled first close
    // cannot suppress the remaining cleanup, and no cleanup grace is granted.
    const operations = Object.entries(resources).filter(([, resource]) => resource)
      .map(([name, resource]) => trackClose(name, () => resource.close()))
    report.cleanup = operations.map(operation => operation.record)
    try { await waitCleanup(Promise.all(operations.map(operation => operation.settled.catch(() => {})))) }
    catch (error) { fail(error) }
    return report.cleanup.every(record => record.status === 'closed') && !report.timedOut
  }
  const aggregateTimer = schedule(() => expire('aggregate'), Math.max(0, allowance))
  signal?.addEventListener('abort', abort, { once: true })
  const dispose = () => {
    cancel(aggregateTimer); cancel(phaseTimer); cancel(compactTimer)
    signal?.removeEventListener('abort', abort); disposed = true
  }
  return { report, check, wait, acquire, beginCompact, beginLayouts, finishCompact, finishCompanion, fail, cleanupFailed, close, cleanup, dispose,
    complete() {
      check()
      assert.deepEqual(report.episodes.map(e => [e.name, e.status]), [['compact', 'passed'], ['picking', 'passed'], ['hypnotise', 'passed']])
      assert.deepEqual(report.cleanupErrors, []); assert.deepEqual(report.persistenceErrors, [])
      assert.ok(report.cleanup?.every(r => r.status === 'closed'))
      assert.ok(report.closes.every(r => r.status === 'closed'), 'No pending or failed owned cleanup can pass')
      assert.ok(report.resources.every(r => r.status === 'acquired'), 'No pending or late acquisition can pass')
      report.finishedMs = elapsed(); report.status = 'passed'; dispose()
    },
  }
}
