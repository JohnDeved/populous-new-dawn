import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createJsonBudget, readDiscoveryRecord, DiscoveryLimitError } from '../scripts/parity-discovery.mjs'

function fixture(t) {
  const root = fs.mkdtempSync(join(tmpdir(), 'parity-metadata-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  let id = 0
  const put = text => { const path = join(root, `${id++}.json`); fs.writeFileSync(path, text); return path }
  const read = (text, limits = {}, options = {}) => readDiscoveryRecord(put(text),
    createJsonBudget({ fileLimit: 0, streamLimits: limits, ...options }))
  return { root, put, read }
}

const fields = new Set(['kind', 'status', 'parityMeasurements', 'identity', 'verification', 'command', 'source'])
test('chunk boundaries preserve exact selected values and whole raw digest', t => {
  const { read } = fixture(t)
  const values = [
    { bulk: ['a fake \\"kind\\":true', { kind: 'nested' }, null, -0, 0.5, 1e20], kind: 'pnd-command-receipt',
      source: { inputs: { '\ud800': 'x', 'a😀b': 'hash' }, nested: { status: 'x' } }, status: 'unknown',
      parityMeasurements: [{ version: 1, status: 'unknown', runtime: { node: 'v24' } }], command: ['node', 'x'],
      identity: {}, verification: { results: [{ status: 'failed', parityMeasurements: [] }] } },
    { irrelevant: 'z'.repeat(1000), kind: 'not a receipt' }, [], true, 123, 'string',
  ]
  for (const value of values) for (const chunkBytes of [1, 2, 3, 7, 64]) {
    const raw = JSON.stringify(value), expected = Object.fromEntries(Object.entries(JSON.parse(raw)).filter(([key]) => fields.has(key)))
    const record = read(raw, { chunkBytes })
    assert.equal(record.projected, true)
    assert.deepEqual(record.value, expected)
    assert.equal(record.rawSha256, createHash('sha256').update(raw).digest('hex'))
  }
})

test('escaped root names are decoded, nested duplicates retain JSON.parse semantics', t => {
  const { read } = fixture(t)
  assert.deepEqual(read('{"ki\\u006ed":"receipt","source":{"inputs":{"x":1,"x":2}}}', { chunkBytes: 1 }).value,
    { kind: 'receipt', source: { inputs: { x: 2 } } })
  for (const key of ['kind', 'status', 'parityMeasurements', 'source', 'command', 'unused'])
    assert.throws(() => read(`{"${key}":1,"${key}":2}`), /duplicate top-level/)
  assert.throws(() => read('{"kind":1,"ki\\u006ed":2}'), /duplicate top-level/)
})

test('JSON fields cannot spoof the reader projection mode', t => {
  const { put, read } = fixture(t), raw = '{"projected":true,"kind":"receipt"}'
  const full = readDiscoveryRecord(put(raw), createJsonBudget())
  assert.equal(full.projected, false)
  assert.equal(full.value.projected, true)
  const projected = read('{"projected":false,"kind":"receipt"}')
  assert.equal(projected.projected, true)
  assert.deepEqual(projected.value, { kind: 'receipt' })
})

test('discarded values still require complete strict JSON through EOF', t => {
  const { read } = fixture(t)
  for (const raw of [
    '', 'null', '{}x', '{}{}', '[1,]', '{"x":1,}', '{"x" 1}', '{"x":}', '{"x":truefalse}',
    '{"x":[}', '{"x":01}', '{"x":-}', '{"x":1.}', '{"x":1e+}', '{"x":NaN}', '{"x":Infinity}',
    '{"x":"bad\\q"}', '{"x":"bad\\u12xz"}', '{"x":"line\n"}', '{"x":"unterminated',
    '{"x":"bad\\', '{"x":"bad\\u12', '{"x":[true', '{"kind":"ok","discarded":{"x":1}',
    '\ufeff{}', '{"x":\u00a0true}', '{"x":"done"} true',
  ]) assert.throws(() => read(raw, { chunkBytes: 1 }), /invalid JSON/, raw)
  for (const bytes of [Buffer.from([123, 34, 120, 34, 58, 34, 0xc3, 34, 125]),
    Buffer.from([123, 34, 120, 34, 58, 34, 0xc0, 0xaf, 34, 125]),
    Buffer.from([123, 34, 120, 34, 58, 34, 0xf0, 0x9f])])
    assert.throws(() => read(bytes, { chunkBytes: 1 }), /invalid JSON/)
})

test('number grammar and retained values match JSON.parse without coercion', t => {
  const { read } = fixture(t)
  for (const number of ['0', '-0', '123', '0.123', '-1e-2', '1E+22', '1e999']) {
    const raw = `{"kind":${number}}`
    assert.deepEqual(read(raw, { chunkBytes: 1 }).value, JSON.parse(raw))
  }
  assert.doesNotThrow(() => read('{"ignored":123}', { numberBytes: 3 }))
  assert.throws(() => read('{"ignored":123}', { numberBytes: 2 }), /number limit/)
  assert.throws(() => read('0', { numberBytes: 0 }), /number limit/)
})

test('exact byte, token, depth, key and metadata ceilings are enforced before overflow', t => {
  const { put, read } = fixture(t), raw = '{"kind":1}'
  const budget = createJsonBudget({ fileLimit: 0, totalLimit: Buffer.byteLength(raw) })
  assert.deepEqual(readDiscoveryRecord(put(raw), budget).value, { kind: 1 })
  assert.equal(budget.bytesRead, Buffer.byteLength(raw))
  assert.throws(() => readDiscoveryRecord(put('{}'), budget), DiscoveryLimitError)
  assert.doesNotThrow(() => read(raw, { metadataBytes: 11, keyBytes: 4, keys: 1, tokens: 5 }))
  for (const [limits, error] of [[{ metadataBytes: 10 }, /metadata limit/], [{ keyBytes: 3 }, /key limit/],
    [{ keys: 0 }, /key count/], [{ tokens: 4 }, /token limit/], [{ depth: 0 }, /depth limit/]])
    assert.throws(() => read(raw, limits), error)
  assert.doesNotThrow(() => read('{"discarded":[[0]]}', { depth: 3 }))
  assert.throws(() => read('{"discarded":[[0]]}', { depth: 2 }), /depth limit/)
  assert.doesNotThrow(() => read('{"discarded":"' + 'x'.repeat(10000) + '"}', { metadataBytes: 32 }))
  assert.throws(() => read('{"kind":"' + 'x'.repeat(100) + '"}', { metadataBytes: 32 }), /metadata limit/)
})

test('aggregate metadata and token budgets include every streaming file', t => {
  const { put } = fixture(t), raw = '{"kind":1}'
  for (const [streamLimits, message] of [[{ totalMetadataBytes: 21 }, /Receipt metadata limit/],
    [{ totalTokens: 9 }, /Receipt JSON token limit/]]) {
    const budget = createJsonBudget({ fileLimit: 0, streamLimits })
    readDiscoveryRecord(put(raw), budget)
    assert.throws(() => readDiscoveryRecord(put(raw), budget), message)
  }
  const budget = createJsonBudget({ fileLimit: 0, totalLimit: 6 })
  assert.throws(() => readDiscoveryRecord(put('{bad}'), budget), /invalid JSON/)
  assert.equal(budget.bytesRead, 5)
  assert.throws(() => readDiscoveryRecord(put('{}'), budget), DiscoveryLimitError)
})

test('time budgets fail closed for both the stream and the full traversal', t => {
  const { put } = fixture(t), path = put('{}')
  assert.throws(() => readDiscoveryRecord(path, createJsonBudget({ fileLimit: 0, streamLimits: { fileMs: 0 } })), /file time limit/)
  assert.throws(() => readDiscoveryRecord(path, createJsonBudget({ streamLimits: { totalMs: 0 } })), /discovery time limit/)
  let clock = 0
  const budget = createJsonBudget({ fileLimit: 0, now: () => clock, streamLimits: { fileMs: 2 } })
  const original = fs.readSync
  t.mock.method(fs, 'readSync', (...args) => { const count = original(...args); clock += 3; return count })
  assert.throws(() => readDiscoveryRecord(path, budget), /file time limit/)
})

for (const mutation of ['growth', 'truncate', 'replace', 'remove', 'same-size']) test(`streaming ${mutation} cannot yield metadata`, t => {
  const { put } = fixture(t), path = put('{"kind":1}'), original = fs.readSync
  let changed = false
  t.mock.method(fs, 'readSync', (...args) => {
    const count = original(...args)
    if (!changed) {
      changed = true
      if (mutation === 'replace') fs.renameSync(path, path + '.old')
      if (mutation === 'remove') fs.unlinkSync(path)
      else fs.writeFileSync(path, mutation === 'growth' ? '{"kind":100}' : mutation === 'truncate' ? '{}' : '{"kind":2}')
    }
    return count
  })
  assert.throws(() => readDiscoveryRecord(path, createJsonBudget({ fileLimit: 0 })), /changed during read|unreadable/)
})

test('streaming rejects symlinks and read errors and cannot raise its bounds', t => {
  const { root, put } = fixture(t), path = put('{}'), link = join(root, 'link.json')
  fs.symlinkSync(path, link)
  assert.throws(() => readDiscoveryRecord(link, createJsonBudget({ fileLimit: 0 })), /not a regular file/)
  for (const limits of [{ chunkBytes: 0 }, { chunkBytes: 65537 }, { depth: 129 }, { numberBytes: 129 },
    { tokens: 8000001 }, { totalTokens: 16000001 }, { fileMs: 30001 }, { totalMs: 120001 }, { unknown: 1 }])
    assert.throws(() => createJsonBudget({ streamLimits: limits }), RangeError)
  t.mock.method(fs, 'readSync', () => { throw Error('simulated read failure') })
  assert.throws(() => readDiscoveryRecord(path, createJsonBudget({ fileLimit: 0 })), /unreadable/)
})
