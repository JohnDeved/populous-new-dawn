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
import { missionData, missionScript } from '../app/mission-data.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { syncLivePersonCells } from '../app/live-people.ts'
import { worshipPositions } from '../app/worship.ts'

function finishWorship(world, head) {
  const slots = worshipPositions({
      ...nativePosition(world, head),
      angle: Math.round((head.angle * 1024) / Math.PI) & 2047,
    }),
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

function reachArmageddon(world) {
  const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  world.selected = [shaman.id]
  assert.equal(cast(world, 'armageddon', { x: shaman.x + 1, z: shaman.z }), true)
  for (let turn = 0; turn < 180 && !world.effects.some(effect => effect.armageddon); turn++)
    tick(world, 1 / 12)
  const effect = world.effects.find(effect => effect.armageddon)
  assert.ok(effect)
  for (let turn = 0; turn < 1000 && effect.armageddon.phase < 2; turn++) tick(world, 1 / 12)
  for (let turn = 0; turn < 38 && effect.armageddon.commandDelay; turn++) tick(world, 1 / 12)
  assert.deepEqual([effect.armageddon.phase, effect.armageddon.commandDelay], [2, 0])
  return effect
}

test('Mission 18 loads its authored tribes and grants Armageddon and both Volcano rewards', () => {
  const world = createWorld(18),
    mission = missionData(18),
    armageddon = world.shrines.find(head => head.reward === 'armageddon'),
    volcanoes = world.shrines.filter(head => head.reward === 'volcano')
  assert.deepEqual(
    [
      mission.level.landscapeBank,
      missionScript(18, 1).source,
      missionScript(18, 2).source,
      missionScript(18, 3).source,
    ],
    [16, 'cpscr019.dat', 'cpscr020.dat', 'cpscr032.dat']
  )
  assert.deepEqual(world.campaignAIs.map(Boolean), [false, true, true, true])
  assert.equal(world.messages.slots.find(Boolean).stringId, 699)
  assert.ok(armageddon)
  assert.equal(volcanoes.length, 2)

  finishWorship(world, armageddon)
  for (const head of volcanoes) finishWorship(world, head)
  assert.deepEqual(
    [
      world.shots.armageddon,
      world.giftCounts.armageddon,
      world.shots.volcano,
      world.giftCounts.volcano,
    ],
    [1, 1, 1, 2]
  )
})

test('Mission 18 starts its authored Red marker patrol through normal AI orders', () => {
  const world = createWorld(18),
    level = missionData(18).level,
    task = world.campaignAIs[1].tasks.find(task => task.flags & 1)
  assert.deepEqual(
    task.route[0],
    { marker: 1, secondary: 2, quotas: [0, 7, 3, 1] }
  )
  for (let turn = 0; turn < 7; turn++) tick(world, 1 / 12)
  const patrol = world.units.filter(unit =>
    unit.team === 'red' &&
    unit.native?.commands.some(id => id && world.buildingOrders.records[id].model === 25)
  )
  assert.deepEqual(
    patrol.reduce((counts, unit) => ({ ...counts, [unit.kind]: (counts[unit.kind] ?? 0) + 1 }), {}),
    { warrior: 7, firewarrior: 3, preacher: 1 }
  )
  assert.ok(
    patrol.every(unit => {
      const orders = unit.native.commands
        .filter(Boolean)
        .map(id => world.buildingOrders.records[id])
      return orders[0].a === (level.markers[1] & 254) << 8 &&
        orders[0].b === (level.markers[1] & 0xfe00) &&
        orders[1].a === (level.markers[2] & 254) << 8 &&
        orders[1].b === (level.markers[2] & 0xfe00)
    })
  )
})

test('Mission 18 Armageddon restores its arena checkpoint and reaches both result directions', () => {
  for (const result of ['won', 'lost']) {
    const world = createWorld(18),
      head = world.shrines.find(head => head.reward === 'armageddon')
    finishWorship(world, head)
    const effect = reachArmageddon(world),
      checkpoint = {
        turn: world.turn,
        randomState: world.randomState,
        gifts: world.giftCounts.armageddon,
        shots: world.shots.armageddon,
      },
      restored = migrateCheckpoint(structuredClone(world)),
      restoredEffect = restored.effects.find(item => item.armageddon)
    assert.deepEqual(
      {
        turn: restored.turn,
        randomState: restored.randomState,
        gifts: restored.giftCounts.armageddon,
        shots: restored.shots.armageddon,
      },
      checkpoint
    )
    assert.equal(restoredEffect.armageddon.phase, 2)
    assert.deepEqual(restoredEffect.armageddon.participants, effect.armageddon.participants)
    for (const unit of restored.units)
      if ((result === 'won') === (unit.team !== 'blue')) unit.hp = 0
    for (let turn = 0; turn < 32 && restored.status === 'playing'; turn++) tick(restored, 1 / 12)
    assert.equal(restored.status, result)
    assert.equal(restored.inputMask, 0)
    assert.equal(restored.manaWorld.gameFlags & 2, 0)
  }
})
