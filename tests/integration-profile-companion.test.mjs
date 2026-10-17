import assert from 'node:assert/strict'
import test from 'node:test'
import { GitHubReader } from '../scripts/integration-queue/github.mjs'
import {
  GATES,
  PROFILE_RECOVERY_GATE,
  REPO,
  sha256,
  validatePassedGate,
  browserRequired,
} from '../scripts/integration-queue/policy.mjs'

const oid = digit => digit.repeat(40)
function fixture({ profile = true } = {}) {
  const pr = { number: 342, head: { sha: oid('a'), ref: 'profile' }, base: { sha: oid('b') } }
  const synthetic = { sha: oid('c') }
  const workflow = profile
    ? 'jobs:\n  profile-recovery-browser:\n    name: Profile recovery browser\n'
    : 'jobs:\n  tutorial-browser:\n'
  const entry = {
    pr: 342,
    workflowHashes: Object.fromEntries(GATES.map(g => [g.workflow, sha256(workflow)])),
  }
  const run = (gate, index) => ({
    id: 100 + index,
    run_attempt: 1,
    path: gate.workflow,
    head_sha: pr.head.sha,
    event: 'pull_request',
    check_suite_id: 400 + index,
    status: 'completed',
    conclusion: 'success',
    run_started_at: '2026-10-17T20:00:00Z',
    pull_requests: [{ number: 342, base: { sha: pr.base.sha } }],
  })
  const job = (spec, id, runId) => ({
    id,
    run_id: runId,
    run_attempt: 1,
    name: spec.job,
    status: 'completed',
    conclusion: 'success',
    check_run_url: `https://api.github.com/repos/${REPO}/check-runs/${id + 100}`,
    steps: spec.steps.map(name => ({ name, conclusion: 'success' })),
  })
  const runs = GATES.map(run)
  const jobs = [
    [job(GATES[0], 200, 100)],
    [job(GATES[1], 201, 101), ...(profile ? [job(PROFILE_RECOVERY_GATE, 202, 101)] : [])],
  ]
  const checks = new Map(
    jobs.flat().map(j => [
      j.id + 100,
      {
        id: j.id + 100,
        check_suite: { id: j.run_id + 300 },
        head_sha: pr.head.sha,
        name: j.name,
        app: { id: 15368, slug: 'github-actions' },
        status: 'completed',
        conclusion: 'success',
      },
    ])
  )
  const log = `PR_HEAD_SHA: ${pr.head.sha}\nPR_BASE_SHA: ${pr.base.sha}\n[command]/usr/bin/git log -1 --format=%H\n${synthetic.sha}\n`
  const logs = new Map(jobs.flat().map(j => [j.id, log]))
  const reader = new GitHubReader()
  reader.pages = endpoint => {
    if (endpoint.includes('/workflows/'))
      return [runs[endpoint.includes('tutorial-browser') ? 1 : 0]]
    const match = endpoint.match(/\/runs\/(\d+)\/attempts\/1\/jobs/)
    assert.ok(match, endpoint)
    return jobs[Number(match[1]) - 100]
  }
  reader.get = endpoint => {
    if (endpoint.includes('/contents/'))
      return { encoding: 'base64', content: Buffer.from(workflow).toString('base64') }
    if (endpoint.includes('/check-runs/')) return checks.get(Number(endpoint.split('/').at(-1)))
    if (endpoint.endsWith('/logs')) return logs.get(Number(endpoint.split('/').at(-2)))
    const match = endpoint.match(/\/runs\/(\d+)\/attempts\/1$/)
    assert.ok(match, endpoint)
    return runs[Number(match[1]) - 100]
  }
  return {
    reader,
    pr,
    synthetic,
    entry,
    jobs,
    checks,
    logs,
    workflow,
    inspect: () => reader.runs(entry, pr, synthetic),
  }
}

test('Profile companion shares one Tutorial run row and binds exact successful source', () => {
  const f = fixture(),
    rows = f.inspect()
  assert.equal(rows.length, 2)
  assert.equal(new Set(rows.map(r => `${r.id}/${r.attempt}`)).size, 2)
  assert.deepEqual(rows[1].profileRecovery, {
    verified: true,
    jobId: 202,
    checkId: 302,
    logSha256: sha256(f.logs.get(202)),
    head: f.pr.head.sha,
    base: f.pr.base.sha,
    merge: f.synthetic.sha,
  })
  const currentChecks = [...f.checks.values()].map(c => ({
    ...c,
    appId: c.app.id,
    head: c.head_sha,
    startedAt: '2026-10-17T20:00:00Z',
  }))
  const o = {
    head: f.pr.head.sha,
    base: f.pr.base.sha,
    synthetic: f.synthetic,
    currentChecks,
    workflows: [f.reader.workflow(GATES[1].workflow, f.pr.head.sha)],
  }
  assert.doesNotThrow(() => validatePassedGate(o, GATES[1], rows[1]))
  assert.throws(
    () => validatePassedGate(o, GATES[1], { ...rows[1], profileRecovery: undefined }),
    /Missing verified Profile/
  )
  currentChecks.find(c => c.name === PROFILE_RECOVERY_GATE.job).conclusion = 'skipped'
  assert.throws(
    () => validatePassedGate(o, GATES[1], rows[1]),
    /Current Profile recovery check disagrees/
  )
})

test('old single-job Tutorial workflows remain supported', () => {
  const f = fixture({ profile: false }),
    rows = f.inspect()
  assert.equal(rows.length, 2)
  assert.equal(rows[1].profileRecovery, undefined)
  assert.equal(
    f.reader.workflow(GATES[1].workflow, f.pr.head.sha).profileRecoveryRequired,
    undefined
  )
})

for (const [name, mutate, error] of [
  ['missing', f => f.jobs[1].pop(), /Missing or duplicate Profile/],
  ['duplicate', f => f.jobs[1].push(f.jobs[1][1]), /Missing or duplicate Profile/],
  [
    'skipped',
    f => {
      f.jobs[1][1].conclusion = 'skipped'
    },
    /attempt\/stages/,
  ],
  [
    'failure',
    f => {
      f.jobs[1][1].conclusion = 'failure'
    },
    /attempt\/stages/,
  ],
  [
    'wrong attempt',
    f => {
      f.jobs[1][1].run_attempt = 2
    },
    /attempt\/stages/,
  ],
  ['missing stage', f => f.jobs[1][1].steps.pop(), /attempt\/stages/],
  [
    'stale head',
    f => {
      f.checks.get(302).head_sha = oid('d')
    },
    /check identity/,
  ],
  [
    'foreign app',
    f => {
      f.checks.get(302).app.id = 1
    },
    /check identity/,
  ],
  [
    'foreign suite',
    f => {
      f.checks.get(302).check_suite.id = 999
    },
    /check identity/,
  ],
  [
    'stale source log',
    f => f.logs.set(202, f.logs.get(202).replaceAll(oid('c'), oid('d'))),
    /different candidate/,
  ],
])
  test(`Profile companion rejects ${name}`, () => {
    const f = fixture()
    mutate(f)
    assert.throws(f.inspect, error)
  })

test('profile scenario and checkpoint observer changes require browser acceptance', () => {
  for (const path of [
    'scripts/local-render/campaign-profile-recovery.mjs',
    'scripts/local-render/checkpoint-observer.mjs',
    'scripts/checkpoint-readback.mjs',
  ])
    assert.equal(browserRequired([path]), true)
})
