import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test from 'node:test'
import { REPO, GATES, browserRequired, decide, digest, recordIntent, sha256, validateEntry } from '../scripts/integration-queue/policy.mjs'
import { GitHubReader, checkoutSha } from '../scripts/integration-queue/github.mjs'
import { atomicWrite, trustedFile } from '../scripts/integration-queue/cli.mjs'
import { resourcePreflight, productionOnlyProposal } from '../scripts/integration-queue/resources.mjs'
import { helperFingerprint, productionFingerprint } from '../scripts/orchestration/test-runner.mjs'

const id = n => n.toString(16).padStart(40, '0')
const h = 'a'.repeat(64)
const now = 1_000_000
function entry() {
  return { version: 1, repo: REPO, pr: 123, baseRef: 'main', sourceHead: id(1), sourceTree: id(2), reviewBase: id(3),
    approvedBy: 'parent', allowMechanicalRefresh: true, requireBrowser: false,
    review: { reviewer: 'independent-reviewer', decision: 'ACCEPT', head: id(1), base: id(3), sha256: h, file: '/trusted/review.md' },
    workflowHashes: Object.fromEntries(GATES.map(g => [g.workflow, h])),
    deployment: { environment: 'production', url: 'https://example.test' } }
}
function observation(e = entry()) {
  return { repo: REPO, pr: e.pr, baseRef: 'main', observedAt: now, consistent: true, complete: true,
    reviewDigest: h, head: e.sourceHead, headCommit: { sha: e.sourceHead, tree: e.sourceTree, parents: [e.reviewBase] },
    base: e.reviewBase, draft: true, state: 'open', merged: false, mergeable: true, mergeState: 'clean',
    protection: { strict: true, admins: true, pullRequests: true, noBypass: true, fullCheck: true, supported: true },
    workflows: GATES.map(g => ({ path: g.workflow, sha256: h })), upToDate: true, changedPaths: ['app/page.tsx'],
    synthetic: { sha: id(4), tree: id(5), parents: [e.reviewBase, e.sourceHead] }, runs: [],
    resource: { status: 'observed', fullSuite: true, candidate: id(4), tree: id(5), parallelEligibility: 'production-config-runtime-drift' } }
}
function green(o, gate, index) {
  return { id: 100 + index, attempt: 1, workflow: gate.workflow, event: 'pull_request', head: o.head, base: o.base,
    merge: o.synthetic.sha, status: 'completed', conclusion: 'success', updatedAt: 'time', url: `https://github.com/${REPO}/actions/runs/${100 + index}`,
    identityVerified: true, app: 'github-actions', appId: 15368, job: gate.job, jobConclusion: 'success',
    steps: gate.steps.map(name => ({ name, conclusion: 'success' })) }
}
function settled(e, o, saved = null) {
  const first = decide(e, o, saved, now)
  if (first.status !== 'wait') return first
  return decide(e, { ...o, observedAt: now + 60_000 }, first.checkpoint, now + 60_000)
}
function ready() {
  const e = entry(), o = observation(e)
  o.draft = false
  o.runs = GATES.map((g, i) => green(o, g, i))
  return { e, o }
}

test('allowlist binds fixed repository, exact content and independent source review', () => {
  validateEntry(entry())
  for (const mutate of [e => { e.repo = 'other/repo' }, e => { e.sourceTree = null }, e => { e.review.head = id(8) },
    e => { e.review.decision = 'COMMENT' }, e => { e.approvedBy = e.review.reviewer }, e => { delete e.workflowHashes[GATES[1].workflow] }]) {
    const e = entry(); mutate(e); assert.throws(() => validateEntry(e))
  }
})

test('dry-run has no effects, waits for drain and gives a bounded ready proposal', () => {
  const e = entry(), o = observation(e)
  const before = JSON.stringify(o)
  assert.equal(decide(e, o, null, now).status, 'wait')
  const result = settled(e, o)
  assert.equal(result.action.kind, 'ready')
  assert.equal(result.checkpoint.pending, null)
  assert.equal(JSON.stringify(o), before)
})

test('fake GitHub sequence survives restart after each intent and verifies merge/deployment', () => {
  const directory = mkdtempSync(join(tmpdir(), 'pnd-queue-resume-'))
  try {
    const path = join(directory, 'state.json'), e = entry(), o = observation(e)
    let d = settled(e, o)
    const persist = () => { atomicWrite(path, recordIntent(d)); return JSON.parse(readFileSync(path, 'utf8')) }
    let state = persist()
    // Fake ready CAS; persist precedes effect, just as a future adapter must do.
    assert.equal(state.pending.head, o.head); o.draft = false
    o.runs = GATES.map((g, i) => green(o, g, i))
    d = settled(e, o, state)
    assert.equal(d.action.kind, 'merge')
    state = persist()
    assert.deepEqual([state.pending.head, state.pending.base], [o.head, o.base])
    o.merged = true; o.state = 'closed'
    o.mergeCommit = { sha: id(10), tree: o.synthetic.tree, parents: [o.base, o.head] }; o.base = id(10)
    d = decide(e, o, state, now)
    assert.equal(d.status, 'wait')
    atomicWrite(path, d.checkpoint)
    o.deployment = { sha: id(10), ...e.deployment, state: 'success' }
    d = decide(e, o, JSON.parse(readFileSync(path)), now)
    assert.equal(d.status, 'done')
    assert.equal(d.checkpoint.pending, null)
  } finally { rmSync(directory, { recursive: true }) }
})

test('a delayed old draft run resets the quiet window; reordering does not change identity', () => {
  const { e, o } = ready()
  let d = decide(e, o, null, now)
  o.runs.push({ id: 5, attempt: 2, workflow: GATES[0].workflow, head: id(9), base: id(8), status: 'queued' })
  d = decide(e, { ...o, observedAt: now + 60_000 }, d.checkpoint, now + 60_000)
  assert.equal(d.status, 'wait'); assert.equal(d.checkpoint.quiet, null)
  o.runs.at(-1).status = 'completed'; o.runs.at(-1).conclusion = 'failure'
  d = decide(e, { ...o, observedAt: now + 61_000 }, d.checkpoint, now + 61_000)
  assert.equal(d.status, 'wait')
  o.runs.reverse()
  d = decide(e, { ...o, observedAt: now + 121_000 }, d.checkpoint, now + 121_000)
  assert.equal(d.action.kind, 'merge')
})

test('current canceled or failed rerun cannot fall back to an older green result', () => {
  for (const conclusion of ['failure', 'cancelled', 'skipped', 'neutral', 'timed_out', 'action_required']) {
    const { e, o } = ready()
    o.runs.push({ ...o.runs[0], id: 200, conclusion, merge: null })
    assert.match(settled(e, o).reason, /Failed, canceled, skipped/)
  }
})

test('missing browser coverage cannot be disabled by allowlist for changed UI paths', () => {
  const { e, o } = ready(); o.runs.pop()
  assert.match(settled(e, o).reason, /Missing.*Tutorial browser/)
  o.changedPaths = ['engineering/notes.md']
  assert.equal(settled(e, o).action.kind, 'merge')
  e.requireBrowser = true
  assert.match(settled(e, o).reason, /Missing.*Tutorial browser/)
  assert.equal(browserRequired(['scripts/tutorial-browser/check.mjs']), true)
})

test('mandatory job/stage, app and source identity are all required', () => {
  for (const mutate of [o => { o.runs[0].appId = 99 }, o => { o.runs[0].merge = id(90) }, o => { o.runs[0].identityVerified = false },
    o => { o.runs[0].steps[2].conclusion = 'skipped' }, o => { o.runs[0].job = 'Full check duplicate' },
    o => { o.runs[0].base = id(99) }, o => { o.synthetic.parents.reverse() }]) {
    const { e, o } = ready(); mutate(o); assert.equal(settled(e, o).status, 'stop')
  }
})

test('source/base/workflow/protection/review drift fails closed', () => {
  for (const mutate of [o => { o.head = id(99) }, o => { o.headCommit.tree = id(99) }, o => { o.baseRef = 'release' },
    o => { o.workflows[0].sha256 = 'b'.repeat(64) }, o => { o.protection.admins = false }, o => { o.protection.strict = false },
    o => { o.protection.fullCheck = false }, o => { o.protection.noBypass = false }, o => { o.reviewDigest = 'b'.repeat(64) },
    o => { o.complete = false }, o => { o.consistent = false }, o => { o.mergeable = false }, o => { o.resource.candidate = id(99) }]) {
    const { e, o } = ready(); mutate(o); assert.equal(settled(e, o).status, 'stop')
  }
})

test('refresh needs disjoint clean Git tree proof, exact parents and one-refresh bound', () => {
  const e = entry(), o = observation(e)
  o.upToDate = false; o.base = id(8)
  o.refresh = { sourceHead: o.head, reviewBase: e.reviewBase, base: o.base, clean: true, disjoint: true, tree: id(9) }
  let d = settled(e, o)
  assert.equal(d.action.kind, 'refresh')
  const intent = recordIntent(d)
  assert.match(decide(e, o, intent, now).reason, /uncertain/)
  o.head = id(10); o.headCommit = { sha: id(10), parents: [e.sourceHead, o.base], tree: id(9) }
  o.upToDate = true; o.synthetic.parents = [o.base, o.head]
  d = settled(e, o, intent)
  assert.equal(d.action.kind, 'ready')
  assert.equal(d.checkpoint.head, id(10))
  const forged = structuredClone(o); forged.headCommit.tree = id(11)
  assert.match(decide(e, forged, intent, now).reason, /unexpected/)
  o.upToDate = false; o.base = id(12)
  assert.match(settled(e, o, d.checkpoint).reason, /one-refresh bound/)
})

test('overlap and uncertain ready/merge never retry a mutation', () => {
  const e = entry(), o = observation(e)
  let d = settled(e, o)
  assert.match(decide(e, o, recordIntent(d), now).reason, /Ready transition outcome uncertain/)
  o.upToDate = false
  o.refresh = { sourceHead: o.head, base: o.base, reviewBase: e.reviewBase, tree: id(9), clean: true, disjoint: false }
  assert.match(settled(e, o).reason, /overlapping/)
  const r = ready(); d = settled(r.e, r.o)
  assert.match(decide(r.e, r.o, recordIntent(d), now).reason, /Merge outcome uncertain/)
})

test('uncertain merge can reconcile success, but rejects wrong tree, parents or deployment', () => {
  for (const change of [o => { o.mergeCommit.tree = id(88) }, o => { o.mergeCommit.parents.reverse() },
    o => { o.base = id(88) }, o => { o.deployment.sha = id(88) }, o => { o.deployment.state = 'failure' }]) {
    const { e, o } = ready(), state = recordIntent(settled(e, o))
    o.merged = true; o.mergeCommit = { sha: id(12), tree: o.synthetic.tree, parents: [o.base, o.head] }; o.base = id(12)
    o.deployment = { sha: id(12), ...e.deployment, state: 'success' }; change(o)
    assert.equal(decide(e, o, state, now).status, 'stop')
  }
})

test('checkpoint cannot silently extend authorization or replace the reviewed head', () => {
  const e = entry(), o = observation(e), saved = decide(e, o, null, now).checkpoint
  e.requireBrowser = true
  assert.match(decide(e, o, saved, now).reason, /authorization changed/)
  e.requireBrowser = false; saved.head = id(88); o.head = id(88)
  assert.match(decide(e, o, saved, now).reason, /Reviewed source content/)
  assert.equal(decide(e, { ...o, observedAt: now - 60_001 }, saved, now).status, 'stop')
})

test('checkout proof needs exactly one real checkout hash, not arbitrary log text', () => {
  const log = `2026-10-16T12:00:00.000Z [command]/usr/bin/git log -1 --format=%H\n2026-10-16T12:00:00.001Z ${id(4)}\n`
  assert.equal(checkoutSha(log), id(4))
  assert.equal(checkoutSha(`${log}${log}`), null)
  assert.equal(checkoutSha(`Tested merge: ${id(4)}`), null)
})

function repoFixture() {
  const dir = mkdtempSync(join(tmpdir(), 'pnd-queue-git-'))
  const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim()
  git('init', '-q'); git('config', 'user.email', 'test@example.test'); git('config', 'user.name', 'Test')
  const put = (path, body) => { mkdirSync(join(dir, path, '..'), { recursive: true }); writeFileSync(join(dir, path), body) }
  put('file.txt', 'initial\n'); git('add', '.'); git('commit', '-qm', 'base')
  return { dir, git, put }
}

test('real Git merge-tree proof preserves contents and modes; path overlap stops refresh', () => {
  const { dir, git, put } = repoFixture()
  try {
    const base = git('rev-parse', 'HEAD')
    put('source.txt', 'reviewed\n'); git('add', '.'); git('commit', '-qm', 'source')
    const source = git('rev-parse', 'HEAD')
    git('checkout', '-q', '--detach', base); put('main.txt', 'accepted main\n'); git('add', '.'); git('commit', '-qm', 'main')
    const main = git('rev-parse', 'HEAD'), reader = new GitHubReader({ cwd: dir })
    const proof = reader.refresh({ reviewBase: base }, source, main)
    assert.equal(proof.clean, true); assert.equal(proof.disjoint, true)
    assert.equal(git('show', `${proof.tree}:source.txt`), 'reviewed')
    assert.equal(git('show', `${proof.tree}:main.txt`), 'accepted main')
    put('source.txt', 'overlap\n'); git('add', '.'); git('commit', '-qm', 'overlap')
    assert.equal(reader.refresh({ reviewBase: base }, source, git('rev-parse', 'HEAD')).disjoint, false)
    assert.equal(git('status', '--porcelain'), '')
  } finally { rmSync(dir, { recursive: true }) }
})

test('GitHub adapter uses only hostname-pinned GET argv and rejects incomplete pages', () => {
  const calls = []
  const reader = new GitHubReader({ execute: (command, args) => { calls.push([command, args]); return JSON.stringify({ items: [{ id: 1 }] }) } })
  assert.deepEqual(reader.pages(`repos/${REPO}/fake`, 'items'), [{ id: 1 }])
  assert.deepEqual(calls[0][1].slice(0, 6), ['api', '--hostname', 'github.com', '--method', 'GET', `repos/${REPO}/fake?per_page=100&page=1`])
  assert.throws(() => reader.get('repos/other/repo/pulls/1'))
  const capped = new GitHubReader({ execute: () => JSON.stringify({ total_count: 1000, items: [] }) })
  assert.throws(() => capped.pages(`repos/${REPO}/fake`, 'items'), /cap reached/)
})

test('apply is disabled before any GitHub call; candidate approval files are rejected', () => {
  const cli = resolve('scripts/integration-queue/cli.mjs')
  const output = spawnSync(process.execPath, [cli, '--apply'], { encoding: 'utf8', env: { ...process.env, PATH: '/nonexistent' } })
  assert.equal(output.status, 2); assert.match(output.stderr, /Live mutations are disabled/)
  const dir = mkdtempSync(join(tmpdir(), 'pnd-queue-trust-'))
  try {
    const file = join(dir, 'review.md'); writeFileSync(file, 'ACCEPT')
    const candidate = join(dir, 'candidate'); mkdirSync(candidate)
    assert.throws(() => trustedFile(file, dir, sha256('ACCEPT')), /candidate checkout/)
    assert.throws(() => trustedFile(file, candidate, h), /SHA-256 mismatch/)
    assert.equal(trustedFile(file, candidate, sha256('ACCEPT')).toString(), 'ACCEPT')
  } finally { rmSync(dir, { recursive: true }) }
})

test('resource preflight reports serial fallback without changing policy or running tests', () => {
  const { dir, git, put } = repoFixture()
  try {
    put('.gitignore', 'node_modules/\n'); put('app/a.ts', 'export const a = 1\n')
    put('tests/a.test.mjs', 'throw new Error("must never execute")\n')
    for (const path of ['package.json', 'package-lock.json', 'tsconfig.json', 'node_modules/.package-lock.json']) put(path, '{}\n')
    const policy = { version: 1, helpersSha256: helperFingerprint(dir), productionSha256: h, parallel: {} }
    put('engineering/test-resources.json', JSON.stringify(policy)); git('add', '.'); git('commit', '-qm', 'candidate')
    const before = readFileSync(join(dir, 'engineering/test-resources.json'), 'utf8')
    const preflight = resourcePreflight(dir, git)
    assert.equal(preflight.status, 'observed'); assert.equal(preflight.fullSuite, true)
    assert.equal(preflight.parallelEligibility, 'production-config-runtime-drift')
    assert.deepEqual(preflight.groups, [{ concurrency: 1, files: 1 }])
    assert.throws(() => productionOnlyProposal(dir, preflight, { productionSha256: productionFingerprint(dir) }), /Resource approval/)
    assert.equal(readFileSync(join(dir, 'engineering/test-resources.json'), 'utf8'), before)
    put('file.txt', 'dirty\n'); assert.equal(resourcePreflight(dir, git).status, 'blocked')
  } finally { rmSync(dir, { recursive: true }) }
})
