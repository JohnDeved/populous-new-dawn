import assert from 'node:assert/strict'
import test from 'node:test'
import { gzipSync } from 'node:zlib'
import { reportLines } from '../scripts/orchestration/ci-gate.mjs'
import { GATES, SHARDED_FULL_GATE, gatesFor, reviewedWorkflows, validateEntry, decide, sha256 } from '../scripts/integration-queue/policy.mjs'
import { BASELINE_DIAGNOSTIC, SHARDED_JOBS, shardedLogReceipt, validateShardedReceipt, validateBaselineLog } from '../scripts/integration-queue/sharded.mjs'
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
  return { receipt: { ...envelope('full-check'), quality, shards }, expected: { identity, inventory, lockSha256: runtime.lockSha256 } }
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
  reader.git = () => expected.inventory.map(i => i.file).join('\n')
  reader.gitOutput = (_, ref) => ref.endsWith(':package.json') ? '{}' : ref.endsWith('package-lock.json') ? 'lock\n' : `test ${ref.match(/a(\d)\.test/)[1]}\n`
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
    [({ reader }) => { const get = reader.gitOutput.bind(reader); reader.gitOutput = (command, ref) => ref.includes(':tests/') ? 'altered source' : get(command, ref) }, /test inventory differs/],
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

// Independent known-answer fixture: a hand-built gzip member with one stored
// DEFLATE block for ASCII 123456789. Standard CRC32 check value is cbf43926.
// Neither this fixture nor its SHA256 comes from the production encoder.
const knownRaw = '123456789'
const knownSha = '15e2b0d3c33891ebb0f1ef609ec419420c20e320ce94c65fbc8c3312448eb225'
const knownGzip = Buffer.from('1f8b0800000000000003010900f6ff3132333435363738392639f4cb09000000', 'hex')
const transportHeader = 'PND_FULL_CHECK_RECEIPT_TRANSPORT=2:gzip-base64'
function transportFixture(bytes, digest = knownSha, header = transportHeader) {
  const encoded = bytes.toString('base64'), count = Math.ceil(encoded.length / 16000)
  const chunks = Array.from({ length: count }, (_, index) =>
    `PND_FULL_CHECK_RECEIPT_CHUNK=${index}/${count}:${encoded.slice(index * 16000, (index + 1) * 16000)}`)
  return [...(header === null ? [] : [header]), ...chunks, `PND_FULL_CHECK_RECEIPT_SHA256=${digest}`].join('\n')
}

test('known gzip and intentional historical plain fixtures decode independently', () => {
  assert.equal(shardedLogReceipt(transportFixture(knownGzip)), 123456789)
  const plain = `PND_FULL_CHECK_RECEIPT_CHUNK=0/1:MTIzNDU2Nzg5\nPND_FULL_CHECK_RECEIPT_SHA256=${knownSha}`
  assert.equal(shardedLogReceipt(plain), 123456789)
  assert.equal(shardedLogReceipt(transportFixture(knownGzip).split('\n')
    .map(line => `2026-10-20T03:15:09.000Z ${line}`).join('\n')), 123456789)
})

test('production gzip transport preserves complete independently validated receipt', () => {
  const { receipt, expected } = fixture()
  const decoded = shardedLogReceipt(reportLines(receipt).join('\n'))
  assert.deepEqual(decoded, receipt)
  assert.equal(validateShardedReceipt(decoded, expected), true)
})

test('versioned transport rejects headers, mixed codecs, ordering and corruption', () => {
  const good = transportFixture(knownGzip), lines = good.split('\n')
  for (const bad of [
    good.replace('2:gzip-base64', '3:gzip-base64'),
    good.replace('2:gzip-base64', '2:plain-base64'),
    good.replace('TRANSPORT=', 'TRANSPORT ='),
    good.replace('TRANSPORT=2', 'TRANSPORT=02'),
    good.replace('gzip-base64', 'gzip-base64 '),
    `${transportHeader}\n${good}`, `${good}\n${transportHeader}`,
    [lines[1], lines[0], lines[2]].join('\n'),
    [lines[0], lines[2], lines[1]].join('\n'),
    `${good}\n${lines[1]}`, `${good}\n${lines[2]}`,
    `${good}\nPND_FULL_CHECK_RECEIPT_UNKNOWN=1`,
    transportFixture(Buffer.from(knownRaw)),
    transportFixture(knownGzip, knownSha, null),
    good.replace('CHUNK=0/1', 'CHUNK=00/1'),
    good.replace('CHUNK=0/1', 'CHUNK=0/01'),
    good.replace('CHUNK=0/1', 'CHUNK=0/2'),
    good.replace('CHUNK=0/1', 'CHUNK=1/1'),
    good.replace(/SHA256=./, 'SHA256=0'),
    good.replace(/CHUNK=0\/1:./, 'CHUNK=0/1:!'),
    lines.slice(0, 2).join('\n'), lines.slice(1).join('\n'),
  ]) assert.throws(() => shardedLogReceipt(bad))
})

test('gzip rejects optional headers, corrupt trailers, truncation and trailing streams', () => {
  const mutations = [
    b => { b[0] = 0 }, b => { b[2] = 0 }, b => { b[3] = 4 },
    b => { b[4] = 1 }, b => { b[8] = 2 }, b => { b[9] = 0 },
    b => { b[b.length - 8] ^= 1 }, b => { b[b.length - 4] ^= 1 },
    b => { b[10] = 7 },
  ]
  for (const mutate of mutations) {
    const bytes = Buffer.from(knownGzip); mutate(bytes)
    assert.throws(() => shardedLogReceipt(transportFixture(bytes)))
  }
  for (let length = 0; length < knownGzip.length; length++)
    assert.throws(() => shardedLogReceipt(transportFixture(knownGzip.subarray(0, length))))
  for (const bytes of [
    Buffer.concat([knownGzip, knownGzip]), Buffer.concat([knownGzip, Buffer.from([0])]),
    Buffer.concat([knownGzip.subarray(0, -8), Buffer.from([0]), knownGzip.subarray(-8)]),
    Buffer.concat([knownGzip, Buffer.from('trailing')]),
  ]) assert.throws(() => shardedLogReceipt(transportFixture(bytes)))
})

test('transport rejects bounded-input overflow and decompression bombs', () => {
  assert.throws(() => shardedLogReceipt('x'.repeat(32 * 1024 * 1024 + 1)), /input byte limit/)
  assert.throws(() => shardedLogReceipt('é'.repeat(16 * 1024 * 1024 + 1)), /input byte limit/)
  // Valid JSON and matching SHA: only the inflation ceiling may produce this
  // exact error, not the later decoded-size, checksum or JSON checks.
  const bombJson = JSON.stringify(' '.repeat(8 * 1024 * 1024 - 2))
  const bomb = gzipSync(Buffer.from(bombJson), { level: 6 })
  Buffer.from('1f8b0800000000000003', 'hex').copy(bomb)
  assert.throws(() => shardedLogReceipt(transportFixture(bomb, sha256(bombJson))),
    { code: 'ERR_BUFFER_TOO_LARGE' })
  const oversized = Buffer.alloc(8 * 1024 * 1024 + 1, 1)
  assert.throws(() => shardedLogReceipt(transportFixture(oversized)), /byte limit/)
  const tooMany = `${transportHeader}\n${'PND_FULL_CHECK_RECEIPT_CHUNK=0/1:AA==\n'.repeat(701)}PND_FULL_CHECK_RECEIPT_SHA256=${knownSha}`
  assert.throws(() => shardedLogReceipt(tooMany))
})


test('multi-chunk compressed receipts reject omissions, reordering and noncanonical base64', () => {
  let state = 123456789
  const padding = Array.from({ length: 48000 }, () => {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5
    return String.fromCharCode(33 + ((state >>> 0) % 90))
  }).join('')
  const receipt = { padding }, lines = reportLines(receipt)
  assert.ok(lines.length > 3)
  assert.deepEqual(shardedLogReceipt(lines.join('\n')), receipt)
  for (const bad of [
    [lines[0], ...lines.slice(2)],
    [lines[0], lines[2], lines[1], ...lines.slice(3)],
    [lines[0], lines[1], lines[1], ...lines.slice(2)],
    lines.map((line, index) => index === 1 ? line.slice(0, -1) : line),
  ]) assert.throws(() => shardedLogReceipt(bad.join('\n')))
  const known = transportFixture(knownGzip)
  const parts = known.split('\n'), [prefix, data] = parts[1].split(':')
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  const end = data.indexOf('=')
  assert.ok(end > 0)
  const changed = alphabet[alphabet.indexOf(data[end - 1]) | 1]
  parts[1] = `${prefix}:${data.slice(0, end - 1)}${changed}${data.slice(end)}`
  const noncanonical = parts.join('\n')
  assert.notEqual(noncanonical, known)
  assert.throws(() => shardedLogReceipt(noncanonical))
})


test('valid gzip cannot bypass original-JSON checksum or UTF-8 checks', () => {
  const invalidUtf8 = Buffer.from([0x22, 0xff, 0x22])
  const compressed = gzipSync(invalidUtf8, { level: 6 })
  Buffer.from('1f8b0800000000000003', 'hex').copy(compressed)
  assert.throws(() => shardedLogReceipt(transportFixture(compressed, sha256(invalidUtf8))), /UTF-8/)
  assert.throws(() => shardedLogReceipt(transportFixture(knownGzip, '0'.repeat(64))), /checksum/)
})

test('trusted pnpm Full schema binds exact source locks without accepting an npm downgrade', () => {
  const f = fixture()
  Object.assign(f.expected, { packageManager: 'pnpm@11.25.0', packageJsonSha256: 'b'.repeat(64), pnpmLockSha256: 'c'.repeat(64), workspaceSha256: 'd'.repeat(64) })
  const runtime = { ...f.receipt.runtime, dependencyFormat: 'pnpm-isolated-v1', packageManager: 'pnpm@11.25.0',
    packageJsonSha256: f.expected.packageJsonSha256, sourceNpmLockSha256: f.expected.lockSha256,
    pnpmLockSha256: f.expected.pnpmLockSha256, installedPnpmLockSha256: f.expected.pnpmLockSha256, workspaceSha256: f.expected.workspaceSha256 }
  delete runtime.npm; delete runtime.installedLockSha256
  for (const [i, envelope] of [f.receipt, f.receipt.quality, ...f.receipt.shards].entries()) {
    envelope.version = 2; envelope.runtime = { ...runtime }; envelope.installation = { modulesMetadataSha256: String(i).repeat(64) }
    if (envelope.shard) {
      envelope.shard.version = 2; envelope.shard.plan.dependencyFormat = 'pnpm-isolated-v1'
      envelope.shard.installationBefore = { ...envelope.installation }; envelope.shard.installationAfter = { ...envelope.installation }
    }
  }
  assert.equal(validateShardedReceipt(f.receipt, f.expected), true)
  for (const mutate of [
    r => { r.version = 1 }, r => { r.runtime.pnpmLockSha256 = h },
    r => { r.runtime.installedPnpmLockSha256 = h }, r => { r.runtime.workspaceSha256 = h },
    r => { r.runtime.packageJsonSha256 = h }, r => { r.runtime.sourceNpmLockSha256 = h },
    r => { r.runtime.npm = '11.9.0' }, r => { delete r.quality.installation },
    r => { r.shards[0].installation = { modulesMetadataSha256: 'bad' } },
    r => { r.shards[1].version = 1 }, r => { r.shards[1].shard.version = 1 },
    r => { r.shards[1].shard.installationAfter = { modulesMetadataSha256: h } },
  ]) { const copy = structuredClone(f.receipt); mutate(copy); assert.throws(() => validateShardedReceipt(copy, f.expected)) }
  assert.throws(() => validateShardedReceipt(fixture().receipt, f.expected), /aggregate did not pass/)
})
