import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { RECEIPT_ENTRY_LIMIT, RECEIPT_FILE_LIMIT, RECEIPT_TOTAL_LIMIT, DiscoveryLimitError,
  boundedDirectoryEntries, createJsonBudget, readDiscoveryJson, verifiedNodeCompileCache } from '../scripts/parity-discovery.mjs'

function fixture(t) {
  const root = fs.mkdtempSync(join(tmpdir(), 'parity-reader-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const put = (name, content) => {
    const path = join(root, name)
    fs.mkdirSync(dirname(path), { recursive: true })
    fs.writeFileSync(path, content)
    return path
  }
  return { root, put }
}

test('exact per-file and aggregate byte boundaries admit complete JSON only', t => {
  const { put } = fixture(t), a = put('a.json', '{"a":1}'), b = put('b.json', '{"b":2}')
  const budget = createJsonBudget({ fileLimit: 7, totalLimit: 14 })
  assert.deepEqual(readDiscoveryJson(a, budget), { a: 1 })
  assert.deepEqual(readDiscoveryJson(b, budget), { b: 2 })
  assert.equal(budget.bytesRead, 14)
  assert.throws(() => readDiscoveryJson(a, budget), DiscoveryLimitError)
  assert.equal(budget.bytesRead, 14)
  const tooSmall = createJsonBudget({ fileLimit: 6, totalLimit: 14 })
  assert.throws(() => readDiscoveryJson(a, tooSmall), /oversized/)
  assert.equal(tooSmall.bytesRead, 0)
})

test('malformed JSON consumes actual aggregate bytes and cannot leave budget for another file', t => {
  const { put } = fixture(t), malformed = put('bad.json', '{bad}'), valid = put('good.json', '{}')
  const budget = createJsonBudget({ fileLimit: 5, totalLimit: 6 })
  assert.throws(() => readDiscoveryJson(malformed, budget), /invalid JSON/)
  assert.equal(budget.bytesRead, 5)
  assert.throws(() => readDiscoveryJson(valid, budget), DiscoveryLimitError)
})

test('empty, invalid UTF-8 and JSON syntax remain visible read errors', t => {
  const { put } = fixture(t)
  for (const [name, content] of [['empty', ''], ['utf8', Buffer.from([34, 0xc3, 34])], ['syntax', '[1,]'], ['bom', Buffer.from([0xef, 0xbb, 0xbf, 123, 125])]]) {
    const budget = createJsonBudget()
    assert.throws(() => readDiscoveryJson(put(name, content), budget), /invalid JSON/)
    assert.equal(budget.bytesRead, Buffer.byteLength(content))
  }
})

for (const mutation of ['growth', 'truncation', 'replacement']) test(`${mutation} during read rejects the file after counting bytes`, t => {
  const { put } = fixture(t), path = put('data.json', '{"a":1}'), originalRead = fs.readSync
  let mutated = false
  t.mock.method(fs, 'readSync', (...args) => {
    const bytes = originalRead(...args)
    if (!mutated) {
      mutated = true
      if (mutation === 'replacement') fs.renameSync(path, path + '.old')
      fs.writeFileSync(path, mutation === 'growth' ? '{"a":100}' : mutation === 'truncation' ? '{}' : '{"a":1}')
    }
    return bytes
  })
  const budget = createJsonBudget()
  assert.throws(() => readDiscoveryJson(path, budget), /changed during read/)
  assert.equal(budget.bytesRead, 7)
})

test('symlink file and read failure are not parsed or silently discarded', t => {
  const { root, put } = fixture(t), path = put('data.json', '{}'), link = join(root, 'link.json')
  fs.symlinkSync(path, link)
  assert.throws(() => readDiscoveryJson(link, createJsonBudget()), /not a regular file/)
  t.mock.method(fs, 'readSync', () => { throw new Error('simulated read failure') })
  assert.throws(() => readDiscoveryJson(path, createJsonBudget()), /unreadable/)
})

test('directory enumeration stops at remaining allowance plus one before sorting', t => {
  let reads = 0, closed = false
  t.mock.method(fs, 'opendirSync', () => ({
    readSync: () => ({ name: String(++reads) }),
    closeSync: () => { closed = true },
  }))
  assert.throws(() => boundedDirectoryEntries('fixture', 2), DiscoveryLimitError)
  assert.equal(reads, 3)
  assert.equal(closed, true)
})

test('bounded enumeration preserves locale ordering and the exact empty boundary', t => {
  const { root, put } = fixture(t)
  for (const name of ['z.json', 'a.json', 'C.json']) put(name, '{}')
  assert.deepEqual(boundedDirectoryEntries(root, 3).map(entry => entry.name),
    ['z.json', 'a.json', 'C.json'].sort((a, b) => a.localeCompare(b)))
  assert.throws(() => boundedDirectoryEntries(root, 2), DiscoveryLimitError)
  const empty = join(root, 'empty'); fs.mkdirSync(empty)
  assert.deepEqual(boundedDirectoryEntries(empty, 0), [])
})

test('cache probe is limited per root and rejects unexpected shape and symlinks', t => {
  const { root, put } = fixture(t), cache = join(root, 'run-tmp/node-compile-cache')
  const version = 'run-tmp/node-compile-cache/v24.19.0-x64-cf738c9d-1000'
  put(`${version}/0123abcd`, 'binary')
  assert.equal(verifiedNodeCompileCache(cache, root), true)
  assert.equal(verifiedNodeCompileCache(cache, root, { maxEntries: 1 }), false)
  put(`${version}/attempt.json`, '{}')
  assert.equal(verifiedNodeCompileCache(cache, root), false)
  fs.rmSync(join(root, version, 'attempt.json'))
  fs.symlinkSync(join(root, version, '0123abcd'), join(root, version, '1234abcd'))
  assert.equal(verifiedNodeCompileCache(cache, root), false)
})

test('cache directory change during probing falls back to ordinary discovery', t => {
  const { root, put } = fixture(t), cache = join(root, 'run-tmp/node-compile-cache')
  const version = join(cache, 'v24.19.0-x64-cf738c9d-1000')
  put('run-tmp/node-compile-cache/v24.19.0-x64-cf738c9d-1000/0123abcd', 'binary')
  const originalOpen = fs.opendirSync
  t.mock.method(fs, 'opendirSync', path => {
    const stream = originalOpen(path), originalRead = stream.readSync.bind(stream)
    stream.readSync = () => {
      const entry = originalRead()
      if (path === version && entry === null) fs.writeFileSync(join(version, 'attempt.json'), '{}')
      return entry
    }
    return stream
  })
  assert.equal(verifiedNodeCompileCache(cache, root), false)
})

test('test-only reductions cannot increase any production bound', () => {
  assert.throws(() => createJsonBudget({ fileLimit: RECEIPT_FILE_LIMIT + 1 }), RangeError)
  assert.throws(() => createJsonBudget({ totalLimit: RECEIPT_TOTAL_LIMIT + 1 }), RangeError)
  assert.throws(() => boundedDirectoryEntries('unused', RECEIPT_ENTRY_LIMIT + 1), RangeError)
  assert.throws(() => verifiedNodeCompileCache('unused', 'unused', { maxEntries: 1025 }), RangeError)
})

test('disappearing nested cache during fallback cannot return an older partial pass', async t => {
  const { discoverReceipts } = await import('../scripts/parity-measure.mjs')
  const { root, put } = fixture(t)
  put('work/orchestration/a-old.json', JSON.stringify({ kind: 'pnd-command-receipt', status: 'passed', parityMeasurements: [] }))
  put('work/orchestration/z-tmp/node-compile-cache/v24.19.0-x64-cf738c9d-1000/new.json',
    JSON.stringify({ kind: 'pnd-command-receipt', status: 'unknown', parityMeasurements: [] }))
  const cache = join(root, 'work/orchestration/z-tmp/node-compile-cache'), originalOpen = fs.opendirSync
  let removed = false
  t.mock.method(fs, 'opendirSync', path => {
    if (path === cache && !removed) {
      removed = true
      fs.renameSync(cache, join(root, 'removed-cache'))
    }
    return originalOpen(path)
  })
  assert.throws(() => discoverReceipts(root), /ENOENT/)
  assert.equal(removed, true)
})


test('an initially absent orchestration root remains empty evidence', async t => {
  const { discoverReceipts } = await import('../scripts/parity-measure.mjs')
  const { root } = fixture(t)
  assert.deepEqual(discoverReceipts(root), { receipts: [], warnings: [] })
})
