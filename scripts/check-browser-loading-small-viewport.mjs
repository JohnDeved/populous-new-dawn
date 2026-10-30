import { showAllMissions } from './browser-game.mjs'
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { launchOptions } from './local-render/harness.mjs'
import { bindGame } from './browser-game.mjs'

const url = process.env.POPULOUS_URL ?? 'http://localhost:3000'
const browser = await chromium.launch({ ...launchOptions(process.env.POPULOUS_BROWSER), headless: !process.argv.includes('--headed') })
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
  await showAllMissions(page)
  const mission = page.getByRole('button', { name: 'Mission 1', exact: true })
  await mission.waitFor()
  await mission.focus()
  await page.keyboard.press('Enter')
  await page.getByRole('heading', { name: 'Loading failed' }).waitFor()

  const retry = page.getByRole('button', { name: 'Try again' })
  const layer = await retry.evaluate(button => {
    const loading = button.closest('.loading-world'),
      rect = button.getBoundingClientRect(),
      top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
    return {
      loadingZ: Number(getComputedStyle(loading).zIndex),
      retryIsTopTarget: top === button || button.contains(top),
    }
  })
  assert.equal(await page.locator('.desktop-recommendation').count(), 0)
  assert.equal(layer.retryIsTopTarget, true, layer)
  await retry.click()
  await page.locator('.loading-world').waitFor({ state: 'detached' })

  await bindGame(page)
  assert.equal(await page.evaluate(() => globalThis.testStore.getWorld().outcome.level), 1)
  assert.deepEqual(pageErrors, [])
  await context.close()
  console.log('PASS: <=900px load failure keeps Try again pointer-reachable without a blocking desktop recommendation; retry reaches the game')
} finally {
  await browser.close()
}
