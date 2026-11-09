import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import smoke from '../scripts/browser-performance/snapshot-smoke.mjs'
import { createSnapshotFixture } from '../scripts/browser-performance/snapshot-setup.mjs'
import { plan, shards } from '../scripts/browser-performance/snapshot-protocol.mjs'
const source = { commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: import.meta.dirname, encoding: 'utf8' }).trim() }
let fixture
const createFixture = async () => structuredClone(fixture ??= await createSnapshotFixture({ source }))
function browser() {
  const contexts = []
  return { contexts, async newContext(options) {
    assert.deepEqual(options, { viewport: plan.viewport, deviceScaleFactor: 1 })
    if (contexts.length) assert.equal(contexts.at(-1).closed, true, 'Contexts are sequential, not concurrent')
    const context = { closed: false, async close() { this.closed = true }, async newPage() {
      return { on() {}, setDefaultTimeout(ms) { assert.equal(ms, 15000) } }
    } }
    contexts.push(context); return context
  } }
}
test('candidate smoke exercises each scenario once in fresh contexts and retains data without comparative report', async () => {
  const output = mkdtempSync(join(tmpdir(), 'snapshot-smoke-')), b = browser(), calls = []
  try {
    const result = await smoke({ browser: b, url: 'http://localhost', output, source, expectedRevision: source.commit, createFixture,
      captureScenario: async args => {
        calls.push(args.shard)
        assert.equal(args.fixture.receipt.executionRole, 'candidate-functional-smoke-not-trusted-comparison')
        assert.match(args.fixture.receipt.setup, /not trusted comparative evidence/)
        const result = { status: 'passed', phases: shards[args.shard].map(name => ({ name, status: 'passed' })) }
        writeFileSync(join(args.output, 'snapshot-frames.json'), JSON.stringify(result))
        return result
      } })
    assert.equal(result.status, 'passed'); assert.equal(result.comparativeClassification, 'not-run')
    assert.deepEqual(calls, ['world', 'recovery']); assert.equal(b.contexts.length, 2)
    assert.ok(b.contexts.every(c => c.closed)); assert.equal(readdirSync(output).includes('report.json'), false)
    for (const session of result.sessions) assert.equal(JSON.parse(readFileSync(join(output, session.recording))).status, 'passed')
    const saved = JSON.parse(readFileSync(join(output, 'snapshot-source.json')))
    assert.equal(saved.sourceCommit, source.commit); assert.equal(saved.executionRole, result.role)
  } finally { rmSync(output, { recursive: true, force: true }) }
})
test('failed smoke keeps incomplete evidence, closes contexts and never retries a failed scenario', async () => {
  const output = mkdtempSync(join(tmpdir(), 'snapshot-smoke-failure-')), b = browser(), calls = []
  try {
    await assert.rejects(smoke({ browser: b, url: 'http://localhost', output, source, expectedRevision: source.commit, createFixture,
      captureScenario: async ({ shard }) => {
        calls.push(shard)
        if (shard === 'world') throw Error('first hover did not exercise native query')
        return { status: 'passed', phases: shards[shard].map(name => ({ name, status: 'passed' })) }
      } }), /functional smoke incomplete/)
    assert.deepEqual(calls, ['world', 'recovery']); assert.ok(b.contexts.every(c => c.closed))
    const result = JSON.parse(readFileSync(join(output, 'candidate-snapshot-smoke.json')))
    assert.equal(result.status, 'incomplete'); assert.equal(result.sessions[0].status, 'incomplete')
    assert.match(result.sessions[0].failure, /first hover/); assert.equal(result.sessions[1].status, 'passed')
    assert.equal(result.comparativeClassification, 'not-run')
  } finally { rmSync(output, { recursive: true, force: true }) }
})

test('one-time preparation is separately recorded and each complete context has its own unchanged episode cap', async () => {
  const output = mkdtempSync(join(tmpdir(), 'snapshot-smoke-scope-')), b = browser(), timers = new Map()
  let now = 0, preparations = 0, id = 0
  const budgetClock = { now: () => now, schedule: (fn, ms) => { assert.equal(ms, 90000); timers.set(++id, fn); return id }, cancel: key => timers.delete(key) }
  try {
    const result = await smoke({ browser: b, url: 'http://localhost', output, source, expectedRevision: source.commit, budgetClock,
      createFixture: async () => { assert.equal(timers.size, 0); preparations++; now += 15000; return createFixture() },
      captureScenario: async ({ shard }) => { assert.equal(timers.size, 1); now += 50000; return { status: 'passed', phases: shards[shard].map(name => ({ name, status: 'passed' })) } } })
    assert.equal(preparations, 1); assert.equal(result.status, 'passed')
    assert.equal(result.execution.totalEpisodeElapsedMs, 100000); assert.equal(result.execution.elapsedMs, 115000)
    assert.deepEqual(result.execution.episodes.map(e => [e.name, e.status, e.capMs]), [['world', 'passed', 90000], ['recovery', 'passed', 90000]])
    assert.deepEqual(result.execution.stages.map(s => s.name), ['prepare', 'cleanup:world', 'cleanup:recovery', 'verify-provenance'])
    assert.ok(b.contexts.every(c => c.closed)); assert.equal(timers.size, 0)
  } finally { rmSync(output, { recursive: true, force: true }) }
})

test('episode timeout retains partial evidence, closes owner and never attempts the other context', async () => {
  const output = mkdtempSync(join(tmpdir(), 'snapshot-smoke-timeout-')), b = browser(), calls = []
  let now = 0, fire, rejectCapture, closed = 0
  b.close = async () => { closed++; rejectCapture(Error('page closed by watchdog')) }
  const budgetClock = { now: () => now, schedule: fn => { fire = fn; return 1 }, cancel() {} }
  try {
    await assert.rejects(smoke({ browser: b, url: 'http://localhost', output, source, expectedRevision: source.commit, createFixture, budgetClock,
      captureScenario: args => { calls.push(args.shard); writeFileSync(join(args.output, 'snapshot-frames.json'), '{"status":"incomplete"}\n');
        const pending = new Promise((resolve, reject) => { rejectCapture = reject }); now = 90000; fire(); return pending } }), /world episode deadline exceeded/)
    assert.deepEqual(calls, ['world']); assert.equal(closed, 1); assert.ok(b.contexts.every(c => c.closed))
    const result = JSON.parse(readFileSync(join(output, 'candidate-snapshot-smoke.json')))
    assert.equal(result.status, 'incomplete'); assert.equal(result.timeoutStage, 'world'); assert.equal(result.sessions[0].timedOut, true)
    assert.equal(result.execution.episodes[0].status, 'timed-out'); assert.equal(result.execution.episodes.length, 1)
    assert.equal(JSON.parse(readFileSync(join(output, 'snapshot-world/snapshot-frames.json'))).status, 'incomplete')
  } finally { rmSync(output, { recursive: true, force: true }) }
})

test('failed context cleanup keeps smoke incomplete and forbids the next context', async () => {
  const output = mkdtempSync(join(tmpdir(), 'snapshot-smoke-cleanup-')), b = browser(), original = b.newContext
  b.newContext = async options => { const context = await original(options); context.close = async () => { throw Error('context cleanup failed') }; return context }
  try {
    await assert.rejects(smoke({ browser: b, url: 'http://localhost', output, source, expectedRevision: source.commit, createFixture,
      captureScenario: async ({ shard }) => ({ status: 'passed', phases: shards[shard].map(name => ({ name, status: 'passed' })) }) }), /context cleanup failed/)
    const result = JSON.parse(readFileSync(join(output, 'candidate-snapshot-smoke.json')))
    assert.equal(b.contexts.length, 1); assert.equal(result.status, 'incomplete'); assert.equal(result.sessions[0].status, 'incomplete')
    assert.match(result.sessions[0].cleanupFailure, /context cleanup failed/)
    assert.equal(result.execution.stages.find(s => s.name === 'cleanup:world').status, 'failed')
  } finally { rmSync(output, { recursive: true, force: true }) }
})
