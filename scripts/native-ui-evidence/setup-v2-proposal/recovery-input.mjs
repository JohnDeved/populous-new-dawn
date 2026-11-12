import assert from 'node:assert/strict'
import { prepareWorldInput } from './browser-world-input.mjs'
import { popupRejectedSpace, pressObservedSpace } from './browser-space-ownership.mjs'

export function pauseStartupReady(snapshot = false) {
  const world = window.testStore.getWorld()
  const action = !world.inputMask ? 'ready'
    : (world.inputMask & 64) && (world.flyby.flags & 0x51) === 0x11 ? 'skip' : false
  // Bounded observation only: a stable never-ready startup must leave evidence.
  // Keep trace failures outside the original readiness/exception contract.
  if (!snapshot && typeof document !== 'undefined') {
    try {
      const trace = window.__pauseStartupTrace ??= { count: 0, last: null }
      if (trace.count < 16) {
        const number = value => Number.isFinite(value) ? value : null
        const core = { action, inputMask: number(world.inputMask), flybyFlags: number(world.flyby.flags),
          paused: Boolean(world.paused), level: number(world.outcome?.level),
          levelStart: Array.isArray(world.levelStart) ? world.levelStart.slice(0, 8).map(site => number(site.phase)) : null }
        const state = { ...core, loading: document.querySelector('.loading-world')?.textContent?.slice(0, 120) ?? null,
          popupPresent: Boolean(document.querySelector('[data-native-campaign-popup]')),
          activeTag: document.activeElement?.tagName?.slice(0, 20) ?? null,
          dialogs: [...document.querySelectorAll('dialog[open],[role="dialog"]')].slice(0, 4)
            .map(node => ({ label: node.getAttribute('aria-label')?.slice(0, 60) ?? null, visible: node.getClientRects().length > 0 })),
          canvases: [...document.querySelectorAll('canvas')].slice(0, 3).map(node => ({ width: number(node.width), height: number(node.height) })) }
        let text = JSON.stringify(state)
        if (text.length > 2048) text = JSON.stringify({ ...core, domOmitted: true })
        if (text !== trace.last) {
          trace.last = text; trace.count++
          console.warn('NATIVE_STARTUP_STATE', text)
        }
      }
    } catch { /* Diagnostic errors must not change readiness or its deadline. */ }
  }
  return snapshot ? { action, paused: world.paused, inputMask: world.inputMask, flybyFlags: world.flyby.flags } : action
}

export function recoveryStateFromSpaceSnapshot(delivery) {
  assert.equal(delivery?.observationId, delivery?.witnessId, 'Fresh Space observation identity is required')
  assert.equal(typeof delivery?.witnessId, 'string')
  assert.equal(delivery.witnessPresent, true, 'A settled live passive witness is required')
  assert.ok(Array.isArray(delivery.records), 'Actual ownership records are required')
  const state = delivery.state
  assert.ok(state && typeof state.paused === 'boolean' && Number.isInteger(state.inputMask) && Number.isInteger(state.flybyFlags),
    'Fresh native state is required; no stale fallback')
  const action = !state.inputMask ? 'ready'
    : (state.inputMask & 64) && (state.flybyFlags & 0x51) === 0x11 ? 'skip' : false
  return { action, paused: state.paused, inputMask: state.inputMask, flybyFlags: state.flybyFlags }
}

export const recoveryInputContract = 'public-setup-then-response-v1'
export const recoveryRetryInputContract = 'public-setup-cumulative-response-v2'

// Default callers retain the original shared 2500ms preparation/input bound.
// Explicit setup callers may instead spend their EXISTING public UI
// allowance on initial popup/focus preparation, with a fresh <=2500ms response
// phase clipped to the SAME absolute action/episode deadline. See the contract
// note in engineering/recovery-input-budget.md. This is not a latency SLA.
export async function skipPauseIntroduction(page, {
  timeout = 2500, setupTimeout, deadlineAt, signal, trace = {}, popupRetryPreparation = false,
} = {}) {
  if (!Number.isFinite(timeout) || timeout <= 0) throw new RangeError('Invalid recovery input timeout')
  const separateSetup = setupTimeout !== undefined
  if (typeof popupRetryPreparation !== 'boolean' || (popupRetryPreparation && !separateSetup))
    throw new RangeError('Retry preparation accounting requires explicit public setup')
  if (separateSetup && (!Number.isFinite(setupTimeout) || setupTimeout <= 0 || !Number.isFinite(deadlineAt)))
    throw new RangeError('Public recovery setup requires its existing UI allowance and outer deadline')
  if (separateSetup && timeout > 2500) throw new RangeError('Recovery response cap cannot exceed 2500ms')
  const started = performance.now(),
    actionMs = separateSetup ? Math.min(setupTimeout, deadlineAt - Date.now()) : timeout,
    actionDeadline = started + actionMs
  const cancellation = new AbortController(), actionSignal = cancellation.signal
  let responseDeadline = separateSetup ? null : actionDeadline
  let responseStarted, retryPreparationMs = 0, retryCount = 0, responseWindow, pendingRetryPreparation
  const updateResponseEvidence = (now = performance.now()) => {
    if (!popupRetryPreparation) return
    const excluded = retryPreparationMs + (pendingRetryPreparation === undefined ? 0 : now - pendingRetryPreparation)
    trace.retryPreparationMs = excluded
    trace.responseSpentMs = responseStarted === undefined ? 0 : now - responseStarted - excluded
    trace.wallElapsedMs = now - started
  }
  Object.assign(trace, { phase: 'start', preparation: {}, completed: [], attempts: [],
    contract: popupRetryPreparation ? recoveryRetryInputContract : separateSetup ? recoveryInputContract : 'shared-input-v1',
    actionCapMs: actionMs, responseCapMs: timeout,
    ...(popupRetryPreparation ? { retryLimit: 1, retryCount: 0, retryPreparations: [], responseWindows: [] } : {}) })
  const timedOut = () => {
    updateResponseEvidence()
    return new Error(`Recovery introduction input timed out: ${JSON.stringify({ ...trace, elapsedMs: performance.now() - started })}`)
  }
  let closed = false, timer, deliveryError, rejectExpiry
  const remaining = () => {
    signal?.throwIfAborted()
    actionSignal.throwIfAborted()
    const budget = (responseDeadline ?? actionDeadline) - performance.now()
    if (closed || budget <= 0) {
      const error = deliveryError ?? timedOut(); cancellation.abort(error); throw error
    }
    return budget
  }
  const expiry = new Promise((_, reject) => { rejectExpiry = reject })
  const cancel = error => { closed = true; cancellation.abort(error); rejectExpiry(error) }
  const expire = () => cancel(deliveryError ?? timedOut())
  const aborted = () => cancel(signal.reason ?? new Error('Recovery input aborted'))
  const arm = () => {
    clearTimeout(timer)
    timer = setTimeout(expire, Math.max(0, (responseDeadline ?? actionDeadline) - performance.now()))
  }
  const phase = async (name, action) => {
    remaining()
    trace.phase = name
    const startedMs = performance.now() - started
    try { return await action() }
    finally { trace.completed.push({ phase: name, startedMs, finishedMs: performance.now() - started }) }
  }
  const prepare = () => phase('prepare-world-input', () =>
    prepareWorldInput(page, { timeout: remaining(), trace: trace.preparation, signal: actionSignal }))
  const run = async () => {
    if (separateSetup) {
      await prepare()
      remaining()
      trace.setupFinishedMs = performance.now() - started
      // Starts before the fresh native-state read, not merely before key dispatch.
      responseStarted = performance.now()
      responseDeadline = Math.min(actionDeadline, responseStarted + timeout)
      trace.responseStartedMs = responseStarted - started
      trace.responseDeadlineMs = responseDeadline - started
      if (popupRetryPreparation) {
        responseWindow = { startedMs: trace.responseStartedMs, deadlineMs: trace.responseDeadlineMs }
        trace.responseWindows.push(responseWindow)
      }
      arm()
    }
    let prepared = separateSetup
    for (;;) {
      // V1 retains its single wall-clock response deadline. V2 excludes only
      // this proven popup-rejection preparation, never a read/key/finalizer or
      // an unknown outcome, from ONE cumulative response budget.
      if (!prepared) {
        if (!popupRetryPreparation) await prepare()
        else {
          assert.equal(trace.attempts.at(-1)?.outcome, 'popup-owned-unchanged-retry')
          remaining()
          const priorDeadline = responseDeadline, preparationStarted = performance.now()
          responseWindow.finishedMs = preparationStarted - started
          const preparation = { afterAttempt: trace.attempts.length, startedMs: preparationStarted - started,
            actionDeadlineMs: actionDeadline - started, status: 'running', trace: {} }
          trace.retryPreparations.push(preparation)
          pendingRetryPreparation = preparationStarted
          responseDeadline = null; arm() // The original absolute action deadline still owns preparation.
          let preparationError
          try {
            await phase('prepare-world-input', () => prepareWorldInput(page, {
              timeout: remaining(), trace: preparation.trace, signal: actionSignal,
            }))
            preparation.status = 'passed'
          } catch (error) { preparationError = error; preparation.status = 'failed'; throw error }
          finally {
            preparation.finishedMs = performance.now() - started
            preparation.elapsedMs = preparation.finishedMs - preparation.startedMs
            retryPreparationMs += preparation.elapsedMs
            pendingRetryPreparation = undefined
            if (preparationError) preparation.error = String(preparationError)
          }
          remaining()
          // Shift only by measured preparation duration, not a fresh 2500 ms.
          responseDeadline = Math.min(actionDeadline, priorDeadline + preparation.elapsedMs)
          trace.responseDeadlineMs = responseDeadline - started
          responseWindow = { startedMs: preparation.finishedMs, deadlineMs: trace.responseDeadlineMs }
          trace.responseWindows.push(responseWindow)
          arm(); remaining()
        }
      }
      prepared = false
      remaining()
      const before = await phase('read-before-skip', () => page.evaluate(pauseStartupReady, true))
      remaining()
      const attempt = { before: { ...before } }; trace.attempts.push(attempt)
      if (before.action === 'ready') { attempt.outcome = 'natural-completion'; return }
      if (before.action !== 'skip') throw new Error('Recovery introduction is no longer interruptible')
      let delivery
      attempt.delivery = {}
      await phase('observed-space-dispatch', async () => {
        try {
          delivery = await pressObservedSpace(page, { timeout: remaining(), signal: actionSignal, snapshot: separateSetup, trace: attempt.delivery })
          // The owning race can already be cancelled while its finalizer is still pending.
          // Keep raw RPC settlements, but never publish success evidence after that boundary.
          remaining()
          attempt.ownership = structuredClone(separateSetup ? delivery.records : delivery)
          if (separateSetup) attempt.atomicAfter = structuredClone(delivery)
        } catch (error) {
          attempt.deliveryError = String(error)
          // A failed observer RPC is not a failed key. Opted-in callers require
          // their atomic evidence unless the keyboard operation itself rejected.
          if (separateSetup && !attempt.delivery.keyDeliveryFailed) throw error
          deliveryError = error
        }
      })
      remaining()
      const after = await phase('read-after-skip', () => separateSetup && !deliveryError
        ? Promise.resolve(recoveryStateFromSpaceSnapshot(delivery)) : page.evaluate(pauseStartupReady, true))
      attempt.after = { ...after }
      attempt.afterSource = separateSetup && !deliveryError ? 'atomic-post-dispatch-witness' : 'fresh-native-read'
      remaining()
      if (after.paused !== before.paused) throw new Error('Recovery Space changed pause state; retry the episode')
      if (deliveryError && after.action !== 'ready') throw deliveryError
      if (after.action === 'skip') {
        if (!deliveryError && popupRejectedSpace(attempt.ownership) && after.inputMask === before.inputMask && after.flybyFlags === before.flybyFlags) {
          if (popupRetryPreparation) {
            assert.ok(retryCount < 1, 'Recovery permits only one proven popup-owned retry')
            trace.retryCount = ++retryCount
          }
          attempt.outcome = 'popup-owned-unchanged-retry'
          continue
        }
        throw new Error('Recovery Space was not accepted; retry the episode')
      }
      attempt.outcome = 'completed'
      return
    }
  }
  try {
    signal?.throwIfAborted()
    signal?.addEventListener('abort', aborted, { once: true })
    arm()
    await Promise.race([run(), expiry])
  } finally {
    closed = true
    clearTimeout(timer)
    signal?.removeEventListener('abort', aborted)
    if (!actionSignal.aborted) cancellation.abort(new Error('Recovery input action settled'))
    const finished = performance.now()
    trace.elapsedMs = finished - started
    if (popupRetryPreparation && responseWindow && responseWindow.finishedMs === undefined)
      responseWindow.finishedMs = trace.elapsedMs
    updateResponseEvidence(finished)
  }
}

