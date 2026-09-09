import assert from 'node:assert/strict'
import test from 'node:test'
import fixture from './fixtures/sky-horizon.json' with { type: 'json' }
import camera from '../app/original-camera.json' with { type: 'json' }
import { skyCloudLayer } from '../app/sky.ts'
test('camera horizons preserve original sky dispatch coordinates and fade', () => {
  assert.equal(fixture.executableSha256, camera.executableSha256)
  for (const c of fixture.cases) {
    assert.equal(c.horizon, camera.views[c.index * 5 + c.preset].horizon)
    if (!c.horizon) continue // Original zero-height triangles have no raster area.
    const layers = [256, 192].map(size =>
      skyCloudLayer(
        new Int32Array(4992),
        c.width,
        c.height,
        c.horizon,
        size,
        true,
        true,
        true,
        true
      ).vertices.map(v => [v.x, v.y, v.color])
    )
    assert.deepEqual(layers, c.layers)
  }
})
