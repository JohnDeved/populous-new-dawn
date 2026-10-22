import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { pageActionTimeout } from './browser-owner.mjs'

export const candidateModule = (root, path) => import(pathToFileURL(resolve(root, path)).href)
// Evidence persistence must not replace an already-observed input failure.
export function saveMissionInputTrace(save, primaryError) {
  try { save() }
  catch (error) {
    if (!primaryError) throw error
    primaryError.traceWriteError = String(error)
  }
}
// Acceptance must observe the candidate's actual opted-in contract, not merely
// pass options to an older helper that silently ignores them.
export function assertMissionInputBudget(trace) {
  assert.equal(trace.contract, 'public-setup-then-response-v1')
  assert.equal(trace.responseCapMs, 2500)
  assert.ok(trace.actionCapMs > 0 && trace.actionCapMs <= pageActionTimeout)
  assert.ok(Number.isFinite(trace.responseStartedMs) && trace.responseStartedMs >= 0)
  assert.ok(trace.responseDeadlineMs > trace.responseStartedMs && trace.responseDeadlineMs <= trace.actionCapMs)
  assert.ok(trace.responseDeadlineMs - trace.responseStartedMs <= 2500)
  assert.ok(trace.elapsedMs >= trace.responseStartedMs && trace.elapsedMs <= trace.responseDeadlineMs)
}
export async function ordinaryMission(page, root, { signal, deadlineAt, trace }) {
  trace.status = 'running'; trace.deadlineAt = deadlineAt
  try {
    signal.throwIfAborted()
    assert.ok(Number.isFinite(deadlineAt) && deadlineAt > Date.now(), 'Mission entry requires the live episode deadline')
    const { openCampaignFromMainMenu } = await candidateModule(root, 'scripts/browser-new-game.mjs')
    const { bindGame } = await candidateModule(root, 'scripts/browser-game.mjs')
    const { pauseStartupReady, skipPauseIntroduction, recoveryInputContract } = await candidateModule(root, 'scripts/local-render/original-pause-checkpoint-recovery.mjs')
    assert.equal(recoveryInputContract, 'public-setup-then-response-v1', 'Candidate must explicitly support the bounded setup contract')
    await openCampaignFromMainMenu(page)
    await page.getByRole('button', { name: 'Start Mission 1', exact: true }).click()
    await bindGame(page)
    const desktop = page.getByRole('button', { name: 'Continue anyway', exact: false })
    if (await desktop.isVisible()) await desktop.click()
    const startup = await page.waitForFunction(pauseStartupReady)
    const action = await startup.jsonValue(); await startup.dispose()
    trace.startupAction = action
    if (action === 'skip') {
      await skipPauseIntroduction(page, { setupTimeout: pageActionTimeout, deadlineAt, signal, trace })
      assertMissionInputBudget(trace)
    }
    await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
    assert.equal(await page.evaluate(() => window.testStore.getWorld().outcome.level), 1)
    signal.throwIfAborted()
    trace.status = 'passed'
  } catch (error) { trace.status = 'failed'; trace.error = String(error); throw error }
}
