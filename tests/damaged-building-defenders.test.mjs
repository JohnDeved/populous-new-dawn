import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, addUnit, ensureBuildingDamage } from '../app/model.ts'
import { buildingAdmission } from '../app/live-building-entry.ts'
import { liveBuildingHasDefenders } from '../app/live-building-combat.ts'
import { buildingFootprintCells, buildingPose } from '../app/building-shapes.ts'
import { createLivePerson } from '../app/live-people.ts'
import { insertObjectIntoCell, removeObjectFromCell } from '../app/object-cells.ts'

// Supplied source-boundary fixture, separate from ordinary Mission7 siege replay.
for (const angle of [0, 512, 1024, 1536]) {
  test(`damaged building scans linked plan defenders at orientation ${angle}`, () => {
    const w = createWorld(1),
      b = w.buildings.find(b => b.kind === 'hut')
    b.angle = (angle * Math.PI) / 1024
    const state = ensureBuildingDamage(b),
      admission = buildingAdmission(w, b)
    state.state = 1
    admission.inside = 1
    assert.equal(
      liveBuildingHasDefenders(w, b, 0),
      false,
      'hidden occupants do not defend the plan'
    )
    const index = buildingFootprintCells(buildingPose(b))[0]
    const u = addUnit(w, 'yellow', 'brave', { x: 0, z: 0 }),
      p = createLivePerson(w, u)
    Object.assign(p, { x: ((index & 127) << 9) + 256, y: ((index >> 7) << 9) + 256 })
    w.objectCells.objects.set(p.id, p)
    insertObjectIntoCell(w.objectCells, p, p)
    assert.equal(liveBuildingHasDefenders(w, b, 0), true)
    p.tribe = 0
    assert.equal(liveBuildingHasDefenders(w, b, 0), false, 'own attacker is not a defender')
    for (const neutral of [-1, 255]) {
      p.tribe = neutral
      assert.equal(liveBuildingHasDefenders(w, b, 0), false, 'native signed neutral tribe')
    }
    p.tribe = 2
    p.class = 2
    assert.equal(liveBuildingHasDefenders(w, b, 0), false, 'only person class participates')
    p.class = 1
    removeObjectFromCell(w.objectCells, p)
    assert.equal(
      liveBuildingHasDefenders(w, b, 0),
      false,
      'unlinked object Map entry is insufficient'
    )
    state.state = 2
    assert.equal(liveBuildingHasDefenders(w, b, 0), true, 'completed building uses occupancy')
    admission.inside = 0
    assert.equal(liveBuildingHasDefenders(w, b, 0), false)
  })
}
