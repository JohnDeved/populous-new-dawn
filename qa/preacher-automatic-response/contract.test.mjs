import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { movingEncounter, qualifyingVisit, createResponseTracker, eligibleBraveState } from './observe.mjs'
import { responseProjection, requireResponseCheckpoint, requireSameCheckpoint } from './checkpoint.mjs'
import { requireCleanup } from './scenario.mjs'
import { chainPhaseObservers } from '../preacher-gesture-baseline/observe.mjs'
import { chooseForwardDefender, requireDefenderRemoval } from './forward-defender.mjs'
import { readResponsePeople } from './diagnostics.mjs'
import { requireContinuation } from './load-diagnostics.mjs'
import { coherentCrossingBrave, crossingWitness } from './crossing-input.mjs'

// Supplied diagnostic records test acceptance logic only. They are not ordinary
// gameplay, native execution or rendered evidence.
function row(turn, phase = 'afterTurn', response = false) {
  const queued = { id: 10, identity: 2, model: 3, flags: 0, references: 1, object: 0, a: 20000, b: 20000 }
  return { phase, turn, now: turn * 84, sameWorld: true, sameActor: true, nativeOnly: true,
    registeredOwner: true, actor: { id: 5, kind: 'preacher', team: 'blue', hp: 55, inside: null }, busy: false,
    admission: { work: null, target: null, tree: null, cargo: 0, harvest: false, delivery: false,
      vault: false, guard: false, attackReservation: false, starting: false, armageddon: false,
      landFlags: 0, supported: true, positionCoherent: true },
    status: 'playing', paused: false, speed: 1, visibility: 'visible', pendingDistance: 5000,
    person: { id: 5, class: 1, model: 4, tribe: 0, state: 10, speed: 40, life: 1100, commandStatus: response ? 32 : 3,
      commandCursor: 0, immediateCommand: response ? 11 : 0, commands: [10, 0], flags2: 0x20000, flags3: 0,
      flags4: 0, assignment: 0, vehicle: 0, x: 0x2100, y: 0x2100, substate: 0, counter: turn & 255, timer: 0, draw: 14 },
    commands: [10, 0], queued: [queued], order: response ? { id: 11, identity: 3, model: 32, flags: 32,
      references: 1, object: 0, a: 0x2100, b: 0x2100 } : queued,
    orderUsers: [5], retiredOrders: [], listeners: [], facts: { autoEligible: true, range: 1, genericThreat: 0,
      primaryGuardIds: [], availableOrder: true, gameFlags: 0, levelFlags2: 0, scanMask: 15,
      braves: [{ id: 6, unitId: 6, identity: 6, class: 1, kind: 'brave', team: 'red', hp: 50, inside: null,
        nativeOnly: true, registeredOwner: true, positionCoherent: true, routeOwner: 6, motionGroup: 0, x: 0x2180, y: 0x2100, model: 2, tribe: 1, state: 17,
        life: 1000, flags2: 0x20000, flags4: 0, workFlags: 0, vehicle: 0, reverseAlliance: 0 }] } }
}

test('baseline absence requires a source-bound due visit while destination remains pending', () => {
  const before = row(15, 'beforeTurn'), after = row(16)
  assert.equal(movingEncounter(before), true); assert.ok(qualifyingVisit(before, after))
  const tracker = createResponseTracker({ baseline: true }); tracker.observe(before); tracker.observe(after)
  assert.equal(tracker.progress.status, 'baseline-omission')
  for (const change of [v => { v.facts.primaryGuardIds = [7] }, v => { v.facts.genericThreat = 2 },
    v => { v.pendingDistance = 0 }, v => { v.person.speed = 0 }, v => { v.facts.availableOrder = false },
    v => { v.facts.braves[0].workFlags = 1 }, v => { v.facts.braves[0].identity = 9 },
    v => { v.order.identity = 9 }, v => { v.commands[0] = 9 }, v => { v.turn = 17 },
    v => { v.admission.target = 99 }, v => { v.admission.work = 9 }, v => { v.admission.delivery = true },
    v => { v.admission.starting = true }, v => { v.admission.armageddon = true },
    v => { v.admission.supported = false }, v => { v.actor.hp-- },
    v => { v.person.life = 0 }, v => { v.person.life = 1000 }]) {
    const changed = structuredClone(after); change(changed)
    assert.equal(qualifyingVisit(before, changed), null)
  }
})

test('actual production scan counter follows world turn even when retained person phase differs', () => {
  const before = row(15, 'beforeTurn'), after = row(16)
  before.person.counter = 30; after.person.counter = 31
  assert.ok(qualifyingVisit(before, after), 'combatScan supplies world16 despite retained counter31')
  before.turn = 16; after.turn = 17; before.person.counter = 31; after.person.counter = 32
  assert.equal(qualifyingVisit(before, after), null, 'Retained counter32 does not schedule production world17')
  before.person.flags3 |= 0x800
  assert.ok(qualifyingVisit(before, after), 'A real pending scan remains a separate admission')
})

test('automatic32 can attach on the first moving visit and need not expose persistent substate5', () => {
  const tracker = createResponseTracker(), before = row(15, 'beforeTurn'), first = row(16, 'afterTurn', true)
  first.person.commandStatus = 3
  tracker.observe(before); tracker.observe(first)
  assert.equal(tracker.progress.status, 'responding', tracker.progress.reason)
  assert.equal(tracker.progress.startup, null)
  const nextBefore = structuredClone(first); nextBefore.phase = 'beforeTurn'; tracker.observe(nextBefore)
  const startup = row(17, 'afterTurn', true); startup.person.substate = 2; startup.person.speed = 0; startup.listeners = [6]
  tracker.observe(startup)
  assert.equal(tracker.progress.startup.person.substate, 2)
  assert.deepEqual(tracker.progress.listenerIds, [6])
  const releaseBefore = structuredClone(startup); releaseBefore.phase = 'beforeTurn'; tracker.observe(releaseBefore)
  const released = row(18); released.retiredOrders = [{ id: 11, references: 0 }]; tracker.observe(released)
  assert.equal(tracker.progress.status, 'released', tracker.progress.reason)
  assert.equal(tracker.progress.rendered.length, 0, 'Supplied model rows cannot claim rendering')
})

test('idle17, shared32, changed queued3 and lost native owners cannot pass candidate acceptance', () => {
  for (const change of [r => { r.order.model = 17 }, r => { r.order.model = 21 },
    r => { r.orderUsers.push(7) }, r => { r.order.references = 2 }, r => { r.queued[0].a++ },
    r => { r.person.immediateCommand = 0 }, r => { r.sameActor = false }, r => { r.nativeOnly = false },
    r => { r.registeredOwner = false }]) {
    const tracker = createResponseTracker(); tracker.observe(row(15, 'beforeTurn'))
    const next = row(16, 'afterTurn', true); change(next); tracker.observe(next)
    assert.equal(tracker.progress.status, 'failed', JSON.stringify(next))
  }
})

test('ordinary interruption capture keeps bounds and ownership but does not invent natural expiry', () => {
  const tracker = createResponseTracker({ loaded: true, captureOnly: true, maxVisits: 2 })
  tracker.observe(row(1, 'afterTurn', true)); tracker.observe(row(2)); tracker.observe(row(3))
  assert.equal(tracker.progress.status, 'failed'); assert.match(tracker.progress.reason, /visit cap/)
  assert.equal(tracker.progress.released, null)
  const rows = createResponseTracker({ maxRows: 1 }); rows.observe(row(1, 'beforeTurn')); rows.observe(row(2))
  assert.match(rows.progress.reason, /row cap/)
  const gap = createResponseTracker(); gap.observe(row(1)); gap.observe(row(3)); assert.match(gap.progress.reason, /Missing/)
})

test('paused checkpoint compares exact native queue/RNG and does not normalize Load auto-resume', () => {
  const r = row(16, 'afterTurn', true), native = { ...r.person, commands: r.commands }, unit = { ...r.actor, native }
  const world = { units: [unit], turn: 16, time: 2, speed: 1, paused: true, outcome: { level: 3 },
    randomState: 7, cosmeticRandom: { randomState: 8 }, objectCells: { objects: new Map([[5, native]]) },
    buildingOrders: { records: { 10: r.queued[0], 11: r.order } } }
  const saved = responseProjection({ version: 1, world }, 5); requireResponseCheckpoint(saved)
  requireSameCheckpoint(saved, structuredClone(saved))
  for (const change of [v => { v.paused = false }, v => { v.turn++ }, v => { v.rng[0]++ },
    v => { v.orders[0].references++ }, v => { v.native.commands[0] = 99 }, v => { v.registeredOwner = false }]) {
    const changed = structuredClone(saved); change(changed); assert.throws(() => requireSameCheckpoint(saved, changed))
  }
})

test('phase wrapper forwards one original callback and restores exact descriptor; errors remain fatal', () => {
  const calls = [], clock = { beforeTurn(n) { calls.push([this, n]); return 7 }, afterTurn() { return 9 } }
  const renderer = { render() { return 11 } }, original = Object.getOwnPropertyDescriptors(clock)
  const chain = chainPhaseObservers(clock, renderer, () => { throw Error('observation failed') }, phase => ({ phase, turn: 1 }), () => true)
  assert.equal(clock.beforeTurn(2), 7); assert.deepEqual(calls, [[clock, 2]])
  const finish = chain.finish(); assert.equal(finish.restored, true); assert.equal(finish.errors.length, 1)
  assert.deepEqual(Object.getOwnPropertyDescriptors(clock), original)
  assert.throws(() => requireCleanup({ observer: finish }))
  assert.throws(() => requireCleanup({ pointer: { restored: false, errors: [] } }))
  assert.throws(() => requireCleanup({ tail: { errors: ['missing row'] } }))
})

test('reused drivers stay byte-identical and new observation contains no World/tick/render writes', () => {
  const pins = JSON.parse(readFileSync(new URL('./source-inputs.json', import.meta.url)))
  for (const [path, hash] of Object.entries(pins.inheritedFiles))
    assert.equal(createHash('sha256').update(readFileSync(new URL(`../../${path}`, import.meta.url))).digest('hex'), hash, path)
  for (const [path, entry] of Object.entries(pins.adaptedFiles ?? {}))
    assert.equal(createHash('sha256').update(readFileSync(new URL(`../../${path}`, import.meta.url))).digest('hex'), entry.sha256, path)
  const source = readFileSync(new URL('./observe.mjs', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /renderer\.render\s*\(|\b(?:tick|advanceGame|animateLiveObjects)\s*\(|nativeGuardRead\(/)
  assert.doesNotMatch(source, /(?:\bw|\bworld|\bnative|\bscene\.world)\.[A-Za-z]+\s*=(?!=)/)
  const scenario = readFileSync(new URL('./scenario.mjs', import.meta.url), 'utf8')
  assert.doesNotMatch(scenario, /local-render\/harness|waitForFunction\(async|\.put\(|\.add\(/)
  assert.match(scenario, /readQueuedPreservingStop/); assert.match(scenario, /requireSameCheckpoint/)
  assert.equal(pins.candidateTrees, null, 'Candidate cannot launch before adopted reviewed application')
})

test('scan witness admits10/17/19 while initial crossing anchor stays stationary17/19', () => {
  for (const state of [10, 17, 19]) assert.equal(eligibleBraveState(state), true)
  for (const state of [23, undefined, null, 0]) assert.equal(eligibleBraveState(state), false)
  const item = { kind: 'brave', team: 'yellow', hp: 50, inside: null, nativeOnly: true,
    native: { state: 19 }, pathLength: 0, predicates: { nativeReverse: [], ownership: [], oldQaPrefilter: ['not-idle17', 'outside-secondary3x3'] } }
  assert.equal(coherentCrossingBrave(item), true)
  for (const mutate of [v => { v.native.state = 10 }, v => { v.native.state = 23 }, v => { v.nativeOnly = false },
    v => { v.predicates.ownership = ['selected-record-missing'] }, v => { v.pathLength = 1 },
    v => { v.predicates.nativeReverse = ['actual-workFlags-not0'] }]) {
    const bad = structuredClone(item); mutate(bad); assert.equal(coherentCrossingBrave(bad), false)
  }
})

test('both omission and first32 require the same eligible native reference and cell despite target movement', () => {
  const before = row(15, 'beforeTurn'), after = row(16)
  before.facts.braves[0].state = 19
  Object.assign(after.facts.braves[0], { state: 10, x: 0x21b0, pathLength: 3,
    order: { model: 21 }, commandStatus: 21, workTarget: 5, motionIndex: 1 })
  const visit = qualifyingVisit(before, after)
  assert.equal(visit.brave.before.state, 19); assert.equal(visit.brave.after.state, 10)
  const alreadyMoving = structuredClone(before)
  Object.assign(alreadyMoving.facts.braves[0], { state: 10, pathLength: 2 })
  assert.ok(qualifyingVisit(alreadyMoving, after))
  const first = row(16, 'afterTurn', true); first.facts.braves = after.facts.braves
  const tracker = createResponseTracker(); tracker.observe(before); tracker.observe(first)
  assert.equal(tracker.progress.status, 'responding', tracker.progress.reason)
  assert.equal(tracker.progress.firstResponse.brave.after.pathLength, 3)
  for (const change of [b => { b.state = 23 }, b => { b.identity = 99 }, b => { b.routeOwner = 99 },
    b => { b.x += 512 }, b => { b.x = 0x21b0 + 0.5 }, b => { b.x = 65536 },
    b => { b.positionCoherent = false }, b => { b.registeredOwner = false }, b => { b.nativeOnly = false },
    b => { b.unitId++ }, b => { b.team = 'yellow' }, b => { b.life = 0 }, b => { b.life = 999 },
    b => { b.workFlags = 1 }, b => { b.motionGroup = 1 }, b => { b.reverseAlliance = 1 },
    b => { b.reverseAlliance = undefined }, b => { b.tribe = undefined; b.team = 'unknown' }]) {
    const changed = structuredClone(after); change(changed.facts.braves[0])
    assert.equal(qualifyingVisit(before, changed), null)
    const response = structuredClone(first); response.facts.braves = changed.facts.braves
    const denied = createResponseTracker(); denied.observe(before); denied.observe(response)
    assert.equal(denied.progress.status, 'failed', JSON.stringify(changed.facts.braves[0]))
  }
  for (const change of [r => { r.actor.hp-- }, r => { r.admission.target = 7 },
    r => { r.facts.primaryGuardIds = [7] }, r => { r.turn = 17 }]) {
    const response = structuredClone(first); change(response)
    const denied = createResponseTracker(); denied.observe(before); denied.observe(response)
    assert.equal(denied.progress.status, 'failed')
  }
})

test('geometry requires two adjacent secondary cells, primary clearance and a pending destination margin', () => {
  const path = [-12, -14, -16, -18, -20].map(x => ({ x, z: -93 })), destination = { x: -21, z: -93 }
  const context = { model: 3, enabled: true, buildingId: null, personId: null, shrineId: null, treeId: null, vehicleId: null }
  const result = crossingWitness(path, [124, 42], destination, [], context)
  assert.ok(result); assert.ok(result.witnesses.length >= 2)
  assert.equal(crossingWitness(path, [124, 42], { x: -17, z: -93 }, [], context), null)
  assert.equal(crossingWitness(path, [124, 42], destination, [[125, 42]], context), null)
  assert.equal(crossingWitness([path[1]], [124, 42], destination, [], context), null)
  assert.equal(crossingWitness(path, [124, 42], destination, [], { ...context, model: 31 }), null)
  assert.equal(crossingWitness(path, [124, 42], destination, [], { ...context, personId: 53 }), null)
})

test('forward removal requires the actual defender gone, original healthy actors and real arrival', () => {
  const defender = { id: 8, kind: 'preacher', team: 'yellow', hp: 55, inside: null, x: -1, z: -115 }
  assert.equal(chooseForwardDefender([defender]), defender)
  assert.throws(() => chooseForwardDefender([])); assert.throws(() => chooseForwardDefender([defender, { ...defender, id: 9 }]))
  const before = { shamanId: 5, preacherId: 6, preacherHp: 55, preacherPoint: { x: 35, z: 90 }, defender }
  const row = { sameWorld: true, originalShaman: true, originalPreacher: true, status: 'playing', paused: false,
    speed: 1, visibility: 'visible', inputMask: 0, lockedId: 8, lockedTarget: defender, yellow: [defender], blue: [
      { id: 5, kind: 'shaman', team: 'blue', hp: 100, x: -1, z: -115 }, { id: 6, kind: 'preacher', team: 'blue', hp: 55, x: 35, z: 90 }] }
  assert.equal(requireDefenderRemoval(row, before, 8), false)
  row.yellow = []; row.lockedTarget = { ...defender, team: 'blue', kind: 'brave' }
  assert.equal(requireDefenderRemoval(row, before, 8), false, 'Live target outside the Yellow-Preacher filter is not removal')
  row.lockedTarget = null; assert.equal(requireDefenderRemoval(row, before, 8), true)
  for (const change of [r => { r.originalShaman = false }, r => { r.blue[0].hp = 0 },
    r => { r.blue[0].x = 35 }, r => { r.blue[1].hp-- }, r => { r.blue[1].x = 40 }, r => { r.blue[1].team = 'yellow' },
    r => { r.yellow.push({ ...defender, id: 9 }) }]) {
    const invalid = structuredClone(row); change(invalid); assert.throws(() => requireDefenderRemoval(invalid, before, 8))
  }
})

test('working or unowned nearby Brave records survive diagnostics with exact failed predicates', () => {
  const source = { id: 5, class: 1, model: 4, tribe: 0, x: 0x2100, y: 0x2100, life: 1100, flags2: 0x20000, flags4: 0 }
  const p = { id: 6, class: 1, model: 2, tribe: 2, x: 0x2300, y: 0x2100, life: 1000,
    state: 10, workFlags: 0, flags2: 0x20000, flags4: 0, vehicle: 0, cellNext: 0 }
  const u = { id: 6, kind: 'brave', team: 'yellow', hp: 50, x: 27, z: -41, inside: null,
    builder: { person: p }, path: [{ x: 29, z: -41 }], work: 9, target: null }
  const missing = { id: 7, kind: 'brave', team: 'yellow', hp: 50, x: 27, z: -41,
    inside: null, path: [], work: null, target: null }
  const heads = new Uint16Array(16384); heads[(p.y >>> 9) * 128 + (p.x >>> 9)] = p.id
  const world = { units: [u, missing], objectCells: { heads, objects: new Map([[p.id, p]]) }, outcome: { alliances: [0, 0, 0, 0] } }
  const original = structuredClone(world), result = readResponsePeople(world, source)
  assert.equal(result.rows.length, 2)
  assert.equal(result.rows[0].ownerSlot, 'builder.person')
  assert.deepEqual(result.rows[0].nativeCell, [17, 16])
  assert.deepEqual(result.rows[0].predicates.nativeReverse, [])
  assert.deepEqual(result.rows[0].predicates.ownership, [])
  for (const reason of ['not-native-only-owner', 'not-idle17', 'has-path'])
    assert.ok(result.rows[0].predicates.oldQaPrefilter.includes(reason))
  assert.ok(result.rows[1].predicates.ownership.includes('selected-record-missing'))
  assert.deepEqual(world, original, 'Diagnostic reads must not normalize or repair the World')
  assert.throws(() => readResponsePeople(world, source, { all: true, limit: 1 }), /cap exceeded/)
  world.objectCells.objects.set(9, { ...p, id: 9, model: 7, x: 0x2500 })
  const orphan = readResponsePeople(world, source).unmatchedPrimary
  assert.equal(orphan.length, 1); assert.equal(orphan[0].id, 9)
  assert.deepEqual(orphan[0].failedPredicates, ['native-primary-has-no-live-Unit'])
})

test('continuation admits only the exact genuine terminal checkpoint and original source labels', () => {
  const pins = JSON.parse(readFileSync(new URL('./continuation-inputs.json', import.meta.url)))
  const profile = { mode: 'reused', id: pins.profileId, inputs: { application: pins.application }, checkpointAtStart: pins.checkpoint,
    previousRun: { runId: pins.priorRunId, receiptSha256: pins.previousReceiptSha256,
      sourceFingerprint: pins.previousSourceFingerprint, sourceCommit: pins.previousSourceCommit, checker: pins.previousChecker,
      cleanupVerified: true, continuationVerified: true, checkpointAtEnd: pins.checkpoint } }
  requireContinuation(profile, pins)
  for (const change of [p => { p.mode = 'created' }, p => { p.id = 'different' },
    p => { p.checkpointAtStart.checkpointSha256 = 'invented' }, p => { p.previousRun.runId = 'stale' },
    p => { p.previousRun.cleanupVerified = false }, p => { p.inputs.application = 'changed-game' }]) {
    const wrong = structuredClone(profile); change(wrong); assert.throws(() => requireContinuation(wrong, pins))
  }
  const source = readFileSync(new URL('./load-diagnostics.mjs', import.meta.url), 'utf8')
  assert.match(source, /name: 'Load Game'/); assert.match(source, /name: 'Pause game'/)
  assert.doesNotMatch(source, /name: 'Save checkpoint'|mouse\.click|dispatch\.clickOrder|openMission\(/)
  const labels = [...source.matchAll(/observeCheckpoint\('([^']+)'\)/g)].map(match => match[1])
  assert.equal(labels.length, 1)
  for (const label of labels) assert.match(label, /^[a-zA-Z0-9][a-zA-Z0-9 -]{0,79}$/, 'Maintained harness label contract')
})
