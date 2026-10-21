import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { createWorld } from '../app/world-initialization.ts'
import { missionNumbers, tutorialLevel } from '../app/mission-data.ts'
import * as campaign from '../app/world-selector-data.ts'
import * as selectorArtwork from '../app/world-selector-art.ts'
import { withStorage } from './support/profile-storage.mjs'
import { evaluatePage, pageEffect, pageNode, pageSource } from './support/follower-nearby-page.mjs'

// Actual Home effect, selector props/component and launch handlers. IndexedDB,
// React hooks and child artwork are synthetic; this is not browser persistence,
// focus/rendering evidence or naturally earned campaign progression.
const selectorSource = ts.createSourceFile('world-selector.tsx',
  readFileSync(new URL('../app/world-selector.tsx', import.meta.url), 'utf8'),
  ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
const selectorFunction = selectorSource.statements.find(node =>
  ts.isFunctionDeclaration(node) && node.name?.text === 'WorldSelector')
assert.ok(selectorFunction, 'actual selector component exists')
const renderSelector = evaluatePage(selectorFunction.getText(selectorSource).replace(/^export /, ''), {
  ...campaign, ...selectorArtwork, useRef: current => ({ current }), useId: () => 'selector-profile',
  useLayoutEffect() {},
  useState: initial => [typeof initial === 'function' ? initial() : initial,
    () => assert.fail('this route must launch the restored recommendation without changing selection')],
  styles: new Proxy({}, { get: (_, name) => name }),
  WorldSelectorScene: 'WorldSelectorScene', SelectorTitle: 'SelectorTitle', SelectorTooltip: 'SelectorTooltip',
})
const homeSelector = pageNode(node => ts.isJsxSelfClosingElement(node) &&
  node.tagName.getText(pageSource) === 'WorldSelector')
const completedSource = pageNode(node => ts.isVariableDeclaration(node) &&
  node.name.getText(pageSource) === 'completedMissions').initializer.getText(pageSource)
const launchSource = ['beginLoad', 'startMission'].map(name =>
  pageNode(node => ts.isFunctionDeclaration(node) && node.name?.text === name).getText(pageSource)
).join('\n')
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return []
  if (Array.isArray(tree)) return tree.flatMap(nodes)
  return [tree, ...(tree.children ?? []).flatMap(nodes)]
}
function button(tree, name) {
  const found = nodes(tree).filter(node => node.type === 'button' && node.props['aria-label'] === name)
  assert.equal(found.length, 1, `one public selector control: ${name}`)
  return found[0]
}

test('fresh Home restores independent progress and selector Start launches Mission 3 instead of the older checkpoint', async () => {
  const saved = createWorld(1, 'scalable')
  saved.turn = 217
  saved.time = 217 / 12
  saved.randomState = 0x12345678
  await withStorage({ profile: { version: 1, completed: [1, 2] }, latest: { version: 3, world: saved } },
    async ({ freshStore, records, writes, drain }) => {
      const store = await freshStore(), initialWorld = store.getWorld(), before = structuredClone(records)
      const states = [], presentation = {}, loadRequest = { current: null }
      const cleanup = pageEffect('store.restoreCheckpoint()', {
        frontendPreparation: { current: null }, prepareFrontendAssets: async () => ({}), setFrontendAssets() {},
        store, readAudioPreferences: () => ({ volume: 1, musicVolume: 1 }),
        readGamePreferences: () => ({}), setAudioPreferences: () => {}, audio: { current: null },
        gamePreferencesRef: { current: null }, setGamePreferences: () => {},
        setStartup: state => states.push(state),
      })()
      try {
        await drain()
        assert.deepEqual(states, ['choice'], 'restore reaches startup choice without launching')
        assert.equal(store.getWorld(), initialWorld)
        assert.equal(initialWorld.turn, 0)
        assert.deepEqual(store.getCompletedMissions(), [1, 2])
        assert.equal(store.hasCheckpoint(), true)
        const startMission = evaluatePage(`function(){${launchSource}; return startMission}`, {
          store, loadRequest, menuSession: { current: null }, pendingMenuCamera: { current: [] },
          engine: { current: null }, audio: { current: null }, cancelNearbyInput: () => {},
          setStartup: state => states.push(state),
          ...Object.fromEntries(['ResultInputCycles', 'CheatsOpen', 'DebugPicker', 'SelectorOpen', 'Menu', 'Ready', 'Error', 'Tab'].map(name =>
            [`set${name}`, value => { presentation[name] = value }])),
        })()
        const element = evaluatePage(homeSelector.getText(pageSource), {
          WorldSelector: 'WorldSelector', missionNumbers, tutorialLevel, store,
          completedMissions: evaluatePage(completedSource, { store }), selectorOpen: false,
          startMission, world: initialWorld, closeSelector: () => assert.fail('startup Back must not invoke result selection'),
          loadCheckpoint: () => assert.fail('Start must not invoke the selector Load route'),
          setSelectorOpen: () => assert.fail('Start must use Home beginLoad'),
          openMenu: () => assert.fail('Start must not return to the pause menu'),
          setStartupCampaign: () => assert.fail('Start must not return to startup selection'),
        })
        assert.deepEqual(element.props.completed, [1, 2])
        assert.equal(element.props.hasCheckpoint, true)
        const tree = renderSelector(element.props)
        button(tree, 'Panel Mission 1, completed')
        button(tree, 'Panel Mission 2, completed')
        assert.equal(button(tree, 'Panel Mission 3').props['aria-pressed'], true)
        const launch = button(tree, 'Start Mission 3')
        assert.equal(launch.props.disabled, false)
        assert.deepEqual(records, before)
        assert.deepEqual(writes, [], 'restoring and presenting the selector never writes storage')
        launch.props.onClick()
        const launched = store.getWorld()
        assert.notEqual(launched, initialWorld)
        assert.equal(launched.outcome.level, 3)
        assert.equal(launched.turn, 0, 'Start creates the selected mission, not saved turn 217')
        assert.deepEqual(loadRequest.current, { kind: 'mission', mission: 3 })
        assert.deepEqual(states, ['choice', 'playing'])
        assert.deepEqual(presentation, { ResultInputCycles: 0, CheatsOpen: false, DebugPicker: false, SelectorOpen: false, Menu: false, Ready: false, Error: '', Tab: 'spells' })
        await drain()
        assert.deepEqual(records, before, 'launch preserves both the older checkpoint and profile')
        assert.deepEqual(writes, [])
        const nextSession = await freshStore()
        assert.equal(await nextSession.restoreCheckpoint(), true)
        assert.deepEqual(nextSession.getCompletedMissions(), [1, 2])
        assert.equal(nextSession.getWorld().turn, 0, 'another fresh store does not auto-load the checkpoint')
        assert.deepEqual(records, before)
        assert.deepEqual(writes, [])
      } finally { cleanup() }
    })
})
