import assert from 'node:assert/strict'
import test from 'node:test'
import { createGameStore } from '../app/game-store.ts'
import { hypnotiseTargetWitness } from '../scripts/tutorial-browser/hypnotise-fixture.mjs'
import { hypnotiseTargets } from '../app/spell-effects-runtime.ts'

test('target diagnostics preserve world and bind bounded raw cohort to actual selector', () => {
  const store = createGameStore()
  store.startMission(22)
  const world = store.getWorld(), before = structuredClone(world)
  const point = { x: 15, z: -31 }
  const state = hypnotiseTargetWitness(world, point)
  assert.deepEqual(world, before)
  assert.deepEqual(state.selected, hypnotiseTargets(world, point, 'blue').map(({ u }) => u.id))
  assert.equal(state.enemyCount, world.units.filter(u => u.team !== 'blue').length)
  assert.ok(state.nearby.length <= 32)
  assert.equal(state.omitted + state.nearby.length, state.enemyCount)
  assert.deepEqual(state.point, point)
  assert.ok(state.nearby.every(u => world.units.some(source => source.id === u.id && source.x === u.x && source.z === u.z)))
  assert.doesNotThrow(() => JSON.stringify(state))
})
