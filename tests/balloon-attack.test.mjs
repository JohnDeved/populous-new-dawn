import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import { checkpointComparisonView, assertCheckpointComparisonDomain } from './helpers/checkpoint-comparison-view.mjs'
import { settleRouteLaunch } from './helpers/route-launch-landing.mjs'
// Campaign setup supplies spell-focus masks; actors, charges and travel evolve through actual ticks.
import { supportsFollower } from '../app/model.ts'
import { reachMission22FlightPoint } from './helpers/mission22-flight-phase.mjs'
import { loadHistoricalMission22Balloon } from './helpers/historical-mission22-balloon.mjs'
// Ordinary transport handoff, Tower destruction, local rest and casualty cleanup.
import test from 'node:test'
import { leaveLiveAttackVehicle } from '../app/live-building-combat.ts'
import { createLivePerson } from '../app/live-people.ts'
import { boardLiveVehicle, vehicleExit } from '../app/live-vehicles.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { vehicleReady } from '../app/vehicle-routing.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

import assert from 'node:assert/strict'
import {
  browserPosition,
  cast,
  command,
  tick,
  createWorld,
  selectUnit,
  addUnit,
} from '../app/model.ts'
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
// Preparation declares Mission 22 availability and supplies the existing mana-focus mask adapter.
async function prepareEarnedFlight() {
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

async function assertTowerContinuation({ store, world, shaman, balloon }, expected) {
  selectUnit(world, shaman.id, false)
  assert.ok(command(world, { x: 55, z: 121 }))
  reachMission22FlightPoint(world, shaman, balloon, 18607, 31225)
  assert.deepEqual([world.turn, shaman.native.counter], expected.inputPhase)
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
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const restored = store.getWorld()
  assertCheckpointComparisonDomain(world)
  assertCheckpointComparisonDomain(restored)
  let death = 0,
    targetDeath = 0,
    retired = 0,
    timedAssertions = 0,
    firstFight = 0,
    firstOpponent = 0
  while (world.turn < 6429) {
    tick(world, 1 / 12)
    tick(restored, 1 / 12)
    assert.deepEqual(checkpointComparisonView(restored), checkpointComparisonView(world))
    if (world.turn === expected.cancel) {
      timedAssertions++
      const cancelled = structuredClone(world),
        unit = cancelled.units.find(u => u.id === shaman.id),
        person = unit.native,
        oldOrder = person.commands[0],
        transport = cancelled.vehicles.find(v => v.id === balloon.id)
      selectUnit(cancelled, unit.id, false)
      assert.ok(command(cancelled, { x: 55, z: 121 }))
      assert.equal(unit.native, person)
      assert.equal(person.vehicle, transport.id)
      assert.deepEqual(transport.passengers, [unit.id])
      assert.equal(cancelled.buildingOrders.records[oldOrder].references, 0)
      const movement = currentPersonOrder(cancelled.buildingOrders, person)
      assert.equal(movement.model, 3)
      for (let turn = 0; turn < 400; turn++) tick(cancelled, 1 / 12)
      // Plain model3 cancels the attack and finishes aboard. Deliberate Shift
      // departure has separate ordinary flight/landing coverage.
      assert.equal(person.vehicle, transport.id)
      assert.deepEqual(transport.passengers, [unit.id])
      assert.equal(unit.native, person)
      assert.equal(cancelled.objectCells.objects.get(unit.id), person)
      assert.equal(unit.hp, 100.6)
      assert.equal(cancelled.buildingOrders.records[oldOrder].references, 0)
      assert.equal(movement.references, 0)
      assert.equal(transport.speed, 0)
      assert.deepEqual([transport.x, transport.y], expected.cancelRest)
      assert.equal(vehicleReady(cancelled.land, transport), true)
    }
    if (shaman.fight && !firstFight) {
      firstFight = world.turn
      firstOpponent = shaman.fight.opponent
    }
    if (shaman.hp <= 0 && !death) death = world.turn
    if (target.hp <= 0 && !targetDeath) targetDeath = world.turn
    if (!order.references && !retired) retired = world.turn
    if (world.turn === expected.departure - 1) {
      timedAssertions++
      assert.equal(shaman.native.vehicle, balloon.id)
    }
    if (world.turn === expected.departure) {
      timedAssertions++
      assert.deepEqual(
        [shaman.native.substate, shaman.native.workTarget, shaman.native.vehicle],
        [3, 105, 0]
      )
      assert.deepEqual(balloon.passengers, [])
      assert.equal(balloon.passengerCount, 0)
    }
    if (world.turn === expected.fight) {
      timedAssertions++
      assert.equal(shaman.fight.opponent, expected.opponent)
      assert.equal(world.units.find(u => u.id === expected.opponent).kind, 'warrior')
      assert.equal(shaman.fight.motion.vehicle, 0)
    }
  }
  assert.equal(timedAssertions, 4)
  assert.deepEqual([firstFight, firstOpponent], [expected.fight, expected.opponent])
  assert.equal(target.hp, expected.targetHp ?? 0)
  // Preserve each actual browser outcome and its ownership cleanup. Historical
  // acquisition destroys the Tower and rests locally; fresh physical Boat travel
  // reaches a guard-interception phase that kills the Shaman before any damage.
  // Neither chronology is a claim of native damage/death parity.
  assert.equal(targetDeath, expected.targetDeath)
  assert.equal(retired, expected.retired)
  assert.equal(death, expected.death)
  if (expected.survivor) {
    assert.equal(world.units.includes(shaman), true)
    assert.equal(world.objectCells.objects.get(shaman.id), shaman.native)
    assert.equal(shaman.native.vehicle, 0)
    assert.equal(currentPersonOrder(world.buildingOrders, shaman.native), undefined)
    assert.deepEqual({ hp: shaman.hp, x: shaman.x, z: shaman.z,
      state: shaman.native.state, anchorX: shaman.native.anchorX, anchorY: shaman.native.anchorY },
    expected.survivor)
  } else {
    assert.equal(shaman.hp, 0)
    assert.equal(world.units.includes(shaman), false)
    assert.equal(world.objectCells.objects.has(shaman.id), false)
  }
  assert.equal(world.buildings.includes(target), expected.targetDeath === 0)
  assert.equal(order.references, 0)
  assert.deepEqual(balloon.passengers, [])
}

// Fresh physical Boat acquisition retains its actual failed direct-attack chronology.
// The historical case below still requires Tower destruction and Warrior11 interception.
test('fresh supplied-focus Balloon tower attack is intercepted before Tower damage and cleans up through Save/Load', async () => {
  await assertTowerContinuation(await prepareEarnedFlight(), {
    inputPhase: [3535, 207],
    cancel: 3555,
    cancelRest: [16640, 32512],
    departure: 3824,
    fight: 3832,
    opponent: 11,
    targetHp: 260,
    targetDeath: 0,
    retired: 3921,
    death: 3921,
  })
})

// This hash-verified c44dadfc campaign checkpoint uses supplied spell-focus setup.
// It preserves the original combat witness independently of current acquisition.
test('historical c44 supplied-focus Balloon checkpoint retains Warrior11, Tower105 destruction and local Shaman rest through Save/Load', async () => {
  await assertTowerContinuation(await loadHistoricalMission22Balloon(), {
    inputPhase: [3233, 161],
    cancel: 3253,
    cancelRest: [16128, 32512],
    departure: 3520,
    fight: 3526,
    opponent: 11,
    targetDeath: 5350,
    retired: 5351,
    death: 0,
    survivor: { hp: 100.75, x: 29, z: 120.75, state: 19, anchorX: 9472, anchorY: 32576 },
  })
})

// Supplied leaf boundaries supplement, not replace, both campaign witnesses.
for (const blocked of [false, true])
  test(`forced attack departure with blocked=${blocked}`, () => {
    const world = createWorld(22),
      balloon = world.vehicles.find(v => v.model === 3),
      unit = addUnit(world, 'blue', 'shaman', browserPosition(balloon))
    unit.native = createLivePerson(world, unit)
    const p = unit.native
    world.pathfinding.people.set(unit.id, p)
    assert.ok(boardLiveVehicle(world, p, balloon))
    world.land.flags.fill(blocked ? 4 : 0)
    world.land.categories.fill(rules.terrainCategoryFlags.findIndex(flags => flags & 1))
    world.land.walkMasks[world.pathfinding.state.walkMask].fill(255)
    const expected = blocked
      ? { x: balloon.x & 65535, y: balloon.y & 65535 }
      : { x: (p.x + 768) & 65535, y: p.y }
    if (blocked) assert.equal(vehicleExit(world, balloon).found, false)
    leaveLiveAttackVehicle(world, p, { x: (p.x + 1000) & 65535, y: p.y })
    assert.equal(p.vehicle, 0)
    assert.deepEqual(balloon.passengers, [])
    assert.equal(balloon.passengerCount, 0)
    assert.deepEqual([p.x, p.y], [expected.x, expected.y])
    assert.deepEqual(
      [p.anchorX, p.anchorY, p.anchorFlags],
      [(expected.x & 0xfe00) + 256, (expected.y & 0xfe00) + 256, 0]
    )
  })
