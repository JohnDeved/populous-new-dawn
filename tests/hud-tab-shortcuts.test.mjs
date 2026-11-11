import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'

// Execute the actual Home keyboard owner with supplied event/store/Scene ports.
// This is not browser event delivery or an original-game execution witness.
const source = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
const start = '  useEffect(() => {\n    const key = (e: KeyboardEvent) => {'
const end = '\n  }, [world, update, store, ready, openMenu, menu, cheatsOpen'
assert.equal(source.split(start).length, 2)
const from = source.indexOf(start)
const to = source.indexOf(end, from)
assert.ok(to > from)
const effect = stripTypeScriptTypes(source.slice(from + '  useEffect('.length, to) + '\n  }')
const mappingStart = source.indexOf('const HUD_TAB_SHORTCUTS = ')
assert.ok(mappingStart >= 0)
const mappingEnd = source.indexOf('\n\nexport default function Home()', mappingStart)
const mappingSource = stripTypeScriptTypes(source.slice(mappingStart, mappingEnd))
const HUD_TAB_SHORTCUTS = new Function(`${mappingSource}; return HUD_TAB_SHORTCUTS`)()
const shortcuts = [['Insert', 'buildings'], ['Home', 'spells'], ['PageUp', 'followers']]

function fixture(options = {}) {
  const world = {
    mode: 'blast', status: 'playing', selected: [7, 9], paused: false, inputMask: 0,
    flyby: { flags: 0 }, orders: [{ unit: 7, target: 11 }], mana: 123, seed: 456,
    ...options.world,
  }
  let current = world
  const engine = { current: { world, skipIntroduction() { throw Error('Unexpected introduction skip') } } }
  let tab = 'followers', hover = 'spell', handler, changes = 0, removed = false
  const bindings = {
    HUD_TAB_SHORTCUTS, world, engine, ready: true, menu: false, cheatsOpen: false, selectorOpen: false,
    messageDetails: { current: new Map() }, SPELLS: [],
    store: { getWorld: () => current, change: action => { changes++; action(current) } },
    setTab(value) { tab = value }, setHover(value) { hover = value }, update() {},
    window: {
      addEventListener(name, listener) { assert.equal(name, 'keydown'); handler = listener },
      removeEventListener(name, listener) { assert.equal(name, 'keydown'); assert.equal(listener, handler); removed = true },
    },
    ...options.bindings,
  }
  const disposeEffect = new Function(...Object.keys(bindings), `return (${effect})()`)(...Object.values(bindings))
  return {
    world, engine,
    get tab() { return tab }, get hover() { return hover }, get changes() { return changes },
    replace(value) { current = value },
    key(code, overrides = {}) {
      let prevented = 0
      handler({ code, key: code, repeat: false, ctrlKey: false, altKey: false,
        metaKey: false, shiftKey: false, defaultPrevented: false,
        target: { closest: () => null }, preventDefault() { prevented++ }, ...overrides })
      return prevented
    },
    dispose() { disposeEffect(); assert.equal(removed, true) },
  }
}

for (const [code, tab] of shortcuts) {
  for (const paused of [false, true]) test(`${code} selects ${tab} through Home while paused=${paused}`, () => {
    const f = fixture({ world: { paused } }), before = structuredClone(f.world)
    try {
      assert.equal(f.key(code), 1)
      assert.equal(f.tab, tab)
      assert.equal(f.hover, null)
      assert.equal(f.changes, 1)
      assert.deepEqual(f.world, { ...before, mode: null })
    } finally { f.dispose() }
  })

  for (const overrides of [{ repeat: true }, { shiftKey: true }, { ctrlKey: true },
    { altKey: true }, { metaKey: true }, { defaultPrevented: true }]) {
    test(`${code} preserves state for rejected event ${JSON.stringify(overrides)}`, () => {
      const f = fixture(), before = structuredClone(f.world)
      try {
        assert.equal(f.key(code, overrides), 0)
        assert.equal(f.tab, 'followers')
        assert.equal(f.hover, 'spell')
        assert.equal(f.changes, 0)
        assert.deepEqual(f.world, before)
      } finally { f.dispose() }
    })
  }

  for (const owner of ['input', 'textarea', 'select', 'dialog', 'a', '[contenteditable]']) {
    test(`${code} leaves ${owner} input to its existing owner`, () => {
      const f = fixture(), before = structuredClone(f.world)
      try {
        assert.equal(f.key(code, { target: { closest: selector => selector.split(',').includes(owner) ? {} : null } }), 0)
        assert.equal(f.changes, 0)
        assert.deepEqual(f.world, before)
      } finally { f.dispose() }
    })
  }

  for (const [name, options] of [
    ['loading', { bindings: { ready: false } }],
    ['Menu', { bindings: { menu: true } }],
    ['spell test menu', { bindings: { cheatsOpen: true } }],
    ['world selector', { bindings: { selectorOpen: true } }],
    ['campaign popup', { bindings: { messageDetails: { current: new Map([[1, { open: true }]]) } } }],
    ['masked world', { world: { inputMask: 1 } }],
    ['masked introduction', { world: { inputMask: 64, flyby: { flags: 1 } } }],
    ['victory', { world: { status: 'won' } }],
    ['defeat', { world: { status: 'lost' } }],
  ]) test(`${code} respects ${name}`, () => {
    const f = fixture(options), before = structuredClone(f.world)
    try {
      assert.equal(f.key(code), 0)
      assert.equal(f.changes, 0)
      assert.deepEqual(f.world, before)
    } finally { f.dispose() }
  })

  test(`${code} rejects replaced worlds and absent or mismatched Scenes`, () => {
    const f = fixture(), before = structuredClone(f.world)
    try {
      const replacement = structuredClone(f.world)
      f.replace(replacement)
      assert.equal(f.key(code), 0)
      assert.deepEqual(replacement, before)
      f.replace(f.world)
      f.engine.current = { world: replacement }
      assert.equal(f.key(code), 0)
      f.engine.current = null
      assert.equal(f.key(code), 0)
      assert.equal(f.changes, 0)
      assert.deepEqual(f.world, before)
    } finally { f.dispose() }
  })
}

test('a held key does not cancel newly armed targeting, while a new press changes tab', () => {
  const f = fixture()
  try {
    f.key('Insert')
    f.world.mode = 'hut'
    assert.equal(f.key('Insert', { repeat: true }), 0)
    assert.equal(f.world.mode, 'hut')
    assert.equal(f.key('Home'), 1)
    assert.equal(f.tab, 'spells')
    assert.equal(f.world.mode, null)
    assert.equal(f.key('PageUp'), 1)
    assert.equal(f.tab, 'followers')
  } finally { f.dispose() }
})

test('numeric keypad navigation aliases do not trigger HUD tab shortcuts', () => {
  const f = fixture(), before = structuredClone(f.world)
  try {
    for (const [code, key] of [['Numpad0', 'Insert'], ['Numpad7', 'Home'], ['Numpad9', 'PageUp']])
      assert.equal(f.key(code, { key }), 0)
    assert.equal(f.changes, 0)
    assert.deepEqual(f.world, before)
  } finally { f.dispose() }
})

test('existing B shortcut remains available', () => {
  const f = fixture()
  try {
    f.key('KeyB', { key: 'b' })
    assert.equal(f.tab, 'buildings')
    assert.equal(f.world.mode, null)
  } finally { f.dispose() }
})

test('the tab buttons advertise the bindings without renaming existing accessible controls', () => {
  assert.deepEqual(HUD_TAB_SHORTCUTS, {
    buildings: { code: 'Insert', label: 'Insert' },
    spells: { code: 'Home', label: 'Home' },
    followers: { code: 'PageUp', label: 'Page Up' },
  })
  assert.ok(source.includes('aria-keyshortcuts={HUD_TAB_SHORTCUTS[t].code}'))
  assert.ok(source.includes('title={`${t} · ${HUD_TAB_SHORTCUTS[t].label}`}'))
  assert.ok(/aria-label=\{`\$\{t\} \$\{t === 'spells' \? '1–3' : t === 'buildings' \? 'B' : ''\}`\}/.test(source))
})
