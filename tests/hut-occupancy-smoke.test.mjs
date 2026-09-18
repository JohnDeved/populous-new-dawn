import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createHutOccupancySmoke,
  hutOccupancySmokeLayer,
  stepHutOccupancySmoke,
} from '../app/hut-occupancy-smoke.ts'

test('hut occupancy producer samples real occupancy every 32 building turns', () => {
  const state = createHutOccupancySmoke(0, 0, 3, 0)
  stepHutOccupancySmoke(state, 31, 1, 3, 10, () => 31)
  assert.equal(hutOccupancySmokeLayer(state, 10), null)

  stepHutOccupancySmoke(state, 32, 1, 3, 11, () => 31)
  assert.equal(hutOccupancySmokeLayer(state, 11)?.sequence, 'hutSmokePartial')

  stepHutOccupancySmoke(state, 63, 3, 3, 20, () => 31)
  assert.equal(state.root?.mode, 'partial', 'occupancy change waits for the 32-count producer visit')
  stepHutOccupancySmoke(state, 64, 3, 3, 21, () => 31)
  assert.equal(hutOccupancySmokeLayer(state, 21)?.sequence, 'hutSmokeFull')

  stepHutOccupancySmoke(state, 95, 0, 3, 30, () => 31)
  assert.equal(hutOccupancySmokeLayer(state, 30)?.sequence, 'hutSmokeFull')
  stepHutOccupancySmoke(state, 96, 0, 3, 31, () => 31)
  assert.equal(hutOccupancySmokeLayer(state, 31), null)
})

test('partial root uses the native 16-visit visible lifetime and restart draw', () => {
  const state = createHutOccupancySmoke(31, 0, 3, 0),
    draws = []
  stepHutOccupancySmoke(state, 32, 1, 3, 4, () => {
    draws.push(31)
    return 31
  })
  assert.equal(hutOccupancySmokeLayer(state, 4)?.sequence, 'hutSmokePartial')
  assert.deepEqual(draws, [], 'newly allocated root is not processed again that visit')

  stepHutOccupancySmoke(state, 48, 1, 3, 20, () => {
    draws.push(31)
    return 31
  })
  assert.equal(hutOccupancySmokeLayer(state, 20), null)
  assert.equal(draws.length, 0, 'visible partial root consumes no cosmetic RNG')

  stepHutOccupancySmoke(state, 49, 1, 3, 21, () => {
    draws.push(0)
    return 0
  })
  assert.equal(hutOccupancySmokeLayer(state, 21)?.sequence, 'hutSmokePartial')
  assert.deepEqual(draws, [0])
})

test('full root is persistent and does not invent the unresolved child-puff phase', () => {
  const state = createHutOccupancySmoke(63, 2, 3, 0),
    draws = []
  stepHutOccupancySmoke(state, 64, 3, 3, 1, () => {
    draws.push(0)
    return 0
  })
  assert.equal(hutOccupancySmokeLayer(state, 1)?.sequence, 'hutSmokeFull')

  stepHutOccupancySmoke(state, 160, 3, 3, 97, () => {
    draws.push(0)
    return 0
  })
  assert.equal(hutOccupancySmokeLayer(state, 97)?.sequence, 'hutSmokeFull')
  assert.deepEqual(draws, [], 'persistent model-74 root itself has no random visibility schedule')
})

test('all supported residential hut capacities switch partial to full at their native capacity', () => {
  for (const capacity of [3, 4, 5]) {
    const partial = createHutOccupancySmoke(31, 0, capacity, 0)
    stepHutOccupancySmoke(partial, 32, capacity - 1, capacity, 1, () => 31)
    assert.equal(partial.root?.mode, 'partial', 'capacity ' + capacity + ' partial threshold')

    const full = createHutOccupancySmoke(31, 0, capacity, 0)
    stepHutOccupancySmoke(full, 32, capacity, capacity, 1, () => 31)
    assert.equal(full.root?.mode, 'full', 'capacity ' + capacity + ' full threshold')
  }
})

test('visual frames stay on the recovered 16-frame sequences', () => {
  const state = createHutOccupancySmoke(0, 3, 3, 7)
  assert.deepEqual(hutOccupancySmokeLayer(state, 7), {
    sequence: 'hutSmokeFull',
    frame: 0,
  })
  assert.deepEqual(hutOccupancySmokeLayer(state, 22), {
    sequence: 'hutSmokeFull',
    frame: 15,
  })
  assert.deepEqual(hutOccupancySmokeLayer(state, 23), {
    sequence: 'hutSmokeFull',
    frame: 0,
  })
})
