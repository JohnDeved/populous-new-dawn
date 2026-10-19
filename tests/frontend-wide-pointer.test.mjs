import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { frontendBackground, frontendScale } from '../app/frontend-composition.ts'

const source = readFileSync(new URL('../app/original-main-menu.tsx', import.meta.url), 'utf8')
const parsed = ts.createSourceFile('menu.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
const bytes = new Uint8Array(readFileSync(new URL('../public/original/frontend/composition.bin', import.meta.url)))
const handlers = new Map(), effects = []
function visit(node) {
  if (ts.isJsxAttribute(node) && ['onPointerMove', 'onPointerLeave'].includes(node.name.getText(parsed))) {
    const owner = node.parent.parent.tagName.getText(parsed)
    if (owner === 'dialog' || owner === 'div') handlers.set(node.name.getText(parsed), { owner, fn: node.initializer.expression })
  }
  if (ts.isCallExpression(node) && ['useEffect', 'useLayoutEffect'].includes(node.expression.getText(parsed))) effects.push(node.arguments[0])
  ts.forEachChild(node, visit)
}
visit(parsed)
function compile(node, context) {
  const code = ts.transpileModule(`return ${node.getText(parsed)}`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
  return new Function(...Object.keys(context), code)(...Object.values(context))
}
function fixture(width, height, reduced = false) {
  const scale = frontendScale(width, height), pending = new Map(), timers = new Map()
  const pointer = { current: { x: 320, y: 240 } }, pointerMode = { current: false }, animation = { current: 0 }, glowFrame = { current: 0 }
  let next = 0, draws = 0, hovered = 'Options'
  const context = {
    frame: { current: { getBoundingClientRect: () => ({ left: (width - 640 * scale) / 2, top: (height - 480 * scale) / 2 }) } },
    scale, pointer, pointerMode, animation, glowFrame,
    requestAnimationFrame: fn => { pending.set(++next, fn); return next },
    cancelAnimationFrame: id => pending.delete(id), draw: () => draws++, setHovered: value => { hovered = value },
    document: { hidden: false },
    window: {
      matchMedia: () => ({ matches: reduced }),
      setInterval: (fn, delay) => { assert.equal(delay, 101); timers.set(++next, fn); return next },
      clearInterval: id => timers.delete(id),
    },
  }
  return { context, pending, timers, pointer, pointerMode, glowFrame, get draws() { return draws }, get hovered() { return hovered },
    move: compile(handlers.get('onPointerMove').fn, context), leave: compile(handlers.get('onPointerLeave').fn, context) }
}

test('full dialog owns pointer motion and exit, not the narrow artwork frame', () => {
  assert.equal(handlers.get('onPointerMove').owner, 'dialog')
  assert.equal(handlers.get('onPointerLeave').owner, 'dialog')
  assert.match(source, /<div ref={frame} className={styles.frame}>/)
})

test('center and both widescreen sides map to original artwork coordinates at resize and DPR', () => {
  for (const [width, height] of [[640,480], [1920,1080], [3440,1440], [2560,1440], [1365,767]]) {
    for (const dpr of [1, 1.25, 2]) {
      const f = fixture(width, height), scale = frontendScale(width, height)
      // PointerEvent client coordinates and DOM bounds are CSS pixels, regardless of DPR.
      f.context.window.devicePixelRatio = dpr
      for (const clientX of [20, width / 2, width - 20]) {
        f.move({ clientX, clientY: height / 2 })
        const expected = Math.floor((clientX - (width - 640 * scale) / 2) / scale)
        assert.deepEqual(f.pointer.current, { x: expected, y: 240 })
        assert.equal(f.pointerMode.current, true)
        assert.equal(f.pending.size, 1, 'motion coalesces, never stacks animation frames')
        const canvasWidth = Math.max(640, 2 * Math.ceil(width / (2 * scale)))
        const plain = frontendBackground(bytes, f.pointer.current, true, null, [], canvasWidth)
        const lit = frontendBackground(bytes, f.pointer.current, true, 0, [], canvasWidth)
        assert.notDeepEqual(lit, plain, 'glow reaches the mapped pointer, including side areas')
        assert.notDeepEqual(lit, frontendBackground(bytes, f.pointer.current, true, 1, [], canvasWidth), 'glow animates')
      }
    }
  }
})

test('keyboard mode, leave and repeated setup/cleanup retain one timer and no pending frame', () => {
  const timerEffect = effects.find(node => node.getText(parsed).includes('setInterval'))
  for (const reduced of [false, true]) {
    const f = fixture(1920,1080,reduced), setup = compile(timerEffect, f.context)
    for (let cycle = 0; cycle < 3; cycle++) {
      const cleanup = setup()
      assert.equal(f.timers.size, reduced ? 0 : 1)
      f.move({ clientX: 10, clientY: 540 })
      f.pointerMode.current = false
      f.move({ clientX: 10, clientY: 540 })
      assert.equal(f.pointerMode.current, false, 'unchanged coordinates do not override keyboard mode')
      f.move({ clientX: 11, clientY: 540 })
      assert.equal(f.pointerMode.current, true)
      for (const tick of f.timers.values()) {
        f.glowFrame.current = 7; tick(); assert.equal(f.glowFrame.current, 0)
        f.context.document.hidden = true; tick(); assert.equal(f.glowFrame.current, 0)
        f.context.document.hidden = false
      }
      f.leave()
      assert.equal(f.pointerMode.current, false)
      assert.equal(f.hovered, null)
      assert.equal(f.pending.size, 0)
      f.move({ clientX: 12, clientY: 540 })
      cleanup()
      assert.equal(f.pending.size, 0, 'reduced-motion pointer frames also clean up')
      assert.equal(f.timers.size, 0)
    }
  }
})

test('resize listener has symmetric ownership across menu remounts', () => {
  const effect = effects.find(node => node.getText(parsed).includes("addEventListener('resize'"))
  const listeners = new Set(), states = []
  let opens = 0, closes = 0
  const window = { innerWidth: 1920, innerHeight: 1080,
    addEventListener: (name, fn) => { assert.equal(name, 'resize'); listeners.add(fn) },
    removeEventListener: (name, fn) => { assert.equal(name, 'resize'); listeners.delete(fn) } }
  const setup = compile(effect, { window, frontendScale, setViewport: state => states.push(state),
    dialog: { current: { showModal() { opens++ }, close() { closes++ } } } })
  for (let cycle = 0; cycle < 3; cycle++) {
    const cleanup = setup(); assert.equal(listeners.size, 1)
    window.innerWidth = 3440; window.innerHeight = 1440
    for (const resize of listeners) resize()
    assert.deepEqual(states.at(-1), { scale: 3, canvasWidth: 1148 })
    cleanup(); assert.equal(listeners.size, 0)
  }
  assert.equal(opens, closes)
})
