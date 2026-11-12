import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createBoundedStreamRecord } from '../scripts/native-ui-evidence/setup-v2-proposal/bounded-stream-record.mjs'
test('empty stream is open until end and then complete', () => {
  const r = createBoundedStreamRecord()
  assert.equal(r.snapshot().status, 'open'); r.end()
  const s = r.snapshot()
  assert.equal(s.status, 'complete'); assert.equal(s.capturedBytes, 0)
  assert.equal(s.sha256OfCapturedBytes, createHash('sha256').update('').digest('hex'))
})
test('exact ceiling is complete and digest binds all bytes', () => {
  const r = createBoundedStreamRecord(3); r.append(Buffer.from('abc')); r.end()
  const s = r.snapshot()
  assert.equal(s.status, 'complete'); assert.equal(s.truncated, false)
  assert.equal(s.observedBytes, 3); assert.equal(s.bytes.toString(), 'abc')
  assert.equal(s.sha256OfCapturedBytes, createHash('sha256').update('abc').digest('hex'))
})
test('overflow preserves only bounded prefix and never claims complete', () => {
  const r = createBoundedStreamRecord(3); r.append(Buffer.from('ab'))
  assert.throws(() => r.append(Buffer.from('cdef')), /ceiling/)
  r.end(); const s = r.snapshot()
  assert.equal(s.status, 'failed'); assert.equal(s.truncated, true)
  assert.equal(s.capturedBytes, 3); assert.equal(s.observedBytes, 6)
  assert.equal(s.bytes.toString(), 'abc')
})
test('later drain bytes remain bounded after overflow', () => {
  const r = createBoundedStreamRecord(1)
  assert.throws(() => r.append(Buffer.from('ab')), /ceiling/)
  const original = r.snapshot().originalFailure
  assert.throws(() => r.append(Buffer.from('cd')), /ceiling/)
  assert.equal(r.snapshot().observedBytes, 4)
  assert.equal(r.snapshot().originalFailure, original)
  assert.equal(r.snapshot().bytes.toString(), 'a')
})
test('uses encoded bytes rather than character count', () => {
  const r = createBoundedStreamRecord(2)
  assert.throws(() => r.append(Buffer.from('€')), /ceiling/)
  assert.equal(r.snapshot().observedBytes, 3); assert.equal(r.snapshot().capturedBytes, 2)
})
test('copies exact subarray and isolates returned snapshots', () => {
  const input = new Uint8Array([9, 1, 2, 8]), r = createBoundedStreamRecord()
  r.append(input.subarray(1, 3)); input.fill(0)
  const first = r.snapshot(); first.bytes.fill(7)
  assert.deepEqual([...r.snapshot().bytes], [1, 2])
})
test('data after end invalidates later terminal snapshots', () => {
  const r = createBoundedStreamRecord(); r.end()
  assert.throws(() => r.append(Buffer.from('x')), /after terminal/)
  assert.equal(r.snapshot().lateData, true); assert.equal(r.snapshot().status, 'failed')
})
test('duplicate end is a protocol failure', () => {
  const r = createBoundedStreamRecord(); r.end()
  assert.throws(() => r.end(), /Duplicate/); assert.equal(r.snapshot().status, 'failed')
})
test('original falsy failure survives overflow and end', () => {
  for (const value of [undefined, null, 0, false, '']) {
    const r = createBoundedStreamRecord(1); r.fail(value)
    assert.throws(() => r.append(Buffer.from('ab')), /ceiling/); r.end()
    assert.equal(r.snapshot().hasFailure, true)
    assert.equal(r.snapshot().originalFailure, value)
    assert.equal(r.snapshot().status, 'failed')
  }
})
test('strings and invalid limits fail closed', () => {
  for (const cap of [0, 65537, -1, 1.5, NaN]) assert.throws(() => createBoundedStreamRecord(cap), /ceiling/)
  const r = createBoundedStreamRecord()
  assert.throws(() => r.append('abc'), /must be bytes/); r.end()
  assert.equal(r.snapshot().status, 'failed'); assert.equal(r.snapshot().capturedBytes, 0)
})
