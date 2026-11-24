import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { computerSelectionWorld } from '../app/computer-runtime.ts'
import { availableTrainingPeople } from '../app/computer-selection.ts'
import { buildingModel } from '../app/building-shapes.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

function mission() {
  const world = createWorld(12)
  const advance = turn => { while (world.turn < turn) tick(world, 1 / 12) }
  const active = type => world.ai.tasks.filter(task => task.flags & 1 && task.type === type)
  return { world, advance, active }
}

test('authored Mission 12 computer first requests its tower and resolves a construction target', () => {
  const { advance, active } = mission()
  advance(62)
  assert.equal(active(0).length, 0)
  advance(63)
  assert.equal(active(0).length, 1)
  const [tower] = active(0)
  assert.deepEqual([tower.requested, tower.target, tower.phase], [4, 0, 0])
  assert.equal(active(6).length, 0)
  advance(64)
  assert.equal(active(0)[0], tower)
  assert.deepEqual([tower.requested, tower.target, tower.phase], [4, 51932, 4])
})

test('authored Mission 12 admits training from its live roster above camp capacity', () => {
  const { world, advance, active } = mission()
  advance(126)
  assert.equal(active(6).length, 0)
  const camp = world.buildings.find(b => b.id === 176)
  assert.ok(camp && camp.team === 'red' && camp.progress === 1)
  assert.equal(buildingModel(camp), 7)
  const available = availableTrainingPeople(computerSelectionWorld(world, 3).world)
  assert.deepEqual([available, rules.buildingCapacity[7]], [6, 5])
  advance(127)
  assert.equal(active(6).length, 1)
  const [training] = active(6)
  assert.deepEqual([training.target, training.requested, training.phase], [camp.id, 0, 0])
})

test('the real Mission 12 type-6 packet produces warriors and retires', () => {
  const { world, advance, active } = mission()
  const warriors = () => world.units.filter(u => u.team === 'red' && u.kind === 'warrior' && u.hp > 0)
  advance(127)
  const [training] = active(6)
  assert.ok(training && training.target === 176)
  assert.equal(warriors().length, 0)
  advance(136)
  assert.equal(active(6)[0], training)
  assert.equal(training.phase, 7)
  advance(371)
  assert.equal(warriors().length, 0)
  advance(372)
  assert.equal(warriors().length, 2)
  assert.equal(active(6)[0], training)
  advance(451)
  assert.equal(training.flags & 1, 0)
  assert.equal(warriors().length, 2)
})
