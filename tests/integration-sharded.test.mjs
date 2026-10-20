import assert from 'node:assert/strict'
import test from 'node:test'
import { GATES, SHARDED_FULL_GATE, gatesFor, reviewedWorkflows, validateEntry, decide, sha256 } from '../scripts/integration-queue/policy.mjs'
import { BASELINE_DIAGNOSTIC, SHARDED_JOBS, shardedLogReceipt, validateShardedReceipt, validateBaselineLog } from '../scripts/integration-queue/sharded.mjs'
import { SHARD_COST_PATH, parseShardCosts, partitionTestFiles } from '../scripts/orchestration/test-shard-policy.mjs'
import { GitHubReader } from '../scripts/integration-queue/github.mjs'

const oid = n => String(n).repeat(40)
const h = 'a'.repeat(64)
function fixture() {
  const identity = { repository: 'JohnDeved/populous-new-dawn', runId: '100', runAttempt: '2',
    workflowRef: 'JohnDeved/populous-new-dawn/.github/workflows/ready-pr-check.yml@refs/pull/123/merge',
    workflowSha: oid(4), mergeSha: oid(4), headSha: oid(1), baseSha: oid(3), treeSha: oid(5), workflowSha256: h }
  const inventory = Array.from({ length: 8 }, (_, i) => ({ file: `tests/a${i}.test.mjs`, sha256: sha256(`test ${i}\n`) }))
  const runtime = { node: '24.19.0', npm: '11.9.0', python: '3.12.14', pillow: '12.3.0',
    platform: 'linux', arch: 'x64', lockSha256: sha256('lock\n'), installedLockSha256: h }
  const envelope = kind => ({ version: 1, kind, identity, inventory, runtime, status: 'passed' })
  const quality = { ...envelope('quality'), stages: ['typecheck', 'parity', 'orchestration', 'build'] }
  const shards = Array.from({ length: 4 }, (_, index) => {
    const files = inventory.filter((_, i) => i % 4 === index).map(i => i.file)
    return { ...envelope('shard'), shard: { version: 1, kind: 'pnd-test-shard-receipt',
      plan: { mode: 'shard', fullSuite: false, shard: { index, count: 4, algorithm: 'sorted-round-robin-v1' },
        discovered: inventory.map(i => i.file), files, groups: [{ concurrency: 1, files }], inputFingerprint: h },
      inputsBefore: h, inputsAfter: h, inputError: null,
      result: { mode: 'shard', fullSuite: false, complete: true, shardComplete: true, interrupted: null, status: 'passed',
        results: [{ files, concurrency: 1, exitCode: 0, signal: null, error: null, status: 'passed',
          command: ['/usr/bin/node', '--test', '--test-concurrency=1', '--test-reporter=tap', ...files] }] } } }
  })
  return { receipt: { ...envelope('full-check'), quality, shards }, expected: { identity, inventory, lockSha256: runtime.lockSha256, shardCostBytes: null } }
}

function receiptLog(receipt) {
  const raw = JSON.stringify(receipt), encoded = Buffer.from(raw).toString('base64')
  const count = Math.ceil(encoded.length / 16000)
  return Array.from({ length: count }, (_, index) =>
    `PND_FULL_CHECK_RECEIPT_CHUNK=${index}/${count}:${encoded.slice(index * 16000, (index + 1) * 16000)}`)
    .concat(`PND_FULL_CHECK_RECEIPT_SHA256=${sha256(raw)}`).join('\n')
}

test('trusted shard receipt requires exact four-way coverage and independently bound source', () => {
  const { receipt, expected } = fixture()
  assert.equal(validateShardedReceipt(receipt, expected), true)
  for (const mutate of [
    r => { r.shards.pop() },
    r => { r.shards.push(r.shards[0]) },
    r => { r.shards[1] = r.shards[0] },
    r => { r.shards[0].identity = { ...r.identity, runAttempt: '1' } },
    r => { r.shards[0].shard.plan.files.pop() },
    r => { r.shards[0].shard.plan.files.push(r.shards[1].shard.plan.files[0]) },
    r => { r.shards[0].shard.plan.discovered.pop() },
    r => { r.inventory[0].sha256 = 'b'.repeat(64) },
    r => { r.shards[0].shard.inputsAfter = 'b'.repeat(64) },
    r => { r.shards[0].shard.inputsBefore = 'b'.repeat(64) },
    r => { r.shards[0].shard.inputError = 'mutation' },
    r => { r.shards[0].shard.result.shardComplete = false },
    r => { r.shards[0].shard.result.interrupted = 'SIGTERM' },
    r => { r.shards[0].shard.result.results[0].exitCode = 1 },
    r => { r.shards[0].shard.result.results[0].command.push('--test-name-pattern=none') },
    r => { r.shards[0].shard.result.results[0].status = 'skipped' },
    r => { r.quality.stages.pop() },
    r => { r.quality.status = 'skipped' },
    r => { r.runtime.node = '22.0.0' },
  ]) {
    const copy = structuredClone(receipt)
    mutate(copy)
    assert.throws(() => validateShardedReceipt(copy, expected), /Sharded Full check/)
  }
})

test('chunked aggregate receipt rejects absent, duplicate, missing, reordered or corrupted logs', () => {
  const { receipt } = fixture(), marker = receiptLog(receipt)
  assert.deepEqual(shardedLogReceipt(marker.split('\n').map(l => `2026-10-17T02:00:00Z ${l}`).join('\n')), receipt)
  const lines = marker.split('\n')
  assert.ok(lines.length > 2)
  for (const log of ['', `${marker}\n${marker}`, `echo '${marker}'`,
    lines.slice(1).join('\n'), [...lines].reverse().join('\n'),
    marker.replace('CHUNK=0/', 'CHUNK=1/'), marker.replace(/SHA256=./, 'SHA256=0'),
    marker.replace(/:[A-Za-z0-9+/]/, ':!'), marker + '\nPND_FULL_CHECK_RECEIPT={}'])
    assert.throws(() => shardedLogReceipt(log))
})

function transitionEntry() {
  return { version: 1, repo: 'JohnDeved/populous-new-dawn', pr: 123, baseRef: 'main',
    sourceHead: oid(1), sourceTree: oid(2), reviewBase: oid(3), approvedBy: 'parent',
    allowMechanicalRefresh: false, requireBrowser: false,
    review: { reviewer: 'reviewer', decision: 'ACCEPT', head: oid(1), base: oid(3), sha256: h, file: '/review' },
    workflowHashes: Object.fromEntries(GATES.map(g => [g.workflow, h])), fullCheckPolicy: 'sharded-v1',
    workflowTransition: { version: 1, workflow: GATES[0].workflow, sourceHead: oid(1), base: oid(3), baseSha256: 'b'.repeat(64), candidateSha256: h },
    deployment: { kind: 'unverified', reason: 'fixture' } }
}

test('legacy default stays unchanged and workflow transition pins exact old main and new source', () => {
  const e = transitionEntry(), t = e.workflowTransition
  const o = { head: e.sourceHead, base: e.reviewBase, synthetic: { sha: oid(4) }, workflows: [
    { path: t.workflow, ref: t.base, sha256: t.baseSha256 },
    { path: t.workflow, ref: t.sourceHead, sha256: h },
    { path: t.workflow, ref: oid(4), sha256: h },
    { path: GATES[1].workflow, ref: t.base, sha256: h },
  ] }
  validateEntry(e)
  assert.equal(gatesFor(e)[0], SHARDED_FULL_GATE)
  assert.equal(reviewedWorkflows(e, o), true)
  for (const mutate of [
    x => { x.base = oid(9) }, x => { x.head = oid(9) },
    x => { x.workflows[0].sha256 = h },
    x => { x.workflows[1].sha256 = t.baseSha256 },
    x => { x.workflows[2].ref = oid(9) },
    x => { x.workflows.splice(2, 1) },
    x => { x.workflows.splice(0, 1) }, x => { x.workflows.splice(1, 1) },
  ]) { const copy = structuredClone(o); mutate(copy); assert.equal(reviewedWorkflows(e, copy), false) }
  for (const mutate of [
    x => { x.workflowTransition = null }, x => { x.workflowTransition = {} },
    x => { x.workflowTransition.version = 2 },
    x => { x.workflowTransition.baseSha256 = h },
    x => { x.allowMechanicalRefresh = true }, x => { x.workflowTransition.sourceHead = oid(9) },
    x => { x.workflowTransition.base = oid(9) }, x => { x.workflowTransition.candidateSha256 = 'c'.repeat(64) },
    x => { x.fullCheckPolicy = 'legacy-v1' }, x => { x.workflowTransition.workflow = GATES[1].workflow },
  ]) { const copy = structuredClone(e); mutate(copy); assert.throws(() => validateEntry(copy), /transition/) }
  const merged = structuredClone(o); merged.merged = true; merged.base = oid(6)
  merged.workflows = merged.workflows.map(w => ({ ...w, sha256: h }))
  assert.equal(reviewedWorkflows(e, merged), true)
  merged.workflows[0].sha256 = t.baseSha256
  assert.equal(reviewedWorkflows(e, merged), false)
  delete e.workflowTransition; delete e.fullCheckPolicy
  validateEntry(e)
  assert.equal(gatesFor(e)[0], GATES[0])
  assert.equal(reviewedWorkflows(e, o), false)
})

test('workflow transition cannot inherit an unrelated checkpoint authorization', () => {
  const e = transitionEntry()
  const saved = { version: 1, authorization: h, head: e.sourceHead }
  const outcome = decide(e, {}, saved)
  assert.equal(outcome.status, 'stop')
  assert.match(outcome.reason, /authorization changed/)
})

function adapterFixture() {
  const { receipt, expected } = fixture(), e = transitionEntry()
  delete e.workflowTransition
  const exact = { id: 100, run_attempt: 2, check_suite_id: 500 }
  const pr = { head: { sha: oid(1) }, base: { sha: oid(3) } }
  const synthetic = { sha: oid(4), tree: oid(5) }
  const row = { job: 'Full check', merge: oid(4) }
  const specs = [{ name: 'Full check', steps: SHARDED_FULL_GATE.steps }, ...SHARDED_JOBS]
  const jobs = specs.map((s, i) => ({ id: 200 + i, name: s.name, run_id: 100, run_attempt: 2,
    check_run_url: `https://api.github.com/repos/${e.repo}/check-runs/${300 + i}`,
    status: 'completed', conclusion: 'success', steps: s.steps.map(name => ({ name, conclusion: 'success' })) }))
  const identityLog = `PR_HEAD_SHA: ${oid(1)}\nPR_BASE_SHA: ${oid(3)}\n[command]/usr/bin/git log -1 --format=%H\n${oid(4)}\n`
  const log = `${identityLog}${receiptLog(receipt)}\n`
  const reader = new GitHubReader()
  reader.get = endpoint => {
    if (endpoint.endsWith('/logs')) return identityLog
    const i = Number(endpoint.split('/').at(-1)) - 300
    return { id: 300 + i, name: specs[i].name, check_suite: { id: 500 }, head_sha: oid(1),
      app: { id: 15368, slug: 'github-actions' }, status: 'completed', conclusion: 'success' }
  }
  reader.workflow = () => ({ sha256: h })
  reader.git = (...args) => args.at(-1) === SHARD_COST_PATH ? '' : expected.inventory.map(i => i.file).join('\n')
  reader.gitOutput = (_, ref) => ref.endsWith('package-lock.json') ? 'lock\n' : `test ${ref.match(/a(\d)\.test/)[1]}\n`
  return { reader, args: [e, pr, synthetic, exact, jobs, row, log] }
}

test('read-only adapter requires actual unique current-attempt jobs and mandatory successful steps', () => {
  const valid = adapterFixture()
  valid.reader.verifyShardedRun(...valid.args)
  assert.equal(valid.args[5].shardedVerified, true)
  for (const mutate of [
    jobs => { jobs.pop() }, jobs => { jobs.push(jobs[0]) },
    jobs => { jobs[2].name = jobs[1].name }, jobs => { jobs[2].run_attempt = 1 },
    jobs => { jobs[2].run_id = 99 }, jobs => { jobs[2].conclusion = 'skipped' },
    jobs => { jobs[2].conclusion = 'cancelled' }, jobs => { jobs[1].steps.pop() },
    jobs => { jobs[1].steps[6].conclusion = 'skipped' },
    jobs => { jobs[2].check_run_url = 'https://example.com/check-runs/1' },
  ]) {
    const { reader, args } = adapterFixture(); mutate(args[4])
    assert.throws(() => reader.verifyShardedRun(...args))
  }
  for (const property of ['id', 'head_sha', 'name', 'app', 'check_suite', 'conclusion', 'status']) {
    const { reader, args } = adapterFixture(), get = reader.get.bind(reader)
    reader.get = endpoint => { const value = get(endpoint); if (!endpoint.endsWith('/logs')) value[property] = null; return value }
    assert.throws(() => reader.verifyShardedRun(...args), /check identity/)
  }
})

test('policy rejects a merely named green aggregate without trusted sharded proof', () => {
  const e = transitionEntry(); delete e.workflowTransition
  const now = 1_000_000
  const o = { repo: e.repo, pr: e.pr, baseRef: 'main', observedAt: now, complete: true, consistent: true,
    reviewDigest: h, head: e.sourceHead, base: e.reviewBase,
    headCommit: { tree: e.sourceTree }, protection: { strict: true, admins: true, pullRequests: true, noBypass: true, fullCheck: true, supported: true },
    workflows: GATES.map(g => ({ path: g.workflow, sha256: h })),
    state: 'open', draft: false, upToDate: true, mergeable: true, mergeState: 'clean', changedPaths: ['scripts/integration-queue/policy.mjs'],
    synthetic: { sha: oid(4), tree: oid(5), parents: [e.reviewBase, e.sourceHead] },
    resource: { status: 'observed', fullSuite: true, candidate: oid(4), tree: oid(5) },
    runs: [{ id: 100, attempt: 2, workflow: GATES[0].workflow, head: e.sourceHead, base: e.reviewBase,
      merge: oid(4), status: 'completed', conclusion: 'success', identityVerified: true,
      startedAt: '2026-10-17T02:00:00Z', job: 'Full check', jobConclusion: 'success',
      event: 'pull_request', app: 'github-actions', appId: 15368, checkId: 300,
      steps: SHARDED_FULL_GATE.steps.map(name => ({ name, conclusion: 'success' })) }],
    currentChecks: [{ id: 300, name: 'Full check', head: e.sourceHead, appId: 15368,
      startedAt: '2026-10-17T02:00:00Z', status: 'completed', conclusion: 'success' }] }
  const first = decide(e, o, null, now)
  o.observedAt = now + 60_001
  assert.equal(decide(e, o, first.checkpoint, o.observedAt).status, 'stop')
  o.runs[0].shardedVerified = true
  assert.equal(decide(e, o, first.checkpoint, o.observedAt).action?.kind, 'merge')
})


test('reader rejects foreign worker checkout, workflow source, ref and altered Git bytes', () => {
  for (const [mutate, reason] of [
    [({ reader }) => { const get = reader.get.bind(reader); reader.get = endpoint => endpoint.endsWith('/logs') ? get(endpoint).replace(oid(4), oid(9)) : get(endpoint) }, /worker tested a different candidate/],
    [({ args }) => { const log = shardedLogReceipt(args[6]); log.identity.workflowSha = oid(9); args[6] = args[6].slice(0, args[6].indexOf('PND_FULL_CHECK_RECEIPT')) + receiptLog(log) }, /workflow source\/ref differs/],
    [({ args }) => { const log = shardedLogReceipt(args[6]); log.identity.workflowRef = 'wrong'; args[6] = args[6].slice(0, args[6].indexOf('PND_FULL_CHECK_RECEIPT')) + receiptLog(log) }, /workflow source\/ref differs/],
    [({ reader }) => { reader.workflow = () => ({ sha256: 'b'.repeat(64) }) }, /workflow source\/ref differs/],
    [({ reader }) => { reader.gitOutput = () => 'altered source' }, /test inventory differs/],
  ]) { const f = adapterFixture(); mutate(f); assert.throws(() => f.reader.verifyShardedRun(...f.args), reason) }
})


test('only an explicitly pinned activation diagnostic may extend the six-job gate', () => {
  function diagnosticFixture(activationPr = 123) {
    const f = adapterFixture(), [e, , , , jobs] = f.args
    e.fullCheckDiagnostic = { activationPr }
    const conclusion = activationPr === e.pr ? 'success' : 'skipped'
    jobs.push({ id: 206, name: BASELINE_DIAGNOSTIC.name, run_id: 100, run_attempt: 2,
      check_run_url: `https://api.github.com/repos/${e.repo}/check-runs/306`,
      status: 'completed', conclusion, steps: conclusion === 'skipped' ? [] :
        BASELINE_DIAGNOSTIC.steps.map(name => ({ name, conclusion: 'success' })) })
    const get = f.reader.get.bind(f.reader)
    f.reader.get = endpoint => endpoint.endsWith('/jobs/206/logs') ? `${get(endpoint)}${baselineLog(fixture().expected.inventory)}` : endpoint.endsWith('/check-runs/306') ? {
      id: 306, name: BASELINE_DIAGNOSTIC.name, check_suite: { id: 500 }, head_sha: oid(1),
      app: { id: 15368, slug: 'github-actions' }, status: 'completed', conclusion,
    } : get(endpoint)
    return f
  }
  for (const pr of [123, 999]) {
    const f = diagnosticFixture(pr)
    validateEntry(f.args[0])
    f.reader.verifyShardedRun(...f.args)
    assert.equal(f.args[5].shardedVerified, true)
  }
  for (const [activationPr, mutate] of [
    [123, f => { delete f.args[0].fullCheckDiagnostic }],
    [123, f => { f.args[4].pop() }],
    [123, f => { f.args[4][6].name = 'Arbitrary green job' }],
    [123, f => { f.args[4][6].conclusion = 'skipped'; f.args[4][6].steps = [] }],
    [123, f => { f.args[4][6].conclusion = 'failure' }],
    [123, f => { f.args[4][6].conclusion = 'cancelled' }],
    [123, f => { f.args[4][6].run_attempt = 1 }],
    [123, f => { f.args[4][6].steps.pop() }],
    [999, f => { f.args[4][6].conclusion = 'success' }],
    [999, f => { f.args[4][6].steps = [{ name: 'Legacy full test suite', conclusion: 'success' }] }],
    [999, f => { f.args[4][6].check_run_url = f.args[4][0].check_run_url }],
  ]) { const f = diagnosticFixture(activationPr); mutate(f); assert.throws(() => f.reader.verifyShardedRun(...f.args)) }
  for (const diagnostic of [null, {}, { activationPr: 0 }, { activationPr: '123' }, { activationPr: 123, ignoreFailure: true }]) {
    const e = transitionEntry(); e.fullCheckDiagnostic = diagnostic
    assert.throws(() => validateEntry(e), /Diagnostic policy/)
  }
})


function baselineLog(inventory) {
  const files = inventory.map(i => i.file), groups = [{ files, concurrency: 1 }]
  const plan = { kind: 'pnd-test-plan', mode: 'all', fullSuite: true, files, groups }
  const result = { kind: 'pnd-test-result', mode: 'all', fullSuite: true, complete: true, interrupted: null, status: 'passed',
    results: [{ files, concurrency: 1, exitCode: 0, signal: null, error: null, status: 'passed',
      command: ['/usr/bin/node', '--test', '--test-concurrency=1', '--test-reporter=tap', ...files] }] }
  return `${JSON.stringify(plan)}\n${JSON.stringify(result)}\n`
}

test('baseline diagnostics prove independent full coverage and real subprocess success', () => {
  const { inventory } = fixture().expected, log = baselineLog(inventory)
  assert.equal(validateBaselineLog(log, inventory), true)
  for (const mutate of [
    ([p]) => { p.files.pop() }, ([p]) => { p.mode = 'focus' },
    ([p]) => { p.groups[0].files.pop() },
    ([, r]) => { r.complete = false }, ([, r]) => { r.results[0].exitCode = 1 },
    ([, r]) => { r.results[0].command.push('--test-name-pattern=nothing') },
    rows => { rows.push(rows[1]) }, rows => { rows.pop() },
  ]) { const rows = log.trim().split('\n').map(JSON.parse); mutate(rows)
    assert.throws(() => validateBaselineLog(rows.map(r => JSON.stringify(r)).join('\n'), inventory), /baseline/) }
})

const reporterBytes = 'trusted reporter source\n'
function enableTiming(receipt) {
  for (const envelope of [receipt, receipt.quality, ...receipt.shards])
    envelope.runtime.timingReporterSha256 = sha256(reporterBytes)
  for (const shard of receipt.shards) for (const result of shard.shard.result.results)
    result.command = ['/usr/bin/node', '--test', `--test-concurrency=${result.concurrency}`,
      '--test-reporter=tap', '--test-reporter-destination=stdout',
      '--test-reporter=./scripts/orchestration/test-timing-reporter.mjs',
      '--test-reporter-destination=stderr', ...result.files]
}

test('trusted timing command admits only fixed reporter with independently bound source', () => {
  const { receipt, expected } = fixture()
  enableTiming(receipt)
  expected.timingReporterSha256 = sha256(reporterBytes)
  assert.equal(validateShardedReceipt(receipt, expected), true)
  for (const mutate of [
    r => { r.shards[0].shard.result.results[0].command.push('--test-name-pattern=skip') },
    r => { r.shards[0].shard.result.results[0].command[5] = '--test-reporter=evil' },
    r => { r.shards[0].shard.result.results[0].command[6] = '--test-reporter-destination=stdout' },
    r => { r.shards[0].shard.result.results[0].command.splice(4, 1) },
    r => { r.shards[0].shard.result.results[0].exitCode = 1 },
    r => { r.runtime.timingReporterSha256 = 'f'.repeat(64) },
    r => { delete r.runtime.timingReporterSha256 },
  ]) {
    const bad = structuredClone(receipt)
    mutate(bad)
    assert.throws(() => validateShardedReceipt(bad, expected), /Sharded Full check/)
  }
  for (const hash of [undefined, 'f'.repeat(64), 'invalid'])
    assert.throws(() => validateShardedReceipt(receipt, { ...expected, timingReporterSha256: hash }))
})

test('reader obtains diagnostic reporter hash from exact merge Git bytes, not receipt claims', () => {
  for (const altered of [false, true]) {
    const { reader, args } = adapterFixture()
    const receipt = shardedLogReceipt(args[6])
    enableTiming(receipt)
    args[6] = args[6].slice(0, args[6].indexOf('PND_FULL_CHECK_RECEIPT')) + receiptLog(receipt)
    const gitOutput = reader.gitOutput.bind(reader), seen = []
    reader.gitOutput = (command, ref) => {
      if (ref.endsWith(':scripts/orchestration/test-timing-reporter.mjs')) {
        seen.push(ref)
        return altered ? 'changed reporter' : reporterBytes
      }
      return gitOutput(command, ref)
    }
    if (altered) assert.throws(() => reader.verifyShardedRun(...args), /test subprocess/)
    else {
      reader.verifyShardedRun(...args)
      assert.equal(args[5].shardedVerified, true)
    }
    assert.deepEqual(seen, [`${oid(4)}:scripts/orchestration/test-timing-reporter.mjs`])
  }
})


const weightedBytes = JSON.stringify({ version: 1, algorithm: 'duration-lpt-v1',
  source: { runId: '100', headSha: oid(1), mergeSha: oid(4) },
  defaultMs: 1000, overheadMs: 400, costs: [['tests/a0.test.mjs', 10000], ['tests/a4.test.mjs', 9000]] })
function enableWeighted(receipt) {
  const costs = parseShardCosts(weightedBytes)
  for (const { shard } of receipt.shards) {
    const files = partitionTestFiles(receipt.inventory.map(i => i.file), shard.plan.shard.index, 4, costs)
    shard.plan.shard = { index: shard.plan.shard.index, count: 4, algorithm: costs.algorithm, costsSha256: sha256(weightedBytes) }
    shard.plan.files = files
    shard.plan.groups = [{ concurrency: 1, files }]
    shard.result.results = [{ files, concurrency: 1, exitCode: 0, signal: null, error: null, status: 'passed',
      command: ['/usr/bin/node', '--test', '--test-concurrency=1', '--test-reporter=tap', ...files] }]
  }
}

test('weighted receipt reconstruction requires independently selected exact policy and rejects downgrade', () => {
  const { receipt, expected } = fixture(), legacy = structuredClone(receipt)
  enableWeighted(receipt)
  const weighted = { ...expected, shardCostBytes: weightedBytes }
  assert.equal(validateShardedReceipt(receipt, weighted), true)
  assert.throws(() => validateShardedReceipt(receipt, expected), /coverage/)
  assert.throws(() => validateShardedReceipt(legacy, weighted), /coverage/)
  const missing = { ...expected }; delete missing.shardCostBytes
  assert.throws(() => validateShardedReceipt(legacy, missing), /independently selected/)
  for (const bytes of ['{}', undefined, weightedBytes + ' ', weightedBytes.replace('10000', '20000')])
    assert.throws(() => validateShardedReceipt(receipt, { ...expected, shardCostBytes: bytes }))
  for (const mutate of [
    r => { r.shards[0].shard.plan.shard.costsSha256 = h },
    r => { r.shards[0].shard.plan.shard.algorithm = 'sorted-round-robin-v1' },
    r => { r.shards[0].shard.plan.files.push(r.shards[1].shard.plan.files[0]) },
    r => { [r.shards[0].shard.plan.files, r.shards[1].shard.plan.files] = [r.shards[1].shard.plan.files, r.shards[0].shard.plan.files] },
    r => { r.shards[0].shard.plan.shard.extra = true },
  ]) {
    const copy = structuredClone(receipt); mutate(copy)
    assert.throws(() => validateShardedReceipt(copy, weighted), /coverage/)
  }
})

test('reader selects weighted policy from exact Git source, not receipt algorithm or hash claims', () => {
  for (const variant of ['valid', 'downgrade', 'missing', 'changed', 'malformed']) {
    const { reader, args } = adapterFixture()
    const receipt = shardedLogReceipt(args[6])
    if (variant !== 'downgrade') enableWeighted(receipt)
    args[6] = args[6].slice(0, args[6].indexOf('PND_FULL_CHECK_RECEIPT')) + receiptLog(receipt)
    const git = reader.git.bind(reader), gitOutput = reader.gitOutput.bind(reader), seen = []
    reader.git = (...values) => {
      if (values.at(-1) === SHARD_COST_PATH) {
        assert.deepEqual(values, ['ls-tree', '-r', '--name-only', oid(4), '--', SHARD_COST_PATH])
        return variant === 'missing' ? '' : SHARD_COST_PATH
      }
      return git(...values)
    }
    reader.gitOutput = (command, ref) => {
      if (ref.endsWith(`:${SHARD_COST_PATH}`)) {
        seen.push(ref)
        return variant === 'changed' ? weightedBytes + ' ' : variant === 'malformed' ? '{}' : weightedBytes
      }
      return gitOutput(command, ref)
    }
    if (variant === 'valid') {
      reader.verifyShardedRun(...args)
      assert.equal(args[5].shardedVerified, true)
    } else assert.throws(() => reader.verifyShardedRun(...args))
    assert.deepEqual(seen, variant === 'missing' ? [] : [`${oid(4)}:${SHARD_COST_PATH}`])
  }
})
