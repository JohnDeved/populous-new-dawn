import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export function assertFrame(frame, label, pending) {
  for (const key of ['connected', 'exactControl', 'sameWorldScene', 'ownedCanvas', 'paused', 'visibleStyle', 'geometrySupported', 'ancestryBounded'])
    assert.equal(frame[key], true, `Audio frame requires ${key}`)
  assert.equal(frame.label, label)
  assert.equal(frame.busy, String(pending))
  assert.equal(frame.disabled, pending)
  assert.equal(frame.clipped, false)
  assert.equal(frame.samples.length, 5)
  assert.ok(frame.samples.every(value => value === true))
  assert.ok(Object.values(frame.bounds).every(Number.isFinite))
  assert.ok(Object.values(frame.viewport).every(value => Number.isFinite(value) && value > 0))
  assert.ok(frame.bounds.width > 0 && frame.bounds.height > 0)
  assert.ok(frame.scroll.length <= 31 && frame.scroll.every(value => Object.values(value).every(Number.isFinite)))
  assert.ok(frame.bounds.left >= 0 && frame.bounds.top >= 0 && frame.bounds.right <= frame.viewport.width && frame.bounds.bottom <= frame.viewport.height)
}

export default async function audioRetryEpisode({ page, root, output, deadlineAt, signal, revision }) {
  const imported = file => import(pathToFileURL(resolve(root, file)).href)
  const { createAudioOptionsBudget, openAudioOptions, closeAudioOptions, audioOptionsControl, observeOptionsAudio, waitForAudioObservation } = await imported('scripts/browser-options-audio.mjs')
  const { observeAudioFrame } = await imported('scripts/local-render/options-audio-framing.mjs')
  const { observeFrozen, assertFrozen, observeCapture } = await imported('scripts/local-render/options-browser-controls.mjs')
  const targetUrl = new URL('/original/audio/sound-150.wav', page.url()).href
  const expectedBytes = readFileSync(resolve(root, 'public/original/audio/sound-150.wav'))
  const hash = bytes => createHash('sha256').update(bytes).digest('hex')
  const targetSha256 = hash(expectedBytes)
  const cleanupErrors = [], routeErrors = [], captures = [], captureMetadata = [], frames = [], checks = []
  const budget = createAudioOptionsBudget({ signal, deadlineAt, cleanupErrors })
  const step = budget.step
  const wait = (fn, arg) => waitForAudioObservation(budget, timeout => page.waitForFunction(fn, arg, { timeout }))
  const report = { status: 'running', revision, targetUrl, targetSha256, targetBytes: expectedBytes.length,
    fixture: 'One real WAV request held for at most 10 seconds, then a deliberately supplied HTTP 503. One public keyboard retry receives the original exact server bytes. No AudioContext, Soundscape, World or play() methods replaced.',
    captures, captureMetadata, frames, checks, cleanupErrors, routeErrors, requests: [],
    limits: ['Single WAV enable-pending/retry only; no held music-stream, device-denial, loading fullscreen, focused-portal race or development StrictMode coverage.',
      'The expected 503 console error is retained, not discarded. The four-image cap includes only this episode; the outer no-JS shell is separate.',
      'Public controls and observed ownership; no acoustic quality, hardware performance or native framebuffer claim.'] }
  const save = () => writeFileSync(resolve(output, 'audio-retry-episode.json'), JSON.stringify(report, null, 2) + '\n')
  let release, timer, routeInstalled = false, owner, entry, control, primary, failed = false
  const gate = new Promise(resolve => { release = resolve })
  let heldAt, requestCount = 0, markHeld
  const firstHeld = new Promise(resolve => { markHeld = resolve })
  const bounded = async promise => {
    let timeout
    try { return await Promise.race([promise, new Promise((_, reject) => { timeout = setTimeout(() => reject(Error('Expected WAV request did not reach fixture')), Math.min(15000, budget.check())) })]) }
    finally { clearTimeout(timeout) }
  }
  const routeDone = []
  const handler = async route => {
    let complete
    routeDone.push(new Promise(resolve => { complete = resolve }))
    const number = ++requestCount, record = { number, url: route.request().url(), method: route.request().method() }
    report.requests.push(record)
    try {
      assert.equal(record.url, targetUrl); assert.equal(record.method, 'GET')
      assert.ok(number <= 2, 'No hidden third load or automatic retry')
      if (number === 1) {
        heldAt = Date.now(); record.heldAt = heldAt; markHeld()
        timer = setTimeout(() => { routeErrors.push('First WAV hold exceeded 10000 ms'); release('timeout') }, 10000)
        const reason = await gate
        clearTimeout(timer)
        record.holdMs = Date.now() - heldAt
        if (reason !== '503') {
          record.status = 'aborted'; record.abortReason = reason
          await route.abort(); return
        }
        assert.ok(record.holdMs < 10000)
        await route.fulfill({ status: 503, contentType: 'text/plain', body: 'Deliberate isolated Options retry fixture\n' })
        record.suppliedStatus = 503
      } else {
        const response = await route.fetch({ timeout: budget.check() })
        try {
          record.realStatus = response.status()
          assert.equal(record.realStatus, 200)
          const bytes = await response.body()
          record.realBytes = bytes.length; record.realSha256 = hash(bytes)
          assert.equal(record.realBytes, expectedBytes.length); assert.equal(record.realSha256, targetSha256)
          await route.fulfill({ response })
          record.originalResponseForwarded = true
        } finally { await response.dispose() }
      }
      record.status = 'completed'
    } catch (error) {
      record.status = 'failed'; record.error = String(error); routeErrors.push(String(error))
      try { await route.abort() } catch (cleanup) { routeErrors.push(String(cleanup)) }
    } finally {
      try { save() }
      catch (error) { routeErrors.push(String(error)) }
      finally { complete() }
    }
  }
  const observeOwner = ({ world, scene }) => ({ sameWorldScene: window.testStore.getWorld() === world && window.testSceneRef.current === scene && scene.world === world,
    ownedCanvas: scene.renderer.domElement === document.querySelector('.world-viewport canvas.battlefield') })
  const screenshot = async (name, label = null, pending = false, notice = false) => {
    assert.ok(captures.length < 4)
    let before
    if (label) {
      await step(timeout => control.scrollIntoViewIfNeeded({ timeout }))
      if (notice) await step(timeout => page.getByRole('status').filter({ hasText: 'Audio could not start.' }).scrollIntoViewIfNeeded({ timeout }))
      before = await step(() => control.evaluate(observeAudioFrame, owner))
      assertFrame(before, label, pending)
    }
    const metadata = await step(() => page.evaluate(observeCapture))
    await step(timeout => page.screenshot({ path: resolve(output, name), timeout }))
    assert.deepEqual(await step(() => page.evaluate(observeCapture)), metadata)
    if (label) {
      const after = await step(() => control.evaluate(observeAudioFrame, owner))
      assertFrame(after, label, pending); assert.deepEqual(after, before)
      frames.push({ name, before, after })
    }
    captures.push(name); captureMetadata.push({ name, ...metadata }); save()
  }
  try {
    await step(async () => { await page.route(targetUrl, handler); routeInstalled = true })
    await step(timeout => page.getByRole('button', { name: 'Pause game', exact: true }).click({ timeout }))
    await wait(() => window.testStore.getWorld().paused)
    await step(async () => { owner = await page.evaluateHandle(() => ({ world: window.testStore.getWorld(), scene: window.testSceneRef.current })) })
    const frozen = await step(() => page.evaluate(observeFrozen)); report.frozen = frozen
    entry = await openAudioOptions(page, { signal, deadlineAt, cleanupErrors })
    await step(async () => { control = await audioOptionsControl(page).elementHandle() })
    assert.ok(control)
    assert.equal(await step(() => control.getAttribute('aria-label')), '♫ Enable sound')
    await step(timeout => control.click({ timeout }))
    await wait(() => {
      const button = document.querySelector('dialog[open] [data-option-key="audio"]')
      return button?.disabled && button.getAttribute('aria-busy') === 'true'
    })
    await step(() => bounded(firstHeld))
    assert.equal(requestCount, 1, 'The chosen actual WAV request must be held')
    assert.equal(report.requests[0].suppliedStatus, undefined)
    report.pendingAudio = await step(() => page.evaluate(observeOptionsAudio))
    assert.equal(report.pendingAudio.enabled, false); assert.equal(report.pendingAudio.paused, true)
    await screenshot('audio-enable-pending.png', '♫ Enable sound', true)
    const rect = frames[0].after.bounds
    await step(() => page.mouse.click(rect.x + rect.width / 2, rect.y + rect.height / 2))
    assert.equal(await step(() => control.isDisabled()), true)
    assert.equal(requestCount, 1)
    report.pendingKeys = []
    for (const key of ['Enter', 'Space']) {
      const focus = await step(() => page.evaluate(() => ({ tag: document.activeElement?.tagName,
        label: document.activeElement?.getAttribute('aria-label'), disabled: document.activeElement?.disabled ?? null })))
      await step(() => page.keyboard.press(key))
      assert.equal(await step(() => control.isDisabled()), true)
      assert.equal(await step(() => control.getAttribute('aria-busy')), 'true')
      assert.equal(requestCount, 1)
      assertFrozen(frozen, await step(() => page.evaluate(observeFrozen)))
      report.pendingKeys.push({ key, focus, requestCount })
    }
    assertFrozen(frozen, await step(() => page.evaluate(observeFrozen)))
    checks.push('held-real-wav-keeps-control-disabled-busy-and-world-frozen')
    release('503')
    const noticeText = 'Audio could not start. Retry Enable sound in Menu > Options > Game > Browser compatibility and help.'
    await wait(expected => {
      const button = document.querySelector('dialog[open] [data-option-key="audio"]')
      return button && !button.disabled && button.getAttribute('aria-busy') === 'false' && button.getAttribute('aria-label') === '♫ Enable sound' &&
        [...document.querySelectorAll('dialog[open] [role="status"]')].some(node => node.textContent === expected)
    }, noticeText)
    await wait(observeOptionsAudio, { enabled: false, paused: true, context: 'suspended', backgroundScheduled: false })
    await step(() => bounded(routeDone[0]))
    assert.equal(report.requests[0].status, 'completed')
    assert.equal(report.requests[0].suppliedStatus, 503)
    assertFrozen(frozen, await step(() => page.evaluate(observeFrozen)))
    await screenshot('audio-enable-failed.png', '♫ Enable sound', false, true)
    checks.push('failed-response-clears-pending-and-exposes-real-retry-notice')
    await step(timeout => control.press('Enter', { timeout }))
    await wait(() => {
      const button = document.querySelector('dialog[open] [data-option-key="audio"]')
      return button && !button.disabled && button.getAttribute('aria-busy') === 'false' && button.getAttribute('aria-label') === '♪ Sound on'
    })
    await wait(observeOptionsAudio, { enabled: true, paused: true, context: 'suspended', mediaPaused: true, backgroundScheduled: false })
    assert.equal(requestCount, 2)
    await step(() => bounded(routeDone[1]))
    assert.equal(report.requests[1].status, 'completed')
    assert.equal(report.requests[1].originalResponseForwarded, true)
    assert.equal(await step(() => page.locator('dialog[open] [role="status"]').filter({ hasText: 'Audio could not start.' }).count()), 0)
    assertFrozen(frozen, await step(() => page.evaluate(observeFrozen)))
    await screenshot('audio-enable-retried.png', '♪ Sound on')
    checks.push('public-keyboard-retry-consumes-original-wav-and-retains-pause')
    await step(timeout => control.click({ timeout }))
    await wait(observeOptionsAudio, { enabled: false, paused: true, context: 'suspended', mediaPaused: true, backgroundScheduled: false })
    const closing = entry; entry = null
    await closeAudioOptions(page, closing)
    assertFrozen(frozen, await step(() => page.evaluate(observeFrozen)))
    assert.deepEqual(await step(() => page.evaluate(observeOwner, owner)), { sameWorldScene: true, ownedCanvas: true })
    await step(timeout => page.getByRole('button', { name: 'Resume game', exact: true }).click({ timeout }))
    await wait(turn => !window.testStore.getWorld().paused && window.testStore.getWorld().turn > turn, frozen.turn)
    await screenshot('audio-retry-resumed.png')
    checks.push('public-mute-dismiss-resume-retain-world-and-advance-simulation')
    assert.deepEqual(routeErrors, [])
    assert.equal(requestCount, 2)
  } catch (error) { failed = true; primary = error; report.failure = error?.stack ?? String(error) }
  finally {
    clearTimeout(timer); release('cleanup')
    if (routeInstalled) {
      try { await page.unrouteAll({ behavior: 'wait' }) }
      catch (error) { cleanupErrors.push({ phase: 'route', error: String(error) }); if (!failed) { failed = true; primary = error } }
    }
    for (const handle of [control, entry?.owner, owner]) {
      try { await handle?.dispose() }
      catch (error) { cleanupErrors.push({ phase: 'handle', error: String(error) }); if (!failed) { failed = true; primary = error } }
    }
    try { budget.check(); assert.deepEqual(routeErrors, []); assert.deepEqual(cleanupErrors, []) }
    catch (error) { if (!failed) { failed = true; primary = error } }
    report.status = failed ? 'failed' : 'passed'; save()
  }
  if (failed) throw primary
  return report
}
