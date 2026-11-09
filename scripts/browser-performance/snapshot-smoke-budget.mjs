import assert from 'node:assert/strict'
import { snapshotSmokeBudget } from '../tutorial-browser/scenario-policy.mjs'

// One attempt per independently admitted context, never a reset within a phase.
// A timeout closes the owning browser and is terminal for the whole smoke.
export function createSnapshotEpisodeBudget({ ledger, expire, save = () => {},
  now = () => performance.now(), schedule = setTimeout, cancel = clearTimeout }) {
  assert.equal(typeof expire, 'function')
  const episodes = ledger.episodes = []
  ledger.policy = snapshotSmokeBudget; ledger.totalEpisodeElapsedMs = 0
  let active = false, terminal = false
  return async function runEpisode(name, operation) {
    assert.equal(active, false, 'Snapshot episodes must be sequential')
    assert.equal(terminal, false, 'Timed-out snapshot smoke cannot continue')
    assert.ok(episodes.length < snapshotSmokeBudget.maxEpisodes, 'Snapshot episode count exhausted')
    assert.equal(name, ['world', 'recovery'][episodes.length], 'Each snapshot episode runs exactly once in fixed order')
    const remaining = snapshotSmokeBudget.totalBrowserMs - ledger.totalEpisodeElapsedMs
    assert.ok(remaining > 0, 'Snapshot aggregate browser allowance exhausted')
    const record = { name, status: 'running', startedAtMs: now(),
      capMs: Math.min(snapshotSmokeBudget.episodeMs, remaining), remainingTotalAtStartMs: remaining }
    episodes.push(record); active = true; save()
    let timeout, expired = false, closing, rejectDeadline
    const error = new Error(`Snapshot ${name} episode deadline exceeded (${record.capMs} ms)`)
    error.code = 'SNAPSHOT_EPISODE_TIMEOUT'
    const deadline = new Promise((resolve, reject) => { rejectDeadline = reject })
    const expireOnce = () => {
      if (expired) return
      expired = true; terminal = true; record.timedOut = true; record.timeoutAtMs = now(); save()
      // Start closure before rejecting the race. Late operation completion can
      // never turn this episode into a pass or start the next context.
      closing = Promise.resolve().then(expire).catch(failure => { record.expirationCleanupFailure = String(failure) })
      rejectDeadline(error)
    }
    timeout = schedule(expireOnce, record.capMs)
    try {
      const result = await Promise.race([Promise.resolve().then(() => {
        if (expired) throw error
        return operation()
      }), deadline])
      // Synchronous work can delay timer dispatch. Account for the actual
      // monotonic elapsed interval, rather than accepting a delayed callback.
      record.operationEndedAtMs = now()
      if (record.operationEndedAtMs - record.startedAtMs >= record.capMs) expireOnce()
      if (expired) throw error
      record.status = 'passed'; return result
    } catch (failure) {
      record.operationEndedAtMs ??= now()
      record.status = expired ? 'timed-out' : 'failed'
      record.failure = String(expired ? error : failure)
      throw expired ? error : failure
    } finally {
      cancel(timeout)
      if (closing) await closing
      record.endedAtMs = expired ? now() : record.operationEndedAtMs
      record.elapsedMs = record.endedAtMs - record.startedAtMs
      ledger.totalEpisodeElapsedMs += record.elapsedMs
      ledger.aggregateExceeded = ledger.totalEpisodeElapsedMs > snapshotSmokeBudget.totalBrowserMs
      active = false; save()
    }
  }
}
