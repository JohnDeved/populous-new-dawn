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
