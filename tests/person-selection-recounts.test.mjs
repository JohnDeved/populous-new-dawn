import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, browserPosition } from '../app/model.ts'
import { createWorldState, addUnit } from '../app/world-state.ts'
import { TRIBE_TEAMS } from '../app/world-types.ts'
import { createLivePerson, registerLivePerson, changeLivePersonState } from '../app/live-people.ts'
import { boardLiveVehicle } from '../app/live-vehicles.ts'
import { markPersonSelected } from '../app/person-selection.ts'

// Supplied state transitions isolate selection recount work. Full simulation
// equivalence and wall-clock performance belong to separate paired replays.
function crowd(count = 32) {
  const w = createWorldState(1)
  for (let i = 0; i < count; i++) {
    const u = addUnit(w, TRIBE_TEAMS[i % TRIBE_TEAMS.length], 'brave', { x: i, z: 0 })
    u.native = createLivePerson(w, u)
    registerLivePerson(w, u.native)
  }
  w.selected = w.units.map(u => u.id)
  return { w, u: w.units[0], p: w.units[0].native }
}

function countRosterReads(w, subject) {
  const counts = { native: 0, includes: 0 }, peers = []
  for (const u of w.units) {
    if (u === subject) continue
    let native = u.native
    Object.defineProperty(u, 'native', {
      configurable: true,
      enumerable: true,
      get() { counts.native++; return native },
      set(value) { native = value },
    })
    peers.push(() => Object.defineProperty(u, 'native', {
      configurable: true, enumerable: true, writable: true, value: native,
    }))
  }
  const selected = w.selected
  Object.defineProperty(selected, 'includes', {
    configurable: true,
    value(...args) { counts.includes++; return Array.prototype.includes.apply(this, args) },
  })
  return {
    counts,
    restore() {
      for (const restore of peers) restore()
      delete selected.includes
    },
  }
}

test('ordinary person state transitions do not recount a selected crowd', () => {
  for (const next of [1, 10, 19, 25, 29, 44]) {
    const { w, u, p } = crowd(), beforeSelection = [...w.selected]
    const reads = countRosterReads(w, u)
    try {
      changeLivePersonState(w, u, next, p)
      assert.deepEqual(reads.counts, { native: 0, includes: 0 }, `state ${next}`)
    } finally {
      reads.restore()
    }
    assert.equal(p.state, next)
    assert.equal(u.native, p, 'initialization retains the existing physical person')
    assert.deepEqual(w.selected, beforeSelection)
  }
})

test('empty selection needs no roster reads when entering and leaving state 14', () => {
  const { w, u, p } = crowd()
  w.selected = []
  const reads = countRosterReads(w, u)
  try {
    changeLivePersonState(w, u, 14, p)
    assert.deepEqual(reads.counts, { native: 0, includes: 0 })
    assert.equal(p.selectionFlags & 128, 128)
    changeLivePersonState(w, u, 10, p)
    assert.deepEqual(reads.counts, { native: 0, includes: 0 })
    assert.equal(p.selectionFlags & 128, 0)
  } finally {
    reads.restore()
  }
  assert.deepEqual(w.selected, [], 'AI reservation is independent of player selection')
  assert.equal(p.previousState, 14)
})

test('state-14 transitions inspect each peer once without linear selection searches', () => {
  const { w, u, p } = crowd(64)
  // Duplicated/stale selections retain includes-style membership semantics.
  w.selected.push(u.id, w.units[4].id, 999999)
  const beforeSelection = [...w.selected], reads = countRosterReads(w, u)
  try {
    changeLivePersonState(w, u, 14, p)
    assert.deepEqual(reads.counts, { native: w.units.length - 1, includes: 0 })
    assert.equal(p.selectionFlags & 128, 128)
    changeLivePersonState(w, u, 10, p)
    assert.deepEqual(reads.counts, { native: 2 * (w.units.length - 1), includes: 0 })
    assert.equal(p.selectionFlags & 128, 0)
  } finally {
    reads.restore()
  }
  assert.deepEqual(w.selected, beforeSelection)
})

test('state-14 release preserves passenger deselection and nested seated resting', () => {
  for (const model of [1, 3]) {
    const w = createWorld(22), vehicle = w.vehicles.find(v => v.model === model)
    const units = []
    for (let i = 0; i < 2; i++) {
      const u = addUnit(w, 'blue', 'brave', browserPosition(vehicle))
      const p = (u.native = createLivePerson(w, u))
      registerLivePerson(w, p)
      w.pathfinding.people.set(p.id, p)
      assert.ok(boardLiveVehicle(w, p, vehicle))
      markPersonSelected(p, true)
      units.push(u)
    }
    const [u, passenger] = units, p = u.native
    w.selected = units.map(u => u.id)
    changeLivePersonState(w, u, 14, p)
    const seats = [...vehicle.passengers], orders = structuredClone(w.buildingOrders)
    const passengerBefore = structuredClone(passenger.native)
    changeLivePersonState(w, u, 17, p)
    assert.equal(p.state, 30, 'state 17 immediately initializes the seated resting state')
    assert.equal(p.previousState, 17)
    assert.equal(p.selectionFlags & 128, 0)
    assert.equal(passenger.native.selectionFlags, passengerBefore.selectionFlags & ~128)
    assert.equal(passenger.native.flags3, (passengerBefore.flags3 & ~128) >>> 0)
    passengerBefore.selectionFlags &= ~128
    passengerBefore.flags3 = (passengerBefore.flags3 & ~128) >>> 0
    assert.deepEqual(passenger.native, passengerBefore)
    assert.deepEqual(w.selected, [u.id])
    assert.deepEqual(vehicle.passengers, seats)
    assert.equal(vehicle.passengerCount, 2)
    assert.equal(p.vehicle, vehicle.id)
    assert.equal(passenger.native.vehicle, vehicle.id)
    assert.equal(w.objectCells.objects.get(p.id), p)
    assert.deepEqual(w.buildingOrders, orders)
  }
})
