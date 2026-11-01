import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createAudioOptionsBudget, waitForAudioObservation } from '../scripts/browser-options-audio.mjs'

// Execute only the newly authored first-enable block, never the Playwright probe.
const source = readFileSync(new URL('../scripts/check-browser-audio-pause.mjs', import.meta.url), 'utf8')
const start = '  const audioOptions = await openAudioOptions(page)'
const end = '  await page.waitForFunction(() => window.testAudio.enabled &&\n    window.audioPauseEvents.some'
assert.equal(source.split(start).length, 2)
assert.equal(source.split(end).length, 2)
const block = source.slice(source.indexOf(start), source.indexOf(end))
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
const run = new AsyncFunction('page', 'openAudioOptions', 'audioOptionsControl', 'waitForAudioObservation', 'closeAudioOptions', 'state', 'report', 'assert', block)
function fixture({ late = false, clickFailure, closeFailure, disposeFailure, hasClickFailure = false } = {}) {
  let now = 0, disposed = 0, closed = 0
  const calls = [], report = {}, cleanupErrors = []
  const budget = createAudioOptionsBudget({ timeout: 100, now: () => now, cleanupErrors })
  const tick = (name, options) => { calls.push({ name, timeout: options?.timeout }); now += 10 }
  const control = {
    async click(options) { tick('click', options); if (hasClickFailure) throw clickFailure },
    async getAttribute(name, options) { tick('attribute', options); return '♪ Sound on' },
  }
  const page = {
    async waitForFunction(fn, arg, options) {
      tick('observation', options)
      if (late) now = 101
      return { async dispose() { disposed++; if (disposeFailure) throw disposeFailure } }
    },
    getByRole() { return { async waitFor(options) { tick('control', options) } } },
  }
  const execute = () => run(page, async () => ({ budget }), () => control, waitForAudioObservation,
    async () => { closed++; if (closeFailure) throw closeFailure },
    async () => { tick('state'); return { mediaPaused: true, backgroundScheduled: false, events: [] } }, report, assert)
  return { execute, calls, report, cleanupErrors, get disposed() { return disposed }, get closed() { return closed } }
}
test('first-enable disposes its observation and uses one shrinking input budget', async () => {
  const f = fixture(); await f.execute()
  assert.equal(f.disposed, 1); assert.equal(f.closed, 1)
  assert.deepEqual(f.calls, [
    { name: 'click', timeout: 100 }, { name: 'observation', timeout: 90 },
    { name: 'control', timeout: 80 }, { name: 'attribute', timeout: 70 }, { name: 'state', timeout: undefined },
  ])
})
test('late observation cannot succeed and its returned handle is still disposed', async () => {
  const f = fixture({ late: true })
  await assert.rejects(f.execute(), /deadline expired/)
  assert.equal(f.disposed, 1); assert.equal(f.closed, 1)
  assert.deepEqual(f.calls.map(c => c.name), ['click', 'observation'])
})
test('late observation preserves deadline rejection over handle and menu cleanup failures', async () => {
  const f = fixture({ late: true, disposeFailure: new Error('dispose failed'), closeFailure: new Error('close failed') })
  await assert.rejects(f.execute(), /deadline expired/)
  assert.equal(f.disposed, 1); assert.equal(f.closed, 1)
  assert.equal(f.cleanupErrors.length, 1)
  assert.deepEqual(f.report.audioOptionsCleanupErrors, ['Error: close failed'])
})
test('falsey primary click rejection survives menu cleanup rejection', async () => {
  const f = fixture({ hasClickFailure: true, clickFailure: null, closeFailure: new Error('close failed') })
  let caught = false
  try { await f.execute() } catch (error) { caught = true; assert.equal(error, null) }
  assert.equal(caught, true); assert.equal(f.closed, 1); assert.equal(f.disposed, 0)
  assert.deepEqual(f.report.audioOptionsCleanupErrors, ['Error: close failed'])
})
test('cleanup rejection remains fatal when the primary operation succeeded', async () => {
  const error = new Error('close failed'), f = fixture({ closeFailure: error })
  await assert.rejects(f.execute(), actual => actual === error)
  assert.equal(f.disposed, 1); assert.equal(f.closed, 1)
})
