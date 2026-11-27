import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { buildingModel } from '../app/building-shapes.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

function mission() {
  const world = createWorld(17, 'scalable')
  const advance = turn => { while (world.turn < turn) tick(world, 1 / 12) }
  const activeTraining = tribe =>
    world.campaignAIs[tribe].tasks.filter(task => task.flags & 1 && task.type === 6)
  const camp = (id, team) => {
    const result = world.buildings.find(b => b.id === id)
    assert.ok(result && result.team === team && result.progress === 1)
    assert.equal(buildingModel(result), 7)
    assert.equal(rules.buildingCapacity[7], 5)
    return result
  }
  return { world, advance, activeTraining, camp }
}

test('Mission 17 does not queue ordinary camp training for the first undersized rosters', () => {
  const { advance, activeTraining, camp } = mission()
  for (const [turn, tribe, id, team] of [[61, 3, 405, 'green'], [62, 2, 464, 'yellow'], [63, 1, 451, 'red']]) {
    advance(turn)
    camp(id, team)
    assert.deepEqual(activeTraining(tribe), [], `No premature type-6 request for ${team}`)
  }
})

test('Mission 17 Red AI admits its authored camp once the roster reaches the threshold', () => {
  const { advance, activeTraining, camp } = mission()
  advance(126)
  const red = camp(451, 'red')
  assert.deepEqual(activeTraining(1), [])
  advance(127)
  assert.equal(activeTraining(1).length, 1, 'A qualifying roster must admit the type-6 request')
  const [training] = activeTraining(1)
  assert.deepEqual([training.target, training.requested, training.phase], [red.id, 0, 0])
  advance(132)
  assert.equal(activeTraining(1)[0], training)
  assert.equal(training.phase, 7)
})
