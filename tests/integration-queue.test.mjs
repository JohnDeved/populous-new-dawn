import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import {
  mkdtempSync,
  readFileSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  chmodSync,
  symlinkSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test, { after } from 'node:test'
import { stripVTControlCharacters } from 'node:util'
import {
  REPO,
  CLOUDFLARE,
  GATES,
  browserRequired,
  decide,
  recordIntent,
  sha256,
  validateEntry,
} from '../scripts/integration-queue/policy.mjs'
import {
  GitHubReader,
  checkoutSha,
  logIdentity,
  cloudflareCheck,
} from '../scripts/integration-queue/github.mjs'
import {
  proposedPlan,
  submitPilot,
  mutationArguments,
} from '../scripts/integration-queue/writer.mjs'
import { atomicWrite, trustedFile } from '../scripts/integration-queue/cli.mjs'
import {
  resourcePreflight,
  productionOnlyProposal,
} from '../scripts/integration-queue/resources.mjs'
import { helperFingerprint, productionFingerprint } from '../scripts/orchestration/test-runner.mjs'

// Synthetic resource inventories model an uncustomized Node runtime. Keep this
// isolation inside the test process; production preflight must still fail closed
// to serial execution for each customization exercised below.
const inheritedRuntime = Object.fromEntries(
  ['NODE_OPTIONS', 'NODE_PATH', 'NODE_COMPILE_CACHE', 'NODE_V8_COVERAGE']
    .map(key => [key, process.env[key]])
)
for (const key of Object.keys(inheritedRuntime)) process.env[key] = ''
after(() => {
  for (const [key, value] of Object.entries(inheritedRuntime)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

const id = n => n.toString(16).padStart(40, '0')
const h = 'a'.repeat(64)
const now = 1_000_000
function entry() {
  return {
    version: 1,
    repo: REPO,
    pr: 123,
    baseRef: 'main',
    sourceHead: id(1),
    sourceTree: id(2),
    reviewBase: id(3),
    approvedBy: 'parent',
    allowMechanicalRefresh: true,
    requireBrowser: false,
    review: {
      reviewer: 'independent-reviewer',
      decision: 'ACCEPT',
      head: id(1),
      base: id(3),
      sha256: h,
      file: '/trusted/review.md',
    },
    workflowHashes: Object.fromEntries(GATES.map(g => [g.workflow, h])),
    deployment: { environment: 'production', url: 'https://example.test' },
  }
}
function observation(e = entry()) {
  return {
    repo: REPO,
    pr: e.pr,
    baseRef: 'main',
    observedAt: now,
    consistent: true,
    complete: true,
    reviewDigest: h,
    head: e.sourceHead,
    headCommit: { sha: e.sourceHead, tree: e.sourceTree, parents: [e.reviewBase] },
    base: e.reviewBase,
    draft: true,
    state: 'open',
    merged: false,
    mergeable: true,
    mergeState: 'clean',
    protection: {
      strict: true,
      admins: true,
      pullRequests: true,
      noBypass: true,
      fullCheck: true,
      supported: true,
    },
    workflows: GATES.map(g => ({ path: g.workflow, sha256: h })),
    upToDate: true,
    changedPaths: ['app/page.tsx'],
    synthetic: { sha: id(4), tree: id(5), parents: [e.reviewBase, e.sourceHead] },
    runs: [],
    currentChecks: [],
    resource: {
      status: 'observed',
      fullSuite: true,
      candidate: id(4),
      tree: id(5),
      parallelEligibility: 'production-config-runtime-drift',
    },
  }
}
function green(o, gate, index) {
  return {
    id: 100 + index,
    attempt: 1,
    workflow: gate.workflow,
    event: 'pull_request',
    head: o.head,
    base: o.base,
    merge: o.synthetic.sha,
    status: 'completed',
    conclusion: 'success',
    updatedAt: '2026-10-16T18:01:00Z',
    startedAt: '2026-10-16T18:00:00Z',
    checkId: 300 + index,
    url: `https://github.com/${REPO}/actions/runs/${100 + index}`,
    identityVerified: true,
    app: 'github-actions',
    appId: 15368,
    job: gate.job,
    jobConclusion: 'success',
    steps: gate.steps.map(name => ({ name, conclusion: 'success' })),
  }
}
function checksFor(runs) {
  return runs.map(r => ({
    id: r.checkId,
    name: r.job,
    appId: r.appId,
    head: r.head,
    startedAt: r.startedAt,
    status: r.status,
    conclusion: r.jobConclusion,
  }))
}
function settled(e, o, saved = null) {
  const first = decide(e, o, saved, now)
  if (first.status !== 'wait') return first
  return decide(e, { ...o, observedAt: now + 60_000 }, first.checkpoint, now + 60_000)
}
function ready() {
  const e = entry(),
    o = observation(e)
  o.draft = false
  o.runs = GATES.map((g, i) => green(o, g, i))
  o.currentChecks = checksFor(o.runs)
  return { e, o }
}

test('allowlist binds fixed repository, exact content and independent source review', () => {
  validateEntry(entry())
  for (const mutate of [
    e => {
      e.repo = 'other/repo'
    },
    e => {
      e.sourceTree = null
    },
    e => {
      e.review.head = id(8)
    },
    e => {
      e.review.decision = 'COMMENT'
    },
    e => {
      e.approvedBy = e.review.reviewer
    },
    e => {
      delete e.workflowHashes[GATES[1].workflow]
    },
  ]) {
    const e = entry()
    mutate(e)
    assert.throws(() => validateEntry(e))
  }
})

test('dry-run has no effects, waits for drain and gives a bounded ready proposal', () => {
  const e = entry(),
    o = observation(e)
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
    const path = join(directory, 'state.json'),
      e = entry(),
      o = observation(e)
    let d = settled(e, o)
    const persist = () => {
      atomicWrite(path, recordIntent(d))
      return JSON.parse(readFileSync(path, 'utf8'))
    }
    let state = persist()
    // Fake ready CAS; persist precedes effect, just as a future adapter must do.
    assert.equal(state.pending.head, o.head)
    o.draft = false
    o.runs = GATES.map((g, i) => green(o, g, i))
    o.currentChecks = checksFor(o.runs)
    d = settled(e, o, state)
    assert.equal(d.action.kind, 'merge')
    state = persist()
    assert.deepEqual([state.pending.head, state.pending.base], [o.head, o.base])
    o.merged = true
    o.state = 'closed'
    o.mergeCommit = { sha: id(10), tree: o.synthetic.tree, parents: [o.base, o.head] }
    o.base = id(10)
    d = decide(e, o, state, now)
    assert.equal(d.status, 'wait')
    atomicWrite(path, d.checkpoint)
    o.deployment = { sha: id(10), ...e.deployment, state: 'success' }
    d = decide(e, o, JSON.parse(readFileSync(path)), now)
    assert.equal(d.status, 'done')
    assert.equal(d.checkpoint.pending, null)
  } finally {
    rmSync(directory, { recursive: true })
  }
})

test('a delayed old draft run resets the quiet window; reordering does not change identity', () => {
  const { e, o } = ready()
  let d = decide(e, o, null, now)
  o.runs.push({
    id: 5,
    attempt: 2,
    workflow: GATES[0].workflow,
    head: id(9),
    base: id(8),
    status: 'queued',
  })
  d = decide(e, { ...o, observedAt: now + 60_000 }, d.checkpoint, now + 60_000)
  assert.equal(d.status, 'wait')
  assert.equal(d.checkpoint.quiet, null)
  o.runs.at(-1).status = 'completed'
  o.runs.at(-1).conclusion = 'failure'
  d = decide(e, { ...o, observedAt: now + 61_000 }, d.checkpoint, now + 61_000)
  assert.equal(d.status, 'wait')
  o.runs.reverse()
  d = decide(e, { ...o, observedAt: now + 121_000 }, d.checkpoint, now + 121_000)
  assert.equal(d.action.kind, 'merge')
})

test('current canceled or failed rerun cannot fall back to an older green result', () => {
  for (const conclusion of [
    'failure',
    'cancelled',
    'skipped',
    'neutral',
    'timed_out',
    'action_required',
  ]) {
    const { e, o } = ready()
    o.runs.push({
      ...o.runs[0],
      id: 200,
      conclusion,
      merge: null,
      startedAt: '2026-10-16T19:00:00Z',
    })
    assert.match(settled(e, o).reason, /Failed, canceled, skipped/)
  }
})

test('missing browser coverage cannot be disabled by allowlist for changed UI paths', () => {
  const { e, o } = ready()
  o.runs.pop()
  assert.match(settled(e, o).reason, /Missing.*Tutorial browser/)
  o.changedPaths = ['engineering/notes.md']
  assert.equal(settled(e, o).action.kind, 'merge')
  e.requireBrowser = true
  assert.match(settled(e, o).reason, /Missing.*Tutorial browser/)
  assert.equal(browserRequired(['scripts/tutorial-browser/check.mjs']), true)
})

test('mandatory job/stage, app and source identity are all required', () => {
  for (const mutate of [
    o => {
      o.runs[0].appId = 99
    },
    o => {
      o.runs[0].merge = id(90)
    },
    o => {
      o.runs[0].identityVerified = false
    },
    o => {
      o.runs[0].steps[2].conclusion = 'skipped'
    },
    o => {
      o.runs[0].job = 'Full check duplicate'
    },
    o => {
      o.runs[0].base = id(99)
    },
    o => {
      o.synthetic.parents.reverse()
    },
  ]) {
    const { e, o } = ready()
    mutate(o)
    assert.equal(settled(e, o).status, 'stop')
  }
})

test('source/base/workflow/protection/review drift fails closed', () => {
  for (const mutate of [
    o => {
      o.head = id(99)
    },
    o => {
      o.headCommit.tree = id(99)
    },
    o => {
      o.baseRef = 'release'
    },
    o => {
      o.workflows[0].sha256 = 'b'.repeat(64)
    },
    o => {
      o.protection.admins = false
    },
    o => {
      o.protection.strict = false
    },
    o => {
      o.protection.fullCheck = false
    },
    o => {
      o.protection.noBypass = false
    },
    o => {
      o.reviewDigest = 'b'.repeat(64)
    },
    o => {
      o.complete = false
    },
    o => {
      o.consistent = false
    },
    o => {
      o.mergeable = false
    },
    o => {
      o.resource.candidate = id(99)
    },
  ]) {
    const { e, o } = ready()
    mutate(o)
    assert.equal(settled(e, o).status, 'stop')
  }
})

test('refresh needs disjoint clean Git tree proof, exact parents and one-refresh bound', () => {
  const e = entry(),
    o = observation(e)
  o.upToDate = false
  o.base = id(8)
  o.refresh = {
    sourceHead: o.head,
    reviewBase: e.reviewBase,
    base: o.base,
    clean: true,
    disjoint: true,
    tree: id(9),
  }
  let d = settled(e, o)
  assert.equal(d.action.kind, 'refresh')
  const intent = recordIntent(d)
  assert.match(decide(e, o, intent, now).reason, /uncertain/)
  o.acceptedRefresh = structuredClone(o.refresh)
  o.head = id(10)
  o.headCommit = { sha: id(10), parents: [e.sourceHead, o.base], tree: id(9) }
  o.upToDate = true
  o.synthetic.parents = [o.base, o.head]
  d = settled(e, o, intent)
  assert.equal(d.action.kind, 'ready')
  assert.equal(d.checkpoint.head, id(10))
  const forged = structuredClone(o)
  forged.headCommit.tree = id(11)
  assert.match(decide(e, forged, intent, now).reason, /unexpected/)
  o.upToDate = false
  o.base = id(12)
  assert.match(settled(e, o, d.checkpoint).reason, /one-refresh bound/)
})

test('overlap and uncertain ready/merge never retry a mutation', () => {
  const e = entry(),
    o = observation(e)
  let d = settled(e, o)
  assert.match(decide(e, o, recordIntent(d), now).reason, /Ready transition outcome uncertain/)
  o.upToDate = false
  o.refresh = {
    sourceHead: o.head,
    base: o.base,
    reviewBase: e.reviewBase,
    tree: id(9),
    clean: true,
    disjoint: false,
  }
  assert.match(settled(e, o).reason, /overlapping/)
  const r = ready()
  d = settled(r.e, r.o)
  assert.match(decide(r.e, r.o, recordIntent(d), now).reason, /Merge outcome uncertain/)
})

test('uncertain merge can reconcile success, but rejects wrong tree, parents or deployment', () => {
  for (const change of [
    o => {
      o.mergeCommit.tree = id(88)
    },
    o => {
      o.mergeCommit.parents.reverse()
    },
    o => {
      o.base = id(88)
    },
    o => {
      o.deployment.sha = id(88)
    },
    o => {
      o.deployment.state = 'failure'
    },
  ]) {
    const { e, o } = ready(),
      state = recordIntent(settled(e, o))
    o.merged = true
    o.mergeCommit = { sha: id(12), tree: o.synthetic.tree, parents: [o.base, o.head] }
    o.base = id(12)
    o.deployment = { sha: id(12), ...e.deployment, state: 'success' }
    change(o)
    assert.equal(decide(e, o, state, now).status, 'stop')
  }
})

test('checkpoint cannot silently extend authorization or replace the reviewed head', () => {
  const e = entry(),
    o = observation(e),
    saved = decide(e, o, null, now).checkpoint
  e.requireBrowser = true
  assert.match(decide(e, o, saved, now).reason, /authorization changed/)
  e.requireBrowser = false
  saved.head = id(88)
  o.head = id(88)
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
  // Disposable fixtures own their Git configuration; production readers still inspect inherited config.
  const env = {
    ...Object.fromEntries(
      Object.entries(process.env).filter(([key]) => !/^GIT_CONFIG(?:_|$)/.test(key))
    ),
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_COUNT: '0',
  }
  const execute = (command, args, cwd = dir) =>
    execFileSync(command, args, { cwd, encoding: 'utf8', env })
  const git = (...args) => execute('git', args).trim()
  git('init', '-q')
  git('config', 'user.email', 'test@example.test')
  git('config', 'user.name', 'Test')
  const put = (path, body) => {
    mkdirSync(join(dir, path, '..'), { recursive: true })
    writeFileSync(join(dir, path), body)
  }
  put('file.txt', 'initial\n')
  git('add', '.')
  git('commit', '-qm', 'base')
  return { dir, git, put, execute, env }
}

test('real Git merge-tree proof preserves contents and modes; path overlap stops refresh', () => {
  const { dir, git, put, execute } = repoFixture()
  try {
    const base = git('rev-parse', 'HEAD')
    put('source.txt', 'reviewed\n')
    git('add', '.')
    chmodSync(join(dir, 'source.txt'), 0o755)
    git('add', 'source.txt')
    git('commit', '-qm', 'source')
    const source = git('rev-parse', 'HEAD')
    git('checkout', '-q', '--detach', base)
    put('main.txt', 'accepted main\n')
    git('add', '.')
    git('commit', '-qm', 'main')
    const main = git('rev-parse', 'HEAD'),
      reader = new GitHubReader({ cwd: dir, execute })
    const proof = reader.refresh({ reviewBase: base }, source, main)
    assert.equal(proof.clean, true)
    assert.equal(proof.disjoint, true)
    assert.equal(git('show', `${proof.tree}:source.txt`), 'reviewed')
    assert.match(git('ls-tree', proof.tree, 'source.txt'), /^100755 blob/)
    assert.equal(git('show', `${proof.tree}:main.txt`), 'accepted main')
    put('source.txt', 'overlap\n')
    git('add', '.')
    git('commit', '-qm', 'overlap')
    assert.equal(
      reader.refresh({ reviewBase: base }, source, git('rev-parse', 'HEAD')).disjoint,
      false
    )
    assert.equal(git('status', '--porcelain'), '')
  } finally {
    rmSync(dir, { recursive: true })
  }
})

test('stale advertised base admits only the original reviewed draft refresh', () => {
  const { dir, git, put, execute } = repoFixture()
  try {
    put('review.md', 'accepted source review\n')
    git('add', '.')
    git('commit', '-qm', 'review base')
    const base = git('rev-parse', 'HEAD')
    put('source.txt', 'reviewed source\n')
    git('add', '.')
    git('commit', '-qm', 'source')
    const source = git('rev-parse', 'HEAD'),
      tree = git('rev-parse', 'HEAD^{tree}')
    const stale = git('commit-tree', tree, '-p', base, '-p', source, '-m', 'old synthetic')
    git('checkout', '-q', '--detach', base)
    put('main.txt', 'new main\n')
    git('add', '.')
    git('commit', '-qm', 'main advancement')
    const main = git('rev-parse', 'HEAD')
    const refreshed = git('commit-tree', tree, '-p', source, '-p', main, '-m', 'refreshed head')
    const unrelated = git('commit-tree', tree, '-m', 'unrelated root')
    git('checkout', '-q', '--detach', source)
    const e = entry()
    Object.assign(e, { sourceHead: source, sourceTree: tree, reviewBase: base })
    Object.assign(e.review, {
      head: source,
      base,
      file: join(dir, 'review.md'),
      sha256: sha256(readFileSync(join(dir, 'review.md'))),
    })
    const original = {
      head: { sha: source, ref: 'reviewed', repo: { full_name: REPO } },
      base: { sha: base, ref: 'main', repo: { full_name: REPO } },
      draft: true,
      state: 'open',
      merged: false,
      mergeable: true,
      mergeable_state: 'behind',
      merge_commit_sha: stale,
      updated_at: 'unchanged',
    }
    function inspect({
      change = () => {},
      end = () => {},
      liveMain = main,
      endMain = liveMain,
      runs = [],
      allowed = e,
    } = {}) {
      const pr = structuredClone(original)
      change(pr)
      let prReads = 0,
        mainReads = 0
      const reader = new GitHubReader({ cwd: dir, execute })
      reader.get = endpoint => {
        if (endpoint.endsWith(`/pulls/${e.pr}`)) {
          const value = structuredClone(pr)
          if (prReads++) end(value)
          return value
        }
        if (endpoint.endsWith('/git/ref/heads/main'))
          return { object: { sha: mainReads++ ? endMain : liveMain } }
        throw new Error(`Unexpected fixture endpoint: ${endpoint}`)
      }
      reader.commit = sha => ({
        sha,
        tree: reader.git('rev-parse', `${sha}^{tree}`),
        parents: reader.git('show', '-s', '--format=%P', sha).split(' ').filter(Boolean),
      })
      reader.protection = () => observation().protection
      reader.workflow = (path, ref) => ({ path, ref, sha256: h })
      reader.runs = (_entry, _pr, synthetic) => {
        assert.equal(synthetic, undefined, 'old synthetic must never enter gate verification')
        return runs
      }
      reader.pages = () => []
      const result = reader.inspect(allowed, dir)
      result.resource = observation().resource
      result.observedAt = now
      return result
    }
    const o = inspect()
    assert.equal(o.complete, true, o.error)
    assert.equal(o.consistent, true)
    assert.deepEqual(o.advertisedBase, { sha: base, ref: 'main', repo: REPO })
    assert.equal(o.base, main)
    assert.equal(o.refreshOnly, true)
    assert.equal(o.synthetic, undefined)
    assert.deepEqual(o.staleSynthetic.parents, [base, source])
    const first = decide(e, o, null, now)
    assert.equal(first.status, 'wait')
    const decision = settled(e, o)
    assert.deepEqual(decision.action, {
      kind: 'refresh',
      head: source,
      base: main,
      tree: o.refresh.tree,
    })
    assert.equal(git('show', `${o.refresh.tree}:source.txt`), 'reviewed source')
    assert.equal(git('show', `${o.refresh.tree}:main.txt`), 'new main')
    const historical = green(observation(), GATES[0], 0)
    Object.assign(historical, { head: source, base, merge: stale, identityVerified: false })
    assert.equal(settled(e, inspect({ runs: [historical] })).action.kind, 'refresh')
    const changedStale = structuredClone(o)
    changedStale.staleSynthetic.sha = id(77)
    changedStale.observedAt = now + 60_000
    assert.equal(decide(e, changedStale, first.checkpoint, now + 60_000).status, 'wait')
    const active = inspect({ runs: [{ id: 1, attempt: 1, status: 'in_progress' }] })
    assert.match(settled(e, active).reason, /Drain all current and stale/)
    for (const mutate of [
      o => {
        o.draft = false
      },
      o => {
        o.upToDate = true
      },
      o => {
        o.synthetic = o.staleSynthetic
      },
    ]) {
      const forged = structuredClone(o)
      mutate(forged)
      assert.equal(settled(e, forged).status, 'stop', 'refresh-only cannot authorize ready/merge')
    }
    for (const options of [
      {
        change: p => {
          p.draft = false
        },
      },
      {
        change: p => {
          p.head.sha = main
        },
      },
      {
        change: p => {
          p.head.sha = refreshed
        },
      },
      {
        change: p => {
          p.base.sha = unrelated
        },
      },
      {
        change: p => {
          p.merge_commit_sha = source
        },
      },
      {
        change: p => {
          p.mergeable = null
        },
      },
      { liveMain: unrelated },
      { allowed: { ...e, sourceTree: id(99) } },
      { allowed: { ...e, allowMechanicalRefresh: false } },
      { endMain: source },
      {
        end: p => {
          p.base.sha = main
        },
      },
      {
        end: p => {
          p.base.ref = 'other'
        },
      },
      {
        end: p => {
          p.base.repo.full_name = 'elsewhere/repo'
        },
      },
      {
        end: p => {
          p.head.sha = main
        },
      },
    ])
      assert.equal(settled(options.allowed ?? e, inspect(options)).status, 'stop')
    git('checkout', '-q', '--detach', main)
    put('source.txt', 'overlap\n')
    git('add', '.')
    git('commit', '-qm', 'overlapping main')
    const overlapping = git('rev-parse', 'HEAD')
    assert.equal(settled(e, inspect({ liveMain: overlapping })).status, 'stop')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('GitHub adapter uses only hostname-pinned GET argv and rejects incomplete pages', () => {
  const calls = []
  const reader = new GitHubReader({
    execute: (command, args) => {
      calls.push([command, args])
      return JSON.stringify({ total_count: 1, items: [{ id: 1 }] })
    },
  })
  assert.deepEqual(reader.pages(`repos/${REPO}/fake`, 'items'), [{ id: 1 }])
  assert.deepEqual(calls[0][1].slice(0, 6), [
    'api',
    '--hostname',
    'github.com',
    '--method',
    'GET',
    `repos/${REPO}/fake?per_page=100&page=1`,
  ])
  assert.throws(() => reader.get('repos/other/repo/pulls/1'))
  const capped = new GitHubReader({
    execute: () => JSON.stringify({ total_count: 1000, items: [] }),
  })
  assert.throws(() => capped.pages(`repos/${REPO}/fake`, 'items'), /cap reached/)
})

test('escape opt-in is restricted to captured numeric job logs, never other GETs', () => {
  const calls = []
  const reader = new GitHubReader({
    execute: (_command, args) => {
      calls.push(args)
      return '{}'
    },
  })
  const endpoint = `repos/${REPO}/actions/jobs/117178077076/logs`
  reader.get(endpoint, true)
  assert.deepEqual(calls[0], [
    'api',
    '--hostname',
    'github.com',
    '--method',
    'GET',
    endpoint,
    '--allow-escape-sequences',
  ])
  reader.get(endpoint)
  assert.equal(calls[1].includes('--allow-escape-sequences'), false)
  for (const path of [
    `repos/${REPO}/pulls/505`,
    `${endpoint}?other=1`,
    `repos/${REPO}/actions/jobs/not-a-number/logs`,
    `repos/other/repo/actions/jobs/1/logs`,
  ])
    assert.throws(() => reader.get(path, true))
  assert.equal(calls.length, 2)
})

test('production log transport captures escape bytes without rendering child output', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pnd-queue-gh-'))
  const payload = '\x1b[31mraw-log\x1b[0m\x1b]52;c;Y2xpcGJvYXJk\x07\n'
  try {
    const gh = join(dir, 'gh')
    writeFileSync(
      gh,
      `#!${process.execPath}\n` +
        `
      const args = process.argv.slice(2)
      if (!args.includes('--allow-escape-sequences')) {
        process.stderr.write('the response contains terminal escape sequences')
        process.exit(1)
      }
      if (process.stdout.isTTY || process.stderr.isTTY || process.env.GH_PAGER !== 'cat')
        process.exit(9)
      process.stdout.write(${JSON.stringify(payload)})
      process.stderr.write(${JSON.stringify(payload)})
      process.exit(args[5].includes('/jobs/2/') ? 1 : 0)
    `
    )
    chmodSync(gh, 0o755)
    const readerModule = JSON.stringify(resolve('scripts/integration-queue/github.mjs'))
    const invoke = id =>
      spawnSync(
        process.execPath,
        [
          '--input-type=module',
          '-e',
          `
      import { GitHubReader } from ${readerModule}
      import { createHash } from 'node:crypto'
      try {
        const raw = new GitHubReader().get('repos/${REPO}/actions/jobs/${id}/logs', true)
        console.log(createHash('sha256').update(raw).digest('hex'))
      } catch (error) {
        console.error(error.message)
        process.exitCode = 7
      }
    `,
        ],
        {
          encoding: 'utf8',
          env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, GH_PAGER: 'must-not-run' },
        }
      )
    const success = invoke(1)
    assert.equal(success.status, 0, success.stderr)
    assert.equal(success.stdout.trim(), sha256(payload))
    assert.equal(success.stderr, '')
    const failed = invoke(2)
    assert.equal(failed.status, 7)
    assert.equal(failed.stdout, '')
    assert.match(failed.stderr, /raw-log/)
    assert.equal(failed.stderr, stripVTControlCharacters(failed.stderr))
    assert.ok(!failed.stderr.includes('Y2xpcGJvYXJk'))
    assert.notEqual(sha256(payload), sha256(stripVTControlCharacters(payload)))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('apply is disabled before any GitHub call; candidate approval files are rejected', () => {
  const cli = resolve('scripts/integration-queue/cli.mjs')
  const output = spawnSync(process.execPath, [cli, '--apply'], {
    encoding: 'utf8',
    env: { ...process.env, PATH: '/nonexistent' },
  })
  assert.equal(output.status, 2)
  assert.match(output.stderr, /Live mutations require/)
  const dir = mkdtempSync(join(tmpdir(), 'pnd-queue-trust-'))
  try {
    const file = join(dir, 'review.md')
    writeFileSync(file, 'ACCEPT')
    const candidate = join(dir, 'candidate')
    mkdirSync(candidate)
    assert.throws(() => trustedFile(file, dir, sha256('ACCEPT')), /candidate checkout/)
    assert.throws(() => trustedFile(file, candidate, h), /SHA-256 mismatch/)
    assert.equal(trustedFile(file, candidate, sha256('ACCEPT')).toString(), 'ACCEPT')
  } finally {
    rmSync(dir, { recursive: true })
  }
})

test('resource preflight reports serial fallback without changing policy or running tests', () => {
  const { dir, git, put } = repoFixture()
  try {
    put('.gitignore', 'node_modules/\n')
    put('app/a.ts', 'export const a = 1\n')
    put('tests/a.test.mjs', 'throw new Error("must never execute")\n')
    for (const path of [
      'package.json',
      'package-lock.json',
      'tsconfig.json',
      'node_modules/.package-lock.json',
    ])
      put(path, '{}\n')
    const policy = {
      version: 1,
      helpersSha256: helperFingerprint(dir),
      productionSha256: h,
      parallel: {},
    }
    put('engineering/test-resources.json', JSON.stringify(policy))
    git('add', '.')
    git('commit', '-qm', 'candidate')
    const before = readFileSync(join(dir, 'engineering/test-resources.json'), 'utf8')
    const preflight = resourcePreflight(dir, git)
    assert.equal(preflight.status, 'observed')
    assert.equal(preflight.fullSuite, true)
    assert.equal(preflight.parallelEligibility, 'production-config-runtime-drift')
    assert.deepEqual(preflight.groups, [{ concurrency: 1, files: 1 }])
    assert.throws(
      () =>
        productionOnlyProposal(dir, preflight, { productionSha256: productionFingerprint(dir) }),
      /Resource approval/
    )
    assert.equal(readFileSync(join(dir, 'engineering/test-resources.json'), 'utf8'), before)
    for (const key of Object.keys(inheritedRuntime)) {
      process.env[key] = key === 'NODE_OPTIONS' ? '--no-warnings' : '/fixture-runtime'
      try {
        const customized = resourcePreflight(dir, git)
        assert.equal(customized.status, 'observed')
        assert.equal(customized.fullSuite, true)
        assert.equal(customized.parallelEligibility, 'runtime-customization')
        assert.deepEqual(customized.groups, [{ concurrency: 1, files: 1 }])
        assert.equal(readFileSync(join(dir, 'engineering/test-resources.json'), 'utf8'), before)
      } finally {
        process.env[key] = ''
      }
    }
    put('file.txt', 'dirty\n')
    assert.equal(resourcePreflight(dir, git).status, 'blocked')
  } finally {
    rmSync(dir, { recursive: true })
  }
})

test('log source identities cannot be borrowed from a mutable PR association', () => {
  const log = `2026-10-16T12:00:00.000Z   PR_HEAD_SHA: ${id(1)}\n2026-10-16T12:00:00.001Z   PR_BASE_SHA: ${id(3)}\n2026-10-16T12:00:00.002Z [command]/usr/bin/git log -1 --format=%H\n2026-10-16T12:00:00.003Z ${id(4)}\n`
  assert.deepEqual(logIdentity(log), { head: id(1), base: id(3), merge: id(4) })
  assert.equal(logIdentity(`${log}PR_BASE_SHA: ${id(99)}\n`).base, null)
})

test('fake Actions adapter binds workflow/run/attempt/check/app and actual checkout logs', () => {
  const e = entry(),
    o = observation(e)
  let logBase = o.base,
    appId = 15368,
    attempt = 1,
    draft = false,
    draftFlag = true,
    draftValidationRan = false,
    workflowText = 'reviewed workflow',
    logSuffix = ''
  e.workflowHashes = Object.fromEntries(GATES.map(g => [g.workflow, sha256('reviewed workflow')]))
  const calls = []
  const capturedLogs = []
  const execute = (command, args) => {
    assert.equal(command, 'gh')
    assert.deepEqual(args.slice(0, 5), ['api', '--hostname', 'github.com', '--method', 'GET'])
    const endpoint = args[5]
    calls.push(endpoint)
    const gate =
      endpoint.includes('tutorial-browser') ||
      endpoint.includes('/runs/101') ||
      endpoint.includes('/jobs/201') ||
      endpoint.includes('/check-runs/301')
        ? GATES[1]
        : GATES[0]
    const index = GATES.indexOf(gate)
    const run = {
      id: 100 + index,
      run_attempt: attempt,
      head_sha: o.head,
      path: gate.workflow,
      event: 'pull_request',
      check_suite_id: 400 + index,
      status: 'completed',
      conclusion: draft ? 'failure' : 'success',
      updated_at: '2026-10-16T18:01:00Z',
      run_started_at: '2026-10-16T18:00:00Z',
      html_url: 'https://github.com/example',
      pull_requests: [{ number: e.pr, head: { sha: o.head }, base: { sha: o.base } }],
    }
    if (endpoint.includes('/actions/workflows/'))
      return JSON.stringify({ total_count: 1, workflow_runs: [{ ...run, run_attempt: 1 }] })
    if (endpoint.includes('/jobs?'))
      return JSON.stringify({
        total_count: 1,
        jobs: [
          {
            id: 200 + index,
            check_run_url: `https://api.github.com/repos/${REPO}/check-runs/${300 + index}`,
            name: draft && gate.draftJob ? gate.draftJob : gate.job,
            conclusion: draft ? 'failure' : 'success',
            steps: gate.steps.map((name, index) => ({
              name,
              conclusion: draft
                ? index === 0
                  ? 'failure'
                  : draftValidationRan
                    ? 'success'
                    : 'skipped'
                : 'success',
            })),
          },
        ],
      })
    if (endpoint.includes('/check-runs/'))
      return JSON.stringify({
        id: 300 + index,
        name: draft && gate.draftJob ? gate.draftJob : gate.job,
        check_suite: { id: 400 + index },
        head_sha: o.head,
        conclusion: draft ? 'failure' : 'success',
        app: { slug: 'github-actions', id: appId },
      })
    if (endpoint.endsWith('/logs')) {
      if (!args.includes('--allow-escape-sequences'))
        throw new Error('the response contains terminal escape sequences')
      const plain = draft
        ? `IS_DRAFT: ${draftFlag}\n`
        : `PR_HEAD_SHA: ${o.head}\nPR_BASE_SHA: ${logBase}\n[command]/usr/bin/git log -1 --format=%H\n${o.synthetic.sha}\n`
      const raw =
        plain.replaceAll('\n', '\x1b[0m\n\x1b[32m') + '\x1b]52;c;Y2xpcGJvYXJk\x07' + logSuffix
      capturedLogs.push(raw)
      return raw
    }
    if (endpoint.includes('/contents/'))
      return JSON.stringify({
        encoding: 'base64',
        content: Buffer.from(workflowText).toString('base64'),
      })
    if (endpoint.includes('/attempts/')) return JSON.stringify(run)
    throw new Error(`Unexpected fake request ${endpoint}`)
  }
  const reader = new GitHubReader({ execute })
  const pr = { head: { sha: o.head, ref: 'reviewed' }, base: { sha: o.base } }
  let runs = reader.runs(e, pr, o.synthetic)
  assert.equal(runs.length, 2)
  assert.ok(runs.every(r => r.identityVerified && r.validationVerified))
  assert.deepEqual(
    runs.map(r => r.logSha256),
    capturedLogs.map(raw => sha256(raw))
  )
  assert.ok(capturedLogs.every(raw => sha256(raw) !== sha256(stripVTControlCharacters(raw))))
  assert.ok(!JSON.stringify(runs).includes('Y2xpcGJvYXJk'))
  logSuffix = `PR_BASE_SHA: ${id(98)}\n`
  assert.ok(
    reader.runs(e, pr, o.synthetic).every(r => !r.identityVerified && !r.validationVerified)
  )
  logSuffix = `[command]/usr/bin/git log -1 --format=%H\n${o.synthetic.sha}\n`
  assert.ok(
    reader.runs(e, pr, o.synthetic).every(r => !r.identityVerified && !r.validationVerified)
  )
  logSuffix = ''
  assert.ok(reader.runs(e, pr, undefined).every(r => !r.identityVerified))
  assert.ok(calls.some(c => c.endsWith('/check-runs/300')))
  logBase = id(99)
  runs = reader.runs(e, pr, o.synthetic)
  assert.ok(runs.every(r => !r.identityVerified && r.validationVerified && r.base === id(99)))
  logBase = 'unverified'
  assert.ok(reader.runs(e, pr, o.synthetic).every(r => !r.validationVerified))
  logBase = o.base
  appId = 9
  assert.throws(() => reader.runs(e, pr, o.synthetic), /Check suite\/run\/app mismatch/)
  attempt = 2
  assert.throws(() => reader.runs(e, pr, o.synthetic), /identity drift/)
  attempt = 1
  appId = 15368
  draft = true
  const admissions = reader.runs(e, pr, o.synthetic)
  assert.equal(admissions[0].draftAdmission, true)
  assert.equal(admissions[1].draftAdmission, false)
  assert.ok(admissions.every(r => r.draftGuardOnly === true))
  draftValidationRan = true
  assert.ok(reader.runs(e, pr, o.synthetic).every(r => r.draftGuardOnly === false))
  draftValidationRan = false
  draftFlag = false
  assert.ok(
    reader
      .runs(e, pr, o.synthetic)
      .every(r => r.draftAdmission === false && r.draftGuardOnly === false)
  )
  draftFlag = true
  workflowText = 'changed workflow'
  assert.ok(
    reader
      .runs(e, pr, o.synthetic)
      .every(r => r.draftAdmission === false && r.draftGuardOnly === false)
  )
})

test('CLI fixture executes the full read-only path, reports preflight, and resumes its quiet checkpoint', () => {
  const { dir, git, put, env } = repoFixture()
  const trusted = mkdtempSync(join(tmpdir(), 'pnd-queue-cli-'))
  try {
    const base = git('rev-parse', 'HEAD')
    put('.gitignore', 'node_modules/\n')
    put('app/a.ts', 'export const a = 1\n')
    put('tests/a.test.mjs', 'throw new Error("must never execute")\n')
    for (const path of [
      'package.json',
      'package-lock.json',
      'tsconfig.json',
      'node_modules/.package-lock.json',
    ])
      put(path, '{}\n')
    put(
      'engineering/test-resources.json',
      JSON.stringify({
        version: 1,
        helpersSha256: helperFingerprint(dir),
        productionSha256: h,
        parallel: {},
      })
    )
    git('add', '.')
    git('commit', '-qm', 'reviewed source')
    const source = git('rev-parse', 'HEAD'),
      tree = git('rev-parse', 'HEAD^{tree}')
    const synthetic = git(
      'commit-tree',
      tree,
      '-p',
      base,
      '-p',
      source,
      '-m',
      'fake synthetic merge'
    )
    git('checkout', '-q', '--detach', synthetic)
    const e = entry(),
      o = observation(e)
    e.sourceHead = source
    e.sourceTree = tree
    e.reviewBase = base
    e.review.head = source
    e.review.base = base
    e.review.file = join(trusted, 'review.md')
    e.review.sha256 = sha256('ACCEPT fake fixture')
    writeFileSync(e.review.file, 'ACCEPT fake fixture')
    Object.assign(o, {
      head: source,
      base,
      reviewDigest: e.review.sha256,
      observedAt: Date.now(),
      headCommit: { sha: source, tree, parents: [base] },
      synthetic: { sha: synthetic, tree, parents: [base, source] },
    })
    const queue = join(trusted, 'queue.json'),
      snapshot = join(trusted, 'snapshot.json'),
      state = join(trusted, 'state.json')
    const contents = JSON.stringify({ version: 1, entries: [e] })
    writeFileSync(queue, contents)
    writeFileSync(snapshot, JSON.stringify({ [e.pr]: o }))
    const argv = [
      resolve('scripts/integration-queue/cli.mjs'),
      '--allowlist',
      queue,
      '--allowlist-sha256',
      sha256(contents),
      '--candidate',
      dir,
      '--state',
      state,
      '--snapshot',
      snapshot,
    ]
    const first = spawnSync(process.execPath, argv, { encoding: 'utf8', env })
    assert.equal(first.status, 0, first.stderr)
    assert.equal(JSON.parse(first.stdout)[0].status, 'wait')
    assert.equal(
      JSON.parse(first.stderr).resourcePreflight.parallelEligibility,
      'production-config-runtime-drift'
    )
    const saved = JSON.parse(readFileSync(state, 'utf8'))
    saved.entries[e.pr].quiet.since -= 60_001
    atomicWrite(state, saved)
    const second = spawnSync(process.execPath, argv, { encoding: 'utf8', env })
    assert.equal(second.status, 0, second.stderr)
    const output = JSON.parse(second.stdout)[0]
    assert.equal(output.mode, 'fixture-dry-run')
    assert.equal(output.action.kind, 'ready')
    assert.equal(output.checkpoint.pending, null)
    const bin = join(trusted, 'bin')
    mkdirSync(bin)
    const marker = join(trusted, 'unexpected-gh')
    writeFileSync(join(bin, 'gh'), `#!/bin/sh\ntouch '${marker}'\nexit 99\n`)
    chmodSync(join(bin, 'gh'), 0o755)
    const liveArgs = argv.slice(0, -2)
    const mismatch = spawnSync(process.execPath, liveArgs, {
      encoding: 'utf8',
      env: { ...env, PATH: `${bin}:${env.PATH}` },
    })
    assert.equal(mismatch.status, 2)
    assert.match(mismatch.stderr, /fixture\/live mode changed/)
    assert.throws(() => readFileSync(marker), { code: 'ENOENT' })
    const linked = join(trusted, 'linked-state.json')
    symlinkSync(state, linked)
    const linkedArgs = argv.map(value => (value === state ? linked : value))
    const linkedResult = spawnSync(process.execPath, linkedArgs, { encoding: 'utf8', env })
    assert.equal(linkedResult.status, 2)
    assert.match(linkedResult.stderr, /not a symlink/)
    assert.equal(git('rev-parse', 'HEAD'), synthetic)
    assert.equal(git('status', '--porcelain'), '')
  } finally {
    rmSync(dir, { recursive: true })
    rmSync(trusted, { recursive: true })
  }
})

function armed(e, decision, time = now + 60_000) {
  const context = {
    allowlistSha256: h,
    driverHead: id(999),
    journalId: '00000000-0000-4000-8000-000000000001',
    journalPath: '/trusted/journal.json',
    driverClean: true,
    fixture: false,
    pilotReviewSha256: h,
    usedPilot: false,
  }
  const plan = proposedPlan(e, decision, context)
  context.planSha256 = sha256(JSON.stringify(plan))
  const pilot = {
    version: 1,
    repo: REPO,
    pr: e.pr,
    approvedBy: e.approvedBy,
    planSha256: context.planSha256,
    createdAt: new Date(time - 1000).toISOString(),
    expiresAt: new Date(time + 60_000).toISOString(),
    review: {
      decision: 'ACCEPT',
      reviewer: 'independent-adapter-reviewer',
      driverHead: context.driverHead,
      planSha256: context.planSha256,
      sha256: h,
    },
  }
  return { entry: e, decision, plan, pilot, context, clock: () => time }
}

test('transport arguments pin GitHub host, refresh expected_head_sha and merge sha without bypass', () => {
  assert.deepEqual(
    mutationArguments(123, { kind: 'refresh', head: id(1), base: id(3), tree: id(5) }),
    [
      'api',
      '--hostname',
      'github.com',
      '--method',
      'PUT',
      `repos/${REPO}/pulls/123/update-branch`,
      '-f',
      `expected_head_sha=${id(1)}`,
    ]
  )
  assert.deepEqual(mutationArguments(123, { kind: 'ready', head: id(1), base: id(3) }), [
    'pr',
    'ready',
    '123',
    '--repo',
    `github.com/${REPO}`,
  ])
  assert.deepEqual(
    mutationArguments(123, { kind: 'merge', head: id(1), base: id(3), tree: id(5), merge: id(4) }),
    [
      'api',
      '--hostname',
      'github.com',
      '--method',
      'PUT',
      `repos/${REPO}/pulls/123/merge`,
      '-f',
      `sha=${id(1)}`,
      '-f',
      'merge_method=merge',
    ]
  )
  assert.throws(
    () => mutationArguments(123, { kind: 'admin', head: id(1), base: id(3) }),
    /Unknown/
  )
})

test('dry-run never observes again, persists an intent, or calls the write transport', () => {
  const { e, o } = ready(),
    decision = settled(e, o)
  const forbidden = () => {
    throw new Error('dry-run side effect')
  }
  const result = submitPilot({
    ...armed(e, decision),
    observe: forbidden,
    persist: forbidden,
    transport: forbidden,
  })
  assert.equal(result.status, 'dry-run')
})

test('arming rejects expired, mismatched, dirty, fixture, reused and unreviewed pilots before transport', () => {
  const { e, o } = ready(),
    decision = settled(e, o)
  for (const mutate of [
    p => {
      p.pilot.expiresAt = new Date(now).toISOString()
    },
    p => {
      p.plan.action.head = id(88)
    },
    p => {
      p.context.driverClean = false
    },
    p => {
      p.context.fixture = true
    },
    p => {
      p.context.usedPilot = true
    },
    p => {
      p.context.journalId = '00000000-0000-4000-8000-000000000002'
    },
    p => {
      p.context.journalPath = '/trusted/different-journal.json'
    },
    p => {
      p.pilot.review.decision = 'COMMENT'
    },
    p => {
      p.pilot.review.driverHead = id(88)
    },
    p => {
      p.context.pilotReviewSha256 = 'b'.repeat(64)
    },
    p => {
      p.pilot.approvedBy = 'someone-else'
    },
  ]) {
    const p = armed(e, decision)
    mutate(p)
    let effects = 0
    assert.throws(() =>
      submitPilot({
        ...p,
        apply: true,
        observe: () => {
          throw new Error('must reject before observation')
        },
        persist: () => {
          effects++
        },
        transport: () => {
          effects++
        },
      })
    )
    assert.equal(effects, 0)
  }
})

test('source drift or a newly queued stale event during final recheck prevents submission', () => {
  const { e, o } = ready(),
    decision = settled(e, o)
  for (const change of [
    v => {
      v.head = id(99)
    },
    v => {
      v.runs.push({ id: 2, attempt: 1, status: 'queued' })
    },
    v => {
      v.base = id(99)
    },
    v => {
      v.runs[0].conclusion = 'failure'
    },
  ]) {
    const fresh = structuredClone(o)
    fresh.observedAt = now + 60_000
    change(fresh)
    let calls = 0
    assert.throws(() =>
      submitPilot({
        ...armed(e, decision),
        apply: true,
        observe: () => fresh,
        persist: () => {
          calls++
        },
        transport: () => {
          calls++
        },
      })
    )
    assert.equal(calls, 0)
  }
})

test('write intent is durable before transport; uncertain merge resumes without a second submission', () => {
  const { e, o } = ready(),
    decision = settled(e, o)
  const dir = mkdtempSync(join(tmpdir(), 'pnd-pilot-reconcile-')),
    path = join(dir, 'state.json')
  try {
    let calls = 0
    const result = submitPilot({
      ...armed(e, decision),
      apply: true,
      observe: () => ({ ...o, observedAt: now + 60_000 }),
      persist: (checkpoint, receipt) => atomicWrite(path, { checkpoint, receipt }),
      transport: args => {
        calls++
        const saved = JSON.parse(readFileSync(path))
        assert.equal(saved.receipt.status, 'intent')
        assert.equal(saved.checkpoint.pending.kind, 'merge')
        assert.ok(args.includes(`sha=${o.head}`))
        throw new Error('Connection dropped after server accepted the merge')
      },
    })
    assert.equal(result.status, 'uncertain')
    assert.equal(calls, 1)
    const saved = JSON.parse(readFileSync(path))
    assert.match(decide(e, o, saved.checkpoint, now).reason, /Merge outcome uncertain/)
    o.merged = true
    o.mergeCommit = { sha: id(90), tree: o.synthetic.tree, parents: [o.base, o.head] }
    o.base = id(90)
    o.deployment = { sha: id(90), ...e.deployment, state: 'success' }
    assert.equal(decide(e, o, saved.checkpoint, now).status, 'done')
    assert.equal(calls, 1)
  } finally {
    rmSync(dir, { recursive: true })
  }
})

test('journal failure prevents a write; non-confirming merge response remains uncertain', () => {
  const { e, o } = ready(),
    decision = settled(e, o)
  let calls = 0
  assert.throws(
    () =>
      submitPilot({
        ...armed(e, decision),
        apply: true,
        observe: () => ({ ...o, observedAt: now + 60_000 }),
        persist: () => {
          throw new Error('disk full')
        },
        transport: () => {
          calls++
        },
      }),
    /disk full/
  )
  assert.equal(calls, 0)
  const result = submitPilot({
    ...armed(e, decision),
    apply: true,
    observe: () => ({ ...o, observedAt: now + 60_000 }),
    persist: () => {},
    transport: () => '{"merged":false}',
  })
  assert.equal(result.status, 'uncertain')
})

test('armed fake transport sequences refresh, drain, ready, exact checks and merge across restarts', () => {
  const e = entry(),
    o = observation(e)
  e.deployment = { kind: 'unverified', reason: 'fake transport fixture only' }
  o.draft = false
  o.upToDate = false
  o.base = id(8)
  o.refresh = {
    sourceHead: o.head,
    base: o.base,
    reviewBase: e.reviewBase,
    clean: true,
    disjoint: true,
    tree: id(9),
  }
  let saved = null,
    time = now,
    latestReceipt
  const commands = []
  const inspect = () => {
    o.observedAt = time
    return o
  }
  const poll = () => {
    const d = decide(e, inspect(), saved, time)
    saved = JSON.parse(JSON.stringify(d.checkpoint))
    return d
  }
  const settle = () => {
    poll()
    time += 60_000
    return poll()
  }
  const send = (decision, effect) =>
    submitPilot({
      ...armed(e, decision, time),
      apply: true,
      observe: inspect,
      persist: (checkpoint, receipt) => {
        saved = JSON.parse(JSON.stringify(checkpoint))
        latestReceipt = receipt
      },
      transport: args => {
        assert.equal(latestReceipt.status, 'intent')
        commands.push(args)
        return effect()
      },
    })
  assert.equal(
    send(settle(), () => {
      o.draft = true
      return 'Draft'
    }).status,
    'submitted'
  )
  assert.equal(
    send(settle(), () => {
      o.acceptedRefresh = structuredClone(o.refresh)
      o.head = id(10)
      o.headCommit = { sha: o.head, parents: [e.sourceHead, o.base], tree: id(9) }
      o.upToDate = true
      o.synthetic = { sha: id(11), parents: [o.base, o.head], tree: id(9) }
      o.resource = { ...o.resource, candidate: id(11), tree: id(9) }
      return '{"message":"Updating pull request branch"}'
    }).status,
    'submitted'
  )
  o.runs = [{ id: 5, attempt: 1, status: 'queued' }]
  assert.equal(poll().status, 'wait')
  assert.equal(commands.length, 2)
  o.runs[0].status = 'completed'
  o.runs[0].conclusion = 'failure'
  assert.equal(
    send(settle(), () => {
      o.draft = false
      o.runs = GATES.map((g, i) => ({ ...green(o, g, i), status: 'queued' }))
      return 'Ready'
    }).status,
    'submitted'
  )
  assert.equal(poll().status, 'wait')
  assert.equal(commands.length, 3)
  o.runs = GATES.map((g, i) => green(o, g, i))
  o.currentChecks = checksFor(o.runs)
  assert.equal(
    send(settle(), () => {
      o.merged = true
      o.mergeCommit = { sha: id(12), parents: [o.base, o.head], tree: o.synthetic.tree }
      o.base = id(12)
      return JSON.stringify({ merged: true, sha: id(12) })
    }).status,
    'submitted'
  )
  const final = poll()
  assert.equal(final.status, 'done')
  assert.equal(final.outcome.deployment, 'unverified')
  assert.equal(commands.length, 4)
  assert.deepEqual(commands[0], ['pr', 'ready', '123', '--undo', '--repo', `github.com/${REPO}`])
  assert.ok(commands[1].includes(`expected_head_sha=${e.sourceHead}`))
  assert.deepEqual(commands[2], ['pr', 'ready', '123', '--repo', `github.com/${REPO}`])
  assert.ok(commands[3].includes(`sha=${id(10)}`))
})

function cloudflareFixture(commit, overrides = {}) {
  return {
    id: 11,
    name: CLOUDFLARE.name,
    started_at: '2026-10-16T18:00:00Z',
    head_sha: commit,
    app: { id: CLOUDFLARE.appId, slug: CLOUDFLARE.appSlug },
    status: 'completed',
    conclusion: 'success',
    details_url: `${CLOUDFLARE.productionBuildPrefix}b9cc9073-ea13-4fdf-bc9d-c5406f962ec8`,
    ...overrides,
  }
}

test('Cloudflare observation pins exact commit/app/name/project and never promotes preview or older success', () => {
  const good = cloudflareFixture(id(90))
  assert.equal(cloudflareCheck([good], id(90)).identityVerified, true)
  assert.equal(cloudflareCheck([good, { ...good, id: 12 }], id(90)).identityVerified, false)
  for (const changes of [
    { head_sha: id(80) },
    { details_url: good.details_url.replace('/production/', '/preview/') },
    { details_url: good.details_url.replace('/populous-new-dawn/', '/other-project/') },
    { app: { id: CLOUDFLARE.appId, slug: 'other-app' } },
  ]) {
    assert.equal(cloudflareCheck([{ ...good, ...changes }], id(90)).identityVerified, false)
  }
  assert.equal(cloudflareCheck([{ ...good, app: { id: 9 } }], id(90)), null)
  assert.equal(
    cloudflareCheck(
      [good, { ...good, id: 10, started_at: '2026-10-16T19:00:00Z', conclusion: 'failure' }],
      id(90)
    ).state,
    'failed'
  )
})

test('confirmed merge reports Cloudflare build success separately from serving deployment', () => {
  const { e, o } = ready()
  e.deployment = { kind: 'cloudflare-check', ...CLOUDFLARE }
  const state = recordIntent(settled(e, o))
  o.merged = true
  o.mergeCommit = { sha: id(90), tree: o.synthetic.tree, parents: [o.base, o.head] }
  o.base = id(90)
  assert.match(decide(e, o, state, now).reason, /Merge confirmed.*not yet observed/)
  o.deployment = cloudflareCheck([cloudflareFixture(id(90))], id(90))
  const result = decide(e, o, state, now)
  assert.equal(result.status, 'done')
  assert.equal(result.outcome.deployment, 'provider-production-build-check-passed')
  assert.equal(result.outcome.servingDeployment, 'unverified')
})

test('source-bound non-required draft admission cannot replace or poison a genuine ready validation', () => {
  const { e, o } = ready()
  const admission = {
    ...green(o, GATES[0], 0),
    id: 102,
    startedAt: '2026-10-16T19:00:00Z',
    conclusion: 'failure',
    job: 'Draft PR (not validated)',
    jobConclusion: 'failure',
    draftAdmission: true,
    workflowSha256: e.workflowHashes[GATES[0].workflow],
    merge: null,
    identityVerified: false,
  }
  o.runs.push(admission)
  assert.equal(settled(e, o).action.kind, 'merge')
  admission.draftAdmission = false
  assert.match(settled(e, o).reason, /Failed, canceled, skipped/)
  admission.draftAdmission = true
  admission.job = 'Full check'
  assert.match(settled(e, o).reason, /Failed, canceled, skipped/)
})

test('later failed rerun of an older run blocks an earlier green higher run ID', () => {
  const { e, o } = ready()
  o.runs.push({
    ...o.runs[0],
    id: 99,
    attempt: 2,
    checkId: 999,
    startedAt: '2026-10-16T19:00:00Z',
    conclusion: 'failure',
    jobConclusion: 'failure',
  })
  o.currentChecks = checksFor(o.runs)
  const result = settled(e, o)
  assert.equal(result.status, 'stop')
  assert.match(result.reason, /run 99\/2/)
})

test('gate selection stops on ambiguous chronology or disagreeing current required check', () => {
  const { e, o } = ready()
  o.runs.push({ ...o.runs[0], id: 99, attempt: 2 })
  assert.match(settled(e, o).reason, /Ambiguous attempt chronology/)
  o.runs.pop()
  delete o.runs[0].startedAt
  assert.match(settled(e, o).reason, /Missing attempt chronology/)
  o.runs[0].startedAt = '2026-10-16T18:00:00Z'
  o.currentChecks.push({
    ...o.currentChecks[0],
    id: 999,
    startedAt: '2026-10-16T19:00:00Z',
    conclusion: 'failure',
  })
  assert.match(settled(e, o).reason, /Current required check disagrees/)
})

test('pagination rejects short incomplete responses, changing counts and duplicate entries', () => {
  const endpoint = `repos/${REPO}/fake`
  const short = new GitHubReader({
    execute: () => JSON.stringify({ total_count: 2, items: [{ id: 1 }] }),
  })
  assert.throws(() => short.pages(endpoint, 'items'), /Incomplete enumeration/)
  const missing = new GitHubReader({ execute: () => JSON.stringify({ items: [] }) })
  assert.throws(() => missing.pages(endpoint, 'items'), /Missing total_count/)
  for (const badCount of [true, false]) {
    let page = 0
    const reader = new GitHubReader({
      execute: () =>
        JSON.stringify(
          ++page === 1
            ? { total_count: 101, items: Array.from({ length: 100 }, (_, id) => ({ id })) }
            : { total_count: badCount ? 102 : 101, items: [{ id: 1 }] }
        ),
    })
    assert.throws(
      () => reader.pages(endpoint, 'items'),
      badCount ? /Collection changed/ : /Duplicate/
    )
  }
})

test('custom clean filter is rejected before resource preflight or any Git status can execute it', () => {
  const { dir, git, put, execute } = repoFixture()
  try {
    put('.gitattributes', 'file.txt filter=probe\n')
    git('add', '.gitattributes')
    git('commit', '-qm', 'attributes')
    const marker = join(dir, 'filter-executed')
    git('config', 'filter.probe.clean', `touch '${marker}'; cat`)
    put('file.txt', 'would trigger clean filter during status\n')
    const reader = new GitHubReader({ cwd: dir, execute })
    const preflight = resourcePreflight(dir, (...args) => reader.git(...args))
    assert.equal(preflight.status, 'blocked')
    assert.match(preflight.reason, /drivers rejected before/)
    assert.throws(() => reader.git('status', '--porcelain'), /drivers rejected before/)
    assert.throws(() => readFileSync(marker), { code: 'ENOENT' })
  } finally {
    rmSync(dir, { recursive: true })
  }
})

test('ready-only initial admission proposes one reviewed draft conversion; matching pass is reused', () => {
  const e = entry(),
    o = observation(e)
  o.draft = false
  const d = settled(e, o)
  assert.equal(d.action.kind, 'draft')
  assert.equal(d.action.reason, 'missing-full-admission')
  const r = ready()
  assert.equal(settled(r.e, r.o).action.kind, 'merge')
  r.o.mergeState = 'blocked'
  assert.match(settled(r.e, r.o).reason, /clean protected mergeability/)
})

test('draft conversion cannot retry failed, canceled, ambiguous or orphaned validation', () => {
  for (const mutate of [
    o => {
      o.runs = [green(o, GATES[1], 1)]
      o.runs[0].conclusion = 'failure'
      o.currentChecks = checksFor(o.runs)
    },
    o => {
      o.runs = [green(o, GATES[0], 0)]
      o.runs[0].conclusion = 'cancelled'
      o.currentChecks = checksFor(o.runs)
    },
    o => {
      o.runs = [green(o, GATES[1], 1), { ...green(o, GATES[1], 1), id: 999 }]
      o.currentChecks = checksFor(o.runs)
    },
    o => {
      o.currentChecks = checksFor([green(o, GATES[0], 0)])
    },
    o => {
      o.head = id(99)
    },
    o => {
      o.runs = [green(o, GATES[0], 0)]
      o.runs[0].merge = id(99)
      o.currentChecks = checksFor(o.runs)
    },
  ]) {
    for (const stale of [false, true]) {
      const e = entry(),
        o = observation(e)
      o.draft = false
      if (stale) {
        o.upToDate = false
        o.refresh = {
          sourceHead: o.head,
          base: o.base,
          reviewBase: e.reviewBase,
          clean: true,
          disjoint: true,
          tree: id(9),
        }
      }
      mutate(o)
      if (stale && o.runs[0]?.merge === id(99)) o.runs[0].identityVerified = false
      assert.equal(settled(e, o).status, 'stop')
    }
  }
})

test('stale ready candidate requires refresh proof and verified earlier validation before draft', () => {
  const { e, o } = ready()
  for (const r of o.runs) {
    r.validationVerified = true
    r.identityVerified = false
  }
  o.base = id(8)
  o.upToDate = false
  o.refresh = {
    sourceHead: o.head,
    base: o.base,
    reviewBase: e.reviewBase,
    clean: true,
    disjoint: true,
    tree: id(9),
  }
  assert.equal(settled(e, o).action.reason, 'base-refresh')
  o.runs[0].validationVerified = false
  assert.equal(settled(e, o).status, 'stop')
  o.runs[0].validationVerified = true
  o.refresh.disjoint = false
  assert.match(settled(e, o).reason, /disjoint-path/)
})

test('draft intent reconciles exact head/base and never retries uncertain conversion', () => {
  const e = entry(),
    o = observation(e)
  o.draft = false
  const state = recordIntent(settled(e, o))
  assert.match(settled(e, o, state).reason, /Draft conversion outcome uncertain/)
  o.draft = true
  o.base = id(99)
  assert.match(settled(e, o, state).reason, /Base changed during draft/)
  o.base = e.reviewBase
  const d = settled(e, o, JSON.parse(JSON.stringify(state)))
  assert.equal(d.action.kind, 'ready')
  assert.equal(d.checkpoint.draftConversion.kind, 'draft')
})

test('submitted ready admission waits boundedly without another toggle, then accepts exact pass', () => {
  const e = entry(),
    o = observation(e)
  const state = recordIntent(settled(e, o))
  o.draft = false
  let d = settled(e, o, state)
  assert.equal(d.status, 'wait')
  assert.match(d.reason, /five minutes/)
  const saved = JSON.parse(JSON.stringify(d.checkpoint))
  d = decide(e, { ...o, observedAt: now + 300_000 }, saved, now + 300_000)
  assert.equal(d.status, 'stop')
  assert.match(d.reason, /without retrying/)
  o.runs = GATES.map((g, i) => green(o, g, i))
  o.currentChecks = checksFor(o.runs)
  assert.equal(settled(e, o, saved).action.kind, 'merge')
  o.draft = true
  assert.match(settled(e, o, saved).reason, /Ready transition already used/)
  o.upToDate = false
  assert.match(settled(e, o, saved).reason, /Base changed after ready admission/)
})

test('draft transport persists before effect, rejects changed plan/state, and defaults to dry-run', () => {
  const e = entry(),
    o = observation(e)
  o.draft = false
  const decision = settled(e, o),
    p = armed(e, decision)
  let intent,
    calls = 0
  const forbidden = () => {
    throw new Error('unexpected effect')
  }
  assert.equal(
    submitPilot({ ...p, observe: forbidden, persist: forbidden, transport: forbidden }).status,
    'dry-run'
  )
  assert.throws(
    () =>
      submitPilot({
        ...p,
        apply: true,
        observe: () => ({ ...o, draft: true, observedAt: now + 60_000 }),
        persist: forbidden,
        transport: forbidden,
      }),
    /No fresh effect|no longer matches/
  )
  const altered = structuredClone(p.plan)
  altered.action.reason = 'base-refresh'
  assert.throws(
    () =>
      submitPilot({
        ...p,
        plan: altered,
        apply: true,
        observe: forbidden,
        persist: forbidden,
        transport: forbidden,
      }),
    /no longer matches/
  )
  const result = submitPilot({
    ...p,
    apply: true,
    observe: () => ({ ...o, observedAt: now + 60_000 }),
    persist: checkpoint => {
      intent = JSON.parse(JSON.stringify(checkpoint))
    },
    transport: args => {
      assert.equal(intent.pending.kind, 'draft')
      assert.deepEqual(args, ['pr', 'ready', '123', '--undo', '--repo', `github.com/${REPO}`])
      calls++
      throw new Error('timeout')
    },
  })
  assert.equal(result.status, 'uncertain')
  assert.equal(calls, 1)
  assert.match(settled(e, o, intent).reason, /outcome uncertain/)
})

for (const conclusion of ['failure', 'cancelled']) {
  test(`preexisting draft cannot retry real Full ${conclusion} from a fresh checkpoint`, () => {
    const { e, o } = ready()
    o.draft = true
    o.runs[0].conclusion = conclusion
    o.runs[0].jobConclusion = conclusion
    o.runs[0].identityVerified = false
    o.currentChecks = checksFor(o.runs)
    const d = settled(e, o)
    assert.equal(d.status, 'stop')
    assert.equal(d.action, null)
    assert.match(d.reason, /Failed, canceled, skipped or unverified current gate: Full check/)
  })
}

test('preexisting draft rejects ambiguous Full history and orphaned failed current check', () => {
  const { e, o } = ready()
  o.draft = true
  o.runs.push({ ...o.runs[0], id: 999, checkId: 999 })
  o.currentChecks = checksFor(o.runs)
  assert.match(settled(e, o).reason, /Ambiguous attempt chronology: Full check/)
  o.runs = []
  o.currentChecks = [{ ...o.currentChecks[0], conclusion: 'failure' }]
  assert.match(settled(e, o).reason, /Required check lacks matching run evidence: Full check/)
})

test('pre-ready Full guard allows missing admission and verified cheap draft history, including Tutorial draft failures', () => {
  const e = entry(),
    o = observation(e)
  const full = {
    ...green(o, GATES[0], 0),
    job: GATES[0].draftJob,
    conclusion: 'failure',
    jobConclusion: 'failure',
    identityVerified: false,
    merge: null,
    draftAdmission: true,
    workflowSha256: e.workflowHashes[GATES[0].workflow],
    steps: GATES[0].steps.map((name, i) => ({ name, conclusion: i === 0 ? 'failure' : 'skipped' })),
  }
  const browser = {
    ...green(o, GATES[1], 1),
    conclusion: 'failure',
    jobConclusion: 'failure',
    identityVerified: false,
    merge: null,
    draftGuardOnly: true,
    workflowSha256: e.workflowHashes[GATES[1].workflow],
    steps: GATES[1].steps.map((name, i) => ({ name, conclusion: i === 0 ? 'failure' : 'skipped' })),
  }
  o.runs = [browser]
  o.currentChecks = checksFor(o.runs)
  assert.equal(settled(e, o).action.kind, 'ready')
  o.runs.push(full)
  assert.equal(settled(e, o).action.kind, 'ready')
  full.draftAdmission = false
  assert.equal(settled(e, o).status, 'stop')
})

for (const conclusion of ['failure', 'cancelled']) {
  test(`preexisting draft cannot retry required Tutorial ${conclusion}`, () => {
    for (const explicit of [false, true]) {
      const { e, o } = ready()
      if (explicit) {
        e.requireBrowser = true
        o.changedPaths = ['docs/example.md']
      }
      o.draft = true
      o.runs[1].conclusion = conclusion
      o.runs[1].jobConclusion = conclusion
      o.runs[1].identityVerified = false
      o.currentChecks = checksFor(o.runs)
      const d = settled(e, o)
      assert.equal(d.status, 'stop')
      assert.equal(d.action, null)
      assert.match(
        d.reason,
        /Failed, canceled, skipped or unverified current gate: Tutorial browser/
      )
    }
  })
}

test('pre-ready Tutorial qualification rejects ambiguous and unproven guard history only when required', () => {
  const { e, o } = ready()
  o.draft = true
  o.runs.push({ ...o.runs[1], id: 999, checkId: 999 })
  o.currentChecks = checksFor(o.runs)
  assert.match(settled(e, o).reason, /Ambiguous attempt chronology: Tutorial browser/)
  o.runs.pop()
  const browser = o.runs[1]
  Object.assign(browser, {
    conclusion: 'failure',
    jobConclusion: 'failure',
    identityVerified: false,
    steps: GATES[1].steps.map((name, i) => ({ name, conclusion: i === 0 ? 'failure' : 'skipped' })),
  })
  o.currentChecks = checksFor(o.runs)
  assert.equal(settled(e, o).status, 'stop')
  browser.draftGuardOnly = true
  browser.workflowSha256 = 'b'.repeat(64)
  assert.equal(settled(e, o).status, 'stop')
  browser.workflowSha256 = e.workflowHashes[GATES[1].workflow]
  assert.equal(settled(e, o).action.kind, 'ready')
  o.draft = false
  assert.equal(settled(e, o).status, 'stop')
  o.draft = true
  browser.draftGuardOnly = false
  o.changedPaths = ['docs/example.md']
  assert.equal(settled(e, o).action.kind, 'ready')
})

test('cheap Tutorial guard does not hide an earlier real failure before ready', () => {
  const { e, o } = ready()
  o.draft = true
  const browser = o.runs[1]
  browser.conclusion = 'failure'
  browser.jobConclusion = 'failure'
  browser.identityVerified = false
  const guard = {
    ...browser,
    id: 999,
    checkId: 999,
    startedAt: '2026-10-16T19:00:00Z',
    draftGuardOnly: true,
    workflowSha256: e.workflowHashes[GATES[1].workflow],
    steps: GATES[1].steps.map((name, i) => ({ name, conclusion: i === 0 ? 'failure' : 'skipped' })),
  }
  o.runs.push(guard)
  o.currentChecks = checksFor(o.runs)
  assert.match(
    settled(e, o).reason,
    /Failed, canceled, skipped or unverified current gate: Tutorial browser/
  )
  Object.assign(browser, green(o, GATES[1], 1))
  o.currentChecks = checksFor(o.runs)
  assert.equal(settled(e, o).action.kind, 'ready')
})

test('new Tutorial guard proof restarts the stable observation window', () => {
  const e = entry(),
    o = observation(e)
  o.runs = [
    {
      ...green(o, GATES[1], 1),
      conclusion: 'failure',
      jobConclusion: 'failure',
      identityVerified: false,
      draftGuardOnly: false,
      workflowSha256: e.workflowHashes[GATES[1].workflow],
    },
  ]
  o.currentChecks = checksFor(o.runs)
  let d = decide(e, o, null, now)
  o.runs[0].draftGuardOnly = true
  d = decide(e, { ...o, observedAt: now + 60_000 }, d.checkpoint, now + 60_000)
  assert.equal(d.status, 'wait')
  assert.equal(d.checkpoint.quiet.since, now + 60_000)
  d = decide(e, { ...o, observedAt: now + 120_000 }, d.checkpoint, now + 120_000)
  assert.equal(d.action.kind, 'ready')
})

test('disposable Git fixtures remain hermetic under inherited global, system and injected filters', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pnd-queue-inherited-config-'))
  try {
    const global = join(dir, 'global.gitconfig'),
      system = join(dir, 'system.gitconfig')
    writeFileSync(
      global,
      '[filter "lfs"]\nclean = git-lfs clean -- %f\nsmudge = git-lfs smudge -- %f\nprocess = git-lfs filter-process\nrequired = true\n'
    )
    writeFileSync(system, '[filter "system"]\nclean = false\n')
    const child = spawnSync(
      process.execPath,
      [
        '--test',
        '--test-name-pattern=^(real Git merge-tree proof|resource preflight reports|CLI fixture executes|custom clean filter is rejected)',
        resolve('tests/integration-queue.test.mjs'),
      ],
      {
        encoding: 'utf8',
        timeout: 30_000,
        env: {
          ...process.env,
          NODE_TEST_CONTEXT: undefined,
          GIT_CONFIG_GLOBAL: global,
          GIT_CONFIG_SYSTEM: system,
          GIT_CONFIG_NOSYSTEM: '0',
          GIT_CONFIG_COUNT: '1',
          GIT_CONFIG_KEY_0: 'filter.injected.clean',
          GIT_CONFIG_VALUE_0: 'false',
          GIT_CONFIG_PARAMETERS: "'filter.parameter.clean=false'",
        },
      }
    )
    assert.equal(child.status, 0, child.stderr + child.stdout)
    assert.match(child.stdout, /(?:#|ℹ) tests 4\b/)
    assert.match(child.stdout, /(?:#|ℹ) pass 4\b/)
  } finally {
    rmSync(dir, { recursive: true })
  }
})

test('production reader rejects inherited clean filters before status can invoke them', () => {
  const { dir, git, put, env } = repoFixture()
  const trusted = mkdtempSync(join(tmpdir(), 'pnd-queue-global-guard-'))
  try {
    put('.gitattributes', 'file.txt filter=probe\n')
    git('add', '.gitattributes')
    git('commit', '-qm', 'attributes')
    put('file.txt', 'would invoke inherited clean filter\n')
    const marker = join(trusted, 'filter-executed'),
      global = join(trusted, 'global.gitconfig')
    execFileSync(
      'git',
      ['config', '--file', global, 'filter.probe.clean', `touch '${marker}'; cat`],
      { env }
    )
    const script = `import assert from 'node:assert/strict';
      import {GitHubReader} from ${JSON.stringify(new URL('../scripts/integration-queue/github.mjs', import.meta.url).href)};
      const reader = new GitHubReader({cwd: process.argv[1]});
      assert.throws(() => reader.git('status', '--porcelain'), {message: 'Custom Git merge/filter drivers rejected before inspecting working files'});`
    const child = spawnSync(process.execPath, ['--input-type=module', '-e', script, dir], {
      encoding: 'utf8',
      env: { ...env, GIT_CONFIG_GLOBAL: global },
      timeout: 30_000,
    })
    assert.equal(child.status, 0, child.stderr + child.stdout)
    assert.throws(() => readFileSync(marker), { code: 'ENOENT' })
  } finally {
    rmSync(dir, { recursive: true })
    rmSync(trusted, { recursive: true })
  }
})
