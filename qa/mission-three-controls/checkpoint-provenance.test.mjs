import assert from 'node:assert/strict'
import test from 'node:test'
import { createPreparationRecord, validatePreparationRecord, validateLoadedPreparation } from './checkpoint-provenance.mjs'

const fixture = () => {
  const source = { commit: 'a'.repeat(40), fingerprint: 'b'.repeat(64) }
  const profile = { id: 'owned-m3', path: '/owned/work/local-render-profiles/m3', mode: 'created' }
  const origin = 'http://127.0.0.1:4366'
  const checkpoint = { sha256: 'c'.repeat(64), level: 3, turn: 2886, time: 240.5 }
  const ids = { shaman: 46, temple: 1021, authoredVictim: 53, vault: 92, erosion: 101 }
  const state = { level: 3, speed: 1, status: 'playing', paused: true, unlockedTemple: true,
    completedMissions: [], turn: 2886, time: 240.5,
    units: [{ id: 46, team: 'blue', kind: 'shaman', hp: 100 }, { id: 300, team: 'blue', kind: 'brave', hp: 50 },
      { id: 53, team: 'yellow', kind: 'brave', hp: 50 }],
    buildings: [{ id: 1021, team: 'blue', kind: 'temple', hp: 300, progress: 1 }],
    shrines: [{ id: 92, kind: 'vault' }, { id: 101, kind: 'erosionEffect' }] }
  return { source, profile, origin, checkpoint, state, ids,
    milestones: ['vault', 'shaman-home', 'temple'].map((name, i) => ({ name, turn: 1000 + i * 500 })),
    activeSeconds: 240.5, inputs: [{ name: 'consumed-0001.json', sha256: 'd'.repeat(64) }], failures: [], controlStops: [] }
}

test('preparation provenance retains a nonmutating acquisition prefix and validates ordinary resumed identities', () => {
  const input = fixture(), before = structuredClone(input), record = createPreparationRecord(input)
  assert.deepEqual(input, before)
  const current = { ...input, profile: { ...input.profile, mode: 'reused' } }
  assert.deepEqual(validatePreparationRecord(record, current), record)
  const loaded = { ...input.state, paused: false, turn: 2892, time: 241 }
  assert.doesNotThrow(() => validateLoadedPreparation(record, loaded))
  record.ids.shaman = 999; assert.equal(input.ids.shaman, 46)
})

test('preparation provenance rejects wrong source/profile/origin/checkpoint and failed acquisition prefixes', () => {
  const input = fixture(), record = createPreparationRecord(input)
  const current = { ...input, profile: { ...input.profile, mode: 'reused' } }
  for (const change of [
    { source: { ...input.source, fingerprint: 'e'.repeat(64) } },
    { profile: { ...current.profile, id: 'another' } },
    { profile: { ...current.profile, path: '/another' } },
    { profile: input.profile }, { origin: 'http://127.0.0.1:9999' },
    { checkpoint: { ...input.checkpoint, sha256: 'f'.repeat(64) } },
    { checkpoint: { ...input.checkpoint, turn: 2887 } },
  ]) assert.throws(() => validatePreparationRecord(record, { ...current, ...change }))
  for (const change of [{ failures: [{ error: 'retained' }] }, { controlStops: [{ code: 'budget' }] },
    { milestones: input.milestones.slice(1) }, { ids: { ...input.ids, trainee: 300 } },
    { state: { ...input.state, completedMissions: [3] } }])
    assert.throws(() => createPreparationRecord({ ...input, ...change }))
})

test('ordinary loaded state must retain acquisition identities without assuming the save stays paused', () => {
  const input = fixture(), record = createPreparationRecord(input), loaded = { ...input.state, paused: false }
  assert.throws(() => validateLoadedPreparation(record, input.state))
  assert.throws(() => validateLoadedPreparation(record, { ...loaded, units: loaded.units.filter(u => u.id !== 300) }))
  assert.throws(() => validateLoadedPreparation(record, { ...loaded, buildings: [] }))
  assert.throws(() => validateLoadedPreparation(record, { ...loaded, turn: 100 }))
  assert.throws(() => validateLoadedPreparation(record, { ...loaded, units: [...loaded.units,
    { id: 3167, team: 'blue', kind: 'preacher', hp: 55 }] }))
})
