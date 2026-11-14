import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'
import { createWorld } from '../app/model.ts'
import { advanceGame } from '../app/game-clock.ts'
import { addMessage } from '../app/messages.ts'
import * as camera from '../app/camera-input.ts'
import {
  messageBoxKey,
  messageBoxRequested,
  openMessageBox,
  showMessageBox,
} from '../app/campaign-message-modal.ts'
import { evaluatePage, pageNode, pageSource } from './support/follower-nearby-page.mjs'

// Native evidence: decomp/research/campaign-message-keyboard.md (#1045, #1046).
const box = (open = false, inside = []) => ({ open, contains: node => inside.includes(node) })
const target = control => ({ closest: selector => (selector === 'button,summary' ? control : null) })
const key = (extra = {}) => ({ key: 'Enter', repeat: false, metaKey: false, target: target(null), ...extra })

test('one message box: a new box replaces the open one, like a new 004af440 request', () => {
  const first = box(true), second = box(), third = box()
  assert.equal(openMessageBox([second, first, third]), first)
  showMessageBox([first, second, third], second)
  assert.deepEqual([first.open, second.open, third.open], [false, true, false])
  assert.equal(openMessageBox([first, second, third]), second)
  assert.equal(openMessageBox([box(), box()]), null)
})

test('box keys: Enter closes; other keys, repeats and Meta+Enter do nothing', () => {
  const open = box(true)
  for (const extra of [{}, { key: 'Enter', repeat: false }]) assert.equal(messageBoxKey(key(extra), open), 'close')
  for (const extra of [{ repeat: true }, { metaKey: true }, { key: 'Escape' }, { key: ' ' }, { key: '1' }])
    assert.equal(messageBoxKey(key(extra), open), 'drop', JSON.stringify(extra))
})

test('box keys: only controls inside the open box keep native activation', () => {
  const summary = {}, dismiss = {}, stale = {}, hud = {}
  const open = box(true, [summary, dismiss])
  for (const control of [summary, dismiss])
    for (const extra of [{}, { key: ' ' }, { repeat: true }])
      assert.equal(messageBoxKey(key({ target: target(control), ...extra }), open), 'native')
  // A summary that kept focus after a click collapse must not reopen its message.
  for (const control of [stale, hud]) {
    assert.equal(messageBoxKey(key({ target: target(control) }), open), 'close')
    for (const extra of [{ key: ' ' }, { repeat: true }, { metaKey: true }])
      assert.equal(messageBoxKey(key({ target: target(control), ...extra }), open), 'block')
    assert.equal(messageBoxKey(key({ target: target(control), key: 'a' }), open), 'drop')
  }
})

// 004a5590 at 004a5985: once 004314c0 has requested the box, 004af640 replaces
// every later simulation turn. The browser page opens the box, clears the
// request and pauses in the same store change.
function pendingWorld() {
  const w = createWorld()
  w.speed = 1
  const slot = addMessage(w.messages, 615, () => 0), message = w.messages.slots[slot]
  message.flags |= 0x20000
  message.speed = 1
  message.position = 0x10000 - message.height - 1
  return { w, message }
}

test('requested box holds the clock from the requesting presentation visit', () => {
  const { w, message } = pendingWorld()
  const clock = { animationTime: 0, animationFrame: 0, messageBoxRequested: () => messageBoxRequested(w.messages) }
  advanceGame(w, clock, 2)
  assert.equal(message.flags & 2, 2, 'the first presentation visit requests the box')
  assert.equal(clock.animationFrame, 1, 'no later presentation visit runs')
  const turn = w.turn, snapshot = JSON.stringify(w)
  advanceGame(w, clock, 5)
  assert.equal(JSON.stringify(w), snapshot, 'a pending request runs no turn')
  assert.equal(clock.animationFrame, 1)
  // The page clears the request and pauses; closing resumes ordinary turns.
  message.flags &= ~2
  advanceGame(w, clock, 1)
  assert.equal(w.turn, turn + 12)

  // Without the hook (headless callers) the clock keeps its existing behavior.
  const control = pendingWorld(), plain = { animationTime: 0, animationFrame: 0 }
  advanceGame(control.w, plain, 2)
  assert.equal(plain.animationFrame, 48)
  assert.equal(messageBoxRequested(control.w.messages), true)
})

test('the live Scene clock owns the request hold', () => {
  const scene = readFileSync(new URL('../app/scene.ts', import.meta.url), 'utf8')
  assert.match(scene, /messageBoxRequested: \(\) => messageBoxRequested\(this\.world\.messages\)/)
})

// Execute the actual scene-input-runtime callers with supplied leaves.
const inputSource = ts.createSourceFile(
  'scene-input-runtime.ts',
  readFileSync(new URL('../app/scene-input-runtime.ts', import.meta.url), 'utf8'),
  ts.ScriptTarget.Latest,
  true
)
const statement = name => {
  const node = inputSource.statements.find(node =>
    (ts.isFunctionDeclaration(node) && node.name?.text === name) ||
    (ts.isVariableStatement(node) && node.declarationList.declarations.some(d => d.name.getText(inputSource) === name)))
  assert.ok(node, name)
  return node.getText(inputSource).replace(/^export /, '')
}
const inputCode = ts.transpileModule(
  ['cameraKeys', 'keyDown', 'navigationButtons', 'pointerDown'].map(statement).join('\n') +
    '\nreturn { keyDown, navigationButtons, pointerDown }',
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }
).outputText
function inputFixture(messageModal) {
  const events = []
  const document = { querySelector: () => null, documentElement: { clientWidth: 640, clientHeight: 480 } }
  const bindings = {
    document, cameraCommand: camera.cameraCommand, cameraEdgeButtons: camera.cameraEdgeButtons,
    mergeCameraInput: camera.mergeCameraInput,
    followerGroupDisplayKey: () => events.push('group-display'),
    cameraBookmark: (_, index) => events.push(['bookmark', index]),
    requestSpyDiscovery: () => events.push('spy'), retainedBuildingPanel: () => false,
    queueBuildingInspection: () => events.push('inspect'), liveVehiclePassengers: () => [],
    nativePosition: () => ({ x: 0, y: 0 }), beginGlobeDrag: () => events.push('globe'),
  }
  const runtime = new Function(...Object.keys(bindings), inputCode)(...Object.values(bindings))
  const scene = {
    messageModal, modalSuspended: false, keys: new Set(), navigationPointer: { x: 0, y: 200, buttons: 0 },
    overviewStage: null, overviewActive: false,
    gamePreferences: { rotation: 'cursor', flipRotation: false },
    world: { inputMask: 0, mode: null, selected: [], units: [], buildings: [], vehicles: [] },
    zoom: zoomIn => events.push(['zoom', zoomIn]), togglePerformance: () => events.push('f8'),
    pickUnit: () => ({ id: 4 }), pickWorldObject: () => null, pick: () => null,
    acknowledgePointer: () => events.push('acknowledge'), onSound: () => events.push('sound'),
    objectPanels: { open: () => events.push('panel') },
    renderer: { domElement: { setPointerCapture: () => events.push('capture'), getBoundingClientRect: () => ({}) } },
    picking: { pickPerson: () => null }, dragActive: { value: false }, selectionOverlay: {},
  }
  return { runtime, scene, events }
}
const keyEvent = (key, extra = {}) => {
  const event = { key, code: key, repeat: false, ctrlKey: false, shiftKey: false, altKey: false, metaKey: false,
    target: { closest: () => null }, defaultPrevented: false, ...extra }
  event.preventDefault = () => { event.defaultPrevented = true }
  return event
}

test('an open box stops cursor, zoom, bookmark and group keys and the edge scroll (004aa532)', () => {
  for (const messageModal of [false, true]) {
    const { runtime, scene, events } = inputFixture(messageModal)
    const prevented = []
    for (const key of ['ArrowLeft', '+', '-', 'z', 'Shift']) {
      const event = keyEvent(key)
      runtime.keyDown(scene, event)
      prevented.push(event.defaultPrevented)
    }
    if (messageModal) {
      assert.deepEqual([...scene.keys], [])
      assert.deepEqual(events, [])
      assert.deepEqual(prevented, [false, false, false, false, false])
      scene.keys.add('arrowleft')
      assert.equal(runtime.navigationButtons(scene), 0, 'held cursor keys and the screen edge are skipped')
    } else {
      // The same harness drives the ordinary owners when no box is open.
      assert.ok(scene.keys.has('arrowleft'))
      assert.deepEqual(events.filter(event => Array.isArray(event)), [['zoom', true], ['zoom', false], ['bookmark', 0]])
      assert.ok(events.includes('group-display'))
      assert.notEqual(runtime.navigationButtons(scene), 0)
    }
    // F8 is the browser performance diagnostic, not a game binding.
    runtime.keyDown(scene, keyEvent('F8'))
    assert.equal(events.at(-1), 'f8')
  }
})

test('an open box refuses world presses: only the box takes the left release', () => {
  for (const messageModal of [false, true]) {
    const { runtime, scene, events } = inputFixture(messageModal)
    for (const button of [0, 2]) {
      scene.pointerGesture = null
      runtime.pointerDown(scene, { button, buttons: 1 << button, pointerId: 1, clientX: 5, clientY: 6,
        shiftKey: false, ctrlKey: false, altKey: false, metaKey: false, currentTarget: null })
      assert.equal(scene.pointerGesture === null, messageModal, `button ${button}`)
    }
    assert.equal(events.length === 0, messageModal)
  }
})

// Execute the actual Page modal owner with supplied store/Scene leaves.
const syncSource = () => pageNode(node => ts.isVariableStatement(node) &&
  node.declarationList.declarations.some(declaration => declaration.name.getText(pageSource) === 'syncMessageModal')).getText(pageSource)
function pageFixture(paused = false) {
  const world = { paused }
  let current = world
  const modal = []
  const scene = { world, setMessageModal: value => modal.push(value) }
  const details = new Map([[1, box()], [2, box()]])
  const cancelled = []
  const bindings = {
    messageDetails: { current: details }, messageSession: { current: null }, openMessageBox,
    cancelNearbyInput: () => cancelled.push(current),
    engine: { current: scene }, useCallback: callback => callback,
    store: { getWorld: () => current, change: action => action(current) },
  }
  const sync = evaluatePage(`function(){${syncSource()}; return syncMessageModal}`, bindings)()
  return { world, scene, modal, details, bindings, sync, cancelled, replace: next => { current = next } }
}

test('opening a box pauses through the ordinary pause; closing it resumes', () => {
  for (const paused of [false, true]) {
    const f = pageFixture(paused)
    f.sync()
    assert.deepEqual(f.modal, [])
    f.details.get(1).open = true
    f.sync()
    f.sync()
    assert.equal(f.world.paused, true)
    assert.deepEqual(f.modal, [true])
    assert.deepEqual(f.cancelled, [f.world], 'a held Nearby press ends when the box opens')
    // Switching boxes keeps one modal session and its original pause owner.
    showMessageBox(f.details.values(), f.details.get(2))
    f.sync()
    assert.deepEqual(f.modal, [true])
    f.details.get(2).open = false
    f.sync()
    assert.equal(f.world.paused, paused, 'the prior pause state returns')
    assert.deepEqual(f.modal, [true, false])
    assert.equal(f.bindings.messageSession.current, null)
  }
})

test('a replaced world never inherits the previous box or its pause', () => {
  const f = pageFixture()
  f.details.get(1).open = true
  f.sync()
  const next = { paused: false }
  f.replace(next)
  f.details.get(1).open = false
  f.sync()
  assert.equal(next.paused, false)
  assert.equal(f.world.paused, true, 'the retired world is not written')
  assert.deepEqual(f.modal, [true, false])
})

// 004aa1c0: only the box takes a press. Execute the actual Page capture guard.
const guardSource = () => pageNode(node => ts.isFunctionDeclaration(node) && node.name?.text === 'blockMessageModalInteraction').getText(pageSource)
test('an open box refuses HUD and world presses; the box and browser controls stay usable', () => {
  const world = {}, session = { current: { world, paused: false } }
  const guard = evaluatePage(`(${guardSource()})`, { world, messageSession: session })
  const press = allowed => {
    const event = { prevented: false, stopped: false,
      target: { closest: selector => (allowed && selector.split(',').includes(allowed) ? {} : null) },
      preventDefault() { this.prevented = true }, stopPropagation() { this.stopped = true } }
    return [guard(event), event.prevented, event.stopped]
  }
  assert.deepEqual(press(null), [true, true, true], 'HUD/world press')
  for (const allowed of ['.campaign-messages', '[data-fullscreen-control]', '.desktop-recommendation', 'dialog'])
    assert.deepEqual(press(allowed), [false, false, false], allowed)
  session.current = null
  assert.deepEqual(press(null), [false, false, false], 'no open box')
  session.current = { world: {}, paused: false }
  assert.deepEqual(press(null), [false, false, false], 'a retired world session does not block')
  // Every pointer/click capture of the game shell routes through the guard.
  const main = pageNode(node => ts.isJsxOpeningElement(node) && node.tagName.getText(pageSource) === 'main')
  for (const name of ['onPointerDownCapture', 'onPointerUpCapture', 'onContextMenuCapture', 'onClickCapture'])
    assert.match(main.attributes.properties.find(node => node.name?.text === name).getText(pageSource),
      /blockLoadingInteraction\(e\) \|\| blockMessageModalInteraction\(e\)/, name)
})
