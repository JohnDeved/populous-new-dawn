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
import { missionData, missionScript } from '../app/mission-data.ts'
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

function removeTribe(world, team) {
  world.units = world.units.filter(unit => unit.team !== team)
}

test('Mission 19 loads its authored objective and grants all three worship rewards', () => {
  const world = createWorld(19),
    mission = missionData(19)
  assert.deepEqual(
    [
      mission.level.landscapeBank,
      missionScript(19, 1).source,
      missionScript(19, 2).source,
      world.campaignAIs.map(Boolean),
      world.outcome.alliances,
      world.messages.slots.find(Boolean).stringId,
    ],
    [13, 'cpscr031.dat', 'cpscr041.dat', [false, true, true, false], [0, 0, 0, 0], 701]
  )
  assert.deepEqual(
    world.shrines.map(head => head.reward).toSorted(),
    ['firestorm', 'teleport', 'volcano']
  )
  for (const head of world.shrines) finishWorship(world, head)
  assert.deepEqual(
    [world.shots.firestorm, world.shots.teleport, world.shots.volcano],
    [1, 1, 1]
  )
  assert.deepEqual(
    [world.giftCounts.firestorm, world.giftCounts.teleport, world.giftCounts.volcano],
    [1, 1, 1]
  )
  world.turn = 14
  for (let turn = 0; turn < 20 && !world.messages.slots.some(message => message?.stringId === 702); turn++)
    tick(world, 1 / 12)
  assert.ok(world.messages.slots.some(message => message?.stringId === 702))
})

test('Mission 19 Teleport spends only accepted stock and resumes identically from a checkpoint', () => {
  const world = createWorld(19),
    shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
    target = { x: -59, z: 3 }
  world.shots.teleport = 1
  shaman.hp = 0
  assert.equal(cast(world, 'teleport', target), false)
  assert.equal(world.shots.teleport, 1)
  shaman.hp = 100
  assert.equal(cast(world, 'teleport', target), true)
  assert.equal(world.shots.teleport, 0)
  for (let turn = 0; turn < 60 && !world.effects.some(effect => effect.teleport); turn++)
    tick(world, 1 / 12)
  const effect = world.effects.find(effect => effect.teleport)
  assert.ok(effect)
  while (effect.teleport.visits < 3) tick(world, 1 / 12)
  const restored = migrateCheckpoint(structuredClone(world)),
    checkpoint = {
      turn: world.turn,
      randomState: world.randomState,
      shots: world.shots.teleport,
      visits: effect.teleport.visits,
    }
  assert.deepEqual(
    {
      turn: restored.turn,
      randomState: restored.randomState,
      shots: restored.shots.teleport,
      visits: restored.effects.find(item => item.teleport).teleport.visits,
    },
    checkpoint
  )
  for (const candidate of [world, restored])
    for (let turn = 0; turn < 32 && candidate.effects.some(item => item.teleport); turn++)
      tick(candidate, 1 / 12)
  const originalShaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
    restoredShaman = restored.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  assert.deepEqual(
    [nativePosition(world, originalShaman), world.randomState, world.shots.teleport],
    [nativePosition(restored, restoredShaman), restored.randomState, restored.shots.teleport]
  )
  assert.deepEqual(
    [nativePosition(world, originalShaman).x & 0xfe00, nativePosition(world, originalShaman).y & 0xfe00],
    [nativePosition(world, target).x & 0xfe00, nativePosition(world, target).y & 0xfe00]
  )
})

test('Mission 19 warns once and gives Chumara loss priority over Dakini defeat', () => {
  const warning = createWorld(19)
  warning.turn = 62
  warning.units = warning.units.filter(
    (unit, index, units) => unit.team !== 'yellow' || units.slice(0, index).filter(u => u.team === 'yellow').length < 14
  )
  warning.buildings = warning.buildings.filter(building => building.team !== 'yellow')
  for (let turn = 0; turn < 80 && !warning.messages.slots.some(message => message?.stringId === 705); turn++)
    tick(warning, 1 / 12)
  assert.equal(warning.messages.slots.filter(message => message?.stringId === 705).length, 1)
  const restored = migrateCheckpoint(structuredClone(warning))
  for (let turn = 0; turn < 80; turn++) tick(restored, 1 / 12)
  assert.equal(restored.messages.slots.filter(message => message?.stringId === 705).length, 1)

  for (const [remove, expected] of [
    [['red'], 'won'],
    [['yellow'], 'lost'],
    [['red', 'yellow'], 'lost'],
  ]) {
    const world = createWorld(19)
    world.turn = 31
    for (const team of remove) removeTribe(world, team)
    for (let turn = 0; turn < 80 && world.status === 'playing'; turn++) tick(world, 1 / 12)
    assert.equal(world.status, expected)
  }
})
