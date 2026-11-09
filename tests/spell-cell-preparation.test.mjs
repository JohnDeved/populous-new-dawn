// Supplied live records and cell ownership through actual spell adapters.
// Not a naturally cast spell, full turn, native execution or performance benchmark.
import test from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'
import { createGameStore } from '../app/game-store.ts'
import { addUnit } from '../app/world-state.ts'
import { createLivePerson, strikeLiveLightning, buildingFirePeople } from '../app/live-people.ts'
import { createObjectCells, setCellObject, insertObjectIntoCell, removeObjectFromCell, deleteCellObject } from '../app/object-cells.ts'

// Preserve complete strict comparison without formatting a large World on failure.
const assertWorld = (actual, expected, label = 'complete World equality') =>
  assert.equal(isDeepStrictEqual(actual, expected), true, label)

const point = { x: 0x8200, y: 0x8200 }
const linkedOrder = [2, 0, 1, 5, 3, 4, 8, 6, 7, 11, 9, 10]
const orders = {
  registered: linkedOrder,
  unregistered: [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
  partial: [11, 10, 9, 1, 7, 6, 5, 4, 3, 2, 8, 0],
  alias: [2, 0, 1, 5, 4, 8, 6, 7, 3, 11, 9, 10],
  duplicate: [2, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
}

function suppliedCell(mode = 'registered', count = 12) {
  const w = createGameStore().getWorld()
  w.units = []
  w.buildings = []
  w.objectCells = createObjectCells()
  w.randomState = 0x12345678
  const units = []
  for (let i = 0; i < count; i++) {
    const u = addUnit(w, 'blue', 'brave', { x: 0, z: 0 })
    u.native = createLivePerson(w, u, { ...point, x: point.x + i, h: 100 })
    u.native.flags2 |= 0x100000 // Keep the default ordering fixtures outside initialization.
    units.push(u)
  }
  const order = count === 12 ? linkedOrder : Array.from({ length: count }, (_, i) => i)
  const registered = mode === 'unregistered' ? [] : mode === 'partial' ? [1, 3, 8] : order
  for (const i of [...registered].reverse()) {
    const p = units[i].native
    setCellObject(w.objectCells, p.id, p)
    insertObjectIntoCell(w.objectCells, p, p)
  }
  if (mode === 'alias') {
    const p = units[3].native
    setCellObject(w.objectCells, p.id, structuredClone(p))
  }
  if (mode === 'duplicate') w.units.push(units[2])
  return { w, units }
}

function preparationWork(action) {
  const find = Array.prototype.find, unshift = Array.prototype.unshift
  let comparisons = 0, shiftedPrefix = 0
  Array.prototype.find = function (predicate, thisArg) {
    return find.call(this, (value, index, array) => {
      comparisons++
      return predicate.call(thisArg, value, index, array)
    })
  }
  Array.prototype.unshift = function (...values) {
    shiftedPrefix += this.length
    return unshift.apply(this, values)
  }
  try { action() } finally {
    Array.prototype.find = find
    Array.prototype.unshift = unshift
  }
  return { comparisons, shiftedPrefix }
}

function lightningExpected(w, order, immune = new Set()) {
  const expected = structuredClone(w), killed = order.filter(i => !immune.has(i)).slice(0, 7)
  for (const i of killed) {
    const u = expected.units[i]
    u.hp = 0
    u.native.life = 0
    u.native.damageAttacker = 0
  }
  return expected
}

function draw(w) {
  const next = (Math.imul(w.randomState, 0x24a1) + 0x24df) >>> 0
  return w.randomState = ((next >>> 13) | (next << 19)) >>> 0
}

function protectedFireExpected(w, order) {
  for (const i of order) w.units[i].native.burnTrail = (draw(w) & 7) + 8
  for (const u of w.units) u.burnTrail = u.native.burnTrail
}

test('Lightning preparation avoids repeated front shifts and cell identity scans', () => {
  const { w } = suppliedCell('registered', 96)
  for (const u of w.units) u.native.flags3 |= 0x8000
  const before = structuredClone(w), work = preparationWork(() => strikeLiveLightning(w, point, 0))
  assertWorld(w, before)
  assert.deepEqual(work, { comparisons: 0, shiftedPrefix: 0 })
})

test('building-fire snapshot preparation avoids repeated front shifts and identity scans', () => {
  const { w } = suppliedCell('registered', 96), before = structuredClone(w)
  const work = preparationWork(() => buildingFirePeople(w))
  assertWorld(w, before)
  assert.deepEqual(work, { comparisons: 0, shiftedPrefix: 0 })
})

test('Lightning preserves retained, fallback, partial, same-ID alias and duplicate recipients', () => {
  for (const [mode, order] of Object.entries(orders)) {
    const { w } = suppliedCell(mode), expected = lightningExpected(w, order)
    strikeLiveLightning(w, point, 0)
    assertWorld(w, expected, mode)
  }
})

test('building-fire preserves per-person RNG assignment for every ownership ordering', () => {
  for (const [mode, order] of Object.entries(orders)) {
    const { w } = suppliedCell(mode), expected = structuredClone(w)
    protectedFireExpected(expected, order)
    buildingFirePeople(w)(point, 0)
    assertWorld(w, expected, mode)
  }
})

test('Lightning immunity skips the cap while protected deaths preserve transition state', () => {
  const { w, units } = suppliedCell(), immune = new Set([2, 0])
  units[2].native.flags3 |= 0x20000
  units[0].native.flags3 |= 0x8000
  const expected = lightningExpected(w, linkedOrder, immune)
  strikeLiveLightning(w, point, 0)
  assertWorld(w, expected)
  assert.equal(units[1].native.state, 10)
  assert.equal(units.filter(u => u.hp === 0).length, 7)
})

test('Lightning completes the order snapshot before strike-time registry removal', () => {
  const { w, units } = suppliedCell(), expected = lightningExpected(w, linkedOrder)
  const first = units[2].native, later = units[1].native, expectedLater = expected.units[1].native
  removeObjectFromCell(expected.objectCells, expectedLater)
  deleteCellObject(expected.objectCells, expectedLater.id)
  const descriptor = Object.getOwnPropertyDescriptor(first, 'flags3')
  let flags = first.flags3, removed = false
  Object.defineProperty(first, 'flags3', {
    configurable: true, enumerable: true,
    get() {
      if (!removed) {
        removed = true
        removeObjectFromCell(w.objectCells, later)
        deleteCellObject(w.objectCells, later.id)
      }
      return flags
    },
    set(value) { flags = value },
  })
  try { strikeLiveLightning(w, point, 0) } finally {
    Object.defineProperty(first, 'flags3', { ...descriptor, value: flags })
  }
  assert.equal(removed, true)
  assertWorld(w, expected)
})

test('repeated fire sockets keep the prepared order after registry ownership is removed', () => {
  const { w, units } = suppliedCell(), ignite = buildingFirePeople(w)
  for (const u of units) {
    removeObjectFromCell(w.objectCells, u.native)
    deleteCellObject(w.objectCells, u.id)
  }
  const expected = structuredClone(w)
  for (let socket = 0; socket < 2; socket++) {
    protectedFireExpected(expected, linkedOrder)
    ignite(point, 0)
    assertWorld(w, expected)
  }
})

test('fire snapshots separate cells and retain unrelated socket state', () => {
  const { w, units } = suppliedCell('unregistered'), other = { x: point.x + 1024, y: point.y }
  for (const u of units.slice(6)) u.native.x += 1024
  const expected = structuredClone(w), ignite = buildingFirePeople(w)
  for (const i of [5, 4, 3, 2, 1, 0]) expected.units[i].native.burnTrail = (draw(expected) & 7) + 8
  for (const u of expected.units.slice(0, 6)) u.burnTrail = u.native.burnTrail
  ignite(point, 0)
  assertWorld(w, expected)
  for (const i of [11, 10, 9, 8, 7, 6]) expected.units[i].native.burnTrail = (draw(expected) & 7) + 8
  for (const u of expected.units.slice(6)) u.burnTrail = u.native.burnTrail
  ignite(other, 0)
  assertWorld(w, expected)
})

test('real fire panic initialization consumes draws in retained owner order', () => {
  const { w, units } = suppliedCell()
  w.units = units.slice(0, 3)
  w.objectCells = createObjectCells()
  for (const i of [1, 0, 2]) {
    const p = units[i].native
    p.flags2 &= ~0x100000
    setCellObject(w.objectCells, p.id, p)
    insertObjectIntoCell(w.objectCells, p, p)
  }
  const oracle = { randomState: w.randomState }, outcomes = new Map()
  for (const i of [2, 0, 1]) {
    draw(oracle)
    outcomes.set(i, { angle: draw(oracle) & 2047, trail: (draw(oracle) & 7) + 8 })
  }
  buildingFirePeople(w)(point, 0)
  assert.equal(w.randomState, oracle.randomState)
  for (const [i, expected] of outcomes) {
    const u = units[i]
    assert.equal(u.native.state, 26)
    assert.equal(u.native.timer, 64)
    assert.equal(u.native.turnAngle, expected.angle)
    assert.equal(u.native.burnTrail, expected.trail)
    assert.equal(u.burnTrail, expected.trail)
  }
})

test('empty cohorts and a foreign registered object do not create spell recipients', () => {
  const { w, units } = suppliedCell('unregistered'), foreign = structuredClone(units[0].native)
  foreign.class = 3
  setCellObject(w.objectCells, foreign.id, foreign)
  insertObjectIntoCell(w.objectCells, foreign, foreign)
  w.units = []
  const before = structuredClone(w)
  strikeLiveLightning(w, point, 0)
  buildingFirePeople(w)(point, 0)
  assertWorld(w, before)
})
