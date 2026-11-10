import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'

// Both inputs are from the outer worker's host monotonic origin, not Date.now().
export function captureBudget(routeStartMs, outerDeadlineMs, signal) {
  const caseStartMs = performance.now()
  assert.ok(Number.isFinite(routeStartMs) && Number.isFinite(outerDeadlineMs))
  assert.ok(routeStartMs <= caseStartMs && outerDeadlineMs > caseStartMs)
  assert.ok(outerDeadlineMs <= routeStartMs + 180000)
  const deadlineMs = Math.min(caseStartMs + 75000, outerDeadlineMs)
  let last = caseStartMs, terminal = null
  const check = () => {
    const now = performance.now()
    if (now < last) terminal ??= 'Host monotonic clock moved backward'
    last = now
    if (signal?.aborted) terminal ??= 'Diagnostic aborted; input outcome may be unknown'
    if (now >= deadlineMs) terminal ??= 'Original diagnostic deadline exhausted'
    assert.equal(terminal, null)
    return deadlineMs - now
  }
  // Sample page time first. Calculate host remainder AFTER that RPC returns.
  // Anchoring remainder to the earlier sample conservatively removes latency.
  const pageOrigins = async page => {
    check()
    const sampledPageMs = await page.evaluate(() => performance.now())
    const remainingMs = check()
    assert.ok(Number.isFinite(sampledPageMs) && sampledPageMs >= 0)
    const hostSampledAt = deadlineMs - remainingMs
    const offset = sampledPageMs - hostSampledAt
    return Object.freeze({ routeStartMs: routeStartMs + offset,
      caseStartMs: caseStartMs + offset, launcherDeadlineMs: outerDeadlineMs + offset })
  }
  return Object.freeze({ routeStartMs, caseStartMs, deadlineMs, check, pageOrigins,
    fail(reason) { terminal ??= String(reason) } })
}
