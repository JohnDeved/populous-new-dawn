import assert from 'node:assert/strict'

export const shieldEpisodeLimitMs = 45000
export const shieldOuterReserveMs = 10000

// A single inclusive deadline, including admission, context creation, retention
// and closure. The shared runner still owns its original wall-clock deadline.
// Injected clocks/contexts in the focused tests exercise hangs without Chromium.
export async function runShieldEpisode({
  browser, deadlineAt, report, save, perform,
  now = () => performance.now(), wallNow = Date.now,
  schedule = setTimeout, cancel = clearTimeout,
}) {
  const started = now()
  report.budget = { capMs: shieldEpisodeLimitMs, outerReserveMs: shieldOuterReserveMs,
    runnerDeadlineAt: deadlineAt, remainingAtAdmissionMs: deadlineAt - wallNow(),
    startedMonotonicMs: started, deadlineMonotonicMs: started + shieldEpisodeLimitMs }
  report.cleanup = { contextCreated: false, closeRequested: false, contextClosed: false }
  report.status = 'running'
  const elapsed = () => now() - started
  if (!Number.isFinite(deadlineAt) ||
      report.budget.remainingAtAdmissionMs < shieldEpisodeLimitMs + shieldOuterReserveMs) {
    report.status = 'failed'
    report.admission = 'failed'
    report.error = 'Shield requires at least 55,000 ms remaining before context creation'
    report.cleanup.notCreated = true
    report.budget.elapsedMs = elapsed()
    save()
    throw Error(report.error)
  }
  report.admission = 'admitted'
  let context, closePromise, expired = false, finished = false, failure, timer
  const close = () => {
    if (!context || closePromise) return closePromise
    report.cleanup.closeRequested = true
    report.cleanup.closeRequestedElapsedMs = elapsed()
    closePromise = Promise.resolve().then(() => context.close()).then(() => {
      report.cleanup.contextClosed = true
      report.cleanup.closedElapsedMs = elapsed()
      report.cleanup.closedWithinBudget = elapsed() <= shieldEpisodeLimitMs
      save()
    }, error => {
      report.cleanup.error = String(error)
      save()
      throw error
    })
    // Late-created contexts still have one closure owner after this function
    // has returned its failure. Never convert a late cleanup into a pass.
    void closePromise.catch(() => {})
    return closePromise
  }
  const timeout = new Promise((_, reject) => {
    timer = schedule(() => {
      expired = true
      report.timedOut = true
      report.status = 'failed'
      report.budget.expiredElapsedMs = elapsed()
      void close()
      save()
      reject(Error('Shield inclusive 45,000 ms deadline exceeded'))
    }, Math.max(0, shieldEpisodeLimitMs - elapsed()))
  })
  const remaining = () => {
    const left = shieldEpisodeLimitMs - elapsed()
    assert.ok(!expired && left > 0, 'Shield inclusive deadline exhausted')
    return left
  }
  const step = async (label, operation) => {
    remaining()
    const record = { label, startedElapsedMs: elapsed() }
    report.steps ??= []
    report.steps.push(record)
    save()
    const result = await Promise.race([Promise.resolve().then(operation), timeout])
    remaining()
    record.completedElapsedMs = elapsed()
    save()
    return result
  }
  save()
  try {
    const creation = Promise.resolve().then(() => browser.newContext({
      viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1,
    })).then(value => {
      context = value
      report.cleanup.contextCreated = true
      report.cleanup.createdElapsedMs = elapsed()
      if (expired || finished) {
        report.cleanup.lateCreation = true
        void close()
      }
      save()
      return value
    })
    await step('create fresh context', () => creation)
    await step('Shield input and visual witness', () => perform({ context, step, remaining }))
  } catch (error) {
    failure = error
    report.error = String(error)
  } finally {
    finished = true
    if (context) {
      try {
        await Promise.race([close(), timeout])
      } catch (error) {
        failure ??= error
        report.error ??= String(error)
      }
    } else report.cleanup.creationPendingOrFailed = true
    cancel(timer)
    report.budget.elapsedMs = elapsed()
    report.status = failure || report.timedOut || !report.cleanup.contextClosed ||
      !report.cleanup.closedWithinBudget || report.errors?.length ||
      report.budget.elapsedMs >= shieldEpisodeLimitMs ? 'failed' : 'passed'
    save()
    // A synchronous receipt write can consume the remaining time while the
    // event loop has not yet delivered its timeout callback. Measure it too.
    // Failure retention may extend past the cap; acceptance may not.
    const retainedElapsedMs = elapsed()
    if (retainedElapsedMs >= shieldEpisodeLimitMs) {
      report.status = 'failed'
      report.timedOut = true
      report.error ??= 'Shield final receipt retention exceeded its inclusive deadline'
      report.budget.elapsedMs = retainedElapsedMs
      save()
    }
  }
  assert.equal(report.status, 'passed', `Shield episode failed: ${report.error ?? 'see receipt'}`)
  return report
}
