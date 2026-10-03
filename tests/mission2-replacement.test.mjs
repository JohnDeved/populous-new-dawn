import assert from 'node:assert/strict'
import test from 'node:test'
import { command, createWorld, placeBuilding, select, setSelection, tick } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'

test('Mission 2 explicitly trains replacement Warriors after natural combat despite zero producer preferences', () => {
  const world = createWorld(2)
  const until = (predicate, limit = 10000) => {
    for (let i = 0; i < limit && !predicate(); i++) tick(world, 1 / 12)
    assert.ok(predicate(), `Condition not reached at turn ${world.turn}`)
  }
  const people = team => world.units.filter(unit => unit.team === team && unit.hp > 0)
  const warriors = team => people(team).filter(unit => unit.kind === 'warrior')
  until(() => world.turn >= 70, 1000)
  select(world, 'brave')
  assert.ok(placeBuilding(world, 'camp', { x: -99, z: -105 }))
  const blueCamp = world.buildings.find(building => building.team === 'blue' && building.kind === 'camp')
  const matakCamp = world.buildings.find(building => building.team === 'green' && building.kind === 'camp')
  assert.ok(blueCamp && matakCamp)
  until(() => blueCamp.progress === 1, 3000)
  until(() => !world.units.some(unit => unit.builder), 1000)
  setSelection(world, people('blue').filter(unit => unit.kind === 'brave').slice(0, 8).map(unit => unit.id))
  assert.ok(command(world, blueCamp))
  until(() => warriors('blue').length >= 8, 15000)

  // Original followers, real player attacks and existing battle resolution only.
  for (let attempt = 0; warriors('green').length >= 2 && attempt < 12; attempt++) {
    const target = warriors('green').sort((a, b) =>
      Math.hypot(a.x + 99, a.z + 105) - Math.hypot(b.x + 99, b.z + 105))[0]
    setSelection(world, warriors('blue').map(unit => unit.id))
    assert.ok(command(world, target))
    until(() => target.hp <= 0)
  }
  assert.ok(warriors('green').length < 2)
  assert.ok(people('green').length > 10)
  assert.deepEqual(world.ai.attributes.slice(5, 9), [0, 0, 0, 0])
  const originalWarriors = new Set(warriors('green').map(unit => unit.id))
  setSelection(world, warriors('blue').map(unit => unit.id))
  assert.ok(command(world, { x: -108, z: -105 }))
  until(() => world.ai.tasks.some(task => task.flags & 1 && task.type === 6 && task.target === matakCamp.id), 64)
  const request = world.ai.tasks.find(task => task.flags & 1 && task.type === 6 && task.target === matakCamp.id)
  assert.ok(request.requested > 0 && request.requested <= 2)
  until(() => people('green').some(unit => {
    const person = unit.native ?? unit.entry?.person
    return unit.kind === 'brave' && person && currentPersonOrder(world.buildingOrders, person)?.model === 8
  }), 2000)
  // Native training replaces the old Brave object with newly allocated Warriors.
  until(() => warriors('green').some(unit => !originalWarriors.has(unit.id)), 10000)
  assert.ok(warriors('green').length >= 2)
  assert.deepEqual(world.ai.attributes.slice(5, 9), [0, 0, 0, 0])
  assert.equal(world.status, 'playing')
})
