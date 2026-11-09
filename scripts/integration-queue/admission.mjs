// Source-only admission transaction core. No CLI, poller, refresh or merge path.
// Its caller must supply trusted ordinary-PR observations, never raw PR assertions.
import assert from 'node:assert/strict'
import { closeSync, existsSync, lstatSync, openSync, readFileSync, realpathSync, unlinkSync } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'
import { REPO, digest } from './policy.mjs'
import { mutationArguments } from './writer.mjs'
import { atomicWrite } from './cli.mjs'

const same = (a, b) => digest(a) === digest(b)
const oid = value => /^[a-f0-9]{40}$/.test(value ?? '')
const hash = value => /^[a-f0-9]{64}$/.test(value ?? '')
const terminal = state => ['complete', 'stopped'].includes(state.phase) && !state.pending
export const FULL_WORKFLOW = '.github/workflows/ready-pr-check.yml'

export function validateRegistration(grant, now) {
  assert.equal(grant?.version, 1); assert.equal(grant.repo, REPO)
  assert(Number.isSafeInteger(grant.pr) && grant.pr > 0)
  assert(grant.owner?.trim() && isAbsolute(grant.journalPath ?? ''))
  assert.equal(grant.authority, 'one-draft-ready-cycle')
  assert.deepEqual(Object.keys(grant.tuple).sort(), ['base', 'head', 'merge', 'mergeTree', 'tree'])
  assert(Object.values(grant.tuple).every(oid))
  assert(hash(grant.workflowHashes?.[FULL_WORKFLOW]))
  assert.equal(grant.review?.decision, 'ACCEPT')
  assert(grant.review.reviewer?.trim() && grant.review.reviewer !== grant.owner)
  assert.equal(grant.review.tupleDigest, digest(grant.tuple))
  assert(hash(grant.review.receiptSha256))
  assert(Number.isFinite(grant.createdAt) && Number.isFinite(grant.expiresAt))
  assert(grant.createdAt <= now && now < grant.expiresAt && grant.expiresAt - grant.createdAt <= 3_600_000)
}

// Only trusted parent registration can call this. Never infer a new grant from a
// synchronize event. History prevents re-registration from replenishing a budget.
export function registerAdmission(ledger, grant, expectedPrevious, now = Date.now()) {
  validateRegistration(grant, now)
  const next = structuredClone(ledger ?? { version: 1, repo: REPO, pr: grant.pr, owner: grant.owner, journalPath: grant.journalPath, records: [] })
  assert.equal(next.version, 1); assert.equal(next.repo, REPO)
  for (const key of ['pr', 'owner', 'journalPath']) assert.equal(next[key], grant[key])
  const prior = next.records.at(-1)
  assert.equal(expectedPrevious, prior?.registrationDigest ?? null, 'Stale registration predecessor')
  assert(!prior || terminal(prior), 'Prior admission must settle before supersession')
  assert(!next.records.some(record => same(record.grant.tuple, grant.tuple)), 'Candidate admission budget already registered')
  next.records.push({ registrationDigest: digest(grant), grant: structuredClone(grant), phase: 'observing', pending: null,
    spent: { draft: false, ready: false }, quiet: null, readySince: null, evidence: [] })
  return next
}

function observation(record, observed, now) {
  assert(observed?.complete === true && observed.consistent === true, 'Incomplete/changing observation')
  assert(Number.isFinite(observed.observedAt) && observed.observedAt <= now && now - observed.observedAt <= 60_000, 'Stale observation')
  assert(same(observed.tuple, record.grant.tuple), 'Candidate tuple drift')
  assert(same(observed.workflowHashes, record.grant.workflowHashes), 'Workflow drift')
  assert.equal(observed.pr, record.grant.pr); assert.equal(observed.repo, REPO)
  assert.equal(typeof observed.draft, 'boolean')
  assert.equal(typeof observed.activeAttempts, 'boolean')
  assert(['clear', 'running', 'failed', 'unknown'].includes(observed.otherValidation), 'Other validation state required')
  assert(hash(observed.inventoryDigest), 'Complete run inventory digest required')
  assert(['missing', 'running', 'passed', 'failed', 'unknown'].includes(observed.full?.state))
  if (observed.full.state !== 'missing') {
    assert(same(observed.full.tuple, record.grant.tuple), 'Full evidence tuple drift')
    assert(observed.full.sourceBound === true, 'Unverified Full evidence')
  }
}

// One tick, one effect maximum. Persist is required even for uncertainty; the
// production caller uses withAdmissionJournal below. A returned submitted effect
// is not confirmed until a later observation, and is never automatically replayed.
export async function admissionTick(ledger, observed, { clock = Date.now, apply = false, persist, transport, observe } = {}) {
  const now = clock()
  const next = structuredClone(ledger), record = next.records.at(-1)
  assert(record && record.registrationDigest === digest(record.grant), 'Registration corruption')
  assert.equal(next.owner, record.grant.owner); assert.equal(next.journalPath, record.grant.journalPath)
  assert.equal(typeof persist, 'function', 'Durable journal required')
  const finish = (status, reason, action) => { persist(next); return { status, reason, ...(action ? { action } : {}), ledger: next } }
  try {
    observation(record, observed, now)
    if (record.phase === 'stopped') return finish('stop', record.reason)
    if (record.pending) {
      const expectedDraft = record.pending.kind === 'draft'
      if (observed.draft !== expectedDraft) return finish('stop', 'Effect outcome uncertain; reconcile without replay')
      record.evidence.push({ kind: record.pending.kind, confirmedAt: now, observation: digest(observed) })
      if (!expectedDraft) record.readySince = now
      record.pending = null; record.quiet = null; record.phase = 'observing'
    }
    if (record.phase === 'complete') return finish('complete', 'Previously recorded exact Full success, not current merge permission')
    assert(!['failed', 'unknown'].includes(observed.otherValidation), 'Other required validation failed or is unverified')
    if (observed.full.state === 'failed' || observed.full.state === 'unknown') throw new Error('Failed or ambiguous Full validation')
    if (observed.full.state === 'passed') {
      assert.equal(observed.full.required, true, 'Full check not selected as required')
      assert(observed.full.runId && observed.full.attempt && observed.full.checkId, 'Missing Full provenance')
      record.phase = 'complete'; record.evidence.push({ full: structuredClone(observed.full), observedAt: now })
      return finish('complete', 'Exact required Full success observed; merge eligibility unverified')
    }
    if (observed.activeAttempts || observed.full.state === 'running' || observed.otherValidation === 'running') {
      record.quiet = null; return finish('wait', 'Drain all related attempts')
    }
    if (record.readySince !== null) {
      assert(now >= record.readySince, 'Clock moved backwards')
      if (now - record.readySince < 300_000) return finish('wait', 'Waiting for one submitted ready admission')
      throw new Error('No matching Full admission after five minutes; do not toggle again')
    }
    validateRegistration(record.grant, now)
    const fingerprint = digest({ tuple: observed.tuple, draft: observed.draft, inventory: observed.inventoryDigest })
    if (record.quiet?.fingerprint !== fingerprint) record.quiet = { fingerprint, since: now }
    assert(now >= record.quiet.since, 'Clock moved backwards')
    if (now - record.quiet.since < 60_000) return finish('wait', 'Observe unchanged candidate and inventory for 60 seconds')
    const kind = observed.draft ? 'ready' : 'draft'
    assert(!record.spent[kind], 'Effect budget consumed; no replay')
    assert(kind !== 'draft' || !record.spent.ready, 'Ready cycle already used')
    const action = { kind, head: record.grant.tuple.head, base: record.grant.tuple.base }
    if (!apply) return finish('propose', 'Bounded admission effect only', action)
    assert.equal(typeof transport, 'function', 'Explicit trusted transport required')
    assert.equal(typeof observe, 'function', 'Fresh trusted observation required before effect')
    const fresh = await observe(), submissionTime = clock()
    observation(record, fresh, submissionTime)
    validateRegistration(record.grant, submissionTime)
    assert.equal(fresh.draft, observed.draft, 'Draft state changed before effect')
    assert.equal(fresh.inventoryDigest, observed.inventoryDigest, 'Run inventory changed before effect')
    assert.equal(fresh.activeAttempts, false, 'New active attempt before effect')
    assert.equal(fresh.otherValidation, 'clear', 'Other validation changed before effect')
    assert.equal(fresh.full.state, 'missing', 'Full admission changed before effect')
    record.spent[kind] = true; record.pending = { ...action, intendedAt: submissionTime, observation: digest(fresh) }; record.phase = 'pending'
    persist(next) // MUST finish before transport. A persistence error prevents effect.
    try { await transport(mutationArguments(record.grant.pr, action)) }
    catch { return finish('uncertain', 'Submission uncertain; reconcile remotely without replay', action) }
    return finish('submitted', 'Submission returned, not remotely confirmed', action)
  } catch (error) {
    // Pending intent survives every error. Never authorize another mutation to
    // repair drift or uncertainty, even after expiry or parent re-registration.
    record.phase = 'stopped'; record.reason = error.message
    return finish('stop', error.message)
  }
}

// Canonical shared journal, not a second retry lane. Existing merge journal is
// deliberately untouched. Caller supplies a parent-pinned path outside candidate.
export async function withAdmissionJournal(path, operation) {
  assert(isAbsolute(path)); assert.equal(resolve(path), path)
  assert.equal(realpathSync(dirname(path)), dirname(path), 'Journal parent must be canonical')
  if (existsSync(path)) assert(lstatSync(path).isFile() && !lstatSync(path).isSymbolicLink())
  const lock = `${path}.lock`, fd = openSync(lock, 'wx', 0o600)
  try {
    const ledger = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null
    if (ledger) assert.equal(ledger.journalPath, path)
    return await operation(ledger, value => { assert.equal(value.journalPath, path); atomicWrite(path, value) })
  } finally { closeSync(fd); unlinkSync(lock) }
}
