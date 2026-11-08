import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { GitHubReader } from '../scripts/integration-queue/github.mjs'
import { REPO, GATES, SHARDED_FULL_GATE, decide, recordIntent, sha256 } from '../scripts/integration-queue/policy.mjs'
import { mutationArguments, proposedPlan, submitPilot } from '../scripts/integration-queue/writer.mjs'
import { atomicWrite } from '../scripts/integration-queue/cli.mjs'
import { normalizeAdmission } from '../scripts/integration-queue/admission-observer.mjs'

const id = n => n.toString(16).padStart(40, '0')
const now = 1_000_000
const workflow = 'reviewed workflow bytes\n'
const hash = sha256(workflow)

// No subprocess or network transport is available to this fixture. Every reader
// command and writer request must match a closed in-memory allowlist.
function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'pnd-base-metadata-'))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const review = join(directory, 'review.md')
  writeFileSync(review, 'independent source and focused-check review\n')
  const e = {
    version: 1, repo: REPO, pr: 123, baseRef: 'main', sourceHead: id(1), sourceTree: id(2),
    reviewBase: id(3), approvedBy: 'parent', allowMechanicalRefresh: false,
    allowBaseMetadataRefresh: true, requireBrowser: false,
    review: { reviewer: 'independent-reviewer', decision: 'ACCEPT', head: id(1), base: id(3),
      sha256: sha256(readFileSync(review)), file: review },
    workflowHashes: Object.fromEntries(GATES.map(g => [g.workflow, hash])),
    deployment: { kind: 'unverified', reason: 'offline fixture only' },
  }
  const pr = {
    head: { sha: e.sourceHead, ref: 'reviewed-source', repo: { full_name: REPO } },
    base: { sha: id(6), ref: 'main', repo: { full_name: REPO } },
    draft: true, state: 'open', merged: false, mergeable: true, mergeable_state: 'blocked',
    merge_commit_sha: id(4), updated_at: 'unchanged',
  }
  const f = { directory, e, pr, main: e.reviewBase, upToDate: true, oldBaseAncestor: true,
    endPr: () => {}, endMain: value => value, calls: [], checks: [], runs: [],
    commits: new Map([
      [e.sourceHead, { sha: e.sourceHead, tree: { sha: e.sourceTree }, parents: [{ sha: e.reviewBase }] }],
      [id(4), { sha: id(4), tree: { sha: e.sourceTree }, parents: [{ sha: e.reviewBase }, { sha: e.sourceHead }] }],
    ]),
  }
  f.inspect = ({ admissionOnly = false } = {}) => {
    let prReads = 0, mainReads = 0
    const reader = new GitHubReader({ cwd: directory, execute: (command, args) => {
      f.calls.push([command, args])
      if (command === 'git') {
        const operation = args.slice(6)
        if (operation[0] === 'config') return ''
        if (operation[0] === 'status') return ''
        if (operation[0] === 'merge-base' && operation[1] === f.main && operation[2] === pr.head.sha)
          return f.upToDate ? f.main : id(6)
        if (operation[0] === 'merge-base' && operation[1] === pr.base.sha && operation[2] === f.main)
          return f.oldBaseAncestor ? pr.base.sha : id(99)
        if (operation[0] === 'diff') return 'scripts/ci-gate.mjs\0'
        throw new Error(`Unexpected fake Git command: ${JSON.stringify(operation)}`)
      }
      assert.equal(command, 'gh')
      assert.deepEqual(args.slice(0, 5), ['api', '--hostname', 'github.com', '--method', 'GET'])
      const endpoint = args[5], root = `repos/${REPO}`
      let value
      if (endpoint === `${root}/pulls/${e.pr}`) {
        value = structuredClone(pr)
        if (prReads++) f.endPr(value)
      } else if (endpoint === `${root}/git/ref/heads/main`)
        value = { object: { sha: mainReads++ ? f.endMain(f.main) : f.main } }
      else if (endpoint.startsWith(`${root}/git/commits/`)) {
        const oid = endpoint.split('/').at(-1)
        assert(f.commits.has(oid), `Unexpected immutable commit ${oid}`)
        value = f.commits.get(oid)
      } else if (endpoint === `${root}/branches/main/protection`)
        value = { required_status_checks: { strict: true, checks: [{ context: 'Full check', app_id: 15368 }] },
          enforce_admins: { enabled: true }, required_pull_request_reviews: {} }
      else if (endpoint.startsWith(`${root}/rules/branches/main?`)) value = []
      else if (endpoint.startsWith(`${root}/contents/`))
        value = { encoding: 'base64', content: Buffer.from(workflow).toString('base64') }
      else if (endpoint.startsWith(`${root}/actions/workflows/`))
        value = { total_count: f.runs.length, workflow_runs: f.runs }
      else if (endpoint.startsWith(`${root}/commits/${pr.head.sha}/check-runs?`))
        value = { total_count: f.checks.length, check_runs: f.checks }
      else throw new Error(`Unexpected fake GitHub endpoint: ${endpoint}`)
      return JSON.stringify(value)
    } })
    const o = admissionOnly ? reader.inspectAdmission(e, directory) : reader.inspect(e, directory)
    o.observedAt = now
    o.resource = { status: 'observed', fullSuite: true, candidate: id(4), tree: e.sourceTree }
    return o
  }
  return f
}

function settled(e, o, saved = null, time = now) {
  const first = decide(e, { ...o, observedAt: time }, saved, time)
  return first.status === 'wait'
    ? decide(e, { ...o, observedAt: time + 60_000 }, first.checkpoint, time + 60_000)
    : first
}

function armed(e, decision, time = now + 60_000) {
  const context = { allowlistSha256: hash, driverHead: id(999),
    journalId: '00000000-0000-4000-8000-000000000001', journalPath: '/trusted/journal.json',
    driverClean: true, fixture: false, pilotReviewSha256: hash, usedPilot: false }
  const plan = proposedPlan(e, decision, context)
  context.planSha256 = sha256(JSON.stringify(plan))
  const pilot = { version: 1, repo: REPO, pr: e.pr, approvedBy: e.approvedBy,
    planSha256: context.planSha256, createdAt: new Date(time - 1000).toISOString(),
    expiresAt: new Date(time + 60_000).toISOString(), review: { decision: 'ACCEPT',
      reviewer: 'independent-plan-reviewer', driverHead: context.driverHead,
      planSha256: context.planSha256, sha256: hash } }
  return { entry: e, decision, plan, pilot, context, clock: () => time }
}

function proposal(f) {
  const o = f.inspect(), decision = settled(f.e, o)
  assert.equal(o.complete, true, o.error)
  assert.equal(decision.action?.kind, 'refresh-base', decision.reason)
  return { o, decision }
}

test('current synthetic with stale base metadata proposes only an opt-in metadata effect before Ready', t => {
  const f = fixture(t), { o, decision } = proposal(f)
  assert.equal(o.baseMetadataRefreshOnly, true)
  assert.deepEqual(o.synthetic.parents, [f.main, f.e.sourceHead])
  assert.equal(o.synthetic.tree, f.e.sourceTree)
  assert.deepEqual(decision.action, { kind: 'refresh-base', head: f.e.sourceHead,
    headRef: f.pr.head.ref, base: f.main, baseRef: 'main', previousBase: f.pr.base.sha,
    merge: f.pr.merge_commit_sha, tree: f.e.sourceTree })
  assert.equal(decision.checkpoint.pending, null)
  for (const option of [undefined, false, 'true']) {
    const e = { ...f.e, allowBaseMetadataRefresh: option }
    assert.equal(settled(e, o).status, 'stop')
  }
  f.pr.base.sha = f.main
  assert.equal(settled(f.e, f.inspect()).action.kind, 'ready')
})

test('metadata refresh cannot admit a genuinely stale source/base or wrong synthetic tree/parents', t => {
  const cases = [
    f => { f.upToDate = false },
    f => { f.oldBaseAncestor = false },
    f => { f.main = id(7) },
    f => { f.pr.head.sha = id(8) },
    f => { f.pr.base.ref = 'other' },
    f => { f.pr.head.repo.full_name = 'elsewhere/repo' },
    f => { f.pr.draft = false },
    f => { f.pr.mergeable = null },
    f => { f.commits.get(id(4)).tree.sha = id(8) },
    f => { f.commits.get(id(4)).parents[0].sha = id(6) },
    f => { f.commits.get(id(4)).parents[1].sha = id(8) },
    f => { f.commits.get(id(4)).parents.push({ sha: id(8) }) },
    f => { f.e.sourceTree = id(8) },
    f => { f.e.review.sha256 = 'f'.repeat(64) },
  ]
  for (const change of cases) {
    const f = fixture(t)
    change(f)
    assert.equal(settled(f.e, f.inspect()).status, 'stop', change.toString())
  }
})

test('metadata observation requires stable head/base refs and cannot widen admission-only authority', t => {
  for (const change of [p => { p.head.ref = 'renamed' }, p => { p.base.ref = 'other' },
    p => { p.head.sha = id(8) }, p => { p.base.sha = id(8) },
    p => { p.draft = false }, p => { p.merge_commit_sha = id(8) }]) {
    const f = fixture(t)
    f.endPr = change
    assert.equal(settled(f.e, f.inspect()).status, 'stop')
  }
  const f = fixture(t)
  f.endMain = () => id(8)
  assert.equal(settled(f.e, f.inspect()).status, 'stop')
  f.endMain = value => value
  assert.equal(f.inspect({ admissionOnly: true }).complete, false)
  const o = f.inspect()
  assert.throws(() => normalizeAdmission(f.e, {}, o, []), /no refresh authority/)
})

test('metadata effect retains resource, review, drain and existing real validation guards', t => {
  const f = fixture(t), { o } = proposal(f)
  for (const change of [
    x => { x.resource.candidate = id(8) },
    x => { x.resource.tree = id(8) },
    x => { x.resource.fullSuite = false },
    x => { x.reviewDigest = 'f'.repeat(64) },
    x => { x.protection.admins = false },
    x => { x.headRef = undefined },
    x => { x.advertisedBase.ref = 'other' },
    x => { x.baseMetadataRefreshOnly = false },
    x => { x.currentChecks = [{ id: 99, name: 'Full check', head: x.head,
      appId: 15368, status: 'completed', conclusion: 'failure' }] },
  ]) {
    const candidate = structuredClone(o)
    change(candidate)
    assert.equal(settled(f.e, candidate).status, 'stop', change.toString())
  }
  o.runs = [{ id: 99, attempt: 1, status: 'in_progress' }]
  assert.match(settled(f.e, o).reason, /Drain all current and stale/)
})

test('already-failed Ready parent-identity preflight requires separate recovery, not an exemption', t => {
  const f = fixture(t)
  f.e.fullCheckPolicy = 'sharded-v1'
  const { o } = proposal(f)
  const failed = { id: 101, attempt: 1, workflow: SHARDED_FULL_GATE.workflow,
    event: 'pull_request', head: o.head, base: o.advertisedBase.sha, merge: o.synthetic.sha,
    status: 'completed', conclusion: 'failure', job: 'Full check', jobConclusion: 'failure',
    appId: 15368, app: 'github-actions', checkId: 201, identityVerified: false,
    validationVerified: false, startedAt: '2026-10-19T22:45:00Z',
    steps: SHARDED_FULL_GATE.steps.map((name, index) => ({ name,
      conclusion: index < 5 ? 'success' : index === 5 ? 'failure' : 'skipped' })) }
  // This is the observed Full shape: old event base, current checkout, failed
  // parent guard, and no validation stages executed. It is not a test-suite pass
  // or a genuine test assertion failure, but cannot authorize recovery here.
  o.runs = [failed]
  o.currentChecks = [{ id: failed.checkId, name: failed.job, head: o.head, appId: 15368,
    status: 'completed', conclusion: 'failure', startedAt: failed.startedAt }]
  const retained = structuredClone(o.runs)
  for (const advertised of [o.advertisedBase.sha, o.base]) {
    const candidate = structuredClone(o)
    candidate.advertisedBase.sha = advertised
    if (advertised === o.base) delete candidate.baseMetadataRefreshOnly
    const stopped = settled(f.e, candidate)
    assert.equal(stopped.status, 'stop')
    assert.equal(stopped.action, null)
    assert.match(stopped.reason, /Failed, canceled, skipped or unverified current gate/)
    assert.deepEqual(candidate.runs, retained, 'Never relabel historical failure or manufacture success')
    // A genuine failure on the intended exact tuple must remain blocked too.
    candidate.runs[0].base = candidate.base
    candidate.runs[0].steps[5].conclusion = 'success'
    candidate.runs[0].steps[6].conclusion = 'failure'
    assert.equal(settled(f.e, candidate).status, 'stop')
  }
})

test('metadata mutation uses only the same fixed PR and base=main, never retarget or force', t => {
  const f = fixture(t), { decision } = proposal(f)
  assert.deepEqual(mutationArguments(f.e.pr, decision.action), [
    'api', '--hostname', 'github.com', '--method', 'PATCH', `repos/${REPO}/pulls/${f.e.pr}`,
    '-f', 'base=main',
  ])
  for (const change of [a => { a.baseRef = 'other' }, a => { a.merge = null },
    a => { a.tree = null }, a => { a.previousBase = a.base }, a => { a.headRef = null }]) {
    const action = structuredClone(decision.action)
    change(action)
    assert.throws(() => mutationArguments(f.e.pr, action))
  }
})

test('unknown metadata PATCH outcome retains durable intent and is never automatically replayed', t => {
  const f = fixture(t), { o, decision } = proposal(f), path = join(f.directory, 'journal.json')
  let writes = 0
  const result = submitPilot({ ...armed(f.e, decision), apply: true,
    observe: () => ({ ...o, observedAt: now + 60_000 }),
    persist: (checkpoint, receipt) => atomicWrite(path, { checkpoint, receipt }),
    transport: args => {
      writes++
      const durable = JSON.parse(readFileSync(path))
      assert.equal(durable.receipt.status, 'intent')
      assert.deepEqual(durable.checkpoint.pending, decision.action)
      assert.equal(args.at(-1), 'base=main')
      throw new Error('connection lost after request; remote outcome unknown')
    },
  })
  assert.equal(result.status, 'uncertain')
  const saved = JSON.parse(readFileSync(path))
  assert.equal(saved.receipt.status, 'uncertain')
  const stillStale = decide(f.e, { ...o, observedAt: now + 60_000 }, saved.checkpoint, now + 60_000)
  assert.equal(stillStale.status, 'stop')
  assert.match(stillStale.reason, /metadata refresh outcome uncertain/i)
  assert.deepEqual(stillStale.checkpoint.pending, decision.action)
  assert.throws(() => submitPilot({ ...armed(f.e, stillStale), apply: true,
    observe: () => o, persist: () => {}, transport: () => { writes++ } }))
  assert.equal(writes, 1)
  // A later GET may prove the already-submitted effect without replaying it.
  f.pr.base.sha = f.main
  const readback = f.inspect()
  const reconciled = decide(f.e, { ...readback, observedAt: now + 60_000 }, saved.checkpoint, now + 60_000)
  assert.equal(reconciled.status, 'wait')
  assert.equal(reconciled.checkpoint.pending, null)
  assert.deepEqual(reconciled.checkpoint.baseMetadataRefresh, decision.action)
  assert.equal(settled(f.e, readback, reconciled.checkpoint, now + 60_000).action.kind, 'ready')
  assert.equal(writes, 1, 'reconciliation and Ready proposal must not submit a second mutation')
})

test('returned PATCH body is not confirmation and stale or drifted readback cannot reach Ready', t => {
  const f = fixture(t), { o, decision } = proposal(f)
  let saved
  const result = submitPilot({ ...armed(f.e, decision), apply: true,
    observe: () => ({ ...o, observedAt: now + 60_000 }),
    persist: checkpoint => { saved = structuredClone(checkpoint) },
    transport: () => JSON.stringify({ ...f.pr, base: { ...f.pr.base, sha: f.main } }),
  })
  assert.equal(result.status, 'submitted')
  assert.equal(decide(f.e, o, saved, now).status, 'stop')
  f.pr.base.sha = f.main
  const readback = f.inspect()
  for (const change of [
    x => { x.head = id(8) }, x => { x.base = id(8) }, x => { x.headRef = 'renamed' },
    x => { x.advertisedBase.ref = 'other' }, x => { x.advertisedBase.repo = 'elsewhere/repo' },
    x => { x.draft = false }, x => { x.merged = true }, x => { x.upToDate = false },
    x => { x.synthetic.sha = id(8) }, x => { x.synthetic.tree = id(8) },
    x => { x.synthetic.parents[0] = id(8) }, x => { x.headCommit.tree = id(8) },
  ]) {
    const changed = structuredClone(readback)
    change(changed)
    const stopped = decide(f.e, changed, saved, now)
    assert.equal(stopped.status, 'stop', change.toString())
    assert.deepEqual(stopped.checkpoint.pending, decision.action)
  }
  const reconciled = settled(f.e, readback, saved)
  assert.equal(reconciled.action.kind, 'ready')
  const staleAgain = structuredClone(o)
  assert.equal(settled(f.e, staleAgain, reconciled.checkpoint, now + 60_000).status, 'stop')
})

test('metadata writer rechecks exact plan and remains dry-run or blocked on changed refs', t => {
  const f = fixture(t), { o, decision } = proposal(f)
  const forbidden = () => { throw new Error('unexpected effect') }
  assert.equal(submitPilot({ ...armed(f.e, decision), observe: forbidden,
    persist: forbidden, transport: forbidden }).status, 'dry-run')
  for (const change of [x => { x.headRef = 'renamed' }, x => { x.base = id(8) },
    x => { x.advertisedBase.sha = id(8) }, x => { x.synthetic.tree = id(8) },
    x => { x.runs = [{ id: 99, attempt: 1, status: 'queued' }] }]) {
    const changed = structuredClone(o)
    changed.observedAt = now + 60_000
    change(changed)
    assert.throws(() => submitPilot({ ...armed(f.e, decision), apply: true,
      observe: () => changed, persist: forbidden, transport: forbidden }))
  }
  // The persisted action is exactly the separately reviewed one, not Ready plus PATCH.
  assert.deepEqual(recordIntent(decision).pending, decision.action)
})
