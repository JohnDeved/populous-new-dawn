import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { currentPersonOrder } from '../app/person-orders.ts'

// Natural journey: no entities, outcomes, task phases or resources are injected.
test('Mission3 Chumara moves, spends its original shot and mana, then stops allocating at the population cutoff', () => {
  for (const level of [1, 2]) {
    const world = createWorld(level)
    assert.equal(world.manaWorld.spells[1].stocks[17], 0)
    assert.equal(world.manaTribes[1].flags2 & 2, 0)
  }
  const world = createWorld(3)
  assert.equal(world.manaWorld.spells[0].stocks[17], 0)
  assert.equal(world.manaWorld.spells[2].stocks[17], 1)
  assert.equal(world.manaTribes[2].flags2 & 2, 2)
  assert.ok(world.ai.states & 4)
  assert.equal(world.ai.coordinateLatch, 0x52dc)
  assert.ok(world.ai.flags & 0x40)
  assert.ok(!world.ai.pendingCommands.some(command => [1073, 1115, 1197].includes(command.opcode)))
  const shaman = world.units.find(u => u.team === 'yellow' && u.kind === 'shaman')
  const origin = { x: shaman.x, z: shaman.z }
  const phases = new Set()
  const active = () => world.ai.tasks.find(task => task.flags & 1 && task.type === 2)
  for (let i = 0; i < 2000 && active()?.phase !== 8; i++) {
    tick(world, 1 / 12)
    if (active()) phases.add(active().phase)
  }
  assert.deepEqual([...phases], [0, 2, 4, 5, 6, 7, 8])
  assert.equal(world.spellCasts[2][17], 0)
  assert.equal(currentPersonOrder(world.buildingOrders, shaman.native)?.model, 3)
  assert.notDeepEqual({ x: shaman.x, z: shaman.z }, origin)
  assert.equal(world.ai.flags & 0x40, 0)
  const wildBefore = world.units.filter(u => u.team === 'wild' && u.hp > 0).length
  const yellowBefore = world.units.filter(u => u.team === 'yellow' && u.hp > 0).length
  const restored = migrateCheckpoint(structuredClone(world)), castEvents = []
  let cutoff
  for (let i = 0; i < 512; i++) {
    const before = world.spellCasts[2][17], manaBefore = world.manaTribes[2].mana
    tick(world, 1 / 12)
    tick(restored, 1 / 12)
    if (world.spellCasts[2][17] !== before)
      castEvents.push({ count: world.spellCasts[2][17], stock: world.manaWorld.spells[2].stocks[17], manaBefore, manaAfter: world.manaTribes[2].mana })
    if (!(world.ai.states & 4)) {
      cutoff ??= { casts: world.spellCasts[2][17], active: !!active() }
      assert.notEqual(active()?.phase, 0, 'OFF must not allocate another type2 task')
    }
  }
  assert.deepEqual(castEvents.map(event => [event.count, event.stock]), [[1, 0], [2, 0]])
  assert.ok(castEvents[1].manaAfter < castEvents[1].manaBefore, 'the second cast pays mana with empty stock')
  assert.ok(cutoff)
  assert.ok(world.spellCasts[2][17] <= cutoff.casts + Number(cutoff.active))
  const converted = wildBefore - world.units.filter(u => u.team === 'wild' && u.hp > 0).length
  assert.ok(converted > 0)
  assert.equal(world.units.filter(u => u.team === 'yellow' && u.hp > 0).length - yellowBefore, converted)
  assert.equal(world.spellCasts[2][17], 2)
  assert.equal(world.manaWorld.spells[2].stocks[17], 0)
  assert.ok(world.units.filter(u => u.team === 'yellow' && u.hp > 0).length > 14)
  assert.equal(world.ai.states & 4, 0)
  assert.ok(!active())
  assert.equal(typeof world.randomState, 'number')
  assert.equal(restored.randomState, world.randomState)
  assert.deepEqual(restored.ai, world.ai)
  assert.deepEqual(restored.units, world.units)
  assert.deepEqual(restored.spellCasts, world.spellCasts)
  assert.equal(world.status, 'playing')
})
