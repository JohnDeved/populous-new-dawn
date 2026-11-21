import assert from 'node:assert/strict'
import test from 'node:test'
import { pageEffect, noOp, messageBoxBindings } from './support/follower-nearby-page.mjs'

function keyboard(overrides = {}) {
  const world = { status: 'playing', inputMask: 0, mode: 'hut', selected: [7] }, calls = [], listeners = new Map()
  const bindings = {
    world, ready: true, menu: false, cheatsOpen: false, selectorOpen: false,
    messageDetails: { current: new Map() }, ...messageBoxBindings,
    SPELLS: [], spellHudVisibility: () => 'visible', followerGroupShortcut: () => null,
    store: { getWorld: () => world, change: fn => fn(world) },
    window: { addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) },
    setTab: tab => calls.push(['tab', tab]), engine: { current: { world } },
    audio: { current: null }, update: noOp, openMenu: noOp, cancelInteraction: noOp,
    callToArms: w => calls.push(['call', w]), HOME: {}, tutorialLevel: 79,
    quickCameraAction: () => null, quickCameraTarget: noOp, overviewShortcut: () => null,
    ...overrides,
  }
  pageEffect("window.addEventListener('keydown', key)", bindings)()
  return { world, calls, bindings, key(extra = {}) {
    listeners.get('keydown')({ key: 'b', code: 'KeyB', repeat: false, shiftKey: false, ctrlKey: false,
      altKey: false, metaKey: false, target: { closest: () => false }, preventDefault: noOp,
      stopImmediatePropagation: noOp, ...extra })
  } }
}

test('plain B calls player defensive command without changing palette, mode or selection', () => {
  const k = keyboard(); k.key()
  assert.deepEqual(k.calls, [['call', k.world]])
  assert.equal(k.world.mode, 'hut'); assert.deepEqual(k.world.selected, [7])
})
for (const extra of [{ repeat: true }, { key: 'B', shiftKey: true }, { ctrlKey: true }, { altKey: true }, { metaKey: true }])
  test(`B ignores ${JSON.stringify(extra)}`, () => {
    const k = keyboard(); k.key(extra)
    assert.deepEqual(k.calls, []); assert.equal(k.world.mode, 'hut')
  })
for (const overrides of [{ ready: false }, { menu: true }, { cheatsOpen: true }, { selectorOpen: true }])
  test(`B ignores blocked page ${JSON.stringify(overrides)}`, () => {
    const k = keyboard(overrides); k.key(); assert.deepEqual(k.calls, [])
  })
test('B ignores input masks, stale scene/world and form controls', () => {
  const k = keyboard(); k.world.inputMask = 1; k.key(); assert.deepEqual(k.calls, [])
  k.world.inputMask = 0; k.bindings.engine.current.world = {}; k.key(); assert.deepEqual(k.calls, [])
  k.bindings.engine.current.world = k.world; k.bindings.store.getWorld = () => ({}); k.key(); assert.deepEqual(k.calls, [])
  k.bindings.store.getWorld = () => k.world; k.key({ target: { closest: () => true } }); assert.deepEqual(k.calls, [])
})


test('B is blocked by an open campaign message without closing it', () => {
  const box = { open: true, contains: () => false }
  const k = keyboard({ messageDetails: { current: new Map([[1, box]]) } })
  k.key(); assert.deepEqual(k.calls, []); assert.equal(box.open, true)
  assert.equal(k.world.mode, 'hut'); assert.deepEqual(k.world.selected, [7])
})

test('B is blocked while a campaign message requests a modal before it opens', () => {
  const k = keyboard(); k.world.messages = { slots: [{ flags: 2 }] }
  k.key(); assert.deepEqual(k.calls, []); assert.equal(k.world.messages.slots[0].flags, 2)
  assert.equal(k.world.mode, 'hut'); assert.deepEqual(k.world.selected, [7])
})
