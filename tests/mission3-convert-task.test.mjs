import assert from 'node:assert/strict'
import test from 'node:test'
import { createComputerQueue } from '../app/computer.ts'
import { requestConvertTask, findConvertTarget, standableConvertTarget } from '../app/computer-convert.ts'
import { spiralCell } from '../app/native-math.ts'
import rules from '../app/original-rules.json' with { type: 'json' }
import { createWorld } from '../app/model.ts'
import { stepComputerTasks } from '../app/computer-runtime.ts'

// Controlled cases pair with check-native-mission3-convert-target.py; these are
// helper boundaries, separate from the natural mission journey below.
test('Convert Wild allocation gates state and duplicates without cancelling existing work', () => {
  const ai = createComputerQueue()
  assert.equal(requestConvertTask(ai, 4, 0), false)
  assert.equal(requestConvertTask(ai, 0, 1), false)
  assert.equal(requestConvertTask(ai, 4, 1), true)
  assert.deepEqual([ai.tasks[0].type, ai.tasks[0].phase, ai.tasks[0].flags], [2, 0, 1])
  ai.tasks[0].phase = 6
  assert.equal(requestConvertTask(ai, 0, 1), false)
  assert.equal(requestConvertTask(ai, 4, 1), false)
  assert.equal(ai.tasks[0].phase, 6)
  const full = createComputerQueue()
  for (const task of full.tasks) Object.assign(task, { flags: 1, type: 0 })
  assert.equal(requestConvertTask(full, 4, 1), false)
})

test('Convert Wild target retains density, wrap, tie, inclusive radius and list-centroid rules', () => {
  const cases = [
    [0x1010, {}, [], 0, 200, null],
    [0x1010, { 0: 3 }, [], 0, 200, null],
    [0x1010, { 0: 3 }, [[3, 5], [10, 12], [20, 22]], 0, 200, 0x0c0a],
    [0x1010, { 0: 1, 3: 2 }, [[3, 5], [100, 10], [110, 20]], 0, 200, 0x0f69],
    [0x1010, { 1: 1, 3: 1 }, [[40, 12], [100, 10]], 0, 200, 0x0c28],
    [0x1030, { 0: 1, 2: 1 }, [[10, 10], [70, 10]], 0, 200, 0x0a0a],
    [0x1000, { 0: 1, 7: 1 }, [[10, 10], [240, 10]], 0, 200, 0x0a0a],
    [0x1010, { 1: 1 }, [[40, 12]], 0, 32, 0x0c28],
    [0x1010, { 1: 1 }, [[40, 12]], 0, 31, null],
    [0x1010, { 1: 1 }, [[40, 12]], 32, 200, 0x0c28],
    [0x1010, { 1: 1 }, [[40, 12]], 33, 200, null],
  ]
  for (const [origin, sparse, people, minimum, maximum, expected] of cases) {
    const counts = Uint8Array.from({ length: 64 }, (_, i) => sparse[i] ?? 0)
    assert.equal(findConvertTarget(origin, counts, people.map(([x, y]) => ({ x: (x << 8) | 127, y: (y << 8) | 201 })), minimum, maximum), expected)
  }
})

test('Convert Wild standability preserves initial target and tries only the first24 spiral positions', () => {
  const category = rules.terrainCategoryFlags.findIndex(flags => flags & 1)
  const land = { flags: new Uint16Array(16384), categories: new Uint8Array(16384).fill(category), walkMasks: [new Uint8Array(8192).fill(255)] }
  const index = cell => ((cell >>> 9) * 128) + ((cell & 255) >>> 1)
  for (const target of [0x52dc, 0xffff]) {
    land.flags.fill(0)
    assert.equal(standableConvertTarget(target, land), target)
    land.flags.fill(4)
    const last = spiralCell(target, 23, 0)
    land.flags[index(last)] = 0
    assert.equal(standableConvertTarget(target, land), last)
    land.flags.fill(4)
    land.flags[index(spiralCell(target, 24, 0))] = 0
    assert.equal(standableConvertTarget(target, land), null)
  }
})

test('Mission3 active type2 advances after allocation state is switched off', () => {
  const world = createWorld(3)
  for (const task of world.ai.tasks) task.flags = 0
  assert.equal(requestConvertTask(world.ai, 4, 1), true)
  world.ai.tasks[0].phase = 6
  world.ai.states &= ~4
  world.ai.cursor = 0
  world.turn = 1
  const seed = world.randomState
  stepComputerTasks(world, 2)
  assert.equal(world.ai.tasks[0].phase, 7)
  assert.ok(world.ai.tasks[0].flags & 1)
  assert.equal(typeof seed, 'number')
  assert.equal(world.randomState, seed)
})
