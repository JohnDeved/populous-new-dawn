// An absolute deadline races every admitted operation, including context creation.
// It bounds this owner; a timed-out browser operation may still require outer teardown.
export function createDeadline(deadlineAt, now = Date.now) {
  if (!Number.isFinite(deadlineAt)) throw Error('Finite deadline required')
  let timer, expired = false
  const error = new Error('Owned Swamp episode deadline exceeded')
  error.code = 'OWNED_SWAMP_DEADLINE'
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => { expired = true; reject(error) }, Math.max(0, deadlineAt - now()))
  })
  // A deadline can expire between operations without becoming an unhandled rejection.
  void timeout.catch(() => {})
  return {
    async run(operation) {
      if (expired || now() >= deadlineAt) throw error
      const result = await Promise.race([Promise.resolve().then(operation), timeout])
      if (expired || now() >= deadlineAt) throw error
      return result
    },
    get expired() { return expired || now() >= deadlineAt },
    dispose() { clearTimeout(timer) },
  }
}
