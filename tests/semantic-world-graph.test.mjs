import assert from 'node:assert/strict'
import test from 'node:test'
import { semanticWorldGraph } from './helpers/semantic-world-graph.mjs'
const graph = value => JSON.stringify(semanticWorldGraph(value))

test('semantic graph preserves typed backing-buffer aliases, offsets and overlap', () => {
  const buffer = new ArrayBuffer(8)
  const shared = { first: new Uint8Array(buffer, 0, 4), second: new Uint8Array(buffer, 2, 4) }
  const independent = { first: new Uint8Array(4), second: new Uint8Array(4) }
  assert.notEqual(graph(shared), graph(independent))
  assert.notEqual(graph(shared), graph({ first: new Uint8Array(buffer, 0, 4), second: new Uint8Array(buffer, 1, 4) }))
  assert.equal(graph(shared), graph(structuredClone(shared)))
  shared.first[2] = 7
  assert.equal(shared.second[0], 7)
  assert.notEqual(graph(shared), graph(independent))
})

test('semantic graph retains collection extras, symbols, data types, holes and graph identity', () => {
  for (const value of [[], new Map(), new Set(), new Uint8Array(1), new ArrayBuffer(1)]) {
    const before = graph(value), key = Symbol('extra')
    value[key] = { marked: true }
    assert.notEqual(graph(value), before)
    const symbolic = graph(value)
    value.extra = value[key]
    assert.notEqual(graph(value), symbolic)
    delete value[key]; delete value.extra
    assert.equal(graph(value), before)
  }
  const common = { value: NaN }
  assert.notEqual(graph([common, common]), graph([{ value: NaN }, { value: NaN }]))
  assert.notEqual(graph([,]), graph([undefined]))
  assert.notEqual(graph(-0), graph(0))
  assert.notEqual(graph(NaN), graph(null))
  assert.notEqual(graph(new Uint8Array([1, 2])), graph(new Int8Array([1, 2])))
  const left = Symbol('same'), right = Symbol('same')
  assert.notEqual(graph([left, left]), graph([left, right]))
  const cyclic = {}; cyclic.self = cyclic
  assert.equal(graph(cyclic), graph(structuredClone(cyclic)))
})

test('semantic graph fails closed on unsupported prototypes, functions and accessors', () => {
  class Custom { value = 1 }
  assert.throws(() => graph(new Custom()), /unsupported/)
  assert.throws(() => graph({ callback() {} }), /cannot contain functions/)
  const value = {}
  Object.defineProperty(value, 'custom', { enumerable: true, get() { assert.fail('must not invoke getter') } })
  assert.throws(() => graph(value), /must be data/)
  for (const collection of [new Uint8Array(2), new DataView(new ArrayBuffer(2)), new ArrayBuffer(2), new Map(), new Set()]) {
    Object.defineProperty(collection, 'custom', { enumerable: true, get() { assert.fail('must not invoke collection getter') } })
    assert.throws(() => graph(collection), /must be data/)
  }
  class CustomView extends Uint8Array {}
  assert.throws(() => graph(new CustomView(2)), /unsupported/)
  class CustomBuffer extends ArrayBuffer {}
  assert.throws(() => graph(new CustomBuffer(2)), /unsupported/)
})
