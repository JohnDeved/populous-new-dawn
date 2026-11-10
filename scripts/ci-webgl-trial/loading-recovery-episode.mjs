import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { observePortal, installPortalProbe, observeFullscreenFrame, assertFullscreenFrame, observeKeyboardFocus, assertKeyboardFocus } from './loading-keyboard-episode.mjs'

function observeRecoveryFocus() {
  const focused = document.activeElement, host = window.loadingFullscreenProbe.host
  let owner = 'other'
  if (host.contains(focused)) owner = 'fullscreen'
  else if (focused?.tagName === 'SUMMARY') owner = 'details'
  else if (focused?.textContent?.trim() === 'Try again') owner = 'retry'
  else if (focused?.matches('.loading-world')) owner = 'loading'
  return { owner, connected: !!focused?.isConnected, tag: focused?.tagName ?? null,
    phase: document.querySelector('.loading-world')?.getAttribute('data-loading-phase') ?? null,
    detailsOpen: document.querySelector('.loading-recovery details')?.open ?? false,
    fullscreen: document.fullscreenElement === document.documentElement,
    hostParent: host.parentElement?.tagName ?? null,
    label: window.loadingFullscreenProbe.button.getAttribute('aria-label'),
    pending: window.loadingFullscreenProbe.button.getAttribute('aria-disabled') }
}

export default async function loadingRecoveryEpisode({ page, url, root, output, deadlineAt, signal, revision }) {
  const imported = file => import(pathToFileURL(resolve(root, file)).href)
  const { createAudioOptionsBudget, waitForAudioObservation } = await imported('scripts/browser-options-audio.mjs')
  const { openCampaignFromMainMenu } = await imported('scripts/browser-new-game.mjs')
  const { bindGame } = await imported('scripts/browser-game.mjs')
  const { observeCapture } = await imported('scripts/local-render/options-browser-controls.mjs')
  const cleanupErrors = [], routeErrors = []
  const budget = createAudioOptionsBudget({ signal, deadlineAt, cleanupErrors }), step = budget.step
  const wait = (fn, arg) => waitForAudioObservation(budget, timeout => page.waitForFunction(fn, arg, { timeout }))
  const targetUrl = new URL('/original/landscape.bin', url).href
  const bytes = readFileSync(resolve(root, 'public/original/landscape.bin'))
  const report = { status: 'running', revision, targetUrl, sourceBytes: bytes.length,
    sourceSha256: createHash('sha256').update(bytes).digest('hex'), requests: [], keyboard: [], captures: [], captureMetadata: [],
    cleanupErrors, routeErrors,
    fixture: 'First actual Mission 1 landscape GET receives a deliberate HTTP 503. Public keyboard Retry starts a second real GET, held up to 20 seconds then continued unchanged. No direct focus, DOM removal, loading-state, World or Scene mutation.',
    limits: ['One loading failure and recovery; not assistive-technology certification, restore-phase or broad loading-failure coverage.',
      'Candidate file hash, not a separately measured HTTP response-body hash. Same sandboxed local Worker bounds as the normal keyboard episode.'] }
  const save = () => writeFileSync(resolve(output, 'loading-recovery-episode.json'), JSON.stringify(report, null, 2) + '\n')
  let installed = false, probeInstalled = false, control, timer, released = false, failed = false, primary, release, markHeld
  const gate = new Promise(done => { release = reason => { if (!released) { released = true; clearTimeout(timer); report.releaseReason = reason; done(reason) } } })
  const held = new Promise(done => { markHeld = done }), completions = []
  const boundedHeld = async () => {
    let timeout
    try { await Promise.race([held, new Promise((_, reject) => { timeout = setTimeout(() => reject(Error('Retry landscape GET did not arrive')), Math.min(10000, budget.check())) })]) }
    finally { clearTimeout(timeout) }
  }
  const handler = async route => {
    let done
    completions.push(new Promise(resolve => { done = resolve }))
    const request = route.request(), record = { url: request.url(), method: request.method(), ordinal: report.requests.length + 1 }
    report.requests.push(record)
    try {
      assert.equal(record.url, targetUrl); assert.equal(record.method, 'GET'); assert.ok(record.ordinal <= 2)
      if (released) { record.status = 'aborted'; await route.abort(); return }
      if (record.ordinal === 1) {
        await route.fulfill({ status: 503, contentType: 'text/plain', body: 'Supplied terrain load failure' })
        record.status = 'supplied-503'
      } else {
        record.heldAt = Date.now()
        timer = setTimeout(() => { routeErrors.push('Retry landscape hold exceeded 20000 ms'); release('timeout') }, 20000)
        markHeld()
        const reason = await gate
        record.holdMs = Date.now() - record.heldAt
        if (reason !== 'continue') { record.status = 'aborted'; await route.abort(); return }
        assert.ok(record.holdMs < 20000)
        await route.continue(); record.status = 'continued-original-request'
      }
    } catch (error) {
      record.error = String(error); record.status = 'failed'; routeErrors.push(String(error))
      try { await route.abort() } catch (cleanup) { routeErrors.push(String(cleanup)) }
    } finally {
      try { save() } catch (error) { routeErrors.push(String(error)) }
      finally { done() }
    }
  }
  const press = async (key, expectedOwner, fullscreen = false) => {
    await step(() => page.keyboard.press(key))
    await wait(active => (document.fullscreenElement === document.documentElement) === active &&
      window.loadingFullscreenProbe.button.getAttribute('aria-disabled') === 'false', fullscreen)
    const observed = await step(() => page.evaluate(observeRecoveryFocus))
    assert.equal(observed.owner, expectedOwner); assert.equal(observed.connected, true)
    assert.equal(observed.fullscreen, fullscreen); assert.equal(observed.hostParent, 'BODY')
    report.keyboard.push({ key, ...observed }); save()
  }
  const shot = async name => {
    assert.ok(report.captures.length < 2)
    const metadata = await step(() => page.evaluate(observeCapture))
    await step(timeout => page.screenshot({ path: resolve(output, name), timeout }))
    assert.deepEqual(await step(() => page.evaluate(observeCapture)), metadata)
    report.captures.push(name); report.captureMetadata.push({ name, ...metadata }); save()
  }
  try {
    await step(async () => { await page.route(targetUrl, handler); installed = true })
    const response = await step(timeout => page.goto(url, { waitUntil: 'domcontentloaded', timeout }))
    assert.equal(response.status(), 200)
    await step(() => openCampaignFromMainMenu(page))
    await step(timeout => page.getByRole('button', { name: 'Start Mission 1', exact: true }).click({ timeout }))
    await step(timeout => page.locator('[data-loading-phase="failed"]').waitFor({ state: 'visible', timeout }))
    await wait(() => document.activeElement?.textContent?.trim() === 'Try again' &&
      document.querySelector('[data-fullscreen-control]')?.parentElement === document.body && !document.querySelector('dialog[open]'))
    await step(async () => { await page.evaluate(installPortalProbe); probeInstalled = true })
    await step(async () => { control = await page.getByRole('button', { name: 'Fullscreen', exact: true }).elementHandle() })
    assert.ok(control)
    report.initialFailure = await step(() => page.evaluate(observeRecoveryFocus))
    assert.equal(report.initialFailure.phase, 'failed'); assert.equal(report.initialFailure.owner, 'retry')
    await step(() => Promise.all(completions))
    assert.equal(report.requests.length, 1); assert.equal(report.requests[0].status, 'supplied-503')
    await press('Tab', 'fullscreen')
    await press('Shift+Tab', 'retry')
    await press('Shift+Tab', 'details')
    await press('Enter', 'details')
    assert.equal(report.keyboard.at(-1).detailsOpen, true)
    assert.equal(await step(() => page.getByText('Terrain texture load failed: 503', { exact: true }).isVisible()), true)
    await press('Shift+Tab', 'fullscreen')
    await press('Tab', 'details')
    await press('Tab', 'retry')
    await press('Tab', 'fullscreen')
    await press('Enter', 'fullscreen', true)
    report.failureFrame = await step(() => control.evaluate(observeFullscreenFrame))
    assertFullscreenFrame(report.failureFrame, 'Exit fullscreen', true)
    report.keyboardFocus = await step(() => control.evaluate(observeKeyboardFocus))
    assertKeyboardFocus(report.keyboardFocus)
    await shot('loading-recovery-keyboard-focused.png')
    await press('Shift+Tab', 'retry', true)
    await step(() => page.keyboard.press('Space'))
    await step(timeout => page.locator('[data-loading-phase="loading"]').waitFor({ state: 'visible', timeout }))
    await step(boundedHeld)
    await wait(() => document.activeElement?.matches('.loading-world'))
    report.retryLoading = await step(() => page.evaluate(observeRecoveryFocus))
    assert.equal(report.retryLoading.phase, 'loading'); assert.equal(report.retryLoading.owner, 'loading')
    assert.equal(report.requests.length, 2); assert.equal(released, false)
    await press('Shift+Tab', 'fullscreen', true)
    await press('Space', 'fullscreen', false)
    await press('Enter', 'fullscreen', true)
    assert.equal(released, false)
    release('continue')
    await step(() => bindGame(page)); await step(() => Promise.all(completions))
    report.recovered = await step(() => page.evaluate(observePortal))
    assert.equal(report.recovered.canvasFocused, true); assert.equal(report.recovered.canvasConnected, true)
    assert.equal(report.recovered.hostConnected, false); assert.equal(report.recovered.fullscreen, 'document')
    assert.equal(report.recovered.loading, 0); assert.equal(report.recovered.dialogs, 0)
    report.owner = await step(() => page.evaluate(() => {
      const scene = window.testSceneRef.current, world = window.testStore.getWorld()
      return { level: world.outcome.level, sceneMatchesWorld: scene.world === world,
        sceneCanvasFocused: scene.renderer.domElement === document.activeElement,
        ownedCanvas: scene.renderer.domElement === document.querySelector('.world-viewport canvas.battlefield') }
    }))
    assert.deepEqual(report.owner, { level: 1, sceneMatchesWorld: true, sceneCanvasFocused: true, ownedCanvas: true })
    await shot('loading-recovery-completed.png')
    await step(() => page.evaluate(() => {
      const p = window.loadingFullscreenProbe
      p.afterLoadingKey = event => { p.afterLoadingTab = { key: event.key, prevented: event.defaultPrevented,
        target: event.target?.tagName ?? null, loading: document.querySelectorAll('.loading-world').length } }
      document.addEventListener('keydown', p.afterLoadingKey, { capture: true, once: true })
    }))
    await step(() => page.keyboard.press('Tab'))
    report.afterLoadingTab = await step(() => page.evaluate(() => window.loadingFullscreenProbe.afterLoadingTab))
    assert.deepEqual(report.afterLoadingTab, { key: 'Tab', prevented: false, target: 'CANVAS', loading: 0 })
    assert.equal(report.requests[1].status, 'continued-original-request'); assert.deepEqual(routeErrors, [])
  } catch (error) { failed = true; primary = error; report.failure = error?.stack ?? String(error) }
  finally {
    release('cleanup'); clearTimeout(timer)
    const cleanup = async (phase, action) => {
      try { await action() } catch (error) { cleanupErrors.push({ phase, error: String(error) }); if (!failed) { failed = true; primary = error } }
    }
    if (installed) await cleanup('routes', async () => { await page.unrouteAll({ behavior: 'wait' }); await Promise.all(completions); assert.deepEqual(routeErrors, []) })
    if (probeInstalled) await cleanup('portal-observer', async () => {
      report.observer = await page.evaluate(() => {
        const p = window.loadingFullscreenProbe
        if (p.host.remove !== p.wrapper) throw Error('Portal observer ownership changed')
        document.removeEventListener('focusin', p.focused, true)
        if (p.afterLoadingKey) document.removeEventListener('keydown', p.afterLoadingKey, true)
        if (p.descriptor) Object.defineProperty(p.host, 'remove', p.descriptor)
        else delete p.host.remove
        return { restored: p.host.remove === p.original, errors: p.errors, overflow: p.overflow,
          removals: p.removals, focuses: p.focuses }
      })
      assert.equal(report.observer.restored, true); assert.equal(report.observer.overflow, false); assert.deepEqual(report.observer.errors, [])
      if (!failed) {
        assert.equal(report.observer.removals.length, 1)
        assert.equal(report.observer.removals[0].before.focused, true)
        assert.equal(report.observer.removals[0].before.loading, 0)
      }
    })
    await cleanup('control', () => control?.dispose())
    try { budget.check(); assert.deepEqual(cleanupErrors, []) } catch (error) { if (!failed) { failed = true; primary = error } }
    report.status = failed ? 'failed' : 'passed'; save()
  }
  if (failed) throw primary
  return report
}
