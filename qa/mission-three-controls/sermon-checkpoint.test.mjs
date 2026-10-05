import assert from 'node:assert/strict'
import test from 'node:test'
import * as checkpoint from './sermon-checkpoint.mjs'
import * as observation from './observation.mjs'

const source = { commit: 'a'.repeat(40), fingerprint: 'b'.repeat(64) }
const fixture = () => {
  const declaration = { preacherId: 3163, armedAtTurn: 4101, candidateIds: [50, 53] }
  const firstOwned = { preacherId: 3163, turnBefore: 4777, turnAfter: 4778, victim: { id: 50 } }
  const state = { level: 3, turn: 4813, time: 4813 / 12, paused: true, speed: 1, status: 'playing', completedMissions: [],
    observation: { name: 'entry', sermon: { ...declaration, firstOwned } }, buildings: [], shrines: [],
    units: [{ id: 3163, team: 'blue', kind: 'preacher', hp: 55 },
      { id: 46, team: 'blue', kind: 'shaman', hp: 100 },
      { id: 50, team: 'yellow', kind: 'brave', hp: 50, nativeState: 23, owner: 3163, flags2: 0x200000, flags4: 128,
        personOwner: 'native', conversionNative: { state: 23, workTarget: 3163, flags2: 0x200000, flags4: 128 } }] }
  const committed = { level: 3, turn: state.turn, time: state.time, version: 1,
    checkpointSha256: 'c'.repeat(64), actorsSha256: 'd'.repeat(64), terrainSha256: 'e'.repeat(64), stockSha256: 'f'.repeat(64) }
  const profile = { id: 'game-only', path: '/owned/profile', runId: 'save-run', mode: 'reused' }
  const observed = { profileId: profile.id, runId: profile.runId, sourceFingerprint: source.fingerprint, checkpoint: committed }
  return { source, profile, observed, origin: 'http://127.0.0.1:4366', state, declaration, epoch: 'entry',
    ids: { shaman: 46, preacher: 3163, victim: 50, erosion: 101 },
    milestones: ['vault', 'shaman-home', 'temple', 'preacher', 'listener', 'sermon-saved'].map(name => ({ name })),
    activeSeconds: state.time, inputs: [], failures: [{ index: 29, error: 'retained failed probe' }], acquisition: { source: 'original' } }
}

test('sermon provenance requires the genuine committed save and preserves its failed acquisition prefix', () => {
  const input = fixture(), before = structuredClone(input), record = checkpoint.createSermonRecord(input)
  assert.deepEqual(input, before); assert.deepEqual(record.failures, input.failures)
  assert.deepEqual(record.checkpoint, input.observed.checkpoint)
  assert.equal(record.firstOwned.victim.id, 50); assert.equal(record.savedByRunId, 'save-run')
  for (const change of [{ observed: { ...input.observed, runId: 'other' } },
    { state: { ...input.state, paused: false } }, { ids: { ...input.ids, victim: 53 } },
    { observed: { ...input.observed, checkpoint: { ...input.observed.checkpoint, turn: 4814 } } }])
    assert.throws(() => checkpoint.createSermonRecord({ ...input, ...change }))
})

test('saved-sermon Load requires exact stored digest, source/profile and actual resumed listener', () => {
  const input = fixture(), record = checkpoint.createSermonRecord(input)
  const profile = { ...input.profile, runId: 'load-run', correspondence: null,
    previousRun: { runId: 'save-run', sourceFingerprint: source.fingerprint, sourceCommit: source.commit } }
  const context = { source, profile, origin: input.origin, checkpoint: input.observed.checkpoint }
  const forwarded = checkpoint.validateSermonRecord(record, context)
  assert.throws(() => checkpoint.validateSermonRecord({ ...record, continuationBlockedReason: 'failed readback' }, context), /withheld/)
  assert.equal(forwarded.recordedByRunId, 'load-run'); assert.equal(forwarded.savedByRunId, 'save-run')
  assert.deepEqual(forwarded.source, record.source)
  for (const change of [{ checkpoint: { ...context.checkpoint, checkpointSha256: '0'.repeat(64) } },
    { origin: 'http://other' }, { profile: { ...profile, id: 'other' } },
    { profile: { ...profile, previousRun: { ...profile.previousRun, runId: 'older' } } }])
    assert.throws(() => checkpoint.validateSermonRecord(record, { ...context, ...change }))
  const loaded = { ...input.state, paused: false, turn: 4843, time: 4843 / 12 }
  assert.doesNotThrow(() => checkpoint.validateLoadedSermon(record, loaded))
  assert.throws(() => checkpoint.validateLoadedSermon(record, input.state))
  for (const change of [{ nativeState: 19 }, { owner: 999 }, { team: 'blue' }, { hp: 0 }])
    assert.throws(() => checkpoint.validateLoadedSermon(record, { ...loaded,
      units: loaded.units.map(u => u.id === 50 ? { ...u, ...change } : u) }))
})

test('one saved-sermon QA admission uses only the exact harness-reviewed edge and forwards without relabelling the save', () => {
  const input = fixture(), record = checkpoint.createSermonRecord(input)
  const nextSource = { commit: '1'.repeat(40), fingerprint: '2'.repeat(64) }
  const correspondence = { decision: 'ACCEPT', reviewer: 'reviewer', reference: 'review', sha256: '3'.repeat(64),
    priorRunId: 'save-run', previousSourceFingerprint: source.fingerprint, currentSourceFingerprint: nextSource.fingerprint,
    previousChecker: '4'.repeat(64), currentChecker: '5'.repeat(64) }
  const profile = { ...input.profile, runId: 'load-run', inputs: { checker: '5'.repeat(64) }, correspondence,
    previousRun: { runId: 'save-run', sourceFingerprint: source.fingerprint, sourceCommit: source.commit, checker: '4'.repeat(64) } }
  const context = { source: nextSource, profile, origin: input.origin, checkpoint: input.observed.checkpoint }
  const admitted = checkpoint.validateSermonRecord(record, context)
  assert.deepEqual(admitted.source, record.source); assert.deepEqual(admitted.acquisition, record.acquisition)
  assert.deepEqual(admitted.qaResume.correspondence, correspondence)
  assert.throws(() => checkpoint.validateSermonRecord(record, { ...context, profile: { ...profile, correspondence: null } }))
  for (const key of ['priorRunId', 'previousSourceFingerprint', 'currentSourceFingerprint', 'previousChecker', 'currentChecker'])
    assert.throws(() => checkpoint.validateSermonRecord(record, { ...context,
      profile: { ...profile, correspondence: { ...correspondence, [key]: 'wrong' } } }))
  const retry = { ...profile, runId: 'retry', correspondence: null,
    previousRun: { runId: 'load-run', sourceFingerprint: nextSource.fingerprint, sourceCommit: nextSource.commit, checker: '5'.repeat(64) } }
  assert.equal(checkpoint.validateSermonRecord(admitted, { ...context, profile: retry }).recordedByRunId, 'retry')
  assert.throws(() => checkpoint.validateSermonRecord(admitted, { ...context, profile: retry,
    source: { ...nextSource, fingerprint: '6'.repeat(64) } }), /No further/)
})

test('cancellation distinguishes cleared listener ownership from a later observed fight person', () => {
  const input = fixture(), before = input.state
  const released = { ...before, turn: 4862, units: before.units.map(u => u.id === 50 ?
    { ...u, nativeState: 19, owner: 0, flags4: 0, flags2: 0, personOwner: 'native',
      conversionNative: { state: 19, workTarget: 0, flags2: 0, flags4: 0 } } : u) }
  assert.equal(observation.requireCancelledSermon(before, released, 50, 3163).kind, 'released-native-listener')
  for (const personOwner of ['flight', 'builder'])
    assert.throws(() => observation.requireCancelledSermon(before, { ...released,
      units: released.units.map(u => u.id === 50 ? { ...u, personOwner,
        conversionNative: { state: 23, workTarget: 3163 } } : u) }, 50, 3163))
  const fighting = structuredClone(released), victim = fighting.units.find(u => u.id === 50)
  Object.assign(victim, { nativeState: 25, personOwner: 'fight', conversionNative: null, flags2: 0x200200,
    fight: { group: 3244, groupExists: true, personId: 50, state: 25, flags2: 0x200200 } })
  const original = structuredClone(fighting), evidence = observation.requireCancelledSermon(before, fighting, 50, 3163)
  assert.equal(evidence.kind, 'released-listener-observed-in-combat')
  assert.equal(evidence.clearedBitObserved, false, 'Do not invent an intermediate zero-bit observation')
  assert.deepEqual(fighting, original)
  for (const change of [{ personOwner: 'native' }, { fight: null }, { conversionNative: { state: 23 } },
    { fight: { ...victim.fight, groupExists: false } }, { owner: 3163 }, { flags4: 128 }, { nativeState: 23 }, { team: 'blue' }])
    assert.throws(() => observation.requireCancelledSermon(before, { ...fighting,
      units: fighting.units.map(u => u.id === 50 ? { ...u, ...change } : u) }, 50, 3163))
})

test('preserve-latest stop accepts only the observed committed checkpoint and never rewrites it', () => {
  const input = fixture(), expected = structuredClone(input.observed.checkpoint), observed = structuredClone(input.observed)
  assert.deepEqual(checkpoint.requirePreservedCheckpoint(expected, observed), expected)
  assert.deepEqual(input.observed, observed)
  assert.throws(() => checkpoint.requirePreservedCheckpoint(null, observed))
  assert.throws(() => checkpoint.requirePreservedCheckpoint(expected, { ...observed,
    checkpoint: { ...expected, turn: expected.turn + 1 } }))
  assert.throws(() => checkpoint.requirePreservedCheckpoint(expected, { ...observed,
    checkpoint: { ...expected, actorsSha256: '0'.repeat(64) } }))
})


test('pause-first entry validates an actually paused loaded state without claiming an unpaused observation', () => {
  const input = fixture(), record = checkpoint.createSermonRecord(input)
  assert.doesNotThrow(() => checkpoint.validateLoadedSermon(record, input.state, { pausedByEntryControl: true }))
  assert.throws(() => checkpoint.validateLoadedSermon(record, { ...input.state, paused: false }, { pausedByEntryControl: true }))
  assert.throws(() => checkpoint.validateLoadedSermon(record, input.state))
  for (const change of [{ nativeState: 19 }, { owner: 999 }, { team: 'blue' }, { hp: 0 }])
    assert.throws(() => checkpoint.validateLoadedSermon(record, { ...input.state,
      units: input.state.units.map(unit => unit.id === 50 ? { ...unit, ...change } : unit) }, { pausedByEntryControl: true }))
})
