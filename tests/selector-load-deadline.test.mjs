import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const source = readFileSync(new URL('../app/world-selector-scene.tsx', import.meta.url), 'utf8')
const ast = ts.createSourceFile('scene.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
const effects = []
function visit(node) {
  if (ts.isCallExpression(node) && node.expression.getText(ast) === 'useEffect' &&
      node.arguments[0]?.getText(ast).includes('new SelectorMotion')) effects.push(node.arguments[0])
  ts.forEachChild(node, visit)
}
visit(ast)
assert.equal(effects.length, 1)
const effect = ts.transpile(`(${effects[0].getText(ast)})`, { target: ts.ScriptTarget.ES2022 })
function fixture() {
  let resolve, reject, next = 0
  const pending = new Promise((yes, no) => { resolve = yes; reject = no })
  const timers = new Map(), frames = new Map(), failures = [], listeners = new Map()
  const canvas = { dataset: {}, addEventListener(name, action) { listeners.set(name, action) },
    removeEventListener(name) { listeners.delete(name) } }
  const renderer = { disposeCalls: 0, load: () => pending, dispose() { this.disposeCalls++ } }
  const scope = {
    canvasRef: { current: canvas }, generation: 0, selection: { current: { mission: 1, progressionMission: 1 } },
    setFailed: value => failures.push(value), setGeneration: () => {},
    SelectorMotion: class {}, SelectorRenderer: class { constructor() { return renderer } },
    selectorWorlds: [], sceneStep: 1 / 120,
    document: { hidden: false, addEventListener() {}, removeEventListener() {} },
    requestAnimationFrame: callback => { const id = ++next; frames.set(id, callback); return id },
    cancelAnimationFrame: id => frames.delete(id),
    setTimeout: (callback, ms) => { const id = ++next; timers.set(id, { callback, ms }); return id },
    clearTimeout: id => timers.delete(id),
  }
  const cleanup = new Function(...Object.keys(scope), `return ${effect}`)(...Object.values(scope))()
  return { resolve, reject, timers, frames, failures, renderer, cleanup, canvas,
    expire() { assert.equal(timers.size, 1, 'pending optional art owns one deadline');
      const [id, timer] = [...timers][0]; assert.equal(timer.ms, 10_000); timers.delete(id); timer.callback() } }
}
const settle = async () => { await Promise.resolve(); await Promise.resolve() }
test('pending selector art reaches existing recoverable failure after bounded wait', async () => {
  const f = fixture(); f.expire()
  assert.deepEqual(f.failures, [false, true]); assert.equal(f.renderer.disposeCalls, 1)
  assert.equal(f.frames.size, 0); assert.equal(f.canvas.dataset.ready, undefined)
  f.resolve(); await settle(); assert.equal(f.frames.size, 0); f.cleanup()
})
test('successful art load cancels deadline and preserves ordinary first frame scheduling', async () => {
  const f = fixture()
  f.resolve(); await settle(); assert.equal(f.timers.size, 0)
  assert.deepEqual(f.failures, [false]); assert.equal(f.frames.size, 1)
  f.cleanup(); assert.equal(f.frames.size, 0)
})
test('load rejection clears deadline and retains existing error recovery', async () => {
  const f = fixture()
  f.reject(new Error('supplied missing image')); await settle()
  assert.equal(f.timers.size, 0); assert.deepEqual(f.failures, [false, true]); f.cleanup()
})
test('unmount cancels owned deadline and late load cannot schedule a frame', async () => {
  const f = fixture(); f.cleanup()
  assert.equal(f.timers.size, 0); f.resolve(); await settle()
  assert.deepEqual(f.failures, [false]); assert.equal(f.frames.size, 0)
})
