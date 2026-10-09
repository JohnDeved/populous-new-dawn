import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { discoverReceipts, evaluateCheck } from '../scripts/parity-measure.mjs'

function fixture(t) {
  const repo = fs.mkdtempSync(join(tmpdir(), 'parity-streaming-'))
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }))
  const directory = join(repo, 'work/orchestration')
  fs.mkdirSync(directory, { recursive: true })
  const put = (name, value) => fs.writeFileSync(join(directory, name), JSON.stringify(value))
  const oversized = (name, value, tail = '') => {
    const fd = fs.openSync(join(directory, name), 'wx')
    try {
      fs.writeSync(fd, '{"discarded":"')
      const chunk = 'x'.repeat(1024 * 1024)
      for (let i = 0; i < 64; i++) fs.writeSync(fd, chunk)
      fs.writeSync(fd, '",' + JSON.stringify(value).slice(1) + tail)
    } finally { fs.closeSync(fd) }
  }
  return { repo, put, oversized }
}

const check = { id: 'stream-check', kind: 'native', expected: { exitCode: 0 } }
const current = { version: 1, definitionHash: 'definition', inputFingerprint: 'source', inputPaths: ['fixture'], runtime: { node: 'test' } }
const attempt = (status, finishedAt) => ({ kind: 'pnd-command-receipt', status,
  phase: status === 'unknown' ? 'prepared' : 'finished', command: ['node', 'fixture.mjs'],
  parityMeasurements: [{ ...current, checkId: check.id, status, finishedAt,
    exitCode: status === 'passed' ? 0 : status === 'failed' ? 1 : null }] })

test('oversized unrelated result is completely inspected without tainting a smaller receipt', t => {
  const { repo, put, oversized } = fixture(t)
  put('old.json', attempt('passed', '2026-10-09T00:00:00Z'))
  oversized('result.json', { result: { kind: 'pnd-command-receipt' } })
  const found = discoverReceipts(repo)
  assert.deepEqual(found.warnings, [])
  assert.equal(found.receipts.length, 1)
})

for (const [status, expected] of [['failed', 'failed'], ['unknown', 'unknown'], ['invalidated', 'stale']])
  test(`oversized newer ${status} receipt retains late metadata and suppresses an older pass`, t => {
    const { repo, put, oversized } = fixture(t)
    put('old.json', attempt('passed', '2026-10-09T00:00:00Z'))
    oversized('new.json', attempt(status, '2026-10-09T00:01:00Z'))
    const found = discoverReceipts(repo)
    assert.deepEqual(found.warnings, [])
    assert.equal(found.receipts.length, 2)
    assert.equal(evaluateCheck(check, found.receipts, current).status, expected)
  })

test('oversized owned attempts still warn before any adapter can credit old evidence', t => {
  const { repo, oversized } = fixture(t)
  oversized('owned.json', { kind: 'pnd-command-receipt', projected: false,
    command: ['node', 'scripts/local-render/harness.mjs', '--scenario', 'scripts/local-render/early-missions.mjs'],
    status: 'unknown', parityMeasurements: [] })
  const found = discoverReceipts(repo)
  assert.equal(found.warnings.length, 1)
  assert.match(found.warnings[0], /oversized owned receipt requires complete raw validation/)
  assert.equal(found.receipts.length, 0)
})

test('malformed trailing bytes after an oversized apparent noncandidate remain a warning', t => {
  const { repo, oversized } = fixture(t)
  oversized('malformed.json', { result: true }, 'garbage')
  const found = discoverReceipts(repo)
  assert.equal(found.warnings.length, 1)
  assert.match(found.warnings[0], /invalid JSON/)
  assert.equal(found.receipts.length, 0)
})

test('oversized contract preserves exact measurements and invalidates an outcome mismatch', t => {
  const { repo, put, oversized } = fixture(t)
  put('old.json', attempt('passed', '2026-10-09T00:00:00Z'))
  oversized('contract.json', { identity: { taskId: 'test' }, verification: {
    results: [{ status: 'failed', parityMeasurements: attempt('passed', '2026-10-09T00:01:00Z').parityMeasurements }] } })
  const found = discoverReceipts(repo)
  assert.deepEqual(found.warnings, [])
  assert.equal(evaluateCheck(check, found.receipts, current).status, 'stale')
})

for (const scenario of ['scripts/local-render/early-missions.mjs', 'qa/blast-ordinary/controls.mjs'])
  test(`oversized malformed owned options retain the source fallback for ${scenario}`, t => {
    const { repo, oversized } = fixture(t)
    oversized('owned.json', { kind: 'pnd-command-receipt', projected: false,
      command: ['node', 'scripts/local-render/harness.mjs', '--scenario'],
      source: { inputs: { [scenario]: 'hash' } }, status: 'unknown', parityMeasurements: [] })
    const found = discoverReceipts(repo)
    assert.equal(found.warnings.length, 1)
    assert.match(found.warnings[0], /oversized owned receipt requires complete raw validation/)
    assert.equal(found.receipts.length, 0)
  })
