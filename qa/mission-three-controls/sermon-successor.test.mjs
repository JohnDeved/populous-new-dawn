import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash, randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { hostname, tmpdir } from 'node:os'
import { isDeepStrictEqual } from 'node:util'
import { RECOVERY } from './recovery-admission.mjs'
import { SUCCESSOR, successorHistory, validateSuccessorFacts, createSuccessorSermonRecord,
  validateSuccessorSermonRecord } from './sermon-successor.mjs'

const checkpoint = { level: 3, turn: 4813, time: 4813 / 12,
  checkpointSha256: '720e96e28b46a029e22a1c97729ead760471c96e4e10c59fd5ae620d5e66f57a' }
function fixture() {
  const recoveryClaim = { runId: SUCCESSOR.priorRunId }, reference = { path: '/historical/admission', sha256: 'a'.repeat(64) }
  const priorRecord = { version: 1, kind: 'mission3-recovered-ui-sermon', recordedByRunId: SUCCESSOR.priorRunId,
    savedByRunId: RECOVERY.saveRunId, checkpoint, failures: [{ index: 29 }, { index: 48 }], activeSeconds: 407.75,
    originalInterruption: { cleanup: 'unknown' }, recoveryAdmissionSha256: reference.sha256 }
  const journey = { status: 'failed', inheritedActiveSeconds: 407.75, epochs: [],
    failures: [...priorRecord.failures.map(f => ({ ...f, inheritedFromSavedSermon: true })),
      { index: 1, error: 'Error: The exact listener has not released sermon ownership and its listener flag' }],
    controlStops: [{ code: 'preserve-latest', index: 2 }],
    milestones: ['vault', 'shaman-home', 'temple', 'preacher', 'listener', 'sermon-saved'].map(name => ({ name })) }
  const terminal = { turn: 4937, time: 4937 / 12, paused: true, observation: { name: 'saved-sermon-entry',
    baselineGameTime: checkpoint.time, lastGameTime: 4937 / 12, activeSeconds: 4937 / 12 - checkpoint.time,
    errors: [], speedViolations: [] } }
  const source = { root: '/owned', commit: SUCCESSOR.sourceCommit, fingerprint: 'b'.repeat(64) }
  const runtime = { node: 'fixed', harness: 'previous' }
  const profile = { id: SUCCESSOR.profileId, path: '/owned/profile', runId: SUCCESSOR.priorRunId,
    origin: RECOVERY.origin, inputs: { application: 'old-app-hash', checker: 'old-checker' },
    cleanupVerified: true, continuationVerified: true, checkpointAtStart: checkpoint, checkpointAtEnd: checkpoint,
    recoveryAdmission: { reference }, recoveryClaim }
  const prior = { status: 'failed', source, sourceAfter: source, runtime, runtimeAfter: runtime, profile }
  const outer = { status: 'failed', phase: 'finished', exitCode: 1, signal: null,
    source: { headOid: source.commit }, sourceAfter: { headOid: source.commit } }
  const previousBinding = { root: source.root, origin: RECOVERY.origin, application: profile.inputs.application, runtime }
  const lastRun = { runId: SUCCESSOR.priorRunId, receiptSha256: SUCCESSOR.receiptSha256, receiptPath: '/previous/receipt',
    sourceCommit: source.commit, sourceFingerprint: source.fingerprint, checker: profile.inputs.checker,
    status: 'failed', cleanupVerified: true, continuationVerified: true, checkpointAtEnd: checkpoint }
  const manifest = { id: profile.id, path: profile.path, binding: previousBinding, lastRun,
    recoveryAdmission: reference, recoveryClaim }
  const target = { root: '/owned', origin: RECOVERY.origin, profile: { id: profile.id, path: profile.path },
    source: { root: '/owned', commit: 'c'.repeat(40), fingerprint: 'd'.repeat(64) },
    inputs: { application: 'new-app-classifier', checker: 'new-checker' }, runtime: { ...runtime, harness: 'new' },
    scenario: { path: '/owned/qa/mission-three-controls/driver.mjs', sha256: 'e'.repeat(64) } }
  const payload = { version: 1, kind: SUCCESSOR.kind, mappingSha256: SUCCESSOR.mappingSha256,
    predecessor: { receipt: { path: '/previous/receipt' } }, target, previousBinding }
  const context = { ...target, path: target.profile.path, id: target.profile.id }
  return { priorRecord, journey, terminal, prior, outer, manifest, payload, context }
}

test('successor counts the real open terminal epoch and retains all three failures plus preserving stop', () => {
  const f = fixture(), history = successorHistory(f.journey, f.terminal, f.priorRecord)
  assert.equal(history.activeSeconds, 418.08333333333337); assert.equal(history.failures.length, 3)
  assert.deepEqual(history.controlStops, f.journey.controlStops)
  for (const mutate of [f => f.journey.inheritedActiveSeconds = checkpoint.time,
    f => f.terminal.observation.activeSeconds = 0, f => f.journey.epochs.push({ activeSeconds: 10 }),
    f => f.journey.failures.pop(), f => f.journey.failures[0].index = 1,
    f => f.journey.controlStops = [], f => f.journey.milestones.push({ name: 'sermon-cancelled' }),
    f => f.terminal.observation.errors.push('bad'), f => f.terminal.paused = false]) {
    const changed = fixture(); mutate(changed)
    assert.throws(() => successorHistory(changed.journey, changed.terminal, changed.priorRecord))
  }
})

test('only the real failed terminal predecessor and exact old-to-new binding authorize this successor', () => {
  const f = fixture(), before = structuredClone(f)
  validateSuccessorFacts(f.payload, f.prior, f.outer, f.manifest, f.context)
  assert.deepEqual(f, before)
  for (const mutate of [f => f.prior.status = 'passed', f => f.prior.profile.cleanupVerified = false,
    f => f.prior.profile.checkpointAtEnd = { ...checkpoint, turn: 4937 }, f => f.outer.phase = 'prepared',
    f => f.manifest.lastRun = { ...f.manifest.lastRun, runId: 'different' },
    f => f.manifest.lastRun.receiptSha256 = 'bad', f => f.manifest.binding = { ...f.manifest.binding, runtime: 'wrong' },
    f => f.manifest.recoveryClaim = {}, f => f.manifest.recoveryAdmission = {},
    f => f.manifest.gameplayContinuationClaim = { runId: 'already-used' },
    f => f.context.runtime = {}, f => f.context.origin = 'http://127.0.0.1:9999',
    f => f.context.id = 'another-profile', f => f.context.inputs = {}, f => f.context.source = {},
    f => f.context.scenario = {}, f => f.payload.mappingSha256 = 'bad']) {
    const changed = fixture(); mutate(changed)
    assert.throws(() => validateSuccessorFacts(changed.payload, changed.prior, changed.outer, changed.manifest, changed.context))
  }
})

function continuationFixture() {
  const f = fixture(), continuation = { reference: { path: '/current/correspondence', sha256: 'f'.repeat(64) },
    target: f.payload.target, previousBinding: f.manifest.binding, priorRecord: f.priorRecord,
    priorRecordSha256: SUCCESSOR.recordSha256, priorRunId: SUCCESSOR.priorRunId,
    history: successorHistory(f.journey, f.terminal, f.priorRecord),
    recoveryAdmission: f.prior.profile.recoveryAdmission, recoveryClaim: f.manifest.recoveryClaim }
  return { ...f, continuation }
}
test('newly assembled successor record keeps original provenance and rejects rewinds, omitted failures and third records', () => {
  const f = continuationFixture(), record = createSuccessorSermonRecord(f.continuation, '2026-10-05T05:00:00Z')
  assert.equal(record.priorRecordSha256, SUCCESSOR.recordSha256); assert.equal(record.activeSeconds, 407.75)
  assert.equal(record.gameplayContinuation.history.activeSeconds, 418.08333333333337)
  const profile = { ...f.prior.profile, runId: 'new-run', mode: 'reused', inputs: f.context.inputs,
    previousRun: f.manifest.lastRun, gameplayContinuation: f.continuation,
    gameplayContinuationClaim: { runId: 'new-run', priorRunId: SUCCESSOR.priorRunId, correspondenceSha256: f.continuation.reference.sha256 } }
  const context = { source: f.context.source, origin: RECOVERY.origin, checkpoint, profile }
  const emitted = validateSuccessorSermonRecord(record, context)
  assert.equal(emitted.recordedByRunId, 'new-run'); assert.equal(record.recordedByRunId, SUCCESSOR.priorRunId)
  assert.throws(() => validateSuccessorSermonRecord(emitted, context))
  for (const mutate of [r => r.failures = [], r => r.gameplayContinuation.history.failures.pop(),
    r => r.gameplayContinuation.history.activeSeconds = 407.75, r => r.originalInterruption.cleanup = 'verified',
    r => r.priorRecordSha256 = 'bad', r => r.inventedTerminalResult = 'passed']) {
    const changed = structuredClone(record); mutate(changed); assert.throws(() => validateSuccessorSermonRecord(changed, context))
  }
  assert.throws(() => validateSuccessorSermonRecord(record, { ...context, profile: { ...profile, previousRun: { runId: 'other' } } }))
  assert.throws(() => validateSuccessorSermonRecord(record, { ...context, profile: { ...profile, recoveryClaim: { runId: 'reset' } } }))
})

test('actual lease changes only reviewed current binding, preserves first claim, and forbids a third acquisition', () => {
  const root = fs.mkdtempSync(path.resolve(tmpdir(), 'sermon-successor-'))
  try {
    execFileSync('git', ['init', root], { stdio: 'pipe' }); fs.writeFileSync(path.resolve(root, '.gitignore'), '/work/\n')
    const f = continuationFixture(), profilePath = path.resolve(root, 'work/local-render-profiles/recovered'), output = path.resolve(root, 'work/proof')
    fs.mkdirSync(path.resolve(profilePath, 'browser'), { recursive: true, mode: 0o700 }); fs.mkdirSync(output)
    const manifest = { version: 1, purpose: 'populous-local-render-game-only', ...f.manifest, path: profilePath }
    const marker = path.resolve(profilePath, 'populous-profile.json'); fs.writeFileSync(marker, JSON.stringify(manifest), { mode: 0o600 })
    const source = fs.readFileSync(new URL('../../scripts/local-render/owned-profile.mjs', import.meta.url), 'utf8')
      .replace(/^import .*$/gm, '').replaceAll('export ', '')
    let checked = 0
    const deps = { execFileSync, createHash, randomUUID, ...fs, ...path, hostname, isDeepStrictEqual,
      readRecoveryAdmission: () => { throw Error('Must not reinterpret old admission as current target') },
      readGameplayContinuation: (_, context, actual) => { checked++; assert.deepEqual(actual, manifest); return structuredClone(f.continuation) } }
    delete deps.default
    const acquire = Function(...Object.keys(deps), source + '\nreturn acquireProfile;')(...Object.values(deps))
    const args = { root, path: profilePath, output, origin: RECOVERY.origin, source: f.context.source,
      inputs: f.context.inputs, runtime: f.context.runtime, correspondence: '/reviewed/reference' }
    const lease = acquire(args), claimed = JSON.parse(fs.readFileSync(marker))
    assert.equal(checked, 1); assert.deepEqual(claimed.recoveryAdmission, manifest.recoveryAdmission)
    assert.deepEqual(claimed.recoveryClaim, manifest.recoveryClaim); assert.deepEqual(claimed.lastRun, manifest.lastRun)
    assert.equal(claimed.gameplayContinuationClaim.priorRunId, SUCCESSOR.priorRunId)
    assert.deepEqual(claimed.gameplayContinuationClaim.previousBinding, manifest.binding)
    assert.deepEqual(claimed.binding, { root, origin: args.origin, application: args.inputs.application, runtime: args.runtime })
    assert.throws(() => acquire(args), /already claimed/)
    assert.equal(lease.profile.previousRun.runId, SUCCESSOR.priorRunId)
    const receipt = { status: 'failed', profile: { ...lease.profile, continuationVerified: true, checkpointAtEnd: checkpoint } }
    fs.writeFileSync(path.resolve(output, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n'); lease.finish(receipt, true)
    assert.equal(fs.existsSync(path.resolve(profilePath, 'owner.lock')), false)
    assert.throws(() => acquire(args), /already claimed/); assert.equal(checked, 1)
  } finally { fs.rmSync(root, { recursive: true, force: true }) }
})
