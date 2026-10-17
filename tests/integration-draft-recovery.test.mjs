import assert from 'node:assert/strict'
import test from 'node:test'
import { digest, REPO } from '../scripts/integration-queue/policy.mjs'
import {
  prepareDraftRecovery,
  dispatchDraftRecovery,
  recordDraftRecoveryReceipt,
  observeDraftRecovery,
  prepareOriginalReady,
  recordOriginalReadyReceipt,
  observeOriginalReady,
  recoveryDescriptor,
} from '../scripts/integration-queue/draft-recovery.mjs'

function fixture() {
  const tuple = Object.fromEntries(
    ['head', 'tree', 'base', 'merge', 'mergeTree'].map((k, i) => [k, String(i + 1).repeat(40)])
  )
  const originalGrant = {
    tuple,
    workflowHashes: {
      '.github/workflows/ready-pr-check.yml': 'a'.repeat(64),
      '.github/workflows/tutorial-browser.yml': 'b'.repeat(64),
    },
    journalPath: '/tmp/canonical.json',
  }
  const pending = { kind: 'draft', head: tuple.head, base: tuple.base, intendedAt: 1000 }
  const original = {
    version: 1,
    repo: REPO,
    pr: 531,
    owner: 'parent',
    journalPath: originalGrant.journalPath,
    records: [
      {
        grant: originalGrant,
        registrationDigest: digest(originalGrant),
        pending,
        spent: { draft: true, ready: false },
      },
    ],
  }
  const hash = 'a'.repeat(64)
  const grant = {
    version: 1,
    repo: REPO,
    pr: 531,
    owner: 'parent',
    authority: 'one-draft-convergence-only',
    registrationDigest: digest(originalGrant),
    originalJournalSha256: hash,
    originalIntentDigest: digest(pending),
    tuple,
    workflowHashes: originalGrant.workflowHashes,
    actorId: 42,
    denialReceiptSha256: hash,
    authorizationReceiptSha256: hash,
    terminationReceiptSha256: hash,
    terminatedAt: 2000,
    createdAt: 2000,
    expiresAt: 602000,
    originalTransportOutcome: 'unknown',
    readyAuthority: false,
  }
  const collection = items => ({
    items,
    pages: [{ number: 1, count: items.length, sha256: digest(items) }],
  })
  const observation = (at, draft = false, events = []) => ({
    repo: REPO,
    pr: 531,
    tuple,
    startedAt: at - 100,
    observedAt: at,
    complete: true,
    consistent: true,
    state: 'open',
    mergeable: true,
    draft,
    admission: {
      complete: true,
      consistent: true,
      tuple,
      draft,
      observedAt: at,
      activeAttempts: false,
      otherValidation: 'clear',
      full: { state: 'missing' },
    },
    timeline: collection(events),
    runs: collection([{ id: 'run1', head: tuple.head, status: 'completed' }]),
  })
  const pair = [observation(3000), observation(64000)]
  return { original, grant, hash, collection, observation, pair }
}
const clone = value => structuredClone(value)
function prepared(f) {
  return prepareDraftRecovery(f.original, f.hash, null, f.grant, f.pair, 64000).ledger
}
function receipt(ledger, now, ready = false, outcome = 'returned') {
  const descriptor = recoveryDescriptor(ledger.records.at(-1), ready)
  return {
    ...descriptor,
    descriptorDigest: digest(descriptor),
    toolCallId: null,
    rawReceiptSha256: 'b'.repeat(64),
    startedAt: now,
    finishedAt: now,
    outcome,
  }
}

test('draft recovery preserves original unknown/spent history and allows one separately spent descriptor only', () => {
  const f = fixture(),
    before = JSON.stringify(f.original),
    ledger = prepared(f)
  assert.equal(ledger.records[0].spent, true)
  assert.equal(ledger.records[0].originalTransportOutcome, 'unknown')
  assert.throws(
    () => prepareDraftRecovery(f.original, f.hash, ledger, f.grant, f.pair, 64000),
    /consumed/
  )
  const dispatched = dispatchDraftRecovery(
    ledger,
    digest(f.grant),
    f.observation(65000),
    f.original,
    65000
  )
  assert.throws(() =>
    dispatchDraftRecovery(dispatched, digest(f.grant), f.observation(65000), f.original, 65000)
  )
  const submitted = recordDraftRecoveryReceipt(
    dispatched,
    digest(f.grant),
    { ...receipt(dispatched, 66000), stage: 'observed', at: 0 },
    66000
  )
  assert.equal(submitted.records[0].receipts.at(-1).stage, 'connector-receipt')
  assert.equal(submitted.records[0].receipts.at(-1).at, 66000)
  assert.equal(submitted.records[0].phase, 'awaiting-observation')
  const event = { id: 'draft1', kind: 'converted_to_draft', at: 66000, actorId: 42 }
  const observed = observeDraftRecovery(
    submitted,
    digest(f.grant),
    f.observation(67000, true, [event]),
    f.original,
    67000
  )
  assert.equal(observed.records[0].phase, 'observed')
  assert.equal(observed.records[0].readyAuthority, false)
  assert.equal(JSON.stringify(f.original), before)
})

test('no-state-change observation cannot relabel original unknown as success or replenish allowance', () => {
  const f = fixture(),
    ledger = prepared(f)
  assert.throws(
    () => observeDraftRecovery(ledger, digest(f.grant), f.observation(65000), f.original, 65000),
    /not observed/
  )
  assert.throws(
    () =>
      observeDraftRecovery(ledger, digest(f.grant), f.observation(65000, true), f.original, 65000),
    /attributable/
  )
  const event = { id: 'draft1', kind: 'converted_to_draft', at: 63000, actorId: 43 }
  assert.throws(
    () =>
      observeDraftRecovery(
        ledger,
        digest(f.grant),
        f.observation(65000, true, [event]),
        f.original,
        65000
      ),
    /actor/
  )
})

test('preparation rejects drift, ready intents, bad histories, pagination, future events, activity and expiry', () => {
  const f = fixture()
  for (const mutate of [
    x => {
      x.grant.expiresAt = 64000
    },
    x => {
      x.original.records[0].pending.kind = 'ready'
    },
    x => {
      x.pair[1].tuple = { ...x.grant.tuple, head: 'f'.repeat(40) }
    },
    x => {
      x.pair[1].runs.items[0].status = 'in_progress'
    },
    x => {
      x.pair[1].timeline.pages[0].count = 100
    },
    x => {
      x.pair[1].timeline = x.collection([
        { id: 'future', at: 65000, kind: 'commented', actorId: 42 },
      ])
    },
    x => {
      x.pair[1].timeline = x.collection([{ id: 'other', at: 60000, kind: 'commented', actorId: 7 }])
    },
    x => {
      x.pair[1].timeline = x.collection([
        { id: 'ready', at: 60000, kind: 'ready_for_review', actorId: 42 },
      ])
    },
    x => {
      x.pair[1].startedAt = 3001
    },
    x => {
      x.original.records[0].registrationDigest = 'f'.repeat(64)
    },
  ]) {
    const x = { ...f, original: clone(f.original), grant: clone(f.grant), pair: clone(f.pair) }
    mutate(x)
    assert.throws(() => prepareDraftRecovery(x.original, x.hash, null, x.grant, x.pair, 64000))
  }
})

test('already observed draft adopts state basis with no connector authority and no transport-success claim', () => {
  const f = fixture(),
    event = { id: 'draft1', kind: 'converted_to_draft', at: 2000, actorId: 42 }
  const result = prepareDraftRecovery(
    f.original,
    f.hash,
    null,
    f.grant,
    [f.observation(3000, true, [event]), f.observation(64000, true, [event])],
    64000
  )
  assert.equal(result.descriptor, null)
  assert.equal(result.ledger.records[0].spent, false)
  assert.equal(result.ledger.records[0].originalTransportOutcome, 'unknown')
})

test('original ready once requires explicit residual-risk decision; uncertain ready and redraft cannot retry', () => {
  const f = fixture(),
    draftEvent = { id: 'draft1', kind: 'converted_to_draft', at: 64000, actorId: 42 }
  const draft = observeDraftRecovery(
    prepared(f),
    digest(f.grant),
    f.observation(65000, true, [draftEvent]),
    f.original,
    65000
  )
  const authorization = {
    authority: 'original-ready-once-after-draft-convergence',
    owner: 'parent',
    registrationDigest: f.grant.registrationDigest,
    recoveryDigest: digest(f.grant),
    recoveryEvidenceDigest: digest(draft.records[0].receipts),
    tuple: f.grant.tuple,
    acceptDelayedDraftLivenessRisk: true,
    onUnexpectedRedraft: 'permanent-stop-no-retry',
    createdAt: 65000,
    expiresAt: 665000,
  }
  assert.throws(() =>
    prepareOriginalReady(
      draft,
      { ...authorization, acceptDelayedDraftLivenessRisk: false },
      f.observation(126000, true, [draftEvent]),
      f.original,
      126000
    )
  )
  const ready = prepareOriginalReady(
    draft,
    authorization,
    f.observation(126000, true, [draftEvent]),
    f.original,
    126000
  )
  assert.equal(ready.records[0].normalReady.spent, true)
  assert.throws(
    () =>
      prepareOriginalReady(
        ready,
        authorization,
        f.observation(126000, true, [draftEvent]),
        f.original,
        126000
      ),
    /consumed/
  )
  const uncertain = recordOriginalReadyReceipt(
    ready,
    receipt(ready, 127000, true, 'unknown'),
    127000
  )
  assert.equal(uncertain.records[0].normalReady.phase, 'stopped')
  assert.throws(() => recordOriginalReadyReceipt(uncertain, receipt(ready, 127000, true), 127000))
  const returned = recordOriginalReadyReceipt(ready, receipt(ready, 127000, true), 127000)
  const events = [draftEvent, { id: 'ready1', kind: 'ready_for_review', at: 127000, actorId: 42 }]
  assert.equal(
    observeOriginalReady(returned, f.observation(128000, false, events), f.original, 128000)
      .records[0].normalReady.phase,
    'awaiting-validation'
  )
  assert.throws(() =>
    observeOriginalReady(
      returned,
      f.observation(129000, true, [
        ...events,
        { id: 'late', kind: 'converted_to_draft', at: 128000, actorId: 42 },
      ]),
      f.original,
      129000
    )
  )
})

import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
  symlinkSync,
  mkdirSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { sha256 } from '../scripts/integration-queue/policy.mjs'
import { recoveryMain } from '../scripts/integration-queue/draft-recovery-cli.mjs'

function adapterFixture(t) {
  const f = fixture(),
    dir = mkdtempSync(join(tmpdir(), 'draft-recovery-cli-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const journal = join(dir, 'journal.json'),
    candidate = join(dir, 'candidate')
  // Directory created using the same ordinary temp fixture boundary as existing tests.
  mkdirSync(candidate)
  const entry = {},
    originalGrant = f.original.records[0].grant
  originalGrant.journalPath = journal
  originalGrant.entryDigest = digest(entry)
  f.original.journalPath = journal
  f.original.records[0].registrationDigest = digest(originalGrant)
  f.grant.registrationDigest = digest(originalGrant)
  const write = (name, value) => {
    const path = join(dir, name),
      bytes = JSON.stringify(value)
    writeFileSync(path, bytes)
    return [path, sha256(bytes)]
  }
  const [journalPath, journalHash] = write('journal.json', f.original)
  f.grant.originalJournalSha256 = journalHash
  const [evidencePath, evidenceHash] = write('evidence.json', {
    source: 'offline trusted fixture only',
  })
  for (const key of [
    'denialReceiptSha256',
    'authorizationReceiptSha256',
    'terminationReceiptSha256',
  ])
    f.grant[key] = evidenceHash
  const [grantPath, grantSha256] = write('grant.json', f.grant),
    [entryPath, entrySha256] = write('entry.json', entry)
  const manifest = {
    originalJournalPath: journalPath,
    originalJournalSha256: journalHash,
    grantPath,
    grantSha256,
    driverHead: 'f'.repeat(40),
    candidate,
    entryPath,
    entrySha256,
    denialReceiptPath: evidencePath,
    authorizationReceiptPath: evidencePath,
    terminationReceiptPath: evidencePath,
  }
  const [manifestPath, manifestHash] = write('manifest.json', manifest)
  let now = 64000
  class Reader {
    git(command) {
      return command === 'rev-parse' ? manifest.driverHead : ''
    }
  }
  const options = {
    Reader,
    clock: () => now,
    observe: () => f.observation(now),
    admissionObserve: () => f.observation(now).admission,
  }
  const call = (mode, input, extra = {}) => {
    const [path, hash] = write('input.json', input)
    return recoveryMain([manifestPath, manifestHash, mode, path, hash], { ...options, ...extra })
  }
  return {
    ...f,
    dir,
    journal,
    manifest,
    manifestPath,
    manifestHash,
    write,
    call,
    options,
    setNow: value => {
      now = value
    },
    sidecar: `${journal}.draft-recovery.json`,
  }
}

test('durable adapter writes allowance before descriptor and rejects duplicate dispatch across calls', async t => {
  const f = adapterFixture(t),
    before = readFileSync(f.journal, 'utf8')
  assert.equal(
    (await f.call('prepare', { observations: f.pair })).status,
    'prepared-not-dispatched'
  )
  assert.equal(existsSync(f.sidecar), true)
  assert.equal(existsSync(`${f.journal}.lock`), false)
  f.setNow(65000)
  const dispatched = await f.call('dispatch-draft', {})
  assert.equal(dispatched.descriptor.tool, 'github.convert_pull_request_to_draft')
  assert.equal(JSON.parse(readFileSync(f.sidecar)).records[0].phase, 'dispatch-intended')
  await assert.rejects(f.call('dispatch-draft', {}))
  assert.equal(JSON.parse(readFileSync(f.sidecar)).records[0].phase, 'stopped')
  assert.equal(readFileSync(f.journal, 'utf8'), before)
})

test('persistence failure, shared lock, copied journal and malformed or dangling sidecar fail closed', async t => {
  const f = adapterFixture(t),
    before = readFileSync(f.journal, 'utf8')
  await assert.rejects(
    f.call(
      'prepare',
      { observations: f.pair },
      {
        persist: () => {
          throw new Error('fsync failure fixture')
        },
      }
    ),
    /fsync/
  )
  assert.equal(existsSync(f.sidecar), false)
  assert.equal(existsSync(`${f.journal}.lock`), false)
  writeFileSync(`${f.journal}.lock`, 'owned by fixture')
  await assert.rejects(f.call('prepare', { observations: f.pair }), { code: 'EEXIST' })
  assert.equal(readFileSync(`${f.journal}.lock`, 'utf8'), 'owned by fixture')
  rmSync(`${f.journal}.lock`)
  writeFileSync(f.sidecar, 'malformed')
  await assert.rejects(f.call('prepare', { observations: f.pair }))
  rmSync(f.sidecar)
  symlinkSync(join(f.dir, 'absent-target'), f.sidecar)
  await assert.rejects(f.call('prepare', { observations: f.pair }))
  rmSync(f.sidecar)
  const copy = join(f.dir, 'copy.json')
  writeFileSync(copy, before)
  const [manifestPath, manifestHash] = f.write('copy-manifest.json', {
    ...f.manifest,
    originalJournalPath: copy,
  })
  const [inputPath, inputHash] = f.write('copy-input.json', { observations: f.pair })
  await assert.rejects(
    recoveryMain([manifestPath, manifestHash, 'prepare', inputPath, inputHash], f.options),
    /Copied journal/
  )
  assert.equal(existsSync(`${copy}.draft-recovery.json`), false)
  assert.equal(readFileSync(f.journal, 'utf8'), before)
})

test('receipt cannot forge descriptor, chronology, local invocation identity or provider causality', () => {
  const f = fixture(),
    ledger = dispatchDraftRecovery(
      prepared(f),
      digest(f.grant),
      f.observation(65000),
      f.original,
      65000
    )
  for (const change of [
    { descriptorDigest: 'c'.repeat(64) },
    { localInvocationId: 'invented' },
    { startedAt: 64000 },
    { finishedAt: 68000 },
    { rawReceiptSha256: 'bad' },
  ])
    assert.throws(() =>
      recordDraftRecoveryReceipt(
        ledger,
        digest(f.grant),
        { ...receipt(ledger, 66000), ...change },
        66000
      )
    )
  const recorded = recordDraftRecoveryReceipt(
    ledger,
    digest(f.grant),
    receipt(ledger, 66000),
    66000
  )
  assert.equal(recorded.records[0].receipts.at(-1).toolCallId, null)
  assert.equal(recorded.records[0].originalTransportOutcome, 'unknown')
})

import { collectDraftRecoveryObservation } from '../scripts/integration-queue/draft-recovery-observer.mjs'
import { validateOriginalReadyCompletion } from '../scripts/integration-queue/draft-recovery.mjs'

test('production observer binds both complete timeline/run passes and immutable tuple without protection calls', () => {
  const f = fixture(),
    calls = [],
    tuple = f.grant.tuple
  const pr = {
    state: 'open',
    merged: false,
    mergeable: true,
    draft: false,
    updated_at: '2026-10-17T00:00:00Z',
    merge_commit_sha: tuple.merge,
    head: { sha: tuple.head, repo: { full_name: REPO } },
    base: { sha: tuple.base, ref: 'main', repo: { full_name: REPO } },
  }
  const reader = {
    get(endpoint) {
      calls.push(endpoint)
      if (endpoint.includes('/pulls/')) return clone(pr)
      if (endpoint.endsWith('/git/ref/heads/main')) return { object: { sha: tuple.base } }
      if (endpoint.includes('/timeline?')) return []
      if (endpoint.includes('/actions/runs?'))
        return {
          total_count: 1,
          workflow_runs: [
            {
              id: 1,
              head_sha: tuple.head,
              status: 'completed',
              run_attempt: 1,
              conclusion: 'success',
            },
          ],
        }
      throw Error('Unexpected endpoint')
    },
    commit(sha) {
      return sha === tuple.head
        ? { sha, tree: tuple.tree }
        : { sha, tree: tuple.mergeTree, parents: [tuple.base, tuple.head] }
    },
    workflow(path) {
      return { sha256: f.grant.workflowHashes[path] }
    },
  }
  const observed = collectDraftRecoveryObservation(reader, f.grant, () => 64000)
  assert.equal(observed.complete, true)
  assert.equal(observed.timeline.pages.length, 1)
  assert.equal(calls.filter(x => x.includes('/timeline?')).length, 2)
  assert.equal(calls.filter(x => x.includes('/actions/runs?')).length, 2)
  assert(calls.every(x => !x.includes('protection')))
  let timelineReads = 0
  const changing = {
    ...reader,
    get(endpoint) {
      if (endpoint.includes('/timeline?') && ++timelineReads === 2) return [{ id: 1 }]
      return reader.get(endpoint)
    },
  }
  assert.throws(
    () => collectDraftRecoveryObservation(changing, f.grant, () => 64000),
    /Timeline changed/
  )
  const incomplete = {
    ...reader,
    get(endpoint) {
      if (endpoint.includes('/actions/runs?')) return { total_count: 2, workflow_runs: [] }
      return reader.get(endpoint)
    },
  }
  assert.throws(() => collectDraftRecoveryObservation(incomplete, f.grant, () => 64000))
})

test('ready quiet fingerprint cannot ignore completed new runs or timeline changes', () => {
  const f = fixture(),
    event = { id: 'draft', kind: 'converted_to_draft', at: 64000, actorId: 42 }
  const observed = observeDraftRecovery(
    prepared(f),
    digest(f.grant),
    f.observation(65000, true, [event]),
    f.original,
    65000
  )
  const authorization = {
    authority: 'original-ready-once-after-draft-convergence',
    owner: 'parent',
    registrationDigest: f.grant.registrationDigest,
    recoveryDigest: digest(f.grant),
    recoveryEvidenceDigest: digest(observed.records[0].receipts),
    tuple: f.grant.tuple,
    acceptDelayedDraftLivenessRisk: true,
    onUnexpectedRedraft: 'permanent-stop-no-retry',
    createdAt: 65000,
    expiresAt: 665000,
  }
  const changed = f.observation(126000, true, [event])
  changed.runs = f.collection([{ id: 'new-run', head: f.grant.tuple.head, status: 'completed' }])
  assert.throws(
    () => prepareOriginalReady(observed, authorization, changed, f.original, 126000),
    /Runs changed/
  )
  const failed = f.observation(126000, true, [event])
  failed.admission.otherValidation = 'failed'
  assert.throws(() => prepareOriginalReady(observed, authorization, failed, f.original, 126000))
})
