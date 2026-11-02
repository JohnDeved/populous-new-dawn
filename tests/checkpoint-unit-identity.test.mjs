import test from 'node:test'
import assert from 'node:assert/strict'
import { restoreCapacityPolicy } from '../app/capacity-policy.ts'
import { createMotionRoutes } from '../app/person-routes.ts'
import { createObjectCells, setCellObject } from '../app/object-cells.ts'

// Supplied current-format envelope; actual validator/routes/registry helpers only.
// No model, checkpoint store, native simulation or browser is imported.
const unit = id => ({ id, native: null })
function world(units = [unit(1024), unit(1025)]) {
  return {
    capacityPolicy: { version: 1, mode: 'scalable' },
    buildingOrders: { scalable: true, cursor: 1, active: 0,
      records: Array.from({ length: 800 }, () => ({ references: 0 })) },
    motionRoutes: createMotionRoutes(true),
    objectCells: createObjectCells(), pathfinding: { people: new Map() },
    units, buildings: [], vehicles: [], trees: [], shrines: [], effects: [], fights: [], projectiles: [],
    nextId: 1026,
  }
}
test('distinct scalable unit IDs are accepted without mutating the supplied checkpoint', () => {
  const w = world(), before = structuredClone(w)
  assert.doesNotThrow(() => restoreCapacityPolicy(w))
  assert.deepEqual(w, before)
})
test('distinct units sharing an ID are rejected before checkpoint normalization', () => {
  const w = world([unit(1024), unit(1024)]), before = structuredClone(w)
  assert.throws(() => restoreCapacityPolicy(w), /Duplicate scalable checkpoint unit ID/)
  assert.deepEqual(w, before)
})
test('repeated array membership is not a second valid unit owner', () => {
  const u = unit(1024), w = world([u, u])
  assert.throws(() => restoreCapacityPolicy(w), /Duplicate scalable checkpoint unit ID/)
  assert.equal(w.units[0], w.units[1])
})
test('registry aliases remain permitted without duplicate array membership', () => {
  const w = world(), person = { id: 1024 }
  w.units[0].native = person
  w.objectCells.objects.set(person.id, person)
  w.pathfinding.people.set(person.id, person)
  const before = structuredClone(w)
  assert.doesNotThrow(() => restoreCapacityPolicy(w))
  assert.deepEqual(w, before)
})
test('existing ID range rejection remains intact', () => {
  for (const id of [0, -1, 1026, NaN, 1.5]) {
    const w = world([unit(id)])
    assert.throws(() => restoreCapacityPolicy(w), /Invalid scalable checkpoint object ID/)
  }
})
test('actual cell registry resolves one owner per ID, not both duplicate units', () => {
  const cells = createObjectCells(), first = { id: 1024 }, second = { id: 1024 }
  setCellObject(cells, first.id, first)
  setCellObject(cells, second.id, second)
  assert.equal(cells.objects.size, 1)
  assert.equal(cells.objects.get(1024), second)
  assert.notEqual(cells.objects.get(1024), first)
})
