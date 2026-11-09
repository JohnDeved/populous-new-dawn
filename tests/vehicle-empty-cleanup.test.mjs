import assert from 'node:assert/strict'
import test from 'node:test'
import { isDeepStrictEqual } from 'node:util'
import { removeMissingVehiclePassengers } from '../app/live-vehicles.ts'
import { deferVehicleOrdinaryVisit, finishVehicleOrdinaryVisits } from '../app/vehicle-allocation.ts'
import { createWorld } from '../app/model.ts'

const craft = (id, passengers, fields = {}) => ({
  id, model: 1, active: true, passengers, passengerCount: passengers.filter(Boolean).length,
  speed: 42, ...fields,
})
const world = vehicles => ({ units: [{ id: 11 }, { id: 12 }, { id: 13 }], vehicles })

// Observe roster entry reads while delegating to the original entries. Restore
// descriptors before inspecting or cloning values; this is not a timing test.
function visits(w, action = () => removeMissingVehiclePassengers(w)) {
  const roster = w.units, descriptors = Object.getOwnPropertyDescriptors(roster)
  let reads = 0
  for (let i = 0; i < roster.length; i++) {
    const value = roster[i]
    Object.defineProperty(roster, i, { configurable: true, enumerable: true,
      get() { reads++; return value } })
  }
  try { action(); return reads }
  finally { Object.defineProperties(roster, descriptors) }
}

for (const [label, make] of [
  ['no vehicles', () => world([])],
  ['only inactive occupied vehicles', () => world([craft(70, [11], { active: false })])],
  ['only deferred occupied vehicles', () => {
    const w = world([craft(70, [11])]); deferVehicleOrdinaryVisit(w, w.vehicles[0]); return w
  }],
  ['active empty passenger arrays', () => world([craft(70, []), craft(71, [])])],
  ['active physical slots containing only zero', () => world([craft(70, [0, 0, 0, 0, 0])])],
  ['mixed empty and skipped vehicles', () => {
    const w = world([craft(70, [11], { active: false }), craft(71, []),
      craft(72, [12]), craft(73, [0, 0])])
    deferVehicleOrdinaryVisit(w, w.vehicles[2]); return w
  }],
]) test(`${label} do not read the follower roster`, () => {
  const w = make(), before = structuredClone(w), skipped = new Set(w.vehicles
    .filter(v => !v.active || v.passengerCount).map(v => v.id))
  assert.equal(visits(w), 0)
  for (let i = 0; i < w.vehicles.length; i++) {
    const v = w.vehicles[i], prior = before.vehicles[i]
    assert.deepEqual(v, skipped.has(v.id) ? prior : { ...prior, passengerCount: 0, speed: -1 })
  }
  assert.deepEqual(w.units, before.units)
})

test('several occupied craft share one roster snapshot and preserve physical holes', () => {
  const w = world([craft(70, [99, 12, 13, 0, 0]), craft(71, [11, 99, 13])])
  const units = structuredClone(w.units)
  assert.equal(visits(w), w.units.length)
  assert.deepEqual(w.vehicles.map(v => v.passengers), [[12, 0, 13, 0, 0], [11, 0, 13]])
  assert.deepEqual(w.vehicles.map(v => [v.passengerCount, v.speed]), [[2, 42], [2, 42]])
  assert.deepEqual(w.units, units)
})

test('all missing occupied seats clear their slots and stop the empty craft', () => {
  const w = world([craft(70, [91, 92, 0, 93])])
  assert.equal(visits(w), 3)
  assert.deepEqual(w.vehicles[0], craft(70, [0, 0, 0, 0], { speed: -1 }))
})

test('each new call observes same-turn roster replacement and new occupants', () => {
  const w = world([craft(70, [11, 12, 13])])
  assert.equal(visits(w), 3)
  w.units = [{ id: 12 }, { id: 14 }]
  w.vehicles[0].passengers.push(14)
  assert.equal(visits(w), 2)
  assert.deepEqual(w.vehicles[0].passengers, [12, 0, 0, 14])
  assert.equal(w.vehicles[0].passengerCount, 2)
  w.units = []
  assert.equal(visits(w), 0)
  assert.deepEqual(w.vehicles[0].passengers, [0, 0, 0, 0])
  assert.equal(w.vehicles[0].speed, -1)
})

test('ending allocation deferral admits the next cleanup without stale retention', () => {
  const w = world([craft(70, [11, 99])])
  deferVehicleOrdinaryVisit(w, w.vehicles[0])
  const before = structuredClone(w)
  assert.equal(visits(w), 0)
  assert.deepEqual(w, before)
  finishVehicleOrdinaryVisits(w)
  assert.equal(visits(w), 3)
  assert.deepEqual(w.vehicles[0].passengers, [11, 0])
  assert.equal(w.vehicles[0].passengerCount, 1)
})

test('zero, sparse entries and unusual nonzero IDs retain existing Set membership semantics', () => {
  const slots = [0, 2 ** 40, -2, NaN, 99]
  delete slots[4]
  const w = { units: [0, 2 ** 40, -2, NaN].map(id => ({ id })), vehicles: [craft(70, slots)] }
  assert.equal(visits(w), 4)
  assert.deepEqual(w.vehicles[0].passengers, [2 ** 40, 0, -2, NaN, ,])
  assert.equal(w.vehicles[0].passengerCount, 2)
  assert.equal(w.vehicles[0].speed, 42)
})

for (const mode of ['classic', 'scalable']) test(`authored Mission 5 empty craft cleanup preserves the complete ${mode} World`, () => {
  const w = createWorld(5, mode)
  assert.ok(w.units.length > 0)
  assert.ok(w.vehicles.length > 0)
  assert.ok(w.vehicles.every(v => !v.passengerCount && v.passengers.every(id => id === 0)))
  const expected = structuredClone(w)
  for (const v of expected.vehicles) if (v.active) { v.passengerCount = 0; v.speed = -1 }
  assert.equal(visits(w), 0)
  assert.ok(isDeepStrictEqual(w, expected), 'complete World values, RNG, orders and registries remain exact')
})

test('roster instrumentation restores descriptors even if its action throws', () => {
  const w = world([]), descriptors = Object.getOwnPropertyDescriptors(w.units), failure = {}
  assert.throws(() => visits(w, () => { throw failure }), error => error === failure)
  assert.deepEqual(Object.getOwnPropertyDescriptors(w.units), descriptors)
})
