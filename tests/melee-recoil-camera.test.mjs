import assert from 'node:assert/strict'
import test from 'node:test'
import vm from 'node:vm'
import { installRecoilCameraFollow } from '../scripts/tutorial-browser/melee-recoil-camera.mjs'

function fixture({ focus } = {}) {
  const actor = { id: 54, kind: 'shaman', team: 'blue', hp: 100, x: 115, z: 122,
    target: 20, path: [{ x: 91, z: 119 }], fight: null }
  const world = { units: [actor], mode: null, inputMask: 0, paused: false, turn: 100, time: 100 / 12,
    lightView: { x: 1, y: 2 }, randomState: 98765, lastOrderTurn: 100, selected: [54], landVersion: 1, terrainVersion: 1 }
  const pose=()=>({x:0,y:0,angle:0})
  world.cameras={phase:'idle',tribes:Array.from({length:4},pose),held:Array.from({length:4},pose),borrowed:Array.from({length:4},pose),
    motion:{active:0},result:{active:0},overviewActive:false,overviewStage:null,viewTransition:null,
    input:{buttons:0,pointer:null},keys:new Set(),velocity:{x:0,y:0},navigationTime:0}
  world.manaWorld={playerTribe:0};world.flyby={flags:0}
  Object.assign(world.cameras.tribes[0],{x:1,y:2,angle:523})
  const scene = { world, renderer: { info: { render: { frame: 200 } } }, cameraBearing: 523*Math.PI/1024,
    cameraPosition: world.cameras.tribes[0], cameraMotion:world.cameras.motion,keys:world.cameras.keys,cameraVelocity:world.cameras.velocity,
    overviewActive: false, overviewStage: null, started:true,previous:1000,gameClock:{afterTurn(){}},advanceInputTime(){},
    resultCamera: world.cameras.result, viewTransition: null, tooltip: { draw: 3 } }
  const calls = [], pending = new Map(); let id = 0, timestamp = 0
  scene.focus = focus ?? ((point, options) => {
    scene.advanceInputTime();calls.push({ point, options });const c=world.cameras,held=c.held[0]
    scene.cameraPosition.x = (Math.round((point.x+8)*256)-held.x)&65535; scene.cameraPosition.y = (Math.round((-point.z-8)*256)-held.y)&65535
    c.navigationTime=0;c.motion.active=0;for(let i=0;i<4;i++)Object.assign(c.borrowed[i],c.held[i])
    scene.cameraBearing=((scene.cameraPosition.angle+held.angle)&2047)*Math.PI/1024;scene.viewPoint={...point}
    scene.world.mode = null; scene.tooltip.draw = 0
  })
  const observer = { result: { protocol: 'running-native-recoil-entry-v1', firstAttackTurn: null, done: false, visits: [] } }
  const window = { testSceneRef: { current: scene }, testStore: { getWorld: () => world }, __pndMeleeObservation: observer }
  const context = vm.createContext({ window, structuredClone, requestAnimationFrame: fn => { pending.set(++id, fn); return id },
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

test('serialized recoil follower runs after observer, retains actor and preserves post-drain gameplay/lighting except exact logical camera target', () => {
  const f = fixture(), before = structuredClone(f.world)
  f.arm(); assert.equal(f.calls.length, 0)
  f.tick(); f.tick()
  assert.deepEqual({ ...f.world, cameras: before.cameras }, before)
  assert.deepEqual(f.world.lightView, before.lightView)
  assert.deepEqual(f.scene.cameraPosition,{x:(f.actor.x+8)*256,y:((-f.actor.z-8)*256)&65535,angle:523})
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

test('follower admits real supplied drain work but compares only the subsequent focus boundary',()=>{
  const f=fixture();let calls=0;const original=function(){assert.equal(this,f.scene);assert.equal(arguments.length,0);calls++;f.world.turn++;f.world.time+=1/12;f.world.randomState++;f.actor.x++}
  Object.defineProperty(f.scene,'advanceInputTime',{value:original,writable:true,configurable:true,enumerable:false})
  const descriptor=Object.getOwnPropertyDescriptor(f.scene,'advanceInputTime');f.arm();f.tick()
  assert.equal(calls,1);assert.equal(f.window.__pndRecoilCameraFollow.result.error,null)
  const visit=f.window.__pndRecoilCameraFollow.result.visits[0]
  assert.equal(visit.beforeDrainTurn,100);assert.equal(visit.turn,101);assert.equal(visit.sampledActor.x,115);assert.equal(visit.actor.x,116)
  assert.equal(visit.drainCalls,1);assert.deepEqual(Object.getOwnPropertyDescriptor(f.scene,'advanceInputTime'),descriptor)
})

test('follower rejects all undeclared mutations after an otherwise successful drained focus',()=>{
  for(const mutate of [f=>f.world.randomState++,f=>f.world.turn++,f=>f.world.time++,f=>f.world.lightView.x++,
    f=>f.world.cameras.tribes[1].x++,f=>f.world.cameras.held[0].y++,f=>f.world.cameras.navigationTime++,
    f=>f.world.cameras.keys.add('ArrowLeft'),f=>f.scene.viewPoint.x++,f=>f.scene.cameraBearing++,
    f=>f.scene.renderer.info.render.frame++,f=>f.world.cameras.tribes[1]={...f.world.cameras.tribes[1]}]){
    const f=fixture(),focus=f.scene.focus,original=f.scene.advanceInputTime
    f.scene.focus=(...args)=>{focus(...args);mutate(f)};f.arm();f.tick()
    assert.ok(f.window.__pndRecoilCameraFollow.result.error);assert.equal(f.pending.size,0)
    assert.equal(f.scene.advanceInputTime,original)
  }
})

test('follower restores inherited drain ownership and preserves falsey primary failures',()=>{
  for(const failure of [null,false,0,'']){
    const f=fixture();delete f.scene.advanceInputTime
    const original=function(){throw failure};Object.setPrototypeOf(f.scene,{advanceInputTime:original})
    f.arm();f.tick();const r=f.window.__pndRecoilCameraFollow.result
    assert.equal(r.error,String(failure));assert.equal(r.focusFailure.drainCalls,1);assert.equal(r.focusFailure.restorationError,null)
    assert.equal(Object.hasOwn(f.scene,'advanceInputTime'),false);assert.equal(f.scene.advanceInputTime,original)
  }
})

test('follower rejects duplicate absent or asynchronous drains and retains foreign owners',()=>{
  for(const kind of ['absent','duplicate','async','foreign']){
    const f=fixture(),focus=f.scene.focus,foreign=()=>{}
    if(kind==='absent')f.scene.focus=()=>{}
    if(kind==='duplicate')f.scene.focus=(...args)=>{focus(...args);f.scene.advanceInputTime()}
    if(kind==='async')f.scene.advanceInputTime=()=>Promise.resolve()
    if(kind==='foreign')f.scene.focus=(...args)=>{focus(...args);f.scene.advanceInputTime=foreign}
    f.arm();f.tick();assert.ok(f.window.__pndRecoilCameraFollow.result.error)
    if(kind==='foreign')assert.equal(f.scene.advanceInputTime,foreign)
    assert.equal(f.pending.size,0)
  }
})

test('follower rechecks store observer and camera eligibility after the real drain',()=>{
  for(const mutate of [f=>f.window.testStore={getWorld:()=>f.world},f=>f.window.testStore.getWorld=()=>f.world,
    f=>f.window.__pndMeleeObservation={...f.observer},f=>f.observer.result.done=true,
    f=>f.world.inputMask=64,f=>f.world.cameras.motion.active=1,f=>f.world.cameras.input.buttons=1]){
    const f=fixture();f.scene.advanceInputTime=()=>mutate(f);f.arm();f.tick()
    assert.ok(f.window.__pndRecoilCameraFollow.result.error);assert.equal(f.calls.length,0);assert.equal(f.pending.size,0)
  }
})

test('actual production focus and updateView retain lighting and only change declared logical camera target', async () => {
  const { loadSceneFixture } = await import('./support/bloodlust-scene.mjs')
  const api = await loadSceneFixture()
  const { focus, captureCamera, updateView } = await import('../app/scene-camera-runtime.ts')
  const { GameScene } = await import('../app/scene.ts')
  const { syncNativeTerrain } = await import('../app/world-terrain-runtime.ts')
  const world = api.createWorld(2); syncNativeTerrain(world)
  const actor = world.units.find(u => u.id === 54), player=world.manaWorld.playerTribe
  const scene=Object.assign(Object.create(GameScene.prototype),{world,started:false,cameraPreviewButtons:null,
    cameraBearing:523*Math.PI/1024,viewPoint:{x:0,z:0},tooltip:{draw:3},
    view:{update(){}},container:{clientWidth:816,clientHeight:720},viewZoom:1,viewPreset:0,
    commitSky(){},captureCamera(interrupt){captureCamera(this,interrupt)},updateView(){updateView(this)}})
  scene.cameraPosition.angle=523
  const before=structuredClone(world),expected=structuredClone(world),held=world.cameras.held[player]
  expected.cameras.navigationTime=0;expected.cameras.motion.active=0
  for(let i=0;i<4;i++)Object.assign(expected.cameras.borrowed[i],expected.cameras.held[i])
  expected.cameras.tribes[player].x=(Math.round((actor.x+8)*256)-held.x)&65535
  expected.cameras.tribes[player].y=(Math.round((-actor.z-8)*256)-held.y)&65535
  const oldDocument=Object.getOwnPropertyDescriptor(globalThis,'document')
  Object.defineProperty(globalThis,'document',{configurable:true,value:{documentElement:{clientWidth:960}}})
  try{focus(scene,{x:actor.x,z:actor.z},{animate:false})}
  finally{if(oldDocument)Object.defineProperty(globalThis,'document',oldDocument);else delete globalThis.document}
  assert.deepEqual(world,expected,'all unrelated World fields, lighting and other cameras remain exact')
  assert.deepEqual(world.lightView,before.lightView)
  assert.equal(scene.tooltip.draw,0)
  assert.equal(scene.cameraPosition.angle,523)
})


test('follower refuses a drain-disposed Scene even when its pose already matches the target',()=>{
  const f=fixture();f.scene.cameraPosition.x=(f.actor.x+8)*256;f.scene.cameraPosition.y=((-f.actor.z-8)*256)&65535
  f.scene.viewPoint={x:f.actor.x,z:f.actor.z}
  f.scene.advanceInputTime=()=>{f.scene.disposed=true}
  const original=f.scene.advanceInputTime
  f.scene.focus=()=>{f.scene.advanceInputTime();if(f.scene.disposed)return}
  f.arm();f.tick()
  assert.match(f.window.__pndRecoilCameraFollow.result.error,/live started Scene/)
  assert.equal(f.window.__pndRecoilCameraFollow.result.visits.length,0)
  assert.equal(f.scene.advanceInputTime,original);assert.equal(f.pending.size,0)
  for(const property of ['disposed','started']){
    const g=fixture();g.scene[property]=property==='disposed';assert.throws(g.arm,/live started Scene/);assert.equal(g.pending.size,0)
  }
})
