// Bounded direct-target transport handoff; grounded combat remains the existing adapter.
import test from 'node:test'
import { createGameStore } from '../app/game-store.ts'
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
test('ordinary staged transport waypoints advance and retain the seated owner through Save/Load', async () => {
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
  while (world.turn < 4000) tick(world, 1 / 12)
  const person = shaman.native,
    old = person.commands[person.commandCursor]
  for (const [i, point] of [
    { x: 55, z: 121 },
    { x: 65, z: 121 },
  ].entries()) {
    assert.ok(command(world, point, { ctrlKey: true }))
    assert.equal(world.orderCursor, i + 1)
    assert.equal(shaman.native, person)
    assert.equal(world.objectCells.objects.get(shaman.id), person)
  }
  const ids = person.commands.filter(Boolean)
  assert.equal(ids.length, 2)
  assert.equal(world.buildingOrders.records[old].references, 0)
  for (const id of ids)
    assert.deepEqual(
      [
        world.buildingOrders.records[id].model,
        world.buildingOrders.records[id].flags,
        world.buildingOrders.records[id].references,
      ],
      [3, 128, 1]
    )
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const restored = store.getWorld(),
    comparable = w => {
      const copy = structuredClone(w)
      // Existing checkpoint schema adds these defaults; runtime state is not changed.
      for (const head of copy.shrines)
        if (head.reward === undefined && head.rewardMana) head.reward = 'mana'
      return copy
    }
  let first = 0,
    last = 0
  for (let i = 0; i < 700; i++) {
    tick(world, 1 / 12)
    tick(restored, 1 / 12)
    assert.deepEqual(comparable(restored), comparable(world))
    assert.equal(person.vehicle, balloon.id)
    assert.equal(shaman.native, person)
    assert.equal(world.objectCells.objects.get(shaman.id), person)
    assert.deepEqual(balloon.passengers, [shaman.id])
    if (!first && !world.buildingOrders.records[ids[0]].references) {
      first = world.turn
      assert.equal(
        currentPersonOrder(world.buildingOrders, person),
        world.buildingOrders.records[ids[1]]
      )
      assert.equal(world.buildingOrders.records[ids[1]].references, 1)
    }
    if (!last && !world.buildingOrders.records[ids[1]].references) last = world.turn
  }
  assert.equal(first, 4045)
  assert.equal(last, 4121)
  assert.equal(person.state, 30)
  assert.equal(person.commands.filter(Boolean).length, 0)
  assert.equal(shaman.hp, 100)
})
