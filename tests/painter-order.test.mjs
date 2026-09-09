import assert from 'node:assert/strict'
import { test } from 'node:test'
import fixture from './fixtures/painter-order.json' with { type: 'json' }
import camera from '../app/original-camera.json' with { type: 'json' }
import {
  comparePolygons,
  modelTriangleVisible,
  painterDepth,
  polygonBucket,
} from '../app/painter-order.ts'
import faces from './fixtures/model-facing.json' with { type: 'json' }
test('mixed polygon buckets, reverse insertion ties and raster depths match native captures', () => {
  assert.equal(fixture.executableSha256, camera.executableSha256)
  for (const c of fixture.cases) {
    const commands = c.triangles.map((t, order) => ({
      order,
      bucket: polygonBucket(t.depths, t.bias, !!t.flags),
    }))
    assert.deepEqual(
      commands.map(p => p.bucket),
      c.buckets
    )
    commands.sort(comparePolygons)
    assert.deepEqual(
      commands.map(p => p.order),
      c.order
    )
    assert.deepEqual(
      commands.filter((_, i) => i % 4).map(p => p.order),
      c.alphaOrder
    )
    commands.forEach((p, i) => assert.equal(painterDepth(i), c.rasterDepths[p.order]))
  }
})

test('completed models reject native rear faces and shared side/bottom outcodes', () => {
  assert.equal(faces.executableSha256, camera.executableSha256)
  for (const c of faces.cases.filter(c => c.stage === 4)) {
    const points = c.projected.map(([screenX, screenY]) => ({ screenX, screenY }))
    assert.equal(modelTriangleVisible(points, 1240, 1000), !!c.submitted)
  }
  const triangle = (x, y) =>
    [
      [x, y],
      [x + 10, y],
      [x, y + 10],
    ].map(([screenX, screenY]) => ({ screenX, screenY }))
  for (const [x, y, expected] of [
    [-11, 0, false],
    [1240, 0, false],
    [0, 1000, false],
    [-5, 0, true],
    [0, -20, true],
  ])
    assert.equal(modelTriangleVisible(triangle(x, y), 1240, 1000), expected)
})
