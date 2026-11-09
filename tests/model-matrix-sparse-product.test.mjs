import assert from 'node:assert/strict'
import test from 'node:test'
import { registerHooks } from 'node:module'
import { pathToFileURL } from 'node:url'
import * as THREE from 'three'
import rules from '../app/original-rules.json' with { type: 'json' }
import { modelMatrix, rotateBasis } from '../app/projection.ts'
import { RenderView } from '../app/render-view.ts'

// Frozen pre-change modelMatrix body from 55770f1a. rotateBasis is unchanged.
// A pristine full projection module can additionally supply an independent oracle.
const dot = (a, b) => (Math.imul(a[0], b[0]) + Math.imul(a[1], b[1]) + Math.imul(a[2], b[2])) | 0
function referenceModelMatrix(heading, pitch = 0, roll = 0) {
  const sp = rules.sine[pitch & 2047] >> 2,
    cp = rules.sine[(pitch + 512) & 2047] >> 2
  const sr = rules.sine[roll & 2047] >> 2,
    cr = rules.sine[(roll + 512) & 2047] >> 2
  const a = [
      [cr, -sr, 0],
      [sr, cr, 0],
      [0, 0, 16384],
    ],
    b = [
      [16384, 0, 0],
      [0, cp, -sp],
      [0, sp, cp],
    ]
  const matrix = a.flatMap(row => [0, 1, 2].map(i => dot(row, [b[0][i], b[1][i], b[2][i]]) >> 14))
  return heading || pitch || roll ? rotateBasis(matrix, -heading, 2) : matrix
}


let baseline = referenceModelMatrix
if (process.env.PND_MODEL_MATRIX_BASELINE) {
  const url = pathToFileURL(process.env.PND_MODEL_MATRIX_BASELINE).href
  const current = new URL('../app/projection.ts', import.meta.url).href
  const hook = registerHooks({ resolve(specifier, context, next) {
    return next(specifier, context.parentURL === url ? { ...context, parentURL: current } : context)
  } })
  try { baseline = (await import(url)).modelMatrix }
  finally { hook.deregister() }
}

function outcome(fn, args) {
  try { return { value: fn(...args) } }
  catch (error) { return { error: { name: error.name, message: error.message } } }
}
function equivalent(args) {
  const expected = outcome(baseline, args)
  assert.deepEqual(outcome(referenceModelMatrix, args), expected)
  assert.deepEqual(outcome(modelMatrix, args), expected)
}

test('all native angles and deterministic signed-32-bit poses match the pristine arithmetic', () => {
  for (let angle = 0; angle < 2048; angle++) {
    for (const pose of [[angle, 0, 0], [0, angle, 0], [0, 0, angle],
      [angle, 64, 32], [angle, -128, 1024], [angle, angle * 7, -angle * 13]]) equivalent(pose)
  }
  let seed = 0x459eab72
  const next = () => (seed = (Math.imul(seed, 1664525) + 1013904223) | 0)
  for (let i = 0; i < 8192; i++) equivalent([next(), next(), next()])
})

test('nonfinite, signed zero, fractions, strings, nullish values and errors retain original semantics', () => {
  const values = [undefined, null, false, true, 0, -0, 0.125, -0.125, 2047.875,
    NaN, Infinity, -Infinity, 2 ** 40, -(2 ** 31), 2 ** 31 - 1, '', '64', 'bad', 0n, Symbol('pose')]
  for (const value of values) {
    equivalent([value]); equivalent([0, value]); equivalent([0, 0, value])
    equivalent([value, value, value])
    for (const other of values) equivalent([value, other, 32])
  }
})

test('mutable sine tables keep full signed overflow and cannot leave stale results', () => {
  const original = rules.sine
  try {
    const values = [0, 1, -1, 65536, -65536, 2 ** 31 - 1, -(2 ** 31),
      2 ** 32 - 1, -(2 ** 32), 2 ** 40, -0, 1.75, NaN, Infinity, '65536', null, 0n, Symbol('table')]
    for (let offset = 0; offset < values.length; offset++) {
      rules.sine = Array.from({ length: 2048 }, (_, index) => values[(index + offset) % values.length])
      for (const pose of [[0, 0, 0], [256, 64, 32], [0, 1, 2], [2047, 511, 513], [NaN, 0, 0]])
        equivalent(pose)
    }
    rules.sine = original.slice()
    equivalent([0, 0, 0])
    rules.sine[512] = 2 ** 31 - 1
    equivalent([0, 0, 0])
    rules.sine[512] = -(2 ** 31)
    equivalent([0, 0, 0])
  } finally { rules.sine = original }
})

function observedValues(fn) {
  const descriptor = Object.getOwnPropertyDescriptor(rules, 'sine'), log = []
  let read = 0
  Object.defineProperty(rules, 'sine', { configurable: true, get() {
    const index = read++
    log.push(`table:${index}`)
    return new Proxy([], { get(_target, key) {
      log.push(`key:${String(key)}`)
      return { [Symbol.toPrimitive](hint) {
        log.push(`value:${index}:${hint}`)
        return [2 ** 31 - 1, -(2 ** 31), '65536', Infinity][index]
      } }
    } })
  } })
  try { return { result: outcome(fn, [0, 0, 0]), log } }
  finally { Object.defineProperty(rules, 'sine', descriptor) }
}

test('each sine access and table-value coercion remains live and ordered', () => {
  const expected = observedValues(baseline)
  assert.deepEqual(observedValues(referenceModelMatrix), expected)
  assert.deepEqual(observedValues(modelMatrix), expected)
  assert.equal(expected.log.length, 12)
})

function observed(fn, { reenter = false, throwAt = 0 } = {}) {
  const descriptor = Object.getOwnPropertyDescriptor(rules, 'sine')
  const table = descriptor.value, log = [], nested = []
  let reads = 0, inside = false, pitchValue = 64, rollValue = 32
  const event = text => {
    log.push(text)
    if (++reads === throwAt) throw new Error('controlled read failure')
  }
  const pose = key => ({ [Symbol.toPrimitive](hint) {
    event(`${key}:${hint}`)
    if (key === 'heading') return 256
    if (key === 'pitch') { rollValue += 1; return pitchValue++ }
    return rollValue++
  } })
  const proxy = new Proxy(table, { get(target, key) {
    event(`sine:${String(key)}`)
    if (reenter && !inside) {
      inside = true
      nested.push(outcome(fn, [128, 16, 8]))
      inside = false
    }
    return target[key]
  } })
  Object.defineProperty(rules, 'sine', { configurable: true, get() { event('table'); return proxy } })
  try { return { result: outcome(fn, [pose('heading'), pose('pitch'), pose('roll')]), log, nested } }
  finally { Object.defineProperty(rules, 'sine', descriptor) }
}

test('table getters, caller coercions, exceptions and reentrant calls retain exact order', () => {
  for (const options of [{}, { reenter: true }, ...Array.from({ length: 20 }, (_, i) => ({ throwAt: i + 1 }))]) {
    const expected = observed(baseline, options)
    assert.deepEqual(observed(referenceModelMatrix, options), expected)
    assert.deepEqual(observed(modelMatrix, options), expected)
  }
  assert.deepEqual(observed(modelMatrix).log.slice(0, 12), [
    'table', 'pitch:number', 'sine:64', 'table', 'pitch:default', 'sine:577',
    'table', 'roll:number', 'sine:34', 'table', 'roll:default', 'sine:547',
  ])
})

test('every return is a fresh ordinary array with no shared input or result storage', () => {
  for (const fn of [baseline, referenceModelMatrix, modelMatrix]) {
    for (const pose of [[0, 0, 0], [256, 64, 32], [NaN, 0, 0]]) {
      const first = fn(...pose), second = fn(...pose), snapshot = [...second]
      assert.notEqual(first, second)
      assert.equal(Object.getPrototypeOf(first), Array.prototype)
      assert.equal(first.length, 9)
      first.fill(123)
      assert.deepEqual(second, snapshot)
      assert.deepEqual(fn(...pose), snapshot)
    }
  }
})

test('the shipped RenderView draw hook preserves custom-setter source freshness and values', () => {
  const view = new RenderView(), scene = new THREE.Scene(), parent = new THREE.Group()
  const object = new THREE.Sprite(new THREE.SpriteMaterial()), sources = []
  parent.add(object); scene.add(parent)
  Object.assign(parent.userData, { nativeHeading: 256, nativeTilt: 64, nativeRoll: 32 })
  try {
    view.prepare(scene)
    const target = object.material.userData.nativeUniforms.nativeObjectBasis.value
    target.set = function (source) {
      assert.equal(this, target)
      sources.push(source)
      Int32Array.prototype.set.call(this, source)
    }
    for (let i = 0; i < 2; i++) object.onBeforeRender(null, scene, null, object.geometry, object.material, null)
    assert.notEqual(sources[0], sources[1])
    assert.deepEqual(sources[1], baseline(256, 64, 32))
    sources[0].fill(123)
    assert.deepEqual(sources[1], baseline(256, 64, 32))
    assert.deepEqual([...target], [...new Int32Array(baseline(256, 64, 32))])
  } finally { view.dispose(); object.material.dispose() }
})
