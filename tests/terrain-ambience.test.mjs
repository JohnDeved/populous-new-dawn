import assert from 'node:assert/strict'
import test from 'node:test'
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
