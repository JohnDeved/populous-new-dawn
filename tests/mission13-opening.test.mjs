import test from 'node:test'
import assert from 'node:assert/strict'
import { migrateCheckpoint } from '../app/game-store.ts'
import { messageText } from '../app/messages.ts'
import { missionComputerTribes, missionData, missionScript } from '../app/mission-data.ts'
import { tick } from '../app/model.ts'
import { createGift } from '../app/world-effects.ts'
import { createWorld } from '../app/world-initialization.ts'

test('Mission 13 opens with both enemy tribes and original knowledge', () => {
  const world = createWorld(13)

  assert.equal(
    missionData(13).level.sourceSha256,
    '5ad694a1f60e0df174ef300fb763d5fc1c48f4b520d1a743bdb1a4b930fc9c3f'
  )
  assert.equal(
    missionScript(13, 2).sha256,
    '74226e5cc971c4d34898d6d464980726001694d2ed19734920a65971ed5ff10c'
  )
  assert.equal(
    missionScript(13, 3).sha256,
    'd5f2bfe673291a5a299efcb0b5f65e8e619465fad41efa0cc9a328a5658f407b'
  )
  assert.deepEqual(missionComputerTribes(13), [2, 3])
  assert.deepEqual(world.campaignAIs.map(Boolean), [false, false, true, true])
  assert.deepEqual(
    Object.fromEntries(
      ['blue', 'red', 'yellow', 'green', 'wild'].map(team => [
        team,
        world.units.filter(unit => unit.team === team).length,
      ])
    ),
    { blue: 7, red: 0, yellow: 7, green: 7, wild: 146 }
  )
  assert.deepEqual(
    world.shrines.map(shrine => [shrine.kind, shrine.reward]),
    [
      ['vault', 'balloonHut'],
      ['firestorm', 'firestorm'],
      ['shield', 'shield'],
      ['volcano', 'volcano'],
      ['vault', 'earthquake'],
    ]
  )
  assert.equal(world.unlockedBalloonHut, false)
  assert.equal(world.vehicles.length, 0)
  assert.equal(world.trees.length, 101)
  const selected = world.units.find(unit => world.selected.includes(unit.id))
  assert.equal(selected?.team, 'blue')
  assert.equal(selected?.kind, 'shaman')
  assert.equal(
    messageText(world.messages.slots.find(Boolean).stringId),
    'I sense a new threat\u0085 an attack from the skies. I must make ready for the battle to come.'
  )
  assert.ok([2, 3].every(tribe => world.campaignAIs[tribe].pendingCommands.length === 0))
})

test('Mission 13 starts its original Yellow turn-6 flyby once', () => {
  const world = createWorld(13)
  for (let turn = 0; turn < 6; turn++) tick(world, 1 / 12)
  assert.equal(world.flyby.flags & 1, 0)

  tick(world, 1 / 12)
  assert.equal(world.turn, 7)
  assert.equal(world.flyby.flags, 0x15)
  assert.equal(world.inputMask & 64, 64)
  assert.equal(world.flyby.warmup, 6)
  assert.deepEqual(
    world.flyby.events.map(({ kind, value, start, duration }) => [kind, value, start, duration]),
    [
      [1, 15096, 1, 15],
      [2, 600, 1, 35],
      [3, 128, 1, 45],
      [1, 31452, 30, 30],
      [2, 1762, 36, 60],
      [3, 65511, 50, 60],
      [1, 49178, 90, 40],
      [2, 890, 96, 65],
      [3, 102, 115, 35],
      [1, 48368, 155, 30],
      [3, 0, 155, 45],
      [2, 2000, 161, 45],
      [2, 1400, 206, 45],
      [3, 76, 210, 50],
      [1, 47294, 215, 25],
      [2, 600, 251, 55],
      [1, 46202, 260, 40],
      [3, 65511, 265, 50],
      [2, 1300, 306, 75],
      [1, 61026, 310, 35],
      [3, 102, 320, 50],
      [1, 15096, 370, 45],
      [3, 0, 375, 40],
      [2, 350, 381, 34],
    ]
  )
  assert.deepEqual(world.flyby.end, { x: 248, y: 58, angle: 350, zoom: 0 })
  assert.equal(world.campaignAIs[2].variables[11], 1)

  const events = world.flyby.events
  while (world.turn < 16) tick(world, 1 / 12)
  assert.equal(world.flyby.events, events)
  assert.equal(world.flyby.events.length, 24)
})

test('Mission 13 Balloon Hut knowledge is visible without exposing Balloon behavior', () => {
  const world = createWorld(13)
  createGift(
    world,
    'balloonHut',
    world.shrines.find(shrine => shrine.reward === 'balloonHut')
  )
  for (let turn = 0; turn < 82; turn++) tick(world, 1 / 12)

  assert.equal(world.unlockedBalloonHut, true)
  assert.equal(world.message, 'Knowledge discovered: Balloon Hut.')
  assert.equal(world.vehicles.length, 0)
})

test('Mission 13 opening remains deterministic through checkpoint migration', () => {
  const uninterrupted = createWorld(13)
  for (let turn = 0; turn < 64; turn++) tick(uninterrupted, 1 / 12)
  const restored = migrateCheckpoint(structuredClone(uninterrupted))

  for (let turn = 0; turn < 128; turn++) {
    tick(uninterrupted, 1 / 12)
    tick(restored, 1 / 12)
  }
  assert.deepEqual(restored, uninterrupted)
  assert.equal(restored.status, 'playing')
})
