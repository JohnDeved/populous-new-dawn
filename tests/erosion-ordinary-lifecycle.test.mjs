import assert from 'node:assert/strict'
import { serialize, deserialize } from 'node:v8'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { finishLevelStart } from './level-start-fixture.mjs'
import { observeOrdinaryErosion } from '../qa/erosion-ordinary/lifecycle.mjs'

const identity = { runId: 'synthetic-source-fixture', profileId: 'no-profile', source: { commit: 'a'.repeat(40), fingerprint: 'b'.repeat(64) } }
const fixture = () => {
  const world = finishLevelStart(createWorld(3))
  // Explicit supplied completion for observer-influence testing only. The
  // ordinary driver cannot invoke this fixture or force a reward.
  const shrine = world.shrines.find(s => s.id === 101)
  shrine.reset = false; shrine.forced = true
  return world
}

test('combined corrected producer has identical full World state with capture disabled and enabled for all64 visits', () => {
  const baseline = fixture(), observed = structuredClone(baseline), expected = []
  const original = observed.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  for (let i = 0; i < 64; i++) { tick(baseline, 1 / 12); expected.push(serialize(baseline)) }
  const receiver = {}, args = {}, returned = {}, calls = []
  const previous = function (value) { assert.equal(this, receiver); assert.equal(value, args); calls.push(observed.turn); return returned }
  const clock = { afterTurn: previous }, observer = observeOrdinaryErosion(clock, observed, identity, original.id)
  try {
    for (let i = 0; i < 64; i++) {
      tick(observed, 1 / 12)
      assert.equal(clock.afterTurn.call(receiver, args), returned)
      assert.deepEqual(observed, deserialize(expected[i]), `complete World mismatch at controller visit ${i + 1}`)
    }
    assert.equal(calls.length, 64); assert.equal(observer.complete(), true)
    const result = observer.read(), onset = result.capture.onsetTurn
    assert.equal(result.capture.creation.remaining, 64)
    assert.equal(result.capture.steps[0].visit.before.remaining, 64)
    assert.equal(result.capture.steps[0].visit.after.remaining, 63)
    assert.equal(result.capture.steps.at(-1).turn, onset + 63)
    assert.equal(result.capture.steps.at(-1).visit.after.remaining, 0)
    assert.equal(result.lifecycle.erosion.effects[0].retired.absentFromWorld, true)
    result.capture.steps[0].visit.before.heights.fill(-32768)
    assert.notDeepEqual(observer.read().capture.steps[0].visit.before.heights, result.capture.steps[0].visit.before.heights)
  } finally { observer.dispose() }
  assert.equal(clock.afterTurn, previous)
})

test('lifecycle wrapper preserves original exception identity and exactly one callback', () => {
  const world = fixture(), actor = world.units.find(u => u.team === 'blue' && u.kind === 'shaman'), sentinel = {}
  let calls = 0
  const previous = () => { calls++; throw sentinel }, clock = { afterTurn: previous }
  const observer = observeOrdinaryErosion(clock, world, identity, actor.id), before = structuredClone(world)
  try {
    assert.throws(() => clock.afterTurn(), error => error === sentinel)
    assert.equal(calls, 1); assert.deepEqual(world, before)
    assert.equal(observer.complete(), false)
  } finally { observer.dispose() }
  assert.equal(clock.afterTurn, previous)
})
