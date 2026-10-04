import assert from 'node:assert/strict'
import test from 'node:test'
import { addBuilding, addUnit, createWorld } from '../app/model.ts'
import { stepComputerTasks } from '../app/computer-runtime.ts'
import { createLivePerson } from '../app/live-people.ts'
import { retainFixtureUnits } from './level-start-fixture.mjs'

// Controlled adapter eligibility fixture, not a natural campaign completion.
function competingProducers(count = 5) {
  const world = createWorld(3)
  retainFixtureUnits(world, unit => unit.team !== 'yellow' || unit.kind === 'shaman')
  for (let i = 0; i < count; i++) {
    const unit = addUnit(world, 'yellow', 'brave', { x: 0, z: i })
    unit.native = createLivePerson(world, unit)
    unit.native.state = 17
  }
  const school = addBuilding(world, 'yellow', 'camp', { x: 0, z: 0 }, true)
  world.ai.states = 4 | 64
  world.ai.attributes[7] = 100
  for (const task of world.ai.tasks) task.flags = 0
  return { world, school }
}

function opportunity(world, turn) {
  world.turn = turn
  stepComputerTasks(world, 2)
  return world.ai.tasks.filter(task => task.flags & 1)
}

test('early automatic training requires at least the native school capacity', () => {
  for (const count of [0, 4, 5, 6]) {
    const { world, school } = competingProducers(count)
    world.ai.states = 64
    const tasks = opportunity(world, 61)
    assert.equal(tasks.length, Number(count >= 5), `available ${count}`)
    if (tasks.length) assert.deepEqual([tasks[0].type, tasks[0].target], [6, school.id])
  }
})


// Paired with the original signed-add/compare cases, including overflow.
test('training capacity compares the native signed32-bit available total', async () => {
  const { hasComputerTrainingCapacity } = await import('../app/computer.ts')
  for (const [idle, housed, expected] of [
    [-2147483648, 0, false], [-1, 0, false], [0, 0, false], [4, 0, false],
    [5, 0, true], [6, 0, true], [2147483647, 0, true], [2147483647, 1, false],
    [4, 1, true], [6, -2, false], [-2147483648, -1, true], [-1, 6, true],
  ]) assert.equal(hasComputerTrainingCapacity(idle + housed, 5), expected, `${idle}+${housed}`)
})
