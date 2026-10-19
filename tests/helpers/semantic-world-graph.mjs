import assert from 'node:assert/strict'

const views = new Map([
  Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array,
  Int32Array, Uint32Array, Float32Array, Float64Array, BigInt64Array,
  BigUint64Array, DataView,
].map(type => [type.prototype, type.name]))
const typed = Object.getPrototypeOf(Uint8Array.prototype)
const read = (prototype, key, value) => Object.getOwnPropertyDescriptor(prototype, key).get.call(value)

// Deterministic data-graph encoding, not V8's representation-sensitive wire format.
// Preserve every enumerable own data field (including symbols), collection order,
// object/symbol identity, and typed-view backing-buffer edges and offsets. Reject
// unsupported prototypes/accessors instead of silently omitting their semantics.
export function semanticWorldGraph(world) {
  const seen = new Map(), symbols = new Map()
  const symbol = value => {
    const global = Symbol.keyFor(value)
    if (global !== undefined) return ['global-symbol', global]
    const known = Object.getOwnPropertyNames(Symbol).find(key => Symbol[key] === value)
    if (known) return ['well-known-symbol', known]
    if (!symbols.has(value)) symbols.set(value, symbols.size)
    return ['local-symbol', symbols.get(value), value.description ?? null]
  }
  const fields = (value, omitIndex = () => false) => Reflect.ownKeys(value).flatMap(key => {
    if (omitIndex(key)) return []
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    if (!descriptor.enumerable) return []
    assert.ok('value' in descriptor, 'semantic World fields must be data, not accessors')
    return [[typeof key === 'symbol' ? symbol(key) : key, encode(descriptor.value)]]
  })
  const encode = value => {
    if (value === undefined) return ['undefined']
    if (typeof value === 'symbol') return symbol(value)
    if (typeof value === 'bigint') return ['bigint', String(value)]
    assert.notEqual(typeof value, 'function', 'semantic World cannot contain functions')
    if (typeof value === 'number' && !Number.isFinite(value)) return ['number', String(value)]
    if (Object.is(value, -0)) return ['number', '-0']
    if (value === null || typeof value !== 'object') return value
    if (seen.has(value)) return ['ref', seen.get(value)]
    const id = seen.size
    seen.set(value, id)
    if (ArrayBuffer.isView(value)) {
      const prototype = Object.getPrototypeOf(value), name = views.get(prototype)
      assert.ok(name, 'unsupported semantic view prototype')
      const metadata = prototype === DataView.prototype ? DataView.prototype : typed
      const length = metadata === typed ? read(typed, 'length', value) : 0
      const extra = fields(value, key => typeof key === 'string' && /^(0|[1-9][0-9]*)$/.test(key) && Number(key) < length)
      return ['view', id, name, encode(read(metadata, 'buffer', value)),
        read(metadata, 'byteOffset', value), read(metadata, 'byteLength', value), extra]
    }
    if (value instanceof ArrayBuffer || value instanceof SharedArrayBuffer) {
      const prototype = Object.getPrototypeOf(value), shared = prototype === SharedArrayBuffer.prototype
      assert.ok(shared || prototype === ArrayBuffer.prototype, 'unsupported semantic buffer prototype')
      const extra = fields(value)
      return ['buffer', id, shared ? 'SharedArrayBuffer' : 'ArrayBuffer',
        read(prototype, 'byteLength', value), read(prototype, 'maxByteLength', value),
        read(prototype, shared ? 'growable' : 'resizable', value), Buffer.from(value).toString('base64'), extra]
    }
    if (value instanceof Map) {
      assert.equal(Object.getPrototypeOf(value), Map.prototype)
      const extra = fields(value)
      return ['map', id, [...Map.prototype.entries.call(value)].map(([k, v]) => [encode(k), encode(v)]), extra]
    }
    if (value instanceof Set) {
      assert.equal(Object.getPrototypeOf(value), Set.prototype)
      const extra = fields(value)
      return ['set', id, [...Set.prototype.values.call(value)].map(encode), extra]
    }
    if (Array.isArray(value)) {
      assert.equal(Object.getPrototypeOf(value), Array.prototype)
      return ['array', id, value.length, fields(value)]
    }
    const prototype = Object.getPrototypeOf(value)
    assert.ok(prototype === null || prototype === Object.prototype, 'unsupported semantic World prototype')
    return ['object', id, prototype === null ? 'null' : 'plain', fields(value)]
  }
  return encode(world)
}
