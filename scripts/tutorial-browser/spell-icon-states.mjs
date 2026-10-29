import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame, showAllMissions } from '../browser-game.mjs'
import { runSpellIconMatrix, spellIconLimits } from '../spell-icon-state-browser.mjs'
import { runSpellIconEvidence, spellIconSourceSnapshot, spellIconPartitions } from '../spell-icon-state-evidence.mjs'

// Nested inside, never replacing or enlarging, the current runner-wide scenario bound.
// Current policy: Tutorial 240s; frontend-held-escape 180s. No policy change here.
export const spellIconEpisodeLimitMs = 75000

export default async function spellIconStates({ browser, url, output, root, episode }) {
  assert.ok(Object.hasOwn(spellIconPartitions, episode), 'Hosted spell icon episode must be a reviewed partition')
  const report = { status: 'running', startedAt: new Date().toISOString(), states: [],
    limits: [...spellIconLimits, 'Actual Home through plain Vite, not Vinext/Cloudflare/RSC hosting.'],
    episodeLimitMs: spellIconEpisodeLimitMs }
  const save = () => writeFileSync(resolve(output, 'spell-icon-states.json'), JSON.stringify(report, null, 2) + '\n')
  const open = async (observedBrowser, mission = 1) => {
    const context = await observedBrowser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
    const page = await context.newPage()
    page.setDefaultTimeout(10000)
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await showAllMissions(page)
    await page.getByRole('button', { name: `Mission ${mission}`, exact: true }).focus()
    await page.keyboard.press('Enter')
    await bindGame(page)
    const startup = await page.waitForFunction(() => {
      const world = window.testStore.getWorld(), skip = document.querySelector('button.skip-introduction')
      if (!world.inputMask) return 'ready'
      return skip && skip.getClientRects().length && getComputedStyle(skip).visibility !== 'hidden' && !skip.disabled ? 'skip' : false
    })
    if (await startup.jsonValue() === 'skip') await page.getByRole('button', { name: /^Skip introduction/ }).click()
    await startup.dispose()
    await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
    await page.evaluate(() => { window.testScene = window.testSceneRef.current })
    return { page }
  }
  await runSpellIconEvidence({ report, save, closeBrowser: false, timeout: spellIconEpisodeLimitMs,
    snapshot: () => spellIconSourceSnapshot(root), launch: async () => browser,
    run: (sharedBrowser, observedBrowser) => runSpellIconMatrix({ browser: sharedBrowser, observedBrowser, open, url, output, report, save, episode }) })
  assert.equal(report.status, 'passed', `Spell icon episode failed: ${report.error ?? report.cleanupError ?? report.sourceError}`)
  return { status: report.status, episode, states: report.states.length, originalFrames: report.originalPixels.length,
    sourceUnchanged: report.sourceUnchanged, contextsClosed: report.contextsClosed,
    evidence: 'spell-icon-states.json', episodeLimitMs: spellIconEpisodeLimitMs }
}
