import assert from 'node:assert/strict'
import test from 'node:test'
import { installHypnotiseObserver, validateHypnotiseObservation } from '../scripts/tutorial-browser/hypnotise-observer.mjs'

// Supplied browser/clock boundaries only. These tests acquire no World, DOM, GPU or pixels.
function fixture(t, original) {
  const saved = new Map(['window', 'document', 'requestAnimationFrame', 'cancelAnimationFrame']
    .map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  const frames = new Map(), calls = [], returned = Symbol('original return')
  let nextFrame = 0
  const flash = { id: 7, kind: 'hypnotise', team: 'blue', x: 1, z: 2, height: 0,
    turnsRemaining: 16, animation: { object: 1264, f1: 0, draw: 44, renderFlags: 0x104, palette: 0 } }
  const world = { turn: 20, effects: [flash], units: [], paused: false, speed: 1,
    shots: { hypnotise: 0 }, sounds: [{ cue: 0x2a, turn: 20, x: 1, z: 2 }] }
  const clock = {}
  Object.defineProperty(clock, 'afterTurn', { configurable: true, enumerable: false, writable: true,
    value: original ?? function (...args) { calls.push({ receiver: this, args }); return returned } })
  const descriptor = Object.getOwnPropertyDescriptor(clock, 'afterTurn')
  const scene = { world, gameClock: clock,
    renderer: { domElement: { isConnected: true }, info: { render: { frame: 0 } },
      getContext: () => ({ isContextLost: () => false }) },
    fxMeshes: new Map([[7, { visible: false, userData: { sequence: 'hypnotise',
      sprite: { visible: false, material: {}, userData: {},
        scale: { toArray: () => [100, 100, 1] }, center: { toArray: () => [0.5, 0] } } } }]]),
    view: { painter: { source: () => null } } }
  const win = { testSceneRef: { current: scene }, testStore: { getWorld: () => world } }
  const globals = { window: win, document: { visibilityState: 'visible' },
    requestAnimationFrame: callback => { frames.set(++nextFrame, callback); return nextFrame },
    cancelAnimationFrame: id => { frames.delete(id) } }
  for (const [key, value] of Object.entries(globals))
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
  t.after(() => {
    win.__pndHypnotiseObservation?.retain()
    for (const [key, descriptor] of saved)
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
  })
  const start = (observationMs = 12000) => installHypnotiseObserver({ observationMs })
  const frame = () => {
    const [id, callback] = frames.entries().next().value ?? []
    assert.ok(callback, 'An actual requested test RAF callback must exist')
    frames.delete(id)
    scene.renderer.info.render.frame++
    if (!world.effects.includes(flash)) scene.fxMeshes.delete(flash.id)
    callback()
  }
  const advance = count => {
    for (let i = 0; i < count; i++) {
      world.turn++
      flash.turnsRemaining--
      if (flash.turnsRemaining === 11)
        world.units = [90, 91].map(id => ({ id, team: 'blue', hypnotise: { originalTeam: 'red' } }))
      if (!flash.turnsRemaining) world.effects = []
      clock.afterTurn()
    }
  }
  const restored = () => assert.deepEqual(Object.getOwnPropertyDescriptor(clock, 'afterTurn'), descriptor)
  return { start, frame, advance, restored, clock, descriptor, scene, world, flash, win,
    frames, calls, returned, observation: () => win.__pndHypnotiseObservation }
}

test('Hypnotise turn observer sees the exact fifth visit between catch-up RAF frames', t => {
  const f = fixture(t)
  f.start(); f.frame(); f.advance(4); f.frame(); f.advance(2); f.frame()
  const { result } = f.observation()
  assert.deepEqual(result.samples.map(s => s.remaining), [16, 12, 10])
  assert.deepEqual(result.turnSamples.filter(s => s.remaining === 12 || s.remaining === 11), [
    { turn: 24, id: 7, remaining: 12, converted: [] },
    { turn: 25, id: 7, remaining: 11, converted: [90, 91] },
  ])
  f.advance(10)
  f.restored()
  assert.equal(result.done, false, 'Logical expiry must not invent the post-render terminal sample')
  assert.equal(f.scene.fxMeshes.has(7), true)
  f.frame()
  assert.equal(result.terminal.reason, 'logical-expiry')
  assert.equal(result.terminal.meshPresent, false)
  assert.equal(result.terminal.turn, 36)
  assert.deepEqual(result.hook, { installed: true, restored: true, foreign: false })
  assert.equal(f.frames.size, 0)
})

test('Hypnotise turn observer does not rewrite a later RAF terminal turn as exact expiry', t => {
  const f = fixture(t)
  f.start(); f.frame(); f.advance(16)
  f.restored()
  f.world.turn++ // A supplied next World turn before the next presentation callback.
  f.clock.afterTurn()
  f.frame()
  assert.equal(f.observation().result.terminal.turn, 37)
  assert.equal(f.observation().result.terminal.remaining, 0)
  assert.equal(f.observation().result.terminal.turn - f.observation().result.bornTurn, 17)
  assert.deepEqual(f.observation().result.logicalExpiry, { turn: 36, id: 7, remaining: 0, present: false })
  // Keep actual late RAF time separate; never invent earlier pixels.
})

test('Hypnotise turn observer forwards original receiver, arguments and return exactly once', t => {
  const f = fixture(t), receiver = {}, args = [{}, Symbol('argument')]
  f.start()
  assert.equal(Reflect.apply(f.clock.afterTurn, receiver, args), f.returned)
  assert.equal(f.calls.length, 1)
  assert.equal(f.calls[0].receiver, receiver)
  assert.deepEqual(f.calls[0].args, args)
  f.observation().retain(); f.restored()
  assert.equal(f.observation().result.terminal.reason, 'retained-before-completion')
})

test('Hypnotise turn observer does not label non-advancing callbacks as distinct turns', t => {
  const f = fixture(t)
  f.start(); f.frame()
  f.clock.afterTurn(); f.clock.afterTurn()
  assert.equal(f.observation().result.nonAdvancingCallbacks, 2)
  assert.deepEqual(f.observation().result.turnSamples, [])
  f.advance(1)
  assert.deepEqual(f.observation().result.turnSamples.map(s => s.turn), [21])
})

test('Hypnotise turn observer rejects a missing advancing callback rather than inventing it', t => {
  const f = fixture(t)
  f.start(); f.frame()
  f.world.turn += 2
  assert.equal(f.clock.afterTurn(), f.returned)
  assert.match(f.observation().result.error, /missed a consecutive advancing World turn/)
  assert.deepEqual(f.observation().result.turnSamples, [])
  f.restored()
})

for (const thrown of [undefined, null, false, 0, '', Symbol('failure'), new Error('original')])
  test(`Hypnotise turn observer preserves original thrown value ${String(thrown)}`, t => {
    let calls = 0
    const f = fixture(t, function () { calls++; throw thrown })
    f.start()
    let caught = false
    try { f.clock.afterTurn() }
    catch (value) { caught = true; assert.equal(value, thrown) }
    assert.equal(caught, true)
    assert.equal(calls, 1)
    assert.equal(f.observation().result.terminal.reason, 'error')
    assert.notEqual(f.observation().result.error, null)
    f.restored()
    assert.equal(f.frames.size, 0)
  })

for (const owner of ['scene', 'world', 'clock'])
  test(`Hypnotise turn observer restores its hook on stale ${owner} without throwing into gameplay`, t => {
    const f = fixture(t)
    f.start(); f.frame()
    if (owner === 'scene') f.win.testSceneRef.current = {}
    if (owner === 'world') f.win.testStore.getWorld = () => ({})
    if (owner === 'clock') f.scene.gameClock = {}
    assert.equal(f.clock.afterTurn(), f.returned)
    assert.match(f.observation().result.error, /original Scene\/world\/clock/)
    f.restored()
  })

test('Hypnotise turn observer shares one 2048-entry ceiling with RAF observations', t => {
  const f = fixture(t)
  f.start(); f.frame()
  const { result } = f.observation()
  result.samples.length = 2047 // A bounded supplied ledger, not game state or fabricated browser evidence.
  f.advance(1)
  assert.equal(result.samples.length + result.turnSamples.length, 2048)
  assert.doesNotThrow(() => f.advance(1))
  assert.equal(result.samples.length + result.turnSamples.length, 2048)
  assert.match(result.error, /sample storage exceeded/)
  f.restored()
})

test('Hypnotise RAF append also obeys the combined ledger ceiling', t => {
  const f = fixture(t)
  f.start(); f.frame()
  const { result } = f.observation()
  result.turnSamples.length = 2047
  f.frame()
  assert.equal(result.samples.length + result.turnSamples.length, 2048)
  assert.match(result.error, /sample storage exceeded/)
  f.restored()
})

test('Hypnotise turn observer preserves a foreign accessor without invoking its getter', t => {
  const f = fixture(t)
  f.start(); f.frame()
  let reads = 0
  const foreign = { configurable: true, enumerable: true, get() { reads++; throw Error('foreign getter') } }
  Object.defineProperty(f.clock, 'afterTurn', foreign)
  const descriptor = Object.getOwnPropertyDescriptor(f.clock, 'afterTurn')
  f.observation().retain()
  assert.equal(reads, 0)
  assert.deepEqual(Object.getOwnPropertyDescriptor(f.clock, 'afterTurn'), descriptor)
  assert.equal(f.observation().result.hook.foreign, true)
  assert.equal(f.observation().result.hook.restored, false)
})

test('Hypnotise RAF detects and preserves a foreign callback replacement', t => {
  const f = fixture(t), foreign = () => 'successor'
  f.start(); f.frame()
  f.clock.afterTurn = foreign
  f.frame()
  assert.equal(f.clock.afterTurn, foreign)
  assert.match(f.observation().result.error, /owned afterTurn descriptor/)
  assert.equal(f.observation().result.hook.foreign, true)
  assert.equal(f.frames.size, 0)
})

test('Hypnotise terminal snapshot failure cannot mask the original falsy thrown value', t => {
  const f = fixture(t, () => { throw 0 })
  f.start()
  Object.defineProperty(f.scene.renderer, 'info', { get() { throw Error('snapshot failure') } })
  let caught = false
  try { f.clock.afterTurn() }
  catch (value) { caught = true; assert.equal(value, 0) }
  assert.equal(caught, true)
  assert.deepEqual(f.observation().result.terminal, { reason: 'error', snapshotFailed: true })
  f.restored()
})

for (const exit of ['deadline', 'visibility', 'missing-callback'])
  test(`Hypnotise turn observer restores or leaves untouched its callback on ${exit}`, t => {
    const f = fixture(t)
    if (exit === 'missing-callback') delete f.clock.afterTurn
    f.start(exit === 'deadline' ? -1 : 12000)
    if (exit === 'visibility') document.visibilityState = 'hidden'
    if (exit !== 'missing-callback') f.frame()
    assert.equal(f.observation().result.done, true)
    assert.notEqual(f.observation().result.error, null)
    if (exit === 'missing-callback') assert.equal(Object.hasOwn(f.clock, 'afterTurn'), false)
    else f.restored()
    assert.equal(f.frames.size, 0)
  })

for (const turns of [1, 3]) test(`Hypnotise witnesses real birth before ${turns} catch-up turns preceding first RAF`, t => {
  const f = fixture(t)
  f.world.effects = []
  f.start()
  f.world.effects = [f.flash] // supplied public cast between presentation callbacks
  for (let i = 0; i < turns; i++) { f.clock.beforeTurn?.(); f.advance(1) }
  f.frame()
  const { result } = f.observation()
  assert.equal(result.bornTurn,20);assert.equal(result.birth.remaining,16);assert.equal(result.birth.cue,true)
  assert.equal(result.samples[0].remaining,16-turns,'RAF is retained as actually late, not invented birth pixels')
  for(let i=turns;i<16;i++){f.clock.beforeTurn?.();f.advance(1)}
  f.frame();f.restored()
  assert.equal(result.terminal.turn-result.bornTurn,16)
  assert.equal(Object.hasOwn(f.clock,'beforeTurn'),false)
  assert.deepEqual(result.birthHook,{installed:true,restored:true,foreign:false})
  assert.equal(result.turnSamples.find(s=>s.remaining===12).turn,24)
  assert.equal(result.turnSamples.find(s=>s.remaining===11).turn,25)
})
test('Hypnotise beforeTurn retains actual late birth rather than fabricating remaining or cue',t=>{
 const f=fixture(t);f.flash.turnsRemaining=15;f.world.sounds=[];f.start();f.clock.beforeTurn?.();f.frame()
 const r=f.observation().result;assert.equal(r.birth.remaining,15);assert.equal(r.birth.cue,false);assert.equal(r.bornTurn,20)
 f.advance(15);f.frame();assert.equal(r.terminal.turn-r.bornTurn,15)
 assert.throws(()=>validateHypnotiseObservation(r,{}),assert.AssertionError)
})
test('Hypnotise beforeTurn forwards own callback receiver/args/result and restores descriptor',t=>{
 const f=fixture(t),calls=[],returned=Symbol('before-return'),receiver={},args=[{},Symbol('arg')]
 Object.defineProperty(f.clock,'beforeTurn',{configurable:true,writable:false,enumerable:false,value:function(...a){calls.push({receiver:this,args:a});return returned}})
 const descriptor=Object.getOwnPropertyDescriptor(f.clock,'beforeTurn');f.start()
 assert.equal(Reflect.apply(f.clock.beforeTurn,receiver,args),returned);assert.deepEqual(calls,[{receiver,args}])
 f.observation().retain();assert.deepEqual(Object.getOwnPropertyDescriptor(f.clock,'beforeTurn'),descriptor);f.restored()
})
for(const failure of [null,undefined,false,0,'',new Error('before failure')])test(`Hypnotise beforeTurn preserves thrown ${String(failure)} and restores both hooks`,t=>{
 const f=fixture(t);let calls=0;const callback=()=>{calls++;throw failure};f.clock.beforeTurn=callback;f.start()
 let caught=false;try{f.clock.beforeTurn()}catch(e){caught=true;assert.equal(e,failure)}assert.ok(caught);assert.equal(calls,1)
 assert.equal(f.clock.beforeTurn,callback);f.restored();assert.equal(f.observation().result.birth,undefined)
 assert.equal(f.observation().result.terminal.reason,'error')
})
for(const kind of ['accessor','inherited','nonconfigurable'])test(`Hypnotise rejects unsupported ${kind} beforeTurn and rolls back installed afterTurn`,t=>{
 const f=fixture(t);let reads=0
 if(kind==='inherited')Object.setPrototypeOf(f.clock,{beforeTurn(){}})
 else Object.defineProperty(f.clock,'beforeTurn',kind==='accessor'?{configurable:true,get(){reads++;throw Error('getter')}}:{configurable:false,writable:false,value:()=>{}})
 const descriptor=Object.getOwnPropertyDescriptor(f.clock,'beforeTurn');f.start();f.restored()
 assert.equal(reads,0);assert.equal(f.observation().result.done,true);assert.notEqual(f.observation().result.error,null)
 assert.deepEqual(Object.getOwnPropertyDescriptor(f.clock,'beforeTurn'),descriptor)
})
for(const foreign of ['beforeTurn','afterTurn'])test(`Hypnotise independently restores other hook while preserving foreign ${foreign}`,t=>{
 const f=fixture(t);f.start();let reads=0
 Object.defineProperty(f.clock,foreign,{configurable:true,get(){reads++;throw Error('foreign getter')}})
 const descriptor=Object.getOwnPropertyDescriptor(f.clock,foreign);f.observation().retain()
 assert.equal(reads,0);assert.deepEqual(Object.getOwnPropertyDescriptor(f.clock,foreign),descriptor)
 if(foreign==='beforeTurn')f.restored();else assert.equal(Object.hasOwn(f.clock,'beforeTurn'),false)
})


// Validator-only supplied evidence. No browser or gameplay proof is fabricated.
function validEvidence() {
  return { error: null, bornTurn: 20, birth: { id: 7, remaining: 16, stock: 0, cue: true },
    logicalExpiry: { turn: 36, id: 7, remaining: 0, present: false },
    terminal: { reason: 'logical-expiry', turn: 37, present: false, meshPresent: false, remaining: 0 },
    birthHook: { installed: true, restored: true, foreign: false },
    hook: { installed: true, restored: true, foreign: false },
    samples: [0, 1].map(i => ({ id: 7, visible: true, frame: 1264 + i,
      object: 1264, draw: 44, f1: i * 4, sequence: 'hypnotise', flags: 0x104,
      palette: 0, opacity: 1, submitted: true, texture: '/original/effects.png',
      size: [100, 100, 1], center: [0.5, 0], uv: [100 / 2048, 100 / 256, i / 8, 1 - 100 / 256],
      cropFile: `supplied-${i}.png`, turn: 20 + i, stamp: 1 + i
    })).concat([{ object: 0x650, visible: false }]),
    turnSamples: [{ turn: 24, id: 7, remaining: 12, converted: [] },
      { turn: 25, id: 7, remaining: 11, converted: [90, 91] }],
    crops: [0, 1].map(i => ({ filename: `supplied-${i}.png`, frame: 1264 + i,
      turn: 20 + i, stamp: 1 + i, colors: 2 })) }
}
const suppliedAtlas = { width: 2048, height: 256,
  animations: { hypnotise: [{ source: 1264, index: 0 }, { source: 1265, index: 1 }] } }

for (const [name, change] of [
  ['fifteen visits', r => r.logicalExpiry.turn = 35],
  ['seventeen visits', r => r.logicalExpiry.turn = 37],
  ['missing logical witness', r => delete r.logicalExpiry],
  ['wrong owner', r => r.logicalExpiry.id = 8],
  ['remaining logical lifetime', r => r.logicalExpiry.remaining = 1],
  ['present logical effect', r => r.logicalExpiry.present = true],
  ['reversed presentation', r => r.terminal.turn = 35],
  ['present rendered effect', r => r.terminal.present = true],
  ['present rendered mesh', r => r.terminal.meshPresent = true],
  ['remaining rendered lifetime', r => r.terminal.remaining = 1],
]) test(`Hypnotise validator rejects ${name} with otherwise valid supplied evidence`, () => {
  const r = validEvidence(); change(r)
  assert.throws(() => validateHypnotiseObservation(r, suppliedAtlas), assert.AssertionError)
})
test('Hypnotise validator accepts separate expiry and later actual RAF with otherwise valid supplied evidence', () => {
  assert.doesNotThrow(() => validateHypnotiseObservation(validEvidence(), suppliedAtlas))
})
test('Hypnotise expiry rejects a skipped last callback instead of inventing its turn', t => {
  const f = fixture(t); f.start(); f.frame(); f.advance(15)
  f.world.turn += 2; f.flash.turnsRemaining = 0; f.world.effects = []
  f.clock.afterTurn()
  assert.match(f.observation().result.error, /expiry missed a consecutive/)
  assert.equal(f.observation().result.logicalExpiry, null); f.restored()
})

test('Hypnotise missing final callback cannot be replaced by RAF absence', t => {
  const f = fixture(t); f.start(); f.frame(); f.advance(15)
  f.world.turn++; f.flash.turnsRemaining = 0; f.world.effects = []
  f.frame()
  const { result } = f.observation()
  assert.equal(result.logicalExpiry, null)
  assert.equal(result.terminal.turn, 36)
  assert.equal(result.terminal.meshPresent, false)
  assert.throws(() => validateHypnotiseObservation(result, suppliedAtlas), /actual afterTurn expiry witness/)
  f.restored()
})
for (const lifetime of [15, 17]) test(`Hypnotise actual ${lifetime}-turn expiry is retained and rejected`, t => {
  const f = fixture(t); f.start(); f.frame()
  // Supplied simulation boundary changes lifetime only after the actual birth witness.
  f.flash.turnsRemaining = lifetime
  f.advance(lifetime); f.frame()
  const { result } = f.observation()
  assert.equal(result.birth.remaining, 16)
  assert.equal(result.logicalExpiry.turn - result.bornTurn, lifetime)
  assert.equal(result.logicalExpiry.remaining, 0)
  assert.equal(result.logicalExpiry.present, false)
  assert.throws(() => validateHypnotiseObservation(result, suppliedAtlas), assert.AssertionError)
  f.restored()
})
