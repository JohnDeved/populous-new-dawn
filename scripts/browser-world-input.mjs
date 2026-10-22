import assert from 'node:assert/strict'
import { popupRejectedSpace, pressObservedSpace } from './browser-space-ownership.mjs'

// Read only the rendered notification owners. A closed summary retains its
// message/queue entry; ACK/Delete would change the scenario under test.
export function campaignPopupState() {
  return [...document.querySelectorAll('.campaign-messages details[open]')]
    .map(detail => ({ serial: detail.getAttribute('data-message-serial') }))
}

// One read captures both retained identity/count and current ownership. Closed
// records are retained so public close/reopen never silently acknowledges them.
export function campaignPopupSnapshot() {
  return [...document.querySelectorAll('.campaign-messages details')]
    .map(detail => ({ serial: detail.getAttribute('data-message-serial'), open: detail.open }))
}

async function withinInputDeadline(timeout, run, trace = {}, signal) {
  if (!Number.isFinite(timeout) || timeout <= 0) throw new RangeError('Invalid world input timeout')
  const started = performance.now(), deadline = started + timeout
  Object.assign(trace, { phase: 'start', pending: false, elapsedMs: 0, completed: [] })
  const timedOut = () => {
    trace.elapsedMs = performance.now() - started
    return new Error(`World input preparation timed out: ${JSON.stringify(trace)}`)
  }
  let expired = false, timer, rejectAbort
  const abort = () => { expired = true; rejectAbort(signal.reason ?? new Error('World input aborted')) }
  const aborted = new Promise((_, reject) => { rejectAbort = reject })
  const remaining = () => {
    signal?.throwIfAborted()
    const budget = deadline - performance.now()
    if (expired || budget <= 0) throw timedOut()
    return budget
  }
  const phase = async (name, action) => {
    remaining()
    const startedMs = performance.now() - started
    Object.assign(trace, { phase: name, pending: true, phaseStartedMs: startedMs, phaseError: null })
    const settled = (status, error) => {
      const elapsedMs = performance.now() - started
      Object.assign(trace, { pending: false, elapsedMs, phaseError: error ? String(error) : null })
      trace.completed.push({ phase: name, startedMs, finishedMs: elapsedMs, status })
      if (trace.completed.length > 32) trace.completed.shift()
    }
    let value
    try { value = await action() }
    catch (error) { settled('rejected', error); throw error }
    settled('fulfilled')
    remaining()
    return value
  }
  try {
    signal?.throwIfAborted()
    signal?.addEventListener('abort', abort, { once: true })
    return await Promise.race([run(remaining, phase), aborted, new Promise((_, reject) => {
      timer = setTimeout(() => { expired = true; reject(timedOut()) }, remaining())
    })])
  } finally { expired = true; clearTimeout(timer); signal?.removeEventListener('abort', abort) }
}

async function observePopups(page, phase, trace, name) {
  const snapshot = await phase(name, () => page.evaluate(campaignPopupSnapshot))
  trace.owners = Array.from(snapshot).filter(detail => detail.open).map(({ serial }) => ({ serial }))
  trace.ownersObservedMs = trace.elapsedMs
  return snapshot
}

function retainedPopup(snapshot, serial) {
  assert.match(serial, /^\d+$/, 'A real retained campaign notification serial is required')
  const retained = snapshot.filter(detail => detail.serial === serial)
  assert.equal(retained.length, 1, 'The same campaign notification remains present')
  return retained[0]
}

async function applyPopupOpen(page, serial, open, snapshot, remaining, phase, trace) {
  const retained = retainedPopup(snapshot, serial)
  Object.assign(trace, { serial, requestedOpen: open, observedOpen: retained.open })
  const detail = page.locator(`.campaign-messages details[data-message-serial="${serial}"]`)
  if (retained.open !== open)
    await phase('public-summary-click', () => detail.locator('summary').click({ timeout: remaining() }))
  await phase(open ? 'wait-body-visible' : 'wait-body-hidden', () =>
    detail.locator('[data-native-campaign-panel]').waitFor({ state: open ? 'visible' : 'hidden', timeout: remaining() }))
  const after = await observePopups(page, phase, trace, 'verify-retained-popup-and-owners')
  trace.observedOpen = retainedPopup(after, serial).open
  assert.equal(trace.observedOpen, open)
  // This same read observes any different authored owner opened during the close.
  return after
}

// Public summary clicks only, including when restoring a popup for layout/F8 QA.
export async function setCampaignPopupOpen(page, serial, open, { timeout = 2500, trace = {} } = {}) {
  assert.match(serial, /^\d+$/, 'A real retained campaign notification serial is required')
  return withinInputDeadline(timeout, async (remaining, phase) => {
    const snapshot = await observePopups(page, phase, trace, 'observe-retained-popups')
    await applyPopupOpen(page, serial, open, snapshot, remaining, phase, trace)
  }, trace)
}

export async function prepareWorldInput(page, { timeout = 2500, keyboardFocus = true, trace = {}, signal } = {}) {
  assert.equal(typeof keyboardFocus, 'boolean')
  return withinInputDeadline(timeout, async (remaining, phase) => {
    const collapsed = []
    let snapshot = await observePopups(page, phase, trace, 'observe-popup-owners')
    for (;;) {
      const owner = snapshot.find(detail => detail.open)
      if (owner) {
        snapshot = await applyPopupOpen(page, owner.serial, false, snapshot, remaining, phase, trace)
        collapsed.push({ serial: owner.serial })
        continue
      }
      // Pointer-only callers use the completed post-close observation above.
      // Keyboard callers must move summary focus before sending world input.
      if (!keyboardFocus) return collapsed
      await phase('focus-world-viewport', () => page.locator('.world-viewport').focus({ timeout: remaining() }))
      snapshot = await observePopups(page, phase, trace, 'reobserve-popup-owners')
      if (!snapshot.some(detail => detail.open)) return collapsed
    }
  }, trace, signal)
}

export async function pressWorldSpace(page, { timeout = 2500 } = {}) {
  return withinInputDeadline(timeout, async remaining => {
    const collapsed = await prepareWorldInput(page, { timeout: remaining() })
    remaining()
    await page.keyboard.press('Space')
    remaining()
    return collapsed
  })
}

export function worldPauseState() {
  const world = window.testStore.getWorld()
  return { paused: world.paused, inputMask: world.inputMask, turn: world.turn }
}

// A requested state, not a blind toggle. Only an observed popup-owned, unchanged
// dispatch can be retried, and accepted input is never sent a second time.
export async function setWorldPaused(page, paused, { timeout = 2500, trace = {}, signal } = {}) {
  assert.equal(typeof paused, 'boolean')
  return withinInputDeadline(timeout, async (remaining, phase) => {
    const collapsed = []
    trace.attempts = []
    for (;;) {
      const attempt = { preparation: {}, delivery: {} }
      trace.attempts.push(attempt)
      if (trace.attempts.length > 32) trace.attempts.shift()
      collapsed.push(...await phase('prepare-world-input', () =>
        prepareWorldInput(page, { timeout: remaining(), trace: attempt.preparation, signal })))
      const before = await phase('read-before-pause', () => page.evaluate(worldPauseState))
      attempt.before = before
      remaining()
      assert.equal(before.inputMask, 0, 'Pause input cannot replace an introduction skip')
      if (before.paused === paused) return collapsed
      const delivery = await phase('observed-space-dispatch', () =>
        pressObservedSpace(page, { timeout: remaining(), trace: attempt.delivery, signal }))
      attempt.ownership = delivery
      const after = await phase('read-after-pause', () => page.evaluate(worldPauseState))
      attempt.after = after
      remaining()
      assert.equal(after.inputMask, 0, 'Pause input must retain ordinary world ownership')
      if (after.paused === paused) { attempt.outcome = 'completed'; return collapsed }
      if (popupRejectedSpace(delivery)) { attempt.outcome = 'popup-owned-unchanged-retry'; continue }
      throw Error('Public Space did not establish the requested pause state')
    }
  }, trace, signal)
}
