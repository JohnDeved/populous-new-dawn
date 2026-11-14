import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { pageEffect, messageBoxBindings } from './support/follower-nearby-page.mjs'
import { overviewShortcut, quickCameraAction, quickCameraTarget } from '../app/quick-camera-shortcuts.ts'
import { instantOverview } from '../app/instant-overview.ts'
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
const messageBox = open => {
  const box = { open, inside: [], contains: node => box.inside.includes(node) }
  return box
}

function fixture(overrides = {}) {
  const listeners = new Map(), starts = [], morphs = [], tabs = []
  let captures = 0, focuses = 0, prevented = 0, updates = 0, views = 0
  const world = { inputMask: 0, mode: null, paused: false, units: [], selected: [],
    flyby: { flags: 0 }, outcome: { level: 1 }, status: 'playing', drawMode: 0 }
  const functions = new Function('beginGlobeMorph', cameraFunctions + '\nreturn { overview, leaveOverview }')(
    (state, entering) => { morphs.push(entering); state.active = true }
  )
  const BoundScene = new Function('overview', 'leaveOverview', 'instantOverview', wrapper + '\nreturn BoundScene')(
    functions.overview, functions.leaveOverview, instantOverview
  )
  const scene = Object.assign(new BoundScene(), {
    world, overviewActive: false, overviewStage: null,
    overviewReturn: { preset: 0, bearing: 0 }, viewPreset: 1, cameraBearing: Math.PI / 4,
    cameraPosition: { x: 1000, y: 2000, angle: 256 }, viewTransition: null, viewZoom: 3,
    view: { center: { x: 100, y: 200 } }, cameraMotion: { active: 1 },
    globeMotion: { dragging: true, velocity: { x: 1, y: 1 }, position: {} },
    globeMorph: { active: false, value: 256, target: 256 },
    captureCamera: () => captures++,
    updateView: () => views++,
    startGroundView: (...args) => starts.push(args),
    focus: () => focuses++,
    skipIntroduction: noOp,
  })
  const bindings = {
    world, ready: true, menu: false, cheatsOpen: false, selectorOpen: false,
    messageDetails: { current: new Map() }, ...messageBoxBindings,
    SPELLS: [{ id: 'firestorm', key: '7' }], spellHudVisibility: () => 'visible', followerGroupShortcut,
    store: { getWorld: () => world, change: action => action(world) },
    window: { addEventListener: (name, fn) => {
      assert.equal(name, 'keydown'); assert.equal(listeners.size, 0); listeners.set(name, fn)
    }, removeEventListener: (name, fn) => {
      assert.equal(listeners.get(name), fn); listeners.delete(name)
    } },
    engine: { current: scene }, audio: { current: null },
    setTab: value => tabs.push(value), update: () => updates++,
    openMenu: noOp, cancelInteraction: noOp, guardShaman: noOp, quickCameraAction, quickCameraTarget,
    overviewShortcut, HOME: {}, tutorialLevel: 79, rotateBuildingPlan: () => false,
    ...overrides,
  }
  const cleanup = pageEffect("window.addEventListener('keydown', key)", bindings)()
  // One element per focus kind; closest returns it like the DOM would.
  const controls = Object.fromEntries(['button', 'summary', 'input', 'dialog'].map(kind => [kind, { kind }]))
  return {
    scene, world, starts, morphs, tabs, listeners, cleanup, controls,
    press(extra = {}, target = 'body') {
      listeners.get('keydown')({ key: 'Enter', code: 'Enter', repeat: false,
        ctrlKey: false, metaKey: false, altKey: false,
        target: { closest: selector => selector.split(',').includes(target) ? controls[target] : null },
        preventDefault: () => prevented++, ...extra })
    },
    // The end states stepViewChange leaves after startGroundView(4, 0) plus the
    // entry morph, and after the exit morph plus the return ground transition.
    completeEntry() {
      assert.equal(scene.overviewStage, 'enter')
      Object.assign(scene, { overviewActive: true, overviewStage: null, viewPreset: 4, cameraBearing: 0 })
      scene.cameraPosition.angle = 0
      Object.assign(scene.globeMorph, { active: false, value: 0, target: 0 })
      world.drawMode = 2
    },
    completeExit() {
      assert.equal(scene.overviewStage, 'exit')
      const angle = Math.round((scene.overviewReturn.bearing * 1024) / Math.PI) & 2047
      Object.assign(scene, { overviewActive: false, overviewStage: null,
        viewPreset: scene.overviewReturn.preset, cameraBearing: (angle * Math.PI) / 1024 })
      scene.cameraPosition.angle = angle
      Object.assign(scene.globeMorph, { active: false, value: 256, target: 256 })
      world.drawMode = 0
    },
    counts: () => ({ captures, focuses, prevented, updates }),
    views: () => views,
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
  for (const extra of [{ metaKey: true }, { altKey: true }, { shiftKey: true, ctrlKey: true },
    { shiftKey: true, altKey: true }, { ctrlKey: true, metaKey: true }]) {
    const f = fixture()
    f.press(extra)
    assert.deepEqual(f.starts, [], JSON.stringify(extra))
    assert.equal(f.scene.overviewActive, false, JSON.stringify(extra))
  }
  for (const bindings of [{ ready: false }, { menu: true }, { cheatsOpen: true }]) {
    const f = fixture(bindings)
    f.press()
    assert.deepEqual(f.starts, [])
  }
  for (const extra of [{}, { shiftKey: true }, { ctrlKey: true }]) {
    const f = fixture()
    f.world.inputMask = 1
    f.press(extra)
    assert.deepEqual(f.starts, [])
    assert.equal(f.scene.overviewActive, false)
  }
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
  const details = messageBox(true), messageDetails = { current: new Map([[57, details]]) }
  const f = fixture({ messageDetails })
  const before = structuredClone(f.world)
  for (const [key, code] of [['7', 'Digit7'], ['1', 'Digit1'], [' ', 'Space'], ['Escape', 'Escape']])
    for (const repeat of [false, true]) f.press({ key, code, repeat,
      stopImmediatePropagation: () => assert.fail('Message-owned Escape must not be consumed') })
  // A held Enter that began before the box opened is not a fresh native press.
  f.press({ repeat: true })
  assert.equal(details.open, true)
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

// 004a9d90: while 0089bb81 is 2/3 only an Enter/keypad-Enter press passes, as
// process_cmd 0xb0, which closes the box. The same press never reaches 0x15.
test('Enter closes every open campaign message without toggling overview', () => {
  const first = messageBox(true), second = messageBox(true), closed = messageBox(false)
  const f = fixture({ messageDetails: { current: new Map([[3, first], [4, closed], [5, second]]) } })
  const before = structuredClone(f.world)
  f.press()
  assert.deepEqual([first.open, second.open, closed.open], [false, false, false])
  assert.deepEqual(f.world, before)
  assert.deepEqual(f.starts, [])
  assert.deepEqual(f.counts(), { captures: 0, focuses: 0, prevented: 1, updates: 0 })
  f.press({ repeat: true })
  assert.equal(f.scene.overviewStage, null, 'a held closing Enter does not continue into overview')
  f.press()
  assert.equal(f.scene.overviewStage, 'enter', 'the next fresh Enter is the ordinary overview press')
  assert.deepEqual(f.starts, [[4, 0]])
})

test('message-closing Enter ignores Shift/Ctrl/Alt and keypad origin like the native modal path', () => {
  for (const extra of [{ code: 'NumpadEnter' }, { shiftKey: true }, { ctrlKey: true }, { altKey: true }]) {
    const details = messageBox(true)
    const f = fixture({ messageDetails: { current: new Map([[1, details]]) } })
    f.press(extra)
    assert.equal(details.open, false, JSON.stringify(extra))
    assert.deepEqual(f.starts, [])
    assert.equal(f.scene.overviewActive, false, 'the closing press never reaches 0xc5 either')
    assert.equal(f.counts().prevented, 1)
  }
})

test('message-closing Enter leaves the box controls, browser, editable and modal owners alone', () => {
  for (const [bindings, target, extra] of [
    [{}, 'button'], [{}, 'summary'], [{}, 'input'], [{}, 'dialog'], [{}, 'body', { metaKey: true }],
    [{ ready: false }, 'body'], [{ menu: true }, 'body'], [{ cheatsOpen: true }, 'body'],
  ]) {
    const details = messageBox(true)
    const f = fixture({ ...bindings, messageDetails: { current: new Map([[1, details]]) } })
    // The open box's own summary and dismiss button keep native activation.
    details.inside = [f.controls.button, f.controls.summary]
    f.press(extra, target)
    assert.equal(details.open, true, JSON.stringify([bindings, target, extra]))
    assert.deepEqual(f.starts, [])
    assert.equal(f.counts().prevented, 0)
  }
})

// #1046 focus edge case: a summary that kept focus after a click collapse must
// not reopen its old message when Enter should close the newly opened box.
test('Enter from a control outside the open box closes the box instead of activating it', () => {
  for (const target of ['summary', 'button']) {
    const details = messageBox(true), stale = messageBox(false)
    let synced = 0
    const f = fixture({ messageDetails: { current: new Map([[1, stale], [2, details]]) },
      syncMessageModal: () => synced++ })
    f.press({}, target)
    assert.deepEqual([details.open, stale.open], [false, false], target)
    assert.equal(f.counts().prevented, 1, 'the focused control does not activate')
    assert.equal(synced, 1, 'closing ends the modal pause at once')
    assert.deepEqual(f.starts, [])
    // Space would activate the focused control too; it is refused, not used.
    details.open = true
    f.press({ key: ' ', code: 'Space' }, target)
    assert.deepEqual([details.open, stale.open, f.world.paused], [true, false, false], target)
    assert.equal(f.counts().prevented, 2)
  }
})

// Native default records 005d5f68 (Enter → 0x15) and 005d5f74/005d5f80
// (Shift+Enter / Ctrl+Enter → 0xc5); exact modifier masks, press only.
test('Enter keeps the animated action; exactly Shift or Ctrl selects the instant action', () => {
  const event = extra => ({ key: 'Enter', code: 'Enter', repeat: false, shiftKey: false,
    ctrlKey: false, altKey: false, metaKey: false, ...extra })
  assert.deepEqual(overviewShortcut(event()), { instant: false })
  assert.deepEqual(overviewShortcut(event({ code: 'NumpadEnter' })), { instant: false })
  assert.deepEqual(overviewShortcut(event({ shiftKey: true })), { instant: true })
  assert.deepEqual(overviewShortcut(event({ ctrlKey: true })), { instant: true })
  for (const extra of [{ repeat: true }, { shiftKey: true, repeat: true }, { shiftKey: true, ctrlKey: true },
    { altKey: true }, { metaKey: true }, { ctrlKey: true, altKey: true }, { key: 'a', code: 'KeyA' }])
    assert.equal(overviewShortcut(event(extra)), null, JSON.stringify(extra))
})

// 0041d4b0(1): no 0089ce36 state machine or 0041d410 morph; the angle is saved
// and zeroed, vconfig index 4 and draw_mode 2 are applied in the same call.
test('Shift+Enter enters World View in one step with the completed entry state', () => {
  const f = fixture()
  f.press({ shiftKey: true })
  const s = f.scene
  assert.equal(s.overviewActive, true)
  assert.equal(s.overviewStage, null)
  assert.equal(f.world.drawMode, 2)
  assert.equal(s.viewPreset, 4)
  assert.equal(s.viewZoom, 0)
  assert.equal(s.viewTransition, null)
  assert.equal(s.cameraPosition.angle, 0)
  assert.equal(s.cameraBearing, 0)
  assert.deepEqual({ ...s.globeMorph }, { active: false, value: 0, target: 0 })
  assert.deepEqual(s.overviewReturn, { preset: 1, bearing: Math.PI / 4 })
  assert.deepEqual({ x: s.cameraPosition.x, y: s.cameraPosition.y }, { x: 1000, y: 2000 })
  assert.deepEqual(s.globeMotion, { dragging: false, velocity: { x: 0, y: 0 }, position: { x: 100, y: 200 } })
  assert.equal(s.cameraMotion.active, 0)
  assert.equal(f.world.mode, null)
  assert.deepEqual(f.starts, [], 'no animated ground transition')
  assert.deepEqual(f.morphs, [], 'no globe morph')
  assert.equal(f.counts().captures, 1)
  assert.ok(f.views() > 0, 'the view is updated in the same press')
})

// 0041d4b0(0): restores the saved angle and vconfig index with draw_mode 0.
test('Ctrl+Enter leaves World View in one step back to the saved ground view', () => {
  const f = fixture()
  f.press({ ctrlKey: true })
  f.world.mode = 'blast'
  f.scene.globeMotion.dragging = true
  f.press({ ctrlKey: true })
  const s = f.scene
  assert.equal(s.overviewActive, false)
  assert.equal(s.overviewStage, null)
  assert.equal(f.world.drawMode, 0)
  assert.equal(s.viewPreset, 1)
  assert.equal(s.viewZoom, 0)
  assert.equal(s.viewTransition, null)
  assert.equal(s.cameraPosition.angle, 256)
  assert.equal(s.cameraBearing, Math.PI / 4)
  assert.deepEqual({ ...s.globeMorph }, { active: false, value: 256, target: 256 })
  assert.equal(s.globeMotion.dragging, false)
  assert.equal(f.world.mode, null)
  assert.deepEqual(f.starts, [])
  assert.deepEqual(f.morphs, [])
})

test('held instant chords toggle once per press', () => {
  const f = fixture()
  f.press({ shiftKey: true })
  for (let i = 0; i < 4; i++) f.press({ shiftKey: true, repeat: true })
  assert.equal(f.scene.overviewActive, true)
  f.press({ shiftKey: true })
  for (let i = 0; i < 4; i++) f.press({ shiftKey: true, repeat: true })
  assert.equal(f.scene.overviewActive, false)
  assert.equal(f.counts().captures, 1)
})

// Both paths share the saved angle (0041cdc0/0041cdf0 and 0041d4b0 use 005fe42c).
test('animated and instant entry/exit compose through the same saved return view', () => {
  const animatedIn = fixture()
  animatedIn.press()
  animatedIn.completeEntry()
  animatedIn.press({ shiftKey: true })
  assert.equal(animatedIn.scene.overviewActive, false)
  assert.equal(animatedIn.scene.overviewStage, null)
  assert.equal(animatedIn.scene.viewPreset, 1)
  assert.equal(animatedIn.scene.cameraPosition.angle, 256)
  assert.equal(animatedIn.world.drawMode, 0)
  assert.deepEqual(animatedIn.morphs, [], 'the instant exit starts no morph')
  const instantIn = fixture()
  instantIn.press({ ctrlKey: true })
  instantIn.press()
  assert.equal(instantIn.scene.overviewStage, 'exit')
  assert.deepEqual(instantIn.morphs, [false])
  instantIn.completeExit()
  assert.equal(instantIn.scene.viewPreset, 1)
  assert.equal(instantIn.scene.cameraPosition.angle, 256)
})

// 0041d4b0 returns while 0089ce36, 005fe420 or 0089ce34 is nonzero. 0089ce34 is
// also armed by the ordinary zoom-level change (00479f00 case 0xb).
test('instant chords are ignored while an overview or ground zoom transition runs', () => {
  const entering = fixture()
  entering.press()
  entering.press({ shiftKey: true })
  assert.equal(entering.scene.overviewStage, 'enter')
  assert.equal(entering.scene.overviewActive, false)
  assert.deepEqual(entering.starts, [[4, 0]])
  entering.scene.overviewActive = true
  entering.scene.globeMorph.active = true
  entering.press({ ctrlKey: true })
  assert.equal(entering.scene.overviewStage, 'enter', 'the entry morph still owns the transition')
  assert.equal(entering.world.drawMode, 0)
  const leaving = fixture()
  leaving.press()
  leaving.completeEntry()
  leaving.press()
  leaving.press({ shiftKey: true })
  assert.equal(leaving.scene.overviewStage, 'exit')
  assert.equal(leaving.scene.overviewActive, true)
  const zooming = fixture()
  const transition = { remaining: 3 }
  zooming.scene.viewTransition = transition
  zooming.press({ shiftKey: true })
  assert.equal(zooming.scene.overviewActive, false)
  assert.equal(zooming.scene.viewTransition, transition)
  assert.equal(zooming.counts().captures, 0)
  zooming.press()
  assert.equal(zooming.scene.overviewStage, 'enter', 'plain Enter (00418890) does not test 0089ce34')
})

test('modified Enter leaves focused controls, editable fields and dialogs alone', () => {
  for (const target of ['button', 'input', 'dialog'])
    for (const extra of [{ shiftKey: true }, { ctrlKey: true }]) {
      const f = fixture()
      f.press(extra, target)
      assert.equal(f.scene.overviewActive, false, target)
      assert.equal(f.counts().captures, 0)
    }
})

test('a stale Page listener cannot drive a replacement scene; the new listener drives only it', () => {
  const engine = { current: null }, store = {}
  const old = fixture({ engine, store }), next = fixture({ engine, store })
  const own = f => {
    engine.current = f.scene
    store.getWorld = () => f.world
    store.change = action => action(f.world)
  }
  own(old)
  old.press({ shiftKey: true })
  assert.equal(old.scene.overviewActive, true)
  // Load/restart replaced the world and scene before React re-registered the listener.
  own(next)
  for (const extra of [{}, { shiftKey: true }, { ctrlKey: true }]) old.press(extra)
  engine.current = null
  old.press({ shiftKey: true })
  assert.equal(old.scene.overviewActive, true)
  assert.equal(next.scene.overviewActive, false)
  assert.equal(next.scene.overviewStage, null)
  assert.equal(next.counts().captures, 0)
  old.cleanup()
  own(next)
  next.press({ ctrlKey: true })
  assert.equal(next.scene.overviewActive, true)
  assert.equal(next.world.drawMode, 2)
  assert.equal(old.scene.overviewActive, true)
})
