import assert from 'node:assert/strict'
import test from 'node:test'
import { addUnit, createWorldState } from '../app/world-state.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { combatPerson, combatWorld, selectLiveCombatTarget } from '../app/live-combat.ts'
import { objectsInCell } from '../app/object-cells.ts'

function fixture(x, y) {
  const w = createWorldState(1)
  const point = { x: x * 2 - 8, z: -y * 2 - 8 }
  const first = addUnit(w, 'red', 'warrior', point)
  const second = addUnit(w, 'red', 'warrior', point)
  for (const u of [first, second]) {
    u.native = createLivePerson(w, u)
    registerLivePerson(w, u.native)
  }
  return { w, point, first, second, dense: y * 128 + x, packed: (y << 9) | (x << 1) }
}

test('combat dense cells preserve real registered-person head order, including map edges', () => {
  for (const [x, y] of [[5, 7], [0, 0], [127, 0], [0, 127], [127, 127]]) {
    const { w, point, first, second, dense, packed } = fixture(x, y)
    const fallback = addUnit(w, 'red', 'warrior', point)
    const expected = [second.id, first.id]
    assert.deepEqual([...objectsInCell(w.objectCells, packed)].map(o => o.id), expected)
    const { world } = combatWorld(w, combatPerson(first), 2)
    assert.deepEqual([...world.cellObjects(dense)].map(o => o.id), [...expected, fallback.id], `cell ${x},${y}`)
    assert.deepEqual([...world.cellObjects((dense + 1) & 16383)], [])
    // Projection does not mutate the retained native chain or browser roster.
    assert.deepEqual([...objectsInCell(w.objectCells, packed)].map(o => o.id), expected)
    assert.deepEqual(w.units.map(u => u.id), [first.id, second.id, fallback.id])
  }
})

test('equal-distance live combat targeting follows registered chain order rather than roster order', () => {
  const { w, point, first, second, packed } = fixture(5, 7)
  const attacker = addUnit(w, 'blue', 'warrior', point)
  const result = selectLiveCombatTarget(w, attacker, { model: 19, flags: 16, a: packed, b: 0 })
  assert.equal(result?.owner, second)
  assert.equal(result?.target.id, second.id)
  assert.equal(first.attackReservation, undefined)
  assert.ok(second.attackReservation)
})
