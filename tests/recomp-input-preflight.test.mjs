import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  truncateSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { inspectInputs, inspectRequiredFiles } from '../scripts/recomp-prototype/inspect-inputs.mjs'

const cli = new URL('../scripts/recomp-prototype/inspect-inputs.mjs', import.meta.url)
const pins = JSON.parse(
  readFileSync(new URL('../scripts/recomp-prototype/reference-inputs.json', import.meta.url))
)
const digest = value => createHash('sha256').update(value).digest('hex')
function fixture(t) {
  const path = mkdtempSync(join(tmpdir(), 'pnd-recomp-identity-'))
  t.after(() => rmSync(path, { recursive: true, force: true }))
  return path
}
function run(args) {
  return spawnSync(process.execPath, [cli.pathname, ...args], {
    encoding: 'utf8',
    timeout: 5000,
    maxBuffer: 64 * 1024,
  })
}

test('hashes invented binary data without executing it, accepts unique Windows filename casing', t => {
  const root = fixture(t)
  const bytes = Buffer.from('#!/bin/sh\necho NEVER_EXECUTE\n')
  writeFileSync(join(root, 'pOpTb.ExE'), bytes, { mode: 0o700 })
  const files = inspectRequiredFiles(root, { 'popTB.exe': digest(bytes) })
  assert.equal(files[0].status, 'matched')
  assert.equal(files[0].actualName, 'pOpTb.ExE')
  assert.equal(files[0].bytes, bytes.length)
  assert.deepEqual(readFileSync(join(root, 'pOpTb.ExE')), bytes)
})

test('a matching supporting DLL does not allow an unsupported executable', t => {
  const root = fixture(t)
  writeFileSync(join(root, 'popTB.exe'), 'unsupported')
  writeFileSync(join(root, 'QMixer.dll'), 'matching')
  const files = inspectRequiredFiles(root, {
    'popTB.exe': digest('supported'),
    'QMixer.dll': digest('matching'),
  })
  assert.deepEqual(
    files.map(({ status }) => status),
    ['blocked', 'matched']
  )
  assert.equal(files[0].reason, 'sha256-mismatch')
})

test('reports missing and ambiguous inputs without choosing a binary', t => {
  const root = fixture(t)
  writeFileSync(join(root, 'popTB.exe'), 'a')
  writeFileSync(join(root, 'POPTB.EXE'), 'a')
  const files = inspectRequiredFiles(root, { 'popTB.exe': digest('a'), 'QMixer.dll': digest('a') })
  assert.deepEqual(
    files.map(({ reason }) => reason),
    ['ambiguous-case', 'missing']
  )
})

test('rejects symlink files, directories masquerading as binaries, and oversized inputs', t => {
  const root = fixture(t)
  writeFileSync(join(root, 'target'), 'a')
  symlinkSync('target', join(root, 'popTB.exe'))
  mkdirSync(join(root, 'QMixer.dll'))
  writeFileSync(join(root, 'WEANETR.dll'), '')
  truncateSync(join(root, 'WEANETR.dll'), 32 * 1024 * 1024 + 1)
  const files = inspectRequiredFiles(root, {
    'popTB.exe': digest('a'),
    'QMixer.dll': digest('a'),
    'WEANETR.dll': digest('a'),
  })
  assert.deepEqual(
    files.map(({ reason }) => reason),
    ['non-regular-file', 'non-regular-file', 'file-size-limit']
  )
})

test('rejects a symlink root and symlink ancestor', t => {
  const root = fixture(t)
  mkdirSync(join(root, 'real'))
  mkdirSync(join(root, 'real', 'game'))
  symlinkSync('real', join(root, 'link'))
  for (const path of [join(root, 'link'), join(root, 'link', 'game')]) {
    assert.throws(() => inspectRequiredFiles(path, {}), /non-directory-or-symlink/)
  }
})

test('fixed profiles bind upstream identities and do not claim runtime or asset acceptance', t => {
  const root = fixture(t)
  assert.equal(
    pins.profiles['openpoptb-software'].requiredFiles['popTB.exe'],
    'a46e7c6fa04e13f6cd5accebe32bb5f543f1cd0808bb96b0040f59763251109e'
  )
  assert.equal(
    pins.profiles['populous-recomp-web'].requiredFiles['D3DPopTB.exe'],
    '815ba8a550f571c38b602cf3386f65aab942667a4a2d9c7096b3660deac2eacd'
  )
  for (const profile of Object.keys(pins.profiles)) {
    const result = inspectInputs(profile, root)
    assert.equal(result.status, 'blocked')
    assert.equal(result.scope.originalCodeExecuted, false)
    assert.equal(result.scope.runtimeReadiness, 'not-evaluated')
    assert.equal(result.scope.assetIdentityVerified, false)
    assert.equal(result.scope.sourceCheckoutVerified, false)
    assert.equal(
      result.manifestSha256,
      digest(
        readFileSync(new URL('../scripts/recomp-prototype/reference-inputs.json', import.meta.url))
      )
    )
    assert.equal(result.inspectorSha256, digest(readFileSync(cli)))
    assert.ok(!JSON.stringify(result).includes(root))
  }
  assert.throws(() => inspectInputs('__proto__', root), /unknown-profile/)
})

test('CLI fails closed on mismatched inputs, missing roots, unknown profiles, and override arguments', t => {
  const root = fixture(t)
  writeFileSync(join(root, 'd3dpoptb.exe'), 'synthetic mismatched original')
  const args = ['--profile', 'populous-recomp-web', '--game-root', root]
  const result = run(args)
  assert.equal(result.error, undefined)
  assert.equal(result.status, 1)
  assert.equal(result.stderr, '')
  const report = JSON.parse(result.stdout)
  assert.equal(report.status, 'blocked')
  assert.equal(report.files[0].reason, 'sha256-mismatch')
  assert.equal(report.files[0].sha256, digest('synthetic mismatched original'))
  for (const extra of [
    ['--sha256', digest('synthetic mismatched original')],
    ['--force'],
    ['--execute', 'anything'],
  ]) {
    const rejected = run([...args, ...extra])
    assert.equal(rejected.status, 2)
    assert.equal(rejected.stdout, '')
  }
  const unknown = run(['--profile', 'unknown', '--game-root', root])
  assert.equal(unknown.status, 1)
  assert.equal(JSON.parse(unknown.stdout).reason, 'unknown-profile')
  const missing = run(['--profile', 'openpoptb-software', '--game-root', join(root, 'missing')])
  assert.equal(missing.status, 1)
  assert.equal(JSON.parse(missing.stdout).reason, 'ENOENT')
})

// The OS resolves symlink/.. differently from path.resolve/path.join. Both
// enumeration and hashing must use the same validated directory.
test('rejects parent traversal before a symlink can redirect directory enumeration', t => {
  const root = fixture(t)
  mkdirSync(join(root, 'safe'))
  mkdirSync(join(root, 'redirect', 'inner'), { recursive: true })
  mkdirSync(join(root, 'redirect', 'safe'))
  symlinkSync(join(root, 'redirect', 'inner'), join(root, 'link'))
  writeFileSync(join(root, 'safe', 'popTB.exe'), 'expected')
  writeFileSync(join(root, 'redirect', 'safe', 'popTB.exe'), 'unsupported')
  const path = `${root}/link/../safe`
  for (const suppliedPath of [path, `${root}/link\\..\\safe`]) {
    assert.throws(
      () => inspectRequiredFiles(suppliedPath, { 'popTB.exe': digest('expected') }),
      /parent-directory-component/
    )
  }
  const result = run(['--profile', 'openpoptb-software', '--game-root', path])
  assert.equal(result.status, 1)
  assert.equal(JSON.parse(result.stdout).reason, 'parent-directory-component')
})
