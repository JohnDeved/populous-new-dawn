#!/usr/bin/env node
// Keep Node's isolated test runner and exit semantics. This only bounds file
// concurrency; it is neither a test framework nor a receipt/reuse mechanism.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { lstatSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const customRuntime = () => ['NODE_OPTIONS', 'NODE_PATH', 'NODE_COMPILE_CACHE', 'NODE_V8_COVERAGE'].some(key => process.env[key])
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
  return treeFingerprint(repo, 'tests', file => file.endsWith('.mjs') && !testPath(file))
}

export function productionFingerprint(repo) {
  const app = treeFingerprint(repo, 'app')
  const paths = ['package.json', 'package-lock.json', 'tsconfig.json', 'node_modules/.package-lock.json']
  if (!app || paths.some(path => !lstatSync(join(repo, path)).isFile())) return null
  return hash(JSON.stringify({ app, packages: paths.map(path => [path, hash(readFileSync(join(repo, path)))]),
    runtime: { node: process.versions.node, platform: process.platform, arch: process.arch } }))
}

export function planTestRun(repo, mode, requested = [], { concurrency = '2' } = {}) {
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

export async function runTestPlan(repo, plan, { launch = spawn, signals = process, log = value => console.error(JSON.stringify(value)) } = {}) {
  const startedAt = performance.now()
  assert(plan.files?.length && plan.groups?.length, 'Test plan must not be empty')
  assert(new Set(plan.files).size === plan.files.length, 'Duplicate planned test file')
  assert(plan.groups.every(group => [1, 2].includes(group.concurrency) && group.files.length), 'Invalid test group')
  assert.deepEqual(plan.groups.flatMap(group => group.files).sort(), [...plan.files].sort(), 'Groups must cover every selected file exactly once')
  const env = { ...process.env }
  assert(!/--(?:experimental-)?test/.test(env.NODE_OPTIONS ?? ''), 'NODE_OPTIONS must not change test selection or isolation')
  delete env.NODE_TEST_CONTEXT
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
    for (const group of plan.groups) {
      if (interrupted) break
      const command = [process.execPath, '--test', `--test-concurrency=${group.concurrency}`, '--test-reporter=tap', ...group.files]
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
    const result = await runTestPlan(ROOT, planTestRun(ROOT, mode, requested, { concurrency: process.env.PND_TEST_CONCURRENCY ?? '2' }))
    if (result.status !== 'passed') process.exitCode = result.interrupted ? 130 : 1
  } catch (error) {
    console.error(`test runner: ${error.message}`)
    process.exitCode = 1
  }
}
