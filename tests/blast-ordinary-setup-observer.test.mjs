import assert from 'node:assert/strict'
import test from 'node:test'
import { observeBlastSetup } from '../qa/blast-ordinary/setup-observer.mjs'

// Fake records only: no simulation, browser, runtime module or imported fixture.
function fixture(clock = {}) {
  const native = { id: 8, class: 1, model: 7, tribe: 0, x: 300, y: 400, h: 90, flags2: 0, speed: 60,
    state: 10, commands: [2], commandCursor: 0, immediateCommand: 0, damageAttacker: 3 }
  const actor = { id: 8, team: 'blue', kind: 'shaman', hp: 500, x: 3, z: 4, native, fight: null, inside: null }
  const enemy = { id: 13, team: 'green', kind: 'warrior', hp: 100, x: 4, z: 4 }
  const world = { units: [actor, enemy], selected: [8], turn: 70, time: 70 / 12, status: 'playing', paused: false, speed: 1,
    mode: null, shots: { blast: 4 }, outcome: { level: 2 }, effects: [], objectCells: { objects: new Map([[8, native]]) },
    buildingOrders: { records: [null, null, { model: 3, flags: 0, references: 1, object: 0, a: 400, b: 500 }] } }
  const scene = { world, gameClock: clock, renderer: { domElement: { isConnected: true } }, pointerAck: { target: 0, until: 0 } }
  let currentScene = scene, currentWorld = world
  const options = { getScene: () => currentScene, getWorld: () => currentWorld }
  return { scene, world, actor, enemy, native, options, replaceScene: value => { currentScene = value }, replaceWorld: value => { currentWorld = value } }
}

test('wrappers preserve receiver, argument objects, results and exact descriptors without record mutation', () => {
  const calls = [], beforeResult = {}, afterResult = {}, clock = {}
  function before(...args) { calls.push({ kind: 'before', receiver: this, args }); return beforeResult }
  function after(...args) { calls.push({ kind: 'after', receiver: this, args }); return afterResult }
  Object.defineProperty(clock, 'beforeTurn', { value: before, writable: true, configurable: false, enumerable: false })
  Object.defineProperty(clock, 'afterTurn', { value: after, writable: false, configurable: true, enumerable: true })
  const descriptors = Object.getOwnPropertyDescriptors(clock), f = fixture(clock), original = structuredClone(f.world)
  const observer = observeBlastSetup(f.scene, f.actor, f.options), receiver = {}, args = [{ x: 1 }, 7]
  assert.equal(clock.beforeTurn.apply(receiver, args), beforeResult)
  assert.equal(clock.afterTurn.apply(receiver, args), afterResult)
  assert.equal(calls.length, 2)
  assert.ok(calls.every(call => call.receiver === receiver && call.args[0] === args[0] && call.args[1] === 7))
  assert.deepEqual(f.world, original)
  const result = observer.finish()
  assert.deepEqual(Object.getOwnPropertyDescriptors(clock), descriptors)
  assert.equal(result.cleanupVerified, true)
  assert.deepEqual(result.recent.map(row => row.stage), ['before', 'after'])
  assert.equal(result.firstFailure, null)
  assert.deepEqual(observer.finish(), result)
})

test('at most96 boundary samples are retained and returned records cannot mutate the history', () => {
  const f = fixture(), observer = observeBlastSetup(f.scene, f.actor, f.options)
  for (let turn = 70; turn < 140; turn++) { f.world.turn = turn; f.scene.gameClock.beforeTurn(); f.scene.gameClock.afterTurn() }
  const result = observer.read()
  assert.equal(result.totalBoundaries, 140); assert.equal(result.recent.length, 96); assert.equal(result.dropped, 44)
  assert.equal(result.recent[0].turn, 92)
  result.recent[0].actor.hp = -1
  assert.equal(observer.read().recent[0].actor.hp, 500)
  assert.equal(observer.finish().cleanupVerified, true)
  assert.throws(() => observeBlastSetup(f.scene, f.actor, { ...f.options, capacity: 97 }), /capacity/)
})

test('first death/removal identity failure survives later reincarnation and ring eviction', () => {
  const f = fixture(), observer = observeBlastSetup(f.scene, f.actor, { ...f.options, capacity: 4 })
  f.actor.hp = 0; f.actor.fight = { opponent: 13, group: 1, action: 'strike', motion: f.native }
  f.world.units = [f.enemy]; f.world.objectCells.objects.delete(8)
  const failed = observer.snapshot()
  assert.equal(failed.actor.hp, 0); assert.equal(failed.actor.pose.damageAttacker, 3)
  assert.equal(failed.opponent.id, 13)
  assert.equal(failed.actor.registration.present, false)
  assert.ok(failed.failures.includes('actorHealth')); assert.ok(failed.failures.includes('originalActorPresent'))
  const replacement = { ...f.actor, hp: 500, fight: null }; f.world.units.push(replacement)
  for (let i = 0; i < 10; i++) { f.world.turn++; f.scene.gameClock.beforeTurn(); f.scene.gameClock.afterTurn() }
  const result = observer.finish()
  assert.deepEqual(result.firstFailure, failed)
  assert.equal(result.latest.identity.sameIdIsOriginal, false)
  assert.equal(result.latest.sameIdActor.hp, 500)
  assert.equal(result.recent.length, 4)
})

test('telemetry includes actual person owner/order, selected recipients and pointer acknowledgement/markers', () => {
  const f = fixture(), observer = observeBlastSetup(f.scene, f.actor, f.options)
  f.actor.flight = f.native; f.actor.native = null
  f.native.immediateCommand = 2
  f.scene.pointerAck = { target: 13, until: 1234 }
  f.world.selected = [8, 13, 999]
  f.world.effects.push({ id: 31, kind: 'orderMarker', x: 10, z: 20, age: 0, duration: 1, turnsRemaining: 5 })
  f.world.mode = 'blast'; f.world.shots.blast = 3
  const row = observer.snapshot()
  assert.equal(row.actor.pose.owner, 'flight'); assert.equal(row.actor.order.id, 2); assert.equal(row.actor.order.model, 3)
  assert.equal(row.actor.registration.sameId, true); assert.equal(row.actor.registration.activeOwnerMatches, true)
  assert.deepEqual(row.actor.registration.owners, ['flight'])
  assert.deepEqual(row.selected, [8, 13, 999]); assert.equal(row.recipients[2].person, null)
  assert.deepEqual(row.pointerAck, { target: 13, until: 1234 }); assert.equal(row.orderMarkers[0].id, 31)
  assert.equal(row.mode, 'blast'); assert.equal(row.stock, 3)
  observer.finish()
})

test('caller-supplied pure currentOrder receives the pinned World and current person', () => {
  const f = fixture(), seen = [], order = { model: 19, flags: 50, references: 1, object: 13, a: 8, b: 2056 }
  const observer = observeBlastSetup(f.scene, f.actor, { ...f.options, currentOrder(world, person) {
    seen.push({ world, person }); return order
  } })
  assert.equal(observer.read().attached, true)
  const snapshot = observer.snapshot()
  assert.equal(snapshot.actor.order.model, 19)
  assert.ok(seen.every(call => call.world === f.world && call.person === f.native))
  assert.deepEqual(order, { model: 19, flags: 50, references: 1, object: 13, a: 8, b: 2056 })
  assert.equal(observer.finish().attachmentVerified, true)
})

test('scene/store/world replacement is captured instead of thrown into a callback', () => {
  const f = fixture(), observer = observeBlastSetup(f.scene, f.actor, f.options)
  f.replaceScene({}); f.replaceWorld({}); f.scene.world = {}
  assert.doesNotThrow(() => f.scene.gameClock.beforeTurn())
  const report = observer.finish()
  assert.equal(report.firstFailure.identity.scene, false)
  assert.equal(report.firstFailure.identity.sceneWorld, false)
  assert.equal(report.firstFailure.identity.storeWorld, false)
  assert.equal(report.firstFailure.actor.id, 8)
})

test('telemetry errors cannot mask the original return or exception', () => {
  const originalFailure = new Error('Original callback failure'), clock = { beforeTurn() { return 19 }, afterTurn() { throw originalFailure } }
  const f = fixture(clock), observer = observeBlastSetup(f.scene, f.actor, f.options)
  Object.defineProperty(f.actor, 'hp', { get() { throw Error('Telemetry getter failure') }, configurable: true })
  assert.equal(clock.beforeTurn(), 19)
  assert.throws(() => clock.afterTurn(), error => error === originalFailure)
  const report = observer.finish()
  assert.ok(report.errorCount >= 2); assert.ok(report.errors.some(error => error.message.includes('Telemetry getter failure')))
  assert.equal(report.cleanupVerified, true)
})

test('inherited callbacks restore without residual own properties; changed ownership is preserved and reported', () => {
  const prototype = { beforeTurn() { return 4 }, afterTurn() { return 5 } }, clock = Object.create(prototype), f = fixture(clock)
  const observer = observeBlastSetup(f.scene, f.actor, f.options)
  assert.equal(clock.beforeTurn(), 4); assert.equal(clock.afterTurn(), 5)
  assert.equal(observer.finish().cleanupVerified, true)
  assert.deepEqual(Object.getOwnPropertyNames(clock), [])
  const second = observeBlastSetup(f.scene, f.actor, f.options), replacement = () => 99
  clock.beforeTurn = replacement
  const result = second.finish()
  assert.equal(clock.beforeTurn, replacement); assert.equal(clock.afterTurn, prototype.afterTurn)
  assert.equal(result.cleanupVerified, false)
  assert.ok(result.errors.some(error => error.message.includes('ownership changed')))
})

test('unsupported descriptors are rejected before either callback is installed', () => {
  let getterCalls = 0
  const clock = { beforeTurn() { return 1 } }
  Object.defineProperty(clock, 'afterTurn', { get() { getterCalls++; return () => {} }, configurable: true })
  const descriptors = Object.getOwnPropertyDescriptors(clock), f = fixture(clock), observer = observeBlastSetup(f.scene, f.actor, f.options)
  const result = observer.finish()
  assert.equal(getterCalls, 0); assert.deepEqual(Object.getOwnPropertyDescriptors(clock), descriptors)
  assert.equal(result.finished, true); assert.equal(result.errorCount, 1); assert.equal(result.attachmentVerified, false)
})
