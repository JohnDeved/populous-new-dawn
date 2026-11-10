// Test-host observation only. No product store or listener is replaced.
export function createStrictProbe(storage, prototype, { seed, blockRead }) {
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'getItem')
  if (!descriptor || typeof descriptor.value !== 'function') throw Error('Native getItem descriptor required')
  const originalGet = descriptor.value
  const originalSet = prototype.setItem
  const wrappers = new WeakMap(), records = [], events = [], errors = []
  let overflow = false, nextStore = 0, nextSubscription = 0, reads = 0, restored = false
  const note = event => { if (events.length < 128) events.push(event); else overflow = true }
  const noteError = error => { if (errors.length < 16) errors.push(error); else overflow = true }
  if (!['1.5', '2.5'].includes(seed)) throw Error('Unexpected fixture seed')
  Reflect.apply(originalSet, storage, ['hud-size', seed])
  function getItem(...args) {
    if (this !== storage || args[0] !== 'hud-size') return Reflect.apply(originalGet, this, args)
    reads++
    note({ type: 'hud-read', ordinal: reads, blocked: blockRead })
    if (blockRead) throw new DOMException('Supplied hud-size read failure', 'SecurityError')
    return Reflect.apply(originalGet, this, args)
  }
  Object.defineProperty(prototype, 'getItem', { ...descriptor, value: getItem })
  return {
    wrapSubscribe(original) {
      if (typeof original !== 'function') throw Error('Actual HUD subscribe required')
      if (wrappers.has(original)) return wrappers.get(original)
      if (records.length >= 8) throw Error('HUD store observation cap exceeded')
      const record = { id: ++nextStore, subscribes: 0, cleanups: 0, active: new Set() }
      records.push(record)
      function observedSubscribe(...args) {
        const token = ++nextSubscription
        record.subscribes++; record.active.add(token)
        note({ type: 'subscribe', store: record.id, token })
        let cleanup
        try { cleanup = Reflect.apply(original, this, args) }
        catch (error) { noteError({ phase: 'subscribe', store: record.id, error: String(error) }); throw error }
        if (typeof cleanup !== 'function') throw Error('Actual HUD cleanup required')
        return function (...cleanupArgs) {
          if (!record.active.delete(token)) noteError({ phase: 'duplicate-cleanup', store: record.id, token })
          record.cleanups++
          note({ type: 'cleanup', store: record.id, token })
          return Reflect.apply(cleanup, this, cleanupArgs)
        }
      }
      wrappers.set(original, observedSubscribe)
      return observedSubscribe
    },
    witness(type, epoch) {
      if (!['effect-setup', 'effect-cleanup'].includes(type) || !Number.isSafeInteger(epoch)) throw Error('Unexpected witness')
      note({ type, epoch })
    },
    seedFresh() {
      if (records.some(record => record.active.size)) throw Error('Seed only after Home unmount')
      Reflect.apply(originalSet, storage, ['hud-size', '3'])
      note({ type: 'fixture-seed', value: '3' })
    },
    snapshot() {
      return { reads, restored, overflow, errors: [...errors], events: events.map(event => ({ ...event })),
        stored: Reflect.apply(originalGet, storage, ['hud-size']),
        stores: records.map(({ id, subscribes, cleanups, active }) => ({ id, subscribes, cleanups, live: active.size })) }
    },
    restore() {
      if (restored) throw Error('Storage observer already restored')
      if (prototype.getItem !== getItem) throw Error('Storage observer ownership changed')
      Object.defineProperty(prototype, 'getItem', descriptor)
      restored = true
      return prototype.getItem === originalGet
    },
  }
}
