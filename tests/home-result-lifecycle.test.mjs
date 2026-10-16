import test from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'
import { createGameStore } from '../app/game-store.ts'
import { pageNode, pageSource, evaluatePage } from './support/follower-nearby-page.mjs'

// Execute Home's actual JSX/handlers with the real store. This does not mount
// React, render a scene, or establish naturally earned mission outcomes.
const result = pageNode(node => ts.isJsxSelfClosingElement(node) && node.tagName.getText(pageSource) === 'OriginalResultScreen')
const resultGate = result.parent.parent
assert.ok(ts.isBinaryExpression(resultGate), 'actual Home result visibility condition')
const selector = pageNode(node => ts.isJsxSelfClosingElement(node) && node.tagName.getText(pageSource) === 'WorldSelector')
const selectorDialog = selector.parent
const handlers = ['beginLoad', 'restart', 'continueCampaign', 'openSelector'].map(name =>
  pageNode(node => ts.isFunctionDeclaration(node) && node.name?.text === name).getText(pageSource)).join('\n')

function fixture() {
  const store = createGameStore(), world = store.getWorld()
  world.status = 'lost'
  world.paused = true
  world.outcome.cameraPlaying = false
  const state = { menu: false, selectorOpen: false, ready: true, error: 'old error', tab: 'buildings', startup: 'playing' }
  let menuOpened = 0, audioResets = 0
  const bindings = {
    store, world, nextMission: 2, OriginalResultScreen: 'OriginalResultScreen', WorldSelector: 'WorldSelector',
    engine: { current: { nearbyFollowersHudActive: true } }, cancelNearbyInput() {},
    menuSession: { current: { world, paused: false } }, pendingMenuCamera: { current: [() => assert.fail('stale camera action')] },
    audio: { current: { reset() { audioResets++ } } }, loadRequest: { current: null },
    openMenu() { menuOpened++ },
    missionNumbers: [1, 2], completedMissions: [], startMission() {}, tutorialLevel: 79, loadCheckpoint() {},
    setStartupCampaign() {}, startupDialog: {}, worldSelectorStyles: { dialog: 'dialog' },
    ...Object.fromEntries(Object.keys(state).map(key => [`set${key[0].toUpperCase()}${key.slice(1)}`, value => { state[key] = value }])),
  }
  const functions = evaluatePage(`function(){${handlers};return {beginLoad,restart,continueCampaign,openSelector}}`, bindings)()
  const render = node => evaluatePage(node.getText(pageSource), { ...bindings, ...functions, ...state })
  return { world, store, state, bindings, render, result: () => render(resultGate),
    selector: () => render(selector), dialog: () => render(selectorDialog),
    counts: () => ({ menuOpened, audioResets }) }
}

test('Home gates the lost result on camera completion and wires Restart rather than Continue', () => {
  const ui = fixture()
  ui.world.outcome.cameraPlaying = true
  assert.equal(ui.result(), false)
  ui.world.outcome.cameraPlaying = false
  const rendered = ui.result()
  assert.equal(rendered.props.status, 'lost')
  assert.equal(rendered.props.level, ui.world.outcome.level)
  assert.equal(rendered.props.primaryLabel, 'Restart Level')
  ui.world.status = 'playing'
  assert.equal(ui.result(), false)
})

test('Home returns from result selection by Back and cancel without replacing the lost world or opening pause menu', () => {
  const ui = fixture()
  for (const route of ['back', 'cancel']) {
    ui.result().props.onSelectLevel()
    assert.equal(ui.state.selectorOpen, true)
    if (route === 'back') ui.selector().props.onBack()
    else {
      let prevented = false
      ui.dialog().props.onCancel({ preventDefault() { prevented = true } })
      assert.equal(prevented, true)
    }
    assert.equal(ui.state.selectorOpen, false)
    assert.equal(ui.store.getWorld(), ui.world)
    assert.equal(ui.world.paused, true)
    assert.equal(ui.result().props.status, 'lost')
    assert.equal(ui.counts().menuOpened, 0)
  }
})

test('Home result Restart replaces the paused terminal world and clears stale menu ownership', () => {
  const ui = fixture()
  ui.result().props.onPrimary()
  const next = ui.store.getWorld()
  assert.notEqual(next, ui.world)
  assert.equal(next.outcome.level, ui.world.outcome.level)
  assert.equal(next.status, 'playing')
  assert.equal(next.paused, false)
  assert.equal(ui.world.status, 'lost')
  assert.equal(ui.world.paused, true)
  assert.equal(ui.bindings.menuSession.current, null)
  assert.deepEqual(ui.bindings.pendingMenuCamera.current, [])
  assert.deepEqual(ui.bindings.loadRequest.current, { kind: 'restart' })
  assert.deepEqual(ui.state, { menu: false, selectorOpen: false, ready: false, error: '', tab: 'spells', startup: 'playing' })
  assert.equal(ui.counts().audioResets, 1)
})
