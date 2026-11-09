import assert from 'node:assert/strict'
import test from 'node:test'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { boardLiveVehicle, leaveLiveVehicle, nearestLiveBoat,
  removeMissingVehiclePassengers, syncLiveVehiclePassengers } from '../app/live-vehicles.ts'
import { objectsInCell } from '../app/object-cells.ts'
import { vehicleSeat } from '../app/vehicle-seats.ts'
import { createWorld } from '../app/world-initialization.ts'

const point = p => ({ x: p.x, y: p.y, h: p.h })
const cell = p => ((p.x >>> 8) & 254) | (p.y & 0xfe00)
function membership(w, p) {
  assert.equal(w.objectCells.objects.get(p.id), p)
  assert.deepEqual([...objectsInCell(w.objectCells, cell(p))].filter(o => o.id === p.id), [p])
}

// Controlled classic World: actual registration, boarding, departure/cleanup,
// selection and seat/cell publication. Readiness terrain and the second Boat are
// supplied; this is not ordinary acquisition, public input or Save/Load evidence.
function scenario() {
  const w = createWorld(5), boat = w.vehicles.find(v => v.model === 1),
    units = w.units.filter(u => u.team === 'blue' && u.inside === null).slice(0, 4)
  assert.ok(boat)
  assert.equal(units.length, 4)
  w.pathfinding.people.clear()
  const people = units.map(unit => {
    const p = createLivePerson(w, unit)
    unit.native = p
    w.pathfinding.people.set(p.id, p)
    registerLivePerson(w, p)
    return p
  })
  Object.assign(boat, { active: true, passengers: [], passengerCount: 0,
    speed: 0, physics: 2, navigationFlags: 0, reservation: 0 })
  const other = { ...boat, id: boat.id + 100000, x: (boat.x + 1024) & 65535, passengers: [] }
  w.vehicles = [other, boat]
  for (const v of w.vehicles) {
    const i = ((v.y >>> 9) & 127) * 128 + ((v.x >>> 9) & 127)
    w.land.flags[i] = 0
    w.land.categories[i] = 2
  }
  for (const p of people.slice(0, 3)) assert.equal(boardLiveVehicle(w, p, boat), true)
  return { w, boat, other, people }
}

for (const action of ['leave', 'missing']) for (const slot of [0, 1]) {
  test(`${action} slot${slot}: select and refill the sparse Boat without moving the tail passenger`, () => {
    const { w, boat, other, people } = scenario(), [driver, middle, tail, newcomer] = people,
      removed = people[slot], tailBefore = point(tail), rng = w.randomState,
      orders = structuredClone(w.buildingOrders), originalRoster = [...w.vehicles]
    if (action === 'leave') leaveLiveVehicle(w, boat, removed, { x: (boat.x + 2048) & 65535, y: boat.y })
    else w.units = w.units.filter(u => u.id !== removed.id)
    removeMissingVehiclePassengers(w)
    syncLiveVehiclePassengers(w, boat)
    const expectedDriver = slot === 0 ? middle : driver
    assert.deepEqual(boat.passengers, [expectedDriver.id, 0, tail.id])
    assert.equal(boat.passengerCount, 2)
    assert.deepEqual(point(tail), tailBefore)
    for (const p of [expectedDriver, tail]) membership(w, p)
    const beforeSearch = structuredClone(w), hypot = Math.hypot
    let distances = 0, selected
    Math.hypot = (...values) => { distances++; return hypot(...values) }
    try { selected = nearestLiveBoat(w, newcomer, boat, 0, 4096) }
    finally { Math.hypot = hypot }
    assert.equal(selected, boat)
    assert.equal(distances, 2, 'one distance per eligible Boat, including the farther first entry')
    assert.deepEqual(w, beforeSearch, 'selection must not mutate live state')
    assert.deepEqual(w.vehicles, originalRoster)
    assert.equal(w.vehicles[0], other)
    assert.equal(boardLiveVehicle(w, newcomer, selected), true)
    assert.deepEqual(boat.passengers, [expectedDriver.id, newcomer.id, tail.id])
    assert.equal(boat.passengerCount, 3)
    assert.deepEqual(point(newcomer), vehicleSeat(boat, 1))
    assert.deepEqual(point(tail), tailBefore)
    assert.equal(newcomer.vehicle, boat.id)
    for (const p of [expectedDriver, newcomer, tail]) membership(w, p)
    assert.deepEqual(w.buildingOrders, orders)
    assert.equal(w.randomState, rng)
    assert.equal(Math.hypot, hypot)
  })
}
