import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { bindGame } from './browser-game.mjs'

const url = process.env.POPULOUS_URL ?? 'http://localhost:3000'

async function bindStore(page) {
  return page.evaluate(() => {
    const main = document.querySelector('main')
    let fiber = main?.[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
    for (; fiber; fiber = fiber.return)
      for (let hook = fiber.memoizedState; hook; hook = hook.next)
        if (hook.memoizedState?.getWorld) {
          globalThis.loadingTestStore = hook.memoizedState
          const world = hook.memoizedState.getWorld()
          return { level: world.outcome.level, paused: world.paused }
        }
    throw new Error('game store hook not found')
  })
}

async function waitForCount(read, expected, timeout = 10000) {
  const end = Date.now() + timeout
  while (read() < expected && Date.now() < end) await new Promise(resolve => setTimeout(resolve, 25))
  assert.ok(read() >= expected, `expected count ${expected}, got ${read()}`)
}

const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  const pageErrors = []
  page.on('pageerror', error => pageErrors.push(error.stack ?? error.message))
  page.on('console', message => {
    if (message.type() === 'error' && !message.text().includes('Failed to load resource'))
      pageErrors.push(message.text())
  })

  let mode = 'hold'
  let held = 0
  let releaseHeld
  let gate = new Promise(resolve => { releaseHeld = resolve })
  let failLandscape = false
  await page.route('**/original/**', async route => {
    const pathname = new URL(route.request().url()).pathname
    if (failLandscape && pathname.endsWith('/landscape.bin')) {
      failLandscape = false
      await route.abort('failed')
      return
    }
    if (
      mode === 'hold' &&
      (pathname.endsWith('/landscape.bin') || pathname.endsWith('/waves.bin'))
    ) {
      held++
      await gate
    }
    await route.continue()
  })

  await page.goto(url, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Mission 1', exact: true }).focus()
  await page.keyboard.press('Enter')
  await waitForCount(() => held, 2)
  await page.locator('.world-viewport canvas.battlefield').waitFor()
  const beforeInput = await bindStore(page)
  assert.equal(beforeInput.level, 1)
  assert.equal(await page.locator('.loading-world').count(), 1)
  await page.keyboard.press('Space')
  const afterInput = await bindStore(page)
  assert.equal(afterInput.paused, beforeInput.paused, 'keyboard input leaked through loading overlay')

  await page.setViewportSize({ width: 1100, height: 700 })
  const loadingBox = await page.locator('.loading-world').boundingBox()
  assert.ok(loadingBox && loadingBox.height >= 699 && loadingBox.width > 500, loadingBox)

  // Replace the world while the first scene still owns pending terrain requests. The old scene
  // must abort/dispose cleanly; the new scene uses the already-created texture preload promises.
  mode = 'pass'
  await page.evaluate(() => globalThis.loadingTestStore.startMission(2))
  releaseHeld()
  await page.locator('.loading-world').waitFor({ state: 'detached' })
  await bindGame(page)
  await page.getByRole('button', { name: /Skip introduction/ }).click()
  await page.waitForFunction(() => !globalThis.testScene.world.inputMask)
  assert.equal(await page.evaluate(() => globalThis.testStore.getWorld().outcome.level), 2)

  // Return through the shipped startup surface, force one critical terrain failure on Mission 3,
  // then prove retry recreates Mission 3 rather than restarting whichever world was current.
  await page.goto(url, { waitUntil: 'networkidle' })
  failLandscape = true
  await page.getByRole('button', { name: 'Mission 3', exact: true }).focus()
  await page.keyboard.press('Enter')
  await page.getByRole('heading', { name: 'The world could not awaken' }).waitFor()
  const failed = await bindStore(page)
  assert.equal(failed.level, 3)
  assert.equal(await page.locator('.loading-world').count(), 1)
  await page.keyboard.press('Space')
  assert.equal((await bindStore(page)).paused, failed.paused, 'keyboard input leaked through error overlay')
  await page.getByRole('button', { name: 'Try again' }).click()
  await page.locator('.loading-world').waitFor({ state: 'detached' })
  await bindGame(page)
  await page.getByRole('button', { name: /Skip introduction/ }).click()
  await page.waitForFunction(() => !globalThis.testScene.world.inputMask)
  assert.equal(await page.evaluate(() => globalThis.testStore.getWorld().outcome.level), 3)

  assert.deepEqual(pageErrors, [])
  await context.close()
  console.log(
    'PASS: cold resource gate, resize/input blocking, pending-scene cancellation, warm scene replacement, critical failure overlay and same-request Mission 3 retry'
  )
} finally {
  await browser.close()
}
