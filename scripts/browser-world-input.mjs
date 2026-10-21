import assert from 'node:assert/strict'
import { popupRejectedSpace, pressObservedSpace } from './browser-space-ownership.mjs'

// Read only the rendered notification owners. A closed summary retains its
// message/queue entry; ACK/Delete would change the scenario under test.
export function campaignPopupState() {
  return [...document.querySelectorAll('.campaign-messages details[open]')]
    .map(detail => ({ serial: detail.getAttribute('data-message-serial') }))
}

async function withinInputDeadline(timeout, run, trace = { phase: 'start' }) {
  if (!Number.isFinite(timeout) || timeout <= 0) throw new RangeError('Invalid world input timeout')
  const deadline = performance.now() + timeout
  const timedOut = () => new Error(`World input preparation timed out: ${JSON.stringify(trace)}`)
  let expired = false, timer
  const remaining = () => {
    const budget = deadline - performance.now()
    if (expired || budget <= 0) throw timedOut()
    return budget
  }
  try {
    return await Promise.race([run(remaining), new Promise((_, reject) => {
      timer = setTimeout(() => { expired = true; reject(timedOut()) }, remaining())
    })])
  } finally { expired = true; clearTimeout(timer) }
}

// Public summary clicks only, including when restoring a popup for layout/F8 QA.
export async function setCampaignPopupOpen(page, serial, open, { timeout = 2500, trace = {} } = {}) {
  assert.match(serial, /^\d+$/, 'A real retained campaign notification serial is required')
  return withinInputDeadline(timeout, async remaining => {
    Object.assign(trace, { phase: 'retained-serial-count', serial, requestedOpen: open })
    const detail = page.locator(`.campaign-messages details[data-message-serial="${serial}"]`)
    assert.equal(await detail.count(), 1, 'The same campaign notification remains present')
    remaining()
    trace.phase = 'read-open-state'
    const isOpen = trace.observedOpen = await detail.getAttribute('open') !== null
    remaining()
    trace.phase = 'public-summary-click'
    if (isOpen !== open) await detail.locator('summary').click({ timeout: remaining() })
    trace.phase = open ? 'wait-body-visible' : 'wait-body-hidden'
    await detail.locator('[data-native-campaign-panel]').waitFor({ state: open ? 'visible' : 'hidden', timeout: remaining() })
    remaining()
    trace.phase = 'verify-open-state'
    assert.equal(await detail.getAttribute('open') !== null, open)
    remaining()
    // Another authored notification may open during this close. Its ownership
    // is reobserved by prepareWorldInput, not mistaken for failure of this serial.
  }, trace)
}

export async function prepareWorldInput(page, { timeout = 2500 } = {}) {
  const trace = { phase: 'observe-popup-owners' }
  return withinInputDeadline(timeout, async remaining => {
    const collapsed = []
    for (;;) {
      trace.phase = 'observe-popup-owners'
      const popups = trace.owners = await page.evaluate(campaignPopupState)
      remaining()
      for (const { serial } of popups) {
        await setCampaignPopupOpen(page, serial, false, { timeout: remaining(), trace })
        collapsed.push({ serial })
      }
      // A summary keeps keyboard focus after a click. Space there reopens it,
      // so explicitly focus the shipped viewport before any world keyboard input.
      trace.phase = 'focus-world-viewport'
      await page.locator('.world-viewport').focus({ timeout: remaining() })
      remaining()
      // Authored notifications can auto-open during the browser round trips.
      trace.phase = 'reobserve-popup-owners'
      const reopened = trace.owners = await page.evaluate(campaignPopupState)
      remaining()
      if (!reopened.length) return collapsed
    }
  }, trace)
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
export async function setWorldPaused(page, paused, { timeout = 2500 } = {}) {
  assert.equal(typeof paused, 'boolean')
  return withinInputDeadline(timeout, async remaining => {
    const collapsed = []
    for (;;) {
      collapsed.push(...await prepareWorldInput(page, { timeout: remaining() }))
      const before = await page.evaluate(worldPauseState)
      remaining()
      assert.equal(before.inputMask, 0, 'Pause input cannot replace an introduction skip')
      if (before.paused === paused) return collapsed
      const delivery = await pressObservedSpace(page, { timeout: remaining() })
      const after = await page.evaluate(worldPauseState)
      remaining()
      assert.equal(after.inputMask, 0, 'Pause input must retain ordinary world ownership')
      if (after.paused === paused) return collapsed
      if (popupRejectedSpace(delivery)) continue
      throw Error('Public Space did not establish the requested pause state')
    }
  })
}
