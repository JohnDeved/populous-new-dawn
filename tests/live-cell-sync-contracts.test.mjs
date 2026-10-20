import assert from 'node:assert/strict'
import test from 'node:test'
import { addUnit, createWorldState } from '../app/world-state.ts'
import { createLivePerson, syncLivePersonCells } from '../app/live-people.ts'
import { browserPosition } from '../app/world-coordinates.ts'
import { nativePosition } from '../app/world-terrain-runtime.ts'
import { objectsInCell } from '../app/object-cells.ts'
import { terrainPointHeight } from '../app/native-terrain.ts'

// Contract assertions against the public reconciliation boundary. No replacement
// implementation/oracle: these cases also run unchanged on baseline 238ec203.
const packed = p => (p.y & 0xfe00) | ((p.x >>> 8) & 254)
const chain = (w, p) => [...objectsInCell(w.objectCells, packed(p))].map(p => p.id)
for (const capacity of ['classic', 'scalable']) {
const contractTest = (name, fn) => test(`${capacity}: ${name}`, fn)
function fixture(count = 3) {
  const w = createWorldState(1, capacity)
  if (capacity === 'scalable') w.nextId = 65536
  const units = Array.from({ length: count }, () => {
    const u = addUnit(w, 'blue', 'warrior', browserPosition({ x: 2816, y: 3840 }))
    u.native = createLivePerson(w, u)
    return u
  })
  return { w, units, people: units.map(u => u.native) }
}
function assertOwners(w, expected) {
  assert.equal(w.objectCells.objects.size, expected.length)
  for (const p of expected) assert.equal(w.objectCells.objects.get(p.id), p)
}

contractTest('reconciliation retains native chain order independently of browser roster order', () => {
  const { w, people: [a, b, c] } = fixture()
  const first = syncLivePersonCells(w)
  assert.deepEqual(chain(w, a), [c.id, b.id, a.id])
  w.units.reverse()
  const second = syncLivePersonCells(w)
  assert.deepEqual([...second.keys()], [c.id, b.id, a.id])
  assert.deepEqual(chain(w, a), [c.id, b.id, a.id])
  assertOwners(w, [a, b, c])
  const before = structuredClone(w)
  const third = syncLivePersonCells(w)
  assert.deepEqual(w, before, 'a no-op sync changes neither graph nor RNG')
  assert.notEqual(first, second)
  assert.notEqual(second, third)
  second.clear()
  second.set(-1, a)
  assert.equal(first.size, 3)
  assert.equal(third.size, 3)
  assertOwners(w, [a, b, c])
})

contractTest('same-turn owner replacement removes old links, inserts at head, and leaves old snapshots intact', () => {
  const { w, units, people: [a, b, c] } = fixture()
  const first = syncLivePersonCells(w)
  const replacement = createLivePerson(w, units[1])
  units[1].native = replacement
  const second = syncLivePersonCells(w)
  assert.equal(w.turn, 0)
  assert.equal(first.get(b.id), b)
  assert.equal(second.get(b.id), replacement)
  assertOwners(w, [a, replacement, c])
  assert.equal(b.flags2 & 0x20000, 0)
  assert.deepEqual(chain(w, a), [b.id, c.id, a.id])
  assert.equal(replacement.cellPrevious, 0)
  assert.equal(replacement.cellNext, c.id)
  assert.equal(c.cellPrevious, b.id)
  assert.equal(c.cellNext, a.id)
  assert.equal(a.cellPrevious, c.id)
  assert.equal(a.cellNext, 0)
  // Existing snapshots retain object aliases, not deep copies of person values.
  replacement.tribe = 2
  units[1].team = 'yellow'
  syncLivePersonCells(w)
  assert.equal(second.get(b.id).tribe, 2)
  assert.equal(first.get(b.id), b)
})

contractTest('birth, death, removal, and state-44 retention are visible without advancing the turn', () => {
  const { w, units, people: [a, b, c] } = fixture()
  const first = syncLivePersonCells(w), turn = w.turn, randomState = w.randomState
  units[0].hp = 0
  units[1].hp = 0
  b.state = 44
  units[2].hp = 0
  units[2].flight = c
  const born = addUnit(w, 'red', 'brave', browserPosition(a))
  born.native = createLivePerson(w, born)
  const second = syncLivePersonCells(w)
  assert.deepEqual([...second.keys()], [b.id, c.id, born.id])
  assertOwners(w, [b, c, born.native])
  assert.deepEqual(chain(w, a), [born.id, c.id, b.id])
  assert.equal(first.get(a.id), a)
  assert.equal(a.flags2 & 0x20000, 0)
  w.units = w.units.filter(u => u !== units[1])
  delete units[2].flight
  const third = syncLivePersonCells(w)
  assert.deepEqual([...third.keys()], [born.id])
  assert.deepEqual(chain(w, a), [born.id])
  assertOwners(w, [born.native])
  assert.equal(w.turn, turn)
  assert.equal(w.randomState, randomState)
})

contractTest('physical owner precedence is flight, fight, native, entry, not builder-only', () => {
  const { w, units: [u] } = fixture(1)
  const native = u.native, flight = createLivePerson(w, u), fight = createLivePerson(w, u)
  const entry = createLivePerson(w, u), builder = createLivePerson(w, u)
  u.flight = flight
  u.fight = { action: 'encounter', motion: fight }
  u.entry = { person: entry }
  u.builder = { person: builder }
  for (const [expected, release] of [
    [flight, () => { delete u.flight }],
    [fight, () => { u.fight = null }],
    [native, () => { u.native = null }],
    [entry, () => { delete u.entry }],
  ]) {
    const result = syncLivePersonCells(w)
    assert.equal(result.get(u.id), expected)
    assertOwners(w, [expected])
    assert.deepEqual(chain(w, expected), [u.id])
    release()
  }
  assert.equal(syncLivePersonCells(w).size, 0)
  assertOwners(w, [])
  assert.deepEqual(chain(w, builder), [])
})

contractTest('browser writes reconcile same-cell and wrapped crossings while native height ownership is retained', () => {
  const { w, units: [u, v], people: [p, q] } = fixture(2)
  p.state = 41 // A native animation owner keeps height when XY does not change.
  syncLivePersonCells(w)
  p.h = 777
  syncLivePersonCells(w)
  assert.equal(p.h, 777)
  p.flags3 = (p.flags3 | 0x100) & ~0x200
  Object.assign(u, browserPosition({ x: p.x + 1, y: p.y }))
  syncLivePersonCells(w)
  assert.deepEqual(chain(w, p), [q.id, p.id], 'same-cell movement must not reinsert')
  assert.equal(p.h, terrainPointHeight(w.land, p))
  assert.equal(p.displacement.x, 1)
  const before = { x: p.x, y: p.y, h: p.h }
  Object.assign(u, browserPosition({ x: 65535, y: 65535 }))
  syncLivePersonCells(w)
  assert.deepEqual([p.x, p.y], [65535, 65535])
  assert.deepEqual(chain(w, q), [q.id])
  assert.deepEqual(chain(w, p), [p.id])
  assert.equal(p.displacement.x, ((65535 - before.x) << 16) >> 16)
  Object.assign(u, browserPosition({ x: 0, y: 0 }))
  syncLivePersonCells(w)
  assert.deepEqual([p.x, p.y], [0, 0])
  assert.deepEqual([p.displacement.x, p.displacement.y], [1, 1])
  assert.deepEqual(chain(w, { x: 65535, y: 65535 }), [])
  assert.equal(v.native, q)
})

contractTest('flight, fight and seated poses ignore stale browser coordinates; unseating resumes synchronization', () => {
  for (const owner of ['flight', 'fight', 'seat']) {
    const { w, units: [u], people: [p] } = fixture(1)
    if (owner === 'flight') u.flight = p
    if (owner === 'fight') u.fight = { action: 'encounter', motion: p }
    if (owner === 'seat') p.vehicle = 900
    p.h = 1234
    const position = [p.x, p.y, p.h]
    Object.assign(u, browserPosition({ x: 65535, y: 0 }))
    syncLivePersonCells(w)
    assert.deepEqual([p.x, p.y, p.h], position, owner)
    assert.deepEqual(chain(w, p), [p.id])
    delete u.flight
    u.fight = null
    p.vehicle = 0
    syncLivePersonCells(w)
    assert.deepEqual([p.x, p.y], [65535, 0], owner)
    assert.equal(p.h, nativePosition(w, u).h)
  }
})

contractTest('support offsets clear on unsupported ground, including browser-only units, but freeze in occupied poses', () => {
  const { w, units: [u], people: [p] } = fixture(1)
  const legacy = addUnit(w, 'blue', 'brave', browserPosition(p))
  // Materialize terrain before setting the precise cell flags for this boundary.
  nativePosition(w, u)
  const cell = (p.y >>> 9) * 128 + (p.x >>> 9)
  w.land.flags[cell] = 0
  p.supportHeight = 300
  u.supportHeight = 300
  legacy.supportHeight = 500
  p.flags2 |= 0x4000
  syncLivePersonCells(w)
  assert.equal(p.supportHeight, 300)
  assert.equal(u.supportHeight, 300)
  assert.equal(legacy.supportHeight, undefined)
  p.flags2 &= ~0x4000
  syncLivePersonCells(w)
  assert.equal(p.supportHeight, 0)
  assert.equal(u.supportHeight, undefined)
})

contractTest('all eligibility checks finish before physical owners are selected', () => {
  const { w, units: [a, b] } = fixture(2)
  const original = a.native, replacement = createLivePerson(w, a), hp = b.hp
  Object.defineProperty(b, 'hp', {
    configurable: true,
    enumerable: true,
    get() {
      a.native = replacement
      return hp
    },
  })
  const people = syncLivePersonCells(w)
  assert.equal(people.get(a.id), replacement)
  assert.notEqual(people.get(a.id), original)
  assertOwners(w, [replacement, b.native])
  assert.deepEqual(chain(w, replacement), [b.id, a.id])
})

contractTest('duplicate handles preserve first Map insertion rank but select the last eligible owner', () => {
  const { w, units: [a, b, duplicate] } = fixture()
  duplicate.id = a.id
  duplicate.native = createLivePerson(w, duplicate)
  const people = syncLivePersonCells(w)
  assert.deepEqual([...people.keys()], [a.id, b.id])
  assert.equal(people.get(a.id), duplicate.native)
  assertOwners(w, [duplicate.native, b.native])
  assert.deepEqual(chain(w, duplicate.native), [b.id, a.id])
  assert.equal(a.native.flags2 & 0x20000, 0)
})

}
