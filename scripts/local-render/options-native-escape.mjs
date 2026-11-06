import assert from 'node:assert/strict'

export const nativeEscapeContract = 'chrome-156-linux-browser-escape-v1'
export const nativeEscapeCapMs = 30000
export const escapeKey = Object.freeze({ key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27,
  nativeVirtualKeyCode: 9, modifiers: 0, autoRepeat: false, isKeypad: false, isSystemKey: false, location: 0 })

// Chromium a21ce95c24ce3964416f09ae1862f53f319eb4d0 maps Linux native
// Escape to XKB 9. Under the admitted trusted pipe this supported field admits
// browser prehandling. This is protocol input, not an OS keyboard event.
export function assertEscapeRuntime(platform, version, url) {
  assert.equal(platform, 'linux', 'Native Escape mapping is reviewed only for Linux')
  assert.equal(version, '156.0.8078.79', 'Native Escape requires the reviewed Chrome version')
  assert.equal(url, 'http://127.0.0.1:5198/', 'Native Escape is restricted to the owned Options preview')
}

export function observeNativeEscape(owner) {
  const world = window.testStore.getWorld(), scene = window.testSceneRef.current
  const canvas = document.querySelector('.world-viewport canvas.battlefield'), focused = document.activeElement
  const fullscreen = document.fullscreenElement
  return { fullscreen: fullscreen === null ? 'none' : fullscreen === document.documentElement ? 'document' : 'other',
    fullscreenTag: fullscreen?.tagName?.slice(0, 24) ?? null,
    documentHasFocus: document.hasFocus(), connectedFocus: !!focused?.isConnected,
    focusedTag: focused?.tagName?.slice(0, 24) ?? null,
    focusOwner: focused === canvas ? 'canvas' : focused === owner.menu ? 'menu'
      : focused?.closest('[data-fullscreen-control]') ? 'fullscreen-control' : 'other',
    openDialogs: document.querySelectorAll('dialog[open]').length,
    visibleHosts: document.querySelectorAll('[data-fullscreen-control]').length,
    sameWorldScene: world === owner.world && scene === owner.scene && scene.world === world,
    ownedCanvas: !!canvas?.isConnected && scene.renderer.domElement === canvas,
    paused: world.paused, inputMask: world.inputMask, level: world.outcome.level }
}

export function assertEscapeObservation(observation, fullscreen, dialogs, hosts) {
  assert.equal(observation.fullscreen, fullscreen)
  assert.equal(observation.openDialogs, dialogs)
  assert.equal(observation.visibleHosts, hosts)
  assert.equal(observation.sameWorldScene, true)
  assert.equal(observation.ownedCanvas, true)
  assert.equal(observation.paused, true)
  assert.equal(observation.inputMask, 0)
  assert.equal(observation.level, 1)
}

// One nonresetting boundary covers session setup, one down/up, observations,
// the unchanged exit predicate and disposal. Unknown input ends the episode.
export async function browserNativeEscape({ page, owner, budget, signal, deadlineAt, trace,
  dialogs, hosts, platform = process.platform, now = performance.now.bind(performance), wallNow = Date.now,
  setTimer = setTimeout, clearTimer = clearTimeout }) {
  const started = now(), wallStarted = wallNow()
  assert.ok([started, wallStarted, deadlineAt].every(Number.isFinite))
  const capMs = Math.min(nativeEscapeCapMs, budget.check(), deadlineAt - wallStarted)
  assert.ok(Number.isFinite(capMs) && capMs > 0)
  const deadline = Math.min(deadlineAt, wallStarted + capMs)
  Object.assign(trace, { contract: nativeEscapeContract, transport: 'page-target CDP Input.dispatchKeyEvent',
    capMs, status: 'running', phases: [], commands: [], cleanup: [] })
  let session, ready, timer, rejectExpiry, stopped = false, failed = false, primary
  const remaining = () => {
    signal?.throwIfAborted()
    const elapsed = now() - started
    assert.ok(Number.isFinite(elapsed) && elapsed >= 0, 'Native Escape monotonic clock is invalid')
    const ms = Math.min(capMs - elapsed, deadline - wallNow(), budget.check())
    assert.ok(!stopped && ms > 0, 'Native Escape boundary expired')
    return ms
  }
  const phase = async (name, action) => {
    const timeout = remaining(), record = { name, startedMs: now() - started, status: 'issued' }
    trace.phases.push(record)
    try {
      const value = await action(timeout)
      record.status = 'settled'; record.finishedMs = now() - started
      remaining()
      return value
    } catch (error) { record.error = String(error); throw error }
  }
  const command = type => phase(type, async () => {
    assert.ok(trace.commands.length < 2)
    const params = { type, ...escapeKey }, record = { method: 'Input.dispatchKeyEvent', params,
      startedMs: now() - started, status: 'issued' }
    trace.commands.push(record)
    try {
      await session.send(record.method, params)
      record.status = 'settled'; record.finishedMs = now() - started
    } catch (error) { record.status = 'uncertain'; record.error = String(error); throw error }
  })
  const stop = error => { stopped = true; rejectExpiry(error) }
  const aborted = () => stop(signal.reason ?? new Error('Native Escape aborted'))
  const expiry = new Promise((_, reject) => { rejectExpiry = reject })
  const work = Promise.resolve().then(async () => {
    let sequenceFailed = false, sequenceError
    try {
      remaining()
      const context = page.context(), version = context.browser()?.version(), url = page.url()
      assertEscapeRuntime(platform, version, url)
      assert.ok(context.pages().includes(page), 'Native Escape page must remain in its owning context')
      trace.runtime = { platform, version, url, sessionKind: 'page-target' }
      await phase('attach-page-session', async () => { session = await context.newCDPSession(page) })
      const { targetInfo } = await phase('read-page-target', () => session.send('Target.getTargetInfo'))
      assert.equal(targetInfo.type, 'page'); assert.equal(targetInfo.url, url)
      assert.ok(typeof targetInfo.targetId === 'string' && targetInfo.targetId.length > 0 && targetInfo.targetId.length <= 128)
      trace.targetId = targetInfo.targetId
      trace.before = await phase('read-before', () => page.evaluate(observeNativeEscape, owner))
      assertEscapeObservation(trace.before, 'document', dialogs, hosts)
      assert.equal(trace.before.documentHasFocus, true, 'Native Escape requires the owned document to have focus')
      assert.equal(trace.before.connectedFocus, true)
      await command('rawKeyDown')
      await command('keyUp')
      trace.afterInput = await phase('read-after-input', () => page.evaluate(observeNativeEscape, owner))
      assert.ok(['document', 'none'].includes(trace.afterInput.fullscreen), 'Native input must not transfer fullscreen to another element')
      assertEscapeObservation(trace.afterInput, trace.afterInput.fullscreen, dialogs, hosts)
      await phase('wait-fullscreen-exit', async timeout => {
        ready = await page.waitForFunction(() => document.fullscreenElement === null, null, { timeout })
      })
      trace.afterExit = await phase('read-exit', () => page.evaluate(observeNativeEscape, owner))
      assertEscapeObservation(trace.afterExit, 'none', dialogs, hosts)
    } catch (error) { sequenceFailed = true; sequenceError = error }
    finally {
      // Releases are cleanup, not more key events or a new acceptance allowance.
      // The boundary timer and outer worker watchdog stay active until settlement.
      for (const [name, release] of [['ready-handle', () => ready?.dispose()], ['page-session', () => session?.detach()]]) {
        const record = { name, startedMs: now() - started }
        trace.cleanup.push(record)
        try { await release(); record.status = 'settled' }
        catch (error) {
          record.status = 'failed'; record.error = String(error)
          if (!sequenceFailed) { sequenceFailed = true; sequenceError = error }
        }
        record.finishedMs = now() - started
      }
    }
    if (sequenceFailed) throw sequenceError
  })
  try {
    signal?.addEventListener('abort', aborted, { once: true })
    if (signal?.aborted) aborted()
    timer = setTimer(() => stop(new Error('Native Escape boundary expired')), capMs)
    await Promise.race([work, expiry])
    remaining()
    assert.deepEqual(trace.commands.map(record => [record.params.type, record.status]), [['rawKeyDown', 'settled'], ['keyUp', 'settled']])
    trace.status = 'passed'
  } catch (error) {
    failed = true; primary = error; stopped = true
    trace.status = 'failed'; trace.failure = String(error)
    if (!trace.afterExit) trace.terminalObservation = { status: 'unavailable', reason: 'No completed exit observation within the original boundary; no extra action or timeout is admitted' }
    try { await page.close(); trace.pageClosed = true }
    catch (error) { trace.pageCloseError = String(error) }
  } finally {
    stopped = true; clearTimer(timer); signal?.removeEventListener('abort', aborted)
    await work.catch(() => {})
    trace.elapsedMs = now() - started
  }
  if (failed) throw primary
}
