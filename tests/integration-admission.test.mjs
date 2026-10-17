import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { REPO, digest } from '../scripts/integration-queue/policy.mjs'
import { FULL_WORKFLOW, registerAdmission, admissionTick, withAdmissionJournal } from '../scripts/integration-queue/admission.mjs'

function fixture() {
  const tuple = Object.fromEntries(['head', 'tree', 'base', 'merge', 'mergeTree'].map((key, i) => [key, String(i + 1).repeat(40)]))
  const grant = { version: 1, repo: REPO, pr: 123, owner: 'parent', journalPath: '/tmp/admission-fixture.json',
    authority: 'one-draft-ready-cycle', tuple, workflowHashes: { [FULL_WORKFLOW]: 'a'.repeat(64) },
    review: { decision: 'ACCEPT', reviewer: 'independent', tupleDigest: digest(tuple), receiptSha256: 'b'.repeat(64) },
    createdAt: 0, expiresAt: 3_600_000 }
  const observed = { repo: REPO, pr: 123, complete: true, consistent: true, observedAt: 0, tuple,
    workflowHashes: grant.workflowHashes, draft: false, activeAttempts: false, otherValidation: 'clear', inventoryDigest: 'c'.repeat(64), full: { state: 'missing' } }
  return { grant, observed, ledger: registerAdmission(null, grant, null, 0) }
}
async function tick(f, time, overrides = {}, options = {}) {
  const observed = { ...f.observed, observedAt: time, ...overrides }
  const writes = [], calls = []
  const result = await admissionTick(f.ledger, observed, { clock: () => time,
    persist: state => writes.push(structuredClone(state)), observe: () => observed,
    transport: args => { assert(writes.at(-1).records.at(-1).pending); calls.push(args) }, ...options })
  f.ledger = result.ledger
  return { ...result, writes, calls }
}

test('one ready head cycle uses only draft/ready, durable intent and bounded admission wait', async () => {
  const f = fixture()
  assert.equal((await tick(f, 0)).status, 'wait')
  assert.equal((await tick(f, 60_000)).action.kind, 'draft')
  const draft = await tick(f, 60_000, {}, { apply: true })
  assert.equal(draft.status, 'submitted'); assert.equal(draft.calls.length, 1)
  assert(draft.calls[0].includes('--undo')); assert(!draft.calls[0].includes('merge'))
  assert.equal((await tick(f, 61_000, { draft: true })).status, 'wait')
  const ready = await tick(f, 121_000, { draft: true }, { apply: true })
  assert.equal(ready.action.kind, 'ready'); assert.equal(ready.calls.length, 1)
  assert(!ready.calls[0].includes('--undo'))
  assert.equal((await tick(f, 122_000)).status, 'wait')
  assert.equal((await tick(f, 421_999)).status, 'wait')
  assert.equal((await tick(f, 422_000)).status, 'stop')
  assert.equal((await tick(f, 500_000, {}, { apply: true })).calls.length, 0)
})

test('genuine matching required pass reuses validation, never merges', async () => {
  const f = fixture()
  const full = { state: 'passed', tuple: f.grant.tuple, sourceBound: true, required: true, runId: '1', attempt: 1, checkId: '2' }
  assert.equal((await tick(f, 0, { full }, { apply: true })).status, 'complete')
  assert.deepEqual(f.ledger.records[0].spent, { draft: false, ready: false })
  const bad = fixture(); full.required = false
  assert.equal((await tick(bad, 0, { full })).status, 'stop')
})

test('uncertain submission never replays and may only reconcile exact observed effect', async () => {
  const f = fixture(); await tick(f, 0)
  const attempt = await tick(f, 60_000, {}, { apply: true, transport: () => { throw Error('timeout') } })
  assert.equal(attempt.status, 'uncertain')
  const unresolved = await tick(f, 61_000, {}, { apply: true })
  assert.equal(unresolved.status, 'stop'); assert.equal(unresolved.calls.length, 0)
  assert(f.ledger.records[0].pending)
  assert.equal((await tick(f, 62_000, { draft: true })).status, 'wait')
  assert.equal(f.ledger.records[0].pending, null)
})

test('tuple/workflow drift, failures, incomplete observation and expired grants stop without effects', async () => {
  for (const mutate of [ o => { o.tuple = { ...o.tuple, head: 'f'.repeat(40) } },
    o => { o.workflowHashes = { [FULL_WORKFLOW]: 'f'.repeat(64) } }, o => { o.complete = false }, o => { o.otherValidation = 'failed' }, o => { o.otherValidation = 'unknown' },
    o => { o.full = { state: 'failed', tuple: o.tuple, sourceBound: true } },
    o => { o.full = { state: 'unknown', tuple: o.tuple, sourceBound: false } } ]) {
    const f = fixture(); const o = structuredClone(f.observed); mutate(o)
    const r = await tick(f, 0, o, { apply: true }); assert.equal(r.status, 'stop'); assert.equal(r.calls.length, 0)
  }
  const f = fixture(); assert.equal((await tick(f, 3_600_000)).status, 'stop')
})

test('fresh pre-effect inventory or identity drift stops; failed durable write prevents transport', async () => {
  for (const key of ['tuple', 'inventoryDigest', 'draft']) {
    const f = fixture(); await tick(f, 0)
    const observed = { ...f.observed, observedAt: 60_000 }
    if (key === 'tuple') observed.tuple = { ...observed.tuple, merge: 'f'.repeat(40) }
    if (key === 'inventoryDigest') observed.inventoryDigest = 'f'.repeat(64)
    if (key === 'draft') observed.draft = true
    const r = await tick(f, 60_000, {}, { apply: true, observe: () => observed })
    assert.equal(r.status, 'stop'); assert.equal(r.calls.length, 0)
  }
  const f = fixture(); await tick(f, 0); let submitted = false
  await assert.rejects(tick(f, 60_000, {}, { apply: true, persist: () => { throw Error('disk full') }, transport: () => { submitted = true } }), /disk full/)
  assert.equal(submitted, false)
})

test('registration binds owner/history and cannot replenish a candidate or replace pending intent', async () => {
  const f = fixture(), previous = f.ledger.records[0].registrationDigest
  assert.throws(() => registerAdmission(f.ledger, f.grant, previous, 0), /settle/)
  await tick(f, 3_600_000)
  assert.throws(() => registerAdmission(f.ledger, f.grant, previous, 0), /already registered/)
  const changed = structuredClone(f.grant); changed.tuple.head = 'f'.repeat(40); changed.review.tupleDigest = digest(changed.tuple)
  assert.throws(() => registerAdmission(f.ledger, changed, null, 0), /predecessor/)
  assert.equal(registerAdmission(f.ledger, changed, previous, 0).records.length, 2)
  changed.owner = 'other'; assert.throws(() => registerAdmission(f.ledger, changed, previous, 0))
})

test('canonical journal lock serializes ticks and retains durable state across restart', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'pnd-admission-')); t.after(() => rmSync(dir, { recursive: true, force: true }))
  const path = join(dir, 'journal.json'), f = fixture(); f.grant.journalPath = path
  await withAdmissionJournal(path, async (ledger, persist) => {
    assert.equal(ledger, null); persist(registerAdmission(null, f.grant, null, 0))
    await assert.rejects(withAdmissionJournal(path, () => {}), /EEXIST/)
  })
  await withAdmissionJournal(path, async ledger => assert.equal(ledger.records.length, 1))
  assert.equal(JSON.parse(readFileSync(path, 'utf8')).journalPath, path)
})

import { GATES } from '../scripts/integration-queue/policy.mjs'
import { normalizeAdmission, observeAdmission } from '../scripts/integration-queue/admission-observer.mjs'
import { parseAdmissionArguments } from '../scripts/integration-queue/admission-cli.mjs'
import { GitHubReader } from '../scripts/integration-queue/github.mjs'

function observerFixture() {
  const f = fixture()
  f.grant.workflowHashes[GATES[1].workflow] = 'd'.repeat(64)
  const entry = { pr: 123, requireBrowser: false, workflowHashes: f.grant.workflowHashes, review: { sha256: f.grant.review.receiptSha256 } }
  const tuple = f.grant.tuple
  const raw = { complete: true, consistent: true, repo: REPO, pr: 123, observedAt: 0,
    state: 'open', merged: false, mergeable: true, draft: false, head: tuple.head, base: tuple.base,
    headCommit: { tree: tuple.tree }, synthetic: { sha: tuple.merge, tree: tuple.mergeTree, parents: [tuple.base, tuple.head] },
    reviewDigest: entry.review.sha256, changedPaths: [], runs: [], currentChecks: [],
    workflows: GATES.flatMap(g => [tuple.head, tuple.base, tuple.merge].map(ref => ({ path: g.workflow, ref, sha256: entry.workflowHashes[g.workflow] }))) }
  return { ...f, entry, raw }
}

test('observer normalizes genuine missing admission, drains unfinished attempts and rejects drift', () => {
  const f = observerFixture()
  assert.equal(normalizeAdmission(f.entry, f.grant, f.raw, []).full.state, 'missing')
  const active = structuredClone(f.raw); active.runs = [{ id: 1, attempt: 1, status: 'in_progress' }]
  assert.equal(normalizeAdmission(f.entry, f.grant, active, []).activeAttempts, true)
  for (const mutate of [o => { o.complete = false }, o => { o.head = 'f'.repeat(40) },
    o => { o.workflows.pop() }, o => { o.synthetic.parents.reverse() }, o => { o.reviewDigest = 'f'.repeat(64) },
    o => { o.currentChecks.push({ name: 'Full check', head: o.head }) }]) {
    const bad = structuredClone(f.raw); mutate(bad)
    assert.throws(() => normalizeAdmission(f.entry, f.grant, bad, []))
  }
})

test('ordinary admission observer pins ready-only workflow and complete GraphQL identity without protection reads', () => {
  const f = observerFixture()
  const pr = { headRefOid: f.raw.head, baseRefOid: f.raw.base, isDraft: false,
    potentialMergeCommit: { oid: f.raw.synthetic.sha }, commits: { nodes: [{ commit: { statusCheckRollup: null } }] } }
  let workflow = 'on:\n  pull_request:\n    branches: [main]\n    types: [ready_for_review]\n\n'
  const calls = []
  const reader = { cwd: '/fixture', inspectAdmission: () => f.raw, gitOutput: () => workflow,
    execute: (command, args) => { calls.push([command, args]); return JSON.stringify({ data: { repository: { pullRequest: pr } } }) } }
  assert.equal(observeAdmission(reader, f.entry, f.grant, '/trusted/entry.json').full.state, 'missing')
  assert(calls.every(([,args]) => !args.some(arg => arg.includes('/protection'))))
  pr.commits.nodes[0].commit.statusCheckRollup = { contexts: { pageInfo: { hasNextPage: true }, nodes: [] } }
  assert.throws(() => observeAdmission(reader, f.entry, f.grant, '/trusted/entry.json'), /Incomplete/)
  workflow = workflow.replace('[ready_for_review]', '[opened, synchronize, ready_for_review]')
  assert.throws(() => observeAdmission(reader, f.entry, f.grant, '/trusted/entry.json'), /ready-only/)
})

test('default reader inspection remains full policy; narrower method is explicitly admission-only', () => {
  const reader = new GitHubReader(), calls = []
  reader.inspectMode = (...args) => { calls.push(args); return args[2] }
  assert.equal(reader.inspect({}, '/trusted'), false)
  assert.equal(reader.inspectAdmission({}, '/trusted'), true)
  assert.deepEqual(calls.map(args => args[2]), [false, true])
})

test('CLI parser has no fixture, refresh, merge, rerun or unknown argument path', () => {
  const base = ['--entry', '/a', '--entry-sha256', 'hash', '--grant', '/g', '--grant-sha256', 'hash', '--candidate', '/c', '--journal', '/j']
  assert(!parseAdmissionArguments(base)['--apply'])
  assert(parseAdmissionArguments([...base, '--register', '--previous', 'none'])['--register'])
  for (const extra of [['--merge'], ['--refresh'], ['--rerun'], ['--snapshot', '/x'], ['--apply', '--apply'],
    ['--register'], ['--previous', 'none'], ['--register', '--previous', 'none', '--apply']])
    assert.throws(() => parseAdmissionArguments([...base, ...extra]))
})

import { mkdirSync, writeFileSync } from 'node:fs'
import { sha256 } from '../scripts/integration-queue/policy.mjs'
import { admissionMain } from '../scripts/integration-queue/admission-cli.mjs'
import { deriveFullCheckDiagnostic, preflightAdmissionPolicy } from '../scripts/integration-queue/admission-preflight.mjs'

test('usable CLI registers trusted grant, dry-runs and performs exactly one bounded pair through injected offline transport', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'pnd-admission-cli-')); t.after(() => rmSync(dir, { recursive: true, force: true }))
  const candidate = join(dir, 'candidate'); mkdirSync(candidate)
  const f = observerFixture(); let clock = 0
  const workflow = 'on:\n  pull_request:\n    branches: [main]\n    types: [ready_for_review]\n\n'
  f.entry.workflowHashes[FULL_WORKFLOW] = sha256(workflow)
  f.grant.workflowHashes[FULL_WORKFLOW] = sha256(workflow)
  for (const w of f.raw.workflows) if (w.path === FULL_WORKFLOW) w.sha256 = sha256(workflow)
  const review = 'independent offline review fixture'; writeFileSync(join(dir, 'review.txt'), review)
  const entry = { ...f.entry, version: 1, repo: REPO, baseRef: 'main', sourceHead: f.grant.tuple.head,
    sourceTree: f.grant.tuple.tree, reviewBase: f.grant.tuple.base, allowMechanicalRefresh: false,
    approvedBy: 'parent', review: { reviewer: 'independent', decision: 'ACCEPT', head: f.grant.tuple.head,
      base: f.grant.tuple.base, file: join(dir, 'review.txt'), sha256: sha256(review) },
    deployment: { kind: 'unverified', reason: 'admission-only fixture' } }
  const grant = { ...f.grant, journalPath: join(dir, 'journal.json'), driverHead: 'e'.repeat(40), entryDigest: digest(entry),
    review: { ...f.grant.review, receiptSha256: sha256(review) } }
  f.raw.reviewDigest = sha256(review)
  const entryBytes = JSON.stringify(entry), grantBytes = JSON.stringify(grant)
  writeFileSync(join(dir, 'entry.json'), entryBytes); writeFileSync(join(dir, 'grant.json'), grantBytes)
  class Reader {
    constructor({ cwd }) { this.cwd = cwd }
    git(command) { return command === 'rev-parse' ? grant.driverHead : '' }
    inspectAdmission() { return { ...f.raw, observedAt: clock } }
    gitOutput() { return workflow }
    execute() { return JSON.stringify({ data: { repository: { pullRequest: { headRefOid: f.raw.head, baseRefOid: f.raw.base,
      isDraft: f.raw.draft, potentialMergeCommit: { oid: f.raw.synthetic.sha }, commits: { nodes: [{ commit: { statusCheckRollup: null } }] } } } } }) }
  }
  const calls = [], options = { Reader, clock: () => clock, transport: args => calls.push(args) }
  const args = ['--entry', join(dir, 'entry.json'), '--entry-sha256', sha256(entryBytes), '--grant', join(dir, 'grant.json'),
    '--grant-sha256', sha256(grantBytes), '--candidate', candidate, '--journal', grant.journalPath]
  // An extra policy not present in the pinned workflow must fail before the
  // canonical journal is created. Its trusted hashes are otherwise consistent.
  const wrongEntry = { ...entry, fullCheckPolicy: 'sharded-v1', fullCheckDiagnostic: { activationPr: 516 } }
  const wrongGrant = { ...grant, entryDigest: digest(wrongEntry) }
  writeFileSync(join(dir, 'wrong-entry.json'), JSON.stringify(wrongEntry))
  writeFileSync(join(dir, 'wrong-grant.json'), JSON.stringify(wrongGrant))
  const wrongArgs = [...args]
  wrongArgs[1] = join(dir, 'wrong-entry.json'); wrongArgs[3] = sha256(JSON.stringify(wrongEntry))
  wrongArgs[5] = join(dir, 'wrong-grant.json'); wrongArgs[7] = sha256(JSON.stringify(wrongGrant))
  await assert.rejects(admissionMain([...wrongArgs, '--register', '--previous', 'none'], options), /diagnostic policy/)
  assert.throws(() => readFileSync(grant.journalPath), { code: 'ENOENT' })
  const diagnosticWorkflow = workflow + "jobs:\n  benchmark-baseline:\n    name: Legacy test baseline (diagnostic)\n    needs: full-check\n    if: ${{ github.event.pull_request.number == 516 && needs.full-check.result == 'success' }}\n"
  class DiagnosticReader extends Reader { gitOutput() { return diagnosticWorkflow } }
  for (const policy of [undefined, { activationPr: 515 }]) {
    const diagnosticEntry = { ...entry, fullCheckPolicy: 'sharded-v1', workflowHashes: { ...entry.workflowHashes, [FULL_WORKFLOW]: sha256(diagnosticWorkflow) } }
    if (policy) diagnosticEntry.fullCheckDiagnostic = policy
    const diagnosticGrant = { ...grant, workflowHashes: diagnosticEntry.workflowHashes, entryDigest: digest(diagnosticEntry) }
    writeFileSync(join(dir, 'wrong-entry.json'), JSON.stringify(diagnosticEntry))
    writeFileSync(join(dir, 'wrong-grant.json'), JSON.stringify(diagnosticGrant))
    wrongArgs[3] = sha256(JSON.stringify(diagnosticEntry)); wrongArgs[7] = sha256(JSON.stringify(diagnosticGrant))
    await assert.rejects(admissionMain([...wrongArgs, '--register', '--previous', 'none'], { ...options, Reader: DiagnosticReader }), /diagnostic policy/)
    assert.throws(() => readFileSync(grant.journalPath), { code: 'ENOENT' })
  }
  assert.equal((await admissionMain([...args, '--register', '--previous', 'none'], options)).status, 'registered')
  const registeredBytes = readFileSync(grant.journalPath, 'utf8')
  await assert.rejects(admissionMain(wrongArgs, { ...options, Reader: DiagnosticReader }), /diagnostic policy/)
  assert.equal(readFileSync(grant.journalPath, 'utf8'), registeredBytes)
  assert.equal((await admissionMain(args, options)).status, 'wait')
  clock = 60_000
  assert.equal((await admissionMain(args, options)).status, 'propose'); assert.equal(calls.length, 0)
  assert.equal((await admissionMain([...args, '--apply'], options)).status, 'submitted')
  assert.equal((await admissionMain([...args, '--apply'], options)).status, 'stop'); assert.equal(calls.length, 1)
  f.raw.draft = true; clock = 61_000; assert.equal((await admissionMain(args, options)).status, 'wait')
  clock = 121_000; assert.equal((await admissionMain([...args, '--apply'], options)).status, 'submitted')
  assert.equal(calls.length, 2); assert(calls[0].includes('--undo')); assert(!calls[1].includes('--undo'))
  f.raw.draft = false; clock = 122_000; assert.equal((await admissionMain(args, options)).status, 'wait')
  clock = 422_000; assert.equal((await admissionMain([...args, '--apply'], options)).status, 'stop')
  assert.equal(calls.length, 2)
})

test('observer accepts a source-proved matching required Full, never a merely green or unselected check', () => {
  const f = observerFixture(), gate = GATES[0], stamp = '2026-10-17T00:00:00Z'
  f.raw.runs = [{ id: 1, attempt: 1, workflow: gate.workflow, workflowSha256: f.entry.workflowHashes[gate.workflow],
    head: f.raw.head, base: f.raw.base, merge: f.raw.synthetic.sha, startedAt: stamp, updatedAt: stamp,
    status: 'completed', conclusion: 'success', event: 'pull_request', identityVerified: true,
    validationVerified: true, job: gate.job, jobConclusion: 'success', app: 'github-actions', appId: 15368,
    checkId: 2, steps: gate.steps.map(name => ({ name, conclusion: 'success' })) }]
  f.raw.currentChecks = [{ id: 2, name: gate.job, appId: 15368, head: f.raw.head, startedAt: stamp, status: 'completed', conclusion: 'success' }]
  const checks = [{ databaseId: 2, name: gate.job, isRequired: true }]
  assert.equal(normalizeAdmission(f.entry, f.grant, f.raw, checks).full.state, 'passed')
  assert.throws(() => normalizeAdmission(f.entry, f.grant, f.raw, [{ ...checks[0], isRequired: false }]), /required/)
  const bad = structuredClone(f.raw); bad.runs[0].steps.pop()
  assert.throws(() => normalizeAdmission(f.entry, f.grant, bad, checks), /unverified/)
})

test('diagnostic derivation accepts only the reviewed literal policy and preflight never repairs pinned inputs', () => {
  const prefix = 'on:\n  pull_request:\n    branches: [main]\n    types: [ready_for_review]\n\njobs:\n'
  const block = "  benchmark-baseline:\n    name: Legacy test baseline (diagnostic)\n    needs: full-check\n    if: ${{ github.event.pull_request.number == 516 && needs.full-check.result == 'success' }}\n"
  const workflow = prefix + block
  assert.deepEqual(deriveFullCheckDiagnostic(workflow), { activationPr: 516 })
  assert.equal(deriveFullCheckDiagnostic(prefix), undefined)
  for (const bad of [workflow + block, workflow.replace('== 516', '!= 516'),
    workflow.replace('benchmark-baseline:', '"benchmark-baseline":'),
    workflow.replace('needs: full-check', 'needs: [full-check]'),
    workflow.replace('== 516', '== inputs.pr'), workflow.replace('    if:', '    if: true\n    if:'),
    workflow + '    name: Other\n', workflow + '    needs: other-job\n',
    workflow + '    "if": true\n', workflow + "    'if': true\n",
    workflow.replace('    name:', '    "name":'), workflow.replace('    needs:', "    'needs':")])
    assert.throws(() => deriveFullCheckDiagnostic(bad))
  const entry = { workflowHashes: { [FULL_WORKFLOW]: sha256(workflow) } }
  const grant = fixture().grant, reader = { gitOutput: () => workflow }
  const before = JSON.stringify(entry)
  assert.throws(() => preflightAdmissionPolicy(reader, entry, grant), /diagnostic policy/)
  assert.equal(JSON.stringify(entry), before)
  entry.fullCheckDiagnostic = { activationPr: 515 }
  assert.throws(() => preflightAdmissionPolicy(reader, entry, grant), /diagnostic policy/)
  entry.fullCheckDiagnostic = { activationPr: 516 }
  assert.deepEqual(preflightAdmissionPolicy(reader, entry, grant), { activationPr: 516 })
  assert.throws(() => preflightAdmissionPolicy({ gitOutput: () => workflow + '\n' }, entry, grant), /Pinned Full workflow/)
})
