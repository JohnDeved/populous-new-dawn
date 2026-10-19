import assert from 'node:assert/strict'
import test from 'node:test'
import { mission10ReceiptFixture } from './support/mission10-profile-receipt.mjs'
import {
  PROFILE_JOB,
  PROFILE_STEPS,
  PROFILE_INPUTS,
  PROFILE_CASES,
  PROFILE_SCREENSHOTS,
  profileRecoveryLog,
  validateProfileRecovery,
} from '../scripts/integration-queue/profile-recovery.mjs'
const recoveryReceiptLog = receipt => {
  const json = JSON.stringify(receipt)
  if (Buffer.byteLength(json) > 12000) throw Error('bounded receipt exceeded')
  return `PND_PROFILE_RECOVERY_RECEIPT=${Buffer.from(json).toString('base64')}\nPND_PROFILE_RECOVERY_SHA256=${sha256(json)}`
}
import {
  GATES,
  PROFILE_BROWSER_GATE,
  gatesFor,
  validateEntry,
  reviewedWorkflows,
  validatePassedGate,
  sha256,
  browserRequired,
} from '../scripts/integration-queue/policy.mjs'
import { GitHubReader } from '../scripts/integration-queue/github.mjs'
const oid = n => String(n).repeat(40),
  h = 'a'.repeat(64)
function fixture() {
  const identity = {
    repository: 'JohnDeved/populous-new-dawn',
    runId: '100',
    runAttempt: '2',
    workflowRef:
      'JohnDeved/populous-new-dawn/.github/workflows/tutorial-browser.yml@refs/pull/550/merge',
    mergeSha: oid(4),
    headSha: oid(1),
    baseSha: oid(3),
  }
  const inputs = Object.fromEntries(PROFILE_INPUTS.map(p => [p, sha256(p)]))
  const receipt = {
    version: 1,
    kind: 'profile-recovery-browser',
    status: 'passed',
    identity,
    inputs,
    receiptSha256: h,
    selectedScenario: 'profile-recovery',
    build: { exitCode: 0, signal: null, timedOut: false, capMs: 120000 },
    browserTimedOut: false,
    browserCapMs: 180000,
    sourceAfter: 'identical',
    cleanupVerified: true,
    errors: [],
    dependencyChanges: [],
    dependenciesBeforeSha256: h,
    dependenciesAfterSha256: h,
    browserPath: '/opt/google/chrome/chrome',
    launch: {
      channel: 'chrome',
      headless: true,
      chromiumSandbox: true,
      ignoreDefaultArgs: true,
      args: ['--headless', '--remote-debugging-pipe'],
      timeout: 30000,
    },
    mission10: mission10ReceiptFixture(identity.mergeSha),
    scenarioStatus: 'passed',
    runtimeUnchanged: true,
    cases: PROFILE_CASES.map(([kind, status, fixture]) => ({ kind, status, fixture })),
    screenshots: PROFILE_SCREENSHOTS.map(([name, width, height, dpr]) => ({
      name,
      viewport: { width, height },
      dpr,
      sha256: h,
    })),
  }
  return { receipt, expected: { identity, inputs } }
}
function entry() {
  return {
    version: 1,
    repo: 'JohnDeved/populous-new-dawn',
    pr: 550,
    baseRef: 'main',
    sourceHead: oid(1),
    sourceTree: oid(2),
    reviewBase: oid(3),
    approvedBy: 'parent',
    allowMechanicalRefresh: false,
    requireBrowser: true,
    review: {
      reviewer: 'reviewer',
      decision: 'ACCEPT',
      head: oid(1),
      base: oid(3),
      sha256: h,
      file: '/review',
    },
    workflowHashes: Object.fromEntries(GATES.map(g => [g.workflow, h])),
    deployment: { kind: 'unverified', reason: 'fixture' },
  }
}
test('recovery receipt requires exact source, every assertion, visual inventory and safe terminal state', () => {
  const { receipt, expected } = fixture()
  assert.equal(validateProfileRecovery(receipt, expected), true)
  for (const mutate of [
    r => {
      r.status = 'skipped'
    },
    r => {
      r.identity.runAttempt = '1'
    },
    r => {
      r.identity.mergeSha = oid(9)
    },
    r => {
      delete r.inputs[PROFILE_INPUTS[0]]
    },
    r => {
      r.inputs[PROFILE_INPUTS[0]] = h
    },
    r => {
      r.inputs.extra = h
    },
    r => {
      r.receiptSha256 = ''
    },
    r => {
      r.cases = r.cases.slice(1)
    },
    r => {
      r.screenshots.pop()
    },
    r => {
      r.screenshots[0].sha256 = ''
    },
    r => {
      r.screenshots[0].viewport.width = 900
    },
    r => {
      r.screenshots[0].dpr = 2
    },
    r => {
      r.build.exitCode = 1
    },
    r => {
      r.build.signal = 'SIGTERM'
    },
    r => {
      r.build.capMs = 240000
    },
    r => {
      r.browserTimedOut = true
    },
    r => {
      r.sourceAfter = 'changed'
    },
    r => {
      r.cleanupVerified = false
    },
    r => {
      r.errors.push('runtime')
    },
    r => {
      r.dependencyChanges.push('changed')
    },
    r => {
      r.dependenciesAfterSha256 = 'b'.repeat(64)
    },
    r => {
      r.launch.chromiumSandbox = false
    },
    r => {
      r.launch.args.push('--no-sandbox')
    },
    r => {
      r.browserPath = '/tmp/chrome'
    },
  ]) {
    const copy = structuredClone(receipt)
    mutate(copy)
    assert.throws(() => validateProfileRecovery(copy, expected), /Profile recovery/)
  }
})
test('bounded log receipt rejects missing, duplicate, corrupted or reordered evidence', () => {
  const { receipt } = fixture(),
    log = recoveryReceiptLog(receipt)
  assert.deepEqual(profileRecoveryLog(log), receipt)
  assert.deepEqual(
    profileRecoveryLog(
      log
        .split('\n')
        .map(l => `2026-10-17T01:00:00Z ${l}`)
        .join('\n')
    ),
    receipt
  )
  for (const bad of [
    '',
    log + '\n' + log,
    log.split('\n').reverse().join('\n'),
    log.replace(/SHA256=([a-f0-9])/, (_, first) => `SHA256=${first === 'f' ? 'e' : 'f'}`),
    log.replace('RECEIPT=', 'RECEIPT=!'),
    log + '\nPND_PROFILE_RECOVERY_OTHER=x',
  ])
    assert.throws(() => profileRecoveryLog(bad))
  assert.throws(() => recoveryReceiptLog({ padding: 'x'.repeat(12001) }), /bounded/)
})
test('new policy is explicitly opted in and browser workflow transition pins both source digests', () => {
  const e = entry()
  validateEntry(e)
  assert.equal(gatesFor(e)[1], GATES[1])
  e.browserPolicy = 'profile-recovery-v1'
  assert.equal(gatesFor(e)[1], PROFILE_BROWSER_GATE)
  e.browserWorkflowTransition = {
    version: 1,
    workflow: GATES[1].workflow,
    sourceHead: e.sourceHead,
    base: e.reviewBase,
    baseSha256: 'b'.repeat(64),
    candidateSha256: h,
  }
  validateEntry(e)
  const o = {
    head: e.sourceHead,
    base: e.reviewBase,
    synthetic: { sha: oid(4) },
    workflows: [
      { path: GATES[0].workflow, ref: e.reviewBase, sha256: h },
      ...[e.reviewBase, e.sourceHead, oid(4)].map((ref, i) => ({
        path: GATES[1].workflow,
        ref,
        sha256: i ? h : 'b'.repeat(64),
      })),
    ],
  }
  assert.equal(reviewedWorkflows(e, o), true)
  for (const mutate of [
    x => {
      x.browserPolicy = 'other'
    },
    x => {
      delete x.browserPolicy
    },
    x => {
      x.allowMechanicalRefresh = true
    },
    x => {
      x.browserWorkflowTransition.base = oid(9)
    },
    x => {
      x.browserWorkflowTransition.workflow = GATES[0].workflow
    },
    x => {
      x.browserWorkflowTransition.candidateSha256 = 'c'.repeat(64)
    },
  ]) {
    const copy = structuredClone(e)
    mutate(copy)
    assert.throws(() => validateEntry(copy))
  }
  for (const mutate of [
    x => {
      x.head = oid(9)
    },
    x => {
      x.base = oid(9)
    },
    x => {
      x.workflows.pop()
    },
    x => {
      x.workflows[1].sha256 = h
    },
  ]) {
    const copy = structuredClone(o)
    mutate(copy)
    assert.equal(reviewedWorkflows(e, copy), false)
  }
})
function adapter() {
  const { receipt } = fixture(),
    e = entry()
  e.browserPolicy = 'profile-recovery-v1'
  const exact = {
    id: 100,
    run_attempt: 2,
    check_suite_id: 500,
    status: 'completed',
    conclusion: 'success',
    event: 'pull_request',
    path: GATES[1].workflow,
    head_sha: oid(1),
  }
  const pr = { head: { sha: oid(1) }, base: { sha: oid(3) } },
    synthetic = { sha: oid(4) }
  const row = { job: 'Tutorial browser', merge: oid(4) }
  const jobs = [
    { id: 200, name: 'Tutorial browser' },
    {
      id: 201,
      name: PROFILE_JOB,
      run_id: 100,
      run_attempt: 2,
      status: 'completed',
      conclusion: 'success',
      steps: PROFILE_STEPS.map(name => ({ name, conclusion: 'success' })),
      check_run_url: `https://api.github.com/repos/${e.repo}/check-runs/301`,
    },
  ]
  jobs.push({ id: 202, name: 'Pause checkpoint recovery browser' })
  const log = `PR_HEAD_SHA: ${oid(1)}\nPR_BASE_SHA: ${oid(3)}\n[command]/usr/bin/git log -1 --format=%H\n${oid(4)}\n${recoveryReceiptLog(receipt)}`
  const reader = new GitHubReader()
  reader.get = endpoint =>
    endpoint.endsWith('/logs')
      ? log
      : {
          id: 301,
          name: PROFILE_JOB,
          check_suite: { id: 500 },
          head_sha: oid(1),
          app: { id: 15368, slug: 'github-actions' },
          status: 'completed',
          conclusion: 'success',
        }
  reader.workflow = () => ({ sha256: h })
  reader.gitOutput = (_, ref) => ref.slice(ref.indexOf(':') + 1)
  return { reader, args: [e, pr, synthetic, exact, jobs, row] }
}
test('reader requires one genuine recovery job from the same source and current attempt', () => {
  const good = adapter()
  good.reader.verifyProfileRecoveryRun(...good.args)
  assert.equal(good.args[5].profileRecoveryVerified, true)
  for (const mutate of [
    a => {
      a[3].conclusion = 'failure'
    },
    a => {
      a[3].status = 'in_progress'
    },
    a => {
      a[3].head_sha = oid(9)
    },
    a => {
      delete a[0].browserPolicy
    },
    a => {
      a[4].splice(1, 1)
    },
    a => {
      a[4].push(a[4][1])
    },
    a => {
      a[4][1].run_attempt = 1
    },
    a => {
      a[4][1].run_id = 99
    },
    a => {
      a[4][1].conclusion = 'skipped'
    },
    a => {
      a[4][1].steps.pop()
    },
    a => {
      a[4][1].steps[0].conclusion = 'skipped'
    },
    a => {
      a[4][1].check_run_url = 'https://example.com/check-runs/301'
    },
  ]) {
    const f = adapter()
    mutate(f.args)
    assert.throws(() => f.reader.verifyProfileRecoveryRun(...f.args))
  }
  for (const property of ['id', 'head_sha', 'name', 'app', 'check_suite', 'conclusion', 'status']) {
    const f = adapter(),
      get = f.reader.get
    f.reader.get = endpoint => {
      const v = get(endpoint)
      if (!endpoint.endsWith('/logs')) v[property] = null
      return v
    }
    assert.throws(() => f.reader.verifyProfileRecoveryRun(...f.args))
  }
  for (const mutate of [
    r => {
      r.gitOutput = () => 'wrong'
    },
    r => {
      r.workflow = () => ({ sha256: 'b'.repeat(64) })
    },
    r => {
      const get = r.get
      r.get = endpoint =>
        endpoint.endsWith('/logs') ? get(endpoint).replace(oid(4), oid(9)) : get(endpoint)
    },
  ]) {
    const f = adapter()
    mutate(f.reader)
    assert.throws(() => f.reader.verifyProfileRecoveryRun(...f.args))
  }
})
test('green Tutorial cannot substitute for missing recovery proof under the new policy', () => {
  const latest = {
    conclusion: 'success',
    event: 'pull_request',
    identityVerified: true,
    base: oid(3),
    merge: oid(4),
    job: 'Tutorial browser',
    jobConclusion: 'success',
    app: 'github-actions',
    appId: 15368,
    pauseRecoveryVerified: true,
    pauseRecoveryCheckId: 302,
    checkId: 300,
    id: 100,
    attempt: 2,
    steps: GATES[1].steps.map(name => ({ name, conclusion: 'success' })),
  }
  const o = {
    base: oid(3),
    head: oid(1),
    synthetic: { sha: oid(4) },
    currentChecks: [
      {
        id: 300,
        name: 'Tutorial browser',
        head: oid(1),
        appId: 15368,
        status: 'completed',
        conclusion: 'success',
        startedAt: '2026-10-17T01:00:00Z',
      },
    ],
  }
  o.currentChecks.push({
    ...o.currentChecks[0],
    name: 'Pause checkpoint recovery browser',
    id: 302,
  })
  assert.throws(() => validatePassedGate(o, PROFILE_BROWSER_GATE, latest), /Failed, canceled/)
  latest.profileRecoveryVerified = true
  latest.profileRecoveryCheckId = 301
  assert.throws(() => validatePassedGate(o, PROFILE_BROWSER_GATE, latest))
  o.currentChecks.push({ ...o.currentChecks[0], name: PROFILE_JOB, id: 301 })
  validatePassedGate(o, PROFILE_BROWSER_GATE, latest)
  assert.throws(() =>
    validatePassedGate(o, PROFILE_BROWSER_GATE, { ...latest, pauseRecoveryVerified: undefined })
  )
  assert.throws(() =>
    validatePassedGate(
      { ...o, currentChecks: o.currentChecks.filter(c => c.id !== 302) },
      PROFILE_BROWSER_GATE,
      latest
    )
  )
  const bad = structuredClone(o)
  bad.currentChecks[2].conclusion = 'failure'
  assert.throws(
    () => validatePassedGate(bad, PROFILE_BROWSER_GATE, latest),
    /Current Profile recovery/
  )
  bad.currentChecks[2].conclusion = 'success'
  bad.currentChecks[2].id = 302
  assert.throws(
    () => validatePassedGate(bad, PROFILE_BROWSER_GATE, latest),
    /Current Profile recovery/
  )
  delete latest.profileRecoveryVerified
  validatePassedGate(o, GATES[1], latest)
})

test('three-job policy is explicit and does not infer authority from candidate workflow content', () => {
  const e = entry()
  assert.equal(gatesFor(e)[1], GATES[1])
  e.browserPolicy = 'pause-recovery-v1'
  assert.equal(gatesFor(e)[1].profileRequired, undefined)
  e.browserPolicy = 'profile-recovery-v1'
  assert.equal(gatesFor(e)[1], PROFILE_BROWSER_GATE)
  const f = adapter()
  f.args[0].browserPolicy = 'pause-recovery-v1'
  assert.throws(() => f.reader.verifyProfileRecoveryRun(...f.args), /explicit trusted policy/)
  assert.throws(() => f.reader.verifyPauseRecoveryRun(...f.args), /extra browser jobs/)
  const reader = new GitHubReader()
  reader.get = () => ({
    encoding: 'base64',
    content: Buffer.from('jobs:\n  profile-recovery-browser:\n').toString('base64'),
  })
  assert.deepEqual(Object.keys(reader.workflow(GATES[1].workflow, oid(1))), [
    'path',
    'ref',
    'sha256',
  ])
})

test('Profile requires every terminal case and original fixture boundaries', () => {
  const { receipt, expected } = fixture()
  for (const mutate of [
    r => {
      r.scenarioStatus = 'running'
    },
    r => {
      r.runtimeUnchanged = false
    },
    r => {
      r.cases[0].status = 'failed'
    },
    r => {
      r.cases.push(r.cases[0])
    },
    r => {
      r.cases.reverse()
    },
    r => {
      r.cases[7].fixture = true
    },
    r => {
      r.cases[0].kind = 'unknown'
    },
    r => {
      r.selectedScenario = 'tutorial'
    },
    r => {
      r.browserCapMs = 360000
    },
  ]) {
    const copy = structuredClone(receipt)
    mutate(copy)
    assert.throws(() => validateProfileRecovery(copy, expected), /Profile recovery/)
  }
})

test('both recovery scenarios and storage observer changes require browser acceptance', () => {
  for (const path of [
    'scripts/local-render/campaign-profile-recovery.mjs',
    'scripts/local-render/original-pause-checkpoint-recovery.mjs',
    'scripts/local-render/checkpoint-observer.mjs',
    'scripts/checkpoint-readback.mjs',
    'scripts/local-render/mission10-boat-checkpoint.mjs',
    'scripts/local-render/mission1-vault-input.mjs',
    'scripts/local-render/owned-profile.mjs',
    'qa/erosion-ordinary/input.mjs',
    'qa/erosion-ordinary/minimap-input.mjs',
  ])
    assert.equal(browserRequired([path]), true)
})
