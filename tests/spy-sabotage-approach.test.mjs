import assert from 'node:assert/strict'
import test from 'node:test'
import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import { addBuilding, addUnit, command, browserPosition } from '../app/model.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { stepLiveBuildingAttack } from '../app/live-building-combat.ts'
import { clearLivePath } from '../app/live-pathfinding.ts'
import { currentPersonOrder } from '../app/person-orders.ts'

// Supplied unobstructed mechanics setup. Every order uses the production command
// caller; the unchanged training-to-Spy test remains the integration witness.
function scenario() {
  const w = createStartedWorld()
  retainFixtureUnits(w, u => u.kind === 'shaman')
  w.manaWorld.gameFlags = 96
  w.terrain.fill(3)
  w.terrainVersion++
  w.randomState = 0
  const target = addBuilding(w, 'red', 'hut', { x: 20, z: 40 }, true),
    spy = addUnit(w, 'blue', 'spy', { x: 10, z: 30 }),
    person = (spy.native = createLivePerson(w, spy))
  registerLivePerson(w, person)
  w.selected = [spy.id]
  return { w, target, spy, person }
}

test('Spy input attaches command15 without eagerly planning the outside-point route', () => {
  const { w, target, spy, person } = scenario(),
    before = [person.goalX, person.goalY, person.counter, person.x, person.y]
  assert.equal(command(w, target), true)
  assert.equal(spy.native, person)
  assert.equal(w.objectCells.objects.get(spy.id), person)
  assert.equal(currentPersonOrder(w.buildingOrders, person).model, 15)
  assert.equal(spy.target, target.id)
  assert.equal(w.pathfinding.people.has(spy.id), false)
  assert.deepEqual([person.goalX, person.goalY, person.counter, person.x, person.y], before)
})

test('the first Spy controller visit plans the original non-occupancy mask target once', () => {
  const { w, target, spy, person } = scenario()
  assert.equal(target.object, 134)
  command(w, target)
  const order = currentPersonOrder(w.buildingOrders, person)
  stepLiveBuildingAttack(w, spy)
  // Raw object134/rotation0 has mask0x26 at cell13582. The reviewed producer
  // chooses its north edge toward the inside point: (7424, 54304).
  assert.deepEqual([person.goalX, person.goalY], [7424, 54304])
  assert.equal(person.flags2 & 0x40000000, 0)
  assert.equal(person.substate, 0)
  assert.equal(spy.native, person)
  assert.equal(currentPersonOrder(w.buildingOrders, person), order)
  const random = w.randomState
  stepLiveBuildingAttack(w, spy)
  assert.equal(w.randomState, random, 'the next approach visit must not repeat recovery RNG')
  assert.equal(currentPersonOrder(w.buildingOrders, person), order)
})

test('Spy arrival reads signed goal fields and starts the wait only on the next controller visit', () => {
  const { w, target, spy, person } = scenario()
  command(w, target)
  clearLivePath(w, spy)
  person.flags2 &= ~0x40000000
  person.speed = 0
  person.goalX = person.x + 11
  person.goalY = person.y + 11
  person.timer = 37
  spy.path = [{ x: target.x, z: target.z }]
  stepLiveBuildingAttack(w, spy)
  assert.equal(person.substate, 1, 'a browser path-cache tail cannot veto native arrival')
  assert.equal(person.timer, 37, 'arrival only arms phase1')
  assert.ok(person.flags2 & 0x40000000)
  stepLiveBuildingAttack(w, spy)
  assert.equal(person.speed, 0)
  assert.equal(person.timer, 9, 'phase1 initializes ten and decrements on its first visit')
  assert.equal(person.flags2 & 0x40000000, 0)
})

test('Spy goal arrival does not wrap across the signed coordinate seam', () => {
  const { w, target, spy, person } = scenario()
  command(w, target)
  clearLivePath(w, spy)
  person.flags2 &= ~0x40000000
  person.speed = 0
  person.x = 32767
  person.y = 2000
  person.goalX = 32768
  person.goalY = 2000
  Object.assign(spy, browserPosition(person))
  const order = currentPersonOrder(w.buildingOrders, person)
  stepLiveBuildingAttack(w, spy)
  assert.equal(person.substate, 0)
  assert.equal(currentPersonOrder(w.buildingOrders, person), order)
})
