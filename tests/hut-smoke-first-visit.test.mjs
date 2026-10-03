import assert from 'node:assert/strict'
import test from 'node:test'
import { captureHutFirstVisits } from './support/hut-smoke-scene.mjs'

test('ordinary Mission2 admission includes the new smoke root in that turn’s effect visit', async () => {
  const { event, roots } = await captureHutFirstVisits()
  assert.equal(event.building, 72)
  assert.deepEqual(event.residents, [79])
  assert.equal(event.level, 3)
  assert.equal(event.turn, 186)
  // 0040c4e0 -> 004edbd0 -> 0050c150, then the ordinary secondary pass
  // 004ec924 -> 004ed700 -> 0050a750 -> 0050c260. The initializer starts at
  // 16; the allocation turn is already processor visit 1, leaving 15.
  assert.deepEqual(roots, Array.from({ length: 16 }, (_, visit) => ({
    lifetime: 15 - visit,
    visible: visit < 15,
    mode: 'partial',
  })))
})
