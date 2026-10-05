import test from 'node:test'
import assert from 'node:assert/strict'
import { EROSION_CONTINUATION as E, SUCCESSOR, erosionContinuationHistory, erosionContinuationBudget,
  validateErosionContinuationFacts, createErosionContinuationRecord, validateErosionContinuationRecord } from './sermon-successor.mjs'
import { RECOVERY } from './recovery-admission.mjs'
const checkpoint = { level: 3, turn: 4813, time: 4813 / 12,
  checkpointSha256: '720e96e28b46a029e22a1c97729ead760471c96e4e10c59fd5ae620d5e66f57a' }
function fixture() {
  const reference = { path: '/original/admission', sha256: 'a'.repeat(64) }
  const recoveryClaim = { runId: SUCCESSOR.priorRunId }, gameplayContinuationClaim = {
    runId: E.priorRunId, priorRunId: SUCCESSOR.priorRunId, reference: { path: '/first/successor', sha256: 'b'.repeat(64) } }
  const prefix = ['vault', 'shaman-home', 'temple', 'preacher', 'listener', 'sermon-saved'].map(name => ({ name }))
  const priorRecord = { kind: SUCCESSOR.kind, recordedByRunId: E.priorRunId, savedByRunId: RECOVERY.saveRunId,
    checkpoint, originalInterruption: { cleanup: 'unknown' }, recoveryAdmissionSha256: reference.sha256,
    activeSeconds: 407.75, priorRecordSha256: SUCCESSOR.recordSha256, milestones: prefix,
    gameplayContinuation: { history: { activeSeconds: 418.08333333333337,
      failures: [{ index: 29 }, { index: 48 }, { index: 1 }], controlStops: [{ index: 2, code: 'preserve-latest' }] } } }
  const epoch = (name, last, firstTurn, lastTurn, samples) => ({ name, baselineGameTime: checkpoint.time,
    lastGameTime: last, activeSeconds: last - checkpoint.time, firstTurn, lastTurn, samples, errors: [], speedViolations: [] })
  const journey = { status: 'failed', inheritedActiveSeconds: 418.08333333333337,
    epochs: [epoch('saved-sermon-entry', 408.25, 4830, 4899, 70)],
    failures: priorRecord.gameplayContinuation.history.failures.map(f => ({ ...f, inheritedFromSavedSermon: true })),
    controlStops: [{ ...priorRecord.gameplayContinuation.history.controlStops[0], inheritedFromPriorGameplay: true }, { index: 3, code: 'progress-stall' }],
    milestones: [...prefix.map(m => ({ ...m, inheritedFromSavedSermon: true })), { name: 'sermon-cancelled' }, { name: 'sermon-reloaded' },
      { name: 'conversion', turn: 5144, epoch: 'reload-1', activeSeconds: 452.8333333333334 }], inputs: [{ name: 'actual-command', sha256: 'c'.repeat(64) }] }
  const terminal = { turn: 11471, time: 11471 / 12, paused: true, observation: epoch('reload-1', 11471 / 12, 4838, 11471, 6634) }
  const source = { root: '/owned', commit: E.sourceCommit, fingerprint: 'old-source' }, runtime = { harness: 'old' }
  const profile = { id: SUCCESSOR.profileId, path: '/owned/profile', runId: E.priorRunId, origin: RECOVERY.origin,
    inputs: { application: 'old-application', checker: 'old-checker' }, cleanupVerified: true, continuationVerified: true,
    checkpointAtStart: checkpoint, checkpointAtEnd: checkpoint, recoveryAdmission: { reference }, recoveryClaim, gameplayContinuationClaim }
  const prior = { status: 'failed', source, sourceAfter: source, runtime, runtimeAfter: runtime, profile }
  const outer = { status: 'failed', phase: 'finished', exitCode: 1, signal: null,
    source: { headOid: source.commit }, sourceAfter: { headOid: source.commit } }
  const previousBinding = { root: source.root, origin: RECOVERY.origin, application: profile.inputs.application, runtime }
  const lastRun = { runId: E.priorRunId, receiptPath: '/real/receipt', receiptSha256: E.receiptSha256,
    sourceCommit: source.commit, sourceFingerprint: source.fingerprint, checker: profile.inputs.checker,
    status: 'failed', cleanupVerified: true, continuationVerified: true, checkpointAtEnd: checkpoint }
  const manifest = { id: profile.id, path: profile.path, binding: previousBinding, lastRun,
    recoveryAdmission: reference, recoveryClaim, gameplayContinuationClaim }
  const target = { root: '/owned', origin: RECOVERY.origin, profile: { id: profile.id, path: profile.path },
    source: { root: '/owned', commit: 'new-source', fingerprint: 'new-fingerprint' },
    inputs: { application: 'new-classifier', checker: 'new-checker' }, runtime: { harness: 'new' },
    scenario: { path: '/owned/qa/mission-three-controls/driver.mjs', sha256: 'd'.repeat(64) } }
  const history = erosionContinuationHistory(journey, terminal, priorRecord), budget = erosionContinuationBudget(history)
  const payload = { version: 1, kind: E.kind, mappingSha256: E.mappingSha256, predecessor: { receipt: { path: '/real/receipt' } }, previousBinding, target, history, budget }
  const context = { ...target, id: target.profile.id, path: target.profile.path }
  const continuation = { reference: { path: '/current/payload', sha256: 'e'.repeat(64) }, target, previousBinding, priorRecord,
    priorRecordSha256: E.recordSha256, priorRunId: E.priorRunId, history, budget, recoveryAdmission: profile.recoveryAdmission,
    recoveryClaim, gameplayContinuationClaim }
  return { priorRecord, journey, terminal, prior, outer, manifest, payload, context, continuation }
}

test('Erosion history includes both real epochs, every failure/stop and separate prior milestones', () => {
  const f = fixture(), h = erosionContinuationHistory(f.journey, f.terminal, f.priorRecord)
  assert.equal(h.activeSeconds, 980.0833333333333)
  assert.equal(h.closedEpochs[0].activeSeconds, 7.166666666666686); assert.equal(h.openEpoch.activeSeconds, 554.8333333333333)
  assert.deepEqual(h.failures, f.journey.failures); assert.deepEqual(h.controlStops, f.journey.controlStops)
  assert.deepEqual(h.priorMilestones, f.journey.milestones); assert.deepEqual(h.priorInputs, f.journey.inputs)
  for (const mutate of [f => f.journey.inheritedActiveSeconds = 407.75, f => f.journey.epochs = [],
    f => f.journey.epochs.push(f.journey.epochs[0]), f => f.terminal.observation.activeSeconds = 0,
    f => f.terminal.observation.errors.push('observer error'), f => f.terminal.observation.lastTurn--,
    f => f.journey.failures.pop(), f => f.journey.controlStops.pop(), f => f.journey.controlStops[1].code = 'preserve-latest',
    f => f.journey.milestones.pop(), f => f.journey.milestones.push({ name: 'erosion' }), f => f.journey.inputs = [],
    f => f.priorRecord.gameplayContinuation.history.activeSeconds = 0]) {
    const changed = fixture(); mutate(changed)
    assert.throws(() => erosionContinuationHistory(changed.journey, changed.terminal, changed.priorRecord))
  }
  const budget = erosionContinuationBudget(h)
  assert.equal(budget.cumulativeActiveCeiling, 2252.8333333333335); assert.equal(budget.remainingActiveSeconds, 1272.7500000000002)
  h.priorMilestones.find(m => m.name === 'conversion').activeSeconds = 980
  assert.throws(() => erosionContinuationBudget(h), 'A later replay cannot extend the historical conversion ceiling')
})

test('only exact real terminal and intact old claims can admit this target once', () => {
  const f = fixture(), before = structuredClone(f)
  validateErosionContinuationFacts(f.payload, f.prior, f.outer, f.manifest, f.context); assert.deepEqual(f, before)
  for (const mutate of [f => f.prior.status = 'passed', f => f.prior.sourceAfter = {}, f => f.prior.runtimeAfter = {},
    f => f.prior.profile.cleanupVerified = false, f => f.prior.profile.continuationVerified = false,
    f => f.prior.profile.checkpointAtEnd = { ...checkpoint, turn: 11471 }, f => f.outer.signal = 'SIGINT',
    f => f.manifest.lastRun.runId = SUCCESSOR.priorRunId, f => f.manifest.lastRun.receiptSha256 = 'bad',
    f => f.manifest.lastRun.checker = 'bad', f => f.manifest.binding = {},
    f => f.manifest.recoveryAdmission = {}, f => f.manifest.recoveryClaim = {}, f => f.manifest.gameplayContinuationClaim = {},
    f => f.manifest.erosionContinuationClaim = { runId: 'claimed' }, f => delete f.manifest.lastRun,
    f => f.context.runtime = {}, f => f.context.source = {}, f => f.context.inputs = {}, f => f.context.scenario = {},
    f => f.context.origin = 'http://127.0.0.1:9999', f => f.context.path = '/other', f => f.payload.mappingSha256 = 'bad']) {
    const changed = fixture(); mutate(changed)
    assert.throws(() => validateErosionContinuationFacts(changed.payload, changed.prior, changed.outer, changed.manifest, changed.context))
  }
})

test('new record keeps old successor content and rejects altered history, budget, old/new claims or another entry', () => {
  const f = fixture(), record = createErosionContinuationRecord(f.continuation, '2026-10-05T07:00:00Z')
  assert.equal(record.priorRecordSha256, SUCCESSOR.recordSha256)
  assert.equal(record.erosionPredecessorRecordSha256, E.recordSha256)
  assert.deepEqual(record.gameplayContinuation, f.priorRecord.gameplayContinuation)
  assert.deepEqual(record.milestones, f.priorRecord.milestones)
  const profile = { ...f.prior.profile, runId: 'new-run', mode: 'reused', inputs: f.context.inputs, previousRun: f.manifest.lastRun,
    erosionContinuation: f.continuation, erosionContinuationClaim: { runId: 'new-run', priorRunId: E.priorRunId,
      correspondenceSha256: f.continuation.reference.sha256, reference: f.continuation.reference, previousBinding: f.continuation.previousBinding } }
  const context = { source: f.context.source, profile, origin: RECOVERY.origin, checkpoint }
  const emitted = validateErosionContinuationRecord(record, context)
  assert.equal(emitted.recordedByRunId, 'new-run'); assert.equal(record.recordedByRunId, E.priorRunId)
  assert.throws(() => validateErosionContinuationRecord(emitted, context))
  for (const mutate of [r => r.erosionContinuation.history.activeSeconds = 418.08333333333337,
    r => r.erosionContinuation.history.failures.pop(), r => r.erosionContinuation.history.controlStops.pop(),
    r => r.erosionContinuation.history.closedEpochs = [], r => r.erosionContinuation.history.openEpoch.activeSeconds = 0,
    r => r.erosionContinuation.budget.cumulativeActiveCeiling = 2400, r => r.erosionContinuation.budget.priorConversionActiveSeconds = 980,
    r => r.gameplayContinuation.history.activeSeconds = 980, r => r.priorRecordSha256 = 'bad',
    r => r.originalInterruption.cleanup = 'verified', r => r.milestones.push({ name: 'conversion' })]) {
    const changed = structuredClone(record); mutate(changed); assert.throws(() => validateErosionContinuationRecord(changed, context))
  }
  for (const mutate of [p => p.recoveryClaim = {}, p => p.gameplayContinuationClaim = {},
    p => p.erosionContinuationClaim = {}, p => p.erosionContinuationClaim.reference = {}, p => p.previousRun = {}]) {
    const changed = structuredClone(profile); mutate(changed)
    assert.throws(() => validateErosionContinuationRecord(record, { ...context, profile: changed }))
  }
})
