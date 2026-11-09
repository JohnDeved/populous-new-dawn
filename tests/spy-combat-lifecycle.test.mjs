import test from 'node:test'
import assert from 'node:assert/strict'
import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import { addBuilding, addUnit, command, disguiseSelectedSpies, tick } from '../app/model.ts'
function trainedSpy() {
  const w = createStartedWorld()
  w.manaWorld.gameFlags = 32
  retainFixtureUnits(w, u => u.kind === 'shaman')
  w.terrain.fill(3)
  w.terrainVersion++
  const school = addBuilding(w, 'blue', 'spyHut', { x: -2, z: 32 }, true, {
      angle: (3 * Math.PI) / 2,
    }),
    brave = addUnit(w, 'blue', 'brave', { x: 7, z: 33 })
  const until = (label, condition, limit = 2000) => {
    for (let i = 0; i < limit && !condition(); i++) tick(w, 1 / 12)
    assert.ok(condition(), `${label} at ${w.turn}`)
  }
  w.selected = [brave.id]
  assert.ok(command(w, school))
  until('admitted', () => brave.inside === school.id && !brave.entry?.person.speed)
  w.manaWorld.gameFlags = 0
  school.timer = 65535
  until('trained', () => w.units.some(u => u.team === 'blue' && u.kind === 'spy'))
  const spy = w.units.find(u => u.team === 'blue' && u.kind === 'spy')
  until('departed', () => spy.path.length === 0)
  w.selected = [spy.id]
  assert.ok(disguiseSelectedSpies(w, 1))
  tick(w, 1 / 12)
  until('disguised', () => spy.native.disguise === 0x40)
  return { w, spyId: spy.id }
}
// Supplied school, level terrain, funding and opponents. Training, disguise,
// encounters, reinforcement, reassignment and death use ordinary commands/ticks.
// This is a CPU lifecycle witness, not an unmodified campaign/browser run.
const baseline = trainedSpy()
const person = u => u.fight?.motion ?? u.native ?? u.entry?.person
function setup() {
  const w = structuredClone(baseline.w)
  return { w, spy: w.units.find(u => u.id === baseline.spyId) }
}
function until(w, label, condition, limit = 2000) {
  for (let i = 0; i < limit && !condition(); i++) tick(w, 1 / 12)
  assert.ok(condition(), `${label} at ${w.turn}`)
}

test('trained Spy reveals before ordinary encounter damage and dies without orphaned orders', () => {
  const { w, spy } = setup()
  const enemy = addUnit(w, 'red', 'warrior', { x: spy.x + 6, z: spy.z })
  const hp = spy.hp
  assert.equal(person(spy).disguise, 0x40)
  w.selected = [spy.id]
  assert.ok(command(w, enemy))
  until(w, 'encounter reveal', () => person(spy)?.disguise === 0)
  assert.equal(person(spy).state, 29)
  assert.equal(spy.hp, hp, 'state29 reveals before damage')
  until(w, 'ordinary combat death', () => !w.units.some(u => u.id === spy.id))
  assert.equal(w.buildingOrders.active, 0)
  assert.equal(w.fights.length, 0)
})

test('trained Spy reinforcement reveals before damage and public reassignment retains reveal', () => {
  const { w, spy } = setup()
  const enemy = addUnit(w, 'red', 'warrior', { x: spy.x + 6, z: spy.z })
  const ally = addUnit(w, 'blue', 'warrior', { x: spy.x + 5, z: spy.z })
  w.selected = [ally.id]
  assert.ok(command(w, enemy))
  until(w, 'established fight', () => w.fights.some(b => !b.encounter))
  assert.equal(person(spy).disguise, 0x40)
  const hp = spy.hp
  w.selected = [spy.id]
  assert.ok(command(w, enemy))
  until(w, 'reinforcement admission', () => !!spy.fight)
  assert.equal(person(spy).state, 25)
  assert.equal(person(spy).disguise, 0)
  assert.equal(spy.hp, hp, 'state25 reveals before damage')
  assert.ok(command(w, { x: spy.x - 20, z: spy.z + 10 }))
  until(w, 'reassignment releases fight', () => !spy.fight)
  assert.equal(person(spy).disguise, 0)
  assert.ok(w.units.includes(spy))
  // Group ownership retires the departed member on its next ordinary visit.
  tick(w, 1 / 12)
  assert.ok(w.fights.every(b => !b.members.includes(spy.id)))
})
