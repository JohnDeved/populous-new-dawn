import assert from 'node:assert/strict'
import test from 'node:test'
import vm from 'node:vm'
import { installRecoilCameraFollow } from '../scripts/tutorial-browser/melee-recoil-camera.mjs'

function fixture({ focus } = {}) {
  const actor = { id: 54, kind: 'shaman', team: 'blue', hp: 100, x: 115, z: 122,
    target: 20, path: [{ x: 91, z: 119 }], fight: null }
  const world = { units: [actor], mode: null, inputMask: 0, paused: false, turn: 100, time: 100 / 12,
    lightView: { x: 1, y: 2 }, randomState: 98765, lastOrderTurn: 100, selected: [54], landVersion: 1, terrainVersion: 1 }
  const scene = { world, renderer: { info: { render: { frame: 200 } } }, cameraBearing: 1,
    cameraPosition: { x: 1, y: 2, angle: 523 }, overviewActive: false, overviewStage: 0,
    resultCamera: { active: false }, viewTransition: null, tooltip: { draw: 3 } }
  const calls = [], pending = new Map(); let id = 0, timestamp = 0
  scene.focus = focus ?? ((point, options) => {
    calls.push({ point, options }); scene.cameraPosition.x = point.x; scene.cameraPosition.y = point.z
    scene.world.mode = null; scene.tooltip.draw = 0; scene.world.lightView = { x: point.x, y: point.z }
  })
  const observer = { result: { protocol: 'running-native-recoil-entry-v1', firstAttackTurn: null, done: false, visits: [] } }
  const window = { testSceneRef: { current: scene }, testStore: { getWorld: () => world }, __pndMeleeObservation: observer }
  const context = vm.createContext({ window, requestAnimationFrame: fn => { pending.set(++id, fn); return id },
    cancelAnimationFrame: key => pending.delete(key) })
  const install = vm.runInContext(`(${installRecoilCameraFollow.toString()})`, context)
  const order = { target: 20, selected: [54], paused: false, lastOrderTurn: 100 }
  const arm = () => install({ order })
  const tick = (recordObserver = true) => {
    timestamp += 16; scene.renderer.info.render.frame++
    if (recordObserver) observer.result.visits.push({ rafTimestampMs: timestamp, stamp: scene.renderer.info.render.frame, actorInspected: true })
    const callbacks = [...pending.values()]; pending.clear(); for (const fn of callbacks) fn(timestamp)
  }
  return { world, actor, scene, calls, pending, observer, window, arm, tick, order }
}

test('serialized recoil follower runs after observer, retains actor and preserves supplied gameplay World/order/RNG except declared camera lighting', () => {
  const f = fixture(), before = structuredClone(f.world)
  f.arm(); assert.equal(f.calls.length, 0)
  f.tick(); f.tick()
  assert.deepEqual({ ...f.world, lightView: before.lightView }, before)
  assert.deepEqual(f.world.lightView, { x: f.actor.x, y: f.actor.z })
  assert.equal(f.calls.length, 2)
  assert.equal(f.window.__pndRecoilCameraFollow.result.visits.length, 2)
  assert.equal(f.scene.tooltip.draw, 0, 'documented focus UI side effect')
  assert.equal(f.window.__pndRecoilCameraFollow.result.error, null)
  f.window.__pndRecoilCameraFollow.stop(); assert.equal(f.pending.size, 0)
})

test('follower rejects unsafe focus guards before any camera/World mutation', () => {
  for (const change of [f => { f.world.mode = 'blast' }, f => { f.world.inputMask = 1 },
    f => { f.world.paused = true }, f => { f.scene.overviewActive = true },
    f => { f.scene.resultCamera.active = true }, f => { f.world.landVersion = 0 },
    f => { f.order.target = 13 }, f => { f.observer.result.firstAttackTurn = 99 }]) {
    const f = fixture(); change(f); const before = structuredClone(f.world)
    assert.throws(f.arm); assert.equal(f.pending.size, 0); assert.equal(f.calls.length, 0); assert.deepEqual(f.world, before)
  }
})

test('follower rejects out-of-order callback instead of pairing new bounds with old pixels', () => {
  const f = fixture(); f.arm(); f.tick(false)
  assert.match(f.window.__pndRecoilCameraFollow.result.error, /follow this frame/)
  assert.equal(f.calls.length, 0); assert.equal(f.pending.size, 0)
})

test('follower stops on first observer terminal and cleanup is idempotent', () => {
  const f = fixture(); f.arm(); f.tick(); f.observer.result.done = true; f.tick()
  assert.equal(f.calls.length, 1); assert.equal(f.pending.size, 0)
  assert.equal(f.window.__pndRecoilCameraFollow.result.terminal.reason, 'observer-terminal')
  const terminal = JSON.stringify(f.window.__pndRecoilCameraFollow.result.terminal)
  f.window.__pndRecoilCameraFollow.stop(); f.window.__pndRecoilCameraFollow.stop()
  assert.equal(JSON.stringify(f.window.__pndRecoilCameraFollow.result.terminal), terminal)
})

test('follower does not switch actor identity or survive a new order', () => {
  for (const change of [f => { f.world.units[0] = { ...f.actor } }, f => { f.world.lastOrderTurn++ }]) {
    const f = fixture(); f.arm(); change(f); f.tick()
    assert.ok(f.window.__pndRecoilCameraFollow.result.error); assert.equal(f.calls.length, 0); assert.equal(f.pending.size, 0)
  }
})

test('follower detects a bad focus implementation changing RNG or forcing a render', () => {
  for (const mutation of [f => { f.world.randomState++ }, f => { f.scene.renderer.info.render.frame++ }]) {
    const f = fixture(); f.scene.focus = () => mutation(f); f.arm(); f.tick()
    assert.ok(f.window.__pndRecoilCameraFollow.result.error); assert.equal(f.pending.size, 0)
  }
})

test('actual production focus and updateView preserve all World fields except declared lighting viewpoint', async () => {
  const { loadSceneFixture } = await import('./support/bloodlust-scene.mjs')
  const api = await loadSceneFixture()
  const { focus, captureCamera, updateView } = await import('../app/scene-camera-runtime.ts')
  const { createCameraMotion } = await import('../app/camera-motion.ts')
  const { syncNativeTerrain } = await import('../app/world-terrain-runtime.ts')
  const world = api.createWorld(2); syncNativeTerrain(world)
  const before = structuredClone(world), actor = world.units.find(u => u.id === 54)
  assert.equal(world.mode, null)
  const scene = { world, cameraPreviewButtons: null, cameraBearing: 523 * Math.PI / 1024,
    viewPoint: { x: 0, z: 0 }, cameraMotion: createCameraMotion(), tooltip: { draw: 3 },
    view: { update() {} }, container: { clientWidth: 816, clientHeight: 720 }, viewZoom: 1, viewPreset: 0,
    overviewActive: false, overviewStage: 0, viewTransition: null,
    cancelOverview() {}, captureCamera() { captureCamera(this) }, updateView() { updateView(this) } }
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { documentElement: { clientWidth: 960 } } })
  try { focus(scene, { x: actor.x, z: actor.z }, { animate: false }) }
  finally { if (oldDocument) Object.defineProperty(globalThis, 'document', oldDocument); else delete globalThis.document }
  assert.deepEqual({ ...world, lightView: before.lightView }, before,
    'actual focus/updateView/nativePosition change no World field except camera lightView')
  assert.equal(world.lightView.x, scene.cameraPosition.x << 16 >> 16)
  assert.equal(world.lightView.y, scene.cameraPosition.y << 16 >> 16)
  assert.equal(scene.tooltip.draw, 0)
  assert.equal(scene.cameraPosition.angle, 523)
})
