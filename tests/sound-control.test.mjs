import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'
import { popupButtonTiles } from '../app/campaign-popup-layout.ts'
import { hudGlyph } from '../app/hud-font.ts'
import { hudScale } from '../app/hud-layout.ts'
import hud from '../app/original-hud.json' with { type: 'json' }
import art from '../app/original-campaign-popup.json' with { type: 'json' }
import { captureCampaignPopupKeys } from '../app/campaign-popup-session.ts'
import { homePopupSources } from '../scripts/campaign-popup-fixture/home-source.mjs'
import { evaluatePage, pageEffect, pageNode, pageSource } from './support/follower-nearby-page.mjs'

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
const source = read('app/sound-control.tsx'), css = read('app/sound-control.module.css')
const require = createRequire(import.meta.url)
const compiled = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
} }).outputText
const tree = node => !node || typeof node !== 'object' ? [] :
  [node, ...[node.props?.children].flat(Infinity).flatMap(tree)]

function fixture({ ready = true, decode = () => Promise.resolve(), ...props } = {}) {
  const effects = [], images = [], calls = [], component = { exports: {} }
  let state = ready, stateWrites = 0
  class Image {
    constructor() { images.push(this) }
    decode() { return decode(this.src) }
  }
  new Function('require', 'module', 'exports', 'Image', compiled)(name => {
    if (name === 'react') return {
      useState: () => [state, value => { state = value; stateWrites++ }],
      useEffect: run => effects.push(run),
    }
    if (name === './campaign-popup-layout') return { popupButtonTiles }
    if (name === './hud-font') return { hudGlyph }
    if (name === './original-hud.json') return hud
    if (name === './original-campaign-popup.json') return art
    if (name.endsWith('.module.css')) return new Proxy({}, { get: (_, key) => key === '__esModule' ? false : key })
    return require(name)
  }, component, component.exports, Image)
  const onToggle = () => calls.push('toggle')
  return {
    effects, images, calls, onToggle, get stateWrites() { return stateWrites },
    render(overrides = {}) {
      return component.exports.SoundControl({ sound: false, pending: false, onToggle, ...props, ...overrides })
    },
  }
}

test('sound activation retains the direct trusted button, pending disable and accessible states', () => {
  for (const sound of [false, true]) for (const pending of [false, true]) {
    const f = fixture(), button = f.render({ sound, pending })
    assert.equal(button.type, 'button')
    assert.equal(button.props.type, 'button')
    assert.equal(button.props['aria-label'], sound ? 'Mute sound' : 'Enable sound')
    assert.equal(button.props.title, button.props['aria-label'])
    assert.equal(button.props['aria-pressed'], undefined, 'action labels are not a stable-label toggle button')
    assert.equal(button.props['data-sound-enabled'], sound)
    assert.equal(button.props['aria-busy'], pending)
    assert.equal(button.props.disabled, pending)
    assert.equal(button.props.onClick, f.onToggle, 'no deferred or synthetic activation wrapper')
    assert.deepEqual(f.calls, [], 'render never activates sound')
    if (!pending) { button.props.onClick(); assert.deepEqual(f.calls, ['toggle']) }
  }
})

test('on, off and pending use distinct original FONT0 labels at whole native pixel coordinates', () => {
  for (const [sound, pending, label] of [[false, false, 'Sound Off'], [true, false, 'Sound On'], [false, true, 'Wait']]) {
    const f = fixture(), button = f.render({ sound, pending })
    assert.deepEqual(button.props.style, { width: 61, height: 14 })
    const text = tree(button).find(node => node.props?.className === 'label')
    assert.equal(text.props['aria-hidden'], 'true')
    const expected = [...label].map(letter => hud.rects[hudGlyph(letter.charCodeAt(0))])
    const width = expected.reduce((sum, glyph) => sum + glyph.w, 0)
    assert.deepEqual(text.props.style, { left: Math.trunc((61 - width) / 2), top: 2 })
    assert.deepEqual(text.props.children.map(node => node.props.style), expected.map(glyph => ({
      width: glyph.w, height: glyph.h, backgroundPosition: `-${glyph.x}px -${glyph.y}px`,
    })))
    assert.ok(text.props.style.left >= 4 && text.props.style.left + width <= 57)
    assert.ok(expected.every(glyph => glyph.h === 10), '10px artwork fits the 14px control without scaling')
  }
  assert.match(css, /background: url\('\/original\/hud\.png'\) no-repeat/)
  assert.doesNotMatch(source, /♪|♫|<svg/)
  assert.doesNotMatch(css, /outset|background-size|scale\(|box-shadow|Arial/)
})

test('frame reuses native crop tiling and the established overlapping-corner order, not CSS compression', () => {
  const nodes = tree(fixture().render()), frame = nodes.find(node => node.props?.className === 'frame')
  assert.equal(frame.props['aria-hidden'], 'true')
  const tiles = frame.props.children.map(node => node.props.style)
  assert.deepEqual(tiles, popupButtonTiles(61, 14).map(tile => ({
    left: tile.x, top: tile.y, width: tile.w, height: tile.h,
    backgroundPosition: `-${tile.sx}px -${tile.sy}px`,
  })))
  assert.deepEqual(tiles.slice(-4), [
    { left: 0, top: 0, width: 8, height: 8, backgroundPosition: '-0px -0px' },
    { left: 53, top: 0, width: 8, height: 8, backgroundPosition: '-16px -0px' },
    { left: 0, top: 6, width: 8, height: 8, backgroundPosition: '-0px -16px' },
    { left: 53, top: 6, width: 8, height: 8, backgroundPosition: '-16px -16px' },
  ])
  for (const url of Object.values(art.buttonUrls)) assert.ok(css.includes(url))
  for (const color of css.match(/#[\da-f]{6}/g)) assert.ok(hud.colors.includes(color))
  assert.match(css, /:focus-visible \{ outline: 1px solid #fff7bb/)
  assert.match(css, /\.control\[data-sound-enabled='true'\]/)
  assert.doesNotMatch(css, /aria-pressed/)
  assert.match(css, /\.control:disabled \{ opacity: \.65; cursor: wait/)
})

test('loading and failed artwork keep readable labels and the sound action; completed decode cannot update an unmounted control', async () => {
  for (const sound of [false, true]) for (const pending of [false, true]) {
    const f = fixture({ ready: false, decode: () => Promise.reject(new Error('atlas unavailable')) })
    const button = f.render({ sound, pending }), cleanup = f.effects[0]()
    await new Promise(resolve => setImmediate(resolve))
    const fallback = f.render({ sound, pending })
    assert.equal(fallback.props['data-art-ready'], false)
    assert.equal(fallback.props.children.props.children, pending ? 'Wait' : sound ? 'Sound On' : 'Sound Off')
    assert.equal(fallback.props['aria-label'], button.props['aria-label'])
    assert.equal(fallback.props.onClick, f.onToggle)
    assert.deepEqual(f.calls, [])
    cleanup()
  }
  const ready = fixture({ ready: false })
  ready.render(); ready.effects[0]()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(ready.render().props['data-art-ready'], true)
  assert.deepEqual(ready.images.map(image => image.src), ['/original/hud.png', ...Object.values(art.buttonUrls)])
  // One shared promise makes all four image decodes settle after unmount.
  let settle
  const delayed = new Promise(resolve => { settle = resolve })
  const unmounted = fixture({ ready: false, decode: () => delayed })
  unmounted.render(); unmounted.effects[0]()(); settle()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(unmounted.stateWrites, 0)
})

test('the wider sound label still fits beside unchanged fullscreen across the supported HUD scales', () => {
  for (const [width, height] of [[640, 480], [800, 600], [900, 360], [1024, 768], [1920, 1080], [3440, 1440]]) {
    for (const preference of ['auto', '1', '1.5', '2', '2.5', '3', '4']) {
      const scale = hudScale(width, height, preference)
      assert.ok((4 + 61 + 4 + 17) * scale < 100 * scale)
      assert.ok(height - 17 * scale >= 481 * scale, 'footer remains below native dock rows')
    }
  }
  assert.match(read('app/globals.css'), /\.top-actions\{position:absolute;left:4px;bottom:3px;display:flex;gap:4px\}/)
  assert.doesNotMatch(read('app/globals.css'), /\.top-actions button\{/)
})

test('actual Home activation still owns pending, failure notice, retry, mute and saved volume independence', async () => {
  const toggle = pageNode(node => ts.isFunctionDeclaration(node) && node.name?.text === 'toggleSound').getText(pageSource)
  const calls = [], world = {}, environment = {}, audio = { volume: .2, musicVolume: .4, mute() { calls.push('mute') } }
  let finish, fail = true
  audio.enable = () => { calls.push('enable'); return new Promise((resolve, reject) => { finish = () => fail ? reject(new Error('blocked')) : resolve(true) }) }
  const state = { sound: false, pending: false, notice: '' }
  const handler = () => evaluatePage(toggle, {
    sound: state.sound, world, audio: { current: audio }, engine: { current: { soundEnvironment: () => environment } },
    setSound: value => { state.sound = value }, setSoundPending: value => { state.pending = value },
    setAudioStartNotice: value => { state.notice = value },
    tell: (target, text) => { assert.equal(target, world); calls.push(text) }, update: () => calls.push('update'),
  })
  const failed = handler()()
  assert.equal(state.pending, true); assert.equal(state.sound, false)
  assert.equal(audio.environment, environment)
  finish(); await failed
  assert.equal(state.pending, false)
  assert.equal(state.notice, 'Audio could not start. Try the sound button again.')
  assert.deepEqual(calls, ['enable', 'mute', state.notice, 'update'])
  fail = false
  const retry = handler()()
  assert.equal(state.notice, ''); assert.equal(state.pending, true)
  finish(); await retry
  assert.equal(state.sound, true); assert.equal(state.pending, false)
  await handler()()
  assert.equal(state.sound, false); assert.equal(calls.at(-1), 'mute')
  assert.deepEqual([audio.volume, audio.musicVolume], [.2, .4])
})

// Supplied DOM/default-action boundary; handlers, popup capture and gameplay
// effects execute shipped source. The hosted browser capture proves real defaults.
function keyboardFixture({ popupOpen = false, pending = false, soundTarget = true } = {}) {
  const f = fixture(), button = f.render({ pending }), listeners = new Map()
  const calls = { overview: 0, skip: 0, menu: 0 }, world = {
    paused: false, inputMask: 0, flyby: { flags: 0 }, units: [], selected: [], outcome: { level: 2 },
  }
  let acknowledged = 0, game, sceneUp
  const popup = { querySelector: () => ({ click() { acknowledged++; popupOpen = false } }) }
  class Element {
    closest(selector) { return soundTarget && selector.split(',').includes('[data-sound-control]') ? this : null }
  }
  const document = { addEventListener: (type, fn) => listeners.set(type, fn), removeEventListener: type => listeners.delete(type) }
  const cleanup = captureCampaignPopupKeys(document, () => popupOpen ? popup : undefined)
  const scene = { keys: new Set(), overview() { calls.overview++ }, skipIntroduction() { calls.skip++ }, listen(_target, _type, fn) { sceneUp = fn } }
  pageEffect("globalThis.addEventListener('keydown', key)", {
    world, engine: { current: scene }, store: { change: fn => fn(world), getWorld: () => world },
    ready: true, menu: false, cheatsOpen: false, update() {}, audio: { current: null },
    globalThis: { addEventListener(_type, fn) { game = fn } }, openMenu() { calls.menu++ },
    SPELLS: [], tutorialLevel: 79,
  })()
  evaluatePage(homePopupSources(new URL('..', import.meta.url).pathname).sceneUp, { window: {}, scene })
  let spaceArmed = false
  function key(key, type = 'keydown', repeat = false, modifiers = {}) {
    let stopped = false, immediate = false, prevented = false
    const event = { key, code: key === ' ' ? 'Space' : key, type, repeat, target: new Element(), ...modifiers,
      stopPropagation() { stopped = true }, stopImmediatePropagation() { stopped = immediate = true }, preventDefault() { prevented = true } }
    const old = globalThis.Element
    globalThis.Element = Element
    try { listeners.get(type)(event) } finally { globalThis.Element = old }
    if (!immediate && soundTarget) button.props[type === 'keydown' ? 'onKeyDown' : 'onKeyUp'](event)
    if (!stopped) (type === 'keydown' ? game : sceneUp)(event)
    if (soundTarget && !pending && !prevented) {
      if (key === 'Enter' && type === 'keydown') button.props.onClick()
      if (key === ' ' && type === 'keydown' && !repeat) spaceArmed = true
      if (key === ' ' && type === 'keyup' && spaceArmed) button.props.onClick()
    }
    if (key === ' ' && type === 'keyup') spaceArmed = false
    return { stopped, prevented }
  }
  return { key, calls, world, scene, f, cleanup, closePopup() { popupOpen = false }, get acknowledged() { return acknowledged } }
}

test('focused sound Enter/Space activate once without popup ACK, pause, overview or release leakage', () => {
  for (const popupOpen of [false, true]) for (const key of ['Enter', ' ']) for (const pending of [false, true]) {
    const f = keyboardFixture({ popupOpen, pending })
    try {
      assert.deepEqual(f.key(key), { stopped: true, prevented: false }, 'first native default remains available')
      for (let repeat = 0; repeat < 3; repeat++)
        assert.deepEqual(f.key(key, 'keydown', true), { stopped: true, prevented: true })
      assert.deepEqual(f.key(key, 'keyup'), { stopped: true, prevented: false })
      assert.deepEqual(f.f.calls, pending ? [] : ['toggle'])
      assert.equal(f.acknowledged, 0)
      assert.equal(f.world.paused, false)
      assert.deepEqual(f.calls, { overview: 0, skip: 0, menu: 0 })
      assert.deepEqual([...f.scene.keys], [])
    } finally { f.cleanup() }
  }
})

test('sound exemption is activation-only and retains popup modifier and held-release ownership', () => {
  const f = keyboardFixture({ popupOpen: true })
  try {
    for (const key of ['ArrowUp', 'Escape', 'Shift']) {
      assert.deepEqual(f.key(key), { stopped: true, prevented: true })
      assert.deepEqual(f.key(key, 'keyup'), { stopped: true, prevented: true })
    }
    for (const flag of ['ctrlKey', 'metaKey', 'altKey']) {
      assert.deepEqual(f.key('c', 'keydown', false, { [flag]: true }), { stopped: true, prevented: false })
      assert.deepEqual(f.key('c', 'keyup', false, { [flag]: true }), { stopped: true, prevented: false })
    }
    f.key('Enter', 'keydown', false, { shiftKey: true })
    f.closePopup()
    assert.deepEqual(f.key('Enter', 'keydown', true, { shiftKey: true }), { stopped: true, prevented: true })
    assert.deepEqual(f.key('Enter', 'keyup', false, { shiftKey: true }), { stopped: true, prevented: true })
    assert.equal(f.acknowledged, 0)
    assert.deepEqual(f.f.calls, ['toggle'])
    assert.deepEqual([...f.scene.keys], [])
    assert.deepEqual(f.calls, { overview: 0, skip: 0, menu: 0 })
  } finally { f.cleanup() }
  const unrelated = keyboardFixture({ popupOpen: true, soundTarget: false })
  try {
    assert.deepEqual(unrelated.key('Enter'), { stopped: true, prevented: true })
    assert.equal(unrelated.acknowledged, 1, 'unrelated focused targets still acknowledge the popup')
    unrelated.key('Enter', 'keyup')
    unrelated.key('Enter')
    assert.equal(unrelated.calls.overview, 1, 'normal gameplay resumes once popup ownership ends')
  } finally { unrelated.cleanup() }
})

test('sound handlers leave unrelated keys and their modifiers to existing owners', () => {
  const button = fixture().render()
  for (const handler of [button.props.onKeyDown, button.props.onKeyUp])
    for (const key of ['ArrowUp', 'Escape', 'Tab', 'F8', 'F9', 'Shift', 'c'])
      handler({ key, repeat: true, ctrlKey: true, metaKey: true, altKey: true,
        preventDefault() { assert.fail('unrelated default changed') },
        stopPropagation() { assert.fail('unrelated ownership changed') } })
})
