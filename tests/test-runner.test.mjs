import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test, { after } from 'node:test'
import { discoverTests, helperFingerprint, productionFingerprint, planTestRun, runTestPlan, partitionTestFiles, planTestShard, shardInputFingerprint, runTestShard, parseShardArguments } from '../scripts/orchestration/test-runner.mjs'

// These synthetic inventories explicitly model an uncustomized Node runtime.
// The environment-fallback regression below supplies customizations separately.
const nodeRuntimeKeys = ['NODE_OPTIONS', 'NODE_PATH', 'NODE_COMPILE_CACHE', 'NODE_V8_COVERAGE']
const sceneFixtureKeys = ['PND_SCENE_FIXTURE_PRECOMPILED', 'PND_SCENE_FIXTURE_PRECOMPILED_SHA256']
const inheritedRuntime = Object.fromEntries([...nodeRuntimeKeys, ...sceneFixtureKeys].map(key => [key, process.env[key]]))
for (const key of nodeRuntimeKeys) process.env[key] = ''
for (const key of sceneFixtureKeys) delete process.env[key]
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

test('standard plans, execution and shard certification reject any external fixture-cache setting', async t => {
  const { repo, put } = fixture(t)
  put('tests/c.test.mjs', 'export {}\n')
  put('tests/d.test.mjs', 'export {}\n')
  put('scripts/check.mjs', 'export {}\n')
  const plan = planTestRun(repo, 'focus', ['tests/a.test.mjs'])
  const shard = planTestShard(repo, 0)
  const fingerprint = shardInputFingerprint(repo)
  const [pathKey, hashKey] = sceneFixtureKeys
  for (const values of [
    { [pathKey]: '/private/manifest.json' }, { [hashKey]: 'a'.repeat(64) },
    { [pathKey]: '/private/manifest.json', [hashKey]: 'a'.repeat(64) },
    { [pathKey]: '' }, { [hashKey]: '' }, { [pathKey]: '', [hashKey]: '' },
    { [pathKey]: '', [hashKey]: 'a'.repeat(64) }, { [pathKey]: '/private/manifest.json', [hashKey]: '' },
  ]) {
    try {
      Object.assign(process.env, values)
      const expected = /explicit source-bound direct command/
      for (const mode of ['all', 'serial', 'focus'])
        assert.throws(() => planTestRun(repo, mode, mode === 'focus' ? ['tests/a.test.mjs'] : []), expected)
      assert.throws(() => planTestShard(repo, 0), expected)
      assert.throws(() => shardInputFingerprint(repo), expected)
      let launches = 0
      const options = { ...quiet, launch() { launches++; throw new Error('must not launch') } }
      // Plans were built before the setting appeared; execution must reject too.
      await assert.rejects(runTestPlan(repo, plan, options), expected)
      await assert.rejects(runTestShard(repo, shard, options), expected)
      assert.equal(launches, 0)
    } finally {
      for (const key of sceneFixtureKeys) delete process.env[key]
    }
  }
  assert.deepEqual(planTestRun(repo, 'focus', ['tests/a.test.mjs']), plan)
  assert.equal(shardInputFingerprint(repo), fingerprint)
})

function pnpmFixture(t, external = false) {
  const f = fixture(t)
  rmSync(join(f.repo, 'node_modules/.package-lock.json'))
  const profile = external ? join(f.repo, 'private-profile') : f.repo
  const putProfile = (name, value) => f.put(external ? `private-profile/${name}` : name, value)
  if (external) {
    rmSync(join(f.repo, 'node_modules'), { recursive: true })
    putProfile('package.json', readFileSync(join(f.repo, 'package.json')))
    putProfile('package-lock.json', readFileSync(join(f.repo, 'package-lock.json')))
  }
  putProfile('pnpm-lock.yaml', 'lockfileVersion: 9.0\n')
  putProfile('pnpm-workspace.yaml', 'nodeLinker: isolated\npackageImportMethod: hardlink\n')
  putProfile('node_modules/.modules.yaml', 'packageManager: pnpm@11.25.0\nvirtualStoreDir: .pnpm\n')
  putProfile('node_modules/.pnpm/lock.yaml', 'lockfileVersion: 9.0\n')
  if (external) symlinkSync(join(profile, 'node_modules'), join(f.repo, 'node_modules'))
  return { ...f, profile, putProfile }
}

test('ordinary npm fingerprint keeps its exact existing schema', t => {
  const { repo } = fixture(t)
  const app = digest(JSON.stringify([['app/source.ts', digest(readFileSync(join(repo, 'app/source.ts')))]]))
  const paths = ['package.json', 'package-lock.json', 'tsconfig.json', 'node_modules/.package-lock.json']
  assert.equal(productionFingerprint(repo), digest(JSON.stringify({ app,
    packages: paths.map(path => [path, digest(readFileSync(join(repo, path)))]),
    runtime: { node: process.versions.node, platform: process.platform, arch: process.arch } })))
})

for (const external of [false, true]) test(`pnpm ${external ? 'private linked' : 'in-checkout'} profile binds genuine metadata and forces npm policy fallback`, t => {
  const { repo, put, putProfile } = pnpmFixture(t, external)
  const original = productionFingerprint(repo)
  assert.match(original, /^[a-f0-9]{64}$/)
  assert.equal(planTestRun(repo, 'all').parallelEligibility, 'production-config-runtime-drift')
  for (const path of ['package.json', 'package-lock.json', 'pnpm-workspace.yaml', 'node_modules/.modules.yaml']) {
    const full = join(external ? join(repo, 'private-profile') : repo, path)
    const bytes = readFileSync(full)
    putProfile(path, Buffer.concat([bytes, Buffer.from('\n')]))
    assert.notEqual(productionFingerprint(repo), original, path)
    putProfile(path, bytes)
  }
  putProfile('pnpm-lock.yaml', 'lockfileVersion: 9.1\n')
  assert.equal(productionFingerprint(repo), null, 'Changed desired lock must not accept the old installed lock')
  putProfile('node_modules/.pnpm/lock.yaml', 'lockfileVersion: 9.1\n')
  assert.notEqual(productionFingerprint(repo), original, 'Both genuine locks participate')
  put('tsconfig.json', '{"compilerOptions":{}}')
  assert.notEqual(productionFingerprint(repo), original)
})

test('missing, mixed or symlinked dependency metadata cannot enable parallel eligibility', t => {
  const { repo, profile, putProfile } = pnpmFixture(t, true)
  putProfile('node_modules/.package-lock.json', '{}')
  assert.equal(productionFingerprint(repo), null)
  rmSync(join(profile, 'node_modules/.package-lock.json'))
  rmSync(join(profile, 'pnpm-workspace.yaml'))
  assert.equal(productionFingerprint(repo), null)
  assert.equal(planTestRun(repo, 'all').parallelEligibility, 'production-config-runtime-drift')
  symlinkSync(join(repo, 'package.json'), join(profile, 'pnpm-workspace.yaml'))
  assert.equal(productionFingerprint(repo), null)
})

test('an absent npm installed lock safely selects serial fallback rather than crashing', t => {
  const { repo } = fixture(t)
  rmSync(join(repo, 'node_modules/.package-lock.json'))
  assert.equal(productionFingerprint(repo), null)
  assert.equal(planTestRun(repo, 'all').parallelEligibility, 'production-config-runtime-drift')
})

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

test('shared helper code and data edits or additions invalidate only the shared resource boundary', t => {
  const paths = [
    'tests/helpers/checkpoint.ts', 'tests/helpers/helper.mts', 'tests/helpers/helper.cts',
    'tests/helpers/helper.js', 'tests/helpers/helper.cjs', 'tests/fixtures/input.json',
    'tests/fixtures/input.bin', 'tests/support/README.md', 'tests/nested/extra.test.mjs',
    'tests/.hidden.test.mjs',
  ]
  for (const path of paths) for (const added of [false, true]) {
    const { repo, put, policy } = fixture(t)
    if (!added) put(path, 'original shared input\n')
    policy.helpersSha256 = helperFingerprint(repo)
    put('engineering/test-resources.json', JSON.stringify(policy))
    const files = discoverTests(repo),
      testHashes = files.map(file => digest(readFileSync(join(repo, file)))),
      production = productionFingerprint(repo)
    assert.equal(planTestRun(repo, 'all').parallelEligibility, 'reviewed')
    assert.equal(planTestRun(repo, 'all').groups[0].concurrency, 2)

    put(path, 'changed shared input\n')
    assert.notEqual(helperFingerprint(repo), policy.helpersSha256, path)
    assert.equal(productionFingerprint(repo), production, path)
    assert.deepEqual(files.map(file => digest(readFileSync(join(repo, file)))), testHashes, path)
    const plan = planTestRun(repo, 'all')
    assert.equal(plan.parallelEligibility, 'shared-helper-drift', path)
    assert.deepEqual(plan.files, files, path)
    assert.deepEqual(plan.groups, [{ concurrency: 1, files }], path)
    assert.deepEqual(plan.groups.flatMap(group => group.files).sort(), files, path)
  }
})

test('top-level test changes retain individual classification without shared helper drift', t => {
  const { repo, put, policy } = fixture(t)
  policy.parallel['tests/b.test.mjs'] = digest(readFileSync(join(repo, 'tests/b.test.mjs')))
  put('engineering/test-resources.json', JSON.stringify(policy))
  const helpers = helperFingerprint(repo), production = productionFingerprint(repo)
  assert.deepEqual(planTestRun(repo, 'all').groups,
    [{ concurrency: 2, files: ['tests/a.test.mjs', 'tests/b.test.mjs'] }])

  put('tests/a.test.mjs', '// changed individually reviewed test\n')
  put('tests/c.test.mjs', '// new unclassified test\n')
  assert.equal(helperFingerprint(repo), helpers)
  assert.equal(productionFingerprint(repo), production)
  const plan = planTestRun(repo, 'all'), files = discoverTests(repo)
  assert.equal(plan.parallelEligibility, 'reviewed')
  assert.deepEqual(plan.groups, [
    { concurrency: 2, files: ['tests/b.test.mjs'] },
    { concurrency: 1, files: ['tests/a.test.mjs', 'tests/c.test.mjs'] },
  ])
  assert.deepEqual(plan.files, files)
  assert.deepEqual(plan.groups.flatMap(group => group.files).sort(), files)
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

function shardFixture(t) {
  const result = fixture(t)
  for (const name of ['c', 'd', 'e', 'f', 'g', 'h', 'i'])
    result.put(`tests/${name}.test.mjs`, `import test from 'node:test'; test('${name}', () => {})\n`)
  result.put('scripts/runner.mjs', 'export {}\n')
  return result
}

test('fixed four-way shards partition every discovered file exactly once without changing resource policy', t => {
  const { repo } = shardFixture(t)
  const all = planTestRun(repo, 'all')
  const plans = Array.from({ length: 4 }, (_, index) => planTestShard(repo, index, 4))
  assert.deepEqual(plans.flatMap(plan => plan.files).sort(), all.files)
  assert.equal(new Set(plans.flatMap(plan => plan.files)).size, all.files.length)
  for (const [index, plan] of plans.entries()) {
    assert.equal(plan.fullSuite, false)
    assert.equal(plan.mode, 'shard')
    assert.deepEqual(plan.discovered, all.files)
    assert.deepEqual(plan.files, all.files.filter((_, offset) => offset % 4 === index))
    assert.equal(plan.parallelEligibility, all.parallelEligibility)
    assert.deepEqual(plan.groups, all.groups.map(group => ({ ...group, files: group.files.filter(file => plan.files.includes(file)) })).filter(group => group.files.length))
    assert(Object.isFrozen(plan) && Object.isFrozen(plan.groups[0].files))
  }
  assert.deepEqual(partitionTestFiles([...all.files].reverse(), 0), plans[0].files)
})

test('shard arguments reject partial, invalid, duplicate and selection-spoofing inputs', t => {
  const { repo } = shardFixture(t)
  for (const index of [-1, 4, 0.5, '0', NaN]) assert.throws(() => planTestShard(repo, index, 4), /Shard index/)
  for (const count of [0, 1, 2, 3, 5, '4', NaN]) assert.throws(() => planTestShard(repo, 0, count), /Shard count/)
  for (const args of [[], ['--shard-index=0'], ['--shard-count=4'],
    ['--shard-index=0', '--shard-count=4'],
    ['--shard-index=04', '--shard-count=4', '--receipt=x'],
    ['--shard-index=0', '--shard-count=4', '--receipt=x', '--shard-index=1'],
    ['--shard-index=0', '--shard-count=4', '--receipt=x', '--test-only']])
    assert.throws(() => parseShardArguments(args), /Shard|unique/)
  assert.deepEqual(parseShardArguments(['--shard-index=3', '--shard-count=4', '--receipt=work/shard.json']), { index: 3, count: 4, receipt: 'work/shard.json' })
  assert.throws(() => partitionTestFiles(['tests/a.test.mjs'], 0), /at least four/)
  assert.throws(() => partitionTestFiles(Array(4).fill('tests/a.test.mjs'), 0), /Duplicate/)
})

test('shard prelaunch rejects discovery, content and receipt-plan identity drift without launching', async t => {
  for (const path of ['tests/new.test.mjs', 'tests/a.test.mjs', 'scripts/runner.mjs', 'app/source.ts', 'node_modules/.package-lock.json']) {
    const { repo, put } = shardFixture(t), plan = planTestShard(repo, 0)
    put(path, '// changed\n')
    let launched = false
    await assert.rejects(runTestShard(repo, plan, { ...quiet, launch() { launched = true } }), /drift/)
    assert.equal(launched, false)
  }
  const { repo } = shardFixture(t)
  const plan = structuredClone(planTestShard(repo, 0))
  plan.shard.index = 1
  await assert.rejects(runTestShard(repo, plan, quiet), /drift/)
  plan.shard.index = 0; plan.groups[0].files.push(plan.groups[0].files[0])
  await assert.rejects(runTestShard(repo, plan, quiet), /drift/)
})

test('shard receipt binds executed groups and never claims full suite or passes mutation', async t => {
  const { repo, put } = shardFixture(t), plan = planTestShard(repo, 0)
  const receipt = await runTestShard(repo, plan, { ...quiet, launch: fakeLaunch() })
  assert.equal(receipt.kind, 'pnd-test-shard-receipt')
  assert.equal(receipt.inputsBefore, receipt.inputsAfter)
  assert.equal(receipt.inputsBefore, plan.inputFingerprint)
  assert.equal(receipt.inputsBefore, shardInputFingerprint(repo))
  assert.equal(receipt.result.fullSuite, false)
  assert.equal(receipt.result.shardComplete, true)
  assert.equal(receipt.result.status, 'passed')
  assert.deepEqual(receipt.result.results.flatMap(result => result.files).sort(), [...plan.files].sort())
  for (const [index, result] of receipt.result.results.entries()) {
    assert.deepEqual(result.command, [process.execPath, '--test', `--test-concurrency=${plan.groups[index].concurrency}`, '--test-reporter=tap', ...plan.groups[index].files])
  }
  const mutated = await runTestShard(repo, plan, { ...quiet, launch(...args) {
    put('tests/introduced.test.mjs', '// discovered during run\n')
    return fakeLaunch()(...args)
  } })
  assert.notEqual(mutated.inputsBefore, mutated.inputsAfter)
  assert.equal(mutated.result.status, 'failed')
  assert.equal(mutated.result.shardComplete, false)
})

test('shard signals, failed groups and inherited test-selection flags cannot certify success', async t => {
  const { repo } = shardFixture(t), plan = planTestShard(repo, 0)
  for (const variant of [{ exitCode: 1 }, { exitCode: null, signal: 'SIGTERM' }, { error: 'ENOENT' }]) {
    const receipt = await runTestShard(repo, plan, { ...quiet, launch: fakeLaunch(variant) })
    assert.equal(receipt.result.status, 'failed')
    assert.equal(receipt.result.fullSuite, false)
  }
  process.env.NODE_OPTIONS = '--test-only'
  try {
    await assert.rejects(runTestShard(repo, planTestShard(repo, 0), quiet), /must not change test selection or isolation/)
  } finally { process.env.NODE_OPTIONS = '' }
})

test('real native shard execution writes a source-bound terminal receipt and refuses an existing receipt', async t => {
  const { repo, put } = shardFixture(t)
  put('scripts/orchestration/test-runner.mjs', readFileSync(new URL('../scripts/orchestration/test-runner.mjs', import.meta.url)))
  put('scripts/orchestration/dependency-profile.mjs', readFileSync(new URL('../scripts/orchestration/dependency-profile.mjs', import.meta.url)))
  const output = join(repo, 'shard.json')
  const cli = () => new Promise(resolve => {
    const child = spawn(process.execPath, [join(repo, 'scripts/orchestration/test-runner.mjs'), 'shard',
      '--shard-index=0', '--shard-count=4', `--receipt=${output}`], { env: { ...process.env, NODE_TEST_CONTEXT: '' } })
    let stdout = '', stderr = ''
    child.stdout.on('data', bytes => { stdout += bytes })
    child.stderr.on('data', bytes => { stderr += bytes })
    child.once('close', exitCode => resolve({ exitCode, stdout, stderr }))
  })
  const result = await cli()
  assert.equal(result.exitCode, 0, result.stderr)
  const receipt = JSON.parse(readFileSync(output, 'utf8'))
  assert.equal(receipt.result.status, 'passed')
  assert.equal(receipt.result.shardComplete, true)
  assert.equal(receipt.result.fullSuite, false)
  assert.deepEqual(receipt.result.results.flatMap(group => group.files).sort(), ['tests/a.test.mjs', 'tests/e.test.mjs', 'tests/i.test.mjs'])
  const before = readFileSync(output, 'utf8'), duplicate = await cli()
  assert.equal(duplicate.exitCode, 1)
  assert.match(duplicate.stderr, /EEXIST/)
  assert.equal(duplicate.stdout, '')
  assert.equal(readFileSync(output, 'utf8'), before)
})

test('shards suppress Python importer bytecode without changing ordinary runner environment', async t => {
  const { repo, put } = shardFixture(t)
  put('scripts/importer.py', 'value = 1\n')
  put('tests/a.test.mjs', `import test from 'node:test'; import assert from 'node:assert/strict'; import { spawnSync } from 'node:child_process';
    test('import', () => {
      const result = spawnSync('python3', ['-c', "import importlib.util; s=importlib.util.spec_from_file_location('sample','scripts/importer.py'); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); assert m.value == 1"], { encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
    });\n`)
  const receipt = await runTestShard(repo, planTestShard(repo, 0), quiet)
  assert.equal(receipt.result.status, 'passed')
  assert.equal(receipt.inputsAfter, receipt.inputsBefore)
  const inherited = process.env.PYTHONDONTWRITEBYTECODE
  await runTestPlan(repo, planTestRun(repo, 'focus', ['tests/b.test.mjs']), { ...quiet, launch(command, args, options) {
    assert.equal(options.env.PYTHONDONTWRITEBYTECODE, inherited)
    return fakeLaunch()(command, args, options)
  } })
})

test('optional timing reporter preserves shard scheduling, TAP and failures without making diagnostics mandatory', async t => {
  for (const fail of [false, true]) {
    const { repo, put } = shardFixture(t)
    put('scripts/orchestration/test-timing-reporter.mjs', readFileSync(new URL('../scripts/orchestration/test-timing-reporter.mjs', import.meta.url)))
    put('tests/a.test.mjs', `import test from 'node:test'; test('timing fixture', () => { ${fail ? "throw Error('expected fixture failure')" : ''} });`)
    const plan = planTestShard(repo, 0)
    const outputs = []
    const launch = (command, args, options) => {
      const child = spawn(command, args, { ...options, stdio: ['ignore', 'pipe', 'pipe'] })
      let stdout = '', stderr = ''
      child.stdout.on('data', data => { stdout += data }); child.stderr.on('data', data => { stderr += data })
      child.on('close', () => outputs.push({ stdout, stderr }))
      return child
    }
    const legacy = await runTestShard(repo, plan, { ...quiet, launch })
    const timed = await runTestShard(repo, plan, { ...quiet, launch, timings: 'summary-v1' })
    assert.equal(timed.result.status, legacy.result.status)
    assert.deepEqual(timed.plan, legacy.plan)
    assert.equal(timed.inputsBefore, timed.inputsAfter)
    assert.deepEqual(timed.result.results.map(g => [g.files, g.concurrency, g.exitCode]), legacy.result.results.map(g => [g.files, g.concurrency, g.exitCode]))
    assert.ok(outputs.every(o => o.stdout.startsWith('TAP version 13')))
    const rows = plan.groups.flatMap((_, index) => readFileSync(join(repo, `work/ci/timings/shard-0-group-${index}.jsonl`), 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse))
    assert.deepEqual(rows.map(r => r.file).sort(), [...plan.files].sort())
    for (const row of rows) {
      assert.equal(row.kind, 'node-test-summary-duration'); assert.equal(row.version, 1)
      assert.equal(row.node, process.versions.node); assert.ok(row.durationMs >= 0)
      assert.equal(row.fileSha256, digest(readFileSync(join(repo, row.file))))
      assert.equal(row.reporterSha256, digest(readFileSync(join(repo, 'scripts/orchestration/test-timing-reporter.mjs'))))
    }
    assert.equal(rows.find(r => r.file === 'tests/a.test.mjs').success, !fail)
    const original = readFileSync(join(repo, 'work/ci/timings/shard-0-group-0.jsonl'), 'utf8')
    // Existing destinations cannot be overwritten. Diagnostics unavailable must
    // not change either a successful test result or a genuine failing result.
    const duplicate = await runTestShard(repo, plan, { ...quiet, launch, timings: 'summary-v1' })
    assert.equal(duplicate.result.status, legacy.result.status)
    assert.equal(readFileSync(join(repo, 'work/ci/timings/shard-0-group-0.jsonl'), 'utf8'), original)
    assert.ok(outputs.some(o => o.stderr.includes('PND_TIMING_DIAGNOSTIC_UNAVAILABLE')))
  }
})

test('timing CLI accepts only its fixed version, with no destination or arbitrary reporter flags', () => {
  const base = ['--shard-index=0', '--shard-count=4', '--receipt=work/ci/shard.json']
  assert.equal(parseShardArguments([...base, '--timings=summary-v1']).timings, 'summary-v1')
  for (const extra of [ ['--timings=../../escape'], ['--timings=summary-v2'], ['--timings=summary-v1', '--timings=summary-v1'],
    ['--timing-destination=/tmp/x'], ['--test-reporter=evil'], ['--test-reporter-destination=stdout'] ])
    assert.throws(() => parseShardArguments([...base, ...extra]))
})

test('timing diagnostics reject directory symlinks without touching their target or altering test results', async t => {
  const { repo, put } = shardFixture(t)
  put('scripts/orchestration/test-timing-reporter.mjs', readFileSync(new URL('../scripts/orchestration/test-timing-reporter.mjs', import.meta.url)))
  mkdirSync(join(repo, 'external')); symlinkSync('external', join(repo, 'work'))
  const plan = planTestShard(repo, 0)
  const result = await runTestShard(repo, plan, { ...quiet, timings: 'summary-v1' })
  assert.equal(result.result.status, 'passed')
  assert.deepEqual(readdirSync(join(repo, 'external')), [])
})
