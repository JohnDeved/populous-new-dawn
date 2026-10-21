import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import { scalableReferenceIds } from './helpers/scalable-reference-ids.mjs'
import { checkpointComparisonView, assertCheckpointComparisonDomain } from './helpers/checkpoint-comparison-view.mjs'
import {
  seatedAttackOrigin,
  boundedGroundAttackDeparture,
} from './helpers/seated-attack-origin.mjs'
import { settleRouteLaunch } from './helpers/route-launch-landing.mjs'
// Campaign setup supplies spell-focus masks; actors, charges and travel evolve through actual ticks.
import { supportsFollower } from '../app/model.ts'
import { reachMission22FlightPoint } from './helpers/mission22-flight-phase.mjs'
import { loadHistoricalMission22Balloon } from './helpers/historical-mission22-balloon.mjs'
// Bounded direct-target transport handoff; grounded combat remains the existing adapter.
import test from 'node:test'
import { currentPersonOrder } from '../app/person-orders.ts'
import { release } from '../app/world-tasks.ts'

import assert from 'node:assert/strict'
import { browserPosition, cast, command, tick, selectUnit } from '../app/model.ts'
const referenceId = scalableReferenceIds(22)
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
async function prepareFreshFlight() {
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

  return { store, world, shaman, balloon }
}

async function assertPlainPersonAttack({ store, world, shaman, balloon }, historical) {
  selectUnit(world, shaman.id, false)
  assert.ok(command(world, { x: 55, z: 121 }))
  reachMission22FlightPoint(world, shaman, balloon, 20767, 29926)
  const rejectedPerson = shaman.native,
    rejectedOrder = currentPersonOrder(world.buildingOrders, rejectedPerson),
    rejectedCommands = [...rejectedPerson.commands]
  const overwaterTarget = world.units.find(u => u.id === 17)
  assert.ok(command(world, { ...overwaterTarget, id: overwaterTarget.id }))
  assert.deepEqual(rejectedPerson.commands, rejectedCommands)
  assert.equal(currentPersonOrder(world.buildingOrders, rejectedPerson), rejectedOrder)
  assert.equal(shaman.native, rejectedPerson)
  assert.equal(world.objectCells.objects.get(shaman.id), rejectedPerson)
  assert.match(world.message, /No land route/)
  reachMission22FlightPoint(world, shaman, balloon, 18067, 31550)
  const target = world.units.find(u => u.id === 17)
  assert.equal(target.team, 'green')
  assert.equal(target.kind, 'preacher')
  // Supplied team-only boundary, not an ordinary mixed-campaign claim:
  // the existing grounded Brave keeps legacy targeting beside the real passenger.
  const mixed = structuredClone(world),
    mixedShaman = mixed.units.find(u => u.id === shaman.id),
    mixedPerson = mixedShaman.native,
    grounded = mixed.units.find(u => u.id === (historical ? 173 : referenceId(173)))
  assert.equal(grounded.kind, 'brave')
  assert.ok(grounded.hp > 0)
  assert.ok(!grounded.native && !grounded.flight && !grounded.entry)
  grounded.team = 'blue'
  selectUnit(mixed, shaman.id, false)
  selectUnit(mixed, grounded.id, true)
  assert.ok(command(mixed, { ...target, id: target.id }))
  assert.equal(mixedShaman.native, mixedPerson)
  assert.equal(mixed.objectCells.objects.get(shaman.id), mixedPerson)
  assert.equal(mixedPerson.vehicle, balloon.id)
  assert.equal(currentPersonOrder(mixed.buildingOrders, mixedPerson).model, 28)
  assert.equal(currentPersonOrder(mixed.buildingOrders, mixedPerson).references, 1)
  assert.equal(grounded.target, target.id)
  assert.equal(grounded.path.length, 2)
  assert.ok(
    !grounded.native || currentPersonOrder(mixed.buildingOrders, grounded.native)?.model !== 28
  )

  // Supplied capacity boundary: every usable slot is externally held; releasing
  // this owner's old movement record cannot free it. Classic exhausts while the
  // actual current-store policy must grow without disturbing the seated owner.
  const full = structuredClone(world),
    fullUnit = full.units.find(u => u.id === shaman.id),
    fullPerson = fullUnit.native,
    heldOrder = fullPerson.commands.find(Boolean)
  assert.equal(full.buildingOrders.records.length, 800)
  for (const record of full.buildingOrders.records.slice(1)) record.references = 1
  full.buildingOrders.records[heldOrder].references = 2
  full.buildingOrders.active = 799
  const released = structuredClone(full)
  release(
    released,
    released.units.find(u => u.id === shaman.id)
  )
  const routeReferences = routes => {
    const slots = routes.records.length / 109
    assert.ok(Number.isInteger(slots))
    assert.equal(routes.references !== undefined, !historical)
    if (routes.references !== undefined) {
      assert.ok(routes.references instanceof Float64Array)
      assert.equal(routes.references.length, slots)
      return Array.from(routes.references)
    }
    const view = new DataView(
      routes.records.buffer, routes.records.byteOffset, routes.records.byteLength
    )
    return Array.from({ length: slots }, (_, i) => view.getInt16(i * 109, true))
  }
  selectUnit(full, shaman.id, false)
  assert.ok(command(full, { ...target, id: target.id }))
  assert.equal(fullUnit.native, fullPerson)
  assert.equal(full.objectCells.objects.get(shaman.id), fullPerson)
  assert.equal(fullPerson.vehicle, balloon.id)
  assert.deepEqual(full.vehicles.find(v => v.id === balloon.id).passengers, [shaman.id])
  if (historical) {
    assert.equal(full.capacityPolicy.mode, 'classic')
    assert.equal(currentPersonOrder(full.buildingOrders, fullPerson), undefined)
    assert.deepEqual(fullPerson.commands, Array(8).fill(0))
    assert.equal(full.buildingOrders.records.length, 800)
    assert.match(full.message, /No command slots/)
  } else {
    assert.equal(full.capacityPolicy.mode, 'scalable')
    const order = currentPersonOrder(full.buildingOrders, fullPerson)
    assert.equal(order.model, 28)
    assert.equal(order.a, target.id)
    assert.equal(order.references, 1)
    assert.equal(fullPerson.commands[fullPerson.commandCursor], 800)
    assert.equal(full.buildingOrders.records.length, 1600)
    assert.equal(full.buildingOrders.active, 800)
    assert.doesNotMatch(full.message, /No command slots/)
    // Successful growth must behave like the same attack with free order slots,
    // not like the classic exhausted branch which never allocates a new route.
    const control = structuredClone(world),
      controlPerson = control.units.find(u => u.id === shaman.id).native
    selectUnit(control, shaman.id, false)
    assert.ok(command(control, { ...target, id: target.id }))
    assert.deepEqual(full.motionRoutes, control.motionRoutes)
    assert.deepEqual(routeReferences(full.motionRoutes), routeReferences(control.motionRoutes))
    const fullRouteOwner = full.pathfinding.people.get(shaman.id),
      controlRouteOwner = control.pathfinding.people.get(shaman.id)
    // This seated attack plans through a separate query owner, not the physical
    // passenger. It must retain the same identity and empty order queue as control.
    assert.notEqual(fullRouteOwner, fullPerson)
    assert.notEqual(controlRouteOwner, controlPerson)
    assert.equal(fullRouteOwner.id, shaman.id)
    assert.deepEqual(fullRouteOwner.commands, Array(8).fill(0))
    assert.deepEqual(fullRouteOwner, controlRouteOwner)
    const routeFields = person => Object.fromEntries([
      'vehicle', 'flags2', 'flags4', 'motionGroup', 'motionIndex', 'recoveryCounter',
      'goalX', 'goalY', 'destinationX', 'destinationY', 'turnAngle', 'turnY',
    ].map(key => [key, person[key]]))
    assert.deepEqual(routeFields(fullPerson), routeFields(controlPerson))
    release(full, fullUnit)
    assert.deepEqual(fullPerson.commands, Array(8).fill(0))
    assert.equal(full.buildingOrders.records[800].references, 0)
    assert.equal(full.buildingOrders.active, 799)
  }
  assert.equal(full.buildingOrders.records[heldOrder].references, 1)
  assert.equal(full.motionRoutes.active, released.motionRoutes.active)
  assert.deepEqual(routeReferences(full.motionRoutes), routeReferences(released.motionRoutes))
  assert.equal(full.pathfinding.people.has(shaman.id), false)

  selectUnit(world, shaman.id, false)
  const previousPerson = shaman.native,
    previousOrder = previousPerson.commands.find(Boolean)
  assert.ok(command(world, { ...target, id: target.id }))
  assert.equal(shaman.native, previousPerson)
  assert.equal(world.objectCells.objects.get(shaman.id), previousPerson)
  assert.equal(world.buildingOrders.records[previousOrder].references, 0)
  const person = shaman.native,
    orderId = person.commands[person.commandCursor]
  assert.deepEqual(
    [currentPersonOrder(world.buildingOrders, person).model, person.vehicle],
    [28, balloon.id]
  )

  assert.equal(currentPersonOrder(world.buildingOrders, person).flags, 0)
  assert.deepEqual(balloon.passengers, [shaman.id])

  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const restored = store.getWorld(),
    comparable = checkpointComparisonView
  assertCheckpointComparisonDomain(world)
  assertCheckpointComparisonDomain(restored)
  const encounters = []
  let departures = 0,
    departure = 0,
    firstOpponent = 0,
    firstOpponentTeam = null,
    firstFight = 0,
    targetDeath = 0,
    death = 0
  for (let i = 0; i < 1200; i++) {
    const beforeVehicle = person.vehicle,
      beforeCounter = person.counter,
      beforeOpponent = shaman.fight?.opponent
    const beforeSeat = { x: shaman.x, z: shaman.z }
    // Historical inputs may carry stale metadata until their first ordinary visit.
    if (beforeVehicle && i) seatedAttackOrigin(world, shaman, balloon)
    tick(world, 1 / 12)
    tick(restored, 1 / 12)
    if (person.vehicle) seatedAttackOrigin(world, shaman, balloon)
    assert.deepEqual(comparable(restored), comparable(world))
    if (beforeVehicle && !person.vehicle) {
      boundedGroundAttackDeparture(shaman, beforeSeat)
      departures++
      departure = world.turn
      assert.deepEqual([person.workTarget, person.substate], [target.id, 2])
      assert.equal(person.counter, (beforeCounter + 1) & 255)
      assert.equal(world.buildingOrders.records[orderId].references, 1)
    }
    if (shaman.fight && shaman.fight.opponent !== beforeOpponent)
      encounters.push([world.turn, shaman.fight.opponent])
    if (shaman.fight && !firstOpponent) {
      firstFight = world.turn
      firstOpponent = shaman.fight.opponent
      firstOpponentTeam = world.units.find(u => u.id === firstOpponent).team
    }
    if (target.hp <= 0 && !targetDeath) targetDeath = world.turn
    if (shaman.hp <= 0 && !death) death = world.turn
  }
  assert.equal(departures, 1)
  if (historical) {
    assert.equal(departure, 3540)
    assert.equal(firstFight, 3545)
    assert.equal(firstOpponent, 17)
    assert.equal(firstOpponentTeam, 'green')
    // The old-source victory is retained in the paired historical evidence.
    // Correct native seat coordinates change the existing grounded attack exit.
    assert.equal(death, 3578)
    assert.equal(targetDeath, 0)
    assert.equal(shaman.hp, 0)
    assert.equal(world.objectCells.objects.has(shaman.id), false)
    assert.equal(world.units.includes(shaman), false)
    assert.equal(world.units.includes(target), true)
    assert.equal(world.objectCells.objects.has(target.id), true)
    assert.equal(target.hp, 55)
  } else {
    // First contact retains selected Preacher17; guard reinforcement and actual
    // melee opponent writes yield this exact existing grounded-adapter outcome.
    assert.equal(departure, 3844)
    assert.equal(firstFight, 3849)
    assert.equal(firstOpponent, 17)
    assert.equal(firstOpponentTeam, 'green')
    assert.deepEqual(encounters, [
      [3849, 17],
      [3866, 10],
      [3870, 12],
      [3878, 10],
    ])
    assert.equal(death, 3886)
    assert.equal(targetDeath, 0)
    assert.equal(shaman.hp, 0)
    assert.equal(world.objectCells.objects.has(shaman.id), false)
    assert.equal(world.units.includes(shaman), false)
    assert.equal(world.units.includes(target), true)
    assert.equal(world.objectCells.objects.has(target.id), true)
    assert.equal(target.hp, 55)
  }
  assert.equal(world.buildingOrders.records[orderId].references, 0)
  assert.deepEqual(balloon.passengers, [])
  assert.equal(balloon.passengerCount, 0)
}

test('fresh supplied-focus dry-route plain person target preserves interception and cleanup through Save/Load', async () => {
  await assertPlainPersonAttack(await prepareFreshFlight(), false)
})

// The c44dadfc checkpoint is historical input, not a promise of the old outcome.
// Old-source victory is retained; corrected current-source interception is asserted.
test('historical c44 Balloon checkpoint uses corrected seat origin and retains current interception cleanup through Save/Load', async () => {
  await assertPlainPersonAttack(await loadHistoricalMission22Balloon(), true)
})
