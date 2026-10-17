import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, createGift, tick } from '../app/model.ts'
import { migrateCheckpoint } from '../app/game-store.ts'

for (const [mission, reward] of [[1, 'lightning'], [1, 'bridge'], [2, 'tornado']]) {
  for (const capped of [false, true]) {
    test(`M${mission} ${reward} payout preserves status at ${capped ? 'above-cap' : 'empty'} stock`, () => {
      const world = createWorld(mission),
        head = world.shrines.find(shrine => shrine.kind === reward),
        gift = createGift(world, reward, head, 0, head.ordinarySpellReward)
      assert.ok(gift.ordinaryWorship)
      gift.phase = 0
      gift.remaining = 1
      world.shots[reward] = capped ? 9 : 0
      world.giftCounts[reward] = 15
      world.message = 'Existing compatibility notice'
      world.messageUntil = 12345
      const restored = migrateCheckpoint(structuredClone(world))
      for (const candidate of [world, restored]) {
        tick(candidate, 1 / 12)
        assert.equal(candidate.shots[reward], capped ? 9 : 1)
        assert.equal(candidate.giftCounts[reward], 15)
        assert.equal(candidate.gifts.some(item => item.id === gift.id), false)
        assert.equal(candidate.message, 'Existing compatibility notice')
        assert.equal(candidate.messageUntil, 12345)
      }
    })
  }
}

test('untagged spell payout keeps existing feedback outside ordinary proof scope', () => {
  const world = createWorld(),
    head = world.shrines.find(shrine => shrine.kind === 'bridge'),
    gift = createGift(world, 'bridge', head)
  gift.phase = 0
  gift.remaining = 1
  world.message = 'Previous status'
  world.messageUntil = 12345
  tick(world, 1 / 12)
  assert.match(world.message, /received\. 1 shots ready\.$/)
  assert.equal(world.messageUntil, world.time + 9)
})
