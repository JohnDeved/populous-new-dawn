// Host-only provenance for a real UI sermon Save. Never writes game storage.
import assert from 'node:assert/strict'
import { requireFirstOwnedListener } from './observation.mjs'
import { validateRecoveredSermonRecord } from './recovery-admission.mjs'
import { validateSuccessorSermonRecord, validateErosionContinuationRecord } from './sermon-successor.mjs'

const copy = value => structuredClone(value)
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
const prefix = ['vault', 'shaman-home', 'temple', 'preacher', 'listener', 'sermon-saved']

export function createSermonRecord({ source, profile, observed, origin, state, declaration, epoch,
  ids, milestones, activeSeconds, inputs, failures, acquisition }) {
  assert.equal(state.level, 3); assert.equal(state.paused, true); assert.equal(state.speed, 1)
  assert.equal(state.status, 'playing'); assert.ok(!state.completedMissions.includes(3))
  assert.deepEqual(state.observation.errors ?? [], []); assert.deepEqual(state.observation.speedViolations ?? [], [])
  const firstOwned = requireFirstOwnedListener(state, ids.preacher, declaration, epoch)
  assert.equal(firstOwned.victim.id, ids.victim)
  assert.ok(profile?.id && profile.path && profile.runId)
  assert.equal(observed.profileId, profile.id); assert.equal(observed.runId, profile.runId)
  assert.equal(observed.sourceFingerprint, source.fingerprint)
  const checkpoint = observed.checkpoint
  assert.equal(checkpoint?.level, 3); assert.equal(checkpoint.turn, state.turn); assert.equal(checkpoint.time, state.time)
  for (const key of ['checkpointSha256', 'actorsSha256', 'terrainSha256', 'stockSha256']) assert.ok(hash(checkpoint[key]))
  assert.ok(hash(source.fingerprint) && Number.isFinite(activeSeconds) && activeSeconds >= state.time)
  for (const name of prefix) assert.equal(milestones.filter(m => m.name === name).length, 1)
  return copy({ version: 1, kind: 'mission3-ui-sermon', source,
    profile: { id: profile.id, path: profile.path }, origin, savedByRunId: profile.runId,
    recordedByRunId: profile.runId, checkpoint, ids, declaration, epoch, firstOwned,
    retainedBlueIds: state.units.filter(u => u.team === 'blue' && u.hp > 0).map(u => u.id),
    milestones, activeSeconds, inputs, failures, acquisition, initialMission3Absent: true,
    scope: 'Observed ordinary sermon Save. This inherits its original acquisition and retained failures; Load starts a new labelled segment, not a fresh or clean acquisition.' })
}

export function validateSermonRecord(record, { source, profile, origin, checkpoint }) {
  if (record?.kind === 'mission3-recovered-sermon-erosion-continuation') return validateErosionContinuationRecord(record, { source, profile, origin, checkpoint })
  if (record?.kind === 'mission3-recovered-sermon-successor') return validateSuccessorSermonRecord(record, { source, profile, origin, checkpoint })
  if (record?.kind === 'mission3-recovered-ui-sermon') return validateRecoveredSermonRecord(record, { source, profile, origin, checkpoint })
  assert.equal(record.version, 1); assert.equal(record.kind, 'mission3-ui-sermon')
  assert.equal(record.continuationBlockedReason, undefined, 'A withheld sermon record cannot authorize continuation')
  assert.equal(record.initialMission3Absent, true)
  assert.equal(profile?.mode, 'reused'); assert.equal(profile.id, record.profile.id)
  assert.equal(profile.path, record.profile.path); assert.equal(origin, record.origin)
  assert.deepEqual(checkpoint, record.checkpoint, 'Latest must be the exact observed committed sermon')
  assert.ok(hash(record.source.fingerprint) && hash(record.checkpoint.checkpointSha256))
  assert.equal(record.firstOwned.victim.id, record.ids.victim)
  assert.equal(record.firstOwned.preacherId, record.ids.preacher)
  assert.equal(record.declaration.preacherId, record.ids.preacher)
  assert.ok(record.firstOwned.turnBefore >= record.declaration.armedAtTurn)
  assert.equal(record.firstOwned.turnAfter, record.firstOwned.turnBefore + 1)
  assert.ok(record.checkpoint.turn >= record.firstOwned.turnAfter)
  assert.ok(record.declaration.candidateIds.includes(record.ids.victim))
  assert.ok(Number.isFinite(record.activeSeconds) && record.activeSeconds >= record.checkpoint.time)
  assert.ok(record.retainedBlueIds.includes(record.ids.preacher))
  assert.ok(Array.isArray(record.failures) && Array.isArray(record.inputs))
  for (const name of prefix) assert.equal(record.milestones.filter(m => m.name === name).length, 1)
  const prior = profile.previousRun, admission = record.qaResume
  assert.equal(prior?.runId, record.recordedByRunId, 'Use the immediately preceding forwarded sermon record')
  const previousSource = admission?.source ?? record.source
  assert.equal(prior.sourceFingerprint, previousSource.fingerprint)
  assert.equal(prior.sourceCommit, previousSource.commit)
  if (admission) {
    const approved = admission.correspondence
    assert.equal(approved.previousSourceFingerprint, record.source.fingerprint)
    assert.equal(approved.currentSourceFingerprint, admission.source.fingerprint)
    assert.equal(approved.currentChecker, admission.checker)
    assert.equal(approved.decision, 'ACCEPT'); assert.ok(hash(approved.sha256) && approved.reviewer && approved.reference)
    assert.equal(prior.checker, admission.checker); assert.equal(profile.inputs?.checker, admission.checker)
    assert.equal(source.fingerprint, admission.source.fingerprint, 'No further saved-sermon QA transition is permitted')
  }
  let qaResume = admission
  if (source.fingerprint === previousSource.fingerprint) {
    assert.deepEqual(source, previousSource); assert.equal(profile.correspondence, null)
  } else {
    const approved = profile.correspondence
    assert.ok(approved, 'Changed source needs the exact harness-validated correspondence')
    assert.equal(approved.decision, 'ACCEPT'); assert.ok(hash(approved.sha256) && approved.reviewer && approved.reference)
    assert.equal(approved.priorRunId, prior.runId)
    assert.equal(approved.previousSourceFingerprint, previousSource.fingerprint)
    assert.equal(approved.currentSourceFingerprint, source.fingerprint)
    assert.equal(approved.previousChecker, prior.checker)
    assert.equal(approved.currentChecker, profile.inputs?.checker)
    qaResume = { source, checker: profile.inputs.checker, correspondence: approved }
  }
  return copy({ ...record, recordedByRunId: profile.runId, ...(qaResume ? { qaResume } : {}) })
}

export function validateLoadedSermon(record, state, { pausedByEntryControl = false } = {}) {
  assert.equal(state.level, 3); assert.equal(state.speed, 1); assert.equal(state.status, 'playing')
  assert.equal(state.paused, pausedByEntryControl, pausedByEntryControl ?
    'The immediate ordinary Pause control must have paused the loaded game' : 'Ordinary Load auto-resumes')
  assert.ok(!state.completedMissions.includes(3))
  assert.ok(state.turn >= record.checkpoint.turn && state.time >= record.checkpoint.time)
  const victim = state.units.find(u => u.id === record.ids.victim)
  assert.ok(victim && victim.team === 'yellow' && victim.kind === 'brave' && victim.hp > 0)
  assert.equal(victim.nativeState, 23); assert.equal(victim.owner, record.ids.preacher)
  const preacher = state.units.find(u => u.id === record.ids.preacher)
  assert.ok(preacher && preacher.team === 'blue' && preacher.kind === 'preacher' && preacher.hp > 0)
  for (const id of record.retainedBlueIds)
    assert.ok(state.units.some(u => u.id === id && u.team === 'blue' && u.hp > 0), `Retained Blue identity ${id}`)
}

export function requirePreservedCheckpoint(expected, observed) {
  assert.ok(expected, 'A committed checkpoint must be known before preserving it')
  assert.deepEqual(observed?.checkpoint, expected, 'The actual latest checkpoint still matches the committed record')
  return copy(observed.checkpoint)
}
