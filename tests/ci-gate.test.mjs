import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { gunzipSync } from 'node:zlib'
import { testGroupCommand, planTestShard, runTestShard, productionFingerprint } from '../scripts/orchestration/test-runner.mjs'
import { dependencyReceipt, portablePnpmRuntime } from '../scripts/orchestration/dependency-profile.mjs'
import { candidateSnapshot, reportLines, QUALITY_STAGES, readEnvelopes, validateGate, validateShard } from '../scripts/orchestration/ci-gate.mjs'

function fixture() {
  const inventory = Array.from({ length: 12 }, (_, index) => ({ file: `tests/${String(index).padStart(2, '0')}.test.mjs`, sha256: 'a'.repeat(64) }))
  const snapshot = { identity: { runId: '123', runAttempt: '2', mergeSha: 'b'.repeat(40) }, runtime: { node: '24.19.0' }, inventory }
  const plans = Array.from({ length: 4 }, (_, index) => {
    const files = inventory.filter((_, offset) => offset % 4 === index).map(item => item.file)
    return { mode: 'shard', fullSuite: false, shard: { index, count: 4, algorithm: 'sorted-round-robin-v1' },
      discovered: inventory.map(item => item.file), files, groups: [{ concurrency: 1, files }], parallelEligibility: 'production-config-runtime-drift', inputFingerprint: 'c'.repeat(64) }
  })
  const envelopes = [{ version: 1, kind: 'quality', ...snapshot, stages: [...QUALITY_STAGES], status: 'passed' },
    ...plans.map(plan => ({ version: 1, kind: 'shard', ...snapshot, status: 'passed', shard: {
      version: 1, kind: 'pnd-test-shard-receipt', plan, inputsBefore: plan.inputFingerprint, inputsAfter: plan.inputFingerprint, inputError: null,
      result: { mode: 'shard', fullSuite: false, complete: true, shardComplete: true, interrupted: null, status: 'passed', results: plan.groups.map(group => ({
        command: [process.execPath, '--test', `--test-concurrency=${group.concurrency}`, '--test-reporter=tap', ...group.files], files: group.files,
        concurrency: group.concurrency, exitCode: 0, signal: null, error: null, status: 'passed', wallMs: 100,
      })), wallMs: 100 },
    } })),
  ]
  return { snapshot: structuredClone(snapshot), plans: structuredClone(plans), envelopes: envelopes.map(item => structuredClone(item)), needs: { quality: 'success', 'test-shards': 'success' } }
}
const validate = f => validateGate(f.snapshot, f.envelopes, f.plans, f.needs)

test('only complete source-bound four-shard coverage plus quality/build passes', () => {
  const f = fixture(), result = validate(f)
  assert.equal(result.status, 'passed'); assert.equal(result.shards.length, 4)
  f.envelopes.reverse()
  assert.deepEqual(validate(f), result)
})

for (const state of ['failure', 'cancelled', 'skipped', 'neutral', 'pending', '', null]) {
  for (const job of ['quality', 'test-shards']) test(`${job} ${state} cannot produce Full check success`, () => {
    const f = fixture(); f.needs[job] = state; assert.throws(() => validate(f), /Every required job/)
  })
}

const invalid = {
  'missing shard': f => f.envelopes.pop(),
  'extra shard': f => f.envelopes.push(structuredClone(f.envelopes[1])),
  'duplicate shard': f => { f.envelopes[4] = structuredClone(f.envelopes[3]) },
  'missing quality': f => f.envelopes.shift(),
  'missing build': f => f.envelopes[0].stages.pop(),
  'baseline cannot replace quality': f => { f.envelopes[0].kind = 'baseline'; f.envelopes[0].stages = ['tests'] },
  'failed quality': f => { f.envelopes[0].status = 'failed' },
  'wrong attempt': f => { f.envelopes[2].identity.runAttempt = '1' },
  'wrong source': f => { f.envelopes[2].identity.mergeSha = 'd'.repeat(40) },
  'wrong runtime': f => { f.envelopes[2].runtime.node = '22.0.0' },
  'wrong test bytes': f => { f.envelopes[2].inventory[0].sha256 = 'd'.repeat(64) },
  'mutated source': f => { f.envelopes[2].shard.inputsAfter = 'd'.repeat(64) },
  'input error': f => { f.envelopes[2].shard.inputError = 'read failure' },
  'failed tests': f => { f.envelopes[2].shard.result.status = 'failed' },
  'cancelled tests': f => { f.envelopes[2].shard.result.interrupted = 'SIGTERM' },
  'incomplete tests': f => { f.envelopes[2].shard.result.complete = false },
  'incomplete shard': f => { f.envelopes[2].shard.result.shardComplete = false },
  'filtered tests': f => { f.envelopes[2].shard.result.results[0].command.push('--test-name-pattern=skip') },
  'wrong concurrency': f => { f.envelopes[2].shard.result.results[0].concurrency = 2 },
  'missing file': f => { f.envelopes[2].shard.plan.files.pop() },
  'failed group': f => { f.envelopes[2].shard.result.results[0].exitCode = 1 },
  'missing group': f => { f.envelopes[2].shard.result.results = [] },
  'signalled group': f => { f.envelopes[2].shard.result.results[0].signal = 'SIGTERM' },
  'launch error': f => { f.envelopes[2].shard.result.results[0].error = 'ENOENT' },
}
for (const [label, mutate] of Object.entries(invalid)) test(`aggregate rejects ${label}`, () => {
  const f = fixture(); mutate(f); assert.throws(() => validate(f))
})

test('receipt validation rederives exact source plans, not just self-reported coverage', () => {
  const f = fixture(); f.envelopes[1].shard.plan.discovered.pop()
  assert.throws(() => validateShard(f.envelopes[1].shard, f.plans[0]), /plan differs/)
})

function artifacts(t) {
  const root = mkdtempSync(join(tmpdir(), 'pnd-ci-artifacts-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const f = fixture(), env = { GITHUB_RUN_ID: '123', GITHUB_RUN_ATTEMPT: '2' }
  for (const receipt of f.envelopes) {
    const suffix = receipt.kind === 'quality' ? 'quality' : `shard-${receipt.shard.plan.shard.index + 1}`
    const directory = join(root, `full-check-123-2-${suffix}`)
    mkdirSync(directory); writeFileSync(join(directory, 'receipt.json'), JSON.stringify(receipt))
  }
  return { root, f, env }
}

test('artifact loader accepts exactly five current-attempt directories', t => {
  const { root, f, env } = artifacts(t)
  assert.deepEqual(readEnvelopes(root, env), f.envelopes)
})
for (const mutation of ['missing', 'extra', 'old-attempt', 'extra-file', 'wrong-label']) test(`artifact loader rejects ${mutation}`, t => {
  const { root, env } = artifacts(t)
  if (mutation === 'missing') rmSync(join(root, 'full-check-123-2-shard-4'), { recursive: true })
  if (mutation === 'extra') mkdirSync(join(root, 'unexpected'))
  if (mutation === 'old-attempt') env.GITHUB_RUN_ATTEMPT = '3'
  if (mutation === 'extra-file') writeFileSync(join(root, 'full-check-123-2-shard-4', 'other.json'), '{}')
  if (mutation === 'wrong-label') writeFileSync(join(root, 'full-check-123-2-shard-4', 'receipt.json'), JSON.stringify(fixture().envelopes[1]))
  assert.throws(() => readEnvelopes(root, env))
})

test('full raw report survives versioned gzip log chunks with exact JSON checksum', () => {
  const report = { ...validate(fixture()), padding: 'unicode é test '.repeat(4000) }
  const lines = reportLines(report), chunks = lines.slice(1, -1)
  assert.equal(lines[0], 'PND_FULL_CHECK_RECEIPT_TRANSPORT=2:gzip-base64')
  assert.ok(chunks.length >= 1)
  const encoded = chunks.map((line, index) => {
    const prefix = `PND_FULL_CHECK_RECEIPT_CHUNK=${index}/${chunks.length}:`
    assert.ok(line.startsWith(prefix)); assert.ok(line.length <= prefix.length + 16000)
    return line.slice(prefix.length)
  }).join('')
  const json = gunzipSync(Buffer.from(encoded, 'base64')).toString('utf8')
  assert.equal(json, JSON.stringify(report))
  assert.deepEqual(JSON.parse(json), report)
  assert.equal(lines.at(-1), `PND_FULL_CHECK_RECEIPT_SHA256=${createHash('sha256').update(json).digest('hex')}`)
})

function candidateFixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'pnd-ci-candidate-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
  git('init', '-q'); git('config', 'user.name', 'CI fixture'); git('config', 'user.email', 'ci@example.invalid')
  mkdirSync(join(root, '.github/workflows'), { recursive: true }); mkdirSync(join(root, 'tests'))
  writeFileSync(join(root, '.github/workflows/ready-pr-check.yml'), 'fixture')
  writeFileSync(join(root, 'tests/a.test.mjs'), 'fixture')
  git('add', '.'); git('commit', '-qm', 'base')
  const base = git('rev-parse', 'HEAD')
  writeFileSync(join(root, 'head.txt'), 'head')
  git('add', '.'); git('commit', '-qm', 'head')
  const head = git('rev-parse', 'HEAD'), tree = git('rev-parse', 'HEAD^{tree}')
  const merge = git('commit-tree', tree, '-p', base, '-p', head, '-m', 'synthetic')
  git('checkout', '-q', '--detach', merge)
  const env = { GITHUB_REPOSITORY: 'owner/repo', GITHUB_RUN_ID: '123', GITHUB_RUN_ATTEMPT: '2',
    GITHUB_WORKFLOW_REF: 'owner/repo/.github/workflows/ready-pr-check.yml@refs/pull/1/merge',
    GITHUB_WORKFLOW_SHA: merge, GITHUB_SHA: merge, PR_HEAD_SHA: head, PR_BASE_SHA: base }
  return { root, env }
}

for (const mutation of ['checkout', 'parents', 'tracked', 'untracked-test', 'missing-identity']) test(`candidate snapshot rejects ${mutation} before runtime setup`, t => {
  const { root, env } = candidateFixture(t)
  if (mutation === 'checkout') env.GITHUB_SHA = 'f'.repeat(40)
  if (mutation === 'parents') [env.PR_HEAD_SHA, env.PR_BASE_SHA] = [env.PR_BASE_SHA, env.PR_HEAD_SHA]
  if (mutation === 'tracked') writeFileSync(join(root, 'tests/a.test.mjs'), 'mutation')
  if (mutation === 'untracked-test') writeFileSync(join(root, 'tests/new.test.mjs'), 'uncommitted')
  if (mutation === 'missing-identity') delete env.GITHUB_WORKFLOW_SHA
  const expected = { checkout: /Checkout differs/, parents: /parents differ/, tracked: /Command failed: git diff/, 'untracked-test': /inventory differs/, 'missing-identity': /Missing identity/ }
  assert.throws(() => candidateSnapshot(root, env), expected[mutation])
})


test('gate accepts only exact legacy or fixed diagnostic commands, never timing as proof', () => {
  const f = fixture()
  for (const envelope of f.envelopes.filter(e => e.kind === 'shard')) {
    for (const group of envelope.shard.result.results) group.command = testGroupCommand(group, 'summary-v1')
  }
  assert.equal(validate(f).status, 'passed')
  for (const flag of ['--test-reporter=evil', '--test-reporter-destination=../../escape', '--test-reporter-destination=stdout', '--test-name-pattern=skip']) {
    const bad = structuredClone(f); bad.envelopes[1].shard.result.results[0].command.push(flag)
    assert.throws(() => validate(bad))
  }
  const missing = structuredClone(f)
  missing.envelopes[1].shard.result.results[0].command = missing.envelopes[1].shard.result.results[0].command.filter(x => x !== '--test-reporter-destination=stderr')
  assert.throws(() => validate(missing))
  const failure = structuredClone(f); failure.envelopes[1].shard.result.results[0].exitCode = 1
  assert.throws(() => validate(failure))
  const drift = structuredClone(f); drift.envelopes[1].runtime.timingReporterSha256 = 'f'.repeat(64)
  assert.throws(() => validate(drift), /runtime drift/)
})

test('pnpm envelopes compare portable locks while binding each installation separately', () => {
  const f = fixture()
  f.snapshot.runtime = { ...f.snapshot.runtime, dependencyFormat: 'pnpm-isolated-v1', pnpmLockSha256: 'd'.repeat(64) }
  f.snapshot.installation = { modulesMetadataSha256: '0'.repeat(64) }
  f.envelopes.forEach((e, i) => { e.version = 2; e.runtime = { ...f.snapshot.runtime }; e.installation = { modulesMetadataSha256: String(i + 1).repeat(64) } })
  for (const plan of f.plans) plan.dependencyFormat = 'pnpm-isolated-v1'
  for (const e of f.envelopes.filter(e => e.shard)) {
    e.shard.version = 2; e.shard.plan.dependencyFormat = 'pnpm-isolated-v1'
    e.shard.installationBefore = { ...e.installation }; e.shard.installationAfter = { ...e.installation }
  }
  assert.equal(validate(f).version, 2)
  for (const mutate of [
    x => { delete x.envelopes[0].installation },
    x => { x.envelopes[1].installation.modulesMetadataSha256 = 'not-a-hash' },
    x => { x.envelopes[2].version = 1 },
    x => { x.envelopes[3].runtime.pnpmLockSha256 = 'e'.repeat(64) },
  ]) { const bad = structuredClone(f); mutate(bad); assert.throws(() => validate(bad)) }
})


test('real pnpm shard plans aggregate across distinct installs and reject within-worker mutation', async t => {
  const roots = Array.from({ length: 5 }, (_, i) => {
    const root = mkdtempSync(join(tmpdir(), 'pnd-pnpm-job-'))
    t.after(() => rmSync(root, { recursive: true, force: true }))
    const put = (name, bytes) => { mkdirSync(join(root, name, '..'), { recursive: true }); writeFileSync(join(root, name), bytes) }
    put('package.json', '{"packageManager":"pnpm@11.25.0","type":"module"}')
    for (const name of ['package-lock.json', 'tsconfig.json']) put(name, '{}')
    put('pnpm-lock.yaml', 'lockfileVersion: 9\n'); put('node_modules/.pnpm/lock.yaml', 'lockfileVersion: 9\n')
    put('pnpm-workspace.yaml', 'nodeLinker: isolated\n')
    put('node_modules/.modules.yaml', `prunedAt: job-${i}\nstoreDir: /private/${i}\n`)
    put('app/fixture.ts', 'export const answer = 42')
    put('scripts/fixture.mjs', '// fixed source')
    put('engineering/test-resources.json', JSON.stringify({ version: 1, helpersSha256: 'a'.repeat(64), productionSha256: 'b'.repeat(64), parallel: {} }))
    for (let j = 0; j < 4; j++) put(`tests/a${j}.test.mjs`, 'import test from "node:test"; test("tiny actual child", () => {})')
    return { root, put }
  })
  const aggregate = roots[4].root, local = portablePnpmRuntime(dependencyReceipt(aggregate))
  const plans = [0, 1, 2, 3].map(i => planTestShard(aggregate, i))
  const snapshot = { identity: { fixed: 'fixture source' }, runtime: local.runtime, installation: local.installation,
    inventory: plans[0].discovered.map(file => ({ file, sha256: 'c'.repeat(64) })) }
  const envelopes = [{ version: 2, kind: 'quality', ...snapshot, stages: [...QUALITY_STAGES], status: 'passed' }]
  for (let i = 0; i < 4; i++) {
    const root = roots[i].root, plan = planTestShard(root, i), installed = portablePnpmRuntime(dependencyReceipt(root))
    assert.deepEqual(plan, plans[i]); assert.notEqual(productionFingerprint(root), productionFingerprint(aggregate))
    const shard = await runTestShard(root, plan, { log: () => {} })
    envelopes.push({ version: 2, kind: 'shard', ...snapshot, installation: installed.installation, shard, status: 'passed' })
  }
  assert.equal(validateGate(snapshot, envelopes, plans, { quality: 'success', 'test-shards': 'success' }).status, 'passed')
  const bad = structuredClone(envelopes); bad[1].shard.installationAfter.modulesMetadataSha256 = 'e'.repeat(64)
  assert.throws(() => validateGate(snapshot, bad, plans, { quality: 'success', 'test-shards': 'success' }), /metadata mutated/)
  const driftPlan = planTestShard(roots[0].root, 0)
  const drift = await runTestShard(roots[0].root, driftPlan, { log: () => {}, launch: (...args) => {
    roots[0].put('node_modules/.modules.yaml', 'prunedAt: changed during actual child\n')
    return spawn(...args)
  } })
  assert.equal(drift.result.status, 'failed'); assert.equal(drift.result.shardComplete, false)
  roots[1].put('pnpm-lock.yaml', 'changed'); roots[1].put('node_modules/.pnpm/lock.yaml', 'changed')
  assert.notDeepEqual(planTestShard(roots[1].root, 1), plans[1])
  assert.throws(() => validateShard(envelopes[2].shard, planTestShard(roots[1].root, 1), envelopes[2].installation), /plan differs/)
})
