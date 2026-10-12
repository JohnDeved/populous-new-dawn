import assert from 'node:assert/strict'
import test from 'node:test'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import { createStartedWorld } from './level-start-fixture.mjs'

const api = await loadSceneFixture()
const { pointerDown, pointerUp, updateDrag, installInputListeners } = await import('../app/scene-input-runtime.ts')
const { skipIntroduction } = await import('../app/scene-camera-runtime.ts')

function fixture(t) {
  const world = createStartedWorld(), unit = world.units.find(u => u.team === 'blue' && u.kind === 'brave')
  api.setSelection(world, [])
  const globals = new Map(['window', 'document'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  globalThis.window = {}
  globalThis.document = { hidden: false, querySelector: () => null }
  t.after(() => {
    for (const [key, descriptor] of globals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
  })
  const listeners = [], captured = new Set()
  let hovered = unit
  const scene = {
    world, renderer: { domElement: { setPointerCapture(id) { captured.add(id) } } },
    listen(target, type, callback) { listeners.push({ target, type, callback }) },
    keys: new Set(), globeMotion: { dragging: false, velocity: { x: 0, y: 0 } },
    dragActive: { value: false }, selectionOverlay: { visible: false, update() {} },
    view: { angle: 0 }, flybyCamera: { x: 0, y: 0, angle: 0, zoom: 0 },
    pickUnit: () => hovered,
    pick: e => ({ x: unit.x + (e.clientX - 10) / 10, z: unit.z - (e.clientY - 10) / 10 }),
    pickWorldObject: () => null, picking: { pickPerson: () => hovered?.id },
    onChange() {}, onSound() {}, acknowledgePointer() {}, orderSound() {},
    objectPanels: { releaseBuildingInspection() {} },
  }
  scene.pointerDown = e => pointerDown(scene, e)
  scene.pointerUp = e => pointerUp(scene, e)
  scene.updateDrag = e => updateDrag(scene, e)
  skipIntroduction(scene)
  assert.equal(world.inputMask, 0)
  installInputListeners(scene, {})
  const event = (pointerId = 1, extra = {}) => ({ button: 0, buttons: 1, pointerId, clientX: 10, clientY: 10, ctrlKey: false, shiftKey: false, altKey: false, metaKey: false, ...extra })
  const emit = (target, type, e = {}) => listeners.filter(l => l.target === target && l.type === type).forEach(l => l.callback(e))
  return { scene, world, unit, event, emit, hover: value => { hovered = value } }
}

for (const reason of ['blur', 'hidden', 'pointercancel']) {
  test(`${reason} clears an interrupted gesture and ignores its release without suppressing a fresh click`, t => {
    const { scene, world, unit, event, emit, hover } = fixture(t)
    pointerDown(scene, event())
    hover(undefined)
    updateDrag(scene, event(1, { clientX: 30, clientY: 30 }))
    assert.equal(scene.dragActive.value, true)
    scene.keys.add('w')
    scene.globeMotion.dragging = true
    scene.globeMotion.velocity = { x: 2, y: 3 }
    scene.navigationPointer = { x: 10, y: 10, buttons: 1 }
    const cancel = () => {
      if (reason === 'blur') emit(window, 'blur')
      else if (reason === 'hidden') { document.hidden = true; emit(document, 'visibilitychange') }
      else { emit(scene.renderer.domElement, 'pointercancel', event()); emit(window, 'pointercancel', event()) }
    }
    cancel(); cancel()
    assert.equal(scene.drag, null)
    assert.equal(scene.dragActive.value, false)
    assert.equal(scene.selectionOverlay.visible, false)
    assert.equal(scene.pointerButtons, 0)
    assert.equal(scene.globeMotion.dragging, false)
    assert.deepEqual(scene.globeMotion.velocity, { x: 0, y: 0 })
    assert.equal(scene.navigationPointer, null)
    if (reason !== 'pointercancel') {
      assert.equal(scene.keys.size, 0)
      assert.equal(world.paused, true)
    }
    hover(unit)
    pointerUp(scene, event(1, { buttons: 0 }))
    assert.deepEqual(world.selected, [])
    document.hidden = false
    pointerDown(scene, event(2))
    pointerUp(scene, event(2, { buttons: 0 }))
    assert.deepEqual(world.selected, [unit.id], 'fresh selection remains valid, including while paused')
    api.setSelection(world, [])
    hover(undefined)
    pointerDown(scene, event(3, { clientX: 0, clientY: 0 }))
    updateDrag(scene, event(3, { clientX: 40, clientY: 40 }))
    pointerUp(scene, event(3, { clientX: 40, clientY: 40, buttons: 0 }))
    assert.ok(world.selected.includes(unit.id), 'fresh drag remains valid after interruption')
  })
}

test('an old pointer release or mismatched button cannot consume a fresh owned click', t => {
  const { scene, world, unit, event, emit } = fixture(t)
  pointerDown(scene, event(1))
  emit(window, 'blur')
  pointerDown(scene, event(2))
  pointerUp(scene, event(1, { buttons: 0 }))
  pointerUp(scene, event(2, { button: 2, buttons: 1 }))
  assert.deepEqual(world.selected, [])
  pointerUp(scene, event(2, { buttons: 0 }))
  assert.deepEqual(world.selected, [unit.id])
})

test('cancelling another pointer preserves the matching gesture and its normal drag selection', t => {
  const { scene, world, unit, event, emit, hover } = fixture(t)
  hover(undefined)
  pointerDown(scene, event(2, { clientX: 0, clientY: 0 }))
  emit(window, 'pointercancel', event(1))
  updateDrag(scene, event(2, { clientX: 40, clientY: 40 }))
  assert.equal(scene.dragActive.value, true)
  pointerUp(scene, event(2, { clientX: 40, clientY: 40, buttons: 0 }))
  assert.ok(world.selected.includes(unit.id), 'ordinary drag still selects followers')
  assert.equal(scene.drag, null)
  assert.equal(scene.dragActive.value, false)
})

test('masked opening and overview-transition releases remain inert', t => {
  const { scene, world, event } = fixture(t)
  for (const block of ['inputMask', 'overviewStage']) {
    if (block === 'inputMask') world.inputMask = 64
    else scene.overviewStage = 1
    pointerDown(scene, event())
    pointerUp(scene, event(1, { buttons: 0 }))
    assert.deepEqual(world.selected, [])
    world.inputMask = 0
    scene.overviewStage = 0
  }
})

test('pointercancel still clears navigation state when no canvas gesture is owned', t => {
  const { scene, event, emit } = fixture(t)
  scene.navigationPointer = { x: 0, y: 0, buttons: 0 }
  emit(window, 'pointercancel', event(8))
  assert.equal(scene.navigationPointer, null)
})
