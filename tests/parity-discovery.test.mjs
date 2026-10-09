import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { discoverReceipts, evaluateCheck } from '../scripts/parity-measure.mjs'

function fixture(t) {
  const repo = mkdtempSync(join(tmpdir(), 'parity-discovery-'))
  t.after(() => rmSync(repo, { recursive: true, force: true }))
  const put = (path, value) => {
    const file = join(repo, 'work/orchestration', path)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value))
  }
  return { repo, put }
}

const check = { id: 'test-check', kind: 'native', expected: { exitCode: 0 } }
const current = { version: 1, definitionHash: 'definition', inputFingerprint: 'source', inputPaths: ['fixture'], runtime: { node: 'test' } }
function attempt(status, finishedAt, padding = '') {
  return { kind: 'pnd-command-receipt', status, phase: status === 'unknown' ? 'prepared' : 'finished',
    command: ['node', 'fixture.mjs'], padding,
    parityMeasurements: [{ ...current, checkId: check.id, status, finishedAt, exitCode: status === 'passed' ? 0 : status === 'failed' ? 1 : null }] }
}
const large = () => 'x'.repeat(5 * 1024 * 1024)

test('valid large unrelated sidecar fits the reviewed discovery budget without tainting receipts', t => {
  const { repo, put } = fixture(t)
  put('sidecar.json', { samples: large() })
  put('attempt.json', attempt('passed', '2026-10-09T00:00:00Z'))
  const found = discoverReceipts(repo)
  assert.deepEqual(found.warnings, [])
  assert.equal(found.receipts.length, 1)
})

for (const status of ['failed', 'unknown']) test(`large newer ${status} attempt remains visible and suppresses old pass`, t => {
  const { repo, put } = fixture(t)
  put('old.json', attempt('passed', '2026-10-09T00:00:00Z'))
  put('new.json', attempt(status, '2026-10-09T00:01:00Z', large()))
  const found = discoverReceipts(repo)
  assert.deepEqual(found.warnings, [])
  assert.equal(found.receipts.length, 2)
  assert.equal(evaluateCheck(check, found.receipts, current).status, status)
})

test('verified binary compile caches do not exhaust receipt traversal', t => {
  const { repo, put } = fixture(t)
  for (let run = 0; run < 15; run++) for (let file = 0; file < 714; file++)
    put(`run-${run}-tmp/node-compile-cache/v24.19.0-x64-cf738c9d-1000/${file.toString(16).padStart(8, '0')}`, 'binary fixture')
  put('attempt.json', attempt('unknown', '2026-10-09T00:00:00Z'))
  const found = discoverReceipts(repo)
  assert.deepEqual(found.warnings, [])
  assert.equal(found.receipts.length, 1)
})

for (const relative of ['new.json', 'unexpected/new.json']) test(`cache-shaped directory preserves candidate ${relative}`, t => {
  const { repo, put } = fixture(t)
  const cache = 'run-tmp/node-compile-cache/v24.19.0-x64-cf738c9d-1000'
  put(`${cache}/0123abcd`, 'binary fixture')
  put(`${cache}/${relative}`, attempt('unknown', '2026-10-09T00:01:00Z'))
  put('old.json', attempt('passed', '2026-10-09T00:00:00Z'))
  const found = discoverReceipts(repo)
  assert.equal(found.receipts.length, 2)
  assert.equal(evaluateCheck(check, found.receipts, current).status, 'unknown')
})

test('malformed large JSON remains a discovery warning', t => {
  const { repo, put } = fixture(t)
  put('malformed.json', '{"kind":"pnd-command-receipt","padding":"' + large())
  const found = discoverReceipts(repo)
  assert.equal(found.warnings.length, 1)
  assert.equal(found.receipts.length, 0)
})

test('existing raw-log, generated-report and symlink exclusions stay intact', t => {
  const { repo, put } = fixture(t)
  put('raw.json.artifacts/invalid.json', 'malformed')
  put('parity-measure/invalid.json', 'malformed')
  put('actual.json', attempt('unknown', '2026-10-09T00:00:00Z'))
  symlinkSync(join(repo, 'work/orchestration/actual.json'), join(repo, 'work/orchestration/link.json'))
  const found = discoverReceipts(repo)
  assert.deepEqual(found.warnings, [])
  assert.equal(found.receipts.length, 1)
})
