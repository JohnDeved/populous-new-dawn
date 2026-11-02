// Passive Node-side building blocks, not an installed browser adapter.
// No input dispatch, browser process ownership, calibration or admission.
import assert from 'node:assert/strict'
import { ordinaryPointerRepeatContract as C } from './ordinary-pointer-repeat-contract.mjs'

export function assertOrdinaryPointerCallbackAck(expected, actual) {
  assert.ok(expected && actual, 'Missing callback acknowledgment')
  assert.ok(Number.isSafeInteger(expected.sequence) && expected.sequence >= 1 &&
    expected.sequence <= C.totalEvents, 'Invalid expected sequence')
  assert.ok(Number.isSafeInteger(expected.anchorSerial) && expected.anchorSerial >= 0 &&
    expected.anchorSerial < C.maximumRecorderFrames - 1, 'Invalid expected anchor')
  assert.match(expected.epoch, /^[a-f0-9]{64}$/)
  assert.ok(Number.isFinite(expected.anchorTimestampMs) && expected.anchorTimestampMs >= 0,
    'Invalid expected anchor timestamp')
  assert.equal(actual.epoch, expected.epoch, 'Recorder epoch changed')
  assert.equal(actual.sequence, expected.sequence, 'Wrong input acknowledgment')
  assert.equal(actual.anchorSerial, expected.anchorSerial, 'Wrong input anchor')
  assert.equal(actual.anchorTimestampMs, expected.anchorTimestampMs, 'Wrong anchor timestamp')
  assert.equal(actual.serial, expected.anchorSerial + 1, 'Not the exact first callback')
  // Consistency only. Does not establish truthful production capture or work.
  return Object.freeze({ attributed: true, comparisonEligible: false })
}

// Wrap the entire cohort once, never each event: moves must not renew its budget.
// Execute only in the out-of-page driver. The default timer is Node's wall timer;
// supplied scheduler is a test seam, never evidence of an actual watchdog.
// A blocked *driver* loop still needs separately owned process containment.
// Cancellation is a request, not proof of browser termination or listener cleanup.
export function ordinaryPointerWallWatchdog(operation, scheduler = {
  setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout,
  now: () => performance.now(),
}) {
  assert.equal(typeof operation, 'function')
  const controller = new AbortController()
  const started = scheduler.now()
  assert.ok(Number.isFinite(started) && started >= 0, 'Invalid driver clock')
  const deadline = started + C.maximumElapsedMs
  return new Promise((resolve, reject) => {
    let settled = false, timer, previousNow = started
    const clock = () => {
      const now = scheduler.now()
      assert.ok(Number.isFinite(now) && now >= previousNow, 'Invalid driver clock')
      previousNow = now
      return now
    }
    const terminal = outcome => {
      if (settled) return
      settled = true
      let timerCleanupFailed = false, timerCleanupError
      try { scheduler.clearTimeout(timer) } catch (error) { timerCleanupFailed = true; timerCleanupError = error }
      resolve(Object.freeze({ ...outcome, comparisonEligible: false, cleanupConfirmed: false,
        timerCleanupFailed, timerCleanupError }))
    }
    const expire = lateOutcome => {
      if (settled) return
      const error = new Error('Ordinary pointer driver wall deadline exceeded')
      // Claim terminal ownership before notifying potentially reentrant leaves.
      terminal({ status: 'timed-out', error, cancellationRequested: true, lateOutcome })
      // Owned cancellation listeners must not throw: EventTarget listener errors
      // can escape as uncaught exceptions. Browser/process cleanup is not owned here.
      controller.abort(error)
    }
    const finish = outcome => {
      if (settled) return
      try {
        if (clock() >= deadline) expire(outcome)
        else terminal(outcome)
      } catch (error) { terminal({ ...outcome, status: 'failed', error: outcome.status === 'failed' ? outcome.error : error,
        clockFailed: true, clockError: error }) }
    }
    const timeout = () => {
      if (settled) return
      try {
        const remaining = deadline - clock()
        if (remaining > 0) timer = scheduler.setTimeout(timeout, remaining)
        else expire(undefined)
      } catch (error) { terminal({ status: 'failed', error, cancellationRequested: false }) }
    }
    try { timer = scheduler.setTimeout(timeout, C.maximumElapsedMs) }
    catch (error) { reject(error); return }
    Promise.resolve().then(() => {
      if (settled) return
      if (clock() >= deadline) { expire(undefined); return }
      return operation(controller.signal)
    }).then(value => finish({ status: 'completed', value, cancellationRequested: false }),
      error => finish({ status: 'failed', error, cancellationRequested: false }))
  })
}
