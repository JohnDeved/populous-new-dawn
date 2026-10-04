// Host-only provenance checks. Never reconstructs a World or writes browser storage.
import assert from 'node:assert/strict'

const required = ['vault', 'shaman-home', 'temple']
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
const copy = value => structuredClone(value)

export function validatePreparationState(state, ids) {
  assert.equal(state.level, 3); assert.equal(state.speed, 1); assert.equal(state.status, 'playing')
  assert.equal(state.unlockedTemple, true); assert.ok(!state.completedMissions.includes(3))
  const shaman = state.units.find(u => u.id === ids.shaman)
  assert.ok(shaman?.team === 'blue' && shaman.kind === 'shaman' && shaman.hp > 0)
  const temple = state.buildings.find(b => b.id === ids.temple)
  assert.ok(temple?.team === 'blue' && temple.kind === 'temple' && temple.hp > 0 && temple.progress >= 1)
  const victim = state.units.find(u => u.id === ids.authoredVictim)
  assert.ok(victim?.team === 'yellow' && victim.kind === 'brave' && victim.hp > 0)
  assert.ok(state.shrines.some(s => s.id === ids.vault && s.kind === 'vault'))
  assert.ok(state.shrines.some(s => s.id === ids.erosion && s.kind === 'erosionEffect'))
  assert.ok(!ids.preacher && !ids.trainee && !ids.victim && !ids.replacement)
  assert.ok(!state.units.some(u => u.team === 'blue' && u.kind === 'preacher'))
}

export function createPreparationRecord({ source, profile, origin, checkpoint, state, ids,
  milestones, activeSeconds, inputs, failures, controlStops }) {
  validatePreparationState(state, ids)
  assert.equal(state.paused, true)
  assert.deepEqual(failures, []); assert.deepEqual(controlStops, [])
  assert.equal(milestones.length, required.length)
  for (const name of required) assert.equal(milestones.filter(m => m.name === name).length, 1)
  assert.ok(hash(source.fingerprint) && hash(checkpoint.sha256))
  assert.ok(profile?.id && profile.path && ['created', 'reused'].includes(profile.mode))
  assert.equal(checkpoint.level, 3); assert.equal(checkpoint.turn, state.turn); assert.equal(checkpoint.time, state.time)
  assert.ok(Number.isFinite(activeSeconds) && activeSeconds >= state.time)
  return copy({ version: 1, kind: 'mission3-ui-preparation', source, profile: { id: profile.id, path: profile.path },
    origin, checkpoint, ids, milestones, activeSeconds, inputs,
    retainedBlueIds: state.units.filter(u => u.team === 'blue').map(u => u.id),
    initialMission3Absent: true,
    scope: 'Observed ordinary acquisition prefix through Temple. Loading continues this saved prefix; it is not a fresh entry or evidence that later failed attempts passed.' })
}

function admitPreparationSource(record, source, profile) {
  const prior = profile.previousRun, admission = record.qaAdmission
  if (!admission && source.fingerprint === record.source.fingerprint) {
    assert.deepEqual(source, record.source)
    return undefined
  }
  if (admission) {
    const approved = admission.correspondence
    assert.equal(admission.preparationFingerprint, record.source.fingerprint)
    assert.equal(admission.checkpointSha256, record.checkpoint.sha256)
    assert.equal(admission.profileId, profile.id)
    assert.equal(approved.previousSourceFingerprint, record.source.fingerprint)
    assert.equal(approved.currentSourceFingerprint, admission.source.fingerprint)
    assert.equal(approved.currentChecker, admission.checker)
    assert.equal(approved.decision, 'ACCEPT'); assert.ok(hash(approved.sha256) && approved.reviewer && approved.reference)
    assert.equal(source.fingerprint, admission.source.fingerprint, 'No second QA source transition is permitted')
    assert.deepEqual(source, admission.source)
    assert.equal(prior?.sourceFingerprint, source.fingerprint)
    assert.equal(prior?.checker, admission.checker); assert.equal(profile.inputs?.checker, admission.checker)
    assert.equal(prior?.runId, admission.recordedByRunId, 'Use the immediately preceding admitted preparation record')
    assert.equal(profile.correspondence, null, 'Same admitted source needs no additional correspondence')
    return copy({ ...admission, recordedByRunId: profile.runId })
  }
  // Only consume the object already validated by acquireProfile. A supplied file
  // or a caller's claimed reviewer string is not independently admitted here.
  const approved = profile.correspondence
  assert.ok(approved, 'Changed QA source requires the harness-validated explicit correspondence')
  assert.equal(approved.decision, 'ACCEPT'); assert.ok(hash(approved.sha256) && approved.reviewer && approved.reference)
  assert.equal(approved.previousSourceFingerprint, record.source.fingerprint)
  assert.equal(approved.currentSourceFingerprint, source.fingerprint)
  assert.equal(prior?.sourceFingerprint, record.source.fingerprint)
  assert.equal(prior?.sourceCommit, record.source.commit)
  assert.equal(approved.priorRunId, prior.runId)
  assert.equal(approved.previousChecker, prior.checker)
  assert.equal(approved.currentChecker, profile.inputs?.checker)
  assert.ok(profile.runId && hash(profile.inputs.checker))
  return copy({ source, checker: profile.inputs.checker, correspondence: approved,
    preparationFingerprint: record.source.fingerprint, checkpointSha256: record.checkpoint.sha256,
    profileId: profile.id, recordedByRunId: profile.runId })
}

export function validatePreparationRecord(record, { source, profile, origin, checkpoint }) {
  assert.equal(record.version, 1); assert.equal(record.kind, 'mission3-ui-preparation')
  assert.equal(record.initialMission3Absent, true)
  assert.ok(hash(record.source?.fingerprint) && hash(record.checkpoint?.sha256))
  assert.equal(profile?.mode, 'reused', 'Load requires the previously owned persistent profile')
  assert.equal(profile.id, record.profile.id); assert.equal(profile.path, record.profile.path)
  assert.equal(origin, record.origin)
  assert.deepEqual(checkpoint, record.checkpoint, 'The committed latest checkpoint must be the recorded preparation')
  assert.equal(record.milestones.length, required.length)
  for (const name of required) assert.equal(record.milestones.filter(m => m.name === name).length, 1)
  assert.ok(Number.isFinite(record.activeSeconds) && record.activeSeconds >= record.checkpoint.time)
  assert.ok(Array.isArray(record.retainedBlueIds) && record.retainedBlueIds.length)
  const qaAdmission = admitPreparationSource(record, source, profile)
  return copy({ ...record, ...(qaAdmission ? { qaAdmission } : {}) })
}

export function validateLoadedPreparation(record, state) {
  validatePreparationState(state, record.ids)
  assert.equal(state.paused, false, 'Ordinary Load auto-resumes')
  assert.ok(state.turn >= record.checkpoint.turn && state.time >= record.checkpoint.time)
  for (const id of record.retainedBlueIds)
    assert.ok(state.units.some(u => u.id === id && u.team === 'blue' && u.hp > 0), `Retained Blue identity ${id}`)
}
