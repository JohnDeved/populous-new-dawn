import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import ts from 'typescript'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8')
const url = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
function transpile(source, imports) {
  let code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  for (const [key, value] of Object.entries(imports)) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`(['"])${escaped}\\1`, 'g')
    assert.equal([...code.matchAll(pattern)].length, 1, key)
    code = code.replace(pattern, JSON.stringify(value))
  }
  return url(code)
}
const frameImports = {
  'react/jsx-runtime': import.meta.resolve('react/jsx-runtime'),
  './original-credits-layout': url(stripTypeScriptTypes(read('../app/original-credits-layout.ts'))),
}
for (const name of ['original-credits.json', 'original-pause-font.json', 'original-result-ui.json']) {
  frameImports[`./${name}`] = url(`export default ${read(`../app/${name}`)}`)
}
const frameUrl = transpile(read('../app/original-credits-frame.tsx'), frameImports)
const sessionUrl = url(stripTypeScriptTypes(read('../app/original-credits-session.ts')))
const screenSource = read('../app/original-credits-screen.tsx')
const imports = { 'react/jsx-runtime': import.meta.resolve('react/jsx-runtime'), './original-credits-frame': frameUrl, './original-credits-session': sessionUrl }
const { OriginalCreditsScreen: RealScreen } = await import(transpile(screenSource, { ...imports, react: import.meta.resolve('react') }))
const hookUrl = url(`const h=()=>globalThis.__creditsHooks; export const useRef=v=>h().ref(v); export const useState=v=>h().state(v); export const useEffect=(f,d)=>h().effect(f,d); export const useLayoutEffect=(f,d)=>h().layout(f,d);`)
const { OriginalCreditsScreen: HarnessScreen } = await import(transpile(screenSource, { ...imports, react: hookUrl }))
const props = { screen: { width: 640, height: 480 }, presentation: { mode: 'browser-adapter', background: [11, 15, 11] }, onReturn: () => {} }
function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements)
  if (!node || !node.props) return []
  return [node, ...elements(node.props.children)]
}
const find = (node, predicate) => elements(node).find(predicate)
const event = overrides => ({ code: 'Space', repeat: false, stopped: false, prevented: false, stopPropagation() { this.stopped = true }, preventDefault() { this.prevented = true }, ...overrides })

// This deterministic hook/effect harness exercises actual handlers and owner
// callbacks. It is intentionally not a mounted React/browser rendering claim.
function harness(initialProps = props) {
  const originals = new Map()
  const assign = (name, value) => { originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name)); Object.defineProperty(globalThis, name, { configurable: true, writable: true, value }) }
  let now = 0
  let nextId = 0
  const raf = new Map()
  const images = []
  const windowTarget = new EventTarget()
  const documentTarget = new EventTarget()
  documentTarget.hidden = false
  documentTarget.hasFocus = () => true
  assign('window', windowTarget); assign('document', documentTarget)
  assign('performance', { now: () => now })
  assign('requestAnimationFrame', fn => { raf.set(++nextId, fn); return nextId })
  assign('cancelAnimationFrame', id => raf.delete(id))
  assign('Image', class {
    constructor() { images.push(this); this.promise = new Promise((resolve, reject) => { this.resolve = resolve; this.reject = reject }) }
    decode() { return this.promise }
  })
  const slots = []
  let cursor = 0
  let jobs = []
  const effects = []
  function effect(fn, deps) {
    const index = cursor++
    const prior = slots[index]
    if (!prior || deps.some((value, i) => value !== prior.deps[i])) {
      jobs.push(() => { prior?.cleanup?.(); const cleanup = fn(); slots[index] = { deps, cleanup }; effects.push(index) })
    }
  }
  assign('__creditsHooks', {
    ref(value) { const index = cursor++; return slots[index] ??= { current: value } },
    state(value) { const index = cursor++; if (!(index in slots)) slots[index] = typeof value === 'function' ? value() : value; return [slots[index], next => { slots[index] = typeof next === 'function' ? next(slots[index]) : next }] },
    effect, layout: effect,
  })
  const rootTarget = { listeners: new Map(), captured: [], addEventListener(name, fn) { this.listeners.set(name, fn) }, removeEventListener(name, fn) { if (this.listeners.get(name) === fn) this.listeners.delete(name) }, setPointerCapture(id) { this.captured.push(id) } }
  const backTarget = { contains(target) { return target === this } }
  let currentProps = initialProps
  let root
  const render = (next = currentProps) => {
    currentProps = next; cursor = 0; root = HarnessScreen(next)
    root.props.ref.current = rootTarget
    find(root, node => node.type === 'button').props.ref.current = backTarget
    const pending = jobs; jobs = []; for (const job of pending) job()
    return root
  }
  render()
  return {
    get root() {
      const handlers = Object.fromEntries(['KeyDown', 'KeyUp', 'PointerDown', 'PointerUp', 'PointerCancel', 'ContextMenu'].map(name => [`on${name}`, e => rootTarget.listeners.get(name.toLowerCase())?.({ ...e, target: e.target ?? rootTarget })]))
      // Preserve event identity so tests observe preventDefault/stopPropagation.
      for (const name of ['KeyDown', 'KeyUp', 'PointerDown', 'PointerUp', 'PointerCancel', 'ContextMenu']) handlers[`on${name}`] = e => { e.target ??= rootTarget; rootTarget.listeners.get(name.toLowerCase())?.(e) }
      return { ...root, props: { ...root.props, ...handlers } }
    }, render, raf, images, windowTarget, documentTarget, rootTarget, backTarget,
    step(value) { now = value; const [id, callback] = raf.entries().next().value; raf.delete(id); callback() },
    async ready() { for (const image of images) image.resolve(); await Promise.resolve(); await Promise.resolve() },
    unmount() { for (const index of new Set(effects)) slots[index]?.cleanup?.() },
    restore() { this.unmount(); for (const [name, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name] } },
  }
}

test('real ReactDOM serializes the explicit mounted-screen adapter and loading/Back accessibility', () => {
  const html = renderToStaticMarkup(createElement(RealScreen, props))
  assert.match(html, /data-original-credits-screen/)
  assert.match(html, /data-credits-presentation="browser-adapter"/)
  assert.match(html, /Loading original Credits artwork/)
  assert.match(html, /aria-label="Back to main menu"/)
  assert.match(html, /tabindex="-1"/)
})
test('two exact atlas decodes gate scrolling and ready frames use the current viewport', async () => {
  const h = harness()
  try {
    assert.deepEqual(h.images.map(image => image.src), ['/original/pause-font.png', '/original/result-font.png'])
    h.step(100)
    await h.ready()
    h.render({ ...props, screen: { width: 800, height: 480 } })
    h.step(101)
    const root = h.render()
    const frame = find(root, node => node.props.fontStatus !== undefined)
    assert.equal(frame.props.fontStatus, 'ready')
    assert.equal(frame.props.frame.width, 800)
    assert.equal(frame.props.frame.origin, -1)
  } finally { h.restore() }
})
test('Escape is owned by Credits and repeated or stale returns cannot invoke the menu twice', () => {
  let returned = 0
  const h = harness({ ...props, onReturn: () => { returned += 1 } })
  try {
    const stale = [...h.raf.values()][0]
    const down = event({ code: 'Escape' }); h.root.props.onKeyDown(down)
    assert.equal(down.stopped, true); assert.equal(down.prevented, true)
    h.step(1)
    find(h.root, node => node.type === 'button').props.onClick()
    stale()
    assert.equal(returned, 1)
    assert.equal(h.raf.size, 0)
  } finally { h.restore() }
})
test('Back owns Space and Enter without preventing native button activation, Escape still bubbles', () => {
  const h = harness()
  try {
    const button = find(h.root, node => node.type === 'button')
    for (const code of ['Space', 'Enter']) {
      for (const handler of ['onKeyDown', 'onKeyUp']) {
        const e = event({ code }); button.props[handler](e)
        assert.equal(e.stopped, true); assert.equal(e.prevented, false)
      }
    }
    const nativeSpace = event({ code: 'Space', target: h.backTarget }); h.root.props.onKeyDown(nativeSpace)
    assert.equal(nativeSpace.prevented, false); assert.equal(nativeSpace.stopped, false)
    const escape = event({ code: 'Escape' }); button.props.onKeyDown(escape)
    assert.equal(escape.stopped, false)
  } finally { h.restore() }
})
test('OS repeated keydown is ignored, while same-frame pointer release is retained', () => {
  let returned = 0
  const h = harness({ ...props, onReturn: () => { returned += 1 } })
  try {
    h.root.props.onKeyDown(event({ code: 'Escape', repeat: true }))
    const captured = []
    const pointer = event({ button: 0, pointerId: 9, currentTarget: { setPointerCapture: id => captured.push(id) } })
    h.root.props.onPointerDown(pointer); h.root.props.onPointerUp(pointer); h.step(1)
    assert.equal(returned, 0); assert.deepEqual(h.rootTarget.captured, [9])
    h.root.props.onPointerDown(pointer); h.step(2)
    assert.equal(returned, 1)
  } finally { h.restore() }
})
test('late asset completion and RAF cannot update or return after unmount, and listeners are removed', async () => {
  let returned = 0
  const h = harness({ ...props, onReturn: () => { returned += 1 } })
  try {
    const stale = [...h.raf.values()][0]
    h.unmount(); await h.ready(); stale()
    h.windowTarget.dispatchEvent(new Event('focus'))
    h.documentTarget.dispatchEvent(new Event('visibilitychange'))
    assert.equal(h.raf.size, 0); assert.equal(returned, 0); assert.equal(h.rootTarget.listeners.size, 0)
    assert.equal(find(h.render(), node => node.props.fontStatus !== undefined).props.fontStatus, 'loading')
  } finally { h.restore() }
})
test('asset failure is visible and Back remains usable instead of trapping the modal', async () => {
  let returned = 0
  const h = harness({ ...props, onReturn: () => { returned += 1 } })
  try {
    h.images[0].reject(new Error('decode failed')); await Promise.resolve(); await Promise.resolve()
    assert.equal(find(h.render(), node => node.props.fontStatus !== undefined).props.fontStatus, 'failed')
    find(h.root, node => node.type === 'button').props.onClick()
    assert.equal(returned, 1)
  } finally { h.restore() }
})
test('latest return callback replaces stale props without restarting an existing session', () => {
  let old = 0; let latest = 0
  const h = harness({ ...props, onReturn: () => { old += 1 } })
  try {
    const count = h.images.length
    h.render({ ...props, onReturn: () => { latest += 1 } })
    find(h.root, node => node.type === 'button').props.onClick()
    assert.equal(old, 0); assert.equal(latest, 1); assert.equal(h.images.length, count)
  } finally { h.restore() }
})

test('viewport changes update the visible frame while playback is paused', () => {
  const h = harness()
  try {
    h.windowTarget.dispatchEvent(new Event('blur'))
    const root = h.render({ ...props, screen: { width: 802, height: 480 } })
    assert.equal(find(root, node => node.props.fontStatus !== undefined).props.frame.width, 802)
    assert.equal(h.raf.size, 0)
  } finally { h.restore() }
})
test('playback failure shows an in-viewport notice and independent Back remains usable', () => {
  let returned = 0
  const h = harness({ ...props, onReturn: () => { returned += 1 } })
  try {
    for (let i = 0; i < 257; i += 1) h.root.props.onKeyDown(event({ code: 'KeyA' }))
    const root = h.render()
    const alert = find(root, node => node.props.role === 'alert')
    assert.equal(alert.props.style.position, 'absolute')
    assert.equal(alert.props.style.top, 16)
    assert.equal(h.raf.size, 0)
    find(root, node => node.type === 'button').props.onClick()
    assert.equal(returned, 1)
  } finally { h.restore() }
})
