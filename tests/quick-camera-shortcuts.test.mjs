import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld } from '../app/world-initialization.ts'
import { SPELLS } from '../app/world-rules.ts'
import { spellHudVisibility } from '../app/spell-visibility.ts'
import { browserPosition } from '../app/world-coordinates.ts'
import {
  REINCARNATION_CAMERA_ACTION,
  SHAMAN_CAMERA_ACTION,
  quickCameraAction,
  quickCameraTarget,
} from '../app/quick-camera-shortcuts.ts'
import { pageEffect, noOp } from './support/follower-nearby-page.mjs'

// Native default records 005d622c (DIK 0x34 -> action 0x5d) and 005d63a0
// ('h' -> action 0x96): press only, exact empty modifier mask, no predicate.
// Execute the shipped Page keyboard effect rather than a copied dispatcher.
function keyboard(overrides = {}) {
  const world = createWorld(1), listeners = new Map(), focuses = []
  world.inputMask = 0
  const bindings = {
    world, ready: true, menu: false, cheatsOpen: false, selectorOpen: false,
    messageDetails: { current: new Map() }, SPELLS, spellHudVisibility,
    store: { getWorld: () => world, change: action => action(world) },
    window: { addEventListener: (name, fn) => listeners.set(name, fn),
      removeEventListener: (name, fn) => { assert.equal(listeners.get(name), fn); listeners.delete(name) } },
    setTab: noOp, engine: { current: { focus: (target, options) => focuses.push({ target, options }) } },
    audio: { current: null }, update: noOp, openMenu: noOp, cancelInteraction: noOp,
    guardShaman: noOp, HOME: {}, tutorialLevel: 0, rotateBuildingPlan: () => false,
    quickCameraAction, quickCameraTarget, ...overrides,
  }
  const cleanup = pageEffect("window.addEventListener('keydown', key)", bindings)()
  return { world, focuses, cleanup, key(extra = {}) {
    let prevented = false
    listeners.get('keydown')({ key: '.', code: 'Period', repeat: false,
      ctrlKey: false, metaKey: false, altKey: false, shiftKey: false,
      target: { closest: () => false }, preventDefault: () => { prevented = true }, ...extra })
    return prevented
  } }
}

const blueShaman = world => world.units.find(u => u.team === 'blue' && u.kind === 'shaman')

test('native records map period and H to the two camera actions with no modifiers or repeats', () => {
  assert.equal(quickCameraAction({ key: '.', code: 'Period', repeat: false }), SHAMAN_CAMERA_ACTION)
  assert.equal(quickCameraAction({ key: 'h', code: 'KeyH', repeat: false }), REINCARNATION_CAMERA_ACTION)
  for (const extra of [{ repeat: true }, { shiftKey: true }, { ctrlKey: true }, { altKey: true }, { metaKey: true }]) {
    assert.equal(quickCameraAction({ key: '.', code: 'Period', repeat: false, ...extra }), null)
    assert.equal(quickCameraAction({ key: 'h', code: 'KeyH', repeat: false, ...extra }), null)
  }
  assert.equal(quickCameraAction({ key: '.', code: 'NumpadDecimal', repeat: false }), null)
  assert.equal(quickCameraAction({ key: 'f', code: 'KeyF', repeat: false }), null)
})

test('period focuses the live Shaman without changing selection or commands', () => {
  const k = keyboard(), shaman = blueShaman(k.world)
  assert.ok(shaman)
  k.world.selected = []
  const before = structuredClone({ selected: k.world.selected, orders: k.world.orders, units: k.world.units.length })
  assert.equal(k.key(), true)
  assert.deepEqual(k.focuses, [{ target: { x: shaman.x, z: shaman.z }, options: { animate: true } }])
  assert.deepEqual({ selected: k.world.selected, orders: k.world.orders, units: k.world.units.length }, before)
  k.key({ repeat: true })
  assert.equal(k.focuses.length, 1, 'held period does not refocus')
  shaman.hp = 0
  k.key()
  assert.equal(k.focuses.length, 1, 'no Shaman means no camera action and no HOME fallback')
  k.cleanup()
})

test('H focuses the player reincarnation site instead of selecting the Shaman', () => {
  const k = keyboard(), site = k.world.reincarnationSites[0]
  assert.ok(site, 'Mission 1 seeds the blue reincarnation site')
  k.world.selected = []
  assert.equal(k.key({ key: 'h', code: 'KeyH' }), true)
  assert.deepEqual(k.focuses, [{ target: browserPosition(site), options: { animate: true } }])
  assert.deepEqual(k.world.selected, [])
  k.key({ key: 'H', code: 'KeyH', shiftKey: true })
  assert.equal(k.focuses.length, 1, 'Shift+H does not match the exact native modifier mask')
  k.world.reincarnationSites[0] = null
  k.key({ key: 'h', code: 'KeyH' })
  assert.equal(k.focuses.length, 1, 'an absent site produces no camera action')
  k.cleanup()
})

test('existing gates still own the quick camera keys', () => {
  for (const [bindings, event] of [
    [{ ready: false }, {}], [{ menu: true }, {}], [{ cheatsOpen: true }, {}],
    [{}, { ctrlKey: true }], [{}, { altKey: true }], [{}, { metaKey: true }],
    [{}, { target: { closest: selector => selector === 'input,dialog' } }],
  ]) {
    const k = keyboard(bindings)
    k.key(event)
    k.key({ key: 'h', code: 'KeyH', ...event })
    assert.deepEqual(k.focuses, [])
    k.cleanup()
  }
  const masked = keyboard()
  masked.world.inputMask = 1
  masked.key()
  masked.key({ key: 'h', code: 'KeyH' })
  assert.deepEqual(masked.focuses, [])
  masked.cleanup()
})
