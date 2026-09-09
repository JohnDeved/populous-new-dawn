import assert from 'node:assert/strict'
import { test } from 'node:test'
import fixture from './fixtures/painter-order.json' with { type: 'json' }
import camera from '../app/original-camera.json' with { type: 'json' }
import { comparePolygons, painterDepth, polygonBucket } from '../app/painter-order.ts'
test('mixed polygon buckets, reverse insertion ties and raster depths match native captures', () => {
  assert.equal(fixture.executableSha256, camera.executableSha256)
  for (const c of fixture.cases) {
    const commands = c.triangles.map((t, order) => ({ order, bucket: polygonBucket(t.depths, t.bias, !!t.flags) }))
    assert.deepEqual(commands.map(p => p.bucket), c.buckets)
    commands.sort(comparePolygons)
    assert.deepEqual(commands.map(p => p.order), c.order)
    commands.forEach((p, i) => assert.equal(painterDepth(i), c.rasterDepths[p.order]))
  }
})
