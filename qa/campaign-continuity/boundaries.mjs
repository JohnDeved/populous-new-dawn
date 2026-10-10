import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { IncompleteRun } from './observation.mjs'
import { validateMissionMilestones } from './routes.mjs'

// Shared by both ordinary victory proof and the actual Continue click. The
// visible result-button icon contributes to its current accessible name.
export function continueControlName(nextMission) {
  assert.ok(Number.isInteger(nextMission) && nextMission >= 2 && nextMission <= 4)
  return `Continue to Mission ${nextMission} ↗`
}

export const applicationImportPaths = [
  'scripts/browser-game.mjs', 'scripts/checkpoint-readback.mjs',
  'scripts/campaign-conversion-observer.mjs', 'scripts/campaign-start-readiness.mjs',
  'scripts/local-render/harness.mjs', 'scripts/local-render/owned-profile.mjs',
  'scripts/local-render/checkpoint-observer.mjs', 'scripts/local-render/vite.config.mjs',
]

export function validateRunPolicy(policy) {
  assert.equal(policy.launchEnabled, true, 'Source-only checkpoint: launch requires a reviewed policy')
  assert.match(policy.applicationCommit, /^[a-f0-9]{40}$/)
  assert.match(policy.applicationTree, /^[a-f0-9]{40}$/)
  assert.deepEqual(Object.keys(policy.applicationImports ?? {}), applicationImportPaths, 'Pin every actual application helper import')
  for (const digest of Object.values(policy.applicationImports)) assert.match(digest, /^[a-f0-9]{64}$/)
  const limits = policy.limits
  for (const value of [limits?.campaignActiveSeconds, limits?.wallMs, limits?.segmentWallMs, limits?.noProgressActiveSeconds, limits?.m3BeforeConversionSeconds, limits?.m3AfterConversionSeconds, ...[1, 2, 3].flatMap(level => [limits?.missionActiveSeconds?.[level], limits?.missionWallMs?.[level]])])
    assert.ok(Number.isFinite(value) && value > 0, 'All campaign/mission/wall ceilings must be explicit and finite')
  assert.equal(limits.noProgressActiveSeconds, 120, 'Retain the reviewed objective progress ceiling')
  return policy
}

export function campaignActive(epochs, current = null, level = null) {
  const all = [...epochs, ...(current ? [current] : [])]
  assert.equal(new Set(all.map(epoch => epoch.name)).size, all.length, 'No epoch may be counted twice')
  return all.reduce((sum, epoch) => {
    assert.ok([1, 2, 3].includes(epoch.level) && Number.isFinite(epoch.activeSeconds) && epoch.activeSeconds >= 0)
    return sum + (level === null || epoch.level === level ? epoch.activeSeconds : 0)
  }, 0)
}
export function requireCampaignBudget(epochs, current, level, limits, conversionAt = null) {
  const campaign = campaignActive(epochs, current), mission = campaignActive(epochs, current, level)
  assert.ok(conversionAt === null || Number.isFinite(conversionAt) && conversionAt >= 0, 'Conversion budget anchor must be observed finite active time')
  const missionLimit = level === 3 ? Math.min(limits.missionActiveSeconds[3], conversionAt === null ? limits.m3BeforeConversionSeconds : conversionAt + limits.m3AfterConversionSeconds) : limits.missionActiveSeconds[level]
  if (campaign >= limits.campaignActiveSeconds || mission >= missionLimit)
    throw new IncompleteRun('active-budget', `Campaign ${campaign}s; Mission ${level} ${mission}s reached its reviewed ceiling`)
  return { campaign, mission }
}
export function requireLoadedCheckpoint(saved, loaded, storedAfter) {
  assert.ok(saved && loaded && storedAfter, 'Actual committed and synchronous replacement observations required')
  for (const key of ['level', 'turn', 'time', 'actorsSha256', 'terrainSha256', 'stockSha256'])
    assert.deepEqual(loaded[key], saved[key], `Loaded boundary ${key}`)
  assert.deepEqual(storedAfter, saved, 'Load must preserve the full committed checkpoint')
}
export function requireContinueBoundary(boundary, nextLevel) {
  assert.equal(boundary.sameStore, true, 'Continue retains the same store')
  assert.equal(boundary.newWorld, true, 'Continue replaces the World')
  assert.equal(boundary.newScene, true, 'Continue replaces the scene')
  assert.equal(boundary.currentCorrespondence, true, 'Current scene belongs to store World')
  assert.equal(boundary.level, nextLevel)
  assert.equal(boundary.replacementLevel, nextLevel)
  assert.equal(boundary.error, null)
}
export function requireCampaignProfile(profile, completed) {
  assert.ok(profile?.version === 1 || profile === null && completed.length === 0, 'Supported committed campaign profile')
  assert.deepEqual(profile?.completed ?? [], completed, 'Exact fresh campaign completion prefix')
}

// Page-serializable observers. They never create a database, mutate World, or
// write storage. Full replacement clones remain in the page; only hashes leave it.
export async function readCampaignStorage(key) {
  if (!['latest', 'profile'].includes(key)) throw Error('Unsupported campaign storage key')
  if (!(await indexedDB.databases()).some(db => db.name === 'populous-new-dawn')) return null
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('populous-new-dawn')
    request.onupgradeneeded = () => { request.transaction.abort(); reject(Error('Unexpected database creation')) }
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error)
  })
  try {
    if (!db.objectStoreNames.contains('checkpoints')) return null
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction('checkpoints', 'readonly'), request = transaction.objectStore('checkpoints').get(key)
      transaction.oncomplete = () => {
        const saved = request.result
        resolve(key === 'latest' && saved?.world ? { version: saved.version, world: {
          turn: saved.world.turn, time: saved.world.time, outcome: saved.world.outcome,
          units: saved.world.units.map(unit => ({ id: unit.id, team: unit.team, kind: unit.kind,
            native: unit.native && { state: unit.native.state, workTarget: unit.native.workTarget } }))
        } } : saved ?? null)
      }
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error ?? Error('Campaign read aborted'))
    })
  } finally { db.close() }
}
export function installReplacementObservation() {
  if (window.campaignReplacement?.pending) throw Error('Previous replacement observation is still pending')
  const main = document.querySelector('main')
  let fiber = main?.[Object.keys(main).find(key => key.startsWith('__reactFiber'))], store
  for (; fiber && !store; fiber = fiber.return)
    for (let hook = fiber.memoizedState; hook; hook = hook.next)
      if (hook.memoizedState?.getWorld && hook.memoizedState?.subscribe) { store = hook.memoizedState; break }
  if (!store) throw Error('Store unavailable before ordinary replacement')
  const before = store.getWorld(), scene = window.testSceneRef?.current
  const observation = { store, before, scene, pending: true, error: null, world: null }
  window.campaignReplacement = observation; window.campaignLoadBoundary = null
  const unsubscribe = store.subscribe(() => {
    const world = store.getWorld()
    if (world === before) return
    try {
      observation.world = world
      window.campaignLoadBoundary = { version: 1, world: structuredClone(world) }
    } catch (error) { observation.error = String(error) }
    finally { observation.pending = false; unsubscribe() }
  })
  observation.dispose = unsubscribe
}
export function replacementIdentity() {
  const observed = window.campaignReplacement, scene = window.testSceneRef?.current, store = window.testStore
  if (!observed || observed.pending) throw Error('No actual store replacement observed')
  return { sameStore: store === observed.store, newWorld: store.getWorld() !== observed.before,
    newScene: scene !== observed.scene, currentCorrespondence: scene?.world === store.getWorld(),
    level: store.getWorld().outcome.level, replacementLevel: observed.world?.outcome.level, error: observed.error }
}

// Only verified Continue-boundary segments can resume. The ordinary lease binds
// source/runtime/profile; this additionally binds the complete prior scenario
// result to its real terminal receipt. A retained failed envelope earns no PASS; only its real boundary can continue.
export function validateSegmentPredecessor(previous, prior, result, profile, source) {
  assert.ok(['passed', 'failed'].includes(prior.status))
  assert.equal(previous.cleanupVerified, true); assert.equal(previous.continuationVerified, true)
  assert.equal(prior.profile.cleanupVerified, true); assert.equal(prior.profile.continuationVerified, true)
  assert.equal(prior.profile.runId, previous.runId); assert.equal(prior.profile.id, profile.id)
  assert.equal(prior.source.fingerprint, source.fingerprint)
  assert.deepEqual(prior.profile.checkpointAtEnd, profile.checkpointAtStart)
  assert.equal(result?.kind, 'fresh-current-campaign'); assert.equal(result.phase, 'continued-and-saved')
  assert.ok([2, 3].includes(result.level)); assert.equal(result.profileId, profile.id)
  assert.equal(result.runId, previous.runId)
  assert.equal(result.terminal?.status, prior.status, 'Actual terminal status must match the emitted boundary intent')
  assert.equal(Object.hasOwn(prior, 'previousFailure'), false, 'A terminal override cannot admit a boundary')
  if (prior.status === 'failed') {
    assert.equal(typeof prior.failure, 'string', 'Actual terminal failure is required')
    const failureSha256 = createHash('sha256').update(prior.failure).digest('hex')
    assert.equal(result.terminal.failureSha256, failureSha256, 'Actual terminal failure must be the exact deliberate boundary error')
  } else assert.equal(result.terminal.failureSha256, null)
  for (const records of [result.failures, result.controlStops, result.browserErrors]) assert.ok(Array.isArray(records))
  assert.equal(result.terminal.status === 'failed', result.failures.length + result.controlStops.length + result.browserErrors.length > 0, 'Only a retained failed prefix deliberately fails its boundary')
  assert.equal(result.source.fingerprint, source.fingerprint)
  assert.equal(result.preserveVerificationFailed, false)
  assert.deepEqual(result.protectedLatest?.checkpoint, profile.checkpointAtStart)
  assert.equal(result.protectedLatest.checkpoint.level, result.level)
  assert.equal(result.transitions.at(-1)?.to, result.level)
  assert.equal(result.transitions.length, result.level - 1)
  for (let mission = 1; mission < result.level; mission++) {
    validateMissionMilestones(mission, result.milestones)
    const transition = result.transitions[mission - 1]
    assert.equal(transition.from, mission); assert.equal(transition.to, mission + 1)
    requireContinueBoundary(transition.boundary, mission + 1)
    assert.ok(result.checkpointProofs.some(proof => proof.level === mission && proof.loaded && !proof.segment))
  }
  assert.equal(result.currentEpoch, null, 'The completed boundary includes its closed current epoch')
  assert.ok(!result.milestones.some(mark => mark.level === result.level), 'Only the newly entered mission boundary can resume')
  for (const mission of [1, 2, 3]) assert.ok(Number.isFinite(result.missionWallMs?.[mission]) && result.missionWallMs[mission] >= 0)
  assert.ok(prior.errors.every(error => result.browserErrors.includes(error)), 'Retain actual prior browser errors')
  assert.ok(Number.isFinite(result.ownedWallMs) && result.ownedWallMs >= 0)
  campaignActive(result.epochs)
  const retained = structuredClone(result)
  if (prior.status === 'failed') retained.failures.push({ kind: 'prior-harness-failure', runId: previous.runId, error: String(prior.failure ?? 'Failed terminal harness receipt') })
  return retained
}

// One real, closed failed segment. This is not an arbitrary Save admission or a
// replacement for the ordinary Continue-boundary contract above.
export const sermonContinuation = Object.freeze({
  kind: 'campaign-m3-sermon-bcf8ac55',
  runId: 'bcf8ac55-e418-49e4-a3d6-b7e804ee31d3',
  profileId: '7c15026e-2bb3-41e9-83e9-ce408b869416',
  source: '7510747dc9e1c7c2b26db5b83010a15be9017f1be606c64a3059626180ec2d3b',
  checkpoint: '2771e990a00b005fd23a86e7909f7f679c746aab1d977f589162df116934e5fa',
  hashes: Object.freeze({
    'receipt.json': '5a934ae4e50ef69bc353ec66df5eb64e90cb2be50d06848650aeec23c31e7214',
    'journey.json': 'b36d13de9c4170e63a44517c57bb6d864e5113a48a3774987ea350eb29789668',
    'terminal.json': '5cc70da61cbdedf5d4ed3fe68076a9e2d8b8575188cf37e4208a9c52bd9dabed',
    'sermon-saved.json': '5245328eb3dce9dc6ff2602de3832caecd4ed30a735115521ff923a47e527520',
    'actions.jsonl': 'a8cdce20fb62e6c855843ed74a27fe32306a57a03dd72225b5125ac45277c12d',
  }),
})
export function readSermonPredecessor(previous, profile, source) {
  assert.equal(previous.runId, sermonContinuation.runId, 'Only the actual immediate failed predecessor can enter')
  assert.equal(previous.receiptSha256, sermonContinuation.hashes['receipt.json'])
  const records = {}
  for (const [name, digest] of Object.entries(sermonContinuation.hashes)) {
    const bytes = readFileSync(resolve(dirname(previous.receiptPath), name))
    assert.equal(createHash('sha256').update(bytes).digest('hex'), digest, `Exact sermon predecessor ${name}`)
    if (name.endsWith('.json')) records[name] = JSON.parse(bytes)
  }
  return validateSermonPredecessor(previous, records, profile, source)
}
export function validateSermonPredecessor(previous, records, profile, source) {
  const prior = records['receipt.json'], journey = records['journey.json']
  const terminal = records['terminal.json'], saved = records['sermon-saved.json']
  const expected = sermonContinuation, review = profile.correspondence
  assert.equal(previous.runId, expected.runId); assert.equal(prior.profile.runId, expected.runId)
  assert.equal(previous.receiptSha256, expected.hashes['receipt.json'])
  assert.equal(profile.id, expected.profileId); assert.equal(prior.profile.id, profile.id)
  assert.equal(journey.profileId, profile.id); assert.equal(journey.runId, previous.runId)
  assert.equal(prior.status, 'failed'); assert.equal(journey.status, 'failed')
  assert.equal(previous.status, prior.status)
  assert.equal(Object.hasOwn(prior, 'previousFailure'), false, 'No terminal cleanup override')
  assert.equal(previous.cleanupVerified, true); assert.equal(previous.continuationVerified, true)
  assert.equal(prior.profile.cleanupVerified, true); assert.equal(prior.profile.continuationVerified, true)
  assert.deepEqual(prior.errors, []); assert.deepEqual(journey.browserErrors, [])
  assert.equal(journey.preserveVerificationFailed, false)
  assert.equal(review?.continuationKind, expected.kind, 'Exact source-reviewed admission required')
  assert.equal(review.decision, 'ACCEPT'); assert.ok(review.reviewer && review.reference)
  assert.equal(review.priorRunId, previous.runId)
  assert.equal(review.previousSourceFingerprint, expected.source)
  assert.equal(prior.source.fingerprint, expected.source); assert.equal(journey.source.fingerprint, expected.source)
  assert.equal(previous.sourceFingerprint, expected.source)
  assert.equal(previous.sourceCommit, prior.source.commit)
  assert.equal(previous.checker, prior.profile.inputs.checker)
  assert.equal(review.currentSourceFingerprint, source.fingerprint)
  assert.equal(review.previousChecker, previous.checker); assert.equal(review.currentChecker, profile.inputs.checker)
  assert.deepEqual(prior.profile.checkpointAtEnd, profile.checkpointAtStart)
  assert.deepEqual(journey.protectedLatest.checkpoint, profile.checkpointAtStart)
  assert.equal(profile.checkpointAtStart.checkpointSha256, expected.checkpoint)
  assert.equal(profile.checkpointAtStart.turn, 7424); assert.equal(profile.checkpointAtStart.level, 3)
  assert.equal(journey.level, 3); assert.equal(terminal.turn, 10077); assert.equal(terminal.status, 'playing')
  assert.equal(saved.turn, 7424); assert.equal(saved.paused, true)
  assert.equal(journey.savedSermon.turn, saved.turn)
  assert.equal(journey.savedSermon.victimId, 2631); assert.equal(journey.savedSermon.preacherId, 3181)
  assert.equal(journey.ids.victim, 2631); assert.equal(journey.ids.preacher, 3181)
  assert.equal(journey.sermonPlan.declaration.armedAtTurn, 6593)
  assert.equal(journey.victimSelection.victim.id, 2631)
  const victim = saved.units.find(unit => unit.id === 2631), preacher = saved.units.find(unit => unit.id === 3181)
  assert.equal(victim?.nativeState, 23); assert.equal(victim.owner, 3181)
  assert.equal(victim.timer, 45); assert.equal(victim.team, 'yellow'); assert.equal(victim.kind, 'brave')
  assert.equal(preacher?.team, 'blue'); assert.equal(preacher.kind, 'preacher'); assert.equal(preacher.hp, 55)
  assert.equal(journey.savedSermon.blueIds.length, 13)
  for (const id of journey.savedSermon.blueIds) assert.ok(saved.units.some(unit => unit.id === id && unit.team === 'blue'))
  assert.equal(journey.failures.length, 3); assert.equal(journey.controlStops.length, 1)
  assert.equal(journey.controlStops[0].code, 'progress-stall')
  assert.equal(prior.failure, journey.controlStops[0].error, 'Retain the actual automatic stop outcome')
  assert.deepEqual(journey.currentEpoch, terminal.observation, 'Actual terminal open observation')
  assert.equal(journey.currentEpoch.name, 'reload-3-7')
  assert.equal(campaignActive(journey.epochs, journey.currentEpoch), 2692.666666666667)
  assert.equal(campaignActive(journey.epochs, journey.currentEpoch, 3), 853.6666666666666)
  assert.equal(journey.milestones.find(mark => mark.level === 3 && mark.name === 'conversion')?.missionActiveSeconds, 704.0833333333333)
  assert.equal(journey.ownedWallMs, 5801958); assert.equal(journey.missionWallMs[3], 2172699)
  const retained = structuredClone(journey)
  retained.epochs.push({ ...retained.currentEpoch, retainedTerminalObservation: {
    runId: previous.runId, receiptSha256: previous.receiptSha256, kind: 'observed-before-verified-browser-close',
  } })
  retained.currentEpoch = null
  delete retained.ids.replacement
  retained.sermonContinuation = { kind: expected.kind, priorRunId: previous.runId,
    receiptSha256: previous.receiptSha256, priorStatus: prior.status, priorFailure: prior.failure,
    artifactHashes: expected.hashes, historyScope: 'Inherited proof and terminal observations; no new onset or cancellation' }
  return retained
}
