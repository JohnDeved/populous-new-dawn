import assert from 'node:assert/strict'
import test from 'node:test'
import { browserPosition, cast, command, selectUnit, tick } from '../app/model.ts'
import { createGameStore } from '../app/game-store.ts'
import { buildingFirePoints, buildingPose } from '../app/building-shapes.ts'
import { finishLevelStart } from './level-start-fixture.mjs'

function pendingIgnition() {
  const store = createGameStore()
  store.startMission(1)
  const world = finishLevelStart(store.getWorld()),
    hut = world.buildings.find(building => building.team === 'blue' && building.kind === 'hut'),
    target = browserPosition(buildingFirePoints(buildingPose(hut))[2]),
    followers = world.units.filter(unit => unit.team === 'blue' && unit.kind === 'brave')
  for (const unit of followers) {
    selectUnit(world, unit.id, false)
    assert.ok(command(world, target))
  }
  for (let turn = 0; turn < 20; turn++) tick(world, 1 / 12)
  // Only spell stock is supplied. Authored actors and hut, selection, orders,
  // entry assignment, projectile travel and ignition use their ordinary owners.
  world.shots.lightning = 1
  assert.ok(cast(world, 'lightning', hut))
  for (
    let turn = 0;
    turn < 100 && !world.effects.some(effect => effect.lightning?.turn === 0);
    turn++
  )
    tick(world, 1 / 12)
  assert.equal(world.turn, 101)
  assert.ok(!hut.burn)
  assert.ok(followers.some(unit => unit.entry?.person.assignment & 32))
  return { world, store, hutId: hut.id }
}

test('ordinary burning-hut cancellation releases entry assignments and orders through Save/Load', async () => {
  const { world, store, hutId } = pendingIgnition()
  await store.saveCheckpoint()
  assert.equal(store.loadCheckpoint(), true)
  const restored = store.getWorld()
  for (const candidate of [world, restored]) {
    const entries = candidate.units
      .filter(unit => unit.entry)
      .map(unit => ({
        unit,
        person: unit.entry.person,
        orders: [...unit.entry.person.commands].filter(Boolean),
      }))
    assert.ok(entries.some(({ person }) => person.assignment & 32))
    assert.doesNotThrow(() => tick(candidate, 1 / 12))
    assert.ok(candidate.buildings.find(building => building.id === hutId).burn)
    for (const { unit, person, orders } of entries) {
      assert.equal(person.assignment & 32, 0)
      assert.ok(!unit.entry)
      assert.ok(person.commands.every(id => id === 0))
      assert.equal(person.immediateCommand, 0)
      for (const id of orders) assert.equal(candidate.buildingOrders.records[id].references, 0)
    }
  }
  assert.deepEqual(restored, world)
  for (let turn = 0; turn < 120; turn++) {
    tick(world, 1 / 12)
    tick(restored, 1 / 12)
  }
  assert.deepEqual(restored, world)
  assert.equal(world.status, 'playing')
})
