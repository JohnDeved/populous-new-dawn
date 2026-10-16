import assert from 'node:assert/strict'
import test from 'node:test'
import { stagedCheckpointComparisonView, assertStagedCheckpointComparisonDomain } from './helpers/staged-checkpoint-comparison-view.mjs'

// Retain the previous implementation as the differential assertion oracle.
const previous = world => {
  const copy = structuredClone(world)
  for (const [index, id] of [[0, 102], [2, 120]]) {
    assert.equal(copy.shrines[index].id, id)
    if (copy.shrines[index].reward === undefined) copy.shrines[index].reward = 'mana'
  }
  return copy
}
const fixture = () => {
  const person = { id: 7, hp: 100, commands: [3, 0] }
  return {
    turn: 3531,
    shrines: [
      { id: 102, rewardMana: 600000, members: [7] },
      { id: 119, rewardMana: 600000 },
      { id: 120, rewardMana: 0, reward: 'mana' },
      { id: 124, rewardMana: 600000, reward: 'bridge' },
    ],
    units: [{ id: 7, native: person }],
    cells: { heads: new Uint16Array([0, 7]), objects: new Map([[7, person]]) },
    order: { records: [{ references: 2 }] },
    flags: new Set([1, 4]),
  }
}
const failure = (left, right) => {
  try { assert.deepEqual(left, right); return null }
  catch (error) { assert.equal(error.code, 'ERR_ASSERTION'); return error }
}

test('comparison view preserves exact shrine defaults without mutating either world', () => {
  const world = fixture(), before = structuredClone(world), view = stagedCheckpointComparisonView(world)
  assert.deepEqual(view, previous(world))
  assert.deepEqual(world, before)
  assert.equal(Object.hasOwn(world.shrines[0], 'reward'), false)
  assert.equal(view.shrines[0].reward, 'mana')
  assert.notEqual(view, world)
  assert.notEqual(view.shrines, world.shrines)
  assert.notEqual(view.shrines[0], world.shrines[0])
  for (const i of [1, 2, 3]) assert.equal(view.shrines[i], world.shrines[i])
  for (const key of ['units', 'cells', 'order', 'flags']) assert.equal(view[key], world[key])
  assert.equal(view.units[0].native, view.cells.objects.get(7))
})

test('absent, undefined, null, zero and present rewards keep the previous comparison result', () => {
  for (const reward of [undefined, null, 'mana', 'bridge', '']) {
    for (const rewardMana of [undefined, 0, 1, -1]) {
      const left = fixture(), right = structuredClone(left)
      Object.assign(left.shrines[0], { reward, rewardMana })
      Object.assign(right.shrines[0], { reward: reward === undefined ? 'mana' : reward, rewardMana })
      const beforeLeft = structuredClone(left), beforeRight = structuredClone(right)
      assert.deepEqual(stagedCheckpointComparisonView(left), previous(left))
      assert.deepEqual(stagedCheckpointComparisonView(right), previous(right))
      assert.equal(Boolean(failure(stagedCheckpointComparisonView(left), stagedCheckpointComparisonView(right))), Boolean(failure(previous(left), previous(right))))
      assert.deepEqual(left, beforeLeft)
      assert.deepEqual(right, beforeRight)
    }
  }
})

test('unrelated nested mismatches retain full deep equality diagnostics', () => {
  const mutations = [
    world => { world.units[0].native.hp-- },
    world => { world.cells.heads[1]++ },
    world => { world.cells.objects.set(8, { id: 8 }) },
    world => { world.order.records[0].references++ },
    world => { world.flags.add(9) },
    world => { world.shrines[0].members.push(8) },
    world => { world.shrines[3].reward = 'mana' },
  ]
  for (const mutate of mutations) {
    const left = fixture(), right = structuredClone(left)
    mutate(right)
    const oldError = failure(previous(left), previous(right))
    const newError = failure(stagedCheckpointComparisonView(left), stagedCheckpointComparisonView(right))
    assert.ok(oldError)
    assert.ok(newError)
    assert.equal(newError.operator, oldError.operator)
    assert.equal(newError.message, oldError.message)
  }
})

test('each view observes current values after later ticks and shrine replacement', () => {
  const world = fixture()
  assert.deepEqual(stagedCheckpointComparisonView(world), previous(world))
  world.turn++
  world.units[0].native.hp--
  world.shrines = [{ id: 102 }, { id: 119 }, { id: 120 }]
  assert.deepEqual(stagedCheckpointComparisonView(world), previous(world))
  assert.equal(Object.hasOwn(world.shrines[0], 'reward'), false)
})

test('one-time domain check accepts replay data and rejects aliased shrines or non-data shapes', () => {
  assertStagedCheckpointComparisonDomain(fixture())
  const aliased = fixture()
  aliased.otherHead = aliased.shrines[0]
  assert.throws(() => assertStagedCheckpointComparisonDomain(aliased), { code: 'ERR_ASSERTION' })
  const linked = fixture()
  linked.shrines[1].linkedShrine = linked.shrines[0]
  assert.throws(() => assertStagedCheckpointComparisonDomain(linked), { code: 'ERR_ASSERTION' })
  const prototype = fixture()
  class NonData { constructor() { this.value = 1 } }
  prototype.extra = new NonData()
  assert.throws(() => assertStagedCheckpointComparisonDomain(prototype), { code: 'ERR_ASSERTION' })
  const symbolic = fixture()
  symbolic[Symbol('extra')] = 1
  assert.throws(() => assertStagedCheckpointComparisonDomain(symbolic), { code: 'ERR_ASSERTION' })
})

test('indexed IDs are asserted on every view and defaults never widen to other shrines', () => {
  const world = fixture()
  const view = stagedCheckpointComparisonView(world)
  assert.equal(Object.hasOwn(view.shrines[1], 'reward'), false)
  for (const index of [0, 2]) {
    const changed = fixture()
    stagedCheckpointComparisonView(changed)
    changed.shrines[index].id++
    assert.throws(() => stagedCheckpointComparisonView(changed), { code: 'ERR_ASSERTION' })
    assert.throws(() => previous(changed), { code: 'ERR_ASSERTION' })
  }
})
