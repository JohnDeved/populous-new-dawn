import assert from 'node:assert/strict'
import test from 'node:test'

import { createWorld } from '../app/world-initialization.ts'
import { createGameStore, migrateCheckpoint } from '../app/game-store.ts'
import { createLivePerson } from '../app/live-people.ts'
import {
  boardLiveVehicle,
  damageLiveVehicle,
  stepLiveVehicles,
  vehicleExitTarget,
} from '../app/live-vehicles.ts'
import { emitBlastWave, stepLiveBlastWave } from '../app/spell-effects-runtime.ts'
import { browserPosition } from '../app/world-coordinates.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

function missionBoat() {
  const world = createWorld(5),
    boat = world.vehicles[0]
  boat.active = true
  return { world, boat }
}

test('live vehicle damage keeps the native owner, special, signed and reset rules', () => {
  const { world, boat } = missionBoat()
  damageLiveVehicle(world, boat, 0, 50)
  assert.equal(boat.life, 5000, 'same-tribe damage is ignored')

  world.levelFlags2 |= 0x04000000
  damageLiveVehicle(world, boat, 1, 50)
  assert.equal(boat.life, 5000, 'special-load damage is ignored')
  world.levelFlags2 &= ~0x04000000

  boat.life = 50
  damageLiveVehicle(world, boat, 1, 50)
  stepLiveVehicles(world)
  assert.deepEqual([boat.life, boat.active, boat.destructionState], [0, true, 0])

  const passenger = world.units.find(unit => unit.team === 'blue' && unit.inside === null)
  passenger.native = createLivePerson(world, passenger)
  world.pathfinding.people.set(passenger.id, passenger.native)
  boat.life = 5000
  assert.ok(boardLiveVehicle(world, passenger.native, boat))
  damageLiveVehicle(world, boat, 1, 50)
  stepLiveVehicles(world)
  assert.equal(boat.life, 5000, 'occupied positive life resets on the controller pass')
})

test('Blast reaches live vehicles and native destruction ejects passengers alive', () => {
  const { world, boat } = missionBoat(),
    passenger = world.units.find(unit => unit.team === 'blue' && unit.inside === null)
  world.land.flags.fill(0)
  world.land.categories.fill(0)
  world.land.walkMasks[0].fill(255)
  boat.heading = Math.PI / 2
  assert.deepEqual(vehicleExitTarget(world, boat), {
    x: (boat.x + 512) & 65535,
    y: boat.y & 65535,
  })
  Object.assign(passenger, browserPosition(boat))
  passenger.native = createLivePerson(world, passenger)
  Object.assign(passenger.native, { x: boat.x, y: boat.y, h: boat.h })
  world.pathfinding.people.set(passenger.id, passenger.native)
  assert.ok(boardLiveVehicle(world, passenger.native, boat))
  const destination = [passenger.native.destinationX, passenger.native.destinationY]

  const wave = emitBlastWave(world, browserPosition(boat), 'green')
  for (let pass = 0; pass < 3 && boat.life === 5000; pass++) stepLiveBlastWave(world, wave)
  assert.ok(boat.life < 5000, 'the shared class-4 Blast consumer damages the live Boat')

  boat.life = 1
  stepLiveVehicles(world)
  assert.deepEqual([boat.active, boat.destructionState, boat.passengerCount], [false, 5, 0])
  assert.deepEqual(boat.passengers, [])
  assert.equal(passenger.native.vehicle, 0)
  assert.equal(passenger.hp > 0, true)
  assert.equal(passenger.flight, passenger.native)
  assert.equal(passenger.lift, 1)
  assert.deepEqual([passenger.native.destinationX, passenger.native.destinationY], destination)
  assert.deepEqual(passenger.native.velocity, { x: 160, y: 60, z: 0 })
  assert.equal(passenger.native.flags4 & 0x1000400, 0x1000400)
  assert.ok(passenger.native.speed >= rules.personSpeeds[passenger.native.physics])

  for (let turn = 0; turn < 200 && boat.destructionState; turn++) stepLiveVehicles(world)
  assert.equal(boat.destructionState, 0)

  const landUnit = world.units.find(unit => unit.id !== passenger.id && unit.inside === null),
    landPoint = createLivePerson(world, landUnit),
    beachedBoat = {
      ...boat,
      ...landPoint,
      id: world.nextId++,
      active: false,
      destructionState: 5,
      passengers: [],
      passengerCount: 0,
    }
  world.vehicles.push(beachedBoat)
  stepLiveVehicles(world)
  assert.equal(beachedBoat.destructionState, 0)

  const balloon = {
    ...boat,
    id: world.nextId++,
    model: 3,
    physics: 0,
    h: 560,
    life: 1,
    active: true,
    destructionState: 0,
    passengers: [],
    passengerCount: 0,
  }
  balloon.heading = Math.PI / 2
  assert.deepEqual(vehicleExitTarget(world, balloon), {
    x: (balloon.x + 1024) & 65535,
    y: balloon.y & 65535,
  })
  const balloonCell = ((balloon.y & 65535) >> 9) * 128 + ((balloon.x & 65535) >> 9)
  world.land.categories[balloonCell] = 2
  assert.deepEqual(vehicleExitTarget(world, balloon), {
    x: ((balloon.x & 0xfe00) + 256) & 65535,
    y: ((balloon.y & 0xfe00) + 640) & 65535,
  })
  world.land.categories[balloonCell] = 0
  world.vehicles.push(balloon)
  stepLiveVehicles(world)
  assert.deepEqual([balloon.active, balloon.destructionState], [false, 6])
  for (let turn = 0; turn < 20 && balloon.destructionState; turn++) stepLiveVehicles(world)
  assert.deepEqual([balloon.h, balloon.destructionState], [1040, 0])
})

test('vehicle life and destruction survive checkpoint migration and reload', async () => {
  const legacy = createWorld(5),
    legacyBoat = legacy.vehicles[0]
  delete legacyBoat.life
  delete legacyBoat.destructionState
  migrateCheckpoint(legacy)
  assert.deepEqual([legacyBoat.life, legacyBoat.destructionState], [5000, 0])

  const store = createGameStore()
  store.startMission(5)
  let world = store.getWorld(),
    boat = world.vehicles[0],
    passenger = world.units.find(unit => unit.team === 'blue' && unit.inside === null)
  const passengerId = passenger.id
  boat.active = true
  Object.assign(passenger, browserPosition(boat))
  passenger.native = createLivePerson(world, passenger)
  Object.assign(passenger.native, { x: boat.x, y: boat.y, h: boat.h })
  world.pathfinding.people.set(passenger.id, passenger.native)
  assert.ok(boardLiveVehicle(world, passenger.native, boat))
  boat.life = 1
  stepLiveVehicles(world)
  assert.deepEqual([boat.active, boat.destructionState, boat.passengerCount], [false, 5, 0])
  await store.saveCheckpoint()
  Object.assign(boat, { active: true, life: 5000, destructionState: 0, passengerCount: 1 })
  boat.passengers = [passengerId]
  passenger.flight.vehicle = boat.id
  assert.ok(store.loadCheckpoint())
  world = store.getWorld()
  boat = world.vehicles[0]
  passenger = world.units.find(unit => unit.id === passengerId)
  assert.deepEqual(
    [boat.active, boat.life, boat.destructionState, boat.passengerCount, boat.passengers],
    [false, 0, 5, 0, []]
  )
  assert.equal(passenger.flight.vehicle, 0)
  assert.equal(passenger.lift, 1)
})
