import assert from 'node:assert/strict'
import test from 'node:test'
import { installSpySourceObserver } from '../scripts/tutorial-browser/spy-source-observer.mjs'

// Callback ownership contract only. Supplied logical states are not browser evidence.
function fixture(t, original = function () { return 'original' }) {
  const keys = ['window', 'document', 'requestAnimationFrame', 'cancelAnimationFrame']
  const saved = new Map(keys.map(k => [k, Object.getOwnPropertyDescriptor(globalThis, k)]))
  const native = { substate: 1, object: 48, timer: 1, f2: 0, flags2: 0 }
  const world = { turn: 10, speed: 1, paused: false, units: [{ id: 7, hp: 100, native, target: 8 }] }
  const clock = { afterTurn: original }
  const descriptor = Object.getOwnPropertyDescriptor(clock, 'afterTurn')
  const scene = { world, gameClock: clock, renderer: { domElement: {} } }
  const win = { testSceneRef: { current: scene }, testStore: { getWorld: () => world } }
  const globals = { window: win, document: {}, requestAnimationFrame: () => assert.fail('Controlled observer must not schedule RAF'), cancelAnimationFrame: () => {} }
  for (const [k, value] of Object.entries(globals)) Object.defineProperty(globalThis, k, { configurable: true, writable: true, value })
  t.after(() => {
    win.__pndSpySourceObservation?.stop()
    for (const [k, descriptor] of saved)
      if (descriptor) Object.defineProperty(globalThis, k, descriptor)
      else delete globalThis[k]
  })
  installSpySourceObserver({ spyId: 7, targetId: 8, controlled: true })
  return { win, scene, world, clock, native, descriptor, result: win.__pndSpySourceObservation.result,
    stop: () => win.__pndSpySourceObservation.stop() }
}

test('logical Spy ledger retains adjacent entry visits even without a render between them', t => {
  const f = fixture(t)
  Object.assign(f.native, { substate: 2, flags2: 0x40000000, timer: 0 })
  f.world.turn++; f.clock.afterTurn()
  Object.assign(f.native, { object: 136, flags2: 0, timer: 23, f2: 0 })
  f.world.turn++; f.clock.afterTurn()
  assert.deepEqual(f.result.turnSamples.map(s => [s.turn, s.object, s.timer, s.f2]), [[11, 48, 0, 0], [12, 136, 23, 0]])
  assert.deepEqual(f.result.samples, [], 'Logical samples never invent raster frames or crops')
  assert.deepEqual(f.result.crops, [])
  f.stop(); assert.deepEqual(Object.getOwnPropertyDescriptor(f.clock, 'afterTurn'), f.descriptor)
})

test('Spy wrapper forwards receiver, arguments and return once', t => {
  const calls = [], expected = Symbol('return')
  const f = fixture(t, function (...args) { calls.push([this, args]); return expected })
  const receiver = {}, args = [Symbol('arg'), {}]
  assert.equal(Reflect.apply(f.clock.afterTurn, receiver, args), expected)
  assert.deepEqual(calls, [[receiver, args]])
  assert.equal(f.result.nonAdvancingCallbacks, 1)
})

for (const value of [undefined, null, false, 0, '', Symbol('failure')])
  test(`Spy wrapper preserves original thrown ${String(value)}`, t => {
    const f = fixture(t, () => { throw value }); let caught = false
    try { f.clock.afterTurn() } catch (error) { caught = true; assert.equal(error, value) }
    assert.equal(caught, true)
    assert.notEqual(f.result.error, null)
    assert.deepEqual(Object.getOwnPropertyDescriptor(f.clock, 'afterTurn'), f.descriptor)
  })

test('Spy ledger rejects a missed advancing callback rather than manufacturing it', t => {
  const f = fixture(t); f.world.turn += 2; f.clock.afterTurn()
  assert.match(f.result.error, /consecutive logical turn/)
  assert.deepEqual(f.result.turnSamples, [])
})

test('Spy ledger preserves a foreign accessor without invoking it', t => {
  const f = fixture(t); let reads = 0
  const foreign = { configurable: true, get() { reads++; return () => {} } }
  Object.defineProperty(f.clock, 'afterTurn', foreign)
  const descriptor = Object.getOwnPropertyDescriptor(f.clock, 'afterTurn')
  f.stop(); assert.equal(reads, 0); assert.equal(f.result.hook.foreign, true)
  assert.deepEqual(Object.getOwnPropertyDescriptor(f.clock, 'afterTurn'), descriptor)
})

test('Spy logical and rendered ledgers share the unchanged600 sample ceiling', t => {
  const f = fixture(t); f.result.samples.length = 600
  f.world.turn++; f.clock.afterTurn()
  assert.match(f.result.error, /combined sample bound/)
  assert.equal(f.result.turnSamples.length, 0)
})


for (const owner of ['scene', 'world', 'clock'])
  test(`Spy observer restores its owned hook on stale ${owner}`, t => {
    const f = fixture(t)
    if (owner === 'scene') f.win.testSceneRef.current = {}
    if (owner === 'world') f.win.testStore.getWorld = () => ({})
    if (owner === 'clock') f.scene.gameClock = {}
    assert.equal(f.clock.afterTurn(), 'original')
    assert.match(f.result.error, /original Scene/)
    assert.deepEqual(Object.getOwnPropertyDescriptor(f.clock, 'afterTurn'), f.descriptor)
  })
