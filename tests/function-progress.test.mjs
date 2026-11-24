import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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

test('implementation evidence uses an exact commit ID and only belongs on implemented rows', () => {
  const revision = '1'.repeat(40)
  assert.equal(caps(['00400001'], [{ ...entry('00400001'), implementationRevision: revision }])
    .entries[0].implementationRevision, revision)
  for (const variant of [{ revision: 'HEAD', status: 'implemented' },
    { revision: revision.slice(0, 8), status: 'implemented' }, { revision, status: 'partial' }]) {
    assert.throws(() => caps(['00400001'], [{
      ...entry('00400001', variant.status), implementationRevision: variant.revision,
    }]), /Invalid implementation revision/)
  }
})

test('Git history distinguishes new code, backfills, other-path changes, and denominator movement', t => {
  const root = mkdtempSync(join(tmpdir(), 'function-progress-history-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  for (const d of ['app', 'decomp', 'scripts']) mkdirSync(join(root, d))
  const cli = join(root, 'scripts/function-progress.mjs')
  copyFileSync(fileURLToPath(new URL('../scripts/function-progress.mjs', import.meta.url)), cli)
  const git = (...args) => execFileSync('git', ['-C', root, '-c', 'user.name=Fixture',
    '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', ...args], { encoding: 'utf8' }).trim()
  const write = (path, value) => writeFileSync(join(root, path), value)
  const commit = label => { git('add', '-A'); git('commit', '--quiet', '-m', label); return git('rev-parse', 'HEAD') }
  const inventory = addresses => write('decomp/exports.json', JSON.stringify({ executableSha256: original,
    files: Object.fromEntries(addresses.map(x => [x + '.c', fileDigest])) }))
  const ledger = entries => write('decomp/function-progress.json', JSON.stringify({
    schema: 1, executableSha256: original, entries,
  }))
  git('init', '--quiet')
  inventory(['00400001', '00400002', '00400003'])
  ledger([])
  write('app/movement.ts', 'export const existing = true\n')
  const older = commit('Existing feature and first snapshot')
  write('app/movement.ts', 'export const existing = true\nexport const newlyImplemented = true\n')
  const newerCode = commit('Deliver new behavior')
  write('app/unrelated.ts', 'export const unrelated = true\n')
  const wrongPath = commit('Unrelated change')
  ledger([
    { ...entry('00400001'), implementationRevision: older },
    { ...entry('00400002'), implementationRevision: newerCode },
    { ...entry('00400003'), implementationRevision: wrongPath },
  ])
  const assessment = commit('Audit two routines and one unsupported claim')
  inventory(['00400001', '00400002', '00400003', '00400004'])
  const invalidRef = '0'.repeat(40)
  ledger([
    { ...entry('00400001'), implementationRevision: older },
    { ...entry('00400002'), implementationRevision: newerCode },
    { ...entry('00400003'), implementationRevision: wrongPath },
    { ...entry('00400004'), implementationRevision: invalidRef },
  ])
  const latest = commit('Discover one inventoried routine')
  // A legacy routine may be attributed to a comment-only commit by a mistaken
  // ledger author. The CLI reports a claim, never proof that code was delivered.
  write('app/movement.ts', '// Comment only\nexport const existing = true\nexport const newlyImplemented = true\n')
  const commentOnly = commit('Comment-only app change')
  inventory(['00400001', '00400002', '00400003', '00400004', '00400005'])
  ledger([
    { ...entry('00400001'), implementationRevision: older },
    { ...entry('00400002'), implementationRevision: newerCode },
    { ...entry('00400003'), implementationRevision: wrongPath },
    { ...entry('00400004'), implementationRevision: invalidRef },
    { ...entry('00400005'), implementationRevision: commentOnly },
  ])
  const claimed = commit('Record a timing declaration')
  const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' })
  const result = run('--history', older, assessment, latest)
  assert.equal(result.status, 0, result.stderr)
  const history = JSON.parse(result.stdout)
  const [first, second] = history.intervals
  const third = JSON.parse(run('--compare', latest, claimed).stdout)
  assert.equal(third.implementationCredits.basis, 'ledger-declaration-with-git-path-corroboration')
  assert.deepEqual(third.implementationCredits.entries.map(row => [row.address, row.attribution]), [
    ['00400005', 'declared-in-interval'],
  ])
  assert.deepEqual(first.implementationCredits.counts, { 'declared-in-interval': 1, 'declared-pre-existing': 1, unverified: 1 })
  assert.deepEqual(first.implementationCredits.entries.map(row => [row.address, row.attribution]), [
    ['00400001', 'declared-pre-existing'], ['00400002', 'declared-in-interval'], ['00400003', 'unverified'],
  ])
  assert.deepEqual(second.inventory.added, ['00400004'])
  assert.deepEqual(second.implementationCredits.counts, { 'declared-in-interval': 0, 'declared-pre-existing': 0, unverified: 1 })
  assert.equal(second.implementationCredits.entries[0].newInventoryEntry, true)
  assert.equal(first.beforeRevision, older)
  assert.equal(second.afterRevision, latest)
  assert.match(run('--compare', latest, older).stderr, /ancestor order/)
})
