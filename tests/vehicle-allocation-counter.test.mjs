import test from 'node:test'
import assert from 'node:assert/strict'
import { assignVehicleAllocationCounter } from '../app/vehicle-allocation.ts'
import { createWorld, tick } from '../app/model.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { removeMissingVehiclePassengers, stepLiveVehicles } from '../app/live-vehicles.ts'

test('class4 allocation byte wraps independently of surviving vehicles and IDs', () => {
  const world = { vehicleAllocationSeed: 255 }, first = {}, second = {}
  assignVehicleAllocationCounter(world, first)
  assignVehicleAllocationCounter(world, second)
  assert.deepEqual([first.counter, second.counter, world.vehicleAllocationSeed], [255, 0, 1])
})
test('fresh Mission5 detached template retains its allocation phase and initialized speed', () => {
  const world = createWorld(5), boat = world.vehicles[0]
  assert.deepEqual([world.vehicleAllocationSeed, boat.counter, boat.speed, boat.active], [1, 0, 0, false])
  for (let i = 0; i < 16; i++) tick(world, 1 / 12)
  assert.deepEqual([world.vehicleAllocationSeed, boat.counter, boat.speed, boat.active], [1, 0, 0, false])
  const restored = migrateCheckpoint(structuredClone(world))
  assert.deepEqual([restored.vehicleAllocationSeed, restored.vehicles[0].counter], [1, 0])
})
test('ordinary active visit increments a known byte once while detached source stays unchanged', () => {
  const world = createWorld(22), active = world.vehicles.find(v => v.active)
  active.counter = 255
  stepLiveVehicles(world)
  assert.equal(active.counter, 0)
  stepLiveVehicles(world)
  assert.equal(active.counter, 1)
})
test('legacy missing phase remains unknown after migration and later allocation', () => {
  const world = createWorld(5)
  delete world.vehicleAllocationSeed
  for (const v of world.vehicles) delete v.counter
  const restored = migrateCheckpoint(structuredClone(world)), later = { counter: 99 }
  assignVehicleAllocationCounter(restored, later)
  assert.equal(restored.vehicleAllocationSeed, undefined)
  assert.equal(later.counter, undefined)
  assert.equal(restored.vehicles[0].counter, undefined)
  assert.equal(migrateCheckpoint(structuredClone(restored)).vehicleAllocationSeed, undefined)
})
test('missing-passenger cleanup changes active craft only', () => {
  const world = createWorld(5), template = world.vehicles[0]
  const before = structuredClone(template)
  removeMissingVehiclePassengers(world)
  assert.deepEqual(template, before)
  template.active = true
  template.passengers = [99999]
  template.passengerCount = 1
  removeMissingVehiclePassengers(world)
  assert.deepEqual([template.passengers, template.passengerCount, template.speed], [[], 0, -1])
})
