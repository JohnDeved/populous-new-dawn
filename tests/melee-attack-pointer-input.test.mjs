import assert from 'node:assert/strict'
import test from 'node:test'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

const api = await loadSceneFixture()
const { pointerDown, pointerUp, updateDrag } = await import('../app/scene-input-runtime.ts')
const { skipIntroduction } = await import('../app/scene-camera-runtime.ts')
const { finishLevelStart } = await import('./level-start-fixture.mjs')

// Actual authored World, pointerDown/pointerUp, selection and command callers.
// Only the DOM and hit-test boundary are supplied; this is not browser picking
// or artwork acceptance, and no direct command call can bypass the input route.
for (const paused of [true, false]) for (const shiftKey of [false, true]) {
  test(`ordinary M2 pointer attack: paused=${paused}, Shift=${shiftKey}`, t => {
    const world = finishLevelStart(api.createWorld(2)), timing = { animationTime: 0, animationFrame: 0 }
    while (world.turn < 121) api.advanceGame(world, timing, 1 / 12)
    api.select(world, 'shaman')
    const actor = world.units.find(unit => unit.id === 54), target = world.units.find(unit => unit.id === 20)
    assert.deepEqual(world.selected, [54]); assert.equal(target.kind, 'shaman'); assert.equal(target.team, 'green')
    assert.equal(target.inside, null); assert.equal(api.canPickUnit(world, target), true)
    assert.equal(actor.target, null); assert.equal(actor.fight, null)
    world.paused = paused // Explicit test precondition, never a browser scenario mutation.
    const lastOrderTurn = world.lastOrderTurn
    const descriptors = new Map(['window', 'document'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
    globalThis.window = {}; globalThis.document = { hidden: false, querySelector: () => null }
    t.after(() => {
      for (const [key, descriptor] of descriptors)
        if (descriptor) Object.defineProperty(globalThis, key, descriptor)
        else delete globalThis[key]
    })
    const scene = { world, renderer: { domElement: { setPointerCapture() {} } },
      globeMotion: { dragging: false, velocity: { x: 0, y: 0 } },
      dragActive: { value: false }, selectionOverlay: { visible: false, update() {} }, view: { angle: 0 },
      flybyCamera: { x: 0, y: 0, angle: 0, zoom: 0 },
      pickUnit: () => target, pick: () => target, pickWorldObject: () => null,
      picking: { pickPerson: () => target.id }, onChange() {}, onSound() {},
      acknowledgePointer() {}, orderSound() {}, objectPanels: { releaseBuildingInspection() {} } }
    scene.updateDrag = event => updateDrag(scene, event)
    skipIntroduction(scene)
    assert.equal(world.inputMask, 0)
    const event = { pointerId: 1, button: 0, buttons: 1, clientX: 818, clientY: 294,
      ctrlKey: false, shiftKey, altKey: false, metaKey: false }
    pointerDown(scene, event)
    assert.equal(scene.down.unit, shiftKey ? undefined : 20)
    pointerUp(scene, { ...event, buttons: 0 })
    assert.deepEqual(world.selected, [54]); assert.equal(world.paused, paused)
    if (!paused && shiftKey) {
      assert.equal(actor.target, 20); assert.equal(world.lastOrderTurn, world.turn)
      assert.ok(actor.path.length > 0, 'actual pointer caller must issue the ordinary approach path')
    } else {
      assert.equal(actor.target, null); assert.equal(world.lastOrderTurn, lastOrderTurn)
      assert.deepEqual(actor.path, [])
    }
  })
}
