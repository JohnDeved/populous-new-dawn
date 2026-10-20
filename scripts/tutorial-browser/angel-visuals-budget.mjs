export const angelVisualBudgetMs = Object.freeze({ episode: 50000, admission: 60000, outerReserve: 10000 })

// Admission is all-or-nothing. One absolute deadline includes late context
// creation, fixture authoring, retention and closure; never renew it per phase.
export async function withAngelVisualContext({ browser, deadlineAt, report, save, operation, clock = {} }) {
  const now = clock.now ?? (() => performance.now()), wallNow = clock.wallNow ?? Date.now,
    schedule = clock.schedule ?? setTimeout, cancel = clock.cancel ?? clearTimeout,
    started = now(), remaining = deadlineAt - wallNow()
  report.budget = { ...angelVisualBudgetMs, outerDeadlineAt: deadlineAt, remainingAtAdmissionMs: remaining }
  if (!Number.isFinite(deadlineAt) || remaining < angelVisualBudgetMs.admission) {
    report.status = 'failed'; report.admission = 'insufficient-remaining-budget'; save()
    throw Error('Angel requires at least 60 seconds remaining; omission is not a passing witness')
  }
  report.admission = 'admitted'; report.contextCreationPending = true
  const end = started + angelVisualBudgetMs.episode
  let context, closing, expired = false, rejectDeadline
  const deadline = new Promise((_, reject) => { rejectDeadline = reject })
  const timeout = Error('Angel exceeded its single 50-second inclusive deadline')
  const close = () => {
    if (!context) return Promise.resolve()
    closing ??= Promise.resolve().then(() => context.close()).then(() => {
      report.contextClosed = true; report.cleanupPending = false; save()
    }, error => { report.cleanupFailure = String(error); save(); throw error })
    return closing
  }
  const expire = () => {
    if (expired) return
    expired = true; report.timedOut = true
    report.cleanupPending = report.contextCreationPending || !report.contextClosed
    void close().catch(() => {})
    rejectDeadline(timeout)
  }
  const check = () => {
    if (now() >= end || wallNow() >= deadlineAt - angelVisualBudgetMs.outerReserve) expire()
    if (expired) throw timeout
  }
  const timer = schedule(expire, angelVisualBudgetMs.episode)
  try {
    const created = Promise.resolve().then(() => {
      check()
      return browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
    }).then(value => {
      context = value; report.contextCreationPending = false
      if (expired || now() >= end) { expire(); void close().catch(() => {}); throw timeout }
      return value
    }, error => { report.contextCreationPending = false; report.cleanupPending = false; save(); throw error })
    await Promise.race([created, deadline]); check()
    await Promise.race([Promise.resolve().then(() => operation(context, check)), deadline]); check()
    await Promise.race([close(), deadline]); check()
    report.status = 'passed'
  } catch (error) {
    report.status = 'failed'; report.failure = String(error)
    if (!expired) {
      try { await Promise.race([close(), deadline]); check() }
      catch (cleanup) { report.cleanupFailure ??= String(cleanup) }
    }
    throw error
  } finally {
    cancel(timer); report.elapsedMs = now() - started; save()
  }
}
