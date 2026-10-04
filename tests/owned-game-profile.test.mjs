import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { acquireProfile, persistentLaunchOptions, profileInputReceipt, validateProfilePaths } from '../scripts/local-render/owned-profile.mjs'
import { launchOptions, parseOptions } from '../scripts/local-render/harness.mjs'
import { readCommittedCheckpoint } from '../scripts/local-render/checkpoint-observer.mjs'

function fixture(fn) {
  const root = mkdtempSync(resolve(tmpdir(), 'owned-game-profile-'))
  try {
    execFileSync('git', ['init', root], { stdio: 'pipe' })
    writeFileSync(resolve(root, '.gitignore'), '/work/\n')
    mkdirSync(resolve(root, 'app')); writeFileSync(resolve(root, 'app/game.ts'), 'genuine game input')
    mkdirSync(resolve(root, 'qa')); writeFileSync(resolve(root, 'qa/driver.mjs'), 'checker source')
    const output = resolve(root, 'work/evidence/run-1'); mkdirSync(output, { recursive: true })
    const args = { path: resolve(root, 'work/local-render-profiles/mission-three'), root, origin: 'http://127.0.0.1:4366', source: { fingerprint: 'source-1', commit: 'commit-1' }, inputs: profileInputReceipt(root), runtime: { browser: 'official-binary-hash', playwright: 'installed-package-hash' }, output }
    return fn(args)
  } finally { rmSync(root, { recursive: true, force: true }) }
}
function finish(lease, args, extra = {}) {
  const receipt = { status: 'passed', profile: { ...lease.profile, cleanupVerified: true, continuationVerified: true, checkpointAtEnd: { checkpointSha256: 'committed-save', level: 3, turn: 2450 }, ...extra } }
  writeFileSync(resolve(args.output, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n')
  lease.finish(receipt, true)
  return receipt
}

test('ephemeral default stays opt-in; persistent launch keeps sandbox and explicit data-dir', () => {
  assert.equal(parseOptions([]).profile, undefined)
  assert.throws(() => parseOptions(['--profile-correspondence', '/tmp/review.json']), /requires --profile/)
  const launch = persistentLaunchOptions(launchOptions('/official-shell'), '/owned/browser')
  assert.equal(launch.chromiumSandbox, true); assert.equal(launch.ignoreDefaultArgs, true)
  assert.deepEqual(launch.args, ['--remote-debugging-pipe', '--user-data-dir=/owned/browser', 'about:blank'])
  assert.equal(launch.acceptDownloads, false)
})
test('unknown personal, noncanonical, existing unmarked and symlink directories fail before adoption', () => fixture(args => {
  for (const path of ['/tmp/personal-profile', args.path + '/../mission-three', 'work/local-render-profiles/mission-three']) assert.throws(() => acquireProfile({ ...args, path }), /canonical absolute/)
  mkdirSync(args.path, { recursive: true, mode: 0o700 })
  writeFileSync(resolve(args.path, 'personal-data'), 'must remain untouched')
  assert.throws(() => acquireProfile(args))
  assert.equal(readFileSync(resolve(args.path, 'personal-data'), 'utf8'), 'must remain untouched')
  rmSync(args.path, { recursive: true })
  symlinkSync(args.output, args.path)
  assert.throws(() => acquireProfile(args), /real directory/)
}))
test('symlink ancestor and evidence overlap are rejected', () => fixture(args => {
  symlinkSync(args.output, resolve(args.root, 'work/local-render-profiles'))
  assert.throws(() => acquireProfile(args), /real directory/)
  assert.throws(() => acquireProfile({ ...args, output: args.path }), /overlap/)
  assert.throws(() => acquireProfile({ ...args, output: resolve(args.root, 'work') }), /overlap/)
}))
test('an output symlink cannot alias profile data before preflight creates logs', () => fixture(args => {
  const lease = acquireProfile(args), alias = resolve(args.root, 'work/profile-alias')
  symlinkSync(lease.dataDir, alias)
  assert.throws(() => validateProfilePaths(args.root, args.path, alias), /real directory/)
  assert.equal(existsSync(resolve(lease.dataDir, 'server.log')), false)
}))
test('exclusive live and unknown locks are never recovered, and failed cleanup keeps ownership', () => fixture(args => {
  const lease = acquireProfile(args), lock = resolve(args.path, 'owner.lock')
  assert.throws(() => acquireProfile(args), /terminal provenance/)
  assert.throws(() => lease.finish({}, false), /lock retained/)
  assert.equal(existsSync(lock), true)
  finish(lease, args)
  writeFileSync(lock, 'unknown owner', { mode: 0o600 })
  assert.throws(() => acquireProfile(args), /EEXIST/)
  assert.equal(readFileSync(lock, 'utf8'), 'unknown owner')
}))
test('normal terminal cleanup retains checkpoint identity across a new exclusive run', () => fixture(args => {
  const first = acquireProfile(args), original = finish(first, args)
  assert.equal(existsSync(resolve(args.path, 'owner.lock')), false)
  const second = acquireProfile(args)
  assert.equal(second.profile.id, first.profile.id)
  assert.notEqual(second.profile.runId, first.profile.runId)
  assert.equal(second.profile.mode, 'reused')
  assert.equal(second.profile.previousRun.runId, first.profile.runId)
  assert.deepEqual(second.profile.previousRun.checkpointAtEnd, original.profile.checkpointAtEnd)
  assert.throws(() => acquireProfile(args), /EEXIST/)
  finish(second, args)
}))
test('source/runtime/origin drift cannot silently adopt a game save', () => fixture(args => {
  finish(acquireProfile(args), args)
  for (const changes of [{ origin: 'http://127.0.0.1:9999' }, { runtime: { browser: 'changed' } }, { inputs: { ...args.inputs, application: 'changed-app' } }]) assert.throws(() => acquireProfile({ ...args, ...changes }), /do not match/)
  assert.throws(() => acquireProfile({ ...args, source: { fingerprint: 'source-2' } }), /reviewed correspondence/)
  const before = profileInputReceipt(args.root)
  writeFileSync(resolve(args.root, 'qa/driver.mjs'), 'changed strategy')
  const checkerChanged = profileInputReceipt(args.root)
  assert.equal(checkerChanged.application, before.application)
  assert.notEqual(checkerChanged.checker, before.checker)
  writeFileSync(resolve(args.root, 'app/game.ts'), 'changed game')
  assert.notEqual(profileInputReceipt(args.root).application, before.application)
}))
test('checker-only correspondence must bind prior run and both exact source identities', () => fixture(args => {
  const first = acquireProfile(args); finish(first, args)
  const next = { ...args, source: { fingerprint: 'source-2', commit: 'commit-2' }, inputs: { ...args.inputs, checker: 'checker-2' }, correspondence: resolve(args.output, 'review.json') }
  const review = { priorRunId: first.profile.runId, previousSourceFingerprint: args.source.fingerprint, currentSourceFingerprint: next.source.fingerprint, previousChecker: args.inputs.checker, currentChecker: next.inputs.checker, decision: 'ACCEPT', reviewer: 'independent-reviewer', reference: 'retained exact-source review' }
  writeFileSync(next.correspondence, JSON.stringify({ ...review, currentSourceFingerprint: 'wrong' }))
  assert.throws(() => acquireProfile(next), /exact continuation/)
  writeFileSync(next.correspondence, JSON.stringify(review))
  const second = acquireProfile(next)
  assert.equal(second.profile.correspondence.decision, 'ACCEPT')
  finish(second, next)
}))
test('unverified source and changed terminal ownership remain blocked', () => fixture(args => {
  const first = acquireProfile(args); finish(first, args, { continuationVerified: false })
  assert.throws(() => acquireProfile(args), /terminal provenance/)
}))
test('lease refuses a replaced lock and leaves that owner untouched', () => fixture(args => {
  const lease = acquireProfile(args), lock = resolve(args.path, 'owner.lock')
  writeFileSync(lock, JSON.stringify({ runId: 'another owner' }))
  assert.throws(() => finish(lease, args), /ownership changed/)
  assert.deepEqual(JSON.parse(readFileSync(lock, 'utf8')), { runId: 'another owner' })
}))
test('leftover Chromium ownership and replaced data directory block reuse', () => fixture(args => {
  finish(acquireProfile(args), args)
  const data = resolve(args.path, 'browser'), singleton = resolve(data, 'SingletonLock')
  symlinkSync('/unknown-owner', singleton)
  assert.throws(() => acquireProfile(args), /browser ownership marker/)
  rmSync(singleton)
  rmSync(data, { recursive: true }); symlinkSync(args.output, data)
  assert.throws(() => acquireProfile(args), /real directory/)
}))
test('committed readback is readonly, awaits completion, and hashes typed arrays/Map/Set contents', async () => {
  let record = { version: 1, world: { outcome: { level: 3 }, turn: 45, time: 2, units: [], terrain: [1, 2], mana: 10, wood: 3, shots: {}, giftCounts: {}, typed: new Uint16Array([1, 2]), map: new Map([[4, { flags: 7 }]]), set: new Set([5]) } }
  let reads = 0, closed = 0, complete = false
  const original = globalThis.indexedDB
  globalThis.indexedDB = {
    databases: async () => [{ name: 'populous-new-dawn' }],
    open() {
      const request = {}
      setTimeout(() => {
        request.result = { objectStoreNames: { contains: () => true }, close: () => closed++, transaction(name, mode) {
          assert.equal(name, 'checkpoints'); assert.equal(mode, 'readonly'); reads++
          const transaction = { objectStore: () => ({ get(key) { assert.equal(key, 'latest'); return { result: structuredClone(record) } } }) }
          setTimeout(() => { complete = true; transaction.oncomplete() }, 1)
          return transaction
        } }
        request.onsuccess()
      }, 0)
      return request
    },
  }
  try {
    const page = { evaluate: fn => fn() }
    const first = await readCommittedCheckpoint(page)
    assert.equal(complete, true); assert.equal(reads, 1); assert.equal(closed, 1)
    assert.equal((await readCommittedCheckpoint(page)).checkpointSha256, first.checkpointSha256)
    for (const mutate of [() => record.world.typed[0]++, () => record.world.map.get(4).flags++, () => record.world.set.add(6)]) {
      const before = await readCommittedCheckpoint(page); mutate()
      assert.notEqual((await readCommittedCheckpoint(page)).checkpointSha256, before.checkpointSha256)
    }
    globalThis.indexedDB.databases = async () => []
    const before = reads
    assert.equal(await readCommittedCheckpoint(page), null)
    assert.equal(reads, before, 'Missing database must not be opened/created')
  } finally { globalThis.indexedDB = original }
})
