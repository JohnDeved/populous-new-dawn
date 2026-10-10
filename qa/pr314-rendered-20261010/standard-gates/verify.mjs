#!/usr/bin/env node
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
