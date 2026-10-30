import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
// Two ordinarily produced M15 Boats; scene fixture supplies only the camera adapter.
import test from 'node:test'
import assert from 'node:assert/strict'
import { command, tick, selectUnit, cancelInteraction, browserPosition } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { vehicleReady } from '../app/vehicle-routing.ts'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

test('ordinary nearby cross-craft boarding preserves the person and cleans later same-model orders', async () => {
  await loadSceneFixture()
  const { skipIntroduction } = await import('../app/scene-camera-runtime.ts')
  const store = await createCampaignFixtureStore([15])
  assert.equal(store.startMission(15), true)
  const w = store.getWorld(),
    house = w.buildings.find(b => b.id === 120)
  for (let n = 0; n < 82; n++) {
    tick(w, 1 / 12)
    if (w.flyby.flags & 1 && w.flyby.warmup > 0)
      skipIntroduction({ world: w, flybyCamera: { x: 0, y: 0, angle: 0, zoom: 0 }, onChange() {} })
  }
  for (const id of [71, 76]) {
    cancelInteraction(w)
    selectUnit(w, id)
    assert.ok(command(w, { ...house, id: house.id }))
  }
  while (w.vehicles.length < 2 && w.turn < 1800) tick(w, 1 / 12)
  assert.equal(w.vehicles.length, 2)
  const first = w.vehicles.find(v => v.passengers.includes(71)),
    second = w.vehicles.find(v => v.passengers.includes(76)),
    unit = w.units.find(u => u.id === 71),
    person = unit.native,
    other = w.units.find(u => u.id === 76).native
  assert.equal(w.manaTribes[person.tribe].playerType, 2)
  assert.ok(vehicleReady(w.land, first))
  assert.ok(vehicleReady(w.land, second))
  const short = n => (n << 16) >> 16
  assert.ok(Math.abs(short(second.x) - short(person.x)) < 568)
  assert.ok(Math.abs(short(second.y) - short(person.y)) < 568)
  cancelInteraction(w)
  selectUnit(w, unit.id)
  assert.ok(command(w, { ...browserPosition(second), id: second.id }, { ctrlKey: true }))
  const active = currentPersonOrder(w.buildingOrders, person)
  assert.ok(command(w, { ...browserPosition(first), id: first.id }, { ctrlKey: true }))
  const following = w.buildingOrders.records[person.commands[1]]
  assert.deepEqual(
    [active.model, active.a, active.flags, following.model, following.a, following.flags],
    [22, second.id, 128, 22, first.id, 128]
  )
  assert.equal(unit.native, person)
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const restored = store.getWorld()
  for (let n = 0; n < 120; n++) {
    tick(w, 1 / 12)
    tick(restored, 1 / 12)
    assert.deepEqual(restored, w)
    assert.equal(unit.native, person)
    assert.equal(w.objectCells.objects.get(unit.id), person)
  }
  assert.equal(unit.hp, 50)
  assert.equal(person.vehicle, second.id)
  assert.deepEqual(first.passengers, [])
  assert.equal(first.passengerCount, 0)
  assert.deepEqual(second.passengers, [76, 71])
  assert.equal(second.passengerCount, 2)
  assert.equal(w.units.find(u => u.id === 76).native, other)
  assert.equal(w.objectCells.objects.get(76), other)
  assert.equal(active.references, 0)
  assert.equal(following.references, 0)
  assert.ok(person.commands.every(id => !id))
  // The same real passenger can transfer back while not driving its current craft.
  cancelInteraction(w)
  selectUnit(w, unit.id)
  assert.ok(command(w, { ...browserPosition(first), id: first.id }))
  tick(w, 1 / 12)
  assert.equal(unit.native, person)
  assert.equal(person.vehicle, first.id)
  assert.deepEqual(first.passengers, [71])
  assert.deepEqual(second.passengers, [76])
})
