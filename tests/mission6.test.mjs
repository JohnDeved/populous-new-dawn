import assert from 'node:assert/strict'
import test from 'node:test'
import levelSix from '../app/level-six.ts'
import scriptSix from '../app/original-script-six.json' with { type: 'json' }
import { addUnit, createWorld, joinBattle, tick } from '../app/model.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { syncLivePersonCells } from '../app/live-people.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { stepOutcome } from '../app/tribe-turns.ts'

test('Mission 6 keeps both original opponents distinct through outcome and checkpoints', () => {
  assert.equal(
    levelSix.sourceSha256,
    '264d69d98965465325a4b0e6ec1b1f9145d2a407e68ca9472e6a76a60a1a8a62'
  )
  assert.equal(scriptSix.tribes[2].sha256, '7ee29a7c5e3f49bee4e2a40c1ef0bf5b1796d082dd3396e1a5a85900c917cb1a')
  assert.equal(scriptSix.tribes[3].sha256, '01dcc425abaf6bf9680e1d62cede2d5c3a0de9739631d69516d810bc424b8e60')

  const world = createWorld(6)
  assert.deepEqual(
    Object.fromEntries(
      ['blue', 'yellow', 'green', 'wild'].map(team => [
        team,
        world.units.filter(unit => unit.team === team).length,
      ])
    ),
    { blue: 7, yellow: 8, green: 7, wild: 172 }
  )
  assert.notEqual(world.campaignAIs[2], world.campaignAIs[3])
  assert.notEqual(world.spellScans[2], world.spellScans[3])
  assert.equal(world.campaignAIs[3].variables[32], 150000)

  tick(world, 1 / 12)
  const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  assert.deepEqual(shaman && { x: shaman.x, z: shaman.z, inside: shaman.inside }, {
    x: 51,
    z: -61.546875,
    inside: null,
  })

  world.units = world.units.filter(unit => unit.team !== 'yellow')
  world.turn = 32
  stepOutcome(world)
  assert.equal(world.manaTribes[2].defeatTimer, 1)
  assert.equal(world.land.landFlags & 0x2000000, 0)

  world.units = world.units.filter(unit => unit.team !== 'green')
  world.turn = 48
  stepOutcome(world)
  assert.equal(world.manaTribes[3].defeatTimer, 1)
  assert.equal(world.land.landFlags & 0x2000000, 0x2000000)
  assert.equal(world.outcome.completedLevel, 5)

  const restored = migrateCheckpoint(structuredClone(world))
  assert.deepEqual(restored.campaignAIs[3].variables, world.campaignAIs[3].variables)
  assert.notEqual(restored.campaignAIs[2], restored.campaignAIs[3])
  assert.notEqual(restored.spellScans[2], restored.spellScans[3])
})

test('Mission 6 credits each opponent attack task independently', () => {
  const teams = ['yellow', 'green'],
    world = createWorld(6),
    positions = teams.map(team =>
      world.units.find(unit => unit.team === team && unit.kind === 'shaman')
    ),
    home = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  world.units = []
  addUnit(world, 'blue', 'shaman', home)
  const attackers = teams.map((team, index) => addUnit(world, team, 'warrior', positions[index])),
    victims = attackers.map(attacker => addUnit(world, 'blue', 'brave', attacker)),
    tasks = [world.campaignAIs[2].tasks[0], world.campaignAIs[3].tasks[0]]
  world.manaTribes[2].active = world.manaTribes[3].active = false
  for (let i = 0; i < 2; i++) {
    Object.assign(tasks[i], { flags: 1, type: 20, phase: 16, members: [attackers[i].id], damage: 0 })
    victims[i].hp = 1
    joinBattle(world, attackers[i], victims[i])
  }
  for (let turn = 0; turn < 240 && victims.some(victim => victim.hp > 0); turn++) tick(world, 1 / 12)
  assert.ok(victims.every(victim => victim.hp === 0))
  assert.deepEqual(tasks.map(task => task.damage), [1, 1])
})

test('Mission 6 low-population survivors counterattack the player Shaman', () => {
  for (const { tribe, team, triggerTurn } of [
    { tribe: 2, team: 'yellow', triggerTurn: 8 },
    { tribe: 3, team: 'green', triggerTurn: 7 },
  ]) {
    const world = createWorld(6),
      survivor = world.units.find(unit => unit.team === team && unit.kind === 'brave'),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
      start = { x: survivor.x, z: survivor.z }
    Object.assign(shaman, { x: survivor.x + 12, z: survivor.z })
    world.units = world.units.filter(unit => unit.team !== team || unit === survivor)
    syncLivePersonCells(world)
    world.killCredits[0][tribe] = 6
    world.turn = triggerTurn - 1

    tick(world, 1 / 12)
    assert.equal(world.manaTribes[tribe].flags2 & 0x40, 0)
    tick(world, 1 / 12)
    assert.equal(world.manaTribes[tribe].flags2 & 0x40, 0x40)

    const order = currentPersonOrder(world.buildingOrders, survivor.native)
    assert.deepEqual(order && { model: order.model, target: order.a }, { model: 28, target: shaman.id })
    for (let turn = 0; turn < 64 && !survivor.fight; turn++) tick(world, 1 / 12)
    assert.ok(Math.hypot(survivor.x - start.x, survivor.z - start.z) > 0)
    assert.ok(survivor.fight)
  }
})
