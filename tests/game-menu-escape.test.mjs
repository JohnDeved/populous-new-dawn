import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'

// Execute complete actual Home owners with supplied event/store/Scene ports.
// No React, JSX, browser event dispatch or whole selection module is evaluated.
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8')
const source = read('../app/page.tsx')
function between(text, start, end) {
  assert.equal(text.split(start).length, 2, `one source start: ${start}`)
  const at = text.indexOf(start), stop = text.indexOf(end, at + start.length)
  assert.ok(stop > at, `source end: ${end}`)
  return text.slice(at, stop)
}
const menuSource = between(source, '  const clearNearbyPress = useCallback(', '  function openSelector()')
const effectSource = between(source, '  useEffect(() => {\n    const key = (e: KeyboardEvent) => {', '\n  }, [world, update, store, ready, openMenu, menu, cheatsOpen')
  .slice('  useEffect('.length) + '\n  }'
function namedFunction(path, name) {
  const text = read(path), marker = `export function ${name}(`
  return between(text, marker, '\n}\n').replace('export function', 'function') + '\n}\n'
}
const cancellationSource = namedFunction('../app/selection-runtime.ts', 'cancelInteraction') +
  namedFunction('../app/person-orders.ts', 'deselectPerson')
const { cancelInteraction } = new Function(stripTypeScriptTypes(cancellationSource) + '\nreturn { cancelInteraction }')()
const compile = (text, bindings) => new Function(...Object.keys(bindings), text)(...Object.values(bindings))

function fixture({ level = 2, paused = false, mode = null, selected = [], inputMask = 0,
  flyby = false, menuOpen = false, cheatsOpen = false, popupOpen = false, selectorOpen = false, ready = true } = {}) {
  let current = {
    status: 'playing', paused, mode, selected, orderCursor: 7, units: [], inputMask,
    outcome: { level }, flyby: { flags: Number(flyby) }, manaWorld: { gameFlags: 0 },
    castingTribes: [{ flags: 0 }],
  }
  const world = current, scene = {
    world, cancelNearbyFollowers() {}, setModalSuspended(value) { this.modalSuspended = value },
  }
  const store = { getWorld: () => current, change: action => action(current) }
  let menu = menuOpen, handler, skipped = 0, removed = false
  scene.skipIntroduction = () => { skipped++ }
  const bindings = {
    engine: { current: scene }, world, store, nearbyPress: { current: null },
    setNearbyPressed() {}, setMenu: value => { menu = value },
    useCallback: callback => callback, useRef: current => ({ current }),
  }
  const page = compile(stripTypeScriptTypes(menuSource) + '\nreturn { openMenu, closeMenu }', bindings)
  const events = {
    addEventListener(name, listener) { assert.equal(name, 'keydown'); assert.equal(handler, undefined); handler = listener },
    removeEventListener(name, listener) { assert.equal(name, 'keydown'); assert.equal(listener, handler); removed = true },
  }
  const disposeEffect = compile('return (' + stripTypeScriptTypes(effectSource) + ')', {
    ...bindings, ...page, ready, menu: menuOpen, cheatsOpen, selectorOpen,
    messageDetails: { current: new Map([[0, { open: popupOpen }]]) }, SPELLS: [], tutorialLevel: 79,
    cancelInteraction, update() {}, window: events, globalThis: events,
  })()
  function escape(overrides = {}) {
    let prevented = 0, stopped = 0
    assert.equal(typeof handler, 'function')
    handler({ key: 'Escape', code: 'Escape', repeat: false, ctrlKey: false, metaKey: false,
      altKey: false, target: { closest: () => null }, preventDefault() { prevented++ },
      stopImmediatePropagation() { stopped++ }, ...overrides })
    return { prevented, stopped }
  }
  const dispose = () => { disposeEffect(); assert.equal(removed, true) }
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

test('Escape leaves the current selector owner intact', () => {
  const f = fixture({ selectorOpen: true, paused: true })
  try {
    assert.deepEqual(f.escape(), { prevented: 0, stopped: 0 })
    assert.equal(f.menu, false)
    assert.equal(f.world.paused, true)
    assert.equal(f.scene.modalSuspended, undefined)
  } finally { f.dispose() }
})

test('selection cancellation preserves the actual retained person cleanup before Menu', () => {
  const f = fixture({ selected: [7] })
  const selected = { selectionFlags: 129, flags3: 128 }, unselected = { selectionFlags: 1, flags3: 128 }
  f.world.units.push({ id: 7, team: 'blue', native: selected, flight: selected },
    { id: 8, team: 'blue', native: unselected })
  try {
    assert.deepEqual(f.escape(), { prevented: 1, stopped: 1 })
    assert.equal(f.menu, false)
    assert.deepEqual(f.world.selected, [])
    assert.equal(f.world.orderCursor, 0)
    assert.deepEqual(selected, { selectionFlags: 1, flags3: 0 })
    assert.deepEqual(unselected, { selectionFlags: 0, flags3: 0 })
    assert.deepEqual(f.escape(), { prevented: 1, stopped: 1 })
    assert.equal(f.menu, true)
  } finally { f.dispose() }
})
