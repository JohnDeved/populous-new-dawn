import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import { settleRouteLaunch } from './helpers/route-launch-landing.mjs'
// Campaign setup supplies spell-focus masks; actors, charges and travel evolve through actual ticks.
import { supportsFollower } from '../app/model.ts'
import { reachMission22FlightPoint } from './helpers/mission22-flight-phase.mjs'
// Ordinary acquired M22 Balloon; preparation supplies only the mana-focus adapter.
import test from 'node:test'
import { vehicleReady } from '../app/vehicle-routing.ts'
import { currentPersonOrder } from '../app/person-orders.ts'

import assert from 'node:assert/strict'
import { browserPosition, cast, command, tick, selectUnit } from '../app/model.ts'
const stepUntil = (w, done, limit) => {
    for (let i = 0; i < limit; i++) {
      tick(w, 1 / 12)
      if (done()) return
    }
    throw Error('timed out ' + w.turn)
  },
  focusCharging = (w, m) => {
    w.charging = true
    w.manaWorld.spells[0].disabled = 0xffffffff & ~(1 << (m - 1))
  },
  moveShaman = (w, s, p) => {
    selectUnit(w, s.id, false)
    assert.ok(command(w, p))
    stepUntil(w, () => Math.hypot(s.x - p.x, s.z - p.z) < 2, 1000)
  }
// Preparation supplies only the existing mana-focus mask adapter.
test('supplied-focus same-vehicle boarding retains its acquired passenger through repeated input and Save/Load', async () => {
  const store = await createCampaignFixtureStore([22])
  assert.equal(store.startMission(22), true)
  let world = store.getWorld(),
    shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
    balloon = world.vehicles.find(vehicle => vehicle.model === 3),
    boat = world.vehicles.find(vehicle => vehicle.model === 1),
    south = world.shrines.find(shrine => shrine.rewardMana === 600_000)

  focusCharging(world, 5)
  stepUntil(world, () => world.shots.swarm > 0, 1_500)
  moveShaman(world, shaman, { x: 0, z: -45 })
  moveShaman(world, shaman, { x: 20, z: -45 })
  assert.ok(cast(world, 'swarm', { x: 27, z: -29 }))
  stepUntil(world, () => world.effects.some(effect => effect.swarm?.applied), 100)

  selectUnit(world, shaman.id, false)
  assert.ok(command(world, { ...browserPosition(boat), id: boat.id }))
  stepUntil(world, () => boat.passengerCount === 1, 500)
  // A dry destination requests the native route-ground departure.
  assert.ok(supportsFollower(world, { x: -25, z: -61 }))
  assert.ok(command(world, { x: -25, z: -61 }))
  stepUntil(world, () => boat.passengerCount === 0, 2_000)
  settleRouteLaunch(world, shaman, { x: -25, z: -61 })
  assert.ok(shaman.hp > 0 && supportsFollower(world, shaman))
  assert.equal(shaman.native.vehicle, 0)

  world.charging = true
  world.manaWorld.spells[0].disabled = 0xffffffff & ~(1 << 4) & ~(1 << 11)
  selectUnit(world, shaman.id, false)
  assert.ok(command(world, { ...south, id: south.id }))
  stepUntil(world, () => south.rewardDelay === 50, 500)
  stepUntil(world, () => south.uses === 1, 150)
  stepUntil(world, () => world.shots.swarm > 0 && world.shots.bridge > 0, 2_000)

  selectUnit(world, shaman.id, false)
  assert.ok(command(world, { ...browserPosition(boat), id: boat.id }))
  stepUntil(world, () => boat.passengerCount === 1, 500)
  // A dry destination requests the native route-ground departure.
  assert.ok(supportsFollower(world, { x: -83, z: -59 }))
  assert.ok(command(world, { x: -83, z: -59 }))
  stepUntil(world, () => boat.passengerCount === 0, 2_000)
  settleRouteLaunch(world, shaman, { x: -83, z: -59 })
  assert.ok(shaman.hp > 0 && supportsFollower(world, shaman))
  assert.equal(shaman.native.vehicle, 0)
  assert.ok(cast(world, 'bridge', { x: -83, z: -69 }))
  stepUntil(world, () => !shaman.casting, 100)
  for (let turn = 0; turn < 160; turn++) tick(world, 1 / 12)

  selectUnit(world, shaman.id, false)
  assert.ok(command(world, { ...browserPosition(balloon), id: balloon.id }))
  stepUntil(world, () => balloon.passengerCount === 1, 1_000)
  assert.deepEqual(
    [balloon.team, balloon.passengers, shaman.native.vehicle],
    ['blue', [shaman.id], balloon.id]
  )

  // The acquired craft is genuinely ready before the outbound movement. This
  // covers native-admitted same-craft input separately from the moving rejection.
  const readyWorld = structuredClone(world),
    readyUnit = readyWorld.units.find(u => u.id === shaman.id),
    readyVehicle = readyWorld.vehicles.find(v => v.id === balloon.id),
    readyPerson = readyUnit.native
  for (const modifiers of [{}, { ctrlKey: true }, { shiftKey: true }, { altKey: true }]) {
    selectUnit(readyWorld, readyUnit.id, false)
    assert.equal(vehicleReady(readyWorld.land, readyVehicle), true)
    assert.ok(
      command(readyWorld, { ...browserPosition(readyVehicle), id: readyVehicle.id }, modifiers)
    )
    const order = currentPersonOrder(readyWorld.buildingOrders, readyPerson)
    assert.equal(order.model, 22)
    tick(readyWorld, 1 / 12)
    assert.equal(order.references, 0)
    assert.equal(readyUnit.native, readyPerson)
    assert.equal(readyWorld.objectCells.objects.get(readyUnit.id), readyPerson)
    assert.equal(readyPerson.vehicle, readyVehicle.id)
    assert.deepEqual(readyVehicle.passengers, [readyUnit.id])
    assert.equal(readyPerson.state, 30)
  }

  selectUnit(world, shaman.id, false)
  assert.ok(command(world, { x: 55, z: 121 }))
  reachMission22FlightPoint(world, shaman, balloon, 18067, 31550)
  // Existing browser input accepts this moving craft; native readiness rejects it.
  assert.equal(vehicleReady(world.land, balloon), false)
  const person = shaman.native,
    old = currentPersonOrder(world.buildingOrders, person)
  const ownership = () => {
    assert.equal(shaman.native, person)
    assert.equal(world.objectCells.objects.get(shaman.id), person)
    assert.equal(person.vehicle, balloon.id)
    assert.deepEqual(balloon.passengers, [shaman.id])
    assert.equal(balloon.passengerCount, 1)
  }
  assert.ok(command(world, { ...browserPosition(balloon), id: balloon.id }))
  ownership()
  assert.equal(old.references, 0)
  const boarding = currentPersonOrder(world.buildingOrders, person)
  assert.deepEqual(
    [boarding.model, boarding.flags, boarding.a, boarding.references],
    [22, 0, balloon.id, 1]
  )
  assert.equal(boarding.b, ((balloon.x >>> 8) & 255) | (balloon.y & 0xff00))
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const restored = store.getWorld()
  const comparable = w => {
    const copy = structuredClone(w)
    for (const index of [0, 2])
      if (copy.shrines[index].reward === undefined) copy.shrines[index].reward = 'mana'
    return copy
  }
  for (let turn = 0; turn < 120; turn++) {
    tick(world, 1 / 12)
    tick(restored, 1 / 12)
    assert.deepEqual(comparable(restored), comparable(world))
    ownership()
  }
  assert.equal(boarding.references, 0)
  assert.equal(currentPersonOrder(world.buildingOrders, person), undefined)
  assert.equal(person.state, 30)
  // The occupied zero-speed controller now centers and restores readiness.
  assert.deepEqual([balloon.x, balloon.y, balloon.speed], [18176, 31488, 0])
  assert.equal(vehicleReady(world.land, balloon), true)
  for (const modifiers of [{}, { shiftKey: true }, { altKey: true }, { ctrlKey: true }]) {
    selectUnit(world, shaman.id, false)
    assert.ok(command(world, { ...browserPosition(balloon), id: balloon.id }, modifiers))
    ownership()
    const order = currentPersonOrder(world.buildingOrders, person)
    assert.equal(order.model, 22)
    assert.equal(order.flags, modifiers.ctrlKey ? 128 : modifiers.shiftKey ? 64 : 0)
    tick(world, 1 / 12)
    assert.equal(order.references, 0)
    ownership()
  }
})
