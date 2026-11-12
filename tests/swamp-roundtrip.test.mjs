import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import vm from 'node:vm'

// Actual selected handler bodies, with supplied scene/picker/command boundaries.
// This is not DOM input, camera rendering, or real World removal acceptance.
const source = readFileSync(new URL('../app/scene-input-runtime.ts', import.meta.url), 'utf8')
const js = stripTypeScriptTypes(source)
function body(name) {
  const start = js.indexOf(`export function ${name}(`)
  assert.ok(start >= 0)
  const end = js.indexOf('\nexport ', start + 1)
  return js.slice(start, end < 0 ? undefined : end).replace('export function', 'function')
}
function fixture() {
  const calls = { remove: 0, cancel: 0, ack: 0, sound: 0, camera: 0 }
  const context = vm.createContext({
    Math, performance,
    queueBuildingInspection() {}, cancelTooltipInspection() {},
    dragCamera() { calls.camera++ }, browserPosition() { return {} },
    nativePosition() { return { x: 0, y: 0 } }, commandMarkerPoint() { return null },
    removeOwnedSwamp() { calls.remove++; return true },
    cancelInteraction() { calls.cancel++ },
  })
  vm.runInContext(['pointerMove', 'pointerUp', 'cancelPointerGesture'].map(body).join('\n'), context)
  const scene = {
    modalSuspended: false, pointerGesture: { pointerId: 1, button: 2, moved: false },
    world: { inputMask: 0, selected: [], mode: null }, overviewStage: 0, overviewActive: false,
    down: { x: 0, y: 0 }, dragLast: { x: 0, y: 0 }, cameraMotion: {},
    cameraPosition: { angle: 0 }, cameraVelocity: {}, globeMotion: {},
    drag: null, dragActive: { value: false }, selectionOverlay: {},
    captureCamera() {}, updateView() {}, onChange() {},
    pick() { return {} }, picking: { pick() { return null } },
    acknowledgePointer() { calls.ack++ }, onSound() { calls.sound++ },
  }
  const event = (x, y, extra = {}) => ({ pointerId: 1, button: 2, buttons: 2,
    clientX: x, clientY: y, shiftKey: true, ctrlKey: false, altKey: false, metaKey: false, ...extra })
  return { scene, calls, move: (x, y, extra) => context.pointerMove(scene, event(x, y, extra)),
    up: (x = 0, y = 0, extra) => context.pointerUp(scene, event(x, y, { buttons: 0, ...extra })),
    cancel: () => context.cancelPointerGesture(scene, 1) }
}
test('stationary Shift-right release retains removal and one acknowledgment', () => {
  const f = fixture(); f.up()
  assert.deepEqual(f.calls, { remove: 1, cancel: 0, ack: 1, sound: 1, camera: 0 })
})
test('out-and-back drag never becomes Swamp removal; cancellation is retained', () => {
  const f = fixture(); f.move(20, 0); f.move(0, 0); f.up()
  assert.equal(f.calls.remove, 0); assert.equal(f.calls.cancel, 1)
  assert.equal(f.calls.ack, 0); assert.equal(f.calls.sound, 0); assert.equal(f.calls.camera, 2)
})
test('large final displacement still follows existing no-click return', () => {
  const f = fixture(); f.move(20, 0); f.up(20, 0)
  assert.equal(f.calls.remove, 0); assert.equal(f.calls.cancel, 0)
})
test('threshold boundary preserves original at-most-seven-pixel click', () => {
  const f = fixture(); f.move(7, 0); f.move(0, 0); f.up()
  assert.equal(f.calls.remove, 1)
})
test('diagonal excursion is latched using Euclidean distance', () => {
  const f = fixture(); f.move(6, 6); f.move(0, 0); f.up()
  assert.equal(f.calls.remove, 0)
})
test('other pointer cannot poison owned gesture', () => {
  const f = fixture(); f.move(20, 0, { pointerId: 2 }); f.up()
  assert.equal(f.calls.remove, 1); assert.equal(f.calls.camera, 0)
})
test('cancelled pointer cannot remove on later release', () => {
  const f = fixture(); f.move(20, 0); f.cancel(); f.up()
  assert.equal(f.calls.remove, 0); assert.equal(f.calls.cancel, 0)
})
test('unmodified out-and-back release keeps ordinary cancellation', () => {
  const f = fixture(); f.move(20, 0); f.move(0, 0); f.up(0, 0, { shiftKey: false })
  assert.equal(f.calls.remove, 0); assert.equal(f.calls.cancel, 1)
})
test('each actual pointerDown initializes a fresh movement latch', () => {
  assert.ok(source.includes('scene.pointerGesture = { pointerId: event.pointerId, button: event.button, moved: false }'))
})
