// A deliberately narrow read-only adapter for the existing ordinary early-mission
// harness. It does not rerun, rewrite, or retroactively stamp an old receipt.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync, statSync } from 'node:fs'
import { isAbsolute, relative, resolve } from 'node:path'
import { isDeepStrictEqual } from 'node:util'
import { safeRepoPath } from './orchestration/cli.mjs'

export const ORDINARY_M2 = 'mission-two-checkpoint-ordinary'
const SCENARIO = 'scripts/local-render/early-missions.mjs'
const CHECK = 'Checkpoint survives a fresh page reload'
const EMPTY = createHash('sha256').update('').digest('hex')
const sha = value => createHash('sha256').update(value).digest('hex')
const SOURCE_FILES = [SCENARIO, 'scripts/checkpoint-readback.mjs', 'scripts/browser-game.mjs',
  'scripts/local-render/harness.mjs', 'scripts/local-render/vite.config.mjs',
  'scripts/local-render/owned-profile.mjs', 'scripts/local-render/checkpoint-observer.mjs']

export function isOrdinaryCheckpointCandidate(value) {
  return value?.kind === 'pnd-command-receipt' &&
    (Object.hasOwn(value.source?.inputs ?? {}, SCENARIO) ||
      value.command?.some(arg => typeof arg === 'string' && arg.endsWith(SCENARIO)))
}

function localPath(root, path) {
  assert(typeof root === 'string' && isAbsolute(root), 'missing tested root')
  assert(typeof path === 'string' && path.length, 'missing receipt path')
  const local = relative(root, resolve(root, path))
  assert(local && !local.startsWith('..') && !isAbsolute(local), 'receipt path escapes tested root')
  return local
}

function optionsFor(outer) {
  assert(outer.command?.[0] === 'node' && outer.command[1] === 'scripts/local-render/harness.mjs', 'not the owned harness command')
  const options = {}
  for (let i = 2; i < outer.command.length; i += 2) {
    const key = outer.command[i], value = outer.command[i + 1]
    assert(['--game-root', '--browser', '--port', '--output', '--timeout', '--scenario'].includes(key), 'unsupported harness option')
    assert(!Object.hasOwn(options, key) && typeof value === 'string' && value.length, 'missing/duplicate harness option')
    options[key] = value
  }
  assert(options['--game-root'] === outer.cwd, 'harness and receipt source roots differ')
  assert(localPath(outer.cwd, options['--scenario']) === SCENARIO, 'seeded or unrelated scenario substituted')
  assert(/^\d+$/.test(options['--port']) && Number(options['--port']) > 0 && Number(options['--port']) < 65536, 'invalid owned port')
  const output = localPath(outer.cwd, options['--output'])
  assert(output.startsWith('work/orchestration/'), 'output is not local orchestration evidence')
  return { options, output }
}

function jsonFile(repo, path) {
  const absolute = safeRepoPath(repo, path)
  assert(statSync(absolute).size <= 4 * 1024 * 1024, 'oversized checkpoint receipt')
  return JSON.parse(readFileSync(absolute, 'utf8'))
}

// Pure interpretation, with explicit source/reference identity supplied by the
// file adapter. Exported so the fail-closed boundaries can be tested without a game.
export function projectOrdinaryCheckpoint({ outer, inner, journey, sourceFiles, currentTree, currentClean, path }) {
  const result = { id: ORDINARY_M2, status: 'unknown', receipt: path,
    finishedAt: outer?.finishedAt ?? outer?.startedAt, evidenceClass: 'ordinary-browser',
    reason: 'Incomplete ordinary checkpoint evidence' }
  try {
    const { options } = optionsFor(outer)
    assert(outer.phase === 'finished' && ['passed', 'failed', 'invalidated'].includes(outer.status), 'interrupted outer receipt')
    assert(Number.isFinite(Date.parse(outer.finishedAt)), 'invalid completion time')
    assert(outer.source?.headOid === inner.source?.commit && outer.cwd === inner.source?.root, 'source identity mismatch')
    assert(isDeepStrictEqual(outer.source, outer.sourceAfter), 'outer source drift')
    assert(isDeepStrictEqual(inner.source, inner.sourceAfter), 'owned server source drift')
    const { fingerprint, ...source } = inner.source
    assert(fingerprint === sha(JSON.stringify(source)), 'source fingerprint mismatch')
    assert(source.status === '' && source.trackedDiffSha256 === EMPTY && source.untracked?.length === 0, 'unclean tested source')
    assert(outer.source.trackedDiffSha256 === EMPTY, 'dirty outer source')
    assert(sha(outer.stdout) === outer.stdoutSha256 && sha(outer.stderr) === outer.stderrSha256, 'raw stream hash mismatch')
    const printed = JSON.parse(outer.stdout.trim().split('\n').at(-1))
    assert(printed.status === inner.status && isDeepStrictEqual(printed.source, inner.source) &&
      isDeepStrictEqual(printed.result, inner.result), 'outer and owned receipts disagree')
    assert(isDeepStrictEqual(inner.result, journey), 'journey sidecar substitution')
    for (const name of SOURCE_FILES) {
      assert(sourceFiles[name] && sourceFiles[name] === outer.source.inputs?.[name], `unbound checker input: ${name}`)
    }
    assert(journey.scenarioSha256 === sourceFiles[SCENARIO], 'scenario source hash mismatch')
    assert(typeof journey.method === 'string' && journey.method.includes('No clock/tick stepping or world/entity/outcome/storage fixtures'), 'not the ordinary real-clock method')
    assert(inner.launch?.executablePath === options['--browser'] && inner.launch.chromiumSandbox === true &&
      inner.launch.headless === true && isDeepStrictEqual(inner.launch.args, ['--remote-debugging-pipe']), 'unexpected browser launch')
    const browserPath = localPath(outer.cwd, options['--browser'])
    assert(/^[a-f0-9]{64}$/.test(outer.source.inputs?.[browserPath] ?? ''), 'missing browser binary identity')
    assert(typeof inner.browserVersion === 'string' && inner.browserVersion.length, 'missing browser version')
    const missions = journey.missions?.filter(mission => mission.level === 2)
    assert(missions?.length === 1, 'missing/duplicate Mission 2 evidence')
    const mission = missions[0], checks = mission.checks?.filter(check => check.name === CHECK)
    assert(checks?.length === 1, 'missing/duplicate checkpoint case')
    const checkpoint = checks[0]
    assert(['passed', 'failed'].includes(checkpoint.status), 'unfinished checkpoint case')
    const failed = outer.status === 'failed' || inner.status === 'failed' || checkpoint.status === 'failed'
    assert(outer.status !== 'invalidated', 'invalidated outer receipt')
    result.diagnosticStatus = failed ? 'failed' : 'passed'
    result.testedSource = { commit: source.commit, tree: source.tree }
    result.browserVersion = inner.browserVersion
    if (!failed) {
      assert(outer.exitCode === 0 && inner.status === 'passed', 'nonpassing harness outcome')
      assert(inner.errors?.length === 0 && mission.errorsBefore === 0 && mission.errorsAfter === 0 && !mission.failure, 'browser errors or mission failure')
      const { saved, loaded, restored, resumed } = checkpoint.evidence ?? {}
      assert(saved?.level === 2 && loaded?.level === 2 && restored?.level === 2 && resumed?.level === 2, 'wrong mission checkpoint')
      assert(Number.isInteger(saved.turn) && loaded.turn === saved.turn, 'saved/loaded turn mismatch')
      assert(isDeepStrictEqual(loaded.stats, saved.stats) &&
        isDeepStrictEqual(loaded.blue, saved.blue.map(unit => [unit.id, unit.kind])), 'loaded checkpoint identity mismatch')
      assert(restored.status === 'playing' && restored.contextLost === false && restored.turn >= saved.turn &&
        restored.turn < saved.turn + 36 && resumed.turn > restored.turn, 'restoration or ordinary resumption mismatch')
      assert(isDeepStrictEqual(restored.blue.map(unit => [unit.id, unit.kind]), loaded.blue), 'restored roster mismatch')
      result.observed = { savedTurn: saved.turn, loadedTurn: loaded.turn, resumedTurn: resumed.turn }
    }
    // Full source-tree equality is deliberately conservative, including tooling.
    // Old observed passes are useful history, never a carry permission after edits.
    const fresh = currentClean && source.tree === currentTree
    result.status = fresh ? failed ? 'failed' : 'verified' : 'stale'
    result.reason = fresh ? 'Owned-server ordinary Mission 2 checkpoint result on matching source tree' :
      'Historical ordinary result; current source tree differs or is dirty'
  } catch (error) {
    result.status = 'unknown'
    result.reason = `Rejected ordinary checkpoint evidence: ${error.message}`
    delete result.diagnosticStatus
    delete result.observed
  }
  return result
}

export function readOrdinaryCheckpoint(repo, { path, commandReceipt: outer }, current) {
  try {
    const { output } = optionsFor(outer)
    const inner = jsonFile(repo, `${output}/receipt.json`), journey = jsonFile(repo, `${output}/journey.json`)
    assert(/^[a-f0-9]{40}$/.test(inner.source?.commit ?? ''), 'invalid tested commit')
    const git = args => execFileSync('git', args, { cwd: repo, maxBuffer: 8 * 1024 * 1024 })
    const tree = git(['rev-parse', `${inner.source.commit}^{tree}`]).toString().trim()
    assert(tree === inner.source.tree, 'commit/tree mismatch')
    const sourceFiles = Object.fromEntries(SOURCE_FILES.map(name => {
      const tested = sha(git(['show', `${inner.source.commit}:${name}`]))
      // Only the currently reviewed same-byte checker is eligible for this adapter.
      assert(tested === sha(readFileSync(safeRepoPath(repo, name))), `checker changed: ${name}`)
      return [name, tested]
    }))
    return projectOrdinaryCheckpoint({ outer, inner, journey, sourceFiles, path,
      currentTree: current.tree, currentClean: current.clean })
  } catch (error) {
    return { id: ORDINARY_M2, status: 'unknown', receipt: path,
      finishedAt: outer.finishedAt ?? outer.startedAt, evidenceClass: 'ordinary-browser',
      reason: `Rejected ordinary checkpoint evidence: ${error.message}` }
  }
}

export function selectOrdinaryCheckpoint(results) {
  if (!results.length) return { id: ORDINARY_M2, status: 'unknown', reason: 'No owned ordinary Mission 2 receipt' }
  if (results.some(result => !Number.isFinite(Date.parse(result.finishedAt))))
    return { id: ORDINARY_M2, status: 'unknown', reason: 'Candidate receipt has no valid ordering time' }
  const priority = { unknown: 0, failed: 1, stale: 2, verified: 3 }
  return [...results].sort((a, b) => Date.parse(b.finishedAt) - Date.parse(a.finishedAt) ||
    priority[a.status] - priority[b.status] || a.receipt.localeCompare(b.receipt))[0]
}
