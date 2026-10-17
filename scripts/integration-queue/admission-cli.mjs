#!/usr/bin/env node
// Explicit bounded admission-only CLI. No scheduling, merge, refresh or rerun.
import assert from 'node:assert/strict'
import { realpathSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { GitHubReader } from './github.mjs'
import { trustedFile } from './cli.mjs'
import { digest, validateEntry } from './policy.mjs'
import { registerAdmission, admissionTick, withAdmissionJournal, validateRegistration } from './admission.mjs'
import { observeAdmission } from './admission-observer.mjs'

export function parseAdmissionArguments(argv) {
  const result = {}, booleans = new Set(['--apply', '--register'])
  const fields = new Set(['--entry', '--entry-sha256', '--grant', '--grant-sha256', '--candidate', '--journal', '--previous'])
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i]
    assert(!Object.hasOwn(result, key), 'Duplicate argument')
    assert(booleans.has(key) || fields.has(key), 'Unknown admission argument')
    if (booleans.has(key)) result[key] = true
    else { assert(argv[i + 1] && !argv[i + 1].startsWith('--'), 'Missing argument'); result[key] = argv[++i] }
  }
  for (const key of fields) if (key !== '--previous') assert(result[key], `Required ${key}`)
  assert(!result['--register'] || !result['--apply'], 'Register and apply are separate bounded calls')
  assert(result['--register'] === Boolean(result['--previous']) || (!result['--register'] && !result['--previous']), 'Registration requires explicit predecessor digest or none')
  return result
}

export async function admissionMain(argv = process.argv.slice(2), { Reader = GitHubReader, clock = Date.now, transport = command => execFileSync('gh', command, { encoding: 'utf8', timeout: 30_000, maxBuffer: 1024 * 1024, env: { ...process.env, GH_PROMPT_DISABLED: '1', GH_PAGER: 'cat' } }) } = {}) {
  const args = parseAdmissionArguments(argv), candidate = realpathSync(args['--candidate'])
  const entry = JSON.parse(trustedFile(args['--entry'], candidate, args['--entry-sha256']))
  const grant = JSON.parse(trustedFile(args['--grant'], candidate, args['--grant-sha256']))
  validateEntry(entry); validateRegistration(grant, Math.min(clock(), grant.expiresAt - 1))
  assert.equal(grant.entryDigest, digest(entry)); assert.equal(grant.owner, entry.approvedBy)
  assert.equal(grant.pr, entry.pr); assert.equal(grant.tuple.head, entry.sourceHead)
  assert.equal(grant.tuple.tree, entry.sourceTree); assert.equal(grant.tuple.base, entry.reviewBase)
  assert.deepEqual(grant.workflowHashes, entry.workflowHashes)
  assert.equal(grant.review.reviewer, entry.review.reviewer)
  assert.equal(grant.review.receiptSha256, entry.review.sha256)
  assert.equal(entry.allowMechanicalRefresh, false, 'Admission has no refresh authority')
  assert(!entry.workflowTransition, 'Admission does not activate workflow changes')
  trustedFile(resolve(dirname(args['--entry']), entry.review.file), candidate, entry.review.sha256)
  assert.equal(args['--journal'], grant.journalPath)
  // Existing trustedFile enforces that review inputs and the journal are outside
  // candidate-controlled source. Journal itself is independently canonical/locked.
  const rel = resolve(args['--journal'])
  assert(rel !== candidate && !rel.startsWith(`${candidate}/`), 'Journal cannot be inside candidate')
  const driverRoot = fileURLToPath(new URL('../../', import.meta.url))
  const driver = new Reader({ cwd: driverRoot })
  assert.equal(driver.git('rev-parse', 'HEAD'), grant.driverHead, 'Reviewed driver head differs')
  assert.equal(driver.git('status', '--porcelain', '--untracked-files=normal'), '', 'Driver must be clean')
  const reader = new Reader({ cwd: candidate })
  return withAdmissionJournal(grant.journalPath, async (ledger, persist) => {
    if (args['--register']) {
      const previous = args['--previous'] === 'none' ? null : args['--previous']
      const next = registerAdmission(ledger, grant, previous, clock())
      persist(next); return { status: 'registered', registrationDigest: next.records.at(-1).registrationDigest }
    }
    assert(ledger && ledger.records.at(-1).registrationDigest === digest(grant), 'Grant not registered in canonical journal')
    const observe = () => observeAdmission(reader, entry, grant, args['--entry'])
    let observed
    try { observed = observe() } catch (error) {
      const record = ledger.records.at(-1)
      record.phase = 'stopped'; record.reason = 'Admission observation failed; inspect without retrying effects'
      persist(ledger); throw error
    }
    const result = await admissionTick(ledger, observed, { clock, apply: !!args['--apply'], persist, observe, transport })
    return { status: result.status, reason: result.reason, action: result.action,
      mergeAuthority: false, protectionConfiguration: 'unverified-admission-only' }
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try { const result = await admissionMain(); console.log(JSON.stringify(result)); if (result.status === 'stop' || result.status === 'uncertain') process.exitCode = 2 }
  catch (error) { console.error(`admission stopped: ${String(error.message).replace(/[\r\n]/g, ' ').slice(0, 500)}`); process.exitCode = 2 }
}
