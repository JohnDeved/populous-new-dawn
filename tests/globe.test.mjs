import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'node:test'
import { globeMesh, globePoint, globeShade } from '../app/globe.ts'
import fixture from './fixtures/globe.json' with { type: 'json' }

test('world-view terrain matches captured native mesh order, projection and lighting', () => {
  assert.equal(fixture.executableSha256, '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f')
  for (const { view, triangles, sha256 } of fixture.meshes) {
    const mesh = globeMesh(view).map(t => t.points.map(p => {
      const point = globePoint(view, p.x << 9, p.y << 9)
      return { ...point, ...globeShade(view, point) }
    }))
    assert.equal(mesh.length, triangles)
    assert.equal(createHash('sha256').update(JSON.stringify(mesh)).digest('hex'), sha256,
      `Native globe submission differs at ${JSON.stringify(view)}`)
  }
})
