import assert from 'node:assert/strict'
import test from 'node:test'
import vm from 'node:vm'
import { installCorpseCameraFollow } from '../scripts/tutorial-browser/follower-corpse-camera.mjs'
import { installFollowerCorpseObserver } from '../scripts/tutorial-browser/follower-corpse-observer.mjs'

function fixture({ focus } = {}) {
  const actor = { id: 1235, kind: 'brave', team: 'blue', hp: 100, x: 115, z: 122,
    target: 20, path: [{ x: 91, z: 119 }], fight: null }
  const world = { units: [actor], mode: null, inputMask: 0, paused: false, turn: 100, time: 100 / 12,
    lightView: { x: 1, y: 2 }, randomState: 98765, lastOrderTurn: 100, selected: [1235], landVersion: 1, terrainVersion: 1 }
  const scene = { world, renderer: { info: { render: { frame: 200 } } }, cameraBearing: 1,
    cameraPosition: { x: 1, y: 2, angle: 523 }, overviewActive: false, overviewStage: 0,
    resultCamera: { active: false }, viewTransition: null, tooltip: { draw: 3 } }
  const calls = [], pending = new Map(); let id = 0, timestamp = 0
  scene.focus = focus ?? ((point, options) => {
    calls.push({ point, options }); scene.cameraPosition.x = point.x; scene.cameraPosition.y = point.z
    scene.world.mode = null; scene.tooltip.draw = 0; scene.world.lightView = { x: point.x, y: point.z }
  })
  let listener = null
  const observer = { result: { actorId: 1235, segment: 'original', effectId: null, death: null, done: false, error: null },
    afterObservedRender: fn => { listener = fn; return () => { listener = null } } }
  const window = { testSceneRef: { current: scene }, testStore: { getWorld: () => world }, __pndCorpseObservation: observer }
  const context = vm.createContext({ window, requestAnimationFrame: fn => { pending.set(++id, fn); return id },
    cancelAnimationFrame: key => pending.delete(key) })
  const install = vm.runInContext(`(${installCorpseCameraFollow.toString()})`, context)
  const order = { actorId: 1235, target: 20, selected: [1235], paused: false, lastOrderTurn: 100 }
  const arm = protocol => install({ order, protocol })
  const tick = (recordObserver = true, increment = 1) => {
    timestamp += 16; scene.renderer.info.render.frame += increment
    const data = { renderTimestampMs: timestamp, stamp: scene.renderer.info.render.frame }
    if (recordObserver) observer.result.lastVisit = data
    listener?.(data)
  }
  return { world, actor, scene, calls, pending, observer, window, arm, tick, order, listening: () => !!listener }
}

test('serialized corpse follower runs after observer, retains actor and preserves supplied gameplay World/order/RNG except declared camera lighting', () => {
  const f = fixture(), before = structuredClone(f.world)
  f.arm(); assert.equal(f.calls.length, 0)
  f.tick(); f.tick()
  assert.deepEqual({ ...f.world, lightView: before.lightView }, before)
  assert.deepEqual(f.world.lightView, { x: f.actor.x, y: f.actor.z })
  assert.equal(f.calls.length, 2); assert.equal(f.pending.size, 0, 'Camera never adds an independent RAF')
  assert.equal(f.window.__pndCorpseCameraFollow.result.visits.length, 2)
  assert.equal(f.scene.tooltip.draw, 0, 'documented focus UI side effect')
  assert.equal(f.window.__pndCorpseCameraFollow.result.error, null)
  f.window.__pndCorpseCameraFollow.stop(); assert.equal(f.listening(), false)
})

test('follower rejects unsafe focus guards before any camera/World mutation', () => {
  for (const change of [f => { f.world.mode = 'blast' }, f => { f.world.inputMask = 1 },
    f => { f.world.paused = true }, f => { f.scene.overviewActive = true },
    f => { f.scene.resultCamera.active = true }, f => { f.world.landVersion = 0 },
    f => { f.order.target = 13 }, f => { f.observer.result.effectId = 99 }]) {
    const f = fixture(); change(f); const before = structuredClone(f.world)
    assert.throws(f.arm); assert.equal(f.pending.size, 0); assert.equal(f.calls.length, 0); assert.deepEqual(f.world, before)
  }
})

test('follower rejects out-of-order callback instead of pairing new bounds with old pixels', () => {
  const f = fixture(); f.arm(); f.tick(false)
  assert.match(f.window.__pndCorpseCameraFollow.result.error, /follow this frame/)
  assert.equal(f.listening(), false)
  assert.equal(f.calls.length, 0); assert.equal(f.pending.size, 0)
})

test('follower stops on first observer terminal and cleanup is idempotent', () => {
  const f = fixture(); f.arm(); f.tick(); f.observer.result.done = true; f.tick()
  assert.equal(f.calls.length, 1); assert.equal(f.pending.size, 0)
  assert.equal(f.window.__pndCorpseCameraFollow.result.terminal.reason, 'observer-terminal')
  const terminal = JSON.stringify(f.window.__pndCorpseCameraFollow.result.terminal)
  f.window.__pndCorpseCameraFollow.stop(); f.window.__pndCorpseCameraFollow.stop()
  assert.equal(JSON.stringify(f.window.__pndCorpseCameraFollow.result.terminal), terminal)
})

test('follower does not switch actor identity or survive a new order', () => {
  for (const change of [f => { f.world.units[0] = { ...f.actor } }, f => { f.world.lastOrderTurn++ }]) {
    const f = fixture(); f.arm(); change(f); f.tick()
    assert.ok(f.window.__pndCorpseCameraFollow.result.error); assert.equal(f.calls.length, 0); assert.equal(f.pending.size, 0)
  }
})

test('follower detects a bad focus implementation changing RNG or forcing a render', () => {
  for (const mutation of [f => { f.world.randomState++ }, f => { f.scene.renderer.info.render.frame++ }]) {
    const f = fixture(); f.scene.focus = () => mutation(f); f.arm(); f.tick()
    assert.ok(f.window.__pndCorpseCameraFollow.result.error); assert.equal(f.pending.size, 0)
  }
})


test('corpse follower stops at the original observed death without selecting another target', () => {
  const f = fixture(); f.arm(); f.tick(); f.observer.result.death = { effectId: 2215 }; f.world.units.length = 0; f.tick()
  assert.equal(f.calls.length, 1); assert.equal(f.pending.size, 0)
  assert.equal(f.window.__pndCorpseCameraFollow.result.error, null)
  assert.equal(f.window.__pndCorpseCameraFollow.result.terminal.reason, 'original-death-observed')
})

test('repeated stamp skips focus; backwards or mismatched newer stamp fails closed', () => {
  for (const backwards of [false, true]) {
    const f = fixture(); f.arm(); f.tick(true, 0); assert.equal(f.calls.length, 0)
    f.tick(); f.tick(true, 0)
    const follow = f.window.__pndCorpseCameraFollow.result
    assert.equal(follow.error, null); assert.equal(follow.visits.length, 1)
    assert.equal(follow.visits[0].afterStamp, follow.armedStamp + 1)
    if (backwards) f.tick(true, -1)
    else f.tick(false)
    assert.match(follow.error, /follow this frame/); assert.equal(f.listening(), false)
  }
})

function realObserverFixture(segment = 'original') {
  const f = fixture(), { world, scene } = f, events = []
  const canvas = { width: 100, height: 100, isConnected: true, getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) }
  scene.renderer.domElement = canvas
  scene.renderer.getRenderTarget = () => null
  scene.gameClock = { animationFrame: 100 }; scene.camera = {}; scene.fxMeshes = new Map()
  scene.view = { screen: () => ({ x: 0, y: 0, z: 0 }), painter: { source: () => true } }
  world.effects = []; f.actor.fight = { group: 38, opponent: 20, action: 'ready' }
  const focus = scene.focus
  scene.focus = (...args) => { events.push('focus'); focus(...args) }
  let stampTime = 10, advanceStamp = true
  Object.setPrototypeOf(scene, {
    renderSceneFrame() { if (advanceStamp) scene.renderer.info.render.frame++ },
    dispose() { scene.stockDisposed = true },
  })
  const context = vm.createContext({ window: f.window, performance: { now: () => stampTime + .4 },
    document: { visibilityState: 'visible', elementFromPoint: () => canvas, querySelectorAll: () => [],
      createElement: () => ({ getContext: () => ({ drawImage: () => events.push('crop-copy') }) }) } })
  const install = fn => vm.runInContext(`(${fn.toString()})`, context)
  install(installFollowerCorpseObserver)({ actorId: 1235, segment })
  const attach = () => install(installCorpseCameraFollow)({ order: f.order })
  const frame = (elapsed = 16) => {
    stampTime += elapsed; scene.renderSceneFrame()
  }
  const die = () => {
    world.units = []; world.turn++
    world.effects.push({ id: 2215, x: f.actor.x, z: f.actor.z,
      unit: { kind: 'brave', team: 'blue', heading: 2 }, animation: { object: 304 }, corpse: { phase: 0 } })
    scene.fxMeshes.set(2215, { visible: true, position: {}, userData: {
      bounds: { left: -3, right: 3, top: -4, bottom: 4 }, layers: [] } })
  }
  return { ...f, events, frame, die, attach, hasBinding: () => Object.hasOwn(scene, 'renderSceneFrame'),
    invalidate: () => { advanceStamp = false; frame() },
    dispose: () => { scene.dispose(); assert.equal(scene.stockDisposed, true) },
    observation: f.window.__pndCorpseObservation }
}

test('real serialized observer captures phase-zero death/crop before follower detaches, without a test RAF', () => {
  const f = realObserverFixture()
  f.attach(); assert.equal(f.pending.size, 0); assert.equal(f.hasBinding(), true)
  f.frame(19); assert.deepEqual(f.events, ['focus'])
  f.die(); f.frame(13)
  const follow = f.window.__pndCorpseCameraFollow.result, observation = f.observation.result
  assert.deepEqual(f.events, ['focus', 'crop-copy'])
  assert.equal(follow.error, null); assert.equal(follow.visits.length, 1)
  assert.equal(follow.terminal.reason, 'original-death-observed')
  assert.equal(observation.death.before.fight.opponent, 20)
  assert.equal(observation.samples[0].stamp, follow.terminal.stamp)
  assert.equal(observation.crops[0].stamp, follow.terminal.stamp)
  assert.equal(f.hasBinding(), true, 'only ongoing crop observation survives')
})

test('real hook receives already-copied bytes and is single-use, disabled for loaded segments', () => {
  const f = realObserverFixture(), captured = []
  const detach = f.observation.afterObservedRender(frame => {
    captured.push([f.observation.result.death?.effectId, f.observation.result.crops.length, frame.stamp])
  })
  assert.throws(() => f.observation.afterObservedRender(() => {}), /one live post-capture hook/)
  f.frame(); f.die(); f.frame()
  assert.deepEqual(captured, [[undefined, 0, 201], [2215, 1, 202]])
  detach()
  assert.throws(() => f.observation.afterObservedRender(() => {}), /one live post-capture hook/)
  const loaded = realObserverFixture('loaded')
  assert.throws(loaded.attach, /Matching original corpse observer required/)
  assert.throws(() => loaded.observation.afterObservedRender(() => {}), /one live post-capture hook/)
})

test('hook throw is terminal; cleanup leaves no further render binding', () => {
  const f = realObserverFixture()
  f.observation.afterObservedRender(() => { throw new Error('after-capture hook fault') })
  f.frame()
  assert.match(f.observation.result.error, /after-capture hook fault/)
  assert.equal(f.observation.result.terminal.reason, 'error')
  assert.equal(f.hasBinding(), false)
})

test('stale stamps, offscreen targets and scene disposal terminate the exact bound observer', () => {
  const stale = realObserverFixture()
  stale.frame(); stale.invalidate()
  assert.match(stale.observation.result.error, /new ordinary default-target render/)
  assert.equal(stale.hasBinding(), false)
  const offscreen = realObserverFixture()
  offscreen.scene.renderer.getRenderTarget = () => ({})
  offscreen.frame()
  assert.match(offscreen.observation.result.error, /new ordinary default-target render/)
  assert.equal(offscreen.hasBinding(), false)
  const disposed = realObserverFixture()
  disposed.dispose()
  assert.equal(disposed.observation.result.terminal.reason, 'scene-disposed')
  assert.equal(disposed.hasBinding(), false)
})
