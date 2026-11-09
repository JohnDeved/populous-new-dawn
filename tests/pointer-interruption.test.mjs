import assert from 'node:assert/strict'
import test from 'node:test'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import { createStartedWorld } from './level-start-fixture.mjs'

const api = await loadSceneFixture()
const { pointerDown, pointerUp, pointerMove, updateDrag, installInputListeners } =
  await import('../app/scene-input-runtime.ts')
const { skipIntroduction } = await import('../app/scene-camera-runtime.ts')

function fixture(t) {
  const world = createStartedWorld(),
    unit = world.units.find(u => u.team === 'blue' && u.kind === 'brave')
  api.setSelection(world, [])
  const globals = new Map(
    ['window', 'document'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)])
  )
  globalThis.window = {}
  globalThis.document = { hidden: false, querySelector: () => null }
  t.after(() => {
    for (const [key, descriptor] of globals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
  })
  const listeners = [],
    captured = new Set()
  let hovered = unit
  const scene = {
    world,
    renderer: {
      domElement: {
        setPointerCapture(id) {
          captured.add(id)
        },
      },
    },
    listen(target, type, callback) {
      listeners.push({ target, type, callback })
    },
    keys: new Set(),
    globeMotion: { dragging: false, velocity: { x: 0, y: 0 } },
    dragActive: { value: false },
    selectionOverlay: { visible: false, update() {} },
    view: { angle: 0 },
    flybyCamera: { x: 0, y: 0, angle: 0, zoom: 0 },
    pickUnit: () => hovered,
    pick: e => ({ x: unit.x + (e.clientX - 10) / 10, z: unit.z - (e.clientY - 10) / 10 }),
    pickWorldObject: () => null,
    picking: { pickPerson: () => hovered?.id },
    onChange() {},
    onSound() {},
    acknowledgePointer() {},
    orderSound() {},
    objectPanels: { releaseBuildingInspection() {} },
  }
  scene.pointerDown = e => pointerDown(scene, e)
  scene.pointerMove = e => pointerMove(scene, e)
  scene.pointerUp = e => pointerUp(scene, e)
  scene.updateDrag = e => updateDrag(scene, e)
  skipIntroduction(scene)
  assert.equal(world.inputMask, 0)
  installInputListeners(scene, {})
  const event = (pointerId = 1, extra = {}) => ({
    button: 0,
    buttons: 1,
    pointerId,
    clientX: 10,
    clientY: 10,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    ...extra,
  })
  const emit = (target, type, e = {}) =>
    listeners.filter(l => l.target === target && l.type === type).forEach(l => l.callback(e))
  return {
    scene,
    world,
    unit,
    event,
    emit,
    hover: value => {
      hovered = value
    },
  }
}

test('the installed canvas leave listener clears hover state without changing selection and permits re-entry', t => {
  const { scene, world, unit, event, emit } = fixture(t)
  api.setSelection(world, [unit.id])
  const selection = [...world.selected]
  Object.assign(scene, {
    hoveredObject: world.buildings[0].id,
    pointerScreen: { clientX: 10, clientY: 10 },
    pointer: { x: unit.x, z: unit.z },
    pointerState: 'previous-hover-sample',
  })
  // Deliver the registered listener, rather than directly clearing fixture state.
  // DOM hit-testing and browser event delivery remain outside this Node fixture.
  emit(scene.renderer.domElement, 'pointerleave', event(1, { buttons: 0 }))
  emit(scene.renderer.domElement, 'pointerleave', event(1, { buttons: 0 }))
  assert.equal(scene.hoveredObject, null)
  assert.equal(scene.pointerScreen, null)
  assert.equal(scene.pointer, null)
  assert.equal(scene.pointerState, '')
  assert.deepEqual(world.selected, selection, 'leaving the canvas must not clear selection')
  emit(scene.renderer.domElement, 'pointermove', event(1, { buttons: 0, clientX: 25, clientY: 30 }))
  assert.deepEqual(scene.pointerScreen, { clientX: 25, clientY: 30 })
  assert.equal(scene.pointerState, '', 're-entry must leave the next pointer-frame sample invalidated')
  assert.deepEqual(world.selected, selection)
})

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
      else if (reason === 'hidden') {
        document.hidden = true
        emit(document, 'visibilitychange')
      } else {
        emit(scene.renderer.domElement, 'pointercancel', event())
        emit(window, 'pointercancel', event())
      }
    }
    cancel()
    cancel()
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
    assert.deepEqual(
      world.selected,
      [unit.id],
      'fresh selection remains valid, including while paused'
    )
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

test('a cancelled camera drag cannot resume from held-button movement without a fresh press', t => {
  const { scene, event, emit } = fixture(t)
  Object.assign(scene, {
    cameraMotion: { active: 0 },
    cameraPosition: { x: 0, y: 0, angle: 0, zoom: 0 },
    cameraVelocity: { turn: 0, forward: 0, side: 0 },
    captureCamera() {},
    updateView() {},
  })
  const right = (id, x) => event(id, { button: 2, buttons: 2, clientX: x, ctrlKey: true })
  pointerDown(scene, right(1, 10))
  pointerMove(scene, right(1, 20))
  assert.equal(scene.cameraPosition.angle, 10)
  emit(window, 'blur')
  const angle = scene.cameraPosition.angle
  pointerMove(scene, right(1, 60))
  assert.equal(scene.cameraPosition.angle, angle)
  pointerDown(scene, right(2, 60))
  pointerMove(scene, right(1, 90))
  assert.equal(scene.cameraPosition.angle, angle)
  pointerMove(scene, right(2, 70))
  assert.equal(scene.cameraPosition.angle, angle + 10)
})

test('a fresh middle-button camera drag pans after interruption', t => {
  const { scene, event, emit } = fixture(t)
  Object.assign(scene, {
    tooltip: { draw: 0 },
    cameraMotion: { active: 0 },
    cameraPosition: { x: 0, y: 0, angle: 0, zoom: 0 },
    cameraVelocity: { turn: 0, forward: 0, side: 0 },
    captureCamera() {},
    updateView() {},
  })
  const middle = (id, x) => event(id, { button: 1, buttons: 4, clientX: x })
  pointerDown(scene, middle(1, 10))
  emit(window, 'pointercancel', middle(1, 10))
  const before = { ...scene.cameraPosition }
  pointerMove(scene, middle(1, 20))
  assert.deepEqual(scene.cameraPosition, before)
  pointerDown(scene, middle(2, 20))
  pointerMove(scene, middle(2, 30))
  assert.notDeepEqual(scene.cameraPosition, before)
})

for (const [first, last] of [
  [0, 2],
  [2, 0],
  [0, 1],
  [1, 0],
  [1, 2],
  [2, 1],
]) {
  for (const interruption of [null, 'blur', 'hidden', 'pointercancel']) {
    test(`chord ${first}→${last} ends without a wrong-button action${interruption ? ' after ' + interruption : ''}`, t => {
      const { scene, world, unit, event, emit, hover } = fixture(t)
      Object.assign(scene, {
        tooltip: { draw: 0 },
        cameraMotion: { active: 0 },
        cameraPosition: { x: 0, y: 0, angle: 0, zoom: 0 },
        cameraVelocity: { turn: 0, forward: 0, side: 0 },
        captureCamera() {},
        updateView() {},
      })
      const held = button => [1, 4, 2][button]
      // Pointer Events emit one down and one final up for a button chord.
      // https://www.w3.org/TR/pointerevents3/#chorded-button-interactions
      // Intermediate button transitions are pointermove events.
      pointerDown(scene, event(1, { button: first, buttons: held(first), ctrlKey: true }))
      if (first === 0) {
        hover(undefined)
        updateDrag(scene, event(1, { clientX: 30, clientY: 30 }))
        assert.equal(scene.dragActive.value, true)
      }
      pointerMove(scene, event(1, { button: last, buttons: held(first) | held(last) }))
      pointerMove(scene, event(1, { button: first, buttons: held(last) }))
      scene.navigationPointer = { x: 10, y: 10, buttons: held(last) }
      scene.tooltipInspectionInputs = [event(1)]
      pointerUp(scene, event(9, { button: last, buttons: 0 }))
      assert.equal(scene.pointerGesture.pointerId, 1, 'unrelated pointer cannot finish the chord')
      if (interruption === 'hidden') {
        document.hidden = true
        emit(document, 'visibilitychange')
      } else if (interruption === 'pointercancel') emit(window, 'pointercancel', event())
      else if (interruption) emit(window, interruption)
      pointerUp(scene, event(1, { button: last, buttons: 0 }))
      assert.equal(scene.pointerGesture, null)
      assert.equal(scene.pointerButtons, 0)
      assert.equal(scene.navigationPointer, null)
      assert.deepEqual(scene.tooltipInspectionInputs, [])
      assert.equal(scene.drag, null)
      assert.equal(scene.dragActive.value, false)
      assert.equal(scene.selectionOverlay.visible, false)
      assert.deepEqual(
        world.selected,
        [],
        'different final button cannot complete the initial click'
      )
      hover(unit)
      pointerDown(scene, event(2))
      pointerUp(scene, event(2, { buttons: 0 }))
      assert.deepEqual(world.selected, [unit.id], 'fresh click after chord stays usable')
      const angle = scene.cameraPosition.angle
      pointerDown(scene, event(3, { button: 2, buttons: 2, ctrlKey: true }))
      pointerMove(scene, event(3, { button: -1, buttons: 2, clientX: 20 }))
      pointerUp(scene, event(3, { button: 2, buttons: 0, clientX: 20 }))
      assert.equal(scene.cameraPosition.angle, (angle + 10) & 2047)
      const position = { ...scene.cameraPosition }
      pointerDown(scene, event(4, { button: 1, buttons: 4 }))
      pointerMove(scene, event(4, { button: -1, buttons: 4, clientX: 20 }))
      pointerUp(scene, event(4, { button: 1, buttons: 0, clientX: 20 }))
      assert.notDeepEqual(scene.cameraPosition, position, 'fresh middle drag pans')
    })
  }
}
