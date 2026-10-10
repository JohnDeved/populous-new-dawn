import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
const sha256 = value => createHash('sha256').update(value).digest('hex')
import { validateRunPolicy, campaignActive, requireCampaignBudget, requireLoadedCheckpoint,
  requireContinueBoundary, requireCampaignProfile, installReplacementObservation,
  replacementIdentity, validateSegmentPredecessor } from './boundaries.mjs'
import { missionRoutes } from './routes.mjs'

const policy = JSON.parse(readFileSync(new URL('./run-policy.json', import.meta.url)))
const boundary = (level = 2) => ({ sameStore: true, newWorld: true, newScene: true,
  currentCorrespondence: true, level, replacementLevel: level, error: null })
const saved = { level: 2, turn: 100, time: 8, checkpointSha256: 'full-committed', actorsSha256: 'actors', terrainSha256: 'terrain', stockSha256: 'stock' }
const epoch = (name, level, activeSeconds) => ({ name, level, activeSeconds })

test('disabled policy and malformed or infinite limits fail closed', () => {
  assert.throws(() => validateRunPolicy({ ...policy, launchEnabled: false }), /reviewed policy/)
  const enabled = { ...policy, launchEnabled: true }
  assert.equal(validateRunPolicy(enabled), enabled)
  assert.throws(() => validateRunPolicy({ ...enabled, applicationImports: {} }), /helper import/)
  const changedImport = structuredClone(enabled); changedImport.applicationImports['scripts/browser-game.mjs'] = 'unmeasured'
  assert.throws(() => validateRunPolicy(changedImport))
  for (const value of [null, 0, -1, Infinity, NaN]) {
    assert.throws(() => validateRunPolicy({ ...enabled, limits: { ...enabled.limits, segmentWallMs: value } }))
    assert.throws(() => validateRunPolicy({ ...enabled, limits: { ...enabled.limits, missionActiveSeconds: { 1: 900, 2: value, 3: 2400 } } }))
  }
})
test('Load rewinds create new additive epochs; Continue resets only the mission subtotal', () => {
  const closed = [epoch('m1-before-save', 1, 400), epoch('m1-after-load', 1, 300), epoch('m2-before-save', 2, 1000)]
  const current = epoch('m2-after-load', 2, 400)
  assert.equal(campaignActive(closed, current), 2100)
  assert.equal(campaignActive(closed, current, 2), 1400)
  assert.deepEqual(requireCampaignBudget(closed, current, 2, policy.limits), { campaign: 2100, mission: 1400 })
  assert.throws(() => requireCampaignBudget(closed, epoch('m2-after-load', 2, 500), 2, policy.limits), /ceiling/)
  assert.equal(requireCampaignBudget([...closed, current], epoch('m3-entry', 3, 10), 3, policy.limits).mission, 10)
  assert.throws(() => campaignActive(closed, closed[0]), /twice/)
  assert.throws(() => campaignActive([epoch('bad', 1, -1)]))
})
test('M3 conversion permits its bounded remainder without resetting campaign time', () => {
  const prefix = [epoch('m1', 1, 800), epoch('m2', 2, 1400)]
  assert.throws(() => requireCampaignBudget(prefix, epoch('m3', 3, 900), 3, policy.limits), /ceiling/)
  assert.equal(requireCampaignBudget(prefix, epoch('m3', 3, 1000), 3, policy.limits, 450).campaign, 3200)
  assert.throws(() => requireCampaignBudget(prefix, epoch('m3', 3, 2250), 3, policy.limits, 450), /ceiling/)
  assert.throws(() => requireCampaignBudget([epoch('prior', 1, 4799)], epoch('now', 3, 1), 3, policy.limits, 1), /ceiling/)
})
test('committed checkpoint digest and synchronous loaded projection have distinct boundaries', () => {
  requireLoadedCheckpoint(saved, { ...saved, checkpointSha256: 'live-presentation-is-not-saved-record' }, saved)
  for (const key of ['level', 'turn', 'time', 'actorsSha256', 'terrainSha256', 'stockSha256'])
    assert.throws(() => requireLoadedCheckpoint(saved, { ...saved, [key]: 'changed' }, saved))
  assert.throws(() => requireLoadedCheckpoint(saved, saved, { ...saved, checkpointSha256: 'changed' }))
})
test('Continue requires same store, new scene/World and current correspondence', () => {
  requireContinueBoundary(boundary(), 2)
  for (const key of ['sameStore', 'newWorld', 'newScene', 'currentCorrespondence'])
    assert.throws(() => requireContinueBoundary({ ...boundary(), [key]: false }, 2))
  assert.throws(() => requireContinueBoundary(boundary(3), 2))
  assert.throws(() => requireContinueBoundary({ ...boundary(), error: 'clone failed' }, 2))
})
test('campaign completion requires exact fresh committed prefixes', () => {
  requireCampaignProfile(null, []); requireCampaignProfile({ version: 1, completed: [1, 2] }, [1, 2])
  for (const completed of [[2], [1, 3], [1, 2, 3]]) assert.throws(() => requireCampaignProfile({ version: 1, completed }, [1, 2]))
})
test('actual browser subscription captures once, observes replacement and never writes to the store', () => {
  const priorWindow = globalThis.window, priorDocument = globalThis.document
  let world = { outcome: { level: 1 }, turn: 10 }, subscriber, unsubscriptions = 0
  const store = { getWorld: () => world, subscribe: callback => { subscriber = callback; return () => unsubscriptions++ } }
  const oldScene = { world }, main = { __reactFiberTest: { memoizedState: { memoizedState: store } } }
  globalThis.window = { testSceneRef: { current: oldScene }, testStore: store }
  globalThis.document = { querySelector: () => main }
  try {
    installReplacementObservation(); subscriber(); assert.equal(unsubscriptions, 0)
    world = { outcome: { level: 2 }, turn: 0 }; subscriber()
    assert.equal(unsubscriptions, 1); assert.equal(window.campaignLoadBoundary.world.turn, 0)
    world.turn = 5; assert.equal(window.campaignLoadBoundary.world.turn, 0, 'Live progression cannot rewrite captured boundary')
    window.testSceneRef.current = { world }
    requireContinueBoundary(replacementIdentity(), 2)
    assert.deepEqual(Object.keys(store), ['getWorld', 'subscribe'])
  } finally { globalThis.window = priorWindow; globalThis.document = priorDocument }
})
const predecessorFixture = status => {
  const previous = { runId: 'prior', cleanupVerified: true, continuationVerified: true }
  const source = { fingerprint: 'source' }, profile = { id: 'profile', checkpointAtStart: saved }
  const prior = { status, failure: status === 'failed' ? 'retained command failure' : undefined, source, errors: [],
    profile: { ...previous, id: profile.id, checkpointAtEnd: saved } }
  const result = { kind: 'fresh-current-campaign', phase: 'continued-and-saved', level: 2,
    profileId: profile.id, runId: previous.runId, source, failures: status === 'failed' ? [{ kind: 'observed-input-rejection' }] : [], controlStops: [], browserErrors: [],
    preserveVerificationFailed: false, protectedLatest: { checkpoint: saved }, currentEpoch: null,
    transitions: [{ from: 1, to: 2, boundary: boundary() }],
    milestones: missionRoutes[1].required.map(name => ({ level: 1, name })), checkpointProofs: [{ level: 1, loaded: true }],
    terminal: { status, failureSha256: status === 'failed' ? sha256(prior.failure) : null },
    ownedWallMs: 10000, missionWallMs: { 1: 9000, 2: 1000, 3: 0 }, epochs: [epoch('m1', 1, 400), epoch('m2-start', 2, 8)] }
  return { previous, prior, result, profile, source }
}
const accept = f => validateSegmentPredecessor(f.previous, f.prior, f.result, f.profile, f.source)
test('real failed envelope may carry a verified Continue/Save boundary and all failures', () => {
  const f = predecessorFixture('failed'), accepted = accept(f)
  assert.equal(accepted.failures.length, 2); assert.equal(accepted.failures[1].kind, 'prior-harness-failure')
  assert.equal(accepted.failures[1].runId, 'prior'); assert.equal(campaignActive(accepted.epochs), 408)
  assert.equal(f.result.failures.length, 1, 'Prior raw emitted record remains immutable')
})
test('unknown cleanup, omitted milestones, wrong save/source and arbitrary failed saves reject', () => {
  const mutations = [f => { f.previous.cleanupVerified = false }, f => { f.prior.profile.continuationVerified = false },
    f => { f.result.phase = 'arbitrary-stop' }, f => { f.source = { fingerprint: 'changed' } },
    f => { f.profile.checkpointAtStart = { ...saved, turn: 101 } }, f => { f.result.milestones.pop() },
    f => { f.result.transitions[0].boundary.newScene = false }, f => { f.result.checkpointProofs = [] },
    f => { f.result.currentEpoch = epoch('open', 2, 8) }, f => { f.result.milestones.push({ level: 2, name: 'camp' }) },
    f => { f.prior.errors = ['new error omitted from record'] }, f => { f.result.preserveVerificationFailed = true }]
  for (const mutate of mutations) { const f = predecessorFixture('failed'); mutate(f); assert.throws(() => accept(f)) }
})


test('actual harness cleanup override cannot be admitted as the intended retained-prefix boundary failure', () => {
  const harness = readFileSync(new URL('../../scripts/local-render/harness.mjs', import.meta.url), 'utf8')
  const override = harness.match(/try \{ await stopServer\(server\) \} catch \(error\) \{ ([^\n]+) \}/)?.[1]
  assert.ok(override, 'Use the actual maintained server-cleanup override shape')
  const replaceOutcome = new Function('outcome', 'error', `${override}; return outcome;`)
  const f = predecessorFixture('failed'), intended = f.prior.failure
  Object.assign(f.prior, replaceOutcome({ status: f.prior.status, failure: intended }, Error('server cleanup failed')))
  assert.equal(f.prior.previousFailure, intended)
  assert.throws(() => accept(f), /terminal|failure|override/i)
})
test('later terminal failures, omitted failure binding and outcome substitutions reject', () => {
  for (const mutate of [
    f => { f.prior.failure = 'Error: runtime or checkpoint readback failed' },
    f => { f.prior.previousFailure = f.prior.failure },
    f => { delete f.result.terminal },
    f => { f.result.terminal.failureSha256 = '0'.repeat(64) },
    f => { f.prior.status = 'passed' },
  ]) { const f = predecessorFixture('failed'); mutate(f); assert.throws(() => accept(f)) }
})

test('a clean bound mission boundary still resumes through the maintained success envelope', () => {
  const f = predecessorFixture('passed'), retained = accept(f)
  assert.deepEqual(retained.failures, []); assert.equal(retained.terminal.failureSha256, null)
})
