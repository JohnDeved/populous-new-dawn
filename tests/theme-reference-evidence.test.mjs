import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, cpSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { evaluateThemeReferenceRecord as project } from '../scripts/orchestration/theme-reference-evidence.mjs'
const sha = x => createHash('sha256').update(x).digest('hex')
const fixtureRoot = mkdtempSync(join(tmpdir(), 'pnd-theme-reference-'))
after(() => rmSync(fixtureRoot, { recursive: true, force: true }))
const paths = { observer: 'scripts/local-render/checkpoint-observer.mjs', scenario: 'scripts/local-render/world-theme-switch.mjs', witness: 'scripts/local-render/world-theme-witness.mjs', harness: 'scripts/local-render/harness.mjs' }
const sources = []
for (const [id, path] of Object.entries(paths)) {
  mkdirSync(dirname(join(fixtureRoot, path)), { recursive: true })
  cpSync(new URL(`./fixtures/theme-reference-producers/${id}.mjs`, import.meta.url), join(fixtureRoot, path))
  sources.push({ id, path, sha256: sha(readFileSync(join(fixtureRoot, path))) })
}
writeFileSync(join(fixtureRoot, '.gitignore'), 'work/\n')
const git = args => execFileSync('git', args, { cwd: fixtureRoot, encoding: 'utf8' }).trim()
git(['init', '-q'])
git(['add', '.'])
git(['-c', 'user.name=Johann Berger', '-c', 'user.email=johann@objekt.stream', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'Synthetic reviewed-producer fixture'])
const sourceCommit = git(['rev-parse', 'HEAD']), gitObjects = join(fixtureRoot, '.git/objects')
const now = Date.parse('2026-10-10T23:24:00Z'), time = '2026-10-10T18:43:34.928Z'
const source = { root: fixtureRoot, commit: sourceCommit, tree: git(['rev-parse', 'HEAD^{tree}']), status: '', trackedDiffSha256: sha(''), untracked: [] }
source.fingerprint = sha(JSON.stringify(source))
const digest = { version: 1, level: 3, turn: 216, time: 18, checkpointSha256: sha('synthetic checkpoint'), actorsSha256: sha('synthetic actors'), terrainSha256: sha('synthetic terrain'), stockSha256: sha('synthetic stock') }
const action = (kind, label, before) => ({ evidence: { kind, label, captured: true, closed: false, errors: [], cleanup: true, boundary: { trusted: true, replaced: kind === 'load', before, after: { level: 3, turn: 216, paused: true } } }, digest: structuredClone(digest) })
// Keep the real producer's action indices, but never present this fixture as a real run.
const actions = [{ evidence: { kind: 'start' } }, { evidence: { kind: 'start' } }, action('save', 'Save checkpoint', { level: 3, turn: 216 }), { evidence: { kind: 'start' } }, { evidence: { kind: 'start' } }, action('load', 'Load checkpoint', { level: 2, turn: 261 })]
const hashOf = id => sources.find(s => s.id === id).sha256
const runtime = { harness: { 'harness.mjs': hashOf('harness'), 'checkpoint-observer.mjs': hashOf('observer') } }
const scenario = { path: fixtureRoot + '/' + paths.scenario, sha256: hashOf('scenario') }
const inner = { source, sourceAfter: structuredClone(source), status: 'passed', finishedAt: time, errors: [], runtime, runtimeAfter: structuredClone(runtime), scenario, scenarioAfter: structuredClone(scenario), launch: { headless: true, chromiumSandbox: true }, softwarePerformanceOnly: true, browserVersion: 'synthetic-browser', result: { source: structuredClone(source), status: 'captured-reference', admission: { mode: 'reference', applicationEqual: true }, responseErrors: [], limits: 'Synthetic fixture only; no native or pixel claim.', actions, saved: { checkpoint: structuredClone(digest) } } }
const outerSource = { headOid: sourceCommit, trackedDiffSha256: sha(''), inputs: Object.fromEntries(sources.map(s => [s.path, s.sha256])) }
const stdout = JSON.stringify({ status: inner.status, source: inner.source, result: inner.result }) + '\n'
const outer = { version: 1, kind: 'pnd-command-receipt', phase: 'finished', status: 'passed', finishedAt: time, cwd: fixtureRoot, source: outerSource, sourceAfter: structuredClone(outerSource), stdout, stderr: '', stdoutSha256: sha(stdout), stderrSha256: sha(''), exitCode: 0, signal: null }
for (const [id, value] of [['outer', outer], ['inner', inner]]) {
  const path = `work/${id}.json`
  mkdirSync(join(fixtureRoot, 'work'), { recursive: true })
  writeFileSync(join(fixtureRoot, path), JSON.stringify(value))
  sources.push({ id, path, sha256: sha(readFileSync(join(fixtureRoot, path))) })
}
const req = { mappingVersion: 'theme-reference-record-v1', sourceCommit, sourceFingerprint: source.fingerprint, sources }
function experiment(fn) {
  const root = mkdtempSync(join(tmpdir(), 'record-adapter-'))
  try {
    execFileSync('git', ['init', '-q', root])
    writeFileSync(join(root, '.git/objects/info/alternates'), gitObjects + '\n')
    for (const s of req.sources) {
      mkdirSync(dirname(join(root, s.path)), { recursive: true })
      cpSync(join(fixtureRoot, s.path), join(root, s.path))
    }

    return fn(root, structuredClone(req))
  }
  finally {
    rmSync(root, { recursive: true, force: true })
  }
}
function alter(root, r, change) {
  const load = id => JSON.parse(readFileSync(join(root, r.sources.find(s => s.id === id).path)))
  const inner = load('inner'), outer = load('outer')
  change(inner, outer)
  // Rebind surrounding JSON/hash integrity so semantic assertions, not only hashes, are exercised.
  const printed = JSON.parse(outer.stdout.trim().split('\n').at(-1))
  printed.result = inner.result
  printed.source = inner.source
  printed.status = inner.status
  outer.stdout = JSON.stringify(printed) + '\n'
  outer.stdoutSha256 = sha(outer.stdout)
  for (const [id, value] of [['inner', inner], ['outer', outer]]) {
    const s = r.sources.find(s => s.id === id)
    const bytes = JSON.stringify(value)
    writeFileSync(join(root, s.path), bytes)
    s.sha256 = sha(bytes)
  }
}
test('synthetic reference yields exactly two bounded dimensions, seven source pointers, six explicit absent obligations', () => {
  const x = project(fixtureRoot, req, now)
  assert.equal(x.evaluation.status, 'passed')
  assert.equal(x.evaluation.checks.length, 2)
  assert.equal(x.facts.length, 7)
  assert.equal(x.absentObligations.length, 6)
  for (const fact of x.facts) {
    const s = req.sources.find(s => s.id === fact.provenance.sourceId)
    let v = JSON.parse(readFileSync(join(fixtureRoot, s.path)))
    for (const k of fact.provenance.keys)
      v = v[k]
    assert.deepEqual(fact.value, v)
  }
  assert.equal(x.facts[0].value, 'captured-reference')
  assert(!Object.hasOwn(x, 'packet'))
  assert.equal(x.derivedAt, now)
  assert.notEqual(x.recordedAt, new Date(now).toISOString())
})
for (const key of ['authority', 'dimensions', 'claims', 'requiredClaims'])
  test(`manual ${key} override rejected`, () => assert.throws(() => project(fixtureRoot, { ...req, [key]: ['native-policy'] }, now), /manual metadata/))
test('unknown mapping version rejected', () => assert.throws(() => project(fixtureRoot, { ...req, mappingVersion: 'v999' }, now), /unknown mapping/))
test('missing producer dependency rejected', () => assert.throws(() => project(fixtureRoot, { ...req, sources: req.sources.filter(s => s.id !== 'witness') }, now), /source dependency/))
test('unmatched caller source refused', () => assert.throws(() => project(fixtureRoot, { ...req, sourceFingerprint: '0'.repeat(64) }, now), /unmatched source/))
test('raw byte tamper refused', () => experiment((root, r) => { writeFileSync(join(root, r.sources[1].path), '{}'); assert.throws(() => project(root, r, now), /stale source hash/); }))
test('producer changed and rehashed still unknown version', () => experiment((root, r) => { const s = r.sources.find(s => s.id === 'scenario'); writeFileSync(join(root, s.path), '// changed'); s.sha256 = sha('// changed'); assert.throws(() => project(root, r, now), /unknown producer/); }))
for (const [name, change] of [
  ['observer runtime identity changed', i => { i.runtime.harness['checkpoint-observer.mjs'] = '0'.repeat(64); i.runtimeAfter = structuredClone(i.runtime); }],
  ['observer input identity changed', (i, o) => { o.source.inputs['scripts/local-render/checkpoint-observer.mjs'] = '0'.repeat(64); o.sourceAfter = structuredClone(o.source); }],
  ['runtimeAfter harness drift', i => i.runtimeAfter.harness['harness.mjs'] = '0'.repeat(64)],
  ['scenarioAfter drift', i => i.scenarioAfter.sha256 = '0'.repeat(64)],
  ['missing runtimeAfter', i => delete i.runtimeAfter],
  ['missing scenarioAfter', i => delete i.scenarioAfter],
  ['load does not replace', i => i.result.actions[5].evidence.boundary.replaced = false],
  ['save replaces', i => i.result.actions[2].evidence.boundary.replaced = true],
  ['load boundary wrong level', i => i.result.actions[5].evidence.boundary.after.level = 2],
  ['load boundary wrong turn', i => i.result.actions[5].evidence.boundary.after.turn = 217],
  ['save not paused', i => i.result.actions[2].evidence.boundary.after.paused = false],
  ['load not paused', i => i.result.actions[5].evidence.boundary.after.paused = false],
  ['save before wrong turn', i => i.result.actions[2].evidence.boundary.before.turn = 215],
  ['load before wrong mission', i => i.result.actions[5].evidence.boundary.before.level = 3],
  ['coordinated invalid time', i => { for (const d of [i.result.actions[2].digest, i.result.actions[5].digest, i.result.saved.checkpoint])
      d.time = null; }],
  ['coordinated unknown digest field', i => { for (const d of [i.result.actions[2].digest, i.result.actions[5].digest, i.result.saved.checkpoint])
      d.nativePolicy = true; }],
  ['unknown outer version', (i, o) => o.version = 2],
  ['unknown inner version', i => i.version = 2],
  ['scenario failure field despite reference status', i => i.result.failure = 'failure'],
  ['missing machine field', i => delete i.result.actions[5].digest.stockSha256],
  ['unknown digest version', i => i.result.actions[5].digest.version = 99],
  ['outer passed with scenario failed', i => i.result.status = 'failed'],
  ['outer passed with wrong candidate claim', i => i.result.status = 'passed'],
  ['browser error outcome', i => i.errors = ['page error']],
  ['response error outcome', i => i.result.responseErrors = ['404']],
  ['outer error despite exit zero', (i, o) => o.error = { code: 'EIO' }],
  ['unequal load digest', i => i.result.actions[5].digest.terrainSha256 = '1'.repeat(64)],
  ['duplicated save', i => i.result.actions.push(i.result.actions[2])],
  ['source drift', i => i.sourceAfter.tree = '0'.repeat(40)],
  ['untrusted load', i => i.result.actions[5].evidence.boundary.trusted = false],
])
  test(name, () => experiment((root, r) => { alter(root, r, change); assert.throws(() => project(root, r, now)); }))
test('missing checkpoint observer dependency rejected', () => assert.throws(() => project(fixtureRoot, { ...req, sources: req.sources.filter(s => s.id !== 'observer') }, now), /source dependency/))
test('unknown recorded commit rejected', () => assert.throws(() => project(fixtureRoot, { ...req, sourceCommit: '0'.repeat(40) }, now)))
test('no claims, results, or mutable packet are exported', () => {
  const result = project(fixtureRoot, req, now)
  for (const key of ['claims', 'results', 'packet', 'requiredClaims'])
    assert(!Object.hasOwn(result, key))
  assert.deepEqual(result.evaluation.checks.map(c => c.id).sort(), ['historical-browser-reference-record', 'recorded-m3-save-load-digest-equality'])
  assert(result.absentObligations.includes('native-policy'))
  assert(result.absentObligations.includes('matched-original-pixels'))
})
