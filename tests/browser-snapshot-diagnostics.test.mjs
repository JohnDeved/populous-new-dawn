import assert from 'node:assert/strict'
import test from 'node:test'
import { snapshotDiagnostics } from '../scripts/browser-performance/snapshot-diagnostics.mjs'
import { renderSnapshotComment } from '../scripts/browser-performance/snapshot-render.mjs'
import { compareReports, metrics, order, protocolHash, repository, shards, strata, workMetrics } from '../scripts/browser-performance/snapshot-protocol.mjs'

const identity = { repository, prNumber: 42, baseSha: 'a'.repeat(40), headSha: 'b'.repeat(40), harnessSha: 'a'.repeat(40), runId: 1234, runAttempt: 1 }
const digest = 'c'.repeat(64), other = 'd'.repeat(64)
function report(shard) {
  return { version: 2, identity: { ...identity }, protocolSha256: protocolHash(), runtimeSha256: digest, snapshotSha256: digest, shard, status: 'complete',
    runs: order.map((side, index) => ({ index, side, revision: identity[`${side}Sha`], status: 'complete', environmentSha256: digest,
      phases: shards[shard].map(name => {
        const value = side === 'base' ? 10 : 8, stats = n => ({ n, mean: value, p50: value, p95: value, max: value })
        const phase = { name, stateSha256: digest, viewConfigSha256: digest, targetId: name.startsWith('native-') ? 54 : null,
          point: [900, 400], frames: 24, rawFrames: 40, durationMs: 1000,
          blocks: Array.from({ length: 6 }, (_, step) => ({ step, event: 'pointermove', point: [900, 400], geometrySha256: digest, ...(name === 'native-view-drag-warm' ? { geometryAfterSha256: other, inputPoseSha256: digest } : {}),
            poses: Array(4).fill(digest), inventory: Array.from({ length: 4 }, (_, i) => name === 'hud' || (name === 'native-view-drag-warm' && i > 0) ? [0, 0, 0] : [1, 1, 8]) })),
          timings: Object.fromEntries(strata.map(s => [s, Object.fromEntries(Object.keys(metrics).map(key => [key,
            { all: stats(s === 'first' ? 6 : 18), nonzero: stats(s === 'first' ? 6 : 18), perQuery: stats(s === 'first' ? 6 : 18) }]))])),
          work: Object.fromEntries(strata.map(s => [s, Object.fromEntries(Object.keys(workMetrics).map(key => [key, stats(s === 'first' ? 6 : 18)]))])) }
        if (name === 'native-view-drag-warm') {
          phase.rawFrames = 80
          phase.warmup = { frames: 24, blocks: structuredClone(phase.blocks), firstCpuMs: Object.fromEntries(['nativeKey', 'nativeProjection', 'nativeTriangles', 'callback'].map(key => [key, Array(6).fill(value)])) }
        }
        return phase
      }) })) }
}
const reports = () => [report('world'), report('recovery')]
const diagnose = input => snapshotDiagnostics(compareReports(input, identity), identity, input)
const render = input => renderSnapshotComment(compareReports(input, identity), identity, input)
const section = (body, name = 'native-hover') => body.split(`<details><summary>${name} (`)[1].split('</details>')[0]

test('matching workloads retain exact classifications, timing rows and work outcomes without mutation', () => {
  const input = reports(), original = JSON.stringify(input), comparison = compareReports(input, identity)
  assert.ok(diagnose(input).every(item => item.diagnosis === null))
  const body = renderSnapshotComment(comparison, identity, input)
  assert.match(section(body), /Terrain pick CPU \/ first .*possible-improvement: 10\.000 → 8\.000 \(-2\.000 ms\)/)
  assert.equal(body.match(/\| Section \/ callback stratum/g).length, Object.values(shards).flat().length)
  assert.match(body, /observation-only-unverified-nonterrain-inputs/)
  assert.equal(JSON.stringify(input), original)
  assert.deepEqual(compareReports(input, identity), comparison)
  input[0].runs[1].phases[0].work.first.modelBuilds = null
  input[0].runs[1].phases[0].rawFrames++
  input[0].runs[1].phases[0].durationMs++
  assert.ok(diagnose(input).every(item => item.diagnosis === null))
  assert.deepEqual(compareReports(input, identity), comparison)
})

test('each exact workload field receives one bounded diagnosis, including baseline-repeat mismatches', () => {
  const changes = [
    [phase => { phase.stateSha256 = other }, 'Authored state SHA-256'],
    [phase => { phase.viewConfigSha256 = other }, 'View configuration SHA-256'],
    [phase => { phase.targetId = 55 }, 'Target ID'],
    [phase => { phase.targetId = null }, 'Target ID'],
    [phase => { phase.point[0] = 900.0000000000001 }, 'Phase pointer x pixels'],
    [phase => { phase.point[1]++ }, 'Phase pointer y pixels'],
    [phase => { phase.blocks[4].point[0]++ }, 'Input 5 pointer x pixels'],
    [phase => { phase.blocks[3].poses[2] = other }, 'Input 4, callback 3 pose SHA-256'],
    [phase => { phase.blocks[1].inventory[2][0]++ }, 'Input 2, callback 3 terrain queries'],
    [phase => { phase.blocks[2].inventory[3][1]++ }, 'Input 3, callback 4 object queries'],
    [phase => { phase.blocks[5].inventory[1][2] = null }, 'Input 6, callback 2 native submitted triangles'],
  ]
  for (const [change, label] of changes) {
    const input = reports(); change(input[0].runs[3].phases[0])
    const item = diagnose(input)[0]
    assert.ok(item.diagnosis.startsWith(`workload-mismatch: ${label}:`), item.diagnosis)
    assert.match(item.diagnosis, /B \[.*\]; H \[/)
    assert.match(item.diagnosis, /pair 1\/base != pair 2\/base; exact/)
    assert.ok(item.diagnosis.length < 1000)
    const body = section(render(input))
    assert.equal(body.match(/workload-mismatch/g).length, 1)
    assert.doesNotMatch(body, /Session p50|possible-improvement|possible-regression/)
    assert.match(body, /\| Pair\/arm \| Selected\/raw frames/)
    assert.equal(body.match(/\| [123]\/(base|head) \|/g).length, 6)
  }
  const precise = reports(); precise[0].runs[1].phases[0].point[0] = 900.0000000000001
  assert.match(diagnose(precise)[0].diagnosis, /900\.0000000000001/)
})

test('geometry priority, first differing field and truncated hash collisions preserve exact guard meaning', () => {
  const input = reports(), phase = input[0].runs[5].phases[0]
  phase.stateSha256 = other; phase.blocks[2].geometrySha256 = digest.slice(0, 63) + 'd'
  phase.blocks[3].geometrySha256 = other
  const reason = diagnose(input)[0].diagnosis
  assert.match(reason, /^geometry-input-mismatch: Input 3 terrain-input fingerprint SHA-256:/)
  assert.match(reason, /pair 1\/base != pair 3\/head; exact full SHA-256 equality required/)
  assert.match(reason, /12-character prefixes shown/)
  assert.match(reason, /includes bounded consumer function signatures; see raw boundary diagnostics/)
  assert.match(reason, /does not establish gameplay drift/)
  assert.doesNotMatch(reason, /Input 4|Authored state/)
  assert.ok(!reason.includes(digest) && !reason.includes(other))
})

test('runtime, per-session environment and authored snapshot mismatches explain the original classification', () => {
  for (const [field, label, status] of [['runtimeSha256', 'Runtime SHA-256', 'environment-mismatch'], ['snapshotSha256', 'Authored snapshot SHA-256', 'workload-mismatch']]) {
    const input = reports(); input[1][field] = other
    const reason = diagnose(input)[0].diagnosis
    assert.ok(reason.startsWith(`${status}: ${label}: world=cccccccccccc; recovery=dddddddddddd.`))
    assert.match(reason, /Exact full SHA-256 equality required across available shards/)
    assert.equal(section(render(input)).match(new RegExp(status, 'g')).length, 1)
  }
  const input = reports(); input[0].runs[4].environmentSha256 = other
  assert.match(diagnose(input)[0].diagnosis, /^environment-mismatch: Browser environment SHA-256:.*pair 1\/base != pair 3\/base/)
})

test('incomplete capture names exact pair/arm presence, never inventing a browser failure', () => {
  const input = reports(), world = input[0]
  world.status = 'incomplete'; world.runs.pop()
  world.runs[1].status = 'incomplete'; world.runs[1].phases = []
  world.runs[3].status = 'incomplete'; world.runs[3].phases.splice(1)
  const native = diagnose(input)[0].diagnosis, ordinary = diagnose(input)[1].diagnosis
  assert.match(native, /pair 1\/base: phase present, run complete/)
  assert.match(native, /pair 1\/head: phase missing, run incomplete/)
  assert.match(native, /pair 2\/head: phase present, run complete/)
  assert.match(native, /pair 2\/base: phase present, run incomplete/)
  assert.match(ordinary, /pair 2\/base: phase missing, run incomplete/)
  assert.match(native, /pair 3\/head: run missing, phase missing/)
  assert.match(native, /Failure cause is not recorded in this schema/)
  const body = section(render(input))
  assert.doesNotMatch(body, /Session p50/)
  assert.equal(body.match(/\| [123]\/(base|head) \|/g).length, 4)
  assert.match(body, /Timing comparisons withheld/)
  const allPresent = reports(); allPresent[0].status = 'incomplete'
  assert.equal(diagnose(allPresent)[0].diagnosis.match(/phase present, run complete/g).length, 6)
})

test('missing reports and incompatible dependencies remain bounded presence diagnostics', () => {
  const empty = diagnose([])
  assert.equal(empty.length, Object.values(shards).flat().length)
  for (const item of empty) {
    assert.match(item.diagnosis, /^incomplete: Shard report missing/)
    assert.equal(item.diagnosis.match(/run missing, phase missing/g).length, 6)
  }
  assert.doesNotMatch(render([]), /Session p50/)
  const input = reports(); Object.assign(input[0], { status: 'incompatible-dependencies', runtimeSha256: null, snapshotSha256: null, runs: [] })
  assert.match(diagnose(input)[0].diagnosis, /^incompatible-dependencies: Shard report incompatible-dependencies/)
  const available = [report('world')]
  assert.equal(diagnose(available)[0].diagnosis, null)
  assert.match(section(render(available)), /incomplete-shards-observation-only/)
  assert.doesNotMatch(render(available), /possible-improvement|possible-regression/)
})

test('complete input validation rejects arbitrary strings and fields, even in unused later-shard data', () => {
  const attack = '[execute](https://evil.invalid)\n</details><script>unsafe</script>'
  const mutations = [
    r => { r.failureReason = attack }, r => { r.status = attack }, r => { r.shard = attack },
    r => { r.identity.runId = attack }, r => { r.runs[5].error = attack }, r => { r.runs[5].side = attack },
    r => { r.runs[5].environmentSha256 = attack }, r => { r.runs[5].phases[2].name = attack },
    r => { r.runs[5].phases[2].stateSha256 = attack }, r => { r.runs[5].phases[2].point[0] = attack },
    r => { r.runs[5].phases[2].blocks[5].poses[3] = attack }, r => { r.runs[5].phases[2].blocks[5].inventory[3][2] = attack },
    r => { r.runs[5].phases[2].blocks[5].reason = attack },
    r => { r.runs[5].phases[2].timings.settled.nativeTriangles.perQuery.max = attack },
    r => { r.runs[5].phases[2].work.settled.modelBuilds.details = attack },
  ]
  for (const mutate of mutations) {
    const input = reports(), comparison = compareReports(input, identity); mutate(input[1])
    assert.throws(() => snapshotDiagnostics(comparison, identity, input))
    assert.throws(() => renderSnapshotComment(comparison, identity, input))
  }
  for (const mutate of [c => { c.rows[0].p50.status = attack }, c => { c.rows[0].basis = attack },
    c => { c.missing = [attack] }, c => { c.rows[0].p50.baseline = attack }, c => { c.complete = attack }]) {
    const input = reports(), comparison = compareReports(input, identity); mutate(comparison)
    assert.throws(() => renderSnapshotComment(comparison, identity, input))
  }
})

test('wrong identities, duplicate shards and untrusted protocol cannot be formatted', () => {
  const input = reports(), comparison = compareReports(input, identity)
  assert.throws(() => renderSnapshotComment(comparison, { ...identity, runId: 1 }, input))
  assert.throws(() => renderSnapshotComment(comparison, identity, [input[0], input[0]]))
  assert.throws(() => renderSnapshotComment(comparison, identity, [...input, input[0]]))
  input[1].protocolSha256 = other
  assert.throws(() => renderSnapshotComment(comparison, identity, input))
})

test('worst-case bounded numbers and one diagnosis per phase keep comments below reporter size cap', () => {
  const input = reports()
  for (const item of input) for (const run of item.runs) for (const phase of run.phases) {
    phase.targetId = phase.name === 'native-view-drag-warm' ? 54 : 1e9; phase.point = [1440, 1000]; phase.rawFrames = 1199; phase.durationMs = 90000
    for (const stratum of strata) {
      for (const metric of Object.values(phase.timings[stratum])) for (const value of Object.values(metric))
        for (const key of ['mean', 'p50', 'p95', 'max']) value[key] = 1e9
      for (const value of Object.values(phase.work[stratum])) for (const key of ['mean', 'p50', 'p95', 'max']) value[key] = 1e9
    }
  }
  assert.ok(Buffer.byteLength(render(input)) < 60000)
  for (const item of input) for (const phase of item.runs[5].phases) phase.point[0]--
  const diagnostics = diagnose(input), body = render(input)
  assert.ok(diagnostics.every(item => item.diagnosis.length < 1000))
  assert.equal(body.match(/workload-mismatch/g).length, Object.values(shards).flat().length)
  assert.ok(Buffer.byteLength(body) < 16000)
  assert.doesNotMatch(body, /Session p50/)
})

test('warmup input differences give bounded reasons without suppressing qualified stable phases', () => {
  for (const field of ['geometrySha256', 'inputPoseSha256']) {
    const input = reports(), block = input[0].runs[1].phases[2].warmup.blocks[0]
    block[field] = 'e'.repeat(64)
    const body = render(input)
    assert.match(section(body, 'native-view-drag-warm'), /workload-mismatch: Warmup input 1/)
    assert.doesNotMatch(section(body, 'native-view-drag-warm'), /Session p50/)
    assert.match(section(body, 'ordinary-hover'), /possible-improvement/)
  }
})
