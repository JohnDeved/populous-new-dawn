import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = fileURLToPath(new URL('..', import.meta.url))
const exportsPath = 'decomp/exports.json'
const ledgerPath = 'decomp/function-progress.json'
const reportPath = 'FUNCTION-PROGRESS.md'
const sha = /^[a-f0-9]{64}$/
const address = /^[a-f0-9]{8}$/
const classified = ['implemented', 'partial', 'missing']
const categories = [...classified, 'unassessed']

const fail = message => { throw new Error(message) }
const digest = text => createHash('sha256').update(text).digest('hex')
const identity = counts => categories.reduce((sum, key) => sum + counts[key], 0)
const safePath = value => typeof value === 'string' && /^(?:[\w.-]+\/)*[\w.-]+$/.test(value)
  && value.split('/').every(part => part !== '..' && part !== '.')
const singleLine = value => typeof value === 'string' && value.trim() === value && value.length
  && !/\r|\n|\||<|>/.test(value)
const sourcePath = value => safePath(value) && value.startsWith('app/')

export function makeSnapshot(exportsText, ledgerText, { revision = null, pathExists = null } = {}) {
  const inventory = JSON.parse(exportsText)
  const ledger = JSON.parse(ledgerText)
  if (typeof inventory.executableSha256 !== 'string' || !sha.test(inventory.executableSha256) || !inventory.files
    || Array.isArray(inventory.files) || typeof inventory.files !== 'object') fail('Invalid export inventory')
  if (ledger.schema !== 1 || ledger.executableSha256 !== inventory.executableSha256 || !Array.isArray(ledger.entries)) {
    fail('Ledger schema or original executable identity does not match inventory')
  }
  const knownAddresses = Object.entries(inventory.files).map(([name, hash]) => {
    if (!/^[a-f0-9]{8}\.c$/.test(name) || typeof hash !== 'string' || !sha.test(hash)) fail(`Invalid inventory file: ${name}`)
    return name.slice(0, -2)
  }).sort()
  if (!knownAddresses.length) fail('Empty export inventory')
  const known = new Set(knownAddresses)
  const counts = Object.fromEntries(categories.map(value => [value, 0]))
  const entries = Object.create(null)
  for (const row of ledger.entries) {
    if (!row || typeof row.address !== 'string' || !address.test(row.address) || !known.has(row.address) || Object.hasOwn(entries, row.address)) {
      fail(`Unknown or duplicate ledger address: ${row?.address}`)
    }
    if (!classified.includes(row.status) || !singleLine(row.scope) || !singleLine(row.limits)
      || !Array.isArray(row.sources) || !row.sources.every(sourcePath)
      || (row.status !== 'missing' && !row.sources.length)
      || !Array.isArray(row.evidence) || !row.evidence.length
      || !row.evidence.every(value => safePath(value) && /^(tests|decomp|engineering|scripts)\//.test(value))) {
      fail(`Invalid status, bounded scope, limits or evidence for ${row.address}`)
    }
    if (pathExists) for (const file of [...row.sources, ...row.evidence]) {
      if (!pathExists(file)) fail(`Missing ledger reference for ${row.address}: ${file}`)
    }
    entries[row.address] = row
    counts[row.status]++
  }
  counts.unassessed = known.size - ledger.entries.length
  if (identity(counts) !== known.size) fail('Inventory partition mismatch')
  return { schema: 1, revision, executableSha256: inventory.executableSha256,
    inventorySha256: digest(exportsText), ledgerSha256: digest(ledgerText),
    knownOriginalFunctions: known.size, fullOriginalFunctionCount: null, counts,
    knownAddresses, entries: Object.values(entries).sort((a, b) => a.address.localeCompare(b.address)) }
}

export function compareSnapshots(before, after) {
  if (before.executableSha256 !== after.executableSha256) fail('Cannot compare different original executables')
  const was = new Set(before.knownAddresses)
  const now = new Set(after.knownAddresses)
  const oldStatuses = new Map(before.entries.map(row => [row.address, row.status]))
  const newStatuses = new Map(after.entries.map(row => [row.address, row.status]))
  const inventory = { before: was.size, after: now.size, added: after.knownAddresses.filter(entry => !was.has(entry)),
    removed: before.knownAddresses.filter(entry => !now.has(entry)) }
  const transitions = []
  for (const entry of after.knownAddresses) if (was.has(entry)) {
    const from = oldStatuses.get(entry) ?? 'unassessed'
    const to = newStatuses.get(entry) ?? 'unassessed'
    if (from !== to) transitions.push({ address: entry, from, to })
  }
  return { beforeRevision: before.revision, afterRevision: after.revision,
    executableSha256: after.executableSha256, beforeInventorySha256: before.inventorySha256,
    afterInventorySha256: after.inventorySha256, beforeLedgerSha256: before.ledgerSha256,
    afterLedgerSha256: after.ledgerSha256, inventory,
    counts: Object.fromEntries(categories.map(status => [status, {
      before: before.counts[status], after: after.counts[status], delta: after.counts[status] - before.counts[status],
    }])), transitions }
}

function render(snapshot) {
  const rows = categories.map(key => `| ${key} | ${snapshot.counts[key].toLocaleString('en-US')} |`).join('\n')
  const links = files => files.map(path => `[\`${path}\`](${path})`).join(', ')
  const details = snapshot.entries.map(row =>
    `| [\`${row.address}\`](decomp/generated/${row.address}.c) | ${row.status} | ${row.scope} | ${links(row.sources) || 'None in scope'} | ${links(row.evidence)} | ${row.limits} |`
  ).join('\n')
  return `# Original function progress

**${snapshot.knownOriginalFunctions.toLocaleString('en-US')} known original functions** in the checked-in export inventory. The total number of functions in the executable is not established.

| Status | Known functions |
| --- | ---: |
${rows}

Each row below is an explicit assessment of one original entry address. Unassessed functions are counted but not listed here.

| Original address | Status | Scope | Remake source | Evidence | Limits |
| --- | --- | --- | --- | --- | --- |
${details}

## What the numbers mean

- **Implemented**: a live remake equivalent covers the stated original routine scope and has linked evidence.
- **Partial**: a live equivalent covers part of the scope; the ledger names a remaining gap.
- **Missing**: research confirms the stated original routine scope has no live equivalent.
- **Unassessed**: an export exists but no explicit assessment is recorded. This is not the same as missing.

Addresses come from [the export manifest](decomp/exports.json), not a complete binary scan. An export, source comment, or reference alone earns no implementation credit. Function counts are separate from [gameplay parity](PARITY.md); they do not weight difficulty, player impact, or work remaining. Some remake routines replace or combine multiple original functions.

Original executable SHA-256: \`${snapshot.executableSha256}\`

## Update and compare

Edit [the evidence ledger](decomp/function-progress.json) as assessments are reviewed; link the current remake source and evidence and describe the limits. From the repository root, regenerate the report and check it:

\`\`\`sh
node scripts/function-progress.mjs > FUNCTION-PROGRESS.md
node scripts/function-progress.mjs --check
\`\`\`

For a machine-readable count at a Git revision, run \`node scripts/function-progress.mjs --json --revision HEAD\`. After the tracker lands, compare two Git revisions that contain it with \`node scripts/function-progress.mjs --compare OLDER NEWER\`. The comparison records both exact commit IDs, counts, common-address transitions, and inventory entries added/removed. Status changes can come from auditing older code, not just from new implementation. Additions and removals to the inventory are tracked separately. The first snapshot sets a baseline; it cannot establish a rate.
`
}

function trackedReader(ref) {
  if (!ref || ref.startsWith('-')) fail('Invalid Git revision')
  const git = args => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  const revision = git(['rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`]).trim()
  const read = path => git(['show', `${revision}:${path}`])
  return { revision, read }
}

function snapshot(ref, verifyPaths = false) {
  const reader = ref == null ? { revision: null, read: path => readFileSync(join(repo, path), 'utf8') } : trackedReader(ref)
  return makeSnapshot(reader.read(exportsPath), reader.read(ledgerPath), { revision: reader.revision, pathExists: verifyPaths
    ? file => { try { reader.read(file); return true } catch { return false } } : null })
}

function main(args) {
  if (args[0] === '--compare' && args.length === 3) {
    process.stdout.write(JSON.stringify(compareSnapshots(snapshot(args[1]), snapshot(args[2])), null, 2) + '\n')
    return
  }
  if (args.length === 1 && args[0] === '--check') {
    if (render(snapshot(null, true)) !== readFileSync(join(repo, reportPath), 'utf8')) {
      fail(`Stale ${reportPath}: regenerate with node scripts/function-progress.mjs > ${reportPath}`)
    }
    return
  }
  if (args[0] === '--json' && (args.length === 1 || args.length === 3 && args[1] === '--revision')) {
    process.stdout.write(JSON.stringify(snapshot(args[2]), null, 2) + '\n')
    return
  }
  if (args.length) fail('Usage: function-progress.mjs [--check | --json [--revision REF] | --compare OLD NEW]')
  process.stdout.write(render(snapshot()))
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try { main(process.argv.slice(2)) } catch (error) {
    console.error(`Function progress: ${error.message}`)
    process.exitCode = 1
  }
}
