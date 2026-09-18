import assert from 'node:assert/strict'
import test from 'node:test'
import {
  addUnit,
  browserPosition,
  cast,
  command,
  createWorld,
  nativePosition,
  tick,
} from '../app/model.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { syncLivePersonCells } from '../app/live-people.ts'
import { worshipHeadPose } from '../app/live-worship.ts'
import { specialBattlePosition } from '../app/special-battle.ts'
import { worshipPositions } from '../app/worship.ts'

function finishWorship(world, head) {
  const slots = worshipPositions(worshipHeadPose(world, head)),
    followers = Array.from({ length: head.required }, (_, index) =>
      addUnit(world, 'blue', 'brave', browserPosition(slots[index]))
    )
  world.selected = followers.map(unit => unit.id)
  syncLivePersonCells(world)
  assert.equal(command(world, head), true)
  for (let turn = 0; turn < 8; turn++) tick(world, 1 / 12)
  head.work = head.target * head.required ** 2 - 1
  for (let turn = 0; turn < 8 && !head.uses; turn++) tick(world, 1 / 12)
  for (let turn = 0; turn < 82 && world.gifts.length; turn++) tick(world, 1 / 12)
}

function castArmageddon(world, followers = 0) {
  const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  for (let index = 0; index < followers; index++)
    addUnit(world, 'blue', index & 1 ? 'warrior' : 'firewarrior', shaman)
  world.shots.armageddon = 1
  world.selected = [shaman.id]
  assert.equal(cast(world, 'armageddon', { x: shaman.x + 1, z: shaman.z }), true)
  for (let turn = 0; turn < 180 && !world.effects.some(effect => effect.armageddon); turn++)
    tick(world, 1 / 12)
  const effect = world.effects.find(effect => effect.armageddon)
  assert.ok(effect)
  assert.equal(world.shots.armageddon, 0)
  return effect
}

function reachBattle(world, effect) {
  for (let turn = 0; turn < 1000 && effect.armageddon.phase < 2; turn++) tick(world, 1 / 12)
  for (let turn = 0; turn < 38 && effect.armageddon.commandDelay; turn++) tick(world, 1 / 12)
  assert.equal(effect.armageddon.phase, 2)
  assert.equal(effect.armageddon.commandDelay, 0)
}

test('Mission 17 grants Armageddon and stages the native arena through the live cast path', () => {
  const world = createWorld(17),
    head = world.shrines.find(shrine => shrine.reward === 'armageddon')
  assert.ok(head)
  assert.deepEqual([head.x, head.z, head.required, head.remaining], [3, 117, 6, 1])
  assert.equal(world.messages.slots.find(Boolean).stringId, 697)

  for (const unit of world.units) if (unit.team !== 'blue') unit.inside = 1
  finishWorship(world, head)
  assert.deepEqual([head.uses, world.shots.armageddon, world.giftCounts.armageddon], [1, 1, 1])
  for (const unit of world.units) unit.inside = null

  const effect = castArmageddon(world, 24),
    phase0 = migrateCheckpoint(structuredClone(world)).effects.find(item => item.armageddon)
  assert.equal(world.inputMask & 32, 32)
  assert.equal(world.manaWorld.gameFlags & 2, 2)
  assert.equal(world.buildings.length + world.vehicles.length + world.projectiles.length, 0)
  assert.equal(phase0.armageddon.terrainRemaining, effect.armageddon.terrainRemaining)

  while (effect.armageddon.phase === 0) tick(world, 1 / 12)
  assert.equal(effect.armageddon.phase, 1)
  assert.deepEqual(effect.armageddon.directions, [0, 1, 2, 3])
  assert.equal(world.units.filter(unit => unit.native?.state === 39).length, 4)
  const center = nativePosition(world, effect),
    centerIndex = ((center.y & 65535) >>> 9) * 128 + ((center.x & 65535) >>> 9)
  assert.equal(world.land.heights[centerIndex], 50)
  for (let tribe = 0; tribe < 4; tribe++) {
    const shaman = world.units.find(unit => unit.id === effect.armageddon.participants[tribe][0]),
      expected = specialBattlePosition(
        {
          randomState: world.randomState,
          center,
          directions: effect.armageddon.directions,
          populations: effect.armageddon.populations,
        },
        0,
        tribe
      ),
      actual = nativePosition(world, shaman)
    assert.deepEqual({ x: actual.x & 65535, y: actual.y & 65535 }, expected)
  }

  reachBattle(world, effect)
  assert.ok(world.units.every(unit => unit.native?.state !== 39))
  assert.ok(world.units.some(unit => unit.target !== null || unit.fight))
  const restored = migrateCheckpoint(structuredClone(world)),
    restoredEffect = restored.effects.find(item => item.armageddon)
  assert.equal(restoredEffect.armageddon.phase, 2)
  assert.equal(restoredEffect.armageddon.commandDelay, 0)
  assert.deepEqual(restoredEffect.armageddon.participants, effect.armageddon.participants)
})

test('Armageddon uses generic victory and defeat outcomes and restores control', () => {
  for (const result of ['won', 'lost']) {
    const world = createWorld(17),
      effect = castArmageddon(world, result === 'won' ? 90 : 0)
    reachBattle(world, effect)
    for (const unit of world.units) if ((result === 'won') === (unit.team !== 'blue')) unit.hp = 0
    for (let turn = 0; turn < 32 && world.status === 'playing'; turn++) tick(world, 1 / 12)
    assert.equal(world.status, result)
    assert.equal(world.inputMask, 0)
    assert.equal(world.manaWorld.gameFlags & 2, 0)
    assert.equal(
      world.effects.some(item => item.armageddon),
      false
    )
  }
})
