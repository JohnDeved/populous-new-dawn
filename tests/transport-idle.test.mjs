import test from 'node:test'
import assert from 'node:assert/strict'
import { addUnit, browserPosition, command, createWorld, disguiseSelectedSpies, nativePosition, tick } from '../app/model.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { changeLivePersonState } from '../app/live-people.ts'
import { cancelLiveOrder } from '../app/live-movement.ts'
import { leaveLiveVehicle } from '../app/live-vehicles.ts'

// Staged Spy population/location, authored Mission22 transports, real command/boarding.
function aboard(model = 1) {
 const w = createWorld(22), v = w.vehicles.find(v => v.model === model)
 const landing = nativePosition(w, w.units.find(u => u.team === 'blue'))
 w.manaWorld.gameFlags = 32
 w.units = []; w.pathfinding.people.clear()
 const spy = addUnit(w, 'blue', 'spy', browserPosition(v))
 w.selected = [spy.id]
 assert.ok(command(w, { ...browserPosition(v), id: v.id }))
 for (let i = 0; i < 24 && !spy.native?.vehicle; i++) tick(w, 1 / 12)
 assert.equal(spy.native.vehicle, v.id)
 return { w, v, spy, landing }
}

test('shipped disguise completes aboard Boat, holds and accepts another command', () => {
  const { w, v, spy } = aboard()
  assert.equal(disguiseSelectedSpies(w, 2), true)
  tick(w, 1 / 12)
  assert.equal(spy.native.state, 30)
  assert.equal(spy.native.speed, 0)
  assert.ok(spy.native.assignment & 1)
  assert.equal(spy.native.disguise, (2 << 6) | 63)
  const position = [v.x, v.y]
  for (let i = 0; i < 63; i++) tick(w, 1 / 12)
  assert.equal(spy.native.state, 30)
  assert.equal(spy.native.vehicle, v.id)
  assert.equal(spy.native.disguise, 2 << 6)
  assert.deepEqual([v.x, v.y], position)
  assert.equal(disguiseSelectedSpies(w, 1), true)
  assert.equal(spy.native.state, 10)
  tick(w, 1 / 12)
  assert.equal(spy.native.state, 30)
  assert.equal(spy.native.disguise, (1 << 6) | 63)
})

test('Balloon passenger idle entry holds without advancing or consuming orders', () => {
 const { w, v, spy } = aboard(3)
 // Balloon disguise has a separate unported command-position consumer.
 cancelLiveOrder(w, spy)
 changeLivePersonState(w, spy, 17)
 assert.equal(spy.native.state, 30)
 assert.equal(spy.native.speed, 0)
 assert.ok(spy.native.assignment & 1)
 const position = [v.x, v.y]
 for (let i = 0; i < 8; i++) tick(w, 1 / 12)
 assert.equal(spy.native.state, 30)
 assert.equal(spy.native.vehicle, v.id)
 assert.deepEqual([v.x, v.y], position)
})

test('occupied state30 checkpoint resumes countdown without reinitializing motion or RNG', () => {
 const initial = aboard(), { spy } = initial
 assert.ok(disguiseSelectedSpies(initial.w, 2))
 tick(initial.w, 1 / 12)
 const w = migrateCheckpoint(structuredClone(initial.w)), u = w.units.find(u => u.id === spy.id)
 assert.equal(u.native.state, 30)
 assert.equal(u.native.vehicle, initial.v.id)
 for (let i = 0; i < 8; i++) { tick(initial.w, 1 / 12); tick(w, 1 / 12) }
 assert.deepEqual(u.native, spy.native)
 assert.equal(w.randomState, initial.w.randomState)
 assert.deepEqual(w.vehicles, initial.w.vehicles)
})

test('ordinary disembark clears vehicle and state30 returns to orders for one visit', () => {
 const { w, v, spy, landing } = aboard()
 assert.ok(disguiseSelectedSpies(w, 2)); tick(w, 1 / 12)
 // Isolate the existing detach consumer; travel/landing has separate integration coverage.
 leaveLiveVehicle(w, v, spy.native, landing)
 assert.equal(spy.native.vehicle, 0)
 assert.equal(spy.native.state, 30)
 tick(w, 1 / 12)
 assert.equal(spy.native.previousState, 30)
 assert.equal(spy.native.state, 10)
 tick(w, 1 / 12)
 assert.ok([17, 19, 1].includes(spy.native.state))
})

test('replacement disguise interrupts pending and partially completed aboard commands', () => {
 const { w, spy } = aboard()
 assert.ok(disguiseSelectedSpies(w, 2))
 assert.ok(disguiseSelectedSpies(w, 1))
 tick(w, 1 / 12)
 assert.equal(spy.native.state, 30)
 assert.equal(spy.native.disguise, (1 << 6) | 63)
 for (let i = 0; i < 7; i++) tick(w, 1 / 12)
 assert.equal(spy.native.disguise, (1 << 6) | 56)
 assert.ok(disguiseSelectedSpies(w, 3))
 tick(w, 1 / 12)
 assert.equal(spy.native.state, 30)
 assert.equal(spy.native.disguise, (3 << 6) | 63)
})
