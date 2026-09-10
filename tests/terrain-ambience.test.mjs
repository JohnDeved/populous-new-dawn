import assert from 'node:assert/strict'
import test from 'node:test'
import { soundListener, treeAmbienceAudible } from '../app/ambient-sound.ts'
import trees from './fixtures/tree-ambience.json' with { type: 'json' }
import { TerrainAmbience } from '../app/terrain-ambience.ts'
import fixture from './fixtures/terrain-ambience.json' with { type: 'json' }

test('terrain ambience matches complete native ground queues, including empty views and depth ties', () => {
  const ambience = new TerrainAmbience()
  for (const { triangles, expected } of fixture.cases) {
    ambience.clear()
    for (const t of triangles) ambience.add(t.bucket, t.height, t.category)
    assert.deepEqual(ambience.result(), expected)
  }
})

test('tree ambience camera offset and wrapped radius match complete native cell visits', () => {
  for (const { input: c, expected } of trees.cases) {
    const listener = soundListener(c.center, c.angle)
    const audible =
      !c.full &&
      !(c.flags & 17) &&
      c.model > 0 &&
      c.model < 7 &&
      treeAmbienceAudible(c.position, listener)
    assert.deepEqual({ listener, trees: audible }, expected)
  }
})
