import assert from 'node:assert/strict'
import test from 'node:test'
import { dragCamera } from '../app/camera-input.ts'

// The supplied port's pure camera function only; no World, browser or native run.
test('sixteen integer32px right-drag steps yield one quarter-turn without pan or retained momentum', () => {
  for (const angle of [0, 512, 1549, 2047]) {
    const camera = { x: 40192, y: 23808, angle }, velocity = { turn: 0, forward: 0, side: 0 }
    for (let i = 0; i < 16; i++) {
      dragCamera(camera, velocity, true, 32, 0)
      assert.deepEqual(velocity, { turn: 0, forward: 0, side: 0 })
      assert.equal(camera.x, 40192); assert.equal(camera.y, 23808)
    }
    assert.equal(camera.angle, (angle + 512) & 2047)
  }
})

test('rotation ignores vertical drag and fractional deltas would not prove the declared512 step', () => {
  const camera = { x: 40192, y: 23808, angle: 1549 }, velocity = { turn: 0, forward: 0, side: 0 }
  dragCamera(camera, velocity, true, 0, 400)
  assert.deepEqual(camera, { x: 40192, y: 23808, angle: 1549 })
  for (let i = 0; i < 12; i++) dragCamera(camera, velocity, true, 512 / 12, 0)
  assert.equal(camera.angle, (1549 + 504) & 2047)
  assert.notEqual(camera.angle, (1549 + 512) & 2047)
})
