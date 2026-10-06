import assert from 'node:assert/strict'
import test from 'node:test'
import { requireGestureProgress } from './gesture-progress.mjs'

const sample = (turn, f2, object = 720) => ({ turn, f2, object })
test('repeated snapshots do not prove gesture progress', () => {
  assert.throws(() => requireGestureProgress([sample(100, 3), sample(100, 3)]))
})
test('a frame change without a logical turn is rejected', () => {
  assert.throws(() => requireGestureProgress([sample(100, 3), sample(100, 4)]))
})
test('logical turns alone or later idle frames do not prove source720 advances', () => {
  assert.throws(() => requireGestureProgress([sample(100, 3), sample(102, 3)]))
  assert.throws(() => requireGestureProgress([sample(100, 3), sample(102, 4, 48)]))
})
test('native frame progress over observed logical turns permits retained sampling gaps', () => {
  assert.deepEqual(requireGestureProgress([sample(100, 3), sample(100, 3), sample(104, 5)]),
    { turns: [100, 104], frames: [3, 5] })
})
