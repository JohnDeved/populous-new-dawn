import assert from 'node:assert/strict'
import test from 'node:test'
import { deflateRawSync } from 'node:zlib'
import { readFileSync } from 'node:fs'
import { repository, shards, order, metrics, workMetrics, statistics, summarizeMetrics, summarizeTimings, validateReport,
  parseReport, compareReports, classify, comparableWork, maxReportBytes } from '../scripts/browser-performance/protocol.mjs'
import { readReportArchive } from '../scripts/browser-performance/artifact.mjs'
import { renderComment, commentMarker } from '../scripts/browser-performance/render.mjs'
import { gameplayPhaseSchedule } from '../scripts/tutorial-browser/gameplay-frames.mjs'
import { reportRun, workflowPath } from '../scripts/browser-performance/reporter.mjs'

const identity = { repository, prNumber: 42, baseSha: 'a'.repeat(40), headSha: 'b'.repeat(40), harnessSha: 'a'.repeat(40), runId: 1234, runAttempt: 1 }
const protocol = 'c'.repeat(64)
const stat = value => ({ n: 16, mean: value, p50: value, p95: value, max: value })
function fixture(shard = 'world') {
  return { version: 1, identity: { ...identity }, protocolSha256: protocol, runtimeSha256: 'd'.repeat(64), shard, status: 'complete',
    runs: order.map((side, index) => ({ index, side, revision: identity[`${side}Sha`], status: 'complete', environmentSha256: 'e'.repeat(64),
      phases: shards[shard].map(name => ({ name, frames: 16, startTurn: 10, endTurn: 20, durationMs: 1600, coveredSpanMs: 1600,
        point: { x: 900, y: 400, id: null }, inputOffsetsMs: [], camera: [0, 0, 0, 0, 0, 0], metrics: Object.fromEntries(Object.keys(metrics).map(key => [key, { all: stat(side === 'base' ? 10 : 8), nonzero: stat(side === 'base' ? 10 : 8), perQuery: stat(side === 'base' ? 10 : 8) }])),
        work: Object.fromEntries(Object.keys(workMetrics).map(key => [key, stat(1)])) })) })) }
}
function zip(text, { name = 'report.json', method = 8, mode = 0x81a4 } = {}) {
  const bytes = Buffer.from(text), compressed = method === 8 ? deflateRawSync(bytes) : bytes
  let checksum = 0xffffffff
  for (const byte of bytes) { checksum ^= byte; for (let i = 0; i < 8; i++) checksum = (checksum >>> 1) ^ ((checksum & 1) ? 0xedb88320 : 0) }
  checksum = (checksum ^ 0xffffffff) >>> 0
  const filename = Buffer.from(name), local = Buffer.alloc(30), central = Buffer.alloc(46), end = Buffer.alloc(22)
  local.writeUInt32LE(0x04034b50); local.writeUInt16LE(20, 4); local.writeUInt16LE(method, 8); local.writeUInt32LE(checksum, 14)
  local.writeUInt32LE(compressed.length, 18); local.writeUInt32LE(bytes.length, 22); local.writeUInt16LE(filename.length, 26)
  central.writeUInt32LE(0x02014b50); central.writeUInt16LE(0x0314, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(method, 10)
  central.writeUInt32LE(checksum, 16); central.writeUInt32LE(compressed.length, 20); central.writeUInt32LE(bytes.length, 24)
  central.writeUInt16LE(filename.length, 28); central.writeUInt32LE((mode << 16) >>> 0, 38)
  end.writeUInt32LE(0x06054b50); end.writeUInt16LE(1, 8); end.writeUInt16LE(1, 10)
  end.writeUInt32LE(central.length + filename.length, 12); end.writeUInt32LE(local.length + filename.length + compressed.length, 16)
  return Buffer.concat([local, filename, compressed, central, filename, end])
}

test('metrics retain distributions and treat any missing observation as unknown, not zero', () => {
  assert.deepEqual(statistics([0, 2, 4]), { n: 3, mean: 2, p50: 2, p95: 4, max: 4 })
  assert.equal(statistics([undefined, 0]), null)
  const result = summarizeMetrics([{ pointerBreakdown: null }, { pointerBreakdown: { objectModelsMs: 0 } }], metrics)
  assert.equal(result.model, null)
  assert.deepEqual(statistics([0, 0]), { n: 2, mean: 0, p50: 0, p95: 0, max: 0 })
})

test('paired controls distinguish stable possible changes, noise, inconsistent direction and tiny effects', () => {
  assert.equal(classify([10, 10, 10], [8, 8, 8]).status, 'possible-improvement')
  assert.equal(classify([10, 10, 10], [12, 12, 12]).status, 'possible-regression')
  assert.equal(classify([10, 14, 10], [8, 8, 8]).status, 'noisy')
  assert.equal(classify([10, 10, 10], [8, 12, 8]).status, 'noisy')
  assert.equal(classify([10, 10, 10], [10.1, 10.2, 10.1]).status, 'within-noise')
  assert.equal(classify([0, 0, 0], [0, 0, 0]).status, 'within-noise')
  assert.equal(classify([0, 0, 0], [1, 1, 1]).percent, null)
  assert.equal(classify([10, null, 10], [8, 8, 8]).status, 'unknown')
  assert.equal(classify([10, 10], [8, 8]).status, 'unknown')
})

test('schema accepts only fixed bounded identities, phases, metrics and complete inventories', () => {
  assert.deepEqual(parseReport(JSON.stringify(fixture())), fixture())
  const invalid = [r => { r.identity.repository = 'attacker/repo' }, r => { r.identity.prNumber = '42' },
    r => { r.identity.harnessSha = identity.headSha }, r => { r.command = 'echo evil' }, r => { r.shard = '__proto__' },
    r => { r.runs[0].metrics = {} }, r => { r.runs[0].side = 'head' }, r => { r.runs[0].index = 4 },
    r => { r.runs[0].revision = identity.headSha }, r => { r.runs[0].phases[0].metrics.evil = stat(1) },
    r => { r.runs[0].phases[0].metrics.render.all.n = 2 }, r => { r.runs[0].phases[0].metrics.render.all.max = Infinity },
    r => { r.runs[0].phases[0].metrics.render.all.mean = 11 }, r => { r.runs[0].phases[0].frames = 0 },
    r => { r.runs[0].phases[0].coveredSpanMs = 100 }, r => { r.runs[0].phases[0].durationMs = 1 },
    r => { r.runs[0].phases[0].endTurn = 10 }, r => { r.runs[0].phases[0].point.x = 1441 },
    r => { r.runs.pop() }, r => { r.runs[0].phases.pop() }, r => { r.runs[0].environmentSha256 = null }]
  for (const mutate of invalid) { const report = fixture(); mutate(report); assert.throws(() => validateReport(report)) }
  assert.throws(() => parseReport(' '.repeat(maxReportBytes + 1)))
  assert.throws(() => parseReport(JSON.stringify(fixture()).replace('"version":1', '"version":1,"__proto__":{}')))
})

test('work, source, environment and coverage mismatches cannot masquerade as timing gains', () => {
  const reports = [fixture(), fixture('recovery')]
  let result = compareReports(reports, identity, protocol)
  assert.equal(result.complete, true); assert.equal(result.rows[1].p50.status, 'possible-improvement')
  assert.equal(result.rows.length, 5 * Object.keys(metrics).length)
  reports[0].runs[1].phases[0].work.terrainCalls = stat(0)
  result = compareReports(reports, identity, protocol)
  assert.equal(result.rows[0].p50.status, 'workload-mismatch')
  const mismatch = [fixture(), fixture('recovery')]; mismatch[1].runtimeSha256 = 'f'.repeat(64)
  assert.equal(compareReports(mismatch, identity, protocol).rows[0].p50.status, 'environment-mismatch')
  const environment = fixture(); environment.runs[1].environmentSha256 = 'f'.repeat(64)
  assert.equal(compareReports([environment], identity, protocol).rows[0].p50.status, 'environment-mismatch')
  const missing = compareReports([fixture()], identity, protocol)
  assert.equal(missing.complete, false); assert.deepEqual(missing.missing, ['recovery'])
  assert.equal(missing.rows.find(row => row.phase === 'hud').p50.status, 'incomplete')
  assert.equal(missing.rows.find(row => row.metric === 'render').p50.status, 'incomplete-shards-observation-only')
  const incomplete = fixture(); incomplete.status = 'incomplete'; incomplete.runs.pop()
  assert.equal(compareReports([incomplete], identity, protocol).rows[0].p50.status, 'incomplete')
  assert.throws(() => compareReports([fixture(), fixture()], identity, protocol), /Duplicate/)
  assert.throws(() => compareReports([fixture()], { ...identity, headSha: 'f'.repeat(40) }, protocol), /Identity/)
  assert.throws(() => compareReports([fixture()], identity, 'f'.repeat(64)), /Protocol/)
})

test('missing per-section metrics remain unknown while matched known metrics are usable', () => {
  const report = fixture(); report.runs[1].phases[0].metrics.nativeProjection = { all: null, nonzero: null, perQuery: null }
  const result = compareReports([report, fixture('recovery')], identity, protocol)
  assert.equal(result.rows.find(row => row.phase === 'world-hover' && row.metric === 'nativeProjection').p50.status, 'unknown')
  assert.equal(result.rows[1].p50.status, 'possible-improvement')
  const phases = fixture().runs.map(run => run.phases[0]); phases[1].work.terrainCalls = null
  assert.equal(comparableWork(phases), false)
})

test('comment is informational, section-specific, explicit about uncertainty and links only trusted run metadata', () => {
  const reports = [fixture(), fixture('recovery')]
  const text = renderComment(compareReports(reports, identity, protocol), identity, reports, { harnessChanged: true })
  assert.ok(text.startsWith(commentMarker)); assert.match(text, /Small sample/); assert.match(text, /not GPU time/)
  assert.match(text, /Native projection CPU/); assert.match(text, /Ordinary projection CPU/); assert.match(text, /Model pick CPU/)
  assert.match(text, /world-hover/); assert.match(text, /possible-improvement/); assert.match(text, /not a required check, review approval/)
  assert.match(text, /changes the harness/); assert.match(text, /actions\/runs\/1234\/attempts\/1/)
  assert.ok(Buffer.byteLength(text) < 60000)
})

test('artifact reader accepts only one bounded regular report.json and rejects corruption, paths and compression bombs', () => {
  for (const method of [0, 8]) assert.equal(readReportArchive(zip('{"ok":true}', { method })), '{"ok":true}')
  for (const name of ['../report.json', 'report.mjs', '/report.json', 'report.json\0']) assert.throws(() => readReportArchive(zip('{}', { name })))
  assert.throws(() => readReportArchive(zip('{}', { mode: 0xa1ff })))
  assert.throws(() => readReportArchive(zip('x'.repeat(maxReportBytes + 1))))
  const corrupt = zip('{}'); corrupt[14] ^= 1 // local CRC is not authoritative; central remains valid
  assert.equal(readReportArchive(corrupt), '{}')
  corrupt[corrupt.length - 22 - 10 - 46 + 16] ^= 1
  assert.throws(() => readReportArchive(corrupt))
  const extra = Buffer.concat([zip('{}'), Buffer.from('comment')]); assert.throws(() => readReportArchive(extra))
  const two = zip('{}'); two.writeUInt16LE(2, two.length - 22 + 10); assert.throws(() => readReportArchive(two))
})

function apiFixture() {
  const calls = [], archives = new Map(), reports = [fixture(), fixture('recovery')]
  const trustedWorkflow = 'reviewed workflow'
  const run = { id: identity.runId, repository: { full_name: repository }, event: 'pull_request', status: 'completed',
    path: workflowPath, run_attempt: 1, workflow_id: 44, head_sha: identity.headSha,
    pull_requests: [{ number: 42, head: { sha: identity.headSha }, base: { sha: identity.baseSha, repo: { name: 'populous-new-dawn' } } }] }
  const pr = { number: 42, state: 'open', head: { sha: identity.headSha }, base: { sha: identity.baseSha, repo: { full_name: repository } } }
  const artifacts = reports.map((report, i) => { archives.set(50 + i, zip(JSON.stringify(report))); return { id: 50 + i,
    name: `browser-performance-report-1234-1-${report.shard}`, expired: false, size_in_bytes: archives.get(50 + i).length, workflow_run: { id: 1234 } } })
  const state = { calls, archives, run, pr, artifacts, comments: [], workflowText: trustedWorkflow, currentChecks: 0 }
  const api = async (path, options = {}) => {
    calls.push({ path, ...options })
    if (options.method) return { id: 99 }
    if (path.endsWith('/actions/runs/1234')) return run
    if (path.endsWith('/actions/workflows/44')) return { path: workflowPath, name: 'Browser performance comparison' }
    if (path.endsWith('/pulls/42')) { state.currentChecks++; if (state.changeBeforeWrite && state.currentChecks === 2) return { ...pr, state: 'closed' }; return pr }
    if (path.includes('/contents/')) return { type: 'file', encoding: 'base64', size: state.workflowText.length, content: Buffer.from(state.workflowText).toString('base64') }
    if (path.endsWith('/artifacts?per_page=100')) return { total_count: artifacts.length, artifacts }
    if (path.includes('/comments?')) return state.comments
    throw Error(`Unexpected mock route: ${path}`)
  }
  return { state, arguments: { api, download: async id => archives.get(id), runId: 1234, expectedPrNumber: 42, trustedWorkflow, trustedProtocol: protocol } }
}

test('trusted reporter verifies metadata, creates once and updates only its identified Actions bot comment', async () => {
  const { state, arguments: args } = apiFixture()
  assert.equal((await reportRun(args)).status, 'created')
  const write = state.calls.find(call => call.method); assert.equal(write.method, 'POST'); assert.match(write.path, /issues\/42\/comments$/)
  state.comments = [{ id: 99, user: { id: 41898282, type: 'Bot', login: 'github-actions[bot]' }, body: write.body.body }]
  state.calls.length = 0
  assert.equal((await reportRun(args)).status, 'updated'); assert.equal(state.calls.find(call => call.method).method, 'PATCH')
  assert.ok(state.calls.filter(call => call.method).every(call => /issues\/(?:42\/comments|comments\/99)$/.test(call.path)))
})

test('stale PRs, old attempts, wrong workflows/identities, duplicate artifacts and forged metrics never write', async () => {
  const cases = [
    state => { state.pr.head.sha = 'f'.repeat(40) }, state => { state.pr.base.sha = 'f'.repeat(40) },
    state => { state.run.repository.full_name = 'attacker/repo' }, state => { state.run.event = 'push' },
    state => { state.run.pull_requests = [] }, state => { state.workflowText = 'attacker workflow' },
    state => { state.artifacts.push(state.artifacts[0]) }, state => { state.artifacts[0].workflow_run.id = 5678 },
    state => { const bad = fixture(); bad.identity.prNumber = 123; state.archives.set(50, zip(JSON.stringify(bad))) },
    state => { const bad = fixture(); bad.runs[0].phases[0].metrics['[click](evil)'] = stat(1); state.archives.set(50, zip(JSON.stringify(bad))) },
    state => { state.changeBeforeWrite = true },
  ]
  for (const mutate of cases) {
    const { state, arguments: args } = apiFixture(); mutate(state)
    try { await reportRun(args) } catch { /* Fail closed is expected. */ }
    assert.equal(state.calls.filter(call => call.method).length, 0)
  }
})

test('untrusted authors cannot impersonate the bot; duplicate owned comments fail closed', async () => {
  const { state, arguments: args } = apiFixture()
  state.comments = [{ id: 1, user: { id: 2, type: 'User', login: 'github-actions[bot]' }, body: commentMarker }]
  assert.equal((await reportRun(args)).status, 'created')
  const body = state.calls.find(call => call.method).body.body
  state.calls.length = 0
  state.comments = [1, 2].map(id => ({ id, user: { id: 41898282, type: 'Bot', login: 'github-actions[bot]' }, body }))
  await assert.rejects(reportRun(args), /Ambiguous/); assert.equal(state.calls.filter(call => call.method).length, 0)
})

test('workflow keeps comparisons unprivileged, two-shard bounded and reporter on trusted source without installs', () => {
  const benchmark = readFileSync(new URL('../scripts/browser-performance/workflows/browser-performance.yml', import.meta.url), 'utf8')
  const reporter = readFileSync(new URL('../scripts/browser-performance/workflows/browser-performance-report.yml', import.meta.url), 'utf8')
  assert.match(benchmark, /max-parallel: 2/); assert.match(benchmark, /shard: \[world, recovery\]/); assert.match(benchmark, /timeout-minutes: 15/)
  assert.match(benchmark, /contents: read/); assert.doesNotMatch(benchmark, /: write|secrets\.|pull_request_target/)
  assert.equal((benchmark.match(/persist-credentials: false/g) ?? []).length, 2)
  assert.match(reporter, /ref: \$\{\{ github.sha \}\}/); assert.doesNotMatch(reporter, /head.sha|npm ci|npm install|download-artifact|pull_request_target/)
  assert.match(reporter, /pull-requests: write/); assert.match(reporter, /actions: read/)
})


test('recovery shard retains prior public world/camera phases without measuring them', () => {
  assert.deepEqual(gameplayPhaseSchedule(shards.recovery).map(({ phase, measured }) => [phase.name, measured]), [
    ['world-hover', false], ['camera-world', false], ['hud', true], ['world-recovery', true], ['menu-recovery', true],
  ])
  assert.deepEqual(gameplayPhaseSchedule(shards.world).map(({ phase }) => phase.name), shards.world)
  assert.throws(() => gameplayPhaseSchedule([])); assert.throws(() => gameplayPhaseSchedule(['missing']))
  assert.throws(() => gameplayPhaseSchedule(['hud', 'hud']))
})

test('per-query normalization preserves zero timers and distinguishes samples from individual queries', () => {
  const report = summarizeTimings([
    { pointerBreakdown: { terrainPickMs: 4, terrainPickCalls: 2 } },
    { pointerBreakdown: { terrainPickMs: 0, terrainPickCalls: 1 } },
    { pointerBreakdown: { terrainPickMs: 0, terrainPickCalls: 0 } },
  ]).terrainPick
  assert.deepEqual(report.all, { n: 3, mean: 4 / 3, p50: 0, p95: 4, max: 4 })
  assert.deepEqual(report.perQuery, { n: 2, mean: 1, p50: 0, p95: 2, max: 2 })
  assert.deepEqual(report.nonzero, { n: 1, mean: 4, p50: 4, p95: 4, max: 4 })
})

test('internal projection savings are not a workload mismatch; simulation never claims per-turn speedup', () => {
  const report = fixture()
  for (const run of report.runs.filter(run => run.side === 'head')) for (const phase of run.phases) {
    phase.work.ordinaryVertices = stat(0); phase.work.nativeVertices = stat(0); phase.work.modelBuilds = stat(0)
  }
  const comparison = compareReports([report, fixture('recovery')], identity, protocol)
  assert.equal(comparison.rows.find(row => row.metric === 'ordinaryProjection').p50.status, 'possible-improvement')
  assert.equal(comparison.rows.find(row => row.metric === 'simulation').p50.status, 'observed-only-no-per-turn-attribution')
  const phases = report.runs.map(run => run.phases[0])
  phases[1].inputOffsetsMs = [1000]; assert.equal(comparableWork(phases), false)
  phases[1].inputOffsetsMs = []; phases[1].camera[0] = 10; assert.equal(comparableWork(phases), false)
})

test('immutable run head and current base, not mutable associations, control source admission', async () => {
  const movedAssociation = apiFixture()
  movedAssociation.state.run.pull_requests[0].head.sha = 'f'.repeat(40)
  movedAssociation.state.run.pull_requests[0].base.sha = 'f'.repeat(40)
  assert.equal((await reportRun(movedAssociation.arguments)).status, 'created')
  const movedBase = apiFixture(); movedBase.state.pr.base.sha = 'f'.repeat(40)
  assert.equal((await reportRun(movedBase.arguments)).status, 'skipped-stale-base')
  assert.equal(movedBase.state.calls.some(call => call.method), false)
  const wrongRouting = apiFixture(); wrongRouting.arguments.expectedPrNumber = 43
  await assert.rejects(reportRun(wrongRouting.arguments), /routing/)
  assert.equal(wrongRouting.state.calls.some(call => call.method), false)
})

test('newer existing comments and a new run attempt prevent old writes', async () => {
  const newer = apiFixture()
  newer.state.comments = [{ id: 99, user: { id: 41898282, type: 'Bot', login: 'github-actions[bot]' },
    body: `${commentMarker}\n<!-- populous-browser-performance-run:1235:1 -->` }]
  assert.equal((await reportRun(newer.arguments)).status, 'skipped-older-run')
  assert.equal(newer.state.calls.some(call => call.method), false)
  const attempt = apiFixture(), original = attempt.arguments.api
  let reads = 0
  attempt.arguments.api = async (path, options) => {
    const result = await original(path, options)
    return path.endsWith('/actions/runs/1234') && ++reads > 1 ? { ...result, run_attempt: 2 } : result
  }
  assert.equal((await reportRun(attempt.arguments)).status, 'skipped-old-attempt')
  assert.equal(attempt.state.calls.some(call => call.method), false)
})

test('streamed ZIP data descriptors are bounded data, never an extraction instruction', () => {
  const original = zip('{"streamed":true}'), end = original.length - 22, central = original.readUInt32LE(end + 16)
  const descriptor = Buffer.alloc(16); descriptor.writeUInt32LE(0x08074b50)
  original.copy(descriptor, 4, 14, 26)
  const streamed = Buffer.concat([original.subarray(0, central), descriptor, original.subarray(central)])
  streamed.writeUInt16LE(8, 6); streamed.fill(0, 14, 26)
  streamed.writeUInt16LE(8, central + 16 + 8)
  streamed.writeUInt32LE(central + 16, streamed.length - 22 + 16)
  assert.equal(readReportArchive(streamed), '{"streamed":true}')
})
