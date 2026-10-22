import assert from 'node:assert/strict'
import test from 'node:test'
import { reachPauseKeyboardFocus } from '../scripts/local-render/original-pause-checkpoint-style.mjs'

function fixture(states) {
  let tabs = 0, reads = 0
  const page = { keyboard: { async press(key) { assert.equal(key, 'Tab'); tabs++ } } }
  const target = {
    async evaluate(predicate) {
      reads++
      const state = states[Math.min(tabs, states.length - 1)]
      const node = { matches(selector) { assert.equal(selector, ':focus-visible'); return state.visible } }
      // Execute the production DOM predicate; do not replace it with a boolean
      // that could hide accidentally dropping the real focus-visible condition.
      return new Function('document', `return (${predicate})(document.target)`)(
        { target: node, activeElement: state.active ? node : {} })
    },
    focus() { assert.fail('Keyboard traversal must not synthesize focus') },
  }
  return { page, target, tabs: () => tabs, reads: () => reads }
}
const keyboard = { active: true, visible: true }, absent = { active: false, visible: false }

test('pause fullscreen retains genuine visible keyboard focus without a redundant Tab cycle', async () => {
  const f = fixture([keyboard])
  assert.equal(await reachPauseKeyboardFocus(f.page, f.target), 0)
  assert.equal(f.tabs(), 0)
  assert.equal(f.reads(), 1)
})

test('pause fullscreen initial entry traverses real Tabs until the exact target is visibly focused', async () => {
  const f = fixture([absent, { active: false, visible: true }, keyboard])
  assert.equal(await reachPauseKeyboardFocus(f.page, f.target), 2)
  assert.equal(f.tabs(), 2)
  assert.equal(f.reads(), 3)
})

test('pause fullscreen reacquires keyboard focus when a later resize or panel transition loses it', async () => {
  const states = [keyboard, keyboard]
  const f = fixture(states)
  assert.equal(await reachPauseKeyboardFocus(f.page, f.target), 0)
  states[0] = absent
  assert.equal(await reachPauseKeyboardFocus(f.page, f.target), 1)
  assert.equal(f.tabs(), 1)
})

test('a pointer-focused fullscreen target does not bypass genuine keyboard traversal', async () => {
  const f = fixture([{ active: true, visible: false }, absent, keyboard])
  assert.equal(await reachPauseKeyboardFocus(f.page, f.target), 2)
  assert.equal(f.tabs(), 2)
})

test('pause keyboard traversal has an exact 32-Tab bound and accepts the last allowed Tab', async () => {
  const failure = fixture([absent])
  await assert.rejects(reachPauseKeyboardFocus(failure.page, failure.target), /within 32 Tab presses/)
  assert.equal(failure.tabs(), 32)
  assert.equal(failure.reads(), 33)
  const success = fixture([...Array(32).fill(absent), keyboard])
  assert.equal(await reachPauseKeyboardFocus(success.page, success.target), 32)
})
