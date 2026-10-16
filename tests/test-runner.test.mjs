import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test, { after } from 'node:test'
import { discoverTests, helperFingerprint, productionFingerprint, planTestRun, runTestPlan } from '../scripts/orchestration/test-runner.mjs'

// These synthetic inventories explicitly model an uncustomized Node runtime.
// The environment-fallback regression below supplies customizations separately.
const inheritedRuntime = Object.fromEntries(['NODE_OPTIONS', 'NODE_PATH', 'NODE_COMPILE_CACHE', 'NODE_V8_COVERAGE'].map(key => [key, process.env[key]]))
for (const key of Object.keys(inheritedRuntime)) process.env[key] = ''
after(() => {
  for (const [key, value] of Object.entries(inheritedRuntime)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

const digest = bytes => createHash('sha256').update(bytes).digest('hex')
function fixture(t) {
  const repo = mkdtempSync(join(tmpdir(), 'pnd-test-runner-'))
  t.after(() => rmSync(repo, { recursive: true, force: true }))
  const put = (file, value) => {
    mkdirSync(join(repo, file, '..'), { recursive: true })
    writeFileSync(join(repo, file), value)
  }
  put('tests/a.test.mjs', "import test, { after } from 'node:test'; test('a', () => {})\n")
  put('tests/b.test.mjs', "import test, { after } from 'node:test'; test('b', () => {})\n")
  put('tests/support/helper.mjs', 'export const helper = 1\n')
  put('app/source.ts', 'export const value = 1\n')
  put('package.json', '{"type":"module"}')
  put('package-lock.json', '{}')
  put('tsconfig.json', '{}')
  put('node_modules/.package-lock.json', '{}')
  const policy = { version: 1, helpersSha256: helperFingerprint(repo), productionSha256: productionFingerprint(repo),
    parallel: { 'tests/a.test.mjs': digest(readFileSync(join(repo, 'tests/a.test.mjs'))) } }
  put('engineering/test-resources.json', JSON.stringify(policy))
  return { repo, put, policy }
}
const quiet = { log() {} }

test('full discovery preserves the top-level glob and includes unclassified files once', t => {
  const { repo, put, policy } = fixture(t)
  put('tests/nested/extra.test.mjs', '')
  put('tests/not-selected.pending.mjs', '')
  put('tests/.hidden.test.mjs', '')
  put('tests/c.test.mjs', "import test, { after } from 'node:test'; test('c', () => {})\n")
  put('engineering/test-resources.json', JSON.stringify({ ...policy, helpersSha256: helperFingerprint(repo) }))
  const expected = ['tests/a.test.mjs', 'tests/b.test.mjs', 'tests/c.test.mjs']
  assert.deepEqual(discoverTests(repo), expected)
  const plan = planTestRun(repo, 'all')
  assert.equal(plan.fullSuite, true)
  assert.deepEqual(plan.groups, [
    { concurrency: 2, files: [expected[0]] }, { concurrency: 1, files: expected.slice(1) },
  ])
  assert.deepEqual(plan.groups.flatMap(group => group.files).sort(), expected)
  assert.deepEqual(planTestRun(repo, 'serial').groups, plan.groups.map(group => ({ ...group, concurrency: 1 })))
  assert.deepEqual(planTestRun(repo, 'all', [], { concurrency: '1' }).groups, planTestRun(repo, 'serial').groups)
  for (const concurrency of ['0', '3', '', 'NaN', '1.5'])
    assert.throws(() => planTestRun(repo, 'all', [], { concurrency }), /must be 1 or 2/)
})

test('focus accepts only exact explicit unique discovered files and is never full-suite evidence', t => {
  const { repo } = fixture(t)
  for (const paths of [[], ['tests/missing.test.mjs'], ['--test-only'], ['--test-name-pattern=a'],
    ['tests/a.test.mjs', 'tests/a.test.mjs'], ['tests/../tests/a.test.mjs'], ['tests/*.test.mjs']])
    assert.throws(() => planTestRun(repo, 'focus', paths), /Focus needs|Unknown focused|Duplicate/)
  for (const mode of ['all', 'serial']) assert.throws(() => planTestRun(repo, mode, ['tests/a.test.mjs']), /do not accept/)
  assert.throws(() => planTestRun(repo, 'unknown'), /Use all/)
  const plan = planTestRun(repo, 'focus', ['tests/b.test.mjs', 'tests/a.test.mjs'])
  assert.equal(plan.fullSuite, false)
  assert.deepEqual(plan.groups, [{ concurrency: 1, files: ['tests/a.test.mjs', 'tests/b.test.mjs'] }])
})

test('changed tests, helper drift and newly added helpers fall back to serial', t => {
  const { repo, put } = fixture(t)
  put('tests/a.test.mjs', '// modified test\n')
  assert.equal(planTestRun(repo, 'all').groups[0].concurrency, 1)
  const second = fixture(t)
  second.put('tests/support/helper.mjs', 'export const helper = 2\n')
  assert.equal(planTestRun(second.repo, 'all').groups[0].concurrency, 1)
  const third = fixture(t)
  third.put('tests/support/new-helper.mjs', 'export {}\n')
  assert.equal(planTestRun(third.repo, 'all').groups[0].concurrency, 1)
})

test('empty discovery, malformed policy and test symlinks fail closed', t => {
  const { repo, put, policy } = fixture(t)
  put('engineering/test-resources.json', JSON.stringify({ ...policy, parallel: { '--test-only': 'a'.repeat(64) } }))
  assert.throws(() => planTestRun(repo, 'all'), /Invalid parallel/)
  symlinkSync('a.test.mjs', join(repo, 'tests/link.test.mjs'))
  assert.throws(() => discoverTests(repo), /regular file/)
  const empty = fixture(t)
  rmSync(join(empty.repo, 'tests/a.test.mjs')); rmSync(join(empty.repo, 'tests/b.test.mjs'))
  assert.throws(() => discoverTests(empty.repo), /No top-level/)
})

test('a real failed Node group cannot pass and does not omit remaining groups', async t => {
  const { repo, put, policy } = fixture(t)
  put('tests/a.test.mjs', "import test, { after } from 'node:test'; test('deliberate failure', () => { throw Error('expected diagnostic') })\n")
  policy.parallel['tests/a.test.mjs'] = digest(readFileSync(join(repo, 'tests/a.test.mjs')))
  put('engineering/test-resources.json', JSON.stringify(policy))
  const result = await runTestPlan(repo, planTestRun(repo, 'all'), quiet)
  assert.equal(result.status, 'failed')
  assert.equal(result.complete, true)
  assert.equal(result.results.length, 2)
  assert.notEqual(result.results[0].exitCode, 0)
  assert.equal(result.results[1].status, 'passed')
})

function fakeLaunch({ exitCode = 0, signal = null, error = null, interrupt = null, signals } = {}) {
  return () => {
    const child = new EventEmitter()
    child.exitCode = null; child.signalCode = null
    child.kill = value => { child.forwardedSignal = value; return true }
    queueMicrotask(() => {
      if (interrupt) signals.emit(interrupt)
      if (error) child.emit('error', new Error(error))
      child.emit('close', exitCode, signal)
    })
    return child
  }
}

test('launch errors, native signals and interrupted zero-exit children cannot pass', async t => {
  const { repo } = fixture(t), plan = planTestRun(repo, 'all')
  for (const variant of [{ error: 'ENOENT' }, { signal: 'SIGKILL', exitCode: null }, { interrupt: 'SIGTERM' }]) {
    const signals = new EventEmitter()
    const result = await runTestPlan(repo, plan, { ...quiet, signals, launch: fakeLaunch({ ...variant, signals }) })
    assert.equal(result.status, 'failed')
    assert.equal(result.complete, false)
    assert.equal(result.results.length, 1)
    assert.equal(signals.listenerCount('SIGTERM'), 0)
    assert.equal(signals.listenerCount('SIGINT'), 0)
  }
})

test('native zero exit passes an executed focus without claiming a full gate', async t => {
  const { repo } = fixture(t)
  const result = await runTestPlan(repo, planTestRun(repo, 'focus', ['tests/a.test.mjs']), quiet)
  assert.equal(result.status, 'passed')
  assert.equal(result.fullSuite, false)
  assert.equal(result.complete, true)
})

test('empty, duplicate and incomplete execution plans cannot become a pass', async t => {
  const { repo } = fixture(t)
  for (const plan of [
    { files: [], groups: [] },
    { files: ['tests/a.test.mjs', 'tests/a.test.mjs'], groups: [{ concurrency: 1, files: ['tests/a.test.mjs'] }] },
    { files: ['tests/a.test.mjs', 'tests/b.test.mjs'], groups: [{ concurrency: 1, files: ['tests/a.test.mjs'] }] },
  ]) await assert.rejects(runTestPlan(repo, plan, quiet), /must not be empty|Duplicate|cover every/)
})

test('environment selection and both isolation aliases are rejected, including quoted flags', async t => {
  const { repo } = fixture(t), plan = planTestRun(repo, 'all')
  const previous = process.env.NODE_OPTIONS
  try {
    for (const option of ['--test-only', '--test-name-pattern=one', '--test-shard=1/2',
      '--test-isolation=none', '--experimental-test-isolation=none', '"--test-only"', '"--test-isolation=none"']) {
      process.env.NODE_OPTIONS = option
      await assert.rejects(runTestPlan(repo, plan, quiet), /must not change test selection or isolation/)
    }
  } finally {
    if (previous === undefined) delete process.env.NODE_OPTIONS
    else process.env.NODE_OPTIONS = previous
  }
})

test('real Node skip, TODO and unfiltered only-marker semantics stay intact', async t => {
  const { repo, put } = fixture(t)
  put('tests/semantics.test.mjs', `import test, { after } from 'node:test';
    test('ordinary', () => {}); test.only('only marker without filtering', () => {});
    test.skip('skip', () => { throw Error('must stay skipped') }); test.todo('todo');
  `)
  let stdout = ''
  const launch = (command, args, options) => {
    const child = spawn(command, args, { ...options, stdio: ['ignore', 'pipe', 'pipe'] })
    child.stdout.on('data', bytes => { stdout += bytes })
    child.stderr.resume()
    return child
  }
  const result = await runTestPlan(repo, planTestRun(repo, 'focus', ['tests/semantics.test.mjs']), { ...quiet, launch })
  assert.equal(result.status, 'passed')
  assert.match(stdout, /^# tests 4$/m)
  assert.match(stdout, /^# pass 2$/m)
  assert.match(stdout, /^# fail 0$/m)
  assert.match(stdout, /^# skipped 1$/m)
  assert.match(stdout, /^# todo 1$/m)
})

test('production-only source/data and dependency changes require renewed resource review', t => {
  for (const [path, content] of [['app/source.ts', 'export const value = 2'],
    ['app/new-data.json', '{}'], ['tsconfig.json', '{"strict":true}'],
    ['node_modules/.package-lock.json', '{"changed":true}'], ['package.json', '{"type":"commonjs"}'], ['package-lock.json', '{"changed":true}']]) {
    const { repo, put } = fixture(t)
    assert.equal(planTestRun(repo, 'all').groups[0].concurrency, 2)
    put(path, content)
    assert.equal(planTestRun(repo, 'all').groups.length, 1)
    assert.equal(planTestRun(repo, 'all').groups[0].concurrency, 1)
    assert.deepEqual(planTestRun(repo, 'all').files, discoverTests(repo))
  }
})

test('runtime preloads/customization and application symlinks conservatively use serial execution', t => {
  const { repo } = fixture(t)
  for (const key of ['NODE_OPTIONS', 'NODE_PATH', 'NODE_COMPILE_CACHE', 'NODE_V8_COVERAGE']) {
    const previous = process.env[key]
    try {
      process.env[key] = key === 'NODE_OPTIONS' ? '--max-old-space-size=1024' : '/custom-modules'
      assert.equal(planTestRun(repo, 'all').groups.length, 1)
      assert.equal(planTestRun(repo, 'all').groups[0].concurrency, 1)
    } finally {
      if (previous === undefined) delete process.env[key]
      else process.env[key] = previous
    }
  }
  symlinkSync('source.ts', join(repo, 'app/alias.ts'))
  assert.equal(planTestRun(repo, 'all').groups[0].concurrency, 1)
  assert.deepEqual(planTestRun(repo, 'all').files, discoverTests(repo))
})
