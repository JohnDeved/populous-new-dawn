import assert from 'node:assert/strict'
import test from 'node:test'
import { createGameStore } from '../app/game-store.ts'
import { addUnit, browserPosition, tick } from '../app/model.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { allocatePersonOrder, attachPersonOrder } from '../app/person-orders.ts'
import { orderEffects } from '../app/live-movement.ts'
import { finishLevelStart, retainFixtureUnits } from './level-start-fixture.mjs'

for (const ghost of [false, true])
  test(`terminal ${ghost ? 'ghost' : 'ordinary death'} releases shared patrol ownership exactly once`, async () => {
    const store = createGameStore(), world = finishLevelStart(store.getWorld())
    retainFixtureUnits(world, () => false)
    const aim = browserPosition({ x: 0x2100, y: 0x2100 }),
      victim = addUnit(world, 'red', 'warrior', aim),
      survivor = addUnit(world, 'red', 'warrior', { x: aim.x + 30, z: aim.z + 30 })
    for (const unit of [victim, survivor]) {
      unit.native = createLivePerson(world, unit)
      registerLivePerson(world, unit.native)
    }
    // Isolate terminal ownership from the surviving owner advancing its patrol.
    survivor.native.state = 14
    const retired = victim.native
    victim.fight = { motion: retired, group: 0 }
    world.pathfinding.people.set(victim.id, retired)
    if (ghost) { victim.ghost = true; retired.flags4 |= 0x800 }
    const ids = [25, 25].map((model, slot) => {
      const id = allocatePersonOrder(world.buildingOrders)
      Object.assign(world.buildingOrders.records[id], { model, a: 0x2100, b: 0x2100 })
      for (const unit of [victim, survivor])
        attachPersonOrder(world.buildingOrders, unit.native, id, slot, orderEffects(world))
      return id
    })
    assert.deepEqual(ids.map(id => world.buildingOrders.records[id].references), [2, 2])
    victim.hp = retired.life = 0
    tick(world, 1 / 12)
    assert.ok(!world.units.includes(victim))
    assert.ok(!world.objectCells.objects.has(victim.id))
    assert.ok(!world.pathfinding.people.has(victim.id))
    assert.deepEqual(retired.commands, Array(8).fill(0))
    assert.deepEqual(ids.map(id => world.buildingOrders.records[id].references), [1, 1])
    assert.deepEqual(survivor.native.commands.slice(0, 2), ids)
    await store.saveCheckpoint()
    assert.ok(store.loadCheckpoint())
    assert.deepEqual(store.getWorld(), world)
  })
