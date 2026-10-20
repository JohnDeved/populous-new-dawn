import assert from 'node:assert/strict'
import test from 'node:test'
import original from '../app/original-angel.json' with { type: 'json' }
import {
  advanceAngelPresentation,
  angelPosePositions,
  createAngelPresentation,
  latchAngelPose,
  requestAngelBase,
  syncAngelPresentation,
} from '../app/angel-presentation.ts'

// Expected selector/counter vectors below are transcribed from 004de440,
// 0040c9f0, 0040cc30 and 004ee7b0. They do not call the port to produce expectations.
for (const [base, keys, morph, stage] of [
  [62, [63, 64, 65, 66, 67, 68], 4, 3],
  [69, [70, 71, 72, 73, 74, 75], 5, 0],
]) {
  test(`base ${base} displays all twelve original phases before wrapping`, () => {
    const state = createAngelPresentation(base)
    assert.equal(state.stage, stage)
    assert.equal(state.morph, morph)
    assert.equal(state.sourceKey, 0, 'construction has not consumed a native draw')
    assert.equal(state.flags3, 0x100104)
    for (let visit = 0; visit < 25; visit++) {
      const phase = visit % 12, segment = Math.floor(phase / 2)
      advanceAngelPresentation(state)
      assert.deepEqual(state.displayed, {
        base, from: keys[segment], to: keys[(segment + 1) % 6],
        frame: phase % 2, duration: 2, scale: 160,
      })
      assert.equal(state.sourceKey, keys[segment])
      assert.equal(state.f1, (phase + 1) % 12 * 4)
      assert.equal(state.renderFlags, 0x8188)
    }
  })
}

test('all forward and reverse selector stages retain source keys and held restart flags', () => {
  const state = createAngelPresentation()
  advanceAngelPresentation(state)
  assert.equal(state.sourceKey, 70)
  for (const [base, stages, targets] of [
    [62, [1, 2, 3, 4, 5], [76, 77, 77, 78, 78]],
    [69, [4, 3, 2, 1, 0], [78, 77, 77, 76, 76]],
  ]) {
    const source = base === 62 ? 70 : 63
    for (let index = 0; index < stages.length; index++) {
      requestAngelBase(state, base)
      assert.equal(state.stage, stages[index])
      assert.equal(state.object, base === 62 ? 69 : 62)
      assert.equal(state.pendingBase, base)
      assert.equal(state.sourceKey, source)
      assert.equal(state.destinationKey, targets[index])
      assert.equal(state.morphTimer, 0)
      for (let visit = 0; visit < 3; visit++) {
        advanceAngelPresentation(state)
        assert.deepEqual(state.displayed, {
          base: base === 62 ? 69 : 62, from: source, to: targets[index],
          frame: index === 0 ? Math.min(visit, 2) : 2, duration: 2, scale: 160,
        })
        assert.equal(state.morphTimer, (visit + 1) * 4, 'held pose never clamps the counter')
      }
    }
    requestAngelBase(state, base)
    assert.equal(state.object, base)
    assert.equal(state.pendingBase, base)
    assert.equal(state.stage, base === 62 ? 5 : 0)
    assert.equal(state.f1, 0)
    assert.equal(state.renderFlags, 0x8188, 'base install clears transition flags through the ordinary setter')
    advanceAngelPresentation(state)
  }
})

test('unlatched transition defaults to source69 and current-base requests do not cancel it', () => {
  const state = createAngelPresentation()
  requestAngelBase(state, 62)
  assert.equal(state.sourceKey, 69)
  requestAngelBase(state, 69)
  assert.equal(state.pendingBase, 62)
  assert.equal(state.stage, 2)
  assert.equal(state.destinationKey, 77)
  latchAngelPose(state)
  assert.deepEqual(state.displayed, { base: 69, from: 69, to: 77, frame: 0, duration: 2, scale: 160 })
})

test('immediate62 starts stage3 and the reverse visits77,76,76 before base69', () => {
  const state = createAngelPresentation(62)
  for (const [stage, key] of [[2, 77], [1, 76], [0, 76]]) {
    requestAngelBase(state, 69)
    assert.equal(state.stage, stage)
    assert.equal(state.destinationKey, key)
    assert.equal(state.sourceKey, 69, 'fallback is69 even with current base62')
  }
  requestAngelBase(state, 69)
  assert.equal(state.object, 69)
})

test('ordinary display latch owns source-key and 0x800 mutations but not advancement', () => {
  const state = createAngelPresentation()
  state.f1 = 12
  state.holdFrame = 4
  state.renderFlags |= 0xc00
  latchAngelPose(state)
  assert.equal(state.sourceKey, 71)
  assert.equal(state.renderFlags & 0xc00, 0x400)
  assert.equal(state.f1, 12)
  assert.equal(state.displayed.frame, 1)
  latchAngelPose(state)
  assert.equal(state.sourceKey, 72, 'a subsequent held sample uses holdFrame')
  assert.equal(state.displayed.frame, 0)
  advanceAngelPresentation(state)
  assert.equal(state.f1, 12, 'held ordinary counter is not advanced')
})

test('transition restart retains 0x400/0x800 and signed-short counter wrap', () => {
  const state = createAngelPresentation()
  state.renderFlags |= 0xc00
  requestAngelBase(state, 62)
  assert.equal(state.renderFlags & 0x1c00, 0x1c00)
  state.morphTimer = 32764
  advanceAngelPresentation(state)
  assert.equal(state.displayed.frame, 2)
  assert.equal(state.morphTimer, -32768)
  assert.equal(state.renderFlags & 0xc00, 0xc00, 'wrapped negative counter has not hit its completion comparison')
  state.morphTimer = 4
  advanceAngelPresentation(state)
  assert.equal(state.renderFlags & 0xc00, 0x400)
})

test('unsigned ordinary and signed transition sampling remain distinct', () => {
  const state = createAngelPresentation()
  state.f1 = -4
  latchAngelPose(state)
  assert.deepEqual([state.displayed.from, state.displayed.frame], [71, 1])
  requestAngelBase(state, 62)
  state.morphTimer = -4
  latchAngelPose(state)
  assert.equal(state.displayed.frame, -1)
})

test('all base, loop and transition positions use raw short interpolation and base point order', () => {
  for (const base of [62, 69])
    for (const [from, to] of [[69, 76], [70, 71], [75, 70], [63, 64], [68, 63], [73, 77], [74, 78]])
      for (const frame of [-1, 0, 1, 2]) {
        const actual = angelPosePositions({ base, from, to, frame, duration: 2, scale: 160 })
        const expected = original.bases[base].pointIndices.flatMap(index =>
          original.points[from][index].map((start, axis) => {
            const end = original.points[to][index][axis]
            const short = (start + Math.trunc((end - start) * frame / 2) + 32768) & 65535
            return Math.fround((short - 32768) / (axis === 2 ? -480 : 480))
          }))
        assert.deepEqual([...actual], expected)
      }
})

test('compatibility death entry and countdown produce exactly160..10 without altering timers', () => {
  const state = createAngelPresentation()
  const scales = []
  for (let timer = 16; timer > 0; timer--) {
    syncAngelPresentation(state, 'dying', timer)
    advanceAngelPresentation(state)
    scales.push(state.displayed.scale)
  }
  assert.deepEqual(scales, [160, 150, 140, 130, 120, 110, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10])
})

test('independent state and serialized displayed/next poses survive every transition boundary', () => {
  const left = createAngelPresentation(), untouched = createAngelPresentation()
  for (const base of [62, 69]) {
    for (let visit = 0; visit < 18; visit++) {
      if (visit % 3 === 0) requestAngelBase(left, base)
      const restored = structuredClone(left)
      advanceAngelPresentation(left)
      advanceAngelPresentation(restored)
      assert.deepEqual(restored, left)
      assert.deepEqual(untouched, createAngelPresentation())
    }
  }
})
