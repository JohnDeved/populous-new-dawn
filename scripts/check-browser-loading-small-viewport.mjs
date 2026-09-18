import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { bindGame } from './browser-game.mjs'

const url = process.env.POPULOUS_URL ?? 'http://localhost:3000'
const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
try {
  const context = await browser.newContext({ viewport: { width: 800, height: 700 } })
  const page = await context.newPage()
  const pageErrors = []
  page.on('pageerror', error => pageErrors.push(error.stack ?? error.message))
  page.on('console', message => {
    if (message.type() === 'error' && !message.text().includes('Failed to load resource'))
      pageErrors.push(message.text())
  })
  let failLandscape = true
  await page.route('**/original/landscape.bin', async route => {
    if (failLandscape) {
      failLandscape = false
      await route.abort('failed')
      return
    }
    await route.continue()
  })
  await page.goto(url, { waitUntil: 'networkidle' })
  const mission = page.getByRole('button', { name: 'Mission 1', exact: true })
  await mission.waitFor()
  await mission.focus()
  await page.keyboard.press('Enter')
  await page.getByRole('heading', { name: 'The world could not awaken' }).waitFor()

  const retry = page.getByRole('button', { name: 'Try again' })
  const layer = await retry.evaluate(button => {
    const loading = button.closest('.loading-world'),
      desktop = document.querySelector('.desktop-recommendation'),
      rect = button.getBoundingClientRect(),
      top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
    return {
      loadingZ: Number(getComputedStyle(loading).zIndex),
      desktopZ: Number(getComputedStyle(desktop).zIndex),
      retryIsTopTarget: top === button || button.contains(top),
    }
  })
  assert.ok(layer.loadingZ > layer.desktopZ, layer)
  assert.equal(layer.retryIsTopTarget, true, layer)
  await retry.click()
  await page.locator('.loading-world').waitFor({ state: 'detached' })

  const continueAnyway = page.getByRole('button', { name: /Continue anyway/ })
  await continueAnyway.waitFor()
  const desktopTarget = await continueAnyway.evaluate(button => {
    const rect = button.getBoundingClientRect(),
      top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
    return top === button || button.contains(top)
  })
  assert.equal(desktopTarget, true)
  await continueAnyway.click()
  await bindGame(page)
  assert.equal(await page.evaluate(() => globalThis.testStore.getWorld().outcome.level), 1)
  assert.deepEqual(pageErrors, [])
  await context.close()
  console.log('PASS: <=900px load failure keeps Try again above the desktop recommendation; retry succeeds and Continue anyway becomes pointer-reachable afterward')
} finally {
  await browser.close()
}
