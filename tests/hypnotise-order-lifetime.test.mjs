import assert from 'node:assert/strict'
import test from 'node:test'
import { createGameStore } from '../app/game-store.ts'
import { addUnit, applyHypnotise, browserPosition, stepUnitHypnotise } from '../app/model.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { allocatePersonOrder, attachPersonOrder } from '../app/person-orders.ts'
import { orderEffects } from '../app/live-movement.ts'
import { retainFixtureUnits } from './level-start-fixture.mjs'

// Supplied shared patrols isolate terminal ownership, not spell acquisition or AI
// staffing. The ordinary M22 marker-patrol witness covers that live campaign path.
for (const ghost of [false, true])
  test(`Hypnotise ${ghost ? 'ghost removal' : 'replacement and expiry'} releases aliased shared routes exactly once`, async () => {
    const store = createGameStore(), world = store.getWorld()
    retainFixtureUnits(world, () => false)
    const aim = browserPosition({ x: 0x2100, y: 0x2100 }),
      source = addUnit(world, 'red', 'warrior', aim),
      survivor = addUnit(world, 'red', 'warrior', { x: aim.x + 30, z: aim.z + 30 })
    for (const unit of [source, survivor]) {
      unit.native = createLivePerson(world, unit)
      registerLivePerson(world, unit.native)
    }
    const retired = source.native
    source.flight = retired
    source.fight = { motion: retired, group: 0 }
    if (ghost) retired.flags4 |= 0x800
    const ids = [11, 25].map((model, slot) => {
      const id = allocatePersonOrder(world.buildingOrders)
      Object.assign(world.buildingOrders.records[id], { model, a: 0x2100, b: 0x2100 })
      for (const unit of [source, survivor])
        attachPersonOrder(world.buildingOrders, unit.native, id, slot, orderEffects(world))
      return id
    })
    assert.deepEqual(ids.map(id => world.buildingOrders.records[id].references), [2, 2])
    assert.deepEqual(applyHypnotise(world, aim, 'blue').map(({ u }) => u), [source])
    assert.ok(!world.units.includes(source))
    assert.ok(!world.objectCells.objects.has(source.id))
    assert.deepEqual(retired.commands, Array(8).fill(0))
    assert.deepEqual(ids.map(id => world.buildingOrders.records[id].references), [1, 1])
    assert.deepEqual(survivor.native.commands.slice(0, 2), ids)
    assert.equal(world.buildingOrders.active, 2)
    if (!ghost) {
      const converted = world.units.find(u => u.hypnotise)
      assert.ok(converted)
      for (const [slot, id] of ids.entries())
        attachPersonOrder(world.buildingOrders, converted.native, id, slot, orderEffects(world))
      const expired = converted.native
      converted.flight = expired
      converted.hypnotise.remaining = 1
      converted.hypnotise.counter = 7
      stepUnitHypnotise(world)
      assert.ok(!world.units.includes(converted))
      assert.deepEqual(expired.commands, Array(8).fill(0))
      assert.deepEqual(ids.map(id => world.buildingOrders.records[id].references), [1, 1])
      assert.deepEqual(survivor.native.commands.slice(0, 2), ids)
      assert.equal(world.buildingOrders.active, 2)
    }
    await store.saveCheckpoint()
    assert.equal(store.loadCheckpoint(), true)
    assert.deepEqual(store.getWorld(), world)
  })
