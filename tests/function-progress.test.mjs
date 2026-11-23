import assert from 'node:assert/strict'
import { test } from 'node:test'
import { execFileSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { compareSnapshots, makeSnapshot } from '../scripts/function-progress.mjs'

const original = 'a'.repeat(64)
const fileDigest = 'b'.repeat(64)
const entry = (address, status = 'implemented') => ({ address, status, scope: 'Whole routine in scope',
  sources: status === 'missing' ? [] : ['app/movement.ts'], evidence: ['decomp/test.md'], limits: 'No mission credit.' })
const caps = (addresses, entries, { executableSha256 = original, revision = null, pathExists = null } = {}) =>
  makeSnapshot(JSON.stringify({ executableSha256, files: Object.fromEntries(addresses.map(x => [x + '.c', fileDigest])) }),
    JSON.stringify({ schema: 1, executableSha256, entries }), { revision, pathExists })

test('selected export inventory is partitioned without equating unknown and missing', () => {
  const report = caps(['00400004', '00400002', '00400001', '00400003'], [
    entry('00400001'), entry('00400002', 'partial'), entry('00400003', 'missing')])
  assert.equal(report.knownOriginalFunctions, 4)
  assert.equal(report.fullOriginalFunctionCount, null)
  assert.deepEqual(report.counts, { implemented: 1, partial: 1, missing: 1, unassessed: 1 })
  assert.deepEqual(report.knownAddresses, ['00400001', '00400002', '00400003', '00400004'])
  assert.equal(report.inventorySha256.length, 64)
})

test('diff separates changed denominator from real same-address assessment transitions', () => {
  const before = caps(['00400001', '00400002', '00400003'], [entry('00400001', 'partial')],
    { revision: 'old' })
  const after = caps(['00400001', '00400002', '00400004', '00400005'], [
    entry('00400001'), entry('00400002', 'missing'), entry('00400004')], { revision: 'new' })
  const report = compareSnapshots(before, after)
  assert.equal(report.beforeRevision, 'old')
  assert.equal(report.afterRevision, 'new')
  assert.deepEqual(report.inventory, { before: 3, after: 4, added: ['00400004', '00400005'], removed: ['00400003'] })
  assert.deepEqual(report.transitions, [
    { address: '00400001', from: 'partial', to: 'implemented' },
    { address: '00400002', from: 'unassessed', to: 'missing' },
  ])
  assert.deepEqual(report.counts.implemented, { before: 0, after: 2, delta: 2 })
})

test('diff records reopening and removing unsupported assessment without claiming regression in an unknown scope', () => {
  const before = caps(['00400001', '00400002'], [entry('00400001'), entry('00400002', 'partial')])
  const after = caps(['00400001', '00400002'], [entry('00400001', 'partial')])
  assert.deepEqual(compareSnapshots(before, after).transitions, [
    { address: '00400001', from: 'implemented', to: 'partial' },
    { address: '00400002', from: 'partial', to: 'unassessed' },
  ])
})

test('mixed executable identities fail closed', () => {
  assert.throws(() => compareSnapshots(caps(['00400001'], []),
    caps(['00400001'], [], { executableSha256: 'c'.repeat(64) })), /different original executables/)
  assert.throws(() => makeSnapshot(JSON.stringify({ executableSha256: original, files: { '00400001.c': fileDigest } }),
    JSON.stringify({ schema: 1, executableSha256: 'c'.repeat(64), entries: [] })), /identity/)
})

test('known address and exactly one explicit non-unknown status are required', () => {
  assert.throws(() => caps(['00400001'], [entry('00400002')]), /Unknown or duplicate/)
  assert.throws(() => caps(['00400001'], [entry('00400001'), entry('00400001')]), /Unknown or duplicate/)
  assert.throws(() => caps(['00400001'], [entry('00400001', 'unassessed')]), /Invalid status/)
})

test('validated evidence paths, readable scope/limits, and source are required for claimed implementation', () => {
  for (const overrides of [{ evidence: [] }, { sources: [] }, { limits: '' }, { scope: null },
    { evidence: ['decomp/../README.md'] }, { evidence: ['https://example.test/evidence'] }]) {
    assert.throws(() => caps(['00400001'], [{ ...entry('00400001'), ...overrides }]), /Invalid status/)
  }
  assert.throws(() => caps(['00400001'], [entry('00400001')], { pathExists: name => name.startsWith('app/') }),
    /Missing ledger reference.*decomp\/test.md/)
})

test('checked-in report is current and every assessed address links to existing evidence', () => {
  const cli = fileURLToPath(new URL('../scripts/function-progress.mjs', import.meta.url))
  assert.equal(execFileSync(process.execPath, [cli, '--check'], { encoding: 'utf8' }), '')
})

test('exact revision modes reject empty refs rather than reading the worktree', () => {
  const cli = fileURLToPath(new URL('../scripts/function-progress.mjs', import.meta.url))
  for (const args of [['--json', '--revision', ''], ['--compare', '', 'HEAD']]) {
    const result = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' })
    assert.equal(result.status, 1)
    assert.match(result.stderr, /Invalid Git revision/)
    assert.equal(result.stdout, '')
  }
})
