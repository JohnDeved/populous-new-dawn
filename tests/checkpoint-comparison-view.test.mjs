import assert from 'node:assert/strict'
import test from 'node:test'
import { checkpointComparisonView, assertCheckpointComparisonDomain } from './helpers/checkpoint-comparison-view.mjs'

// Retain the previous implementation as the differential assertion oracle.
const previous = world => {
  const copy = structuredClone(world)
  for (const head of copy.shrines)
    if (head.reward === undefined && head.rewardMana) head.reward = 'mana'
  return copy
}
const fixture = () => {
  const person = { id: 7, hp: 100, commands: [3, 0] }
  return {
    turn: 3531,
    shrines: [
      { id: 102, rewardMana: 600000, members: [7] },
      { id: 120, rewardMana: 600000, reward: 'mana' },
      { id: 123, rewardMana: 0 },
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
  const world = fixture(), before = structuredClone(world), view = checkpointComparisonView(world)
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
      Object.assign(right.shrines[0], { reward: reward === undefined && rewardMana ? 'mana' : reward, rewardMana })
      const beforeLeft = structuredClone(left), beforeRight = structuredClone(right)
      assert.deepEqual(checkpointComparisonView(left), previous(left))
      assert.deepEqual(checkpointComparisonView(right), previous(right))
      assert.equal(Boolean(failure(checkpointComparisonView(left), checkpointComparisonView(right))), Boolean(failure(previous(left), previous(right))))
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
    const newError = failure(checkpointComparisonView(left), checkpointComparisonView(right))
    assert.ok(oldError)
    assert.ok(newError)
    assert.equal(newError.operator, oldError.operator)
    assert.equal(newError.message, oldError.message)
  }
})

test('each view observes current values after later ticks and shrine replacement', () => {
  const world = fixture()
  assert.deepEqual(checkpointComparisonView(world), previous(world))
  world.turn++
  world.units[0].native.hp--
  world.shrines = [{ id: 200, rewardMana: 1 }]
  assert.deepEqual(checkpointComparisonView(world), previous(world))
  assert.equal(Object.hasOwn(world.shrines[0], 'reward'), false)
})

test('one-time domain check accepts replay data and rejects aliased shrines or non-data shapes', () => {
  assertCheckpointComparisonDomain(fixture())
  const aliased = fixture()
  aliased.otherHead = aliased.shrines[0]
  assert.throws(() => assertCheckpointComparisonDomain(aliased), { code: 'ERR_ASSERTION' })
  const linked = fixture()
  linked.shrines[1].linkedShrine = linked.shrines[0]
  assert.throws(() => assertCheckpointComparisonDomain(linked), { code: 'ERR_ASSERTION' })
  const prototype = fixture()
  class NonData { constructor() { this.value = 1 } }
  prototype.extra = new NonData()
  assert.throws(() => assertCheckpointComparisonDomain(prototype), { code: 'ERR_ASSERTION' })
  const symbolic = fixture()
  symbolic[Symbol('extra')] = 1
  assert.throws(() => assertCheckpointComparisonDomain(symbolic), { code: 'ERR_ASSERTION' })
})
