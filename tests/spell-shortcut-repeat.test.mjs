import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld } from '../app/world-initialization.ts'
import { SPELLS } from '../app/world-rules.ts'
import { spellHudVisibility } from '../app/spell-visibility.ts'
import { pageEffect, noOp } from './support/follower-nearby-page.mjs'

// Execute the shipped Page effect, not a duplicate keyboard implementation.
function keyboard(overrides = {}) {
  const world = createWorld(1), listeners = new Map(), tabs = []
  world.inputMask = 0 // Ordinary play after the authored introduction.
  const bindings = {
    world, ready: true, menu: false, cheatsOpen: false, SPELLS, spellHudVisibility,
    messageDetails: { current: new Map() },
    store: { getWorld: () => world, change: action => action(world) },
    globalThis: { addEventListener: (name, fn) => listeners.set(name, fn),
      removeEventListener: (name, fn) => { assert.equal(listeners.get(name), fn); listeners.delete(name) } },
    setTab: tab => tabs.push(tab), engine: { current: null }, audio: { current: null },
    update: noOp, openMenu: noOp, cancelInteraction: noOp,
    guardShaman: noOp, select: noOp, HOME: {}, tutorialLevel: 0,
    rotateBuildingPlan: () => false, ...overrides,
  }
  const cleanup = pageEffect("globalThis.addEventListener('keydown', key)", bindings)()
  return { world, tabs, cleanup, listeners, key(extra = {}) {
    listeners.get('keydown')({ key: '1', code: 'Digit1', repeat: false,
      ctrlKey: false, metaKey: false, altKey: false,
      target: { closest: () => false }, preventDefault: noOp, ...extra })
  } }
}

test('holding an available spell shortcut selects once; a fresh press still toggles off', () => {
  const k = keyboard()
  assert.equal(spellHudVisibility(k.world, SPELLS.find(s => s.id === 'blast')), 'visible')
  k.key()
  assert.equal(k.world.mode, 'blast')
  for (let i = 0; i < 3; i++) {
    k.key({ repeat: true })
    assert.equal(k.world.mode, 'blast', 'OS repeats must not disarm the spell')
  }
  assert.deepEqual(k.tabs, ['spells'])
  k.key()
  assert.equal(k.world.mode, null)
  k.key()
  assert.equal(k.world.mode, 'blast')
  k.cleanup()
  assert.equal(k.listeners.size, 0)
})

test('a held spell key cannot rearm after casting or replace another interaction', () => {
  const k = keyboard()
  for (const mode of [null, 'hut', 'lightning']) {
    k.world.mode = mode
    k.key({ repeat: true })
    assert.equal(k.world.mode, mode)
  }
  assert.deepEqual(k.tabs, [])
})

for (const [label, event, bindings] of [
  ['Control', { ctrlKey: true }], ['Meta', { metaKey: true }], ['Alt', { altKey: true }],
  ['numpad', { code: 'Numpad1' }], ['different key', { key: '!' }],
  ['input or dialog', { target: { closest: selector => selector === 'input,dialog' } }],
  ['not ready', {}, { ready: false }], ['menu open', {}, { menu: true }],
  ['testing menu open', {}, { cheatsOpen: true }],
  ['campaign popup open', {}, { messageDetails: { current: new Map([[0, { open: true }]]) } }],
]) test(`spell shortcut preserves ${label} exclusion`, () => {
  const k = keyboard(bindings)
  k.key(event)
  assert.equal(k.world.mode, null)
  assert.deepEqual(k.tabs, [])
})

test('input masks and native availability gates remain authoritative', () => {
  const k = keyboard()
  k.world.inputMask = 1
  k.key()
  assert.equal(k.world.mode, null)
  k.world.inputMask = 0
  k.world.manaWorld.gameFlags |= 32
  k.key()
  assert.equal(k.world.mode, null)
  k.world.manaWorld.gameFlags &= ~32
  k.world.shots.blast = 0
  const tribe = k.world.manaWorld.playerTribe
  const owner = k.world.manaTribes[tribe].spellOwner
  k.world.manaWorld.spells[owner].available &= ~(1 << 2)
  k.key()
  assert.equal(k.world.mode, null)
  assert.deepEqual(k.tabs, [])
})

test('Space still pauses once per press, and continuous focus routing is unchanged', () => {
  let focuses = 0
  const k = keyboard({ engine: { current: { focus: () => focuses++ } } })
  const paused = k.world.paused
  k.key({ key: ' ', code: 'Space' })
  assert.equal(k.world.paused, !paused)
  k.key({ key: ' ', code: 'Space', repeat: true })
  assert.equal(k.world.paused, !paused)
  for (const repeat of [false, true]) k.key({ key: 'f', code: 'KeyF', repeat })
  assert.equal(focuses, 2)
})
