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
  assert.equal(trace.contract, 'public-setup-cumulative-response-v2')
  assert.equal(trace.responseCapMs, 2500)
  const finite = n => Number.isFinite(n) && n >= 0
  const equal = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-6, `Budget accounting mismatch: ${actual} != ${expected}`)
  assert.ok(trace.actionCapMs > 0 && trace.actionCapMs <= pageActionTimeout)
  for (const key of ['responseStartedMs', 'responseDeadlineMs', 'responseSpentMs', 'retryPreparationMs', 'elapsedMs', 'wallElapsedMs'])
    assert.ok(finite(trace[key]), `Finite ${key} required`)
  assert.equal(trace.retryLimit, 1)
  assert.ok(trace.retryCount === 0 || trace.retryCount === 1)
  assert.equal(trace.retryPreparations?.length, trace.retryCount)
  assert.equal(trace.responseWindows?.length, trace.retryCount + 1)
  assert.ok(trace.responseSpentMs <= 2500 && trace.elapsedMs <= trace.actionCapMs)
  equal(trace.wallElapsedMs, trace.elapsedMs)
  equal(trace.responseSpentMs, trace.elapsedMs - trace.responseStartedMs - trace.retryPreparationMs)
  let excluded = 0, spent = 0
  for (const [index, window] of trace.responseWindows.entries()) {
    assert.ok([window.startedMs, window.finishedMs, window.deadlineMs].every(finite))
    assert.ok(window.finishedMs >= window.startedMs && window.finishedMs <= window.deadlineMs)
    if (index === 0) {
      equal(window.startedMs, trace.responseStartedMs)
      equal(window.deadlineMs, Math.min(trace.actionCapMs, window.startedMs + 2500))
    } else {
      const preparation = trace.retryPreparations[index - 1], previous = trace.responseWindows[index - 1]
      assert.equal(preparation.status, 'passed')
      assert.equal(preparation.afterAttempt, index)
      assert.equal(trace.attempts?.[index - 1]?.outcome, 'popup-owned-unchanged-retry')
      assert.ok([preparation.startedMs, preparation.finishedMs, preparation.elapsedMs].every(finite))
      assert.equal(preparation.actionDeadlineMs, trace.actionCapMs)
      equal(preparation.startedMs, previous.finishedMs)
      equal(preparation.elapsedMs, preparation.finishedMs - preparation.startedMs)
      equal(window.startedMs, preparation.finishedMs)
      equal(window.deadlineMs, Math.min(trace.actionCapMs, previous.deadlineMs + preparation.elapsedMs))
      excluded += preparation.elapsedMs
    }
    spent += window.finishedMs - window.startedMs
  }
  equal(excluded, trace.retryPreparationMs)
  equal(spent, trace.responseSpentMs)
  equal(trace.responseWindows.at(-1).finishedMs, trace.elapsedMs)
  equal(trace.responseWindows.at(-1).deadlineMs, trace.responseDeadlineMs)
}

export async function ordinaryMission(page, root, { signal, deadlineAt, trace }) {
  trace.status = 'running'; trace.deadlineAt = deadlineAt
  try {
    signal.throwIfAborted()
    assert.ok(Number.isFinite(deadlineAt) && deadlineAt > Date.now(), 'Mission entry requires the live episode deadline')
    const { openCampaignFromMainMenu } = await candidateModule(root, 'scripts/browser-new-game.mjs')
    const { bindGame } = await candidateModule(root, 'scripts/browser-game.mjs')
    const { pauseStartupReady, skipPauseIntroduction, recoveryRetryInputContract } = await candidateModule(root, 'scripts/local-render/original-pause-checkpoint-recovery.mjs')
    assert.equal(recoveryRetryInputContract, 'public-setup-cumulative-response-v2', 'Candidate must explicitly support the bounded setup contract')
    await openCampaignFromMainMenu(page)
    await page.getByRole('button', { name: 'Start Mission 1', exact: true }).click()
    await bindGame(page)
    const desktop = page.getByRole('button', { name: 'Continue anyway', exact: false })
    if (await desktop.isVisible()) await desktop.click()
    const startup = await page.waitForFunction(pauseStartupReady)
    const action = await startup.jsonValue(); await startup.dispose()
    trace.startupAction = action
    if (action === 'skip') {
      await skipPauseIntroduction(page, { setupTimeout: pageActionTimeout, deadlineAt, signal, trace, popupRetryPreparation: true })
      assertMissionInputBudget(trace)
    }
    await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
    assert.equal(await page.evaluate(() => window.testStore.getWorld().outcome.level), 1)
    signal.throwIfAborted()
    trace.status = 'passed'
  } catch (error) { trace.status = 'failed'; trace.error = String(error); throw error }
}
