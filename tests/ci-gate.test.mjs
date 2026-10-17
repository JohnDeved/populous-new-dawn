import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
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

test('full raw report survives bounded log chunks with exact JSON checksum', () => {
  const report = { ...validate(fixture()), padding: 'unicode é test '.repeat(4000) }
  const lines = reportLines(report), chunks = lines.slice(0, -1)
  assert.ok(chunks.length > 1)
  const encoded = chunks.map((line, index) => {
    const prefix = `PND_FULL_CHECK_RECEIPT_CHUNK=${index}/${chunks.length}:`
    assert.ok(line.startsWith(prefix)); assert.ok(line.length <= prefix.length + 16000)
    return line.slice(prefix.length)
  }).join('')
  const json = Buffer.from(encoded, 'base64').toString('utf8')
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
