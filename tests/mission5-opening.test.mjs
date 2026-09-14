import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'

test('Mission 5 runs its imported opening flyby once through ordinary turns', () => {
  const world = createWorld(5)
  assert.equal(world.inputMask, 128)
  assert.equal(world.ai.variables[10], 1)

  for (let turn = 0; turn < 15; turn++) tick(world, 1 / 12)
  assert.equal(world.flyby.flags & 1, 0)
  assert.equal(world.inputMask, 128)

  tick(world, 1 / 12)
  assert.equal(world.turn, 16)
  assert.equal(world.flyby.flags & 1, 1)
  assert.equal(world.inputMask, 64)
  assert.equal(world.flyby.warmup, 6)
  assert.deepEqual(
    world.flyby.events.map(({ kind, flags, value, start, duration }) => [
      kind,
      flags,
      value,
      start,
      duration,
    ]),
    [
      [1, 0, 33446, 1, 10], [2, 0, 300, 1, 60], [3, 0, 204, 1, 50],
      [1, 0, 5338, 51, 40], [3, 0, 65460, 55, 70], [2, 0, 1996, 61, 40],
      [1, 0, 15062, 110, 30], [2, 0, 300, 130, 45], [3, 0, 204, 130, 55],
      [3, 0, 0, 190, 30], [2, 0, 1500, 190, 30], [1, 0, 254, 190, 30],
    ]
  )
  assert.deepEqual(world.flyby.end, { x: 254, y: 0, angle: 1500, zoom: 0 })
  assert.equal(world.ai.variables[10], 2)

  const events = world.flyby.events
  for (let turn = 0; turn < 2048; turn++) tick(world, 1 / 12)
  assert.equal(world.flyby.events, events)
  assert.equal(world.flyby.events.length, 12)
})
