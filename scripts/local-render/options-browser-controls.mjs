import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'
import { createAudioOptionsBudget, setSoundThroughOptions, openAudioOptions, closeAudioOptions, waitForAudioObservation, observeOptionsAudio } from '../browser-options-audio.mjs'

export function assertFrozen(before, after) {
  assert.equal(before.paused, true)
  assert.deepEqual(after, before, 'Paused Options must retain simulation turn, pending time, animation and camera position')
}

export function observeFrozen() {
  const world = window.testStore.getWorld(), scene = window.testSceneRef.current
  if (scene.world !== world) throw new Error('Scene must retain current World')
  return { paused: world.paused, turn: world.turn, pendingTime: world.pendingTime,
    frame: scene.gameClock.animationFrame, time: scene.gameClock.animationTime,
    camera: scene.camera.position.toArray() }
}

export function observeCapture() {
  const canvas = document.querySelector('.world-viewport canvas.battlefield')
  return { innerWidth, innerHeight, devicePixelRatio, fullscreen: document.fullscreenElement !== null,
    canvas: canvas ? { width: canvas.width, height: canvas.height, clientWidth: canvas.clientWidth, clientHeight: canvas.clientHeight } : null }
}

export function observeFullscreenDismissal({ world, scene, menu }) {
  const canvas = document.querySelector('.world-viewport canvas.battlefield')
  const focused = document.activeElement
  return {
    sameWorldScene: window.testStore.getWorld() === world && window.testSceneRef.current === scene && scene.world === world,
    ownedCanvas: !!canvas && canvas === scene.renderer.domElement,
    fullscreen: document.fullscreenElement === null ? 'none'
      : document.fullscreenElement === document.documentElement ? 'document' : 'other',
    openDialogs: document.querySelectorAll('dialog[open]').length,
    visibleHosts: document.querySelectorAll('[data-fullscreen-control]').length,
    connectedFocus: !!focused?.isConnected,
    focusOwner: focused === canvas ? 'canvas' : focused === menu ? 'menu' : 'other',
  }
}

export function assertFullscreenDismissal(observation, fullscreen) {
  assert.equal(observation.sameWorldScene, true, 'Dismissal must retain World and Scene')
  assert.equal(observation.ownedCanvas, true, 'Focus fallback must belong to the retained Scene')
  assert.equal(observation.fullscreen, fullscreen ? 'document' : 'none', 'Portal placement must not change the fullscreen session')
  assert.equal(observation.openDialogs, 0)
  assert.equal(observation.visibleHosts, 0, 'No detached fullscreen control may remain in the document')
  assert.equal(observation.connectedFocus, true)
  assert.ok(['canvas', 'menu'].includes(observation.focusOwner), 'Dismissal must restore the Menu trigger or retained battlefield canvas')
}

export async function captureOptions(page, output, name, budget, captures, metadata = []) {
  assert.match(name, /^[a-z0-9-]+\.png$/)
  assert.ok(captures.length < 8, 'Options episode PNG limit')
  const metrics = await budget.step(() => page.evaluate(observeCapture))
  await budget.step(timeout => page.screenshot({ path: resolve(output, name), timeout }))
  assert.deepEqual(await budget.step(() => page.evaluate(observeCapture)), metrics, 'Capture geometry must remain stable')
  captures.push(name)
  metadata.push({ name, ...metrics })
}

// The main-only adapter owns browser errors, process cleanup and artifact limits.
// This episode uses public controls only; reads of World/Scene are observations.
export default async function optionsBrowserControls({ page, output, deadlineAt, signal, revision }) {
  const cleanupErrors = [], captures = [], captureMetadata = [], checks = []
  const budget = createAudioOptionsBudget({ signal, deadlineAt, cleanupErrors })
  const report = { status: 'running', revision, requestedViewport: { width: 1280, height: 960 }, captures, captureMetadata, checks, cleanupErrors,
    limits: ['Partial #885 only: no held-stream/retry or loading acceptance; ordinary menu dismissal does not force a focused-portal removal race', 'Only simulation turn/pending time, animation and camera position are frozen; legitimate paused presentation may advance', 'No native pixel equivalence, acoustic quality or performance claim'] }
  const save = () => writeFileSync(resolve(output, 'options-controls-episode.json'), JSON.stringify(report, null, 2) + '\n')
  const button = name => page.getByRole('button', { name, exact: true })
  const step = budget.step, observe = () => step(() => page.evaluate(observeFrozen))
  const wait = (fn, arg) => waitForAudioObservation(budget, timeout => page.waitForFunction(fn, arg, { timeout }))
  const shot = name => captureOptions(page, output, name, budget, captures, captureMetadata)
  let entry, owner, primary, failed = false
  try {
    assert.equal(await step(() => page.locator('dialog[open]').count()), 0)
    assert.equal(await step(() => page.locator('[data-fullscreen-control]').count()), 0, 'No permanent fullscreen overlay')
    assert.equal(await step(() => page.locator('.audio-settings').count()), 0, 'No permanent Sound control')
    assert.equal(await step(() => button('Game settings').isVisible()), true)
    assert.equal(await step(() => button('Pause game').isVisible()), true)
    await shot('options-battlefield-before.png')
    await step(timeout => button('Pause game').click({ timeout }))
    await wait(() => window.testStore.getWorld().paused)
    await step(async () => { owner = await page.evaluateHandle(() => ({ world: window.testStore.getWorld(), scene: window.testSceneRef.current,
      menu: document.querySelector('button[aria-label="Menu"]') })) })
    const before = await observe()
    report.before = before
    await setSoundThroughOptions(page, true, { signal, deadlineAt, cleanupErrors })
    assertFrozen(before, await observe())
    checks.push('public-options-enable-preserves-manual-pause')
    entry = await openAudioOptions(page, { signal, deadlineAt, cleanupErrors })
    await wait(observeOptionsAudio, { enabled: true, paused: true, context: 'suspended' })
    await shot('options-sound-enabled.png')
    await step(timeout => button('Fullscreen').click({ timeout }))
    await wait(() => document.fullscreenElement === document.documentElement)
    assert.equal(await step(() => button('Exit fullscreen').getAttribute('aria-pressed')), 'true')
    assertFrozen(before, await observe())
    await shot('options-fullscreen-entered.png')
    await step(() => page.keyboard.press('Escape'))
    await wait(() => document.fullscreenElement === null)
    assert.equal(await step(() => page.locator('dialog[data-original-pause-menu][open]').count()), 1, 'Native Escape exit must not dismiss the menu')
    assertFrozen(before, await observe())
    await shot('options-fullscreen-escaped.png')
    checks.push('trusted-fullscreen-entry-and-native-escape-retain-paused-menu')
    const closing = entry; entry = null
    await closeAudioOptions(page, closing)
    await wait(() => document.querySelectorAll('[data-fullscreen-control]').length === 0)
    assertFullscreenDismissal(await step(() => page.evaluate(observeFullscreenDismissal, owner)), false)
    await setSoundThroughOptions(page, false, { signal, deadlineAt, cleanupErrors })
    assertFrozen(before, await observe())
    entry = await openAudioOptions(page, { signal, deadlineAt, cleanupErrors })
    await wait(observeOptionsAudio, { enabled: false, paused: true, context: 'suspended' })
    await shot('options-sound-muted.png')
    await step(timeout => button('Fullscreen').click({ timeout }))
    await wait(() => document.fullscreenElement === document.documentElement)
    assertFrozen(before, await observe())
    const closingMuted = entry; entry = null
    await closeAudioOptions(page, closingMuted)
    await wait(() => document.querySelectorAll('[data-fullscreen-control]').length === 0)
    const fullscreenDismissal = await step(() => page.evaluate(observeFullscreenDismissal, owner))
    assertFullscreenDismissal(fullscreenDismissal, true)
    report.fullscreenDismissal = fullscreenDismissal
    await shot('options-fullscreen-detached.png')
    checks.push('menu-dismissal-detaches-fullscreen-control-and-restores-live-focus-without-exiting-fullscreen')
    await step(() => page.keyboard.press('Escape'))
    await wait(() => document.fullscreenElement === null)
    assertFullscreenDismissal(await step(() => page.evaluate(observeFullscreenDismissal, owner)), false)
    assertFrozen(before, await observe())
    entry = await openAudioOptions(page, { signal, deadlineAt, cleanupErrors })
    assert.equal(await step(() => button('Fullscreen').getAttribute('aria-pressed')), 'false')
    await wait(observeOptionsAudio, { enabled: false, paused: true, context: 'suspended' })
    const reopened = entry; entry = null
    await closeAudioOptions(page, reopened)
    await wait(() => document.querySelectorAll('[data-fullscreen-control]').length === 0)
    assertFullscreenDismissal(await step(() => page.evaluate(observeFullscreenDismissal, owner)), false)
    assertFrozen(before, await observe())
    checks.push('native-fullscreen-exit-while-portal-detached-and-muted-options-reopen')
    assert.equal(await step(() => page.evaluate(({ world, scene }) => window.testStore.getWorld() === world && window.testSceneRef.current === scene && scene.world === world, owner)), true)
    checks.push('public-options-mute-preserves-world-scene-identity-and-paused-simulation')
    await shot('options-battlefield-paused.png')
    await step(timeout => button('Resume game').click({ timeout }))
    await wait(() => !window.testStore.getWorld().paused)
    assert.equal(await step(() => button('Game settings').isVisible()), true)
    assert.equal(await step(() => page.locator('[data-fullscreen-control]').count()), 0)
    await shot('options-battlefield-resumed.png')
    checks.push('public-resume-and-retained-settings')
  } catch (error) { failed = true; primary = error; report.failure = String(error) }
  finally {
    // A failed episode is terminal; never click recovery controls in cleanup.
    for (const handle of [entry?.owner, owner]) {
      try { await handle?.dispose() } catch (error) { cleanupErrors.push({ phase: 'episode-owner', error: String(error) }); if (!failed) { failed = true; primary = error } }
    }
    try { budget.check(); assert.deepEqual(cleanupErrors, []) } catch (error) { if (!failed) { failed = true; primary = error } }
    report.status = failed ? 'failed' : 'passed'
    save()
  }
  if (failed) throw primary
  return report
}
