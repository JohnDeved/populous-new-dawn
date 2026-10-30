import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import {
  checkpointComparisonView as comparable,
  assertCheckpointComparisonDomain,
} from './helpers/checkpoint-comparison-view.mjs'
import { settleRouteLaunch } from './helpers/route-launch-landing.mjs'
// Campaign setup supplies spell-focus masks; actors, charges and travel evolve through actual ticks.
import { supportsFollower } from '../app/model.ts'
import { reachMission22FlightPoint } from './helpers/mission22-flight-phase.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, addUnit } from '../app/model.ts'
import { createLivePerson } from '../app/live-people.ts'
import { stepLiveWorship } from '../app/live-worship.ts'
import { vehicleExit } from '../app/live-vehicles.ts'
import { stepLiveMovement } from '../app/live-movement.ts'
import { boardLiveVehicle, leaveLiveVehicle } from '../app/live-vehicles.ts'
import { browserPosition, cast, command, tick, selectUnit } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'

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
async function prepareFlight() {
  const store = await createCampaignFixtureStore([22])
  assert.equal(store.startMission(22), true)
  let world = store.getWorld(),
    shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
    balloon = world.vehicles.find(vehicle => vehicle.model === 3),
    boat = world.vehicles.find(vehicle => vehicle.model === 1),
    south = world.shrines.find(shrine => shrine.rewardMana === 600_000),
    north = world.shrines.find(shrine => shrine.rewardMana === 1_000_000)

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

  return { store, world, shaman, balloon, north }
}

// Mana focus above is supplied through the existing spell-mask adapter. Actors,
// transport, spell stock, targets and travel are produced by campaign commands.
// Migration already defaults these two authored heads' optional reward field.
test('supplied-focus Mission22 Balloon worship lands, rewards once and continues through public Save/Load', async () => {
  const { store, world, shaman, balloon, north } = await prepareFlight()
  selectUnit(world, shaman.id, false)
  assert.ok(command(world, { x: 55, z: 121 }))
  reachMission22FlightPoint(world, shaman, balloon, 20767, 29926)
  assert.equal(balloon.passengerCount, 1)
  const rejected = structuredClone(world),
    person = rejected.units.find(u => u.id === shaman.id).native
  const commands = person.commands.slice()
  command(rejected, { ...north, id: north.id })
  assert.deepEqual(person.commands, commands)
  assert.equal(currentPersonOrder(rejected.buildingOrders, person).model, 3)
  // Keep the actual repeated-input history: every rejected attempt retains
  // the original travel owner and record, until the first real admission.
  const retained = shaman.native,
    attempts = []
  for (let count = 0; count < 150; count++) {
    attempts.push(world.turn)
    assert.ok(command(world, { ...north, id: north.id }))
    assert.equal(shaman.native, retained)
    if (currentPersonOrder(world.buildingOrders, retained).model === 27) break
    assert.deepEqual(retained.commands, commands)
    assert.equal(currentPersonOrder(world.buildingOrders, retained).model, 3)
    tick(world, 1 / 12)
  }
  // Dry Boat acquisition is later; retain all 105 rejections and one admission.
  assert.deepEqual(
    attempts,
    Array.from({ length: 106 }, (_, index) => 3455 + index)
  )
  const worship = currentPersonOrder(world.buildingOrders, shaman.native)
  assert.equal(worship.model, 27)
  assert.equal(worship.references, 1)
  for (const id of commands.filter(Boolean))
    assert.equal(world.buildingOrders.records[id].references, 0)
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const restored = store.getWorld()
  assertCheckpointComparisonDomain(world)
  assertCheckpointComparisonDomain(restored)
  assert.deepEqual(comparable(restored), comparable(world))
  let landed = 0,
    rewarded = 0,
    landings = 0,
    rewards = 0
  for (let i = 0; i < 400; i++) {
    const p = shaman.native,
      before = p.counter,
      beforePassengers = balloon.passengerCount,
      beforeUses = north.uses
    tick(world, 1 / 12)
    tick(restored, 1 / 12)
    assert.deepEqual(comparable(restored), comparable(world))
    if (p === shaman.native && p.state === 10) assert.equal(p.counter, (before + 1) & 255)
    if (beforePassengers && !balloon.passengerCount) landings++
    if (north.uses !== beforeUses) rewards++
    if (!balloon.passengerCount && !landed) landed = world.turn
    if (north.uses && !rewarded) rewarded = world.turn
  }
  assert.equal(landings, 1)
  assert.equal(rewards, 1)
  assert.equal(landed, 3603)
  // Worship checks its standing phase on even person counters.
  assert.equal(rewarded, 3806)
  assert.equal(north.uses, 1)
  assert.equal(worship.references, 0)
  assert.equal(shaman.native.vehicle, 0)
  assert.equal(shaman.hp, 100.6)
  assert.deepEqual(balloon.passengers, [])
  assert.equal(balloon.passengerCount, 0)
})

// Supplied transport-role boundary control, separate from the campaign witness.
test('vehicle movement visits advance each passenger clock once, including wrap and departure', () => {
  const world = createWorld(22),
    balloon = world.vehicles.find(v => v.model === 3),
    passengers = ['brave', 'warrior'].map(kind => {
      const unit = addUnit(world, 'blue', kind, browserPosition(balloon))
      unit.native = createLivePerson(world, unit)
      world.pathfinding.people.set(unit.id, unit.native)
      assert.ok(boardLiveVehicle(world, unit.native, balloon))
      unit.native.state = 19
      unit.native.counter = 255
      unit.native.destinationX = balloon.x
      unit.native.destinationY = balloon.y
      return unit
    })
  for (const unit of passengers) {
    stepLiveMovement(world, unit)
    assert.equal(unit.native.counter, 0)
    assert.equal(unit.native.vehicle, balloon.id)
  }
  const driver = passengers[0]
  leaveLiveVehicle(world, balloon, driver.native, { x: balloon.x, y: balloon.y })
  assert.equal(driver.native.counter, 0)
  stepLiveMovement(world, driver)
  assert.equal(driver.native.counter, 1)
})

// Supplied failed-exit boundary: no available land must not detach ownership.
test('worship keeps its passenger attached when every exit is blocked', () => {
  const world = createWorld(22),
    balloon = world.vehicles.find(v => v.model === 3),
    unit = addUnit(world, 'blue', 'shaman', browserPosition(balloon))
  unit.native = createLivePerson(world, unit)
  const person = unit.native
  world.pathfinding.people.set(unit.id, person)
  assert.ok(boardLiveVehicle(world, person, balloon))
  Object.assign(person, {
    substate: 1,
    target: world.shrines[0].id,
    goalX: person.x,
    goalY: person.y,
    counter: 1,
    flags2: person.flags2 & ~0x40000000,
  })
  world.land.flags.fill(4)
  assert.equal(vehicleExit(world, balloon).found, false)
  const position = { x: person.x, y: person.y, h: person.h }
  assert.equal(stepLiveWorship(world, unit), false)
  assert.equal(person.vehicle, balloon.id)
  assert.deepEqual(balloon.passengers, [unit.id])
  assert.equal(balloon.passengerCount, 1)
  assert.deepEqual({ x: person.x, y: person.y, h: person.h }, position)
})
