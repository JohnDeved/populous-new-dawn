import test from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'
import { createGameStore } from '../app/game-store.ts'
import { createResultSession } from '../app/result-session.ts'
import { pageNode, pageSource, evaluatePage } from './support/follower-nearby-page.mjs'

// Execute Home's actual JSX/handlers with the real store/session. This does not
// mount React, render a scene, or establish naturally earned mission outcomes.
const result = pageNode(node => ts.isJsxSelfClosingElement(node) && node.tagName.getText(pageSource) === 'OriginalResultScreen')
const resultGate = result.parent.parent
assert.ok(ts.isBinaryExpression(resultGate), 'actual Home result visibility condition')
const selector = pageNode(node => ts.isJsxSelfClosingElement(node) && node.tagName.getText(pageSource) === 'WorldSelector')
const selectorDialog = selector.parent
const names = ['beginLoad', 'restart', 'startMission', 'openSelector', 'closeSelector']
const handlers = names.map(name => pageNode(node => ts.isFunctionDeclaration(node) && node.name?.text === name).getText(pageSource)).join('\n')

function fixture() {
  const store = createGameStore(), world = store.getWorld(), resultSession = createResultSession()
  world.status = 'lost'
  world.paused = true
  world.outcome.cameraPlaying = false
  const state = { resultInputCycles: 12, cheatsOpen: true, debugPicker: true, menu: false, selectorOpen: false, ready: true, error: 'old error', tab: 'buildings', startup: 'playing' }
  let menuOpened = 0, audioResets = 0
  const bindings = {
    store, world, resultSession, update: store.update,
    OriginalResultScreen: 'OriginalResultScreen', WorldSelector: 'WorldSelector',
    engine: { current: { nearbyFollowersHudActive: true, resultClock: { inputCycles: 12 }, setModalSuspended() {} } }, cancelNearbyInput() {},
    menuSession: { current: { world, paused: false } },
    audio: { current: { reset() { audioResets++ } } }, loadRequest: { current: null },
    openMenu() { menuOpened++ },
    missionNumbers: [1, 2], completedMissions: [], loadCheckpoint() {},
    setStartupCampaign() {}, startupDialog: {}, worldSelectorStyles: { dialog: 'dialog' },
    ...Object.fromEntries(Object.keys(state).map(key => [`set${key[0].toUpperCase()}${key.slice(1)}`, value => { state[key] = value }])),
  }
  const functions = evaluatePage(`function(){${handlers};return {${names.join(',')}}}`, bindings)()
  const render = node => evaluatePage(node.getText(pageSource), {
    ...bindings, ...functions, ...state,
    statisticsVisible: ['statistics', 'exit-pending', 'selector'].includes(resultSession.stage(store.getWorld())),
  })
  const enterSelection = () => {
    resultSession.openStatistics(world)
    const token = resultSession.beginExit(world)
    assert.ok(token)
    functions.openSelector()
    assert.equal(resultSession.finishExit(world, token, true), true)
  }
  return { world, store, state, bindings, functions, resultSession, enterSelection,
    result: () => render(resultGate), selector: () => render(selector), dialog: () => render(selectorDialog),
    counts: () => ({ menuOpened, audioResets }) }
}

test('Home shows terminal overlay independently of camera completion and never exposes result action buttons', () => {
  const ui = fixture()
  for (const cameraPlaying of [true, false]) {
    ui.world.outcome.cameraPlaying = cameraPlaying
    const rendered = ui.result()
    assert.equal(rendered.props.status, 'lost')
    assert.equal(rendered.props.level, ui.world.outcome.level)
    assert.equal(rendered.props.stage, 'terminal-overlay')
    assert.equal(rendered.props.inputCycles, 12)
    for (const removed of ['primaryLabel', 'onPrimary', 'onSelectLevel']) assert.equal(rendered.props[removed], undefined)
  }
  ui.resultSession.openStatistics(ui.world)
  assert.equal(ui.result().props.stage, 'statistics')
  ui.world.status = 'playing'
  assert.equal(ui.result(), false)
})

test('Home returns from result selection by Back and cancel to the same paused statistics without a pause menu', () => {
  const ui = fixture()
  for (const route of ['back', 'cancel']) {
    ui.enterSelection()
    assert.equal(ui.state.selectorOpen, true)
    assert.equal(ui.result(), false)
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
    assert.equal(ui.result().props.stage, 'statistics')
    assert.equal(ui.counts().menuOpened, 0)
  }
})

for (const route of ['restart', 'selector replay']) test(`Home ${route} replaces the terminal world and clears stale menu ownership`, () => {
  const ui = fixture()
  if (route === 'restart') ui.functions.restart()
  else { ui.enterSelection(); ui.selector().props.onStart(1) }
  const next = ui.store.getWorld()
  assert.notEqual(next, ui.world)
  assert.equal(next.outcome.level, ui.world.outcome.level)
  assert.equal(next.status, 'playing')
  assert.equal(next.paused, false)
  assert.equal(ui.world.status, 'lost')
  assert.equal(ui.world.paused, true)
  assert.equal(ui.bindings.menuSession.current, null)
  assert.deepEqual(ui.bindings.loadRequest.current, route === 'restart' ? { kind: 'restart' } : { kind: 'mission', mission: 1 })
  assert.deepEqual(ui.state, { resultInputCycles: 0, cheatsOpen: false, debugPicker: false, menu: false, selectorOpen: false, ready: false, error: '', tab: 'spells', startup: 'playing' })
  assert.equal(ui.counts().audioResets, 1)
})
