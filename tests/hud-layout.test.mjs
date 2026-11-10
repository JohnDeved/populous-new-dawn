import test from 'node:test'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import ts from 'typescript'
import { hudScale } from '../app/hud-layout.ts'

test('scaled native panel and bottom-row digits remain above the modern footer', () => {
  for (const [width, height] of [[1280, 720], [1920, 1080], [3440, 1440], [800, 600]]) {
    for (const preference of ['auto', '1', '2', '4']) {
      const scale = hudScale(width, height, preference)
      // Native dock top204 + height277; footer bottom3 + height14.
      const panelBottom = 481 * scale, rowBottom = 469 * scale
      const footerTop = height - 17 * scale
      assert.ok(footerTop >= 483 * scale - 1e-9, JSON.stringify({ width, height, preference, scale, footerTop }))
      assert.ok(panelBottom < footerTop && rowBottom < footerTop)
    }
  }
})

test('HUD keeps preferred manual sizes and the original nominal auto steps when they fit', () => {
  assert.equal(hudScale(1920, 1080, 'auto'), 2)
  assert.equal(hudScale(3440, 1440, 'auto'), 2.5)
  assert.equal(hudScale(1920, 1080, '1'), 1)
  assert.equal(hudScale(3440, 2160, '4'), 4)
  assert.equal(hudScale(800, 1200, '4'), 1.25)
})

test('HUD extraction retains the page client-component directive', () => {
  assert.match(readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8'), /^'use client'\s/)
})

// Exercise the actual page owner and select callback, without mounting React.
function pageParts(text) {
  const source = ts.createSourceFile('page.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  assert.equal(source.parseDiagnostics.length, 0)
  const factories = [], selects = [], homes = [], nodes = []
  function visit(node) {
    nodes.push(node)
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'createHudPreferenceStore') factories.push(node)
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'Home') homes.push(node)
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(source) === 'select') {
      const label = node.openingElement.attributes.properties.find(a => ts.isJsxAttribute(a) && a.name.getText(source) === 'aria-label')
      if (label?.initializer && ts.isStringLiteral(label.initializer) && label.initializer.text === 'HUD size') selects.push(node)
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  assert.equal(factories.length, 1, 'exactly one actual HUD preference factory')
  assert.equal(selects.length, 1, 'exactly one actual HUD-size select')
  assert.equal(homes.length, 1, 'exactly one actual Home')
  const select = selects[0], attrs = new Map(select.openingElement.attributes.properties.filter(ts.isJsxAttribute).map(a => [a.name.getText(source), a.initializer]))
  const expression = name => {
    const value = attrs.get(name)
    assert.ok(value && ts.isJsxExpression(value) && value.expression, name)
    return value.expression.getText(source)
  }
  const emit = code => ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
  return {
    source, nodes, home: homes[0], select,
    factory: new Function(`${emit(factories[0].getText(source))}; return createHudPreferenceStore`)(),
    onChange: setHudSize => new Function('setHudSize', `return (${expression('onChange')})`)(setHudSize),
    selected: expression('value'),
  }
}
const pageText = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
const parts = pageParts(pageText)

function storage(t, initial) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'localStorage', original)
    else delete globalThis.localStorage
  })
  const values = new Map([['hud-size', initial], ['unrelated', 'keep']]), reads = [], writes = []
  const api = {
    getItem(key) { reads.push(key); return values.get(key) ?? null },
    setItem(key, value) { writes.push([key, value]); values.set(key, value) },
    removeItem() { assert.fail('restoration must not remove storage') },
    clear() { assert.fail('restoration must not clear storage') },
  }
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: api })
  return { values, reads, writes, api }
}

for (const raw of ['auto', '1', '1.5', '2', '2.5', '3', '4', null, '', '5', ' 2', '2 ', 'AUTO']) {
  test(`HUD subscription restores only the exact accepted value ${JSON.stringify(raw)}`, t => {
    const f = storage(t, raw), store = parts.factory(), observed = []
    assert.equal(store.getSnapshot(), 'auto')
    assert.equal(store.getServerSnapshot(), 'auto')
    assert.equal(store.getSnapshot(), 'auto')
    assert.deepEqual(f.reads, [], 'factory and snapshots must not access browser storage')
    const expected = ['auto', '1', '1.5', '2', '2.5', '3', '4'].includes(raw) ? raw : 'auto'
    const off = store.subscribe(() => observed.push(store.getSnapshot()))
    assert.equal(store.getSnapshot(), expected)
    assert.equal(store.getSnapshot(), expected)
    assert.equal(store.getServerSnapshot(), 'auto')
    assert.deepEqual(observed, expected === 'auto' ? [] : [expected])
    assert.deepEqual(f.reads, ['hud-size'])
    assert.deepEqual(f.writes, [])
    assert.equal(f.values.get('hud-size'), raw)
    assert.equal(f.values.get('unrelated'), 'keep')
    off()
  })
}

for (const failure of ['property', 'getItem']) test(`HUD retains a failed ${failure} read across subscription replay`, t => {
  const f = storage(t, '2'), store = parts.factory()
  let failures = 0
  if (failure === 'property') Object.defineProperty(globalThis, 'localStorage', {
    configurable: true, get() { failures++; throw Error('blocked storage') },
  })
  else f.api.getItem = () => { failures++; throw Error('blocked storage') }
  const off = store.subscribe(() => assert.fail('failed read must not notify'))
  assert.equal(store.getSnapshot(), 'auto')
  off()
  store.subscribe(() => assert.fail('replay must not notify'))()
  assert.equal(failures, 1)
  assert.deepEqual(f.writes, [])
})

test('HUD replay retains one store while a genuine remount gets fresh storage', t => {
  const f = storage(t, '2')
  parts.factory() // A discarded render constructor must be free of browser I/O.
  const first = parts.factory()
  assert.deepEqual(f.reads, [])
  first.subscribe(() => {})()
  f.values.set('hud-size', '3')
  first.subscribe(() => {})()
  assert.equal(first.getSnapshot(), '2')
  assert.equal(f.reads.length, 1)
  const remount = parts.factory()
  remount.subscribe(() => {})()
  assert.equal(remount.getSnapshot(), '3')
  assert.equal(first.getSnapshot(), '2')
  assert.equal(f.reads.length, 2)
})

test('HUD listeners see committed values, unsubscribe independently and tolerate same-value reentry', t => {
  const f = storage(t, null), store = parts.factory(), a = [], b = []
  const subscribe = store.subscribe, snapshot = store.getSnapshot, server = store.getServerSnapshot, set = store.set
  const offA = store.subscribe(() => { a.push(store.getSnapshot()); store.set(store.getSnapshot()) })
  const offB = store.subscribe(() => b.push(store.getSnapshot()))
  store.set('2'); store.set('2')
  assert.deepEqual(a, ['2']); assert.deepEqual(b, ['2'])
  offA(); store.set('3')
  assert.deepEqual(a, ['2']); assert.deepEqual(b, ['2', '3'])
  offB(); store.set('4')
  assert.deepEqual(b, ['2', '3'])
  store.subscribe(() => assert.fail('resubscription must not restore again'))()
  assert.equal(store.getSnapshot(), '4')
  assert.equal(f.reads.length, 1)
  assert.equal(store.subscribe, subscribe); assert.equal(store.getSnapshot, snapshot)
  assert.equal(store.getServerSnapshot, server); assert.equal(store.set, set)
})

test('HUD subscriber errors are not swallowed as storage errors', t => {
  const f = storage(t, '2'), store = parts.factory(), error = Error('subscriber failure')
  assert.throws(() => store.subscribe(() => { throw error }), value => value === error)
  assert.equal(store.getSnapshot(), '2')
  assert.equal(f.reads.length, 1)
})

for (const value of ['auto', '2']) for (const failWrite of [false, true]) {
  test(`actual HUD select preserves ${value}, write failure ${failWrite}, before subscription`, t => {
    const f = storage(t, '4'), store = parts.factory()
    if (failWrite) f.api.setItem = (key, next) => { f.writes.push([key, next]); throw Error('blocked write') }
    parts.onChange(store.set)({ target: { value } })
    store.subscribe(() => assert.fail('explicit selection must prevent restoration'))()
    assert.equal(store.getSnapshot(), value)
    assert.deepEqual(f.reads, [])
    assert.deepEqual(f.writes, [['hud-size', value]])
    assert.equal(f.values.get('hud-size'), failWrite ? '4' : value)
    assert.equal(f.values.get('unrelated'), 'keep')
  })
}

test('actual HUD select changes a subscribed session even when persistence fails', t => {
  const f = storage(t, '2'), store = parts.factory(), observed = []
  store.subscribe(() => observed.push(store.getSnapshot()))
  f.api.setItem = (key, next) => { f.writes.push([key, next]); throw Error('blocked write') }
  parts.onChange(store.set)({ target: { value: 'auto' } })
  assert.deepEqual(observed, ['2', 'auto'])
  assert.equal(store.getSnapshot(), 'auto')
  assert.equal(f.values.get('hud-size'), '2')
})

test('actual Home keeps lazy per-instance hydration wiring, resize dependency and minimap key', () => {
  const declarations = parts.nodes.filter(ts.isVariableDeclaration)
  const named = name => {
    const found = declarations.filter(node => node.name.getText(parts.source) === name)
    assert.equal(found.length, 1, name)
    return found[0].initializer.getText(parts.source).replace(/\s+/g, '')
  }
  assert.equal(named('[hudPreference]'), 'useState(createHudPreferenceStore)')
  assert.equal(named('hudSize'), 'useSyncExternalStore(hudPreference.subscribe,hudPreference.getSnapshot,hudPreference.getServerSnapshot)')
  assert.equal(named('setHudSize'), 'hudPreference.set')
  assert.equal(parts.selected, 'hudSize')
  const effects = parts.nodes.filter(node => ts.isCallExpression(node) && node.expression.getText(parts.source) === 'useEffect')
  assert.equal(effects.filter(node => /localStorage\.getItem\('hud-size'\)/.test(node.getText(parts.source))).length, 0)
  const resize = effects.filter(node => node.getText(parts.source).includes("'--hud-scale'"))
  assert.equal(resize.length, 1)
  assert.equal(resize[0].arguments[1].getText(parts.source), '[hudSize]')
  assert.match(resize[0].getText(parts.source), /hudScale\(window.innerWidth, window.innerHeight, hudSize\)/)
  assert.match(resize[0].getText(parts.source), /removeEventListener\('resize', resize\)/)
  const minimaps = parts.nodes.filter(node => ts.isJsxSelfClosingElement(node) && node.tagName.getText(parts.source) === 'MinimapFrame')
  assert.equal(minimaps.length, 1)
  const keys = minimaps[0].attributes.properties.filter(a => ts.isJsxAttribute(a) && a.name.getText(parts.source) === 'key')
  assert.equal(keys.length, 1)
  assert.equal(keys[0].initializer.getText(parts.source), '{hudSize}')
  assert.doesNotMatch(pageText, /oxlint-disable-next-line react\/set-state-in-effect/)
})

test('actual-source HUD extraction rejects missing and ambiguous targets', () => {
  assert.throws(() => pageParts(pageText.replace('function createHudPreferenceStore()', 'function absentHudPreferenceStore()')), /exactly one actual HUD preference factory/)
  assert.throws(() => pageParts(`${pageText}\nfunction createHudPreferenceStore() {}`), /exactly one actual HUD preference factory/)
  assert.throws(() => pageParts(pageText.replace('aria-label="HUD size"', 'aria-label="Missing size"')), /exactly one actual HUD-size select/)
  assert.throws(() => pageParts(`${pageText}\nconst duplicate = <select aria-label="HUD size"></select>`), /exactly one actual HUD-size select/)
})
