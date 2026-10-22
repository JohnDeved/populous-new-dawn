import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { browserPosition, command, selectUnit } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { stepLiveMovement } from '../app/live-movement.ts'
import { vehicleReady } from '../app/vehicle-routing.ts'
import { boardingTargetLeftOrigin } from '../app/vehicle-boarding-orders.ts'

// Supplied craft displacement isolates command lifetime, not native steering,
// ordinary acquisition or rendered input. Terrain and the person remain authored.
async function fixture() {
  const store = await createCampaignFixtureStore([10])
  assert.equal(store.startMission(10), true)
  const world = store.getWorld(),
    boat = world.vehicles.find(v => v.id === 62),
    unit = world.units.find(u => u.id === 111)
  selectUnit(world, unit.id, false)
  assert.ok(command(world, { ...browserPosition(boat), id: boat.id }, { ctrlKey: true }))
  const person = unit.native,
    order = currentPersonOrder(world.buildingOrders, person)
  assert.equal(order.model, 22)
  assert.equal(order.references, 1)
  const originalPayload = order.b
  // An actual untouched shoreline in M10. Only the craft displacement is supplied.
  Object.assign(boat, { x: 512, y: 0 })
  assert.ok(vehicleReady(world.land, boat))
  return { store, world, boat, unit, person, order, originalPayload }
}

test('a public captured boarding order retires after its target leaves the origin', async () => {
  const { store, world, boat, unit, person, order, originalPayload } = await fixture()
  const hp = unit.hp
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const restored = store.getWorld(),
    restoredUnit = restored.units.find(u => u.id === unit.id)
  assert.deepEqual(restored, world)
  // Both native early exits share completion. Use the already-supported missing
  // target exit as an exact control, including later idle initialization and RNG.
  const completion = structuredClone(world),
    completionUnit = completion.units.find(u => u.id === unit.id),
    completionOrder = currentPersonOrder(completion.buildingOrders, completionUnit.native)
  completionOrder.a = world.nextId
  stepLiveMovement(world, unit)
  stepLiveMovement(restored, restoredUnit)
  stepLiveMovement(completion, completionUnit)
  completionOrder.a = order.a
  assert.deepEqual(restored, world)
  assert.deepEqual(completion, world)
  assert.equal(order.references, 0, 'moving-target boarding must not remain live indefinitely')
  assert.equal(currentPersonOrder(world.buildingOrders, person), undefined)
  assert.equal(person.vehicle, 0)
  assert.equal(person.state, 19, 'normal post-order idle initialization still runs')
  assert.equal(person.speed, completionUnit.native.speed)
  assert.equal(unit.native, person)
  assert.equal(world.objectCells.objects.get(unit.id), person)
  assert.equal(unit.hp, hp)
  assert.deepEqual({ x: unit.x, z: unit.z }, { x: completionUnit.x, z: completionUnit.z })
  assert.deepEqual(boat.passengers, [])
  assert.equal(order.b, originalPayload, 'completion does not rewrite the original click')
})

test('public Save/Load preserves the captured boarding origin and full current world', async () => {
  const { store, world, unit, order } = await fixture()
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const restored = store.getWorld(),
    p = restored.units.find(u => u.id === unit.id).native
  assert.deepEqual(restored, world)
  assert.deepEqual(currentPersonOrder(restored.buildingOrders, p), order)
})

test('a public boarding click at packed origin zero retains the native distance limit', async () => {
  const store = await createCampaignFixtureStore([10])
  assert.equal(store.startMission(10), true)
  const world = store.getWorld(),
    boat = world.vehicles.find(v => v.id === 62),
    unit = world.units.find(u => u.id === 111)
  // Supplied origin-zero craft position tests the public producer, not navigation.
  Object.assign(boat, { x: 128, y: 128 })
  selectUnit(world, unit.id, false)
  assert.ok(command(world, { ...browserPosition(boat), id: boat.id }))
  const order = currentPersonOrder(world.buildingOrders, unit.native)
  assert.equal(order.model, 22)
  assert.equal(order.b, 0)
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const restored = store.getWorld(),
    restoredUnit = restored.units.find(u => u.id === unit.id),
    restoredOrder = currentPersonOrder(restored.buildingOrders, restoredUnit.native)
  assert.deepEqual(restoredOrder, order)
  assert.equal(boardingTargetLeftOrigin(restoredOrder, { x: 2560, y: 128 }), true)
})
