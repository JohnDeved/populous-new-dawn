import assert from 'node:assert/strict'
import { ordinaryM2Budget as budget } from './scenario-policy.mjs'

// NEW functional admission, not a latency SLA. This owner starts before context
// acquisition and retains the same absolute deadline through every owned close.
export function createM2Admission({ deadlineAt, signal, onUpdate = () => {},
  now = () => performance.now(), wallNow = Date.now, schedule = setTimeout, cancel = clearTimeout }) {
  assert.ok(Number.isFinite(deadlineAt), 'An existing absolute host deadline is required')
  const started = now(), allowance = Math.min(budget.totalMs, deadlineAt - wallNow())
  const deadline = started + allowance
  const report = { version: 1, status: 'running', budget, allowanceMs: allowance,
    phases: [], resources: [], closes: [], cleanupErrors: [], persistenceErrors: [] }
  const owned = []
  let failure, disposed = false, shutdownStarted = false, phaseTimer, phaseDeadline
  let rejectExpiry
  const expired = new Promise((_, reject) => { rejectExpiry = reject })
  void expired.catch(() => {})
  const elapsed = () => now() - started
  const fail = error => { failure ??= error; report.status = 'failed'; report.failure = String(failure); return failure }
  const publish = () => {
    try { onUpdate(report) }
    catch (error) { report.persistenceErrors.push(String(error)); fail(error) }
  }
  const trackClose = entry => {
    if (entry.closing) return entry.closing
    const record = { kind: entry.record.kind, status: 'pending', startedMs: elapsed() }
    report.closes.push(record)
    let closing
    try { closing = entry.close(entry.resource) } catch (error) { closing = Promise.reject(error) }
    entry.closing = Promise.resolve(closing).then(() => {
      record.status = 'closed'; record.finishedMs = elapsed(); publish()
    }, error => {
      record.status = 'failed'; record.finishedMs = elapsed(); record.error = String(error)
      report.cleanupErrors.push(String(error)); fail(error); publish(); throw error
    })
    void entry.closing.catch(() => {})
    publish(); return entry.closing
  }
  const shutdown = error => {
    fail(error); rejectExpiry(failure)
    // Primary input failure must not suppress subsequent deadline cancellation.
    if (!shutdownStarted) {
      shutdownStarted = true
      for (const entry of owned) trackClose(entry)
    }
    publish()
  }
  const expire = scope => {
    if (disposed) return failure
    const error = Object.assign(new Error(`Ordinary M2 ${scope} deadline exceeded`), { code: 'M2_ADMISSION_TIMEOUT' })
    if (!report.timedOut) { report.timedOut = scope; report.expiredMs = elapsed(); report.timeoutFailure = String(error) }
    shutdown(error); return failure
  }
  const abort = () => shutdown(signal.reason ?? new Error('Ordinary M2 host aborted'))
  const deadlines = () => {
    const at = now()
    if (at >= deadline) throw expire('total')
    if (at >= phaseDeadline) throw expire(report.phases.at(-1).name)
    return at
  }
  const check = () => {
    if (signal?.aborted) abort()
    assert.equal(disposed, false, 'Ordinary M2 admission is closed')
    const at = deadlines()
    if (failure) throw failure
    return deadline - at
  }
  const wait = async promise => {
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
      const entry = { record, resource, close }; owned.push(entry)
      try { active(); record.status = 'acquired'; publish(); return resource }
      catch (error) {
        record.status = 'late-cleanup-pending'; record.lateCloseAttempted = true
        try { await trackClose(entry); record.status = 'late-closed' }
        catch (cleanup) { record.status = 'late-close-failed'; record.cleanupError = String(cleanup) }
        publish(); throw fail(error)
      }
    }, error => {
      record.status = 'failed'; record.error = String(error); fail(error); publish(); throw error
    })
    publish(); return wait(creation)
  }
  const cleanup = async () => {
    // Start every close before awaiting one. No grace interval and no discarded
    // late rejection: settled handlers persist even after bounded return/dispose.
    const operations = owned.map(trackClose)
    try {
      if (disposed) throw failure ?? new Error('Ordinary M2 admission is closed')
      deadlines()
      await Promise.race([Promise.all(operations.map(p => p.catch(() => {}))), expired])
      deadlines()
    } catch (error) { fail(error) }
    publish()
    return report.closes.every(r => r.status === 'closed') && !report.timedOut &&
      report.resources.every(r => r.status === 'acquired') && report.cleanupErrors.length === 0
  }
  const armPhase = (name, allowanceMs) => {
    phaseDeadline = Math.min(deadline, now() + allowanceMs)
    const phase = { name, status: 'running', startedMs: elapsed(), deadlineMs: phaseDeadline - started }
    report.phases.push(phase)
    phaseTimer = schedule(() => { if (phase.status === 'running') expire(name) }, Math.max(0, phaseDeadline - now()))
    publish()
  }
  const beginFunctional = evidence => {
    check()
    assert.equal(report.phases.length, 1, 'There is exactly one setup-to-functional transition')
    const phase = report.phases[0]
    assert.equal(phase.name, 'setup'); assert.equal(phase.status, 'running')
    assert.equal(evidence.loadBoundaryMatched, true); assert.equal(evidence.introductionReady, true)
    assert.equal(evidence.compactViewportReady, true)
    assert.equal(evidence.before?.level, 2); assert.equal(evidence.before.paused, true); assert.equal(evidence.before.sameScene, true)
    assert.equal(evidence.restoredPopup?.open, true)
    assert.match(evidence.restoredPopup.serial, /^\d+$/)
    assert.equal(evidence.campaignPopup?.initiallyOpen, true)
    assert.equal(evidence.campaignPopup.serial, evidence.restoredPopup.serial, 'Current sole owner is the exact publicly restored authored record')
    phase.status = 'passed'; phase.finishedMs = elapsed()
    phase.evidence = { loadBoundaryMatched: true, introductionReady: true, compactViewportReady: true,
      before: { level: evidence.before.level, paused: evidence.before.paused, sameScene: evidence.before.sameScene },
      restoredPopup: { ...evidence.restoredPopup }, campaignPopup: { ...evidence.campaignPopup } }
    cancel(phaseTimer); armPhase('functional', budget.functionalMs)
  }
  const dispose = () => {
    cancel(totalTimer); cancel(phaseTimer); signal?.removeEventListener('abort', abort); disposed = true
  }
  const complete = result => {
    try {
    check()
    assert.equal(report.phases.length, 2); assert.equal(report.phases[1].name, 'functional')
    assert.equal(result.status, 'passed'); assert.equal(result.contextClosed, true)
    assert.deepEqual(result.layouts.map(s => s.viewport), [[640, 480], [900, 360], [1280, 720], [1440, 1000]])
    assert.deepEqual(result.exports.map(e => [e.keyboard, e.viewport.width]), [[false, 640], [true, 1280]])
    assert.equal(result.resetWindow, '0 samples')
    assert.ok(result.resumed?.turn > result.before.turn); assert.equal(result.resumed.paused, false)
    assert.equal(result.menu?.sameScene, true); assert.equal(result.returned?.sameScene, true)
    assert.equal(result.returned.level, 2); assert.equal(result.returned.paused, false)
    const stages = result.stages.map(s => s.name)
    for (const name of ['f8-reset-matched', 'resumed', 'menu-returned']) assert.ok(stages.includes(name), `${name} cannot be omitted`)
    assert.deepEqual(result.errors, []); assert.deepEqual(report.cleanupErrors, []); assert.deepEqual(report.persistenceErrors, [])
    assert.ok(report.resources.length > 0 && report.resources.every(r => r.status === 'acquired'))
    assert.equal(report.closes.length, owned.length)
    assert.ok(report.closes.every(r => r.status === 'closed'), 'Every owned resource must settle successfully')
    report.phases[1].status = 'passed'; report.phases[1].finishedMs = elapsed()
    report.status = 'passed'; report.finishedMs = elapsed(); publish(); check(); dispose()
    } catch (error) { fail(error); publish(); throw failure }
  }
  const totalTimer = schedule(() => expire('total'), Math.max(0, allowance))
  armPhase('setup', budget.setupMs)
  signal?.addEventListener('abort', abort, { once: true })
  return { report, check, wait, acquire, fail, cleanup, beginFunctional, complete, dispose }
}
