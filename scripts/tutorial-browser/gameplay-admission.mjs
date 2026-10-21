import assert from 'node:assert/strict'
import { gameplayFramePlan } from './gameplay-frame-evidence.mjs'
import { gameplayAggregateBudget } from './scenario-policy.mjs'

// One absolute aggregate and the original frame envelope. Timers are wakeups;
// monotonic checks, not timer delivery order, decide whether work was admitted.
export function createGameplayAdmission({ deadlineAt, expectedRevision, onExpire, signal,
  now = () => performance.now(), wallNow = Date.now, schedule = setTimeout, cancel = clearTimeout }) {
  assert.ok(Number.isFinite(deadlineAt), 'An absolute host deadline is required')
  const started = now(), allowance = Math.min(gameplayAggregateBudget.totalBrowserMs, deadlineAt - wallNow())
  const aggregateDeadline = started + allowance, frameDeadline = Math.min(aggregateDeadline, started + gameplayAggregateBudget.frameMs)
  const report = { version: 1, status: 'running', budget: gameplayAggregateBudget, allowanceMs: allowance,
    episodes: [{ name: 'frames', status: 'running', startedMs: 0 }], resources: [], cleanupErrors: [] }
  let failure, aggregateTimer, frameTimer, localCheck, closeRequested = false, disposed = false
  const elapsed = () => now() - started
  const stop = error => {
    failure ??= error
    report.status = 'failed'; report.failure = String(failure)
    return failure
  }
  const cleanupFailed = error => { report.cleanupErrors.push(String(error)); return stop(error) }
  const requestClose = error => {
    if (closeRequested) return
    closeRequested = true
    try { Promise.resolve(onExpire(error)).catch(cleanupFailed) }
    catch (cleanup) { cleanupFailed(cleanup) }
  }
  const expire = scope => {
    if (disposed || scope === 'frames' && report.episodes[0].status !== 'running') return failure
    const error = Object.assign(new Error(`Gameplay ${scope} deadline exceeded`), { code: 'GAMEPLAY_ADMISSION_TIMEOUT' })
    if (!report.timedOut) { report.timedOut = scope; report.expiredMs = elapsed(); report.timeoutFailure = String(error) }
    // A primary failure never cancels the independently required deadline
    // shutdown. It remains primary even when cleanup subsequently stalls.
    stop(error); requestClose(error)
    return failure
  }
  const abort = () => {
    const error = signal.reason ?? new Error('Gameplay aggregate aborted')
    stop(error); requestClose(error)
  }
  const withinDeadline = at => {
    if (at >= aggregateDeadline) throw expire('aggregate')
    if (report.episodes.at(-1).name === 'frames' && report.episodes.at(-1).status === 'running' && at >= frameDeadline)
      throw expire('frames')
  }
  const check = () => {
    if (signal?.aborted) abort()
    assert.equal(disposed, false, 'Gameplay admission is closed')
    withinDeadline(now())
    if (failure) throw failure
    try { localCheck?.() } catch (error) { throw stop(error) }
    const observed = now()
    withinDeadline(observed)
    return aggregateDeadline - observed
  }
  const acquire = async (kind, create, close, active = check) => {
    active()
    const record = { kind, episode: report.episodes.at(-1).name, startedMs: elapsed() }
    report.resources.push(record)
    let resource
    try {
      resource = await create(); record.createdMs = elapsed()
      active()
      return resource
    } catch (error) {
      stop(error)
      if (resource) {
        try { await close(resource); record.lateClosed = true }
        catch (cleanup) { record.cleanupError = String(cleanup); report.cleanupErrors.push(String(cleanup)) }
      }
      throw stop(error)
    }
  }
  const finishEpisode = (name, result) => {
    check()
    const record = report.episodes.at(-1)
    assert.equal(record.name, name); assert.equal(record.status, 'running')
    assert.equal(result?.status, 'passed', 'Every complete gameplay report is required')
    assert.equal(result.expectedRevision, expectedRevision, 'Exact episode build identity required')
    if (name === 'frames') {
      assert.deepEqual(result.measuredPhases, gameplayFramePlan.phases.map(p => p.name))
      assert.deepEqual(result.phases.map(p => [p.name, p.status]), gameplayFramePlan.phases.map(p => [p.name, 'passed']))
    }
    if (name !== 'frames') assert.equal(result.contextClosed, true, 'Companion context cleanup is required')
    if (name === 'melee') assert.equal(result.capMs, gameplayAggregateBudget.meleeMs)
    if (name === 'corpse') {
      assert.deepEqual(result.budgetCapsMs, { deathAndSave: gameplayAggregateBudget.corpseDeathMs, loadAndVerify: gameplayAggregateBudget.corpseLoadMs })
      assert.deepEqual(result.budgets.map(b => b.name), ['death-through-committed-save', 'load-reframe-resume-and-terminal-verification'])
      for (const b of result.budgets) {
        assert.equal(b.timedOut, undefined)
        assert.ok(Number.isFinite(b.completedElapsedMs) && b.completedElapsedMs < b.deadlineElapsedMs)
      }
      assert.ok(result.budgets[0].committedSave, 'Exact committed-save transition must be retained')
    }
    const remaining = check()
    record.status = 'passed'; record.finishedMs = allowance - remaining; record.remainingAggregateMs = remaining
    if (name === 'frames') cancel(frameTimer)
  }
  const begin = name => {
    check()
    const previous = report.episodes.at(-1)
    assert.equal(previous.status, 'passed')
    assert.equal(name, previous.name === 'frames' ? 'melee' : previous.name === 'melee' ? 'corpse' : null)
    report.episodes.push({ name, status: 'running', startedMs: elapsed() })
  }
  const dispose = () => {
    cancel(aggregateTimer); cancel(frameTimer); signal?.removeEventListener('abort', abort); disposed = true
  }
  signal?.addEventListener('abort', abort, { once: true })
  aggregateTimer = schedule(() => expire('aggregate'), Math.max(0, allowance))
  frameTimer = schedule(() => expire('frames'), Math.max(0, frameDeadline - started))
  return { report, check, acquire, begin, finishEpisode, fail: stop, cleanupFailed, dispose,
    setLocalCheck(checkLocal) { check(); assert.equal(localCheck, undefined); localCheck = checkLocal },
    clearLocalCheck() { localCheck = undefined },
    complete() {
      check()
      assert.deepEqual(report.episodes.map(({ name, status }) => [name, status]), [['frames', 'passed'], ['melee', 'passed'], ['corpse', 'passed']])
      assert.deepEqual(report.cleanupErrors, [])
      report.finishedMs = allowance - check(); report.status = 'passed'; dispose()
    },
  }
}

// Preserve the gameplay API; the dispatch facade is shared only by explicit
// functional-admission owners, never applied to unrelated browser scenarios.
export { guardBrowserAdmission as guardGameplayBrowser } from '../browser-admission-guard.mjs'

// Cleanup must attempt every owned resource, even after an earlier close rejects.
// The aggregate timer remains armed throughout; no cleanup grace is added.
export async function cleanupGameplayResources(admission, resources) {
  const records = admission.report.cleanup = []
  for (const [name, resource] of Object.entries(resources)) {
    if (!resource) continue
    const record = { name, status: 'running' }; records.push(record)
    try { await resource.close(); record.status = 'closed' }
    catch (error) { record.status = 'failed'; record.error = String(error); admission.cleanupFailed(error) }
  }
  return records.every(record => record.status === 'closed')
}
