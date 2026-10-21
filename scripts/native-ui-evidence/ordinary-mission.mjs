import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export const candidateModule = (root, path) => import(pathToFileURL(resolve(root, path)).href)
export async function ordinaryMission(page, root, signal) {
  signal.throwIfAborted()
  const { openCampaignFromMainMenu } = await candidateModule(root, 'scripts/browser-new-game.mjs')
  const { bindGame } = await candidateModule(root, 'scripts/browser-game.mjs')
  const { pauseStartupReady, skipPauseIntroduction } = await candidateModule(root, 'scripts/local-render/original-pause-checkpoint-recovery.mjs')
  await openCampaignFromMainMenu(page)
  await page.getByRole('button', { name: 'Start Mission 1', exact: true }).click()
  await bindGame(page)
  const desktop = page.getByRole('button', { name: 'Continue anyway', exact: false })
  if (await desktop.isVisible()) await desktop.click()
  const startup = await page.waitForFunction(pauseStartupReady)
  const action = await startup.jsonValue(); await startup.dispose()
  if (action === 'skip') await skipPauseIntroduction(page)
  await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
  assert.equal(await page.evaluate(() => window.testStore.getWorld().outcome.level), 1)
  signal.throwIfAborted()
}
