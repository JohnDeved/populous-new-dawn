import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import ts from 'typescript'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { bindLoadingFocus } from '../app/loading-focus.ts'

const require = createRequire(import.meta.url)
const art = JSON.parse(readFileSync(new URL('../app/original-loading-art.json', import.meta.url), 'utf8'))
const source = readFileSync(new URL('../app/original-loading-screen.tsx', import.meta.url), 'utf8')
const emitted = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText
function load(react = require('react')) {
  const component = { exports: {} }
  new Function('require', 'module', 'exports', emitted)(name => {
    if (name === 'react') return react
    if (name === './original-loading-art.json') return {default: art}
    if (name === './loading-focus') return {bindLoadingFocus}
    if (name === 'react/jsx-runtime') return require(name)
    throw Error(`Unexpected component dependency: ${name}`)
  }, component, component.exports)
  return component.exports.OriginalLoadingScreen
}
const Component = load()
const render = phase => renderToStaticMarkup(createElement(Component, {
  phase, error: '<failed terrain request>', onRetry() {},
}))
const tree = element => [element, ...[element?.props?.children].flat(Infinity).filter(child => typeof child === 'object' && child).flatMap(tree)]

test('restore and actual resource loading share the imported mask and readable loading label', () => {
  for (const phase of ['restore', 'loading']) {
    const html = render(phase)
    assert.match(html, /class="loading-world loading-world-original"/)
    assert.ok(html.includes(`src="${art.mask.src}" width="130" height="161"`))
    assert.ok(html.includes(`src="${art.label.src}" width="82" height="20"`))
    assert.match(html, /Loading\.\.\./)
    assert.match(html, /role="status"/)
    assert.ok(!html.includes('loading-rune') && !html.includes('<h2'))
    assert.equal(html.includes('Checking for a saved checkpoint in this browser.'), phase === 'restore')
  }
})

test('first server paint exposes eager native art without a visible generic text or hydration gate', () => {
  for (const phase of ['restore', 'loading']) {
    const html = render(phase)
    assert.ok(!html.includes('src="/original/loading-'), 'no separate artwork fetch')
    assert.match(html, /<style>\.loading-world\{position:fixed;/)
    assert.match(html, /<span class="loading-text-hidden">Loading\.\.\.<\/span>/)
    assert.ok(!/<img[^>]*hidden/.test(html), 'native art must not wait for hydration/onLoad')
    assert.equal((html.match(/loading="eager"/g) ?? []).length, 2)
    if (phase === 'restore') assert.match(html, /<p class="loading-text-hidden">Checking/)
  }
  const css = render('restore')
  assert.match(css, /\.loading-text-hidden\{[^}]*clip-path:inset\(50%\)/)
  assert.match(css, /\.loading-world\{[^}]*background:#000/)
  assert.match(css, /\.loading-original-art\{[^}]*width:130px;height:161px/)
})

function inspectState() {
  const states = [], refs = [], effects = []
  let stateIndex = 0, refIndex = 0
  const inspect = load({
    useState(initial) {
      const index = stateIndex++
      if (!(index in states)) states[index] = initial
      return [states[index], value => { states[index] = value }]
    },
    useRef(initial) {
      const index = refIndex++
      return refs[index] ??= {current: initial}
    },
    useEffect(callback) { effects.push(callback) },
  })
  return {
    effects,
    render(phase = 'loading') {
      stateIndex = 0; refIndex = 0; effects.length = 0
      return tree(inspect({phase, error: 'terrain failed', onRetry() {}}))
    },
  }
}

test('only a real label failure reveals readable fallback; mask failure cannot remove the status', () => {
  const harness = inspectState()
  let nodes = harness.render()
  const image = name => nodes.find(node => node?.type === 'img' && node.props.src === (name === 'loading-mask.png' ? art.mask.src : art.label.src))
  assert.equal(image('loading-label.png').props.hidden, false)
  image('loading-mask.png').props.onError()
  nodes = harness.render()
  assert.equal(image('loading-mask.png'), undefined)
  assert.equal(image('loading-label.png').props.hidden, false)
  image('loading-label.png').props.onError()
  nodes = harness.render()
  assert.equal(image('loading-label.png').props.hidden, true)
  const status = nodes.find(node => node?.type === 'span' && node.props.children === 'Loading...')
  assert.equal(status.props.className, undefined)
  assert.equal(nodes[0].props.role, 'status')
})

test('image completion before hydration is reconciled for both successful and failed requests', () => {
  for (const naturalWidth of [0, 130]) {
    const harness = inspectState()
    let nodes = harness.render()
    for (const node of nodes.filter(node => node?.type === 'img')) {
      node.props.ref.current = {complete: true, naturalWidth}
    }
    harness.effects[0]()
    nodes = harness.render()
    assert.equal(nodes[0].props['data-mask-failed'], naturalWidth === 0)
    assert.equal(nodes[0].props['data-label-ready'], naturalWidth > 0)
    const label = nodes.find(node => node?.type === 'img' && node.props.src === art.label.src)
    assert.equal(label.props.hidden, naturalWidth === 0)
  }
})

test('inline artwork is exactly the reviewed original bytes, bounded and reproducible', () => {
  let total = 0
  for (const asset of Object.values(art)) {
    const original = readFileSync(new URL('../' + asset.source, import.meta.url))
    const embedded = Buffer.from(asset.src.split(',')[1], 'base64')
    assert.deepEqual(embedded, original)
    assert.equal(createHash('sha256').update(embedded).digest('hex'), asset.sha256)
    assert.equal(embedded.length, asset.bytes)
    total += asset.src.length
  }
  assert.ok(total < 2700, 'inline PNG data remains a tiny first-document payload')
})

test('failure keeps original identity but explicitly labels the browser recovery controls', () => {
  const html = render('failed')
  assert.ok(html.includes(`src="${art.mask.src}"`))
  assert.match(html, /role="dialog" aria-label="Browser loading recovery" aria-modal="true"/)
  assert.match(html, /Loading failed/)
  assert.match(html, /Technical details/)
  assert.match(html, /&lt;failed terrain request&gt;/)
  assert.match(html, /Try again/)
  assert.ok(!html.includes(art.label.src) && !html.includes('loading-rune'))
})

test('one failed presentation dispatches only one retry; a new keyed presentation may retry again', () => {
  const inspect = load({useEffect() {}, useRef: current => ({current}), useState: value => [value, () => {}]})
  let requests = 0
  const props = {phase:'failed',error:'request failed',onRetry(){requests++}}
  const retry = tree(inspect(props)).find(node => node?.type === 'button')
  retry.props.onClick(); retry.props.onClick(); retry.props.onClick()
  assert.equal(requests,1)
  tree(inspect(props)).find(node => node?.type === 'button').props.onClick()
  assert.equal(requests,2)
  const page = readFileSync(new URL('../app/page.tsx', import.meta.url),'utf8')
  assert.match(page,/OriginalLoadingScreen\s+key=\{error \? 'failed' : startup\}/)
})

test('the bounded imported label retains exact source hashes, independent centering and two-pass metrics', () => {
  const meta = JSON.parse(readFileSync(new URL('../public/original/loading-label.json',import.meta.url)))
  const png = readFileSync(new URL('../public/original/loading-label.png',import.meta.url))
  assert.equal(meta.inputs['data/fenew/feft20we.spr'],'fc705fe271d131d7bec0023fc07ebf1f7fe91596e260b5d23e6004a380d4ea4b')
  assert.equal(meta.text,'Loading...'); assert.equal(meta.font.slot,1)
  assert.deepEqual([meta.measureWidth,meta.measureHeight,meta.width,meta.height],[81,19,82,20])
  assert.deepEqual(meta.font.glyphs.map(g=>g.advance),[8,14,10,11,4,10,12,4,4,4])
  assert.equal(meta.nativeLayout.labelX,'trunc((screenWidth-81)/2)')
  assert.equal(meta.nativeLayout.labelYRelativeToMask,-26)
  assert.deepEqual(meta.nativeLayout.passes.map(p=>[p.offsetX,p.offsetY,p.rgb]),[[0,0,[131,131,131]],[1,1,[255,255,255]]])
  assert.equal(png.readUInt32BE(16),82); assert.equal(png.readUInt32BE(20),20)
  assert.equal(createHash('sha256').update(png).digest('hex'),meta.outputSha256)
  assert.equal(meta.outputSha256,'9b5344c17384895329eea031ab56c0243600022970bdfb814ed7ce25feb625c9')
})


test('retry rejects held Enter and unowned Space releases across replacement, but permits fresh activation', () => {
  let requests = 0
  const inspect = load({useEffect() {}, useRef: current => ({current}), useState: value => [value, () => {}]})
  const mount = () => tree(inspect({phase:'failed',error:'request failed',onRetry(){requests++}})).find(node => node?.type === 'button')
  const key = (button, type, value, repeat = false) => {
    let prevented = false
    button.props[type]({key:value,repeat,preventDefault(){prevented = true}})
    return prevented
  }
  let button = mount()
  assert.equal(key(button, 'onKeyDown', 'Enter'), false)
  button.props.onClick() // Native Enter default activation.
  assert.equal(requests, 1)
  button = mount() // The retry failed while Enter remained held.
  assert.equal(key(button, 'onKeyDown', 'Enter', true), true)
  assert.equal(requests, 1)
  assert.equal(key(button, 'onKeyDown', 'Enter'), false)
  button.props.onClick()
  assert.equal(requests, 2)

  button = mount()
  assert.equal(key(button, 'onKeyDown', ' ', true), true)
  assert.equal(key(button, 'onKeyUp', ' '), true)
  assert.equal(requests, 2, 'a Space press begun before this failure cannot retry it')
  assert.equal(key(button, 'onKeyDown', ' '), true)
  key(button, 'onKeyDown', ' ', true)
  assert.equal(requests, 2, 'Space waits for release')
  key(button, 'onKeyUp', ' ')
  assert.equal(requests, 3)
  key(button, 'onKeyUp', ' ')
  button.props.onClick()
  assert.equal(requests, 3, 'keyboard and click share the single-flight guard')

  button = mount()
  key(button, 'onKeyDown', ' ')
  button.props.onBlur()
  key(button, 'onKeyUp', ' ')
  assert.equal(requests, 3, 'blur cancels Space ownership')
  button.props.onClick() // Mouse or assistive detail-zero click remains supported.
  assert.equal(requests, 4)
  assert.equal(key(mount(), 'onKeyDown', 'Tab'), false, 'Retry leaves Tab to the loading focus owner')
})

function focusFixture({ failed = false, fullscreen = true } = {}) {
  const listeners = new Set(), calls = [], controls = []
  const doc = {
    body: {}, activeElement: null, modal: null,
    querySelector(selector) {
      if (selector === 'dialog[open]') return this.modal
      assert.equal(selector, '[data-fullscreen-control]')
      return fullscreen ? portal : null
    },
    addEventListener(type, callback, capture) {
      assert.equal(type, 'keydown'); assert.equal(capture, true); listeners.add(callback)
    },
    removeEventListener(type, callback, capture) {
      assert.equal(type, 'keydown'); assert.equal(capture, true); listeners.delete(callback)
    },
  }
  const control = name => ({ name, focus(options) {
    assert.deepEqual(options, {preventScroll: true}); doc.activeElement = this; calls.push(name)
  } })
  const summary = control('details'), retry = control('retry'), button = control('fullscreen')
  if (failed) controls.push(summary, retry)
  const screen = {
    isConnected: true, ownerDocument: doc,
    contains: element => element === screen || controls.includes(element),
    querySelectorAll(selector) { assert.equal(selector, 'summary,button:not(:disabled)'); return controls },
    focus() { doc.activeElement = screen },
  }
  const portal = {
    parentElement: doc.body,
    contains: element => element === button,
    querySelectorAll(selector) { assert.equal(selector, 'button:not(:disabled)'); return [button] },
  }
  doc.activeElement = screen
  return {doc, screen, portal, button, summary, retry, calls, listeners, controls,
    press(key = 'Tab', {shiftKey = false, prevented = false} = {}) {
      const event = { key, shiftKey, defaultPrevented: prevented, stopped: false,
        preventDefault() { this.defaultPrevented = true }, stopPropagation() { this.stopped = true } }
      for (const listener of listeners) listener(event)
      return event
    },
  }
}

test('normal loading reaches the sibling fullscreen control in both directions and retains Tab ownership', () => {
  for (const shiftKey of [false, true]) {
    const f = focusFixture(), dispose = bindLoadingFocus(f.screen)
    for (let repeat = 0; repeat < 3; repeat++) {
      const event = f.press('Tab', {shiftKey})
      assert.equal(event.defaultPrevented, true); assert.equal(event.stopped, true)
      assert.equal(f.doc.activeElement, f.button)
    }
    assert.deepEqual(f.calls, ['fullscreen', 'fullscreen', 'fullscreen'])
    dispose()
  }
})

test('recovery controls and fullscreen form one forward and reverse cycle', () => {
  const f = focusFixture({failed: true}), dispose = bindLoadingFocus(f.screen)
  for (const expected of [f.summary, f.retry, f.button, f.summary]) {
    f.press(); assert.equal(f.doc.activeElement, expected)
  }
  for (const expected of [f.button, f.retry, f.summary, f.button]) {
    f.press('Tab', {shiftKey:true}); assert.equal(f.doc.activeElement, expected)
  }
  f.doc.activeElement = f.screen
  f.press('Tab', {shiftKey:true})
  assert.equal(f.doc.activeElement, f.button, 'reverse traversal from the wrapper starts at the last control')
  dispose()
})

test('loading without a fullscreen host cannot Tab into covered gameplay controls', () => {
  const f = focusFixture({fullscreen:false}), dispose = bindLoadingFocus(f.screen)
  for (const shiftKey of [false, true]) {
    assert.equal(f.press('Tab', {shiftKey}).defaultPrevented, true)
    assert.equal(f.doc.activeElement, f.screen)
  }
  assert.deepEqual(f.calls, [])
  dispose()
})

test('recovery still cycles details and Retry without fullscreen', () => {
  const f = focusFixture({failed:true, fullscreen:false}), dispose = bindLoadingFocus(f.screen)
  for (const expected of [f.summary, f.retry, f.summary]) {
    f.press(); assert.equal(f.doc.activeElement, expected)
  }
  f.press('Tab', {shiftKey:true}); assert.equal(f.doc.activeElement, f.retry)
  dispose()
})

test('an open dialog, foreign focus, moved portal or detached loader retains its own keyboard owner', () => {
  for (const change of [
    f => { f.doc.modal = {} },
    f => { f.doc.activeElement = {} },
    f => { f.doc.activeElement = f.button; f.portal.parentElement = {} },
    f => { f.screen.isConnected = false },
  ]) {
    const f = focusFixture(), dispose = bindLoadingFocus(f.screen)
    change(f)
    const focused = f.doc.activeElement, event = f.press()
    assert.equal(event.defaultPrevented, false); assert.equal(event.stopped, false)
    assert.equal(f.doc.activeElement, focused); assert.deepEqual(f.calls, [])
    dispose()
  }
})

test('loading Tab listener leaves native activation, Escape and already-owned events unchanged', () => {
  const f = focusFixture(), dispose = bindLoadingFocus(f.screen)
  f.doc.activeElement = f.button
  for (const key of ['Enter', ' ', 'Escape', 'a']) {
    const event = f.press(key)
    assert.equal(event.defaultPrevented, false); assert.equal(event.stopped, false)
  }
  assert.equal(f.press('Tab', {prevented:true}).stopped, false)
  assert.deepEqual(f.calls, [])
  dispose()
})

test('dispose and resubscribe leave exactly one loading Tab owner', () => {
  const f = focusFixture(), first = bindLoadingFocus(f.screen)
  assert.equal(f.listeners.size, 1)
  first(); first()
  assert.equal(f.listeners.size, 0)
  assert.equal(f.press().defaultPrevented, false)
  const second = bindLoadingFocus(f.screen)
  f.press()
  assert.deepEqual(f.calls, ['fullscreen'])
  second(); assert.equal(f.listeners.size, 0)
})

test('mounted loading effect acquires the actual screen and returns its listener cleanup', () => {
  const harness = inspectState(), nodes = harness.render(), f = focusFixture()
  nodes[0].props.ref.current = f.screen
  assert.equal(nodes[0].props.onKeyDown, undefined, 'one native owner handles both DOM siblings')
  harness.effects[1]()
  assert.equal(f.doc.activeElement, f.screen)
  const cleanup = harness.effects[2]()
  assert.equal(f.listeners.size, 1)
  f.press(); assert.equal(f.doc.activeElement, f.button)
  cleanup(); assert.equal(f.listeners.size, 0)
})
