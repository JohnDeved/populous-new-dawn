import assert from 'node:assert/strict'
import test from 'node:test'
import { repository, shards, order, metrics, workMetrics, policy, protocolHash, validateReport,
  compareReports, comparableWork, workloadDiagnostics, classify } from '../scripts/browser-performance/protocol.mjs'
import { renderComment } from '../scripts/browser-performance/render.mjs'

const identity = { repository, prNumber: 42, baseSha: 'a'.repeat(40), headSha: 'b'.repeat(40), harnessSha: 'a'.repeat(40), runId: 1234, runAttempt: 1 }
const protocol = 'c'.repeat(64)
const stat = value => ({ n: 16, mean: value, p50: value, p95: value, max: value })
function fixture(shard = 'world') {
  return { version: 1, identity: { ...identity }, protocolSha256: protocol, runtimeSha256: 'd'.repeat(64), shard, status: 'complete',
    runs: order.map((side, index) => ({ index, side, revision: identity[`${side}Sha`], status: 'complete', environmentSha256: 'e'.repeat(64),
      phases: shards[shard].map(name => ({ name, frames: 16, startTurn: 10, endTurn: 20, durationMs: 1600, coveredSpanMs: 1600,
        point: { x: 900, y: 400, id: null }, inputOffsetsMs: [0, 120], camera: [0, 0, 0, 0, 0, 0],
        metrics: Object.fromEntries(Object.keys(metrics).map(key => [key, { all: stat(side === 'base' ? 10 : 8), nonzero: stat(side === 'base' ? 10 : 8), perQuery: stat(side === 'base' ? 10 : 8) }])),
        work: Object.fromEntries(Object.keys(workMetrics).map(key => [key, stat(1)])) })) })) }
}
const phases = report => report.runs.map(run => run.phases[0])
const render = reports => renderComment(compareReports(reports, identity, protocol), identity, reports)
const section = text => text.slice(text.indexOf('<details>'), text.indexOf('</details>'))

test('fixed workload reasons retain observed values and the exact failing threshold', () => {
  const cases = [
    ['duration', p => { p.durationMs = 2000 }, 'duration', 2000, 400, 200],
    ['turn', p => { p.startTurn = 13 }, 'startTurn', 13, 3, 2],
    ['turn', p => { p.endTurn = 23 }, 'endTurn', 23, 3, 2],
    ['target', p => { p.point.id = 54 }, 'id', 54],
    ['pointer', p => { p.point.x = 907 }, 'x', 907, 7, 6],
    ['pointer', p => { p.point.y = 407 }, 'y', 407, 7, 6],
    ['input-count', p => { p.inputOffsetsMs = [] }, 'count', 0],
    ['input-timing', p => { p.inputOffsetsMs[1] = 271 }, 1, 271, 151, 150],
    ['camera', p => { p.camera[0] = -0.6 }, 0, -0.6, 0.6, 0.5],
    ['camera', p => { p.camera[5] = 0.2 }, 5, 0.2, 0.2, 0.1],
    ['query-presence', p => { p.work.terrainCalls = stat(0) }, 'terrainCalls', 0],
    ['query-presence', p => { p.work.objectCalls = null }, 'objectCalls', null],
  ]
  for (const [code, mutate, field, value, difference, limit] of cases) {
    const report = fixture(); mutate(report.runs[1].phases[0]); validateReport(report)
    const observed = phases(report), reasons = workloadDiagnostics(observed)
    assert.equal(comparableWork(observed), false, code)
    assert.equal(reasons.length, 1, code); assert.equal(reasons[0].code, code)
    const item = reasons[0].observations[0]
    assert.equal(item.field, field); assert.equal(item.values.length, 6); assert.equal(item.values[1], value)
    assert.equal(item.difference, difference); assert.equal(item.limit, limit)
    if (difference !== undefined) assert.equal(item.index, 1)
    const result = compareReports([report, fixture('recovery')], identity, protocol)
    for (const row of result.rows.filter(row => row.phase === 'world-hover')) {
      assert.deepEqual(row.p50, { status: 'workload-mismatch' }); assert.deepEqual(row.p95, row.p50)
    }
  }
})

test('diagnostics do not loosen exact boundary checks, change protocol hashing or include internal work outcomes', () => {
  assert.equal(protocolHash({ diagnosticTest: 1 }), '3993c3bebea00d922cd8f8a737aa4f83d007e92e6a86ecdad113d10c99c79f60')
  for (const mutate of [p => { p.startTurn += 2 }, p => { p.endTurn += 2 }, p => { p.point.x += 6 },
    p => { p.point.y += 6 }, p => { p.inputOffsetsMs[0] += 150 },
    ...Array.from({ length: 6 }, (_, index) => p => { p.camera[index] = index % 3 === 2 ? 0.1 : 0.5 }),
    p => { p.work.ordinaryVertices = stat(0); p.work.modelBuilds = stat(0); p.work.nativeTriangles = stat(0) }]) {
    const observed = phases(fixture()); mutate(observed[1])
    assert.equal(comparableWork(observed), true); assert.deepEqual(workloadDiagnostics(observed), [])
  }
  const duration = phases(fixture()); duration.forEach(p => { p.durationMs = 1800 }); duration[1].durationMs = 2000
  assert.equal(comparableWork(duration), true); assert.deepEqual(workloadDiagnostics(duration), [])
  duration[1].durationMs += 0.001
  assert.equal(comparableWork(duration), false); assert.equal(workloadDiagnostics(duration)[0].code, 'duration')
  assert.equal(policy.durationTolerance, 0.1)
})

test('mismatched phases get one concise explanation, actual baseline/candidate values and no timing claims', () => {
  const report = fixture(), observed = phases(report)
  observed[3].startTurn = 13 // A baseline repeat, not a candidate change.
  observed[1].camera[2] = 0.10000000000000002
  observed[1].camera[5] = 0.2
  observed[1].inputOffsetsMs[1] = 271
  observed[1].point.id = 54
  const text = section(render([report, fixture('recovery')]))
  assert.equal((text.match(/workload-mismatch/g) ?? []).length, 1)
  assert.match(text, /withheld for all 15 sections/)
  assert.match(text, /B \[10, 13, 10\], PR \[10, 10, 10\]/)
  assert.match(text, /B1 vs B2: difference 3 > limit 2 turns/)
  assert.match(text, /2 fields differ; first shown/)
  assert.match(text, /0\.10000000000000002/)
  assert.match(text, /event 2 offset ms.*difference 151 > limit 150 ms/)
  assert.match(text, /Target ID: B \[none, none, none\], PR \[54, none, none\]; exact match required/)
  assert.doesNotMatch(text, /possible-improvement|possible-regression|Session p50 comparison|ms\/query|[+-]\d.*%/)
})

test('missing query and session inputs remain unknown, never zero or an invented reason', () => {
  const report = fixture(); report.runs[1].phases[0].work.objectCalls = null
  const text = section(render([report, fixture('recovery')]))
  assert.match(text, /object queries\/frame: B \[1, 1, 1\], PR \[unknown, 1, 1\]/)
  assert.match(text, /presence must be known and match/)
  assert.deepEqual(workloadDiagnostics([]), [{ code: 'missing-sessions', observations: [] }])
  assert.deepEqual(workloadDiagnostics([null, ...phases(fixture()).slice(1)]), [{ code: 'missing-sessions', observations: [] }])
  const incomplete = fixture(); incomplete.status = 'incomplete'; incomplete.runs.pop()
  assert.match(section(render([incomplete, fixture('recovery')])), /incomplete/)
  assert.doesNotMatch(section(render([incomplete, fixture('recovery')])), /workload-mismatch|difference .*limit/)
  const metricsMissing = fixture(); metricsMissing.runs[1].phases[0].metrics.render = { all: null, nonzero: null, perQuery: null }
  assert.equal(compareReports([metricsMissing, fixture('recovery')], identity, protocol).rows[1].p50.status, 'unknown')
})

test('diagnostic rendering admits only validated bounded numbers and fixed labels, never artifact text', () => {
  const payload = '[unexpected](https://evil.invalid) <img> @all |\n'
  const attacks = [r => { r.runs[1].phases[0].point.id = payload }, r => { r.runs[1].phases[0].camera[0] = payload },
    r => { r.runs[1].phases[0].inputOffsetsMs[0] = payload }, r => { r.runs[1].phases[0].reason = payload },
    r => { r.runs[1].phases[0].name = payload }, r => { r.runs[1].phases[0].durationMs = Infinity },
    r => { r.runs[1].phases[0].work.objectCalls.mean = 1e10 }]
  const trustedComparison = compareReports([fixture(), fixture('recovery')], identity, protocol)
  for (const attack of attacks) {
    const report = fixture(); attack(report)
    assert.throws(() => renderComment(trustedComparison, identity, [report, fixture('recovery')]))
  }
  const reports = [fixture(), fixture('recovery')]
  for (const report of reports) for (const run of report.runs) for (const p of run.phases) {
    p.inputOffsetsMs = Array(12).fill(0)
    if (run.index === 1) {
      p.durationMs = 180000; p.coveredSpanMs = 180000; p.startTurn = 99999990; p.endTurn = 100000000
      p.camera = Array(6).fill(-999999.9999999999); p.inputOffsetsMs.fill(179999.99999999997)
      p.point = { x: 1440, y: 1000, id: 1000000000 }; p.work.objectCalls = null; p.work.terrainCalls = stat(0)
    }
  }
  const text = render(reports)
  assert.equal((text.match(/workload-mismatch/g) ?? []).length, 5)
  assert.ok(Buffer.byteLength(text) < 60000)
  assert.match(text, /12 fields differ; first shown/); assert.match(text, /6 fields differ; first shown/)
  assert.doesNotMatch(text, /https?:\/\/(?!github\.com\/JohnDeved\/populous-new-dawn\/actions\/runs\/1234\/attempts\/1)/)
})

test('matched reports retain the same effect, noise, environment and simulation gates', () => {
  assert.equal(classify([10, 10, 10], [8, 8, 8]).status, 'possible-improvement')
  assert.equal(classify([10, 10, 10], [12, 12, 12]).status, 'possible-regression')
  assert.equal(classify([10, 14, 10], [8, 8, 8]).status, 'noisy')
  assert.equal(classify([10, 10, 10], [10.1, 10.2, 10.1]).status, 'within-noise')
  assert.equal(classify([10, null, 10], [8, 8, 8]).status, 'unknown')
  const reports = [fixture(), fixture('recovery')], comparison = compareReports(reports, identity, protocol)
  assert.equal(comparison.rows[0].p50.status, 'observed-only-no-per-turn-attribution')
  assert.equal(comparison.rows[1].p50.status, 'possible-improvement')
  assert.match(render(reports), /Session p50 comparison/)
  reports[0].runs[1].environmentSha256 = 'f'.repeat(64)
  assert.equal(compareReports(reports, identity, protocol).rows[1].p50.status, 'environment-mismatch')
})
