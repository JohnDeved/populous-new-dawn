import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { bindGame } from '../browser-game.mjs'

export function assertDelayedCampaignCallbacks(checks) {
  assert.deepEqual(Object.keys(checks).sort(), ['summaryRejected', 'summaryPreserved', 'dismissPreserved', 'oldSlotPreserved', 'currentSlotPreserved'].sort())
  assert.ok(Object.values(checks).every(value => value === true), 'Mounted stale callbacks must preserve both worlds; see delayedChecks')
}

// Actual mounted React callbacks, retained across a public Load. The delayed
// invocation is explicitly controlled test scheduling, not a natural user race.
export async function checkCampaignMessageOwnership({ page, output, stage, report, messageReady, expectedText }) {
  report.limits = [
    'Explicit imported Mission 2 checkpoint, not earned progression or user save',
    'Mounted React callbacks retained before public Load and invoked afterward with controlled scheduling; not a naturally reproduced stale-click race',
    'Authored message 641 has no camera target; this episode does not establish stale focus or same-world slot-replacement behavior',
  ]
  const detail = page.locator('.campaign-messages details').filter({ has: page.locator('p', { hasText: expectedText }) })
  await detail.locator('summary').click()
  assert.equal(await detail.getAttribute('open'), null, 'Public summary closes the authored message')
  report.captured = await page.evaluate(captureMountedCampaignCallbacks)
  stage('campaign-mounted-handlers-retained')
  await page.getByRole('button', { name: 'Game settings', exact: true }).click()
  const menu = page.locator('dialog[data-original-pause-menu]')
  await menu.getByRole('button', { name: 'Load Game', exact: true }).click()
  await menu.getByRole('button', { name: 'Load checkpoint', exact: true }).click()
  await bindGame(page)
  await page.waitForFunction(() => window.testStore.getWorld() !== window.campaignCallbackWitness.world)
  const skip = page.getByRole('button', { name: /^Skip introduction/ })
  await page.waitForFunction(() => !!document.querySelector('.skip-introduction') || !window.testStore.getWorld().inputMask)
  if (await skip.isVisible()) await skip.click()
  await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
  const ready = await page.waitForFunction(messageReady, expectedText)
  report.afterLoadMessage = await ready.jsonValue()
  await ready.dispose()
  await page.getByRole('button', { name: 'Pause game', exact: true }).click()
  await page.waitForFunction(() => window.testStore.getWorld().paused)
  // Publicly close the fresh message; the serial-keyed DOM may be reused by
  // React, so a detached-node click would be vacuous and is deliberately avoided.
  await detail.locator('summary').click()
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
    const onSummary = props(summary)?.onClick, onDismiss = props(dismiss)?.onClick
    if (typeof onSummary !== 'function' || typeof onDismiss !== 'function') throw Error('Actual mounted React handlers unavailable')
    if (message.view) throw Error('Expected text-only authored message 641; do not silently change focus coverage')
    window.campaignCallbackWitness = { store, world, message, slot, summary, details, onSummary, onDismiss }
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

export function assertCurrentCampaignDismiss(result) {
  assert.equal(result.sameWorld, true)
  assert.equal(result.removedExactSlot, true)
  for (const label of ['Dismiss campaign message', 'Read campaign message'])
    assert.ok(result.inputs.some(event => event.label === label && event.trusted === true))
}
