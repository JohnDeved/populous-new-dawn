import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, addUnit } from '../app/model.ts'
import { createLivePerson } from '../app/live-people.ts'
import { stepLiveWorship } from '../app/live-worship.ts'
import { vehicleExit } from '../app/live-vehicles.ts'
import { stepLiveMovement } from '../app/live-movement.ts'
import { boardLiveVehicle, leaveLiveVehicle } from '../app/live-vehicles.ts'
import { browserPosition, cast, command, tick, selectUnit } from '../app/model.ts'
import { createGameStore } from '../app/game-store.ts'
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
function prepareFlight() {
  const store = createGameStore()
  store.startMission(22)
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

  return { store, world, shaman, balloon, north }
}

// Mana focus above is supplied through the existing spell-mask adapter. Actors,
// transport, spell stock, targets and travel are produced by campaign commands.
// Migration already defaults these two authored heads' optional reward field.
function comparable(world) {
  const copy = structuredClone(world)
  for (const head of copy.shrines)
    if (head.reward === undefined && head.rewardMana) head.reward = 'mana'
  return copy
}

test('Mission 22 Balloon worship lands, rewards once and continues through public Save/Load', async () => {
  const { store, world, shaman, balloon, north } = prepareFlight()
  selectUnit(world, shaman.id, false)
  assert.ok(command(world, { x: 55, z: 121 }))
  while (world.turn < 3900) tick(world, 1 / 12)
  assert.equal(balloon.passengerCount, 1)
  const rejected = structuredClone(world),
    person = rejected.units.find(u => u.id === shaman.id).native
  const commands = person.commands.slice()
  command(rejected, { ...north, id: north.id })
  assert.deepEqual(person.commands, commands)
  assert.equal(currentPersonOrder(rejected.buildingOrders, person).model, 3)
  // With this exact repeated public input sequence, shared plain-flight startup
  // changes the boundary: attempts3900..4004 retain travel, and4005 admits worship.
  // This is not a universal earliest admission turn for other input histories.
  const retained = shaman.native
  for (let turn = 3900; turn <= 4005; turn++) {
    assert.equal(world.turn, turn)
    assert.ok(command(world, { ...north, id: north.id }))
    assert.equal(shaman.native, retained)
    if (turn < 4005) {
      assert.deepEqual(retained.commands, commands)
      assert.equal(currentPersonOrder(world.buildingOrders, retained).model, 3)
      tick(world, 1 / 12)
    }
  }
  const worship = currentPersonOrder(world.buildingOrders, shaman.native)
  assert.equal(worship.model, 27)
  assert.equal(worship.references, 1)
  for (const id of commands.filter(Boolean))
    assert.equal(world.buildingOrders.records[id].references, 0)
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const restored = store.getWorld()
  assert.deepEqual(comparable(restored), comparable(world))
  let landed = 0,
    rewarded = 0
  for (let i = 0; i < 400; i++) {
    const p = shaman.native,
      before = p.counter
    tick(world, 1 / 12)
    tick(restored, 1 / 12)
    assert.deepEqual(comparable(restored), comparable(world))
    if (p === shaman.native && p.state === 10) assert.equal(p.counter, (before + 1) & 255)
    if (!balloon.passengerCount && !landed) landed = world.turn
    if (north.uses && !rewarded) rewarded = world.turn
  }
  assert.equal(landed, 4048)
  assert.equal(rewarded, 4250)
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
