import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash, randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { tmpdir, hostname } from 'node:os'
import { isDeepStrictEqual } from 'node:util'
import { RECOVERY, validateRecoveryFacts, verifyClosedCopy, readArtifact,
  createRecoveredSermonRecord, validateRecoveredSermonRecord, digest } from './recovery-admission.mjs'
import { priorCheckpoint } from '../../scripts/local-render/harness.mjs'
import { persistentLaunchOptions } from '../../scripts/local-render/owned-profile.mjs'

const checkpoint = { version: 1, level: 3, turn: 4813, time: 4813 / 12,
  checkpointSha256: '720e96e28b46a029e22a1c97729ead760471c96e4e10c59fd5ae620d5e66f57a',
  actorsSha256: 'a'.repeat(64), terrainSha256: 'b'.repeat(64), stockSha256: 'c'.repeat(64) }
const fixture = () => {
  const source = { root: '/owned', commit: 'd'.repeat(40), fingerprint: 'e'.repeat(64) }
  const target = { root: '/owned', source, inputs: { application: 'f'.repeat(64), checker: '1'.repeat(64) },
    runtime: { browser: 'fixed', harness: 'new-reviewed' }, profile: { id: '12345678-1234-1234-1234-123456789abc', path: '/owned/profile' },
    origin: RECOVERY.origin, scenario: { path: '/owned/qa/mission-three-controls/driver.mjs', sha256: '2'.repeat(64) } }
  const payload = { version: 1, kind: RECOVERY.kind, mappingSha256: RECOVERY.mappingSha256, target,
    predecessor: { kind: 'read-only-checkpoint-copy-validation', gameplay: false, runId: RECOVERY.validatorRunId,
      cleanupScope: 'validator-copy-context-only', checkpoint } }
  const inner = { status: 'passed', cleanupVerified: true, cleanup: { status: 'verified', connected: false }, errors: [],
    sourceCommit: RECOVERY.validatorCommit, inputsBefore: { same: 'bytes' }, inputsAfter: { same: 'bytes' },
    checkpointBefore: checkpoint, checkpointAfter: checkpoint, actors: { units: [
      { id: 50, team: 'yellow', kind: 'brave', hp: 50, native: { id: 50, state: 23, workTarget: 3163, timer: 62 } },
      { id: 3163, team: 'blue', kind: 'preacher', hp: 55, native: { id: 3163 } }] } }
  const outer = { runId: RECOVERY.validatorRunId, status: 'passed', phase: 'finished', exitCode: 0, signal: null,
    source: { headOid: RECOVERY.validatorCommit }, sourceAfter: { headOid: RECOVERY.validatorCommit } }
  const context = { ...target, id: target.profile.id, path: target.profile.path, correspondence: null }
  return { payload, inner, outer, context }
}

test('typed validator predecessor proves only its real copied context and exact reviewed target', () => {
  const f = fixture(), before = structuredClone(f)
  assert.doesNotThrow(() => validateRecoveryFacts(f.payload, f.inner, f.outer, f.context))
  assert.deepEqual(f, before)
  for (const mutate of [f => f.payload.predecessor.gameplay = true,
    f => f.payload.predecessor.runId = RECOVERY.saveRunId, f => f.payload.predecessor.continuationVerified = true,
    f => f.payload.predecessor.sourceFingerprint = 'f'.repeat(64), f => f.inner.cleanup.connected = true,
    f => f.inner.cleanupVerified = false, f => f.inner.errors.push('bad'), f => f.outer.phase = 'running',
    f => f.outer.exitCode = 130, f => f.outer.sourceAfter = {}, f => f.inner.inputsAfter = {},
    f => f.inner.checkpointAfter = { ...checkpoint, turn: 4814 },
    f => f.inner.actors.units[0].native.id = 53, f => f.inner.actors.units[0].native.timer = 61,
    f => f.inner.actors.units[0].native.workTarget = 999, f => f.inner.actors.units[1].native.id = 999,
    f => f.payload.mappingSha256 = '0'.repeat(64), f => f.payload.target.profile.id = RECOVERY.profileId]) {
    const changed = fixture(); mutate(changed)
    assert.throws(() => validateRecoveryFacts(changed.payload, changed.inner, changed.outer, changed.context))
  }
})

test('every recovery source, checker, application, runtime, root, origin, profile and scenario change rejects', () => {
  for (const change of [{ root: '/other' }, { origin: 'http://127.0.0.1:4367' }, { id: 'wrong' }, { path: '/other' },
    { source: {} }, { inputs: { checker: 'wrong' } }, { runtime: {} }, { scenario: {} }, { correspondence: { decision: 'ACCEPT' } }]) {
    const f = fixture()
    assert.throws(() => validateRecoveryFacts(f.payload, f.inner, f.outer, { ...f.context, ...change }))
  }
})

function filesystem(fn) {
  const root = fs.mkdtempSync(path.resolve(tmpdir(), 'sermon-recovery-'))
  try { return fn(root) } finally { fs.rmSync(root, { recursive: true, force: true }) }
}
const inventoryFor = browser => {
  const stat = fs.lstatSync(browser)
  return { directory: { inode: stat.ino, device: stat.dev }, files: fs.readdirSync(browser).map(name => {
    const file = path.resolve(browser, name), s = fs.lstatSync(file)
    return { path: name, kind: 'file', inode: s.ino, device: s.dev, mode: s.mode, uid: s.uid,
      links: s.nlink, bytes: s.size, sha256: digest(fs.readFileSync(file)) }
  }) }
}

test('closed-copy verification binds actual inode/file set and rejects changed bytes, links and ownership markers', () => filesystem(root => {
  const browser = path.resolve(root, 'browser'); fs.mkdirSync(browser, { mode: 0o700 })
  const file = path.resolve(browser, 'storage'); fs.writeFileSync(file, 'actual copied storage')
  const inventory = inventoryFor(browser)
  assert.doesNotThrow(() => verifyClosedCopy(browser, inventory))
  const moved = path.resolve(root, 'moved'); fs.renameSync(browser, moved)
  assert.doesNotThrow(() => verifyClosedCopy(moved, inventory), 'A real same-device rename preserves identity')
  const current = path.resolve(moved, 'storage'); fs.writeFileSync(current, 'changed copied bytes')
  assert.throws(() => verifyClosedCopy(moved, inventory)); fs.writeFileSync(current, 'actual copied storage')
  fs.linkSync(current, path.resolve(root, 'alias')); assert.throws(() => verifyClosedCopy(moved, inventory)); fs.unlinkSync(path.resolve(root, 'alias'))
  fs.symlinkSync('/unknown-process', path.resolve(moved, 'SingletonLock'))
  assert.throws(() => verifyClosedCopy(moved, inventory)); fs.unlinkSync(path.resolve(moved, 'SingletonLock'))
  fs.renameSync(current, path.resolve(root, 'old')); fs.writeFileSync(current, 'actual copied storage')
  assert.throws(() => verifyClosedCopy(moved, inventory), 'A recopy with same bytes is not the actual closed directory')
}))

test('receipt reads reject wrong hashes, symlinks, hardlinks and missing files', () => filesystem(root => {
  const file = path.resolve(root, 'receipt'); fs.writeFileSync(file, '{"status":"passed"}')
  const ref = { path: file, sha256: digest(fs.readFileSync(file)) }
  assert.equal(readArtifact(ref).toString(), '{"status":"passed"}')
  assert.throws(() => readArtifact({ ...ref, sha256: '0'.repeat(64) }))
  const link = path.resolve(root, 'link'); fs.symlinkSync(file, link)
  assert.throws(() => readArtifact({ ...ref, path: link })); fs.unlinkSync(link)
  fs.linkSync(file, link); assert.throws(() => readArtifact(ref)); fs.unlinkSync(link)
  fs.unlinkSync(file); assert.throws(() => readArtifact(ref))
}))

const admissionFixture = () => {
  const { payload } = fixture()
  return { reference: { sha256: '7'.repeat(64) }, target: payload.target, predecessor: payload.predecessor,
    sermon: { source: { commit: RECOVERY.saveCommit, fingerprint: '8'.repeat(64) },
      profile: { id: RECOVERY.profileId, path: '/quarantined/original' }, savedByRunId: RECOVERY.saveRunId,
      checkpoint, firstOwned: { turnBefore: 4777, turnAfter: 4778, victim: { id: 50 } },
      declaration: { armedAtTurn: 4101 }, failures: [{ index: 29 }, { index: 48 }], inputs: [{ sha256: '9'.repeat(64) }],
      milestones: [{ name: 'sermon-saved' }], activeSeconds: 407.75,
      originalInterruption: { cleanup: 'unknown', execExitCode: 130 }, retainedBlueIds: [46, 3163] } }
}

test('newly assembled recovery preserves original history and admits only the one actual claim', () => {
  const admission = admissionFixture(), record = createRecoveredSermonRecord(admission, '2026-10-05T04:00:00Z')
  const profile = { id: admission.target.profile.id, path: admission.target.profile.path, mode: 'reused', runId: 'actual-new-run',
    previousRun: null, recoveryClaim: { runId: 'actual-new-run' }, recoveryAdmission: admission,
    inputs: admission.target.inputs, correspondence: null }
  const context = { source: admission.target.source, profile, origin: RECOVERY.origin, checkpoint }
  const emitted = validateRecoveredSermonRecord(record, context)
  assert.equal(emitted.recordedByRunId, 'actual-new-run'); assert.equal(emitted.savedByRunId, RECOVERY.saveRunId)
  assert.equal(emitted.continuationPolicy, 'single-gameplay-segment')
  assert.equal(record.recordedByRunId, null); assert.deepEqual(emitted.failures, record.failures)
  assert.throws(() => validateRecoveredSermonRecord(emitted, context), /only one gameplay segment/)
  assert.throws(() => validateRecoveredSermonRecord(record, { ...context, profile: { ...profile, previousRun: { runId: 'failed-attempt' } } }))
  assert.throws(() => validateRecoveredSermonRecord(record, { ...context, profile: { ...profile, recoveryClaim: { runId: 'another' } } }))
  for (const change of [{ failures: [] }, { firstOwned: { victim: { id: 53 } } }, { source: context.source },
    { profile: admission.target.profile }, { activeSeconds: 401 }, { originalInterruption: { cleanup: 'verified' } },
    { inputs: [] }, { checkpoint: { ...checkpoint, turn: 4814 } }, { continuationBlockedReason: 'missing readback' },
    { recoveryAdmissionSha256: '0'.repeat(64) }, { inventedOriginalTerminalReceipt: { status: 'passed' } }]) assert.throws(() => validateRecoveredSermonRecord({ ...record, ...change }, context))
})

test('harness predecessor remains null and admitted checkpoint supplies prelaunch fallback only', () => {
  const admission = admissionFixture(), profile = { previousRun: null, recoveryAdmission: admission }
  assert.deepEqual(priorCheckpoint(profile), checkpoint); assert.equal(profile.previousRun, null)
  assert.deepEqual(priorCheckpoint({ ...profile, previousRun: { checkpointAtEnd: { turn: 4999 } } }), { turn: 4999 })
  assert.equal(priorCheckpoint({ ...profile, previousRun: { checkpointAtEnd: null } }), null)
  assert.equal(priorCheckpoint({ previousRun: null }), null)
})

// Run the exact lease implementation with only the already-tested admission
// reader substituted. This isolates filesystem lease/claim/finish behavior.
function leaseWithAdmission(admission) {
  const source = fs.readFileSync(new URL('../../scripts/local-render/owned-profile.mjs', import.meta.url), 'utf8')
    .replace(/^import .*$/gm, '').replaceAll('export ', '')
  const deps = { execFileSync, createHash, randomUUID, ...fs, ...path, hostname, isDeepStrictEqual,
    readRecoveryAdmission: () => structuredClone(admission) }
  delete deps.default
  return Function(...Object.keys(deps), source + '\nreturn acquireProfile;')(...Object.values(deps))
}
test('actual lease claims once, keeps lock on failure, writes only real lastRun and forbids second admission', () => filesystem(root => {
  execFileSync('git', ['init', root], { stdio: 'pipe' }); fs.writeFileSync(path.resolve(root, '.gitignore'), '/work/\n')
  const profilePath = path.resolve(root, 'work/local-render-profiles/recovered'), output = path.resolve(root, 'work/evidence')
  fs.mkdirSync(path.resolve(profilePath, 'browser'), { recursive: true, mode: 0o700 }); fs.mkdirSync(output, { recursive: true })
  const admission = admissionFixture(), args = { root, path: profilePath, output, origin: RECOVERY.origin,
    source: admission.target.source, inputs: admission.target.inputs, runtime: admission.target.runtime }
  const marker = { version: 1, purpose: 'populous-local-render-game-only', id: admission.target.profile.id,
    path: profilePath, binding: { root, origin: args.origin, application: args.inputs.application, runtime: args.runtime },
    lastRun: null, recoveryAdmission: admission.reference }
  const markerPath = path.resolve(profilePath, 'populous-profile.json')
  fs.writeFileSync(markerPath, JSON.stringify(marker), { mode: 0o600 })
  const acquire = leaseWithAdmission(admission), lease = acquire(args)
  assert.equal(lease.profile.previousRun, null); assert.equal(lease.profile.mode, 'reused')
  assert.equal(lease.profile.recoveryClaim.runId, lease.profile.runId)
  assert.throws(() => acquire(args), /already claimed/)
  assert.throws(() => lease.finish({}, false), /lock retained/)
  assert.ok(fs.existsSync(path.resolve(profilePath, 'owner.lock')))
  const receipt = { status: 'failed', profile: { ...lease.profile, continuationVerified: true, checkpointAtEnd: checkpoint } }
  fs.writeFileSync(path.resolve(output, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n')
  lease.finish(receipt, true)
  const finished = JSON.parse(fs.readFileSync(markerPath))
  assert.equal(finished.lastRun.runId, lease.profile.runId); assert.equal(finished.lastRun.status, 'failed')
  assert.deepEqual(finished.recoveryClaim, lease.profile.recoveryClaim)
  assert.deepEqual(finished.recoveryAdmission, marker.recoveryAdmission)
  assert.equal(fs.existsSync(path.resolve(profilePath, 'owner.lock')), false)
  assert.throws(() => acquire(args), /already claimed/)
  delete finished.recoveryClaim; fs.writeFileSync(markerPath, JSON.stringify(finished), { mode: 0o600 })
  assert.throws(() => acquire(args), /already claimed/, 'Reinserted pending admission cannot bypass real lastRun')
}))

import { EventEmitter } from 'node:events'
import vm from 'node:vm'
import { fileURLToPath, pathToFileURL } from 'node:url'

async function actualHarnessEntry(mode) {
  let persisted, finishCalled = false, scenarioCalls = 0, launchCalls = 0, closed = false, reads = 0
  const processFake = new EventEmitter(); processFake.env = {}; processFake.argv = []; processFake.cwd = () => '/fixture'
  const stream = new EventEmitter(); stream.pipe = () => {}
  const server = new EventEmitter(); server.pid = 100; server.exitCode = mode === 'prelaunch-failure' ? 1 : null
  server.stdout = stream; server.stderr = new EventEmitter(); server.stderr.pipe = () => {}
  processFake.kill = () => { server.exitCode = 0; server.emit('exit', 0) }
  const page = { on() {}, setDefaultTimeout() {}, async goto() {}, isClosed: () => false,
    getByRole: () => ({ async waitFor() {} }), async screenshot() {} }
  const browser = { version: () => 'test-only', isConnected: () => !closed, contexts: () => [context] }
  const context = { browser: () => browser, pages: () => [page], on() {}, async route() {}, async routeWebSocket() {},
    async close() { closed = true } }
  const admission = admissionFixture(), profile = { id: 'fixture-profile', runId: 'fixture-run', mode: 'reused',
    previousRun: null, recoveryAdmission: admission, recoveryClaim: { runId: 'fixture-run' }, checkpoints: [] }
  const lease = { dataDir: '/owned/browser', profile, finish() { finishCalled = true } }
  let source = fs.readFileSync(new URL('../../scripts/local-render/harness.mjs', import.meta.url), 'utf8')
  source = source.slice(0, source.indexOf('\nif (process.argv[1]')).replace(/^import .*$/gm, '').replaceAll('export ', '')
    .replaceAll('import.meta.url', JSON.stringify('file:///fixture/scripts/local-render/harness.mjs'))
    .replace("(await import(pathToFileURL(resolve(options.scenario)).href)).default", 'scenario')
    .replace("const { bindGame } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)", 'const bindGame = async () => {}')
  const runtimeStart = source.indexOf('function profileRuntimeReceipt('), runtimeEnd = source.indexOf('const delay =', runtimeStart)
  source = source.slice(0, runtimeStart) + 'function profileRuntimeReceipt() { return { fixture: true } }\n' + source.slice(runtimeEnd)
  const sandbox = { resolve: path.resolve, dirname: path.dirname, fileURLToPath, pathToFileURL, createHash,
    AbortController, AbortSignal, structuredClone, process: processFake, setTimeout, clearTimeout,
    mkdirSync() {}, existsSync: name => name === '/official-shell', validateProfilePaths() {},
    readFileSync: () => 'same scenario source', sha256: digest,
    writeFileSync: (_, text) => { persisted = JSON.parse(text) }, createWriteStream: () => ({ end() {} }),
    execFileSync: (_, args) => args.includes('rev-parse') ? 'unchanged-source\n' : '',
    createRequire: () => () => ({ chromium: { async launchPersistentContext() { launchCalls++; return context } } }),
    profileInputReceipt: () => ({ fixture: true }), acquireProfile: () => lease, persistentLaunchOptions,
    readCommittedCheckpoint: async () => { reads++; if (mode === 'readback-failure' && reads > 1) throw Error('fixture readback failed'); return mode === 'mismatch' ? { ...checkpoint, turn: 4814 } : checkpoint },
    spawn: () => { setTimeout(() => stream.emit('data', 'Local: http://127.0.0.1:4366'), 0); return server },
    fetch: async () => ({ ok: true }) }
  vm.runInNewContext(source + '\nglobalThis.run = runLocalBrowser', sandbox)
  const run = sandbox.run({ gameRoot: '/fixture', output: '/proof', browserPath: '/official-shell',
    profile: '/owned', scenario: '/fixture/qa/scenario.mjs', port: 4366, timeout: 1000 }, async () => { scenarioCalls++; return { fixture: true } })
  if (mode === 'match') await run
  else await assert.rejects(run, mode === 'prelaunch-failure' ? /Local server exited/ : /provenance is unverified/)
  return { persisted, finishCalled, scenarioCalls, launchCalls, closed, reads }
}

test('actual harness compares admitted full checkpoint before scenario and retains lock on mismatch', async () => {
  const good = await actualHarnessEntry('match')
  assert.equal(good.scenarioCalls, 1); assert.equal(good.finishCalled, true); assert.equal(good.closed, true)
  assert.deepEqual(good.persisted.profile.checkpointAtStart, checkpoint)
  assert.equal(good.persisted.profile.previousRun, null); assert.equal(good.persisted.profile.continuationVerified, true)
  const bad = await actualHarnessEntry('mismatch')
  assert.equal(bad.scenarioCalls, 0); assert.equal(bad.finishCalled, false); assert.equal(bad.closed, true)
  assert.equal(bad.persisted.status, 'failed'); assert.equal(bad.persisted.profile.continuationVerified, false)
  assert.equal(bad.persisted.profile.checkpointAtEnd.turn, 4814, 'Actual failing readback remains visible')
})

test('actual prelaunch failure uses typed read-only checkpoint without inventing a gameplay predecessor', async () => {
  const failed = await actualHarnessEntry('prelaunch-failure')
  assert.equal(failed.scenarioCalls, 0); assert.equal(failed.launchCalls, 0); assert.equal(failed.reads, 0)
  assert.equal(failed.persisted.status, 'failed'); assert.equal(failed.persisted.profile.previousRun, null)
  assert.deepEqual(failed.persisted.profile.checkpointAtEnd, checkpoint)
  assert.equal(failed.persisted.profile.cleanupVerified, true); assert.equal(failed.finishCalled, true)
})


test('actual terminal readback failure keeps recovered lease locked without inventing a checkpoint', async () => {
  const failed = await actualHarnessEntry('readback-failure')
  assert.equal(failed.scenarioCalls, 1); assert.equal(failed.finishCalled, false); assert.equal(failed.closed, true)
  assert.equal(failed.persisted.status, 'failed'); assert.equal(Object.hasOwn(failed.persisted.profile, 'checkpointAtEnd'), false)
  assert.match(failed.persisted.profile.checkpointReadFailure, /fixture readback failed/)
})
