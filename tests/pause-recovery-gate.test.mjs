import assert from 'node:assert/strict'
import test from 'node:test'
import {
  RECOVERY_JOB,
  RECOVERY_STEPS,
  RECOVERY_INPUTS,
  RECOVERY_CHECKS,
  RECOVERY_SCREENSHOTS,
  pauseRecoveryLog,
  validatePauseRecovery,
} from '../scripts/integration-queue/pause-recovery.mjs'
import { recoveryReceiptLog } from '../scripts/tutorial-browser/recovery-receipt.mjs'
import {
  GATES,
  RECOVERY_BROWSER_GATE,
  gatesFor,
  validateEntry,
  reviewedWorkflows,
  validatePassedGate,
  sha256,
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
  const inputs = Object.fromEntries(RECOVERY_INPUTS.map(p => [p, sha256(p)]))
  const receipt = {
    version: 1,
    kind: 'pause-recovery-browser',
    status: 'passed',
    identity,
    inputs,
    receiptSha256: h,
    selectedScenario: 'pause-checkpoint-recovery',
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
    checks: RECOVERY_CHECKS,
    screenshots: RECOVERY_SCREENSHOTS.map(([name, width, height, dpr]) => ({
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
  assert.equal(validatePauseRecovery(receipt, expected), true)
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
      delete r.inputs[RECOVERY_INPUTS[0]]
    },
    r => {
      r.inputs[RECOVERY_INPUTS[0]] = h
    },
    r => {
      r.inputs.extra = h
    },
    r => {
      r.receiptSha256 = ''
    },
    r => {
      r.checks = r.checks.slice(1)
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
    assert.throws(() => validatePauseRecovery(copy, expected), /Pause recovery/)
  }
})
test('bounded log receipt rejects missing, duplicate, corrupted or reordered evidence', () => {
  const { receipt } = fixture(),
    log = recoveryReceiptLog(receipt)
  assert.deepEqual(pauseRecoveryLog(log), receipt)
  assert.deepEqual(
    pauseRecoveryLog(
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
    log.replace(/SHA256=./, 'SHA256=f'),
    log.replace('RECEIPT=', 'RECEIPT=!'),
    log + '\nPND_PAUSE_RECOVERY_OTHER=x',
  ])
    assert.throws(() => pauseRecoveryLog(bad))
  assert.throws(() => recoveryReceiptLog({ padding: 'x'.repeat(12001) }), /bounded/)
})
test('new policy is explicitly opted in and browser workflow transition pins both source digests', () => {
  const e = entry()
  validateEntry(e)
  assert.equal(gatesFor(e)[1], GATES[1])
  e.browserPolicy = 'pause-recovery-v1'
  assert.equal(gatesFor(e)[1], RECOVERY_BROWSER_GATE)
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
  e.browserPolicy = 'pause-recovery-v1'
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
      name: RECOVERY_JOB,
      run_id: 100,
      run_attempt: 2,
      status: 'completed',
      conclusion: 'success',
      steps: RECOVERY_STEPS.map(name => ({ name, conclusion: 'success' })),
      check_run_url: `https://api.github.com/repos/${e.repo}/check-runs/301`,
    },
  ]
  const log = `PR_HEAD_SHA: ${oid(1)}\nPR_BASE_SHA: ${oid(3)}\n[command]/usr/bin/git log -1 --format=%H\n${oid(4)}\n${recoveryReceiptLog(receipt)}`
  const reader = new GitHubReader()
  reader.get = endpoint =>
    endpoint.endsWith('/logs')
      ? log
      : {
          id: 301,
          name: RECOVERY_JOB,
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
  good.reader.verifyPauseRecoveryRun(...good.args)
  assert.equal(good.args[5].pauseRecoveryVerified, true)
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
      a[4].pop()
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
    assert.throws(() => f.reader.verifyPauseRecoveryRun(...f.args))
  }
  for (const property of ['id', 'head_sha', 'name', 'app', 'check_suite', 'conclusion', 'status']) {
    const f = adapter(),
      get = f.reader.get
    f.reader.get = endpoint => {
      const v = get(endpoint)
      if (!endpoint.endsWith('/logs')) v[property] = null
      return v
    }
    assert.throws(() => f.reader.verifyPauseRecoveryRun(...f.args))
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
    assert.throws(() => f.reader.verifyPauseRecoveryRun(...f.args))
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
  assert.throws(() => validatePassedGate(o, RECOVERY_BROWSER_GATE, latest), /Failed, canceled/)
  latest.pauseRecoveryVerified = true
  latest.pauseRecoveryCheckId = 301
  assert.throws(() => validatePassedGate(o, RECOVERY_BROWSER_GATE, latest))
  o.currentChecks.push({ ...o.currentChecks[0], name: RECOVERY_JOB, id: 301 })
  validatePassedGate(o, RECOVERY_BROWSER_GATE, latest)
  const bad = structuredClone(o)
  bad.currentChecks[1].conclusion = 'failure'
  assert.throws(() => validatePassedGate(bad, RECOVERY_BROWSER_GATE, latest), /Current recovery/)
  bad.currentChecks[1].conclusion = 'success'
  bad.currentChecks[1].id = 302
  assert.throws(() => validatePassedGate(bad, RECOVERY_BROWSER_GATE, latest), /Current recovery/)
  delete latest.pauseRecoveryVerified
  validatePassedGate(o, GATES[1], latest)
})

test('actual runner footer preserves browser failure and records malformed success evidence failure', async () => {
  const { readFileSync } = await import('node:fs')
  const source = readFileSync(
    new URL('../scripts/tutorial-browser/run.mjs', import.meta.url),
    'utf8'
  )
  const footer = source.slice(source.indexOf('  receipt.endedAt ='), source.lastIndexOf('\n}'))
  const finish = new Function(
    'receipt',
    'selectedScenario',
    'save',
    'console',
    'recoveryReceiptLog',
    'recoveryReceipt',
    'out',
    'process',
    footer
  )
  for (const status of ['failed', 'passed']) {
    const receipt = { status, failure: 'original diagnostic', pauseCheckpointRecovery: {} }
    let attempts = 0
    const saved = [],
      runtime = {}
    finish(
      receipt,
      'pause-checkpoint-recovery',
      () => saved.push(structuredClone(receipt)),
      { log() {} },
      value => value,
      () => {
        attempts++
        throw Error('incomplete evidence')
      },
      '/unused',
      runtime
    )
    assert.equal(receipt.failure, 'original diagnostic')
    assert.equal(receipt.status, 'failed')
    assert.equal(attempts, status === 'failed' ? 0 : 1)
    assert.equal(saved.at(-1).status, 'failed')
    if (status === 'passed') {
      assert.match(receipt.evidenceError, /incomplete evidence/)
      assert.equal(runtime.exitCode, 1)
    }
  }
})

test('producer hashes actual evidence files and forwards real child close/build deadline fields', async t => {
  const { mkdtempSync, writeFileSync, rmSync, readFileSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const { spawn } = await import('node:child_process')
  const { recoveryReceipt } = await import('../scripts/tutorial-browser/recovery-receipt.mjs')
  const dir = mkdtempSync(join(tmpdir(), 'pause-receipt-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const { receipt: proof, expected } = fixture()
  const close = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['-e', ''], { stdio: 'ignore' })
    child.on('error', reject)
    child.on('close', (code, signal) =>
      resolve({ pid: child.pid, exitCode: code, signal, timedOut: false, capMs: 120000 })
    )
  })
  assert.equal(close.signal, null)
  const raw = {
    ...proof,
    source: { commit: expected.identity.mergeSha, files: expected.inputs },
    build: close,
    pauseCheckpointRecovery: { checks: proof.checks, screenshots: proof.screenshots },
  }
  writeFileSync(join(dir, 'receipt.json'), JSON.stringify(raw))
  for (const s of proof.screenshots) writeFileSync(join(dir, s.name), `capture:${s.name}`)
  const env = {
    GITHUB_REPOSITORY: expected.identity.repository,
    GITHUB_RUN_ID: expected.identity.runId,
    GITHUB_RUN_ATTEMPT: expected.identity.runAttempt,
    GITHUB_WORKFLOW_REF: expected.identity.workflowRef,
    PR_HEAD_SHA: expected.identity.headSha,
    PR_BASE_SHA: expected.identity.baseSha,
  }
  const produced = recoveryReceipt(raw, dir, env)
  assert.equal(validatePauseRecovery(produced, expected), true)
  assert.deepEqual(produced.build, close)
  assert.equal(produced.receiptSha256, sha256(readFileSync(join(dir, 'receipt.json'))))
  const runner = readFileSync(
    new URL('../scripts/tutorial-browser/run.mjs', import.meta.url),
    'utf8'
  )
  assert.match(
    runner,
    /resolveBuild\(\{ pid: child.pid, exitCode: code, signal, timedOut, capMs: 120000 \}\)/
  )
  assert.match(runner, /receipt.browserCapMs = 180000/)
  for (const result of [undefined, {}, { checks: [] }, { screenshots: [] }])
    assert.throws(
      () => recoveryReceipt({ ...raw, pauseCheckpointRecovery: result }, dir, env),
      /checks and screenshots/
    )
  rmSync(join(dir, proof.screenshots[0].name))
  assert.throws(() => recoveryReceipt(raw, dir, env), /ENOENT/)
})
