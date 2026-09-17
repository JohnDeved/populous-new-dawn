import assert from 'node:assert/strict'
import test from 'node:test'

import { migrateCheckpoint } from '../app/game-store.ts'
import { buildingModel, buildingPose } from '../app/building-shapes.ts'
import { checkBuildingSite } from '../app/construction-runtime.ts'
import { createLivePerson, syncLivePersonCells } from '../app/live-people.ts'
import { missionComputerTribes, missionData, missionScript } from '../app/mission-data.ts'
import { browserPosition, cast, command, createWorld, nativePosition, tick } from '../app/model.ts'
import { terrainPointHeight } from '../app/native-terrain.ts'
import { worshipPositions } from '../app/worship.ts'

function raiseOuterWorshipRing(world) {
  const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  Object.assign(shaman, { x: 50, z: 102 })
  shaman.native = createLivePerson(world, shaman)
  shaman.native.h = terrainPointHeight(world.land, shaman.native)
  syncLivePersonCells(world)
  world.shots.bridge = 1
  world.selected = [shaman.id]
  assert.equal(cast(world, 'bridge', { x: 61, z: 102 }), true)
  for (let turn = 0; turn < 200; turn++) tick(world, 1 / 12)
}

function worship(world, head, brave) {
  const [slot] = worshipPositions({
    ...nativePosition(world, head),
    angle: Math.round((head.angle * 1024) / Math.PI) & 2047,
  })
  Object.assign(brave, browserPosition(slot))
  syncLivePersonCells(world)
  world.selected = [brave.id]
  assert.equal(command(world, head), true)
  for (let turn = 0; turn < 24 && !head.followers; turn++) tick(world, 1 / 12)
  assert.equal(head.followers, 1)
}

function finish(world, head, uses = head.uses + 1) {
  head.work = head.target * head.required ** 2 - 1
  for (let turn = 0; turn < 8 && head.uses < uses; turn++) tick(world, 1 / 12)
  assert.equal(head.uses, uses)
}

test('Mission 23 loads its authored tribes, Wildmen and worship chain', () => {
  const world = createWorld(23),
    mission = missionData(23),
    unlock = world.shrines.find(head => head.linkedShrine),
    repeat = unlock.linkedShrine

  assert.deepEqual(
    [mission.level.sourceSha256, ...[1, 2, 3].map(tribe => missionScript(23, tribe).sha256)],
    [
      '12f4a91df64f18cdc154d9d0e39780d52d2e4e1e4efd708fd7a35dd9c3b344dc',
      '948357f83023f426cbd64e209d0e25753a240a219d53cd9493186dd23a71a943',
      '55acfcbf2ea4d3d2a73693c49ffc29774c63575f2639dd1b8920b569fd0c22c1',
      'e45e2508c10e5e30af1e8a4847a5c25bfbd60b4780c7b7c75f9bf1b7a0491a7e',
    ]
  )
  assert.deepEqual(missionComputerTribes(23), [1, 2, 3])
  assert.deepEqual(
    ['blue', 'red', 'yellow', 'green'].map(
      team => world.units.filter(unit => unit.team === team).length
    ),
    [7, 7, 7, 7]
  )
  assert.equal(world.units.filter(unit => unit.team === 'wild').length, 138)
  assert.deepEqual(
    [unlock.required, unlock.target, unlock.remaining, repeat.required, repeat.target, repeat.remaining],
    [1, 192, 1, 1, 100, 0]
  )
  assert.deepEqual(
    [repeat.kind, repeat.rewardMana, repeat.rewardModel, repeat.effectTarget.x, repeat.effectTarget.z],
    ['linkedEffects', 0, 53, 55, 79]
  )
})

test('Mission 23 enemy tribes grow their native settlements and populations', () => {
  const world = createWorld(23)
  for (let turn = 0; turn < 60; turn++) tick(world, 1 / 12)
  assert.ok([1, 2, 3].every(tribe => world.campaignAIs[tribe].tasks.every(task => !(task.flags & 1))))

  for (const [tribe, origin] of [
    [3, 0xa684],
    [2, 0x66ce],
    [1, 0x0a08],
  ]) {
    tick(world, 1 / 12)
    const task = world.campaignAIs[tribe].tasks.find(task => task.flags & 1 && task.type === 0)
    assert.deepEqual(task && { requested: task.requested, origin: task.origin, phase: task.phase }, {
      requested: 4,
      origin,
      phase: 0,
    })
  }

  for (let turn = 0; turn < 8; turn++) tick(world, 1 / 12)
  assert.deepEqual(
    world.buildings
      .filter(building => buildingModel(building) === 4)
      .map(building => building.team)
      .sort(),
    ['green', 'red', 'yellow']
  )

  while (world.turn < 124) tick(world, 1 / 12)
  const towerOrigins = new Map(
    [1, 2, 3].map(tribe => [
      tribe,
      world.campaignAIs[tribe].tasks.find(task => task.flags & 1 && task.requested === 4).target,
    ])
  )
  for (const [tribe, requested] of [
    [3, 1],
    [2, 13],
    [1, 1],
  ]) {
    tick(world, 1 / 12)
    const task = world.campaignAIs[tribe].tasks.find(
      task => task.flags & 1 && task.type === 0 && task.requested === requested
    )
    assert.deepEqual(task && { requested: task.requested, origin: task.origin, phase: task.phase }, {
      requested,
      origin: towerOrigins.get(tribe),
      phase: 0,
    })
  }

  while (world.turn < 188) tick(world, 1 / 12)
  const restored = migrateCheckpoint(structuredClone(world))
  assert.deepEqual(restored, world)
  for (const tribe of [3, 2, 1]) {
    tick(world, 1 / 12)
    tick(restored, 1 / 12)
    const task = world.campaignAIs[tribe].tasks.find(
      task => task.flags & 1 && task.type === 0 && task.requested === 1 && task.phase === 0
    )
    assert.deepEqual(task && { requested: task.requested, origin: task.origin, phase: task.phase }, {
      requested: 1,
      origin: towerOrigins.get(tribe),
      phase: 0,
    })
    assert.deepEqual(restored, world)
  }

  while (world.turn < 200) {
    tick(world, 1 / 12)
    tick(restored, 1 / 12)
  }
  assert.deepEqual(
    world.buildings.map(building => [building.team, buildingModel(building)]).sort(),
    [
      ['green', 1],
      ['green', 1],
      ['green', 4],
      ['red', 1],
      ['red', 1],
      ['red', 4],
      ['yellow', 1],
      ['yellow', 13],
      ['yellow', 4],
    ]
  )
  const boatHouse = world.buildings.find(
      building => building.team === 'yellow' && buildingModel(building) === 13
    ),
    boatTask = world.campaignAIs[2].tasks.find(task => task.entity === boatHouse?.id)
  assert.deepEqual(
    boatHouse && boatTask && {
      target: boatTask.target,
      orientation: boatTask.fallback,
      placement: checkBuildingSite(world, buildingPose(boatHouse), 13, 'yellow', boatHouse.id),
    },
    { target: 0x46ca, orientation: 1, placement: { valid: true, flags: 0 } }
  )

  let yellowBirthTurn = 0
  while (world.turn < 2585) {
    tick(world, 1 / 12)
    tick(restored, 1 / 12)
    if (!yellowBirthTurn && world.units.filter(unit => unit.team === 'yellow').length > 7)
      yellowBirthTurn = world.turn
  }
  assert.deepEqual(restored, world)
  assert.equal(yellowBirthTurn, 967)
  assert.ok(world.buildings.every(building => building.progress === 1))
  assert.deepEqual(
    ['red', 'yellow', 'green'].map(team => [
      team,
      world.buildings.filter(building => building.team === team && buildingModel(building) === 1)
        .length,
      world.units.filter(unit => unit.team === team).length,
    ]),
    [
      ['red', 6, 12],
      ['yellow', 6, 12],
      ['green', 6, 16],
    ]
  )
  assert.ok([1, 2, 3].every(tribe => world.campaignAIs[tribe].tasks.every(task => !(task.flags & 1))))
  const buildings = world.buildings.length
  for (let turn = 0; turn < 128; turn++) {
    tick(world, 1 / 12)
    tick(restored, 1 / 12)
  }
  assert.deepEqual(restored, world)
  assert.equal(world.buildings.length, buildings)
  assert.ok([1, 2, 3].every(tribe => world.campaignAIs[tribe].tasks.every(task => !(task.flags & 1))))
})

test('Mission 23 unlocks and repeats the native zero-mana gift through ordinary worship', () => {
  let world = createWorld(23),
    brave = world.units.find(unit => unit.team === 'blue' && unit.kind === 'brave'),
    unlock = world.shrines.find(head => head.linkedShrine)

  raiseOuterWorshipRing(world)
  worship(world, unlock, brave)
  unlock.work = 96
  world = migrateCheckpoint(structuredClone(world))
  brave = world.units.find(unit => unit.id === brave.id)
  unlock = world.shrines.find(head => head.id === unlock.id)
  finish(world, unlock)

  assert.equal(unlock.active, false)
  assert.equal(unlock.linkedShrine, undefined)
  let repeat = world.shrines.find(head => head.id === 303)
  assert.ok(repeat)

  worship(world, repeat, brave)
  finish(world, repeat)
  let gift = world.effects.find(effect => effect.reward === 'mana')
  assert.deepEqual(
    [repeat.active, repeat.remaining, gift.amount, gift.recipient, gift.rewardModel, gift.phase, gift.remaining],
    [true, 0, 0, 0, 53, 1, 82]
  )

  const pending = world.manaTribes[0].pending
  world = migrateCheckpoint(structuredClone(world))
  repeat = world.shrines.find(head => head.id === repeat.id)
  gift = world.effects.find(effect => effect.id === gift.id)
  for (let turn = 0; world.effects.some(effect => effect.id === gift.id) && turn < 82; turn++)
    tick(world, 1 / 12)
  assert.equal(world.effects.some(effect => effect.id === gift.id), false)
  assert.equal(world.manaTribes[0].pending, pending)

  for (let turn = 0; turn < 4 && !repeat.enabled; turn++) tick(world, 1 / 12)
  finish(world, repeat, 2)
  const second = world.effects.find(effect => effect.reward === 'mana')
  assert.ok(second)
  assert.deepEqual([repeat.active, repeat.uses, second.amount, second.recipient], [true, 2, 0, 0])
})
