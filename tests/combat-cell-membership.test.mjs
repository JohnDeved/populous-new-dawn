import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import { createObjectCells, insertObjectIntoCell, objectsInCell, setCellObject } from '../app/object-cells.ts'
import { nativeUnitModel } from '../app/unit-kinds.ts'
import { tribeForTeam } from '../app/world-types.ts'
import { engagementCellDelta, inEngagementArea } from '../app/melee-engagement.ts'
import { positionDistance } from '../app/native-math.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

// Complete maintained projection and targeting declarations, with real imported
// cell/range/math/type mappings. Supplied Worlds are not full campaign fixtures.
const read = path => readFileSync(new URL(`../app/${path}`, import.meta.url), 'utf8')
function between(source, start, end) {
  const first = source.indexOf(start), last = source.indexOf(end, first + start.length)
  assert.ok(first >= 0 && last > first, `Missing boundary ${start}`)
  assert.equal(source.indexOf(start, first + start.length), -1)
  return source.slice(first, last)
}
const live = read('live-combat.ts'), targets = read('combat-targets.ts'),
  declarations = [
    between(live, 'export const nativePersonModel =', '\n// Adapt existing live ownership'),
    between(live, 'export function combatWorld(', '\nexport function selectLiveFirewarriorTarget('),
    between(read('building-shapes.ts'), 'export function buildingModel(', '\n// Share the displayed object'),
    between(read('computer-selection.ts'), 'export function spyDisguisedFrom(', '\n// Native person/command'),
    between(read('person-update.ts'), 'export function stepPersonReaction(', '\n// Complete 0x4eeff0'),
    targets.slice(targets.indexOf('const allied =')),
  ].join('\n').replace(/^export (const|function)/gm, '$1'),
  api = runInNewContext(`${stripTypeScriptTypes(declarations)}\n;({ combatWorld, combatPerson, selectLiveCombatTarget })`, {
    nativeUnitModel, tribeForTeam, engagementCellDelta, inEngagementArea, objectsInCell, positionDistance, rules,
  })

const dense = (x, y) => y * 128 + x,
  packed = (x, y) => (y << 9) | (x << 1),
  nativePoint = u => ({ x: Math.round((u.x + 8) * 256) & 65535, y: Math.round((-u.z - 8) * 256) & 65535 }),
  browserPoint = (x, y) => ({ x: x / 256 - 8, z: -y / 256 - 8 })

function unit(id, x = 2816, y = 3840, fields = {}) {
  return { id, ...browserPoint(x, y), hp: 50, team: 'red', kind: 'warrior', path: [],
    work: null, inside: null, native: null, fight: null, lift: 0, ...fields }
}

function fixture(units = []) {
  return {
    units, fights: [], buildings: [], objectCells: createObjectCells(),
    land: { flags: new Uint32Array(16384), owners: new Uint8Array(16384),
      buildingIds: new Uint16Array(16384), categories: new Uint8Array(16384).fill(2) },
    outcome: { alliances: [1, 2, 4, 8] }, manaTribes: Array.from({ length: 4 }, () => ({ playerType: 2 })),
    manaWorld: { gameFlags: 0 },
  }
}

function link(w, orderedUnits) {
  w.objectCells = createObjectCells()
  for (const u of [...orderedUnits].reverse()) {
    const point = nativePoint(u), p = { id: u.id, ...point, h: 0, flags2: 0, flags3: 0,
      cellNext: 0, cellPrevious: 0, displacement: { x: 0, y: 0, h: 0 } }
    setCellObject(w.objectCells, p.id, p)
    insertObjectIntoCell(w.objectCells, p, point)
  }
}

function previousOrder(w, view, cell, row) {
  const ordered = []
  for (const indexed of objectsInCell(w.objectCells, ((cell & 127) << 1) | ((cell >>> 7) << 9))) {
    const object = view.world.objects.get(indexed.id)
    if (object && row.includes(object)) ordered.push(object)
  }
  return ordered.length ? [...ordered, ...row.filter(o => !ordered.includes(o))] : row
}

function equalReferences(actual, expected) {
  assert.equal(actual.length, expected.length)
  for (let i = 0; i < actual.length; i++) assert.equal(actual[i], expected[i], `object ${i}`)
}

test('empty cells never traverse native chains', () => {
  const w = fixture(), { world } = api.combatWorld(w, { x: 2816, y: 3840 }, 2)
  Object.defineProperty(w.objectCells, 'heads', { get: () => assert.fail('no projected row') })
  assert.deepEqual([...world.cellObjects(dense(5, 7))], [])
})

test('unregistered rows retain their original result identity and roster order', () => {
  const w = fixture([unit(1), unit(2), unit(3)]), view = api.combatWorld(w, nativePoint(w.units[0]), 2),
    row = view.world.cellObjects(dense(5, 7))
  assert.equal(view.world.cellObjects(dense(5, 7)), row)
  assert.deepEqual([...row].map(o => o.id), [1, 2, 3])
  for (const u of w.units) assert.equal(view.owners.get(u.id), u)
})

for (const [x, y] of [[5, 7], [0, 0], [127, 0], [0, 127], [127, 127]])
  test(`native-first order and roster fallback at cell ${x},${y}`, () => {
    const units = [1, 2, 3, 4].map(id => unit(id, x * 512 + 256, y * 512 + 256)),
      w = fixture(units), view = api.combatWorld(w, nativePoint(units[0]), 2),
      row = view.world.cellObjects(dense(x, y))
    link(w, [units[2], units[0]])
    const before = structuredClone(w)
    equalReferences(view.world.cellObjects(dense(x, y)), [row[2], row[0], row[1], row[3]])
    assert.deepEqual(w, before)
  })

test('native-only and out-of-row registered objects cannot enter a projected cell', () => {
  const near = unit(1), other = unit(2, 3328, 3840), nativeOnly = unit(3),
    w = fixture([near, other]), view = api.combatWorld(w, nativePoint(near), 4),
    row = view.world.cellObjects(dense(5, 7))
  link(w, [nativeOnly, near])
  // A mismatched chain record is a supplied guard control, not ordinary state.
  const head = w.objectCells.objects.get(nativeOnly.id)
  head.id = other.id
  equalReferences(view.world.cellObjects(dense(5, 7)), [row[0]])
})

test('duplicate projected IDs preserve reference membership instead of dropping the earlier snapshot', () => {
  const first = unit(7, 2816, 3840, { hp: 20 }), last = unit(7), tail = unit(8),
    w = fixture([first, last, tail]), view = api.combatWorld(w, nativePoint(first), 2),
    row = view.world.cellObjects(dense(5, 7))
  assert.notEqual(row[0], row[1])
  link(w, [last])
  equalReferences(view.world.cellObjects(dense(5, 7)), [row[1], row[0], row[2]])
})

test('repeated native projected references remain repeated, and repeated fallback references survive', () => {
  const w = fixture([unit(1), unit(2), unit(3)]), view = api.combatWorld(w, nativePoint(w.units[0]), 2),
    row = view.world.cellObjects(dense(5, 7))
  row.push(row[2])
  link(w, [unit(10), w.units[0]])
  // Distinct acyclic records exposing the same projected id characterize the
  // old reference policy. This is not a valid native-identity-history fixture.
  w.objectCells.objects.get(10).id = 1
  equalReferences(view.world.cellObjects(dense(5, 7)), [row[0], row[0], row[1], row[2], row[2]])
})

test('each query observes current chain order without retaining a membership cache', () => {
  const units = [unit(1), unit(2), unit(3)], w = fixture(units),
    view = api.combatWorld(w, nativePoint(units[0]), 2), row = view.world.cellObjects(dense(5, 7))
  link(w, [units[1], units[0]])
  equalReferences(view.world.cellObjects(dense(5, 7)), [row[1], row[0], row[2]])
  link(w, [units[2], units[1]])
  equalReferences(view.world.cellObjects(dense(5, 7)), [row[2], row[1], row[0]])
  link(w, [])
  assert.equal(view.world.cellObjects(dense(5, 7)), row)
  row.reverse()
  link(w, [units[1]])
  equalReferences(view.world.cellObjects(dense(5, 7)), previousOrder(w, view, dense(5, 7), row))
})

test('fight members outside the range are lookup-only and fight insertion order follows fallback people', () => {
  const a = unit(1), b = unit(2), remote = unit(3, 30000, 30000), dead = unit(4, 30000, 30000, { hp: 0 }),
    w = fixture([a, b, remote, dead])
  w.fights = [
    { id: 10, ...browserPoint(2816, 3840), members: [3, 4], center: 3 },
    { id: 11, ...browserPoint(2816, 3840), members: [1, 2], encounter: [1, 2] },
  ]
  const view = api.combatWorld(w, nativePoint(a), 2), row = view.world.cellObjects(dense(5, 7))
  link(w, [b, remote, dead])
  equalReferences(view.world.cellObjects(dense(5, 7)), [row[1], row[0], row[2], row[3]])
  assert.deepEqual([...view.world.cellObjects(dense(5, 7))].map(o => o.id), [2, 1, 10, 11])
  assert.equal(view.owners.get(3), remote)
  assert.equal(view.world.objects.get(4).life, 0)
})

test('real live target caller keeps equal-distance native priority and updates only the chosen reservation', () => {
  const first = unit(1), second = unit(2), attacker = unit(3, 2816, 3840, { team: 'blue' }),
    w = fixture([first, second, attacker])
  link(w, [second, first])
  const result = api.selectLiveCombatTarget(w, attacker, { model: 19, flags: 16, a: packed(5, 7), b: 0 })
  assert.equal(result.owner, second)
  assert.equal(result.target.id, second.id)
  assert.equal(first.attackReservation, undefined)
  assert.deepEqual({ ...second.attackReservation }, { flags4: 0, reactionTimer: 1, reactionDuration: 48 })
})

test('real target collection preserves the 64-candidate limit before distance sorting', () => {
  const units = Array.from({ length: 80 }, (_, i) => unit(i + 1, 2816 + (i === 79 ? 1 : 100), 3840)),
    attacker = unit(90, 2816, 3840, { team: 'blue' }), w = fixture([...units, attacker])
  link(w, [units[1], units[0]])
  const result = api.selectLiveCombatTarget(w, attacker, { model: 19, flags: 16, a: packed(5, 7), b: 0 })
  assert.equal(result.owner, units[1])
  assert.equal(units[79].attackReservation, undefined, 'nearest object lies beyond the admitted first 64')
})

test('reconstructed views and cloned continuation preserve ordering after roster and chain changes', () => {
  const w = fixture([unit(1), unit(2), unit(3)])
  for (const current of [w, structuredClone(w)]) {
    link(current, [current.units[2], current.units[0]])
    let view = api.combatWorld(current, { x: 2816, y: 3840 }, 4)
    assert.deepEqual([...view.world.cellObjects(dense(5, 7))].map(o => o.id), [3, 1, 2])
    current.units[0].hp = 0
    Object.assign(current.units[2], browserPoint(3328, 3840))
    current.units.push(unit(4))
    link(current, [current.units[3], current.units[2], current.units[1]])
    view = api.combatWorld(current, { x: 2816, y: 3840 }, 4)
    assert.deepEqual([...view.world.cellObjects(dense(5, 7))].map(o => o.id), [4, 2])
    assert.deepEqual([...view.world.cellObjects(dense(6, 7))].map(o => o.id), [3])
  }
})

for (const count of [16, 128, 512]) test(`dense ${count}-person cell reads its row at most twice`, () => {
  const units = Array.from({ length: count }, (_, i) => unit(i + 1)), w = fixture(units),
    view = api.combatWorld(w, nativePoint(units[0]), 2), row = view.world.cellObjects(dense(5, 7))
  let reads = 0
  for (let i = 0; i < row.length; i++) {
    const value = row[i]
    Object.defineProperty(row, i, { get: () => { reads++; return value }, configurable: true })
  }
  link(w, [...units].reverse())
  const result = view.world.cellObjects(dense(5, 7))
  assert.deepEqual([...result].map(o => o.id), [...units].reverse().map(u => u.id))
  assert.ok(reads <= count * 2, `${reads} row-entry reads exceed ${count * 2}`)
})
