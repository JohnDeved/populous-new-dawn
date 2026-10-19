import assert from 'node:assert/strict'
import test from 'node:test'
import { createGameStore } from '../app/game-store.ts'
import { addUnit, browserPosition } from '../app/model.ts'
import { createLivePerson, registerLivePerson, syncLivePersonCells } from '../app/live-people.ts'
import { allocatePersonOrder, attachPersonOrder } from '../app/person-orders.ts'
import { orderEffects } from '../app/live-movement.ts'
import { createSwamp } from '../app/swamp.ts'
import { stepLiveSwamp } from '../app/spell-effects-runtime.ts'
import { retainFixtureUnits } from './level-start-fixture.mjs'

test('Swamp ghost retirement releases shared patrol owners before current Save/Load', async () => {
  const store = createGameStore(), world = store.getWorld()
  retainFixtureUnits(world, () => false)
  const aim = browserPosition({ x: 0x2100, y: 0x2100 }),
    ghost = addUnit(world, 'red', 'warrior', aim),
    survivor = addUnit(world, 'red', 'warrior', { x: aim.x + 30, z: aim.z + 30 })
  for (const unit of [ghost, survivor]) {
    unit.native = createLivePerson(world, unit)
    registerLivePerson(world, unit.native)
  }
  const retired = ghost.native
  retired.flags4 |= 0x800
  ghost.flight = retired
  ghost.fight = { motion: retired, group: 0 }
  const ids = [11, 25].map((model, slot) => {
    const id = allocatePersonOrder(world.buildingOrders)
    Object.assign(world.buildingOrders.records[id], { model, a: 0x2100, b: 0x2100 })
    for (const unit of [ghost, survivor])
      attachPersonOrder(world.buildingOrders, unit.native, id, slot, orderEffects(world))
    return id
  })
  const trap = createSwamp(retired, 0, 3, world)
  assert.deepEqual(ids.map(id => world.buildingOrders.records[id].references), [2, 2])
  stepLiveSwamp(world, trap)
  assert.ok(!world.units.includes(ghost))
  assert.equal(trap.kills, 0, 'ghost removal must not consume a real-person kill')
  syncLivePersonCells(world)
  assert.ok(!world.objectCells.objects.has(ghost.id))
  assert.deepEqual(retired.commands, Array(8).fill(0))
  assert.deepEqual(ids.map(id => world.buildingOrders.records[id].references), [1, 1])
  assert.equal(world.buildingOrders.active, 2)
  assert.deepEqual(survivor.native.commands.slice(0, 2), ids)
  await store.saveCheckpoint()
  assert.equal(store.loadCheckpoint(), true)
  assert.deepEqual(store.getWorld(), world)
})
