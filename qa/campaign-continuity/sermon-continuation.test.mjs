import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { campaignActive, requireCampaignBudget, readSermonPredecessor, validateSermonPredecessor, sermonContinuation } from './boundaries.mjs'
import { requiredActorStop, objectiveProgress, requireCurrentConvertedWorker } from './observation.mjs'

// Published allowlisted evidence, never a browser profile/storage fixture. Like
// reuse.test, this source-bound QA requires its named historical Git object.
const evidence = '0e071eadb1c73d1627cde01ca3d5e4b951c41feb'
const prefix = 'references/verification/current-campaign-continuity-source-2026-10-05/mission-three-sermon-bcf8ac55/campaign-continuity/mission-three-segment-01/'
const raw = Object.fromEntries(Object.keys(sermonContinuation.hashes).map(name => [name,
  execFileSync('git', ['show', `${evidence}:${prefix}${name}`], { cwd: new URL('../../', import.meta.url), maxBuffer: 1024 * 1024 })]))
function fixture() {
  const records = Object.fromEntries(Object.entries(raw).filter(([name]) => name.endsWith('.json')).map(([name, bytes]) => [name, JSON.parse(bytes)]))
  const prior = records['receipt.json'], previous = { runId: prior.profile.runId,
    receiptSha256: sermonContinuation.hashes['receipt.json'], sourceFingerprint: prior.source.fingerprint,
    sourceCommit: prior.source.commit, status: prior.status,
    checker: prior.profile.inputs.checker, cleanupVerified: true, continuationVerified: true }
  const source = { fingerprint: 'unit-test-projected-source' }
  const profile = { id: prior.profile.id, inputs: { checker: 'unit-test-projected-checker' },
    checkpointAtStart: structuredClone(prior.profile.checkpointAtEnd), correspondence: {
      continuationKind: sermonContinuation.kind, decision: 'ACCEPT', reviewer: 'unit-fixture-only', reference: 'not-an-operational-grant',
      priorRunId: previous.runId, previousSourceFingerprint: previous.sourceFingerprint, currentSourceFingerprint: source.fingerprint,
      previousChecker: previous.checker, currentChecker: 'unit-test-projected-checker',
    } }
  return { records, previous, source, profile }
}
const accept = f => validateSermonPredecessor(f.previous, f.records, f.profile, f.source)
test('exact published predecessor retains the failed prefix and open epoch once, without a current replacement', () => {
  const f = fixture(), rawJourney = structuredClone(f.records['journey.json']), retained = accept(f)
  assert.equal(campaignActive(retained.epochs), 2692.666666666667)
  assert.equal(campaignActive(retained.epochs, null, 3), 853.6666666666666)
  assert.deepEqual(retained.failures, rawJourney.failures); assert.deepEqual(retained.controlStops, rawJourney.controlStops)
  assert.equal(retained.currentEpoch, null); assert.ok(retained.epochs.at(-1).retainedTerminalObservation)
  assert.equal(retained.ids.replacement, undefined); assert.equal(retained.sermonContinuation.priorStatus, 'failed')
  assert.deepEqual(f.records['journey.json'], rawJourney, 'Raw emitted history is immutable')
  const mark = retained.milestones.find(m => m.level === 3 && m.name === 'conversion').missionActiveSeconds
  const fresh = { name: 'new-reload', level: 3, activeSeconds: 1546.3333333333335 }
  assert.throws(() => requireCampaignBudget(retained.epochs, fresh, 3, retained.policy.limits, mark), /ceiling/)
})
test('actual hash reader rejects substituted or missing raw evidence before admission', () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'campaign-sermon-evidence-test-'))
  try {
    for (const [name, bytes] of Object.entries(raw)) writeFileSync(resolve(dir, name), bytes)
    const f = fixture(); f.previous.receiptPath = resolve(dir, 'receipt.json')
    assert.equal(readSermonPredecessor(f.previous, f.profile, f.source).sermonContinuation.priorRunId, sermonContinuation.runId)
    for (const name of Object.keys(raw)) {
      writeFileSync(resolve(dir, name), Buffer.concat([raw[name], Buffer.from(' ')]))
      assert.throws(() => readSermonPredecessor(f.previous, f.profile, f.source), /Exact sermon predecessor/)
      writeFileSync(resolve(dir, name), raw[name])
    }
    rmSync(resolve(dir, 'terminal.json'))
    assert.throws(() => readSermonPredecessor(f.previous, f.profile, f.source), /ENOENT/)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
test('different predecessor, source, checkpoint, cleanup, history or budget cannot enter', () => {
  for (const mutate of [
    f => { f.previous.runId = 'later-run' }, f => { f.previous.receiptSha256 = '0'.repeat(64) },
    f => { f.previous.cleanupVerified = false }, f => { f.records['receipt.json'].profile.continuationVerified = false },
    f => { f.records['receipt.json'].previousFailure = 'server-stop override' },
    f => { f.records['receipt.json'].failure = 'different finalizer failure' },
    f => { f.profile.id = 'different-profile' }, f => { f.profile.checkpointAtStart.turn++ },
    f => { f.profile.correspondence = null }, f => { f.profile.correspondence.continuationKind = 'generic-recovery' },
    f => { f.profile.correspondence.currentChecker = 'changed' }, f => { f.source.fingerprint = 'different' },
    f => { f.records['journey.json'].failures.pop() }, f => { f.records['journey.json'].controlStops = [] },
    f => { f.records['journey.json'].currentEpoch = null },
    f => { f.records['journey.json'].epochs.push(f.records['journey.json'].currentEpoch) },
    f => { f.records['journey.json'].epochs[0].activeSeconds-- },
    f => { f.records['journey.json'].missionWallMs[3]-- },
    f => { f.records['journey.json'].milestones.find(m => m.level === 3 && m.name === 'conversion').missionActiveSeconds = 853 },
    f => { f.records['journey.json'].sermonPlan.declaration.armedAtTurn++ },
    f => { f.records['journey.json'].savedSermon.victimId = 52 },
    f => { f.records['sermon-saved.json'].units.find(u => u.id === 2631).owner = 0 },
  ]) { const f = fixture(); mutate(f); assert.throws(() => accept(f)) }
})
const worship = () => ({ units: [{ id: 5000, hp: 50, kind: 'brave', team: 'blue', x: -20, z: 120,
  flags3: 0x1000000, flags4: 0x40000, personOwner: 'native', fight: null, order: { model: 27, a: 101 }, work: 101 }],
  shrines: [{ id: 101, uses: 0, work: 0, progress: 0, followers: 0 }], buildings: [], unlockedTemple: true })
const condition = { type: 'shrine-used', id: 101, workerId: 5000 }
test('named worship worker loss, combat or lost order stops immediately; completed use remains valid', () => {
  assert.equal(requiredActorStop(worship(), condition), null)
  for (const mutate of [s => { s.units = [] }, s => { s.units[0].hp = 0 }, s => { s.units[0].team = 'yellow' },
    s => { s.units[0].kind = 'preacher' }, s => { s.units[0].personOwner = 'fight' },
    s => { s.units[0].order = null }, s => { s.units[0].order.a = 92 }, s => { s.units[0].order.model = 3 }]) {
    const state = worship(); mutate(state); assert.match(requiredActorStop(state, condition).code, /^worship-worker-/)
    state.shrines[0].uses = 1; assert.equal(requiredActorStop(state, condition), null)
  }
})
test('named head and assigned-worker progress ignores unrelated motion and timers', () => {
  const state = worship(), progress = s => objectiveProgress(s, condition, 'worship', [101, 5000]), initial = progress(state)
  const unrelated = structuredClone(state); unrelated.units.push({ id: 6000, x: 20, z: 20, work: 101 }); unrelated.turn = 999
  unrelated.units[0].timer = 400; unrelated.unlockedTemple = false; assert.equal(progress(unrelated), initial)
  const moved = structuredClone(state); moved.units[0].x++; assert.notEqual(progress(moved), initial)
  const worked = structuredClone(state); worked.shrines[0].work++; assert.notEqual(progress(worked), initial)
})
test('absent current conversion or a different replacement cannot supply the new worker', () => {
  const state = worship(), prior = fixture().records['journey.json'].currentEpoch
  state.observation = { ...structuredClone(prior), conversions: { ...prior.conversions, events: [] } }
  assert.throws(() => requireCurrentConvertedWorker(state, 2631, 3181, 3298), /No exact singleton/)
  const event = structuredClone(prior.conversions.events.find(e => e.victims.some(v => v.id === 2631)))
  state.observation.conversions.events = [event]
  assert.throws(() => requireCurrentConvertedWorker(state, 2631, 3181, 5000), /Current worker/)
  event.replacements[0].id = 5000
  assert.equal(requireCurrentConvertedWorker(state, 2631, 3181, 5000).id, 5000)
  state.units[0].flags3 = 0
  assert.throws(() => requireCurrentConvertedWorker(state, 2631, 3181, 5000), /unavailable/)
})
