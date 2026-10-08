import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { BLAST_BINDINGS, BLAST_CONTROL_STAGES, isOrdinaryBlastCandidate, projectOrdinaryBlast, selectOrdinaryBlast } from '../scripts/parity-owned-blast.mjs'
import { buildReport, discoverReceipts, renderHTML } from '../scripts/parity-measure.mjs'
const sha = value => createHash('sha256').update(value).digest('hex')

function fixture(binding = BLAST_BINDINGS[0]) {
  const source = { root: '/tested', commit: 'b'.repeat(40), tree: 'a'.repeat(40), status: '', trackedDiffSha256: sha(''), untracked: [] }
  source.fingerprint = sha(JSON.stringify(source))
  const sourceFiles = Object.fromEntries(binding.files.map(path => [path, sha(path)]))
  const profile = { id: 'profile', path: '/tested/work/local-render-profiles/blast', runId: 'run', mode: 'created', origin: 'http://127.0.0.1:4189', previousRun: null, checkpointAtStart: null, cleanupVerified: true, continuationVerified: true }
  const saved = { level: 2, paused: true, turn: 397, castCount: 2, projectiles: [{ id: 1266, phase: 'windup', spell: 'blast' }] }
  const committed = { runId: 'run', sourceFingerprint: source.fingerprint, checkpoint: { level: 2, turn: 397 } }
  profile.checkpoints = [committed]
  const report = { expectation: 'candidate', complete: true, errors: [], windupMotion: true, flightMotion: true,
    sourceFingerprint: source.fingerprint, runId: 'run', targetId: 278,
    entry: { level: 2, turn: 340, target: { team: 'blue', kind: 'brave' }, actor: { team: 'blue', kind: 'shaman' }, shot: { id: 1252, tracking: { personId: 278 } } },
    release: { turn: 340, trusted: true, canvasOwned: true, handlerPersonId: 278 },
    movement: { turn: 343, trusted: true, canvasOwned: true, shotBefore: { id: 1252, phase: 'windup', remaining: 3 } },
    arrival: { turn: 349, shot: { id: 1252, phase: 'arrived' } }, impact: { turn: 350 }, retired: 350,
    rows: Array.from({ length: 10 }, (_, i) => ({ stage: 'turn', before: { turn: 340 + i, target: { id: 278, movementOrderSame: true } }, after: { turn: 341 + i, target: { id: 278, movementOrderSame: true } } })),
  }
  const sidecar = { source, runId: 'run', status: 'passed', method: binding.sidecar === 'episode.json' ? 'No injected game state or clock stepping' : 'No world, stock, storage or clock injection', ...(binding.sidecar === 'episode.json'
    ? { expectation: 'candidate', diagnostic: false, report }
    : { checks: BLAST_CONTROL_STAGES.map((name, i) => ({ name, status: 'passed', ...(i === 3 ? { resumed: { level: 2, paused: false, turn: 421, castCount: 2 } } : {}) })),
      proofs: Array.from({ length: 8 }, () => ({ errors: [], pointer: { errors: [] }, cleanupVerified: true })),
      saved, loaded: structuredClone(saved), committed, loadObservationError: null }) }
  const runtime = { browserPath: '/tested/work/browser', browserSha256: sha('browser') }
  const scenario = { path: '/tested/' + binding.scenario, sha256: sourceFiles[binding.scenario] }
  const inner = { status: 'passed', source, sourceAfter: structuredClone(source), runtime, runtimeAfter: structuredClone(runtime), scenario, scenarioAfter: structuredClone(scenario),
    profile, browserVersion: '154.0.8037.92', errors: [],
    launch: { executablePath: runtime.browserPath, headless: true, chromiumSandbox: true, ignoreDefaultArgs: true, args: ['--remote-debugging-pipe', `--user-data-dir=${profile.path}/browser`, 'about:blank'] },
    result: { stage: binding.stage, evidence: `/tested/work/orchestration/run/${binding.sidecar}`,
      ...(binding.sidecar === 'episode.json' ? { expectation: 'candidate', complete: true } : { status: 'passed' }) } }
  const outerSource = { headOid: source.commit, trackedDiffSha256: sha(''), inputs: { ...sourceFiles, [runtime.browserPath]: runtime.browserSha256 } }
  const outer = { kind: 'pnd-command-receipt', cwd: '/tested', phase: 'finished', status: 'passed', exitCode: 0,
    source: outerSource, sourceAfter: structuredClone(outerSource),
    startedAt: '2026-10-08T08:45:00Z', finishedAt: '2026-10-08T08:46:36.687Z', stderr: '', stderrSha256: sha(''),
    command: ['timeout', '--signal=TERM', '--kill-after=10s', '330s', 'taskset', '-c', '0-2', 'env', 'CLOUDFLARE_CF_FETCH_ENABLED=false',
      ...(binding.sidecar === 'episode.json' ? ['POPULOUS_BLAST_EXPECTATION=candidate', 'POPULOUS_BLAST_PICK_DIAGNOSTIC=0'] : []),
      'node', 'scripts/local-render/harness.mjs', '--game-root', '/tested', '--browser', runtime.browserPath, '--port', '4189', '--output', '/tested/work/orchestration/run', '--profile', profile.path, '--scenario', scenario.path] }
  const d = { binding, outer, inner, sidecar, sourceFiles, currentTree: source.tree, currentClean: true, path: `work/orchestration/${binding.id}.json` }
  sync(d); return d
}
function sync(d) { d.outer.stdout = JSON.stringify({ status: d.inner.status, source: d.inner.source, result: d.inner.result }) + '\n'; d.outer.stdoutSha256 = sha(d.outer.stdout) }
function failure(d) {
  d.outer.status = d.inner.status = d.sidecar.status = 'failed'; d.outer.exitCode = 1
  d.inner.failure = 'Error: scenario failed'; delete d.inner.result
  d.outer.stdout = ''; d.outer.stdoutSha256 = sha(''); d.outer.stderr = d.inner.failure; d.outer.stderrSha256 = sha(d.outer.stderr)
  return d
}

test('person and controls report bounded observations and require the full clean tested tree', () => {
  for (const binding of BLAST_BINDINGS) {
    const d = fixture(binding), result = projectOrdinaryBlast(d)
    assert.equal(result.status, 'verified'); assert.equal(result.diagnosticStatus, 'passed')
    assert.equal(result.testedSource.commit, d.inner.source.commit)
    for (const change of [{ currentTree: 'different-tooling-tree' }, { currentClean: false }]) {
      const historical = projectOrdinaryBlast({ ...d, ...change })
      assert.equal(historical.status, 'stale'); assert.equal(historical.diagnosticStatus, 'passed')
      assert.deepEqual(historical.observed, result.observed)
    }
  }
  assert.deepEqual(projectOrdinaryBlast(fixture()).observed, { releaseTurn: 340, movementTurn: 343, arrivalTurn: 349, impactTurn: 350, target: 'friendly Blue Brave' })
  assert.deepEqual(projectOrdinaryBlast(fixture(BLAST_BINDINGS[1])).observed, { stagesPassed: 6, savedTurn: 397, loadedTurn: 397, resumedTurn: 421, activeShotId: 1266, equality: 'bounded saved/loaded projection only' })
})

test('raw stream, source, runtime, launch and result substitutions fail closed for both bindings', () => {
  const changes = [
    d => { d.outer.phase = 'prepared' }, d => { d.outer.finishedAt = 'bad' },
    d => { d.outer.sourceAfter.headOid = 'drift' }, d => { d.inner.sourceAfter.tree = 'drift' },
    d => { d.inner.source.fingerprint = 'wrong'; sync(d) }, d => { d.outer.stdout += 'changed' },
    d => { d.outer.stderr += 'changed' }, d => { d.outer.stdout = '{}'; d.outer.stdoutSha256 = sha('{}') },
    d => { d.inner.result.evidence = '/tested/work/orchestration/other/result.json'; sync(d) },
    d => { d.inner.result.stage = 'other'; sync(d) }, d => { d.sidecar.runId = 'other' },
    d => { d.sidecar.source = { ...d.sidecar.source, root: '/other' } },
    d => { d.inner.scenarioAfter.sha256 = 'drift' }, d => { d.inner.runtimeAfter.browserSha256 = 'drift' },
    d => { d.inner.launch.chromiumSandbox = false }, d => { d.inner.profile.mode = 'resumed' },
    d => { d.sidecar.status = 'failed' }, d => { d.sidecar.method = 'seeded' }, d => { d.inner.errors = ['error'] },
    d => { delete d.outer.source.inputs[d.binding.scenario]; d.outer.sourceAfter = structuredClone(d.outer.source) },
    d => { d.outer.command.push('--scenario', '/tested/unrelated.mjs') },
    d => { d.outer.command.unshift('unrecognized-wrapper') },
  ]
  for (const binding of BLAST_BINDINGS) for (const change of changes) {
    const d = fixture(binding); change(d)
    const result = projectOrdinaryBlast(d)
    assert.equal(result.status, 'unknown', change.toString()); assert.equal(result.observed, undefined)
  }
})

test('person candidate expectation and real lifecycle continuity are required', () => {
  const changes = [
    d => { d.outer.command[d.outer.command.indexOf('POPULOUS_BLAST_EXPECTATION=candidate')] = 'POPULOUS_BLAST_EXPECTATION=baseline' },
    d => { d.sidecar.expectation = 'baseline' }, d => { d.sidecar.diagnostic = true },
    d => { d.inner.result.expectation = 'baseline'; sync(d) },
    d => { d.sidecar.report.complete = false }, d => { d.sidecar.report.flightMotion = false },
    d => { d.sidecar.report.entry.target.team = 'red' }, d => { d.sidecar.report.movement.turn = 348 },
    d => { d.sidecar.report.release.trusted = false }, d => { d.sidecar.report.arrival.turn-- },
    d => { d.sidecar.report.rows.pop() }, d => { d.sidecar.report.rows[1].after.target.movementOrderSame = false },
  ]
  for (const change of changes) { const d = fixture(); change(d); assert.equal(projectOrdinaryBlast(d).status, 'unknown', change.toString()) }
})

test('controls require six real stages, clean proofs and identical bounded loaded projection', () => {
  const changes = [
    d => { d.sidecar.checks.pop() }, d => { d.sidecar.checks[0] = d.sidecar.checks[1] },
    d => { d.sidecar.checks[0].status = 'failed' }, d => { d.sidecar.proofs[0].errors.push('error') },
    d => { d.sidecar.saved.projectiles = [] }, d => { d.sidecar.loaded.turn++ },
    d => { d.sidecar.loadObservationError = 'interrupted' }, d => { d.sidecar.committed.checkpoint.turn++ },
    d => { d.sidecar.checks[3].resumed.turn = d.sidecar.saved.turn },
  ]
  for (const change of changes) { const d = fixture(BLAST_BINDINGS[1]); change(d); assert.equal(projectOrdinaryBlast(d).status, 'unknown', change.toString()) }
})

test('latest failed, interrupted or unsupported attempts suppress older passes; ties prefer failure', () => {
  for (const binding of BLAST_BINDINGS) {
    const pass = projectOrdinaryBlast(fixture(binding)), failed = projectOrdinaryBlast(failure(fixture(binding)))
    assert.equal(failed.status, 'failed')
    assert.equal(selectOrdinaryBlast([pass, failed], binding).status, 'failed')
    const staleFailure = projectOrdinaryBlast({ ...failure(fixture(binding)), currentTree: 'new' })
    assert.equal(selectOrdinaryBlast([{ ...pass, status: 'stale' }, staleFailure], binding).diagnosticStatus, 'failed')
    const d = fixture(binding); d.outer.finishedAt = '2026-10-08T10:00:00Z'; d.sourceFiles[binding.scenario] = 'unsupported'
    const unknown = projectOrdinaryBlast(d)
    assert.equal(unknown.status, 'unknown'); assert.equal(selectOrdinaryBlast([pass, unknown], binding).status, 'unknown')
    assert.equal(selectOrdinaryBlast([pass, { ...unknown, finishedAt: undefined }], binding).status, 'unknown')
    const retry = { ...pass, finishedAt: '2026-10-08T11:00:00Z' }
    assert.equal(selectOrdinaryBlast([pass, unknown, retry], binding).status, 'verified')
  }
})

test('discovery selects the actual scenario/variant, excludes baseline and helper-only receipts, retains malformed attempts', t => {
  const root = mkdtempSync(join(tmpdir(), 'blast-parity-discovery-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const directory = join(root, 'work/orchestration'); mkdirSync(directory, { recursive: true })
  const person = fixture().outer, controls = fixture(BLAST_BINDINGS[1]).outer
  const baseline = structuredClone(person); baseline.command[baseline.command.indexOf('POPULOUS_BLAST_EXPECTATION=candidate')] = 'POPULOUS_BLAST_EXPECTATION=baseline'
  const helper = structuredClone(person); helper.command[helper.command.length - 1] = '/tested/qa/unrelated.mjs'
  const malformed = structuredClone(person); malformed.command.push('--scenario'); malformed.phase = 'prepared'; delete malformed.finishedAt
  const missingValue = structuredClone(person); missingValue.command.pop()
  assert.equal(isOrdinaryBlastCandidate(missingValue, BLAST_BINDINGS[0]), true)
  assert.equal(projectOrdinaryBlast({ ...fixture(), outer: missingValue }).status, 'unknown')
  helper.command.push('--scenario')
  assert.equal(isOrdinaryBlastCandidate(helper, BLAST_BINDINGS[0]), false)
  const unknownChecker = structuredClone(person); unknownChecker.source.inputs[BLAST_BINDINGS[0].scenario] = 'new-checker'
  for (const [name, outer] of Object.entries({ person, controls, baseline, helper, malformed, unknownChecker })) writeFileSync(join(directory, name + '.json'), JSON.stringify(outer))
  const { receipts, warnings } = discoverReceipts(root)
  assert.deepEqual(warnings, [])
  assert.deepEqual(receipts.map(r => r.path), ['controls', 'malformed', 'person', 'unknownChecker'].map(n => `work/orchestration/${n}.json`))
  assert.equal(isOrdinaryBlastCandidate(controls, BLAST_BINDINGS[0]), false)
  assert.equal(isOrdinaryBlastCandidate(person, BLAST_BINDINGS[1]), false)
  assert.equal(projectOrdinaryBlast({ ...fixture(), outer: malformed }).status, 'unknown')
})

test('Blast observations add no requirement, browser-case or paired parity credit', () => {
  const observations = BLAST_BINDINGS.map(binding => projectOrdinaryBlast(fixture(binding)))
  const model = { inventory: [{ id: 'spells.blast', title: 'Complete Blast', group: 'spells' }],
    checks: observations.map(({ id }) => ({ id, kind: 'browser', knownLimits: ['No original execution; bounded projection only'] })),
    definitions: { capabilities: observations.map(({ id }) => ({ id, title: id, scope: 'observation', parityId: 'spells.blast', browserCheckIds: [id], originalCheckIds: [] })) } }
  const report = buildReport(model, [], [], { head: 'current' }, observations)
  assert.equal(report.knownScope.total, 1); assert.equal(report.knownScope.percent, 0)
  assert.equal(report.browserIntegration.total, 0); assert.equal(report.missionCases.total, 0); assert.equal(report.missionCases.observations, 2)
  assert.ok(report.missionCases.capabilities.every(c => c.browserStatus === 'verified' && c.originalStatus === 'unknown' && c.status === 'unknown'))
  assert.match(renderHTML(report), /bounded saved\/loaded projection only/)
  const escaped = structuredClone(report); escaped.checks[0].observed.target = '<script>unsafe</script>'
  assert.ok(!renderHTML(escaped).includes('<script>unsafe'))
})


test('parity declarations fingerprint their executed tests and both owned adapters exactly once', () => {
  const { checks } = JSON.parse(readFileSync(new URL('../engineering/checks.json', import.meta.url), 'utf8'))
  for (const id of ['parity-measure-tests', ...BLAST_BINDINGS.map(binding => binding.id)]) {
    const check = checks.find(check => check.id === id)
    assert.ok(check, `Missing declaration: ${id}`)
    assert.equal(new Set(check.inputs).size, check.inputs.length, `Duplicate inputs: ${id}`)
    const executedFiles = check.args.filter(arg => arg.endsWith('.mjs'))
    for (const path of [...executedFiles, 'scripts/parity-measure.mjs', 'scripts/parity-owned-checkpoint.mjs', 'scripts/parity-owned-blast.mjs'])
      assert.ok(check.inputs.includes(path), `${id} does not fingerprint ${path}`)
  }
})
