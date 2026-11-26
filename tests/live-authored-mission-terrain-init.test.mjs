import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { createWorld } from '../app/model.ts'

test('ordinary M3 startup completes its two full radius-64 terrain traversals', () => {
  const w = createWorld(3)
  assert.equal(w.turn, 0)
  const land = w.land
  // The two radius-64 square traversals contribute 2 × 129² attempts;
  // the authored startup also applies its own 25 single-pass queue attempts.
  assert.equal(land.attempts, 2 * 129 ** 2 + 25)
  assert.equal(land.recursing, false)
  assert.equal(land.queued.length, 0)
  assert.equal(land.textureUpdates.length, 0)
  assert.ok(land.dirty.every(flag => flag === 0))
  const categories = new Uint8Array(land.categories.buffer)
  assert.equal(createHash('sha256').update(categories).digest('hex'),
    '7592b5f5bdf8a10ef963332e3951b1176e09c2520516e5f56c80a32814c22685')
})
