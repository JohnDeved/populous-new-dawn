// Bounded direct-target transport handoff; grounded combat remains the existing adapter.
import test from 'node:test'
import { createGameStore } from '../app/game-store.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { release } from '../app/world-tasks.ts'

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
test('ordinary plain person target queues an unstaged transport attack through Save/Load', async () => {
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
  while (world.turn < 4000) tick(world, 1 / 12)
  const target = world.units.find(u => u.id === 17)
  assert.equal(target.team, 'green')
  assert.equal(target.kind, 'preacher')
  // Supplied team-only boundary, not an ordinary mixed-campaign claim:
  // the existing grounded Brave keeps legacy targeting beside the real passenger.
  const mixed = structuredClone(world),
    mixedShaman = mixed.units.find(u => u.id === shaman.id),
    mixedPerson = mixedShaman.native,
    grounded = mixed.units.find(u => u.id === 173)
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

  // Supplied capacity boundary: every slot is held; the old movement record
  // has one additional external reference so releasing this owner cannot free it.
  const full = structuredClone(world),
    fullUnit = full.units.find(u => u.id === shaman.id),
    fullPerson = fullUnit.native,
    heldOrder = fullPerson.commands.find(Boolean)
  for (const record of full.buildingOrders.records) record.references = 1
  full.buildingOrders.records[heldOrder].references = 2
  full.buildingOrders.active = 799
  const released = structuredClone(full)
  release(
    released,
    released.units.find(u => u.id === shaman.id)
  )
  const routeReferences = routes => {
    const view = new DataView(routes.records.buffer)
    return Array.from({ length: 401 }, (_, i) => view.getInt16(i * 109, true))
  }
  selectUnit(full, shaman.id, false)
  assert.ok(command(full, { ...target, id: target.id }))
  assert.equal(fullUnit.native, fullPerson)
  assert.equal(full.objectCells.objects.get(shaman.id), fullPerson)
  assert.equal(fullPerson.vehicle, balloon.id)
  assert.deepEqual(full.vehicles.find(v => v.id === balloon.id).passengers, [shaman.id])
  assert.equal(currentPersonOrder(full.buildingOrders, fullPerson), undefined)
  assert.deepEqual(fullPerson.commands, Array(8).fill(0))
  assert.equal(full.buildingOrders.records[heldOrder].references, 1)
  assert.equal(full.motionRoutes.active, released.motionRoutes.active)
  assert.deepEqual(routeReferences(full.motionRoutes), routeReferences(released.motionRoutes))
  assert.equal(full.pathfinding.people.has(shaman.id), false)
  assert.match(full.message, /No command slots/)

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
    comparable = w => {
      const copy = structuredClone(w)
      for (const head of copy.shrines)
        if (head.reward === undefined && head.rewardMana) head.reward = 'mana'
      return copy
    }
  let departure = 0,
    firstOpponent = 0,
    death = 0
  for (let i = 0; i < 600; i++) {
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
    if (shaman.fight && !firstOpponent) firstOpponent = shaman.fight.opponent
    if (shaman.hp <= 0 && !death) death = world.turn
  }
  assert.equal(departure, 4276)
  assert.equal(firstOpponent, 17)
  assert.equal(world.units.find(u => u.id === firstOpponent).team, 'green')
  assert.equal(death, 4302)
  assert.equal(target.hp, 55)
  assert.equal(world.buildingOrders.records[orderId].references, 0)
  assert.deepEqual(balloon.passengers, [])
  assert.equal(balloon.passengerCount, 0)
})
