import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { pageActionTimeout } from '../native-ui-evidence/browser-owner.mjs'

export const optionsSkipCapMs = 2500
const candidateModule = (root, path) => import(pathToFileURL(resolve(root, path)).href)

export function createOptionsStartupBudget({ signal, deadlineAt,
  now = performance.now.bind(performance), wallNow = Date.now }) {
  const started = now(), wallStarted = wallNow()
  assert.ok([started, wallStarted, deadlineAt].every(Number.isFinite), 'Options startup requires finite clocks/deadline')
  const capMs = Math.min(pageActionTimeout, deadlineAt - wallStarted)
  assert.ok(Number.isFinite(capMs) && capMs > 0, 'Options startup requires a live bounded deadline')
  const deadline = Math.min(deadlineAt, wallStarted + capMs)
  const remaining = () => {
    signal?.throwIfAborted()
    const elapsed = now() - started
    assert.ok(Number.isFinite(elapsed) && elapsed >= 0, 'Options startup monotonic clock is invalid')
    const ms = Math.min(capMs - elapsed, deadline - wallNow())
    assert.ok(ms > 0, 'Options startup action deadline expired')
    return ms
  }
  return { capMs, deadlineAt: deadline, remaining }
}

// A separate compatibility entry for the partial Options port. This does not
// claim the native-UI Space/popup retry contract or fall back after its failure.
export function observeOptionsMission(expected) {
  const world = window.testStore.getWorld(), scene = window.testSceneRef.current
  const canvas = scene?.renderer.domElement
  if (world !== expected.world || scene !== expected.scene || scene.world !== world ||
      canvas !== expected.canvas || !canvas?.isConnected || !canvas.matches('.world-viewport canvas'))
    throw new Error('Options entry lost the original World, Scene or battlefield canvas')
  const flags = world.flyby?.flags
  if (world.outcome.level !== 1 || typeof world.paused !== 'boolean' ||
      !Number.isInteger(world.inputMask) || !Number.isInteger(flags))
    throw new Error('Options entry requires a typed Mission 1 state')
  const button = document.querySelector('button.skip-introduction')
  const finite = value => Number.isFinite(value) ? value : null
  const flyby = { warmup: finite(world.flyby.warmup), frameRate: finite(world.flyby.frameRate),
    frame: finite(world.flyby.frame), tracks: Array.isArray(world.flyby.tracks) ? world.flyby.tracks.slice(0, 7)
      .map(track => ({ frame: finite(track.frame), duration: finite(track.duration),
        active: typeof track.active === 'boolean' ? track.active : null })) : null }
  return { level: world.outcome.level, inputMask: world.inputMask, paused: world.paused, flybyFlags: flags,
    flyby,
    action: !world.inputMask ? 'ready' : world.inputMask !== 64 ? false :
      (flags & 0x49) === 0x49 ? 'tail' : (flags & 0x51) === 0x11 &&
      button && button.getClientRects().length > 0 &&
      getComputedStyle(button).visibility !== 'hidden' && !button.disabled ? 'skip' : false }
}

// This callback is self-contained because Playwright serializes it into the page.
export function optionsStartupReady() {
  const world = window.testStore.getWorld()
  if (!world.inputMask) return 'ready'
  if (world.inputMask !== 64 || !Number.isInteger(world.flyby?.flags)) return false
  if ((world.flyby.flags & 0x49) === 0x49) return 'tail'
  if ((world.flyby.flags & 0x51) !== 0x11) return false
  const button = document.querySelector('button.skip-introduction')
  return button && button.getClientRects().length > 0 &&
    getComputedStyle(button).visibility !== 'hidden' && !button.disabled ? 'skip' : false
}

async function boundedOptionsStage(page, {
  signal, deadlineAt, trace, stageCapMs, contract,
  remainingStartup,
  now = performance.now.bind(performance), wallNow = Date.now,
  setTimer = setTimeout, clearTimer = clearTimeout,
}, run) {
  assert.ok(Number.isFinite(deadlineAt), 'Options entry requires its existing episode deadline')
  const started = now(), capMs = Math.min(stageCapMs, deadlineAt - wallNow(), remainingStartup?.() ?? Infinity)
  assert.ok(capMs > 0, 'Options entry deadline expired')
  Object.assign(trace, { contract, capMs, phase: 'start', status: 'running', completed: [] })
  let stopped = false, timer, rejectExpiry, failed = false, primary
  const remaining = () => {
    signal?.throwIfAborted()
    const ms = Math.min(capMs - (now() - started), deadlineAt - wallNow(), remainingStartup?.() ?? Infinity)
    assert.ok(!stopped && ms > 0, 'Options entry stage deadline expired')
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
  const aborted = () => stop(signal.reason ?? new Error('Options entry stage aborted'))
  const expiry = new Promise((_, reject) => { rejectExpiry = reject })
  const work = Promise.resolve().then(() => run(phase))
  try {
    signal?.addEventListener('abort', aborted, { once: true })
    if (signal?.aborted) aborted()
    timer = setTimer(() => stop(new Error('Options entry stage deadline expired')), capMs)
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

export async function skipOptionsIntroduction(page, expected, options) {
  const { trace } = options
  trace.clickAttempts = 0
  await boundedOptionsStage(page, { ...options, stageCapMs: optionsSkipCapMs,
    contract: 'options-public-skip-response-v2' }, async phase => {
    await phase('read-before', async () => { trace.before = await page.evaluate(observeOptionsMission, expected) })
    const before = trace.before
    if (before.action === 'ready') { trace.outcome = 'natural-completion'; return }
    if (before.action === 'tail') { trace.outcome = 'existing-native-tail'; return }
    assert.equal(before.action, 'skip', 'An eligible visible enabled public Skip introduction control is required')
    await phase('public-skip-click', timeout => {
      trace.clickAttempts++
      return page.getByRole('button', { name: /^Skip introduction/ }).click({ timeout, noWaitAfter: true })
    })
    // Native interruption normally starts a final camera blend, not immediate
    // input readiness. A failed/unknown click still fails without reconciliation.
    await phase('read-response', async () => { trace.after = await page.evaluate(observeOptionsMission, expected) })
    assert.ok(['ready', 'tail'].includes(trace.after.action), 'Skip response must be ready or a native final blend')
    assert.equal(trace.after.paused, before.paused, 'Skipping introduction must preserve pause state')
    // Natural completion can race the click; the observation does not prove causation.
    trace.outcome = 'public-click-settled-with-valid-response'
  })
}

export async function waitOptionsMissionReady(page, expected, expectedPaused, options) {
  const { trace } = options
  await boundedOptionsStage(page, { ...options, stageCapMs: pageActionTimeout,
    contract: 'options-native-completion-v1' }, async phase => {
    let ready, readFailed = false, readError
    try {
      await phase('wait-native-completion', async timeout => {
        ready = await page.waitForFunction(() => !window.testStore.getWorld().inputMask, null, { timeout })
      })
    } catch (error) { readFailed = true; readError = error }
    try { await ready?.dispose() }
    catch (error) {
      trace.observationDisposeError = String(error)
      if (!readFailed) { readFailed = true; readError = error }
    }
    if (readFailed) throw readError
    await phase('read-ready', async () => { trace.after = await page.evaluate(observeOptionsMission, expected) })
    const after = trace.after
    assert.equal(after.action, 'ready')
    assert.equal(after.paused, expectedPaused, 'Native completion must preserve pause state')
    trace.outcome = 'same-mission-input-ready'
  })
}

export async function enterOptionsMission(page, root, { signal, deadlineAt, trace }) {
  trace.status = 'running'; trace.deadlineAt = deadlineAt
  let identity, startup, startupBudget, failed = false, primary
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
    // Reuse one existing page-action allowance across all startup observations,
    // input response and native completion. It never restarts after the click.
    startupBudget = createOptionsStartupBudget({ signal, deadlineAt })
    trace.startupDeadlineAt = startupBudget.deadlineAt
    trace.startupCapMs = startupBudget.capMs
    const remainingStartup = () => {
      check()
      return startupBudget.remaining()
    }
    identity = await page.evaluateHandle(() => {
      const world = window.testStore.getWorld(), scene = window.testSceneRef.current
      return { world, scene, canvas: scene.renderer.domElement }
    })
    remainingStartup()
    startup = await page.waitForFunction(optionsStartupReady, null, { timeout: remainingStartup() })
    trace.startupAction = await startup.jsonValue()
    remainingStartup()
    trace.skip = {}
    await skipOptionsIntroduction(page, identity,
      { signal, deadlineAt: trace.startupDeadlineAt, remainingStartup, trace: trace.skip })
    remainingStartup()
    trace.completion = {}
    await waitOptionsMissionReady(page, identity, trace.skip.before.paused,
      { signal, deadlineAt: trace.startupDeadlineAt, remainingStartup, trace: trace.completion })
    remainingStartup()
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
  try {
    check()
    startupBudget.remaining()
    trace.status = 'passed'
  }
  catch (error) { trace.status = 'failed'; trace.error = String(error); throw error }
}
