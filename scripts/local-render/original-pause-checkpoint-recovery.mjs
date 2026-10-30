import { prepareWorldInput } from '../browser-world-input.mjs'
import { popupRejectedSpace, pressObservedSpace } from '../browser-space-ownership.mjs'
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { openCampaignFromMainMenu, waitForStartupMenu } from '../browser-new-game.mjs'
import { readCommittedCheckpoint } from './checkpoint-observer.mjs'
import { checkPauseHeldEscape } from './pause-held-escape.mjs'
import { observeStablePauseControls } from './pause-capture-controls.mjs'

// Controlled failure/timing at the browser storage boundary. The retry opens a
// real database; only delivery of its success event is held. No game/store state
// or checkpoint contents are supplied by the fixture.
function coldLookupFailure() {
  const open = IDBFactory.prototype.open
  window.pauseLookupAttempts = 0
  IDBFactory.prototype.open = function (...args) {
    if (args[0] !== 'populous-new-dawn') return open.apply(this, args)
    const attempt = ++window.pauseLookupAttempts
    if (attempt === 1)
      throw new DOMException('Controlled cold checkpoint lookup failure', 'UnknownError')
    const request = open.apply(this, args)
    if (attempt === 2) request.addEventListener('success', event => {
      event.stopImmediatePropagation()
      window.finishPauseLookup = () => request.dispatchEvent(new Event('success'))
    }, { once: true })
    return request
  }
}

// Only the native interruptible flyby input gate admits a Space skip.
export function pauseStartupReady(snapshot = false) {
  const world = window.testStore.getWorld()
  const action = !world.inputMask ? 'ready'
    : (world.inputMask & 64) && (world.flyby.flags & 0x51) === 0x11 ? 'skip' : false
  // Bounded observation only: a stable never-ready startup must leave evidence.
  // Keep trace failures outside the original readiness/exception contract.
  if (!snapshot && typeof document !== 'undefined') {
    try {
      const trace = window.__pauseStartupTrace ??= { count: 0, last: null }
      if (trace.count < 16) {
        const number = value => Number.isFinite(value) ? value : null
        const core = { action, inputMask: number(world.inputMask), flybyFlags: number(world.flyby.flags),
          paused: Boolean(world.paused), level: number(world.outcome?.level),
          levelStart: Array.isArray(world.levelStart) ? world.levelStart.slice(0, 8).map(site => number(site.phase)) : null }
        const state = { ...core, loading: document.querySelector('.loading-world')?.textContent?.slice(0, 120) ?? null,
          popupPresent: Boolean(document.querySelector('[data-native-campaign-popup]')),
          activeTag: document.activeElement?.tagName?.slice(0, 20) ?? null,
          dialogs: [...document.querySelectorAll('dialog[open],[role="dialog"]')].slice(0, 4)
            .map(node => ({ label: node.getAttribute('aria-label')?.slice(0, 60) ?? null, visible: node.getClientRects().length > 0 })),
          canvases: [...document.querySelectorAll('canvas')].slice(0, 3).map(node => ({ width: number(node.width), height: number(node.height) })) }
        let text = JSON.stringify(state)
        if (text.length > 2048) text = JSON.stringify({ ...core, domOmitted: true })
        if (text !== trace.last) {
          trace.last = text; trace.count++
          console.warn('NATIVE_STARTUP_STATE', text)
        }
      }
    } catch { /* Diagnostic errors must not change readiness or its deadline. */ }
  }
  return snapshot ? { action, paused: world.paused, inputMask: world.inputMask, flybyFlags: world.flyby.flags } : action
}

export function recoveryStateFromSpaceSnapshot(delivery) {
  assert.equal(delivery?.observationId, delivery?.witnessId, 'Fresh Space observation identity is required')
  assert.equal(typeof delivery?.witnessId, 'string')
  assert.equal(delivery.witnessPresent, true, 'A settled live passive witness is required')
  assert.ok(Array.isArray(delivery.records), 'Actual ownership records are required')
  const state = delivery.state
  assert.ok(state && typeof state.paused === 'boolean' && Number.isInteger(state.inputMask) && Number.isInteger(state.flybyFlags),
    'Fresh native state is required; no stale fallback')
  const action = !state.inputMask ? 'ready'
    : (state.inputMask & 64) && (state.flybyFlags & 0x51) === 0x11 ? 'skip' : false
  return { action, paused: state.paused, inputMask: state.inputMask, flybyFlags: state.flybyFlags }
}

export const recoveryInputContract = 'public-setup-then-response-v1'
export const recoveryRetryInputContract = 'public-setup-cumulative-response-v2'

// Default callers retain the original shared 2500ms preparation/input bound.
// Explicit setup callers may instead spend their EXISTING public UI
// allowance on initial popup/focus preparation, with a fresh <=2500ms response
// phase clipped to the SAME absolute action/episode deadline. See the contract
// note in engineering/recovery-input-budget.md. This is not a latency SLA.
export async function skipPauseIntroduction(page, {
  timeout = 2500, setupTimeout, deadlineAt, signal, trace = {}, popupRetryPreparation = false,
} = {}) {
  if (!Number.isFinite(timeout) || timeout <= 0) throw new RangeError('Invalid recovery input timeout')
  const separateSetup = setupTimeout !== undefined
  if (typeof popupRetryPreparation !== 'boolean' || (popupRetryPreparation && !separateSetup))
    throw new RangeError('Retry preparation accounting requires explicit public setup')
  if (separateSetup && (!Number.isFinite(setupTimeout) || setupTimeout <= 0 || !Number.isFinite(deadlineAt)))
    throw new RangeError('Public recovery setup requires its existing UI allowance and outer deadline')
  if (separateSetup && timeout > 2500) throw new RangeError('Recovery response cap cannot exceed 2500ms')
  const started = performance.now(),
    actionMs = separateSetup ? Math.min(setupTimeout, deadlineAt - Date.now()) : timeout,
    actionDeadline = started + actionMs
  const cancellation = new AbortController(), actionSignal = cancellation.signal
  let responseDeadline = separateSetup ? null : actionDeadline
  let responseStarted, retryPreparationMs = 0, retryCount = 0, responseWindow, pendingRetryPreparation
  const updateResponseEvidence = (now = performance.now()) => {
    if (!popupRetryPreparation) return
    const excluded = retryPreparationMs + (pendingRetryPreparation === undefined ? 0 : now - pendingRetryPreparation)
    trace.retryPreparationMs = excluded
    trace.responseSpentMs = responseStarted === undefined ? 0 : now - responseStarted - excluded
    trace.wallElapsedMs = now - started
  }
  Object.assign(trace, { phase: 'start', preparation: {}, completed: [], attempts: [],
    contract: popupRetryPreparation ? recoveryRetryInputContract : separateSetup ? recoveryInputContract : 'shared-input-v1',
    actionCapMs: actionMs, responseCapMs: timeout,
    ...(popupRetryPreparation ? { retryLimit: 1, retryCount: 0, retryPreparations: [], responseWindows: [] } : {}) })
  const timedOut = () => {
    updateResponseEvidence()
    return new Error(`Recovery introduction input timed out: ${JSON.stringify({ ...trace, elapsedMs: performance.now() - started })}`)
  }
  let closed = false, timer, deliveryError, rejectExpiry
  const remaining = () => {
    signal?.throwIfAborted()
    actionSignal.throwIfAborted()
    const budget = (responseDeadline ?? actionDeadline) - performance.now()
    if (closed || budget <= 0) {
      const error = deliveryError ?? timedOut(); cancellation.abort(error); throw error
    }
    return budget
  }
  const expiry = new Promise((_, reject) => { rejectExpiry = reject })
  const cancel = error => { closed = true; cancellation.abort(error); rejectExpiry(error) }
  const expire = () => cancel(deliveryError ?? timedOut())
  const aborted = () => cancel(signal.reason ?? new Error('Recovery input aborted'))
  const arm = () => {
    clearTimeout(timer)
    timer = setTimeout(expire, Math.max(0, (responseDeadline ?? actionDeadline) - performance.now()))
  }
  const phase = async (name, action) => {
    remaining()
    trace.phase = name
    const startedMs = performance.now() - started
    try { return await action() }
    finally { trace.completed.push({ phase: name, startedMs, finishedMs: performance.now() - started }) }
  }
  const prepare = () => phase('prepare-world-input', () =>
    prepareWorldInput(page, { timeout: remaining(), trace: trace.preparation, signal: actionSignal }))
  const run = async () => {
    if (separateSetup) {
      await prepare()
      remaining()
      trace.setupFinishedMs = performance.now() - started
      // Starts before the fresh native-state read, not merely before key dispatch.
      responseStarted = performance.now()
      responseDeadline = Math.min(actionDeadline, responseStarted + timeout)
      trace.responseStartedMs = responseStarted - started
      trace.responseDeadlineMs = responseDeadline - started
      if (popupRetryPreparation) {
        responseWindow = { startedMs: trace.responseStartedMs, deadlineMs: trace.responseDeadlineMs }
        trace.responseWindows.push(responseWindow)
      }
      arm()
    }
    let prepared = separateSetup
    for (;;) {
      // V1 retains its single wall-clock response deadline. V2 excludes only
      // this proven popup-rejection preparation, never a read/key/finalizer or
      // an unknown outcome, from ONE cumulative response budget.
      if (!prepared) {
        if (!popupRetryPreparation) await prepare()
        else {
          assert.equal(trace.attempts.at(-1)?.outcome, 'popup-owned-unchanged-retry')
          remaining()
          const priorDeadline = responseDeadline, preparationStarted = performance.now()
          responseWindow.finishedMs = preparationStarted - started
          const preparation = { afterAttempt: trace.attempts.length, startedMs: preparationStarted - started,
            actionDeadlineMs: actionDeadline - started, status: 'running', trace: {} }
          trace.retryPreparations.push(preparation)
          pendingRetryPreparation = preparationStarted
          responseDeadline = null; arm() // The original absolute action deadline still owns preparation.
          let preparationError
          try {
            await phase('prepare-world-input', () => prepareWorldInput(page, {
              timeout: remaining(), trace: preparation.trace, signal: actionSignal,
            }))
            preparation.status = 'passed'
          } catch (error) { preparationError = error; preparation.status = 'failed'; throw error }
          finally {
            preparation.finishedMs = performance.now() - started
            preparation.elapsedMs = preparation.finishedMs - preparation.startedMs
            retryPreparationMs += preparation.elapsedMs
            pendingRetryPreparation = undefined
            if (preparationError) preparation.error = String(preparationError)
          }
          remaining()
          // Shift only by measured preparation duration, not a fresh 2500 ms.
          responseDeadline = Math.min(actionDeadline, priorDeadline + preparation.elapsedMs)
          trace.responseDeadlineMs = responseDeadline - started
          responseWindow = { startedMs: preparation.finishedMs, deadlineMs: trace.responseDeadlineMs }
          trace.responseWindows.push(responseWindow)
          arm(); remaining()
        }
      }
      prepared = false
      remaining()
      const before = await phase('read-before-skip', () => page.evaluate(pauseStartupReady, true))
      remaining()
      const attempt = { before: { ...before } }; trace.attempts.push(attempt)
      if (before.action === 'ready') { attempt.outcome = 'natural-completion'; return }
      if (before.action !== 'skip') throw new Error('Recovery introduction is no longer interruptible')
      let delivery
      attempt.delivery = {}
      await phase('observed-space-dispatch', async () => {
        try {
          delivery = await pressObservedSpace(page, { timeout: remaining(), signal: actionSignal, snapshot: separateSetup, trace: attempt.delivery })
          // The owning race can already be cancelled while its finalizer is still pending.
          // Keep raw RPC settlements, but never publish success evidence after that boundary.
          remaining()
          attempt.ownership = structuredClone(separateSetup ? delivery.records : delivery)
          if (separateSetup) attempt.atomicAfter = structuredClone(delivery)
        } catch (error) {
          attempt.deliveryError = String(error)
          // A failed observer RPC is not a failed key. Opted-in callers require
          // their atomic evidence unless the keyboard operation itself rejected.
          if (separateSetup && !attempt.delivery.keyDeliveryFailed) throw error
          deliveryError = error
        }
      })
      remaining()
      const after = await phase('read-after-skip', () => separateSetup && !deliveryError
        ? Promise.resolve(recoveryStateFromSpaceSnapshot(delivery)) : page.evaluate(pauseStartupReady, true))
      attempt.after = { ...after }
      attempt.afterSource = separateSetup && !deliveryError ? 'atomic-post-dispatch-witness' : 'fresh-native-read'
      remaining()
      if (after.paused !== before.paused) throw new Error('Recovery Space changed pause state; retry the episode')
      if (deliveryError && after.action !== 'ready') throw deliveryError
      if (after.action === 'skip') {
        if (!deliveryError && popupRejectedSpace(attempt.ownership) && after.inputMask === before.inputMask && after.flybyFlags === before.flybyFlags) {
          if (popupRetryPreparation) {
            assert.ok(retryCount < 1, 'Recovery permits only one proven popup-owned retry')
            trace.retryCount = ++retryCount
          }
          attempt.outcome = 'popup-owned-unchanged-retry'
          continue
        }
        throw new Error('Recovery Space was not accepted; retry the episode')
      }
      attempt.outcome = 'completed'
      return
    }
  }
  try {
    signal?.throwIfAborted()
    signal?.addEventListener('abort', aborted, { once: true })
    arm()
    await Promise.race([run(), expiry])
  } finally {
    closed = true
    clearTimeout(timer)
    signal?.removeEventListener('abort', aborted)
    if (!actionSignal.aborted) cancellation.abort(new Error('Recovery input action settled'))
    const finished = performance.now()
    trace.elapsedMs = finished - started
    if (popupRetryPreparation && responseWindow && responseWindow.finishedMs === undefined)
      responseWindow.finishedMs = trace.elapsedMs
    updateResponseEvidence(finished)
  }
}

// A later authored flyby can begin after the initial input-unlocked sample.
// This callback only operates an observed interruptible flyby, once per readiness
// wait. It never changes eligibility or resets the caller's existing deadline.
export function recoverVisibleIntroduction(page, { setupTimeout, deadlineAt, signal, trace } = {}) {
  if (setupTimeout !== undefined && (!Number.isFinite(setupTimeout) || setupTimeout <= 0 || !Number.isFinite(deadlineAt)))
    throw new RangeError('Late recovery setup requires its existing UI allowance and outer deadline')
  let attempted = false
  return async ({ after, remainingMs }) => {
    signal?.throwIfAborted()
    if (attempted || remainingMs <= 0 || !(after.inputMask & 64) || !after.introductionSkipAvailable) return null
    await skipPauseIntroduction(page, setupTimeout === undefined
      ? { timeout: Math.min(2500, remainingMs) }
      : { setupTimeout, deadlineAt: Math.min(deadlineAt, Date.now() + remainingMs), signal, trace })
    attempted = true
    return { action: 'public-skip-introduction' }
  }
}

export default async function ({ browser, page, url, root, output, receipt, signal, deadlineAt }) {
  const { bindGame } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)
  const checks = [], screenshots = [], renderers = [], frontendKeyboard = [], inputBudgets = []
  receipt.pauseInputBudgets = inputBudgets
  const passed = name => {
    checks.push(name)
    writeFileSync(resolve(output, 'progress.json'), JSON.stringify({ checks, screenshots }, null, 2))
  }
  const button = (page, name) => page.getByRole('button', { name, exact: true })
  const modal = page => page.getByRole('dialog', { name: 'Game menu', exact: true })
  const focused = (page, name) => button(page, name).evaluate(node => node === document.activeElement)
  const snapshot = page => page.evaluate(() => {
    const scene = window.testSceneRef.current
    return JSON.stringify({
      world: window.testStore.getWorld(),
      animation: scene.gameClock.animationFrame,
      animationTime: scene.gameClock.animationTime,
      phase: scene.globe.phase,
      camera: scene.cameraPosition,
      position: scene.camera.position.toArray(),
      quaternion: scene.camera.quaternion.toArray(),
    })
  })
  async function enterMission(page) {
    await openCampaignFromMainMenu(page)
    await button(page, 'Start Mission 1').click()
    await bindGame(page)
    const desktop = page.getByRole('button', { name: 'Continue anyway', exact: false })
    if (await desktop.isVisible()) await desktop.click()
    const startup = await page.waitForFunction(pauseStartupReady)
    const action = await startup.jsonValue()
    await startup.dispose()
    if (action === 'skip') {
      const trace = {}; inputBudgets.push(trace)
      await skipPauseIntroduction(page, Number.isFinite(deadlineAt)
        ? { setupTimeout: 25000, deadlineAt, signal, trace } : { trace })
    }
    await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
    renderers.push(await page.evaluate(() => {
      const gl = window.testSceneRef.current.renderer.getContext()
      const debug = gl.getExtension('WEBGL_debug_renderer_info')
      return {
        version: gl.getParameter(gl.VERSION),
        renderer: gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
        dpr: devicePixelRatio,
      }
    }))
  }
  async function openFailedLoad(page, captureRoot = false) {
    signal.throwIfAborted()
    await enterMission(page)
    await page.waitForFunction(() => window.testStore.getCheckpointReadStatus() === 'failed')
    await button(page, 'Menu').click()
    assert.equal(await button(page, 'Load Game').isEnabled(), true)
    if (captureRoot) {
      for (const [width, height] of [[640, 480], [1920, 1080]]) {
        await page.setViewportSize({ width, height })
        await capture(page, `failed-root-${width}x${height}.png`)
      }
    }
    await button(page, 'Load Game').focus()
    await page.keyboard.press('Enter')
    await modal(page).getByRole('status').filter({ hasText: 'Could not read browser storage.' }).waitFor()
    assert.equal(await button(page, 'Load checkpoint').isDisabled(), true)
  }
  async function retry(page) {
    await button(page, 'Retry checkpoint lookup').focus()
    await page.keyboard.down('Enter')
    try {
      await page.keyboard.down('Enter')
      await page.keyboard.down('Enter')
      assert.equal(await modal(page).getAttribute('data-panel'), 'load')
    } finally {
      await page.keyboard.up('Enter')
    }
    await page.waitForFunction(() => typeof window.finishPauseLookup === 'function')
    assert.equal(await page.evaluate(() => window.testStore.getCheckpointReadStatus()), 'pending')
    assert.equal(await button(page, 'Retry checkpoint lookup').isDisabled(), true)
    assert.equal(await focused(page, 'Back'), true)
    // Repeated activation of the now-disabled real control cannot issue a read.
    await button(page, 'Retry checkpoint lookup').evaluate(node => { node.click(); node.click() })
    assert.equal(await page.evaluate(() => window.pauseLookupAttempts), 2)
  }
  async function frontendRetry(key, leaveForOptions = false) {
    signal.throwIfAborted()
    await page.reload({ waitUntil: 'domcontentloaded' })
    await waitForStartupMenu(page)
    const main = page.getByRole('dialog', { name: 'Main menu', exact: true })
    await main.getByRole('status').filter({ hasText: 'Could not read browser storage.' }).waitFor()
    await page.evaluate(() => {
      // Read-only observation of Home's real store, as in profile-recovery.
      const root = document.querySelector('main')
      let fiber = root[Object.keys(root).find(key => key.startsWith('__reactFiber'))]
      for (; fiber; fiber = fiber.return)
        for (let hook = fiber.memoizedState; hook; hook = hook.next)
          if (hook.memoizedState?.getCheckpointReadStatus && hook.memoizedState?.getWorld)
            window.frontendRecoveryStore = hook.memoizedState
      if (!window.frontendRecoveryStore) throw Error('Home checkpoint observer unavailable')
      window.frontendRecoveryWorld = window.frontendRecoveryStore.getWorld()
      window.frontendRecoveryKeys = []
      for (const type of ['keydown', 'keyup'])
        document.addEventListener(type, event => {
          if (event.key === 'Enter' || event.key === ' ')
            window.frontendRecoveryKeys.push({ type, key: event.key,
              repeat: event.repeat, prevented: event.defaultPrevented })
        })
    })
    await button(page, 'Retry checkpoint lookup').focus()
    await page.keyboard.down(key)
    let held = true
    try {
      await page.keyboard.down(key)
      await page.keyboard.down(key)
      if (key === 'Space') {
        assert.equal(await page.evaluate(() => window.pauseLookupAttempts), 1,
          'Space must activate Retry on release, not repeated keydown')
        await page.keyboard.up(key)
        held = false
      }
      await page.waitForFunction(() => typeof window.finishPauseLookup === 'function')
      assert.equal(await button(page, 'Retry checkpoint lookup').isDisabled(), true)
      assert.equal(await focused(page, 'Load Game'), true)
      assert.equal(await page.evaluate(() => window.pauseLookupAttempts), 2)
      if (leaveForOptions) {
        if (held) {
          await page.keyboard.up(key)
          held = false
        }
        await button(page, 'Options').click()
        await button(page, 'Back').focus()
      }
      await page.evaluate(() => window.finishPauseLookup())
      await page.waitForFunction(() => window.frontendRecoveryStore.getCheckpointReadStatus() === 'read')
      if (held) {
        await page.keyboard.down(key)
        await page.keyboard.down(key)
        await page.keyboard.up(key)
        held = false
      }
      assert.equal(await main.isVisible(), true, 'held activation must not load the checkpoint')
      assert.equal(await page.evaluate(() => window.frontendRecoveryStore.getWorld() === window.frontendRecoveryWorld), true)
      if (leaveForOptions) {
        assert.equal(await focused(page, 'Back'), true, 'late lookup must not steal Options focus')
        await button(page, 'Back').click()
      } else assert.equal(await focused(page, 'Load Game'), true)
      assert.equal(await button(page, 'Load Game').getAttribute('aria-disabled'), 'false')
      const events = await page.evaluate(() => window.frontendRecoveryKeys)
      assert.ok(events.some(event => event.type === 'keydown' && event.repeat && event.prevented))
      assert.ok(events.some(event => event.type === 'keyup'))
      frontendKeyboard.push({ key, leaveForOptions, events, lookupAttempts: 2, worldRetained: true })
      const name = `frontend-retry-${key.toLowerCase()}${leaveForOptions ? '-options' : ''}.png`
      await page.screenshot({ path: resolve(output, name) })
      screenshots.push({ name, viewport: page.viewportSize(), dpr: await page.evaluate(() => devicePixelRatio) })
      passed(`frontend Retry preserves keyboard focus through ${key} repeats/release${leaveForOptions ? ' and late Options completion' : ' and successful lookup'}`)
    } finally {
      if (held) await page.keyboard.up(key)
    }
  }
  async function capture(page, name) {
    const viewport = page.viewportSize()
    const controls = await modal(page).getByRole('button').evaluateAll(observeStablePauseControls)
    assert.ok(controls.length > 0, `${name}: no visible modal buttons`)
    for (const box of controls) {
      assert.ok(box.width > 0 && box.height > 0 && box.x >= -1 && box.y >= -1 && box.x + box.width <= viewport.width + 1 && box.y + box.height <= viewport.height + 1, `${name}: offscreen button ${box.label}`)
      assert.equal(box.hit, true, `${name}: obstructed button ${box.label}`)
    }
    await page.screenshot({ path: resolve(output, name) })
    screenshots.push({ name, viewport, dpr: await page.evaluate(() => devicePixelRatio) })
  }

  await page.setViewportSize({ width: 800, height: 600 })
  await enterMission(page)
  await button(page, 'Menu').click()
  await button(page, 'Save Game').click()
  await button(page, 'Save checkpoint').click()
  await modal(page).getByRole('status').filter({ hasText: 'Checkpoint saved in this browser.' }).waitFor()
  const saved = await readCommittedCheckpoint(page)
  assert.ok(saved?.checkpointSha256)
  passed('checkpoint created and persisted by ordinary Save Game UI')
  await button(page, 'Back').click()
  const heldEscape = await checkPauseHeldEscape(page, output)
  passed('native held Escape cancels each subpanel once without resuming; a fresh press resumes')

  await page.addInitScript(coldLookupFailure)
  await frontendRetry('Enter')
  await frontendRetry('Space')
  await frontendRetry('Enter', true)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await openFailedLoad(page, true)
  await page.evaluate(() => { window.pauseRecoveryWorld = window.testStore.getWorld() })
  for (const [width, height] of [[640, 480], [1920, 1080], [800, 450]]) {
    await page.setViewportSize({ width, height })
    await capture(page, `failed-load-${width}x${height}.png`)
  }
  const frozen = await snapshot(page)
  await retry(page)
  await capture(page, 'pending-load.png')
  await page.keyboard.press('Escape')
  assert.equal(await focused(page, 'Load Game'), true)
  await button(page, 'Save Game').click()
  assert.equal(await focused(page, 'Back'), true)
  await page.evaluate(() => window.finishPauseLookup())
  await page.waitForFunction(() => window.testStore.getCheckpointReadStatus() === 'read')
  assert.equal(await modal(page).getAttribute('data-panel'), 'save')
  assert.equal(await focused(page, 'Back'), true)
  assert.equal(await snapshot(page), frozen)
  assert.equal(await page.evaluate(() => window.testStore.getWorld() === window.pauseRecoveryWorld), true)
  assert.equal((await readCommittedCheckpoint(page)).checkpointSha256, saved.checkpointSha256)
  passed('retry ignores held/repeated activation, freezes world and clock, and cannot steal focus or navigate from Save')

  await button(page, 'Back').click()
  await button(page, 'Load Game').click()
  assert.equal(await button(page, 'Load checkpoint').isEnabled(), true)
  assert.equal(await button(page, 'Retry checkpoint lookup').count(), 0)
  await page.setViewportSize({ width: 640, height: 480 })
  await capture(page, 'recovered-load-640x480.png')
  // A read-only subscription captures the replacement before a resumed turn.
  await page.evaluate(() => {
    const store = window.testStore, original = store.getWorld()
    const unsubscribe = store.subscribe(() => {
      const world = store.getWorld()
      if (world === original) return
      window.pauseLoadedCheckpoint = { turn: world.turn, time: world.time, level: world.outcome.level, paused: world.paused }
      unsubscribe()
    })
  })
  await button(page, 'Load checkpoint').click()
  await page.waitForFunction(() => !!window.pauseLoadedCheckpoint)
  assert.deepEqual(await page.evaluate(() => window.pauseLoadedCheckpoint), {
    turn: saved.turn, time: saved.time, level: saved.level, paused: false,
  })
  await modal(page).waitFor({ state: 'hidden' })
  passed('only explicit Load checkpoint replaces the world with the persisted checkpoint')
  // Release this scene before opening the independent high-DPI empty-store case.
  await page.close()

  const emptyContext = await browser.newContext({ viewport: { width: 800, height: 450 }, deviceScaleFactor: 2 })
  try {
    await emptyContext.addInitScript(coldLookupFailure)
    const empty = await emptyContext.newPage()
    empty.on('pageerror', error => receipt.errors.push(String(error)))
    empty.on('console', message => {
      if (message.type() === 'error') receipt.errors.push(message.text())
      if (message.type() === 'warning') receipt.warnings.push(message.text())
    })
    empty.setDefaultTimeout(45000)
    for (const finishAtRoot of [false, true]) {
      signal.throwIfAborted()
      await empty.goto(url, { waitUntil: 'domcontentloaded' })
      await openFailedLoad(empty)
      await capture(empty, `empty-failed-dpr2-${finishAtRoot ? 'root' : 'panel'}.png`)
      await retry(empty)
      if (finishAtRoot) {
        await empty.keyboard.press('Escape')
        assert.equal(await focused(empty, 'Load Game'), true)
      }
      await empty.evaluate(() => window.finishPauseLookup())
      await empty.waitForFunction(() => window.testStore.getCheckpointReadStatus() === 'read')
      if (!finishAtRoot) {
        await modal(empty).getByRole('status').filter({ hasText: 'No usable saved checkpoint was found' }).waitFor()
        assert.equal(await focused(empty, 'Back'), true)
        await capture(empty, 'empty-load-dpr2.png')
        await empty.keyboard.press('Escape')
      }
      assert.equal(await button(empty, 'Load Game').isDisabled(), true)
      assert.equal(await focused(empty, 'Continue Game'), true)
      assert.equal(await empty.evaluate(() => window.testStore.getWorld().paused), true)
      await button(empty, 'Continue Game').click()
      assert.equal(await empty.evaluate(() => window.testStore.getWorld().paused), false)
      passed(`empty retry restores usable root focus when completion occurs in ${finishAtRoot ? 'root' : 'Load panel'}`)
    }
  } finally {
    await emptyContext.close()
  }
  return {
    checks, screenshots, saved, renderers, frontendKeyboard, heldEscape, inputBudgets,
    limits: [
      'Controlled cold IndexedDB open failure and delayed success delivery; all checkpoint contents, storage transactions, world transitions and UI handlers are real.',
      'Repeated disabled-button clicks are synthetic activation probes; mission entry, saving, retry, Back and loading use rendered controls.',
      'Browser evidence does not establish native save-slot compatibility, exact native pixels or hardware performance.',
    ],
  }
}
