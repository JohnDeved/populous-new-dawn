import assert from 'node:assert/strict'
import test from 'node:test'
import { reachPauseKeyboardFocus } from '../scripts/local-render/original-pause-checkpoint-style.mjs'

function fixture(states) {
  let tabs = 0, reads = 0
  const controller = new AbortController()
  const page = { keyboard: { async press(key) { assert.equal(key, 'Tab'); tabs++ } } }
  const target = {
    async evaluateAll(predicate) {
      reads++
      const state = states[Math.min(tabs, states.length - 1)]
      const node = { matches(selector) { assert.equal(selector, ':focus-visible'); return state.visible } }
      // Execute the production DOM predicate; do not replace it with a boolean
      // that could hide accidentally dropping the real focus-visible condition.
      return new Function('document', `return (${predicate})([document.target])`)(
        { target: node, activeElement: state.active ? node : {} })
    },
    focus() { assert.fail('Keyboard traversal must not synthesize focus') },
  }
  return { page, target, controller, reach: () => reachPauseKeyboardFocus(page, target, controller.signal),
    tabs: () => tabs, reads: () => reads }
}
const keyboard = { active: true, visible: true }, absent = { active: false, visible: false }

test('pause fullscreen retains genuine visible keyboard focus without a redundant Tab cycle', async () => {
  const f = fixture([keyboard])
  assert.equal(await f.reach(), 0)
  assert.equal(f.tabs(), 0)
  assert.equal(f.reads(), 1)
})

test('pause fullscreen initial entry traverses real Tabs until the exact target is visibly focused', async () => {
  const f = fixture([absent, { active: false, visible: true }, keyboard])
  assert.equal(await f.reach(), 2)
  assert.equal(f.tabs(), 2)
  assert.equal(f.reads(), 3)
})

test('pause fullscreen reacquires keyboard focus when a later resize or panel transition loses it', async () => {
  const states = [keyboard, keyboard]
  const f = fixture(states)
  assert.equal(await f.reach(), 0)
  states[0] = absent
  assert.equal(await f.reach(), 1)
  assert.equal(f.tabs(), 1)
})

test('a pointer-focused fullscreen target does not bypass genuine keyboard traversal', async () => {
  const f = fixture([{ active: true, visible: false }, absent, keyboard])
  assert.equal(await f.reach(), 2)
  assert.equal(f.tabs(), 2)
})

test('pause keyboard traversal has an exact 32-Tab bound and accepts the last allowed Tab', async () => {
  const failure = fixture([absent])
  await assert.rejects(failure.reach(), /within 32 Tab presses/)
  assert.equal(failure.tabs(), 32)
  assert.equal(failure.reads(), 33)
  const success = fixture([...Array(32).fill(absent), keyboard])
  assert.equal(await success.reach(), 32)
})

test('pause keyboard traversal preserves an initial episode abort without reading or sending keys', async () => {
  const f = fixture([absent]), reason = new Error('Episode already expired')
  f.controller.abort(reason)
  await assert.rejects(f.reach(), error => error === reason)
  assert.equal(f.reads(), 0)
  assert.equal(f.tabs(), 0)
})

test('a focus observation settling after episode abort cannot dispatch a late Tab or report success', async () => {
  for (const state of [absent, keyboard]) {
    const f = fixture([state]), reason = new Error('Episode expired during focus observation')
    const evaluate = f.target.evaluateAll
    f.target.evaluateAll = async predicate => {
      const result = await evaluate(predicate)
      f.controller.abort(reason)
      return result
    }
    await assert.rejects(f.reach(), error => error === reason)
    assert.equal(f.reads(), 1)
    assert.equal(f.tabs(), 0)
  }
})
