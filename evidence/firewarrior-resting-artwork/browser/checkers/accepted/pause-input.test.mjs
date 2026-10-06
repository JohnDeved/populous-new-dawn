import assert from 'node:assert/strict'
import test from 'node:test'
import { requirePauseInput } from './pause-input.mjs'

const detected = { now: 100, turn: 800, object: 720, draw: 18, f1: 0, f2: 2, counter: 32 }
function delivered() {
  const point = { x: 65, y: 980 }
  const event = (type, paused) => ({ type, trusted: true, button: 0, ...point,
    targetMatches: true, pointOwned: true, sceneWorldSame: true, nativeOwnerSame: true,
    sourceIsNative: true, now: 110, turn: 801, paused, object: 720, draw: 18, f1: 1, f2: 3, counter: 33 })
  return { point, events: [event('pointerdown', false), event('pointerup', false), event('click', true)] }
}
test('only the complete trusted public Pause input proves the frozen phase', () => {
  assert.equal(requirePauseInput(delivered(), detected).click.paused, true)
})
test('synthetic, wrong-target and moved-owner traces are rejected', () => {
  for (const field of ['trusted', 'targetMatches', 'pointOwned', 'nativeOwnerSame', 'sourceIsNative']) {
    const trace = delivered(); trace.events[1][field] = false
    assert.throws(() => requirePauseInput(trace, detected), field)
  }
})
test('missing click, repeated release and unchanged pause state are rejected', () => {
  const missing = delivered(); missing.events.pop()
  assert.throws(() => requirePauseInput(missing, detected))
  const repeated = delivered(); repeated.events.splice(2, 0, { ...repeated.events[1] })
  assert.throws(() => requirePauseInput(repeated, detected))
  const running = delivered(); running.events[2].paused = false
  assert.throws(() => requirePauseInput(running, detected))
})
test('late phase and clock/phase movement across the pause handler are rejected', () => {
  const late = delivered(); late.events[1].f2 = late.events[2].f2 = 7
  assert.throws(() => requirePauseInput(late, detected))
  const advanced = delivered(); advanced.events[2].turn++
  assert.throws(() => requirePauseInput(advanced, detected))
})
