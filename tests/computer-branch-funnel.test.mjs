import assert from 'node:assert/strict'
import test from 'node:test'
import { acquireSelection, createComputerQueue, requestTraining } from '../app/computer.ts'
import { selectComputerPerson } from '../app/computer-selection.ts'
import { stepDefenseTask } from '../app/computer-defense.ts'

test('00462730 the production training admission uses the first unoccupied fixed slot', () => {
  const ai = createComputerQueue()
  for (const task of ai.tasks) task.flags = 1
  ai.tasks[2].flags = 2
  ai.tasks[8].flags = 0
  assert.equal(requestTraining(ai, 3, 3, 4, model => model === 7 ? 19 : 0), true)
  assert.deepEqual([ai.tasks[2].type, ai.tasks[2].target, ai.tasks[2].flags, ai.tasks[8].type], [6, 19, 1, 0])
  ai.tasks[8].flags = 1
  assert.equal(requestTraining(ai, 3, 3, 4, () => assert.fail('no capacity')), false)
})

test('00462ca0 allocating training type 6 preserves its noninitializer scratch fields', () => {
  const ai = createComputerQueue()
  const t = ai.tasks[0]
  Object.assign(t, { selected: 17, remaining: 19, elapsed: 37, phase: 5 })
  assert.equal(requestTraining(ai, 3, 6, 4, model => model === 8 ? 40 : 0), true)
  assert.deepEqual([t.type, t.phase, t.selected, t.remaining, t.elapsed], [6, 0, 17, 19, 37])
})

test('004f2290 type-20 sibling phases deny selection according to mode', () => {
  for (const mode of [0, 1]) {
    for (const phase of [2, 3, 7, 11, 14, 15, 16]) {
      const ai = createComputerQueue()
      ai.tasks[0].mode = mode
      Object.assign(ai.tasks[9], { type: 20, flags: 1, phase })
      const blocked = (mode === 0 ? [2, 7, 11, 14] : [3, 15]).includes(phase)
      assert.equal(acquireSelection(ai, 0), !blocked, `phase=${phase} mode=${mode}`)
      assert.equal(ai.selectionOwner, blocked ? 10 : 0)
    }
  }
})

test('004f7720 transport duty excludes model-2 driver and passenger of a non-idle driver', () => {
  const p = { id: 1, class: 1, model: 2, state: 1, tribe: 1, x: 0, y: 0,
    flags2: 0, flags3: 1, flags4: 0, assignment: 0, vehicle: 2, busy: 0,
    immediateCommand: 0, commands: [], commandCursor: 0 }
  const v = { id: 2, class: 3, flags2: 0, driver: 1 }
  const driver = { id: 3, class: 1, flags2: 0, state: 14 }
  const w = { people: [p], units: new Map([[1, p], [2, v], [3, driver]]), orders: new Map() }
  const select = () => selectComputerPerson(w, 2, -1, -1, 0, 0, 0)
  assert.equal(select(), null)
  v.driver = 3
  assert.equal(select(), null)
  v.flags2 = 1
  assert.equal(select(), 1)
})

test('004c5f70 phase-three defense quota adds the selected Firewarrior count but subtracts ordinary count', () => {
  for (const [cursor, model, expected] of [[2, 6, 7], [1, 3, 3]]) {
    const ai = createComputerQueue(), task = ai.tasks[0], quotas = [0, 0, 0, 0]
    quotas[cursor] = 5
    Object.assign(task, { phase: 3, quotas, defense: { cursor, center: 17 } })
    stepDefenseTask(ai, 0, { select: (...args) => { assert.deepEqual(args, [model,5,17]); return 2 } })
    assert.deepEqual([task.selected, task.quotas[cursor], task.phase], [2, expected, 3])
  }
})
