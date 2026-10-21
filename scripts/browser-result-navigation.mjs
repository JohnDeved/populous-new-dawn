import { bindGame } from './browser-game.mjs'

// Public result inputs only. Observation aliases inspect ownership but never
// mutate the world or call store launch/navigation APIs.
export async function enterResultSelector(page) {
  if (await page.getByRole('dialog', { name: 'Start game', exact: true }).isVisible()) return
  await bindGame(page)
  await page.locator('[data-original-result]').waitFor({ state: 'visible' })
  await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
  await page.locator('.world-viewport').focus()
  if (await page.evaluate(() => window.testSceneRef.current.focusPauseOwned)) {
    await page.keyboard.press('Space')
  }
  const overlay = page.locator('[data-original-result][data-result-stage="terminal-overlay"]')
  if (await overlay.isVisible()) {
    await page.keyboard.press('Space')
    const stats = page.locator('[data-original-result][data-result-stage="statistics"]')
    const selector = page.getByRole('dialog', { name: 'Start game', exact: true })
    await stats.or(selector).first().waitFor({ state: 'visible' })
  }
  if (await page.locator('[data-original-result][data-result-stage="statistics"]').isVisible()) {
    await page.keyboard.press('Space')
  }
  await page.getByRole('dialog', { name: 'Start game', exact: true }).waitFor({ state: 'visible' })
}

export async function continueThroughNativeSelector(page, mission) {
  await enterResultSelector(page)
  const selector = page.getByRole('dialog', { name: 'Start game', exact: true })
  const start = selector.getByRole('button', { name: new RegExp(`^(Start|Replay) Mission ${mission}$`) })
  await start.waitFor({ state: 'visible' })
  await start.click()
  await bindGame(page)
}
