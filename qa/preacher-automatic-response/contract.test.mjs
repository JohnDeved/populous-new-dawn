import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { movingEncounter, qualifyingVisit, createResponseTracker, eligibleBraveState, stableBravePair } from './observe.mjs'
import { responseProjection, requireResponseCheckpoint, requireSameCheckpoint } from './checkpoint.mjs'
import { requireCleanup, requirePausedResponse, requireInterruptedResponse, installInputResponseRead } from './scenario.mjs'
import { chainPhaseObservers } from '../preacher-gesture-baseline/observe.mjs'
import { chooseForwardDefender, requireDefenderRemoval } from './forward-defender.mjs'
import { readResponsePeople } from './diagnostics.mjs'
import { requireContinuation } from './load-diagnostics.mjs'
import { coherentCrossingBrave, crossingWitness } from './crossing-input.mjs'

// Supplied diagnostic records test acceptance logic only. They are not ordinary
// gameplay, native execution or rendered evidence.
function row(turn, phase = 'afterTurn', response = false) {
  const queued = { id: 10, identity: 2, model: 3, flags: 0, references: 1, object: 0, a: 20000, b: 20000 }
  return { phase, turn, observationIndex: 2, now: turn * 84, sameWorld: true, sameActor: true, nativeOnly: true,
    registeredOwner: true, actor: { id: 5, kind: 'preacher', team: 'blue', hp: 55, inside: null }, busy: false,
    admission: { work: null, target: null, tree: null, cargo: 0, harvest: false, delivery: false,
      vault: false, guard: false, attackReservation: false, starting: false, armageddon: false,
      landFlags: 0, supported: true, positionCoherent: true },
    status: 'playing', paused: false, speed: 1, visibility: 'visible', pendingDistance: 5000,
    person: { id: 5, class: 1, model: 4, tribe: 0, state: 10, speed: 40, life: 1100, commandStatus: response ? 32 : 3,
      commandCursor: 0, immediateCommand: response ? 11 : 0, commands: [10, 0], workTarget: 0, workFlags: 0, flags2: 0x20000, flags3: 0,
      flags4: 0, assignment: 0, vehicle: 0, x: 0x2100, y: 0x2100, substate: 0, counter: turn & 255, timer: 0, draw: 14 },
    commands: [10, 0], queued: [queued], order: response ? { id: 11, identity: 3, model: 32, flags: 32,
      references: 1, object: 0, a: 0x2100, b: 0x2100 } : queued,
    orderUsers: [5], retiredOrders: [], listeners: [], facts: { autoEligible: true, range: 1, genericThreat: 0,
      primaryGuardIds: [], availableOrder: true, gameFlags: 0, levelFlags2: 0, scanMask: 15,
      braves: [{ id: 6, unitId: 6, identity: 6, class: 1, kind: 'brave', team: 'red', hp: 50, inside: null,
        nativeOnly: true, registeredOwner: true, positionCoherent: true, routeOwner: 6, motionGroup: 0, x: 0x2180, y: 0x2100, model: 2, tribe: 1, state: 17,
        life: 1000, flags2: 0x20000, flags4: 0, workFlags: 0, vehicle: 0, disguise: 0, reverseAlliance: 0 }] } }
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

test('exact retained4676/4678 visits do not treat target reservation presence as a response veto', () => {
  const f = JSON.parse(readFileSync(new URL('./retained-crossing02-precombat.json', import.meta.url)))
  assert.equal(f.sourceHead, 'f86aef9158107dbe2d82e4ed61ad770158799010')
  assert.deepEqual(f.pairs.map(p => p.after.turn), [4676, 4678])
  for (const { before, after } of f.pairs) {
    assert.equal(before.admission.attackReservation, true); assert.equal(after.admission.attackReservation, true)
    assert.ok(qualifyingVisit(before, after))
    const tracker = createResponseTracker({ baseline: true }); tracker.observe(before); tracker.observe(after)
    assert.equal(tracker.progress.status, 'baseline-omission')
    for (const change of [r => { r.admission.attackReservation = false }, r => { r.actor.hp-- },
      r => { r.queued[0].a++ }, r => { r.facts.primaryGuardIds.push(47) }, r => { r.facts.braves[0].workFlags = 1 }]) {
      const invalid = structuredClone(after); change(invalid)
      assert.equal(qualifyingVisit(before, invalid), null)
    }
    for (const change of [r => { r.nativeOnly = false }, r => { r.sameActor = false },
      r => { r.registeredOwner = false }, r => { r.busy = true }]) {
      const invalid = structuredClone(after); change(invalid)
      const denied = createResponseTracker({ baseline: true }); denied.observe(before); denied.observe(invalid)
      assert.equal(denied.progress.status, 'failed')
    }
  }
  const handoff = createResponseTracker({ baseline: true })
  handoff.observe(f.failedHandoff.before); handoff.observe(f.failedHandoff.after)
  assert.equal(handoff.progress.status, 'failed')
  assert.equal(handoff.progress.reason, 'Original on-foot living owner/scene/clock changed')
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

const first32Fixture = () => JSON.parse(readFileSync(new URL('./retained-candidate01-first32.json', import.meta.url)))
test('exact4653→4654 preserves the eligible native pair while its unconsumed route handle changes', () => {
  const f = JSON.parse(readFileSync(new URL('./retained-continuation01-first32.json', import.meta.url)))
  assert.equal(f.sourceHead, '9dfc4c8591b5decf4163a755af2ad5c8f9b4e220')
  assert.deepEqual([f.before.facts.braves[0].motionGroup, f.after.facts.braves[0].motionGroup], [253, 254])
  assert.ok(stableBravePair(f.before, f.after))
  const tracker = createResponseTracker({ prospective: true }); tracker.observe(f.before); tracker.observe(f.after)
  assert.equal(tracker.progress.status, 'responding', tracker.progress.reason)
  assert.equal(tracker.progress.qualifiedEpisode, 1)
  assert.equal(tracker.progress.firstResponse.after.turn, 4654)
  for (const mutate of [b => { b.facts.braves[0].workFlags = 1 }, b => { b.facts.braves[0].identity++ },
    b => { b.facts.braves[0].routeOwner++ }, b => { b.facts.braves[0].x += 512 },
    b => { b.queued[0].identity++ }]) {
    const before = structuredClone(f.before); mutate(before)
    const denied = createResponseTracker({ prospective: true }); denied.observe(before); denied.observe(f.after)
    assert.equal(denied.progress.qualifiedEpisode, null)
    assert.equal(denied.progress.firstResponse, null)
  }
})

function episodeRows(startTurn = 4401) {
  const { before, after } = first32Fixture()
  before.turn = startTurn; after.turn = startTurn + 1
  const startupBefore = structuredClone(after); startupBefore.phase = 'beforeTurn'
  const startup = structuredClone(after); startup.turn++; startup.person.commandStatus = 32; startup.person.substate = 2
  const releaseBefore = structuredClone(startup); releaseBefore.phase = 'beforeTurn'
  const released = structuredClone(startup); released.turn++; released.person.immediateCommand = 0
  released.order = structuredClone(released.queued[0]); released.retiredOrders = [{ ...after.order, references: 0 }]
  return { before, after, startupBefore, startup, releaseBefore, released }
}

test('prospective mode retains exact unqualified4402 without rewriting the failed original attempt', () => {
  const f = first32Fixture(), original = createResponseTracker()
  original.observe(f.before); original.observe(f.after)
  assert.equal(original.progress.status, 'failed')
  const tracker = createResponseTracker({ prospective: true })
  tracker.observe(f.before); tracker.observe(f.after)
  assert.equal(tracker.progress.status, 'unqualified-response', tracker.progress.reason)
  assert.equal(tracker.progress.firstResponse, null); assert.equal(tracker.progress.startup, null)
  assert.equal(tracker.progress.episodes.length, 1)
  assert.equal(tracker.progress.episodes[0].classification, 'nonqualifying-cell-transition')
  assert.equal(tracker.progress.episodes[0].release, null)
  assert.deepEqual(tracker.rows, [f.before, f.after])
})

test('prospective mode keeps malformed source, payload, target and original queue failures fatal', () => {
  for (const mutate of [
    b => { b.facts.genericThreat = 7 }, b => { b.admission.work = 7 },
    b => { b.person.id++ }, b => { delete b.person.workFlags },
    b => { b.person.speed = 32768 }, (b, a) => { a.person.speed = 65535 },
    (b, a) => { delete a.person.state }, (b, a) => { delete a.person.substate },
    (b, a) => { a.person.state = 256 }, (b, a) => { a.person.substate = 1.5 },
    (b, a) => { delete a.person.commandCursor }, (b, a) => { a.person.commandStatus = 256 },
    (b, a) => { a.person.immediateCommand = -1; a.order.id = -1 },
    (b, a) => { a.order.identity = 0 }, (b, a) => { a.order.identity = 1.5 },
    (b, a) => { delete a.order.object },
    (b, a) => { a.turn++ }, (b, a) => { a.actor.hp-- }, (b, a) => { a.person.life-- },
    (b, a) => { a.nativeOnly = false }, (b, a) => { a.order.references = 2 },
    (b, a) => { a.orderUsers = [8] }, (b, a) => { a.queued[0].identity++ },
    b => { delete b.facts.candidates.rows[0].native.flags4 },
    b => { b.facts.candidates.rows[0].registered = false },
    b => { b.facts.candidates.rows[0].positionCoherent = false },
    b => { b.facts.candidates.rows[0].native.state = 23 },
    (b, a) => { a.facts.braves[0].vehicle = 1 },
  ]) {
    const { before, after } = first32Fixture(); mutate(before, after)
    const t = createResponseTracker({ prospective: true }); t.observe(before); t.observe(after)
    assert.equal(t.progress.status, 'failed'); assert.equal(t.progress.firstResponse, null)
  }
})

test('unqualified episode requires its observed release before the first qualifying new edge', () => {
  const e = episodeRows(), t = createResponseTracker({ prospective: true })
  t.observe(e.before); t.observe(e.after)
  const earlyRender = structuredClone(e.after); earlyRender.phase = 'render-after-updater'
  earlyRender.render = { visible: true, draw: earlyRender.person.draw, stamp: earlyRender.turn }
  t.observe(earlyRender)
  assert.equal(t.progress.rendered.length, 0, 'A nonqualifying rendered record cannot earn qualified rendering')
  for (const r of [e.startupBefore, e.startup, e.releaseBefore, e.released]) t.observe(r)
  assert.equal(t.progress.status, 'approaching', t.progress.reason)
  assert.ok(t.progress.episodes[0].release)
  const moveBefore = structuredClone(e.released); moveBefore.phase = 'beforeTurn'; moveBefore.person.commandStatus = 3
  moveBefore.pendingDistance = e.before.pendingDistance
  const move = structuredClone(moveBefore); move.phase = 'afterTurn'; move.turn++
  const before = structuredClone(move); before.phase = 'beforeTurn'; before.facts.range = 1; before.facts.genericThreat = 0
  const after = structuredClone(e.after); after.turn = before.turn + 1; after.order.id = 35; after.order.identity = 7; after.person.immediateCommand = 35
  for (const r of [moveBefore, move, before, after]) t.observe(r)
  assert.equal(t.progress.status, 'responding', t.progress.reason)
  assert.equal(t.progress.episodes.length, 2); assert.equal(t.progress.qualifiedEpisode, 2)
  assert.equal(t.progress.firstObservedResponse.after.turn, 4402)
  assert.equal(t.progress.firstResponse.after.turn, 4406)
  assert.equal(t.events.at(-1).kind, 'first-qualified-automatic32')
  assert.equal(t.progress.rendered.length, 0, 'The qualified record has not rendered yet')
  const qualifiedRender = structuredClone(after); qualifiedRender.phase = 'render-after-updater'
  qualifiedRender.render = { visible: true, draw: qualifiedRender.person.draw, stamp: qualifiedRender.turn }
  t.observe(qualifiedRender); assert.deepEqual(t.progress.rendered, [4406])
  const first = createResponseTracker({ prospective: true }); first.observe(row(15, 'beforeTurn')); first.observe(row(16, 'afterTurn', true))
  assert.equal(first.progress.qualifiedEpisode, 1, 'Do not skip a qualifying very first attachment')
})

test('unqualified episode rejects missing release, reuse, changed health and exhausted episode budget', () => {
  for (const mutate of [
    e => { e.released.retiredOrders[0].references = 1 }, e => { e.released.retiredOrders[0].identity++ },
    e => { e.released.listeners = [3067] }, e => { e.released.queued[0].a++ },
    e => { e.startup.actor.hp-- }, e => { e.startup.order.id++ },
    e => { e.released.order.model = 17 }, e => { e.startup.turn++ },
  ]) {
    const e = episodeRows(); mutate(e); const t = createResponseTracker({ prospective: true })
    for (const r of Object.values(e)) t.observe(r)
    assert.equal(t.progress.status, 'failed'); assert.equal(t.progress.firstResponse, null)
  }
  const t = createResponseTracker({ prospective: true })
  for (let n = 0; n < 3; n++) {
    const e = episodeRows(4401 + n * 4)
    if (n) { const before = structuredClone(e.before); before.turn--; const after = structuredClone(e.before); after.phase = 'afterTurn'; t.observe(before); t.observe(after) }
    for (const r of Object.values(e)) t.observe(r)
  }
  assert.equal(t.progress.status, 'failed'); assert.match(t.progress.reason, /episode cap/)
  assert.equal(t.progress.episodes.length, 3); assert.ok(t.progress.episodes.every(e => e.release))
})

test('prospective tracking preserves visit/row caps and rejects incomplete pairs or recorded same-slot restart', () => {
  for (const options of [{ maxRows: 1 }, { maxVisits: 0 }]) {
    const e = episodeRows(), t = createResponseTracker({ prospective: true, ...options })
    t.observe(e.before); t.observe(e.after); assert.equal(t.progress.status, 'failed')
  }
  for (const restart of [false, true]) {
    const e = episodeRows(), t = createResponseTracker({ prospective: true })
    t.observe(e.before); t.observe(e.after)
    if (restart) {
      t.observe(e.startupBefore); t.observe(e.startup)
      e.releaseBefore.person.commandStatus = 3; t.observe(e.releaseBefore)
    } else t.observe(e.startup)
    assert.equal(t.progress.status, 'failed'); assert.equal(t.progress.firstResponse, null)
  }
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

function pausedPreparation() {
  return { paused: true, turn: 16, time: 2, level: 3, status: 'playing', speed: 1,
    visibility: 'visible', inputMask: 0, mode: null, selected: [5], epoch: 0, sceneIdentity: 1, worldIdentity: 2,
    units: [{ id: 5, kind: 'preacher', team: 'blue', hp: 55, inside: null, nativeIdentity: 8, sourceIdentity: 8,
      native: { registered: true, class: 1, model: 4, tribe: 0, state: 10, commandStatus: 32, immediateCommand: 11, life: 1100, commands: [10, 0], commandCursor: 0,
        orders: [{ id: 10, record: { model: 3 } }] },
      order: { id: 11, model: 32, flags: 32, references: 1 } }] }
}
function cancellationBoundary() {
  const before = row(20, 'input-boundary', true), after = row(20, 'input-boundary')
  after.order = { ...after.order, id: 12, identity: 12 }
  after.retiredOrders = [{ ...before.order, references: 0 }]
  return { inputBefore: { automaticResponse: before, automaticResponseInterval: [], units: [{ id: 5, nativeIdentity: 8, order: before.order }] },
    inputAfter: { automaticResponse: after, units: [{ id: 5, nativeIdentity: 8, order: after.order, native: { immediateCommand: 0 } }] } }
}

test('paused preparation freezes selection and owner before camera/point work; Resume is for dispatch', () => {
  const before = pausedPreparation(), after = structuredClone(before)
  assert.doesNotThrow(() => requirePausedResponse(before, 5))
  assert.doesNotThrow(() => requirePausedResponse(after, 5, before))
  for (const mutate of [r => { r.paused = false }, r => { r.turn++ }, r => { r.selected = [6, 5] },
    r => { r.inputMask = 64 }, r => { r.mode = 'temple' }, r => { r.units[0].sourceIdentity = 99 },
    r => { r.units[0].native.registered = false }, r => { r.units[0].order.model = 3 }]) {
    const invalid = structuredClone(after); mutate(invalid)
    assert.throws(() => requirePausedResponse(invalid, 5, before))
  }
})

test('synchronous cancellation survives later automatic re-engagement without inventing release', () => {
  const prepared = row(20, 'paused-interruption-prepared', true); prepared.paused = true
  const input = cancellationBoundary(), later = { references: 1, registered: true, listeners: [6], currentModel: 32 }
  assert.doesNotThrow(() => requireInterruptedResponse(input, 5, prepared, later))
  for (const mutate of [x => { x.inputBefore.automaticResponse.order.model = 3 },
    x => { x.inputAfter.automaticResponse.retiredOrders[0].references = 1 },
    x => { x.inputAfter.automaticResponse.retiredOrders[0].identity++ },
    x => { x.inputAfter.automaticResponse.listeners = [6] },
    x => { x.inputAfter.automaticResponse.nativeOnly = false },
    x => { x.inputAfter.units[0].nativeIdentity = 99 }]) {
    const bad = structuredClone(input); mutate(bad)
    assert.throws(() => requireInterruptedResponse(bad, 5, prepared))
  }
})

test('interruption stays bound to the paused restored32, not another32 admitted before the handler', () => {
  const prepared = row(19, 'paused-interruption-prepared', true); prepared.paused = true
  const input = cancellationBoundary()
  input.inputBefore.automaticResponseInterval = [row(19, 'beforeTurn', true), row(20, 'afterTurn', true)]
  assert.doesNotThrow(() => requireInterruptedResponse(input, 5, prepared))
  for (const replace of [r => { r.id = 77; r.identity = 77 }, r => { r.identity = 77 }, r => { r.a++ }]) {
    const newer = structuredClone(input), order = newer.inputBefore.automaticResponse.order
    replace(order)
    newer.inputBefore.automaticResponse.person.immediateCommand = order.id
    newer.inputBefore.units[0].order = structuredClone(order)
    newer.inputAfter.automaticResponse.retiredOrders = [{ ...order, references: 0 }]
    assert.throws(() => requireInterruptedResponse(newer, 5, prepared), 'Another32 is not the prepared restored32')
  }
  for (const mutate of [x => { x.inputBefore.automaticResponseInterval.pop() },
    x => { x.inputBefore.automaticResponseInterval[1].order.model = 3 },
    x => { x.inputBefore.automaticResponseInterval[1].person.commandStatus = 3 },
    x => { x.inputBefore.automaticResponseInterval[0].nativeOnly = false }]) {
    const interrupted = structuredClone(input); mutate(interrupted)
    assert.throws(() => requireInterruptedResponse(interrupted, 5, prepared), 'Recorded loss or same-slot replacement cannot be hidden by re-engagement')
  }
  const reused = cancellationBoundary()
  reused.inputBefore.automaticResponse.turn = reused.inputAfter.automaticResponse.turn = 21
  reused.inputBefore.automaticResponseInterval = [row(19, 'beforeTurn', true), row(20, 'afterTurn', true),
    row(20, 'beforeTurn', true), row(21, 'afterTurn', true)]
  // Old32 expires, the same pool object is reused with startup still on3, and
  // a later real visit starts the new32 before the actual input handler.
  reused.inputBefore.automaticResponseInterval[1].person.commandStatus = 3
  reused.inputBefore.automaticResponseInterval[2].person.commandStatus = 3
  assert.throws(() => requireInterruptedResponse(reused, 5, prepared), 'Same id/identity/payload cannot conceal recorded reallocation')
})

test('composed input read forwards once, keeps detached boundary rows and restores its descriptor', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window'), input = cancellationBoundary()
  let row = input.inputBefore.automaticResponse, calls = 0
  const original = function (value) { calls++; assert.equal(this.marker, 7); return { value } }
  const prepared = structuredClone(row); prepared.paused = true
  const fake = { nativeGuardReadInput: original, preacherResponse: { read: () => structuredClone(row), tracker: { rows: [] } } }
  globalThis.window = fake
  const descriptor = Object.getOwnPropertyDescriptor(fake, 'nativeGuardReadInput')
  try {
    installInputResponseRead(prepared)
    const before = fake.nativeGuardReadInput.call({ marker: 7 }, 'before')
    row = input.inputAfter.automaticResponse
    const after = fake.nativeGuardReadInput.call({ marker: 7 }, 'after')
    row.retiredOrders[0].references = 1; row.listeners = [6]
    assert.equal(calls, 2); assert.equal(before.automaticResponse.order.model, 32)
    assert.equal(after.automaticResponse.retiredOrders[0].references, 0)
    assert.deepEqual(after.automaticResponse.listeners, [])
    assert.deepEqual(fake.preacherInputRead.finish(), { restored: true, calls: 2, errors: [] })
    assert.deepEqual(Object.getOwnPropertyDescriptor(fake, 'nativeGuardReadInput'), descriptor)
    assert.equal(fake.preacherInputRead, undefined)
    fake.preacherResponse.read = () => { throw Error('read failed') }
    installInputResponseRead(prepared)
    assert.throws(() => fake.nativeGuardReadInput.call({ marker: 7 }, 'failure'), /read failed/)
    assert.equal(calls, 3, 'The original read still runs exactly once on an observation failure')
    assert.equal(fake.preacherInputRead.finish().restored, true)
    assert.deepEqual(Object.getOwnPropertyDescriptor(fake, 'nativeGuardReadInput'), descriptor)
  } finally { if (previous) Object.defineProperty(globalThis, 'window', previous); else delete globalThis.window }
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
  assert.throws(() => requireCleanup({ inputRead: { restored: false, errors: [] } }))
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
  // Exact reviewed runtime adoption supersedes only the former disabled-state pin.
  assert.equal(pins.candidateSource, 'e4e84e225a451eb301b5e41ab27811a6c6d37300')
  assert.deepEqual(Object.keys(pins.candidateTrees), Object.keys(pins.baselineTrees))
  for (const [name, hash] of Object.entries(pins.candidateTrees)) {
    const git = ref => execFileSync('git', ['rev-parse', `${ref}:${name}`],
      { cwd: new URL('../../', import.meta.url), encoding: 'utf8' }).trim()
    assert.equal(git(pins.candidateSource), hash, `reviewed runtime ${name}`)
    assert.equal(git('HEAD'), hash, `adopted candidate ${name}`)
  }
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
    b => { b.workFlags = 1 }, b => { b.reverseAlliance = 1 },
    b => { b.reverseAlliance = undefined }, b => { b.tribe = undefined; b.team = 'unknown' },
    b => { b.flags2 = undefined }, b => { b.flags2 = 0x20000 + 0.5 }, b => { b.flags2 = 0x100020000 },
    b => { b.flags4 = undefined }, b => { b.flags4 = 0.5 }, b => { b.flags4 = -1 },
    b => { b.vehicle = undefined }, b => { b.vehicle = 0.5 }, b => { b.vehicle = 65536 },
    b => { b.disguise = undefined }, b => { b.disguise = 0.5 }, b => { b.disguise = 256 },
    b => { b.life = 1000.5; b.hp = 50.025 }, b => { b.life = 32768; b.hp = 1638.4 }]) {
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

test('exact eight retained sparse routes are judged by wrapped cell segments, with context and margins retained', () => {
  const f = JSON.parse(readFileSync(new URL('./retained-crossing01-routes.json', import.meta.url)))
  assert.equal(f.sourceHead, '7e62df915f42f492bb0a1b57efb973648579996a')
  assert.equal(f.turn, 4227); assert.equal(f.probes.length, 8)
  const results = f.probes.map(p => crossingWitness(p.path, p.targetCell, p.destination, f.primaryCells, p.context, f.origin))
  assert.deepEqual(results.map(Boolean), [false, true, true, true, true, true, false, true])
  assert.deepEqual(results[1].witnesses.map(w => w.cell), [[125, 43], [125, 42], [124, 41]])
  assert.ok(Math.abs(results[1].witnesses[0].spanNative - 282.89297115660315) < 1e-6)
  const p = f.probes[1]
  assert.equal(crossingWitness(p.path, p.targetCell, p.destination, [...f.primaryCells, p.targetCell], p.context, f.origin), null)
  const singleCellEnd = { x: -13, z: -94 }, origin = { x: -13.1, z: -94 }
  assert.equal(crossingWitness([singleCellEnd], p.targetCell, p.destination, [], p.context, origin), null, 'Short cell grazing cannot admit a crossing')
  assert.equal(crossingWitness([{ x: -13, z: -94 }], p.targetCell, { x: -13, z: -94 }, [], p.context, { x: -14, z: -94 }), null, 'Destination margin still applies')
  assert.equal(crossingWitness(p.path, p.targetCell, p.destination, [], { ...p.context, model: 31 }, f.origin), null)
  assert.equal(crossingWitness(p.path, p.targetCell, p.destination, [], { ...p.context, personId: 53 }, f.origin), null)
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

test('candidate continuation binds genuine3234 and the failed candidate source without borrowing baseline3336', () => {
  const pins = JSON.parse(readFileSync(new URL('./candidate-continuation-inputs.json', import.meta.url)))
  assert.equal(pins.side, 'candidate'); assert.equal(pins.checkpoint.turn, 3234)
  assert.equal(pins.originalActors.traineeId, 519); assert.equal(pins.crossingCaps.maxResponseEpisodes, 3)
  assert.equal(pins.previousSourceCommit, '1b67abd591db9f733a0d2ddbc7459d59a65d4465')
  assert.equal(pins.originalAcquisition.sourceCommit, 'd969cace30848f4777352baa061fdc6eb2ca26d8')
  assert.equal(pins.checkpoint.checkpointSha256, 'ff6c9257b60a3944fa34aef5df79a0b6249889f78889c460ad6ad5baa998342b')
  const profile = { mode: 'reused', id: pins.profileId, inputs: { application: pins.application }, checkpointAtStart: pins.checkpoint,
    previousRun: { runId: pins.priorRunId, receiptSha256: pins.previousReceiptSha256,
      sourceFingerprint: pins.previousSourceFingerprint, sourceCommit: pins.previousSourceCommit, checker: pins.previousChecker,
      cleanupVerified: true, continuationVerified: true, checkpointAtEnd: pins.checkpoint } }
  requireContinuation(profile, pins)
  for (const mutate of [p => { p.checkpointAtStart.turn = 3336 }, p => { p.previousRun.checker = 'wrong' },
    p => { p.previousRun.sourceFingerprint = 'wrong' }, p => { p.previousRun.continuationVerified = false }]) {
    const wrong = structuredClone(profile); mutate(wrong); assert.throws(() => requireContinuation(wrong, pins))
  }
})
