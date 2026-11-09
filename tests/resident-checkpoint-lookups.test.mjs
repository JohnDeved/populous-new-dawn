// Supplied passive slots through actual current validation and in-session storage.
// No naturally reached housing, browser persistence, or performance benchmark.
import test from 'node:test'
import assert from 'node:assert/strict'
import { createGameStore, migrateCheckpoint } from '../app/game-store.ts'
import { addBuilding } from '../app/construction-runtime.ts'
import { addUnit } from '../app/world-state.ts'
import { createLivePerson } from '../app/live-people.ts'
import { buildingAdmission } from '../app/live-building-entry.ts'
import { residentPerson } from '../app/building-resident.ts'
import { restoreCapacityPolicy } from '../app/capacity-policy.ts'
import { attachPersonRoute } from '../app/person-routes.ts'

function suppliedResidents(count = 4) {
  const store = createGameStore(), w = store.getWorld()
  const template = addBuilding(w, 'blue', 'hut', { x: -2, z: 32 })
  buildingAdmission(w, template)
  w.buildings = w.buildings.filter(b => b !== template)
  const residents = [], buildings = []
  for (let i = 0; i < count; i++) {
    const b = structuredClone(template)
    b.id = 900 + i
    b.admission.id = b.id
    b.admission.occupants.fill(0)
    b.admission.inside = 3
    w.buildings.push(b)
    buildings.push(b)
    for (let slot = 0; slot < 3; slot++) {
      const u = addUnit(w, 'blue', 'brave', { x: b.x, z: b.z })
      u.inside = b.id
      const p = createLivePerson(w, u)
      u.resident = { building: b.id, slot, person: p }
      b.admission.occupants[slot] = u.id
      assert.equal(residentPerson(w, u), p)
      residents.push(u)
    }
  }
  restoreCapacityPolicy(w)
  return { store, w, residents, buildings }
}

function buildingReads(w, action) {
  let reads = 0
  const descriptors = w.buildings.map(b => [b, Object.getOwnPropertyDescriptor(b, 'id')])
  for (const [b, descriptor] of descriptors) Object.defineProperty(b, 'id', {
    configurable: true, enumerable: true, get() { reads++; return descriptor.value },
  })
  try { action() } finally {
    for (const [b, descriptor] of descriptors) Object.defineProperty(b, 'id', descriptor)
  }
  return reads
}

test('current capacity validation bounds building-ID reads without mutating residents', t => {
  const { w, residents } = suppliedResidents(32), before = structuredClone(w)
  const reads = buildingReads(w, () => restoreCapacityPolicy(w))
  assert.deepEqual(w, before)
  t.diagnostic(`${reads} building-ID reads for ${w.buildings.length} buildings and ${residents.length} residents`)
  assert.ok(reads <= w.buildings.length * 4, `${reads} building-ID reads for ${w.buildings.length} buildings`)
  assert.ok(residents.every(u => residentPerson(w, u) === u.resident.person))
})

test('resident-free validation does not construct an unused building lookup', () => {
  const { w, residents } = suppliedResidents(8)
  for (const u of residents) delete u.resident
  const reads = buildingReads(w, () => restoreCapacityPolicy(w))
  assert.equal(reads, w.buildings.length * 3, 'only the existing object-ID validation reads remain')
})

test('normalization retains first matching building and rejects duplicate or wrong physical slots', () => {
  const { w, residents, buildings } = suppliedResidents(2), first = residents[0], wrong = residents[1]
  const duplicate = structuredClone(buildings[0])
  duplicate.admission.occupants.fill(0)
  w.buildings.push(duplicate)
  wrong.resident.slot = 5
  const repeated = residents[3]
  buildings[1].admission.occupants[5] = repeated.id
  const loaded = migrateCheckpoint(structuredClone(w))
  assert.ok(loaded.units.find(u => u.id === first.id).resident)
  assert.equal(loaded.units.find(u => u.id === wrong.id).resident, undefined)
  assert.equal(loaded.units.find(u => u.id === repeated.id).resident, undefined)
  assert.ok(first.resident)
  assert.ok(wrong.resident)
  assert.deepEqual(loaded.buildings.map(b => b.admission?.occupants), w.buildings.map(b => b.admission?.occupants))
})

test('separate normalization calls observe replaced, reordered and removed building rosters', () => {
  const { w, residents, buildings } = suppliedResidents(1), id = residents[0].id
  assert.ok(migrateCheckpoint(w).units.find(u => u.id === id).resident)
  const original = buildings[0], rejected = structuredClone(original)
  rejected.admission.occupants.fill(0)
  w.buildings = [rejected, original]
  migrateCheckpoint(w)
  assert.equal(w.units.find(u => u.id === id).resident, undefined)
  const next = suppliedResidents(1), person = next.residents[0]
  next.w.buildings = []
  migrateCheckpoint(next.w)
  assert.equal(person.resident, undefined)
})

test('current route ownership still counts a passive resident and rejects malformed physical ownership', () => {
  const { w, residents, buildings } = suppliedResidents(1), u = residents[0]
  u.hp = 0
  buildings[0].hp = 0
  attachPersonRoute(w.motionRoutes, u.resident.person, 1)
  assert.doesNotThrow(() => restoreCapacityPolicy(w))
  const before = structuredClone(w)
  buildings[0].admission.occupants[u.resident.slot] = 0
  assert.throws(() => restoreCapacityPolicy(w), /motion-route ownership count/)
  buildings[0].admission.occupants[u.resident.slot] = u.id
  assert.deepEqual(w, before)
})

test('actual Save=false and Load retain current passive owners and independent snapshots', async () => {
  const { store, w, residents } = suppliedResidents(4), ids = residents.map(u => u.id)
  assert.equal(typeof indexedDB, 'undefined')
  assert.equal(await store.saveCheckpoint(), false)
  assert.equal(store.hasCheckpoint(), true)
  const before = residents.map(u => structuredClone(u.resident))
  delete residents[0].resident
  assert.equal(store.loadCheckpoint(), true)
  const loaded = store.getWorld()
  assert.notEqual(loaded, w)
  for (const [i, id] of ids.entries()) {
    const unit = loaded.units.find(u => u.id === id)
    assert.deepEqual(unit.resident, before[i])
    assert.equal(residentPerson(loaded, unit), unit.resident.person)
  }
  delete loaded.units.find(u => u.id === ids[0]).resident
  assert.equal(store.loadCheckpoint(), true)
  assert.deepEqual(store.getWorld().units.find(u => u.id === ids[0]).resident, before[0])
  assert.equal(residents[0].resident, undefined)
})


test('actual normalization retains semantic state and reports remaining building reads', t => {
  const { w, residents } = suppliedResidents(32)
  const expected = migrateCheckpoint(structuredClone(w))
  const reads = buildingReads(w, () => migrateCheckpoint(w))
  assert.deepEqual(w, expected)
  t.diagnostic(`${reads} building-ID reads for ${w.buildings.length} buildings and ${residents.length} residents`)
  // The total includes other lookups, so it is diagnostic rather than a linear bound.
})
