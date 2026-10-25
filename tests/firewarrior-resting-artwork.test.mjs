import assert from 'node:assert/strict'
import test from 'node:test'
import units from '../app/original-units.json' with { type: 'json' }
import rules from '../app/original-rules.json' with { type: 'json' }

// Original object163 -> VSTART720, with the original mirror aliases. These
// source-frame identities are independent of the appended browser frame indices.
const firstFrames = [3707, 3721, 3735, 3749, 3763, 3749, 3735, 3721]

test('native Firewarrior resting source720 resolves its actual original frames', () => {
  assert.deepEqual(rules.animationObjects[163], [720, 18])
  const descriptor = rules.animationDescriptors[18]
  assert.deepEqual(
    [descriptor.mode, descriptor.step, descriptor.person, descriptor.variant],
    [2, 1, 2, 1]
  )
  for (const team of ['blue', 'red']) {
    const animations = units.animations[`${team}-firewarrior`]
    const directions = Object.values(animations).find(rows => rows[0].source === 720)
    assert.ok(directions, `${team} native source720 must bypass named-pose fallback`)
    assert.equal(directions, animations.restingGesture)
    assert.equal(animations.idleGesture[0].source, 728, 'keep the established728 entry')
    assert.equal(directions.length, 8)
    for (const [direction, cycle] of directions.entries()) {
      assert.equal(cycle.source, 720 + direction)
      assert.equal(cycle.flip, direction >= 5)
      assert.equal(cycle.frames.length, 14)
      assert.equal(units.frameCounts[cycle.source], 14)
      assert.deepEqual(cycle.frames.map(index => units.frames[index].source),
        Array.from({ length: 14 }, (_, frame) => firstFrames[direction] + frame))
    }
  }
  assert.deepEqual(units.animations['blue-firewarrior'].restingGesture,
    units.animations['red-firewarrior'].restingGesture,
    'the current tribe and descriptor choose overlays, not another VSTART family')
})
