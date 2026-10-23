import assert from 'node:assert/strict'
import test from 'node:test'
import { installHypnotiseObserver } from '../scripts/tutorial-browser/hypnotise-observer.mjs'

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
  // The unchanged rendered-oracle contract rejects this late terminal observation.
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
