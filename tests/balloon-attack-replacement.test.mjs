import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import { settleRouteLaunch } from './helpers/route-launch-landing.mjs'
import {
  checkpointComparisonView,
  assertCheckpointComparisonDomain,
} from './helpers/checkpoint-comparison-view.mjs'
// Campaign setup supplies spell-focus masks; actors, charges and travel evolve through actual ticks.
import { supportsFollower } from '../app/model.ts'
// Public attack-to-worship replacement preserves the original seated owner.
import test from 'node:test'
import { cancelLiveBuildingAttack } from '../app/live-building-combat.ts'
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
test('supplied-focus current Mission22 airborne attack replacement retains its passenger through worship and Save/Load', async () => {
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

  selectUnit(world, shaman.id, false)
  assert.ok(command(world, { x: 55, z: 121 }))
  while (world.turn < 3980) tick(world, 1 / 12)
  const target = world.buildings.find(b => b.id === 105)
  assert.equal(target.team, 'green')
  assert.equal(target.kind, 'tower')
  assert.equal(balloon.passengerCount, 1)
  assert.ok(command(world, { ...target, id: target.id }))
  const order = currentPersonOrder(world.buildingOrders, shaman.native)
  assert.deepEqual(
    [order.model, order.a, shaman.native.destinationX, shaman.native.destinationY],
    [19, 32549, 9216, 32256]
  )
  while (world.turn < 4000) tick(world, 1 / 12)
  const person = shaman.native,
    oldId = person.commands[person.commandCursor]
  assert.equal(world.objectCells.objects.get(shaman.id), person)
  assert.equal(person.vehicle, balloon.id)
  // Supplied rejection boundaries supplement the ordinary replacement above.
  for (const boundary of ['dead', 'grounded', 'inactive', 'missing-seat', 'different-owner']) {
    const control = structuredClone(world),
      unit = control.units.find(u => u.id === shaman.id),
      p = unit.native,
      vehicle = control.vehicles.find(v => v.id === balloon.id)
    if (boundary === 'dead') unit.hp = 0
    if (boundary === 'grounded') p.vehicle = 0
    if (boundary === 'inactive') vehicle.active = false
    if (boundary === 'missing-seat') vehicle.passengers = []
    if (boundary === 'different-owner') control.objectCells.objects.set(p.id, { ...p })
    cancelLiveBuildingAttack(control, unit)
    assert.equal(unit.native, null, boundary)
    assert.equal(control.buildingOrders.records[oldId].references, 0, boundary)
  }
  // A second ordinary attack packet uses the same shared replacement boundary.
  const attackAgain = structuredClone(world),
    againUnit = attackAgain.units.find(u => u.id === shaman.id),
    againPerson = againUnit.native
  selectUnit(attackAgain, shaman.id, false)
  assert.ok(command(attackAgain, { ...target, id: target.id }))
  assert.equal(againUnit.native, againPerson)
  assert.equal(attackAgain.objectCells.objects.get(shaman.id), againPerson)
  assert.equal(againPerson.vehicle, balloon.id)
  assert.equal(attackAgain.buildingOrders.records[oldId].references, 0)
  assert.equal(currentPersonOrder(attackAgain.buildingOrders, againPerson).model, 19)

  selectUnit(world, shaman.id, false)
  assert.ok(command(world, { ...north, id: north.id }))
  assert.equal(shaman.native, person)
  assert.equal(world.objectCells.objects.get(shaman.id), person)
  assert.equal(person.vehicle, balloon.id)
  assert.deepEqual(balloon.passengers, [shaman.id])
  assert.equal(world.buildingOrders.records[oldId].references, 0)
  assert.equal(currentPersonOrder(world.buildingOrders, person).model, 27)
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const restored = store.getWorld()
  assertCheckpointComparisonDomain(world)
  assertCheckpointComparisonDomain(restored)
  let departed = 0,
    rewarded = 0
  for (let i = 0; i < 600; i++) {
    tick(world, 1 / 12)
    tick(restored, 1 / 12)
    assert.deepEqual(checkpointComparisonView(restored), checkpointComparisonView(world))
    if (!person.vehicle && !departed) departed = world.turn
    if (north.uses && !rewarded) rewarded = world.turn
    assert.equal(balloon.passengers.includes(shaman.id), person.vehicle === balloon.id)
  }
  assert.ok(departed > 4000)
  assert.ok(rewarded > departed)
  assert.equal(north.uses, 1)
  assert.equal(shaman.hp, 100.6)
  assert.deepEqual(balloon.passengers, [])
  assert.equal(balloon.passengerCount, 0)
  assert.equal(world.buildingOrders.records[oldId].references, 0)
})
