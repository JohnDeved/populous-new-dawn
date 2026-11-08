import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { runInNewContext } from 'node:vm'
import test from 'node:test'
import { nativeUnitModel } from '../app/unit-kinds.ts'
import { tribeForTeam } from '../app/world-types.ts'
import { engagementCellDelta, inEngagementArea } from '../app/melee-engagement.ts'
import { createObjectCells, objectsInCell } from '../app/object-cells.ts'

const read = name => readFileSync(new URL(`../app/${name}`, import.meta.url), 'utf8')
function between(source, start, end) {
  const first = source.indexOf(start), last = source.indexOf(end, first + start.length)
  assert.ok(first >= 0 && last > first, `Missing source boundary: ${start}`)
  assert.equal(source.indexOf(start, first + start.length), -1)
  return source.slice(first, last)
}
const live = read('live-combat.ts'), declarations = [
  between(live, 'export const nativePersonModel =', '\n// Adapt existing live ownership'),
  between(live, 'export function combatWorld(', '\nexport function selectLiveCombatTarget('),
  between(read('building-shapes.ts'), 'export function buildingModel(', '\n// Share the displayed object'),
].join('\n').replace(/^export (const|function)/gm, '$1')
const linear = 'fight.members.map(id => w.units.find(u => u.id === id))'
const indexed = 'fight.members.map(findPerson)'
assert.equal(Number(declarations.includes(linear)) + Number(declarations.includes(indexed)), 1)
function compile(source) {
  return runInNewContext(`${stripTypeScriptTypes(source)}\ncombatWorld`, {
    nativeUnitModel, tribeForTeam, engagementCellDelta, inEngagementArea, objectsInCell,
  })
}
const combatWorld = compile(declarations)
// Retain the original Array.find expression inside the same complete projection.
// The candidate's unused local helper has no effects in this comparison variant.
const exhaustive = compile(declarations.replace(indexed, linear))
const point = (x = 2816, y = 3840) => ({ x: x / 256 - 8, z: -y / 256 - 8 })
const center = { x: 2816, y: 3840 }
function unit(id, fields = {}) {
  return { id, ...point(30000, 30000), hp: 50, team: 'red', kind: 'warrior',
    path: [], work: null, inside: null, native: null, fight: null, lift: 0, ...fields }
}
function fight(id, members, fields = {}) {
  return { id, ...point(), members, ...fields }
}
function world(units = [], fights = []) {
  return { units, fights, buildings: [], objectCells: createObjectCells(),
    land: { flags: new Uint32Array(16384), owners: new Uint8Array(16384),
      buildingIds: new Uint16Array(16384), categories: new Uint8Array(16384).fill(2) },
    outcome: { alliances: [1, 2, 4, 8] }, manaTribes: Array.from({ length: 4 }, () => ({ playerType: 2 })),
    manaWorld: { gameFlags: 0 } }
}
function compare(w, source = center, range = 2) {
  const before = structuredClone(w), actual = combatWorld(w, source, range), expected = exhaustive(w, source, range)
  assert.deepEqual(structuredClone(actual.world.objects), structuredClone(expected.world.objects))
  assert.deepEqual([...actual.owners.keys()], [...expected.owners.keys()])
  for (const [id, owner] of expected.owners) assert.equal(actual.owners.get(id), owner)
  const cells = new Set([0, 16383, ...[...expected.world.objects.values()].map(o => (o.y >> 9) * 128 + (o.x >> 9))])
  for (const cell of cells)
    assert.deepEqual(structuredClone(actual.world.cellObjects(cell)), structuredClone(expected.world.cellObjects(cell)))
  assert.deepEqual(w, before, 'projection must not change the supplied World')
  return actual
}

test('empty and missing fight members preserve sparse object and owner maps', () => {
  compare(world())
  const view = compare(world([], [fight(100, [1, 1, 2]), fight(101, [])]))
  assert.deepEqual([...view.owners.keys()], [100, 101])
})

test('dead and distant members are available to fights without entering ordinary cell rows', () => {
  const first = unit(1, { hp: 0, team: 'blue' }), second = unit(2, { team: 'green' }),
    w = world([first, second], [fight(100, [2, 1, 999])]), view = compare(w)
  assert.equal(view.owners.get(1), first)
  assert.equal(view.owners.get(2), second)
  assert.equal(view.world.objects.get(1).life, 0)
  assert.deepEqual([...view.world.objects.get(100).tribes], [3, 0])
  assert.deepEqual([...view.world.cellObjects(7 * 128 + 5)].map(o => o.id), [100])
})

test('duplicate roster IDs retain the first owner even after the cursor passed a later duplicate', () => {
  const first = unit(7, { hp: 0, team: 'blue' }), duplicate = unit(7, { team: 'yellow' }), tail = unit(9),
    w = world([first, duplicate, tail], [fight(100, [9]), fight(101, [7, 7])]), view = compare(w)
  assert.equal(view.owners.get(7), first)
  assert.deepEqual([...view.world.objects.get(101).tribes], [0])
})

test('an already projected duplicate is not overwritten by first-ID fight resolution', () => {
  const first = unit(7, { hp: 0, team: 'blue' }), projected = unit(7, { ...point(), team: 'yellow' }),
    w = world([first, projected], [fight(100, [7])]), view = compare(w)
  assert.equal(view.owners.get(7), projected)
  assert.deepEqual([...view.world.objects.get(100).tribes], [0])
  assert.deepEqual([...view.world.cellObjects(7 * 128 + 5)].map(o => o.id), [7, 100])
})

test('strict ID equality keeps zero, negative and wide IDs while never matching NaN', () => {
  const zero = unit(0), negative = unit(-2), wide = unit(2 ** 40), invalid = unit(NaN),
    view = compare(world([zero, negative, wide, invalid], [fight(100, [NaN, NaN, -0, -2, 2 ** 40])]))
  assert.equal(view.owners.get(0), zero)
  assert.equal(view.owners.get(-2), negative)
  assert.equal(view.owners.get(2 ** 40), wide)
  assert.equal(view.owners.has(NaN), false)
})

test('fight slots, center, encounter and explicit tribes retain their existing owners', () => {
  const w = world([unit(1), unit(2)], [fight(100, [2, 2, 1], {
    slots: [2, 0, 1, 0, 0, 0], center: 1, encounter: [1, 2], tribes: [2, 0],
    attackReservation: { flags4: 0x100000, reactionTimer: 3, reactionDuration: 48 },
  })]), view = compare(w), record = view.world.objects.get(100)
  assert.equal(view.owners.get(100), w.fights[0])
  assert.equal(record.model, 9)
  assert.equal(record.members, w.fights[0].slots)
  assert.equal(record.tribes, w.fights[0].tribes)
  assert.equal(record.center, 1)
  assert.equal(record.reactionTimer, 3)
})

test('range rejection, fight ordering and lookup-only members do not create remote cell candidates', () => {
  const w = world([unit(1), unit(2), unit(3)], [
    fight(100, [3], point(30000, 30000)), fight(101, [2]), fight(102, [1]),
  ]), view = compare(w)
  assert.equal(view.owners.has(3), false)
  assert.deepEqual([...view.owners.keys()], [2, 101, 1, 102])
})

test('reconstruction observes roster replacement, reorder, death and member changes', () => {
  const w = world([unit(1), unit(2), unit(3)], [fight(100, [2, 1])])
  for (const current of [w, structuredClone(w)]) {
    compare(current)
    const replacement = unit(2, { team: 'blue', hp: 0 })
    current.units = [replacement, current.units[0], current.units[2]]
    current.fights[0].members = [3, 2, 1, 999]
    assert.equal(compare(current).owners.get(2), replacement)
    current.units.reverse()
    current.units.push(unit(4))
    current.fights.push(fight(101, [4, 2]))
    compare(current)
  }
})

test('256 deterministic mixed queries match the retained exhaustive lookup', () => {
  let seed = 0x73245
  const next = limit => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % limit }
  for (let sequence = 0; sequence < 256; sequence++) {
    const x = [0, 256, 65280, 2816][next(4)], y = [0, 256, 65280, 3840][next(4)],
      units = Array.from({ length: 1 + next(40) }, () => unit(1 + next(24), {
        ...point(next(2) ? x : next(65536), next(2) ? y : next(65536)),
        hp: next(4) ? 50 : 0, team: ['blue', 'red', 'yellow', 'green'][next(4)],
      })),
      fights = Array.from({ length: 1 + next(15) }, (_, i) => fight(100 + i,
        Array.from({ length: next(7) }, () => next(30)),
        point(next(3) ? x : next(65536), next(3) ? y : next(65536)))),
      w = world(units, fights)
    compare(w, { x, y }, [0, 2, 4, 256][next(4)])
  }
})

function counted(units, fights) {
  let reads = 0
  const roster = [...units]
  for (let i = 0; i < roster.length; i++) {
    const value = roster[i]
    Object.defineProperty(roster, i, { get: () => { reads++; return value }, configurable: true })
  }
  const view = combatWorld(world(roster, fights), center, 2)
  return { reads, view }
}

for (const count of [16, 128, 512]) test(`${count} reverse member lookups scan the roster at most twice including projection`, t => {
  const units = Array.from({ length: count }, (_, i) => unit(i + 1)),
    fights = units.map((u, i) => fight(10000 + i, [count - i])),
    { reads, view } = counted(units, fights)
  for (const u of units) assert.equal(view.owners.get(u.id), u)
  t.diagnostic(`${count} people: ${reads} roster-entry reads`)
  assert.ok(reads <= 2 * count, `${reads} reads exceed ${2 * count}`)
})

test('a first-person-only lookup stops at its first match instead of indexing the whole roster', () => {
  const units = Array.from({ length: 512 }, (_, i) => unit(i + 1)), { reads, view } = counted(units, [fight(1000, [1])])
  assert.equal(view.owners.get(1), units[0])
  assert.equal(reads, 513)
})

test('front-of-roster members reuse the visited prefix without scanning the tail', t => {
  const units = Array.from({ length: 512 }, (_, i) => unit(i + 1)), { reads, view } = counted(units, [fight(1000, [1, 2, 1])])
  assert.equal(view.owners.get(2), units[1])
  t.diagnostic(`front prefix: ${reads} roster-entry reads`)
  assert.ok(reads <= 514, `${reads} reads exceed 514`)
})

test('a missing member exhausts the roster once without rescanning later requests', t => {
  const units = Array.from({ length: 128 }, (_, i) => unit(i + 1)),
    { reads, view } = counted(units, [fight(1000, [999, 1, 999, 2])])
  assert.equal(view.owners.has(999), false)
  assert.equal(view.owners.get(1), units[0])
  t.diagnostic(`missing member: ${reads} roster-entry reads`)
  assert.ok(reads <= 256, `${reads} reads exceed 256`)
})

test('no lookup work is added for absent, empty or rejected fights', () => {
  const units = Array.from({ length: 128 }, (_, i) => unit(i + 1))
  for (const fights of [[], [fight(1000, [])], [fight(1000, [1], point(30000, 30000))]])
    assert.equal(counted(units, fights).reads, 128)
})
