import test from 'node:test'
import assert from 'node:assert/strict'
import { createWorld } from '../app/world-initialization.ts'
import { tick } from '../app/model.ts'
import { messageText } from '../app/messages.ts'
import { missionComputerTribes } from '../app/mission-data.ts'
import { migrateCheckpoint } from '../app/game-store.ts'

test('Mission 12 opens with all three enemy tribes and original knowledge', () => {
  const world = createWorld(12)

  assert.equal(world.outcome.level, 12)
  assert.deepEqual(missionComputerTribes(12), [1, 2, 3])
  assert.deepEqual(world.campaignAIs.map(Boolean), [false, true, true, true])
  assert.deepEqual(
    Object.fromEntries(
      ['blue', 'red', 'yellow', 'green', 'wild'].map(team => [
        team,
        world.units.filter(unit => unit.team === team).length,
      ])
    ),
    { blue: 1, red: 7, yellow: 7, green: 7, wild: 74 }
  )
  assert.deepEqual(
    world.shrines.map(shrine => [shrine.kind, shrine.reward]),
    [
      ['vault', 'tornado'],
      ['vault', 'spyHut'],
      ['vault', 'erosion'],
    ]
  )
  assert.ok(
    world.buildings.some(building => building.team === 'yellow' && building.kind === 'spyHut')
  )
  assert.equal(world.unlockedSpyHut, false)
  assert.equal(world.manaTribes[1].mana, 300_000)
  assert.equal(world.campaignAIs[1].variables[16], 447)
  assert.equal(world.campaignAIs[1].variables[18], 0)
  assert.deepEqual(
    world.units.filter(unit => unit.nativeFlags7f & 2).map(unit => [unit.x, unit.z]),
    [
      [23, -95],
      [21, -95],
      [19, -95],
      [19, -99],
      [21, -99],
      [23, -99],
      [-15, -95],
      [11, -117],
      [19, -117],
      [21, -121],
      [17, -123],
      [1, -75],
      [3, -73],
      [7, -89],
      [3, -81],
      [-17, -101],
      [-19, -95],
      [-11, -97],
      [-13, -103],
      [-7, -103],
    ]
  )
  const selected = world.units.find(unit => world.selected.includes(unit.id))
  assert.equal(selected?.team, 'blue')
  assert.equal(selected?.kind, 'shaman')
  assert.equal(
    messageText(world.messages.slots.find(Boolean).stringId),
    'For the first time we must face all three Enemy tribes. I must prepare for a mighty struggle.'
  )
})

test('Mission 12 starts its original turn-7 flyby once', () => {
  const world = createWorld(12)
  for (let turn = 0; turn < 7; turn++) tick(world, 1 / 12)
  assert.equal(world.flyby.flags & 1, 0)

  tick(world, 1 / 12)
  assert.equal(world.turn, 8)
  assert.equal(world.flyby.flags, 0x15)
  assert.equal(world.inputMask & 64, 64)
  assert.equal(world.flyby.warmup, 6)
  assert.deepEqual(
    world.flyby.events.map(({ kind, value, start, duration }) => [kind, value, start, duration]),
    [
      [1, 22556, 1, 15],
      [2, 1232, 1, 45],
      [3, 153, 1, 55],
      [1, 4846, 40, 30],
      [2, 1600, 56, 30],
      [3, 65511, 60, 25],
      [2, 406, 76, 30],
      [3, 76, 90, 45],
      [2, 1142, 106, 30],
      [1, 53982, 130, 25],
      [2, 2000, 136, 50],
      [3, 0, 145, 50],
      [1, 39958, 180, 25],
      [2, 200, 186, 35],
      [3, 102, 200, 45],
      [1, 51760, 210, 25],
      [2, 900, 221, 45],
      [3, 0, 250, 50],
      [2, 1500, 266, 34],
      [1, 22556, 275, 25],
    ]
  )
  assert.deepEqual(world.flyby.end, { x: 28, y: 88, angle: 1500, zoom: 0 })
  assert.equal(world.campaignAIs[1].variables[25], 1)

  const events = world.flyby.events
  while (world.turn < 16) tick(world, 1 / 12)
  assert.equal(world.flyby.events, events)
  assert.equal(world.flyby.events.length, 20)
})

test('Mission 12 opponents request their first Guard Towers on native cadence', () => {
  const world = createWorld(12)
  for (let turn = 0; turn < 60; turn++) tick(world, 1 / 12)
  assert.ok(
    [1, 2, 3].every(tribe => world.campaignAIs[tribe].tasks.every(task => !(task.flags & 1)))
  )

  const expected = [
    [3, 0xb82a],
    [2, 0x12ee],
    [1, 0xd0ee],
  ]
  for (const [tribe, origin] of expected) {
    const randomState = world.randomState
    tick(world, 1 / 12)
    const task = world.campaignAIs[tribe].tasks.find(task => task.flags & 1)
    assert.deepEqual(
      task && {
        type: task.type,
        requested: task.requested,
        origin: task.origin,
        exact: task.extra,
        phase: task.phase,
      },
      { type: 0, requested: 4, origin, exact: 0, phase: 0 }
    )
    if (tribe === 3) assert.equal(world.randomState, randomState)
  }

  const noBraves = createWorld(12)
  noBraves.units = noBraves.units.filter(unit => unit.team !== 'green' || unit.kind === 'shaman')
  while (noBraves.turn < 60) tick(noBraves, 1 / 12)
  const randomState = noBraves.randomState
  tick(noBraves, 1 / 12)
  assert.ok(noBraves.campaignAIs[3].tasks.every(task => !(task.flags & 1)))
  assert.equal(noBraves.randomState, randomState)
})

test('Mission 12 opening remains deterministic through checkpoint migration', () => {
  const uninterrupted = createWorld(12)
  for (let turn = 0; turn < 64; turn++) tick(uninterrupted, 1 / 12)
  const restored = migrateCheckpoint(structuredClone(uninterrupted))

  for (let turn = 0; turn < 128; turn++) {
    tick(uninterrupted, 1 / 12)
    tick(restored, 1 / 12)
  }
  assert.deepEqual(restored, uninterrupted)
  assert.equal(restored.status, 'playing')
})
