import assert from 'node:assert/strict'
import { openSync, closeSync, writeSync, fsyncSync } from 'node:fs'

// Synchronous, append-only phase receipts. No browser, app or dependency imports.
// Owned output directory admission remains the caller's responsibility.
export function createGameplayJournal(file, { maxBytes = 262144, failureReserve = 16384 } = {}) {
  assert.ok(Number.isSafeInteger(maxBytes) && maxBytes > 0 && maxBytes <= 1048576)
  assert.ok(Number.isSafeInteger(failureReserve) && failureReserve >= 1024 && failureReserve < maxBytes)
  const fd = openSync(file, 'wx', 0o600)
  let bytes = 0, sequence = 0, closed = false, failed = false
  const encode = value => {
    const active = new Set()
    let nodes = 0, textBytes = 0
    const visit = (v, depth = 0) => {
      assert.ok(depth <= 24 && ++nodes <= 8192, 'Receipt complexity limit')
      if (typeof v === 'string') { textBytes += Buffer.byteLength(v); assert.ok(textBytes <= maxBytes, 'Receipt string budget') }
      if (v === null || typeof v === 'string' || typeof v === 'boolean') return
      if (typeof v === 'number') { assert.ok(Number.isFinite(v), 'Finite JSON numbers required'); return }
      assert.equal(typeof v, 'object', 'Plain JSON values required')
      assert.ok(!active.has(v), 'Cyclic receipt')
      assert.ok(Array.isArray(v) || Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null, 'Plain JSON objects required')
      active.add(v)
      for (const key of Reflect.ownKeys(v)) {
        if (Array.isArray(v) && key === 'length') continue
        assert.equal(typeof key, 'string', 'Symbol receipt key')
        if (Array.isArray(v)) assert.ok(/^(0|[1-9][0-9]*)$/.test(key) && Number(key) < v.length, 'Non-index array data')
        textBytes += Buffer.byteLength(key); assert.ok(textBytes <= maxBytes, 'Receipt key budget')
        const descriptor = Object.getOwnPropertyDescriptor(v, key)
        assert.ok(descriptor.enumerable && Object.hasOwn(descriptor, 'value'), 'Receipt accessors/nonenumerable data not allowed')
        visit(descriptor.value, depth + 1)
      }
      if (Array.isArray(v)) for (let i = 0; i < v.length; i++) assert.ok(Object.hasOwn(v, i), 'Sparse receipt array')
      active.delete(v)
    }
    visit(value)
    return Buffer.from(JSON.stringify(value) + '\n')
  }
  const append = (stage, value, terminal) => {
    assert.ok(!closed && !failed, 'Journal is closed or failed')
    assert.match(stage, /^[a-z][a-z0-9:-]{0,79}$/)
    const line = encode({ sequence, stage, value })
    assert.ok(bytes + line.length <= maxBytes - (terminal ? 0 : failureReserve), 'Receipt budget exhausted')
    try {
      let offset = 0
      while (offset < line.length) {
        const count = writeSync(fd, line, offset, line.length - offset)
        if (count <= 0) throw new Error('No receipt write progress')
        offset += count
      }
      fsyncSync(fd); bytes += line.length; sequence++
    } catch (error) { failed = true; throw error }
  }
  return {
    record(stage, value) { append(stage, value, false) },
    failure(error) {
      // Deliberately bounded explicit normalization, not arbitrary error serialization.
      append('failure', { message: String(error).slice(0, 1024) }, true)
    },
    close() { if (!closed) { closed = true; closeSync(fd) } },
    get bytes() { return bytes },
  }
}
