import assert from 'node:assert/strict'

export const spySourceBudgetMs = 45000

// The caller retains the original M10 deadline. Admission never borrows more
// time, reduces coverage or resets either of the completed M10 phase receipts.
export function admitSpySourceEpisode({ deadlineAt, signal, now = Date.now() }) {
  signal.throwIfAborted()
  assert.ok(Number.isFinite(deadlineAt), 'Original browser deadline required')
  assert.ok(deadlineAt - now >= spySourceBudgetMs, 'Full 45-second Spy episode does not fit the retained browser deadline')
  return { startedAt: now, deadlineAt: now + spySourceBudgetMs, hostDeadlineAt: deadlineAt, capMs: spySourceBudgetMs }
}

export async function withSpySourceBrowser({ chromium, launch, signal, deadlineAt, report }, run) {
  const budget = admitSpySourceEpisode({ deadlineAt, signal })
  report.budget = budget
  let browser, closing, timer
  const close = () => browser ? (closing ??= browser.close()) : Promise.resolve()
  const onAbort = () => { void close().catch(error => { report.cleanupError = String(error) }) }
  signal.addEventListener('abort', onAbort, { once: true })
  timer = setTimeout(() => {
    report.timedOut = true
    onAbort()
  }, spySourceBudgetMs)
  try {
    // Playwright launch itself is bounded; a late resolution is still closed.
    browser = await chromium.launch({ ...launch, timeout: Math.max(1, budget.deadlineAt - Date.now()) })
    signal.throwIfAborted()
    assert.equal(report.timedOut, undefined, 'Spy deadline expired during launch')
    const result = await run(browser, budget)
    signal.throwIfAborted()
    return result
  } finally {
    try {
      let cleanupTimer
      try {
        await Promise.race([close(), new Promise((_, reject) => {
          cleanupTimer = setTimeout(() => reject(Error('Spy browser cleanup exceeded remaining budget')),
            Math.max(1, Math.min(10000, budget.deadlineAt - Date.now())))
        })])
      } finally { clearTimeout(cleanupTimer) }
      assert.equal(browser?.isConnected() ?? false, false, 'Owned Spy browser must be closed')
      report.cleanupVerified = true
    } finally {
      clearTimeout(timer)
      signal.removeEventListener('abort', onAbort)
      budget.endedAt = Date.now()
      budget.durationMs = budget.endedAt - budget.startedAt
    }
    assert.equal(report.timedOut, undefined, 'Spy episode exceeded its 45-second budget')
    assert.ok(budget.endedAt <= budget.deadlineAt && budget.endedAt <= deadlineAt,
      'Launch, episode and cleanup must all fit the unchanged budget')
  }
}
