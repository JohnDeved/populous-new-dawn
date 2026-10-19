// Read-only projection of one reviewed browser-reference producer version.
// These are facts about historical bytes, never a new execution/parity result.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { validateOwnedReceipt } from '../parity-owned-checkpoint.mjs'
import { readResearchFile, claimContractSha256, evaluateResearchClaims } from './research-evidence.mjs'
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const VERSION = 'theme-reference-record-v1'
const QUERY = 'What does this historical browser reference record actually contain?'
const pins = {
  observer: ['scripts/local-render/checkpoint-observer.mjs', '3133e50554eb1cb5b72e5f08135aedd3e6987a0d9b239c6b7c70f0e3a2f8a947'],
  scenario: ['scripts/local-render/world-theme-switch.mjs', 'edfc15dc2b353f9c9d9bf611f080b58b6a38e549fe88ee78cd8db67b1b9d7a94'],
  witness: ['scripts/local-render/world-theme-witness.mjs', 'd51e1580ac3bb3c2d43516df9b43a0663036193b75e1ddee8f4d9742ababacb2'],
  harness: ['scripts/local-render/harness.mjs', '19212b8b57d8f1ec47583ec12a3b33152832c103b91a266aa4a774bf0043a021'],
}
const IDs = ['outer', 'inner', ...Object.keys(pins)]
const dimensions = ['historical-browser-reference-record', 'recorded-m3-save-load-digest-equality']
const ABSENT = ['native-policy', 'matched-original-pixels', 'corrected-resource-selection', 'current-main-validation', 'hardware-performance', 'campaign-victory']
export function evaluateThemeReferenceRecord(repo, request, now = Date.now()) {
  // No author authority/dimensions/contract/dependency override surface.
  assert.deepEqual(Object.keys(request).sort(), ['mappingVersion', 'sourceCommit', 'sourceFingerprint', 'sources'].sort(), 'unsupported manual metadata')
  assert.equal(request.mappingVersion, VERSION, 'unknown mapping version')
  assert(Number.isSafeInteger(now), 'invalid projection clock')
  assert.deepEqual(request.sources.map(s => s.id).sort(), [...IDs].sort(), 'missing/extra source dependency')
  const files = new Map()
  for (const s of request.sources) {
    const bytes = readResearchFile(repo, s.path)
    assert.equal(sha(bytes), s.sha256, `stale source hash: ${s.id}`)
    if (pins[s.id]) {
      assert.equal(s.sha256, pins[s.id][1], `unknown producer version: ${s.id}`)
      assert(/^[a-f0-9]{40}$/.test(request.sourceCommit), 'invalid source commit')
      const original = execFileSync('git', ['show', `${request.sourceCommit}:${pins[s.id][0]}`], { cwd: repo, maxBuffer: 16 * 1024 * 1024, env: { ...process.env, GIT_NO_LAZY_FETCH: '1', GIT_TERMINAL_PROMPT: '0' } })
      assert.equal(sha(original), s.sha256, `producer absent/different at recorded commit: ${s.id}`)
    }
    files.set(s.id, bytes)
  }
  const outer = JSON.parse(files.get('outer')), inner = JSON.parse(files.get('inner'))
  assert.equal(outer.version, 1, 'unknown receipt version')
  assert.equal(outer.kind, 'pnd-command-receipt')
  assert(!Object.hasOwn(inner, 'version'), 'unknown owned receipt version; pinned producer emits no version')
  const { failed } = validateOwnedReceipt(outer, inner)
  assert(!failed && !outer.error && !outer.signal && !inner.failure, 'error outcome')
  assert.equal(inner.source.fingerprint, request.sourceFingerprint, 'unmatched source fingerprint')
  assert.equal(inner.source.commit, request.sourceCommit, 'unmatched source commit')
  assert.equal(inner.scenario.sha256, pins.scenario[1])
  assert.equal(inner.scenario.path, inner.source.root + '/' + pins.scenario[0])
  assert.equal(outer.source.inputs[pins.scenario[0]], pins.scenario[1])
  assert.equal(outer.source.inputs[pins.harness[0]], pins.harness[1])
  assert.equal(inner.runtime.harness['harness.mjs'], pins.harness[1])
  assert.equal(inner.runtime.harness['checkpoint-observer.mjs'], pins.observer[1], 'observer runtime identity mismatch')
  assert.equal(outer.source.inputs[pins.observer[0]], pins.observer[1], 'observer input identity mismatch')
  assert.deepEqual(inner.runtimeAfter, inner.runtime, 'runtime drift')
  assert.deepEqual(inner.scenarioAfter, inner.scenario, 'scenario drift')
  assert.equal(inner.launch.chromiumSandbox, true)
  assert.equal(inner.launch.headless, true)
  assert.equal(inner.softwarePerformanceOnly, true)
  assert.equal(typeof inner.browserVersion, 'string')
  assert.deepEqual(inner.errors, [])
  assert(Number.isFinite(Date.parse(inner.finishedAt)) && Date.parse(inner.finishedAt) <= now, 'invalid/future recorded time')
  const r = inner.result
  assert.deepEqual(r.source, inner.source)
  assert.equal(r.status, 'captured-reference', 'not a reference outcome')
  assert(!r.failure && !outer.sourceError && !inner.sourceError, 'recorded error outcome')
  assert.equal(r.admission.mode, 'reference')
  assert.equal(r.admission.applicationEqual, true)
  assert.deepEqual(r.responseErrors, [])
  assert.equal(typeof r.limits, 'string')
  const locate = (kind, label) => {
    const matches = r.actions.map((a, index) => ({ a, index })).filter(({ a }) => a.evidence?.kind === kind && a.evidence?.label === label)
    assert.equal(matches.length, 1, 'missing/duplicate action')
    const { a, index } = matches[0]
    assert.equal(a.evidence.captured, true)
    assert.equal(a.evidence.boundary.trusted, true)
    assert.equal(a.evidence.cleanup, true)
    assert.deepEqual(a.evidence.errors, [])
    assert.deepEqual(Object.keys(a.digest).sort(), ['version', 'level', 'turn', 'time', 'checkpointSha256', 'actorsSha256', 'terrainSha256', 'stockSha256'].sort(), 'unknown/missing digest field')
    assert.equal(a.digest.version, 1, 'unknown digest version')
    assert(Number.isFinite(a.digest.time) && a.digest.time >= 0, 'invalid digest time')
    assert.equal(a.digest.level, 3)
    assert(Number.isSafeInteger(a.digest.turn) && a.digest.turn >= 0)
    const b = a.evidence.boundary
    assert.equal(b.replaced, kind === 'load', 'wrong replacement boundary')
    assert.deepEqual(b.after, { level: a.digest.level, turn: a.digest.turn, paused: true }, 'boundary and digest mismatch')
    assert.deepEqual(Object.keys(b.before).sort(), ['level', 'turn'])
    assert(Number.isSafeInteger(b.before.turn) && b.before.turn >= 0, 'invalid before turn')
    if (kind === 'save')
      assert.deepEqual(b.before, { level: a.digest.level, turn: a.digest.turn }, 'save boundary changed')
    else
      assert.equal(b.before.level, 2, 'load must originate from Mission 2')
    for (const key of ['checkpointSha256', 'actorsSha256', 'terrainSha256', 'stockSha256'])
      assert(/^[a-f0-9]{64}$/.test(a.digest[key]), `missing digest: ${key}`)
    return { a, index }
  }
  const saved = locate('save', 'Save checkpoint'), loaded = locate('load', 'Load checkpoint')
  assert(saved.index < loaded.index)
  assert.deepEqual(saved.a.digest, loaded.a.digest, 'save/load digest mismatch')
  assert.deepEqual(saved.a.digest, r.saved.checkpoint, 'saved sidecar digest mismatch')
  const identity = { sourceFingerprint: request.sourceFingerprint, query: QUERY, adapterVersion: VERSION }
  const claims = dimensions.map((dimension, index) => ({ id: dimension, authority: 'offline-record-inspection', dimensions: [dimension], sourceIds: IDs, requiredClaims: index ? [dimensions[0]] : [], maxAgeMs: 86400000 }))
  // Time is this byte inspection, NOT a fabricated browser rerun or retroactive contract stamp.
  const results = claims.map(c => ({ claimId: c.id, authority: c.authority, dimensions: c.dimensions, identity, contractSha256: claimContractSha256(c), sourceIds: IDs, sourceSha256s: Object.fromEntries(request.sources.map(s => [s.id, s.sha256])), observedAtMs: now, status: 'passed' }))
  const ptr = keys => ({ sourceId: 'inner', format: 'json', keys })
  const facts = [
    { name: 'scenarioOutcome', value: r.status, provenance: ptr(['result', 'status']) },
    { name: 'browserVersion', value: inner.browserVersion, provenance: ptr(['browserVersion']) },
    { name: 'softwareOnly', value: inner.softwarePerformanceOnly, provenance: ptr(['softwarePerformanceOnly']) },
    { name: 'saveDigest', value: saved.a.digest, provenance: ptr(['result', 'actions', String(saved.index), 'digest']) },
    { name: 'loadDigest', value: loaded.a.digest, provenance: ptr(['result', 'actions', String(loaded.index), 'digest']) },
    { name: 'recordedAt', value: inner.finishedAt, provenance: ptr(['finishedAt']) },
    { name: 'originalLimits', value: r.limits, provenance: ptr(['result', 'limits']) },
  ]
  const packet = { version: 1, identity, sources: request.sources, requiredClaims: [dimensions[1]], claims, results }
  return { sources: request.sources.map(({ id, path, sha256 }) => ({ id, path, sha256 })), facts, absentObligations: [...ABSENT], recordedAt: inner.finishedAt, derivedAt: now, evaluation: evaluateResearchClaims(repo, packet, identity, now), limit: 'Historical record projection only. No native, semantic, pixel or current-source execution credit. Hashes establish identity, not authenticity.' }
}
