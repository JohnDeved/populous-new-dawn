import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Real Home, original media and trusted browser input. No seeking, playback-rate
// changes, synthetic events or game-state injection. Media failure is labelled.
export default async function comingSoon({ page, context, url, output, receipt }) {
  const menu = page.getByRole('dialog', { name: 'Main menu', exact: true })
  const row = menu.getByRole('button', { name: 'Coming Soon', exact: true })
  const trailer = page.getByRole('dialog', { name: 'Coming Soon trailer', exact: true })
  const video = trailer.locator('video')
  const screenshot = name => page.screenshot({ path: resolve(output, `${name}.png`) })
  await menu.waitFor()
  await page.setViewportSize({ width: 1280, height: 960 })
  if (await row.getAttribute('aria-disabled') === 'true') {
    await screenshot('before-coming-soon-unavailable')
    return { baseline: true, checks: ['Original Coming Soon row is unavailable on this baseline'] }
  }
  const identity = await menu.elementHandle()
  const storage = await page.evaluate(() => Object.entries(localStorage))
  const checks = []
  const open = async () => {
    await row.click()
    await trailer.waitFor()
    await page.waitForFunction(() => document.querySelector('[data-coming-soon] video')?.currentTime > 0.1)
  }
  const returned = async () => {
    await trailer.waitFor({ state: 'detached', timeout: 110000 })
    assert.equal(await menu.evaluate((node, old) => node === old, identity), true)
    assert.equal(await row.evaluate(node => node === document.activeElement), true)
    assert.equal(await page.locator('.world-viewport canvas').count(), 0)
    assert.equal(await page.locator('[data-original-tutorial-recommendation]').count(), 0)
    assert.deepEqual(await page.evaluate(() => Object.entries(localStorage)), storage)
  }
  await screenshot('before-trailer-menu')
  await open()
  for (const second of [1, 3, 6]) {
    await page.waitForFunction(second => document.querySelector('[data-coming-soon] video')?.currentTime >= second, second)
    await screenshot(`trailer-${second}s`)
  }
  assert.deepEqual(await video.boundingBox(), { x: 0, y: 0, width: 1280, height: 960 })
  await returned()
  await screenshot('after-natural-trailer-menu')
  checks.push('Natural original trailer completion retains the exact main-menu node, focus and storage')

  for (const key of ['Enter', 'Space', 'Escape', 'a']) {
    await open()
    await page.keyboard.down(key)
    assert.equal(await video.evaluate(media => media.paused), true)
    for (let repeat = 0; repeat < 3; repeat++) await page.keyboard.down(key)
    assert.equal(await trailer.count(), 1)
    await page.keyboard.up(key)
    await returned()
  }
  checks.push('Keyboard down pauses; repeats and release cannot reopen Coming Soon or enter a game')

  for (const button of ['left', 'middle', 'right']) {
    await open()
    await page.mouse.move(640, 280)
    await page.mouse.down({ button })
    assert.equal(await video.evaluate(media => media.paused), true)
    assert.equal(await trailer.count(), 1)
    await page.mouse.up({ button })
    await returned()
  }
  checks.push('All three pointer buttons stop once without click-through to the retained New Game row')

  await open()
  for (const [width, height] of [[1920, 1080], [3440, 1440], [1365, 767]]) {
    await page.setViewportSize({ width, height })
    const bounds = await video.boundingBox(), scale = Math.min(width / 640, height / 480)
    for (const [actual, expected] of [[bounds.width, 640 * scale], [bounds.height, 480 * scale],
      [bounds.x, (width - 640 * scale) / 2], [bounds.y, (height - 480 * scale) / 2]]) {
      assert.ok(Math.abs(actual - expected) < 0.02)
    }
    await screenshot(`trailer-${width}x${height}`)
  }
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  assert.equal(await video.evaluate(media => media.muted), false)
  await trailer.getByRole('button', { name: 'Skip trailer', exact: true }).click()
  await returned()
  checks.push('Uniform 4:3 resize and keyboard sound control preserve media/menu ownership')

  const errorsBefore = receipt.errors.length
  await context.route('**/original/coming-soon/trailer.webm', route => route.fulfill({ status: 404, body: '' }))
  await row.click()
  await trailer.getByText('The original trailer could not be played. You can return to the menu.', { exact: true }).waitFor()
  await screenshot('trailer-injected-media-failure')
  await trailer.getByRole('button', { name: 'Skip trailer', exact: true }).click()
  await returned()
  await context.unroute('**/original/coming-soon/trailer.webm')
  const expectedFailureErrors = receipt.errors.slice(errorsBefore)
  assert.ok(expectedFailureErrors.every(error => /404/.test(error)))
  assert.equal(errorsBefore, 0)
  checks.push('Labelled 404 failure remains truthful and exit-capable')
  const result = { checks, expectedFailureErrors, url, limits: [
    'Local browser output is not native runtime, acoustic or hardware performance acceptance',
    'High-DPI, actual hidden/resume and browser-autoplay-refusal checks remain separate required gates',
  ] }
  writeFileSync(resolve(output, 'coming-soon.json'), JSON.stringify(result, null, 2))
  return result
}
