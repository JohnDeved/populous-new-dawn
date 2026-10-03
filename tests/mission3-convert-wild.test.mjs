import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'

test('Mission 3 Chumara spends its original Convert Wild shot through ordinary turns', () => {
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

  for (let turn = 0; turn < 61; turn++) tick(world, 1 / 12)
  assert.equal(world.spellCasts[2][17], 0)
  // The Blue opening wave has already replaced its twelve nearby Wildmen.
  assert.equal(world.units.filter(unit => unit.team === 'wild').length, 32)
  tick(world, 1 / 12)
  assert.equal(world.spellCasts[2][17], 1)
  assert.equal(world.manaWorld.spells[2].stocks[17], 0)
  assert.equal(world.ai.flags & 0x40, 0)

  for (let turn = 0; world.units.filter(unit => unit.team === 'wild').length === 32; turn++) {
    assert.ok(turn < 100)
    tick(world, 1 / 12)
  }
  assert.equal(world.units.filter(unit => unit.team === 'wild').length, 31)
  assert.equal(world.units.filter(unit => unit.team === 'yellow').length, 8)

  for (let turn = 0; turn < 512; turn++) tick(world, 1 / 12)
  assert.equal(world.spellCasts[2][17], 1)
  assert.equal(world.manaWorld.spells[2].stocks[17], 0)
})
