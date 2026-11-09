import assert from 'node:assert/strict'
import test from 'node:test'
import { isDeepStrictEqual } from 'node:util'
import { createGameStore } from '../app/game-store.ts'
import { addUnit, browserPosition } from '../app/model.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { boardLiveVehicle, leaveLiveVehicle, nearestLiveBoat,
  removeMissingVehiclePassengers, syncLiveVehiclePassengers } from '../app/live-vehicles.ts'
import { objectsInCell } from '../app/object-cells.ts'
import { vehicleSeat } from '../app/vehicle-seats.ts'

const point = p => ({ x: p.x, y: p.y, h: p.h })
const packed = p => ((p.x >>> 8) & 254) | (p.y & 0xfe00)
function members(w, at) {
  return [...objectsInCell(w.objectCells, packed(at))].map(p => p.id)
}
function owner(w, id) {
  const unit = w.units.find(u => u.id === id), p = w.pathfinding.people.get(id)
  assert.ok(unit && p)
  assert.equal(unit.native, p)
  assert.equal(w.objectCells.objects.get(id), p)
  assert.equal(members(w, p).filter(n => n === id).length, 1)
  return p
}

// Shipping store/guard with supplied active craft and registered occupants.
// No IndexedDB, browser menu, ordinary acquisition or durable-save claim.
function scenario(level, model, removedSlot) {
  assert.equal(typeof globalThis.indexedDB, 'undefined', 'in-session Node fixture, not durable storage')
  const store = createGameStore()
  store.startMission(level)
  const w = store.getWorld(), v = w.vehicles.find(v => v.model === model)
  assert.deepEqual(w.capacityPolicy, { version: 1, mode: 'scalable' })
  assert.ok(v)
  Object.assign(v, { active: true, passengers: [], passengerCount: 0,
    speed: 0, physics: 2, navigationFlags: 0, reservation: 0 })
  const i = ((v.y >>> 9) & 127) * 128 + ((v.x >>> 9) & 127)
  w.land.flags[i] = 0
  w.land.categories[i] = 2
  const count = model === 1 ? 3 : 2, people = []
  for (let n = 0; n <= count; n++) {
    const unit = addUnit(w, 'blue', 'brave', browserPosition(v))
    const p = unit.native = createLivePerson(w, unit)
    w.pathfinding.people.set(p.id, p)
    registerLivePerson(w, p)
    people.push(p)
    if (n < count) assert.equal(boardLiveVehicle(w, p, v), true)
  }
  leaveLiveVehicle(w, v, people[removedSlot], { x: (v.x + 2048) & 65535, y: v.y })
  removeMissingVehiclePassengers(w)
  syncLiveVehiclePassengers(w, v)
  const expected = model === 1
    ? [people[removedSlot === 0 ? 1 : 0].id, 0, people[2].id]
    : [people[removedSlot === 0 ? 1 : 0].id, 0]
  assert.deepEqual(v.passengers, expected)
  assert.equal(v.passengerCount, count - 1)
  for (const id of expected.filter(Boolean)) owner(w, id)
  return { store, w, v, expected, newcomer: people[count].id }
}

function continuation(w, vehicleId, newcomerId, expected) {
  const v = w.vehicles.find(v => v.id === vehicleId), newcomer = owner(w, newcomerId)
  const retained = expected.filter(Boolean).map(id => [id, point(owner(w, id))])
  if (v.model === 1) assert.equal(nearestLiveBoat(w, newcomer, v, 0, 2048), v)
  assert.equal(boardLiveVehicle(w, newcomer, v), true)
  const boarded = [...expected]
  boarded[1] = newcomerId
  assert.deepEqual(v.passengers, boarded)
  assert.equal(v.passengerCount, boarded.filter(Boolean).length)
  assert.deepEqual(point(newcomer), vehicleSeat(v, 1))
  for (const [id, position] of retained) assert.deepEqual(point(owner(w, id)), position)
  const old = new Map(boarded.filter(Boolean).map(id => [id, point(owner(w, id))]))
  v.x = (v.x + 2048) & 65535
  syncLiveVehiclePassengers(w, v)
  for (const id of boarded.filter(Boolean)) {
    const p = owner(w, id)
    assert.equal(members(w, old.get(id)).includes(id), false)
    assert.deepEqual(point(p), vehicleSeat(v, boarded.indexOf(id)))
  }
  const beforeExit = point(newcomer)
  leaveLiveVehicle(w, v, newcomer, { x: (newcomer.x + 2048) & 65535, y: newcomer.y })
  assert.equal(newcomer.vehicle, 0)
  assert.deepEqual(v.passengers, expected)
  assert.equal(v.passengerCount, expected.filter(Boolean).length)
  assert.equal(members(w, beforeExit).includes(newcomerId), false)
  owner(w, newcomerId)
}

for (const [label, level, model] of [['Boat', 5, 1], ['Balloon', 22, 3]]) {
  for (const removedSlot of [0, 1]) {
    test(`${label} occupied sparse seats pass current store Save/Load and repeated continuation after slot${removedSlot} departure`, async () => {
      const { store, w, v, expected, newcomer } = scenario(level, model, removedSlot)
      const rng = w.randomState, orders = structuredClone(w.buildingOrders)
      assert.equal(await store.saveCheckpoint(), false, 'no IndexedDB write was available')
      assert.equal(store.hasCheckpoint(), true, 'the explicit in-session checkpoint exists')
      v.passengers.fill(0)
      v.passengerCount = 0
      assert.equal(store.loadCheckpoint(), true)
      const first = store.getWorld(), restored = first.vehicles.find(c => c.id === v.id)
      assert.notEqual(first, w)
      assert.notEqual(restored, v)
      assert.deepEqual(first.capacityPolicy, { version: 1, mode: 'scalable' })
      assert.deepEqual(restored.passengers, expected)
      assert.equal(restored.passengerCount, expected.filter(Boolean).length)
      assert.equal(first.randomState, rng)
      assert.deepEqual(first.buildingOrders, orders)
      for (const id of expected.filter(Boolean)) owner(first, id)
      assert.equal(store.loadCheckpoint(), true)
      const second = store.getWorld()
      assert.notEqual(second, first)
      continuation(first, v.id, newcomer, expected)
      continuation(second, v.id, newcomer, expected)
      assert.ok(isDeepStrictEqual(first, second), 'two actual loads retain deterministic complete-World continuation')
      assert.equal(first.randomState, rng)
      assert.deepEqual(first.buildingOrders, orders)
      assert.equal(store.loadCheckpoint(), true, 'continuations cannot mutate the retained checkpoint')
      assert.deepEqual(store.getWorld().vehicles.find(c => c.id === v.id).passengers, expected)
    })
  }
  for (const policy of [{ version: 1, mode: 'classic' }, { version: 0, mode: 'scalable' }]) {
    test(`${label} incompatible ${policy.mode}/v${policy.version} Save rejects without replacing the occupied checkpoint`, async () => {
      const { store, w, v, expected } = scenario(level, model, 1)
      assert.equal(await store.saveCheckpoint(), false)
      w.capacityPolicy = { ...policy }
      v.passengers.fill(0)
      v.passengerCount = 0
      await assert.rejects(store.saveCheckpoint(), { name: 'RangeError', message: 'Checkpoint is incompatible with this development version' })
      assert.deepEqual(w.capacityPolicy, policy, 'rejected save must not silently normalize incompatible state')
      assert.equal(store.loadCheckpoint(), true)
      const restored = store.getWorld()
      assert.deepEqual(restored.capacityPolicy, { version: 1, mode: 'scalable' })
      assert.deepEqual(restored.vehicles.find(c => c.id === v.id).passengers, expected)
      assert.equal(restored.vehicles.find(c => c.id === v.id).passengerCount, expected.filter(Boolean).length)
      for (const id of expected.filter(Boolean)) owner(restored, id)
    })
  }
}
