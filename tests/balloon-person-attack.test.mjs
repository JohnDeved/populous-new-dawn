// Campaign setup supplies spell-focus masks; actors, charges and travel evolve through actual ticks.
import { supportsFollower } from '../app/model.ts'
import { reachMission22FlightPoint } from './helpers/mission22-flight-phase.mjs'
// Bounded direct-target transport handoff; grounded combat remains the existing adapter.
import test from 'node:test'
import { createGameStore } from '../app/game-store.ts'
import { stepLiveAboardPersonAttack } from '../app/live-building-combat.ts'
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
test('supplied-focus current Mission22 queued person target moves its transport and preserves handoff through Save/Load', async () => {
  const store = createGameStore()
  store.startMission(22)
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

  selectUnit(world, shaman.id, false)
  assert.ok(command(world, { x: 55, z: 121 }))
  reachMission22FlightPoint(world, shaman, balloon, 18607, 31225)
  const target = world.units.find(u => u.id === 17)
  assert.equal(target.team, 'green')
  assert.equal(target.kind, 'preacher')
  selectUnit(world, shaman.id, false)
  assert.ok(command(world, { ...target, id: target.id }, { ctrlKey: true }))
  const person = shaman.native,
    orderId = person.commands[person.commandCursor]
  assert.deepEqual(
    [currentPersonOrder(world.buildingOrders, person).model, person.vehicle],
    [28, balloon.id]
  )

  // Supplied driver/non-driver clock-wrap boundaries, separate from ordinary play.
  for (const driver of [true, false]) {
    const control = structuredClone(world),
      unit = control.units.find(u => u.id === shaman.id),
      p = unit.native,
      vehicle = control.vehicles.find(v => v.id === balloon.id)
    p.counter = 255
    if (!driver) vehicle.passengers.unshift(999)
    assert.ok(stepLiveAboardPersonAttack(control, unit))
    assert.equal(p.counter, 0)
    assert.equal(p.vehicle, vehicle.id)
  }

  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const restored = store.getWorld(),
    comparable = w => {
      const copy = structuredClone(w)
      for (const head of copy.shrines)
        if (head.reward === undefined && head.rewardMana) head.reward = 'mana'
      return copy
    }
  const encounters = []
  let departures = 0,
    departure = 0,
    firstOpponent = 0,
    firstFight = 0,
    firstOpponentTeam = null,
    death = 0,
    targetDeath = 0
  for (let i = 0; i < 1200; i++) {
    const beforeVehicle = person.vehicle,
      beforeCounter = person.counter,
      beforeOpponent = shaman.fight?.opponent
    tick(world, 1 / 12)
    tick(restored, 1 / 12)
    assert.deepEqual(comparable(restored), comparable(world))
    if (beforeVehicle && !person.vehicle) {
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
    if (shaman.hp <= 0 && !death) death = world.turn
    if (target.hp <= 0 && !targetDeath) targetDeath = world.turn
  }
  assert.equal(departures, 1)
  assert.equal(departure, 3804)
  assert.equal(firstFight, 3814)
  assert.deepEqual(encounters, [
    [3814, 10],
    [3845, 12],
  ])
  assert.equal(firstOpponent, 10)
  assert.equal(firstOpponentTeam, 'green')
  // The longer dry Boat route changes the counter phase and campaign RNG.
  // This moving attack still first encounters Warrior 10, then Warrior 12;
  // observed death retires command 28 while the selected Preacher 17 survives.
  // This is a browser outcome, not a native damage/landing parity claim.
  assert.equal(death, 3848)
  assert.equal(targetDeath, 0)
  assert.equal(shaman.hp, 0)
  assert.equal(world.units.includes(shaman), false)
  assert.equal(world.objectCells.objects.has(shaman.id), false)

  assert.equal(world.buildingOrders.records[orderId].references, 0)
  assert.equal(target.hp, 55)
  assert.equal(world.units.includes(target), true)
  assert.equal(world.objectCells.objects.has(target.id), true)
  assert.deepEqual(balloon.passengers, [])
  assert.equal(balloon.passengerCount, 0)
})
