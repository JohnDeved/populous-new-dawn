import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const emitted = ts.transpileModule(readFileSync(new URL('../app/original-options.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText
const same = (a, b) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]))
const tree = node => [node, ...[node?.props?.children].flat(Infinity)
  .filter(child => child && typeof child === 'object').flatMap(tree)]

function fixture(initialSkin, preparedFrontend, preparedIngame) {
  const slots = [], pendingEffects = [], requests = [], publications = []
  let cursor = 0, dirty = false, mounted = true, lateWrites = 0, output
  const props = {
    skin: initialSkin, preparedFrontend, preparedIngame, volume: .35, musicVolume: .65, storageNotice: '', gameStorageNotice: '',
    gamePreferences: { rotation: 'cursor', flipRotation: false },
    onBack() {}, onVolume() {}, onMusicVolume() {}, onGamePreferences() {},
    onTextRowsChange: rows => publications.push(rows),
  }
  const react = {
    useState(initial) {
      const index = cursor++
      if (!(index in slots)) slots[index] = initial
      return [slots[index], value => {
        if (!mounted) lateWrites++
        slots[index] = typeof value === 'function' ? value(slots[index]) : value
        dirty = true
      }]
    },
    useRef(value) { const index = cursor++; return slots[index] ??= { current: value } },
    useMemo(make, deps) {
      const index = cursor++
      if (!same(slots[index]?.deps, deps)) slots[index] = { deps, value: make() }
      return slots[index].value
    },
    useEffect(run, deps) {
      const index = cursor++
      if (!same(slots[index]?.deps, deps)) pendingEffects.push(() => {
        slots[index]?.cleanup?.()
        slots[index] = { deps, cleanup: run() }
      })
    },
  }
  react.useLayoutEffect = react.useEffect
  class Image {
    decode() {
      return new Promise((resolve, reject) => requests.push({ src: this.src, resolve, reject }))
    }
  }
  const component = { exports: {} }
  new Function('require', 'module', 'exports', 'Image', emitted)(name => {
    // Tooltip lifecycle/art is covered by menu-tooltip.test.mjs; this fixture
    // renders only the Options owner and leaves child components unevaluated.
    if (name === './menu-tooltip') return { MenuTooltip: () => null }
    if (name === 'react') return react
    if (name === 'react/jsx-runtime') return require(name)
    if (name.endsWith('.json')) return JSON.parse(readFileSync(new URL('../app/' + name.slice(2), import.meta.url)))
    if (name.endsWith('.module.css')) return {}
    throw new Error(`Unexpected dependency: ${name}`)
  }, component, component.exports, Image)
  function render() {
    cursor = 0; dirty = false
    output = component.exports.OriginalOptions(props)
    pendingEffects.splice(0).forEach(run => run())
    return output
  }
  async function flush() {
    for (let i = 0; i < 8; i++) { await Promise.resolve(); if (dirty && mounted) render() }
  }
  function group(name, skin = props.skin) {
    return requests.filter(request => name === 'sliders'
      ? request.src.includes(`/options/${skin}-`)
      : skin === 'frontend' ? request.src.includes('/frontend/') : request.src.includes('/pause-font.'))
  }
  function state() {
    // Inspect the Options label font owner, not the independently prepared tooltip.
    const texts = tree(output).filter(node => node?.type?.name === 'Text')
    assert.ok(texts.length)
    return { text: texts.every(node => node.props.ready), sliders: output.props['data-art-ready'], rows: publications.at(-1) }
  }
  render()
  return {
    group, flush, state, publications,
    switchSkin(skin) { props.skin = skin; render() },
    unmount() { mounted = false; slots.forEach(slot => slot?.cleanup?.()) },
    lateWrites: () => lateWrites,
  }
}

for (const skin of ['frontend', 'ingame']) {
  for (const first of ['fonts', 'sliders']) test(`${skin}: ${first} settle without waiting for the other group`, async () => {
    const f = fixture(skin)
    assert.deepEqual(f.state(), { text: false, sliders: false, rows: [] })
    f.group(first).forEach(request => request.resolve())
    await f.flush()
    assert.equal(f.state().text, first === 'fonts')
    assert.equal(f.state().sliders, first === 'sliders')
    assert.equal(f.state().rows.length > 0, first === 'fonts')
    f.group(first === 'fonts' ? 'sliders' : 'fonts').forEach(request => request.resolve())
    await f.flush()
    assert.equal(f.state().text, true)
    assert.equal(f.state().sliders, true)
    assert.ok(f.state().rows.some(row => row.text === 'Back'))
  })
  for (let failed = 0; failed < 3; failed++) test(`${skin}: slider ${failed} failure preserves glyphs and shadow rows`, async () => {
    const f = fixture(skin)
    f.group('fonts').forEach(request => request.resolve())
    f.group('sliders').forEach((request, index) => index === failed ? request.reject(Error('fixture slider failure')) : request.resolve())
    await f.flush()
    assert.equal(f.state().text, true)
    assert.equal(f.state().sliders, false)
    assert.ok(f.state().rows.length)
  })
  for (let failed = 0; failed < (skin === 'frontend' ? 3 : 1); failed++) test(`${skin}: font ${failed} failure keeps coherent fallback and usable slider art`, async () => {
    const f = fixture(skin)
    f.group('sliders').forEach(request => request.resolve())
    f.group('fonts').forEach((request, index) => index === failed ? request.reject(Error('fixture font failure')) : request.resolve())
    await f.flush()
    assert.deepEqual(f.state(), { text: false, sliders: true, rows: [] })
  })
  test(`${skin}: late decodes cannot publish after unmount or affect a new mount`, async () => {
    const old = fixture(skin), fresh = fixture(skin)
    old.unmount()
    for (const group of ['fonts', 'sliders']) old.group(group).forEach(request => request.resolve())
    await old.flush()
    assert.equal(old.lateWrites(), 0)
    assert.deepEqual(fresh.state(), { text: false, sliders: false, rows: [] })
  })
  test(`${skin}: replacement skin clears readiness and ignores old pending decodes`, async () => {
    const f = fixture(skin), replacement = skin === 'frontend' ? 'ingame' : 'frontend'
    f.group('fonts').forEach(request => request.resolve())
    await f.flush()
    f.switchSkin(replacement)
    assert.deepEqual(f.state(), { text: false, sliders: false, rows: [] })
    f.group('sliders', skin).forEach(request => request.resolve())
    await f.flush()
    assert.deepEqual(f.state(), { text: false, sliders: false, rows: [] })
    for (const group of ['fonts', 'sliders']) f.group(group).forEach(request => request.resolve())
    await f.flush()
    assert.equal(f.state().text, true)
    assert.equal(f.state().sliders, true)
  })
  test(`${skin}: a fully ready skin does not publish readiness for replacement assets`, async () => {
    const f = fixture(skin)
    for (const group of ['fonts', 'sliders']) f.group(group).forEach(request => request.resolve())
    await f.flush()
    assert.equal(f.state().text, true)
    assert.equal(f.state().sliders, true)
    f.switchSkin(skin === 'frontend' ? 'ingame' : 'frontend')
    assert.deepEqual(f.state(), { text: false, sliders: false, rows: [] })
    f.group('fonts').forEach(request => request.reject(Error('replacement font failure')))
    f.group('sliders').forEach(request => request.resolve())
    await f.flush()
    assert.deepEqual(f.state(), { text: false, sliders: true, rows: [] })
  })
}

for (const failed of ['none', 'fonts', 'lowFont', 'sliders']) test(`prepared frontend ${failed}: initial render and remount never decode or reset healthy groups`, () => {
  const prepared = { fonts: failed !== 'fonts', lowFont: failed !== 'lowFont', sliders: failed !== 'sliders' }
  for (let mount = 0; mount < 2; mount++) {
    const f = fixture('frontend', prepared)
    assert.equal(f.state().text, prepared.fonts && prepared.lowFont)
    assert.equal(f.state().sliders, prepared.sliders)
    assert.equal(f.state().rows.length > 0, prepared.fonts && prepared.lowFont)
    assert.deepEqual(f.group('fonts'), [])
    assert.deepEqual(f.group('sliders'), [])
    f.unmount()
  }
})
test('prepared frontend cannot mark in-game Options ready or bypass their existing loaders', () => {
  const f = fixture('ingame', { fonts: true, lowFont: true, sliders: true })
  assert.deepEqual(f.state(), { text: false, sliders: false, rows: [] })
  assert.equal(f.group('fonts').length, 1)
  assert.equal(f.group('sliders').length, 3)
})

for (const fonts of [false, true]) for (const sliders of [false, true]) test(`prepared in-game fonts=${fonts} sliders=${sliders}: synchronous cold/warm render without new decodes`, () => {
  const prepared = Object.freeze({ fonts, sliders, images: Object.freeze([]) })
  for (let mount = 0; mount < 2; mount++) {
    const f = fixture('ingame', undefined, prepared)
    assert.equal(f.state().text, fonts);assert.equal(f.state().sliders, sliders)
    assert.equal(f.state().rows.length > 0, fonts)
    assert.deepEqual(f.group('fonts'), []);assert.deepEqual(f.group('sliders'), [])
    f.unmount()
  }
})
