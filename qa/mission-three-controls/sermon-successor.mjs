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
