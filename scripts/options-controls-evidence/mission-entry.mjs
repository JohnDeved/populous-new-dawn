import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export const optionsSkipCapMs = 2500
const candidateModule = (root, path) => import(pathToFileURL(resolve(root, path)).href)

// A separate compatibility entry for the partial Options port. This does not
// claim the native-UI Space/popup retry contract or fall back after its failure.
export function observeOptionsMission(expected) {
  const world = window.testStore.getWorld(), scene = window.testSceneRef.current
  const canvas = scene?.renderer.domElement
  if (world !== expected.world || scene !== expected.scene || scene.world !== world ||
      canvas !== expected.canvas || !canvas?.isConnected || !canvas.matches('.world-viewport canvas'))
    throw new Error('Options entry lost the original World, Scene or battlefield canvas')
  if (world.outcome.level !== 1 || typeof world.paused !== 'boolean' || !Number.isInteger(world.inputMask))
    throw new Error('Options entry requires a typed Mission 1 state')
  const button = document.querySelector('button.skip-introduction')
  return { level: world.outcome.level, inputMask: world.inputMask, paused: world.paused,
    action: !world.inputMask ? 'ready' : button && button.getClientRects().length > 0 &&
      getComputedStyle(button).visibility !== 'hidden' && !button.disabled ? 'skip' : false }
}

// This callback is self-contained because Playwright serializes it into the page.
export function optionsStartupReady() {
  const world = window.testStore.getWorld()
  if (!world.inputMask) return 'ready'
  const button = document.querySelector('button.skip-introduction')
  return button && button.getClientRects().length > 0 &&
    getComputedStyle(button).visibility !== 'hidden' && !button.disabled ? 'skip' : false
}

export async function skipOptionsIntroduction(page, expected, {
  signal, deadlineAt, trace, now = performance.now.bind(performance), wallNow = Date.now,
  setTimer = setTimeout, clearTimer = clearTimeout,
}) {
  assert.ok(Number.isFinite(deadlineAt), 'Options entry requires its existing episode deadline')
  const started = now(), capMs = Math.min(optionsSkipCapMs, deadlineAt - wallNow())
  assert.ok(capMs > 0, 'Options entry deadline expired')
  Object.assign(trace, { contract: 'options-public-skip-v1', capMs, phase: 'start',
    status: 'running', clickAttempts: 0, completed: [] })
  let stopped = false, timer, rejectExpiry, failed = false, primary
  const remaining = () => {
    signal?.throwIfAborted()
    const ms = Math.min(capMs - (now() - started), deadlineAt - wallNow())
    assert.ok(!stopped && ms > 0, 'Options Skip action deadline expired')
    return ms
  }
  const phase = async (name, action) => {
    const timeout = remaining()
    trace.phase = name
    const startedMs = now() - started
    const value = await action(timeout)
    trace.completed.push({ phase: name, startedMs, finishedMs: now() - started })
    remaining()
    return value
  }
  const stop = error => { stopped = true; rejectExpiry(error) }
  const aborted = () => stop(signal.reason ?? new Error('Options Skip action aborted'))
  const expiry = new Promise((_, reject) => { rejectExpiry = reject })
  const work = Promise.resolve().then(async () => {
    const before = await phase('read-before', () => page.evaluate(observeOptionsMission, expected))
    trace.before = before
    if (before.action === 'ready') { trace.outcome = 'natural-completion'; return }
    assert.equal(before.action, 'skip', 'A visible enabled public Skip introduction control is required')
    await phase('public-skip-click', timeout => {
      trace.clickAttempts++
      return page.getByRole('button', { name: /^Skip introduction/ }).click({ timeout, noWaitAfter: true })
    })
    // A click error or unknown outcome is fatal, even if the flyby later ends.
    let ready, readFailed = false, readError
    try {
      await phase('wait-input-ready', async timeout => {
        ready = await page.waitForFunction(() => !window.testStore.getWorld().inputMask, null, { timeout })
      })
    } catch (error) { readFailed = true; readError = error }
    try { await ready?.dispose() }
    catch (error) {
      trace.observationDisposeError = String(error)
      if (!readFailed) { readFailed = true; readError = error }
    }
    if (readFailed) throw readError
    const after = await phase('read-after', () => page.evaluate(observeOptionsMission, expected))
    trace.after = after
    assert.equal(after.action, 'ready')
    assert.equal(after.paused, before.paused, 'Skipping introduction must preserve pause state')
    trace.outcome = 'public-click-completed'
  })
  try {
    signal?.addEventListener('abort', aborted, { once: true })
    if (signal?.aborted) aborted()
    timer = setTimer(() => stop(new Error('Options Skip action deadline expired')), capMs)
    await Promise.race([work, expiry])
    remaining()
    trace.status = 'passed'
  } catch (error) {
    failed = true; primary = error; stopped = true
    trace.status = 'failed'; trace.error = String(error)
    // Close the owned page before awaiting pending RPCs. The enclosing browser
    // owner and unchanged worker watchdog retain responsibility for final cleanup.
    try { await page.close() }
    catch (cleanupError) { trace.pageCloseError = String(cleanupError) }
  } finally {
    stopped = true; clearTimer(timer); signal?.removeEventListener('abort', aborted)
    await work.catch(() => {})
    trace.elapsedMs = now() - started
  }
  if (failed) throw primary
}

export async function enterOptionsMission(page, root, { signal, deadlineAt, trace }) {
  trace.status = 'running'; trace.deadlineAt = deadlineAt
  let identity, startup, failed = false, primary
  const check = () => {
    signal.throwIfAborted()
    assert.ok(Number.isFinite(deadlineAt) && deadlineAt > Date.now(), 'Options mission episode expired')
  }
  try {
    check()
    const { openCampaignFromMainMenu } = await candidateModule(root, 'scripts/browser-new-game.mjs')
    const { bindGame } = await candidateModule(root, 'scripts/browser-game.mjs')
    check(); await openCampaignFromMainMenu(page); check()
    await page.getByRole('button', { name: 'Start Mission 1', exact: true }).click(); check()
    await bindGame(page); check()
    const desktop = page.getByRole('button', { name: 'Continue anyway', exact: false })
    if (await desktop.isVisible()) { check(); await desktop.click() }
    check()
    identity = await page.evaluateHandle(() => {
      const world = window.testStore.getWorld(), scene = window.testSceneRef.current
      return { world, scene, canvas: scene.renderer.domElement }
    })
    check()
    startup = await page.waitForFunction(optionsStartupReady)
    trace.startupAction = await startup.jsonValue()
    check()
    trace.skip = {}
    await skipOptionsIntroduction(page, identity, { signal, deadlineAt, trace: trace.skip })
    check()
  } catch (error) { failed = true; primary = error; trace.status = 'failed'; trace.error = String(error) }
  finally {
    for (const [name, handle] of [['startup', startup], ['identity', identity]]) {
      try { await handle?.dispose() }
      catch (error) {
        (trace.cleanupErrors ??= []).push({ handle: name, error: String(error) })
        trace.status = 'failed'
        if (!failed) { failed = true; primary = error }
      }
    }
  }
  if (failed) throw primary
  try { check(); trace.status = 'passed' }
  catch (error) { trace.status = 'failed'; trace.error = String(error); throw error }
}
