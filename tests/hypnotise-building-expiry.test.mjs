import assert from 'node:assert/strict'
import test from 'node:test'
import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import { addBuilding, addUnit, applyHypnotise, command, tick, stepUnitHypnotise } from '../app/model.ts'
import { migrateCheckpoint } from '../app/game-store.ts'

function housed() {
  const w = createStartedWorld()
  w.manaWorld.gameFlags = 32
  retainFixtureUnits(w, u => u.kind === 'shaman')
  const b = addBuilding(w, 'blue', 'hut', { x: -2, z: 32 }, true)
  const enemy = addUnit(w, 'red', 'brave', { x: 7, z: 33 })
  applyHypnotise(w, enemy, 'blue')
  const converted = w.units.find(u => u.hypnotise)
  assert.ok(converted)
  const others = [7.25, 7.5].map(x => addUnit(w, 'blue', 'brave', { x, z: 33 }))
  w.selected = [converted.id, ...others.map(u => u.id)]
  command(w, b)
  until(w, () => [converted, ...others].every(u => u.resident))
  assert.equal(b.admission.inside, 3)
  return { w, b, converted, others }
}

function until(w, condition, limit = 500) {
  for (let i = 0; i < limit && !condition(); i++) tick(w, 1 / 12)
  assert.ok(condition(), 'ordinary simulation must reach the expected phase')
}

for (const checkpoint of [false, true]) {
  test(`Hypnotise expiry releases a housed follower's exact slot${checkpoint ? ' after checkpoint migration' : ''}`, () => {
    const scenario = housed(), id = scenario.converted.id
    const w = checkpoint ? migrateCheckpoint(structuredClone(scenario.w)) : scenario.w
    const b = w.buildings.find(b => b.id === scenario.b.id)
    const u = w.units.find(u => u.id === id), slot = u.resident.slot
    const before = [...b.admission.occupants]
    until(w, () => !w.units.includes(u))
    assert.equal(b.admission.inside, 2)
    assert.deepEqual(b.admission.occupants, before.map(value => value === id ? 0 : value))
    assert.equal(w.objectCells.objects.has(id), false)
    assert.equal(w.pathfinding.people.has(id), false)
    assert.equal(w.selected.includes(id), false)
    const replacement = w.units.find(unit => unit.id > id && unit.team === 'red' && unit.kind === 'brave')
    assert.ok(replacement)
    assert.equal(replacement.inside, null)
    assert.equal(replacement.hypnotise, undefined)
    assert.equal(replacement.native.tribe, 1)
    assert.equal(replacement.native.flags4 & 0x4000, 0)

    const newcomer = addUnit(w, 'blue', 'brave', { x: 7, z: 33 })
    w.selected = [newcomer.id]
    command(w, b)
    until(w, () => newcomer.inside === b.id)
    assert.equal(b.admission.inside, 3)
    assert.equal(b.admission.occupants[slot], newcomer.id)
    for (const other of scenario.others) assert.ok(b.admission.occupants.includes(other.id))
  })
}

test('original tribe defeat immediately clears Hypnotise while retaining its housed person and slot', () => {
  const { w, b, converted } = housed(), before = [...b.admission.occupants]
  const resident = converted.resident, person = resident.person
  const commands = [...person.commands], nextId = w.nextId
  converted.hypnotise.remaining = 55
  converted.hypnotise.counter = 1
  w.manaTribes[1].defeatTimer = 1
  stepUnitHypnotise(w)
  assert.equal(converted.hypnotise, undefined)
  assert.equal(converted.resident, resident)
  assert.equal(converted.resident.person, person)
  assert.deepEqual(person.commands, commands)
  assert.equal(w.nextId, nextId)
  assert.ok(w.units.includes(converted))
  assert.equal(converted.team, 'blue')
  assert.equal(converted.inside, b.id)
  assert.equal(b.admission.inside, 3)
  assert.deepEqual(b.admission.occupants, before)
  assert.equal(converted.resident.person.flags4 & 0x4000, 0)
})

for (const kind of ['hut', 'camp', 'tower']) {
  test(`Hypnotise replacement releases ${kind} ownership without changing captured unit data`, () => {
    const w = createStartedWorld()
    w.manaWorld.gameFlags = 32
    retainFixtureUnits(w, u => u.kind === 'shaman')
    const b = addBuilding(w, 'blue', kind, { x: -2, z: 32 }, true)
    const enemy = addUnit(w, 'red', 'brave', { x: 7, z: 33 })
    applyHypnotise(w, enemy, 'blue')
    const u = w.units.find(u => u.hypnotise)
    w.selected = [u.id]
    command(w, b)
    // A hut's threshold is still pre-admission; schools and towers have an active occupant.
    until(w, () => kind === 'hut' ? u.entry?.person.substate === 5 : u.inside === b.id)
    const captured = { x: u.x, z: u.z, hp: u.hp, cargo: u.cargo, heading: u.heading }
    u.hypnotise.remaining = 1
    u.hypnotise.counter = 7
    stepUnitHypnotise(w)
    const replacement = w.units.find(unit => unit.id > u.id && unit.team === 'red' && unit.kind === 'brave')
    assert.ok(replacement)
    assert.deepEqual(Object.fromEntries(Object.keys(captured).map(key => [key, replacement[key]])), captured)
    assert.equal(replacement.inside, null)
    assert.equal(b.admission.inside, 0)
    assert.ok(b.admission.occupants.every(id => id === 0))
    assert.equal(w.objectCells.objects.has(u.id), false)
    assert.equal(w.pathfinding.people.has(u.id), false)
  })
}
