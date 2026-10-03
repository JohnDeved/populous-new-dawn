import assert from 'node:assert/strict'
import test from 'node:test'
import { command, createWorld, placeBuilding, select, setSelection, tick } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { wrappedDistance } from '../app/world-coordinates.ts'

test('Mission 2 explicitly trains replacement Warriors after natural combat despite zero producer preferences', () => {
  const world = createWorld(2)
  const originalBuildings = new Set(world.buildings.map(building => building.id))
  const until = (predicate, limit = 10000) => {
    for (let i = 0; i < limit && !predicate(); i++) tick(world, 1 / 12)
    assert.ok(predicate(), `Condition not reached at turn ${world.turn}`)
  }
  const people = team => world.units.filter(unit => unit.team === team && unit.hp > 0)
  const warriors = team => people(team).filter(unit => unit.kind === 'warrior')
  until(() => world.turn >= 70, 1000)
  // The autonomous home Tower is now live. Prepare an army through the ordinary
  // housing/population/training loop before confronting both defended areas.
  for (const [x, z] of [[-96, -120], [-88, -116], [-88, -108]]) {
    select(world, 'brave')
    assert.ok(placeBuilding(world, 'hut', { x, z }))
    const hut = world.buildings.findLast(building => building.team === 'blue' && building.kind === 'hut')
    until(() => hut.progress === 1)
    until(() => !people('blue').some(unit => unit.builder))
  }
  until(() => people('blue').length >= 26, 50000)
  select(world, 'brave')
  assert.ok(placeBuilding(world, 'camp', { x: -99, z: -105 }))
  const blueCamp = world.buildings.find(building => building.team === 'blue' && building.kind === 'camp')
  const matakCamp = world.buildings.find(building => building.team === 'green' && building.kind === 'camp')
  assert.ok(blueCamp && matakCamp)
  until(() => blueCamp.progress === 1, 3000)
  until(() => !world.units.some(unit => unit.builder), 1000)
  setSelection(world, people('blue').filter(unit => unit.kind === 'brave').slice(0, 16).map(unit => unit.id))
  assert.ok(command(world, blueCamp))
  until(() => warriors('blue').length >= 16, 15000)

  const homeTower = world.buildings.find(building => building.team === 'green' &&
    building.kind === 'tower' && !originalBuildings.has(building.id))
  assert.ok(homeTower && homeTower.progress === 1 && homeTower.hp > 0)
  assert.equal(typeof world.ai.constructionBase, 'number')

  // Original followers, real player attacks and existing battle resolution only.
  for (let attempt = 0; warriors('green').length >= 2 && attempt < 12; attempt++) {
    const target = warriors('green').sort((a, b) =>
      wrappedDistance(a, blueCamp) - wrappedDistance(b, blueCamp))[0]
    setSelection(world, warriors('blue').map(unit => unit.id))
    assert.ok(command(world, target))
    for (let elapsed = 0; elapsed < 10000 && target.hp > 0; elapsed++) {
      tick(world, 1 / 12)
      if (target.hp <= 0) break
      // Fighting or panic can end a direct order. Re-select idle survivors as a
      // player would, without interrupting their current movement or combat.
      if (elapsed % 64 !== 0) continue
      const idle = warriors('blue').filter(unit => unit.target === null &&
        !unit.fight && !unit.path.length && !unit.lift && unit.inside === null)
      if (!idle.length) continue
      setSelection(world, idle.map(unit => unit.id))
      // Native panic can exclude otherwise idle survivors from selection.
      if (!world.selected.length) continue
      assert.ok(command(world, target))
    }
    assert.ok(target.hp <= 0, `Warrior ${target.id} survived the assault at turn ${world.turn}`)
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
  until(() => warriors('green').length >= 2 &&
    warriors('green').some(unit => !originalWarriors.has(unit.id)), 10000)
  assert.ok(warriors('green').length >= 2)
  assert.deepEqual(world.ai.attributes.slice(5, 9), [0, 0, 0, 0])
  assert.equal(world.status, 'playing')
})
