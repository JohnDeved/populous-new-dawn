#!/usr/bin/env node
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const MAX_RECEIPT_BYTES = 2 * 1024 * 1024
const MAX_TOTAL_RECEIPT_BYTES = 8 * 1024 * 1024
const TASK_ID = /^[a-z0-9][a-z0-9._-]*$/i
const SENSITIVE_PATH =
  /(^|\/)(?:\.env(?:\.|$)|id_(?:rsa|ed25519)(?:\.|$)|[^/]*(?:credential|secret)[^/]*|[^/]*\.(?:pem|key))$/i
const SECRET_ASSIGNMENT =
  /(?:^|[\s"'[{,])(?:authorization|api[_-]?key|client[_-]?secret|password|passwd|private[_-]?key|access[_-]?token|refresh[_-]?token)\s*[:=]/im

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

export function safeRepoFile(repo, value) {
  assert(typeof value === 'string' && value.length, 'receipt path must be non-empty')
  assert(!isAbsolute(value) && !value.includes('\0'), `unsafe receipt path: ${value}`)
  assert(
    !value.split('/').includes('..') && value.replaceAll('\\', '/') === value,
    `non-canonical receipt path: ${value}`
  )
  const absolute = resolve(repo, value),
    local = relative(repo, absolute)
  assert(
    local !== '..' && !local.startsWith(`..${sep}`) && !isAbsolute(local),
    `receipt escapes repository: ${value}`
  )
  assert(pathExists(absolute) && lstatSync(absolute).isFile(), `missing receipt file: ${value}`)
  const repository = realpathSync(repo),
    resolved = realpathSync(absolute),
    resolvedLocal = relative(repository, resolved)
  assert(
    resolvedLocal !== '..' && !resolvedLocal.startsWith(`..${sep}`) && !isAbsolute(resolvedLocal),
    `receipt resolves outside repository: ${value}`
  )
  assert(!SENSITIVE_PATH.test(value), `sensitive receipt path is not bundle-safe: ${value}`)
  return absolute
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

function sourceAtHead(repo, head, path) {
  try {
    const value = git(repo, ['show', `${head}:${path}`], { encoding: 'buffer' })
    return {
      sha256: sha256(value),
      blobOid: git(repo, ['rev-parse', `${head}:${path}`]).trim(),
      bytes: value.length,
    }
  } catch {
    return { sha256: null, blobOid: null, bytes: 0 }
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
  const repository = realpathSync(repo),
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
  const source = realpathSync(repo),
    target = resolve(output),
    local = relative(source, target),
    reverse = relative(target, source)
  assert(
    local === '..' || local.startsWith(`..${sep}`),
    'review bundle must be outside the source project'
  )
  assert(
    reverse === '..' || reverse.startsWith(`..${sep}`),
    'review bundle must not contain the source project'
  )
  assert(!existsSync(target), `review bundle output already exists: ${target}`)
  mkdirSync(dirname(target), { recursive: true })
  return target
}

const verifierSource = `#!/usr/bin/env node
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const manifest = JSON.parse(readFileSync(resolve(root, 'manifest.json'), 'utf8'))
const sha = value => createHash('sha256').update(value).digest('hex')
assert.equal(manifest.version, 1)
assert.equal(manifest.kind, 'pnd-review-bundle')
const diff = readFileSync(resolve(root, manifest.diff.path))
assert.equal(sha(diff), manifest.diff.sha256)
assert.equal(diff.length, manifest.diff.bytes)
for (const receipt of manifest.receipts) {
  const data = readFileSync(resolve(root, receipt.bundlePath))
  assert.equal(sha(data), receipt.bundleSha256, receipt.bundlePath)
  assert.equal(data.length, receipt.bundleBytes, receipt.bundlePath)
}
console.log(JSON.stringify({
  status: 'passed',
  headOid: manifest.repository.headOid,
  sources: manifest.sources.length,
  receipts: manifest.receipts.length,
  diffSha256: manifest.diff.sha256,
}, null, 2))
`

function bundleReadme(manifest) {
  return `# Review bundle: ${manifest.taskId}

This directory is intentionally outside the source checkout so a reviewer can open it
through an independent Local Dev project binding.

1. Open this directory with Local Dev \`project_open\`.
2. Run \`node verify.mjs\`; it must report \`status: passed\`.
3. Review \`changes.patch\`, \`manifest.json\`, and the copied bounded receipts.
4. If Local Dev reports \`PROJECT_IN_USE\` for this bundle, the worker closeout is incomplete.

Source identity:
- branch: \`${manifest.repository.branch}\`
- base: \`${manifest.repository.baseCommit}\`
- head: \`${manifest.repository.headOid}\`

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
        {
          encoding: 'buffer',
        }
      )
    )
  assert(changes.length, 'review bundle requires at least one committed change')
  for (const change of changes) {
    for (const path of [change.from, change.path].filter(Boolean))
      assert(!SENSITIVE_PATH.test(path), `sensitive changed path is not bundle-safe: ${path}`)
  }
  const target = assertOutsideSource(repo, output)
  mkdirSync(target, { recursive: false })
  const patch = git(repo, ['diff', '--binary', `${baseCommit}..${headOid}`, '--'], {
    encoding: 'buffer',
  })
  writeFileSync(resolve(target, 'changes.patch'), patch)
  const sources = changes.map(change => ({
    ...change,
    ...sourceAtHead(repo, headOid, change.path),
  }))
  let totalReceiptBytes = 0
  const receiptEntries = []
  for (const sourcePath of [...new Set(receipts)]) {
    const absolute = safeRepoFile(repo, sourcePath),
      raw = readFileSync(absolute)
    totalReceiptBytes += raw.length
    assert(
      totalReceiptBytes <= MAX_TOTAL_RECEIPT_BYTES,
      `receipts exceed ${MAX_TOTAL_RECEIPT_BYTES} total source bytes`
    )
    const { data, redactions } = redactReceipt(raw, repo),
      bundlePath = `receipts/${sourcePath}`,
      destination = resolve(target, bundlePath)
    mkdirSync(dirname(destination), { recursive: true })
    writeFileSync(destination, data)
    receiptEntries.push({
      sourcePath,
      sourceSha256: sha256(raw),
      sourceBytes: raw.length,
      bundlePath,
      bundleSha256: sha256(data),
      bundleBytes: data.length,
      redactions,
    })
  }
  const manifest = {
    version: 1,
    kind: 'pnd-review-bundle',
    taskId,
    repository: { branch, baseCommit, headOid },
    diff: { path: 'changes.patch', sha256: sha256(patch), bytes: patch.length },
    sources,
    receipts: receiptEntries,
    reviewerPreflight: {
      localDev:
        'Open this bundle as a non-overlapping Local Dev project, run node verify.mjs, then release it before handoff.',
      verify: ['node', 'verify.mjs'],
    },
  }
  writeFileSync(resolve(target, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  writeFileSync(resolve(target, 'verify.mjs'), verifierSource)
  writeFileSync(resolve(target, 'README.md'), bundleReadme(manifest))
  return { status: 'passed', output: target, manifest }
}

export function verifyReviewBundle(bundle) {
  const root = realpathSync(bundle),
    manifest = JSON.parse(readFileSync(resolve(root, 'manifest.json'), 'utf8'))
  assert.equal(manifest.version, 1)
  assert.equal(manifest.kind, 'pnd-review-bundle')
  const patch = readFileSync(resolve(root, manifest.diff.path))
  assert.equal(sha256(patch), manifest.diff.sha256)
  assert.equal(patch.length, manifest.diff.bytes)
  for (const receipt of manifest.receipts) {
    const data = readFileSync(resolve(root, receipt.bundlePath))
    assert.equal(sha256(data), receipt.bundleSha256, receipt.bundlePath)
    assert.equal(data.length, receipt.bundleBytes, receipt.bundlePath)
  }
  return {
    status: 'passed',
    headOid: manifest.repository.headOid,
    sources: manifest.sources.length,
    receipts: manifest.receipts.length,
    diffSha256: manifest.diff.sha256,
  }
}

function parseArgs(args) {
  const options = { receipt: [] }
  for (let index = 0; index < args.length; index++) {
    const flag = args[index]
    assert(flag.startsWith('--'), `unexpected argument: ${flag}`)
    const key = flag.slice(2),
      value = args[++index]
    assert(value !== undefined && !value.startsWith('--'), `missing value for ${flag}`)
    if (key === 'receipt') options.receipt.push(value)
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
        ['receipt', 'task-id', 'base', 'output'].includes(key),
        `unknown create option: --${key}`
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
      assert(['receipt', 'bundle'].includes(key), `unknown verify option: --${key}`)
    assert(options.bundle, 'verify requires --bundle')
    console.log(JSON.stringify(verifyReviewBundle(options.bundle), null, 2))
    return
  }
  throw new Error(`unknown review-bundle command: ${command}`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main()
