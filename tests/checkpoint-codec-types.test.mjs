import assert from 'node:assert/strict'
import test from 'node:test'
import { checkpointCodec } from '../scripts/tutorial-browser/checkpoint-codec.mjs'

const transport = value => JSON.parse(JSON.stringify(checkpointCodec(value)))

test('checkpoint views reject inherited constructor names rather than changing value type', () => {
  for (const name of ['constructor', '__proto__', 'toString', 'valueOf', 'hasOwnProperty']) {
    const packet = transport(new Uint8Array([3, 5]))
    packet.nodes.find(node => node.type === 'view').name = name
    assert.throws(() => checkpointCodec(packet, true), /^Error: Unsupported typed array$/)
  }
})

test('checkpoint view type names must be strings in the supported whitelist', () => {
  for (const name of [null, undefined, 7, true, {}, [], ['Uint8Array'], 'Buffer', 'Uint8Array ']) {
    const packet = transport(new Uint8Array([3, 5]))
    packet.nodes.find(node => node.type === 'view').name = name
    assert.throws(() => checkpointCodec(packet, true), /^Error: Unsupported typed array$/)
  }
})

test('all supported view kinds retain identity, bytes, offsets and shared backing storage', () => {
  const buffer = new ArrayBuffer(32)
  new Uint8Array(buffer).set(Array.from({ length: 32 }, (_, i) => i))
  const types = [Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array,
    Int32Array, Uint32Array, Float32Array, Float64Array, BigInt64Array, BigUint64Array]
  const views = types.map(Type => new Type(buffer, 8, 2))
  views.push(new DataView(buffer, 8, 7))
  const restored = checkpointCodec(transport({ views, buffer }), true)
  for (let i = 0; i < views.length; i++) {
    assert.equal(restored.views[i].constructor, views[i].constructor)
    assert.equal(restored.views[i].byteOffset, views[i].byteOffset)
    assert.equal(restored.views[i].byteLength, views[i].byteLength)
    assert.equal(restored.views[i].buffer, restored.buffer)
    assert.deepEqual(new Uint8Array(restored.views[i].buffer), new Uint8Array(buffer))
  }
})

test('valid object cycles, aliases and special primitive values survive transport', () => {
  const root = { view: new Uint8Array([1, 2]), missing: undefined, negativeZero: -0,
    nan: NaN, infinity: Infinity, integer: 123n }
  root.self = root
  root.map = new Map([[root, root.view]])
  root.set = new Set([root, root.view])
  const restored = checkpointCodec(transport(root), true)
  assert.equal(restored.self, restored)
  assert.equal(restored.map.get(restored), restored.view)
  assert.ok(restored.set.has(restored) && restored.set.has(restored.view))
  assert.ok(Object.hasOwn(restored, 'missing'))
  assert.equal(restored.missing, undefined)
  assert.ok(Object.is(restored.negativeZero, -0))
  assert.ok(Number.isNaN(restored.nan))
  assert.equal(restored.infinity, Infinity)
  assert.equal(restored.integer, 123n)
})
