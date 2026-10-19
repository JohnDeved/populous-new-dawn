#!/usr/bin/env node
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { lstatSync, readFileSync, readlinkSync, realpathSync } from 'node:fs'
import { dirname, isAbsolute, join, normalize, posix, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual } from 'node:util'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const HASH = /^[0-9a-f]{64}$/
const OID = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/
const RECEIPT_LIMIT = 8 * 1024 * 1024
const INPUT_LIMIT = 32 * 1024 * 1024
const utf8 = bytes => new TextDecoder('utf-8', { fatal: true }).decode(bytes)

function object(value, label) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`)
  assert(Object.getPrototypeOf(value) === Object.prototype, `${label} must be a plain object`)
}

function keys(value, expected, label) {
  object(value, label)
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort(), `${label} fields are incomplete or ambiguous`)
}

function parseJson(bytes) {
  const text = utf8(bytes), value = JSON.parse(text), stack = []
  // JSON.parse accepts duplicate keys. Reject those before trusting any mapping,
  // including escaped spellings of the same receipt/source/input key.
  for (const [token] of text.matchAll(/"(?:\\.|[^"\\])*"|[{}\[\],:]/g)) {
    if (token === '{') stack.push({ keys: new Set(), expectingKey: true })
    else if (token === '[') stack.push(null)
    else if (token === '}' || token === ']') stack.pop()
    else if (token === ',' && stack.at(-1)) stack.at(-1).expectingKey = true
    else if (token.startsWith('"') && stack.at(-1)?.expectingKey) {
      const key = JSON.parse(token), frame = stack.at(-1)
      assert(!frame.keys.has(key), 'duplicate JSON object key')
      frame.keys.add(key)
      frame.expectingKey = false
    }
  }
  return value
}

function absolutePath(value, label) {
  assert(typeof value === 'string' && isAbsolute(value), `${label} must be absolute`)
  assert(!/[\x00-\x1f]/.test(value) && normalize(value) === value, `${label} is unsafe or non-canonical`)
  return value
}

function relativePath(value, label) {
  assert(typeof value === 'string' && value.length && !isAbsolute(value), `${label} must be relative`)
  assert(!/[\\\x00-\x1f]/.test(value) && posix.normalize(value) === value, `${label} is unsafe or non-canonical`)
  assert(!value.split('/').some(part => part === '.' || part === '..' || part === '.git'), `${label} is unsafe`)
  return value
}

function inside(root, path) {
  const tail = relative(root, path)
  return !isAbsolute(tail) && tail !== '..' && !tail.startsWith(`..${sep}`)
}

function regularBytes(path, limit = INPUT_LIMIT) {
  absolutePath(path, 'physical file')
  const before = lstatSync(path)
  assert(before.isFile() && !before.isSymbolicLink(), 'physical file must be regular and not a symlink')
  assert(realpathSync(path) === path, 'physical file must use its canonical physical path')
  assert(before.size <= limit, 'physical file exceeds reconstruction bound')
  const bytes = readFileSync(path), after = lstatSync(path)
  assert.deepEqual(
    [after.dev, after.ino, after.size, after.mtimeMs],
    [before.dev, before.ino, before.size, before.mtimeMs],
    'physical file changed during reconstruction'
  )
  assert(bytes.length === before.size, 'physical file size changed during reconstruction')
  return bytes
}

function git(repo, args) {
  try {
    return execFileSync('git', ['--no-replace-objects', '--literal-pathspecs', '-C', repo, ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: INPUT_LIMIT,
      env: { ...process.env, GIT_NO_LAZY_FETCH: '1', GIT_OPTIONAL_LOCKS: '0' },
    })
  } catch {
    throw new Error('missing or unreadable Git object')
  }
}

function logicalPath(sourceRoot, input) {
  if (isAbsolute(input)) return absolutePath(input, 'recorded input')
  return resolve(sourceRoot, relativePath(input, 'recorded input'))
}

function gitInput(spec, binding, expectedHash) {
  keys(binding, ['input', 'kind', 'gitPath'], 'Git binding')
  const path = relativePath(binding.gitPath, 'Git input path')
  const logical = logicalPath(spec.recordedSourceRoot, binding.input)
  assert(inside(spec.recordedSourceRoot, logical), 'Git input is outside the recorded source root')
  assert(relative(spec.recordedSourceRoot, logical).split(sep).join('/') === path, 'Git input path differs from recorded path')
  const entries = git(spec.repo, ['ls-tree', '-z', '--full-tree', spec.testedHead, '--', path]).toString('utf8').split('\0').filter(Boolean)
  assert(entries.length === 1, 'Git input is missing or ambiguous at the tested HEAD')
  const match = /^(100644|100755) blob ([0-9a-f]+)\t([\s\S]+)$/.exec(entries[0])
  assert(match && match[3] === path && OID.test(match[2]), 'Git input must be a regular tracked blob')
  const bytes = git(spec.repo, ['cat-file', 'blob', match[2]])
  assert(sha256(bytes) === expectedHash, 'Git input bytes do not match the recorded SHA256')
  return { kind: 'git', gitHead: spec.testedHead, gitPath: path, blobOid: match[2], bytes: bytes.length }
}

function backupInput(binding, expectedHash) {
  keys(binding, ['input', 'kind', 'backupPath'], 'backup binding')
  const path = absolutePath(binding.backupPath, 'backup path'), bytes = regularBytes(path)
  assert(sha256(bytes) === expectedHash, 'backup bytes do not match the recorded SHA256')
  return { kind: 'backup', retainedPhysicalPath: path, bytes: bytes.length }
}

function runtimeInput(spec, binding, expectedHash) {
  keys(binding, ['input', 'kind', 'originalRoot', 'currentRoot', 'relativePath', 'expectedRoot', 'expectedLinks'], 'runtime binding')
  keys(binding.expectedRoot, ['device', 'inode', 'uid'], 'runtime root identity')
  for (const value of Object.values(binding.expectedRoot)) assert(Number.isSafeInteger(value) && value >= 0, 'invalid runtime root identity')
  const originalRoot = absolutePath(binding.originalRoot, 'original runtime root')
  const currentRoot = absolutePath(binding.currentRoot, 'current runtime root')
  const path = relativePath(binding.relativePath, 'runtime relative path')
  assert(logicalPath(spec.recordedSourceRoot, binding.input) === resolve(originalRoot, path), 'runtime alias differs from the recorded logical input')
  const root = lstatSync(currentRoot)
  assert(root.isDirectory() && !root.isSymbolicLink() && realpathSync(currentRoot) === currentRoot, 'runtime root must be a private physical directory')
  assert.deepEqual({ device: root.dev, inode: root.ino, uid: root.uid }, binding.expectedRoot, 'runtime root identity changed')
  if (typeof process.getuid === 'function') assert(root.uid === process.getuid(), 'runtime root is not owned by this executor')
  assert(Array.isArray(binding.expectedLinks), 'runtime link identities are required')
  for (const link of binding.expectedLinks) {
    keys(link, ['path', 'target'], 'runtime link identity')
    relativePath(link.path, 'runtime link path')
    assert(typeof link.target === 'string' && link.target.length, 'runtime link target is required')
  }
  let pending = path.split('/'), parts = []
  const observedLinks = [], seenLinks = new Set()
  while (pending.length) {
    parts.push(pending.shift())
    const candidate = join(currentRoot, ...parts), value = lstatSync(candidate)
    if (value.isSymbolicLink()) {
      const target = readlinkSync(candidate), linkPath = relative(currentRoot, candidate).split(sep).join('/')
      assert(!isAbsolute(target) && !/[\\\x00-\x1f]/.test(target), 'runtime link target must be safe and relative')
      const destination = resolve(dirname(candidate), target)
      assert(inside(currentRoot, destination), 'runtime link escapes its private root')
      assert(!seenLinks.has(linkPath) && observedLinks.length < 40, 'runtime link chain is cyclic or ambiguous')
      seenLinks.add(linkPath)
      observedLinks.push({ path: linkPath, target })
      pending = [...relative(currentRoot, destination).split(sep).filter(Boolean), ...pending]
      parts = []
    } else if (pending.length) assert(value.isDirectory(), 'runtime alias crosses a non-directory')
    else assert(value.isFile(), 'runtime input must resolve to a regular file')
  }
  assert.deepEqual(observedLinks, binding.expectedLinks, 'runtime link identity differs from the caller binding')
  const physical = join(currentRoot, ...parts), bytes = regularBytes(physical)
  assert(sha256(bytes) === expectedHash, 'runtime bytes do not match the recorded SHA256')
  const after = lstatSync(currentRoot)
  assert.deepEqual([after.dev, after.ino, after.uid], [root.dev, root.ino, root.uid], 'runtime root changed during reconstruction')
  return {
    kind: 'runtime', originalPrivateRoot: originalRoot, verifiedPhysicalRoot: currentRoot,
    verifiedPhysicalPath: physical, rootIdentity: binding.expectedRoot, verifiedLinks: observedLinks,
    bytes: bytes.length,
  }
}

export function reconstructHistoricalInputs(spec, expected) {
  keys(expected, ['receiptSha256', 'testedHead'], 'trusted caller identities')
  assert(HASH.test(expected.receiptSha256) && OID.test(expected.testedHead), 'complete trusted caller identities are required')
  keys(spec, ['version', 'receipt', 'repo', 'recordedSourceRoot', 'testedHead', 'streams', 'bindings'], 'reconstruction specification')
  assert(spec.version === 1, 'unsupported reconstruction specification version')
  keys(spec.receipt, ['path', 'sha256'], 'caller receipt pin')
  assert(HASH.test(spec.receipt.sha256), 'caller receipt SHA256 is required')
  assert(spec.receipt.sha256 === expected.receiptSha256 && spec.testedHead === expected.testedHead, 'specification differs from the trusted caller identities')
  absolutePath(spec.repo, 'Git repository')
  absolutePath(spec.recordedSourceRoot, 'recorded source root')
  assert(OID.test(spec.testedHead), 'caller tested HEAD must be a complete immutable OID')
  const receiptPath = absolutePath(spec.receipt.path, 'receipt path')
  const receiptBytes = regularBytes(receiptPath, RECEIPT_LIMIT)
  assert(sha256(receiptBytes) === spec.receipt.sha256, 'receipt bytes differ from the caller SHA256 pin')
  const receipt = parseJson(receiptBytes)
  assert(receipt.version === 1 && receipt.kind === 'pnd-command-receipt', 'unsupported original receipt')
  assert(receipt.phase === 'finished' && ['passed', 'failed'].includes(receipt.status), 'original receipt is not stable and terminal')
  absolutePath(receipt.cwd, 'original receipt cwd')
  assert(spec.recordedSourceRoot === receipt.cwd, 'caller source root differs from the original receipt cwd')
  keys(receipt.source, ['headOid', 'branch', 'trackedDiffSha256', 'inputs'], 'original source fingerprint')
  assert(isDeepStrictEqual(receipt.source, receipt.sourceAfter), 'source before/after fingerprints differ')
  assert(receipt.source.headOid === spec.testedHead, 'original receipt HEAD differs from the caller tested HEAD')
  assert(typeof receipt.source.branch === 'string' && HASH.test(receipt.source.trackedDiffSha256), 'invalid original source fingerprint')
  object(receipt.source.inputs, 'recorded inputs')
  assert(Object.keys(receipt.source.inputs).length, 'original receipt has no recorded inputs')
  assert(git(spec.repo, ['cat-file', '-t', spec.testedHead]).toString('utf8').trim() === 'commit', 'tested HEAD must identify a commit')
  keys(spec.streams, ['stdout', 'stderr'], 'caller raw stream paths')
  keys(receipt.artifacts, ['stdout', 'stderr'], 'original raw stream paths')
  const streams = {}
  for (const field of ['stdout', 'stderr']) {
    assert(typeof receipt[field] === 'string' && HASH.test(receipt[`${field}Sha256`]), 'invalid original stream identity')
    const supplied = absolutePath(spec.streams[field], 'caller raw stream path'), bytes = regularBytes(supplied)
    assert(utf8(bytes) === receipt[field] && sha256(bytes) === receipt[`${field}Sha256`], 'raw stream bytes differ from the original receipt')
    streams[field] = {
      originalLogicalPath: absolutePath(receipt.artifacts[field], 'original raw stream path'),
      verifiedPhysicalPath: supplied, sha256: sha256(bytes), bytes: bytes.length, rawUtf8DecodePreservesCR: true,
    }
  }
  assert(Array.isArray(spec.bindings), 'complete caller input bindings are required')
  const bindings = new Map()
  for (const binding of spec.bindings) {
    object(binding, 'input binding')
    assert(typeof binding.input === 'string' && !bindings.has(binding.input), 'duplicate or invalid caller input binding')
    assert(Object.hasOwn(receipt.source.inputs, binding.input), 'caller supplied an unexpected input binding')
    logicalPath(spec.recordedSourceRoot, binding.input)
    bindings.set(binding.input, binding)
  }
  assert(bindings.size === Object.keys(receipt.source.inputs).length, 'caller input binding set is incomplete')
  const inputs = []
  for (const [input, expectedHash] of Object.entries(receipt.source.inputs)) {
    assert(HASH.test(expectedHash), 'invalid recorded input SHA256')
    const binding = bindings.get(input)
    assert(['git', 'backup', 'runtime'].includes(binding.kind), 'unsupported input reconstruction kind')
    const recovered = binding.kind === 'git' ? gitInput(spec, binding, expectedHash)
      : binding.kind === 'backup' ? backupInput(binding, expectedHash) : runtimeInput(spec, binding, expectedHash)
    inputs.push({ originalLogicalInput: input, recordedSha256: expectedHash, historicalOnly: true, ...recovered })
  }
  return {
    version: 1, kind: 'pnd-historical-receipt-input-reconstruction', status: 'reconstructed',
    originalReceipt: { path: receiptPath, sha256: spec.receipt.sha256, status: receipt.status, exitCode: receipt.exitCode },
    testedHead: spec.testedHead, recordedBranch: receipt.source.branch, recordedSourceRoot: receipt.cwd,
    recordedTrackedDiffSha256: receipt.source.trackedDiffSha256, streams, inputs,
    claims: { currentSourceOrInputs: false, wholeDirtySourceRecovered: false, commandExecuted: false, gatePassed: false, ownershipReleased: false, publicDisclosureAuthorized: false },
    meaning: 'Only caller-pinned historical receipt input bytes are reconstructed. Original status and paths remain historical; original receipts/artifacts are never rewritten. This does not reconstruct an unpreserved dirty diff or authorize worktree/runtime reuse.',
  }
}

function main() {
  const options = {}, args = process.argv.slice(2)
  assert(args.length === 6, 'requires --spec, --expected-receipt-sha256 and --expected-head')
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index], value = args[index + 1]
    assert(['--spec', '--expected-receipt-sha256', '--expected-head'].includes(flag) && !Object.hasOwn(options, flag), 'unknown or duplicate resolver option')
    assert(value && !value.startsWith('--'), 'missing resolver option value')
    options[flag] = value
  }
  const spec = parseJson(regularBytes(absolutePath(options['--spec'], 'specification path'), RECEIPT_LIMIT))
  console.log(JSON.stringify(reconstructHistoricalInputs(spec, {
    receiptSha256: options['--expected-receipt-sha256'], testedHead: options['--expected-head'],
  }), null, 2))
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main() } catch (error) {
    console.error(`Historical reconstruction failed: ${error.message}`)
    process.exitCode = 1
  }
}
