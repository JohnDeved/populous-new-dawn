import assert from 'node:assert/strict'
import test from 'node:test'
import { advanceSkyMotion } from '../app/sky-motion.ts'
import { createSkyMotion, updateSkyArray } from '../app/sky.ts'

test('continuous sky retains native wind rates and is invariant to segment subdivision', () => {
  const native = createSkyMotion(), modern = createSkyMotion(), camera = { x: 0, y: 0, angle: 0 }
  updateSkyArray(native, camera, 8 * 64, new Int32Array(4992))
  advanceSkyMotion(modern, camera, .008)
  assert.equal(modern.x, native.x)
  assert.equal(modern.y, native.y)
  assert.deepEqual([modern.x, modern.y], [17, 9])
  for (const [dx, dy, turn] of [[0, 0, 0], [7000, -9000, 0], [0, 0, 900], [7000, -9000, 900], [-8000, 6000, -900]]) {
    const start = { ...createSkyMotion(), x: 50, y: 60000, angle: 1200, previousX: 65000, previousY: 300, previousAngle: 2040 },
      at = t => ({ x: 65000 + dx * t / 4, y: 300 + dy * t / 4, angle: 2040 + turn * t / 4 }),
      expected = { ...start }
    advanceSkyMotion(expected, at(4), 4)
    for (const hz of [5, 30, 60, 120, 144, 240, 0]) {
      const actual = { ...start }
      let time = 0, frame = 0
      while (time < 4 - 1e-9) {
        const dt = Math.min(4 - time, hz ? 1 / hz : [.007, .013, .28, .6, .1][frame++ % 5])
        time += dt
        advanceSkyMotion(actual, at(time), dt)
      }
      for (const key of Object.keys(actual))
        assert.ok(Math.abs(actual[key] - expected[key]) < 2e-7, JSON.stringify({ dx, dy, turn, hz, key, actual, expected }))
    }
  }
  const long = createSkyMotion()
  advanceSkyMotion(long, camera, 3600)
  assert.equal(long.x, (2125 * 3600) % 65536)
  assert.equal(long.y, (1125 * 3600) % 65536)
  for (const dt of [-1, NaN, Infinity]) {
    const before = { ...long }
    assert.throws(() => advanceSkyMotion(long, camera, dt), RangeError)
    assert.deepEqual(long, before)
  }
})
