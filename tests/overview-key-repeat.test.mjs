import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { pageEffect } from './support/follower-nearby-page.mjs'
import { followerGroupShortcut } from '../app/follower-groups.ts'

// Execute the shipped Page listener and camera entry/exit functions. Scene
// preparation and completed-transition boundaries are supplied explicitly.
// This does not mount Home, dispatch trusted keys, or render a globe transition.
const camera = readFileSync(new URL('../app/scene-camera-runtime.ts', import.meta.url), 'utf8')
const sceneSource = readFileSync(new URL('../app/scene.ts', import.meta.url), 'utf8')
// pageEffect requires exactly one AST owner and evaluates its complete callback.
const declaration = name => {
  const matches = [...camera.matchAll(new RegExp('^export function ' + name + '\\([^]*?^}', 'gm'))]
  assert.equal(matches.length, 1, 'one actual camera function ' + name)
  return matches[0][0].replace(/^export /, '')
}
const cameraFunctions = stripTypeScriptTypes(declaration('overview') + '\n' + declaration('leaveOverview'))
const methods = ['overview', 'leaveOverview'].map(name => {
  const matches = [...sceneSource.matchAll(new RegExp('^  ' + name + '\\([^]*?^  }', 'gm'))]
  assert.equal(matches.length, 1, 'one actual Scene wrapper ' + name)
  return matches[0][0]
}).join('\n')
const wrapper = stripTypeScriptTypes('class BoundScene {\n' + methods + '\n}')
const noOp = () => {}

function fixture(overrides = {}) {
  const listeners = new Map(), starts = [], morphs = [], tabs = []
  let captures = 0, focuses = 0, prevented = 0, updates = 0
  const world = { inputMask: 0, mode: null, paused: false, units: [], selected: [],
    flyby: { flags: 0 }, outcome: { level: 1 }, status: 'playing' }
  const functions = new Function('beginGlobeMorph', cameraFunctions + '\nreturn { overview, leaveOverview }')(
    (state, entering) => { morphs.push(entering); state.active = true }
  )
  const BoundScene = new Function('overview', 'leaveOverview', wrapper + '\nreturn BoundScene')(
    functions.overview, functions.leaveOverview
  )
  const scene = Object.assign(new BoundScene(), {
    world, overviewActive: false, overviewStage: null,
    overviewReturn: { preset: 0, bearing: 0 }, viewPreset: 1, cameraBearing: 0.5,
    view: { center: { x: 100, y: 200 } }, cameraMotion: { active: 1 },
    globeMotion: { dragging: true, velocity: { x: 1, y: 1 }, position: {} },
    globeMorph: { active: false },
    captureCamera: () => captures++,
    startGroundView: (...args) => starts.push(args),
    focus: () => focuses++,
    skipIntroduction: noOp,
  })
  const bindings = {
    world, ready: true, menu: false, cheatsOpen: false, selectorOpen: false,
    messageDetails: { current: new Map() },
    SPELLS: [{ id: 'firestorm', key: '7' }], spellHudVisibility: () => 'visible', followerGroupShortcut,
    store: { getWorld: () => world, change: action => action(world) },
    window: { addEventListener: (name, fn) => {
      assert.equal(name, 'keydown'); assert.equal(listeners.size, 0); listeners.set(name, fn)
    }, removeEventListener: (name, fn) => {
      assert.equal(listeners.get(name), fn); listeners.delete(name)
    } },
    engine: { current: scene }, audio: { current: null },
    setTab: value => tabs.push(value), update: () => updates++,
    openMenu: noOp, cancelInteraction: noOp, guardShaman: noOp, select: noOp,
    HOME: {}, tutorialLevel: 79, rotateBuildingPlan: () => false,
    ...overrides,
  }
  const cleanup = pageEffect("window.addEventListener('keydown', key)", bindings)()
  return {
    scene, world, starts, morphs, tabs, listeners, cleanup,
    press(extra = {}, target = 'body') {
      listeners.get('keydown')({ key: 'Enter', code: 'Enter', repeat: false,
        ctrlKey: false, metaKey: false, altKey: false,
        target: { closest: selector => selector.split(',').includes(target) },
        preventDefault: () => prevented++, ...extra })
    },
    completeEntry() {
      assert.equal(scene.overviewStage, 'enter')
      scene.overviewActive = true
      scene.overviewStage = null
    },
    completeExit() {
      assert.equal(scene.overviewStage, 'exit')
      scene.overviewActive = false
      scene.overviewStage = null
      scene.globeMorph.active = false
    },
    counts: () => ({ captures, focuses, prevented, updates }),
  }
}

test('held Enter does not request exit after the entry transition completes', () => {
  const f = fixture()
  f.press()
  assert.equal(f.scene.overviewStage, 'enter')
  assert.deepEqual(f.starts, [[4, 0]])
  f.press({ repeat: true })
  assert.equal(f.scene.overviewStage, 'enter')
  f.completeEntry()
  for (let i = 0; i < 5; i++) f.press({ repeat: true })
  assert.equal(f.scene.overviewActive, true)
  assert.equal(f.scene.overviewStage, null)
  assert.deepEqual(f.morphs, [])
  assert.equal(f.counts().captures, 1)
  f.cleanup()
  assert.equal(f.listeners.size, 0)
})

test('fresh Enter still exits, while held repeats cannot re-enter after exit completes', () => {
  const f = fixture()
  f.press()
  f.completeEntry()
  f.press()
  assert.equal(f.scene.overviewStage, 'exit')
  assert.deepEqual(f.morphs, [false])
  f.completeExit()
  for (let i = 0; i < 5; i++) f.press({ repeat: true })
  assert.equal(f.scene.overviewActive, false)
  assert.equal(f.scene.overviewStage, null)
  assert.equal(f.starts.length, 1)
  f.press()
  assert.equal(f.scene.overviewStage, 'enter')
  assert.equal(f.starts.length, 2)
})

test('Numpad Enter has the same one-toggle-per-press behavior', () => {
  const f = fixture()
  f.press({ code: 'NumpadEnter' })
  f.completeEntry()
  f.press({ code: 'NumpadEnter', repeat: true })
  assert.equal(f.scene.overviewStage, null)
  f.press({ code: 'NumpadEnter' })
  assert.equal(f.scene.overviewStage, 'exit')
})

for (const target of ['button', 'input', 'dialog']) {
  test('Enter leaves ' + target + ' activation with its existing owner', () => {
    const f = fixture()
    for (const repeat of [false, true]) f.press({ repeat }, target)
    assert.equal(f.scene.overviewStage, null)
    assert.deepEqual(f.starts, [])
    assert.deepEqual(f.morphs, [])
    assert.equal(f.counts().prevented, 0)
  })
}

test('modifier, readiness, modal and input-mask exclusions remain authoritative', () => {
  for (const modifier of ['ctrlKey', 'metaKey', 'altKey']) {
    const f = fixture()
    f.press({ [modifier]: true })
    assert.deepEqual(f.starts, [])
  }
  for (const bindings of [{ ready: false }, { menu: true }, { cheatsOpen: true }]) {
    const f = fixture(bindings)
    f.press()
    assert.deepEqual(f.starts, [])
  }
  const f = fixture()
  f.world.inputMask = 1
  f.press()
  assert.deepEqual(f.starts, [])
})

test('Space and spell toggles stay single-press; continuous focus stays repeatable', () => {
  const f = fixture()
  f.press({ key: ' ', code: 'Space' })
  assert.equal(f.world.paused, true)
  f.press({ key: ' ', code: 'Space', repeat: true })
  assert.equal(f.world.paused, true)
  f.press({ key: '7', code: 'Digit7' })
  f.press({ key: '7', code: 'Digit7', repeat: true })
  assert.equal(f.world.mode, 'firestorm')
  assert.deepEqual(f.tabs, ['spells'])
  for (const repeat of [false, true]) f.press({ key: 'f', code: 'KeyF', repeat })
  assert.equal(f.counts().focuses, 2)
})


test('open campaign details refuse overview, spells, pause and Escape before any gameplay action', () => {
  const details = { open: true }, messageDetails = { current: new Map([[57, details]]) }
  const f = fixture({ messageDetails })
  const before = structuredClone(f.world)
  for (const [key, code] of [['Enter', 'Enter'], ['7', 'Digit7'], ['1', 'Digit1'], [' ', 'Space'], ['Escape', 'Escape']])
    for (const repeat of [false, true]) f.press({ key, code, repeat,
      stopImmediatePropagation: () => assert.fail('Message-owned Escape must not be consumed') })
  assert.deepEqual(f.world, before)
  assert.deepEqual(f.starts, [])
  assert.deepEqual(f.morphs, [])
  assert.deepEqual(f.tabs, [])
  assert.deepEqual(f.counts(), { captures: 0, focuses: 0, prevented: 0, updates: 0 })
  details.open = false
  f.press()
  assert.equal(f.scene.overviewStage, 'enter')
  assert.deepEqual(f.starts, [[4, 0]])
  f.cleanup()
  assert.equal(f.listeners.size, 0)
})
