import assert from 'node:assert/strict'
import test from 'node:test'
import { SpriteMaterial } from 'three'
import { createWorld, addBuilding, addUnit, command, tick } from '../app/model.ts'
import {
  createHutOccupancySmoke,
  stepHutOccupancySmoke,
  reconcileHutOccupancySmoke,
  observeHutOccupancy,
  notifyHutOccupancy,
} from '../app/hut-occupancy-smoke.ts'

// Supporting regressions; the canonical browser check supplies shipped-input proof.
test('immediate occupancy events preserve capacity, phase and same-mode root identity', () => {
  for (const capacity of [3, 4, 5]) {
    const state = createHutOccupancySmoke(33, 0, capacity, 4)
    assert.equal(reconcileHutOccupancySmoke(state, 1, capacity, 7), true)
    assert.equal(state.root.mode, 'partial')
    assert.equal(state.lastBuildingCounter, 33, 'reconciliation must not advance the clock')
    const root = state.root
    assert.equal(reconcileHutOccupancySmoke(state, capacity - 1, capacity, 8), false)
    assert.equal(state.root, root, 'partial-to-partial must not restart its animation/lifetime')
    assert.equal(reconcileHutOccupancySmoke(state, capacity, capacity, 9), true)
    assert.equal(state.root.mode, 'full')
    assert.equal(reconcileHutOccupancySmoke(state, capacity - 1, capacity, 10), true)
    assert.equal(state.root.mode, 'partial')
    assert.equal(reconcileHutOccupancySmoke(state, 0, capacity, 11), true)
    assert.equal(state.root, null)
    assert.equal(state.lastBuildingCounter, 33)
  }
})

test('drain elapsed old-root visits before an off-phase event without backdating the new root', () => {
  const state = createHutOccupancySmoke(29, 0, 3, 0),
    draws = []
  stepHutOccupancySmoke(state, 35, 0, 3, 9, () => {
    draws.push(31)
    return 31
  })
  reconcileHutOccupancySmoke(state, 1, 3, 9)
  assert.deepEqual(state.root, { mode: 'partial', visible: true, lifetime: 16, frameStart: 9 })
  stepHutOccupancySmoke(state, 35, 1, 3, 9, () => {
    draws.push(31)
    return 31
  })
  assert.equal(state.root.lifetime, 16, 'same visit render must not age the new root again')
  stepHutOccupancySmoke(state, 51, 1, 3, 25, () => {
    draws.push(31)
    return 31
  })
  assert.equal(state.root.visible, false)
  const hidden = state.root
  reconcileHutOccupancySmoke(state, 2, 3, 25)
  assert.equal(state.root, hidden)
  assert.equal(
    state.root.visible,
    false,
    'another partial admission cannot force a cosmetic restart'
  )
  assert.deepEqual(draws, [])
})

test('listeners are transient, identity-scoped and released through material disposal', () => {
  const building = { id: 36 },
    restored = { id: 36 },
    calls = [],
    material = new SpriteMaterial()
  const before = JSON.stringify(building)
  const stop = observeHutOccupancy(building, () => calls.push('old'))
  material.addEventListener('dispose', stop)
  notifyHutOccupancy(restored)
  assert.deepEqual(calls, [], 'same numeric ID in another world is not the original building')
  notifyHutOccupancy(building)
  material.dispose()
  notifyHutOccupancy(building)
  assert.deepEqual(calls, ['old'])
  const stopNew = observeHutOccupancy(building, () => calls.push('new'))
  stop() // A repeated old cleanup must not remove a newly bound consumer.
  notifyHutOccupancy(building)
  assert.deepEqual(calls, ['old', 'new'])
  stopNew()
  assert.equal(JSON.stringify(building), before, 'checkpoint/gameplay object gains no event fields')
})

test('multiple presentation consumers unsubscribe independently without resetting each other', () => {
  const building = { id: 36 },
    calls = []
  const a = observeHutOccupancy(building, () => calls.push('a'))
  const b = observeHutOccupancy(building, () => calls.push('b'))
  a()
  notifyHutOccupancy(building)
  b()
  notifyHutOccupancy(building)
  assert.deepEqual(calls, ['b'])
})

for (const level of [1, 2, 3])
  test('live command8 owner publishes authoritative entry/removal for Hut level ' + level, () => {
    const w = createWorld()
    w.manaWorld.gameFlags = 32 // Same population-isolation fixture as housing-entry.test.mjs.
    w.units = w.units.filter(u => u.kind === 'shaman')
    const b = addBuilding(w, 'blue', 'hut', { x: -2, z: 32 }, true, { level })
    const u = addUnit(w, 'blue', 'brave', { x: 7, z: 33 }),
      events = []
    const smoke = createHutOccupancySmoke(b.counter, 0, level + 2, 0)
    const stop = observeHutOccupancy(b, () => {
      const ids = w.units.filter(p => p.inside === b.id && p.hp > 0).map(p => p.id)
      assert.equal(b.admission.inside, ids.length, 'notification follows actual slot/mirror update')
      const random = w.randomState,
        counter = b.counter
      reconcileHutOccupancySmoke(smoke, ids.length, level + 2, 0)
      assert.equal(w.randomState, random)
      assert.equal(b.counter, counter)
      events.push({
        turn: w.turn,
        counter,
        ids,
        count: b.admission.inside,
        mode: smoke.root?.mode ?? null,
      })
    })
    w.selected = [u.id]
    command(w, b)
    assert.equal(events.length, 0, 'order assignment is not resident admission')
    for (let i = 0; i < 180 && u.inside !== b.id; i++) tick(w, 1 / 12)
    assert.equal(u.inside, b.id)
    assert.equal(events.length, 1)
    assert.equal(events[0].mode, 'partial')
    assert.deepEqual(events[0].ids, [u.id])
    const countBefore = b.counter,
      turnBefore = w.turn
    w.selected = [u.id]
    command(w, { x: 9, z: 30 })
    assert.equal(u.inside, null)
    assert.equal(events.length, 2, 'release publishes synchronously, without another tick/render')
    assert.equal(events[1].mode, null)
    assert.equal(events[1].count, 0)
    assert.equal(events[1].counter, countBefore)
    assert.equal(events[1].turn, turnBefore)
    stop()
  })
