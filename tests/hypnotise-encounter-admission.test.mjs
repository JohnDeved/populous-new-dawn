import assert from 'node:assert/strict'
import test from 'node:test'
import { createGameStore } from '../app/game-store.ts'
import { tick } from '../app/model.ts'
import { spellTargetError } from '../app/live-command.ts'
import { hypnotiseTargets } from '../app/spell-effects-runtime.ts'
import { prepareEarnedHypnotise, prepareHypnotiseEncounter } from '../scripts/tutorial-browser/hypnotise-fixture.mjs'

test('ordinary earned M22 patrol admits the two original warriors for thirty further logical visits', async () => {
  const store = createGameStore(); store.startMission(22)
  const world = store.getWorld()
  world.paused = false
  for (let n = 0; n < 22; n++) tick(world, 1 / 12)
  world.paused = true
  const scene = { world, isCurrent: () => true, focus: () => {}, onChange: () => {} }
  await prepareEarnedHypnotise(scene)
  // Model ordinary resumed visits, not a claim of browser Save/Load acceptance.
  world.paused = false
  for (let n = 0; n < 30; n++) tick(world, 1 / 12)
  world.paused = true
  const beforeAdmission = structuredClone(world)
  let clockCalls = 0
  await assert.rejects(prepareHypnotiseEncounter(scene, {
    now: () => clockCalls++ === 0 ? 0 : 5000,
  }), /exceeded 500 visits or 5s/)
  assert.deepEqual(world, beforeAdmission, 'Expired admission must not move actors or cast')
  await assert.rejects(prepareHypnotiseEncounter({ ...scene, isCurrent: () => false }), /current paused Mission22/)
  assert.deepEqual(world, beforeAdmission, 'Stale scene must not move actors or cast')
  const delayedWorld = structuredClone(world)
  let elapsed = 0
  await assert.rejects(prepareHypnotiseEncounter({ ...scene, world: delayedWorld }, {
    now: () => elapsed, yieldBatch: async () => { elapsed = 5000 },
  }), /exceeded 500 visits or 5s/)
  assert.equal(delayedWorld.paused, true, 'Expired yield leaves simulation paused')
  assert.equal(delayedWorld.shots.hypnotise, 1)
  assert.equal(delayedWorld.effects.some(f => f.kind === 'hypnotise'), false)
  const result = await prepareHypnotiseEncounter(scene)
  assert.deepEqual(result.cohort, [97, 98])
  assert.equal(result.readyTurn - result.startedTurn, result.visits)
  assert.ok(result.visits <= 500)
  assert.equal(world.shots.hypnotise, 1)
  assert.equal(world.paused, true)
  assert.equal(world.effects.some(f => f.kind === 'hypnotise'), false)
  world.paused = false
  for (let n = 0; n < 30; n++) {
    assert.deepEqual(hypnotiseTargets(world, result.target, 'blue').map(({ u }) => u.id).sort((a,b) => a-b), [97,98])
    assert.equal(spellTargetError(world, 'hypnotise', result.target), null)
    tick(world, 1 / 12)
  }
})

 test('unearned stock rejects encounter admission without changing its world', async () => {
  const store = createGameStore(); store.startMission(22)
  const world = store.getWorld(), before = structuredClone(world)
  await assert.rejects(prepareHypnotiseEncounter({ world, isCurrent: () => true }), /current paused Mission22/)
  assert.deepEqual(world, before)
})
