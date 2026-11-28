import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { showMessageBox } from '../app/campaign-message-modal.ts'
import { addMessage, createMessages, stepMessages } from '../app/messages.ts'

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

const toggleCode = extract('onToggle={', '\n                }')
function disclosureFixture() {
  const world = { messages: createMessages() }
  const slot = addMessage(world.messages, 641, () => 0)
  const message = world.messages.slots[slot]
  const shownSlot = addMessage(world.messages, 642, () => 0)
  const shown = world.messages.slots[shownSlot]
  const staleBox = { open: true }, currentBox = { open: true }
  const owners = new Map([[message.serial, staleBox], [shown.serial, currentBox]])
  let currentWorld = world
  let synced = 0
  const bindings = { message, world, slot, messageDetails: { current: owners },
    store: { getWorld: () => currentWorld }, showMessageBox,
    syncMessageModal: () => { synced++ } }
  const callback = new Function(...Object.keys(bindings), `return ${toggleCode}`)(...Object.values(bindings))
  return { world, message, slot, staleBox, currentBox, owners,
    replaceWorld: value => { currentWorld = value },
    run: () => { callback({ currentTarget: staleBox }); return synced } }
}

test('a queued disclosure from a just-expired message cannot close the live message', () => {
  const f = disclosureFixture()
  f.message.lifetime = 1
  stepMessages(f.world.messages)
  assert.equal(f.world.messages.slots[f.slot], null, 'real presentation step retired the message')
  const synced = f.run()
  assert.equal(f.currentBox.open, true, 'the real one-box operation must not retire the current one')
  assert.equal(synced, 0, 'obsolete toggle must not synchronize the visible modal')
})

for (const changed of ['world', 'element']) {
  test(`queued disclosure from a replaced ${changed} cannot own the modal`, () => {
    const f = disclosureFixture()
    if (changed === 'world') f.replaceWorld({ messages: f.world.messages })
    else f.owners.set(f.message.serial, { open: false })
    const synced = f.run()
    assert.equal(f.currentBox.open, true, changed)
    assert.equal(synced, 0, changed)
  })
}

test('current disclosure replaces the previous box and still syncs on close', () => {
  const f = disclosureFixture()
  assert.equal(f.run(), 1)
  assert.equal(f.currentBox.open, false)
  assert.equal(f.staleBox.open, true)
  f.staleBox.open = false
  assert.equal(f.run(), 2)
})
