// Optional status-neutral audit reader, designed to sit beside function-progress.mjs.
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { makeSnapshot } from './function-progress.mjs'

const reasonCode = /^[a-z][a-z0-9_-]{1,79}$/
const fullHash = /^[a-f0-9]{40}$/
const digest = /^[a-f0-9]{64}$/
const address = /^[a-f0-9]{8}$/
const reserved = new Set(['implemented', 'partial', 'missing', 'unassessed', 'unknown', 'unreviewed',
  'reviewed', 'not-reviewed', 'classified', 'constructor', 'prototype', '__proto__'])
const check = (value, message) => { if (!value) throw new Error(message) }
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

function validate(audit) {
  check(audit?.schema === 1 && audit.method === 'bounded-source-review-v1', 'Invalid audit version')
  check(fullHash.test(audit.reviewedRevision ?? '') && fullHash.test(audit.appTree ?? ''), 'Invalid audited revision or tree')
  check(digest.test(audit.inventorySha256 ?? ''), 'Invalid audited inventory digest')
  check(audit.held && !Array.isArray(audit.held) && typeof audit.held === 'object', 'Invalid audit groups')
  const seen = new Set()
  for (const [reason, addresses] of Object.entries(audit.held)) {
    check(reasonCode.test(reason) && !reserved.has(reason) && Array.isArray(addresses) && addresses.length > 0, 'Invalid or reserved hold reason')
    let prev = ''
    for (const a of addresses) {
      check(typeof a === 'string' && address.test(a) && a > prev && !seen.has(a), 'Duplicate, unordered or invalid hold address')
      prev = a
      seen.add(a)
    }
  }
  return seen
}

// Disable user-local replacement objects; all reads are of pinned objects, not worktree files.
const gitAt = repository => (...args) => execFileSync('git', ['--no-replace-objects', '-C', resolve(repository), ...args],
  {stdio:['ignore','pipe','pipe'], maxBuffer: 32 * 1024 * 1024})
const fullCommitId = id => check(typeof id === 'string' && fullHash.test(id), 'Read revision must be an immutable full Git commit ID')

export function readReviewCoverage(repository, readRevision, audit) {
  const seen = validate(audit)
  fullCommitId(readRevision)
  const git = gitAt(repository)
  const revision = raw => {
    const value = git('rev-parse', '--verify', raw + '^{commit}').toString('utf8').trim()
    check(value === raw, 'Pinned object is not the specified commit')
    return value
  }
  const tree = commit => {
    const value = git('rev-parse', '--verify', commit + ':app').toString('utf8').trim()
    check(fullHash.test(value) && git('cat-file', '-t', value).toString('utf8').trim() === 'tree', 'Pinned app object is not a tree')
    return value
  }
  const reviewed = revision(audit.reviewedRevision)
  const current = revision(readRevision)
  const reviewTree = tree(reviewed)
  const currentTree = tree(current)
  check(reviewTree === audit.appTree, 'Audit app tree does not match its reviewed commit')
  const exportPath = ':decomp/exports.json'
  const originalInventory = git('show', reviewed + exportPath)
  const inventory = git('show', current + exportPath)
  check(sha256(originalInventory) === audit.inventorySha256, 'Audit inventory does not match its reviewed commit')
  const original = JSON.parse(originalInventory.toString('utf8'))
  const known = new Set(makeSnapshot(originalInventory.toString('utf8'),
    JSON.stringify({schema:1, executableSha256:original.executableSha256, entries:[]})).knownAddresses)
  check([...seen].every(a => known.has(a)), 'Unknown hold address in reviewed inventory')
  let historicalReason = null
  try { git('merge-base', '--is-ancestor', reviewed, current) } catch (error) {
    if (error.status !== 1) throw error
    historicalReason = 'unrelated-revision'
  }
  if (!historicalReason && currentTree !== reviewTree) historicalReason = 'app-tree-changed'
  if (!historicalReason && sha256(inventory) !== audit.inventorySha256) historicalReason = 'inventory-changed'
  const identity = { reviewedRevision: reviewed, readRevision: current }
  if (historicalReason) return { ...identity, state:'historical', reason: historicalReason }

  const status = makeSnapshot(inventory.toString('utf8'), git('show', current + ':decomp/function-progress.json').toString('utf8'),
    {revision:current})
  const classified = new Set(status.entries.map(x => x.address))
  const held = Object.entries(audit.held).flatMap(([reason, addresses]) =>
    addresses.filter(a => !classified.has(a)).map(address => ({address, reason})))
  const notRecordedAsReviewed = status.knownAddresses.filter(a => !classified.has(a) && !seen.has(a))
  check(held.length + notRecordedAsReviewed.length === status.counts.unassessed, 'Incomplete unassessed partition')
  return { ...identity, state:'current', heldAfterSourceReview: held.length,
    notRecordedAsReviewed: notRecordedAsReviewed.length, held, notRecordedAddresses: notRecordedAsReviewed }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    const args = process.argv.slice(2)
    check(args.length === 1, 'Usage: node scripts/review-coverage.mjs FULL_COMMIT_ID (from the repository root)')
    const [revision] = args
    fullCommitId(revision)
    const repository = process.cwd()
    const git = gitAt(repository)
    const audit = JSON.parse(git('show', revision + ':decomp/function-review-coverage.json').toString('utf8'))
    process.stdout.write(JSON.stringify(readReviewCoverage(repository, revision, audit), null, 2) + '\n')
  } catch (error) {
    console.error(`Function review coverage: ${error.message}`)
    process.exitCode = 1
  }
}
