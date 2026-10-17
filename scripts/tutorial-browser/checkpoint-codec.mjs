// Test-only structured-clone transport. Never JSON-flatten typed arrays or Maps.
// Self-contained so the identical codec can execute in a disposable browser page.
export function checkpointCodec(value, decode = false) {
  const types = {
    Int8Array,
    Uint8Array,
    Uint8ClampedArray,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array,
    BigInt64Array,
    BigUint64Array,
    DataView,
  }
  if (decode) {
    const { root, nodes } = value,
      cache = new Map()
    function read(v) {
      if (!Array.isArray(v)) return v
      if (v[0] === 'undefined') return undefined
      if (v[0] === 'number') return v[1] === '-0' ? -0 : Number(v[1])
      if (v[0] === 'bigint') return BigInt(v[1])
      if (v[0] !== 'ref') throw Error('Invalid checkpoint tag')
      const id = v[1]
      if (cache.has(id)) return cache.get(id)
      const n = nodes[id]
      let result
      if (n.type === 'buffer') result = Uint8Array.from(n.bytes).buffer
      else if (n.type === 'view') {
        const Type = types[n.name]
        if (!Type) throw Error('Unsupported typed array')
        result = new Type(read(n.buffer), n.offset, n.length)
      } else if (n.type === 'map') result = new Map()
      else if (n.type === 'set') result = new Set()
      else if (n.type === 'array') result = []
      else if (n.type === 'object') result = {}
      else throw Error('Unsupported checkpoint node')
      cache.set(id, result)
      if (n.type === 'array') result.length = n.length
      if (n.type === 'map') for (const [k, v] of n.entries) result.set(read(k), read(v))
      if (n.type === 'set') for (const v of n.entries) result.add(read(v))
      if (n.type === 'object' || n.type === 'array')
        for (const [k, v] of n.entries)
          Object.defineProperty(result, k, {
            value: read(v),
            enumerable: true,
            writable: true,
            configurable: true,
          })
      return result
    }
    return read(root)
  }
  const nodes = [],
    seen = new Map()
  function write(v) {
    if (v === undefined) return ['undefined']
    if (typeof v === 'bigint') return ['bigint', String(v)]
    if (typeof v === 'number' && (!Number.isFinite(v) || Object.is(v, -0)))
      return ['number', Object.is(v, -0) ? '-0' : String(v)]
    if (v === null || typeof v !== 'object') {
      if (typeof v === 'function' || typeof v === 'symbol')
        throw Error('Unsupported checkpoint value')
      return v
    }
    if (seen.has(v)) return ['ref', seen.get(v)]
    const id = nodes.length
    seen.set(v, id)
    nodes.push(null)
    let n
    if (v instanceof ArrayBuffer) n = { type: 'buffer', bytes: [...new Uint8Array(v)] }
    else if (ArrayBuffer.isView(v))
      n = {
        type: 'view',
        name: v.constructor.name,
        buffer: write(v.buffer),
        offset: v.byteOffset,
        length: v instanceof DataView ? v.byteLength : v.length,
      }
    else if (v instanceof Map)
      n = { type: 'map', entries: [...v].map(([k, v]) => [write(k), write(v)]) }
    else if (v instanceof Set) n = { type: 'set', entries: [...v].map(write) }
    else {
      if (!Array.isArray(v) && Object.getPrototypeOf(v) !== Object.prototype)
        throw Error('Unsupported checkpoint prototype')
      n = {
        type: Array.isArray(v) ? 'array' : 'object',
        ...(Array.isArray(v) ? { length: v.length } : {}),
        entries: Object.keys(v)
          .sort()
          .map(k => [k, write(v[k])]),
      }
    }
    nodes[id] = n
    return ['ref', id]
  }
  return { root: write(value), nodes }
}
