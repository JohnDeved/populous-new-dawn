// A bounded wait is not process termination. The admitted external supervisor
// must still kill its owned worker/browser at the hard deadline.
export async function settleWithin(operation, timeoutMs) {
  let timer
  const pending = Promise.resolve().then(operation).then(
    value => ({ status: 'fulfilled', value }),
    error => ({ status: 'rejected', error: String(error) }),
  )
  try {
    return await Promise.race([pending, new Promise(resolve => {
      timer = setTimeout(() => resolve({ status: 'timed-out' }), timeoutMs)
    })])
  } finally { clearTimeout(timer) }
}

// The close attempt is independent of a renderer evaluation or route drain.
// Contexts created after timeout are closed before the worker may use them.
export function contextDeadline({ timeoutMs, onFailure, onCloseAttempt = () => {} }) {
  let context, closePromise, stopping = false, timer, rejectDeadline
  const expired = new Promise((_, reject) => { rejectDeadline = reject })
  void expired.catch(() => {})
  const close = (reason = 'explicit-cleanup') => {
    stopping = true
    if (!context) return Promise.resolve(false)
    if (!closePromise) {
      try { onCloseAttempt(reason) } catch { /* Diagnostics must never prevent independent closure. */ }
      closePromise = Promise.resolve().then(() => context.close({ reason })).then(() => true)
    }
    void closePromise.catch(error => onFailure(error))
    return closePromise
  }
  const abort = error => {
    onFailure(error); rejectDeadline(error); void close('deadline-or-abort')
  }
  timer = setTimeout(() => abort(Error('Modal acquisition exceeded its 60 second deadline')), timeoutMs)
  return {
    expired, close, abort,
    async create(create) {
      const acquired = await create()
      context = acquired
      if (stopping) { void close('late-context-after-cancellation'); throw Error('Late-created context closed after cancellation') }
      return acquired
    },
    guard() { if (stopping) throw Error('Modal acquisition cancelled') },
    cancelTimer() { clearTimeout(timer) },
  }
}
