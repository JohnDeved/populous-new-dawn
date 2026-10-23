import assert from 'node:assert/strict'
import { existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Actual Home and trusted browser input. No seeking, synthetic keyboard events,
// game-state changes, playback-rate changes or replacement media.
export default async function startupLogo({ page, context, url, root, output, receipt }) {
  await page.setViewportSize({ width: 1280, height: 960 })
  const main = page.getByRole('dialog', { name: 'Main menu', exact: true })
  const logo = page.getByRole('dialog', { name: 'Opening logo', exact: true })
  const video = logo.locator('video')
  const screenshot = name => page.screenshot({ path: resolve(output, `${name}.png`) })
  const checks = []
  if (!existsSync(resolve(root, 'app/startup-logo.tsx'))) {
    await main.waitFor()
    await screenshot('before-menu-without-logo')
    return { baseline: true, checks: ['Actual baseline Home opens the main menu without a logo stage'] }
  }
  // The shared harness has already waited through the first natural completion.
  assert.equal(await logo.count(), 0)
  checks.push('initial Home reaches the main menu after natural logo completion')
  const originalStorage = await page.evaluate(() => Object.entries(localStorage))
  const cold = async () => {
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await logo.waitFor()
    assert.equal(await main.count(), 0)
    assert.equal(await page.locator('.world-viewport canvas').count(), 0)
  }
  const assertMenuOnly = async () => {
    await main.waitFor()
    assert.equal(await logo.count(), 0)
    assert.equal(await page.locator('[data-original-tutorial-recommendation]').count(), 0)
    assert.equal(await page.getByRole('dialog', { name: 'Start game', exact: true }).count(), 0)
    assert.equal(await page.locator('.world-viewport canvas').count(), 0)
  }
  await cold()
  await page.waitForFunction(() => document.querySelector('[data-startup-logo] video')?.currentTime >= 1)
  const geometry = await video.boundingBox()
  assert.deepEqual(geometry, { x: 0, y: 128, width: 1280, height: 704 })
  assert.equal(await video.evaluate(media => media.muted), true)
  await screenshot('logo-1s')
  await page.waitForFunction(() => document.querySelector('[data-startup-logo] video')?.currentTime >= 3)
  await screenshot('logo-3s')
  await page.waitForFunction(() => document.querySelector('[data-startup-logo] video')?.currentTime >= 6)
  await screenshot('logo-6s')
  await assertMenuOnly()
  await screenshot('after-natural-menu')
  checks.push('188-frame original logo plays naturally; source-derived 640x352 in 640x480 framing')

  for (const key of ['Enter', 'Space', 'Escape', 'a']) {
    await cold()
    await page.keyboard.down(key)
    await assertMenuOnly()
    for (let repeat = 0; repeat < 3; repeat++) await page.keyboard.down(key)
    await page.keyboard.up(key)
    await assertMenuOnly()
    checks.push(`${key} skips once and its repeats/release cannot activate a menu row`)
  }
  // Hold a key across navigation: repeat downs delivered to the new clip cannot
  // stand in for a fresh press. This is a browser compatibility regression.
  await page.keyboard.down('Space')
  await cold()
  await page.keyboard.down('Space')
  assert.equal(await logo.isVisible(), true)
  await page.keyboard.up('Space')
  assert.equal(await logo.isVisible(), true)
  await page.keyboard.down('Space')
  await page.keyboard.up('Space')
  await assertMenuOnly()
  checks.push('held-at-entry browser repeat is ignored until a fresh press')

  for (const button of ['left', 'middle', 'right']) {
    await cold()
    await page.waitForFunction(() => document.querySelector('[data-startup-logo] video')?.currentTime > .2)
    // The same position becomes the New Game row after dismissal.
    await page.mouse.move(640, 280)
    await page.mouse.down({ button })
    assert.equal(await video.evaluate(media => media.paused), true)
    assert.equal(await logo.isVisible(), true)
    if (button === 'left') await screenshot('pointer-down-stopped')
    await page.mouse.up({ button })
    await assertMenuOnly()
    checks.push(`${button} button stops on down; release cannot click through to New Game`)
  }
  await cold()
  await page.keyboard.press('Tab')
  const sound = logo.getByRole('button', { name: 'Enable logo sound', exact: true })
  assert.equal(await sound.evaluate(button => button === document.activeElement), true)
  await page.keyboard.press('Enter')
  assert.equal(await video.evaluate(media => media.muted), false)
  assert.equal(await logo.isVisible(), true)
  await page.waitForFunction(() => document.querySelector('[data-startup-logo] video')?.currentTime > .2)
  await logo.getByRole('button', { name: 'Skip logo', exact: true }).click()
  await assertMenuOnly()
  checks.push('keyboard-accessible user activation enables original audio without skipping or restarting')
  await main.getByRole('button', { name: 'Options', exact: true }).click()
  await page.keyboard.press('Escape')
  await assertMenuOnly()
  assert.deepEqual(await page.evaluate(() => Object.entries(localStorage)), originalStorage)
  checks.push('return from Options does not replay logo or write storage')

  // Separately labelled media failure injection; successful playback above uses
  // the real shipped WebM. A stalled/failed decoder must never block play.
  const errorsBefore = receipt.errors.length
  await context.route('**/original/startup/blogo.webm', route => route.fulfill({ status: 404, body: '' }))
  await cold()
  await logo.getByText('The opening logo could not be played. You can continue to the menu.', { exact: true }).waitFor()
  await screenshot('media-failure')
  await logo.getByRole('button', { name: 'Skip logo', exact: true }).click()
  await assertMenuOnly()
  await context.unroute('**/original/startup/blogo.webm')
  const expectedFailureErrors = receipt.errors.slice(errorsBefore)
  assert.ok(expectedFailureErrors.every(error => /404/.test(error)), JSON.stringify(expectedFailureErrors))
  assert.equal(errorsBefore, 0, JSON.stringify(receipt.errors.slice(0, errorsBefore)))
  checks.push('injected 404 retains truthful failure and working exit')
  const result = {
    checks, geometry, expectedFailureErrors,
    limits: ['Local Chromium compositor; not original native runtime or hardware performance',
      'Full initial timed page, New Game intro, and non-English logos remain unimplemented',
      'Autoplay-refusal and visibility lifecycle have component tests; audio was unmuted but not acoustically measured'],
  }
  writeFileSync(resolve(output, 'startup-logo.json'), JSON.stringify(result, null, 2))
  return result
}
