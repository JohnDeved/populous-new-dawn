import assert from 'node:assert/strict'
import test from 'node:test'
import { removeDeadLiveRoutes } from '../app/live-pathfinding.ts'
import { attachPersonRoute, createMotionRoutes, releasePersonRoute } from '../app/person-routes.ts'

// Frozen main4569807 implementation. Retain its enumeration and release order.
function original(w) {
  const alive = new Set(w.units.filter(u => u.hp > 0).map(u => u.id))
  for (const [id, p] of w.pathfinding.people)
    if (!alive.has(id)) {
      releasePersonRoute(w.motionRoutes, p)
      w.pathfinding.people.delete(id)
    }
}
function fixture(units = [], routes = []) {
  const w = { units, pathfinding: { people: new Map() }, motionRoutes: createMotionRoutes() }
  for (const [id, group, reserved = false] of routes) {
    const p = { id, motionGroup: 0, motionIndex: 7 }
    if (group) attachPersonRoute(w.motionRoutes, p, group, reserved)
    w.pathfinding.people.set(id, p)
  }
  return w
}
function compare(w) {
  const baseline = structuredClone(w), identities = new Map(w.pathfinding.people), oldPeople = new Map(baseline.pathfinding.people)
  original(baseline)
  removeDeadLiveRoutes(w)
  assert.deepEqual(w, baseline, 'all pool bytes and route counters')
  assert.deepEqual([...w.pathfinding.people], [...baseline.pathfinding.people], 'retained map order')
  for (const [id, person] of identities) assert.deepEqual(person, oldPeople.get(id), 'released person mutations')
  for (const [id, person] of w.pathfinding.people) assert.strictEqual(person, identities.get(id))
}

test('empty native route map skips all roster reads without changing route storage', () => {
  for (const length of [0, 1, 256]) {
    let reads = 0
    const w = fixture(Array.from({ length }, (_, id) => ({ id, get hp() { reads++; return 1 } })))
    const before = structuredClone(w.motionRoutes)
    original(w)
    assert.equal(reads, length, 'frozen implementation visits the entire roster')
    reads = 0
    removeDeadLiveRoutes(w)
    assert.equal(reads, 0, 'candidate skips N hp reads and two arrays plus a Set')
    assert.deepEqual(w.motionRoutes, before)
    assert.equal(w.pathfinding.people.size, 0)
  }
})

test('nonempty alive, dead, missing, duplicate IDs and shared routes match frozen cleanup', () => {
  for (const units of [[], [{id: 1, hp: 1}], [{id: 1, hp: 0}], [{id: 1, hp: -1}],
    [{id: 1, hp: 0}, {id: 1, hp: 2}, {id: 2, hp: 1}], [{id: 1, hp: 2}, {id: 1, hp: 0}]]) {
    compare(fixture(units, [[1, 1], [2, 1], [3, 2, true], [4, 0]]))
  }
})

test('empty, repopulated and cleared same-map transitions retain exact cleanup behavior', () => {
  const w = fixture([{id: 1, hp: 1}]), map = w.pathfinding.people
  compare(w)
  for (let i = 0; i < 3; i++) {
    const p = {id: 1, motionGroup: 0, motionIndex: 3}
    attachPersonRoute(w.motionRoutes, p, 1)
    map.set(1, p)
    compare(w)
    w.units[0].hp = 0
    compare(w)
    assert.equal(map.size, 0)
    compare(w)
    w.units[0].hp = 1
  }
  assert.strictEqual(w.pathfinding.people, map)
})
