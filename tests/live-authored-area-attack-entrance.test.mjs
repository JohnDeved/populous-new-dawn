import assert from 'node:assert/strict'
import test from 'node:test'
import { command, createWorld, setSelection, tick } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'

const cellIndex = cell => ((cell >>> 9) * 128) + ((cell & 254) >>> 1)
const buildingApproach = 0x80000
const pendingApproach = 0x40000000

function startingBrave() {
  const world = createWorld(2)
  while (world.turn < 430) tick(world, 1 / 12)
  const units = world.units.filter(u =>
    u.team === 'blue' && u.kind === 'brave' && u.hp > 0 &&
      u.x === -107 && u.z === -99
  )
  assert.deepEqual(units.map(u => u.id), [278])
  const [unit] = units
  setSelection(world, [unit.id])
  return { world, unit }
}

test('an authored M2 attack classifies the occupied tower footprint on its first approach visit', () => {
  const { world, unit } = startingBrave()
  const tower = world.buildings.find(b => b.id === 22)
  assert.deepEqual([tower.team, tower.kind, tower.progress], ['green', 'tower', 1])
  assert.ok(tower.hp > 0)
  assert.ok(command(world, tower))
  const person = unit.native
  const order = currentPersonOrder(world.buildingOrders, person)
  assert.deepEqual([order.model, order.a, order.b, order.references], [19, 31869, 0, 1])
  const index = cellIndex(order.a)
  assert.equal(world.land.flags[index] & 512, 512)
  assert.equal(world.land.buildingIds[index] & 1023, tower.id)
  assert.equal(person.substate, 0)
  assert.ok(person.flags2 & pendingApproach)
  assert.deepEqual([person.goalX, person.goalY, person.flags4 & buildingApproach], [31744, 31744, 0])

  tick(world, 1 / 12)
  assert.equal(world.turn, 431)
  assert.equal(unit.native, person)
  assert.equal(currentPersonOrder(world.buildingOrders, person), order)
  assert.equal(order.references, 1)
  assert.equal(person.substate, 0)
  assert.equal(person.workTarget, 0, 'no selected opponent may supersede the approach yet')
  assert.equal(person.flags2 & pendingApproach, 0)
  assert.deepEqual(
    [person.goalX, person.goalY, person.flags4 & buildingApproach],
    [31616, 32000, buildingApproach]
  )
})

test('the same authored Brave approaches an open Ctrl+Alt point without the building flag', () => {
  const { world, unit } = startingBrave()
  assert.ok(command(world, { x: -103, z: -98 }, { ctrlKey: true, altKey: true }))
  const person = unit.native
  const order = currentPersonOrder(world.buildingOrders, person)
  assert.deepEqual([order.model, order.a, order.b, order.references], [11, 23201, 0, 1])
  assert.equal(world.land.flags[cellIndex(order.a)] & 512, 0)
  assert.ok(person.flags2 & pendingApproach)
  tick(world, 1 / 12)
  assert.equal(world.turn, 431)
  assert.equal(unit.native, person)
  assert.equal(currentPersonOrder(world.buildingOrders, person), order)
  assert.equal(person.flags2 & pendingApproach, 0)
  assert.deepEqual([person.goalX, person.goalY, person.flags4 & buildingApproach], [41216, 23296, 0])
})
