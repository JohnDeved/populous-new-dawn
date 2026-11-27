import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'

test('authored Mission 1 Braves heal four native life on the eight-turn cadence', () => {
  const w = createWorld()
  for (let i = 0; i < 30; i++) tick(w, 1 / 12)
  assert.equal(w.turn, 30)
  const [low, threshold, healthy] = [13, 14, 15].map(id => w.units.find(u => u.id === id))
  assert.ok([low, threshold, healthy].every(u => u.team === 'blue' && u.kind === 'brave' && u.native.model === 2))
  assert.equal(w.manaWorld.gameFlags & 128, 0)
  // Supply only prior injury; leave all authored people/world controllers live.
  low.hp = 10
  low.native.life = 200
  threshold.hp = 12.3
  threshold.native.life = 246
  const rows = []
  for (let i = 0; i < 10; i++) {
    tick(w, 1 / 12)
    rows.push([w.turn, ...[low, threshold, healthy].map(u => {
      assert.ok(w.units.includes(u) && u.hp > 0)
      assert.equal(u.hp, u.native.life / 20)
      return [u.native.life, u.native.flags3 & 0x1000]
    })])
  }
  assert.equal(w.turn, 40)
  assert.deepEqual(rows, Array.from({ length: 10 }, (_, index) => {
    const turn = index + 31
    return [turn, turn === 31 ? [200, 0] : turn === 40 ? [208, 4096] : [204, 4096],
      turn === 31 ? [246, 0] : turn === 40 ? [254, 0] : [250, 4096], [1000, 0]]
  }))
})
