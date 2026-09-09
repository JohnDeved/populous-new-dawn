import assert from 'node:assert/strict'
import test from 'node:test'
import fixture from './fixtures/visible-cells.json' with { type: 'json' }
import { meshCellVisible } from '../app/projection.ts'
import { visibleTerrainCells } from '../app/terrain-visibility.ts'

test('terrain submission covers the native cell gate across headings and seams', () => {
  for (const c of fixture.cases) {
    const center = { x: c.center[0], y: c.center[1] },
      cells = visibleTerrainCells(c.spans, center)
    for (let z = 0; z < 128; z++)
      for (let x = 0; x < 128; x++) {
        // Both diagonals have their centroids inside this native cell.
        const point = {
          x: Math.round((-128 + x * 2 + 2 / 3 + 8) * 256),
          y: Math.round(-(-128 + z * 2 + 2 / 3 + 8) * 256),
        }
        const expected = meshCellVisible(c.spans, point, center)
        assert.equal(Boolean(cells[z * 128 + x]), expected, JSON.stringify({ center, x, z }))
      }
  }
})

test('terrain copies omit only tiles with no native-visible cell, including seams and expanded bounds', async () => {
  const { visibleTerrainCopies, terrainTiles } = await import('../app/terrain-visibility.ts')
  const { polygonMeshBounds } = await import('../app/projection.ts')
  for (const heading of [0, 256, 512, 1024, 1536, 2047]) {
    for (const center of [{ x: 2560, y: -9728 }, { x: 34560, y: 30464 }, { x: -30464, y: -34560 }]) {
      for (const padding of [0, 16, 32]) {
        const spans = polygonMeshBounds([-18-padding, -20, 18+padding, -20, 32+padding, 54, -32-padding, 54], heading)
        const expected = terrainTiles.filter(([tx, tz]) => {
          for (let z = 0; z < 128; z++) for (let x = 0; x < 128; x++) {
            const point = {
              x: Math.round((-128 + x*2 + 2/3 + tx*256 + 8)*256),
              y: Math.round(-(-128 + z*2 + 2/3 + tz*256 + 8)*256),
            }
            if (meshCellVisible(spans, point, center, true)) return true
          }
          return false
        })
        assert.deepEqual(visibleTerrainCopies(spans, center), expected, JSON.stringify({heading, center, padding}))
      }
    }
  }
  assert.deepEqual(visibleTerrainCopies([[0, 0], [2, 2]], { x: 0, y: 0 }), [])
})
