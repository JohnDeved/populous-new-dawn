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
function assertPopupRetryEvidence(attempt) {
  assert.equal(attempt?.outcome, 'popup-owned-unchanged-retry')
  assert.equal(attempt.deliveryError, undefined, 'Delivery failure cannot authorize excluded preparation')
  assert.equal(attempt.afterSource, 'atomic-post-dispatch-witness')
  const delivery = attempt.delivery, atomic = attempt.atomicAfter
  assert.equal(delivery?.keyDeliveryFailed, false)
  assert.equal(delivery.pending, false)
  assert.equal(delivery.phase, 'finalize-space-witness')
  assert.equal(delivery.phaseError, null)
  assert.deepEqual(delivery.completed?.map(step => [step.phase, step.status]), [
    ['install-space-witness', 'fulfilled'], ['public-space-key', 'fulfilled'], ['finalize-space-witness', 'fulfilled'],
  ], 'All three actual witness/input operations must have settled successfully')
  let previous = 0
  for (const step of delivery.completed) {
    assert.ok(Number.isFinite(step.startedMs) && step.startedMs >= previous)
    assert.ok(Number.isFinite(step.finishedMs) && step.finishedMs >= step.startedMs)
    previous = step.finishedMs
  }
  assert.equal(typeof atomic?.observationId, 'string')
  assert.ok(atomic.observationId.length > 0)
  assert.equal(atomic.observationId, atomic.witnessId)
  assert.equal(atomic.witnessPresent, true)
  assert.ok(Array.isArray(atomic.records) && atomic.records.length === 1)
  assert.deepEqual(attempt.ownership, atomic.records, 'Authorization must use the same atomic ownership evidence')
  const record = atomic.records[0]
  assert.equal(record?.trusted, true); assert.equal(record.repeat, false)
  assert.equal(record.prevented, true); assert.equal(record.sameWorld, true)
  assert.ok(Array.isArray(record.owners) && record.owners.length > 0 &&
    record.owners.every(owner => typeof owner === 'string' && owner.length > 0))
  const native = state => {
    assert.ok(state && typeof state.paused === 'boolean' && Number.isInteger(state.inputMask) && Number.isInteger(state.flybyFlags))
    return { paused: state.paused, inputMask: state.inputMask, flybyFlags: state.flybyFlags }
  }
  const before = native(attempt.before)
  assert.equal(attempt.before.action, 'skip'); assert.equal(attempt.after?.action, 'skip')
  assert.ok((before.inputMask & 64) && (before.flybyFlags & 0x51) === 0x11)
  for (const state of [attempt.after, atomic.state, record.before, record.after])
    assert.deepEqual(native(state), before, 'Popup retry requires unchanged native state from that atomic observation')
}

export function assertMissionInputBudget(trace) {
  assert.equal(trace.contract, 'public-setup-cumulative-response-v2')
  assert.equal(trace.responseCapMs, 2500)
  const finite = n => Number.isFinite(n) && n >= 0
  const equal = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-6, `Budget accounting mismatch: ${actual} != ${expected}`)
  assert.ok(Number.isFinite(trace.actionCapMs) && trace.actionCapMs > 0 && trace.actionCapMs <= pageActionTimeout)
  for (const key of ['responseStartedMs', 'responseDeadlineMs', 'responseSpentMs', 'retryPreparationMs', 'elapsedMs', 'wallElapsedMs'])
    assert.ok(finite(trace[key]), `Finite ${key} required`)
  assert.equal(trace.retryLimit, 1)
  assert.ok(trace.retryCount === 0 || trace.retryCount === 1)
  assert.equal(trace.retryPreparations?.length, trace.retryCount)
  assert.equal(trace.responseWindows?.length, trace.retryCount + 1)
  assert.ok(Array.isArray(trace.attempts) && trace.attempts.length === trace.retryCount + 1)
  const finalAttempt = trace.attempts.at(-1)
  assert.ok(finalAttempt?.outcome === 'completed' || finalAttempt?.outcome === 'natural-completion')
  if (finalAttempt.outcome === 'natural-completion') {
    assert.equal(finalAttempt.before?.action, 'ready'); assert.equal(finalAttempt.before.inputMask, 0)
    for (const key of ['delivery', 'deliveryError', 'ownership', 'atomicAfter', 'after', 'afterSource'])
      assert.equal(finalAttempt[key], undefined, 'Natural completion must not claim dispatched input')
  }
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
      assertPopupRetryEvidence(trace.attempts[index - 1])
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
