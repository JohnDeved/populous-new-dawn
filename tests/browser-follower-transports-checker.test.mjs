import test from 'node:test'
import assert from 'node:assert/strict'
import { assertSelectedCrews } from '../scripts/check-browser-follower-transports.mjs'

const fleet = Array.from({ length: 6 }, (_, i) => ({
  id: 100 + i, crew: [{ id: i * 2 + 1, model: 2 }, { id: i * 2 + 2, model: i % 2 ? 3 : 2 }],
}))
test('rendered transport checker independently counts whole mixed-class craft', () => {
  assert.deepEqual(assertSelectedCrews([3, 4], fleet, 1, 3), [101])
  assert.equal(assertSelectedCrews(fleet.slice(0, 5).flatMap(v => v.crew.map(p => p.id)), fleet, 5, 2).length, 5)
  assert.equal(assertSelectedCrews(fleet.flatMap(v => v.crew.map(p => p.id)), fleet, 6).length, 6)
})
test('rendered transport checker rejects partial, unrelated, duplicate and wrong-class groups', () => {
  for (const [selection, count, model] of [[[1], 1, 2], [[1, 2, 99], 1, 2], [[1, 1], 1, 2], [[1, 2], 1, 3], [[1, 2], 5, 2]])
    assert.throws(() => assertSelectedCrews(selection, fleet, count, model))
})
