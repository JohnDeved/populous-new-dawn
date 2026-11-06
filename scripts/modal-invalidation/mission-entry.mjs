import assert from 'node:assert/strict'
import { settleWithin } from './deadline.mjs'
import { observeStartup, closeStartupProbe } from './startup-probe.mjs'

export function publicStartupReady() {
  const world = window.testStore.getWorld(), skip = document.querySelector('button.skip-introduction')
  return !world.inputMask || (skip && skip.getClientRects().length > 0 &&
    getComputedStyle(skip).visibility !== 'hidden' && !skip.disabled)
}
export function readBoundStartup(owners) {
  if (owners.startupProbe) {
    const state = owners.startupProbe.sample('bound-state'), report = owners.startupProbe.report
    if (state) return { ...state, activation: { count: report.clicks.length, extraClicks: report.extraClicks, click: report.clicks[0] ?? null } }
  }
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

export function validatePublicDelivery(activation, target) {
  assert.equal(activation?.count, 1, 'Exactly one observed public click is required')
  assert.equal(activation.extraClicks, 0)
  const click = activation.click
  assert.equal(click?.targetMatched, true); assert.equal(click.trusted, true); assert.equal(click.button, 0); assert.equal(click.detail, 1)
  assert.ok(Number.isFinite(click.clientX) && Number.isFinite(click.clientY))
  assert.ok(Math.abs(click.clientX - target.x) <= 1 && Math.abs(click.clientY - target.y) <= 1, 'Observed click missed the admitted point')
  for (const state of [click.capture, click.bubble]) {
    assert.ok(state, 'Matching native click capture and bubble are required')
    validateState(state)
    assert.equal(state.paused, false); assert.equal(state.modalSuspended, false); assert.equal(state.documentVisibility, 'visible')
  }
  assert.equal(click.capture.skipVisible, true); assert.equal(click.capture.controlUnchanged, true)
  assert.equal(click.capture.boundControlConnected, true)
  const phase = nativePhase(click)
  const bubble = click.bubble, expectedRemoval = ['warmup-unlocked', 'natural-before-dispatch'].includes(phase) &&
    bubble.controlPresent === false && bubble.boundControlConnected === false && !bubble.inputMask && !(bubble.flyby?.flags & 1)
  assert.ok((bubble.controlUnchanged === true && bubble.boundControlConnected === true) || expectedRemoval,
    'Public control was replaced or removed without a proven native completion')
  return phase
}
function nativePhase(click) {
  const before = click.capture.flyby, after = click.bubble.flyby
  assert.ok(before && after, 'Native flyby observations are required')
  for (const state of [before, after]) assert.ok(Number.isInteger(state.flags) && state.flags >= 0)
  if (!click.capture.inputMask) {
    assert.equal(click.bubble.inputMask, 0); assert.equal(before.flags & 1, 0); assert.equal(after.flags & 1, 0)
    return 'natural-before-dispatch'
  }
  assert.ok(before.flags & 1, 'Active native flyby phase is required')
  assert.ok(Number.isInteger(before.warmup) && before.warmup >= 0)
  if (before.warmup > 0) {
    assert.equal(click.bubble.inputMask, 0); assert.equal(after.flags & 1, 0)
    return 'warmup-unlocked'
  }
  assert.equal(before.warmup, 0)
  if (before.flags & 0x40) {
    assert.equal(after.flags, before.flags); assert.deepEqual(after.tracks, before.tracks)
    return 'already-finishing'
  }
  assert.ok(Number.isInteger(before.frameRate) && before.frameRate > 0)
  assert.equal(after.flags, before.flags | 0x48)
  const duration = before.frameRate * (before.frameRate < 11 ? 3 : 2)
  assert.equal(after.tracks?.length, 3)
  for (const [i, track] of after.tracks.entries()) {
    assert.equal(track.index, i + 1); assert.equal(track.active, true)
    assert.equal(track.frame, 0); assert.equal(track.duration, duration)
  }
  return 'native-blend-started'
}

// This dedicated scenario uses the candidate's visible public click contract.
// It does not claim or weaken the unrelated native-ui evidence v2 key contract.
export async function finishModalIntroduction(page, owners, trace, now = () => performance.now(), onUncertainInput) {
  assert.equal(typeof onUncertainInput, 'function', 'An independent owned-context cancellation callback is required')
  const start = now(), deadline = start + 2500
  Object.assign(trace, { contract: 'modal-public-pointer-unlock-v1', responseCapMs: 2500, attempts: 0 })
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
    const target = trace.before.publicClickTarget
    assert.ok(target && target.inViewport && target.positiveArea && target.finiteGeometry && target.notInert && target.unique && target.connected && target.hitMatchesControl,
      'Public Skip center is not an observed unobstructed target')
    assert.ok(Number.isFinite(target.x) && Number.isFinite(target.y))
    trace.attempts = 1; mark('click-start')
    let dispatchError
    const delivery = await settleWithin(async () => {
      try { await page.mouse.click(target.x, target.y, { button: 'left', clickCount: 1 }) }
      catch (error) { dispatchError = error; throw error }
    }, remaining())
    trace.delivery = delivery.status === 'timed-out' ? 'uncertain' : delivery.status
    if (delivery.status !== 'fulfilled') {
      mark('click-rejected')
      // A raw-input timeout is uncertain delivery, never a locator disappearance.
      // Do not rescue it with a later unlock or issue another input.
      const error = dispatchError ?? Object.assign(Error('Public pointer delivery timed out with uncertain outcome'), { name: 'TimeoutError' })
      trace.deliveryError = String(error); trace.deliveryUncertain = true
      trace.uncertainCancellationRequested = true
      try {
        void Promise.resolve(onUncertainInput(error)).catch(cause => { trace.uncertainCancellationError = String(cause).slice(0, 512) })
      } catch (cause) { trace.uncertainCancellationError = String(cause).slice(0, 512) }
      throw error
    }
    mark('click-fulfilled'); remaining()
    mark('unlock-wait-start')
    await page.waitForFunction(owners => {
      owners.startupProbe?.sample('unlock-poll')
      return window.testStore !== owners.store || window.testStore.getWorld() !== owners.world ||
        window.testSceneRef.current !== owners.scene || owners.scene.world !== owners.world || !owners.world.inputMask
    }, owners, { timeout: remaining() })
    mark('unlock-wait-fulfilled')
    trace.after = await page.evaluate(readBoundStartup, owners); remaining(); validateState(trace.after)
    trace.activationPhase = validatePublicDelivery(trace.after.activation, target)
    assert.equal(trace.after.inputMask, 0); trace.outcome = 'public-click-unlocked'
  } catch (error) { primary = error; mark('failed'); trace.outcome = 'failed'; trace.error = String(error); throw error }
  finally {
    trace.elapsedMs = now() - start
    if (!primary) assert.ok(trace.elapsedMs <= 2500, 'Public introduction response exceeded its cumulative budget')
  }
}

export async function enterModalMission(page, { openCampaignFromMainMenu, bindGame, signal, deadlineAt, trace, onUncertainInput }) {
  assert.equal(typeof onUncertainInput, 'function')
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
    await finishModalIntroduction(page, owners, trace, undefined, onUncertainInput)
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
