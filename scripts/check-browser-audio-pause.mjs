import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const output = process.env.PND_QUEUE_OUTPUT
assert(output && process.env.POPULOUS_URL, 'Use the shared queue browser supervisor')
mkdirSync(output, { recursive: true })
const report = {
  status: 'running',
  jobId: process.env.PND_QUEUE_JOB_ID,
  method: 'Normal Mission 1 sound/pause controls; delay only the real drone HTTP request, never replace play() results or audio bytes.',
  checkpoints: [],
}
let browser, page, releaseStream
const streamGate = new Promise(resolve => { releaseStream = resolve })
let heldRequests = 0, closing = false

async function state(label) {
  const value = await page.evaluate(() => {
    const sound = window.testAudio
    return {
      enabled: sound.enabled,
      paused: sound.paused,
      context: sound.context.state,
      mediaPaused: sound.music.element.paused,
      mediaReadyState: sound.music.element.readyState,
      mediaTime: sound.music.element.currentTime,
      contextTime: sound.context.currentTime,
      backgroundScheduled: sound.backgroundTimer !== null,
      muteControl: Boolean(document.querySelector('button[aria-label="Mute sound"]')),
      failedMessage: document.body.textContent.includes('Audio could not start.'),
      events: structuredClone(window.audioPauseEvents),
    }
  })
  report.checkpoints.push({ label, ...value })
  return value
}

async function playing() {
  await page.waitForFunction(() => {
    const s = window.testAudio
    return s.enabled && !s.paused && s.context.state === 'running' &&
      !s.music.element.paused && s.music.element.readyState >= 2 && s.backgroundTimer !== null
  })
  await page.getByRole('button', { name: 'Mute sound', exact: true }).waitFor()
}

try {
  browser = await chromium.launch({ headless: true })
  report.browser = await browser.version()
  const opened = await openGame(browser)
  page = opened.page
  const errors = opened.errors, routeErrors = []
  page.setDefaultTimeout(30_000)
  await page.route(/\/original\/audio\/drone-\d+\.m4a(?:\?|$)/, async route => {
    heldRequests++
    await streamGate
    try { await route.continue() } catch (error) {
      if (!closing) routeErrors.push(String(error))
    }
  })
  await page.evaluate(() => {
    const main = document.querySelector('main')
    let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
    for (; fiber; fiber = fiber.return)
      for (let hook = fiber.memoizedState; hook; hook = hook.next)
        if (hook.memoizedState?.current?.buffers instanceof Map &&
            'randomState' in hook.memoizedState.current)
          window.testAudio = hook.memoizedState.current
    if (!window.testAudio) throw new Error('Actual React-owned Soundscape not found')
    window.audioPauseEvents = []
    window.audioPauseUnhandled = []
    addEventListener('unhandledrejection', event => window.audioPauseUnhandled.push(String(event.reason)))
    // Observe the native media promise; return it unchanged to the application.
    const original = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function (...args) {
      const result = Reflect.apply(original, this, args)
      if (this.src.includes('/drone-')) {
        const event = { state: 'pending', readyState: this.readyState }
        window.audioPauseEvents.push(event)
        result.then(() => { event.state = 'fulfilled' }, error => {
          event.state = 'rejected'
          event.error = error.name
        })
      }
      return result
    }
  })

  await page.getByRole('button', { name: 'Enable sound', exact: true }).click()
  await page.waitForFunction(() => window.testAudio.enabled &&
    window.audioPauseEvents.some(event => event.state === 'pending'))
  assert.ok(heldRequests > 0, 'The real streamed drone request must still be held')
  const pending = await state('real-music-play-pending')
  assert.equal(pending.mediaReadyState, 0)
  assert.equal(pending.backgroundScheduled, false)

  await page.getByRole('button', { name: 'Pause game', exact: true }).click()
  await page.waitForFunction(() => window.testAudio.context.state === 'suspended' &&
    window.testAudio.music.element.paused &&
    window.audioPauseEvents.some(event => event.state === 'rejected'))
  await page.getByRole('button', { name: 'Mute sound', exact: true }).waitFor()
  const paused = await state('pause-cancelled-native-play-without-disabling-sound')
  assert.equal(paused.enabled, true)
  assert.equal(paused.paused, true)
  assert.equal(paused.backgroundScheduled, false)
  assert.equal(paused.failedMessage, false)
  assert.ok(paused.events.some(event => event.error === 'AbortError'))

  releaseStream()
  await page.getByRole('button', { name: 'Resume game', exact: true }).click()
  await playing()
  const resumed = await state('resume-after-network-release')
  assert.equal(resumed.failedMessage, false)
  await page.evaluate(() => {
    const s = window.testAudio
    window.musicProbe = s.context.createAnalyser()
    window.mixProbe = s.context.createAnalyser()
    s.music.media.connect(window.musicProbe)
    s.master.connect(window.mixProbe)
  })
  const peaks = { music: 0, mix: 0 }
  for (let i = 0; i < 24; i++) {
    await page.waitForTimeout(200)
    const values = await page.evaluate(() => [window.musicProbe, window.mixProbe].map(probe => {
      const data = new Float32Array(probe.fftSize)
      probe.getFloatTimeDomainData(data)
      return Math.max(...data.map(Math.abs))
    }))
    peaks.music = Math.max(peaks.music, values[0])
    peaks.mix = Math.max(peaks.mix, values[1])
    if (peaks.music > 0.001 && peaks.mix > 0.001) break
  }
  assert.ok(peaks.music > 0.001 && peaks.mix > 0.001, JSON.stringify(peaks))
  report.signalPeaks = peaks
  const audible = await state('real-stream-and-output-resumed')
  assert.ok(audible.mediaTime > resumed.mediaTime)

  // Repeat ordinary controls after warmup; no direct setPaused or model mutation.
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'Pause game', exact: true }).click()
    await page.getByRole('button', { name: 'Resume game', exact: true }).click()
  }
  await playing()
  const latest = await state('latest-ui-resume-remains-playing')
  assert.equal(latest.enabled, true)
  assert.equal(latest.failedMessage, false)

  await page.getByRole('button', { name: 'Pause game', exact: true }).click()
  await page.waitForFunction(() => window.testAudio.context.state === 'suspended')
  const stopped = await state('stable-pause')
  await page.waitForTimeout(250)
  const still = await state('stable-pause-after-wait')
  assert.equal(still.mediaTime, stopped.mediaTime)
  assert.equal(still.contextTime, stopped.contextTime)
  assert.equal(still.backgroundScheduled, false)
  await page.getByRole('button', { name: 'Resume game', exact: true }).click()
  await playing()

  await page.getByRole('button', { name: 'Mute sound', exact: true }).click()
  await page.waitForFunction(() => !window.testAudio.enabled && window.testAudio.context.state === 'suspended')
  const muted = await state('mute')
  assert.equal(muted.mediaPaused, true)
  assert.equal(muted.backgroundScheduled, false)
  await page.getByRole('button', { name: 'Enable sound', exact: true }).click()
  await playing()
  const reenabled = await state('reenable')
  assert.equal(reenabled.failedMessage, false)
  await page.getByRole('button', { name: 'Game settings', exact: true }).click()
  await page.waitForFunction(() => window.testAudio.context.state === 'suspended')
  await page.getByRole('slider', { name: 'Music volume', exact: true }).fill('0.5')
  assert.equal(await page.evaluate(() => window.testAudio.musicVolume), 0.5)
  await page.getByRole('button', { name: 'Close menu', exact: true }).click()
  await playing()
  await state('settings-close-restores-playback')

  assert.deepEqual(await page.evaluate(() => window.audioPauseUnhandled), [])
  assert.deepEqual(routeErrors, [])
  assert.deepEqual(errors, [])
  report.heldStreamRequests = heldRequests
  report.pageErrors = errors
  report.scope = 'Normal UI lifecycle and real WebAudio/stream signal, not human listening or native-engine audio parity.'
  report.status = 'passed'
  console.log('PASS: native pending-play AbortError stays superseded; real music resumes through normal UI without disabling sound', JSON.stringify({ peaks, heldRequests }))
} catch (error) {
  report.status = 'failed'
  report.error = error.stack ?? String(error)
  if (page && !page.isClosed()) {
    try { await state('failure') } catch { /* Original failure remains authoritative. */ }
    await page.screenshot({ path: join(output, 'audio-pause-failure.png') }).catch(() => {})
  }
  throw error
} finally {
  closing = true
  releaseStream()
  await browser?.close()
  writeFileSync(join(output, 'audio-pause.json'), JSON.stringify(report, null, 2) + '\n')
}
