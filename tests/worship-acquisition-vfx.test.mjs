import assert from 'node:assert/strict'
import test from 'node:test'

import { command, createWorld, nativePosition, tick } from '../app/model.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { terrainPointHeight } from '../app/native-terrain.ts'

const stepUntil = (world, predicate, limit = 1000) => {
  for (let visit = 0; !predicate() && visit < limit; visit++) tick(world, 1 / 12)
  assert.ok(predicate())
}

test('ordinary Stone Head completion creates the original six-visit acquisition VFX before stock delivery', () => {
  const world = createWorld(),
    head = world.shrines.find(shrine => shrine.kind === 'bridge')
  world.manaWorld.gameFlags = 32
  world.units = world.units.filter(unit => unit.team === 'blue')
  world.selected = world.units.map(unit => unit.id)

  assert.equal(world.shots.bridge, 0)
  assert.equal(world.giftCounts.bridge, 0)
  assert.equal(command(world, head), true)
  stepUntil(world, () => world.gifts.some(gift => gift.reward === 'bridge'))

  const gift = world.gifts.find(gift => gift.reward === 'bridge'),
    ground = terrainPointHeight(world.land, nativePosition(world, head))
  assert.ok(gift)
  assert.deepEqual(
    {
      reward: gift.reward,
      x: gift.x,
      z: gift.z,
      frame: gift.frame,
      phase: gift.phase,
      remaining: gift.remaining,
      heightOffset: Math.round(gift.height * 45) - ground,
      shots: world.shots.bridge,
      giftCount: world.giftCounts.bridge,
      uses: head.uses,
      work: head.work,
    },
    {
      reward: 'bridge',
      x: head.x,
      z: head.z,
      frame: 1068,
      phase: 6,
      remaining: 82,
      heightOffset: 800,
      shots: 0,
      giftCount: 0,
      uses: 1,
      work: 0,
    }
  )

  const checkpoint = migrateCheckpoint(structuredClone(world)),
    saved = checkpoint.gifts.find(candidate => candidate.id === gift.id)
  assert.ok(saved)
  assert.deepEqual(
    {
      reward: saved.reward,
      frame: saved.frame,
      phase: saved.phase,
      remaining: saved.remaining,
      height: saved.height,
    },
    {
      reward: gift.reward,
      frame: gift.frame,
      phase: gift.phase,
      remaining: gift.remaining,
      height: gift.height,
    }
  )

  const visible = []
  for (let visit = 1; visit <= 6; visit++) {
    tick(world, 1 / 12)
    visible.push([gift.phase, gift.remaining, world.shots.bridge, world.giftCounts.bridge])
  }
  assert.deepEqual(visible, [
    [5, 81, 0, 0],
    [4, 80, 0, 0],
    [3, 79, 0, 0],
    [2, 78, 0, 0],
    [1, 77, 0, 0],
    [0, 76, 0, 0],
  ])

  for (let visit = 0; visit < 75; visit++) tick(world, 1 / 12)
  assert.equal(gift.remaining, 1)
  assert.equal(world.shots.bridge, 0)
  assert.equal(world.giftCounts.bridge, 0)
  assert.ok(world.gifts.includes(gift))

  tick(world, 1 / 12)
  assert.equal(world.shots.bridge, 1)
  assert.equal(world.giftCounts.bridge, 1)
  assert.equal(world.gifts.includes(gift), false)
})
