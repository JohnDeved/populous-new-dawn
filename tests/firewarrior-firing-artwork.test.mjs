import assert from 'node:assert/strict'
import test from 'node:test'
import units from '../app/original-units.json' with { type: 'json' }
import rules from '../app/original-rules.json' with { type: 'json' }

const firstFrames = [90, 95, 100, 105, 110, 105, 100, 95]
test('Firewarrior row15 has its own eight-direction five-frame firing family', () => {
  assert.equal(rules.personAnimationObjects[15 * 9 + 6], 94)
  assert.deepEqual(rules.animationObjects[94], [56, 13])
  for (const team of ['blue', 'red']) {
    const animations = units.animations[`${team}-firewarrior`]
    assert.ok(animations.firing, `${team} firing source56 must resolve without fallback`)
    assert.equal(animations.firing.length, 8)
    assert.equal(animations.attack[0].source, 120, 'existing melee attack remains intact')
    assert.equal(animations.restingGesture[0].source, 720)
    assert.equal(animations.idleGesture[0].source, 728)
    for (const [direction, cycle] of animations.firing.entries()) {
      assert.equal(cycle.source, 56 + direction)
      assert.equal(cycle.flip, direction >= 5)
      assert.equal(units.frameCounts[cycle.source], 5)
      assert.deepEqual(cycle.frames.map(index => units.frames[index].source),
        Array.from({ length: 5 }, (_, frame) => firstFrames[direction] + frame))
    }
  }
  assert.deepEqual(units.animations['blue-firewarrior'].firing,
    units.animations['red-firewarrior'].firing, 'the descriptor and tribe select overlays')
})
