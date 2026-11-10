import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export function observePortal() {
  const p = window.loadingFullscreenProbe, host = p?.host ?? document.querySelector('[data-fullscreen-control]')
  const button = p?.button ?? host?.querySelector('button'), canvas = document.querySelector('.world-viewport canvas.battlefield')
  const focused = document.activeElement
  return {
    fullscreen: document.fullscreenElement === document.documentElement ? 'document' : document.fullscreenElement === null ? 'none' : 'other',
    hostConnected: !!host?.isConnected, hostParent: host?.parentElement?.tagName ?? null,
    hosts: document.querySelectorAll('[data-fullscreen-control]').length,
    dialogs: document.querySelectorAll('dialog[open]').length,
    loading: document.querySelectorAll('.loading-world').length,
    loadingPhase: document.querySelector('.loading-world')?.getAttribute('data-loading-phase') ?? null,
    controlFocused: !!host && host.contains(focused), focusTag: focused?.tagName ?? null,
    focusLabel: focused?.getAttribute('aria-label') ?? null, focusConnected: !!focused?.isConnected,
    canvasFocused: !!canvas && focused === canvas, canvasConnected: !!canvas?.isConnected,
    buttonSame: !p || host.querySelector('button') === p.button,
    buttonLabel: button?.getAttribute('aria-label') ?? null,
    buttonPressed: button?.getAttribute('aria-pressed') ?? null,
    buttonPending: button?.getAttribute('aria-disabled') ?? null,
  }
}

// Observe one real host's native removal. Never remove it, focus anything or
// call the placement helper from the test. Application code owns all mutations.
export function installPortalProbe() {
  const host = document.querySelector('[data-fullscreen-control]'), button = host?.querySelector('button')
  if (!host || !button) throw Error('Require the actual mounted fullscreen portal')
  const descriptor = Object.getOwnPropertyDescriptor(host, 'remove'), original = host.remove
  const p = { host, button, descriptor, original, removals: [], focuses: [], errors: [], overflow: false }
  const snapshot = () => {
    try {
      const canvas = document.querySelector('.world-viewport canvas.battlefield'), focused = document.activeElement
      return { parent: host.parentElement?.tagName ?? null, connected: host.isConnected,
        focused: host.contains(focused), focusTag: focused?.tagName ?? null,
        focusLabel: focused?.getAttribute('aria-label') ?? null,
        canvasConnected: !!canvas?.isConnected, canvasFocused: !!canvas && focused === canvas,
        dialogs: document.querySelectorAll('dialog[open]').length, loading: document.querySelectorAll('.loading-world').length,
        fullscreen: document.fullscreenElement === document.documentElement }
    } catch (error) { p.errors.push(String(error)); return null }
  }
  p.wrapper = function (...args) {
    const record = { before: snapshot() }
    if (p.removals.length < 4) p.removals.push(record)
    else p.overflow = true
    try { return Reflect.apply(original, this, args) }
    finally { record.after = snapshot() }
  }
  p.focused = event => {
    if (p.focuses.length < 32) p.focuses.push({ targetTag: event.target?.tagName ?? null, ...snapshot() })
    else p.overflow = true
  }
  Object.defineProperty(host, 'remove', { configurable: true, writable: true, value: p.wrapper })
  document.addEventListener('focusin', p.focused, true)
  window.loadingFullscreenProbe = p
}

export function observeFullscreenFrame(button) {
  const rect = button.getBoundingClientRect(), style = getComputedStyle(button)
  const bounds = { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height }
  const samples = [[.5, .5], [.25, .25], [.75, .25], [.25, .75], [.75, .75]].map(([x, y]) => {
    const hit = document.elementFromPoint(rect.left + x * rect.width, rect.top + y * rect.height)
    return hit === button || button.contains(hit)
  })
  return { connected: button.isConnected, label: button.getAttribute('aria-label'), pressed: button.getAttribute('aria-pressed'),
    pending: button.getAttribute('aria-disabled'), disabled: button.disabled,
    visible: style.display !== 'none' && style.visibility === 'visible' && Number(style.opacity) > 0,
    viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio }, bounds, samples }
}

export function assertFullscreenFrame(frame, label, pressed) {
  assert.equal(frame.connected, true); assert.equal(frame.visible, true); assert.equal(frame.disabled, false)
  assert.equal(frame.label, label); assert.equal(frame.pressed, String(pressed)); assert.equal(frame.pending, 'false')
  assert.ok(Object.values(frame.bounds).every(Number.isFinite))
  assert.ok(Object.values(frame.viewport).every(value => Number.isFinite(value) && value > 0))
  assert.ok(frame.bounds.width > 0 && frame.bounds.height > 0 && frame.bounds.left >= 0 && frame.bounds.top >= 0)
  assert.ok(frame.bounds.right <= frame.viewport.width && frame.bounds.bottom <= frame.viewport.height)
  assert.equal(frame.samples.length, 5); assert.ok(frame.samples.every(value => value === true))
}

export function observeKeyboardFocus(button) {
  const style = getComputedStyle(button)
  return { focused: document.activeElement === button, focusVisible: button.matches(':focus-visible'),
    outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, outlineOffset: style.outlineOffset,
    outlineColor: style.outlineColor }
}

export function assertKeyboardFocus(observed) {
  assert.equal(observed.focused, true); assert.equal(observed.focusVisible, true)
  assert.equal(observed.outlineStyle, 'solid'); assert.equal(observed.outlineWidth, '2px')
  assert.equal(observed.outlineOffset, '2px')
}

export default async function loadingKeyboardEpisode({ page, url, root, output, deadlineAt, signal, revision }) {
  const imported = file => import(pathToFileURL(resolve(root, file)).href)
  const { createAudioOptionsBudget, waitForAudioObservation } = await imported('scripts/browser-options-audio.mjs')
  const { openCampaignFromMainMenu } = await imported('scripts/browser-new-game.mjs')
  const { bindGame } = await imported('scripts/browser-game.mjs')
  const { observeFrozen, assertFrozen, observeCapture, observeFullscreenDismissal, assertFullscreenDismissal } = await imported('scripts/local-render/options-browser-controls.mjs')
  const { browserNativeEscape } = await imported('scripts/local-render/options-native-escape.mjs')
  const cleanupErrors = [], routeErrors = [], checks = [], captures = [], captureMetadata = []
  const budget = createAudioOptionsBudget({ signal, deadlineAt, cleanupErrors }), step = budget.step
  const wait = (fn, arg) => waitForAudioObservation(budget, timeout => page.waitForFunction(fn, arg, { timeout }))
  const targetUrl = new URL('/original/landscape.bin', url).href
  const bytes = readFileSync(resolve(root, 'public/original/landscape.bin'))
  const report = { status: 'running', revision, targetUrl, sourceBytes: bytes.length,
    sourceSha256: createHash('sha256').update(bytes).digest('hex'), requests: [], checks, captures, captureMetadata, cleanupErrors, routeErrors,
    fixture: 'Hold one real Mission 1 landscape GET, then continue it unchanged. The actual loading-to-gameplay lifecycle owns portal removal and focus. One per-instance native remove observer returns the original result unchanged; no test-driven DOM removal, helper invocation or focus assignment.',
    limits: ['Exact candidate shipped local Worker, sandboxed SwiftShader, 1280x960 DPR1; not deployed edge, hardware performance or native framebuffer parity.',
      'One normal Mission 1 loading transition with keyboard fullscreen and focused removal, plus ordinary modal focus preservation/native Escape. Recovery is a separately recorded episode; no StrictMode, browser-wide storage or final Full/integration acceptance.',
      'Request fingerprint identifies the candidate file, not separately measured response bytes. Four episode images plus a separate no-JavaScript loading shell.'] }
  const save = () => writeFileSync(resolve(output, 'loading-keyboard-episode.json'), JSON.stringify(report, null, 2) + '\n')
  let release, holdTimer, released = false, installed = false, probeInstalled = false, owner, control, failed = false, primary
  const gate = new Promise(done => { release = reason => { if (!released) { released = true; clearTimeout(holdTimer); report.releaseReason = reason; done(reason) } } })
  const completions = []
  let markHeld
  const firstHeld = new Promise(done => { markHeld = done })
  const bounded = async promise => {
    let timeout
    try { return await Promise.race([promise, new Promise((_, reject) => { timeout = setTimeout(() => reject(Error('Landscape request did not reach the held boundary')), Math.min(10000, budget.check())) })]) }
    finally { clearTimeout(timeout) }
  }
  const handler = async route => {
    let complete
    completions.push(new Promise(done => { complete = done }))
    const request = route.request(), record = { url: request.url(), method: request.method(), heldAt: Date.now() }
    report.requests.push(record)
    try {
      assert.equal(record.url, targetUrl); assert.equal(record.method, 'GET'); assert.equal(report.requests.length, 1)
      if (released) { record.status = 'aborted'; await route.abort(); return }
      holdTimer = setTimeout(() => { routeErrors.push('Landscape hold exceeded 20000 ms'); release('timeout') }, 20000)
      markHeld()
      const reason = await gate
      record.holdMs = Date.now() - record.heldAt
      if (reason !== 'continue') { record.status = 'aborted'; await route.abort(); return }
      assert.ok(record.holdMs < 20000)
      await route.continue(); record.status = 'continued-original-request'
    } catch (error) {
      record.status = 'failed'; record.error = String(error); routeErrors.push(String(error))
      try { await route.abort() } catch (cleanup) { routeErrors.push(String(cleanup)) }
    } finally {
      try { save() } catch (error) { routeErrors.push(String(error)) }
      finally { complete() }
    }
  }
  const observe = () => step(() => page.evaluate(observePortal))
  const shot = async name => {
    assert.ok(captures.length < 4)
    const metadata = await step(() => page.evaluate(observeCapture))
    await step(timeout => page.screenshot({ path: resolve(output, name), timeout }))
    assert.deepEqual(await step(() => page.evaluate(observeCapture)), metadata)
    captures.push(name); captureMetadata.push({ name, ...metadata }); save()
  }
  const button = name => page.getByRole('button', { name, exact: true })
  try {
    await step(async () => { await page.route(targetUrl, handler); installed = true })
    const response = await step(timeout => page.goto(url, { waitUntil: 'domcontentloaded', timeout }))
    assert.equal(response.status(), 200); assert.equal(await step(() => page.locator('main.game-shell').count()), 1)
    await step(() => openCampaignFromMainMenu(page))
    await step(timeout => button('Start Mission 1').click({ timeout }))
    await step(timeout => page.locator('[data-loading-phase="loading"]').waitFor({ state: 'visible', timeout }))
    await wait(() => document.querySelector('[data-fullscreen-control]')?.parentElement === document.body &&
      document.querySelectorAll('dialog[open]').length === 0 && document.querySelector('.world-viewport canvas.battlefield')?.isConnected)
    await step(() => bounded(firstHeld))
    assert.equal(report.requests.length, 1); assert.equal(released, false)
    await step(async () => { await page.evaluate(installPortalProbe); probeInstalled = true })
    await step(async () => { control = await button('Fullscreen').elementHandle() })
    assert.ok(control)
    report.loadingBefore = await observe()
    assert.equal(report.loadingBefore.fullscreen, 'none'); assert.equal(report.loadingBefore.loadingPhase, 'loading')
    report.frameBefore = await step(() => control.evaluate(observeFullscreenFrame))
    assertFullscreenFrame(report.frameBefore, 'Fullscreen', false)
    assert.equal(report.loadingBefore.focusTag, 'DIV')
    assert.equal(report.loadingBefore.controlFocused, false)
    report.keyboard = []
    const press = async (key, fullscreen) => {
      await step(() => page.keyboard.press(key))
      await wait(active => (document.fullscreenElement === document.documentElement) === active &&
        window.loadingFullscreenProbe.button.getAttribute('aria-disabled') === 'false', fullscreen)
      const observed = await observe()
      assert.equal(observed.controlFocused, true); assert.equal(observed.hostParent, 'BODY')
      assert.equal(observed.loadingPhase, 'loading'); assert.equal(observed.buttonSame, true)
      report.keyboard.push({ key, ...observed }); save()
    }
    await press('Tab', false)
    await press('Shift+Tab', false)
    await press('Enter', true)
    await press('Space', false)
    await press('Enter', true)
    await wait(() => document.fullscreenElement === document.documentElement &&
      window.loadingFullscreenProbe.button.getAttribute('aria-disabled') === 'false')
    report.loadingFullscreen = await observe()
    for (const key of ['hostConnected', 'buttonSame', 'controlFocused', 'focusConnected']) assert.equal(report.loadingFullscreen[key], true)
    assert.equal(report.loadingFullscreen.hostParent, 'BODY'); assert.equal(report.loadingFullscreen.loadingPhase, 'loading')
    assert.equal(report.loadingFullscreen.dialogs, 0); assert.equal(report.loadingFullscreen.fullscreen, 'document')
    report.frameFullscreen = await step(() => control.evaluate(observeFullscreenFrame))
    assertFullscreenFrame(report.frameFullscreen, 'Exit fullscreen', true)
    report.keyboardFocus = await step(() => control.evaluate(observeKeyboardFocus))
    assertKeyboardFocus(report.keyboardFocus)
    await shot('loading-keyboard-focused.png')
    assert.deepEqual(await step(() => control.evaluate(observeFullscreenFrame)), report.frameFullscreen)
    assert.equal(released, false)
    checks.push('keyboard-tab-shift-tab-enter-space-on-real-loading-control')
    release('continue')
    await step(() => bindGame(page))
    await step(() => Promise.all(completions))
    report.loaded = await observe()
    for (const key of ['canvasFocused', 'canvasConnected', 'focusConnected', 'buttonSame']) assert.equal(report.loaded[key], true)
    assert.equal(report.loaded.hostConnected, false); assert.equal(report.loaded.hostParent, null)
    assert.equal(report.loaded.hosts, 0); assert.equal(report.loaded.dialogs, 0); assert.equal(report.loaded.loading, 0)
    assert.equal(report.loaded.fullscreen, 'document')
    report.loadingRemoval = await step(() => page.evaluate(() => structuredClone(window.loadingFullscreenProbe.removals)))
    assert.equal(report.loadingRemoval.length, 1)
    const removal = report.loadingRemoval[0]
    assert.equal(removal.before.focused, true); assert.equal(removal.before.parent, 'BODY')
    assert.equal(removal.before.loading, 0); assert.equal(removal.before.dialogs, 0); assert.equal(removal.before.canvasConnected, true)
    assert.equal(removal.before.fullscreen, true); assert.equal(removal.after.fullscreen, true); assert.equal(removal.after.connected, false)
    await step(async () => { owner = await page.evaluateHandle(() => ({ world: window.testStore.getWorld(), scene: window.testSceneRef.current,
      menu: document.querySelector('button[aria-label="Menu"]') })) })
    assert.equal(await step(() => page.evaluate(({ world, scene }) => world.outcome.level === 1 && scene.world === world &&
      scene.renderer.domElement === document.activeElement, owner)), true)
    await shot('loading-keyboard-focused-portal-detached.png')
    checks.push('actual-focused-portal-removal-preserves-fullscreen-and-focuses-scene-canvas')
    await wait(() => Boolean(window.testStore.getWorld().flyby.flags & 1) || !window.testStore.getWorld().inputMask)
    const skip = page.getByRole('button', { name: /Skip introduction/ })
    if (await step(() => page.evaluate(() => Boolean(window.testStore.getWorld().inputMask)))) {
      try { await step(timeout => skip.click({ noWaitAfter: true, timeout })); report.skipClicked = true }
      catch (error) {
        if (error.name !== 'TimeoutError' || await skip.isVisible() || await page.evaluate(() => Boolean(window.testStore.getWorld().inputMask))) throw error
        budget.check(); report.skipClicked = 'natural-completion-race'
      }
    }
    await wait(() => !window.testStore.getWorld().inputMask)
    await step(timeout => button('Pause game').click({ timeout })); await wait(() => window.testStore.getWorld().paused)
    report.frozen = await step(() => page.evaluate(observeFrozen))
    await step(timeout => button('Menu').click({ timeout }))
    await wait(() => document.querySelector('dialog[data-original-pause-menu][open]')?.contains(window.loadingFullscreenProbe.host))
    report.reopened = await observe()
    assert.equal(report.reopened.hostParent, 'DIALOG'); assert.equal(report.reopened.buttonSame, true)
    assert.equal(report.reopened.fullscreen, 'document'); assert.equal(report.reopened.buttonLabel, 'Exit fullscreen')
    await step(timeout => button('Continue Game').click({ timeout }))
    await wait(() => document.querySelectorAll('dialog[open]').length === 0 && !window.loadingFullscreenProbe.host.isConnected)
    report.dismissed = await step(() => page.evaluate(observeFullscreenDismissal, owner))
    assertFullscreenDismissal(report.dismissed, true)
    assert.equal(report.dismissed.focusIsCurrentMenu, true); assert.equal(report.dismissed.focusOwner, 'menu')
    report.removals = await step(() => page.evaluate(() => structuredClone(window.loadingFullscreenProbe.removals)))
    assert.equal(report.removals.length, 2); assert.equal(report.removals[1].before.focused, false)
    assert.equal(report.removals[1].before.focusLabel, 'Menu')
    report.frozenAfterMenu = await step(() => page.evaluate(observeFrozen)); assertFrozen(report.frozen, report.frozenAfterMenu)
    await shot('loading-keyboard-menu-focus-preserved.png')
    checks.push('same-session-menu-reopen-detach-does-not-steal-restored-opener-focus')
    report.nativeEscape = {}
    await browserNativeEscape({ page, owner, budget, signal, deadlineAt, trace: report.nativeEscape, dialogs: 0, hosts: 0 })
    report.frozenAfterEscape = await step(() => page.evaluate(observeFrozen)); assertFrozen(report.frozen, report.frozenAfterEscape)
    await shot('loading-keyboard-native-exit.png')
    checks.push('browser-native-escape-exits-loading-started-session-after-portal-detachment')
    await step(timeout => button('Resume game').click({ timeout }))
    await wait(turn => !window.testStore.getWorld().paused && window.testStore.getWorld().turn > turn, report.frozen.turn)
    report.after = await step(() => page.evaluate(({ world, scene }) => {
      const gl = scene.renderer.getContext(), extension = gl.getExtension('WEBGL_debug_renderer_info')
      return { level: world.outcome.level, turn: world.turn, paused: world.paused, fullscreen: document.fullscreenElement !== null,
        sameWorldScene: window.testStore.getWorld() === world && window.testSceneRef.current === scene && scene.world === world,
        ownedCanvas: scene.renderer.domElement === document.querySelector('.world-viewport canvas.battlefield'),
        renderer: extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        webgl: gl.getParameter(gl.VERSION), viewport: [innerWidth, innerHeight], dpr: devicePixelRatio }
    }, owner))
    assert.equal(report.after.sameWorldScene, true); assert.equal(report.after.ownedCanvas, true); assert.equal(report.after.fullscreen, false)
    assert.deepEqual(routeErrors, []); assert.equal(report.requests[0].status, 'continued-original-request')
  } catch (error) { failed = true; primary = error; report.failure = error?.stack ?? String(error) }
  finally {
    release('cleanup'); clearTimeout(holdTimer)
    const cleanup = async (phase, action) => {
      try { await action() }
      catch (error) { cleanupErrors.push({ phase, error: String(error) }); if (!failed) { failed = true; primary = error } }
    }
    if (installed) await cleanup('routes', async () => { await page.unrouteAll({ behavior: 'wait' }); await Promise.all(completions); assert.deepEqual(routeErrors, []) })
    if (probeInstalled) await cleanup('portal-observer', async () => {
      report.observer = await page.evaluate(() => {
        const p = window.loadingFullscreenProbe
        if (p.host.remove !== p.wrapper) throw Error('Portal observer ownership changed')
        document.removeEventListener('focusin', p.focused, true)
        if (p.descriptor) Object.defineProperty(p.host, 'remove', p.descriptor)
        else delete p.host.remove
        return { restored: p.host.remove === p.original, errors: p.errors, overflow: p.overflow,
          removals: p.removals, focuses: p.focuses }
      })
      assert.equal(report.observer.restored, true); assert.equal(report.observer.overflow, false); assert.deepEqual(report.observer.errors, [])
    })
    for (const handle of [control, owner]) await cleanup('handle', () => handle?.dispose())
    try { budget.check(); assert.deepEqual(cleanupErrors, []) } catch (error) { if (!failed) { failed = true; primary = error } }
    report.status = failed ? 'failed' : 'passed'; save()
  }
  if (failed) throw primary
  return report
}
