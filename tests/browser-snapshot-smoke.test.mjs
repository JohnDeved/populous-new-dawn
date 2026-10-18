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
