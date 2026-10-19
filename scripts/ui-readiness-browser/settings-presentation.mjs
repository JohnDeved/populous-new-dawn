// Proposed scripts/ui-readiness-browser/settings-presentation.mjs. NOT RUN.
// Two separate <=85s cases; public controls only, no game-state/storage injection.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { openCampaignFromMainMenu } from '../browser-new-game.mjs'

export const frontendSettings = args => run(args, 'frontend')
export const ingameSettings = args => run(args, 'ingame')

async function run({ page, context, output, url }, skin) {
  const started = Date.now(), deadline = started + 85_000
  let timedOut = false, timer, failure
  const report = { status: 'running', skin, phases: [], errors: [], limits: [
    'Public Options controls and rendered DOM/screenshots, not native pixel parity.',
    'One 1280x800 DPR1 context per case; no widescreen/DPR or late-atlas failure claim.',
    'Range/preferences are exercised through controls, not proof of audible playback or simulation behavior.',
  ] }
  const save = () => writeFileSync(resolve(output, `settings-${skin}.json`), JSON.stringify(report, null, 2) + '\n')
  const phase = name => { report.phases.push({ name, elapsedMs: Date.now() - started }); save() }
  const expire = () => { timedOut = true; report.status = 'timed-out'; save(); void context.close().catch(() => {}) }
  const checkDeadline = () => { if (timedOut || Date.now() >= deadline) { expire(); throw Object.assign(Error('Settings deadline expired'), { name: 'DiagnosticTimeoutError' }) } }
  // Only the supplied owned case context is closed; no browser/server ownership.
  const close = async () => {
    let cap
    try { await Promise.race([context.close(), new Promise((_, reject) => { cap = setTimeout(() => reject(Error('Settings context close exceeded 3 seconds')), 3000) })]) }
    finally { clearTimeout(cap) }
  }
  save()
  timer = setTimeout(expire, 80_000) // Reserve bounded cleanup inside the 85s envelope.
  page.setDefaultTimeout(6000); page.setDefaultNavigationTimeout(15000)
  page.on('pageerror', error => report.errors.push(String(error)))
  const button = name => page.getByRole('button', { name, exact: true })
  const options = page.locator('[data-original-options]')
  const tooltip = options.locator('[data-menu-tooltip-visible]')
  const screenshot = name => page.screenshot({ path: resolve(output, `settings-${skin}-${name}.png`), timeout: 3000 })
  const noTooltip = async () => assert.equal(await tooltip.count(), 0)
  try {
    phase('navigate'); await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    if (skin === 'ingame') {
      phase('public-mission-entry'); await openCampaignFromMainMenu(page)
      await button('Start Mission 1').click()
      await page.locator('canvas.battlefield').waitFor({ state: 'visible' })
      await page.locator('.loading-world').waitFor({ state: 'hidden' })
      const skip = page.getByRole('button', { name: /Skip introduction/ })
      await skip.click(); await skip.waitFor({ state: 'hidden' })
      await button('Game settings').click()
      await page.getByRole('dialog', { name: 'Game menu', exact: true }).waitFor()
    }
    checkDeadline(); phase('options-entry'); await button('Options').click()
    assert.equal(await options.getAttribute('data-skin'), skin)
    assert.equal(await options.getAttribute('data-category'), 'Game')
    for (const key of ['rotation', 'flipRotation']) {
      const control = options.locator(`[data-option-key="${key}"]`)
      const before = await control.getAttribute('aria-label')
      await control.click(); assert.notEqual(await control.getAttribute('aria-label'), before)
      await control.click(); assert.equal(await control.getAttribute('aria-label'), before)
    }
    const unsupported = options.getByRole('note', { name: 'Tooltips : <Unavailable>', exact: true })
    const noteText = await unsupported.getAttribute('aria-label')
    await unsupported.hover(); await tooltip.waitFor()
    const observe = () => tooltip.evaluate(el => ({ text: el.textContent, glyphs: el.querySelectorAll('i').length, width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height }))
    const first = await observe(); assert.ok(first.glyphs > 0 || first.text.trim().length > 0)
    await page.waitForTimeout(200); assert.deepEqual(await observe(), first, 'Visible tooltip typography must remain settled')
    report.tooltip = first; await screenshot('game-tooltip')
    await unsupported.click(); await noTooltip()
    assert.equal(await unsupported.getAttribute('aria-label'), noteText)
    assert.equal(await options.getAttribute('data-category'), 'Game')
    await button('Browser compatibility and help').focus(); await noTooltip()
    await unsupported.focus(); await tooltip.waitFor(); await screenshot('keyboard-tooltip')
    await button('Sound').click(); await noTooltip()
    phase('sound-controls')
    const destination = skin === 'frontend' ? 'Enable audio from the battlefield menu.' : 'Enable audio in Browser compatibility and help.'
    const values = {}
    for (const name of ['Master volume', 'Music volume']) {
      const slider = options.getByRole('slider', { name, exact: true })
      assert.equal(await slider.getAttribute('aria-description'), (name === 'Master volume' ? 'Master volume also affects music. ' : '') + destination)
      await slider.focus(); await page.keyboard.press('Home'); assert.equal(await slider.inputValue(), '0')
      await page.keyboard.press('End'); assert.equal(await slider.inputValue(), '1')
      await page.keyboard.press('ArrowLeft'); values[name] = await slider.inputValue(); assert.equal(values[name], '0.95')
    }
    await button('Browser compatibility and help').focus(); await noTooltip()
    for (const category of ['Sound', 'Graphics', 'Direct3D', 'Game']) {
      if (category === 'Direct3D') await button('Direct3D Options').click()
      else if (await options.getAttribute('data-category') !== category) await button(category).click()
      const copy = await options.innerText()
      assert.doesNotMatch(copy, /Rotation and Flip Rotation change|Browser volume controls|These original graphics controls/)
      assert.equal(await options.locator('p').count(), 0, 'Healthy original composition contains no persistent explanatory paragraph')
      await screenshot(category.toLowerCase())
    }
    phase('browser-help-return'); await button('Browser compatibility and help').click()
    const help = options.getByRole('region', { name: 'Browser compatibility and help', exact: true })
    await help.waitFor(); await noTooltip()
    await help.getByRole('button', { name: 'Back to Options', exact: true }).click()
    await help.waitFor({ state: 'hidden' })
    await page.waitForFunction(() => document.activeElement?.hasAttribute('data-compatibility'))
    await button('Back').click(); await options.waitFor({ state: 'detached' })
    await button('Options').click(); await button('Sound').click()
    for (const [name, value] of Object.entries(values)) assert.equal(await options.getByRole('slider', { name, exact: true }).inputValue(), value)
    await button('Back').click()
    if (skin === 'ingame') { await button('Continue Game').click(); await page.getByRole('dialog', { name: 'Game menu', exact: true }).waitFor({ state: 'hidden' }) }
    assert.deepEqual(report.errors, []); checkDeadline(); phase('assertions-passed')
  } catch (error) {
    report.status = timedOut ? 'timed-out' : 'failed'; report.error = String(error.stack); save()
    failure = error
  } finally {
    try { await close() } catch (error) { report.cleanupError = String(error); if (!timedOut) report.status = 'failed' }
    clearTimeout(timer)
    if (timedOut || Date.now() >= deadline) report.status = 'timed-out'
    else if (report.status === 'running') report.status = 'passed'
    report.elapsedMs = Date.now() - started; save()
  }
  if (report.status === 'timed-out') throw Object.assign(Error('Settings diagnostic deadline expired', { cause: failure }), { name: 'DiagnosticTimeoutError' })
  if (failure) throw failure
  assert.equal(report.status, 'passed')
  return report
}
