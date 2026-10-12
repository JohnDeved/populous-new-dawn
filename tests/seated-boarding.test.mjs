// Ordinary acquired M22 Balloon; preparation supplies only the mana-focus adapter.
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
test('same-vehicle boarding retains its acquired passenger through repeated input and Save/Load', async () => {
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
