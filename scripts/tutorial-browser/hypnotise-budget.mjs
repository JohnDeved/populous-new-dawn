import { hypnotiseLimitMs } from './hypnotise-observer.mjs'

// One absolute allowance covers context creation, the episode and closure.
// A context resolving after timeout is still owned and closed, never admitted.
export async function withHypnotiseContext(browser, report, save, operation, clock = {}) {
  const now = clock.now ?? (() => performance.now()),
    schedule = clock.schedule ?? setTimeout,
    cancel = clock.cancel ?? clearTimeout,
    started = now(),
    deadlineAt = started + hypnotiseLimitMs,
    timeoutError = Error('Hypnotise exceeded its 75s allowance')
  let context,
    closing,
    expired = false,
    rejectDeadline
  report.deadlineAt = deadlineAt
  report.contextCreationPending = true
  const deadline = new Promise((_, reject) => {
    rejectDeadline = reject
  })
  const close = () => {
    if (!context) return Promise.resolve()
    closing ??= Promise.resolve()
      .then(() => context.close())
      .then(
        () => {
          report.contextClosed = true
          report.cleanupPending = false
          save()
        },
        error => {
          report.cleanupFailure = String(error)
          save()
          throw error
        }
      )
    return closing
  }
  const expire = () => {
    if (expired) return
    expired = true
    report.timedOut = true
    report.cleanupPending = report.contextCreationPending || !report.contextClosed
    void close().catch(() => {})
    rejectDeadline(timeoutError)
  }
  const check = () => {
    if (now() >= deadlineAt) expire()
    if (expired) throw timeoutError
  }
  const timer = schedule(expire, hypnotiseLimitMs)
  try {
    const created = Promise.resolve()
      .then(() => {
        check()
        return browser.newContext({ viewport: { width: 960, height: 720 }, deviceScaleFactor: 1 })
      })
      .then(
        value => {
          context = value
          report.contextCreationPending = false
          if (expired || now() >= deadlineAt) {
            expire()
            void close().catch(() => {})
            throw timeoutError
          }
          return value
        },
        error => {
          report.contextCreationPending = false
          report.cleanupPending = false
          save()
          throw error
        }
      )
    await Promise.race([created, deadline])
    check()
    await Promise.race([
      Promise.resolve().then(() => {
        check()
        return operation(context)
      }),
      deadline,
    ])
    check()
    await Promise.race([close(), deadline])
    check()
    report.status = 'passed'
  } catch (error) {
    report.status = 'failed'
    report.failure = String(error)
    if (!expired) {
      try {
        await Promise.race([close(), deadline])
        check()
      } catch (cleanup) {
        report.cleanupFailure ??= String(cleanup)
      }
    }
    throw error
  } finally {
    cancel(timer)
    report.elapsedMs = now() - started
    save()
  }
}
