import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { BLAST_BINDINGS, BLAST_CONTROL_STAGES, BLAST_REFERENCE, isOrdinaryBlastCandidate, projectOrdinaryBlast, selectOrdinaryBlast, isBlastReferenceCandidate, projectBlastReference, selectBlastReference } from '../scripts/parity-owned-blast.mjs'
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
  for (const id of ['parity-measure-tests', BLAST_REFERENCE.id, ...BLAST_BINDINGS.map(binding => binding.id)]) {
    const check = checks.find(check => check.id === id)
    assert.ok(check, `Missing declaration: ${id}`)
    assert.equal(new Set(check.inputs).size, check.inputs.length, `Duplicate inputs: ${id}`)
    const executedFiles = check.args.filter(arg => arg.endsWith('.mjs'))
    for (const path of [...executedFiles, 'scripts/parity-measure.mjs', 'scripts/parity-owned-checkpoint.mjs', 'scripts/parity-owned-blast.mjs'])
      assert.ok(check.inputs.includes(path), `${id} does not fingerprint ${path}`)
  }
})

function referenceFixture() {
  const manifestPath = 'work/orchestration/reviewed/manifest.json'
  const sourceFiles = { ...BLAST_REFERENCE.files, 'package.json': sha('package'), 'package-lock.json': sha('lock') }
  const manifest = { head: 'b'.repeat(40), tree: 'a'.repeat(40), innerSeconds: 240,
    stages: [{ name: 'test-02', command: ['node', '--test', BLAST_REFERENCE.comparator] }],
    files: { [BLAST_REFERENCE.comparator]: sourceFiles[BLAST_REFERENCE.comparator] },
    dependency: { rootLockSha256: sourceFiles['package-lock.json'], installedLockSha256: sha('installed') } }
  const source = { headOid: manifest.head, trackedDiffSha256: sha(''), inputs: {
    [manifestPath]: BLAST_REFERENCE.manifestSha256,
    'work/orchestration/reviewed/run-stage.mjs': BLAST_REFERENCE.runnerSha256,
    ...manifest.files, 'package.json': sourceFiles['package.json'], 'package-lock.json': sourceFiles['package-lock.json'],
    'node_modules/.package-lock.json': manifest.dependency.installedLockSha256,
  } }
  const outer = { kind: 'pnd-command-receipt', phase: 'finished', status: 'passed', exitCode: 0,
    command: ['timeout', '--signal=TERM', '--kill-after=10s', '240s', ...manifest.stages[0].command],
    source, sourceAfter: structuredClone(source), finishedAt: '2026-10-08T10:33:28.651Z',
    stdout: `✔ ${BLAST_REFERENCE.caseName} (161.542949ms)\nℹ pass 272\nℹ fail 0\n`, stderr: '' }
  outer.stdoutSha256 = sha(outer.stdout); outer.stderrSha256 = sha(outer.stderr)
  const fixture = { executableSha256: BLAST_REFERENCE.executableSha256,
    timeline: [[true, false, false], [false, false, false], [false, true, false], [false, true, false], [false, true, true], [false, true, true]]
      .map(([head, enemy, ally]) => ({ head, enemy, ally })), events: ['not port-compared'] }
  return { outer, manifest, manifestPath, sourceFiles, fixture, currentTree: 'new-tree', currentClean: true, path: 'work/orchestration/reference.json' }
}
const rehashReference = d => { d.outer.stdoutSha256 = sha(d.outer.stdout); d.outer.stderrSha256 = sha(d.outer.stderr) }

test('historical reference preserves missing native attestation and supplied ground setup even on a matching tree', () => {
  const d = referenceFixture(), historical = projectBlastReference(d)
  assert.equal(historical.status, 'stale'); assert.equal(historical.diagnosticStatus, 'passed')
  assert.equal(historical.observed.comparedSnapshots, 6)
  assert.equal(historical.reference.sha256, BLAST_REFERENCE.files[BLAST_REFERENCE.fixture])
  assert.match(historical.observed.setup, /gameFlags32 and ground cast; no ordinary bit-clear person-selection proof/)
  for (const result of [historical, projectBlastReference({ ...d, currentTree: d.manifest.tree })]) {
    assert.equal(result.provenanceGrade, 'historical-reference')
    assert.equal(result.rawNativeAttestation, 'missing'); assert.equal(result.originalExecutionStatus, 'unknown')
    assert.match(result.reason, /raw native attestation missing; original execution unknown/)
    assert.equal(result.observed.events, undefined)
  }
  assert.equal(projectBlastReference({ ...d, currentTree: d.manifest.tree }).status, 'verified')
  assert.equal(projectBlastReference({ ...d, currentTree: d.manifest.tree, currentClean: false }).status, 'stale')
})

test('historical comparison rejects count-only, skipped, duplicate and unrelated named output', () => {
  for (const stdout of [
    'ℹ pass 272\nℹ fail 0\n',
    `﹣ ${BLAST_REFERENCE.caseName} (0ms) # SKIP\n`,
    `✔ Other comparison (1ms)\n`,
    `✔ ${BLAST_REFERENCE.caseName} (1ms)\n✔ ${BLAST_REFERENCE.caseName} (2ms)\n`,
    `# ✔ ${BLAST_REFERENCE.caseName} (1ms)\n`,
    `✖ ${BLAST_REFERENCE.caseName} (1ms)\n`,
  ]) {
    const d = referenceFixture(); d.outer.stdout = stdout; rehashReference(d)
    assert.equal(projectBlastReference(d).status, 'unknown', stdout)
  }
})

test('historical reference binding rejects substituted identities, drift and filtered selection', () => {
  const changes = [
    d => { d.outer.phase = 'prepared' }, d => { d.outer.finishedAt = 'bad' },
    d => { d.outer.sourceAfter.headOid = 'drift' }, d => { d.outer.source.trackedDiffSha256 = sha('dirty'); d.outer.sourceAfter = structuredClone(d.outer.source) },
    d => { d.outer.stdout += 'tamper' }, d => { d.outer.stderr += 'tamper' }, d => { d.outer.exitCode = 1 },
    d => { d.manifest.head = 'c'.repeat(40) }, d => { d.outer.source.inputs[d.manifestPath] = 'unknown'; d.outer.sourceAfter = structuredClone(d.outer.source) },
    d => { d.outer.source.inputs['work/orchestration/reviewed/run-stage.mjs'] = 'unknown'; d.outer.sourceAfter = structuredClone(d.outer.source) },
    d => { d.sourceFiles[BLAST_REFERENCE.comparator] = 'changed' }, d => { d.sourceFiles[BLAST_REFERENCE.fixture] = 'changed' },
    d => { d.sourceFiles['decomp/exports.json'] = 'changed' }, d => { d.sourceFiles['scripts/check-native-blast-impact.py'] = 'changed' },
    d => { d.fixture.executableSha256 = 'other-original' }, d => { d.fixture.timeline[0].head = false },
    d => { delete d.outer.source.inputs[BLAST_REFERENCE.comparator]; d.outer.sourceAfter = structuredClone(d.outer.source) },
    d => { d.manifest.dependency.installedLockSha256 = 'different-installed-lock' },
    d => { d.outer.command.push('--test-name-pattern', 'other test') }, d => { d.outer.command.push(BLAST_REFERENCE.comparator) },
  ]
  for (const change of changes) {
    const d = referenceFixture(); change(d); const result = projectBlastReference(d)
    assert.equal(result.status, 'unknown', change.toString()); assert.equal(result.observed, undefined)
    assert.equal(result.originalExecutionStatus, 'unknown')
  }
})

test('newer unsupported, interrupted or failed selected comparisons cannot fall back to an older pass', () => {
  const d = referenceFixture(), old = projectBlastReference(d)
  d.outer.finishedAt = '2026-10-08T11:00:00Z'; d.outer.status = 'failed'; d.outer.exitCode = 1
  d.outer.stdout = `✖ ${BLAST_REFERENCE.caseName} (2ms)\n`; rehashReference(d)
  const failed = projectBlastReference(d)
  assert.equal(failed.diagnosticStatus, 'failed'); assert.equal(failed.status, 'stale')
  assert.equal(selectBlastReference([old, failed]).diagnosticStatus, 'failed')
  assert.equal(selectBlastReference([old, { ...failed, finishedAt: old.finishedAt }]).diagnosticStatus, 'failed')
  d.outer.phase = 'prepared'
  assert.equal(selectBlastReference([old, projectBlastReference(d)]).status, 'unknown')
  d.outer.phase = 'finished'; d.sourceFiles[BLAST_REFERENCE.comparator] = 'new unsupported checker'
  assert.equal(selectBlastReference([old, projectBlastReference(d)]).status, 'unknown')
  delete d.outer.finishedAt
  assert.equal(selectBlastReference([old, projectBlastReference(d)]).status, 'unknown')
})

test('reference discovery needs an explicitly selected comparator, not helper input hashes', t => {
  const root = mkdtempSync(join(tmpdir(), 'blast-reference-discovery-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const directory = join(root, 'work/orchestration'); mkdirSync(directory, { recursive: true })
  const real = referenceFixture().outer, helper = structuredClone(real), filtered = structuredClone(real)
  helper.command[helper.command.length - 1] = 'tests/unrelated.test.mjs'
  filtered.command.push('--test-name-pattern', 'not the comparison')
  assert.equal(isBlastReferenceCandidate(real), true); assert.equal(isBlastReferenceCandidate(helper), false)
  assert.equal(isBlastReferenceCandidate(filtered), true)
  for (const [name, receipt] of Object.entries({ real, helper, filtered })) writeFileSync(join(directory, `${name}.json`), JSON.stringify(receipt))
  const { receipts } = discoverReceipts(root)
  assert.deepEqual(receipts.filter(r => r.commandReceipt).map(r => r.path), ['work/orchestration/filtered.json', 'work/orchestration/real.json'])
})

test('historical original-reference detail cannot enter any capability or inflate coverage', () => {
  const definitions = JSON.parse(readFileSync(new URL('../engineering/parity-capabilities.json', import.meta.url), 'utf8'))
  const { checks } = JSON.parse(readFileSync(new URL('../engineering/checks.json', import.meta.url), 'utf8'))
  const check = checks.find(check => check.id === BLAST_REFERENCE.id)
  assert.equal(check.kind, 'portable'); assert.equal(check.receiptAdapter, 'historical-blast-impact')
  assert.ok(definitions.capabilities.every(c => ![...c.browserCheckIds, ...c.originalCheckIds].includes(BLAST_REFERENCE.id)))
  const model = { checks, definitions, inventory: [{ id: 'spells.blast', title: 'Full Blast', group: 'spells' }] }
  const result = projectBlastReference({ ...referenceFixture(), currentTree: 'a'.repeat(40) })
  const before = buildReport(model, [], [], { head: 'current' })
  const after = buildReport(model, [], [], { head: 'current' }, [result])
  assert.deepEqual(after.knownScope, before.knownScope); assert.deepEqual(after.browserIntegration, before.browserIntegration)
  assert.deepEqual(after.missionCases, before.missionCases); assert.equal(after.scopeHash, before.scopeHash)
  assert.equal(after.checks.length, before.checks.length + 1)
  assert.ok(after.missionCases.capabilities.every(c => c.originalStatus === 'unknown'))
  const html = renderHTML(after)
  assert.match(html, /historical-reference/); assert.match(html, /raw native attestation missing/)
  assert.match(html, /supplied gameFlags32|supplied gameFlags = 32|Supplied gameFlags32/)
  assert.match(html, /ground cast/); assert.match(html, /bit-clear person-selection/)
})
