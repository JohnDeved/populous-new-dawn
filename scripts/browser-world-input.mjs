import assert from 'node:assert/strict'

// Read only the rendered notification owners. A closed summary retains its
// message/queue entry; ACK/Delete would change the scenario under test.
export function campaignPopupState() {
  return [...document.querySelectorAll('.campaign-messages details[open]')]
    .map(detail => ({ serial: detail.getAttribute('data-message-serial') }))
}

async function withinInputDeadline(timeout, run) {
  if (!Number.isFinite(timeout) || timeout <= 0) throw new RangeError('Invalid world input timeout')
  const deadline = performance.now() + timeout, timedOut = new Error('World input preparation timed out')
  let expired = false, timer
  const remaining = () => {
    const budget = deadline - performance.now()
    if (expired || budget <= 0) throw timedOut
    return budget
  }
  try {
    return await Promise.race([run(remaining), new Promise((_, reject) => {
      timer = setTimeout(() => { expired = true; reject(timedOut) }, remaining())
    })])
  } finally { expired = true; clearTimeout(timer) }
}

// Public summary clicks only, including when restoring a popup for layout/F8 QA.
export async function setCampaignPopupOpen(page, serial, open, { timeout = 2500 } = {}) {
  assert.match(serial, /^\d+$/, 'A real retained campaign notification serial is required')
  return withinInputDeadline(timeout, async remaining => {
    const detail = page.locator(`.campaign-messages details[data-message-serial="${serial}"]`)
    assert.equal(await detail.count(), 1, 'The same campaign notification remains present')
    remaining()
    const isOpen = await detail.getAttribute('open') !== null
    remaining()
    if (isOpen !== open) await detail.locator('summary').click({ timeout: remaining() })
    await detail.locator('[data-native-campaign-panel]').waitFor({ state: open ? 'visible' : 'hidden', timeout: remaining() })
    remaining()
    assert.equal(await detail.getAttribute('open') !== null, open)
    remaining()
    // Another authored notification may open during this close. Its ownership
    // is reobserved by prepareWorldInput, not mistaken for failure of this serial.
  })
}

export async function prepareWorldInput(page, { timeout = 2500 } = {}) {
  return withinInputDeadline(timeout, async remaining => {
    const collapsed = []
    for (;;) {
      const popups = await page.evaluate(campaignPopupState)
      remaining()
      for (const { serial } of popups) {
        await setCampaignPopupOpen(page, serial, false, { timeout: remaining() })
        collapsed.push({ serial })
      }
      // A summary keeps keyboard focus after a click. Space there reopens it,
      // so explicitly focus the shipped viewport before any world keyboard input.
      await page.locator('.world-viewport').focus({ timeout: remaining() })
      remaining()
      // Authored notifications can auto-open during the browser round trips.
      const reopened = await page.evaluate(campaignPopupState)
      remaining()
      if (!reopened.length) return collapsed
    }
  })
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
