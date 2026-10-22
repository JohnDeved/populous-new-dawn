import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { hudContentHeight, hudScale } from '../app/hud-layout.ts'
import { pageEffect, pageNode, pageSource, evaluatePage } from './support/follower-nearby-page.mjs'

const read = path => readFileSync(new URL('../app/' + path, import.meta.url), 'utf8')
function expression(source, predicate) {
  const found = []
  function visit(node) {
    if (predicate(node)) found.push(node)
    ts.forEachChild(node, visit)
  }
  visit(source)
  assert.equal(found.length, 1)
  return found[0].getText(source)
}

test('actual page resize effect follows roster expansion/contraction and removes obsolete listeners', () => {
  const values = new Map(), listeners = new Map()
  const window = { innerWidth: 640, innerHeight: 480,
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: (name, callback) => { assert.equal(listeners.get(name), callback); listeners.delete(name) } }
  let cleanup
  const keys = []
  const frame = pageNode(node => ts.isJsxSelfClosingElement(node) && node.tagName.getText(pageSource) === 'MinimapFrame')
  for (const count of [17, 20, 17]) {
    cleanup?.()
    const hudSize = 'auto', hudHeight = hudContentHeight(count)
    cleanup = pageEffect("'--hud-scale'", {
      shell: { current: { style: { setProperty: (name, value) => values.set(name, value) } } },
      window, hudSize, spellRoster: Array(count), hudScale,
      messageScreenX: () => 100, setMessageViewportHeight: () => {},
    })()
    const scale = Number(values.get('--hud-scale'))
    assert.equal(scale, count === 20 ? 480 / 522 : 1)
    assert.equal(listeners.size, 1)
    keys.push(evaluatePage(frame.getText(pageSource), { MinimapFrame: 'Frame', hudSize, hudHeight }).props.key)
    assert.ok(hudHeight * scale <= window.innerHeight + 1e-9)
    window.innerHeight = 240
    listeners.get('resize')()
    assert.equal(Number(values.get('--hud-scale')), count === 20 ? 240 / 522 : 0.5)
    window.innerHeight = 480
  }
  cleanup()
  assert.equal(listeners.size, 0)
  assert.deepEqual(keys, ['auto-480', 'auto-522', 'auto-480'])
})

test('actual minimap effect redraws backing pixels after scale changes and cleans pending callbacks', () => {
  const source = ts.createSourceFile('minimap-frame-view.tsx', read('minimap-frame-view.tsx'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const effect = expression(source, node => ts.isCallExpression(node) && node.expression.getText(source) === 'useEffect')
  let scale = 1, serial = 0
  const queued = new Map(), events = new Map(), draws = [], loads = new Map()
  const frame = { getContext: () => ({}), getBoundingClientRect: () => ({ width: 100 * scale, height: 96 * scale }) }
  const window = { innerWidth: 640, addEventListener: (name, fn) => events.set(name, fn), removeEventListener: name => events.delete(name) }
  const mount = () => evaluatePage(effect, {
    useEffect: fn => fn(), canvas: { current: frame }, window,
    Image: class { complete = true; naturalWidth = 100; addEventListener(name, fn) { loads.set(name, fn) } removeEventListener(name) { loads.delete(name) } },
    requestAnimationFrame: fn => { queued.set(++serial, fn); return serial },
    cancelAnimationFrame: id => queued.delete(id),
    drawMinimapFrame: (...args) => draws.push(args.slice(2)),
  })
  const flush = () => { const callbacks = [...queued.values()]; queued.clear(); callbacks.forEach(fn => fn()) }
  let cleanup = mount()
  flush()
  assert.deepEqual(draws.at(-1), [100, 96, 640])
  cleanup()
  cleanup = mount() // React key changes before the parent applies the new fit.
  scale = 480 / 522
  flush()
  assert.deepEqual(draws.at(-1), [Math.round(100 * scale), Math.round(96 * scale), 640])
  events.get('resize')()
  assert.equal(queued.size, 1)
  cleanup()
  assert.equal(queued.size, 0)
  assert.equal(events.size, 0)
  assert.equal(loads.size, 0)
})

test('actual worship callback uses measured targets then cached logical targets after tab and scale changes', () => {
  const declaration = pageNode(node => ts.isVariableDeclaration(node) && node.name.getText(pageSource) === 'measureWorshipHud')
  let scale = 1, connected = true
  const rect = (x, y, width, height) => ({ x, y, width, height })
  const shell = { current: { isConnected: true, getBoundingClientRect: () => rect(10, 20, 640, 480) } }
  const panel = { isConnected: true, offsetWidth: 100, getBoundingClientRect: () => rect(10, 20, 100 * scale, 480) }
  const view = { isConnected: true, getBoundingClientRect: () => rect(10 + 100 * scale, 20, 640 - 100 * scale, 480) }
  const button = { get isConnected() { return connected }, getBoundingClientRect: () => rect(10 + 4 * scale, 20 + 212 * scale, 31 * scale, 43 * scale) }
  const measure = evaluatePage(declaration.initializer.getText(pageSource), {
    useCallback: fn => fn, shell, hudPanel: { current: panel }, viewport: { current: view },
    spellButtons: { current: new Map([[12, button]]) }, campButton: { current: button }, templeButton: { current: button },
  })
  const first = measure(12)
  assert.deepEqual(first.targetRect, rect(4, 212, 31, 43))
  const fallback = { targetHud: first.targetHud, targetRect: first.targetRect }
  connected = false
  for (scale of [0.5, 480 / 522, 1]) {
    const cached = measure(12, fallback)
    assert.ok(Math.abs(cached.targetRect.x - 4 * scale) < 1e-9)
    assert.ok(Math.abs(cached.targetRect.y - 212 * scale) < 1e-9)
    assert.equal(cached.targetRect.width, 31 * scale)
    assert.equal(cached.viewport.x, 100 * scale)
    assert.equal(cached.viewport.width + cached.viewport.x, 640)
  }
  assert.equal(measure(12), null, 'missing target and fallback never invent a destination')
  connected = true
  assert.deepEqual(measure(12, fallback).targetRect, first.targetRect)
})

test('actual world and minimap pointer normalization follows the resized HUD seam', () => {
  const source = ts.createSourceFile('scene-input-runtime.ts', read('scene-input-runtime.ts'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const pick = evaluatePage(expression(source, node => ts.isFunctionDeclaration(node) && node.name?.text === 'pick').replace(/^export /, ''), { pickRuntimeTerrain: () => null })
  const handler = expression(source, node => ts.isCallExpression(node) && node.expression.getText(source) === 'scene.listen' && node.arguments[0]?.getText(source) === 'minimap' && node.arguments[1]?.getText(source) === "'pointerdown'")
  for (const count of [17, 20, 17]) {
    const scale = hudScale(640, 480, 'auto', count), seam = 100 * scale
    let pointer, miniPoint
    const scene = { world: { inputMask: 0 }, cameraBearing: 0, viewPoint: {}, mini: { width: 100, height: 96 },
      renderer: { domElement: { getBoundingClientRect: () => ({ left: seam, top: 0, width: 640 - seam, height: 480 }) } },
      mouse: { set: (x, y) => { pointer = [x, y] } }, focus: () => {}, listen: (_, name, fn) => fn({ button: 0, clientX: seam / 2, clientY: 48 * scale }) }
    pick(scene, { clientX: seam, clientY: 240 })
    assert.deepEqual(pointer, [-1, 0])
    pick(scene, { clientX: seam + (640 - seam) / 2, clientY: 240 })
    assert.deepEqual(pointer, [0, 0])
    evaluatePage(handler, { scene, minimap: { getBoundingClientRect: () => ({ left: 0, top: 0, width: seam, height: 96 * scale }) },
      nativePosition: () => ({}), browserPosition: value => value,
      minimapPick: (...args) => { miniPoint = args.at(-1); return miniPoint } })
    assert.deepEqual(miniPoint, { x: 50, y: 48 })
  }
})
