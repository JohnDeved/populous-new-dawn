import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { bindGame, settleView } from './browser-game.mjs'

const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }),
    page = await context.newPage(),
    errors = []
  page.on('pageerror', error => errors.push(error.stack ?? error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto(process.env.POPULOUS_URL ?? 'http://localhost:3000', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Tutorial', exact: true }).click()
  await bindGame(page)
  await settleView(page)
  await page.waitForFunction(() => window.testScene.world.ai.variables[9] === 2)
  assert.equal(await page.locator('.world-message').count(), 0)
  assert.deepEqual(
    await page.evaluate(() => ({
      level: window.testScene.world.outcome.level,
      drawMode: window.testScene.world.drawMode,
      overview: window.testScene.overviewActive,
      stage: window.testScene.world.ai.variables[9],
      rendered: window.testScene.world.units.every(unit => window.testScene.unitMeshes.has(unit.id)),
    })),
    { level: 79, drawMode: 2, overview: true, stage: 2, rendered: true }
  )
  await page.keyboard.press('Enter')
  await settleView(page)
  await page.waitForFunction(() => window.testScene.world.ai.variables[9] === 3)
  const nextLesson = page
    .locator('.campaign-messages')
    .getByText(/Move the mouse pointer to the edge/)
  await nextLesson.waitFor()
  assert.equal(await nextLesson.count(), 1)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Quit to Main Menu', exact: true }).waitFor()
  assert.equal(await page.getByRole('button', { name: 'Save checkpoint', exact: true }).count(), 0)
  await page.getByRole('button', { name: 'Quit to Main Menu', exact: true }).click()
  await page.getByRole('heading', { name: 'Choose your world', exact: true }).waitFor()
  assert.deepEqual(errors, [])
  console.log('PASS: Tutorial entry, World View input lesson, and normal exit')
} finally {
  await browser.close()
}
