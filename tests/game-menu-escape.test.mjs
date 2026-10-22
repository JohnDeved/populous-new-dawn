import test from 'node:test'
import assert from 'node:assert/strict'
import { pageEffect, pageNearby } from './support/follower-nearby-page.mjs'
import { cancelInteraction } from '../app/selection-runtime.ts'

// Execute the real Home keyboard effect and Menu handlers, not a second routing
// implementation. Browser event delivery and rendered Menu remain separate gates.
function fixture({ level = 2, paused = false, mode = null, selected = [], inputMask = 0,
  flyby = false, menuOpen = false, cheatsOpen = false, popupOpen = false, ready = true } = {}) {
  let current = {
    status: 'playing', paused, mode, selected, orderCursor: 7, units: [], inputMask,
    outcome: { level }, flyby: { flags: Number(flyby) }, manaWorld: { gameFlags: 0 },
    castingTribes: [{ flags: 0 }],
  }
  const world = current, scene = {
    world, cancelNearbyFollowers() {}, setModalSuspended(value) { this.modalSuspended = value },
  }
  const store = { getWorld: () => current, change: action => action(current) }
  let menu = menuOpen, handler, skipped = 0
  scene.skipIntroduction = () => { skipped++ }
  const page = pageNearby(scene, { store, setMenu: value => { menu = value } })
  const dispose = pageEffect('engine.current?.skipIntroduction()', {
    ...page.bindings, ...page, world, store, ready, menu: menuOpen, cheatsOpen,
    messageDetails: { current: new Map([[0, { open: popupOpen }]]) }, SPELLS: [], tutorialLevel: 79,
    cancelInteraction, update() {},
    globalThis: {
      addEventListener(name, listener) { assert.equal(name, 'keydown'); handler = listener },
      removeEventListener(name, listener) { assert.equal(name, 'keydown'); assert.equal(listener, handler) },
    },
  })()
  function escape(overrides = {}) {
    let prevented = 0, stopped = 0
    handler({ key: 'Escape', code: 'Escape', repeat: false, ctrlKey: false, metaKey: false,
      altKey: false, target: { closest: () => null }, preventDefault() { prevented++ },
      stopImmediatePropagation() { stopped++ }, ...overrides })
    return { prevented, stopped }
  }
  return { world, scene, page, escape, dispose, replace(next) { current = next }, get menu() { return menu }, get skipped() { return skipped } }
}

for (const level of [1, 2, 25, 79]) for (const paused of [false, true]) {
  test(`neutral Escape opens actual Game Menu on level ${level} and restores prior pause=${paused}`, () => {
    const f = fixture({ level, paused })
    try {
      assert.deepEqual(f.escape(), { prevented: 1, stopped: 1 })
      assert.equal(f.menu, true)
      assert.equal(f.world.paused, true)
      assert.equal(f.scene.modalSuspended, true)
      f.page.closeMenu()
      assert.equal(f.menu, false)
      assert.equal(f.world.paused, paused)
      assert.equal(f.scene.modalSuspended, false)
    } finally { f.dispose() }
  })
}

test('non-tutorial Escape cancels targeting, then selection, then opens Menu on distinct presses', () => {
  const f = fixture({ mode: 'blast', selected: [7] })
  try {
    f.escape()
    assert.equal(f.world.mode, null)
    assert.deepEqual(f.world.selected, [7])
    assert.equal(f.menu, false)
    assert.equal(f.world.paused, false)
    f.escape()
    assert.deepEqual(f.world.selected, [])
    assert.equal(f.world.orderCursor, 0)
    assert.equal(f.menu, false)
    f.escape()
    assert.equal(f.menu, true)
  } finally { f.dispose() }
})

for (const overrides of [{ repeat: true }, { ctrlKey: true }, { altKey: true }, { metaKey: true },
  { target: { closest: () => ({}) } }]) {
  test(`Escape does not take repeated, modified or external-control input ${JSON.stringify(overrides)}`, () => {
    const f = fixture()
    try { assert.deepEqual(f.escape(overrides), { prevented: 0, stopped: 0 }); assert.equal(f.menu, false) }
    finally { f.dispose() }
  })
}

test('Escape does not reopen gameplay Menu for a replaced or terminal world', () => {
  const f = fixture()
  try {
    f.world.status = 'lost'
    assert.deepEqual(f.escape(), { prevented: 0, stopped: 0 })
    f.world.status = 'playing'
    const replacement = { ...f.world, paused: true }
    f.replace(replacement)
    assert.deepEqual(f.escape(), { prevented: 0, stopped: 0 })
    assert.equal(f.menu, false)
    assert.equal(replacement.paused, true)
  } finally { f.dispose() }
})

test('existing tutorial Escape access remains ahead of browser selection cancellation', () => {
  const f = fixture({ level: 79, mode: 'blast', selected: [7] })
  try {
    f.escape()
    assert.equal(f.menu, true)
    assert.equal(f.world.mode, 'blast')
    assert.deepEqual(f.world.selected, [7])
  } finally { f.dispose() }
})

for (const [name, options] of [['masked gameplay', { inputMask: 1 }],
  ['open campaign popup', { popupOpen: true }], ['open cheats', { cheatsOpen: true }],
  ['open Menu', { menuOpen: true }], ['loading', { ready: false }]]) {
  test(`Escape leaves ${name} ahead of the new neutral Menu route`, () => {
    const f = fixture(options), before = { ...f.world }
    try {
      assert.deepEqual(f.escape(), { prevented: 0, stopped: 0 })
      assert.equal(f.menu, !!options.menuOpen)
      assert.deepEqual(f.world, before)
      assert.equal(f.skipped, 0)
    } finally { f.dispose() }
  })
}

test('masked flyby Escape still skips the introduction without opening Menu', () => {
  const f = fixture({ inputMask: 64, flyby: true })
  try {
    assert.deepEqual(f.escape(), { prevented: 1, stopped: 0 })
    assert.equal(f.skipped, 1)
    assert.equal(f.menu, false)
    assert.equal(f.world.paused, false)
  } finally { f.dispose() }
})
