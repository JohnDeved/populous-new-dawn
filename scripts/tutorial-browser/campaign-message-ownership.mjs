import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { bindGame, settleOpeningMessages } from '../browser-game.mjs'
import { openM2AuthoredMessage, closeM2AuthoredMessage } from './m2-pointer-f8.mjs'

export function assertDelayedCampaignCallbacks(checks) {
  assert.deepEqual(Object.keys(checks).sort(), ['summaryRejected', 'summaryPreserved', 'dismissPreserved', 'togglePreserved', 'oldSlotPreserved', 'currentSlotPreserved'].sort())
  assert.ok(Object.values(checks).every(value => value === true), 'Mounted stale callbacks must preserve both worlds; see delayedChecks')
}

// Actual mounted React callbacks, retained across a public Load. The delayed
// invocation is explicitly controlled test scheduling, not a natural user race.
export async function checkCampaignMessageOwnership({ page, output, stage, report, expectedText }) {
  report.limits = [
    'Explicit imported Mission 2 checkpoint, not earned progression or user save',
    'Mounted React callbacks retained before public Load and invoked afterward with controlled scheduling; not a naturally reproduced stale-click race',
    'The retained toggle receives a detached open clone as a supplied event target, distinct from the real publicly opened live box; not a native or naturally queued ToggleEvent',
    'Authored message 641 has no camera target; this episode does not establish stale focus or same-world slot-replacement behavior',
  ]
  const detail = page.locator('.campaign-messages details').filter({ has: page.locator('p', { hasText: expectedText }) })
  await closeM2AuthoredMessage(page)
  assert.equal(await detail.getAttribute('open'), null, 'Public modal close preserves the authored message')
  report.captured = await page.evaluate(captureMountedCampaignCallbacks)
  stage('campaign-mounted-handlers-retained')
  await page.getByRole('button', { name: 'Game settings', exact: true }).click()
  const menu = page.locator('dialog[data-original-pause-menu]')
  await menu.getByRole('button', { name: 'Load Game', exact: true }).click()
  await menu.getByRole('button', { name: 'Load checkpoint', exact: true }).click()
  await bindGame(page)
  await page.waitForFunction(() => window.testStore.getWorld() !== window.campaignCallbackWitness.world)
  await settleOpeningMessages(page)
  stage('campaign-reloaded-introduction-ready')
  report.afterLoadMessage = await openM2AuthoredMessage(page)
  stage('campaign-reloaded-message-ready')
  assert.equal(report.afterLoadMessage.text, expectedText)
  await closeM2AuthoredMessage(page)
  await page.waitForFunction(() => !window.testSceneRef.current.messageModal && !window.testStore.getWorld().inputMask)
  await page.getByRole('button', { name: 'Pause game', exact: true }).click()
  await page.waitForFunction(() => window.testStore.getWorld().paused)
  const reopened = await openM2AuthoredMessage(page)
  assert.equal(reopened.serial, report.afterLoadMessage.serial, 'Reopen the same freshly loaded authored message')
  // Publicly close the fresh message; the serial-keyed DOM may be reused by
  // React, so a detached-node click would be vacuous and is deliberately avoided.
  await closeM2AuthoredMessage(page)
  assert.equal(await detail.getAttribute('open'), null)
  report.delayed = await page.evaluate(replayMountedCampaignCallbacks)
  stage('campaign-delayed-callbacks-observed')
  // Record all delayed outcomes before asserting, so an unpatched baseline
  // preserves concrete old-slot mutation and default-prevention failures.
  report.delayedChecks = {
    summaryRejected: report.delayed.prevented === 1,
    summaryPreserved: JSON.stringify(report.delayed.before) === JSON.stringify(report.delayed.afterSummary),
    dismissPreserved: JSON.stringify(report.delayed.afterSummary) === JSON.stringify(report.delayed.afterDismiss),
    oldSlotPreserved: report.delayed.oldSlotStillExact,
    currentSlotPreserved: report.delayed.currentSlotStillExact,
  }
  await detail.locator('summary').click()
  assert.notEqual(await detail.getAttribute('open'), null, 'Fresh mounted summary still opens')
  await page.waitForFunction(() => window.testSceneRef.current.messageModal)
  report.delayedToggle = await page.evaluate(replayMountedCampaignToggle)
  report.delayedChecks.togglePreserved = report.delayedToggle.preserved
  stage('campaign-delayed-toggle-observed')
  // In a stock counterfactual the delayed toggle can close the fresh box.
  // Reopen only through public input so prior live Dismiss checks still run.
  if (await detail.getAttribute('open') === null) await detail.locator('summary').click()
  report.currentBeforeDismiss = await page.evaluate(() => {
    const world = window.testStore.getWorld(), slot = window.campaignCallbackWitness.slot
    window.campaignLiveDismiss = { world, slot, message: world.messages.slots[slot] }
    return { slot, serial: world.messages.slots[slot]?.serial, stringId: world.messages.slots[slot]?.stringId }
  })
  await detail.getByRole('button', { name: 'Dismiss campaign message', exact: true }).click()
  await detail.waitFor({ state: 'detached' })
  report.currentDismiss = await page.evaluate(() => {
    const witness = window.campaignLiveDismiss
    return { sameWorld: window.testStore.getWorld() === witness.world, removedExactSlot: witness.world.messages.slots[witness.slot] === null,
      inputs: window.campaignCallbackInputs }
  })
  assertCurrentCampaignDismiss(report.currentDismiss)
  stage('campaign-live-dismiss-assertions-verified')
  await page.screenshot({ path: resolve(output, 'campaign-message-after-public-dismiss.png') })
  stage('campaign-public-dismiss-verified')
  assertDelayedCampaignCallbacks(report.delayedChecks)
  return report
}

export function captureMountedCampaignCallbacks() {
    const store = window.testStore, world = store.getWorld(), scene = window.testSceneRef.current
    const slot = world.messages.slots.findIndex(message => message?.stringId === 641)
    const message = world.messages.slots[slot]
    const details = document.querySelector(`.campaign-messages details[data-message-serial="${message?.serial}"]`)
    const summary = details?.querySelector('summary'), dismiss = details?.querySelector('button[aria-label="Dismiss campaign message"]')
    const props = element => element?.[Object.keys(element).find(key => key.startsWith('__reactProps'))]
    if (slot < 0 || !message || !summary?.isConnected || !dismiss?.isConnected || details.open || !world.paused || scene.world !== world)
      throw Error('Expected one settled mounted authored message in the paused current world')
    const onSummary = props(summary)?.onClick, onDismiss = props(dismiss)?.onClick,
      onToggle = props(details)?.onToggle
    if ([onSummary, onDismiss, onToggle].some(handler => typeof handler !== 'function'))
      throw Error('Actual mounted React handlers unavailable')
    if (message.view) throw Error('Expected text-only authored message 641; do not silently change focus coverage')
    window.campaignCallbackWitness = { store, world, message, slot, summary, details, onSummary, onDismiss, onToggle }
    window.campaignCallbackInputs = []
    document.addEventListener('click', event => {
      const label = event.target.closest?.('button,summary')?.getAttribute('aria-label')
      if (label === 'Dismiss campaign message' || label === 'Read campaign message')
        window.campaignCallbackInputs.push({ label, trusted: event.isTrusted })
    }, true)
    return { slot, serial: message.serial, stringId: message.stringId, turn: world.turn, mounted: true, hasView: !!message.view }
}

export function replayMountedCampaignCallbacks() {
    const captured = window.campaignCallbackWitness
    const world = window.testStore.getWorld(), scene = window.testSceneRef.current
    const current = world.messages.slots[captured.slot]
    if (world === captured.world || window.testStore !== captured.store || scene.world !== world || !scene.renderer.domElement.isConnected || !world.paused || !current || current === captured.message || current.stringId !== 641)
      throw Error('Public Load must establish distinct live world/message with matching mounted Scene')
    const snapshot = () => ({ old: JSON.stringify(captured.world.messages.slots), current: JSON.stringify(world.messages.slots), camera: JSON.stringify(scene.cameraMotion) })
    const before = snapshot()
    let prevented = 0
    // This is the actual retained function, not extracted/recompiled source.
    captured.onSummary({ currentTarget: captured.summary, preventDefault() { prevented++ } })
    const afterSummary = snapshot()
    captured.onDismiss()
    const afterDismiss = snapshot()
    return { replacedWorld: true, replacedMessage: true, prevented, before, afterSummary, afterDismiss,
      oldSlotStillExact: captured.world.messages.slots[captured.slot] === captured.message,
      currentSlotStillExact: world.messages.slots[captured.slot] === current }
}

// A serial-keyed element may itself be reused by React. A disconnected clone
// models the old event's open leaf without writing or firing a toggle on the
// real current node. Only the captured actual Home handler can change it here.
export function replayMountedCampaignToggle() {
    const captured = window.campaignCallbackWitness
    const world = window.testStore.getWorld(), scene = window.testSceneRef.current
    const current = world.messages.slots[captured.slot]
    const live = document.querySelector(`.campaign-messages details[data-message-serial="${current?.serial}"]`)
    if (world === captured.world || window.testStore !== captured.store || scene.world !== world ||
        !scene.renderer.domElement.isConnected || !world.paused || !scene.messageModal ||
        !current || current === captured.message || current.stringId !== 641 || !live?.isConnected || !live.open)
      throw Error('Delayed toggle requires the publicly reopened fresh world and actual mounted modal')
    const supplied = captured.details.cloneNode(false)
    supplied.open = true
    if (supplied.isConnected || supplied === live) throw Error('Expected a separate detached toggle target')
    const snapshot = () => ({
      open: live.open,
      modal: scene.messageModal,
      paused: world.paused,
      turn: world.turn,
      oldSlotExact: captured.world.messages.slots[captured.slot] === captured.message,
      currentSlotExact: world.messages.slots[captured.slot] === current,
      worldExact: window.testStore.getWorld() === world && window.testSceneRef.current === scene,
    })
    const before = snapshot()
    captured.onToggle({ currentTarget: supplied })
    const after = snapshot()
    return { before, after, suppliedDetached: !supplied.isConnected, mountedNodeReused: captured.details === live,
      preserved: JSON.stringify(before) === JSON.stringify(after) && before.oldSlotExact &&
        before.currentSlotExact && before.worldExact && !supplied.isConnected }
}

export function assertCurrentCampaignDismiss(result) {
  assert.equal(result.sameWorld, true)
  assert.equal(result.removedExactSlot, true)
  for (const label of ['Dismiss campaign message', 'Read campaign message'])
    assert.ok(result.inputs.some(event => event.label === label && event.trusted === true))
}
