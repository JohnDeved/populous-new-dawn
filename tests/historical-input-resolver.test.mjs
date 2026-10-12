import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { reconstructHistoricalInputs } from '../scripts/orchestration/historical-input-resolver.mjs'

const sha = value => createHash('sha256').update(value).digest('hex')
const cli = fileURLToPath(new URL('../scripts/orchestration/historical-input-resolver.mjs', import.meta.url))
const put = (path, bytes) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, bytes) }
const git = (repo, ...args) => execFileSync('git', ['-C', repo, ...args], { stdio: ['ignore', 'pipe', 'pipe'] })

function commit(repo) {
  git(repo, '-c', 'core.autocrlf=false', 'add', '--all')
  git(repo, '-c', 'user.name=Historical Resolver Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgSign=false', 'commit', '-qm', 'fixture checkpoint')
  return git(repo, 'rev-parse', 'HEAD').toString().trim()
}

function fixture(t) {
  const root = realpathSync(mkdtempSync(join(realpathSync(tmpdir()), 'pnd-historical-input-')))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const repo = join(root, 'repo')
  mkdirSync(repo)
  git(repo, '-c', 'init.defaultBranch=fixture', 'init', '-q')
  put(join(repo, '.gitignore'), 'work/\nnode_modules/\n')
  put(join(repo, 'app/value.mjs'), 'export const value = 1\n')
  const head = commit(repo)
  return { root, repo, head }
}

function receipt(f, inputs, { status = 'failed', phase = 'finished' } = {}) {
  const stdout = Buffer.from('progress\r\nfinished\r'), stderr = Buffer.from('expected failure\r\n')
  const paths = { stdout: join(f.repo, 'work/old/stdout.log'), stderr: join(f.repo, 'work/old/stderr.log') }
  put(paths.stdout, stdout); put(paths.stderr, stderr)
  const source = {
    headOid: f.head, branch: 'fixture', trackedDiffSha256: sha(git(f.repo, 'diff', 'HEAD', '--binary')),
    inputs: Object.fromEntries(Object.entries(inputs).map(([path, bytes]) => [path, sha(bytes)])),
  }
  const value = {
    version: 1, kind: 'pnd-command-receipt', phase, status, exitCode: status === 'passed' ? 0 : 2,
    source, sourceAfter: structuredClone(source), cwd: f.repo, command: ['node', 'old-command.mjs'],
    stdout: stdout.toString(), stderr: stderr.toString(), stdoutSha256: sha(stdout), stderrSha256: sha(stderr), artifacts: paths,
  }
  const path = join(f.repo, 'work/old/receipt.json')
  put(path, `${JSON.stringify(value, null, 2)}\n`)
  return { path, value, streams: paths }
}

function specification(f, r, bindings) {
  const expected = { receiptSha256: sha(readFileSync(r.path)), testedHead: f.head }
  const spec = {
    version: 1, receipt: { path: r.path, sha256: expected.receiptSha256 }, repo: f.repo,
    recordedSourceRoot: f.repo, testedHead: f.head, streams: r.streams, bindings,
  }
  return { spec, expected }
}

function runtimeFixture(f) {
  const root = join(f.root, 'relocated/node_modules'), physical = join(root, 'pkg/tool.mjs')
  const bytes = Buffer.from('export const installed = 1\n')
  put(physical, bytes); put(join(root, '.package-lock.json'), '{"unchanged":true}\n')
  mkdirSync(join(root, '.bin'))
  symlinkSync('../pkg/tool.mjs', join(root, '.bin/tool'))
  const st = lstatSync(root)
  return {
    root, physical, bytes,
    binding: {
      input: 'node_modules/.bin/tool', kind: 'runtime', originalRoot: join(f.repo, 'node_modules'), currentRoot: root,
      relativePath: '.bin/tool', expectedRoot: { device: st.dev, inode: st.ino, uid: st.uid },
      expectedLinks: [{ path: '.bin/tool', target: '../pkg/tool.mjs' }],
    },
  }
}

test('historical Git inputs survive a later committed epoch without modifying receipt, logs or current source', t => {
  const f = fixture(t), old = readFileSync(join(f.repo, 'app/value.mjs'))
  const r = receipt(f, { 'app/value.mjs': old }), args = specification(f, r, [{ input: 'app/value.mjs', kind: 'git', gitPath: 'app/value.mjs' }])
  const retained = [r.path, ...Object.values(r.streams)].map(path => [path, readFileSync(path)])
  put(join(f.repo, 'app/value.mjs'), 'export const value = 2\n')
  const newHead = commit(f.repo)
  assert.notEqual(newHead, f.head)
  const proof = reconstructHistoricalInputs(args.spec, args.expected)
  assert.equal(proof.testedHead, f.head)
  assert.equal(proof.inputs[0].recordedSha256, sha(old))
  assert.equal(proof.inputs[0].blobOid, git(f.repo, 'rev-parse', `${f.head}:app/value.mjs`).toString().trim())
  assert.equal(proof.originalReceipt.status, 'failed')
  assert.equal(proof.claims.gatePassed, false)
  assert.equal(proof.claims.currentSourceOrInputs, false)
  assert.equal(readFileSync(join(f.repo, 'app/value.mjs'), 'utf8'), 'export const value = 2\n')
  for (const [path, bytes] of retained) assert.deepEqual(readFileSync(path), bytes)
  assert.equal(proof.streams.stdout.rawUtf8DecodePreservesCR, true)
  assert.equal(proof.streams.stdout.sha256, sha(Buffer.from('progress\r\nfinished\r')))
})

test('dirty tracked inputs require their exact retained bytes when the tested Git blob differs', t => {
  const f = fixture(t), dirty = Buffer.from('export const value = 7\r\n')
  put(join(f.repo, 'app/value.mjs'), dirty)
  const r = receipt(f, { 'app/value.mjs': dirty })
  const args = specification(f, r, [{ input: 'app/value.mjs', kind: 'git', gitPath: 'app/value.mjs' }])
  assert.throws(() => reconstructHistoricalInputs(args.spec, args.expected), /Git input bytes/)
  const backup = join(f.root, 'retained/dirty-value.mjs'); put(backup, dirty)
  unlinkSync(join(f.repo, 'app/value.mjs'))
  args.spec.bindings = [{ input: 'app/value.mjs', kind: 'backup', backupPath: backup }]
  const proof = reconstructHistoricalInputs(args.spec, args.expected)
  assert.equal(proof.inputs[0].retainedPhysicalPath, backup)
  assert.equal(proof.inputs[0].bytes, dirty.length)
  assert.equal(proof.claims.wholeDirtySourceRecovered, false)
})

test('Git replacement refs cannot relabel later matching bytes as the immutable tested blob', t => {
  const f = fixture(t), dirty = Buffer.from('export const value = 9\n')
  put(join(f.repo, 'app/value.mjs'), dirty)
  const r = receipt(f, { 'app/value.mjs': dirty })
  const args = specification(f, r, [{ input: 'app/value.mjs', kind: 'git', gitPath: 'app/value.mjs' }])
  const replacement = commit(f.repo)
  git(f.repo, 'replace', f.head, replacement)
  assert.deepEqual(git(f.repo, 'show', `${f.head}:app/value.mjs`), dirty)
  assert.throws(() => reconstructHistoricalInputs(args.spec, args.expected), /Git input bytes/)
})

test('untracked test overlays and absolute external helpers use explicit matching backups', t => {
  const f = fixture(t), overlay = Buffer.from('assert.equal(actual, expected)\r\n'), helper = Buffer.from('helper byte version\n')
  const logicalHelper = join(f.root, 'former-helper.mjs')
  const r = receipt(f, { 'tests/untracked.test.mjs': overlay, [logicalHelper]: helper })
  const overlayBackup = join(f.root, 'retained/test.mjs'), helperBackup = join(f.root, 'retained/helper.mjs')
  put(overlayBackup, overlay); put(helperBackup, helper)
  const args = specification(f, r, [
    { input: 'tests/untracked.test.mjs', kind: 'backup', backupPath: overlayBackup },
    { input: logicalHelper, kind: 'backup', backupPath: helperBackup },
  ])
  const proof = reconstructHistoricalInputs(args.spec, args.expected)
  assert.deepEqual(proof.inputs.map(input => input.recordedSha256), [sha(overlay), sha(helper)])
  assert(proof.inputs.every(input => input.historicalOnly))
})

test('installed runtime alias verifies relocated identity, internal links and individual bytes', t => {
  const f = fixture(t), runtime = runtimeFixture(f)
  const r = receipt(f, { 'node_modules/.bin/tool': runtime.bytes })
  const args = specification(f, r, [runtime.binding]), proof = reconstructHistoricalInputs(args.spec, args.expected)
  assert.equal(proof.inputs[0].verifiedPhysicalPath, runtime.physical)
  assert.deepEqual(proof.inputs[0].rootIdentity, runtime.binding.expectedRoot)
  assert.deepEqual(proof.inputs[0].verifiedLinks, runtime.binding.expectedLinks)
  assert.equal(proof.claims.ownershipReleased, false)
  const lock = readFileSync(join(runtime.root, '.package-lock.json'))
  put(runtime.physical, 'different installed tool bytes\n')
  assert.deepEqual(readFileSync(join(runtime.root, '.package-lock.json')), lock)
  assert.throws(() => reconstructHistoricalInputs(args.spec, args.expected), /runtime bytes/)
})

test('every followed runtime symlink needs an explicit matching identity', t => {
  const f = fixture(t), runtime = runtimeFixture(f)
  unlinkSync(runtime.physical)
  put(join(runtime.root, 'pkg/actual.mjs'), runtime.bytes)
  symlinkSync('actual.mjs', runtime.physical)
  const r = receipt(f, { 'node_modules/.bin/tool': runtime.bytes }), args = specification(f, r, [runtime.binding])
  assert.throws(() => reconstructHistoricalInputs(args.spec, args.expected), /runtime link identity/)
  runtime.binding.expectedLinks.push({ path: 'pkg/tool.mjs', target: 'actual.mjs' })
  assert.equal(reconstructHistoricalInputs(args.spec, args.expected).inputs[0].verifiedPhysicalPath, join(runtime.root, 'pkg/actual.mjs'))
})

test('runtime alias rejects a different root inode and absolute or escaping link targets', t => {
  const f = fixture(t), runtime = runtimeFixture(f)
  const r = receipt(f, { 'node_modules/.bin/tool': runtime.bytes }), args = specification(f, r, [runtime.binding])
  const originalInode = runtime.binding.expectedRoot.inode
  runtime.binding.expectedRoot.inode++
  assert.throws(() => reconstructHistoricalInputs(args.spec, args.expected), /root identity changed/)
  runtime.binding.expectedRoot.inode = originalInode
  const alias = join(runtime.root, '.bin/tool')
  unlinkSync(alias); symlinkSync(runtime.physical, alias)
  runtime.binding.expectedLinks = [{ path: '.bin/tool', target: runtime.physical }]
  assert.throws(() => reconstructHistoricalInputs(args.spec, args.expected), /safe and relative/)
  unlinkSync(alias); put(join(f.root, 'outside.mjs'), runtime.bytes); symlinkSync('../../../outside.mjs', alias)
  runtime.binding.expectedLinks = [{ path: '.bin/tool', target: '../../../outside.mjs' }]
  assert.throws(() => reconstructHistoricalInputs(args.spec, args.expected), /escapes its private root/)
})

test('caller receipt hash and HEAD are independent of mutable specification identities', t => {
  const f = fixture(t), r = receipt(f, { 'app/value.mjs': readFileSync(join(f.repo, 'app/value.mjs')) })
  const args = specification(f, r, [{ input: 'app/value.mjs', kind: 'git', gitPath: 'app/value.mjs' }])
  args.spec.receipt.sha256 = '0'.repeat(64)
  assert.throws(() => reconstructHistoricalInputs(args.spec, args.expected), /trusted caller identities/)
  args.spec.receipt.sha256 = args.expected.receiptSha256
  args.spec.testedHead = '0'.repeat(40)
  assert.throws(() => reconstructHistoricalInputs(args.spec, args.expected), /trusted caller identities/)
  args.spec.testedHead = args.expected.testedHead
  writeFileSync(r.path, `${readFileSync(r.path, 'utf8')} `)
  assert.throws(() => reconstructHistoricalInputs(args.spec, args.expected), /receipt bytes differ/)
})

test('the specification cannot relabel the original source root while retaining valid Git bytes and trusted pins', t => {
  const f = fixture(t), r = receipt(f, { 'app/value.mjs': readFileSync(join(f.repo, 'app/value.mjs')) })
  const args = specification(f, r, [{ input: 'app/value.mjs', kind: 'git', gitPath: 'app/value.mjs' }])
  args.spec.recordedSourceRoot = join(f.root, 'different-original-root')
  assert.throws(() => reconstructHistoricalInputs(args.spec, args.expected), /source root differs from the original receipt cwd/)
})

test('changed source fingerprints and prepared unknown receipts cannot be reconstructed as terminal evidence', t => {
  const f = fixture(t), r = receipt(f, { 'app/value.mjs': readFileSync(join(f.repo, 'app/value.mjs')) })
  r.value.sourceAfter.inputs['app/value.mjs'] = '0'.repeat(64)
  put(r.path, JSON.stringify(r.value))
  let args = specification(f, r, [{ input: 'app/value.mjs', kind: 'git', gitPath: 'app/value.mjs' }])
  assert.throws(() => reconstructHistoricalInputs(args.spec, args.expected), /before\/after fingerprints/)
  r.value.sourceAfter = structuredClone(r.value.source); r.value.phase = 'prepared'; r.value.status = 'unknown'
  put(r.path, JSON.stringify(r.value)); args = specification(f, r, args.spec.bindings)
  assert.throws(() => reconstructHistoricalInputs(args.spec, args.expected), /stable and terminal/)
})

test('missing immutable objects and missing or wrong backup bytes fail closed', t => {
  const f = fixture(t), bytes = readFileSync(join(f.repo, 'app/value.mjs')), r = receipt(f, { 'app/value.mjs': bytes })
  const args = specification(f, r, [{ input: 'app/value.mjs', kind: 'git', gitPath: 'app/value.mjs' }])
  const emptyRepo = join(f.root, 'empty-repo'); mkdirSync(emptyRepo); git(emptyRepo, 'init', '-q')
  args.spec.repo = emptyRepo
  assert.throws(() => reconstructHistoricalInputs(args.spec, args.expected), /missing or unreadable Git object/)
  args.spec.repo = f.repo
  const backup = join(f.root, 'backup.mjs'); args.spec.bindings = [{ input: 'app/value.mjs', kind: 'backup', backupPath: backup }]
  assert.throws(() => reconstructHistoricalInputs(args.spec, args.expected), /ENOENT/)
  put(backup, 'wrong bytes\n')
  assert.throws(() => reconstructHistoricalInputs(args.spec, args.expected), /backup bytes/)
})

test('missing promisor blobs fail closed without fetching or adding Git objects', t => {
  const f = fixture(t), r = receipt(f, { 'app/value.mjs': readFileSync(join(f.repo, 'app/value.mjs')) })
  const args = specification(f, r, [{ input: 'app/value.mjs', kind: 'git', gitPath: 'app/value.mjs' }])
  const localOrigin = join(f.root, 'local-origin.git')
  git(f.repo, 'clone', '--bare', '--no-hardlinks', f.repo, localOrigin)
  git(f.repo, 'config', 'remote.local.url', localOrigin)
  git(f.repo, 'config', 'remote.local.promisor', 'true')
  git(f.repo, 'config', 'remote.local.partialclonefilter', 'blob:none')
  const oid = git(f.repo, 'rev-parse', `${f.head}:app/value.mjs`).toString().trim()
  const looseObject = join(f.repo, '.git/objects', oid.slice(0, 2), oid.slice(2))
  assert(existsSync(looseObject))
  unlinkSync(looseObject)
  assert.throws(() => reconstructHistoricalInputs(args.spec, args.expected), /missing or unreadable Git object/)
  assert.equal(existsSync(looseObject), false)
})

test('incomplete, duplicate, unexpected and mixed-kind mappings are rejected', t => {
  const f = fixture(t), r = receipt(f, { 'app/value.mjs': readFileSync(join(f.repo, 'app/value.mjs')) })
  const good = { input: 'app/value.mjs', kind: 'git', gitPath: 'app/value.mjs' }, args = specification(f, r, [good])
  for (const bindings of [[], [good, good], [{ ...good, input: 'unrecorded.mjs' }], [{ ...good, backupPath: join(f.root, 'backup') }]]) {
    args.spec.bindings = bindings
    assert.throws(() => reconstructHistoricalInputs(args.spec, args.expected), /incomplete|duplicate|unexpected|ambiguous/)
  }
})

test('unsafe Git mappings, symlink blobs and backup symlinks are refused', t => {
  const f = fixture(t), bytes = readFileSync(join(f.repo, 'app/value.mjs')), r = receipt(f, { 'app/value.mjs': bytes })
  const args = specification(f, r, [{ input: 'app/value.mjs', kind: 'git', gitPath: '../app/value.mjs' }])
  assert.throws(() => reconstructHistoricalInputs(args.spec, args.expected), /unsafe/)
  args.spec.bindings[0].gitPath = 'app/another.mjs'
  assert.throws(() => reconstructHistoricalInputs(args.spec, args.expected), /differs from recorded path/)
  const backup = join(f.root, 'backup.mjs'); symlinkSync(join(f.repo, 'app/value.mjs'), backup)
  args.spec.bindings = [{ input: 'app/value.mjs', kind: 'backup', backupPath: backup }]
  assert.throws(() => reconstructHistoricalInputs(args.spec, args.expected), /regular and not a symlink/)
  symlinkSync('value.mjs', join(f.repo, 'app/link.mjs')); f.head = commit(f.repo)
  const linked = receipt(f, { 'app/link.mjs': bytes }), linkArgs = specification(f, linked, [{ input: 'app/link.mjs', kind: 'git', gitPath: 'app/link.mjs' }])
  assert.throws(() => reconstructHistoricalInputs(linkArgs.spec, linkArgs.expected), /regular tracked blob/)
})

test('a changed raw CR stream and duplicate JSON keys cannot self-authenticate', t => {
  const f = fixture(t), r = receipt(f, { 'app/value.mjs': readFileSync(join(f.repo, 'app/value.mjs')) })
  let args = specification(f, r, [{ input: 'app/value.mjs', kind: 'git', gitPath: 'app/value.mjs' }])
  put(r.streams.stdout, 'progress\nfinished\n')
  assert.throws(() => reconstructHistoricalInputs(args.spec, args.expected), /raw stream bytes/)
  put(r.streams.stdout, Buffer.from(r.value.stdout))
  put(r.path, JSON.stringify(r.value).replace('"status":"failed"', '"status":"failed","st\\u0061tus":"passed"'))
  args = specification(f, r, args.spec.bindings)
  assert.throws(() => reconstructHistoricalInputs(args.spec, args.expected), /duplicate JSON object key/)
})

test('standalone CLI requires trusted pins and emits only a separate historical proof', t => {
  const f = fixture(t), r = receipt(f, { 'app/value.mjs': readFileSync(join(f.repo, 'app/value.mjs')) })
  const args = specification(f, r, [{ input: 'app/value.mjs', kind: 'git', gitPath: 'app/value.mjs' }])
  const specPath = join(f.root, 'spec.json'); put(specPath, JSON.stringify(args.spec))
  const command = ['--spec', specPath, '--expected-receipt-sha256', args.expected.receiptSha256, '--expected-head', args.expected.testedHead]
  const result = spawnSync(process.execPath, [cli, ...command], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  const proof = JSON.parse(result.stdout)
  assert.equal(proof.status, 'reconstructed')
  assert.equal(proof.originalReceipt.status, 'failed')
  assert.equal(proof.claims.commandExecuted, false)
  assert.equal(proof.claims.publicDisclosureAuthorized, false)
  assert.equal(sha(readFileSync(r.path)), args.expected.receiptSha256)
  const missingPins = spawnSync(process.execPath, [cli, '--spec', specPath], { encoding: 'utf8' })
  assert.notEqual(missingPins.status, 0)
  assert.equal(missingPins.stdout, '')
})
