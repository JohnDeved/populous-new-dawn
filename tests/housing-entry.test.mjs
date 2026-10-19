import { currentPersonOrder } from '../app/person-orders.ts'
import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import fixture from './fixtures/building-entry-clocks.json' with { type: 'json' }
import manifest from '../decomp/exports.json' with { type: 'json' }
import rules from '../app/original-rules.json' with { type: 'json' }
import { stepBuildingEntryClocks } from '../app/training.ts'
import { buildingInsidePoint } from '../app/building-shapes.ts'
import { addBuilding, addUnit, command, tick, buildingPose, nativePosition, unitAnimationSource } from '../app/model.ts'
import { initializeLivePanic, leaveLiveBuilding, stepLivePersonHealth } from '../app/live-people.ts'
import { advanceGame } from '../app/game-clock.ts'
import { buildingAdmission, stepBuildingEntry } from '../app/live-building-entry.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { residentPerson } from '../app/building-resident.ts'
import { evacuateBuilding } from '../app/building-runtime.ts'
import { shieldFollowers, bloodlustFollowers, setUnitInvisibility, stepUnitShields, stepUnitBloodlust, stepUnitInvisibility, stepUnitHypnotise } from '../app/spell-effects-runtime.ts'

function scenario(direction = 0, count = 1, level = 1) {
  const w = createStartedWorld()
  w.manaWorld.gameFlags = 32
  retainFixtureUnits(w, u => u.kind === 'shaman')
  const b = addBuilding(w, 'blue', 'hut', { x: -2, z: 32 }, true, { angle: direction * Math.PI / 2, level })
  const people = Array.from({ length: count }, (_, i) => addUnit(w, 'blue', 'brave', { x: 7 + i * 0.25, z: 33 }))
  w.selected = people.map(u => u.id)
  command(w, b)
  return { w, b, people }
}

function until(w, condition, limit = 180) {
  for (let i = 0; i < limit && !condition(); i++) tick(w, 1 / 12)
  assert.ok(condition(), 'housing scenario must reach the expected phase')
}

test('building admission clocks match captured native blocks', () => {
  assert.equal(fixture.executableSha256, manifest.executableSha256)
  for (const c of fixture.cases) {
    const state = structuredClone(c.before)
    stepBuildingEntryClocks(state, c.counter)
    assert.deepEqual(state, c.expected)
  }
})

test('followers visibly cross the native interior threshold before housing consumes their command', () => {
  for (const level of [1, 2, 3]) for (let direction = 0; direction < 4; direction++) {
    const { w, b, people: [u] } = scenario(direction, 1, level)
    until(w, () => u.entry?.person.substate === 5)
    const entry = u.entry, p = entry.person, order = currentPersonOrder(entry.orders, p)
    assert.equal(u.inside, null, 'door arrival is not admission')
    assert.equal(u.native, null, 'ordinary state ownership remains separate')
    assert.equal(unitAnimationSource(u), p)
    assert.equal(p.object, rules.animationObjects[rules.personAnimationObjects[9 + p.model]][0])
    assert.equal(order.references, 1)
    const door = { x: u.x, z: u.z }
    until(w, () => u.inside === b.id)
    assert.ok(Math.hypot(u.x - door.x, u.z - door.z) > 1, 'entry requires actual movement inside')
    const inside = buildingInsidePoint(buildingPose(b)), position = nativePosition(w, u)
    assert.ok(Math.abs(((position.x - inside.x) << 16) >> 16) < 112)
    assert.ok(Math.abs(((position.y - inside.y) << 16) >> 16) < 112)
    assert.equal(p.flags2 & 0x804000, 0x804000)
    assert.equal(p.renderFlags & 16, 16)
    assert.equal(order.references, 0)
    assert.equal(entry.orders.active, 0)
    assert.equal(u.entry, undefined)
    assert.equal(unitAnimationSource(u), null)
    assert.equal(u.resident?.person, p, 'completed housing retains the exact passive occupant')
    assert.equal(u.resident.building, b.id)
    assert.equal(b.admission.occupants[u.resident.slot], u.id)
  }
})

test('simultaneous arrivals respect hut capacity and cancellation releases the scoped animation and route', () => {
  const { w, b, people } = scenario(0, 4)
  for (let i = 0; i < 180; i++) {
    tick(w, 1 / 12)
    assert.ok(people.filter(u => u.inside === b.id).length <= 3)
  }
  assert.equal(people.filter(u => u.inside === b.id).length, 3)
  assert.ok(people.filter(u => u.inside === null).every(u => u.resident === undefined))
  const other = scenario(), u = other.people[0]
  until(other.w, () => u.entry?.person.substate === 5)
  other.w.selected = [u.id]
  const before = [u.x, u.z]
  command(other.w, { x: 9, z: 30 })
  assert.equal(u.entry, undefined)
  assert.equal(u.resident, undefined)
  assert.equal(unitAnimationSource(u), u.native)
  assert.equal(u.native.commandStatus, 3)
  assert.deepEqual([u.x, u.z], before)
  assert.ok(u.path.length)
  until(other.w, () => u.path.length === 0)
  assert.equal(u.inside, null)
})

test('hut slots remain authoritative through a departure, replacement and birth turn', () => {
  const { w, b, people } = scenario(0, 3)
  until(w, () => people.every(u => u.inside === b.id))
  const admission = buildingAdmission(w, b),
    slots = admission.occupants.slice(0, 3),
    departing = people.find(u => u.id === slots[1])
  assert.ok(departing)

  w.selected = [departing.id]
  command(w, { x: 9, z: 30 })
  assert.equal(departing.inside, null)
  assert.deepEqual(admission.occupants.slice(0, 3), [slots[0], 0, slots[2]])

  const replacement = addUnit(w, 'blue', 'brave', { x: 7, z: 33 })
  w.selected = [replacement.id]
  command(w, b)
  until(w, () => replacement.inside === b.id)
  assert.deepEqual(admission.occupants.slice(0, 3), [slots[0], replacement.id, slots[2]])

  departing.inside = b.id // Stale legacy mirror must not change native slot-owned birth work.
  w.manaWorld.gameFlags &= ~32
  b.counter = 3
  b.timer = 0
  tick(w, 1 / 12)
  assert.equal(admission.inside, 3)
  assert.equal(b.timer, 8)
})

test('fire interrupts entry without retaining its walking sprites or command record', () => {
  const { w, people: [u] } = scenario()
  until(w, () => u.entry?.person.substate === 5)
  initializeLivePanic(w, u)
  assert.equal(u.entry, undefined)
  assert.equal(u.resident, undefined)
  assert.equal(u.native.state, 26)
  assert.equal(u.path.length, 0)
  for (let i = 0; i < 65; i++) tick(w, 1 / 12)
  assert.equal(u.native, null)
})

test('staged entry positions, RNG, admission and sprite clocks are independent of rendered frame rate', () => {
  const run = hz => {
    const { w, b, people } = scenario(1, 3), clock = { animationTime: 0, animationFrame: 0 }
    for (let i = 0; i < hz * 6; i++) advanceGame(w, clock, 1 / hz)
    return { turn: w.turn, random: w.randomState, admission: b.admission,
      people: people.map(u => ({ x: u.x, z: u.z, inside: u.inside, entry: u.entry })) }
  }
  const expected = run(144)
  for (const hz of [5, 30, 60, 120, 240]) assert.deepEqual(run(hz), expected)
})

test('entry re-plans interrupted steering and releases its source when the hut becomes unavailable', () => {
  const { w, b, people: [u] } = scenario()
  tick(w, 1 / 12)
  const p = u.entry.person
  p.flags2 = (p.flags2 | 0x80000000) >>> 0
  tick(w, 1 / 12)
  assert.equal(p.flags2 & 0x80000000, 0)
  until(w, () => u.entry?.person.substate === 5)
  b.progress = 0.5
  tick(w, 1 / 12)
  assert.equal(u.entry, undefined)
  assert.notEqual(unitAnimationSource(u), p)
  assert.notEqual(w.pathfinding.people.get(u.id), p)
  assert.equal(u.resident, undefined)
})

function housed(beforeAdmission = () => {}) {
  const result = scenario(), { w, b, people: [u] } = result
  until(w, () => u.entry?.person.substate === 5)
  const p = u.entry.person
  beforeAdmission(w, u, p)
  until(w, () => u.inside === b.id)
  assert.equal(u.resident?.person, p)
  return { ...result, u, p }
}

test('passive housing mirrors existing health without becoming an active eligibility owner', () => {
  const { w, u, p } = housed()
  tick(w, 1 / 12)
  assert.equal(w.objectCells.objects.has(u.id), false)
  p.flags2 |= 0x80000 // This would exclude an active person from the health pass.
  p.flags3 |= 0x40001000
  u.hp = 20
  w.turn = (w.turn + 7) & ~7
  const before = structuredClone(p), random = w.randomState,
    legacy = structuredClone(w), old = legacy.units.find(unit => unit.id === u.id)
  delete old.resident
  stepLivePersonHealth(legacy)
  stepLivePersonHealth(w)
  assert.equal(u.hp, old.hp)
  assert.ok(u.hp > 20)
  assert.equal(p.life, u.hp * 20)
  assert.equal(p.flags3 & 0x1000, 0)
  assert.deepEqual({ ...p, life: before.life, flags3: before.flags3 }, before)
  assert.equal(w.randomState, random)
  assert.equal(u.native, null)
  assert.equal(unitAnimationSource(u), null)
  assert.equal(w.objectCells.objects.has(u.id), false)

  u.hp = 7 // Browser damage after the health visit must not be overwritten on exit.
  assert.equal(leaveLiveBuilding(w, u), p)
  assert.equal(p.life, 140)
  assert.equal(u.resident, undefined)
})

test('physical departure retains the exact passive person during death and building destruction', () => {
  for (const [deadPerson, deadBuilding] of [[true, false], [false, true], [true, true]]) {
    const { w, b, u, p } = housed(), slot = u.resident.slot, xy = [p.x, p.y]
    if (deadPerson) u.hp = 0
    if (deadBuilding) b.hp = 0
    const removed = leaveLiveBuilding(w, u)
    assert.equal(removed, p)
    assert.equal(u.resident, undefined)
    assert.equal(u.inside, null)
    assert.equal(p.building, null)
    assert.equal(b.admission.occupants[slot], 0)
    assert.equal(b.admission.inside, 0)
    assert.deepEqual([p.x, p.y], xy)
    assert.equal(p.renderFlags & 16, 0)
    assert.equal(p.flags2 & 0x804000, 0)
    assert.equal(w.objectCells.objects.get(p.id), p)
    if (deadPerson) assert.equal(p.life, 0)
  }
})

test('public departure exposes the stored person at removal and consumes passive ownership', () => {
  const { w, b, u, p } = housed(), slot = u.resident.slot
  tick(w, 1 / 12)
  const objects = w.objectCells.objects, original = objects.set, inserted = []
  objects.set = function (id, value) {
    if (id === u.id) inserted.push({ person: value, slot: b.admission.occupants[slot] })
    return original.call(this, id, value)
  }
  try {
    w.selected = [u.id]
    command(w, { x: 9, z: 30 })
  } finally {
    delete objects.set
  }
  assert.equal(inserted[0].person, p)
  assert.equal(inserted[0].slot, 0)
  assert.equal(u.resident, undefined)
  assert.equal(u.inside, null)
  assert.equal(b.admission.occupants[slot], 0)
  // The existing command caller discards release's return; no movement-owner claim.
  assert.equal(u.native.commandStatus, 3)
})

test('new passive checkpoints retain their owner while absent and malformed fields remain legacy', () => {
  const { w, b, u, p } = housed(), saved = structuredClone(w),
    loaded = migrateCheckpoint(structuredClone(saved)),
    resident = loaded.units.find(unit => unit.id === u.id),
    person = resident.resident.person
  assert.notEqual(person, p)
  assert.deepEqual(person, p)
  assert.equal(residentPerson(loaded, resident), person)
  assert.equal(leaveLiveBuilding(loaded, resident), person)
  assert.equal(resident.resident, undefined)

  for (const malformed of [undefined, null, 0, 'bad', {}, { person: null },
    { building: b.id, slot: 0, person: {} },
    { building: b.id, slot: 6, person: structuredClone(p) },
    { building: b.id, slot: 1, person: structuredClone(p) },
    { building: b.id, slot: 0, person: { ...structuredClone(p), displacement: null } },
  ]) {
    const old = structuredClone(saved), unit = old.units.find(value => value.id === u.id),
      building = old.buildings.find(value => value.id === b.id), slots = building.admission.occupants.slice()
    if (malformed === undefined) delete unit.resident
    else unit.resident = malformed
    assert.doesNotThrow(() => migrateCheckpoint(old))
    assert.equal(unit.resident, undefined)
    assert.deepEqual(building.admission.occupants, slots)
    assert.equal(unit.inside, b.id)
    const legacy = leaveLiveBuilding(old, unit)
    assert.ok(legacy)
    assert.notEqual(legacy, p)
    assert.equal(unit.resident, undefined)
  }
})

test('failed new entry allocation retains passive ownership and reissue does not bootstrap a resident', () => {
  const { w, b, u, p } = housed(), slot = u.resident.slot
  for (const order of w.buildingOrders.records.slice(1)) order.references = 1
  w.buildingOrders.active = 799
  stepBuildingEntry(w, u, b)
  assert.equal(u.entry, undefined)
  assert.equal(u.native, null)
  assert.equal(u.resident.person, p)
  assert.equal(b.admission.occupants[slot], u.id)

  for (const order of w.buildingOrders.records.slice(1)) order.references = 0
  w.buildingOrders.active = 0
  stepBuildingEntry(w, u, b)
  assert.notEqual(u.entry?.person, p)
  assert.equal(u.resident, undefined, 'an already occupied slot is not a new admission event')
  assert.equal(b.admission.occupants[slot], u.id)
})


test('pre-admission Shield and Bloodlust expire on the stored passive person after checkpoint migration', () => {
  for (const [apply, step, field, mask] of [
    [shieldFollowers, stepUnitShields, 'shield', 0x8000],
    [bloodlustFollowers, stepUnitBloodlust, 'bloodlust', 0x80000],
  ]) {
    const source = housed((w, u, p) => {
      assert.ok(apply(w, u, 'blue').includes(u))
      assert.equal(p.flags3 & mask, mask)
    }), w = migrateCheckpoint(structuredClone(source.w)),
      u = w.units.find(unit => unit.id === source.u.id), p = u.resident.person
    assert.equal(p.flags3 & mask, mask)
    tick(w, 1 / 12)
    assert.equal(w.objectCells.objects.has(u.id), false)
    const random = w.randomState, flags = p.flags3
    u[field] = 1
    step(w)
    assert.equal(u[field], 0)
    assert.equal(p.flags3, (flags & ~mask) >>> 0)
    assert.equal(w.randomState, random)
    assert.equal(u.native, null)
    assert.equal(u.entry, undefined)
    assert.equal(unitAnimationSource(u), null)
    assert.equal(w.objectCells.objects.has(u.id), false)
    assert.equal(leaveLiveBuilding(w, u), p)
    assert.equal(p.flags3 & mask, 0)
  }
})

test('pre-admission Invisibility expiry keeps the existing player and enemy render masks inside', () => {
  for (const [enemy, blended] of [[false, false], [false, true], [true, false]]) {
    const source = housed((w, u, p) => {
      if (enemy) w.manaWorld.playerTribe = 1
      if (blended) p.renderFlags |= 0x4000
      setUnitInvisibility(w, u, 1000)
      assert.equal(p.flags4 & 0x1000, 0x1000)
      assert.equal(p.invisibilityRender, blended ? 0 : enemy ? 16 : 0x4000)
    }), w = migrateCheckpoint(structuredClone(source.w)),
      u = w.units.find(unit => unit.id === source.u.id), p = u.resident.person
    tick(w, 1 / 12)
    const flags = p.flags4, render = p.renderFlags, owned = p.invisibilityRender,
      random = w.randomState
    u.invisibility = 1
    stepUnitInvisibility(w)
    assert.equal(u.invisibility, 0)
    assert.equal(p.flags4, (flags & ~0x1000) >>> 0)
    assert.equal(p.renderFlags, render & ~owned)
    assert.equal(p.invisibilityRender, undefined)
    assert.equal(p.renderFlags & 0x4000, blended ? 0x4000 : 0)
    // Original expiry may clear enemy bit16 despite the independently hidden occupant.
    assert.equal(p.renderFlags & 16, enemy ? 0 : 16)
    assert.equal(u.inside, source.b.id)
    assert.equal(w.randomState, random)
    assert.ok(w.sounds.some(event => event.cue === 0x35 && event.owner === u.id))
    assert.equal(u.native, null)
    assert.equal(unitAnimationSource(u), null)
    assert.equal(w.objectCells.objects.has(u.id), false)
    assert.equal(leaveLiveBuilding(w, u), p)
    assert.equal(p.flags4 & 0x1000, 0)
  }
})


test('defeated original-tribe Hypnotise expiry clears only the passive status flag', () => {
  const { w, b, u, p } = housed()
  tick(w, 1 / 12)
  u.hypnotise = { originalTeam: 'red', remaining: 1, counter: 7 }
  w.manaTribes[1].defeatTimer = 1
  p.flags4 |= 0x4800
  const before = structuredClone(p), random = w.randomState, slot = u.resident.slot
  stepUnitHypnotise(w)
  assert.equal(w.units.find(unit => unit.id === u.id), u)
  assert.equal(u.hypnotise, undefined)
  assert.equal(u.team, 'blue')
  assert.deepEqual(p, { ...before, flags4: (before.flags4 & ~0x4000) >>> 0 })
  assert.equal(w.randomState, random)
  assert.equal(b.admission.occupants[slot], u.id)
  assert.equal(residentPerson(w, u), p)
  assert.equal(unitAnimationSource(u), null)
  assert.equal(w.objectCells.objects.has(u.id), false)
  assert.equal(leaveLiveBuilding(w, u), p)
})

test('ordinary death retags the passive hypnotised person before exact slot removal', () => {
  const { w, b, u, p } = housed(), slot = u.resident.slot
  tick(w, 1 / 12)
  u.hypnotise = { originalTeam: 'red', remaining: 2, counter: 0 }
  u.hp = 0
  u.damageAttacker = 0
  p.damageAttacker = 2 // A passive record must not change existing kill-credit precedence.
  p.flags4 |= 0x4000
  const credits = structuredClone(w.killCredits), objects = w.objectCells.objects,
    original = objects.set, removed = []
  objects.set = function (id, value) {
    if (id === u.id) removed.push({ person: value, tribe: value.tribe, flags4: value.flags4,
      life: value.life, slot: b.admission.occupants[slot] })
    return original.call(this, id, value)
  }
  try { tick(w, 1 / 12) } finally { delete objects.set }
  assert.equal(removed[0].person, p)
  assert.equal(removed[0].tribe, 1)
  assert.equal(removed[0].flags4 & 0x4000, 0)
  assert.equal(removed[0].life, 0)
  assert.equal(removed[0].slot, 0)
  assert.equal(u.resident, undefined)
  assert.equal(u.team, 'red')
  assert.equal(w.units.includes(u), false)
  assert.equal(w.killCredits[0][1], (credits[0][1] + 1) & 65535)
  assert.equal(w.killCredits[2][1], credits[2][1])
})

test('resident departure refreshes only selection bit128 from the current selection', () => {
  for (const selected of [false, true]) {
    const { w, u, p } = housed()
    p.selectionFlags = selected ? 0x200 : 0x280
    w.selected = selected ? [u.id] : []
    assert.equal(leaveLiveBuilding(w, u), p)
    assert.equal(p.selectionFlags, selected ? 0x280 : 0x200)
    assert.equal(u.resident, undefined)
  }
})


test('full-Hut evacuation removes each exact passive person without corrupting neighboring slots', () => {
  const { w, b, people } = scenario(0, 3)
  until(w, () => people.every(u => u.resident))
  tick(w, 1 / 12)
  const owners = new Map(people.map(u => [u.id, u.resident.person])),
    slots = b.admission.occupants.slice(), objects = w.objectCells.objects,
    original = objects.set, removed = []
  objects.set = function (id, value) {
    if (owners.has(id)) removed.push({ id, person: value, inside: b.admission.inside,
      slots: b.admission.occupants.slice() })
    return original.call(this, id, value)
  }
  try { evacuateBuilding(w, b) } finally { delete objects.set }
  assert.equal(removed.length, 3)
  const retired = new Set()
  for (const [index, record] of removed.entries()) {
    assert.equal(record.person, owners.get(record.id))
    retired.add(record.id)
    assert.equal(record.inside, 2 - index)
    assert.deepEqual(record.slots, slots.map(id => retired.has(id) ? 0 : id))
  }
  assert.equal(b.admission.inside, 0)
  assert.deepEqual(b.admission.occupants, [0, 0, 0, 0, 0, 0])
  for (const u of people) {
    assert.equal(u.inside, null)
    assert.equal(u.resident, undefined)
    assert.equal(owners.get(u.id).building, null)
  }
})
