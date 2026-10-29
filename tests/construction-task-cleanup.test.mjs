// Actual task dispatcher with supplied phase7/no-worker boundary, not an ordinary AI episode.
import test from 'node:test'
import assert from 'node:assert/strict'
import { createWorld } from '../app/world-initialization.ts'
import { addBuilding } from '../app/construction-runtime.ts'
import { requestConstruction, computerPhase } from '../app/computer.ts'
import { stepComputerTasks } from '../app/computer-runtime.ts'

for (const state of ['plan', 'allocated', 'absent']) {
  test(`construction task cleanup ${state} target preserves unrelated objects`, () => {
    const w = createWorld(4)
    w.turn = 61
    assert.equal(computerPhase(w.turn, 3), 'dispatch')
    const target = addBuilding(w, 'green', 'tower', { x: -48, z: -64 }, false, { plan: state === 'plan' })
    const unrelated = addBuilding(w, 'green', 'camp', { x: 48, z: 64 }, false, { plan: true })
    if (state === 'absent') w.buildings = w.buildings.filter(b => b !== target)
    assert.equal(Boolean(target.preparation), state === 'plan')
    const before = w.buildings.slice()
    assert.ok(requestConstruction(w.ai, 4, 0x36b6))
    const task = w.ai.tasks.find(t => t.flags & 1 && t.type === 0)
    const index = w.ai.tasks.indexOf(task)
    Object.assign(task, { phase: 7, entity: target.id, members: [] })
    w.ai.cursor = index
    w.ai.selectionOwner = index
    w.ai.flags |= 2
    const rng = w.randomState
    stepComputerTasks(w, 3)
    const expected = before.filter(b => state !== 'plan' || b !== target)
    assert.deepEqual(w.buildings.map(b => b.id), expected.map(b => b.id))
    assert.ok(w.buildings.every((b, i) => b === expected[i]))
    assert.ok(w.buildings.includes(unrelated))
    assert.ok(unrelated.preparation)
    assert.equal(w.buildings.includes(target), state === 'allocated')
    assert.equal(task.flags & 3, 0)
    assert.deepEqual(task.members, [])
    assert.equal(w.ai.selectionOwner, 10)
    assert.equal(w.ai.flags & 2, 0)
    assert.equal(w.randomState, rng)
    w.ai.cursor = index
    stepComputerTasks(w, 3)
    assert.deepEqual(w.buildings.map(b => b.id), expected.map(b => b.id))
    assert.equal(w.randomState, rng)
  })
}
