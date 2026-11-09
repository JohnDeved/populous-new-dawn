import assert from 'node:assert/strict'
import test from 'node:test'
import { removeMissingSelectedPeople } from '../app/selection-runtime.ts'
import { createWorldState, addUnit } from '../app/world-state.ts'
import { tick } from '../app/world-turn.ts'

test('cleanup retains strict ID membership, selection order and duplicate entries', () => {
  const units = [0, 1, 1, 65536, 2 ** 32 + 17, Number.MAX_SAFE_INTEGER, NaN].map(id => ({ id }))
  const values = [-0, 1, 65536, 2 ** 32 + 17, Number.MAX_SAFE_INTEGER, NaN, -99]
  let comparisons = 0
  const check = selected => {
    const expected = selected.filter(id => units.some(unit => unit.id === id))
    const original = [...selected]
    const world = { units, selected }
    removeMissingSelectedPeople(world)
    assert.deepEqual(world.selected, expected)
    assert.deepEqual(selected, original)
    assert.notEqual(world.selected, selected)
    comparisons++
  }
  check([])
  for (const a of values) {
    check([a])
    for (const b of values) {
      check([a, b])
      for (const c of values) check([a, b, c])
    }
  }
  assert.equal(comparisons, 400)
})

test('an empty selection does not read unit IDs and still gets a fresh array', () => {
  const selected = Object.freeze([])
  const world = { selected, units: [{ get id() { throw new Error('unused roster read') } }] }
  removeMissingSelectedPeople(world)
  assert.deepEqual(world.selected, [])
  assert.notEqual(world.selected, selected)
})

test('membership is rebuilt after roster removal, in-place replacement and reintroduction', () => {
  const world = { units: [{ id: 1 }, { id: 2 }], selected: [2, 1, 2] }
  removeMissingSelectedPeople(world)
  assert.deepEqual(world.selected, [2, 1, 2])
  world.units.splice(1, 1, { id: 3 })
  world.selected = [2, 3, 1]
  removeMissingSelectedPeople(world)
  assert.deepEqual(world.selected, [3, 1])
  world.units = [{ id: 2 }]
  world.selected = [1, 2, 3]
  removeMissingSelectedPeople(world)
  assert.deepEqual(world.selected, [2])
})

test('cleanup uses retained roster membership rather than imposing another life or team policy', () => {
  const units = Object.freeze([
    Object.freeze({ id: 1, hp: 0, flight: {} }),
    Object.freeze({ id: 2, hp: 0, native: { state: 44 } }),
    Object.freeze({ id: 3, hp: 100, team: 'red' }),
  ])
  const selected = Object.freeze([2, 1, 3, 2, 99])
  const world = { units, selected, other: { sentinel: true } }
  const before = structuredClone(world)
  removeMissingSelectedPeople(world)
  assert.deepEqual(world, { ...before, selected: [2, 1, 3, 2] })
  assert.equal(world.units, units)
  assert.deepEqual(selected, [2, 1, 3, 2, 99])
})

test('one populated selection scans the current roster once, with instrumentation restored', () => {
  let reads = 0
  const units = Array.from({ length: 256 }, (_, i) => ({ id: i + 1 }))
  const descriptors = units.map(unit => Object.getOwnPropertyDescriptor(unit, 'id'))
  units.forEach((unit, i) => Object.defineProperty(unit, 'id', {
    configurable: true, enumerable: true, get() { reads++; return i + 1 },
  }))
  const selected = units.map((_, i) => i + 1)
  const world = { units, selected }
  try { removeMissingSelectedPeople(world) }
  finally { units.forEach((unit, i) => Object.defineProperty(unit, 'id', descriptors[i])) }
  assert.deepEqual(units.map(unit => Object.getOwnPropertyDescriptor(unit, 'id')), descriptors)
  assert.deepEqual(world.selected, selected)
  assert.equal(reads, 256)
})

for (const mode of ['classic', 'scalable']) {
  test(`${mode}: a complete object turn cleans selection after ordinary person retirement`, () => {
    const world = createWorldState(1, mode)
    world.terrain.fill(3)
    world.terrainVersion++
    world.manaWorld.gameFlags = 32
    const dead = addUnit(world, 'blue', 'brave', { x: 0, z: 0 })
    const living = addUnit(world, 'blue', 'brave', { x: 8, z: 8 })
    dead.hp = 0
    world.selected = [dead.id, living.id, -99, living.id]
    const before = world.turn
    tick(world, 1 / 12)
    assert.equal(world.turn, before + 1)
    assert.equal(world.units.includes(dead), false)
    assert.equal(world.units.includes(living), true)
    assert.deepEqual(world.selected, [living.id, living.id])
  })
}
