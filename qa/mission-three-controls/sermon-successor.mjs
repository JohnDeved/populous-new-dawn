// One explicit successor of the closed, failed recovered gameplay segment.
// Original recovery admission/claim and original emitted record are immutable.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { RECOVERY, readArtifact, digest } from './recovery-admission.mjs'

export const SUCCESSOR = Object.freeze({
  kind: 'mission3-recovered-sermon-successor',
  mappingSha256: '3b4e934538679e9d03f8ba886c9a639ffb105074689a617f0a509408ac66c6c0',
  priorRunId: '5451f1a6-088f-4dac-94c9-b0f2cc869fd2',
  profileId: 'c1f1d915-d99a-4c47-be2a-2ad36d89fc86',
  sourceCommit: '3ddb1dd9f971f8d21ab5bfda262bc4db72500466',
  receiptSha256: '23a1c360938456620031fc096d895eb6f730006055a554c7dd55a6965ac90dd0',
  outerSha256: '43d693aef6b746dfa99b000fb27173dede398fc953ea18bae015f206784e1c80',
  journeySha256: '204a308ae0a8b3f1f8b8f6385ee5bbb9a8199356ccb90ab90d06994290b3e2ea',
  terminalSha256: 'cbbcd1e999c35f2f96ec83a074ef3e51419cfc2b98dbc7a15baa9cf8ec24281f',
  actionsSha256: '396f78f667523c4171c710da3329448deff1456f7df59db2555f2f3bf6ca0c90',
  recordSha256: '7cf660ad2a948652c0d284f0b31528efe8b13b579b9d8465ba06130a9f0e42b4',
})
const readJson = ref => JSON.parse(readArtifact(ref))
const pinned = (ref, sha256) => { assert.equal(ref?.sha256, sha256); return readJson(ref) }

export function successorHistory(journey, terminal, priorRecord) {
  assert.equal(journey.status, 'failed'); assert.equal(journey.inheritedActiveSeconds, 407.75)
  assert.deepEqual(journey.epochs, [], 'This predecessor has one open terminal epoch')
  assert.equal(terminal.turn, 4937); assert.equal(terminal.time, 4937 / 12); assert.equal(terminal.paused, true)
  const epoch = terminal.observation
  assert.equal(epoch.name, 'saved-sermon-entry'); assert.equal(epoch.baselineGameTime, priorRecord.checkpoint.time)
  assert.equal(epoch.lastGameTime, terminal.time)
  assert.equal(epoch.activeSeconds, epoch.lastGameTime - epoch.baselineGameTime)
  assert.deepEqual(epoch.errors, []); assert.deepEqual(epoch.speedViolations, [])
  const activeSeconds = journey.inheritedActiveSeconds + epoch.activeSeconds
  assert.equal(activeSeconds, 418.08333333333337)
  assert.equal(journey.failures.length, 3); assert.equal(priorRecord.failures.length, 2)
  assert.deepEqual(journey.failures.slice(0, 2), priorRecord.failures.map(f => ({ ...f, inheritedFromSavedSermon: true })))
  assert.equal(journey.failures[2].index, 1); assert.match(journey.failures[2].error, /exact listener has not released/)
  assert.equal(journey.controlStops.length, 1); assert.equal(journey.controlStops[0].code, 'preserve-latest')
  assert.deepEqual(journey.milestones.map(m => m.name), ['vault', 'shaman-home', 'temple', 'preacher', 'listener', 'sermon-saved'])
  return structuredClone({ activeSeconds, failures: journey.failures, controlStops: journey.controlStops,
    closedEpochCount: 0, openEpochActiveSeconds: epoch.activeSeconds, priorRunId: SUCCESSOR.priorRunId })
}

export function validateSuccessorFacts(payload, prior, outer, manifest, context) {
  assert.equal(payload.version, 1); assert.equal(payload.kind, SUCCESSOR.kind)
  assert.equal(payload.mappingSha256, SUCCESSOR.mappingSha256)
  assert.equal(prior.status, 'failed'); assert.equal(prior.source.commit, SUCCESSOR.sourceCommit)
  assert.deepEqual(prior.sourceAfter, prior.source); assert.deepEqual(prior.runtimeAfter, prior.runtime)
  assert.equal(prior.profile.runId, SUCCESSOR.priorRunId); assert.equal(prior.profile.id, SUCCESSOR.profileId)
  assert.equal(prior.profile.cleanupVerified, true); assert.equal(prior.profile.continuationVerified, true)
  assert.deepEqual(prior.profile.checkpointAtStart, prior.profile.checkpointAtEnd)
  assert.equal(prior.profile.checkpointAtEnd.turn, 4813)
  assert.equal(prior.profile.checkpointAtEnd.checkpointSha256, '720e96e28b46a029e22a1c97729ead760471c96e4e10c59fd5ae620d5e66f57a')
  assert.equal(outer.status, 'failed'); assert.equal(outer.phase, 'finished'); assert.equal(outer.exitCode, 1)
  assert.equal(outer.signal, null); assert.equal(outer.source.headOid, prior.source.commit)
  assert.deepEqual(outer.sourceAfter, outer.source)
  assert.equal(manifest.gameplayContinuationClaim, undefined, 'No third entry or repeated successor')
  assert.equal(manifest.id, SUCCESSOR.profileId); assert.equal(manifest.path, prior.profile.path)
  assert.equal(manifest.lastRun?.runId, SUCCESSOR.priorRunId)
  assert.equal(manifest.lastRun.receiptSha256, SUCCESSOR.receiptSha256)
  assert.equal(manifest.lastRun.receiptPath, payload.predecessor.receipt.path)
  for (const [key, value] of Object.entries({ sourceCommit: prior.source.commit, sourceFingerprint: prior.source.fingerprint,
    checker: prior.profile.inputs.checker, status: 'failed', cleanupVerified: true, continuationVerified: true,
    checkpointAtEnd: prior.profile.checkpointAtEnd })) assert.deepEqual(manifest.lastRun[key], value)
  assert.deepEqual(manifest.recoveryAdmission, prior.profile.recoveryAdmission.reference)
  assert.deepEqual(manifest.recoveryClaim, prior.profile.recoveryClaim)
  assert.equal(manifest.recoveryClaim.runId, SUCCESSOR.priorRunId)
  const previousBinding = { root: prior.source.root, origin: prior.profile.origin,
    application: prior.profile.inputs.application, runtime: prior.runtime }
  assert.deepEqual(manifest.binding, previousBinding, 'The old marker must match the actual real predecessor binding')
  assert.deepEqual(payload.previousBinding, previousBinding)
  const target = payload.target
  assert.equal(target.profile.id, manifest.id); assert.equal(target.profile.path, manifest.path)
  assert.equal(target.root, previousBinding.root); assert.equal(target.origin, RECOVERY.origin)
  for (const key of ['root', 'origin', 'source', 'inputs', 'runtime', 'scenario'])
    assert.deepEqual(context[key], target[key], `Successor target ${key} changed`)
  assert.equal(context.id, target.profile.id); assert.equal(context.path, target.profile.path)
  assert.equal(target.scenario.path, resolve(target.root, 'qa/mission-three-controls/driver.mjs'))
}

export function readGameplayContinuation(correspondence, context, manifest) {
  const reference = JSON.parse(readFileSync(correspondence, 'utf8'))
  const payload = readJson(reference), review = readJson(reference.review)
  assert.equal(review.decision, 'ACCEPT'); assert.ok(review.reviewer && review.reference)
  assert.equal(review.correspondenceSha256, reference.sha256)
  assert.equal(review.sourceCommit, payload.target.source.commit)
  assert.equal(review.sourceFingerprint, payload.target.source.fingerprint); assert.equal(review.checker, payload.target.inputs.checker)
  const p = payload.predecessor
  const prior = pinned(p.receipt, SUCCESSOR.receiptSha256), outer = pinned(p.outer, SUCCESSOR.outerSha256)
  const journey = pinned(p.journey, SUCCESSOR.journeySha256), terminal = pinned(p.terminal, SUCCESSOR.terminalSha256)
  const priorRecord = pinned(p.record, SUCCESSOR.recordSha256)
  assert.equal(p.actions.sha256, SUCCESSOR.actionsSha256)
  const actions = readArtifact(p.actions).toString().trim().split('\n').map(line => JSON.parse(line))
  assert.ok(actions.some(action => action.action === 'latest-preserved-on-stop' && action.intendedSaveVerified === true &&
    JSON.stringify(action.actual) === JSON.stringify(prior.profile.checkpointAtEnd)))
  validateSuccessorFacts(payload, prior, outer, manifest, context)
  assert.equal(digest(readFileSync(payload.target.scenario.path)), payload.target.scenario.sha256)
  // Historical admission is hash-bound to the real prior receipt. Its old target
  // is not reinterpreted as the current driver/runtime and storage is not recopied.
  readArtifact(manifest.recoveryAdmission); readArtifact(manifest.recoveryAdmission.review)
  assert.equal(priorRecord.recordedByRunId, SUCCESSOR.priorRunId)
  assert.equal(priorRecord.savedByRunId, RECOVERY.saveRunId)
  assert.equal(priorRecord.recoveryAdmissionSha256, manifest.recoveryAdmission.sha256)
  assert.deepEqual(priorRecord.checkpoint, prior.profile.checkpointAtEnd)
  assert.equal(priorRecord.continuationBlockedReason, undefined)
  const history = successorHistory(journey, terminal, priorRecord)
  assert.deepEqual(payload.history, history, 'The exact cumulative history is required')
  return { reference, target: payload.target, previousBinding: payload.previousBinding, priorRecord,
    priorRecordSha256: p.record.sha256, priorRunId: SUCCESSOR.priorRunId, history,
    recoveryAdmission: prior.profile.recoveryAdmission, recoveryClaim: prior.profile.recoveryClaim }
}

export function createSuccessorSermonRecord(continuation, assembledSuccessorAt) {
  assert.ok(typeof assembledSuccessorAt === 'string' && Number.isFinite(Date.parse(assembledSuccessorAt)))
  return structuredClone({ ...continuation.priorRecord, kind: SUCCESSOR.kind, assembledSuccessorAt,
    priorRecordSha256: continuation.priorRecordSha256,
    gameplayContinuation: { reference: continuation.reference, target: continuation.target,
      priorRunId: continuation.priorRunId, history: continuation.history },
    continuationScope: 'Newly assembled single successor of a real failed gameplay segment. Original admission/history are unchanged; cumulative time, three failures and preserving stop are retained.' })
}

export function validateSuccessorSermonRecord(record, { source, profile, origin, checkpoint }) {
  const continuation = profile?.gameplayContinuation
  assert.ok(continuation, 'Successor requires the exact reviewed gameplay correspondence')
  const expected = createSuccessorSermonRecord(continuation, record.assembledSuccessorAt)
  assert.deepEqual(record, expected, 'Successor record must preserve its exact prior record and cumulative history')
  assert.equal(profile.mode, 'reused'); assert.equal(profile.id, SUCCESSOR.profileId)
  assert.equal(profile.path, continuation.target.profile.path); assert.equal(origin, RECOVERY.origin)
  assert.deepEqual(source, continuation.target.source); assert.deepEqual(profile.inputs, continuation.target.inputs)
  assert.deepEqual(checkpoint, record.checkpoint); assert.equal(record.recordedByRunId, SUCCESSOR.priorRunId)
  assert.equal(profile.previousRun?.runId, SUCCESSOR.priorRunId)
  assert.equal(profile.gameplayContinuationClaim?.runId, profile.runId)
  assert.equal(profile.gameplayContinuationClaim.priorRunId, SUCCESSOR.priorRunId)
  assert.equal(profile.gameplayContinuationClaim.correspondenceSha256, continuation.reference.sha256)
  assert.deepEqual(profile.recoveryClaim, continuation.recoveryClaim)
  assert.deepEqual(profile.recoveryAdmission.reference, continuation.recoveryAdmission.reference)
  return structuredClone({ ...record, recordedByRunId: profile.runId })
}

// One further explicitly reviewed entry from the actual closed Erosion wait.
// This is not a retry policy: the old claims stay immutable and another entry is refused.
export const EROSION_CONTINUATION = Object.freeze({
  kind: 'mission3-recovered-sermon-erosion-continuation',
  mappingSha256: '17902ef07ad3cf3fb15c1f79dc36e473c980926531a246e9f016702a23d7da3e',
  priorRunId: '1c430e41-9aca-4a05-bb45-7bd8076ffffd',
  sourceCommit: 'bbd7371e04a55e57b1e368530e92de6777864358',
  receiptSha256: 'e43af2735c564e5d025b13036481187764a4d6d715df68f85f04efbc3e7c6bd6',
  outerSha256: 'c1d189d271f39d8472799722369e182a79dca17c1ee6c6a8d1ea6cb9d3646b18',
  journeySha256: '72ba6f6e5f90d723e6e8274cee212a70b93a1884dd8d0dcc94c1803ba449639b',
  terminalSha256: 'b7d71fb34de48c1af6a196294e0a6699d3aeee5f52ea21061774dca332da8bf3',
  actionsSha256: 'a5684ab1d3bb51790f9b5561768b7d52defa51fb0af79455781ab9d1edb982db',
  recordSha256: '06bfa8ee047dbd35deed07e65ac6c3bc15e65a7aa65cf5e977976f6b798b77fb',
})
const epochScalars = epoch => Object.fromEntries(['name', 'baselineGameTime', 'lastGameTime', 'activeSeconds',
  'firstTurn', 'lastTurn', 'samples', 'errors', 'speedViolations'].map(key => [key, epoch[key]]))

export function erosionContinuationHistory(journey, terminal, priorRecord) {
  assert.equal(journey.status, 'failed'); assert.equal(journey.inheritedActiveSeconds, 418.08333333333337)
  assert.equal(priorRecord.kind, SUCCESSOR.kind)
  assert.equal(priorRecord.gameplayContinuation.history.activeSeconds, journey.inheritedActiveSeconds)
  assert.equal(journey.epochs.length, 1, 'Count the one real closed epoch, then the open terminal epoch once')
  const closed = journey.epochs[0], open = terminal.observation
  assert.equal(closed.name, 'saved-sermon-entry'); assert.equal(closed.lastGameTime, 408.25)
  assert.equal(closed.firstTurn, 4830); assert.equal(closed.lastTurn, 4899); assert.equal(closed.samples, 70)
  assert.equal(open.name, 'reload-1'); assert.equal(open.firstTurn, 4838)
  assert.equal(open.lastTurn, 11471); assert.equal(open.samples, 6634)
  assert.equal(terminal.turn, 11471); assert.equal(terminal.time, 11471 / 12); assert.equal(terminal.paused, true)
  assert.equal(open.lastGameTime, terminal.time)
  for (const epoch of [closed, open]) {
    assert.equal(epoch.baselineGameTime, priorRecord.checkpoint.time)
    assert.equal(epoch.activeSeconds, epoch.lastGameTime - epoch.baselineGameTime)
    assert.deepEqual(epoch.errors, []); assert.deepEqual(epoch.speedViolations, [])
  }
  const activeSeconds = journey.inheritedActiveSeconds + closed.activeSeconds + open.activeSeconds
  assert.equal(activeSeconds, 980.0833333333333)
  assert.equal(journey.failures.length, 3)
  assert.deepEqual(journey.failures, priorRecord.gameplayContinuation.history.failures.map(f => ({ ...f, inheritedFromSavedSermon: true })))
  assert.equal(journey.controlStops.length, 2)
  assert.deepEqual(journey.controlStops[0], { ...priorRecord.gameplayContinuation.history.controlStops[0], inheritedFromPriorGameplay: true })
  assert.equal(journey.controlStops[1].index, 3); assert.equal(journey.controlStops[1].code, 'progress-stall')
  assert.deepEqual(journey.milestones.map(m => m.name), ['vault', 'shaman-home', 'temple', 'preacher', 'listener',
    'sermon-saved', 'sermon-cancelled', 'sermon-reloaded', 'conversion'])
  assert.deepEqual(journey.milestones.slice(0, 6), priorRecord.milestones.map(m => ({ ...m, inheritedFromSavedSermon: true })))
  assert.ok(Array.isArray(journey.inputs) && journey.inputs.length > 0)
  return structuredClone({ priorRunId: EROSION_CONTINUATION.priorRunId, activeSeconds,
    inheritedActiveSeconds: journey.inheritedActiveSeconds, closedEpochs: [epochScalars(closed)], openEpoch: epochScalars(open),
    failures: journey.failures, controlStops: journey.controlStops, priorMilestones: journey.milestones, priorInputs: journey.inputs })
}

export function erosionContinuationBudget(history) {
  const conversion = history.priorMilestones.find(m => m.name === 'conversion')
  assert.equal(conversion?.activeSeconds, 452.8333333333334)
  assert.equal(conversion.turn, 5144); assert.equal(conversion.epoch, 'reload-1')
  const cumulativeActiveCeiling = Math.min(2400, conversion.activeSeconds + 1800)
  assert.equal(cumulativeActiveCeiling, 2252.8333333333335)
  return { priorConversionActiveSeconds: conversion.activeSeconds, cumulativeActiveCeiling,
    remainingActiveSeconds: cumulativeActiveCeiling - history.activeSeconds,
    segmentWallMs: 90 * 60_000, outerWallMs: 95 * 60_000 }
}

export function validateErosionContinuationFacts(payload, prior, outer, manifest, context) {
  const expected = EROSION_CONTINUATION
  assert.equal(payload.version, 1); assert.equal(payload.kind, expected.kind); assert.equal(payload.mappingSha256, expected.mappingSha256)
  assert.equal(prior.status, 'failed'); assert.equal(prior.source.commit, expected.sourceCommit)
  assert.deepEqual(prior.sourceAfter, prior.source); assert.deepEqual(prior.runtimeAfter, prior.runtime)
  assert.equal(prior.profile.runId, expected.priorRunId); assert.equal(prior.profile.id, SUCCESSOR.profileId)
  assert.equal(prior.profile.cleanupVerified, true); assert.equal(prior.profile.continuationVerified, true)
  assert.deepEqual(prior.profile.checkpointAtStart, prior.profile.checkpointAtEnd)
  assert.equal(prior.profile.checkpointAtEnd.turn, 4813)
  assert.equal(prior.profile.checkpointAtEnd.checkpointSha256, '720e96e28b46a029e22a1c97729ead760471c96e4e10c59fd5ae620d5e66f57a')
  assert.equal(outer.status, 'failed'); assert.equal(outer.phase, 'finished'); assert.equal(outer.exitCode, 1)
  assert.equal(outer.signal, null); assert.equal(outer.source.headOid, prior.source.commit); assert.deepEqual(outer.sourceAfter, outer.source)
  assert.equal(manifest.erosionContinuationClaim, undefined, 'The one Erosion continuation is already claimed')
  assert.equal(manifest.id, SUCCESSOR.profileId); assert.equal(manifest.path, prior.profile.path)
  assert.equal(manifest.lastRun?.runId, expected.priorRunId)
  assert.equal(manifest.lastRun.receiptSha256, expected.receiptSha256)
  assert.equal(manifest.lastRun.receiptPath, payload.predecessor.receipt.path)
  for (const [key, value] of Object.entries({ sourceCommit: prior.source.commit, sourceFingerprint: prior.source.fingerprint,
    checker: prior.profile.inputs.checker, status: 'failed', cleanupVerified: true, continuationVerified: true,
    checkpointAtEnd: prior.profile.checkpointAtEnd })) assert.deepEqual(manifest.lastRun[key], value)
  assert.deepEqual(manifest.recoveryAdmission, prior.profile.recoveryAdmission.reference)
  assert.deepEqual(manifest.recoveryClaim, prior.profile.recoveryClaim)
  assert.equal(manifest.recoveryClaim.runId, SUCCESSOR.priorRunId)
  assert.deepEqual(manifest.gameplayContinuationClaim, prior.profile.gameplayContinuationClaim)
  assert.equal(manifest.gameplayContinuationClaim.runId, expected.priorRunId)
  assert.equal(manifest.gameplayContinuationClaim.priorRunId, SUCCESSOR.priorRunId)
  const previousBinding = { root: prior.source.root, origin: prior.profile.origin,
    application: prior.profile.inputs.application, runtime: prior.runtime }
  assert.deepEqual(manifest.binding, previousBinding, 'Old binding must match the actual terminal receipt')
  assert.deepEqual(payload.previousBinding, previousBinding)
  const target = payload.target
  assert.equal(target.profile.id, manifest.id); assert.equal(target.profile.path, manifest.path)
  assert.equal(target.root, previousBinding.root); assert.equal(target.origin, RECOVERY.origin)
  for (const key of ['root', 'origin', 'source', 'inputs', 'runtime', 'scenario'])
    assert.deepEqual(context[key], target[key], `Erosion continuation target ${key} changed`)
  assert.equal(context.id, target.profile.id); assert.equal(context.path, target.profile.path)
  assert.equal(target.scenario.path, resolve(target.root, 'qa/mission-three-controls/driver.mjs'))
}

export function readErosionContinuation(correspondence, context, manifest) {
  const reference = JSON.parse(readFileSync(correspondence, 'utf8'))
  const payload = readJson(reference), review = readJson(reference.review), expected = EROSION_CONTINUATION
  assert.equal(review.decision, 'ACCEPT'); assert.ok(review.reviewer && review.reference)
  assert.equal(review.correspondenceSha256, reference.sha256)
  assert.equal(review.sourceCommit, payload.target.source.commit)
  assert.equal(review.sourceFingerprint, payload.target.source.fingerprint); assert.equal(review.checker, payload.target.inputs.checker)
  const p = payload.predecessor
  const prior = pinned(p.receipt, expected.receiptSha256), outer = pinned(p.outer, expected.outerSha256)
  const journey = pinned(p.journey, expected.journeySha256), terminal = pinned(p.terminal, expected.terminalSha256)
  const priorRecord = pinned(p.record, expected.recordSha256)
  assert.equal(p.actions.sha256, expected.actionsSha256)
  const actions = readArtifact(p.actions).toString().trim().split('\n').map(line => JSON.parse(line))
  assert.ok(actions.some(action => action.action === 'latest-preserved-on-stop' && action.intendedSaveVerified === true &&
    JSON.stringify(action.actual) === JSON.stringify(prior.profile.checkpointAtEnd)))
  validateErosionContinuationFacts(payload, prior, outer, manifest, context)
  assert.equal(digest(readFileSync(payload.target.scenario.path)), payload.target.scenario.sha256)
  for (const ref of [manifest.recoveryAdmission, manifest.gameplayContinuationClaim.reference]) {
    readArtifact(ref); readArtifact(ref.review)
  }
  assert.equal(priorRecord.recordedByRunId, expected.priorRunId); assert.equal(priorRecord.savedByRunId, RECOVERY.saveRunId)
  assert.equal(priorRecord.recoveryAdmissionSha256, manifest.recoveryAdmission.sha256)
  assert.deepEqual(priorRecord.checkpoint, prior.profile.checkpointAtEnd); assert.equal(priorRecord.continuationBlockedReason, undefined)
  const history = erosionContinuationHistory(journey, terminal, priorRecord), budget = erosionContinuationBudget(history)
  assert.deepEqual(payload.history, history); assert.deepEqual(payload.budget, budget)
  return { reference, target: payload.target, previousBinding: payload.previousBinding, priorRecord,
    priorRecordSha256: p.record.sha256, priorRunId: expected.priorRunId, history, budget,
    recoveryAdmission: prior.profile.recoveryAdmission, recoveryClaim: prior.profile.recoveryClaim,
    gameplayContinuationClaim: prior.profile.gameplayContinuationClaim }
}

export function createErosionContinuationRecord(continuation, assembledErosionContinuationAt) {
  assert.ok(typeof assembledErosionContinuationAt === 'string' && Number.isFinite(Date.parse(assembledErosionContinuationAt)))
  return structuredClone({ ...continuation.priorRecord, kind: EROSION_CONTINUATION.kind, assembledErosionContinuationAt,
    erosionPredecessorRecordSha256: continuation.priorRecordSha256,
    erosionContinuation: { reference: continuation.reference, target: continuation.target,
      priorRunId: continuation.priorRunId, history: continuation.history, budget: continuation.budget } })
}

export function validateErosionContinuationRecord(record, { source, profile, origin, checkpoint }) {
  const continuation = profile?.erosionContinuation
  assert.ok(continuation, 'Erosion continuation requires the exact reviewed harness correspondence')
  assert.deepEqual(record, createErosionContinuationRecord(continuation, record.assembledErosionContinuationAt))
  assert.equal(profile.mode, 'reused'); assert.equal(profile.id, SUCCESSOR.profileId)
  assert.equal(profile.path, continuation.target.profile.path); assert.equal(origin, RECOVERY.origin)
  assert.deepEqual(source, continuation.target.source); assert.deepEqual(profile.inputs, continuation.target.inputs)
  assert.deepEqual(checkpoint, record.checkpoint); assert.equal(record.recordedByRunId, EROSION_CONTINUATION.priorRunId)
  assert.equal(profile.previousRun?.runId, EROSION_CONTINUATION.priorRunId)
  assert.equal(profile.erosionContinuationClaim?.runId, profile.runId)
  assert.equal(profile.erosionContinuationClaim.priorRunId, EROSION_CONTINUATION.priorRunId)
  assert.equal(profile.erosionContinuationClaim.correspondenceSha256, continuation.reference.sha256)
  assert.deepEqual(profile.erosionContinuationClaim.reference, continuation.reference)
  assert.deepEqual(profile.erosionContinuationClaim.previousBinding, continuation.previousBinding)
  assert.deepEqual(profile.recoveryClaim, continuation.recoveryClaim)
  assert.deepEqual(profile.recoveryAdmission.reference, continuation.recoveryAdmission.reference)
  assert.deepEqual(profile.gameplayContinuationClaim, continuation.gameplayContinuationClaim)
  return structuredClone({ ...record, recordedByRunId: profile.runId })
}
