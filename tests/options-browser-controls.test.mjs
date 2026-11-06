import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import optionsBrowserControls, { assertFrozen, captureOptions, observeFullscreenDismissal, assertFullscreenDismissal } from '../scripts/local-render/options-browser-controls.mjs'
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

test('fullscreen dismissal rejects lost owners, stale focus, visible portals and session drift', () => {
  const valid = { sameWorldScene: true, ownedCanvas: true, fullscreen: 'document', openDialogs: 0,
    visibleHosts: 0, connectedFocus: true, focusOwner: 'canvas' }
  assertFullscreenDismissal(valid, true)
  assertFullscreenDismissal({ ...valid, focusOwner: 'menu' }, true)
  assertFullscreenDismissal({ ...valid, fullscreen: 'none' }, false)
  for (const change of [{ sameWorldScene: false }, { ownedCanvas: false }, { fullscreen: 'none' }, { fullscreen: 'other' },
    { openDialogs: 1 }, { visibleHosts: 1 }, { connectedFocus: false }, { focusOwner: 'other' }, { focusOwner: undefined }])
    assert.throws(() => assertFullscreenDismissal({ ...valid, ...change }, true))
  assert.throws(() => assertFullscreenDismissal({ ...valid, fullscreen: 'other' }, false))
})

test('dismissal observation reads exact World, Scene, canvas and trigger identities without writing them', () => {
  const previous = ['document', 'window'].map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)])
  const canvas = Object.freeze({ isConnected: true }), menu = Object.freeze({ isConnected: true })
  const world = Object.freeze({ paused: true })
  const scene = Object.freeze({ world, renderer: Object.freeze({ domElement: canvas }) })
  let currentWorld = world, currentScene = scene, currentCanvas = canvas, focused = menu, hosts = [], dialogs = []
  const html = {}
  let fullscreenElement = html
  const document = Object.freeze({ documentElement: html,
    get fullscreenElement() { return fullscreenElement },
    get activeElement() { return focused },
    querySelector(selector) { assert.equal(selector, '.world-viewport canvas.battlefield'); return currentCanvas },
    querySelectorAll(selector) {
      assert.ok(['dialog[open]', '[data-fullscreen-control]'].includes(selector))
      return selector === 'dialog[open]' ? dialogs : hosts
    },
  })
  const window = Object.freeze({ testStore: Object.freeze({ getWorld: () => currentWorld }),
    testSceneRef: Object.freeze({ get current() { return currentScene } }) })
  try {
    for (const [name, value] of Object.entries({ document, window }))
      Object.defineProperty(globalThis, name, { configurable: true, value })
    const owner = { world, scene, menu }
    assertFullscreenDismissal(observeFullscreenDismissal(owner), true)
    fullscreenElement = canvas
    assert.equal(observeFullscreenDismissal(owner).fullscreen, 'other')
    assert.throws(() => assertFullscreenDismissal(observeFullscreenDismissal(owner), false))
    assert.throws(() => assertFullscreenDismissal(observeFullscreenDismissal(owner), true))
    fullscreenElement = null
    assertFullscreenDismissal(observeFullscreenDismissal(owner), false)
    focused = canvas
    assert.equal(observeFullscreenDismissal(owner).focusOwner, 'canvas')
    focused = Object.freeze({ isConnected: true })
    assert.equal(observeFullscreenDismissal(owner).focusOwner, 'other')
    focused = Object.freeze({ isConnected: false })
    assert.equal(observeFullscreenDismissal(owner).connectedFocus, false)
    currentWorld = {}
    assert.equal(observeFullscreenDismissal(owner).sameWorldScene, false)
    currentWorld = world; currentScene = {}
    assert.equal(observeFullscreenDismissal(owner).sameWorldScene, false)
    currentScene = scene; currentCanvas = {}
    assert.equal(observeFullscreenDismissal(owner).ownedCanvas, false)
    hosts = [{}]; dialogs = [{}]
    assert.equal(observeFullscreenDismissal(owner).visibleHosts, 1)
    assert.equal(observeFullscreenDismissal(owner).openDialogs, 1)
  } finally {
    for (const [name, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor)
      else delete globalThis[name]
    }
  }
})
