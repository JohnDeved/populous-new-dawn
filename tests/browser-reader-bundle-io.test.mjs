import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { syncBuiltinESMExports } from 'node:module'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'
import { readerBundleManifest } from '../scripts/browser-performance/reader-build.mjs'

const hash = bytes => createHash('sha256').update(bytes).digest('hex')

test('manifest keeps sorted path, numeric size and exact digest across chunks', t => {
  const root = mkdtempSync(join(tmpdir(), 'bundle-stream-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  mkdirSync(join(root, 'a'))
  const js = Buffer.alloc(2 * 65536 + 7, 52)
  js[65535] = 0
  js[65536] = 255
  writeFileSync(join(root, 'a', 'code.js'), js)
  writeFileSync(join(root, 'a', 'code.js.map'), 'source-map bytes')
  writeFileSync(join(root, 'empty.html'), '')
  symlinkSync(join(root, 'empty.html'), join(root, 'excluded'))
  const entries = [['a/code.js', js.length, hash(js)], ['empty.html', 0, hash('')]]
  assert.deepEqual(readerBundleManifest(root), { sha256: hash(JSON.stringify(entries)), entries })
})

test('mutation/read failures do not emit a digest and close the sole opened descriptor', t => {
  const root = mkdtempSync(join(tmpdir(), 'bundle-stream-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  writeFileSync(join(root, 'code.js'), 'ABC')
  const original = { openSync: fs.openSync, fstatSync: fs.fstatSync, readSync: fs.readSync, closeSync: fs.closeSync }
  const failure = Object.assign(new Error('synthetic bundle read failure'), { code: 'EIO' })
  for (const [kind, pattern] of [
    ['before', /changed before read/],
    ['after', /changed during read/],
    ['grow', /grew during read/],
    ['shrink', /shrank during read/],
    ['error', failure],
  ]) {
    let opened = 0, closed = 0, stats = 0, reads = 0
    try {
      fs.openSync = (...args) => { opened++; return original.openSync(...args) }
      fs.closeSync = fd => { closed++; return original.closeSync(fd) }
      fs.fstatSync = (fd, opts) => {
        const stat = original.fstatSync(fd, opts)
        stats++
        if ((kind === 'before' && stats === 1) || (kind === 'after' && stats === 2)) stat.mtimeNs++
        return stat
      }
      fs.readSync = (fd, buffer, offset, length, position) => {
        reads++
        assert.ok(buffer.length <= 65536)
        if (kind === 'error') throw failure
        if (kind === 'shrink') return 0
        if (kind === 'grow') { assert.equal(length, 4); buffer.fill(0, 0, length); return length }
        return original.readSync(fd, buffer, offset, length, position)
      }
      syncBuiltinESMExports()
      assert.throws(() => readerBundleManifest(root), error => pattern instanceof RegExp ? pattern.test(error.message) : error === pattern)
      assert.equal(opened, 1)
      assert.equal(closed, 1)
      assert.equal(reads === 0, kind === 'before')
    } finally {
      Object.assign(fs, original)
      syncBuiltinESMExports()
    }
  }
})

for (const primary of ['read', 'fstat', null]) {
  test(primary ? 'combined ' + primary + ' and close failure preserves the primary' : 'close-only failure rejects the manifest', t => {
    const root = mkdtempSync(join(tmpdir(), 'bundle-stream-'))
    t.after(() => rmSync(root, { recursive: true, force: true }))
    writeFileSync(join(root, 'code.js'), 'ABC')
    const original = { readSync: fs.readSync, fstatSync: fs.fstatSync, closeSync: fs.closeSync }
    const first = Object.assign(new Error('synthetic primary fault'), { code: 'EIO' })
    const closing = Object.assign(new Error('synthetic close fault'), { code: 'EBADF' })
    let closed = 0
    try {
      if (primary === 'read') fs.readSync = () => { throw first }
      if (primary === 'fstat') fs.fstatSync = () => { throw first }
      fs.closeSync = fd => { closed++; original.closeSync(fd); throw closing }
      syncBuiltinESMExports()
      assert.throws(() => readerBundleManifest(root), error => error === (primary ? first : closing))
      assert.equal(closed, 1)
    } finally {
      Object.assign(fs, original)
      syncBuiltinESMExports()
    }
  })
}
