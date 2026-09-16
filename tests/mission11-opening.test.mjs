import test from 'node:test'
import assert from 'node:assert/strict'
import { createWorld } from '../app/world-initialization.ts'
import { tick } from '../app/model.ts'
import { messageText } from '../app/messages.ts'
import { missionAllowsBuilding, missionComputerTribes } from '../app/mission-data.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { buildingModel } from '../app/building-shapes.ts'

test('Mission 11 opens with both enemy tribes and four original knowledge sites', () => {
  const world = createWorld(11)

  assert.equal(world.outcome.level, 11)
  assert.deepEqual(missionComputerTribes(11), [2, 3])
  assert.deepEqual(world.campaignAIs.map(Boolean), [false, false, true, true])
  assert.deepEqual(
    Object.fromEntries(
      ['blue', 'green', 'yellow', 'wild'].map(team => [
        team,
        world.units.filter(unit => unit.team === team).length,
      ])
    ),
    { blue: 7, green: 7, yellow: 7, wild: 155 }
  )
  assert.deepEqual(
    world.shrines.map(shrine => [shrine.kind, shrine.reward]),
    [
      ['vault', 'hypnotise'],
      ['vault', 'swamp'],
      ['flatten', 'flatten'],
      ['swamp', 'swamp'],
    ]
  )
  assert.ok([1, 4, 5, 7, 8, 13].every(model => missionAllowsBuilding(11, model)))
  const selected = world.units.find(unit => world.selected.includes(unit.id))
  assert.equal(selected?.team, 'blue')
  assert.equal(selected?.kind, 'shaman')
  assert.equal(
    messageText(world.messages.slots.find(Boolean).stringId),
    'Once again we must face two tribes. I shall crush the Matak, then I must deal with the greater threat of the Chumara.'
  )
  for (let turn = 0; turn < 24; turn++) tick(world, 1 / 12)
  assert.equal(world.status, 'playing')
})

test('Mission 11 opponents build their first Guard Towers and Matak Hut on native cadence', () => {
  let world = createWorld(11)
  for (let turn = 0; turn < 60; turn++) tick(world, 1 / 12)
  assert.ok([2, 3].every(tribe => world.campaignAIs[tribe].tasks.every(task => !(task.flags & 1))))

  tick(world, 1 / 12)
  assert.ok(world.campaignAIs[2].tasks.every(task => !(task.flags & 1)))
  assert.deepEqual(
    world.campaignAIs[3].tasks
      .filter(task => task.flags & 1)
      .map(task => ({ requested: task.requested, origin: task.origin, phase: task.phase })),
    [{ requested: 4, origin: 0xce76, phase: 0 }]
  )

  tick(world, 1 / 12)

  const matak = world.campaignAIs[3].tasks.find(task => task.flags & 1 && task.type === 0),
    chumara = world.campaignAIs[2].tasks.find(task => task.flags & 1 && task.type === 0)
  assert.deepEqual(
    matak && { requested: matak.requested, origin: matak.origin, phase: matak.phase },
    { requested: 4, origin: 0xce76, phase: 4 }
  )
  assert.deepEqual(
    chumara && { requested: chumara.requested, origin: chumara.origin, phase: chumara.phase },
    { requested: 4, origin: 0xa8ce, phase: 0 }
  )

  for (let turn = 0; turn < 8; turn++) tick(world, 1 / 12)
  const towers = world.buildings.filter(building => buildingModel(building) === 4)
  assert.deepEqual(
    towers.map(building => [building.team, building.id]),
    [
      ['green', matak.entity],
      ['yellow', chumara.entity],
    ]
  )
  assert.ok([matak, chumara].every(task => task.phase === 8 && task.members.length === 2))

  while (world.turn < 124) tick(world, 1 / 12)
  assert.ok(world.campaignAIs[3].tasks.every(task => !(task.flags & 1) || task.requested === 4))
  tick(world, 1 / 12)
  const hut = world.campaignAIs[3].tasks.find(task => task.flags & 1 && task.requested === 1)
  assert.deepEqual(hut && { origin: hut.origin, exact: hut.extra, phase: hut.phase }, {
    origin: 0xda7a,
    exact: 0,
    phase: 0,
  })
  assert.ok(world.campaignAIs[2].tasks.every(task => !(task.flags & 1) || task.requested === 4))

  const towerLoss = structuredClone(world),
    lostTower = towerLoss.buildings.find(building => building.id === matak.entity)
  assert.ok(lostTower)
  lostTower.hp = 0
  let resumedHut = towerLoss.campaignAIs[3].tasks.find(
    task => task.flags & 1 && task.requested === 1
  )
  for (let turn = 0; turn < 200 && resumedHut?.phase === 0; turn++) {
    tick(towerLoss, 1 / 12)
    resumedHut = towerLoss.campaignAIs[3].tasks.find(task => task.flags & 1 && task.requested === 1)
  }
  assert.equal(resumedHut?.origin, 0xda7a)
  assert.notEqual(resumedHut?.phase, 0)

  while (world.turn < 1000) tick(world, 1 / 12)

  const control = world
  world = migrateCheckpoint(structuredClone(control))
  assert.deepEqual(world, control)
  while (world.turn < 5000) {
    tick(world, 1 / 12)
    tick(control, 1 / 12)
  }
  assert.deepEqual(world, control)
  assert.deepEqual(
    world.buildings.map(building => [
      building.id,
      building.team,
      buildingModel(building),
      building.progress,
    ]),
    [
      [matak.entity, 'green', 4, 1],
      [chumara.entity, 'yellow', 4, 1],
      [hut.entity, 'green', 3, 1],
    ]
  )
  assert.ok([2, 3].every(tribe => world.campaignAIs[tribe].tasks.every(task => !(task.flags & 1))))

  for (const tower of world.buildings) tower.hp = 0
  for (let turn = 0; turn < 200; turn++) tick(world, 1 / 12)
  assert.ok(world.buildings.every(building => buildingModel(building) !== 4 || building.hp <= 0))
  assert.ok([2, 3].every(tribe => world.campaignAIs[tribe].tasks.every(task => !(task.flags & 1))))
})
