import assert from 'node:assert/strict'
import test from 'node:test'
import { deflateRawSync } from 'node:zlib'
import { readFileSync } from 'node:fs'
import { repository, shards, order, metrics, workMetrics, statistics, summarizeMetrics, summarizeTimings, validateReport, sha256,
  parseReport, compareReports, classify, comparableWork, maxReportBytes } from '../scripts/browser-performance/protocol.mjs'
import { readReportArchive } from '../scripts/browser-performance/artifact.mjs'
import { renderComment, commentMarker } from '../scripts/browser-performance/render.mjs'
import { gameplayPhaseSchedule } from '../scripts/tutorial-browser/gameplay-frames.mjs'
import * as snapshot from '../scripts/browser-performance/snapshot-protocol.mjs'
import { renderSnapshotComment } from '../scripts/browser-performance/snapshot-render.mjs'
import { recognizeReaderSources } from '../scripts/browser-performance/snapshot-readers.mjs'
import { readerImportSha256 } from '../scripts/browser-performance/snapshot-reader-proof.mjs'
import { dragSourceProfiles } from '../scripts/browser-performance/snapshot-drag-contract.mjs'
import { BufferGeometry, BufferAttribute, InstancedMesh, Matrix4 } from 'three'
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

test('pinning the browser does not admit different runner images, kernels or real browser mismatches', () => {
  const environment = { browserVersion: 'Google Chrome 155.0.8059.84', browserSha256: '1'.repeat(64),
    browserPinSha256: '2'.repeat(64), release: '7.0.0-1017-azure', runnerVersion: '20261018.339.1' }
  const make = (shard, change = {}) => ({ ...fixture(shard), runtimeSha256: sha256(JSON.stringify({ ...environment, ...change })) })
  assert.equal(compareReports([make('world'), make('recovery')], identity, protocol).complete, true)
  for (const change of [{ release: '6.17.0-1022-azure' }, { runnerVersion: '20261012.334.1' },
    { browserVersion: 'Google Chrome 155.0.8059.39' }, { browserSha256: '3'.repeat(64) }, { browserPinSha256: '4'.repeat(64) }]) {
    const result = compareReports([make('world'), make('recovery', change)], identity, protocol)
    assert.equal(result.complete, false)
    assert.ok(result.rows.every(row => row.p50.status === 'environment-mismatch' && row.p95.status === 'environment-mismatch'))
  }
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
  const corrupt = zip('{}'); corrupt[14] ^= 1 // Both headers must bind the same CRC.
  assert.throws(() => readReportArchive(corrupt))
  corrupt[corrupt.length - 22 - 10 - 46 + 16] ^= 1
  assert.throws(() => readReportArchive(corrupt))
  const extra = Buffer.concat([zip('{}'), Buffer.from('comment')]); assert.throws(() => readReportArchive(extra))
  const two = zip('{}'); two.writeUInt16LE(2, two.length - 22 + 10); assert.throws(() => readReportArchive(two))
})

function apiFixture(reports = [fixture(), fixture('recovery')]) {
  const calls = [], archives = new Map()
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
    if (path.includes('/actions/workflows/44/runs?')) return state.completedRuns ?? { total_count: 1, workflow_runs: [run] }
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
  assert.equal((await reportRun(args)).status, 'skipped-unchanged'); assert.equal(state.calls.some(call => call.method), false)
  assert.ok(state.calls.filter(call => call.method).every(call => /issues\/(?:42\/comments|comments\/99)$/.test(call.path)))
})

test('pin and browser provisioner changes retain the trusted-base harness warning', async () => {
  for (const name of ['run-live.mjs', 'run-pinned.mjs', 'run-live-pinned.mjs', 'browser-runtime.json', 'browser-runtime.mjs', 'install-browser.mjs']) {
    const mock = apiFixture(), original = mock.arguments.api
    mock.arguments.api = async (path, options) => {
      const result = await original(path, options)
      if (path.endsWith(`/contents/scripts/browser-performance/${name}?ref=${identity.headSha}`))
        return { ...result, size: 7, content: Buffer.from('changed').toString('base64') }
      return result
    }
    assert.equal((await reportRun(mock.arguments)).status, 'created')
    assert.match(mock.state.calls.find(call => call.method).body.body, /changes the harness/)
  }
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

function snapshotFixture(shard = 'world') {
  const r = fixture(shard)
  r.version = 2; r.protocolSha256 = snapshot.protocolHash(); r.snapshotSha256 = 'f'.repeat(64)
  for (const run of r.runs) run.phases = snapshot.shards[shard].map(name => {
    const value = run.side === 'base' ? 10 : 8
    const stats = n => ({ n, mean: value, p50: value, p95: value, max: value })
    const phase = { name, stateSha256: 'a'.repeat(64), viewConfigSha256: 'b'.repeat(64), targetId: name.startsWith('native-') ? 54 : null,
      point: [900, 400], frames: 24, rawFrames: 40, durationMs: 1000,
      blocks: Array.from({ length: 6 }, (_, step) => ({ step, event: 'pointermove',
        point: [900, 400], geometrySha256: 'd'.repeat(64), ...(name === 'native-view-drag-warm' ? { geometryAfterSha256: 'e'.repeat(64), inputPoseSha256: 'f'.repeat(64) } : {}), poses: Array(4).fill('c'.repeat(64)), inventory: Array.from({ length: 4 }, (_, i) => name === 'hud' || (name === 'native-view-drag-warm' && i > 0) ? [0, 0, 0] : [1, 1, 8]) })),
      timings: Object.fromEntries(snapshot.strata.map(s => [s, Object.fromEntries(Object.keys(metrics).map(key => [key,
        { all: stats(s === 'first' ? 6 : 18), nonzero: stats(s === 'first' ? 6 : 18), perQuery: stats(s === 'first' ? 6 : 18) }]))])),
      work: Object.fromEntries(snapshot.strata.map(s => [s, Object.fromEntries(Object.keys(workMetrics).map(key => [key, stats(s === 'first' ? 6 : 18)]))])) }
    if (name === 'native-view-drag-warm') {
      phase.rawFrames = 80
      phase.warmup = { frames: 24, blocks: structuredClone(phase.blocks), firstCpuMs: Object.fromEntries(['nativeKey', 'nativeProjection', 'nativeTriangles', 'callback'].map(key => [key, Array(6).fill(value)])) }
    }
    return phase
  })
  return r
}
test('trusted source explicitly chooses v2; v1 artifact cannot select a compatibility execution path', async () => {
  const old = apiFixture(); old.arguments.protocolVersion = 2; old.arguments.trustedProtocol = snapshot.protocolHash()
  await assert.rejects(reportRun(old.arguments)); assert.equal(old.state.calls.some(c => c.method), false)
  const reports = [snapshotFixture(), snapshotFixture('recovery')], mock = apiFixture(reports)
  Object.assign(mock.arguments, { protocolVersion: 2, trustedProtocol: snapshot.protocolHash() })
  assert.equal((await reportRun(mock.arguments)).status, 'created')
  const write = mock.state.calls.find(c => c.method)
  assert.ok(Buffer.byteLength(write.body.body) < 60000)
  assert.match(write.body.body, /controlled browser CPU comparison/)
  mock.state.comments = [{ id: 99, user: { id: 41898282, type: 'Bot', login: 'github-actions[bot]' }, body: write.body.body }]
  mock.state.calls.length = 0
  assert.equal((await reportRun(mock.arguments)).status, 'skipped-unchanged')
  assert.ok(mock.state.calls.filter(c => c.method).every(c => /issues\/comments\/99$/.test(c.path)))
  const paths = mock.state.calls.filter(c => c.path.includes('/contents/')).map(c => c.path)
  assert.ok(paths.some(p => p.includes('snapshot-observer.mjs')))
  assert.ok(paths.some(p => p.includes('snapshot-setup.mjs')))
})
test('v2 rejects forged metadata/metrics/shards before any comment and bounds worst-case rendered data', async () => {
  const changes = [r => { r.identity.headSha = 'd'.repeat(40) }, r => { r.protocolSha256 = 'd'.repeat(64) },
    r => { r.shard = '[unsafe](https://evil)' }, r => { r.runs[0].phases[0].timings.first.command = 'execute' },
    r => { r.runs[0].phases[0].blocks[0].poses[0] = 'unsafe' }]
  for (const change of changes) {
    const reports = [snapshotFixture(), snapshotFixture('recovery')]; change(reports[0])
    const mock = apiFixture(reports); mock.state.artifacts[0].name = 'browser-performance-report-1234-1-world'; Object.assign(mock.arguments, { protocolVersion: 2, trustedProtocol: snapshot.protocolHash() })
    await assert.rejects(reportRun(mock.arguments)); assert.equal(mock.state.calls.some(c => c.method), false)
  }
  const reports = [snapshotFixture(), snapshotFixture('recovery')]
  const body = renderSnapshotComment(snapshot.compareReports(reports, identity), identity, reports, { harnessChanged: true })
  assert.ok(Buffer.byteLength(body) < 60000); assert.match(body, /not the first post-close callback/)
  assert.match(body, /simulation or water-advance performance/); assert.match(body, /not statistical significance/)
  assert.match(body, /may perturb RAF cadence/); assert.match(body, /does not cover fresh-world factory-ownership optimizations/)
})

test('trusted reporter retains five stable comparisons when appended drag is unsupported, failed, missing or malformed', async () => {
  for (const outcome of ['source-contract', 'failure', 'missing-fields', 'wrong-inventory', 'missing-warmup', 'short-warmup', 'bad-warmup-value']) {
    const reports = [snapshotFixture(), snapshotFixture('recovery')], world = reports[0], run = world.runs[1], phase = run.phases.pop()
    world.status = 'incomplete'; run.status = 'incomplete'
    const result = snapshot.appendSnapshotPhase(world, run, 'native-view-drag-warm', () => {
      if (outcome === 'source-contract') return { name: 'native-view-drag-warm', unsupported: 'source-contract' }
      if (outcome === 'failure') throw Error('Raw capture missing')
      if (outcome === 'missing-fields') delete phase.blocks[0].geometryAfterSha256
      if (outcome === 'wrong-inventory') phase.blocks[0].inventory[0][0] = 2
      if (outcome === 'missing-warmup') delete phase.warmup
      if (outcome === 'short-warmup') phase.warmup.blocks.pop()
      if (outcome === 'bad-warmup-value') phase.warmup.firstCpuMs.nativeProjection[0] = -1
      return phase
    })
    assert.equal(result.status, outcome === 'source-contract' ? 'admitted' : 'incomplete-cohort')
    run.status = 'complete'; world.status = 'complete'
    const mock = apiFixture(reports)
    Object.assign(mock.arguments, { protocolVersion: 2, trustedProtocol: snapshot.protocolHash() })
    assert.equal((await reportRun(mock.arguments)).status, 'created')
    const body = mock.state.calls.find(c => c.method).body.body
    const section = name => body.split(`<details><summary>${name} (`)[1].split('</details>')[0]
    assert.match(section('ordinary-hover'), /possible-improvement/)
    assert.match(section('native-hover'), /possible-improvement/)
    for (const name of ['hud', 'world-recovery', 'menu-recovery']) assert.match(section(name), /Section \/ callback stratum/)
    assert.match(section('native-view-drag-warm'), outcome === 'source-contract' ? /unsupported-source-contract/ : /incomplete-cohort/)
    assert.doesNotMatch(section('native-view-drag-warm'), /possible-improvement|possible-regression|Session p50/)
    assert.equal(body.match(/\| Section \/ callback stratum/g).length, 5)
  }
})

test('required stable phase admission remains strict while optional missing fields are isolated', () => {
  const report = snapshotFixture(), run = report.runs[0]
  report.status = 'incomplete'; run.status = 'incomplete'; run.phases = []
  assert.throws(() => snapshot.appendSnapshotPhase(report, run, 'native-hover', () => ({ name: 'native-hover' })))
  assert.deepEqual(run.phases, [])
})

test('trusted reporter rejects unbounded warmup diagnostics and retains unknown values without changing warmed classification', async () => {
  for (const mutate of [w => { w.command = 'execute' }, w => { w.firstCpuMs.nativeProjection[0] = '[link](https://evil)' },
    w => { w.firstCpuMs.nativeProjection[0] = 1e9 + 1 }, w => { w.firstCpuMs.callback.push(1) },
    w => { w.firstCpuMs.unknownMetric = Array(6).fill(1) }, w => { w.frames = 23 }]) {
    const reports = [snapshotFixture(), snapshotFixture('recovery')]; mutate(reports[0].runs[0].phases[2].warmup)
    const mock = apiFixture(reports); Object.assign(mock.arguments, { protocolVersion: 2, trustedProtocol: snapshot.protocolHash() })
    await assert.rejects(reportRun(mock.arguments)); assert.equal(mock.state.calls.some(c => c.method), false)
  }
  const reports = [snapshotFixture(), snapshotFixture('recovery')], comparison = snapshot.compareReports(reports, identity)
  reports[0].runs[0].phases[2].warmup.firstCpuMs.nativeProjection[0] = null
  const mock = apiFixture(reports); Object.assign(mock.arguments, { protocolVersion: 2, trustedProtocol: snapshot.protocolHash() })
  assert.equal((await reportRun(mock.arguments)).status, 'created')
  assert.deepEqual(snapshot.compareReports(reports, identity), comparison)
  const body = mock.state.calls.find(c => c.method).body.body
  assert.match(body, /First-use native-drag in this prepared workload/)
  assert.match(body, /Diagnostic only, never pooled/); assert.match(body, /unknown, 10\.000/)
})

// Synthetic semantic controls only. No historical CI evidence is reclassified.
function withReaderProof(reports) {
  const original = [BufferGeometry.prototype.getAttribute, BufferGeometry.prototype.getIndex, InstancedMesh.prototype.getMatrixAt,
    BufferAttribute.prototype.getX, BufferAttribute.prototype.getY, BufferAttribute.prototype.getZ, BufferAttribute.prototype.getX,
    Matrix4.prototype.fromArray].map(method => method.toString())
  for (const report of reports) for (const run of report.runs) {
    const sources = original.map(source => run.side === 'base' ? source : source.replaceAll('denormalize', 'RenamedInactiveHelper'))
    const { rawSha256, allSourcesSha256, semanticSha256 } = recognizeReaderSources(sources)
    const profile = dragSourceProfiles[run.side === 'base' ? 0 : 1]
    run.readers = { version: 1, sources, rawSha256, allSourcesSha256, semanticSha256, strictData: true, matrixBinding: true, sessionStable: true,
      source: { profile: profile.id, slices: profile.slices.map(slice => ({ id: slice.id, expectedSha256: slice.sha256 ?? null,
        actualSha256: slice.absentFile ? null : slice.sha256 ?? 'c'.repeat(64), reason: null })), importSha256: readerImportSha256 },
      provenance: Object.fromEntries(['dependenciesSha256', 'threeSha256', 'packageSha256', 'lockSha256', 'builderSha256', 'bundleSha256']
        .map(key => [key, key === 'bundleSha256' && run.side === 'head' ? 'e'.repeat(64) : 'd'.repeat(64)])) }
    for (const phase of run.phases) {
      phase.readerEvidenceSha256 = allSourcesSha256
      for (const block of [...phase.blocks, ...(phase.warmup?.blocks ?? [])]) {
        for (const [field, hashField, indexHash] of [['geometryProof', 'geometrySha256', 'a'], ...(phase.name === 'native-view-drag-warm' ? [['geometryAfterProof', 'geometryAfterSha256', 'b']] : [])]) {
          block[field] = { metadata: { version: 1, position: { type: 'Float32Array', count: 98304, itemSize: 3, normalized: false },
            index: { type: 'Uint32Array', submittedCount: 6, itemSize: 1, normalized: false }, drawRange: { start: 0, count: 6 }, instanceCount: 1,
            worldMatrix: Array(16).fill(0), boundingBox: [0, 0, 0, 1, 1, 1], nativeRelative: true, painterGround: true, terrainGrid: true,
            nativeScale: 0, nativeSize: 0, parentBasis: [0, 0, 0] }, positionSha256: 'c'.repeat(64), indexSha256: indexHash.repeat(64),
            instancesSha256: 'd'.repeat(64), consumerMethodsSha256: rawSha256 }
          block[hashField] = snapshot.sha256(JSON.stringify(block[field]))
        }
      }
    }
  }
  return reports
}
const readerReports = () => withReaderProof([snapshotFixture(), snapshotFixture('recovery')])
const readerMock = reports => { const mock = apiFixture(reports); Object.assign(mock.arguments, { protocolVersion: 2, trustedProtocol: snapshot.protocolHash() }); return mock }

test('trusted reporter admits bounded equivalent raw readers only with complete source and component proof', async () => {
  const reports = readerReports(), before = JSON.stringify(reports)
  for (const report of reports) { assert.ok(Buffer.byteLength(JSON.stringify(report)) < maxReportBytes); snapshot.parseReport(JSON.stringify(report)) }
  assert.notEqual(reports[0].runs[0].readers.rawSha256, reports[0].runs[1].readers.rawSha256)
  assert.ok(snapshot.compareReports(reports, identity).rows.every(row => !row.p50.status.endsWith('mismatch')))
  const mock = readerMock(reports)
  assert.equal((await reportRun(mock.arguments)).status, 'created')
  const body = mock.state.calls.find(call => call.method).body.body
  assert.match(body, /possible-improvement/); assert.doesNotMatch(body, /geometry-input-mismatch|RenamedInactiveHelper|fromArray/)
  assert.equal(JSON.stringify(reports), before)
})

test('trusted reporter rejects forged reader bodies, component hashes, ownership and unbounded fields without commenting', async () => {
  const mutations = [
    run => { run.readers.sources[7] = run.readers.sources[7].replace('< 16', '< 15') },
    run => { run.readers.sources[0] = 'getAttribute(x){return process.exit()}' },
    run => { run.readers.sources[0] = 'x'.repeat(1025) },
    run => { run.readers.sources.push('extra') }, run => { run.readers.rawSha256 = 'a'.repeat(64) },
    run => { run.readers.allSourcesSha256 = 'a'.repeat(64) }, run => { run.readers.semanticSha256 = 'a'.repeat(64) },
    run => { run.readers.matrixBinding = false }, run => { run.readers.strictData = false }, run => { run.readers.sessionStable = false },
    run => { run.readers.source.profile = 'unknown' }, run => { run.readers.source.slices[0].actualSha256 = 'f'.repeat(64) },
    run => { run.readers.provenance.command = 'execute' }, run => { run.readers.provenance.bundleSha256 = '[unsafe]' },
    run => { run.phases[0].blocks[0].geometryProof.metadata.position.normalized = 0 },
    run => { run.phases[0].blocks[0].geometryProof.positionSha256 = 'a'.repeat(64) },
    run => { delete run.phases[0].blocks[0].geometryProof }, run => { run.phases[0].readerEvidenceSha256 = 'a'.repeat(64) },
  ]
  for (const change of mutations) {
    const reports = readerReports(); change(reports[0].runs[1]); const mock = readerMock(reports)
    await assert.rejects(reportRun(mock.arguments), change.toString()); assert.equal(mock.state.calls.some(call => call.method), false)
  }
})

test('missing proof, dependency/bundle/arm drift, unknown source and real geometry changes remain withheld', async () => {
  for (const mode of ['missing', 'dependencies', 'three', 'builder', 'bundle', 'import', 'source', 'geometry', 'shard']) {
    const reports = readerReports(), run = reports[mode === 'shard' ? 1 : 0].runs[1]
    if (mode === 'missing') for (const report of reports) for (const r of report.runs) {
      delete r.readers
      for (const phase of r.phases) { delete phase.readerEvidenceSha256; for (const b of [...phase.blocks, ...(phase.warmup?.blocks ?? [])]) { delete b.geometryProof; delete b.geometryAfterProof } }
    }
    else if (['dependencies', 'three', 'builder', 'bundle', 'shard'].includes(mode)) run.readers.provenance[`${mode === 'shard' ? 'bundle' : mode}Sha256`] = 'f'.repeat(64)
    else if (mode === 'import') run.readers.source.importSha256 = null
    else if (mode === 'source') run.readers.source = { profile: null, slices: [], importSha256: readerImportSha256 }
    else { const block = run.phases[0].blocks[0]; block.geometryProof.positionSha256 = 'a'.repeat(64); block.geometrySha256 = snapshot.sha256(JSON.stringify(block.geometryProof)) }
    const mock = readerMock(reports), summaries = []
    mock.arguments.publishSummary = text => summaries.push(text)
    assert.equal((await reportRun(mock.arguments)).status, mode === 'geometry' ? 'created' : 'skipped-no-signal', mode)
    assert.match(summaries[0], /geometry-input-mismatch/, mode)
    if (mode !== 'geometry') assert.equal(mock.state.calls.some(call => call.method), false)
  }
})

test('exact original path is unchanged and unsupported appended cohort does not suppress five exact phases', async () => {
  const reports = readerReports()
  for (const report of reports) for (const run of report.runs) if (run.side === 'head') {
    const reference = report.runs[0]
    run.readers = structuredClone(reference.readers)
    for (const [i, phase] of run.phases.entries()) {
      phase.readerEvidenceSha256 = run.readers.allSourcesSha256
      phase.blocks = structuredClone(reference.phases[i].blocks)
      if (phase.warmup) phase.warmup.blocks = structuredClone(reference.phases[i].warmup.blocks)
    }
    run.readers.source = { profile: null, slices: [], importSha256: null }
  }
  reports[0].runs[1].phases[2] = { name: 'native-view-drag-warm', unsupported: 'source-contract' }
  const mock = readerMock(reports); assert.equal((await reportRun(mock.arguments)).status, 'created')
  const comparison = snapshot.compareReports(reports, identity)
  assert.ok(comparison.rows.filter(row => row.phase !== 'native-view-drag-warm').every(row => !row.p50.status.endsWith('mismatch')))
  assert.ok(comparison.rows.filter(row => row.phase === 'native-view-drag-warm').every(row => row.p50.status === 'unsupported-source-contract'))
})

test('unsupported emitted syntax retains bounded observed source and original raw digest before failing admission', async () => {
  const { recordSnapshotReaders } = await import('../scripts/browser-performance/snapshot-capture.mjs')
  const readers = readerReports()[0].runs[0].readers, report = {}, saved = []
  const evidence = { version: 1, sources: readers.sources.map((body, i) => i === 7 ? 'fromArray(a,o=0){return this}' : body),
    strictData: true, matrixBinding: true, sessionStable: true }
  assert.equal(recordSnapshotReaders({ report, evidence, readerSource: readers.source, readerProvenance: readers.provenance,
    save: () => saved.push(structuredClone(report)) }), false)
  assert.equal(report.readerAdmission, 'unsupported'); assert.equal(saved.length, 2); assert.equal(saved[0].observedReaders.sources[7], evidence.sources[7])
  assert.equal(saved[0].observedReaders.rawSha256, readers.rawSha256); assert.equal(report.readers, undefined)
})

test('optional appended capture failure retains semantic comparisons for all five completed phases', async () => {
  const reports = readerReports()
  reports[0].runs[1].phases[2] = { name: 'native-view-drag-warm', unsupported: 'capture-incomplete' }
  const mock = readerMock(reports); assert.equal((await reportRun(mock.arguments)).status, 'created')
  const comparison = snapshot.compareReports(reports, identity)
  assert.ok(comparison.rows.filter(row => row.phase !== 'native-view-drag-warm').every(row => !row.p50.status.endsWith('mismatch')))
  assert.ok(comparison.rows.filter(row => row.phase === 'native-view-drag-warm').every(row => row.p50.status === 'incomplete-cohort'))
})

test('optional proof finalization never changes exact phase statuses/references on validation or write failure', async () => {
  const { finalizeSnapshotReaderSummaries } = await import('../scripts/browser-performance/snapshot-capture.mjs')
  for (const failure of ['validation', 'write', null]) {
    const report = { readers: {}, readerAdmission: 'admitted', phases: ['native-hover', 'ordinary-hover'].map(name => ({ name, status: 'passed', summaryFile: `${name}.json` })) }
    const original = structuredClone(report.phases), writes = [], reads = []
    const result = finalizeSnapshotReaderSummaries(report, record => {
      reads.push(record.name); if (failure === 'validation' && reads.length === 2) throw Error('unsupported optional proof')
      return { exactPreviouslyValidated: true }
    }, (name, summary) => { writes.push([name, summary]); if (failure === 'write' && writes.length === 2) throw Error('proof write failed') })
    assert.equal(result, failure === null); assert.equal(reads.length, 2)
    if (failure) {
      assert.equal(report.readers, undefined); assert.equal(report.readerAdmission, 'unsupported'); assert.deepEqual(report.phases, original)
      assert.equal(writes.length, failure === 'validation' ? 0 : 2)
    } else {
      assert.equal(writes.length, 2)
      for (const [i, phase] of report.phases.entries()) { assert.equal(phase.status, 'passed'); assert.equal(phase.exactSummaryFile, original[i].summaryFile); assert.match(phase.summaryFile, /-readers\.json$/) }
    }
  }
})


const ownedComment = body => ({ id: 99, user: { id: 41898282, type: 'Bot', login: 'github-actions[bot]' }, body })
function quietReports(version, mode = 'within-noise') {
  const reports = version === 2 ? [snapshotFixture(), snapshotFixture('recovery')] : [fixture(), fixture('recovery')]
  for (const report of reports) for (const run of report.runs) for (const phase of run.phases) {
    const groups = version === 2 ? Object.values(phase.timings) : [phase.metrics]
    for (const group of groups) for (const [metric, distributions] of Object.entries(group)) {
      const value = mode === 'noisy' ? [10, 8, 14, 8, 10, 8][run.index]
        : mode === 'regression' ? (run.side === 'base' ? 10 : 12)
        : mode === 'observation-only' && (version === 1 ? metric === 'simulation' : ['simulation', 'callback', 'render'].includes(metric)) ? (run.side === 'base' ? 10 : 8) : 10
      for (const stat of Object.values(distributions)) if (stat) Object.assign(stat, { mean: value, p50: value, p95: value, max: value })
    }
    if (mode === 'mismatch') {
      if (version === 2) phase.stateSha256 = (run.side === 'base' ? 'a' : 'b').repeat(64)
      else phase.camera[0] = run.side === 'base' ? 0 : 10
    }
  }
  if (mode === 'incomplete') reports.pop()
  return reports
}
function reportMock(version, reports) {
  const mock = apiFixture(reports), summaries = []
  Object.assign(mock.arguments, { protocolVersion: version, publishSummary: text => summaries.push(text),
    trustedProtocol: version === 2 ? snapshot.protocolHash() : protocol })
  return { ...mock, summaries }
}
test('quiet and diagnostic runs retain full summaries without creating PR notifications in either protocol', async () => {
  for (const version of [1, 2]) for (const mode of ['within-noise', 'noisy', 'observation-only', 'mismatch', 'incomplete']) {
    const mock = reportMock(version, quietReports(version, mode))
    const result = await reportRun(mock.arguments)
    assert.equal(result.status, 'skipped-no-signal', `${version}: ${mode}`)
    assert.equal(mock.state.calls.some(call => call.method), false)
    assert.equal(mock.summaries.length, 1)
    assert.match(mock.summaries[0], /world-hover|ordinary-hover/)
    assert.match(mock.summaries[0], /recovery/)
    assert.match(mock.summaries[0], /actions\/runs\/1234\/attempts\/1/)
    if (mode === 'within-noise' || mode === 'noisy') assert.ok(mock.summaries[0].includes(mode))
    if (mode === 'mismatch') assert.match(mock.summaries[0], /workload-mismatch/)
    if (mode === 'incomplete') assert.match(mock.summaries[0], /incomplete|Incomplete/)
  }
})
test('eligible regressions still notify and publish their complete Actions summary', async () => {
  for (const version of [1, 2]) {
    const mock = reportMock(version, quietReports(version, 'regression'))
    assert.equal((await reportRun(mock.arguments)).status, 'created')
    assert.match(mock.state.calls.find(c => c.method).body.body, /possible-regression/)
    assert.match(mock.summaries[0], /possible-regression/)
  }
})
test('actionable finding is superseded once, stays quiet, and can signal again; legacy routine comments stay untouched', async () => {
  for (const version of [1, 2]) {
    const signal = reportMock(version, version === 2 ? [snapshotFixture(), snapshotFixture('recovery')] : [fixture(), fixture('recovery')])
    await reportRun(signal.arguments)
    const actionable = signal.state.calls.find(c => c.method).body.body
    for (const prior of [actionable, actionable.replace('<!-- populous-browser-performance-finding:actionable -->\n', '')]) {
      const quiet = reportMock(version, quietReports(version))
      quiet.state.comments = [ownedComment(prior)]
      assert.equal((await reportRun(quiet.arguments)).status, 'updated')
      const write = quiet.state.calls.find(c => c.method)
      assert.equal(write.method, 'PATCH'); assert.match(write.path, /issues\/comments\/99$/)
      assert.match(write.body.body, /finding superseded/); assert.match(write.body.body, /does not prove/)
      assert.doesNotMatch(write.body.body, /\| possible-improvement:/)
      quiet.state.comments = [ownedComment(write.body.body)]; quiet.state.calls.length = 0
      assert.equal((await reportRun(quiet.arguments)).status, 'skipped-no-signal')
      assert.equal(quiet.state.calls.some(c => c.method), false)
      signal.state.comments = quiet.state.comments; signal.state.calls.length = 0
      assert.equal((await reportRun(signal.arguments)).status, 'updated')
      assert.match(signal.state.calls.find(c => c.method).body.body, /possible-improvement/)
    }
    const legacy = reportMock(version, quietReports(version))
    await reportRun(legacy.arguments)
    legacy.state.comments = [ownedComment(legacy.summaries[0])]; legacy.state.calls.length = 0
    assert.equal((await reportRun(legacy.arguments)).status, 'skipped-no-signal')
    assert.equal(legacy.state.calls.some(c => c.method), false)
  }
})
test('supersession uses the same stale head, older-run, and attempt protections as actionable updates', async () => {
  const signal = apiFixture(); await reportRun(signal.arguments)
  const prior = signal.state.calls.find(c => c.method).body.body
  for (const mode of ['stale', 'older', 'attempt', 'impostor', 'duplicate']) {
    const mock = reportMock(2, quietReports(2))
    mock.state.comments = [ownedComment(prior)]
    if (mode === 'stale') mock.state.changeBeforeWrite = true
    if (mode === 'older') mock.state.comments[0].body = prior.replace('run:1234:1', 'run:1235:1')
    if (mode === 'impostor') mock.state.comments[0].user.id = 2
    if (mode === 'duplicate') mock.state.comments.push(ownedComment(prior))
    if (mode === 'attempt') {
      const original = mock.arguments.api; let reads = 0
      mock.arguments.api = async (path, options) => {
        const result = await original(path, options)
        return path.endsWith('/actions/runs/1234') && ++reads > 1 ? { ...result, run_attempt: 2 } : result
      }
    }
    if (mode === 'duplicate') await assert.rejects(reportRun(mock.arguments), /Ambiguous/)
    else assert.ok((await reportRun(mock.arguments)).status.startsWith('skipped-'))
    assert.equal(mock.state.calls.some(c => c.method), false)
    assert.equal(mock.summaries.length, 1)
  }
})


test('newer completed quiet runs suppress delayed signals even without a current sticky marker', async () => {
  for (const prior of [null, `${commentMarker}\n<!-- populous-browser-performance-run:1232:1 -->\nLegacy routine report`, `${commentMarker}\n<!-- populous-browser-performance-run:1232:1 -->\n<!-- populous-browser-performance-finding:superseded -->`]) {
    const mock = apiFixture()
    if (prior) mock.state.comments = [ownedComment(prior)]
    mock.state.completedRuns = { total_count: 2, workflow_runs: [mock.state.run, { ...mock.state.run, id: 1235 }] }
    assert.equal((await reportRun(mock.arguments)).status, 'skipped-newer-run')
    assert.equal(mock.state.calls.some(c => c.method), false)
  }
})
test('newer unrelated runs do not suppress eligible signals; incomplete run inventories fail closed', async () => {
  for (const mode of ['other-pr', 'other-head', 'unbounded', 'partial']) {
    const mock = apiFixture(), newer = { ...mock.state.run, id: 1235 }
    if (mode === 'other-pr') newer.pull_requests = [{ number: 43 }]
    if (mode === 'other-head') newer.head_sha = 'f'.repeat(40)
    mock.state.completedRuns = { total_count: mode === 'unbounded' ? 101 : mode === 'partial' ? 3 : 2, workflow_runs: [mock.state.run, newer] }
    if (['unbounded', 'partial'].includes(mode)) {
      await assert.rejects(reportRun(mock.arguments), /completed run inventory/)
      assert.equal(mock.state.calls.some(c => c.method), false)
    } else assert.equal((await reportRun(mock.arguments)).status, 'created')
  }
})


test('newer quiet attempt of the same run suppresses delayed signals without advancing a sticky marker', async () => {
  for (const prior of [null, `${commentMarker}\n<!-- populous-browser-performance-run:1234:1 -->\n<!-- populous-browser-performance-finding:superseded -->`]) {
    const mock = apiFixture()
    if (prior) mock.state.comments = [ownedComment(prior)]
    mock.state.completedRuns = { total_count: 1, workflow_runs: [{ ...mock.state.run, run_attempt: 2 }] }
    assert.equal((await reportRun(mock.arguments)).status, 'skipped-newer-run')
    assert.equal(mock.state.calls.some(c => c.method), false)
  }
})
test('completed-run attempts must be positive safe integers before any comment write', async () => {
  for (const run_attempt of [undefined, 0, -1, 1.5, '2', Number.MAX_SAFE_INTEGER + 1]) {
    const mock = apiFixture()
    mock.state.completedRuns = { total_count: 1, workflow_runs: [{ ...mock.state.run, run_attempt }] }
    await assert.rejects(reportRun(mock.arguments), /Invalid completed run identity/)
    assert.equal(mock.state.calls.some(c => c.method), false)
  }
})

test('inactive-helper-only fallback qualifies five stable cohorts without admitting held drag', () => {
  const reports = readerReports()
  for (const report of reports) for (const run of report.runs) {
    run.readers.source = { profile: null, slices: [], importSha256: readerImportSha256 }
    if (report.shard === 'world') run.phases[2] = { name: 'native-view-drag-warm', unsupported: 'source-contract' }
  }
  const compared = snapshot.compareReports(reports, identity)
  assert.ok(compared.rows.filter(row => row.phase !== 'native-view-drag-warm').every(row => !row.p50.status.endsWith('mismatch')))
  assert.ok(compared.rows.filter(row => row.phase === 'native-view-drag-warm').every(row => row.p50.status === 'unsupported-source-contract'))
  // Each shard alone has a consistent arm, but the two shards disagree about
  // that arm's emitted runtime. The whole report must reject the fallback.
  for (const run of reports[1].runs) if (run.side === 'head') run.readers.provenance.bundleSha256 = 'f'.repeat(64)
  const drifted = snapshot.compareReports(reports, identity)
  assert.ok(drifted.rows.filter(row => row.phase !== 'native-view-drag-warm').every(row => row.p50.status === 'geometry-input-mismatch'))
})


test('historical v2 protocol cannot publish a summary or mutate comments through the production default', async () => {
  const historicalProtocol = '6697351a369a029e19401a6a10e0a20763bcd4379a9b6fa02c2fd465503a5c51'
  // Otherwise-valid synthetic fixtures, not a replay or reinterpretation of old measurements.
  for (const explicitHistoricalOverride of [false, true]) {
    const reports = [snapshotFixture(), snapshotFixture('recovery')]
    for (const report of reports) {
      report.protocolSha256 = historicalProtocol
      snapshot.validateReport(report)
    }
    const mock = apiFixture(reports), summaries = []
    mock.arguments.protocolVersion = 2
    mock.arguments.publishSummary = text => summaries.push(text)
    // apiFixture supplies a legacy test override; remove it to exercise the real default.
    delete mock.arguments.trustedProtocol
    if (explicitHistoricalOverride) mock.arguments.trustedProtocol = historicalProtocol
    else assert.equal(Object.hasOwn(mock.arguments, 'trustedProtocol'), false)
    // Even an explicit old comparator override cannot bypass the renderer's trusted default.
    await assert.rejects(reportRun(mock.arguments), error => {
      assert.equal(error.name, 'AssertionError')
      assert.equal(error.code, 'ERR_ASSERTION')
      assert.equal(error.actual, historicalProtocol)
      assert.equal(error.expected, snapshot.protocolHash())
      return true
    })
    assert.equal(summaries.length, 0)
    assert.equal(mock.state.calls.filter(call => call.method).length, 0)
  }
})


test('trusted snapshot reader evidence admits RenderView CPU leases and rejects mixed or stale profiles', async () => {
  const reports = readerReports()
  const previousId = 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-v1'
  const currentId = 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-render-cpu-leases-v1'
  for (const report of reports) for (const run of report.runs) {
    const id = run.side === 'base' ? previousId : currentId
    const profile = dragSourceProfiles.find(profile => profile.id === id)
    assert.ok(profile)
    run.readers.source = { profile: id, importSha256: readerImportSha256,
      slices: profile.slices.map(slice => ({ id: slice.id, expectedSha256: slice.sha256,
        actualSha256: slice.sha256, reason: null })) }
  }
  for (const report of reports) snapshot.parseReport(JSON.stringify(report))
  assert.equal((await reportRun(readerMock(reports).arguments)).status, 'created')
  const historical = dragSourceProfiles.find(profile => profile.id === previousId)
  for (const mutate of [
    run => { run.readers.source.profile = 'unknown-render-cpu-leases' },
    run => { run.readers.source.slices = run.readers.source.slices.filter(slice => slice.id !== 'pick-operation-leases') },
    ...['submission-key', 'query-entry', 'owned-terrain-entry'].map(id => run => {
      const slice = run.readers.source.slices.find(slice => slice.id === id)
      slice.expectedSha256 = slice.actualSha256 = historical.slices.find(slice => slice.id === id).sha256
    }),
    run => { const slice = run.readers.source.slices.find(slice => slice.id === 'pick-operation-leases'); slice.expectedSha256 = slice.actualSha256 = '0'.repeat(64) },
  ]) {
    const changed = structuredClone(reports); mutate(changed[0].runs.find(run => run.side === 'head'))
    const mock = readerMock(changed)
    await assert.rejects(reportRun(mock.arguments)); assert.equal(mock.state.calls.some(call => call.method), false)
  }
  // Registry changes have a new trusted protocol identity, not retrospective
  // authority to compare or publish reports captured under an older protocol.
  const stale = structuredClone(reports); stale[0].protocolSha256 = '0'.repeat(64)
  const mock = readerMock(stale)
  await assert.rejects(reportRun(mock.arguments)); assert.equal(mock.state.calls.some(call => call.method), false)
})

test('trusted snapshot reader evidence admits the reviewed CPU route and rejects mixed or unknown routes', async () => {
  const reports = readerReports()
  for (const report of reports) for (const run of report.runs) {
    const id = run.side === 'base' ? 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-v1'
      : 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-disposed-cpu-v1'
    const profile = dragSourceProfiles.find(profile => profile.id === id)
    assert.ok(profile)
    run.readers.source = { profile: id, importSha256: readerImportSha256,
      slices: profile.slices.map(slice => ({ id: slice.id, expectedSha256: slice.sha256,
        actualSha256: slice.sha256, reason: null })) }
  }
  for (const report of reports) snapshot.parseReport(JSON.stringify(report))
  assert.equal((await reportRun(readerMock(reports).arguments)).status, 'created')
  const historical = dragSourceProfiles.find(profile => profile.id === 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-v1')
  for (const mutate of [
    run => { run.readers.source.profile = 'unknown-disposed-cpu' },
    ...['frame-order', 'terrain-producers'].map(id => run => {
      const slice = run.readers.source.slices.find(slice => slice.id === id)
      slice.expectedSha256 = slice.actualSha256 = historical.slices.find(slice => slice.id === id).sha256
    }),
  ]) {
    const changed = structuredClone(reports); mutate(changed[0].runs.find(run => run.side === 'head'))
    const mock = readerMock(changed)
    await assert.rejects(reportRun(mock.arguments)); assert.equal(mock.state.calls.some(call => call.method), false)
  }
  // Newly registered source profiles change the trusted protocol identity;
  // an older or arbitrary protocol cannot be relabelled as current evidence.
  const stale = structuredClone(reports); stale[0].protocolSha256 = '0'.repeat(64)
  const mock = readerMock(stale)
  await assert.rejects(reportRun(mock.arguments)); assert.equal(mock.state.calls.some(call => call.method), false)
})

test('combined CPU source proof is exact and ordered without reauthorizing sibling reports', async () => {
  const previousId = 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-v1'
  const cpuId = 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-disposed-cpu-v1'
  const renderId = 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-render-cpu-leases-v1'
  const combinedId = 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-disposed-cpu-render-cpu-leases-v1'
  const profile = dragSourceProfiles.find(profile => profile.id === combinedId)
  const historical = dragSourceProfiles.find(profile => profile.id === previousId)
  assert.equal(profile.slices.length, 18)
  const reports = readerReports()
  for (const report of reports) for (const run of report.runs) {
    const selected = run.side === 'base' ? historical : profile
    run.readers.source = { profile: selected.id, importSha256: readerImportSha256,
      slices: selected.slices.map(slice => ({ id: slice.id, expectedSha256: slice.sha256,
        actualSha256: slice.sha256, reason: null })) }
  }
  for (const report of reports) snapshot.parseReport(JSON.stringify(report))
  assert.equal((await reportRun(readerMock(reports).arguments)).status, 'created')
  for (const mutate of [
    ...[cpuId, renderId, 'unknown-combined-cpu'].map(id => run => { run.readers.source.profile = id }),
    run => { run.readers.source.slices.reverse() },
    run => { run.readers.source.slices.push({ ...run.readers.source.slices[0] }) },
    run => { run.readers.source.slices[1] = { ...run.readers.source.slices[0] } },
    run => { run.readers.source.slices = run.readers.source.slices.filter(slice => slice.id !== 'pick-operation-leases') },
    ...['frame-order', 'terrain-producers', 'submission-key', 'query-entry', 'owned-terrain-entry'].map(id => run => {
      const slice = run.readers.source.slices.find(slice => slice.id === id)
      slice.expectedSha256 = slice.actualSha256 = historical.slices.find(slice => slice.id === id).sha256
    }),
    run => { const slice = run.readers.source.slices.find(slice => slice.id === 'pick-operation-leases'); slice.expectedSha256 = slice.actualSha256 = '0'.repeat(64) },
    run => { run.readers.source.slices.at(-1).reason = 'source-changed' },
  ]) {
    const changed = structuredClone(reports); mutate(changed[0].runs.find(run => run.side === 'head'))
    const mock = readerMock(changed), summaries = []
    mock.arguments.publishSummary = text => summaries.push(text)
    await assert.rejects(reportRun(mock.arguments))
    assert.equal(mock.state.calls.some(call => call.method), false); assert.equal(summaries.length, 0)
  }
  // Exact protocol identities from the authenticated 786 and 789 sibling heads.
  // Neither defaults nor an explicit historical override permit old reports to
  // publish through the current trusted renderer after registry composition.
  for (const staleProtocol of ['e23fb4d7efbfbbcce230ecfc06697c978c7fd77b97e2b2f7136b7680bd87e4f6',
    'cb1e6458406a25fce2e9c3dbab4b74fa9d47abb36f11d8bc8f1b5ec16ee3900f']) {
    assert.notEqual(staleProtocol, snapshot.protocolHash())
    for (const explicitHistoricalOverride of [false, true]) {
      const stale = structuredClone(reports)
      for (const report of stale) report.protocolSha256 = staleProtocol
      const mock = readerMock(stale), summaries = []
      delete mock.arguments.trustedProtocol
      if (explicitHistoricalOverride) mock.arguments.trustedProtocol = staleProtocol
      mock.arguments.publishSummary = text => summaries.push(text)
      await assert.rejects(reportRun(mock.arguments))
      assert.equal(mock.state.calls.some(call => call.method), false); assert.equal(summaries.length, 0)
    }
  }
})
