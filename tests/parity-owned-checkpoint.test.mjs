import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { projectOrdinaryCheckpoint, selectOrdinaryCheckpoint } from '../scripts/parity-owned-checkpoint.mjs'
import { buildReport, discoverReceipts, renderHTML } from '../scripts/parity-measure.mjs'
const sha = value => createHash('sha256').update(value).digest('hex')
const scenario = 'scripts/local-render/early-missions.mjs'
function fixture() {
  const source = { root: '/tested', commit: 'b'.repeat(40), tree: 'a'.repeat(40), status: '', trackedDiffSha256: sha(''), untracked: [] }
  source.fingerprint = sha(JSON.stringify(source))
  const sourceFiles = Object.fromEntries([scenario, 'scripts/checkpoint-readback.mjs', 'scripts/browser-game.mjs', 'scripts/local-render/harness.mjs', 'scripts/local-render/vite.config.mjs', 'scripts/local-render/owned-profile.mjs', 'scripts/local-render/checkpoint-observer.mjs'].map(path => [path, sha(path)]))
  const saved = { level: 2, turn: 217, stats: { built: 0 }, blue: [{ id: 1, kind: 'brave' }] }
  const journey = { scenarioSha256: sourceFiles[scenario], method: 'Public UI; No clock/tick stepping or world/entity/outcome/storage fixtures', missions: [{ level: 2, errorsBefore: 0, errorsAfter: 0, checks: [{ name: 'Checkpoint survives a fresh page reload', status: 'passed', evidence: { saved, loaded: { level: 2, turn: 217, stats: { built: 0 }, blue: [[1, 'brave']] }, restored: { ...saved, status: 'playing', turn: 236, contextLost: false }, resumed: { ...saved, turn: 251 } } }] }] }
  const inner = { status: 'passed', source, sourceAfter: structuredClone(source), browserVersion: '154.0.8037.92', launch: { executablePath: '/tested/work/browser', chromiumSandbox: true, headless: true, args: ['--remote-debugging-pipe'] }, errors: [], result: journey }
  const outerSource = { headOid: source.commit, trackedDiffSha256: sha(''), inputs: { ...sourceFiles, 'work/browser': sha('binary') } }
  const outer = { kind: 'pnd-command-receipt', phase: 'finished', status: 'passed', exitCode: 0, cwd: '/tested', source: outerSource, sourceAfter: structuredClone(outerSource), command: ['node', 'scripts/local-render/harness.mjs', '--game-root', '/tested', '--browser', '/tested/work/browser', '--port', '4482', '--output', '/tested/work/orchestration/run', '--timeout', '480000', '--scenario', '/tested/'+scenario], startedAt: '2026-10-07T20:27:19.089Z', finishedAt: '2026-10-07T20:29:54.135Z', stderr: '', stderrSha256: sha('') }
  const data = { outer, inner, journey, sourceFiles, currentTree: source.tree, currentClean: true, path: 'work/orchestration/run.outer.json' }
  sync(data); return data
}
function sync(d) { d.outer.stdout = JSON.stringify({ status: d.inner.status, source: d.inner.source, result: d.inner.result })+'\n'; d.outer.stdoutSha256 = sha(d.outer.stdout) }

test('ordinary observed pass is current only on matching clean source, historical otherwise', () => {
  const data = fixture(), result = projectOrdinaryCheckpoint(data)
  assert.equal(result.status, 'verified'); assert.equal(result.diagnosticStatus, 'passed')
  assert.deepEqual(result.observed, { savedTurn: 217, loadedTurn: 217, resumedTurn: 251 })
  for (const change of [{ currentTree: 'new' }, { currentClean: false }]) {
    const old = projectOrdinaryCheckpoint({ ...data, ...change })
    assert.equal(old.status, 'stale'); assert.equal(old.diagnosticStatus, 'passed')
    assert.equal(old.testedSource.commit, data.inner.source.commit); assert.equal(old.finishedAt, data.outer.finishedAt)
  }
})

test('malformed, interrupted, source-drift, sidecar and seeded substitutions fail closed', () => {
  const changes = [
    d => { d.outer.phase = 'prepared' }, d => { d.outer.finishedAt = 'bad' },
    d => { d.outer.sourceAfter.headOid = 'changed' }, d => { d.inner.sourceAfter.tree = 'changed' },
    d => { d.inner.source.fingerprint = 'wrong'; sync(d) }, d => { d.outer.stdout += 'changed' },
    d => { d.journey = { ...d.journey, method: 'substituted sidecar' } },
    d => { d.outer.command[d.outer.command.length-1] = '/tested/scripts/check-browser-checkpoint.mjs' },
    d => { d.journey.method = 'seeded outcome'; sync(d) }, d => { d.journey.scenarioSha256 = 'seeded'; sync(d) },
    d => { delete d.outer.source.inputs[scenario]; d.outer.sourceAfter = structuredClone(d.outer.source) },
    d => { d.inner.launch.chromiumSandbox = false }, d => { d.journey.missions[0].checks = []; sync(d) },
    d => { d.journey.missions[0].checks[0].evidence.loaded.turn = 999; sync(d) },
    d => { d.journey.missions[0].errorsAfter = 1; sync(d) },
  ]
  for (const mutate of changes) { const data = fixture(); mutate(data); assert.equal(projectOrdinaryCheckpoint(data).status, 'unknown', mutate.toString()) }
})

test('failed and incomplete newer attempts cannot hide behind an old pass', () => {
  const data = fixture(); data.outer.status = 'failed'; data.outer.exitCode = 1; data.inner.status = 'failed'; data.journey.missions[0].checks[0].status = 'failed'
  data.inner.failure = 'Error: checkpoint observation failed'; delete data.inner.result
  data.outer.stdout = ''; data.outer.stdoutSha256 = sha('')
  data.outer.stderr = 'Error: ' + data.inner.failure + '\n'; data.outer.stderrSha256 = sha(data.outer.stderr)
  const failure = projectOrdinaryCheckpoint(data), pass = projectOrdinaryCheckpoint(fixture())
  assert.equal(failure.status, 'failed'); assert.equal(failure.diagnosticStatus, 'failed')
  const stale = projectOrdinaryCheckpoint({ ...data, currentTree: 'new' }); assert.equal(stale.status, 'stale'); assert.equal(stale.diagnosticStatus, 'failed')
  assert.equal(selectOrdinaryCheckpoint([pass, failure]).status, 'failed')
  const oldPass = { ...projectOrdinaryCheckpoint({ ...fixture(), currentTree: 'new' }), receipt: 'a-pass.json' }
  assert.equal(selectOrdinaryCheckpoint([oldPass, { ...stale, receipt: 'z-failure.json' }]).diagnosticStatus, 'failed')
  data.outer.sourceAfter.headOid = 'drift'
  assert.equal(projectOrdinaryCheckpoint(data).status, 'unknown')
  const interrupted = { ...pass, status: 'unknown', finishedAt: '2026-10-07T21:00:00Z' }
  assert.equal(selectOrdinaryCheckpoint([pass, interrupted]).status, 'unknown')
  assert.equal(selectOrdinaryCheckpoint([pass, { ...interrupted, finishedAt: undefined }]).status, 'unknown')
})

test('ordinary observation cannot double-count checkpoint or earn original/save parity', () => {
  const observed = projectOrdinaryCheckpoint(fixture())
  const model = { inventory: [{ id: 'persistence.load', title: 'Complete original save load', group: 'persistence' }], checks: [{ id: observed.id, kind: 'browser', knownLimits: ['Modern checkpoint only'] }], definitions: { capabilities: [{ id: 'mission-two.checkpoint-ordinary', title: 'Ordinary M2', scope: 'observation', parityId: 'persistence.load', browserCheckIds: [observed.id], originalCheckIds: [] }] } }
  const report = buildReport(model, [], [], { head: 'current' }, [observed])
  assert.equal(report.knownScope.percent, 0); assert.equal(report.missionCases.total, 0); assert.equal(report.browserIntegration.total, 0)
  assert.equal(report.missionCases.observations, 1); assert.equal(report.missionCases.capabilities[0].browserStatus, 'verified'); assert.equal(report.missionCases.capabilities[0].originalStatus, 'unknown')
  assert.ok(renderHTML(report).includes('evidence only; no extra credit')); assert.ok(renderHTML(report).includes(observed.testedSource.commit))
})


test('a newer syntax/source check is not discovered as an ordinary gameplay attempt', t => {
  const root = mkdtempSync(join(tmpdir(), 'ordinary-checkpoint-discovery-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const directory = join(root, 'work/orchestration'); mkdirSync(directory, { recursive: true })
  const real = fixture().outer
  const syntax = { ...structuredClone(real), command: ['node', '--check', scenario], finishedAt: '2026-10-07T22:00:00Z' }
  writeFileSync(join(directory, 'real.json'), JSON.stringify(real))
  writeFileSync(join(directory, 'syntax.json'), JSON.stringify(syntax))
  const discovery = discoverReceipts(root)
  assert.deepEqual(discovery.warnings, [])
  assert.deepEqual(discovery.receipts.filter(r => r.commandReceipt).map(r => r.path), ['work/orchestration/real.json'])
  const selected = selectOrdinaryCheckpoint(discovery.receipts.filter(r => r.commandReceipt).map(r =>
    projectOrdinaryCheckpoint({ ...fixture(), outer: r.commandReceipt, path: r.path })))
  assert.equal(selected.status, 'verified')
  real.phase = 'prepared'; delete real.finishedAt
  writeFileSync(join(directory, 'real.json'), JSON.stringify(real))
  assert.equal(discoverReceipts(root).receipts.filter(r => r.commandReceipt).length, 1)
})
