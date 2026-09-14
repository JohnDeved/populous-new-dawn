import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'

test('Mission 3 starts its original recurring-script flyby through ordinary turns', () => {
  const world = createWorld(3)
  for (let turn = 0; turn < 15; turn++) tick(world, 1 / 12)
  assert.equal(world.flyby.flags & 1, 0)

  tick(world, 1 / 12)
  assert.equal(world.turn, 16)
  assert.equal(world.flyby.flags & 1, 1)
  assert.equal(world.inputMask & 64, 64)
  assert.equal(world.flyby.warmup, 6)
  assert.equal(world.flyby.events.length, 22)
  assert.deepEqual(world.flyby.end, { x: 42, y: 166, angle: 1144, zoom: 0 })
  assert.equal(world.ai.variables[24], 1)

  for (let turn = 0; turn < 2048; turn++) tick(world, 1 / 12)
  assert.equal(world.status, 'playing')
  assert.equal(world.flyby.events.length, 22)
})
