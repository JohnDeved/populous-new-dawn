import assert from 'node:assert/strict'
import test from 'node:test'
import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import { addBuilding, addUnit, command, tick } from '../app/model.ts'
import { appendLiveOrders } from '../app/live-movement.ts'
import { emptyPersonOrder } from '../app/person-orders.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { random } from '../app/native-math.ts'

// An unobstructed supplied landscape isolates the shared production movement
// path. No formation, timer, membership, recovery phase, or RNG is injected.
function scenario(producer) {
  const w = createStartedWorld(1)
  retainFixtureUnits(w, u => u.kind === 'shaman')
  w.manaWorld.gameFlags = 32
  w.terrain.fill(3)
  w.terrainVersion++
  const units = Array.from({ length: 24 }, (_, i) =>
    addUnit(w, 'blue', 'brave', { x: -18 + (i % 3) * .5, z: 8 + Math.floor(i / 3) * .5 }))
  const b = producer === 'march' ? null : addBuilding(w, 'blue', 'temple', { x: 30, z: 8 }, true)
  if (producer === 'ai')
    assert.deepEqual(appendLiveOrders(w, units, { ...emptyPersonOrder(), model: 8, a: b.id }, true),
      { accepted: true, count: units.length })
  else {
    w.selected = units.map(u => u.id)
    assert.equal(command(w, b ?? { x: 30, z: 8 }), true)
  }
  return { w, units, b }
}

// Watch the real allocation callback without replacing recruitment, random,
// construction, or the formation controller. Other allocations are harmless:
// a group records the immediately preceding nextId increment.
function observeCreation(w) {
  const created = []
  let nextId = w.nextId, before
  Object.defineProperty(w, 'nextId', {
    enumerable: true, configurable: true,
    get: () => nextId,
    set: value => { before = w.randomState; nextId = value },
  })
  function watch() {
    Object.defineProperty(w.marching, 'unshift', {
      configurable: true,
      value(g) {
        const expected = { randomState: before }
        const timer = (random(expected) & 31) + 32
        created.push({ group: g, turn: w.turn, timer: g.timer,
          before, after: w.randomState, expected: expected.randomState, expectedTimer: timer,
          traversal: this.map(group => ({ id: group.id, class: group.class })) })
        return Array.prototype.unshift.call(this, g)
      },
    })
  }
  return { created, tick() { watch(); tick(w, 1 / 12) } }
}

for (const producer of ['human', 'ai', 'march']) {
  test(`${producer} actual movement constructs formations with one RNG draw and native timer`, () => {
    const { w } = scenario(producer), observer = observeCreation(w)
    for (let turn = 0; turn < 70; turn++) observer.tick()
    assert.ok(observer.created.length >= 2, 'ordinary movement must actually allocate groups')
    for (const creation of observer.created) {
      assert.equal(creation.after, creation.expected, 'exactly one game-RNG step belongs to creation')
      assert.equal(creation.timer, creation.expectedTimer)
      assert.ok(creation.timer >= 32 && creation.timer <= 63)
    }
  })
}

for (const producer of ['human', 'ai', 'march']) {
  test(`${producer} real allocations rebuild in lifetime order and retain identity across checkpoints`, () => {
    const { w } = scenario(producer), observer = observeCreation(w)
    for (let turn = 0; turn < 70 && observer.created.length < 2; turn++) observer.tick()
    assert.ok(observer.created.length >= 2)
    const live = observer.created.map(c => c.group).filter(g => g.class)
    assert.ok(live.length >= 2)
    assert.deepEqual(w.marching.map(g => g.id), live.map(g => g.id),
      'end-turn rebuild traverses primary newest-first and prepends to tribe lists')
    assert.deepEqual(w.marchingAllocations.map(g => g.id), [...live].reverse().map(g => g.id))
    const restored = migrateCheckpoint(structuredClone(w))
    assert.equal(restored.randomState, w.randomState, 'loading must not redraw constructor RNG')
    assert.deepEqual(restored.marching, w.marching)
    for (const group of restored.marching)
      assert.equal(restored.marchingAllocations.find(g => g.id === group.id), group)
    for (let turn = 0; turn < 90; turn++) {
      tick(w, 1 / 12)
      tick(restored, 1 / 12)
      assert.equal(restored.randomState, w.randomState)
      assert.deepEqual(restored.marching, w.marching)
      assert.deepEqual(restored.marchingAllocations, w.marchingAllocations)
      assert.deepEqual(restored.units, w.units)
    }
  })
}

test('old checkpoint migration derives primary order from historical prepend/filter order without RNG', () => {
  const { w } = scenario('march'), observer = observeCreation(w)
  for (let turn = 0; turn < 70 && observer.created.length < 2; turn++) observer.tick()
  const groups = observer.created.map(c => c.group).filter(g => g.class)
  assert.ok(groups.length >= 2)
  // Older browser versions retained insertion order with unshift/filter only.
  // Deliberately unrelated IDs show that migration cannot infer age from IDs.
  groups.forEach((g, i) => { g.id = i % 2 ? 900 - i : 1200 + i })
  w.marching = [...groups].reverse()
  delete w.marchingAllocations
  const state = w.randomState, timers = w.marching.map(g => g.timer), order = w.marching.map(g => g.id)
  const restored = migrateCheckpoint(structuredClone(w))
  assert.equal(restored.randomState, state)
  assert.deepEqual(restored.marching.map(g => g.timer), timers)
  assert.deepEqual(restored.marching.map(g => g.id), order, 'retain the saved next visit on first load')
  assert.deepEqual(restored.marchingAllocations.map(g => g.id), order)
  for (const group of restored.marching)
    assert.equal(restored.marchingAllocations.find(g => g.id === group.id), group)
  tick(restored, 1 / 12)
  assert.deepEqual(restored.marching.map(g => g.id), [...order].reverse())
})

function untilGroups(w) {
  for (let turn = 0; turn < 70 && w.marching.length < 2; turn++) tick(w, 1 / 12)
  assert.ok(w.marching.length >= 2)
}

function observeRetirement(w, group) {
  const visits = []
  for (const u of w.units) {
    const p = u.native ?? u.entry?.person
    if (!p) continue
    let counter = p.counter
    Object.defineProperty(p, 'counter', {
      enumerable: true, configurable: true,
      get: () => counter,
      set(value) {
        counter = value
        if (!group.class) visits.push({ turn: w.turn,
          traversal: w.marching.includes(group), primary: w.marchingAllocations.includes(group),
          count: group.count })
      },
    })
  }
  return visits
}

for (const producer of ['human', 'ai', 'march']) {
  for (const interruption of ['command', 'death', ...(producer === 'march' ? [] : ['destruction'])]) {
    test(`${producer} ${interruption} retires live allocations before rebuild without stale recruitment`, () => {
      const { w, b } = scenario(producer)
      untilGroups(w)
      const group = w.marching[0], visits = observeRetirement(w, group)
      const members = w.units.filter(u => group.members.includes(u.id))
      assert.ok(members.length >= 2)
      if (interruption === 'command') {
        const owners = members.map(u => u.native ?? u.entry.person)
        const counters = owners.map(p => p.counter)
        w.selected = members.map(u => u.id)
        assert.equal(command(w, { x: -30, z: 15 }), true)
        for (const [index, u] of members.entries()) {
          assert.equal(u.native, owners[index], 'replacement must retain the registered person')
          assert.equal(u.native.counter, counters[index], 'a command does not redraw the allocation phase')
          assert.equal(w.objectCells.objects.get(u.id), owners[index])
        }
      } else if (interruption === 'death') members.forEach(u => { u.hp = 0 })
      else b.hp = 0
      for (let turn = 0; turn < 6 && group.class; turn++) tick(w, 1 / 12)
      assert.equal(group.class, 0)
      assert.ok(visits.length, 'real person visits must observe the post-formation/pre-rebuild boundary')
      for (const visit of visits) {
        assert.equal(visit.traversal, true, 'retired record remains on the same-turn tribe chain')
        assert.equal(visit.primary, false, 'retirement immediately unlinks primary allocation')
        assert.equal(visit.count, 0, 'same-turn recruitment skips the retired record')
      }
      assert.equal(w.marching.includes(group), false)
      assert.equal(w.marchingAllocations.includes(group), false)
      assert.equal(group.count, 0)
      assert.ok(group.members.every(id => !id))
      assert.deepEqual(w.marching.map(g => g.id), [...w.marchingAllocations].reverse().map(g => g.id))
    })
  }
}

for (const slot of [0, 1]) {
test(`a later allocation and ${slot ? 'middle' : 'head'} retirement preserve three-group lifetime order`, () => {
  const { w } = scenario('march')
  untilGroups(w)
  const oldGroups = [...w.marching]
  const wave = Array.from({ length: 12 }, (_, i) =>
    addUnit(w, 'blue', 'brave', { x: -22 + (i % 3) * .5, z: 16 + Math.floor(i / 3) * .5 }))
  w.selected = wave.map(u => u.id)
  assert.equal(command(w, { x: 30, z: 16 }), true)
  // Observe when the unchanged public second wave first recruits in a clone,
  // then apply the interruption just before that boundary in the real world.
  const preview = structuredClone(w), known = new Set(preview.marching.map(g => g.id))
  let delay = 0
  while (++delay <= 70) {
    tick(preview, 1 / 12)
    if (preview.marching.some(g => !known.has(g.id))) break
  }
  assert.ok(delay <= 70)
  for (let turn = 1; turn < delay; turn++) tick(w, 1 / 12)
  assert.ok(oldGroups.length >= 3, 'head/middle coverage requires at least three actual groups')
  assert.ok(oldGroups.every(g => g.class), 'all original groups must still be live at the boundary')
  const retired = oldGroups[slot]
  w.units.filter(u => retired.members.includes(u.id)).forEach(u => { u.hp = 0 })
  const observer = observeCreation(w), visits = observeRetirement(w, retired)
  observer.tick()
  assert.equal(retired.class, 0)
  assert.ok(visits.some(v => v.traversal && !v.primary))
  const created = observer.created.map(c => c.group)
  assert.ok(created.length, 'the public second-wave order must really allocate this turn')
  for (const [index, creation] of observer.created.entries()) {
    assert.deepEqual(creation.traversal.map(g => g.id),
      [...created.slice(0, index).reverse(), ...oldGroups].map(g => g.id),
      'same-turn creation prepends without rewriting the existing tribe chain')
    assert.equal(creation.traversal.find(g => g.id === retired.id).class, 0)
  }
  const surviving = oldGroups.filter(g => g.class)
  assert.ok(surviving.length)
  assert.deepEqual(w.marching.map(g => g.id), [...surviving, ...created].map(g => g.id))
  assert.deepEqual(w.marchingAllocations.map(g => g.id), [...surviving, ...created].reverse().map(g => g.id))
  const nextVisits = []
  for (const group of w.marching) {
    let count = group.count, visited = -1
    Object.defineProperty(group, 'count', {
      enumerable: true, configurable: true,
      get() {
        if (visited !== w.turn) { nextVisits.push(group.id); visited = w.turn }
        return count
      },
      set(value) { count = value },
    })
  }
  tick(w, 1 / 12)
  assert.deepEqual(nextVisits, [...surviving, ...created].map(g => g.id),
    'the next real controller visit uses surviving primary age, including the middle successor')
  assert.equal(retired.count, 0, 'the inactive same-turn record never recruits again')
})
}
