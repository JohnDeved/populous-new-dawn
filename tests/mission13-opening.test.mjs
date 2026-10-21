import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createGameStore, migrateCheckpoint } from '../app/game-store.ts'
import { liveCommandContext, spellTargetError } from '../app/live-command.ts'
import { liveVehicleCellObjects } from '../app/live-vehicles.ts'
import { messageText } from '../app/messages.ts'
import { missionComputerTribes, missionData, missionScript } from '../app/mission-data.ts'
import {
  addBuilding,
  browserPosition,
  command,
  tick,
  nativePosition,
  supportsFollower,
} from '../app/model.ts'
import { terrainPointHeight } from '../app/native-terrain.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { vehicleCanDisembark, vehicleReady } from '../app/vehicle-routing.ts'
import { createGift } from '../app/world-effects.ts'
import { createWorld } from '../app/world-initialization.ts'

test('Mission 13 opens with both enemy tribes and original knowledge', () => {
  const world = createWorld(13)

  assert.equal(
    missionData(13).level.sourceSha256,
    '5ad694a1f60e0df174ef300fb763d5fc1c48f4b520d1a743bdb1a4b930fc9c3f'
  )
  assert.equal(
    missionScript(13, 2).sha256,
    '74226e5cc971c4d34898d6d464980726001694d2ed19734920a65971ed5ff10c'
  )
  assert.equal(
    missionScript(13, 3).sha256,
    'd5f2bfe673291a5a299efcb0b5f65e8e619465fad41efa0cc9a328a5658f407b'
  )
  assert.deepEqual(missionComputerTribes(13), [2, 3])
  assert.deepEqual(world.campaignAIs.map(Boolean), [false, false, true, true])
  assert.deepEqual(
    Object.fromEntries(
      ['blue', 'red', 'yellow', 'green', 'wild'].map(team => [
        team,
        world.units.filter(unit => unit.team === team).length,
      ])
    ),
    { blue: 7, red: 0, yellow: 7, green: 7, wild: 146 }
  )
  assert.deepEqual(
    world.shrines.map(shrine => [shrine.kind, shrine.reward]),
    [
      ['vault', 'balloonHut'],
      ['firestorm', 'firestorm'],
      ['shield', 'shield'],
      ['volcano', 'volcano'],
      ['vault', 'earthquake'],
    ]
  )
  assert.equal(world.unlockedBalloonHut, false)
  assert.equal(world.vehicles.length, 0)
  assert.equal(world.trees.length, 101)
  const selected = world.units.find(unit => world.selected.includes(unit.id))
  assert.equal(selected?.team, 'blue')
  assert.equal(selected?.kind, 'shaman')
  assert.equal(
    messageText(world.messages.slots.find(Boolean).stringId),
    'I sense a new threat\u0085 an attack from the skies. I must make ready for the battle to come.'
  )
  assert.ok([2, 3].every(tribe => world.campaignAIs[tribe].pendingCommands.length === 0))
})

test('Mission 13 starts its original Yellow turn-6 flyby once', () => {
  const world = createWorld(13)
  for (let turn = 0; turn < 6; turn++) tick(world, 1 / 12)
  assert.equal(world.flyby.flags & 1, 0)

  tick(world, 1 / 12)
  assert.equal(world.turn, 7)
  assert.equal(world.flyby.flags, 0x15)
  assert.equal(world.inputMask & 64, 64)
  assert.equal(world.flyby.warmup, 6)
  assert.deepEqual(
    world.flyby.events.map(({ kind, value, start, duration }) => [kind, value, start, duration]),
    [
      [1, 15096, 1, 15],
      [2, 600, 1, 35],
      [3, 128, 1, 45],
      [1, 31452, 30, 30],
      [2, 1762, 36, 60],
      [3, 65511, 50, 60],
      [1, 49178, 90, 40],
      [2, 890, 96, 65],
      [3, 102, 115, 35],
      [1, 48368, 155, 30],
      [3, 0, 155, 45],
      [2, 2000, 161, 45],
      [2, 1400, 206, 45],
      [3, 76, 210, 50],
      [1, 47294, 215, 25],
      [2, 600, 251, 55],
      [1, 46202, 260, 40],
      [3, 65511, 265, 50],
      [2, 1300, 306, 75],
      [1, 61026, 310, 35],
      [3, 102, 320, 50],
      [1, 15096, 370, 45],
      [3, 0, 375, 40],
      [2, 350, 381, 34],
    ]
  )
  assert.deepEqual(world.flyby.end, { x: 248, y: 58, angle: 350, zoom: 0 })
  assert.equal(world.campaignAIs[2].variables[11], 1)

  const events = world.flyby.events
  while (world.turn < 16) tick(world, 1 / 12)
  assert.equal(world.flyby.events, events)
  assert.equal(world.flyby.events.length, 24)
})

test('Mission 13 Balloon Hut knowledge is visible before construction', () => {
  const world = createWorld(13)
  createGift(
    world,
    'balloonHut',
    world.shrines.find(shrine => shrine.reward === 'balloonHut')
  )
  for (let turn = 0; turn < 82; turn++) tick(world, 1 / 12)

  assert.equal(world.unlockedBalloonHut, true)
  assert.equal(world.message, 'Knowledge discovered: Balloon Hut.')
  assert.equal(world.vehicles.length, 0)
})

test('Mission 13 Land Bridge uses native surface categories at low shore', () => {
  const world = createWorld(13),
    shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
    target = { x: -27_648, y: -17_920 },
    targetCell = ((target.y & 65_535) >> 9) * 128 + ((target.x & 65_535) >> 9)
  Object.assign(shaman, { x: -102, z: 56 })
  world.land.categories[targetCell] = 5

  assert.equal(terrainPointHeight(world.land, target), 0)
  assert.equal(spellTargetError(world, 'bridge', { x: -116, z: 62 }), null)
  world.land.categories[targetCell] = 1
  assert.equal(spellTargetError(world, 'bridge', { x: -116, z: 62 })?.code, -3)
})

test('Mission 13 Balloon Hut repeatedly produces occupied airborne transport', async () => {
  let world = createWorld(13, 'scalable')
  createGift(
    world,
    'balloonHut',
    world.shrines.find(shrine => shrine.reward === 'balloonHut')
  )
  for (let turn = 0; turn < 82; turn++) tick(world, 1 / 12)

  const hut = addBuilding(world, 'blue', 'balloonHut', { x: 0, z: 0 }, true),
    braves = world.units.filter(unit => unit.team === 'blue' && unit.kind === 'brave'),
    produce = brave => {
      brave.inside = hut.id
      brave.work = hut.id
      hut.timer = 999
      const allocationSeed = world.vehicleAllocationSeed
      tick(world, 1 / 12)
      const produced = world.vehicles.find(vehicle => vehicle.id === brave.native.vehicle)
      assert.ok(produced)
      assert.equal(produced.counter, allocationSeed, 'new workshop craft skips its ordinary visit this pass')
      assert.equal(produced.life, 5000)
      assert.equal(world.vehicleAllocationSeed, (allocationSeed + 1) & 255)
      assert.deepEqual(produced.passengers, [brave.id])
      assert.equal(produced.passengerCount, 1)
      assert.equal(world.objectCells.objects.get(brave.id), brave.native)
    }
  // Supplied completed Hut/timer; production and subsequent commands are real.
  produce(braves[0])
  produce(braves[1])

  // Separate clone: the public production checkpoint must not advance the route.
  const store = await createCampaignFixtureStore([13])
  assert.equal(store.startMission(13), true)
  const uninterrupted = store.getWorld()
  Object.assign(uninterrupted, structuredClone(world))
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const loaded = store.getWorld(),
    producedOwners = uninterrupted.vehicles.map(vehicle => ({
      vehicle: vehicle.id,
      counter: vehicle.counter,
      id: vehicle.passengers[0],
      owner: uninterrupted.units.find(unit => unit.id === vehicle.passengers[0]).native,
    }))
  assert.deepEqual(loaded, uninterrupted)
  for (let turn = 0; turn < 120; turn++) {
    tick(uninterrupted, 1 / 12)
    tick(loaded, 1 / 12)
    assert.deepEqual(loaded, uninterrupted)
    for (const entry of producedOwners) {
      const vehicle = uninterrupted.vehicles.find(vehicle => vehicle.id === entry.vehicle),
        unit = uninterrupted.units.find(unit => unit.id === entry.id)
      assert.equal(vehicle.counter, (entry.counter + turn + 1) & 255)
      assert.equal(vehicle.life, 5000)
      assert.deepEqual(vehicle.passengers, [entry.id])
      assert.equal(vehicle.passengerCount, 1)
      assert.equal(unit.native, entry.owner)
      assert.equal(uninterrupted.objectCells.objects.get(entry.id), entry.owner)
    }
  }

  assert.equal(world.vehicles.length, 2)
  assert.ok(world.vehicles.every(vehicle => vehicle.model === 3 && vehicle.physics === 0))
  const balloon = world.vehicles[0],
    driver = world.units.find(unit => unit.id === balloon.passengers[0]),
    passenger = braves[2]
  assert.equal(balloon.passengerCount, 1)
  assert.equal(driver.native.vehicle, balloon.id)
  assert.ok(driver.native.flags4 & 0x2000000)
  const findLanding = (state, vehicle) => {
    const vehicleWorld = {
      flags: state.land.flags,
      categories: state.land.categories,
      cellObjects: cell => liveVehicleCellObjects(state, cell),
    }
    for (let y = 0; y < 256; y += 2)
      for (let x = 0; x < 256; x += 2) {
        const point = { x: (x + 1) * 256, y: (y + 1) * 256 },
          distance = Math.hypot(
            ((point.x - vehicle.x) << 16) >> 16,
            ((point.y - vehicle.y) << 16) >> 16
          )
        if (
          distance > 3_000 &&
          distance < 10_000 &&
          vehicleCanDisembark(vehicleWorld, vehicle, point) &&
          // Reboarding requires readiness, which is stricter than disembarking.
          [-512, 0, 512].every(dx =>
            [-512, 0, 512].every(dy =>
              vehicleReady(state.land, {
                ...vehicle,
                x: point.x + dx,
                y: point.y + dy,
                speed: 0,
                navigationFlags: 0,
              })
            )
          ) &&
          liveCommandContext(state, browserPosition(point))?.enabled
        )
          return point
      }
  }

  world.selected = [driver.id]
  const firstLanding = findLanding(world, balloon)
  assert.ok(firstLanding)
  assert.ok(command(world, browserPosition(firstLanding)))
  for (
    let turn = 0;
    turn < 1_000 &&
    (currentPersonOrder(world.buildingOrders, driver.native) ||
      balloon.speed !== 0 ||
      !vehicleReady(world.land, balloon));
    turn++
  )
    tick(world, 1 / 12)
  assert.equal(currentPersonOrder(world.buildingOrders, driver.native), undefined)
  assert.equal(balloon.speed, 0)
  assert.ok(vehicleReady(world.land, balloon))
  const firstOwner = driver.native
  assert.ok(command(world, browserPosition(balloon), { shiftKey: true }))
  const firstDeparture = currentPersonOrder(world.buildingOrders, firstOwner)
  assert.equal(firstDeparture.flags, 64)
  for (let turn = 0; balloon.passengerCount && turn < 1_000; turn++) tick(world, 1 / 12)
  assert.equal(balloon.passengerCount, 0)
  for (let turn = 0; driver.flight && turn < 120; turn++) tick(world, 1 / 12)
  assert.equal(driver.flight, undefined)
  assert.equal(driver.hp, 50)
  assert.ok(supportsFollower(world, driver))
  assert.equal(firstOwner.vehicle, 0)
  assert.equal(firstDeparture.references, 0)

  // Preserve the original explicitly supplied second-passenger position setup.
  Object.assign(passenger.native, nativePosition(world, driver))
  Object.assign(passenger, { x: driver.x, z: driver.z })
  world.selected = [passenger.id]
  assert.ok(command(world, { ...browserPosition(balloon), id: balloon.id }))
  for (let turn = 0; balloon.passengerCount < 1 && turn < 1_000; turn++) tick(world, 1 / 12)
  // Settled drivers leave the route cache but remain persistent vehicle owners.
  assert.equal(passenger.native.state, 30)
  assert.equal(world.pathfinding.people.has(passenger.id), false)
  assert.equal(world.objectCells.objects.get(passenger.id), passenger.native)
  assert.equal(passenger.native.vehicle, balloon.id)
  world.selected = [driver.id]
  assert.ok(command(world, { ...browserPosition(balloon), id: balloon.id }))
  for (let turn = 0; balloon.passengerCount < 2 && turn < 1_000; turn++) tick(world, 1 / 12)
  assert.deepEqual(balloon.passengers, [passenger.id, driver.id])

  world = migrateCheckpoint(structuredClone(world))
  const restored = world.vehicles.find(vehicle => vehicle.id === balloon.id),
    occupants = restored.passengers.map(id => world.units.find(unit => unit.id === id)),
    before = { x: restored.x, y: restored.y }
  world.selected = occupants.map(unit => unit.id)
  const target = findLanding(world, restored)
  assert.ok(target)
  const flightPeople = occupants.map(unit => unit.native),
    clicked = { x: target.x + 37, y: target.y + 91 }
  assert.ok(command(world, browserPosition(clicked)))
  const flightOrder = currentPersonOrder(world.buildingOrders, occupants[0].native)
  assert.deepEqual([flightOrder.a & 255, flightOrder.b & 255], [128, 128])
  assert.equal(flightOrder.flags, 0)
  assert.notDeepEqual([flightOrder.a, flightOrder.b], [clicked.x, clicked.y])
  for (
    let turn = 0;
    turn < 1_000 &&
    (flightOrder.references || restored.speed !== 0 || !vehicleReady(world.land, restored));
    turn++
  )
    tick(world, 1 / 12)
  assert.equal(flightOrder.references, 0)
  assert.equal(restored.speed, 0)
  assert.ok(vehicleReady(world.land, restored))
  assert.ok(command(world, browserPosition(restored), { shiftKey: true }))
  const departureOrder = currentPersonOrder(world.buildingOrders, occupants[0].native)
  assert.equal(departureOrder.flags, 64)
  for (let turn = 0; restored.passengerCount && turn < 1_000; turn++) tick(world, 1 / 12)
  for (let turn = 0; turn < 32; turn++) tick(world, 1 / 12)

  assert.equal(
    restored.passengerCount,
    0,
    JSON.stringify({
      vehicle: restored,
      occupants: occupants.map(unit => ({
        id: unit.id,
        vehicle: unit.native?.vehicle,
        order: unit.native && currentPersonOrder(world.buildingOrders, unit.native),
      })),
    })
  )
  assert.deepEqual(restored.passengers, [])
  assert.ok(Math.hypot(restored.x - before.x, restored.y - before.y) > 3_000)
  assert.equal(restored.h, terrainPointHeight(world.land, restored) + 560)
  assert.equal(departureOrder.references, 0)
  assert.ok(flightPeople.every(person => !person.vehicle && !(person.flags4 & 0x2000000)))
  assert.ok(flightPeople.every(person => !currentPersonOrder(world.buildingOrders, person)))
  for (const unit of occupants) {
    assert.equal(unit.hp, 50)
    assert.equal(unit.flight, undefined)
    assert.ok(world.units.includes(unit))
    assert.ok(supportsFollower(world, unit))
    assert.equal(world.objectCells.objects.get(unit.id), unit.native)
  }
})

test('Mission 13 opening remains deterministic through checkpoint migration', () => {
  const uninterrupted = createWorld(13)
  for (let turn = 0; turn < 64; turn++) tick(uninterrupted, 1 / 12)
  const restored = migrateCheckpoint(structuredClone(uninterrupted))

  for (let turn = 0; turn < 128; turn++) {
    tick(uninterrupted, 1 / 12)
    tick(restored, 1 / 12)
  }
  assert.deepEqual(restored, uninterrupted)
  assert.equal(restored.status, 'playing')
})
