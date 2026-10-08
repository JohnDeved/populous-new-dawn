// Read-only bindings for reviewed ordinary Blast witnesses and a historical reference. Checker
// bytes are pinned separately from full tested-tree freshness; no game code runs.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync, statSync } from 'node:fs'
import { safeRepoPath } from './orchestration/cli.mjs'
import { isDeepStrictEqual as same } from 'node:util'
import { jsonFile, localPath, selectOwnedObservation, validateOwnedReceipt } from './parity-owned-checkpoint.mjs'

const sha = value => createHash('sha256').update(value).digest('hex')
const HARNESS = 'scripts/local-render/harness.mjs'
const COMMON = [HARNESS, 'scripts/local-render/owned-profile.mjs', 'scripts/local-render/checkpoint-observer.mjs',
  'scripts/local-render/vite.config.mjs', 'scripts/browser-game.mjs', 'qa/erosion-ordinary/input.mjs',
  'qa/erosion-ordinary/stop.mjs', 'qa/blast-ordinary/preparation.mjs']
export const BLAST_BINDINGS = [
  { id: 'blast-person-ordinary', label: 'ordinary Blast person', scenario: 'qa/blast-ordinary/scenario.mjs',
    reference: 'c40026937f39dadf86143ef13f73dba22d2e4a9c', sidecar: 'episode.json', stage: 'ordinary-person-cast-impact',
    files: [...COMMON, ...['scenario', 'observer', 'contract', 'setup-observer', 'pick-observer', 'frame-capture'].map(n => `qa/blast-ordinary/${n}.mjs`)] },
  { id: 'blast-controls-ordinary', label: 'ordinary Blast controls', scenario: 'qa/blast-ordinary/controls.mjs',
    reference: '2e51cf0a024369221c534d0a72c1fcef7e0065ff', sidecar: 'controls.json', stage: 'ordinary-Blast-remaining-controls',
    files: [...COMMON, 'scripts/checkpoint-readback.mjs', 'scripts/local-render/early-missions.mjs',
      'scripts/campaign-start-readiness.mjs', ...['controls', 'controls-observer', 'controls-evidence'].map(n => `qa/blast-ordinary/${n}.mjs`)] },
]
export const BLAST_CONTROL_STAGES = ['cancel-and-key-repeat', 'out-of-range', 'empty-ground-and-repeated-click',
  'public-pause-active-save-fresh-page-Load', 'ordinary-stock-exhaustion-and-rejection', 'pause-button-hold-and-resume']

// Discovery is intentionally broader than validation. Malformed/unsupported new
// attempts must suppress an older pass, but helper inputs cannot select a scenario.
export function isOrdinaryBlastCandidate(value, binding) {
  if (value?.kind !== 'pnd-command-receipt' || !Array.isArray(value.command)) return false
  const index = value.command.indexOf(HARNESS)
  if (index < 1 || value.command[index - 1] !== 'node') return false
  const args = value.command.slice(index + 1)
  const scenarios = args.flatMap((arg, i) => arg === '--scenario' ? [args[i + 1]]
    : typeof arg === 'string' && arg.startsWith('--scenario=') ? [arg.slice(11)] : [])
  if (!scenarios.some(arg => typeof arg === 'string' &&
    (arg === binding.scenario || arg.endsWith('/' + binding.scenario)))) {
    if (scenarios.some(arg => typeof arg === 'string' && arg.length && !arg.startsWith('--'))) return false
    if (!scenarios.length || !Object.hasOwn(value.source?.inputs ?? {}, binding.scenario)) return false
  }
  const expectations = value.command.slice(0, index - 1).filter(arg => typeof arg === 'string' && arg.startsWith('POPULOUS_BLAST_EXPECTATION='))
  return binding.sidecar !== 'episode.json' || !same(expectations, ['POPULOUS_BLAST_EXPECTATION=baseline'])
}

function optionsFor(outer, binding) {
  assert(isOrdinaryBlastCandidate(outer, binding), 'not the selected Blast candidate scenario')
  const command = outer.command, env = {}; let i = 0
  if (command[i] === 'timeout') {
    assert(command[++i] === '--signal=TERM' && command[++i] === '--kill-after=10s' && /^\d+s$/.test(command[++i]), 'unsupported timeout wrapper')
    i++
  }
  if (command[i] === 'taskset') {
    assert(command[++i] === '-c' && /^\d+(?:[-,]\d+)*$/.test(command[++i]), 'unsupported CPU wrapper')
    i++
  }
  if (command[i] === 'env') {
    i++
    while (typeof command[i] === 'string' && command[i].includes('=')) {
      const at = command[i].indexOf('='), key = command[i].slice(0, at), value = command[i++].slice(at + 1)
      assert(['CLOUDFLARE_CF_FETCH_ENABLED', 'TMPDIR', 'POPULOUS_BLAST_EXPECTATION', 'POPULOUS_BLAST_PICK_DIAGNOSTIC'].includes(key) && !Object.hasOwn(env, key), 'unsupported/duplicate environment option')
      env[key] = value
    }
  }
  assert(command[i++] === 'node' && command[i++] === HARNESS, 'unsupported harness command')
  assert(!env.CLOUDFLARE_CF_FETCH_ENABLED || env.CLOUDFLARE_CF_FETCH_ENABLED === 'false', 'unexpected network override')
  if (env.TMPDIR) assert(localPath(outer.cwd, env.TMPDIR).startsWith('work/orchestration/'), 'unexpected temporary path')
  if (binding.sidecar === 'episode.json') assert(env.POPULOUS_BLAST_EXPECTATION === 'candidate' &&
    [undefined, '0'].includes(env.POPULOUS_BLAST_PICK_DIAGNOSTIC), 'baseline or diagnostic substituted')
  const options = {}
  for (; i < command.length; i += 2) {
    const key = command[i], value = command[i + 1]
    assert(['--game-root', '--browser', '--port', '--output', '--timeout', '--scenario', '--profile', '--mission'].includes(key), 'unsupported harness option')
    assert(!Object.hasOwn(options, key) && typeof value === 'string' && value.length, 'missing/duplicate harness option')
    options[key] = value
  }
  assert(options['--game-root'] === outer.cwd && localPath(outer.cwd, options['--scenario']) === binding.scenario, 'scenario/source substitution')
  assert(!options['--mission'] || options['--mission'] === '2', 'wrong mission')
  assert(/^\d+$/.test(options['--port']) && Number(options['--port']) > 0 && Number(options['--port']) < 65536, 'invalid owned port')
  const output = localPath(outer.cwd, options['--output'])
  assert(output.startsWith('work/orchestration/') && localPath(outer.cwd, options['--profile']).startsWith('work/local-render-profiles/'), 'unexpected evidence/profile path')
  return { options, output }
}

function personObservation(sidecar) {
  const r = sidecar.report
  assert(sidecar.expectation === 'candidate' && sidecar.diagnostic === false && r?.expectation === 'candidate', 'baseline or diagnostic result')
  assert(r.complete === true && same(r.errors, []) && r.windupMotion === true && r.flightMotion === true, 'incomplete moving-person episode')
  assert(r.sourceFingerprint === sidecar.source.fingerprint && r.runId === sidecar.runId, 'episode identity mismatch')
  assert(r.entry?.level === 2 && r.entry.target?.team === 'blue' && r.entry.target.kind === 'brave' &&
    r.entry.actor?.team === 'blue' && r.entry.actor.kind === 'shaman', 'not the ordinary friendly-target case')
  assert(r.release?.trusted === true && r.release.canvasOwned === true && r.release.handlerPersonId === r.targetId &&
    r.entry.shot?.tracking?.personId === r.targetId && r.entry.turn === r.release.turn, 'unbound person release')
  assert(Number.isInteger(r.release.turn) && r.movement?.trusted === true && r.movement.canvasOwned === true &&
    r.movement.shotBefore?.id === r.entry.shot.id && r.movement.shotBefore.phase === 'windup' &&
    r.movement.shotBefore.remaining > 0 && r.movement.turn >= r.release.turn && r.movement.turn < r.release.turn + 6, 'missing real windup movement')
  assert(r.arrival?.shot?.id === r.entry.shot.id && r.arrival.shot.phase === 'arrived' &&
    r.impact?.turn === r.arrival.turn + 1 && r.retired === r.impact.turn, 'arrival/impact discontinuity')
  const turns = r.rows?.filter(row => row.stage === 'turn')
  assert(turns?.length === r.impact.turn - r.release.turn && turns.length > 0, 'incomplete turn observations')
  for (const [i, row] of turns.entries()) {
    assert(row.before.turn === r.release.turn + i && row.after.turn === row.before.turn + 1, 'non-adjacent turn observations')
    assert(row.before.target?.id === r.targetId && row.before.target.movementOrderSame === true &&
      row.after.target?.id === r.targetId && row.after.target.movementOrderSame === true, 'person/order continuity mismatch')
  }
  return { releaseTurn: r.release.turn, movementTurn: r.movement.turn, arrivalTurn: r.arrival.turn, impactTurn: r.impact.turn, target: 'friendly Blue Brave' }
}

function controlsObservation(sidecar, inner) {
  assert(same(sidecar.checks?.map(check => check.name), BLAST_CONTROL_STAGES) && sidecar.checks.every(check => check.status === 'passed'), 'missing/duplicate/nonpassing control stage')
  assert(sidecar.proofs?.length === 8 && sidecar.proofs.every(proof => same(proof.errors, []) && same(proof.pointer?.errors, []) && proof.cleanupVerified === true), 'incomplete control observations')
  const { saved, loaded, committed } = sidecar
  assert(saved?.level === 2 && saved.paused === true && Number.isInteger(saved.turn) && saved.projectiles?.length === 1 &&
    ['windup', 'flying'].includes(saved.projectiles[0].phase) && saved.projectiles[0].spell === 'blast', 'no paused active Blast checkpoint')
  assert(same(saved, loaded) && sidecar.loadObservationError === null, 'saved/loaded bounded projection mismatch')
  assert(committed?.runId === sidecar.runId && committed.sourceFingerprint === sidecar.source.fingerprint &&
    committed.checkpoint?.turn === saved.turn && committed.checkpoint.level === 2 &&
    inner.profile.checkpoints?.some(checkpoint => same(checkpoint, committed)), 'checkpoint commitment mismatch')
  const resumed = sidecar.checks[3].resumed
  assert(resumed?.level === 2 && resumed.paused === false && resumed.turn > saved.turn && resumed.castCount === saved.castCount, 'no ordinary resumption')
  return { stagesPassed: BLAST_CONTROL_STAGES.length, savedTurn: saved.turn, loadedTurn: loaded.turn,
    resumedTurn: resumed.turn, activeShotId: saved.projectiles[0].id, equality: 'bounded saved/loaded projection only' }
}

export function projectOrdinaryBlast({ binding, outer, inner, sidecar, sourceFiles, currentTree, currentClean, path }) {
  const result = { id: binding.id, status: 'unknown', receipt: path,
    finishedAt: outer?.finishedAt ?? outer?.startedAt, evidenceClass: 'ordinary-browser' }
  try {
    const { options, output } = optionsFor(outer, binding)
    const { source, failed } = validateOwnedReceipt(outer, inner)
    for (const name of binding.files) assert(sourceFiles[name] && sourceFiles[name] === outer.source.inputs?.[name], `unbound reviewed checker: ${name}`)
    assert(inner.scenario?.sha256 === sourceFiles[binding.scenario] && localPath(outer.cwd, inner.scenario.path) === binding.scenario &&
      same(inner.scenario, inner.scenarioAfter), 'scenario identity/drift mismatch')
    assert(inner.runtime && same(inner.runtime, inner.runtimeAfter), 'runtime identity/drift mismatch')
    const browser = options['--browser'], binary = outer.source.inputs?.[browser] ?? outer.source.inputs?.[localPath(outer.cwd, browser)]
    assert(/^[a-f0-9]{64}$/.test(binary ?? '') && inner.runtime.browserSha256 === binary && inner.runtime.browserPath === browser, 'browser binary identity mismatch')
    assert(inner.launch?.executablePath === browser && inner.launch.chromiumSandbox === true && inner.launch.headless === true &&
      inner.launch.ignoreDefaultArgs === true && same(inner.launch.args, ['--remote-debugging-pipe', `--user-data-dir=${options['--profile']}/browser`, 'about:blank']), 'unexpected browser launch')
    assert(inner.profile?.mode === 'created' && inner.profile.path === options['--profile'] &&
      inner.profile.origin === `http://127.0.0.1:${options['--port']}` && inner.profile.previousRun === null &&
      inner.profile.checkpointAtStart === null && inner.profile.cleanupVerified === true && inner.profile.continuationVerified === true, 'not a clean owned profile')
    assert(typeof inner.browserVersion === 'string' && inner.browserVersion.length, 'missing browser version')
    assert(same(sidecar.source, inner.source) && sidecar.runId === inner.profile.runId, 'sidecar source/run substitution')
    assert(sidecar.status === (failed ? 'failed' : 'passed'), 'sidecar outcome disagreement')
    assert(typeof sidecar.method === 'string' && sidecar.method.includes(binding.sidecar === 'episode.json'
      ? 'No injected game state or clock stepping' : 'No world, stock, storage or clock injection'), 'not the ordinary real-clock method')
    if (!failed) {
      assert(same(inner.errors, []) && !sidecar.failure && inner.result?.stage === binding.stage &&
        localPath(outer.cwd, inner.result.evidence) === `${output}/${binding.sidecar}`, 'result/sidecar disagreement')
      if (binding.sidecar === 'episode.json') {
        assert(inner.result.expectation === 'candidate' && inner.result.complete === true, 'noncandidate result')
        result.observed = personObservation(sidecar)
      } else {
        assert(inner.result.status === 'passed', 'nonpassing controls result')
        result.observed = controlsObservation(sidecar, inner)
      }
    }
    result.diagnosticStatus = failed ? 'failed' : 'passed'
    result.testedSource = { commit: source.commit, tree: source.tree }
    result.browserVersion = inner.browserVersion
    const fresh = currentClean && source.tree === currentTree
    result.status = fresh ? failed ? 'failed' : 'verified' : 'stale'
    result.reason = `${binding.label} recorded ${result.diagnosticStatus}; ` +
      (fresh ? 'matching full clean source tree' : 'historical observation; current full source tree differs or is dirty')
  } catch (error) {
    result.reason = `Rejected ${binding.label} evidence: ${error.message}`
    delete result.observed
  }
  return result
}

export function readOrdinaryBlast(repo, { path, commandReceipt: outer }, current, binding) {
  try {
    const { output } = optionsFor(outer, binding)
    const inner = jsonFile(repo, `${output}/receipt.json`), sidecar = jsonFile(repo, `${output}/${binding.sidecar}`)
    assert(/^[a-f0-9]{40}$/.test(inner.source?.commit ?? ''), 'invalid tested commit')
    const git = args => execFileSync('git', args, { cwd: repo, maxBuffer: 8 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] })
    assert(git(['rev-parse', `${inner.source.commit}^{tree}`]).toString().trim() === inner.source.tree, 'commit/tree mismatch')
    const sourceFiles = Object.fromEntries(binding.files.map(name => {
      const tested = sha(git(['show', `${inner.source.commit}:${name}`]))
      assert(tested === sha(git(['show', `${binding.reference}:${name}`])), `unsupported checker revision: ${name}`)
      return [name, tested]
    }))
    return projectOrdinaryBlast({ binding, outer, inner, sidecar, sourceFiles, path, currentTree: current.tree, currentClean: current.clean })
  } catch (error) {
    return { id: binding.id, status: 'unknown', receipt: path, finishedAt: outer.finishedAt ?? outer.startedAt,
      evidenceClass: 'ordinary-browser', reason: `Rejected ${binding.label} evidence: ${error.message}` }
  }
}

export const selectOrdinaryBlast = (results, binding) => selectOwnedObservation(results, binding.id, binding.label)

// This portable comparison consumes a historical original-derived fixture. It is
// deliberately not a native check or capability binding, even on a matching tree.
export const BLAST_REFERENCE = {
  id: 'blast-impact-original-reference', comparator: 'tests/blast-impact.test.mjs',
  caseName: 'Blast head reaches impact and native first/last wave visits launch enemies/allies',
  origin: 'ef651f3b592cf859fb738b9e36eb05495e55d9a5',
  fixture: 'tests/fixtures/blast-impact.json',
  executableSha256: '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f',
  manifestSha256: 'e7026c1ba4a0c0bbeab4d94574b137d3ac4473362acb6f3c1e23cd522848d2aa',
  runnerSha256: '04f39b371e17a329a76056223daed481290143f0672dc0e162f83eac7dd22147',
  files: {
    'tests/blast-impact.test.mjs': 'fe39d3121852d795e47ab419aa04b1cdc72ba03cb4c91fbdff42f47fa1bb92af',
    'tests/fixtures/blast-impact.json': '673c161abfaaa78359d1d280bc6f2c2f7084dc629019a2383c3bfee90ebc9d2f',
    'decomp/exports.json': '51e55c295a9956e89be85c98df835f1da141e3e10cb6b16435f55423ff5b26db',
    'scripts/check-native-blast-impact.py': 'f5193e8eab00e285f33d3cafc0cee8483fd2e8df6e72552bbc44c9cf0e6b9207',
  },
}
const referenceResult = (outer, path) => ({ id: BLAST_REFERENCE.id, status: 'unknown', receipt: path,
  finishedAt: outer?.finishedAt ?? outer?.startedAt, evidenceClass: 'historical-reference',
  provenanceGrade: 'historical-reference', rawNativeAttestation: 'missing', originalExecutionStatus: 'unknown' })

export function isBlastReferenceCandidate(value) {
  if (value?.kind !== 'pnd-command-receipt' || !Array.isArray(value.command)) return false
  const index = value.command.indexOf('node')
  return index >= 0 && value.command[index + 1] === '--test' && value.command.slice(index + 2).some(arg =>
    typeof arg === 'string' && (arg === BLAST_REFERENCE.comparator || arg.endsWith('/' + BLAST_REFERENCE.comparator)))
}

export function projectBlastReference({ outer, manifest, manifestPath, sourceFiles, fixture, currentTree, currentClean, path }) {
  const result = referenceResult(outer, path)
  try {
    assert(isBlastReferenceCandidate(outer), 'comparator not explicitly selected')
    const stages = manifest.stages?.filter(stage => stage.command?.includes(BLAST_REFERENCE.comparator))
    assert(stages?.length === 1 && stages[0].name === 'test-02' && same(outer.command,
      ['timeout', '--signal=TERM', '--kill-after=10s', `${manifest.innerSeconds}s`, ...stages[0].command]), 'unsupported or filtered comparison command')
    assert(stages[0].command.filter(arg => arg === BLAST_REFERENCE.comparator).length === 1, 'duplicate selected comparator')
    assert(outer.phase === 'finished' && ['passed', 'failed'].includes(outer.status) && Number.isFinite(Date.parse(outer.finishedAt)), 'incomplete comparison attempt')
    assert(same(outer.source, outer.sourceAfter) && outer.source?.trackedDiffSha256 === sha(''), 'comparison source drift or dirty source')
    assert(outer.source.headOid === manifest.head && /^[a-f0-9]{40}$/.test(manifest.tree ?? ''), 'manifest/source mismatch')
    assert(sha(outer.stdout) === outer.stdoutSha256 && sha(outer.stderr) === outer.stderrSha256, 'raw stream hash mismatch')
    assert(outer.source.inputs?.[manifestPath] === BLAST_REFERENCE.manifestSha256 &&
      outer.source.inputs?.[manifestPath.replace(/manifest\.json$/, 'run-stage.mjs')] === BLAST_REFERENCE.runnerSha256, 'unsupported manifest/runner identity')
    for (const [name, hash] of Object.entries(BLAST_REFERENCE.files)) assert(sourceFiles[name] === hash, `unsupported reference input: ${name}`)
    assert(manifest.files?.[BLAST_REFERENCE.comparator] === sourceFiles[BLAST_REFERENCE.comparator], 'manifest comparator substitution')
    for (const [name, hash] of Object.entries(manifest.files)) assert(outer.source.inputs[name] === hash, `unbound shard test: ${name}`)
    for (const name of ['package.json', 'package-lock.json']) assert(sourceFiles[name] && outer.source.inputs[name] === sourceFiles[name], `unbound dependency input: ${name}`)
    assert(manifest.dependency?.rootLockSha256 === sourceFiles['package-lock.json'] &&
      manifest.dependency.installedLockSha256 === outer.source.inputs['node_modules/.package-lock.json'], 'dependency identity mismatch')
    assert(fixture.executableSha256 === BLAST_REFERENCE.executableSha256, 'reference executable identity mismatch')
    const timeline = [
      { head: true, enemy: false, ally: false }, { head: false, enemy: false, ally: false },
      { head: false, enemy: true, ally: false }, { head: false, enemy: true, ally: false },
      { head: false, enemy: true, ally: true }, { head: false, enemy: true, ally: true },
    ]
    assert(same(fixture.timeline, timeline), 'reference timeline mismatch')
    // Only the specific named record is evidence. Aggregate counts cannot certify
    // a constituent test; unsupported/skipped/duplicate records remain unknown.
    const records = outer.stdout.split('\n').filter(line => line.includes(BLAST_REFERENCE.caseName))
    const failed = outer.status === 'failed', marker = failed ? '✖' : '✔'
    assert(records.length === 1 && new RegExp(`^${marker} ${BLAST_REFERENCE.caseName} \\([\\d.]+ms\\)$`).test(records[0]), 'missing, duplicate or nonpassing named comparison')
    assert(failed ? Number.isInteger(outer.exitCode) && outer.exitCode !== 0 : outer.exitCode === 0, 'comparison exit/status mismatch')
    result.diagnosticStatus = failed ? 'failed' : 'passed'
    result.testedSource = { commit: manifest.head, tree: manifest.tree }
    result.reference = { commit: BLAST_REFERENCE.origin, path: BLAST_REFERENCE.fixture,
      sha256: BLAST_REFERENCE.files[BLAST_REFERENCE.fixture], executableSha256: fixture.executableSha256 }
    if (!failed) result.observed = { comparedSnapshots: 6, headRetirementVisit: 2, firstEnemyImpulseVisit: 3, firstFriendlyImpulseVisit: 5,
      setup: 'supplied gameFlags32 and ground cast; no ordinary bit-clear person-selection proof' }
    const fresh = currentClean && currentTree === manifest.tree
    result.status = fresh ? failed ? 'failed' : 'verified' : 'stale'
    result.reason = 'Port-to-historical-reference component comparison; raw native attestation missing; original execution unknown; ' +
      (fresh ? 'matching full clean port source tree' : 'current full source tree differs or is dirty')
  } catch (error) {
    result.reason = `Rejected historical Blast reference evidence: ${error.message}`
  }
  return result
}

export function readBlastReference(repo, { path, commandReceipt: outer }, current) {
  try {
    const manifests = Object.keys(outer.source?.inputs ?? {}).filter(name => name.startsWith('work/orchestration/') && name.endsWith('/manifest.json'))
    assert(manifests.length === 1, 'missing/ambiguous shard manifest')
    const manifestPath = manifests[0]
    const pinnedBytes = (name, expected) => {
      const file = safeRepoPath(repo, name)
      assert(statSync(file).size <= 4 * 1024 * 1024, 'oversized reference input')
      const bytes = readFileSync(file)
      assert(sha(bytes) === expected, `unsupported reference receipt input: ${name}`)
      return bytes
    }
    const manifest = JSON.parse(pinnedBytes(manifestPath, BLAST_REFERENCE.manifestSha256))
    pinnedBytes(manifestPath.replace(/manifest\.json$/, 'run-stage.mjs'), BLAST_REFERENCE.runnerSha256)
    assert(/^[a-f0-9]{40}$/.test(outer.source?.headOid ?? ''), 'invalid tested commit')
    const git = args => execFileSync('git', args, { cwd: repo, maxBuffer: 8 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] })
    const commit = outer.source.headOid
    assert(git(['rev-parse', `${commit}^{tree}`]).toString().trim() === manifest.tree, 'tested commit/tree mismatch')
    const sourceFiles = Object.fromEntries([...Object.keys(BLAST_REFERENCE.files), 'package.json', 'package-lock.json']
      .map(name => [name, sha(git(['show', `${commit}:${name}`]))]))
    assert(sha(git(['show', `${BLAST_REFERENCE.origin}:${BLAST_REFERENCE.fixture}`])) === BLAST_REFERENCE.files[BLAST_REFERENCE.fixture], 'historical reference origin mismatch')
    const fixture = JSON.parse(git(['show', `${commit}:${BLAST_REFERENCE.fixture}`]))
    const exports = JSON.parse(git(['show', `${commit}:decomp/exports.json`]))
    assert(exports.executableSha256 === fixture.executableSha256, 'exports/reference executable mismatch')
    return projectBlastReference({ outer, manifest, manifestPath, sourceFiles, fixture, path, currentTree: current.tree, currentClean: current.clean })
  } catch (error) {
    return { ...referenceResult(outer, path), reason: `Rejected historical Blast reference evidence: ${error.message}` }
  }
}

export function selectBlastReference(results) {
  return { ...referenceResult(), ...selectOwnedObservation(results, BLAST_REFERENCE.id, 'historical Blast reference comparison') }
}
