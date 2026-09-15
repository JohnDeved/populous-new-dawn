import test from 'node:test'
import assert from 'node:assert/strict'
import fixture from './fixtures/building-validity.json' with { type: 'json' }
import manifest from '../decomp/exports.json' with { type: 'json' }
import { buildingCellValid } from '../app/building-validity.ts'
import { createWorld, placementError, placeBuilding, tick, buildingPose } from '../app/model.ts'
import { buildingFootprintCells } from '../app/building-shapes.ts'

test('complete native cell validity and exact placement feedback', () => {
  assert.equal(fixture.executableSha256, manifest.executableSha256)
  fixture.cases.forEach((c, n) => {
    const land = {
      heights: new Int16Array(16384),
      flags: new Uint32Array(16384),
      categories: new Uint8Array(16384),
      buildingIds: new Uint16Array(16384),
    }
    for (const d of c.cells) {
      land.heights[d.index] = d.height
      land.flags[d.index] = d.flags
      land.categories[d.index] = d.category
      land.buildingIds[d.index] = d.building
    }
    const tribe = { ...c.tribe },
      w = {
        land,
        landFlags: c.landFlags,
        levelFlags: c.levelFlags,
        building: () => c.building,
        scenery: () => c.scenery,
      }
    assert.deepEqual(
      {
        valid: buildingCellValid(w, tribe, c.cell, c.mask, c.model, c.plan, c.computer),
        flags: tribe.flags,
      },
      fixture.expected[n]
    )
  })
})

test('placement protects reincarnation stones without a living Shaman and reserves buildings', () => {
  for (let direction = 0; direction < 4; direction++) {
    const w = createWorld()
    w.manaWorld.gameFlags = 32
    w.units = w.units.filter(unit => unit.team !== 'blue' || unit.kind !== 'shaman')
    w.buildingDirections.hut = direction
    assert.match(placementError(w, 'hut', { x: 4, z: 32 }), /worship/)
    assert.equal(placeBuilding(w, 'hut', { x: 4, z: 32 }), false)
    assert.equal(placementError(w, 'hut', { x: -2, z: 32 }), null)
    assert.ok(placeBuilding(w, 'hut', { x: -2, z: 32 }))
    const b = w.buildings.at(-1)
    assert.match(placementError(w, 'hut', { x: -2, z: 32 }), /other buildings/)
    for (let n = 0; n < 3000 && b.preparation; n++) tick(w, 1 / 12)
    assert.equal(b.preparation, undefined)
    assert.ok(b.progress > 0 && b.progress < 1)
    for (const i of buildingFootprintCells(buildingPose(b))) {
      assert.ok(w.land.flags[i] & 512)
      assert.equal(w.land.buildingIds[i] & 1023, b.id)
    }
    assert.match(placementError(w, 'hut', { x: -2, z: 32 }), /other buildings/)
  }
})
