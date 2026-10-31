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
  const loadRequest = { current: null }, state = { cheatsOpen: true, ready: true, error: '', startup: 'choice' }
  const bindings = {
    store, loadRequest, OriginalLoadingScreen: 'OriginalLoadingScreen',
    menuSession: { current: null }, pendingMenuCamera: { current: [] },
    engine: { current: null }, audio: { current: null }, cancelNearbyInput() {},
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
    assert.deepEqual(state, { cheatsOpen: false, ready: false, error: '', startup: 'playing' })
  }
})

// Retained callbacks model a delayed caller at Home's handler boundary, not a
// browser event delivered to an unmounted loading screen. This guards request
// ownership independently of DOM cancellation and scene-resource disposal.
function recoveryFixture() {
  const store = createGameStore(), loadRequest = { current: null }, state = {}, calls = []
  const bindings = {
    store, loadRequest, OriginalLoadingScreen: 'OriginalLoadingScreen',
    menuSession: { current: null }, pendingMenuCamera: { current: [] },
    engine: { current: null }, audio: { current: { reset() { calls.push('audio reset') } } },
    cancelNearbyInput() { calls.push('cancel nearby') },
    ...Object.fromEntries(['CheatsOpen', 'SelectorOpen', 'Menu', 'Tab', 'Ready', 'Error', 'Startup', 'StartupCampaign']
      .map(name => [`set${name}`, value => { state[name] = value; calls.push(name) }])),
  }
  const ownerNames = ['beginLoad', 'retryLoad', 'exitTutorial', 'quitLevel']
  const bodies = ownerNames.map(name => pageNode(node =>
    ts.isFunctionDeclaration(node) && node.name?.text === name).getText(pageSource)).join('\n')
  const handlers = evaluatePage(`function(){${bodies};return {${ownerNames.join(',')}}}`, bindings)()
  const retry = () => evaluatePage(loading.getText(pageSource), {
    ...bindings, ...handlers, startup: 'playing', ready: false, error: 'Supplied load failure', pendingLoadingPhase: 'loading',
  }).props.onRetry
  return { store, loadRequest, state, calls, ...handlers, retry }
}

for (const [quit, campaign] of [['exitTutorial', false], ['quitLevel', true]]) {
  test(`Home ${quit} retires the request before a retained Retry callback can act`, () => {
    const ui = recoveryFixture()
    ui.beginLoad({ kind: 'mission', mission: 2 })
    const retry = ui.retry(), world = ui.store.getWorld()
    ui[quit]()
    assert.equal(ui.loadRequest.current, null)
    assert.equal(ui.state.Startup, 'choice')
    assert.equal(ui.state.StartupCampaign, campaign)
    const state = structuredClone(ui.state), calls = [...ui.calls], savedWorld = structuredClone(world)
    retry(); retry()
    assert.equal(ui.store.getWorld(), world, 'retired request cannot replace the world')
    assert.deepEqual(world, savedWorld, 'retired request cannot mutate the preserved world')
    assert.deepEqual(ui.state, state, 'no loading/navigation state is republished')
    assert.deepEqual(ui.calls, calls, 'no audio, input or setter side effects occur')
  })
}

test('Home Retry reads the newest request instead of retaining an older mission', () => {
  const ui = recoveryFixture(), firstRequest = { kind: 'mission', mission: 1 }
  ui.beginLoad(firstRequest)
  const retry = ui.retry(), firstWorld = ui.store.getWorld(), nextRequest = { kind: 'mission', mission: 2 }
  ui.beginLoad(nextRequest)
  const nextWorld = ui.store.getWorld(), expected = structuredClone(nextWorld)
  nextWorld.shots.blast = 99
  retry()
  assert.equal(ui.loadRequest.current, nextRequest)
  assert.equal(ui.store.getWorld().outcome.level, 2)
  assert.notEqual(ui.store.getWorld(), firstWorld)
  assert.notEqual(ui.store.getWorld(), nextWorld)
  assert.deepEqual(ui.store.getWorld(), expected, 'Retry reconstructs the currently requested mission')
  assert.equal(firstWorld.outcome.level, 1)
  assert.equal(nextWorld.shots.blast, 99, 'discarded failed-world state is not overwritten')
})
