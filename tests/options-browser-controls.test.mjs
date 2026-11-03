import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import optionsBrowserControls, { assertFrozen, captureOptions } from '../scripts/local-render/options-browser-controls.mjs'
import { createAudioOptionsBudget } from '../scripts/browser-options-audio.mjs'

test('frozen observation rejects running state and observed simulation/camera/clock drift', () => {
  const before = { paused: true, turn: 12, pendingTime: 0.02, frame: 1, time: 2, camera: [3, 4, 5] }
  assertFrozen(before, structuredClone(before))
  for (const change of [{ paused: false }, { turn: 13 }, { pendingTime: 0.03 }, { frame: 2 }, { time: 3 }, { camera: [4, 4, 5] }])
    assert.throws(() => assertFrozen(before, { ...before, ...change }))
  assert.throws(() => assertFrozen({ paused: false }, { paused: false }))
})
test('capture refuses ninth PNG and unsafe filename before browser action', async () => {
  let calls = 0
  const page = { screenshot: async () => { calls++ } }, budget = createAudioOptionsBudget()
  await assert.rejects(captureOptions(page, '/tmp', 'ninth.png', budget, Array(8).fill('x')))
  await assert.rejects(captureOptions(page, '/tmp', '../outside.png', budget, []))
  assert.equal(calls, 0)
})
test('capture records only completed screenshots and rejects late abort', async () => {
  const names = [], abort = new AbortController()
  const evaluate = async () => ({ innerWidth: 1280, innerHeight: 960, devicePixelRatio: 1, fullscreen: false })
  await captureOptions({ evaluate, screenshot: async () => {} }, '/tmp', 'one.png', createAudioOptionsBudget(), names)
  assert.deepEqual(names, ['one.png'])
  await assert.rejects(captureOptions({ evaluate, screenshot: async () => { abort.abort() } }, '/tmp', 'two.png', createAudioOptionsBudget({ signal: abort.signal }), names))
  assert.deepEqual(names, ['one.png'])
})
test('capture retains observed dimensions and rejects geometry drift', async () => {
  const metrics = { innerWidth: 1920, innerHeight: 1080, devicePixelRatio: 2, fullscreen: true }, names = [], metadata = []
  await captureOptions({ evaluate: async () => metrics, screenshot: async () => {} }, '/tmp', 'full.png', createAudioOptionsBudget(), names, metadata)
  assert.deepEqual(metadata, [{ name: 'full.png', ...metrics }])
  let count = 0
  await assert.rejects(captureOptions({ evaluate: async () => ({ ...metrics, innerWidth: count++ }), screenshot: async () => {} }, '/tmp', 'drift.png', createAudioOptionsBudget(), names, metadata))
  assert.deepEqual(names, ['full.png'])
})
test('episode retains falsy primary failures as failed evidence', async () => {
  for (const thrown of [null, false, undefined]) {
    const output = mkdtempSync(join(tmpdir(), 'options-episode-test-'))
    let rejected = false
    try {
      await optionsBrowserControls({ page: { locator() { throw thrown } }, output,
        deadlineAt: Date.now() + 1000, signal: new AbortController().signal, revision: 'b'.repeat(40) })
    } catch (error) { rejected = true; assert.equal(error, thrown) }
    assert.equal(rejected, true)
    assert.equal(JSON.parse(readFileSync(join(output, 'options-controls-episode.json'))).status, 'failed')
  }
})
