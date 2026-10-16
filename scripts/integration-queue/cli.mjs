#!/usr/bin/env node
import {
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  writeFileSync,
  openSync,
  closeSync,
  unlinkSync,
  fsyncSync,
} from 'node:fs'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { decide, sha256, validateEntry } from './policy.mjs'
import { GitHubReader } from './github.mjs'
import { resourcePreflight } from './resources.mjs'

const json = path => JSON.parse(readFileSync(path, 'utf8'))
const inside = (root, path) => {
  const rel = relative(root, path)
  return !rel || (!rel.startsWith('..') && !isAbsolute(rel))
}
const ensure = (condition, message) => {
  if (!condition) throw new Error(message)
}
export function trustedFile(path, candidate, expectedHash) {
  ensure(
    isAbsolute(path ?? ''),
    'Trusted inputs need absolute paths outside the candidate checkout'
  )
  const actual = realpathSync(path)
  ensure(
    !inside(realpathSync(candidate), actual),
    'Approval/evidence cannot come from the candidate checkout'
  )
  const bytes = readFileSync(actual)
  ensure(
    /^[a-f0-9]{64}$/.test(expectedHash ?? '') && sha256(bytes) === expectedHash,
    'Trusted input SHA-256 mismatch'
  )
  return bytes
}
export function atomicWrite(path, value) {
  const temporary = `${path}.${process.pid}.tmp`
  const fd = openSync(temporary, 'wx', 0o600)
  try {
    writeFileSync(fd, `${JSON.stringify(value, null, 2)}\n`)
    fsyncSync(fd)
  } finally {
    closeSync(fd)
  }
  renameSync(temporary, path)
  const directory = openSync(dirname(path), 'r')
  try {
    fsyncSync(directory)
  } finally {
    closeSync(directory)
  }
}
export function main(argv = process.argv.slice(2)) {
  ensure(
    !argv.includes('--apply'),
    'Live mutations are disabled pending independent review and a parent-approved bounded pilot'
  )
  if (argv.includes('--help')) {
    console.log(
      'Read-only: node scripts/integration-queue/cli.mjs --allowlist /trusted/queue.json --allowlist-sha256 HASH --candidate /isolated/repo --state /trusted/state.json [--snapshot /fixture.json] [--resource-approval /trusted/resource.json --resource-approval-sha256 HASH]'
    )
    return
  }
  const allowed = [
    '--allowlist',
    '--allowlist-sha256',
    '--candidate',
    '--state',
    '--snapshot',
    '--resource-approval',
    '--resource-approval-sha256',
  ]
  const args = {}
  for (let i = 0; i < argv.length; i += 2) {
    ensure(
      allowed.includes(argv[i]) && argv[i + 1] && !args[argv[i]],
      `Unknown, repeated or incomplete argument: ${argv[i]}`
    )
    args[argv[i]] = argv[i + 1]
  }
  const candidate = realpathSync(args['--candidate'])
  const reader = new GitHubReader({ cwd: candidate })
  ensure(
    reader.git('rev-parse', '--show-toplevel') === candidate,
    'Candidate must be an isolated repository root'
  )
  const allowlistBytes = trustedFile(args['--allowlist'], candidate, args['--allowlist-sha256'])
  const allowlist = JSON.parse(allowlistBytes)
  ensure(
    allowlist.version === 1 && Array.isArray(allowlist.entries) && allowlist.entries.length > 0,
    'An explicit nonempty reviewed allowlist is required'
  )
  ensure(
    new Set(allowlist.entries.map(e => e.pr)).size === allowlist.entries.length,
    'Duplicate PR in allowlist'
  )
  for (const entry of allowlist.entries) {
    validateEntry(entry)
    trustedFile(
      resolve(dirname(args['--allowlist']), entry.review.file),
      candidate,
      entry.review.sha256
    )
  }
  let approval = null,
    installReceipt = null
  if (args['--resource-approval']) {
    approval = JSON.parse(
      trustedFile(args['--resource-approval'], candidate, args['--resource-approval-sha256'])
    )
    installReceipt = JSON.parse(
      trustedFile(
        resolve(dirname(args['--resource-approval']), approval.ciInstallReceipt.file),
        candidate,
        approval.ciInstallReceipt.sha256
      )
    )
  }
  const resource = resourcePreflight(
    candidate,
    (...gitArgs) => reader.git(...gitArgs),
    approval,
    installReceipt
  )
  console.error(JSON.stringify({ resourcePreflight: resource }))
  const statePath = args['--state']
  ensure(
    isAbsolute(statePath ?? ''),
    'Checkpoint needs an absolute path outside the candidate checkout'
  )
  mkdirSync(dirname(statePath), { recursive: true })
  ensure(
    !inside(candidate, realpathSync(dirname(statePath))),
    'Checkpoint cannot be stored in the candidate checkout'
  )
  const lock = `${statePath}.lock`
  const fd = openSync(lock, 'wx', 0o600)
  try {
    const authorization = sha256(allowlistBytes)
    let saved = { version: 1, authorization, entries: {} }
    try {
      saved = json(statePath)
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
    ensure(
      saved.version === 1 && saved.authorization === authorization,
      'Queue allowlist changed; reconcile existing checkpoint first'
    )
    const fixture = args['--snapshot'] ? json(args['--snapshot']) : null
    const outputs = []
    for (const entry of allowlist.entries) {
      const observation = fixture
        ? fixture[String(entry.pr)]
        : reader.inspect(entry, dirname(args['--allowlist']))
      if (observation) observation.resource = resource
      const decision = decide(entry, observation, saved.entries[entry.pr])
      saved.entries[entry.pr] = decision.checkpoint
      outputs.push({
        pr: entry.pr,
        mode: fixture ? 'fixture-dry-run' : 'github-read-only',
        ...decision,
        observation,
      })
      if (decision.status !== 'done') break
    }
    atomicWrite(statePath, saved)
    console.log(JSON.stringify(outputs, null, 2))
    if (outputs.some(o => o.status === 'stop')) process.exitCode = 2
  } finally {
    closeSync(fd)
    unlinkSync(lock)
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    console.error(`integration queue stopped: ${error.message}`)
    process.exitCode = 2
  }
}
