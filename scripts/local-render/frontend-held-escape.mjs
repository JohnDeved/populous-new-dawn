import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'

// Ordinary bounded scenario: one Home load, one 1280x960 viewport, one logo
// focus check, two Help/Options episodes and one Quit control. No campaign,
// storage setup, or navigation reload.
export const frontendHeldEscapeLimitMs = 60000

async function openingLogoReverseTab(page, output, url) {
  assert(url, 'opening-logo test requires the existing fresh Home navigation')
  const asset = '**/original/startup/blogo.webm'
  let sawMedia = false, release, pending
  const hold = new Promise(resolve => { release = resolve })
  // Keep the real logo dialog live while recording focus. Delay only its media
  // transfer; this is a keyboard test, not an autoplay or decode test.
  const routeMedia = route => {
    sawMedia = true
    pending = hold.then(() => route.continue()).then(
      () => null,
      error => page.isClosed() || /interception|cancelled|canceled/i.test(String(error)) ? null : error,
    )
    return pending
  }
  await page.route(asset, routeMedia)
  const logo = page.getByRole('dialog', { name: 'Opening logo', exact: true })
  const skip = logo.getByRole('button', { name: 'Skip logo', exact: true })
  const playback = logo.getByRole('button', { name: /^(Enable logo sound|Mute logo|Play logo)$/ })
  const active = locator => locator.evaluate(element => document.activeElement === element)
  let observer
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await logo.waitFor()
    await playback.waitFor()
    observer = await page.evaluateHandle(() => {
      const events = []
      const observe = event => {
        if (event.key === 'Tab' || event.key === 'Shift') events.push(event)
      }
      document.addEventListener('keydown', observe, true)
      return {
        events, close: () => document.removeEventListener('keydown', observe, true),
      }
    })
    assert.equal(await active(logo), true, 'startup dialog owns initial focus')
    await page.keyboard.press('Tab')
    assert.equal(await active(playback), true, 'forward Tab reaches playback without skipping')
    await page.keyboard.press('Tab')
    assert.equal(await active(skip), true, 'forward Tab travels from playback to Skip')
    await page.keyboard.press('Shift+Tab')
    const events = await observer.evaluate(({ events }) => events.map(event => ({
      key: event.key, shift: event.shiftKey, trusted: event.isTrusted,
      repeat: event.repeat, prevented: event.defaultPrevented,
    })))
    // Read the visibility before dereferencing a control already removed on baseline.
    const retained = await logo.isVisible()
    const playbackFocused = retained && await active(playback)
    const evidence = { events, retained, playbackFocused, mediaRequestDeferred: sawMedia }
    writeFileSync(resolve(output, 'opening-logo-reverse-tab.json'), JSON.stringify(evidence, null, 2))
    assert.equal(retained, true, 'reverse Tab must not skip the logo')
    assert.equal(playbackFocused, true, 'reverse Tab must move focus to playback')
    assert.deepEqual(events, [
      { key: 'Tab', shift: false, trusted: true, repeat: false, prevented: false },
      { key: 'Tab', shift: false, trusted: true, repeat: false, prevented: false },
      { key: 'Shift', shift: true, trusted: true, repeat: false, prevented: false },
      { key: 'Tab', shift: true, trusted: true, repeat: false, prevented: false },
    ])
    assert.equal(sawMedia, true, 'expected the actual logo media request')
    await page.screenshot({ path: resolve(output, 'opening-logo-reverse-tab.png') })
    // Keep the ordinary public Skip click and prove that it still reaches Home.
    await skip.click()
    await page.getByRole('dialog', { name: 'Main menu', exact: true }).waitFor()
    return evidence
  } finally {
    release()
    if (!page.isClosed()) {
      await page.unroute(asset, routeMedia)
      // Main unmounts media and may cancel its deferred request.
      const routeError = await pending
      if (routeError) throw routeError
      if (observer) {
        await observer.evaluate(({ close }) => close())
        await observer.dispose()
      }
    }
  }
}

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
  const logoReverseTab = await openingLogoReverseTab(page, output, url)
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
      assert.equal(await button('Browser compatibility and help').count(), 0)
      await button('Game').click()
      await button('Browser compatibility and help').click()
      await help.waitFor()
      await page.keyboard.down('Escape')
      await help.waitFor({ state: 'hidden' })
      await settle()
      for (let repeat = 0; repeat < 3; repeat++) await page.keyboard.down('Escape')
      assert.equal(await options.isVisible(), true, 'held Escape must stop at Options')
      assert.equal(await options.getAttribute('data-category'), 'Game')
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
    return { checks: records, logoReverseTab, limits: [
      'Actual Home through local React/Vite; no deployed hydration or native-game input parity claim',
      'Frontend-only keyboard regression; unchanged in-game pause behavior has separate retained coverage',
      'One viewport; logo media was deferred, so focus/screenshot do not qualify playback',
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
