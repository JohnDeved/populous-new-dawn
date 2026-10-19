import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'

// Opt-in bounded scenario: one Home load, one 1280x960 viewport, two Help/Options
// episodes and one Quit control, one screenshot. No campaign, storage setup,
// navigation reload, or additions to the existing broad Options/pause scenarios.
export const frontendHeldEscapeLimitMs = 60000

async function episode({ page, output, url }) {
  const main = page.getByRole('dialog', { name: 'Main menu', exact: true })
  const button = name => main.getByRole('button', { name, exact: true })
  const options = main.locator('[data-original-options]')
  const help = main.getByRole('region', { name: 'Browser compatibility and help', exact: true })
  const settle = () => page.evaluate(() => new Promise(resolve =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))))
  const records = []
  const state = () => page.evaluate(() => ({
    url: location.href, history: history.length,
    storage: Object.fromEntries(Object.entries(localStorage)),
    scenes: document.querySelectorAll('.world-viewport canvas').length,
  }))
  await page.setViewportSize({ width: 1280, height: 960 })
  if (url) await page.goto(url, { waitUntil: 'domcontentloaded' })
  await main.waitFor()
  const initial = await state()
  await page.evaluate(() => {
    window.frontendEscapeEvents = []
    const observe = event => {
      if (event.type !== 'cancel' && event.key !== 'Escape') return
      // Capture also sees Help's stopped event. Retain the event itself, then
      // inspect its final defaultPrevented state after the keyboard actions.
      window.frontendEscapeEvents.push(event)
    }
    for (const type of ['keydown', 'keyup', 'cancel']) document.addEventListener(type, observe, true)
    window.removeFrontendEscapeObservers = () => {
      for (const type of ['keydown', 'keyup', 'cancel']) document.removeEventListener(type, observe, true)
    }
  })
  try {
    for (let episode = 0; episode < 2; episode++) {
      await button('Options').click()
      await button('Sound').click()
      await button('Browser compatibility and help').click()
      await help.waitFor()
      await page.keyboard.down('Escape')
      await help.waitFor({ state: 'hidden' })
      await settle()
      for (let repeat = 0; repeat < 3; repeat++) await page.keyboard.down('Escape')
      assert.equal(await options.isVisible(), true, 'held Escape must stop at Options')
      assert.equal(await options.getAttribute('data-category'), 'Sound')
      assert.equal(await button('Browser compatibility and help').evaluate(el => el === document.activeElement), true)
      assert.deepEqual(await state(), initial)
      if (!episode) await page.screenshot({ path: resolve(output, 'frontend-held-escape-options.png') })
      await page.keyboard.up('Escape')
      await page.keyboard.press('Escape')
      await options.waitFor({ state: 'hidden' })
      assert.equal(await button('Options').evaluate(el => el === document.activeElement), true)
      records.push({ episode, heldRetainsOptions: true, freshReturnsMain: true })
    }
    // A direct fresh Escape, without the Help capture listener, still returns.
    await button('Options').click()
    await options.waitFor()
    await page.keyboard.press('Escape')
    await options.waitFor({ state: 'hidden' })
    await button('Quit').click()
    await main.locator('[data-original-quit-menu]').waitFor()
    await page.keyboard.press('Escape')
    await main.locator('[data-original-quit-menu]').waitFor({ state: 'hidden' })
    assert.equal(await button('Quit').evaluate(el => el === document.activeElement), true)
    assert.equal(await main.isVisible(), true)
    assert.deepEqual(await state(), initial)
    const events = await page.evaluate(() => window.frontendEscapeEvents.map(event => ({
      type: event.type, trusted: event.isTrusted, repeat: event.repeat ?? null,
      prevented: event.defaultPrevented,
    })))
    assert.ok(events.every(event => event.trusted), 'only ordinary browser keyboard/default events')
    assert.deepEqual(events.filter(event => event.type === 'keydown').map(event => event.repeat),
      [false, true, true, true, false, false, true, true, true, false, false, false])
    assert.ok(events.filter(event => event.type === 'keydown').every(event => event.prevented))
    assert.equal(events.filter(event => event.type === 'cancel').length, 0,
      'frontend key handlers own Escape and must prevent native dialog dismissal')
    writeFileSync(resolve(output, 'frontend-held-escape.json'), JSON.stringify({ records, events, initial }, null, 2))
    return { checks: records, limits: [
      'Actual Home through local React/Vite; no deployed hydration or native-game input parity claim',
      'Frontend-only keyboard regression; unchanged in-game pause behavior has separate retained coverage',
      'One viewport and screenshot; not comprehensive display or performance acceptance',
    ] }
  } finally {
    if (!page.isClosed()) {
      await page.keyboard.up('Escape')
      await page.evaluate(() => window.removeFrontendEscapeObservers())
    }
  }
}

// Nested episode bound, independent of the unchanged runner-wide 180s allowance.
// Closing this runner-owned page interrupts pending Playwright actions; the runner
// still owns context/browser/server cleanup and the terminal failure receipt.
export default async function frontendHeldEscape(input) {
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    void input.page.close().catch(() => {})
  }, frontendHeldEscapeLimitMs)
  try {
    const result = await episode(input)
    assert.equal(timedOut, false, 'Frontend held Escape exceeded its 60-second bound')
    return { ...result, episodeLimitMs: frontendHeldEscapeLimitMs }
  } catch (error) {
    if (timedOut) throw new Error('Frontend held Escape exceeded its 60-second bound', { cause: error })
    throw error
  } finally {
    clearTimeout(timer)
  }
}
