import assert from 'node:assert/strict'
import test from 'node:test'
import { findCombatApproachPoint } from '../app/combat-order-search.ts'
import { buildingOutsidePoint } from '../app/building-shapes.ts'
import { terrainCellHeightRange } from '../app/native-terrain.ts'
import fixture from './fixtures/combat-approach-point.json' with { type: 'json' }

test('attack approach points and search pool state match complete native queries', () => {
  for (const { input: c, expected } of fixture.cases) {
    const flags = new Uint32Array(16384).fill(c.flags),
      categories = new Uint8Array(16384).fill(c.category),
      buildingIds = new Uint16Array(16384).fill(0xfc02),
      heights = new Int16Array(16384).fill(c.height)
    for (const [i, f, cat, b, h] of c.patches) {
      flags[i] = f
      categories[i] = cat
      buildingIds[i] = b
      heights[i] = h
    }
    const objects = new Map(c.records.map(p => [p.id, p])),
      search = Uint8Array.from(c.search),
      events = []
    let cellReads = 0
    const collision = {
      cell: p => {
        cellReads++
        const i = (p.y >> 9) * 128 + (p.x >> 9)
        return { flags: flags[i], category: categories[i], building: buildingIds[i] }
      },
      objects,
      walkMask: [],
      boatAt: () => {
        throw Error('Unexpected boat lookup in whole-cell approach query')
      },
    }
    const point = findCombatApproachPoint(c.records[0], c.order, {
      collision,
      search,
      landLimit: c.limit,
      heightRange: cell => {
        events.push(['height', cell])
        return terrainCellHeightRange({ heights }, cell)
      },
      outside: id => {
        events.push(['outside', id])
        return buildingOutsidePoint(objects.get(id))
      },
    })
    assert.deepEqual({ point, search: [...search], events }, expected)
    if (c.mode === 3 && c.order.model !== 28)
      assert.ok(cellReads <= 128 * 128 + 1, 'occupied-area scan must stop after one world lap')
  }
})
