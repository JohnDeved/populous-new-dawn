import assert from 'node:assert/strict'
import test from 'node:test'
import { browserPosition, cast, command, createWorld, tick } from '../app/model.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { syncLivePersonCells } from '../app/live-people.ts'
import { worshipHeadPose } from '../app/live-worship.ts'
import { worshipPositions } from '../app/worship.ts'

function finishWorship(world, head) {
  const followers = world.units
    .filter(unit => unit.team === 'blue' && unit.kind === 'brave')
    .slice(0, head.required)
  const slots = worshipPositions(worshipHeadPose(world, head))
  followers.forEach((unit, index) =>
    Object.assign(unit, browserPosition(slots[index]), { native: null })
  )
  syncLivePersonCells(world)
  world.selected = followers.map(unit => unit.id)
  assert.equal(command(world, head), true)
  for (let turn = 0; turn < 8; turn++) tick(world, 1 / 12)
  assert.equal(head.followers, head.required)
  head.work = head.target * head.required ** 2 - 1
  for (let turn = 0; turn < 8 && !head.uses; turn++) tick(world, 1 / 12)
  assert.equal(head.uses, 1)
}

test('Mission 14 delivers both linked gifts and a castable Angel through shipped paths', () => {
  const world = createWorld(14),
    multiHead = world.shrines.find(shrine => shrine.rewards),
    angelHead = world.shrines.find(shrine => shrine.reward === 'angel'),
    shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  assert.deepEqual(
    {
      tribes: world.campaignAIs.map((ai, tribe) => (ai ? tribe : null)).filter(Boolean),
      multi: { kind: multiHead.kind, rewards: multiHead.rewards },
      angel: { kind: angelHead.kind, reward: angelHead.reward, target: angelHead.angelTarget },
    },
    {
      tribes: [1, 2, 3],
      multi: { kind: 'earthquake', rewards: ['earthquake', 'bridge'] },
      angel: { kind: 'angel', reward: 'angel', target: undefined },
    }
  )

  for (const unit of world.units) if (unit.team !== 'blue') unit.inside = 1
  finishWorship(world, multiHead)
  assert.deepEqual(world.gifts.map(gift => gift.reward), ['earthquake', 'bridge'])
  for (let turn = 0; turn < 82; turn++) tick(world, 1 / 12)
  assert.deepEqual(
    {
      earthquake: [world.shots.earthquake, world.giftCounts.earthquake],
      bridge: [world.shots.bridge, world.giftCounts.bridge],
    },
    { earthquake: [1, 1], bridge: [1, 1] }
  )

  finishWorship(world, angelHead)
  for (let turn = 0; turn < 82; turn++) tick(world, 1 / 12)
  assert.deepEqual([world.shots.angel, world.giftCounts.angel], [1, 1])
  assert.equal(cast(world, 'angel', { x: shaman.x + 2, z: shaman.z + 2 }), true)
  assert.deepEqual([world.shots.angel, world.giftCounts.angel], [0, 1])
  for (let turn = 0; turn < 120 && !world.effects.some(effect => effect.angel); turn++)
    tick(world, 1 / 12)
  const angel = world.effects.find(effect => effect.angel)
  assert.ok(angel)
  assert.equal(angel.team, 'blue')

  for (const unit of world.units) if (unit.team !== 'blue') unit.inside = 1
  const victim = world.units.find(unit => unit.team !== 'blue' && unit.hp > 0)
  angel.angel.target = null
  world.outcome.alliances[0] = 0
  Object.assign(victim, {
    x: angel.x + 1.9,
    z: angel.z + 1.9,
    team: 'red',
    inside: null,
    invisibility: 0,
    flight: null,
    fight: null,
    entry: null,
    builder: null,
    native: null,
  })
  tick(world, 1 / 12)
  assert.equal(angel.angel.target, victim.id)
  for (let turn = 0; turn < 80 && world.units.includes(victim); turn++) tick(world, 1 / 12)
  assert.equal(world.units.includes(victim), false)

  const restored = migrateCheckpoint(structuredClone(world))
  assert.deepEqual(
    restored.shrines.find(shrine => shrine.rewards).rewards,
    ['earthquake', 'bridge']
  )
  assert.deepEqual(restored.effects.find(effect => effect.angel).angel, angel.angel)
  assert.equal(restored.shots.angel, 0)
  assert.equal(restored.giftCounts.angel, 1)
})
