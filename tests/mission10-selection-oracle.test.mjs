import test from 'node:test'
import assert from 'node:assert/strict'
import { runInNewContext } from 'node:vm'
import rules from '../app/original-rules.json' with { type: 'json' }
import constants from '../app/original-constants.json' with { type: 'json' }
import { createWorld } from '../app/world-initialization.ts'
import { hudPeople, selectFollowers } from '../app/selection-runtime.ts'
import { createLivePerson } from '../app/live-people.ts'
import { boardLiveVehicle } from '../app/live-vehicles.ts'
import { readMission10Selection } from '../scripts/tutorial-browser/mission10-input.mjs'
import { mission10QueryFixture } from './support/mission10-profile-receipt.mjs'
import { mission10SelectionQuery, mission10ExpectedSelection, mission10SelectionPreserved, encodeMission10Query, decodeMission10Query } from '../scripts/local-render/mission10-selection.mjs'

const names = ['Select warrior', 'Select follower'], modifiers = ['single', 'Control', 'Shift']
test('independent Ctrl oracle counts acquired primaries, not crew size; Total retains valid authored other classes', () => {
  assert.equal(constants.MULTIPLE_SELECT_NUM, 5)
  assert.equal(rules.vehicleCapacity[1], 5)
  assert.deepEqual(rules.hudSelectionPriority, [0, 2, 4, 3, 1, 5, 6])
  const q = mission10QueryFixture(true), x = { 115: 3000, 116: 600, 117: 4000, 118: 700, 119: 5000, 120: 800, 121: 6000, 122: 900, 123: 7000 }
  for (const p of q.people) if (x[p[0]]) p[2] = x[p[0]]
  assert.deepEqual(mission10ExpectedSelection(q, 'Select follower', 'Control'),
    { primary: [111, 116, 118, 120, 122], selected: [63, 111, 112, 113, 114, 116, 118, 120, 122] })
  assert.deepEqual(mission10ExpectedSelection(q, 'Select warrior', 'Control'),
    { primary: [111], selected: [63, 111, 112, 113, 114] })
  assert.deepEqual(mission10ExpectedSelection(q, 'Select follower', 'Shift').selected, q.people.map(p => p[0]))
  // No occupied crew after unload. Total still searches ordinary non-Warriors.
  q.boat = [0, 0, 0, 0, 0, 0]; for (const p of q.people) p[6] = 0
  assert.deepEqual(mission10ExpectedSelection(q, 'Select follower', 'Control').selected, [111, 112, 113, 114, 116])
  assert.deepEqual(mission10ExpectedSelection(q, 'Select follower', 'Shift').selected, q.people.slice(1).map(p => p[0]))
})
test('oracle preserves assignment priority, availability, nearby cutoff, wrap and stable truncated-distance ties', () => {
  const q = mission10QueryFixture(false)
  q.people.forEach(p => { p[5] = 128 })
  const a = q.people[1], b = q.people[2]; a[5] = b[5] = 0
  a[2] = 1000; a[4] = 0; b[2] = 257; b[4] = 2
  assert.deepEqual(mission10ExpectedSelection(q, 'Select warrior', 'single').selected, [111])
  a[5] = 0x800
  assert.deepEqual(mission10ExpectedSelection(q, 'Select warrior', 'single').selected, [112])
  assert.deepEqual(mission10ExpectedSelection(q, 'Select warrior', 'Shift').selected, [111, 112])
  a[5] = 128; b[2] = 6400; q.nearby = true
  assert.deepEqual(mission10ExpectedSelection(q, 'Select warrior', 'single').selected, [])
  q.nearby = false
  assert.deepEqual(mission10ExpectedSelection(q, 'Select warrior', 'single').selected, [112])
  a[5] = 0; a[4] = b[4] = 0; q.point = [0, 0]; a[2] = 65535; a[3] = 256; b[2] = 513; b[3] = 256
  assert.deepEqual(mission10ExpectedSelection(q, 'Select warrior', 'single').selected, [111])
  assert.deepEqual(decodeMission10Query(encodeMission10Query(q)), q)
  for (const change of [v => v.people.reverse(), v => { v.people[0][1] = 3 }, v => { v.people[1][5] = 1 }, v => { v.boat[0] = 1 }]) {
    const bad = structuredClone(q); change(bad); assert.throws(() => encodeMission10Query(bad))
  }
  for (const bad of [[[], false], [...encodeMission10Query(q), 0], [q.point, false, q.boat, 'AA==']]) assert.throws(() => decodeMission10Query(bad))
})
test('serialized read-only observer preserves all authored identities/controllers and matches source readers without live adoption', () => {
  for (const occupied of [false, true]) {
    const w = createWorld(10, 'scalable'), boat = w.vehicles.find(v => v.id === 62)
    w.paused = true; w.selected = []
    if (occupied) for (const id of [63, 111, 112, 113, 114]) {
      const u = w.units.find(u => u.id === id); u.native = createLivePerson(w, u); u.native.state = 19
      assert.equal(boardLiveVehicle(w, u.native, boat), true)
    }
    const scene = { world: w, cameraPosition: { x: boat.x, y: boat.y, angle: 0 } }
    const before = structuredClone(w)
    const observed = runInNewContext(`(${readMission10Selection.toString()})()`, { window: { testSceneRef: { current: scene } } })
    const raw = structuredClone(observed), query = mission10SelectionQuery(raw)
    assert.deepEqual(w, before)
    assert.equal(raw.people.length, w.units.length)
    assert.deepEqual(raw.people.map(p => [p.id, p.kind, p.team, p.hp]), w.units.map(u => [u.id, u.kind, u.team, u.hp]))
    const projected = hudPeople(structuredClone(w), false)
    assert.deepEqual(raw.people.filter(p => p.hp > 0).map(p => [p.id, p.model, p.x, p.y, p.assignment, p.flags4, p.vehicle]),
      projected.map(p => [p.id, p.model, p.x, p.y, p.assignment, p.flags4, p.vehicle]))
    for (const name of names) for (const modifier of modifiers) {
      const copy = structuredClone(w)
      selectFollowers(copy, name === 'Select warrior' ? 3 : 0, scene.cameraPosition,
        modifier === 'Control' ? 'five' : modifier === 'Shift' ? 'all' : 'single')
      assert.deepEqual([...copy.selected].sort((a, b) => a - b), mission10ExpectedSelection(query, name, modifier).selected)
    }
    const changed = structuredClone(raw); changed.people.find(p => p.id === 116).team = 'red'
    assert.throws(() => mission10SelectionPreserved(raw, changed), /ownership/)
    assert.throws(() => mission10SelectionQuery(changed), /roster/)
    const reordered = structuredClone(raw); reordered.people.reverse()
    assert.throws(() => mission10SelectionQuery(reordered), /roster/)
    for (const change of [v => { v.people.find(p => p.team === 'blue').x = undefined }, v => { v.people.find(p => p.team === 'blue').y = NaN },
      v => { v.people.find(p => p.team === 'blue').assignment = 1.5 }, v => { v.people.push(structuredClone(v.people[0])) }]) {
      const bad = structuredClone(raw); change(bad); assert.throws(() => mission10SelectionQuery(bad))
    }
  }
})
