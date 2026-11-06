import assert from 'node:assert/strict'
import { settleWithin } from './deadline.mjs'
import { observeStartup, closeStartupProbe } from './startup-probe.mjs'

export function publicStartupReady() {
  const world = window.testStore.getWorld(), skip = document.querySelector('button.skip-introduction')
  return !world.inputMask || (skip && skip.getClientRects().length > 0 &&
    getComputedStyle(skip).visibility !== 'hidden' && !skip.disabled)
}
export function readBoundStartup(owners) {
  if (owners.startupProbe) { const state = owners.startupProbe.sample('bound-state'); if (state) return state }
  const world = window.testStore.getWorld(), skip = document.querySelector('button.skip-introduction')
  return { ownerUnchanged: window.testStore === owners.store && world === owners.world &&
    window.testSceneRef.current === owners.scene && owners.scene.world === world,
  inputMask: world.inputMask, level: world.outcome.level, cheats: window.testStore.hasUsedCheats(),
  skipVisible: !!skip && skip.getClientRects().length > 0 && getComputedStyle(skip).visibility !== 'hidden' && !skip.disabled }
}
function validateState(state) {
  assert.equal(state.ownerUnchanged, true, 'Mission startup owner changed')
  assert.equal(state.level, 1); assert.equal(state.cheats, false)
  assert.ok(Number.isInteger(state.inputMask) && state.inputMask >= 0)
}

// This dedicated scenario uses the candidate's visible public click contract.
// It does not claim or weaken the unrelated native-ui evidence v2 key contract.
export async function finishModalIntroduction(page, owners, trace, now = () => performance.now()) {
  const start = now(), deadline = start + 2500
  Object.assign(trace, { contract: 'modal-public-click-unlock-v1', responseCapMs: 2500, attempts: 0 })
  const remaining = () => {
    const value = deadline - now()
    assert.ok(value > 0, 'Public introduction click/unlock budget expired')
    return value
  }
  trace.operations = []
  const mark = phase => { if (trace.operations.length < 16) trace.operations.push({ phase, elapsedMs: now() - start, at: new Date().toISOString() }) }
  let primary
  try {
    mark('initial-observation-start')
    trace.before = await page.evaluate(observeStartup, owners); mark('initial-observation-complete'); remaining(); validateState(trace.before)
    if (!trace.before.inputMask) { trace.outcome = 'natural-before-click'; return }
    assert.equal(trace.before.skipVisible, true, 'Only an observed visible Skip control may be activated')
    trace.attempts = 1
    try {
      mark('click-start')
      await page.getByRole('button', { name: /^Skip introduction/ }).click({ timeout: remaining(), noWaitAfter: true })
      mark('click-fulfilled'); trace.delivery = 'fulfilled'
    } catch (error) {
      mark('click-rejected'); trace.delivery = 'rejected'; trace.deliveryError = String(error)
      // Preserve every non-timeout delivery failure, even if the world later unlocks.
      if (error.name !== 'TimeoutError') throw error
      trace.after = await page.evaluate(readBoundStartup, owners); remaining(); validateState(trace.after)
      if (trace.after.inputMask) throw error
      trace.outcome = 'natural-during-click'; return
    }
    mark('unlock-wait-start')
    await page.waitForFunction(owners => {
      owners.startupProbe?.sample('unlock-poll')
      return window.testStore !== owners.store || window.testStore.getWorld() !== owners.world ||
        window.testSceneRef.current !== owners.scene || owners.scene.world !== owners.world || !owners.world.inputMask
    }, owners, { timeout: remaining() })
    mark('unlock-wait-fulfilled')
    trace.after = await page.evaluate(readBoundStartup, owners); remaining(); validateState(trace.after)
    assert.equal(trace.after.inputMask, 0); trace.outcome = 'public-click-unlocked'
  } catch (error) { primary = error; mark('failed'); trace.outcome = 'failed'; trace.error = String(error); throw error }
  finally {
    trace.elapsedMs = now() - start
    if (!primary) assert.ok(trace.elapsedMs <= 2500, 'Public introduction response exceeded its cumulative budget')
  }
}

export async function enterModalMission(page, { openCampaignFromMainMenu, bindGame, signal, deadlineAt, trace }) {
  assert.ok(Number.isFinite(deadlineAt) && deadlineAt > Date.now())
  trace.status = 'running'; trace.deadlineAt = deadlineAt
  let owners, timer, primary
  const expired = new Promise((_, reject) => {
    timer = setTimeout(() => reject(Error('Modal mission entry deadline expired')), deadlineAt - Date.now())
  })
  const guard = () => { signal.throwIfAborted(); assert.ok(Date.now() < deadlineAt, 'Modal mission entry deadline expired') }
  const work = (async () => {
    guard()
    await openCampaignFromMainMenu(page); guard()
    await page.getByRole('button', { name: 'Start Mission 1', exact: true }).click(); guard()
    await bindGame(page); guard()
    const desktop = page.getByRole('button', { name: 'Continue anyway', exact: false })
    const recommendationVisible = await desktop.isVisible(); guard()
    if (recommendationVisible) { await desktop.click(); guard() }
    await page.waitForFunction(publicStartupReady); guard()
    owners = await page.evaluateHandle(() => ({ store: window.testStore, world: window.testStore.getWorld(), scene: window.testSceneRef.current })); guard()
    await finishModalIntroduction(page, owners, trace)
    signal.throwIfAborted(); assert.ok(Date.now() < deadlineAt)
  })()
  try { await Promise.race([work, expired]) }
  catch (error) { primary = error }
  finally {
    clearTimeout(timer)
    // The driver's independent context owner closes any timed-out setup work.
    const disposed = await settleWithin(async () => {
      if (!owners) return
      try {
        trace.observations = await page.evaluate(closeStartupProbe, owners)
        assert.equal(trace.observations.closed, true); assert.equal(trace.observations.listeners, 0)
      } finally { await owners.dispose() }
    }, 500)
    trace.ownerHandleCleanup = disposed.status
    if (disposed.status !== 'fulfilled') primary ??= Error('Mission owner handle cleanup failed')
  }
  trace.status = primary ? 'failed' : 'passed'
  if (primary) { trace.error = String(primary); throw primary }
}
