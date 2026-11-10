import assert from 'node:assert/strict'
import test from 'node:test'
import { hudTaskPeople } from '../app/follower-tasks-runtime.ts'

function person(id, extra = {}) {
  return {
    id, team: 'blue', kind: 'brave', hp: 100, inside: null, work: null, tree: null,
    path: [], native: {
      id, model: 2, state: 19, x: 256, y: 256, flags2: 0, flags3: 0,
      flags4: 0x20000000, selectionFlags: 0, assignment: 0, vehicle: 0,
      commandStatus: 0, immediateCommand: 0, commands: [], commandCursor: 0,
    }, ...extra,
  }
}

function world(units, buildings = []) {
  return {
    units, buildings, selected: [], pathfinding: { people: new Map() },
    buildingOrders: { records: [] }, land: { flags: new Uint32Array(16384) },
  }
}

const categories = w => hudTaskPeople(w).map(p => p.category)
const building = (id, extra = {}) => ({ id, hp: 100, kind: 'hut', level: 1, ...extra })

test('unassociated followers retain idle, guard, harvest and movement task categories', () => {
  const units = [person(1), person(2, { guard: true }), person(3, { tree: 7 }),
    person(4, { path: [{ x: 1, z: 2 }] }), person(5, { cargo: 1 })]
  const w = world(units, [building(22)]), before = structuredClone(w)
  assert.deepEqual(categories(w), [2, 4, 4, 4, 2])
  assert.deepEqual(w, before)
})

test('missing building association does not search unrelated building identities', () => {
  let reads = 0
  const buildings = Array.from({ length: 128 }, (_, i) => ({
    get id() { reads++; return i + 1 }, hp: 100, kind: 'hut', level: 1,
  }))
  const w = world(Array.from({ length: 1000 }, (_, i) => person(i + 1)), buildings)
  assert.ok(categories(w).every(category => category === 2))
  assert.equal(reads, 0, 'null inside/work cannot match a numeric building ID')
})

test('real work and inside IDs retain precedence, zero and first living duplicate behavior', () => {
  const units = [person(1, { work: 7 }), person(2, { inside: 7, work: 8 }),
    person(3, { inside: 0, work: 8 }), person(4, { work: 999 }), person(5, { inside: NaN })]
  const w = world(units, [building(7, { hp: 0, kind: 'tower' }), building(7),
    building(7, { kind: 'tower' }), building(8, { kind: 'tower' }), building(0), building(NaN)])
  assert.deepEqual(categories(w), [4, 3, 3, 2, 2])
})

test('later HUD reads observe association, health, kind, roster and current-world changes', () => {
  const unit = person(1), hut = building(2), w = world([unit], [hut])
  assert.deepEqual(categories(w), [2])
  unit.work = 2
  assert.deepEqual(categories(w), [4])
  unit.inside = 2
  assert.deepEqual(categories(w), [3])
  hut.hp = 0
  assert.deepEqual(categories(w), [2])
  hut.hp = 100; hut.kind = 'tower'
  assert.deepEqual(categories(w), [4])
  w.buildings = [building(2)]
  assert.deepEqual(categories(w), [3])
  const replacement = world([person(1)], [building(2, { kind: 'tower' })])
  assert.deepEqual(categories(replacement), [2])
  unit.inside = unit.work = null
  assert.deepEqual(categories(w), [2])
})

test('native terrain-owned occupancy is still classified without browser work or inside IDs', () => {
  const unit = person(1), w = world([unit], [building(9, { kind: 'tower', progress: 1 })])
  Object.assign(unit.native, { state: 21, flags2: 0x800000 })
  w.land.flags[0] = 512
  w.land.buildingIds = new Uint16Array(16384)
  w.land.buildingIds[0] = 9
  assert.deepEqual(categories(w), [4])
  w.buildings[0].kind = 'hut'
  assert.deepEqual(categories(w), [3])
})

test('owned-only filtering and selection overlay remain unchanged', () => {
  const w = world([person(1), person(2, { team: 'red' }), person(3, { hp: 0 })])
  w.selected = [1, 2]
  const before = structuredClone(w)
  assert.deepEqual(hudTaskPeople(w).map(p => [p.id, p.category, p.selectionFlags]), [[1, 2, 128]])
  assert.deepEqual(hudTaskPeople(w, false).map(p => [p.id, p.category, p.selectionFlags]),
    [[1, 2, 128], [2, 2, 128]])
  assert.deepEqual(w, before)
})
