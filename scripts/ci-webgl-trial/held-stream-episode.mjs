import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// Observation only: call the original once and return its exact promise unchanged.
export function installPlayObserver() {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'play')
  const events = [], unhandled = []
  const rejection = event => unhandled.push(String(event.reason))
  const original = descriptor.value
  const wrapper = function (...args) {
    const result = Reflect.apply(original, this, args)
    if (this.src.includes('/drone-')) {
      const event = { state: 'pending', readyState: this.readyState }
      events.push(event)
      result.then(() => { event.state = 'fulfilled' }, error => {
        event.state = 'rejected'; event.error = error.name
      })
    }
    return result
  }
  Object.defineProperty(HTMLMediaElement.prototype, 'play', { ...descriptor, value: wrapper })
  addEventListener('unhandledrejection', rejection)
  window.heldStreamProbe = { events, unhandled, descriptor, wrapper, rejection, analyzers: [] }
}

export default async function heldStreamEpisode({ page, root, output, deadlineAt, signal, revision }) {
  const imported = file => import(pathToFileURL(resolve(root, file)).href)
  const { createAudioOptionsBudget, openAudioOptions, closeAudioOptions, audioOptionsControl, setSoundThroughOptions, waitForAudioObservation } = await imported('scripts/browser-options-audio.mjs')
  const { observeFrozen, assertFrozen, observeCapture } = await imported('scripts/local-render/options-browser-controls.mjs')
  const { captureAudioFrame } = await imported('scripts/local-render/options-audio-framing.mjs')
  const cleanupErrors = [], routeErrors = [], checkpoints = [], captures = [], captureMetadata = [], audioFrames = []
  const options = { signal, deadlineAt, cleanupErrors }, budget = createAudioOptionsBudget(options), step = budget.step
  const wait = (fn, arg) => waitForAudioObservation(budget, timeout => page.waitForFunction(fn, arg, { timeout }))
  const button = name => page.getByRole('button', { name, exact: true })
  const origin = new URL(page.url()).origin
  const matches = url => url.origin === origin && /^\/original\/audio\/drone-\d+\.m4a$/.test(url.pathname) && !url.search
  const report = { status: 'running', revision, fixture: 'Bounded hold of real drone HTTP requests; native play observer returns the original promise unchanged. Public Pause must cause native AbortError; original network resumes after release.',
    maintainedFixtureSha256: '7b1ef639885beda5db5b0b0a61c1cfded9b5e69b874c4ee36ac9ab1985623629',
    checkpoints, captures, captureMetadata, audioFrames, requests: [], cleanupErrors, routeErrors,
    limits: ['Same-head local Worker and sandboxed SwiftShader only. Not deployed edge, native acoustic quality, human listening or hardware performance.',
      'The observer attaches settlement handlers, which may affect unhandled-rejection reporting, but never substitutes the native return value or changes pause/play/audio state.',
      'No loading fullscreen, focused portal, StrictMode, broader native/fallback matrix or final Full/integration acceptance.'] }
  const save = () => writeFileSync(resolve(output, 'held-stream-episode.json'), JSON.stringify(report, null, 2) + '\n')
  assert.equal(createHash('sha256').update(readFileSync(resolve(root, 'scripts/check-browser-audio-pause.mjs'))).digest('hex'), report.maintainedFixtureSha256)
  let release, holdTimer, released = false, installed = false, observerInstalled = false, owner, entry, failed = false, primary
  const gate = new Promise(done => { release = reason => { if (!released) { released = true; report.releaseReason = reason; clearTimeout(holdTimer); done(reason) } } })
  const completions = []
  const handler = async route => {
    let complete
    completions.push(new Promise(done => { complete = done }))
    const request = route.request(), url = new URL(request.url())
    const record = { url: url.href, method: request.method(), range: request.headers().range ?? null, heldAt: Date.now() }
    report.requests.push(record)
    try {
      assert.ok(matches(url)); assert.equal(record.method, 'GET'); assert.ok(report.requests.length <= 16, 'Bound media range/retry requests')
      const bytes = readFileSync(resolve(root, 'public' + url.pathname))
      record.sourceBytes = bytes.length; record.sourceSha256 = createHash('sha256').update(bytes).digest('hex')
      if (!released && !holdTimer) holdTimer = setTimeout(() => { routeErrors.push('Held stream exceeded 15000 ms'); release('timeout') }, 15000)
      const reason = await gate
      record.holdMs = Date.now() - record.heldAt
      if (reason !== 'resume') { record.status = 'aborted'; await route.abort(); return }
      assert.ok(record.holdMs < 15000)
      await route.continue()
      record.status = 'continued-original-request'
    } catch (error) {
      record.status = 'failed'; record.error = String(error); routeErrors.push(String(error))
      try { await route.abort() } catch (cleanup) { routeErrors.push(String(cleanup)) }
    } finally {
      try { save() } catch (error) { routeErrors.push(String(error)) }
      finally { complete() }
    }
  }
  const state = async label => {
    const value = await step(() => page.evaluate(({ world, scene }) => {
      const s = window.testAudio, p = window.heldStreamProbe
      return { enabled: s.enabled, paused: s.paused, context: s.context.state,
        mediaPaused: s.music.element.paused, mediaReadyState: s.music.element.readyState,
        mediaTime: s.music.element.currentTime, contextTime: s.context.currentTime,
        backgroundScheduled: s.backgroundTimer !== null,
        audioOptionsControl: Boolean(document.querySelector('dialog[data-original-pause-menu][open] [data-option-key="audio"]')),
        gameplaySoundControlCount: document.querySelectorAll('.top-actions button[aria-label="Enable sound"],.top-actions button[aria-label="Mute sound"]').length,
        failedMessage: document.body.textContent.includes('Audio could not start.'), events: structuredClone(p.events),
        sameWorldScene: window.testStore.getWorld() === world && window.testSceneRef.current === scene && scene.world === world,
        ownedCanvas: scene.renderer.domElement === document.querySelector('.world-viewport canvas.battlefield') }
    }, owner))
    checkpoints.push({ label, ...value }); save()
    assert.equal(value.sameWorldScene, true); assert.equal(value.ownedCanvas, true); assert.equal(value.gameplaySoundControlCount, 0)
    return value
  }
  const playing = async () => {
    await wait(() => {
      const s = window.testAudio
      return s.enabled && !s.paused && s.context.state === 'running' && !s.music.element.paused && s.music.element.readyState >= 2 && s.backgroundTimer !== null
    })
    assert.equal(await step(() => page.locator('.top-actions button[aria-label="Enable sound"],.top-actions button[aria-label="Mute sound"]').count()), 0)
  }
  const shot = async name => {
    assert.ok(captures.length < 4)
    const metadata = await step(() => page.evaluate(observeCapture))
    await step(timeout => page.screenshot({ path: resolve(output, name), timeout }))
    assert.deepEqual(await step(() => page.evaluate(observeCapture)), metadata)
    captures.push(name); captureMetadata.push({ name, ...metadata }); save()
  }
  try {
    await step(async () => { await page.route(matches, handler); installed = true })
    await step(async () => { owner = await page.evaluateHandle(() => ({ world: window.testStore.getWorld(), scene: window.testSceneRef.current })) })
    await step(() => page.evaluate(() => {
      const main = document.querySelector('main')
      let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
      for (; fiber; fiber = fiber.return)
        for (let hook = fiber.memoizedState; hook; hook = hook.next)
          if (hook.memoizedState?.current?.buffers instanceof Map && 'randomState' in hook.memoizedState.current)
            window.testAudio = hook.memoizedState.current
      if (!window.testAudio) throw Error('Actual React-owned Soundscape not found')
    }))
    await step(async () => { await page.evaluate(installPlayObserver); observerInstalled = true })
    entry = await openAudioOptions(page, options)
    await step(timeout => audioOptionsControl(page).click({ timeout }))
    await wait(() => window.testAudio.enabled && window.testAudio.paused && window.testAudio.context.state === 'suspended')
    await step(timeout => button('♪ Sound on').waitFor({ timeout }))
    const menu = await state('enabled-under-real-menu-pause')
    assert.equal(menu.mediaPaused, true); assert.equal(menu.backgroundScheduled, false); assert.equal(menu.events.length, 0)
    await captureAudioFrame({ page, owner, label: '♪ Sound on', name: 'options-sound-enabled.png', captures, budget,
      capture: () => shot('options-sound-enabled.png'), metadata: audioFrames })
    const closing = entry; entry = null
    await closeAudioOptions(page, closing)
    await wait(() => window.testAudio.enabled && window.heldStreamProbe.events.some(event => event.state === 'pending'))
    assert.ok(report.requests.length > 0); assert.equal(released, false)
    const pending = await state('real-music-play-pending')
    assert.equal(pending.mediaReadyState, 0); assert.equal(pending.backgroundScheduled, false)
    await step(timeout => button('Pause game').click({ timeout }))
    await wait(() => window.testAudio.context.state === 'suspended' && window.testAudio.music.element.paused && window.heldStreamProbe.events.some(event => event.state === 'rejected'))
    const paused = await state('pause-cancelled-native-play-without-disabling-sound')
    assert.equal(paused.enabled, true); assert.equal(paused.paused, true); assert.equal(paused.backgroundScheduled, false); assert.equal(paused.failedMessage, false)
    assert.ok(paused.events.some(event => event.error === 'AbortError'))
    assert.equal(released, false)
    await shot('held-stream-native-abort-paused.png')
    release('resume')
    await step(timeout => button('Resume game').click({ timeout }))
    await playing()
    const resumed = await state('resume-after-network-release')
    assert.equal(resumed.failedMessage, false)
    await step(() => page.evaluate(() => {
      const s = window.testAudio, p = window.heldStreamProbe
      const music = s.context.createAnalyser(), mix = s.context.createAnalyser()
      s.music.media.connect(music); s.master.connect(mix)
      p.analyzers.push({ source: s.music.media, probe: music }, { source: s.master, probe: mix })
    }))
    const peaks = { music: 0, mix: 0 }
    for (let i = 0; i < 24; i++) {
      await step(() => page.waitForTimeout(200))
      const values = await step(() => page.evaluate(() => window.heldStreamProbe.analyzers.map(({ probe }) => {
        const data = new Float32Array(probe.fftSize); probe.getFloatTimeDomainData(data)
        return Math.max(...data.map(Math.abs))
      })))
      peaks.music = Math.max(peaks.music, values[0]); peaks.mix = Math.max(peaks.mix, values[1])
      if (peaks.music > 0.001 && peaks.mix > 0.001) break
    }
    report.signalPeaks = peaks
    assert.ok(peaks.music > 0.001 && peaks.mix > 0.001, JSON.stringify(peaks))
    const audible = await state('real-stream-and-output-resumed')
    assert.ok(audible.mediaTime > resumed.mediaTime)
    await shot('held-stream-real-signal-resumed.png')
    for (let i = 0; i < 3; i++) {
      await step(timeout => button('Pause game').click({ timeout }))
      await step(timeout => button('Resume game').click({ timeout }))
    }
    await playing()
    const latest = await state('latest-ui-resume-remains-playing')
    assert.equal(latest.enabled, true); assert.equal(latest.failedMessage, false)
    await step(timeout => button('Pause game').click({ timeout }))
    await wait(() => window.testAudio.context.state === 'suspended')
    const stopped = await state('stable-pause'), frozen = await step(() => page.evaluate(observeFrozen))
    await step(() => page.waitForTimeout(250))
    const still = await state('stable-pause-after-wait')
    assert.equal(still.mediaTime, stopped.mediaTime); assert.equal(still.contextTime, stopped.contextTime); assert.equal(still.backgroundScheduled, false)
    assertFrozen(frozen, await step(() => page.evaluate(observeFrozen)))
    await step(timeout => button('Resume game').click({ timeout })); await playing()
    await setSoundThroughOptions(page, false, options)
    await wait(() => !window.testAudio.enabled && window.testAudio.context.state === 'suspended')
    const muted = await state('mute')
    assert.equal(muted.mediaPaused, true); assert.equal(muted.backgroundScheduled, false)
    await setSoundThroughOptions(page, true, options); await playing()
    assert.equal((await state('reenable')).failedMessage, false)
    for (const name of ['Game settings', 'Options', 'Sound']) await step(timeout => button(name).click({ timeout }))
    await wait(() => window.testAudio.context.state === 'suspended')
    await step(timeout => page.getByRole('slider', { name: 'Music volume', exact: true }).fill('0.5', { timeout }))
    assert.equal(await step(() => page.evaluate(() => window.testAudio.musicVolume)), 0.5)
    await shot('held-stream-music-volume.png')
    for (const name of ['Back', 'Continue Game']) await step(timeout => button(name).click({ timeout }))
    await playing(); await state('settings-close-restores-playback')
    assert.deepEqual(await step(() => page.evaluate(() => window.heldStreamProbe.unhandled)), [])
    assert.deepEqual(routeErrors, [])
  } catch (error) { failed = true; primary = error; report.failure = error?.stack ?? String(error) }
  finally {
    release('cleanup'); clearTimeout(holdTimer)
    const cleanup = async (phase, action) => {
      try { await action() }
      catch (error) { cleanupErrors.push({ phase, error: String(error) }); if (!failed) { failed = true; primary = error } }
    }
    if (installed) await cleanup('routes', async () => {
      await page.unrouteAll({ behavior: 'wait' }); await Promise.all(completions)
      assert.ok(report.requests.length > 0); assert.deepEqual(routeErrors, [])
      assert.ok(report.requests.every(record => record.status === 'continued-original-request'))
    })
    if (observerInstalled) await cleanup('native-observer', async () => {
      report.observerRestored = await page.evaluate(() => {
        const p = window.heldStreamProbe
        if (HTMLMediaElement.prototype.play !== p.wrapper) throw Error('Native play observer ownership changed')
        for (const { source, probe } of p.analyzers) { source.disconnect(probe); probe.disconnect() }
        Object.defineProperty(HTMLMediaElement.prototype, 'play', p.descriptor)
        removeEventListener('unhandledrejection', p.rejection)
        return HTMLMediaElement.prototype.play === p.descriptor.value
      })
      assert.equal(report.observerRestored, true)
    })
    for (const handle of [entry?.owner, owner]) await cleanup('owner-handle', () => handle?.dispose())
    try { budget.check(); assert.deepEqual(cleanupErrors, []) } catch (error) { if (!failed) { failed = true; primary = error } }
    report.status = failed ? 'failed' : 'passed'; save()
  }
  if (failed) throw primary
  return report
}
