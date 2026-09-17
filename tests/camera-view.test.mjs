import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cameraPreset } from '../app/projection.ts'
import {
  zoomPreset,
  viewTransitionFrames,
  stepViewTransition,
  previewViewTransition,
} from '../app/camera-view.ts'

const fields = [
  'curvature',
  'scale',
  'pitch',
  'perspective',
  'depth',
  'spriteScale',
  'shamanScale',
  'horizon',
  'offsetX',
  'offsetY',
]
const pairs = [
  [0, 3],
  [3, 0],
  [0, 2],
  [2, 0],
  [2, 4],
  [4, 2],
]
const copy = value => structuredClone(value)

test('zoom retains native preset bounds and the existing 18-step timer', () => {
  assert.equal(viewTransitionFrames(24), 18)
  assert.deepEqual(
    [3, 0, 2, 4].map(p => zoomPreset(p, true)),
    [3, 3, 0, 2]
  )
  assert.deepEqual(
    [3, 0, 2, 4].map(p => zoomPreset(p, false)),
    [0, 2, 4, 4]
  )
})

test('render previews do not mutate native state and meet every committed step across all resolution tables', () => {
  for (let index = 0; index < 10; index++)
    for (const [from, to] of pairs) {
      const current = cameraPreset(index, from),
        target = cameraPreset(index, to),
        targetBefore = copy(target)
      const frames = viewTransitionFrames(24)
      for (let remaining = frames; remaining > 0; remaining--) {
        const before = copy(current),
          next = copy(current)
        stepViewTransition(next, target, remaining, frames)
        for (const fraction of [0, 1 / 6, 0.5, 5 / 6, 1]) {
          const preview = previewViewTransition(current, target, remaining, frames, fraction)
          assert.deepEqual(current, before)
          assert.deepEqual(target, targetBefore)
          if (fraction === 0) assert.deepEqual(preview, before)
          else if (fraction === 1) assert.deepEqual(preview, next)
          else {
            for (const field of fields) {
              assert.equal(
                preview[field],
                Math.round(before[field] + (next[field] - before[field]) * fraction)
              )
              assert.ok(Number.isInteger(preview[field]), field)
            }
            for (const field of [
              'bounds',
              'boundsMode',
              'diameter',
              'scaledSprites',
              'width',
              'height',
            ])
              assert.deepEqual(
                preview[field],
                before[field],
                field + ' changes only at its native boundary'
              )
          }
        }
        stepViewTransition(current, target, remaining, frames)
        assert.deepEqual(current, next)
      }
      assert.deepEqual(current, target)
      assert.deepEqual(previewViewTransition(current, target, 0, frames, 0.5), target)
    }
})

test('30/60/120/144 Hz and irregular preview schedules retain duration and every owned native configuration', () => {
  for (const hz of [30, 60, 120, 144, 0])
    for (const [from, to] of pairs) {
      const current = cameraPreset(5, from),
        target = cameraPreset(5, to),
        oracle = copy(current)
      const frames = viewTransitionFrames(24),
        pattern = hz ? [1 / hz] : [1 / 144, 0.013, 0.11, 1 / 30, 0.007]
      let left = frames,
        accumulator = 0,
        time = 0,
        sample = 0,
        steps = 0
      while (time < 0.75 - 1e-9) {
        const dt = Math.min(0.75 - time, pattern[sample++ % pattern.length])
        time += dt
        accumulator += dt
        while (accumulator + 1e-9 >= 1 / 24) {
          stepViewTransition(oracle, target, left, frames)
          left = stepViewTransition(current, target, left, frames)
          steps++
          accumulator = Math.max(0, accumulator - 1 / 24)
          assert.deepEqual(current, oracle)
        }
        const before = copy(current)
        previewViewTransition(current, target, left, frames, accumulator * 24)
        assert.deepEqual(
          current,
          before,
          'sampling must not feed a fraction into the native recurrence'
        )
        if (time < 0.75 - 1e-9) assert.ok(left > 0)
      }
      assert.equal(steps, 18)
      assert.equal(left, 0)
      assert.deepEqual(current, target)
    }
})
