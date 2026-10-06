import assert from 'node:assert/strict'
import test from 'node:test'
import { installRecoveryObserver } from './recovery-observation.mjs'

function fixture() {
  let now = 0, timeout, originalCalls = 0
  const person = { class: 1, model: 6, state: 10, substate: 11, commandStatus: 21, animationMode: 44, timer: 4,
    assignment: 768, object: 56, draw: 13, f1: 0, f2: 0, renderFlags: 384,
    workTarget: 84, stateObject: 902, commands: [], commandCursor: 0, immediateCommand: 47, vehicle: 0 }
  const unit = { id: 71, kind: 'firewarrior', team: 'blue', native: person, hp: 35, inside: null }, target = { id: 84, hp: 200 }
  const world = { turn: 120, paused: true, speed: 1, status: 'playing', inputMask: 0,
    units: [unit], buildings: [target], buildingOrders: { records: { 47: { model: 21, flags: 34 } } },
    effects: [901, 902].map(id => ({ id, firewarriorShot: { source: 71, target: 84, impact: id === 902, remaining: 16 } })) }
  const clock = { animationFrame: 240, animationTime: .02,
    afterTurn(...args) { assert.equal(this, clock); originalCalls++; return args } }
  const scene = { world, gameClock: clock }, identities = new WeakMap([[scene, 1], [world, 2], [unit, 3], [person, 4], [target, 5]])
  const realm = { testSceneRef: { current: scene }, testStore: { getWorld: () => world },
    nativeGuardIdentityRegistry: { epoch: 0, identities }, performance: { now: () => now },
    setTimeout: callback => { timeout = callback; return 1 }, clearTimeout: () => { timeout = null } }
  const expected = { actorId: 71, targetId: 84, startTurn: 120, orderId: 47, projectileIds: [901, 902],
    sceneIdentity: 1, worldIdentity: 2, unitIdentity: 3, nativeIdentity: 4, targetIdentity: 5, epoch: 0 }
  const original = clock.afterTurn, descriptor = Object.getOwnPropertyDescriptor(clock, 'afterTurn')
  const install = () => installRecoveryObserver(expected, realm)
  const step = (turn, phase, done = false) => {
    world.paused = false; world.turn = turn; person.animationMode = phase
    if (done) { person.immediateCommand = 0; person.commandStatus = 0; person.state = 17; world.effects = [] }
    return clock.afterTurn('unchanged', turn)
  }
  return { world, clock, person, unit, target, scene, realm, expected, original, descriptor, install, step,
    read: () => realm.firewarriorRecoveryObserver.read(), calls: () => originalCalls,
    expire: () => timeout(), time: value => { now = value } }
}

test('two turns in one RAF retain the captured volley phase40 before actual completion', () => {
  const f = fixture(); f.install()
  // A RAF-only reader sees only the last state of this synchronous catch-up batch.
  assert.deepEqual(f.step(121, 44), ['unchanged', 121])
  assert.deepEqual(f.step(122, 40), ['unchanged', 122])
  assert.deepEqual(f.step(123, 0, true), ['unchanged', 123])
  assert.equal(f.person.animationMode, 0)
  const result = f.read()
  assert.equal(result.failure, null); assert.equal(result.saw40, true); assert.equal(result.complete, true)
  assert.deepEqual(result.rows.map(row => [row.turn, row.native.animationMode]), [[121, 44], [122, 40], [123, 0]])
  assert.equal(f.calls(), 3); assert.equal(result.restored, true)
  assert.deepEqual(Object.getOwnPropertyDescriptor(f.clock, 'afterTurn'), f.descriptor)
  assert.deepEqual([f.clock.animationFrame, f.clock.animationTime], [240, .02])
})

test('the historically observed missing-turn sequence fails; no phase is reconstructed', () => {
  const f = fixture(); f.install(); f.step(121, 44); f.step(123, 0, true)
  assert.match(f.read().failure, /Missing adjacent/)
  assert.equal(f.read().saw40, false); assert.equal(f.read().complete, false)
  assert.deepEqual(f.read().rows.map(row => row.turn), [121]); assert.equal(f.clock.afterTurn, f.original)
})

test('adjacent completion without a real phase40 fails the original requirement', () => {
  const f = fixture(); f.install(); f.step(121, 0, true)
  assert.match(f.read().failure, /without a real phase40/); assert.equal(f.read().saw40, false)
})

test('original callback receiver, arguments, result and thrown error remain unchanged', () => {
  const f = fixture(), error = Error('original failure')
  f.clock.afterTurn = function (...args) { assert.equal(this, f.clock); assert.deepEqual(args, ['x']); throw error }
  const original = f.clock.afterTurn; f.install()
  assert.throws(() => f.clock.afterTurn('x'), actual => actual === error)
  assert.equal(f.clock.afterTurn, original); assert.match(f.read().failure, /Original afterTurn threw/)
})

test('a changed callback owner is retained rather than overwritten during cleanup', () => {
  const f = fixture(); f.install(); const replacement = () => 19; f.clock.afterTurn = replacement
  const result = f.realm.firewarriorRecoveryObserver.finish()
  assert.match(result.failure, /no longer owns/); assert.equal(f.clock.afterTurn, replacement)
})

test('lifetime and row bounds stop only observation and preserve original calls', () => {
  const timed = fixture(); timed.install(); timed.expire()
  assert.match(timed.read().failure, /lifetime bound/); assert.equal(timed.clock.afterTurn, timed.original)
  const rows = fixture(); rows.install()
  for (let i = 1; i <= 33; i++) assert.deepEqual(rows.step(120 + i, 44), ['unchanged', 120 + i])
  assert.equal(rows.read().rows.length, 32); assert.match(rows.read().failure, /row\/time bound/)
  assert.equal(rows.calls(), 33); assert.equal(rows.clock.afterTurn, rows.original)
})

for (const [name, change, expected] of [
  ['native owner', f => { f.unit.native = { ...f.person } }, /owner disappeared/],
  ['target identity', f => { f.world.buildings = [{ ...f.target }] }, /target identity/],
  ['projectile attribution', f => { f.world.effects[0].firewarriorShot.target++ }, /projectile attribution/],
  ['captured command', f => { f.person.immediateCommand++ }, /command or target/],
  ['tracked projectile', f => { f.person.stateObject = 999 }, /tracked projectile/],
]) test(`${name} drift fails without changing the original callback result`, () => {
  const f = fixture(); f.install(); change(f)
  assert.deepEqual(f.step(121, 40), ['unchanged', 121]); assert.match(f.read().failure, expected)
  assert.equal(f.clock.afterTurn, f.original)
})

test('arming outside the real captured pause does not install a callback', () => {
  const f = fixture(); f.world.paused = false
  assert.throws(f.install, /captured paused turn/); assert.equal(f.clock.afterTurn, f.original)
  assert.equal(f.realm.firewarriorRecoveryObserver, undefined)
})


test('an installation failure restores the existing callback before returning the error', () => {
  const f = fixture(), error = Error('timer unavailable')
  f.realm.setTimeout = () => { throw error }
  assert.throws(f.install, actual => actual === error)
  assert.equal(f.clock.afterTurn, f.original); assert.equal(f.realm.firewarriorRecoveryObserver, undefined)
})

test('diagnostic failures never replace an ordinary callback result', () => {
  const f = fixture(); f.install()
  Object.defineProperty(f.unit, 'native', { get() { throw { get message() { throw Error('message getter') } } } })
  assert.deepEqual(f.step(121, 40), ['unchanged', 121])
  assert.equal(f.clock.afterTurn, f.original); assert.equal(f.read().failure, 'Recovery observation failed')
})


test('retained post-turn projectile snapshots do not follow later payload mutation', () => {
  const f = fixture(); f.world.effects[0].firewarriorShot.destination = { x: 1, y: 2, h: 3 }; f.install()
  f.step(121, 44); f.world.effects[0].firewarriorShot.destination.x = 99
  assert.equal(f.read().rows[0].projectiles[0].destination.x, 1)
  f.realm.firewarriorRecoveryObserver.finish()
})
