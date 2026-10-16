import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { writeFileSync } from 'node:fs'

// Actual Home scenario. Fresh contexts test first visit rather than seeding the
// answered flag. No game state or scene internals are injected.
export default async function ({ page, browser, url, root, output }) {
  const key = 'populous-tutorial-recommendation-v1'
  const progress = []
  const passed = name => {
    progress.push(name)
    writeFileSync(resolve(output, 'progress.json'), JSON.stringify(progress, null, 2) + '\n')
  }
  const main = p => p.getByRole('dialog', { name: 'Main menu', exact: true })
  const prompt = p => p.locator('[data-original-tutorial-recommendation]')
  const button = (p, name) => p.getByRole('button', { name, exact: true })
  const stored = p => p.evaluate(key => localStorage.getItem(key), key)
  const open = async p => {
    await main(p).waitFor()
    await button(p, 'New Game').click()
    await prompt(p).waitFor()
  }
  await main(page).waitFor()
  assert.equal(await stored(page), null)
  assert.equal(await prompt(page).count(), 0, 'No automatic startup prompt')
  for (const [width, height] of [[640, 480], [1920, 1080], [900, 360]]) {
    await page.setViewportSize({ width, height })
    await open(page)
    await button(page, 'Back').evaluate(el => {
      if (el !== document.activeElement) throw Error('Back must have initial focus')
    })
    const bounds = await prompt(page).locator('button').evaluateAll(nodes => nodes.map(el => {
      const b = el.getBoundingClientRect()
      return { x: b.x, y: b.y, right: b.right, bottom: b.bottom }
    }))
    for (const b of bounds) assert.ok(b.x >= 0 && b.y >= 0 && b.right <= width + 1 && b.bottom <= height + 1)
    await page.screenshot({ path: resolve(output, `recommendation-${width}x${height}.png`) })
    await page.keyboard.press('Escape')
    await page.keyboard.press('Escape')
    await button(page, 'New Game').waitFor()
    assert.equal(await button(page, 'New Game').evaluate(el => el === document.activeElement), true)
    assert.equal(await stored(page), null)
    await open(page)
    await button(page, 'Back').click()
    await button(page, 'New Game').waitFor()
    assert.equal(await stored(page), null)
  }
  passed('native-wide-short-layout-and-repeat-cancel-focus')
  await open(page)
  await button(page, 'No').click()
  await page.getByRole('dialog', { name: 'Start game', exact: true }).waitFor()
  assert.equal(await stored(page), 'answered')
  await page.keyboard.press('Escape')
  await button(page, 'New Game').waitFor()
  await page.reload({ waitUntil: 'domcontentloaded' })
  await main(page).waitFor()
  await button(page, 'New Game').click()
  await page.getByRole('dialog', { name: 'Start game', exact: true }).waitFor()
  assert.equal(await prompt(page).count(), 0)
  passed('no-opens-selector-and-persists-across-reload')

  const blocked = await browser.newContext({ viewport: { width: 640, height: 480 } })
  try {
    await blocked.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError') } })
    })
    const p = await blocked.newPage()
    const errors = []
    p.on('pageerror', error => errors.push(String(error)))
    await p.goto(url, { waitUntil: 'domcontentloaded' })
    await open(p)
    await button(p, 'No').click()
    await p.getByRole('dialog', { name: 'Start game', exact: true }).waitFor()
    await p.keyboard.press('Escape')
    await button(p, 'New Game').waitFor()
    await button(p, 'New Game').click()
    await p.getByRole('dialog', { name: 'Start game', exact: true }).waitFor()
    assert.equal(await prompt(p).count(), 0)
    await p.reload({ waitUntil: 'domcontentloaded' })
    await open(p)
    assert.deepEqual(errors, [])
    passed('blocked-storage-page-lifetime-answer-and-reload')
  } finally { await blocked.close() }

  const fallback = await browser.newContext({ viewport: { width: 640, height: 480 } })
  try {
    let blockedFonts = 0
    await fallback.route('**/original/frontend/felo33we.png', route => { blockedFonts++; return route.abort('failed') })
    const p = await fallback.newPage()
    await p.goto(url, { waitUntil: 'domcontentloaded' })
    await open(p)
    await prompt(p).locator('h2').getByText('As this is your first time playing', { exact: true }).waitFor()
    assert.ok(blockedFonts > 0)
    await p.screenshot({ path: resolve(output, 'recommendation-font-fallback.png') })
    await button(p, 'Back').click()
    assert.equal(await stored(p), null)
    passed('low-font-network-fallback-visible-and-cancelable')
  } finally { await fallback.close() }

  // One fresh software-WebGL scene only; failure and Retry use the actual loader.
  const tutorial = await browser.newContext({ viewport: { width: 640, height: 480 } })
  try {
    const p = await tutorial.newPage()
    const errors = []
    p.on('pageerror', error => errors.push(String(error)))
    let failures = 0
    await p.route('**/original/landscape.bin', route => { failures++; return route.abort('failed') })
    await p.goto(url, { waitUntil: 'domcontentloaded' })
    await open(p)
    await button(p, 'Yes').click()
    await p.getByRole('heading', { name: 'Loading failed', exact: true }).waitFor()
    assert.ok(failures > 0)
    assert.equal(await stored(p), 'answered', 'Choice persists even when subsequent loading fails')
    await p.unroute('**/original/landscape.bin')
    await button(p, 'Try again').click()
    const { bindGame } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)
    await bindGame(p)
    assert.equal(await p.evaluate(() => window.testStore.getWorld().outcome.level), 79)
    await p.screenshot({ path: resolve(output, 'recommendation-tutorial-ready.png') })
    assert.deepEqual(errors, [])
    passed('yes-original-tutorial-loader-failure-persistence-and-retry')
  } finally { await tutorial.close() }
  return { checks: progress, limits: ['Browser-adapted wrapping/button positions and storage policy; no native callback/profile equivalence', 'Software rendering, no hardware FPS claim'] }
}
