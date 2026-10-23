import assert from 'node:assert/strict'
import { assertPauseGroup } from './pause-acceptance.mjs'
import { assertAudioGroup } from './audio-acceptance.mjs'

export const limits = Object.freeze({ buildMs: 120000, browserMs: 720000, jobMinutes: 20,
  maxContexts: 2, maxPages: 2, screenshots: 100, artifactBytes: 256 * 1024 * 1024,
  logBytes: 8 * 1024 * 1024, heapMiB: 768, cleanupMs: 5000 })
export const episodes = Object.freeze([
  { id: 'startup-logo', owner: 'candidate', path: 'scripts/local-render/startup-logo.mjs', capMs: 120000, primary: true, naturalLogo: true },
  { id: 'selector-recovery', owner: 'candidate', path: 'scripts/check-browser-world-scene.mjs', exportName: 'failureEpisode', capMs: 120000, primary: true },
  { id: 'options-storage', owner: 'infrastructure', path: 'scripts/native-ui-evidence/options-storage-notice-style.mjs', capMs: 90000 },
  { id: 'checkpoint-notice', owner: 'candidate', path: 'scripts/local-render/frontend-checkpoint-notice-style.mjs', capMs: 90000 },
  { id: 'options-audio-native', owner: 'infrastructure', path: 'scripts/native-ui-evidence/options-audio-native-style.mjs', capMs: 90000, primary: false, audioMode: 'native' },
  { id: 'options-audio-fallback', owner: 'infrastructure', path: 'scripts/native-ui-evidence/options-audio-fallback-style.mjs', capMs: 90000, primary: false, audioMode: 'fallback' },
  { id: 'loading-recovery', owner: 'candidate', path: 'scripts/local-render/loading-recovery-style.mjs', capMs: 90000, primary: true },
  { id: 'pause-checkpoint-native', owner: 'candidate', path: 'scripts/local-render/original-pause-checkpoint-native-style.mjs', capMs: 90000, primary: false, pauseMode: 'native' },
  { id: 'pause-checkpoint-fallback', owner: 'candidate', path: 'scripts/local-render/original-pause-checkpoint-fallback-style.mjs', capMs: 90000, primary: false, pauseMode: 'fallback' },
].map(Object.freeze))

export function acceptEpisode(result) {
  assert.ok(result && typeof result === 'object', 'Missing episode result')
  assert.notEqual(result.baseline, true, 'Baseline/missing UI is not acceptance')
  assert.notEqual(result.skipped, true, 'Skipped episode is not acceptance')
  if (Object.hasOwn(result, 'status')) assert.equal(result.status, 'passed', 'Episode did not pass')
}
export function acceptSeries(records) {
  assert.deepEqual(records.map(record => record.id), episodes.map(episode => episode.id), 'All nine ordered episodes required')
  for (const record of records) {
    assert.equal(record.status, 'passed')
    assert.equal(record.timedOut, false)
    assert.equal(record.cleanupVerified, true)
    acceptEpisode(record.result)
  }
  assertPauseGroup(records)
  assertAudioGroup(records)
}

// Closing owned browser resources cancels Playwright operations. Wait for their
// settlement before admitting another episode. The supervising process kills an
// uncooperative worker; timeout can never be overwritten by a late success.
export async function boundedEpisode(run, { capMs, close, signal, setTimer = setTimeout, clearTimer = clearTimeout, now = () => performance.now(), wallNow = Date.now }) {
  const controller = new AbortController()
  const startedAt = now(), deadlineAt = wallNow() + capMs
  let timedOut = false, timer, result, primaryError, cleanupError
  const abort = () => controller.abort(signal?.reason ?? new Error('Series aborted'))
  signal?.addEventListener('abort', abort, { once: true })
  if (signal?.aborted) abort()
  const work = Promise.resolve().then(() => { controller.signal.throwIfAborted(); return run(controller.signal, deadlineAt) })
  const expired = new Promise((_, reject) => {
    timer = setTimer(() => { timedOut = true; controller.abort(new Error('Episode deadline exceeded')); reject(controller.signal.reason) }, capMs)
    controller.signal.addEventListener('abort', () => reject(controller.signal.reason), { once: true })
  })
  try {
    result = await Promise.race([work, expired])
    if (now() - startedAt >= capMs) {
      timedOut = true; controller.abort(new Error('Episode deadline exceeded'))
    }
    controller.signal.throwIfAborted()
    assert.equal(timedOut, false)
    acceptEpisode(result)
  } catch (error) {
    primaryError = error instanceof Error ? error : new Error(String(error))
  } finally {
    clearTimer(timer)
    signal?.removeEventListener('abort', abort)
    // Keep the supervising worker watchdog active until this settles.
    try { await close() } catch (error) { cleanupError = error }
    await work.catch(() => {})
  }
  if (primaryError) {
    if (cleanupError) primaryError.cleanupError = String(cleanupError)
    throw primaryError
  }
  if (cleanupError) throw cleanupError
  return result
}
