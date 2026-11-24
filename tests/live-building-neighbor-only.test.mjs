import test from 'node:test'
import assert from 'node:assert/strict'
import { createWorld, tick, placeBuilding, placementError } from '../app/model.ts'
import { buildingPlanPose, prepareBuildingSiteCheck } from '../app/construction-runtime.ts'
import { buildingFootprintCells } from '../app/building-shapes.ts'

test('a separate nearby Hut plan rejects an untouched Hut footprint by adjacency alone', () => {
  const w = createWorld(3)
  const startupPending = () =>
    w.levelStart.some(s => s.phase !== 4 || s.wave || s.carriers.length ||
      s.stoneTurns.some(t => t !== null && w.turn - t < 20))
  while (startupPending() && w.turn < 256) tick(w, 1 / 12)
  assert.equal(startupPending(), false)

  const first = { x: 24, z: 70 }
  const neighbor = { x: 30, z: 72 }
  const farther = { x: 32, z: 72 }
  const tiles = p => buildingFootprintCells(buildingPlanPose(w, 'hut', p))
  const site = p => prepareBuildingSiteCheck(w, 'blue')(buildingPlanPose(w, 'hut', p), 1)
  const owner = i => w.land.buildingIds[i] & 1023
  const area = cells => [
    ...new Set(cells.flatMap(i =>
      [-1, 0, 1].flatMap(y =>
        [-1, 0, 1].map(x => ((((i >> 7) + y) & 127) << 7) | (((i & 127) + x) & 127))
      )
    ))
  ]
  const snapshot = cells => cells.map(i =>
    [owner(i), w.land.flags[i], w.land.categories[i], w.land.heights[i]])
  assert.deepEqual(site(neighbor), { valid: true, flags: 0 })
  assert.equal(placementError(w, 'hut', neighbor), null)
  const cells = tiles(neighbor)
  const before = snapshot(cells)
  assert.ok(cells.every(i => owner(i) === 0))
  assert.ok(area(cells).every(i => owner(i) === 0))

  assert.equal(placeBuilding(w, 'hut', first), true)
  const plan = w.buildings.at(-1)
  assert.equal(plan.kind, 'hut')
  assert.equal(plan.team, 'blue')
  assert.equal(plan.progress, 0)
  assert.equal(w.buildings.filter(b => b.id === plan.id && b.hp > 0).length, 1)
  const result = site(neighbor)
  assert.deepEqual(snapshot(cells), before)
  const other = area(cells).filter(i => owner(i))
  assert.deepEqual(other, [11281, 11409, 11537])
  assert.ok(other.every(i => owner(i) === plan.id && (w.land.flags[i] & 0x200) === 0))

  assert.deepEqual(result, { valid: false, flags: 0x800000 })
  assert.equal(placementError(w, 'hut', neighbor), 'Leave room around the other buildings and their entrances.')
  const count = w.buildings.length
  assert.equal(placeBuilding(w, 'hut', neighbor), false)
  assert.equal(w.buildings.length, count)
  assert.ok(area(tiles(farther)).every(i => owner(i) === 0))
  assert.deepEqual(site(farther), { valid: true, flags: 0 })
  assert.equal(placeBuilding(w, 'hut', farther), true)
  assert.equal(w.buildings.length, count + 1)
})
