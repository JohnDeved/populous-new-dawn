import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

// Execute the actual scenario readers and frame assertion. Only the page/RAF/
// IndexedDB boundary is supplied; this is oracle coverage, not browser evidence.
const source = ts.createSourceFile('camera-restore-scenario.mjs', readFileSync(
  new URL('../scripts/local-render/camera-restore-scenario.mjs', import.meta.url), 'utf8'),
ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
function find(predicate) {
  const matches = []
  const visit = node => {
    if (predicate(node)) matches.push(node)
    ts.forEachChild(node, visit)
  }
  visit(source)
  assert.equal(matches.length, 1, 'one exact scenario observation implementation')
  return matches[0]
}
const variable = name => find(node => ts.isVariableDeclaration(node) && node.name.getText(source) === name).initializer.getText(source)
const state = new Function(`return (${variable('state')})`)()
const frame = new Function('assert', 'state', `return (${variable('frame')})`)(assert, state)
const checkpointSource = find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'readCameraCheckpoint').getText(source)
const readCameraCheckpoint = new Function(`return (${checkpointSource})`)()
const page = { evaluate: async fn => structuredClone(await fn()) }

function fixture(t) {
  const set = (name, value) => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, name)
    Object.defineProperty(globalThis, name, { value, configurable: true })
    t.after(() => {
      if (previous) Object.defineProperty(globalThis, name, previous)
      else delete globalThis[name]
    })
  }
  const cameras = {
    keys: new Set(['arrowleft']), input: { cursor: 7, pointer: { x: 1, y: 500, buttons: 0 } },
    time: 1 / 96, viewTransition: { preview: undefined }, overviewActive: false,
  }
  const scene = { world: { cameras, drawMode: 0 }, viewPoint: { x: 3, z: 4 },
    cameraBearing: 0.5, view: { globeBlend: 0, globeFlatScale: 1 },
    frame: 1, previous: null, animate() {} }
  set('window', { testSceneRef: { current: scene } })
  set('cancelAnimationFrame', () => {})
  return { cameras, scene, set }
}

test('live camera observation transports nonempty held keys and every other owner field', async t => {
  const { cameras } = fixture(t)
  const first = await state(page)
  assert.deepEqual(first.cameras, { ...cameras, keys: ['arrowleft'] })
  assert.equal(Object.hasOwn(first.cameras.viewTransition, 'preview'), true)
  assert.equal(first.cameras.viewTransition.preview, undefined)
  assert.ok(cameras.keys instanceof Set, 'observation must not normalize the live owner')
  cameras.keys = new Set(['arrowright'])
  const second = await state(page)
  assert.throws(() => assert.deepEqual(first.cameras, second.cameras), assert.AssertionError)
})

test('zero-time unchanged frame accepts and retains nonempty held keys', async t => {
  fixture(t)
  const result = await frame(page)
  assert.deepEqual(result.cameras.keys, ['arrowleft'])
  assert.equal(Object.hasOwn(result.cameras.viewTransition, 'preview'), true)
})

for (const [name, mutate] of [
  ['replace a held key', cameras => { cameras.keys = new Set(['arrowright']) }],
  ['clear a held key', cameras => cameras.keys.clear()],
  ['add a held key', cameras => cameras.keys.add('w')],
  ['delete an own undefined field', cameras => { delete cameras.viewTransition.preview }],
  ['change another owner field', cameras => cameras.input.cursor++],
]) {
  test(`zero-time frame rejects an animate call that would ${name}`, async t => {
    const { cameras, scene } = fixture(t)
    scene.animate = () => mutate(cameras)
    await assert.rejects(frame(page), { name: 'AssertionError',
      message: /zero-time rendered frame preserves complete camera owner/ })
  })
}

test('committed IndexedDB observation uses the same lossless key normalization', async t => {
  const { cameras, set } = fixture(t)
  const record = { version: 1, world: { outcome: { level: 1 }, drawMode: 0, cameras } }
  let closes = 0
  set('indexedDB', {
    databases: async () => [{ name: 'populous-new-dawn' }],
    open(name) {
      assert.equal(name, 'populous-new-dawn')
      const request = {}
      queueMicrotask(() => {
        request.result = {
          close() { closes++ },
          transaction(store, mode) {
            assert.equal(store, 'checkpoints'); assert.equal(mode, 'readonly')
            const transaction = { objectStore: () => ({ get(key) {
              assert.equal(key, 'latest')
              const read = { result: structuredClone(record) }
              queueMicrotask(() => transaction.oncomplete())
              return read
            } }) }
            return transaction
          },
        }
        request.onsuccess()
      })
      return request
    },
  })
  const saved = await readCameraCheckpoint(page)
  assert.deepEqual(saved.cameras, (await state(page)).cameras)
  assert.deepEqual(saved.cameras.keys, ['arrowleft'])
  assert.equal(Object.hasOwn(saved.cameras.viewTransition, 'preview'), true)
  cameras.keys = new Set(['arrowright'])
  const changed = await readCameraCheckpoint(page)
  assert.throws(() => assert.deepEqual(saved.cameras, changed.cameras), assert.AssertionError)
  assert.equal(closes, 2)
})
