#!/usr/bin/env node
// Keep Node's isolated test runner and exit semantics. This only bounds file
// concurrency. Optional CI shards retain native results for a separate aggregate;
// they never reuse test outcomes or certify a full suite individually.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { lstatSync, readdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dependencyReceipt, portablePnpmRuntime } from './dependency-profile.mjs'

const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const customRuntime = () => ['NODE_OPTIONS', 'NODE_PATH', 'NODE_COMPILE_CACHE', 'NODE_V8_COVERAGE'].some(key => process.env[key])
const assertDefaultSceneFixtureEnvironment = (env = process.env) => {
  assert(['PND_SCENE_FIXTURE_PRECOMPILED', 'PND_SCENE_FIXTURE_PRECOMPILED_SHA256']
    .every(key => env[key] === undefined),
  'Precompiled scene fixture settings require an explicit source-bound direct command, not the standard test runner')
}
const testPath = path => typeof path === 'string' && /^tests\/[^./\0\r\n][^/\0\r\n]*\.test\.mjs$/.test(path)

export function discoverTests(repo) {
  assert(lstatSync(join(repo, 'tests')).isDirectory(), 'tests must be a real directory')
  const files = readdirSync(join(repo, 'tests')).filter(name => !name.startsWith('.') && name.endsWith('.test.mjs'))
    .map(name => `tests/${name}`).sort()
  assert(files.length, 'No top-level tests/*.test.mjs files found')
  for (const file of files) {
    assert(testPath(file), `Unsupported test path: ${file}`)
    assert(lstatSync(join(repo, file)).isFile(), `Test must be a regular file, not a symlink/directory: ${file}`)
  }
  return files
}

// Conservative content boundaries, not an inferred import graph. Resource review
// is deliberately renewed after production, dependency, or shared-helper drift.
function treeFingerprint(repo, root, include = () => true) {
  if (!lstatSync(join(repo, root)).isDirectory()) return null
  const entries = []
  function visit(path) {
    for (const entry of readdirSync(join(repo, path), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = `${path}/${entry.name}`
      if (entry.isSymbolicLink()) return false
      if (entry.isDirectory()) { if (!visit(file)) return false }
      else if (!entry.isFile()) return false
      else if (include(file)) entries.push([file, hash(readFileSync(join(repo, file)))])
    }
    return true
  }
  return visit(root) ? hash(JSON.stringify(entries.sort(([a], [b]) => a.localeCompare(b)))) : null
}

export function helperFingerprint(repo) {
  // Only discovered top-level test files have individual policy fingerprints.
  // All other regular files are shared inputs, regardless of extension: helper
  // code, fixtures and even documentation drift require deliberate review.
  return treeFingerprint(repo, 'tests', file => !testPath(file))
}

function regularFile(path) {
  return lstatSync(path, { throwIfNoEntry: false })?.isFile() ?? false
}

export function productionFingerprint(repo, { portable = false } = {}) {
  const app = treeFingerprint(repo, 'app')
  const paths = ['package.json', 'package-lock.json', 'tsconfig.json']
  if (!app || paths.some(path => !regularFile(join(repo, path)))) return null
  const installedNpmLock = join(repo, 'node_modules/.package-lock.json')
  const pnpmMetadata = join(repo, 'node_modules/.modules.yaml')
  const pnpmStore = join(repo, 'node_modules/.pnpm')
  const pnpm = lstatSync(pnpmMetadata, { throwIfNoEntry: false }) ||
    lstatSync(pnpmStore, { throwIfNoEntry: false })
  if (!pnpm) {
    // Preserve the existing npm fingerprint schema and bytes for hosted gates.
    paths.push('node_modules/.package-lock.json')
    if (!regularFile(installedNpmLock)) return null
    return hash(JSON.stringify({ app, packages: paths.map(path => [path, hash(readFileSync(join(repo, path)))]),
      runtime: { node: process.versions.node, platform: process.platform, arch: process.arch } }))
  }
  // A local source may point to its own isolated profile outside the checkout.
  // Bind that profile's real lock/config, not a copied npm installed-lock stub.
  if (lstatSync(installedNpmLock, { throwIfNoEntry: false }) || !regularFile(pnpmMetadata) ||
      !lstatSync(pnpmStore, { throwIfNoEntry: false })?.isDirectory()) return null
  const profile = dirname(realpathSync(join(repo, 'node_modules')))
  const profilePaths = ['package.json', 'package-lock.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml',
    'node_modules/.modules.yaml', 'node_modules/.pnpm/lock.yaml']
  if (profilePaths.some(path => !regularFile(join(profile, path)))) return null
  if (!readFileSync(join(profile, 'pnpm-lock.yaml')).equals(readFileSync(join(profile, 'node_modules/.pnpm/lock.yaml')))) return null
  if (portable) {
    const { runtime } = portablePnpmRuntime(dependencyReceipt(repo))
    return hash(JSON.stringify({ app, packages: paths.map(path => [path, hash(readFileSync(join(repo, path)))]),
      dependencies: runtime, runtime: { node: process.versions.node, platform: process.platform, arch: process.arch } }))
  }
  return hash(JSON.stringify({ app, packageManager: 'pnpm',
    packages: paths.map(path => [path, hash(readFileSync(join(repo, path)))]),
    profile: profilePaths.map(path => [path, hash(readFileSync(join(profile, path)))]),
    runtime: { node: process.versions.node, platform: process.platform, arch: process.arch } }))
}

export function planTestRun(repo, mode, requested = [], { concurrency = '2' } = {}) {
  assertDefaultSceneFixtureEnvironment()
  assert(['1', '2'].includes(concurrency), 'PND_TEST_CONCURRENCY must be 1 or 2')
  assert(['all', 'serial', 'focus'].includes(mode), 'Use all, serial, or focus')
  const discovered = discoverTests(repo)
  let files = discovered
  if (mode === 'focus') {
    assert(requested.length, 'Focus needs explicit tests/*.test.mjs paths; use npm test for the full suite')
    assert(new Set(requested).size === requested.length, 'Duplicate focused test path')
    for (const file of requested) assert(testPath(file) && discovered.includes(file), `Unknown focused test path: ${file}`)
    files = [...requested].sort()
  } else assert(requested.length === 0, 'Full-suite commands do not accept file filters or Node flags')
  let parallel = [], parallelEligibility = 'focused-serial'
  if (mode !== 'focus') {
    const policy = JSON.parse(readFileSync(join(repo, 'engineering/test-resources.json'), 'utf8'))
    assert(policy.version === 1 && [policy.helpersSha256, policy.productionSha256].every(digest => /^[a-f0-9]{64}$/.test(digest)), 'Invalid test resource policy')
    assert(policy.parallel && typeof policy.parallel === 'object' && !Array.isArray(policy.parallel), 'Invalid parallel inventory')
    for (const [file, digest] of Object.entries(policy.parallel))
      assert(testPath(file) && /^[a-f0-9]{64}$/.test(digest), `Invalid parallel classification: ${file}`)
    parallelEligibility = customRuntime() ? 'runtime-customization'
      : helperFingerprint(repo) !== policy.helpersSha256 ? 'shared-helper-drift'
        : productionFingerprint(repo) !== policy.productionSha256 ? 'production-config-runtime-drift' : 'reviewed'
    if (parallelEligibility === 'reviewed')
      parallel = files.filter(file => policy.parallel[file] === hash(readFileSync(join(repo, file))))
  }
  const parallelSet = new Set(parallel)
  const serial = files.filter(file => !parallelSet.has(file))
  return { mode, fullSuite: mode !== 'focus', parallelEligibility, files, groups: [
    ...(parallel.length ? [{ concurrency: mode === 'serial' ? 1 : Number(concurrency), files: parallel }] : []),
    ...(serial.length ? [{ concurrency: 1, files: serial }] : []),
  ] }
}

// Shards are separate CI machines, not extra local concurrency. Every shard keeps
// the reviewed C2/C1 policy, and only their validated aggregate is a full suite.
export const TEST_SHARD_COUNT = 4
export function partitionTestFiles(files, index, count = TEST_SHARD_COUNT) {
  assert(count === TEST_SHARD_COUNT, 'Shard count must be exactly 4')
  assert(Number.isInteger(index) && index >= 0 && index < count, 'Shard index must be an integer from 0 to 3')
  assert(Array.isArray(files) && files.length >= count && files.every(testPath), 'Sharding needs at least four valid test files')
  assert(new Set(files).size === files.length, 'Duplicate discovered test file')
  return [...files].sort().filter((_, offset) => offset % count === index)
}

export function shardInputFingerprint(repo) {
  assertDefaultSceneFixtureEnvironment()
  // Include all tests and scripts, not just selected files: drift in discovery,
  // helpers or the runner invalidates the run. The CI envelope additionally binds
  // the complete tracked source tree, git/workflow identity and installed lock.
  const tests = treeFingerprint(repo, 'tests'), scripts = treeFingerprint(repo, 'scripts')
  const production = productionFingerprint(repo, { portable: true })
  assert(tests && scripts && production, 'Shard inputs must be regular files/directories without symlinks')
  const policyPath = join(repo, 'engineering/test-resources.json')
  assert(lstatSync(policyPath).isFile(), 'Shard policy must be a regular file')
  return hash(JSON.stringify({ tests, scripts, production, policy: hash(readFileSync(policyPath)),
    runtime: { node: process.versions.node, platform: process.platform, arch: process.arch },
    childEnvironment: { PYTHONDONTWRITEBYTECODE: '1' },
    environment: Object.fromEntries(['NODE_OPTIONS', 'NODE_PATH', 'NODE_COMPILE_CACHE', 'NODE_V8_COVERAGE', 'PND_TEST_CONCURRENCY']
      .map(key => [key, process.env[key] ?? ''])) }))
}

function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze)
    Object.freeze(value)
  }
  return value
}

export function planTestShard(repo, index, count = TEST_SHARD_COUNT, options = {}) {
  const all = planTestRun(repo, 'all', [], options)
  const files = partitionTestFiles(all.files, index, count), selected = new Set(files)
  return freeze({ ...all, mode: 'shard', fullSuite: false,
    shard: { index, count, algorithm: 'sorted-round-robin-v1' }, discovered: all.files,
    files, groups: all.groups.map(group => ({ ...group, files: group.files.filter(file => selected.has(file)) }))
      .filter(group => group.files.length), inputFingerprint: shardInputFingerprint(repo),
    ...(regularFile(join(repo, 'node_modules/.modules.yaml')) ? { dependencyFormat: 'pnpm-isolated-v1' } : {}) })
}

export async function runTestShard(repo, plan, options = {}) {
  // Copy/freeze even a caller-supplied plan; reject changed policy, selection,
  // classification or concurrency instead of trusting a mutable plan object.
  const frozen = freeze(structuredClone(plan))
  assert(frozen.mode === 'shard' && frozen.fullSuite === false, 'Expected a shard plan')
  const concurrency = frozen.groups.some(group => group.concurrency === 2) ? '2' : '1'
  assert.deepEqual(frozen, planTestShard(repo, frozen.shard?.index, frozen.shard?.count, { concurrency }), 'Shard plan or discovery drift before execution')
  const pnpm = frozen.dependencyFormat === 'pnpm-isolated-v1'
  const installationBefore = pnpm ? portablePnpmRuntime(dependencyReceipt(repo)).installation : null
  const inputsBefore = shardInputFingerprint(repo)
  const result = await runTestPlan(repo, frozen, options)
  let inputsAfter = null, inputError = null, installationAfter = null
  try {
    inputsAfter = shardInputFingerprint(repo)
    if (pnpm) installationAfter = portablePnpmRuntime(dependencyReceipt(repo)).installation
  } catch (error) { inputError = error.message }
  const stable = inputsBefore === inputsAfter && (!pnpm || JSON.stringify(installationBefore) === JSON.stringify(installationAfter))
  result.shardComplete = stable && result.complete
  if (!stable) result.status = 'failed'
  return { version: pnpm ? 2 : 1, kind: 'pnd-test-shard-receipt', plan: frozen, inputsBefore, inputsAfter, inputError, result,
    ...(pnpm ? { installationBefore, installationAfter } : {}) }
}

export function parseShardArguments(args) {
  const values = {}
  for (const arg of args) {
    const match = /^--(shard-index|shard-count|receipt|timings)=(.+)$/.exec(arg)
    assert(match && !Object.hasOwn(values, match[1]), 'Use unique --shard-index=N --shard-count=4 --receipt=PATH arguments')
    values[match[1]] = match[2]
  }
  assert(/^[0-3]$/.test(values['shard-index'] ?? '') && values['shard-count'] === '4', 'Shard index 0..3 and shard count 4 are both required')
  assert(values.receipt && !/[\0\r\n]/.test(values.receipt), 'Shard receipt path is required')
  assert(values.timings === undefined || values.timings === 'summary-v1', 'Unknown timing diagnostics version')
  return { index: Number(values['shard-index']), count: 4, receipt: values.receipt, ...(values.timings ? { timings: values.timings } : {}) }
}

export const TIMING_REPORTER = './scripts/orchestration/test-timing-reporter.mjs'
export function testGroupCommand(group, timings) {
  assert(timings === undefined || timings === 'summary-v1', 'Unknown timing diagnostics version')
  const reporters = timings ? ['--test-reporter=tap', '--test-reporter-destination=stdout',
    `--test-reporter=${TIMING_REPORTER}`, '--test-reporter-destination=stderr'] : ['--test-reporter=tap']
  return [process.execPath, '--test', `--test-concurrency=${group.concurrency}`, ...reporters, ...group.files]
}

export async function runTestPlan(repo, plan, { launch = spawn, signals = process, log = value => console.error(JSON.stringify(value)), timings } = {}) {
  assert(timings === undefined || (timings === 'summary-v1' && plan.mode === 'shard'), 'Timing diagnostics require a shard and summary-v1')
  const startedAt = performance.now()
  assert(plan.files?.length && plan.groups?.length, 'Test plan must not be empty')
  assert(new Set(plan.files).size === plan.files.length, 'Duplicate planned test file')
  assert(plan.groups.every(group => [1, 2].includes(group.concurrency) && group.files.length), 'Invalid test group')
  assert.deepEqual(plan.groups.flatMap(group => group.files).sort(), [...plan.files].sort(), 'Groups must cover every selected file exactly once')
  const env = { ...process.env }
  assertDefaultSceneFixtureEnvironment(env)
  assert(!/--(?:experimental-)?test/.test(env.NODE_OPTIONS ?? ''), 'NODE_OPTIONS must not change test selection or isolation')
  delete env.PND_TEST_TIMING_SLOT
  delete env.NODE_TEST_CONTEXT
  // Python importer tests must not create source-adjacent __pycache__ files
  // during a frozen shard. This effective setting is part of its input digest.
  if (plan.mode === 'shard') env.PYTHONDONTWRITEBYTECODE = '1'
  let interrupted = null, child
  const results = []
  const interrupt = signal => {
    interrupted ??= signal
    // Only the directly owned live child. Detached descendants remain each
    // test's responsibility; this wrapper never certifies process cleanup.
    if (child && child.exitCode === null && child.signalCode === null) child.kill(signal)
  }
  const onInt = () => interrupt('SIGINT'), onTerm = () => interrupt('SIGTERM')
  signals.on('SIGINT', onInt); signals.on('SIGTERM', onTerm)
  try {
    log({ kind: 'pnd-test-plan', ...plan })
    for (const [groupIndex, group] of plan.groups.entries()) {
      if (interrupted) break
      const command = testGroupCommand(group, timings)
      if (timings) env.PND_TEST_TIMING_SLOT = `shard-${plan.shard.index}-group-${groupIndex}`
      const started = performance.now()
      const result = await new Promise(resolve => {
        let error
        try {
          child = launch(command[0], command.slice(1), { cwd: repo, env, stdio: 'inherit', shell: false })
          child.once('error', value => { error = value })
          child.once('close', (exitCode, signal) => resolve({ exitCode, signal, error: error?.message ?? null }))
        } catch (value) { resolve({ exitCode: null, signal: null, error: value.message }) }
      })
      child = undefined
      results.push({ command, files: group.files, concurrency: group.concurrency, ...result,
        status: result.exitCode === 0 && !result.signal && !result.error && !interrupted ? 'passed' : 'failed',
        wallMs: performance.now() - started })
      log({ kind: 'pnd-test-group', ...results.at(-1) })
      // Ordinary failures do not omit later files. Signals/launch failure leave
      // remaining groups explicitly incomplete, with a nonzero aggregate result.
      if (result.signal || result.error) break
    }
  } finally {
    signals.off('SIGINT', onInt); signals.off('SIGTERM', onTerm)
  }
  const complete = !interrupted && results.length === plan.groups.length && results.every(result => !result.signal && !result.error)
  const result = { mode: plan.mode, fullSuite: plan.fullSuite, complete, interrupted, results, wallMs: performance.now() - startedAt,
    status: complete && !interrupted && results.every(result => result.status === 'passed') ? 'passed' : 'failed' }
  log({ kind: 'pnd-test-result', ...result })
  return result
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const [mode, ...requested] = process.argv.slice(2)
    let result
    if (mode === 'shard') {
      const { index, count, receipt, timings } = parseShardArguments(requested)
      // Reserve a fresh artifact before launching: a retry cannot silently rerun
      // into an existing receipt or retain a stale successful payload.
      writeFileSync(receipt, `${JSON.stringify({ version: 1, kind: 'pnd-test-shard-receipt', status: 'running' })}\n`, { flag: 'wx' })
      const payload = await runTestShard(ROOT, planTestShard(ROOT, index, count, { concurrency: process.env.PND_TEST_CONCURRENCY ?? '2' }), { timings })
      writeFileSync(receipt, `${JSON.stringify(payload, null, 2)}\n`)
      result = payload.result
    } else result = await runTestPlan(ROOT, planTestRun(ROOT, mode, requested, { concurrency: process.env.PND_TEST_CONCURRENCY ?? '2' }))
    if (result.status !== 'passed') process.exitCode = result.interrupted ? 130 : 1
  } catch (error) {
    console.error(`test runner: ${error.message}`)
    process.exitCode = 1
  }
}
