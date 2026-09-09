import assert from 'node:assert/strict'
import test from 'node:test'
import fixture from './fixtures/terrain-uv.json' with { type: 'json' }
import manifest from '../decomp/exports.json' with { type: 'json' }
import { terrainTextureBounds } from '../app/terrain-texture.ts'

test('terrain texture endpoints match original Direct3D triangle submissions', () => {
  assert.equal(fixture.executableSha256, manifest.executableSha256)
  fixture.cases.forEach((c, i) => {
    const bounds = terrainTextureBounds(c.size, c.smooth, c.raw)
    assert.deepEqual(
      [0, 2, 4].map(j => [bounds[c.corners[j]], bounds[c.corners[j + 1]]]),
      fixture.expected[i]
    )
  })
})
