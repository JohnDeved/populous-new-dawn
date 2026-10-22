import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'
import * as scrolling from '../app/checkpoint-scroll.ts'

const require = createRequire(import.meta.url)
const source = readFileSync(new URL('../app/checkpoint-scroll-area.tsx', import.meta.url), 'utf8')
const emitted = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX,
  target: ts.ScriptTarget.ES2022,
} }).outputText
const tree = element => !element || typeof element !== 'object' ? []
  : [element, ...[element.props?.children].flat(Infinity).flatMap(tree)]
const same = (a, b) => !!a && a.length === b.length && a.every((value, i) => Object.is(value, b[i]))
function eventTarget() {
  const listeners = new Map()
  return { listeners, addEventListener(type, callback) { listeners.set(type, callback) },
    removeEventListener(type, callback) { if (listeners.get(type) === callback) listeners.delete(type) },
    fire(type, event = {}) { listeners.get(type)?.(event) } }
}

// Executes shipped React handlers/effect lifetimes with measured DOM stand-ins.
// This does not establish actual layout, accessibility-tree or rendered acceptance.
function fixture({ rejectRelease = false, purpose = 'checkpoint' } = {}) {
  const slots = [], effects = [], images = [], observers = []
  let cursor = 0, output, nodes, scrollTop = 0
  const viewport = { clientHeight: 270, scrollHeight: 540,
    get scrollTop() { return scrollTop },
    set scrollTop(value) { scrollTop = Math.max(0, Math.min(this.scrollHeight - this.clientHeight, value)) },
    getBoundingClientRect: () => ({ height: 540 }), focus(options) { this.focused = options },
  }
  const content = {}, scrollbar = eventTarget(), window = eventTarget(), document = eventTarget()
  const captured = new Set(), dragElement = {
    setPointerCapture(id) { captured.add(id) }, hasPointerCapture: id => captured.has(id),
    releasePointerCapture(id) {
      if (rejectRelease) throw new Error('Controlled pointer-release rejection')
      captured.delete(id)
    },
  }
  const react = {
    useId: () => 'checkpoint-details-test',
    useRef(initial) { const slot = cursor++; return slots[slot] ??= { current: initial } },
    useState(initial) {
      const slot = cursor++
      if (!(slot in slots)) slots[slot] = initial
      return [slots[slot], next => { slots[slot] = typeof next === 'function' ? next(slots[slot]) : next }]
    },
    useCallback(callback, deps) {
      const slot = cursor++
      if (!same(slots[slot]?.deps, deps)) slots[slot] = { callback, deps }
      return slots[slot].callback
    },
    useEffect(effect, deps) {
      const slot = cursor++, previous = slots[slot]
      if (same(previous?.deps, deps)) return
      effects.push(() => {
        previous?.cleanup?.()
        slots[slot] = { deps, cleanup: effect() }
      })
    },
  }
  class Image {
    constructor() { images.push(this) }
    set src(url) {
      this.url = url
      const asset = scrolling.checkpointScrollAssets.find(asset => asset.url === url)
      this.naturalWidth = asset.width; this.naturalHeight = asset.height
    }
    decode() { return new Promise((resolve, reject) => { this.resolve = resolve; this.reject = reject }) }
  }
  class ResizeObserver {
    constructor(callback) { this.callback = callback; observers.push(this); this.targets = [] }
    observe(target) { this.targets.push(target) }
    disconnect() { this.disconnected = true }
  }
  const component = { exports: {} }
  new Function('require', 'module', 'exports', 'Image', 'ResizeObserver', 'window', 'document', emitted)(name => {
    if (name === 'react') return react
    if (name === 'react/jsx-runtime') return require(name)
    if (name === './checkpoint-scroll') return scrolling
    if (name.endsWith('.module.css')) return Object.fromEntries(
      ['area', 'viewport', 'content', 'loadingContent', 'scrollbar', 'thumb', 'cap', 'drag'].map(key => [key, key]))
    throw Error(`Unexpected dependency: ${name}`)
  }, component, component.exports, Image, ResizeObserver, window, document)
  function render() {
    cursor = 0
    output = component.exports.CheckpointScrollArea({ children: 'All existing checkpoint warnings', purpose })
    nodes = tree(output)
    for (const node of nodes) if (node.props.ref) node.props.ref.current =
      ({ viewport, content, loadingContent: content, scrollbar })[node.props.className]
    while (effects.length) effects.shift()()
    return output
  }
  function find(className) { return nodes.find(node => node.props.className === className) }
  function sync() { find('viewport').props.onScroll(); render() }
  function pointer(name, extra = {}) {
    const event = { pointerId: 7, button: 0, clientY: 100, currentTarget: dragElement,
      preventDefault() {}, stopPropagation() {}, ...extra }
    find('drag').props[name](event)
  }
  async function decode(failure = false, badSize = false) {
    images.forEach((image, i) => {
      if (badSize && i === 0) image.naturalWidth++
      failure && i === 0 ? image.reject(Error('missing original art')) : image.resolve()
    })
    await new Promise(resolve => setImmediate(resolve))
    render()
  }
  function unmount() { slots.forEach(slot => slot?.cleanup?.()) }
  render(); render()
  return { render, find, pointer, decode, sync, unmount, viewport, scrollbar, window, document,
    captured, observers, images, output: () => output, nodes: () => nodes }
}

test('five original Help images retain exact imported bytes and dimensions', () => {
  const provenance = JSON.parse(readFileSync(new URL('../references/checkpoint-scrollbar-art.json', import.meta.url)))
  assert.equal(provenance.sourceCommit, 'fd34c4a60b643c294c167ab9bcd83b5871a82fd3')
  assert.deepEqual(Object.keys(provenance.assets), ['451', '452', '453', '454', '455'])
  for (const asset of Object.values(provenance.assets)) {
    const bytes = readFileSync(new URL('../public' + asset.url, import.meta.url))
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256)
    assert.deepEqual([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], [asset.width, asset.height])
    assert.ok(scrolling.checkpointScrollAssets.some(value => value.url === asset.url && value.width === asset.width && value.height === asset.height))
  }
})

test('browser geometry clamps thumb travel and retains native-size caps plus a usable body', () => {
  const geometry = scrolling.checkpointScrollGeometry
  assert.deepEqual(geometry(270, 200, 0), { maximum: 0, thumb: 0, travel: 270, offset: 0 })
  assert.deepEqual(geometry(270, 540, 0), { maximum: 270, thumb: 135, travel: 135, offset: 0 })
  assert.equal(geometry(270, 540, 135).offset, 68)
  assert.equal(geometry(270, 540, -100).offset, 0)
  assert.equal(geometry(270, 540, 9999).offset, 135)
  assert.equal(geometry(270, 100000, 0).thumb, 34)
  for (const scale of [0.5, 1, 2, 4]) {
    assert.equal(scrolling.checkpointDragPosition(0, 135 * scale, 270 * scale, 270, 540), 270)
    assert.equal(scrolling.checkpointDragPosition(270, -135 * scale, 270 * scale, 270, 540), 0)
  }
})

test('system scrollbar remains available until every original asset has decoded', async () => {
  const ui = fixture()
  assert.equal(ui.output().props['data-scroll-art'], false)
  assert.equal(ui.find('scrollbar'), undefined)
  assert.equal(ui.find('viewport').props.tabIndex, 0)
  assert.equal(ui.find('viewport').props['data-pause-checkpoint-scroll'], true)
  assert.equal(ui.find('viewport').props['aria-label'], 'Checkpoint details')
  assert.equal(ui.output().props['aria-label'], undefined, 'the outer wrapper must not impersonate the actual scroller')
  assert.equal(ui.find('viewport').props.onKeyDown, undefined, 'keyboard scrolling stays browser-owned')
  assert.equal(ui.images.length, 5)
  await ui.decode()
  assert.equal(ui.output().props['data-scroll-art'], true)
  assert.equal(ui.find('thumb').props.style.height, 135)
  ui.unmount()
})

for (const [label, failure, badSize] of [['missing', true, false], ['wrong-size', false, true]]) {
  test(`${label} original artwork preserves the visible system-scrollbar fallback`, async () => {
    const ui = fixture()
    await ui.decode(failure, badSize)
    assert.equal(ui.output().props['data-scroll-art'], false)
    assert.equal(ui.find('scrollbar'), undefined)
    ui.unmount()
  })
}

test('real cap buttons scroll one native text line and use original hover/focus caps', async () => {
  const ui = fixture(); await ui.decode()
  const cap = direction => ui.nodes().find(node => node.type === 'button' && node.props['aria-label'].endsWith(direction))
  assert.equal(cap('down').props['aria-controls'], 'checkpoint-details-test')
  assert.equal(cap('down').props.tabIndex, 0, 'pause navigation must not intercept scrollbar keyboard focus')
  assert.equal(cap('down').props['data-pause-checkpoint-cap'], 'down')
  assert.equal(cap('up').props['data-pause-checkpoint-cap'], 'up')
  assert.equal(cap('down').props['data-pause-action'], undefined, 'scrollbar caps are not native menu action rows')
  cap('down').props.onClick(); ui.sync()
  assert.equal(ui.viewport.scrollTop, 30)
  assert.equal(ui.find('thumb').props.style.top, 15)
  cap('down').props.onPointerEnter(); ui.render()
  assert.ok(cap('down').props.children.props.src.endsWith('454.png'))
  cap('up').props.onFocus(); ui.render()
  assert.ok(cap('up').props.children.props.src.endsWith('453.png'))
  cap('up').props.onClick(); ui.sync()
  assert.equal(ui.viewport.scrollTop, 0)
  ui.unmount()
})

test('drag is scale-aware, pointer-owned and clamped without overshoot debt', async () => {
  const ui = fixture(); await ui.decode()
  ui.pointer('onPointerDown', { button: 2 }); assert.equal(ui.captured.size, 0)
  ui.pointer('onPointerDown'); assert.deepEqual([...ui.captured], [7])
  assert.deepEqual(ui.viewport.focused, { preventScroll: true })
  ui.pointer('onPointerMove', { pointerId: 8, clientY: 300 }); assert.equal(ui.viewport.scrollTop, 0)
  ui.pointer('onPointerMove', { clientY: 235 }); ui.sync(); assert.equal(ui.viewport.scrollTop, 135)
  ui.pointer('onPointerMove', { clientY: 1000 }); ui.sync(); assert.equal(ui.viewport.scrollTop, 270)
  ui.pointer('onPointerMove', { clientY: 990 }); ui.sync(); assert.equal(ui.viewport.scrollTop, 260)
  ui.pointer('onPointerUp', { pointerId: 8 }); assert.equal(ui.captured.size, 1)
  ui.pointer('onPointerUp'); assert.equal(ui.captured.size, 0)
  ui.pointer('onPointerMove', { clientY: 900 }); assert.equal(ui.viewport.scrollTop, 260)
  ui.unmount()
})

for (const finish of ['onPointerCancel', 'onLostPointerCapture', 'blur', 'visibilitychange', 'resize', 'unmount']) {
  test(`${finish} releases checkpoint drag ownership and all unmount listeners`, async () => {
    const ui = fixture(); await ui.decode(); ui.pointer('onPointerDown')
    if (finish.startsWith('on')) ui.pointer(finish)
    else if (finish === 'visibilitychange') ui.document.fire(finish)
    else if (finish === 'unmount') ui.unmount()
    else ui.window.fire(finish)
    assert.equal(ui.captured.size, 0)
    ui.unmount()
    assert.equal(ui.window.listeners.size, 0)
    assert.equal(ui.document.listeners.size, 0)
    assert.equal(ui.scrollbar.listeners.size, 0)
    assert.ok(ui.observers.every(observer => observer.disconnected))
  })
}

for (const finish of ['onPointerUp', 'onPointerCancel', 'onLostPointerCapture', 'blur', 'visibilitychange', 'resize', 'unmount']) {
  test(`rejected capture release during ${finish} cannot retain local drag ownership or skip cleanup`, async () => {
    const ui = fixture({ rejectRelease: true }); await ui.decode(); ui.pointer('onPointerDown')
    assert.doesNotThrow(() => {
      if (finish.startsWith('on')) ui.pointer(finish)
      else if (finish === 'visibilitychange') ui.document.fire(finish)
      else if (finish === 'unmount') ui.unmount()
      else ui.window.fire(finish)
    })
    ui.pointer('onPointerMove', { clientY: 200 })
    assert.equal(ui.viewport.scrollTop, 0, 'a rejected DOM release must not leave a live drag owner')
    assert.doesNotThrow(ui.unmount)
    assert.equal(ui.window.listeners.size, 0)
    assert.equal(ui.document.listeners.size, 0)
    assert.equal(ui.scrollbar.listeners.size, 0)
    assert.ok(ui.observers.every(observer => observer.disconnected))
    // A throwing browser API cannot prove successful physical capture release;
    // only the local owner and independently completed cleanup are asserted.
  })
}

test('wheel over the art scrolls the same viewport; layout changes remove unnecessary controls', async () => {
  const ui = fixture(); await ui.decode()
  let prevented = 0
  for (const [deltaY, deltaMode, expected] of [[10, 0, 10], [2, 1, 70], [1, 2, 270]]) {
    ui.scrollbar.fire('wheel', { deltaY, deltaMode, preventDefault() { prevented++ }, stopPropagation() {} })
    assert.equal(ui.viewport.scrollTop, expected)
    ui.sync()
  }
  assert.equal(prevented, 3)
  ui.pointer('onPointerDown')
  ui.viewport.scrollHeight = 200
  ui.observers[0].callback(); ui.render()
  assert.equal(ui.output().props['data-scroll-art'], false)
  assert.equal(ui.find('scrollbar'), undefined)
  assert.equal(ui.captured.size, 0)
  ui.unmount()
})

test('late image completion after unmount cannot enable the custom scrollbar', async () => {
  const ui = fixture()
  ui.unmount(); await ui.decode()
  assert.equal(ui.output().props['data-scroll-art'], false)
})

test('CSS keeps centered native-width copy, focus outlines, nearest-neighbor art and forced-color fallback', () => {
  const css = readFileSync(new URL('../app/checkpoint-scroll-area.module.css', import.meta.url), 'utf8')
  assert.match(css, /width: 368px; margin: 0 auto/)
  assert.match(css, /\.viewport:focus-visible \{ outline: 1px solid/)
  assert.match(css, /\.scrollbar \.cap:focus-visible \{ outline: 1px solid/)
  assert.match(css, /image-rendering: pixelated; image-rendering: crisp-edges/)
  assert.match(css, /@media \(forced-colors: active\)/)
  assert.match(css, /scrollbar-width: auto/)
  assert.match(css, /\.scrollbar \{ display: none; \}/)
})


test('loading opt-in reuses the same real scroll controller with separate owners and labels', async () => {
  const ui = fixture({ purpose: 'loading' })
  assert.equal(ui.output().props['data-loading-scroll-area'], true)
  assert.equal(ui.find('viewport').props['data-pause-checkpoint-scroll'], undefined)
  assert.equal(ui.find('viewport').props['data-loading-recovery-scroll'], true)
  assert.equal(ui.find('viewport').props['aria-label'], 'Loading recovery details')
  assert.ok(ui.find('loadingContent'))
  await ui.decode()
  for (const direction of ['up', 'down']) {
    const cap = ui.nodes().find(node => node.props?.['data-loading-scroll-cap'] === direction)
    assert.equal(cap.props['data-pause-checkpoint-cap'], undefined)
    assert.equal(cap.props['aria-label'], `Scroll loading recovery details ${direction}`)
    assert.equal(cap.props['aria-controls'], ui.find('viewport').props.id)
    assert.equal(cap.props.tabIndex, 0)
  }
  ui.nodes().find(node => node.props?.['data-loading-scroll-cap'] === 'down').props.onClick()
  ui.sync(); assert.equal(ui.viewport.scrollTop, 30)
  ui.pointer('onPointerDown'); ui.pointer('onPointerMove', { clientY: 235 })
  ui.sync(); assert.equal(ui.viewport.scrollTop, 165)
  ui.pointer('onPointerCancel'); assert.equal(ui.captured.size, 0)
  ui.viewport.scrollHeight = 200; ui.observers[0].callback(); ui.render()
  assert.equal(ui.find('viewport').props.tabIndex, -1, 'no extra Tab stop without actual overflow')
  assert.equal(ui.find('scrollbar'), undefined)
  ui.unmount()
  assert.equal(ui.window.listeners.size, 0)
})

for (const [label, failure, badSize] of [['missing', true, false], ['wrong-size', false, true]]) {
  test(`loading ${label} art keeps the browser viewport and no false custom bar`, async () => {
    const ui = fixture({ purpose: 'loading' }); await ui.decode(failure, badSize)
    assert.equal(ui.output().props['data-scroll-art'], false)
    assert.equal(ui.find('scrollbar'), undefined)
    assert.equal(ui.find('viewport').props.tabIndex, 0)
    ui.unmount()
  })
}

test('loading CSS reserves art and fullscreen gutters without changing the fixed checkpoint layout', () => {
  const css = readFileSync(new URL('../app/checkpoint-scroll-area.module.css', import.meta.url), 'utf8')
  assert.match(css, /\.loadingContent \{[^}]*min-height: 100%[^}]*justify-content: safe center[^}]*padding: 28px 32px/)
  assert.match(css, /@media \(max-width: 680px\) \{ \.loadingContent \{ padding-left: 44px/)
  assert.match(css, /\.area\[data-loading-scroll-area\] \.viewport:focus-visible \{ outline-offset: -2px/)
  assert.match(css, /\.area\[data-loading-scroll-area\] \.cap:focus-visible \{ outline-offset: -1px/)
  assert.match(css, /\.content \{[^}]*width: 368px; margin: 0 auto/)
})
