import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'

// Execute the actual source callbacks with supplied store/DOM leaves, not React.
const source = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
function extract(start, end) {
  assert.equal(source.split(start).length, 2)
  const offset = source.indexOf(start) + start.length
  const code = source.slice(offset, source.indexOf(end, offset)).trim() + '}'
  return stripTypeScriptTypes(`(${code})`)
}
const focusCode = extract('aria-label="Read campaign message"\n                  onClick={', '\n                  }')
const dismissCode = extract('<button\n                    onClick={', '\n                    }')
function fixture() {
  const message = { serial: 9, stringId: 641, view: { cell: 7 } }
  const world = { messages: { slots: [message] } }
  let current = world
  const engine = { current: { world, focus: (...args) => events.push(['focus', ...args]) } }
  const events = [], details = { open: false }
  const event = { currentTarget: { parentElement: details }, preventDefault: () => events.push(['preventDefault']) }
  const bindings = { message, world, slot: 0, engine, store: { getWorld: () => current },
    messageViewPoint: value => value.view ? { x: 3, z: 4 } : null,
    removeMessage: (state, slot) => { state.slots[slot] = null; events.push(['remove']) },
    update: () => events.push(['update']) }
  const evaluate = code => new Function(...Object.keys(bindings), `return ${code}`)(...Object.values(bindings))
  return { message, world, engine, events, details, event,
    replaceWorld: value => { current = value }, focus: evaluate(focusCode), dismiss: evaluate(dismissCode) }
}
for (const action of ['focus', 'dismiss']) {
  test(`${action} rejects replaced or expired slot, including matching serial`, () => {
    for (const replacement of [null, { serial: 9, stringId: 641, view: { cell: 7 } }]) {
      const f = fixture(); f.world.messages.slots[0] = replacement
      f[action](f.event)
      assert.equal(f.world.messages.slots[0], replacement)
      assert.deepEqual(f.events, action === 'focus' ? [['preventDefault']] : [])
    }
  })
  test(`${action} rejects replaced world even with shared message identity`, () => {
    const f = fixture(); f.replaceWorld({ messages: { slots: [f.message] } })
    f[action](f.event)
    assert.equal(f.world.messages.slots[0], f.message)
    assert.deepEqual(f.events, action === 'focus' ? [['preventDefault']] : [])
  })
}
test('current dismissal removes only its current slot and publishes once', () => {
  const f = fixture(); f.dismiss()
  assert.equal(f.world.messages.slots[0], null)
  assert.deepEqual(f.events, [['remove'], ['update']])
  f.dismiss(); assert.equal(f.events.length, 2)
})
test('focus ignores absent or foreign scene while retaining current disclosure', () => {
  for (const scene of [null, { world: {} }]) {
    const f = fixture(); f.engine.current = scene; f.focus(f.event)
    assert.deepEqual(f.events, [])
    f.details.open = true; f.focus(f.event); assert.deepEqual(f.events, [])
    f.details.open = false; delete f.message.view; f.focus(f.event); assert.deepEqual(f.events, [])
  }
})
test('current unopened message focuses normally; closing and text-only messages do not', () => {
  const f = fixture(); f.focus(f.event)
  assert.deepEqual(f.events, [['focus', { x: 3, z: 4 }, { animate: true }]])
  f.events.length = 0; f.details.open = true; f.focus(f.event); assert.deepEqual(f.events, [])
  f.details.open = false; delete f.message.view; f.focus(f.event); assert.deepEqual(f.events, [])
})
