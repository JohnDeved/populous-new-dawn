import test from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'
import { createGameStore } from '../app/game-store.ts'
import { pageNode, pageSource, evaluatePage } from './support/follower-nearby-page.mjs'

// Actual Home handlers and real in-memory store; React remount, scene failure,
// IndexedDB persistence and physical Retry input require the browser scenario.
const names = ['beginLoad', 'loadCheckpoint', 'retryLoad']
const declarations = names.map(name => pageNode(node =>
  ts.isFunctionDeclaration(node) && node.name?.text === name).getText(pageSource)).join('\n')
const loading = pageNode(node => ts.isJsxSelfClosingElement(node) &&
  node.tagName.getText(pageSource) === 'OriginalLoadingScreen')

test('each Home Retry restores the retained checkpoint, not the mutated failed world', async () => {
  const store = createGameStore(), original = store.getWorld()
  original.shots.blast = 17
  original.turn = 217
  original.time = 217 / 12
  await store.saveCheckpoint(false)
  assert.equal(store.hasCheckpoint(), true, 'in-memory checkpoint exists even without browser storage')
  const loadRequest = { current: null }, state = { resultInputCycles: 12, debugPicker: true, cheatsOpen: true, ready: true, error: '', startup: 'choice' }
  const bindings = {
    store, loadRequest, OriginalLoadingScreen: 'OriginalLoadingScreen',
    menuSession: { current: null }, pendingMenuCamera: { current: [] },
    engine: { current: null }, audio: { current: null }, cancelNearbyInput() {},
    setResultInputCycles(value) { state.resultInputCycles = value },
    setDebugPicker(value) { state.debugPicker = value },
    setCheatsOpen(value) { state.cheatsOpen = value },
    setSelectorOpen() {}, setMenu() {}, setTab() {},
    setReady(value) { state.ready = value }, setError(value) { state.error = value },
    setStartup(value) { state.startup = value },
  }
  const handlers = evaluatePage(`function(){${declarations};return {${names.join(',')}}}`, bindings)()
  handlers.loadCheckpoint()
  assert.equal(state.cheatsOpen, false)
  const expected = structuredClone(store.getWorld()), worlds = [original, store.getWorld()]
  assert.equal(expected.shots.blast, 17)
  assert.equal(expected.turn, 217)
  assert.equal(expected.paused, false)
  const request = loadRequest.current
  assert.deepEqual(request, { kind: 'checkpoint' })
  for (let failure = 1; failure <= 2; failure++) {
    const failed = store.getWorld()
    failed.shots.blast = failure
    failed.turn += 100 * failure
    failed.time = failed.turn / 12
    failed.units[0].hp = 1
    state.cheatsOpen = true
    state.error = `Synthetic terrain failure ${failure}`
    const screen = evaluatePage(loading.getText(pageSource), {
      ...bindings, ...handlers, ...state, pendingLoadingPhase: 'loading',
    })
    assert.equal(screen.props.phase, 'failed')
    screen.props.onRetry()
    const restored = store.getWorld()
    assert.ok(!worlds.includes(restored), 'Retry creates a fresh checkpoint clone')
    worlds.push(restored)
    assert.deepEqual(restored, expected, 'all checkpoint fields survive both failed-world mutations')
    assert.equal(failed.shots.blast, failure, 'replacement does not mutate the discarded world')
    assert.equal(loadRequest.current, request, 'the saved request remains owned by Home')
    assert.deepEqual(state, { resultInputCycles: 0, debugPicker: false, cheatsOpen: false, ready: false, error: '', startup: 'playing' })
  }
})
