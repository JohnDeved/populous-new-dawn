import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
// Ordinary authored M15 production; lightweight scene fixture supplies camera only.
import test from 'node:test'
import assert from 'node:assert/strict'
import { command, tick, selectUnit, cancelInteraction } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

test('an occupied Boat House produces again after its first craft leaves', async () => {
  await loadSceneFixture()
  const { skipIntroduction } = await import('../app/scene-camera-runtime.ts')
  const store = await createCampaignFixtureStore([15])
  assert.equal(store.startMission(15), true)
  const world = store.getWorld(),
    house = world.buildings.find(b => b.id === 120)
  for (let n = 0; n < 82; n++) {
    tick(world, 1 / 12)
    if (world.flyby.flags & 1 && world.flyby.warmup > 0)
      skipIntroduction({ world, flybyCamera: { x: 0, y: 0, angle: 0, zoom: 0 }, onChange() {} })
  }
  const empty = structuredClone(world)
  for (const id of [71, 76]) {
    cancelInteraction(world)
    selectUnit(world, id)
    assert.ok(command(world, { ...house, id: house.id }))
  }
  while (!world.vehicles.length && world.turn < 1000) tick(world, 1 / 12)
  assert.equal(world.vehicles.length, 1)
  const first = world.vehicles[0],
    worker = world.units.find(u => u.id === 76),
    person = worker.entry?.person ?? worker.native,
    oldOrder = currentPersonOrder(world.buildingOrders, person)
  assert.deepEqual([first.counter, first.life, world.vehicleAllocationSeed], [0, 5000, 1])
  assert.equal(worker.inside, house.id)
  assert.equal(worker.hp, 50)
  assert.deepEqual(first.passengers, [71])
  const firstDriver = world.units.find(unit => unit.id === 71).native
  assert.equal(firstDriver.vehicle, first.id)
  assert.equal(world.objectCells.objects.get(firstDriver.id), firstDriver)
  // Supplied destroyed-workshop boundary; the ordinary route above is unchanged.
  const destroyed = structuredClone(world)
  destroyed.buildings.find(b => b.id === house.id).hp = 0
  const launch = { x: first.x, y: first.y }
  cancelInteraction(world)
  selectUnit(world, 71)
  assert.ok(command(world, { x: -67, z: -43 }))
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const restored = store.getWorld()
  let secondTurn = null,
    maxClearance = 0
  for (let n = 0; n < 1400; n++) {
    tick(world, 1 / 12)
    tick(restored, 1 / 12)
    tick(empty, 1 / 12)
    tick(destroyed, 1 / 12)
    assert.deepEqual(restored, world)
    maxClearance = Math.max(
      maxClearance,
      Math.hypot(((first.x - launch.x) << 16) >> 16, ((first.y - launch.y) << 16) >> 16)
    )
    if (world.vehicles.length === 2 && secondTurn === null) {
      secondTurn = world.turn
      const produced = world.vehicles.find(vehicle => vehicle.id !== first.id)
      assert.deepEqual([produced.counter, produced.life, world.vehicleAllocationSeed], [1, 5000, 2])
    }
  }
  assert.ok(maxClearance > 2000)
  assert.ok(secondTurn, 'the remaining actual worker must produce the next Boat')
  assert.equal(world.vehicles.length, 2)
  const second = world.vehicles.find(v => v.id !== first.id)
  assert.equal(worker.hp, 50)
  assert.equal(worker.inside, null)
  assert.deepEqual(second.passengers, [76])
  assert.equal(second.passengerCount, 1)
  assert.equal(worker.native.vehicle, second.id)
  assert.equal(world.objectCells.objects.get(worker.id), worker.native)
  assert.equal(oldOrder.references, 0)
  assert.equal(house.timer, 0)
  assert.equal(destroyed.vehicles.length, 1, 'a destroyed workshop does not produce again')
  assert.equal(empty.vehicles.length, 0, 'an unstaffed workshop does not produce')
  assert.equal(empty.buildings.find(b => b.id === 120).timer, 0)
})
