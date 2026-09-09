import assert from 'node:assert/strict'
import test from 'node:test'
import fixture from './fixtures/terrain-uv.json' with { type: 'json' }
import manifest from '../decomp/exports.json' with { type: 'json' }
import { terrainTextureBounds } from '../app/terrain-texture.ts'
import models from './fixtures/model-uv.json' with { type: 'json' }
import { modelTextureUV, modelCapUV } from '../app/model-faces.ts'

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

test('model atlas UVs match native texel centers and retain fractional/outside coordinates', () => {
  assert.equal(models.executableSha256, manifest.executableSha256)
  for (const c of models.cases) {
    const [x, y, width, height] = c.placement
    for (const tile of [0, 37, 250, 255])
      for (let i = 0; i < 3; i++) {
        const source = [
          ((tile % 8) + c.raw[i * 2] / 2097152) / 8,
          1 - ((tile >> 3) + c.raw[i * 2 + 1] / 2097152) / 32,
        ]
        const actual = c.smooth ? modelTextureUV(tile, ...source) : source
        const expected = [
          ((tile % 8) + (c.uv[i][0] - x) / width) / 8,
          1 - ((tile >> 3) + (c.uv[i][1] - y) / height) / 32,
        ]
        actual.forEach((value, j) => assert.ok(Math.abs(value - expected[j]) < 1e-7))
      }
  }
  const cap = models.cases.find(c => c.smooth && c.mode === 7)
  for (const [vertex, corner] of [0, 1, 3].entries()) {
    const expected = [(2 + cap.uv[vertex][0]) / 8, 1 - (31 + cap.uv[vertex][1]) / 32]
    modelCapUV(corner).forEach((value, i) => assert.ok(Math.abs(value - expected[i]) < 1e-7))
  }
})
