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
test('ordinary queued person target moves its transport and preserves handoff through Save/Load', async () => {
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
  assert.ok(command(world, { x: -25, z: -63 }))
  stepUntil(world, () => boat.passengerCount === 0, 2_000)

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
  assert.ok(command(world, { x: -83, z: -57 }))
  stepUntil(world, () => boat.passengerCount === 0, 2_000)
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
  while (world.turn < 3980) tick(world, 1 / 12)
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
  let departure = 0,
    firstOpponent = 0,
    firstFight = 0,
    firstOpponentTeam = null,
    death = 0,
    targetDeath = 0
  for (let i = 0; i < 1200; i++) {
    const beforeVehicle = person.vehicle,
      beforeCounter = person.counter
    tick(world, 1 / 12)
    tick(restored, 1 / 12)
    assert.deepEqual(comparable(restored), comparable(world))
    if (beforeVehicle && !person.vehicle) {
      departure = world.turn
      assert.deepEqual([person.workTarget, person.substate], [target.id, 2])
      assert.equal(person.counter, (beforeCounter + 1) & 255)
      assert.equal(world.buildingOrders.records[orderId].references, 1)
    }
    if (shaman.fight && !firstOpponent) {
      firstFight = world.turn
      firstOpponent = shaman.fight.opponent
      firstOpponentTeam = world.units.find(u => u.id === firstOpponent).team
    }
    if (shaman.hp <= 0 && !death) death = world.turn
    if (target.hp <= 0 && !targetDeath) targetDeath = world.turn
  }
  assert.equal(departure, 4284)
  assert.equal(firstFight, 4285)
  assert.equal(firstOpponent, 17)
  assert.equal(firstOpponentTeam, 'green')
  // Generic shared player28 now runs its native startup tail. The matched
  // input changes configuration/RNG, while the selected first opponent remains17.
  // Keep the former Shaman-death failure as a distinct, superseded outcome.
  assert.equal(death, 0)
  assert.equal(targetDeath, 4557)
  assert.equal(world.turn, 5180)
  assert.equal(shaman.hp, 101)
  assert.equal(world.units.includes(shaman), true)
  assert.equal(world.objectCells.objects.get(shaman.id), shaman.native)
  assert.ok(shaman.native)
  assert.equal(world.buildingOrders.records[orderId].references, 0)
  assert.equal(target.hp, 0)
  assert.equal(world.units.includes(target), false)
  assert.equal(world.objectCells.objects.has(target.id), false)
  assert.deepEqual(balloon.passengers, [])
  assert.equal(balloon.passengerCount, 0)
})
