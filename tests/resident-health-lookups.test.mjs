// Actual health-pass imports with supplied passive slots, not natural housing.
import test from 'node:test'
import assert from 'node:assert/strict'
import { createGameStore } from '../app/game-store.ts'
import { addBuilding } from '../app/construction-runtime.ts'
import { addUnit } from '../app/world-state.ts'
import { createLivePerson, stepLivePersonHealth } from '../app/live-people.ts'
import { buildingAdmission } from '../app/live-building-entry.ts'
import { residentPerson } from '../app/building-resident.ts'
import { maxHp } from '../app/world-rules.ts'

function suppliedResidents(count = 1) {
  const w = createGameStore().getWorld()
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
      u.hp = 20
      const p = createLivePerson(w, u)
      p.flags3 |= 0x40001000
      u.resident = { building: b.id, slot, person: p }
      b.admission.occupants[slot] = u.id
      assert.equal(residentPerson(w, u), p)
      residents.push(u)
    }
  }
  // Isolate this pass, without claiming a complete gameplay-valid World.
  w.units = residents
  w.turn = 8
  w.manaWorld.gameFlags &= ~128
  return { w, residents, buildings }
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

test('health visits bound building reads and preserve the complete expected World', () => {
  const { w, residents } = suppliedResidents(32), expected = structuredClone(w)
  for (const u of expected.units) {
    u.hp = 20.2
    u.resident.person.life = 404
    u.resident.person.flags3 &= ~0x1000
  }
  const reads = buildingReads(w, () => stepLivePersonHealth(w))
  assert.deepEqual(w, expected)
  assert.equal(reads, w.buildings.length, `${reads} building-ID reads for ${w.buildings.length} buildings and ${residents.length} residents`)
})

test('passive health ignores active-owner gates while retaining unrelated person fields', () => {
  const { w, residents: [u] } = suppliedResidents(), p = u.resident.person
  w.units = [u]
  p.state = 2
  p.flags2 |= 0x80000
  u.hp = 5
  const before = structuredClone(p), random = w.randomState
  stepLivePersonHealth(w)
  assert.equal(u.hp, 5.2)
  assert.deepEqual(p, { ...before, life: 104, flags3: before.flags3 | 0x1000 })
  assert.equal(w.randomState, random)
  assert.equal(u.native, null)
  assert.equal(w.objectCells.objects.has(u.id), false)
  assert.equal(residentPerson(w, u), p)
})

test('non-healing turns and the existing full-health flag preserve passive mirroring', () => {
  const { w, residents: [u] } = suppliedResidents(), p = u.resident.person
  w.units = [u]
  w.turn = 9
  p.life = 1
  stepLivePersonHealth(w)
  assert.equal(u.hp, 20)
  assert.equal(p.life, 400)
  const flags = p.flags3
  w.manaWorld.gameFlags |= 128
  stepLivePersonHealth(w)
  assert.equal(u.hp, maxHp('brave'))
  assert.equal(p.life, maxHp('brave') * 20)
  assert.equal(p.flags3, flags)
})

test('deferred units stay untouched while dead invalid residents are discarded before health', () => {
  const { w, residents: [deferred, dead, live] } = suppliedResidents()
  deferred.resident.slot = 5
  dead.resident.slot = 5
  dead.hp = 0
  const before = structuredClone(deferred), deadPerson = structuredClone(dead.resident.person)
  const deadRef = dead.resident.person
  stepLivePersonHealth(w, new Set([deferred]))
  assert.deepEqual(deferred, before)
  assert.equal(dead.resident, undefined)
  assert.equal(dead.hp, 0)
  assert.deepEqual(deadRef, deadPerson)
  assert.equal(live.hp, 20.2)
})

test('active owners reject passive ownership and retain their state and flag health gates', () => {
  for (const role of ['flight', 'fight', 'native', 'entry', 'builder']) {
    for (const gate of ['state', 'flag']) {
      const { w, residents: [u] } = suppliedResidents(), passive = u.resident.person
      w.units = [u]
      const active = structuredClone(passive)
      active.state = gate === 'state' ? 2 : 10
      if (gate === 'flag') active.flags2 |= 0x80000
      if (role === 'fight') u.fight = { motion: active }
      else if (role === 'entry' || role === 'builder') u[role] = { person: active }
      else u[role] = active
      const beforeActive = structuredClone(active), beforePassive = structuredClone(passive)
      stepLivePersonHealth(w)
      assert.equal(u.resident, undefined, role)
      assert.equal(u.hp, 20, `${role}/${gate}`)
      assert.deepEqual(active, beforeActive)
      assert.deepEqual(passive, beforePassive)
    }
  }
})

test('first matching building remains authoritative and each visit sees a reordered or replaced roster', () => {
  const { w, residents: [u], buildings: [first] } = suppliedResidents(), saved = u.resident
  w.units = [u]
  const rejected = structuredClone(first)
  rejected.admission.occupants.fill(0)
  w.buildings = [first, rejected]
  stepLivePersonHealth(w)
  assert.equal(u.resident, saved)
  w.buildings = [rejected, first]
  stepLivePersonHealth(w)
  assert.equal(u.resident, undefined)
  u.resident = saved
  w.buildings = [first]
  stepLivePersonHealth(w)
  assert.equal(u.resident, saved)
  w.buildings = []
  stepLivePersonHealth(w)
  assert.equal(u.resident, undefined)
})

test('current physical slots remain authoritative across separate health visits', () => {
  const { w, residents: [u], buildings: [b] } = suppliedResidents(), saved = u.resident, p = saved.person
  w.units = [u]
  stepLivePersonHealth(w)
  assert.equal(u.resident, saved)
  b.admission.occupants[saved.slot] = 0
  const before = structuredClone(p)
  stepLivePersonHealth(w)
  assert.equal(u.resident, undefined)
  assert.deepEqual(p, before)
  b.admission.occupants[saved.slot] = u.id
  b.admission.occupants[5] = u.id
  u.resident = saved
  stepLivePersonHealth(w)
  assert.equal(u.resident, undefined, 'duplicate physical slots remain invalid')
})

test('empty, ineligible and entirely deferred cohorts never construct the building map', () => {
  for (const mode of ['empty', 'absent', 'malformed', 'deferred']) {
    const { w, residents } = suppliedResidents(8)
    if (mode === 'empty') w.units = []
    if (mode === 'absent') for (const u of residents) delete u.resident
    if (mode === 'malformed') for (const u of residents) u.resident.slot = -1
    const deferred = mode === 'deferred' ? new Set(residents) : undefined
    const before = mode === 'deferred' ? structuredClone(w) : null
    assert.equal(buildingReads(w, () => stepLivePersonHealth(w, deferred)), 0, mode)
    if (before) assert.deepEqual(w, before)
    if (mode === 'malformed') assert.ok(residents.every(u => u.resident === undefined))
  }
})
