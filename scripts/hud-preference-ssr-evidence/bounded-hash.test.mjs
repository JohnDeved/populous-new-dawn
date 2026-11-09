// Pure small fixtures; never imports adapter or starts browser/processes.
import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { fileSha256, HASH_CHUNK_BYTES } from './bounded-hash.mjs'

function fixture(bytes, { partial = HASH_CHUNK_BYTES, fail = false } = {}) {
  let offset = 0, closed = 0, opened = 0, reads = 0
  const buffers = new Set()
  return {
    io: {
      openSync(path, mode) { assert.equal(path, 'fixture'); assert.equal(mode, 'r'); opened++; return 42 },
      readSync(fd, buffer, start, length, position) {
        assert.equal(fd, 42); assert.equal(start, 0); assert.equal(length, HASH_CHUNK_BYTES); assert.equal(position, null)
        buffers.add(buffer); reads++
        if (fail) throw Error('fixture read failure')
        const count = Math.min(length, partial, bytes.length - offset)
        bytes.copy(buffer, 0, offset, offset + count); offset += count
        return count
      },
      closeSync(fd) { assert.equal(fd, 42); closed++ },
    },
    stats: () => ({ offset, closed, opened, reads, buffers: buffers.size }),
  }
}

test('whole-input equality for empty, partial, exact and multichunk reads', () => {
  for (const size of [0, 1, HASH_CHUNK_BYTES - 1, HASH_CHUNK_BYTES, HASH_CHUNK_BYTES * 2 + 7]) {
    const bytes = Buffer.alloc(size)
    for (let i = 0; i < size; i++) bytes[i] = i % 251
    for (const partial of [997, HASH_CHUNK_BYTES]) {
      const input = fixture(bytes, { partial })
      const expected = createHash('sha256').update(bytes).digest('hex')
      assert.equal(fileSha256('fixture', input.io), expected)
      assert.deepEqual({ ...input.stats(), reads: 0 }, { offset: size, closed: 1, opened: 1, reads: 0, buffers: 1 })
    }
  }
})
test('digest mismatch still rejects and descriptor is already closed', () => {
  const input = fixture(Buffer.from('changed'))
  assert.throws(() => assert.equal(fileSha256('fixture', input.io), createHash('sha256').update('original').digest('hex')))
  assert.equal(input.stats().closed, 1)
})
test('read failure propagates with exactly one close', () => {
  const input = fixture(Buffer.from('x'), { fail: true })
  assert.throws(() => fileSha256('fixture', input.io), /fixture read failure/)
  assert.equal(input.stats().closed, 1)
})
test('open failure never closes an unrelated descriptor', () => {
  let closed = 0
  assert.throws(() => fileSha256('fixture', { openSync() { throw Error('open failure') }, closeSync() { closed++ } }), /open failure/)
  assert.equal(closed, 0)
})
