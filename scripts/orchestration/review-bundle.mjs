#!/usr/bin/env node
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, isAbsolute, normalize, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const MAX_RECEIPT_BYTES = 2 * 1024 * 1024
const MAX_TOTAL_RECEIPT_BYTES = 8 * 1024 * 1024
const TASK_ID = /^[a-z0-9][a-z0-9._-]*$/i
const HASH = /^[0-9a-f]{64}$/i
const GIT_OID = /^[0-9a-f]{40,64}$/i
const SECRET_ASSIGNMENT =
  /(?:^|[\s{,])["']?(?:authorization|api[_-]?key|client[_-]?secret|credential(?:s)?|password|passwd|private[_-]?key|access[_-]?token|refresh[_-]?token)["']?\s*[:=]/im
const SECRET_KEY =
  /^(?:authorization|api[_-]?key|client[_-]?secret|credential(?:s)?|password|passwd|private[_-]?key|access[_-]?token|refresh[_-]?token)$/i

const sha256 = value => createHash('sha256').update(value).digest('hex')
const git = (repo, args, options = {}) =>
  execFileSync('git', args, {
    cwd: repo,
    encoding: options.encoding ?? 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })

function pathExists(path) {
  try {
    lstatSync(path)
    return true
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false
    throw error
  }
}

export function canonicalPath(value) {
  let target = resolve(value),
    ancestor = target
  const tail = []
  while (!pathExists(ancestor)) {
    const parent = dirname(ancestor)
    assert(parent !== ancestor, `cannot canonicalize path: ${value}`)
    tail.unshift(basename(ancestor))
    ancestor = parent
  }
  return resolve(realpathSync(ancestor), ...tail)
}

function insideOrSame(root, value) {
  const fromRoot = relative(root, value)
  return (
    fromRoot === '' ||
    (!fromRoot.startsWith(`..${sep}`) && fromRoot !== '..' && !isAbsolute(fromRoot))
  )
}

function safeIdentityPath(value, label = 'path') {
  assert(typeof value === 'string' && value.length, `${label} must be non-empty`)
  assert(!isAbsolute(value) && !value.includes('\0'), `unsafe ${label}: ${value}`)
  assert(value.replaceAll('\\', '/') === value, `non-canonical ${label}: ${value}`)
  assert(!value.split('/').includes('..'), `unsafe ${label} traversal: ${value}`)
  assert(normalize(value).split(sep).join('/') === value, `non-canonical ${label}: ${value}`)
  assert(value !== '.', `${label} must identify a file: ${value}`)
  return value
}

function isSensitivePath(value) {
  const name = basename(value).toLowerCase()
  return (
    name === '.env' ||
    name.startsWith('.env.') ||
    name === '.envrc' ||
    name.endsWith('.env') ||
    /^id_(?:rsa|ed25519)(?:\.|$)/.test(name) ||
    /(?:credential|secret)/.test(name) ||
    /\.(?:pem|key)$/.test(name)
  )
}

export function safeRepoFile(repo, value) {
  safeIdentityPath(value, 'receipt path')
  assert(!isSensitivePath(value), `sensitive receipt path is not bundle-safe: ${value}`)
  const repository = canonicalPath(repo),
    absolute = resolve(repo, value)
  assert(pathExists(absolute) && lstatSync(absolute).isFile(), `missing receipt file: ${value}`)
  const resolved = realpathSync(absolute)
  assert(insideOrSame(repository, resolved), `receipt resolves outside repository: ${value}`)
  return resolved
}

function safeBundleFile(root, value, label) {
  safeIdentityPath(value, label)
  const bundle = canonicalPath(root),
    absolute = resolve(root, value)
  assert(pathExists(absolute) && lstatSync(absolute).isFile(), `missing ${label}: ${value}`)
  const resolved = realpathSync(absolute)
  assert(insideOrSame(bundle, resolved), `${label} resolves outside bundle: ${value}`)
  return resolved
}

function assertReviewReadyCheckout(repo) {
  try {
    execFileSync('git', ['diff', '--quiet'], { cwd: repo })
    execFileSync('git', ['diff', '--cached', '--quiet'], { cwd: repo })
  } catch {
    throw new Error('review bundle requires no staged or unstaged tracked changes')
  }
  const untracked = git(repo, ['ls-files', '--others', '--exclude-standard', '-z'], {
    encoding: 'buffer',
  })
    .toString('utf8')
    .split('\0')
    .filter(Boolean)
    .filter(path => !path.startsWith('.serena/'))
  assert(
    !untracked.length,
    `review bundle requires committed source; untracked paths: ${untracked.join(', ')}`
  )
}

function validateBase(repo, base) {
  assert(typeof base === 'string' && base.length && !base.startsWith('-'), 'base ref is required')
  try {
    return git(repo, ['rev-parse', '--verify', `${base}^{commit}`]).trim()
  } catch {
    throw new Error(`base ref is not a commit: ${base}`)
  }
}

function parseNameStatus(raw) {
  const fields = raw.toString('utf8').split('\0').filter(Boolean),
    records = []
  for (let index = 0; index < fields.length; ) {
    const status = fields[index++]
    if (/^[RC]/.test(status)) {
      records.push({ status, from: fields[index++], path: fields[index++] })
    } else records.push({ status, path: fields[index++] })
  }
  return records
}

function sourceAtHead(repo, head, path, status) {
  if (/^D/.test(status)) return { state: 'deleted' }
  const value = git(repo, ['show', `${head}:${path}`], { encoding: 'buffer' })
  return {
    state: 'present',
    sha256: sha256(value),
    blobOid: git(repo, ['rev-parse', `${head}:${path}`]).trim(),
    bytes: value.length,
  }
}

function assertNoSecretDecoded(value, label = 'receipt') {
  if (typeof value === 'string') {
    if (SECRET_ASSIGNMENT.test(value))
      throw new Error(`receipt decoded payload contains secret-like field at ${label}`)
    const trimmed = value.trim()
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        const decoded = JSON.parse(trimmed)
        if (decoded !== value) assertNoSecretDecoded(decoded, `${label}.decoded`)
      } catch (error) {
        if (error instanceof SyntaxError) return
        throw error
      }
    }
    return
  }
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index++)
      assertNoSecretDecoded(value[index], `${label}[${index}]`)
    return
  }
  if (!value || typeof value !== 'object') return
  for (const [key, item] of Object.entries(value)) {
    if (SECRET_KEY.test(key))
      throw new Error(`receipt decoded payload contains secret-like field at ${label}`)
    assertNoSecretDecoded(item, `${label}.${key}`)
  }
}

function redactReceipt(raw, repo) {
  assert(raw.length <= MAX_RECEIPT_BYTES, `receipt exceeds ${MAX_RECEIPT_BYTES} bytes`)
  assert(!raw.includes(0), 'binary receipts are not review-bundle safe')
  const text = new TextDecoder('utf-8', { fatal: true }).decode(raw)
  assert(
    !SECRET_ASSIGNMENT.test(text),
    'receipt contains a secret-like assignment; publish a bounded sanitized receipt instead'
  )
  try {
    assertNoSecretDecoded(JSON.parse(text))
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error
  }
  const repository = canonicalPath(repo),
    requestedRepository = resolve(repo),
    home = homedir()
  let redacted = text,
    redactions = 0
  const replacements = [
    [repository, '<SOURCE_ROOT>'],
    [requestedRepository, '<SOURCE_ROOT>'],
    [home, '<HOME>'],
  ].sort((left, right) => right[0].length - left[0].length)
  for (const [needle, replacement] of replacements) {
    if (!needle || !redacted.includes(needle)) continue
    const parts = redacted.split(needle)
    redactions += parts.length - 1
    redacted = parts.join(replacement)
  }
  return { data: Buffer.from(redacted, 'utf8'), redactions }
}

function assertOutsideSource(repo, output) {
  assert(isAbsolute(output), 'review bundle output must be an absolute path')
  const source = canonicalPath(repo),
    target = canonicalPath(output)
  assert(
    !insideOrSame(source, target) && !insideOrSame(target, source),
    'review bundle output must resolve outside and not alias the source project'
  )
  assert(!existsSync(target), `review bundle output already exists: ${target}`)
  mkdirSync(dirname(target), { recursive: true })
  const recanonicalized = canonicalPath(target)
  assert.equal(
    recanonicalized,
    target,
    'review bundle output canonical path changed after parent creation'
  )
  return target
}

function collectReceipts(repo, receipts) {
  let totalReceiptBytes = 0
  const prepared = []
  for (const sourcePath of [...new Set(receipts)]) {
    const absolute = safeRepoFile(repo, sourcePath),
      raw = readFileSync(absolute)
    totalReceiptBytes += raw.length
    assert(
      totalReceiptBytes <= MAX_TOTAL_RECEIPT_BYTES,
      `receipts exceed ${MAX_TOTAL_RECEIPT_BYTES} total source bytes`
    )
    const { data, redactions } = redactReceipt(raw, repo)
    prepared.push({
      sourcePath,
      raw,
      data,
      redactions,
      bundlePath: `receipts/${sourcePath}`,
    })
  }
  return prepared
}

function expectedMap(entries, label) {
  assert(Array.isArray(entries), `${label} must be an array`)
  const values = new Map()
  for (const entry of entries) {
    assert(
      entry && typeof entry === 'object' && !Array.isArray(entry),
      `${label} entry must be an object`
    )
    const path = safeIdentityPath(entry.path, `${label} path`)
    assert(HASH.test(entry.sha256 ?? ''), `${label} sha256 is invalid for ${path}`)
    assert(!values.has(path), `duplicate ${label} path: ${path}`)
    values.set(path, entry.sha256.toLowerCase())
  }
  return values
}

function expectedDeletionSet(entries = []) {
  assert(Array.isArray(entries), 'expected deletions must be an array')
  const values = new Set()
  for (const value of entries) {
    const path = safeIdentityPath(value, 'expected deletion path')
    assert(!values.has(path), `duplicate expected deletion path: ${path}`)
    values.add(path)
  }
  return values
}

function validateExpectedIdentity(manifest, expected) {
  assert(expected && typeof expected === 'object', 'trusted expected identity is required')
  assert(GIT_OID.test(expected.expectedHead ?? ''), 'trusted expected head is required')
  assert.equal(
    manifest.repository?.headOid,
    expected.expectedHead,
    'bundle head identity does not match trusted expected head'
  )
  assert(HASH.test(expected.expectedDiffSha256 ?? ''), 'trusted expected diff sha256 is required')
  assert.equal(
    manifest.diff?.sha256,
    expected.expectedDiffSha256.toLowerCase(),
    'bundle diff identity does not match trusted expected diff'
  )

  const expectedSources = expectedMap(expected.expectedSources, 'expected source'),
    expectedDeletions = expectedDeletionSet(expected.expectedDeletions),
    manifestSources = new Map(),
    manifestDeletions = new Set(),
    manifestPaths = new Set()
  for (const path of expectedSources.keys())
    assert(!expectedDeletions.has(path), `source cannot be both present and deleted: ${path}`)
  assert(Array.isArray(manifest.sources), 'manifest sources must be an array')
  for (const source of manifest.sources) {
    const path = safeIdentityPath(source.path, 'manifest source path')
    assert(!manifestPaths.has(path), `duplicate manifest source path: ${path}`)
    manifestPaths.add(path)
    if (source.state === 'deleted') {
      assert(/^D/.test(source.status ?? ''), `deleted source status is invalid: ${path}`)
      assert(!Object.hasOwn(source, 'sha256'), `deleted source must not carry sha256: ${path}`)
      assert(!Object.hasOwn(source, 'blobOid'), `deleted source must not carry blobOid: ${path}`)
      assert(!Object.hasOwn(source, 'bytes'), `deleted source must not carry bytes: ${path}`)
      manifestDeletions.add(path)
      continue
    }
    assert.equal(source.state, 'present', `manifest source state is invalid: ${path}`)
    assert(!/^D/.test(source.status ?? ''), `present source cannot have deleted status: ${path}`)
    assert(HASH.test(source.sha256 ?? ''), `manifest source sha256 is invalid for ${path}`)
    manifestSources.set(path, source.sha256.toLowerCase())
  }
  assert.equal(manifestSources.size, expectedSources.size, 'bundle source identity count mismatch')
  assert.equal(
    manifestDeletions.size,
    expectedDeletions.size,
    'bundle deletion identity count mismatch'
  )
  for (const [path, hash] of expectedSources)
    assert.equal(manifestSources.get(path), hash, `bundle source identity mismatch: ${path}`)
  for (const path of expectedDeletions)
    assert(manifestDeletions.has(path), `bundle deletion identity mismatch: ${path}`)

  const expectedReceipts = expectedMap(expected.expectedReceipts ?? [], 'expected receipt'),
    manifestReceipts = new Map()
  assert(Array.isArray(manifest.receipts), 'manifest receipts must be an array')
  for (const receipt of manifest.receipts) {
    const sourcePath = safeIdentityPath(receipt.sourcePath, 'manifest receipt source path')
    assert(
      HASH.test(receipt.bundleSha256 ?? ''),
      `manifest receipt bundle sha256 is invalid for ${sourcePath}`
    )
    assert(
      !manifestReceipts.has(sourcePath),
      `duplicate manifest receipt source path: ${sourcePath}`
    )
    manifestReceipts.set(sourcePath, receipt.bundleSha256.toLowerCase())
  }
  assert.equal(
    manifestReceipts.size,
    expectedReceipts.size,
    'bundle receipt identity count mismatch'
  )
  for (const [path, hash] of expectedReceipts) {
    assert.equal(manifestReceipts.get(path), hash, `bundle receipt identity mismatch: ${path}`)
  }
}

function verifierSource() {
  return String.raw`#!/usr/bin/env node
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readFileSync, realpathSync } from 'node:fs'
import { dirname, isAbsolute, normalize, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const HASH = /^[0-9a-f]{64}$/i
const GIT_OID = /^[0-9a-f]{40,64}$/i
const sha = value => createHash('sha256').update(value).digest('hex')
const root = dirname(fileURLToPath(import.meta.url))

function safeRelative(value, label) {
  assert(typeof value === 'string' && value.length, label + ' must be non-empty')
  assert(!isAbsolute(value) && !value.includes('\\0'), 'unsafe ' + label + ': ' + value)
  assert(value.replaceAll('\\\\', '/') === value, 'non-canonical ' + label + ': ' + value)
  assert(!value.split('/').includes('..'), 'unsafe ' + label + ' traversal: ' + value)
  assert(normalize(value).split(sep).join('/') === value, 'non-canonical ' + label + ': ' + value)
  return value
}

function safeFile(value, label) {
  safeRelative(value, label)
  const absolute = resolve(root, value)
  assert(existsSync(absolute) && lstatSync(absolute).isFile(), 'missing ' + label + ': ' + value)
  const bundle = realpathSync(root)
  const resolved = realpathSync(absolute)
  const local = relative(bundle, resolved)
  assert(
    local === '' || (!local.startsWith('..' + sep) && local !== '..' && !isAbsolute(local)),
    label + ' resolves outside bundle: ' + value
  )
  return resolved
}

function parsePair(value, label) {
  const index = value.lastIndexOf('=')
  assert(index > 0, label + ' must be path=sha256')
  const path = safeRelative(value.slice(0, index), label)
  const hash = value.slice(index + 1)
  assert(HASH.test(hash), 'invalid ' + label + ' sha256: ' + path)
  return { path, sha256: hash.toLowerCase() }
}

function parseArgs(args) {
  const options = { expectedSource: [], expectedReceipt: [], expectedDeletion: [] }
  for (let index = 0; index < args.length; index++) {
    const flag = args[index]
    const value = args[++index]
    assert(flag && flag.startsWith('--') && value !== undefined && !value.startsWith('--'), 'invalid verifier argument')
    if (flag === '--expected-source') options.expectedSource.push(parsePair(value, 'expected source'))
    else if (flag === '--expected-receipt') options.expectedReceipt.push(parsePair(value, 'expected receipt'))
    else if (flag === '--expected-deletion') options.expectedDeletion.push(safeRelative(value, 'expected deletion'))
    else if (flag === '--expected-head') options.expectedHead = value
    else if (flag === '--expected-diff-sha256') options.expectedDiffSha256 = value
    else throw new Error('unknown verifier option: ' + flag)
  }
  assert(GIT_OID.test(options.expectedHead || ''), 'trusted --expected-head is required')
  assert(HASH.test(options.expectedDiffSha256 || ''), 'trusted --expected-diff-sha256 is required')
  return options
}

function mapEntries(entries, label) {
  const values = new Map()
  for (const entry of entries) {
    assert(!values.has(entry.path), 'duplicate ' + label + ': ' + entry.path)
    values.set(entry.path, entry.sha256)
  }
  return values
}

const expected = parseArgs(process.argv.slice(2))
const manifest = JSON.parse(readFileSync(safeFile('manifest.json', 'manifest'), 'utf8'))
assert.equal(manifest.version, 1)
assert.equal(manifest.kind, 'pnd-review-bundle')
assert.equal(manifest.repository && manifest.repository.headOid, expected.expectedHead, 'bundle head identity mismatch')
assert.equal(manifest.diff && manifest.diff.sha256, expected.expectedDiffSha256.toLowerCase(), 'bundle diff identity mismatch')

const expectedSources = mapEntries(expected.expectedSource, 'expected source')
const expectedDeletions = new Set(expected.expectedDeletion)
assert.equal(expectedDeletions.size, expected.expectedDeletion.length, 'duplicate expected deletion')
const sources = new Map()
const deletions = new Set()
const sourcePaths = new Set()
for (const path of expectedSources.keys())
  assert(!expectedDeletions.has(path), 'source cannot be both present and deleted: ' + path)
assert(Array.isArray(manifest.sources), 'manifest sources must be an array')
for (const source of manifest.sources) {
  const path = safeRelative(source.path, 'manifest source path')
  assert(!sourcePaths.has(path), 'duplicate manifest source: ' + path)
  sourcePaths.add(path)
  if (source.state === 'deleted') {
    assert(/^D/.test(source.status || ''), 'invalid deleted source status: ' + path)
    assert(!Object.hasOwn(source, 'sha256'), 'deleted source must not carry sha256: ' + path)
    assert(!Object.hasOwn(source, 'blobOid'), 'deleted source must not carry blobOid: ' + path)
    assert(!Object.hasOwn(source, 'bytes'), 'deleted source must not carry bytes: ' + path)
    deletions.add(path)
    continue
  }
  assert.equal(source.state, 'present', 'invalid manifest source state: ' + path)
  assert(!/^D/.test(source.status || ''), 'present source cannot have deleted status: ' + path)
  assert(HASH.test(source.sha256 || ''), 'invalid manifest source sha256: ' + path)
  sources.set(path, source.sha256.toLowerCase())
}
assert.equal(sources.size, expectedSources.size, 'bundle source identity count mismatch')
assert.equal(deletions.size, expectedDeletions.size, 'bundle deletion identity count mismatch')
for (const [path, hash] of expectedSources)
  assert.equal(sources.get(path), hash, 'bundle source identity mismatch: ' + path)
for (const path of expectedDeletions)
  assert(deletions.has(path), 'bundle deletion identity mismatch: ' + path)

const expectedReceipts = mapEntries(expected.expectedReceipt, 'expected receipt')
const receiptSources = new Map()
assert(Array.isArray(manifest.receipts), 'manifest receipts must be an array')
for (const receipt of manifest.receipts) {
  const path = safeRelative(receipt.sourcePath, 'manifest receipt source path')
  assert(HASH.test(receipt.bundleSha256 || ''), 'invalid manifest receipt bundle sha256: ' + path)
  assert(!receiptSources.has(path), 'duplicate manifest receipt: ' + path)
  receiptSources.set(path, receipt.bundleSha256.toLowerCase())
}
assert.equal(receiptSources.size, expectedReceipts.size, 'bundle receipt identity count mismatch')
for (const [path, hash] of expectedReceipts)
  assert.equal(receiptSources.get(path), hash, 'bundle receipt identity mismatch: ' + path)

const diff = readFileSync(safeFile(manifest.diff.path, 'diff'))
assert.equal(sha(diff), expected.expectedDiffSha256.toLowerCase())
assert.equal(diff.length, manifest.diff.bytes)
for (const receipt of manifest.receipts) {
  const data = readFileSync(safeFile(receipt.bundlePath, 'receipt bundle path'))
  const trustedHash = expectedReceipts.get(receipt.sourcePath)
  assert(trustedHash, 'missing trusted receipt identity: ' + receipt.sourcePath)
  assert.equal(sha(data), trustedHash, receipt.bundlePath)
  assert.equal(data.length, receipt.bundleBytes, receipt.bundlePath)
}
console.log(JSON.stringify({
  status: 'passed',
  headOid: expected.expectedHead,
  sources: sources.size + deletions.size,
  receipts: receiptSources.size,
  diffSha256: expected.expectedDiffSha256.toLowerCase(),
}, null, 2))
`
}

function bundleReadme(manifest) {
  return `# Review bundle: ${manifest.taskId}

This directory is intentionally outside the source checkout so a reviewer can open it
through an independent Local Dev project binding.

1. Obtain the expected HEAD, changed-source SHA-256 values, receipt source hashes, and
   diff SHA-256 from a trusted source/PR handoff — never from this bundle's manifest.
2. Open this directory with Local Dev \`project_open\`.
3. Run \`node verify.mjs --expected-head <HEAD> --expected-diff-sha256 <SHA>\`
   plus one \`--expected-source path=sha256\` for every present changed source,
   one \`--expected-deletion path\` for every deleted tracked source, and one
   \`--expected-receipt path=sha256\` for every receipt.
4. Review \`changes.patch\`, \`manifest.json\`, and the copied bounded receipts.
5. If Local Dev reports \`PROJECT_IN_USE\` for this bundle, the worker closeout is incomplete.

The bundle contains no repository credentials or environment files. Explicit receipt
inputs are text-only, secret-like assignments are rejected, and local source/home paths
are redacted in copied receipts.
`
}

export function buildReviewBundle(repo, { taskId, base, output, receipts = [] }) {
  assert(TASK_ID.test(taskId ?? ''), 'task id must use letters, numbers, dot, underscore, or dash')
  assertReviewReadyCheckout(repo)
  const headOid = git(repo, ['rev-parse', 'HEAD']).trim(),
    branch = git(repo, ['branch', '--show-current']).trim(),
    baseCommit = validateBase(repo, base),
    changes = parseNameStatus(
      git(
        repo,
        ['diff', '--name-status', '-z', '--find-renames', `${baseCommit}..${headOid}`, '--'],
        { encoding: 'buffer' }
      )
    )
  assert(changes.length, 'review bundle requires at least one committed change')
  for (const change of changes) {
    for (const path of [change.from, change.path].filter(Boolean)) {
      safeIdentityPath(path, 'changed source path')
      assert(!isSensitivePath(path), `sensitive changed path is not bundle-safe: ${path}`)
    }
  }

  const patch = git(repo, ['diff', '--binary', `${baseCommit}..${headOid}`, '--'], {
      encoding: 'buffer',
    }),
    sources = changes.map(change => ({
      ...change,
      ...sourceAtHead(repo, headOid, change.path, change.status),
    })),
    preparedReceipts = collectReceipts(repo, receipts),
    receiptEntries = preparedReceipts.map(({ sourcePath, raw, data, redactions, bundlePath }) => ({
      sourcePath,
      sourceSha256: sha256(raw),
      sourceBytes: raw.length,
      bundlePath,
      bundleSha256: sha256(data),
      bundleBytes: data.length,
      redactions,
    })),
    manifest = {
      version: 1,
      kind: 'pnd-review-bundle',
      taskId,
      repository: { branch, baseCommit, headOid },
      diff: { path: 'changes.patch', sha256: sha256(patch), bytes: patch.length },
      sources,
      receipts: receiptEntries,
      reviewerPreflight: {
        localDev:
          'Open this bundle as a non-overlapping Local Dev project and verify it against trusted caller-supplied identities before releasing it.',
        verify: ['node', 'verify.mjs'],
      },
    }

  const target = assertOutsideSource(repo, output),
    staging = mkdtempSync(resolve(dirname(target), `.${basename(target)}.tmp-`))
  try {
    writeFileSync(resolve(staging, 'changes.patch'), patch)
    for (const receipt of preparedReceipts) {
      const destination = resolve(staging, receipt.bundlePath)
      mkdirSync(dirname(destination), { recursive: true })
      writeFileSync(destination, receipt.data)
    }
    writeFileSync(resolve(staging, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
    writeFileSync(resolve(staging, 'verify.mjs'), verifierSource())
    writeFileSync(resolve(staging, 'README.md'), bundleReadme(manifest))
    renameSync(staging, target)
  } catch (error) {
    rmSync(staging, { recursive: true, force: true })
    throw error
  }
  return { status: 'passed', output: target, manifest }
}

export function verifyReviewBundle(bundle, expected) {
  const root = canonicalPath(bundle),
    manifestPath = safeBundleFile(root, 'manifest.json', 'manifest'),
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  assert.equal(manifest.version, 1)
  assert.equal(manifest.kind, 'pnd-review-bundle')
  validateExpectedIdentity(manifest, expected)

  const diff = readFileSync(safeBundleFile(root, manifest.diff.path, 'diff'))
  assert.equal(sha256(diff), expected.expectedDiffSha256.toLowerCase())
  assert.equal(diff.length, manifest.diff.bytes)
  const expectedReceipts = expectedMap(expected.expectedReceipts ?? [], 'expected receipt')
  for (const receipt of manifest.receipts) {
    const data = readFileSync(safeBundleFile(root, receipt.bundlePath, 'receipt bundle path')),
      trustedHash = expectedReceipts.get(receipt.sourcePath)
    assert(trustedHash, `missing trusted receipt identity: ${receipt.sourcePath}`)
    assert.equal(sha256(data), trustedHash, receipt.bundlePath)
    assert.equal(data.length, receipt.bundleBytes, receipt.bundlePath)
  }
  return {
    status: 'passed',
    headOid: expected.expectedHead,
    sources: expected.expectedSources.length + (expected.expectedDeletions ?? []).length,
    receipts: (expected.expectedReceipts ?? []).length,
    diffSha256: expected.expectedDiffSha256.toLowerCase(),
  }
}

function parsePair(value, label) {
  const index = value.lastIndexOf('=')
  assert(index > 0, `${label} must be path=sha256`)
  const path = safeIdentityPath(value.slice(0, index), label),
    hash = value.slice(index + 1)
  assert(HASH.test(hash), `invalid ${label} sha256: ${path}`)
  return { path, sha256: hash.toLowerCase() }
}

function parseArgs(args) {
  const options = {
    receipt: [],
    'expected-source': [],
    'expected-receipt': [],
    'expected-deletion': [],
  }
  for (let index = 0; index < args.length; index++) {
    const flag = args[index]
    assert(flag.startsWith('--'), `unexpected argument: ${flag}`)
    const key = flag.slice(2),
      value = args[++index]
    assert(value !== undefined && !value.startsWith('--'), `missing value for ${flag}`)
    if (['receipt', 'expected-source', 'expected-receipt', 'expected-deletion'].includes(key))
      options[key].push(value)
    else {
      assert(!Object.hasOwn(options, key), `duplicate option: ${flag}`)
      options[key] = value
    }
  }
  return options
}

function main() {
  const [command = 'create', ...args] = process.argv.slice(2),
    options = parseArgs(args)
  if (command === 'create') {
    for (const key of Object.keys(options))
      assert(
        [
          'receipt',
          'expected-source',
          'expected-receipt',
          'expected-deletion',
          'task-id',
          'base',
          'output',
        ].includes(key),
        `unknown create option: --${key}`
      )
    assert(
      !options['expected-source'].length &&
        !options['expected-receipt'].length &&
        !options['expected-deletion'].length,
      'create does not accept expected identities'
    )
    assert(options['task-id'], 'create requires --task-id')
    assert(options.base, 'create requires --base')
    assert(options.output, 'create requires --output')
    const result = buildReviewBundle(ROOT, {
      taskId: options['task-id'],
      base: options.base,
      output: options.output,
      receipts: options.receipt,
    })
    console.log(JSON.stringify(result, null, 2))
    return
  }
  if (command === 'verify') {
    for (const key of Object.keys(options))
      assert(
        [
          'receipt',
          'expected-source',
          'expected-receipt',
          'expected-deletion',
          'bundle',
          'expected-head',
          'expected-diff-sha256',
        ].includes(key),
        `unknown verify option: --${key}`
      )
    assert(!options.receipt.length, 'verify does not accept --receipt')
    assert(options.bundle, 'verify requires --bundle')
    const expected = {
      expectedHead: options['expected-head'],
      expectedDiffSha256: options['expected-diff-sha256'],
      expectedSources: options['expected-source'].map(value => parsePair(value, 'expected source')),
      expectedDeletions: options['expected-deletion'],
      expectedReceipts: options['expected-receipt'].map(value =>
        parsePair(value, 'expected receipt')
      ),
    }
    console.log(JSON.stringify(verifyReviewBundle(options.bundle, expected), null, 2))
    return
  }
  throw new Error(`unknown review-bundle command: ${command}`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main()
