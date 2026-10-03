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

test('live Mission3 adapters rotate an eligible Convert Wild producer behind training', () => {
  const { world, school } = competingProducers()
  const first = opportunity(world, 61)
  assert.equal(first.length, 1)
  assert.equal(first[0].type, 2)
  // Stand in for completion of the preceding task, isolating producer scheduling.
  first[0].flags = 0
  const second = opportunity(world, 125)
  assert.equal(second.length, 1)
  assert.deepEqual([second[0].type, second[0].target], [6, school.id])
})

test('producer table preserves singleton priority, one stable pass, and signed counts', async () => {
  const { createComputerQueue, produceComputerTasks } = await import('../app/computer.ts')
  const ai = createComputerQueue(), calls = []
  produceComputerTasks(ai, (id, slot) => { calls.push([id, slot]); return id === 0 })
  assert.deepEqual(calls, [[1, 0], [0, 0]])
  assert.deepEqual(ai.producers.map(p => p.id), [1, 3, 4, 5, 6, 7, 8, 9, 2, 11, 0, 10])
  produceComputerTasks(ai, id => id === 1)
  assert.equal(ai.producers[0].id, 1)
  assert.equal(ai.producers[0].attempts, 2)
  const descending = createComputerQueue()
  descending.producers.forEach((p, i) => { p.attempts = i > 0 && i < 11 ? 10 - i : 0 })
  produceComputerTasks(descending, id => id === 1)
  assert.deepEqual(descending.producers.slice(1, 11).map(p => p.attempts), [8, 7, 6, 5, 4, 3, 2, 1, 0, 9])
  const overflow = createComputerQueue()
  overflow.producers[1].attempts = 2147483647
  produceComputerTasks(overflow, id => id === 0)
  assert.deepEqual(overflow.producers[1], { id: 0, attempts: -2147483648, group: 10 })
})

test('producer capacity is checked before callbacks and after pre-table allocation', async () => {
  const { createComputerQueue, produceComputerTasks } = await import('../app/computer.ts')
  const ai = createComputerQueue(), initial = structuredClone(ai.producers)
  for (const task of ai.tasks) task.flags = 1
  produceComputerTasks(ai, () => assert.fail('full table'), () => assert.fail('full pre-table'))
  assert.deepEqual(ai.producers, initial)
  ai.tasks[6].flags = 0
  produceComputerTasks(ai, () => assert.fail('last slot consumed'), slot => {
    assert.equal(slot, 6); ai.tasks[slot].flags = 1; return true
  })
  assert.deepEqual(ai.producers, initial)
  ai.tasks[2].flags = ai.tasks[8].flags = 0
  produceComputerTasks(ai, (id, slot) => {
    assert.deepEqual([id, slot], [1, 8]); return true
  }, slot => {
    assert.equal(slot, 2); ai.tasks[slot].flags = 1; return true
  })
  assert.equal(ai.producers[0].attempts, 1)
})

test('checkpoint migration retains producer history and initializes each legacy AI independently', async () => {
  const { migrateCheckpoint } = await import('../app/game-store.ts')
  const { createComputerQueue } = await import('../app/computer.ts')
  const { world } = competingProducers()
  opportunity(world, 61)
  const resumed = migrateCheckpoint(structuredClone(world))
  assert.deepEqual(resumed.ai.producers, world.ai.producers)
  for (const w of [world, resumed]) {
    for (const task of w.ai.tasks) task.flags = 0
    opportunity(w, 125)
  }
  assert.deepEqual(resumed.ai, world.ai)
  assert.equal(resumed.randomState, world.randomState)
  const legacy = createWorld(3)
  delete legacy.ai.producers
  // A second independently stored AI validates migration without shared arrays.
  legacy.campaignAIs[1] = { ...structuredClone(legacy.ai), ...createComputerQueue() }
  delete legacy.campaignAIs[1].producers
  const migrated = migrateCheckpoint(legacy)
  assert.equal(migrated.ai.producers.length, 12)
  assert.deepEqual(migrated.ai.producers, migrated.campaignAIs[1].producers)
  assert.notEqual(migrated.ai.producers, migrated.campaignAIs[1].producers)
})

test('authored early producer opportunities record native table attempts without changing later missions', async () => {
  const { tick } = await import('../app/model.ts')
  for (const level of [1, 2, 3]) {
    const world = createWorld(level)
    while (world.turn < 140) tick(world, 1 / 12)
    assert.equal(world.ai.producers[0].id, 1)
    assert.equal(world.ai.producers[0].attempts, 2, `mission ${level}`)
    if (level === 3) assert.equal(world.ai.producers.find(p => p.id === 0).attempts, 1)
    assert.equal(world.status, 'playing')
  }
  const world = createWorld(6), before = structuredClone(world.ai.producers)
  world.turn = 61
  stepComputerTasks(world, 2)
  assert.deepEqual(world.ai.producers, before)
})
