import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { syncBuiltinESMExports } from 'node:module'
import { createHash } from 'node:crypto'
import { fileSha256 } from '../scripts/browser-performance/browser-runtime.mjs'

// Test runner file isolation keeps these synchronous builtin hooks local.
// Never touch disk, user saves, retained artifacts or the browser process.
function withReads(read, action) {
  const original = { openSync: fs.openSync, readSync: fs.readSync, closeSync: fs.closeSync }
  const calls = { opens: 0, closes: [], reads: [] }
  try {
    fs.openSync = (path, flags) => { assert.equal(path, 'synthetic-input'); assert.equal(flags, 'r'); calls.opens++; return 731 }
    fs.readSync = (fd, buffer, offset, length, position) => {
      assert.equal(fd, 731)
      assert.ok(buffer.length > 0 && buffer.length <= 1048576)
      assert.ok(length > 0 && length <= buffer.length)
      assert.equal(offset, 0)
      assert.equal(position, null)
      calls.reads.push(length)
      return read(buffer, length)
    }
    fs.closeSync = fd => { calls.closes.push(fd) }
    syncBuiltinESMExports()
    action(calls)
  } finally {
    Object.assign(fs, original)
    syncBuiltinESMExports()
  }
}
const digest = bytes => createHash('sha256').update(bytes).digest('hex')

test('empty stream is read through EOF and descriptor closes once', () => {
  withReads(() => 0, calls => {
    assert.equal(fileSha256('synthetic-input'), digest(''))
    assert.equal(calls.opens, 1)
    assert.equal(calls.reads.length, 1)
    assert.deepEqual(calls.closes, [731])
  })
})

test('short reads and additional bytes before EOF are all hashed', () => {
  const chunks = [Buffer.from('first'), Buffer.from('later appended bytes'), Buffer.from([0, 255])]
  let index = 0
  withReads(buffer => {
    const chunk = chunks[index++]
    if (!chunk) return 0
    chunk.copy(buffer)
    return chunk.length
  }, calls => {
    assert.equal(fileSha256('synthetic-input'), digest(Buffer.concat(chunks)))
    assert.equal(calls.reads.length, 4)
    assert.deepEqual(calls.closes, [731])
  })
})

test('read error after partial input propagates unchanged and closes descriptor', () => {
  const failure = Object.assign(new Error('synthetic read failure'), { code: 'EIO' })
  let count = 0
  withReads(buffer => {
    if (count++) throw failure
    buffer[0] = 42
    return 1
  }, calls => {
    assert.throws(() => fileSha256('synthetic-input'), error => error === failure)
    assert.equal(calls.reads.length, 2)
    assert.deepEqual(calls.closes, [731])
  })
})
