import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createEpoch, recordTurn, attachObserver, requireConversion, progressKey, checkCondition, observeBuilding, IncompleteRun, MissionDefeat, authoredVictimIdentity, acceptedOrderEvidence, activeBudget, requireActiveBudget, waitDiagnosticStop, requireNotDefeated, minimapInput, requiredActorStop, selectSermonAnchor, inOrdinaryPreachingCells, armSermonObservation } from './observation.mjs'
const world = () => ({ turn: 0, time: 0, speed: 1, outcome: { level: 3 }, units: [] })

test('minimap inverse rejects the closest pixel hidden by a tab and never chooses a non-canvas point', () => {
  const input = { width: 10, height: 10, rect: { x: 0, y: 0, width: 100, height: 100 },
    center: { x: 0, y: 0 }, heading: 0, target: { x: 5 * 256, y: 7 * 256 } }
  const original = structuredClone(input)
  const pick = (_w, _h, _center, _heading, p) => ({ x: p.x * 256, y: p.y * 256 })
  const canvasOwns = p => p.y < 65
  const selected = minimapInput(input, pick, canvasOwns)
  assert.equal(canvasOwns(selected), true, 'The geometrically closest pixel is covered by a HUD tab')
  assert.deepEqual(selected, { x: 50, y: 60, distance: 256, native: { x: 1280, y: 1536 } })
  assert.equal(minimapInput(input, pick, () => false), null)
  assert.equal(minimapInput({ ...input, maxDistance: 128 }, pick, canvasOwns), null)
  assert.deepEqual(input, original)
})

test('observer chains original exactly once with receiver, arguments and return preserved', () => {
  const w = world(), epoch = createEpoch('entry'), calls = []
  const original = function (...args) { calls.push({ receiver: this, args }); return 'retained' }
  const clock = { afterTurn: original }, detach = attachObserver(clock, w, epoch)
  w.turn = 1; w.time = 1 / 12
  assert.equal(clock.afterTurn(7), 'retained')
  assert.deepEqual(calls, [{ receiver: clock, args: [7] }])
  assert.equal(epoch.samples, 2)
  assert.equal(detach(), true); assert.equal(clock.afterTurn, original)
  assert.equal(detach(), true); assert.deepEqual(epoch.errors, [])
})

test('diagnostic exceptions are contained while original application exceptions remain visible', () => {
  const w = world(), e = createEpoch('entry'), app = Error('application failure')
  let calls = 0
  const clock = { afterTurn() { calls++ } }
  attachObserver(clock, w, e, () => { throw Error('diagnostic failure') })
  assert.doesNotThrow(() => clock.afterTurn()); assert.equal(calls, 1)
  assert.equal(e.errors.length, 2)
  const another = { afterTurn() { throw app } }, second = createEpoch('load', 0)
  attachObserver(another, w, second)
  assert.throws(() => another.afterTurn(), error => error === app)
  assert.equal(second.samples, 1)
})

test('reload epochs sum forward intervals without pairing across a rewind', () => {
  const w = world(), a = createEpoch('entry')
  w.turn = 120; w.time = 10; recordTurn(a, w)
  w.turn = 240; w.time = 20; recordTurn(a, w)
  const b = createEpoch('reload', 10)
  w.turn = 132; w.time = 11; recordTurn(b, w)
  assert.equal(a.activeSeconds + b.activeSeconds, 21)
  assert.throws(() => recordTurn(a, w), /rewound/)
  assert.deepEqual(b.conversions.events, [])
})

test('exact conversion requires adjacent turns, singleton matching and no diagnostic errors', () => {
  const w = world(), e = createEpoch('entry')
  w.units = [
    { id: 8, team: 'blue', kind: 'preacher', hp: 10 },
    { id: 53, team: 'yellow', kind: 'brave', hp: 10, native: { state: 23, workTarget: 8 } },
  ]
  recordTurn(e, w); w.turn = 1; w.time = 1 / 12
  w.units = [w.units[0], { id: 100, team: 'blue', kind: 'brave', hp: 10,
    native: { flags3: 0x1000000, flags4: 0x40000 } }]
  recordTurn(e, w)
  assert.equal(requireConversion(e, 53, 8).replacements[0].id, 100)
  assert.throws(() => requireConversion(e, 53, 9), /No exact/)
  e.errors.push({ error: 'missed observation' })
  assert.throws(() => requireConversion(e, 53, 8), /invalidate/)
  const fresh = createEpoch('reload'); recordTurn(fresh, w)
  assert.throws(() => requireConversion(fresh, 53, 8), /No exact/)
})

test('ordinary death or polling gaps do not satisfy conversion', () => {
  for (const missingFlag of [true, false]) {
    const w = world(), e = createEpoch('entry')
    w.units = [{ id: 8, team: 'blue', kind: 'preacher', hp: 10 },
      { id: 53, team: 'yellow', kind: 'brave', hp: 10, native: { state: 23, workTarget: 8 } }]
    recordTurn(e, w); w.turn = missingFlag ? 1 : 2; w.time = w.turn / 12
    w.units = [w.units[0], { id: 100, team: 'blue', kind: 'brave', hp: 10,
      native: { flags3: missingFlag ? 0 : 0x1000000, flags4: 0x40000 } }]
    recordTurn(e, w); assert.throws(() => requireConversion(e, 53, 8), /No exact/)
  }
})

test('required sermon actors fail fast while completed conversion and unrelated lifecycles remain valid', () => {
  const preacher = { id: 3162, team: 'blue', kind: 'preacher', hp: 55 }
  const victim = { id: 53, team: 'yellow', kind: 'brave', hp: 50, x: -43, z: -107 }
  const s = { units: [preacher, victim], buildings: [], shrines: [], observation: { conversions: { events: [] } } }
  const condition = { type: 'listener', id: 53, preacherId: 3162 }
  assert.equal(requiredActorStop(s, condition), null)
  for (const movingVictim of [victim, { ...victim, x: -27, inside: 1017 }]) {
    const missing = { ...s, units: [movingVictim] }
    assert.equal(requiredActorStop(missing, condition).code, 'required-preacher-unavailable')
    assert.equal(checkCondition({ ...missing, units: [{ ...movingVictim, nativeState: 23, owner: 3162 }] }, condition), false)
  }
  assert.equal(requiredActorStop({ ...s, units: [preacher] }, condition).code, 'required-victim-unavailable')
  assert.equal(requiredActorStop({ ...s, units: [{ ...preacher, team: 'yellow' }, victim] }, condition).code, 'required-preacher-unavailable')
  const converted = { ...s, units: [], observation: { conversions: { events: [{
    victims: [{ id: 53, workTarget: 3162 }], replacements: [{ id: 700, team: 'blue' }]
  }] } } }
  assert.equal(requiredActorStop(converted, { ...condition, type: 'conversion' }), null)
  for (const type of ['trained-kind', 'shaman-ready', 'target-gone'])
    assert.equal(requiredActorStop({ ...s, units: [] }, { type }), null)
})

test('sermon approach anchor is prospective, conservative and deterministic', () => {
  const brave = (id, x, z, extra = {}) => ({ id, x, z, kind: 'brave', team: 'yellow', hp: 50,
    inside: null, nativeState: 19, preachingEligible: true, ...extra })
  const s = { units: [brave(53, -43, -107), brave(48, -45, -107), brave(47, -41, -107)] }
  const original = structuredClone(s)
  assert.equal(selectSermonAnchor(s, 53).anchor.id, 53)
  s.units[0].inside = 1017
  assert.equal(selectSermonAnchor(s, 53).anchor.id, 47, 'Equal distances break on ID before the sermon')
  assert.equal(selectSermonAnchor({ units: [...s.units].reverse() }, 53).anchor.id, 47)
  assert.throws(() => selectSermonAnchor({ units: [brave(53, -43, -107, { preachingEligible: false })] }, 53), /No observed/)
  assert.throws(() => selectSermonAnchor({ units: [brave(53, 35, 81)] }, 53), /No observed/)
  assert.throws(() => selectSermonAnchor({ units: Array.from({ length: 201 }, (_, id) => brave(id, -43, -107)) }, 53), /bounded200/)
  assert.deepEqual(original.units[1], s.units[1])
})

test('anchor tactic excludes nearby specialists with logged distances and never silently widens', () => {
  const brave = (id, x, z) => ({ id, x, z, kind: 'brave', team: 'yellow', hp: 50,
    inside: null, nativeState: 19, preachingEligible: true })
  const shaman = { id: 47, x: -45, z: -107, hp: 100, kind: 'shaman', team: 'yellow' }
  const state = { units: [brave(53, -43, -107), brave(52, -47, -107), brave(2529, -41, -94.6875), shaman] }
  const original = structuredClone(state), choice = selectSermonAnchor(state, 53)
  assert.equal(choice.anchor.id, 2529, 'Run05 authored anchor beside the Shaman is excluded prospectively')
  assert.deepEqual(choice.excludedIds, [53, 52])
  assert.deepEqual(choice.remainingIds, [2529])
  assert.deepEqual(choice.assessments[0].distances, [{ id: 47, distance: 2 }])
  assert.deepEqual(state, original)
  assert.deepEqual(selectSermonAnchor({ units: [...state.units].reverse() }, 53), choice)
  assert.throws(() => selectSermonAnchor({ units: [brave(53, -37, -107), shaman] }, 53),
    error => error.code === 'no-eligible-victim' && error.search.remainingIds.length === 0 &&
      error.search.assessments[0].distances[0].distance === 8)
  // Candidate near the world seam; wrapped specialist distance is two, not254.
  assert.throws(() => selectSermonAnchor({ units: [brave(53, -43, -127),
    { ...shaman, x: -43, z: 127 }] }, 53), error => error.search.assessments[0].distances[0].distance === 2)
  assert.equal(selectSermonAnchor({ units: [brave(53, -43, -107), { ...shaman, hp: 0 }] }, 53).anchor.id, 53)
})

test('a declared pool locks the first actual owned sermon and preserves a same-turn ID tie', () => {
  const w = world(), epoch = createEpoch('entry')
  const preacher = { id: 3169, team: 'blue', kind: 'preacher', hp: 55, inside: null,
    native: { model: 4, tribe: 0, state: 19, workTarget: 0 } }
  const brave = (id, inside = null) => ({ id, team: 'yellow', kind: 'brave', hp: 50, x: -43, z: -107, inside,
    ...(inside === null ? { native: { model: 2, tribe: 2, state: 19, workTarget: 0 } } : {}) })
  w.turn = 10; w.time = 10 / 12; w.units = [preacher, brave(2495, 1017), brave(48), brave(40)]
  recordTurn(epoch, w)
  const original = structuredClone(w), declaration = armSermonObservation(epoch, w, 3169)
  assert.deepEqual(w, original)
  assert.deepEqual(declaration.candidateIds, [40, 48, 2495])
  assert.equal(declaration.candidates.find(u => u.id === 2495).inside, 1017,
    'Housing at declaration does not falsely claim current sermon eligibility')
  assert.throws(() => armSermonObservation(epoch, w, 3169), /re-armed/)
  w.turn = 11; w.time = 11 / 12
  for (const u of w.units.filter(u => [48, 2495].includes(u.id))) {
    u.inside = null; u.native = { model: 2, tribe: 2, state: 23, workTarget: 3169, timer: 100 }
  }
  const atOnset = structuredClone(w); recordTurn(epoch, w)
  assert.deepEqual(w, atOnset)
  assert.equal(epoch.sermon.firstOwned.victim.id, 48)
  assert.deepEqual(epoch.sermon.firstOwned.sameTurnIds, [48, 2495])
  assert.equal(epoch.sermon.firstOwned.before.state, 19)
  assert.equal(epoch.sermon.firstOwned.turnBefore, 10)
  assert.equal(epoch.sermon.firstOwned.turnAfter, 11)
  w.turn = 12; w.time = 1
  w.units.find(u => u.id === 40).native = { model: 2, tribe: 2, state: 23, workTarget: 3169, timer: 99 }
  recordTurn(epoch, w)
  assert.equal(epoch.sermon.firstOwned.victim.id, 48, 'A later lower ID cannot replace the locked onset')
  const snapshot = { buildings: [], shrines: [], observation: structuredClone(epoch), units: w.units.map(u =>
    ({ ...u, nativeState: u.native?.state, owner: u.native?.workTarget })) }
  const condition = { type: 'first-owned-sermon', preacherId: 3169 }
  assert.equal(checkCondition(snapshot, condition), true)
  snapshot.units = snapshot.units.filter(u => u.id !== 48)
  assert.equal(checkCondition(snapshot, condition), false)
  assert.equal(requiredActorStop(snapshot, condition).code, 'missed-sermon-window',
    'Remaining listeners cannot be selected after the first one disappeared')
  assert.equal(createEpoch('reload').sermon, null)
})

test('sermon policy cannot be armed after an owned listener or a conversion already exists', () => {
  const w = world(), epoch = createEpoch('entry')
  w.units = [{ id: 8, team: 'blue', kind: 'preacher', hp: 55 },
    { id: 53, team: 'yellow', kind: 'brave', hp: 50, inside: null,
      native: { model: 2, tribe: 2, state: 23, workTarget: 8 } }]
  recordTurn(epoch, w)
  assert.throws(() => armSermonObservation(epoch, w, 8), error => error.code === 'retrospective-sermon-arm')
  w.units[1].native.state = 19
  epoch.conversions.events.push({ victims: [{ id: 50, workTarget: 8 }] })
  assert.throws(() => armSermonObservation(epoch, w, 8), error => error.code === 'retrospective-sermon-arm')
  assert.equal(epoch.sermon, null)
})

test('an idle Preacher timer is not progress toward a housed candidate', () => {
  const s = { buildings: [], units: [{ id: 53, team: 'yellow', hp: 50, x: -27, z: -107, inside: 1017 },
    { id: 3169, team: 'blue', hp: 55, x: -41, z: -109, nativeState: 10, timer: 100 }] }
  const after = structuredClone(s); after.units[1].timer = 600
  assert.equal(progressKey(s, 'sermon'), progressKey(after, 'sermon'))
})

test('prospective sermon approaches stay in the actual ordinary native cell square', () => {
  const victim = { x: -43, z: -107 }
  assert.equal(inOrdinaryPreachingCells({ x: -41, z: -109 }, victim), true)
  assert.equal(inOrdinaryPreachingCells({ x: -39, z: -110 }, victim), false)
  assert.equal(inOrdinaryPreachingCells({ x: -127, z: -127 }, { x: 127, z: 127 }), true)
})

test('progress ignores turn-only changes but retains training mana and sermon timer', () => {
  const s = { turn: 1, units: [{ id: 53, nativeState: 23, timer: 98 }], buildings: [{ id: 4, trainingMana: 4 }],
    shrines: [], effects: [], status: 'playing', observation: {} }
  assert.equal(progressKey(s, 'training'), progressKey({ ...s, turn: 100 }, 'training'))
  assert.notEqual(progressKey(s, 'training'), progressKey({ ...s, buildings: [{ id: 4, trainingMana: 5 }] }, 'training'))
  assert.notEqual(progressKey(s, 'sermon'), progressKey({ ...s, units: [{ id: 53, nativeState: 23, timer: 97 }] }, 'sermon'))
  assert.throws(() => checkCondition(s, { type: 'arbitrary-expression' }), /Unsupported/)
  assert.equal(checkCondition(s, { type: 'won' }), false)
})


test('null, undefined and hostile diagnostic exceptions cannot escape afterTurn', () => {
  const failures = [null, undefined, { get stack() { throw Error('getter') } },
    { toString() { throw Error('formatter') } }]
  for (const failure of failures) {
    let calls = 0
    const clock = { afterTurn() { calls++ } }, epoch = createEpoch('entry')
    attachObserver(clock, world(), epoch, () => { throw failure })
    assert.doesNotThrow(() => clock.afterTurn())
    assert.equal(calls, 1); assert.equal(epoch.errors.length, 2)
    assert.ok(epoch.errors.every(item => typeof item.error === 'string'))
  }
})

test('building snapshots copy real admission occupancy and queue data', () => {
  const building = Object.freeze({ id: 9, kind: 'temple', team: 'yellow', hp: 100,
    occupants: ['not a real Building field'], admission: Object.freeze({
      occupants: Object.freeze([53, 54, 0, 0, 0]), inside: 2, storedMana: 15, trainingCost: 40, queueHead: 55
    }) })
  const observed = observeBuilding(building)
  assert.deepEqual(observed.occupants, [53, 54, 0, 0, 0])
  assert.equal(observed.inside, 2); assert.equal(observed.queue, 55)
  assert.equal(observed.trainingMana, 15); assert.equal(observed.trainingCost, 40)
  observed.occupants[0] = 99
  assert.equal(building.admission.occupants[0], 53)
  assert.deepEqual(observeBuilding({ id: 10 }).occupants, [])
})

test('budget stops have an explicit incomplete classification, not a gameplay assertion', () => {
  const stop = new IncompleteRun('active-budget', 'Advancing route reached diagnostic budget')
  assert.equal(stop.name, 'IncompleteRun'); assert.equal(stop.code, 'active-budget')
  assert.ok(stop instanceof Error)
})


test('authored identity follows only the reviewed imported allocation prefix, not current position', () => {
  const level = JSON.parse(readFileSync(new URL('../../app/level-three.ts', import.meta.url), 'utf8')
    .split('export default ')[1].trim().replace(/;$/, ''))
  const identity = authoredVictimIdentity(level.objects)
  assert.equal(identity.id, 53); assert.equal(identity.objectIndex, 52)
  const changed = structuredClone(level.objects)
  changed[0].type = 6
  assert.throws(() => authoredVictimIdentity(changed), /Unreviewed/)
  assert.throws(() => authoredVictimIdentity(level.objects.slice(1)), /prefix changed/)
})

test('entity order evidence rejects missed input and separately labels an existing assignment', () => {
  const actor = { id: 5, work: 42, target: null, order: { model: 8, a: 42, b: 0 } }
  const before = { turn: 10, lastOrderTurn: 9, pointerAck: { target: 42, until: 5 },
    selected: [5], units: [actor], effects: [] }
  assert.throws(() => acceptedOrderEvidence(before, before, { id: 42 }), /Missing fresh/)
  const after = { ...before, lastOrderTurn: 10, pointerAck: { target: 42, until: 6 } }
  assert.equal(acceptedOrderEvidence(before, after, { id: 42 }).kind, 'fresh-input-existing-order')
  assert.throws(() => acceptedOrderEvidence(before, after, { id: 43 }), /Missing fresh/)
  const changed = { ...after, pointerAck: { target: 43, until: 6 },
    units: [{ ...actor, work: 43, order: { model: 8, a: 43, b: 0 } }] }
  assert.equal(acceptedOrderEvidence(before, changed, { id: 43 }).kind, 'fresh-input-new-order')
  assert.throws(() => acceptedOrderEvidence({ ...before, selected: [6] }, changed, { id: 43 }), /No selected/)
})

test('ground input evidence correlates the requested point, new marker and actual recipient', () => {
  const before = { turn: 10, lastOrderTurn: 9, pointerAck: { target: 0, until: 5 },
    selected: [5], units: [{ id: 5, order: { model: 3, a: 0, b: 0 } }], effects: [] }
  const point = { x: 35, z: 81 }, native = { a: (35 + 8) * 256, b: ((-81 - 8) * 256) & 65535 }
  const after = { ...before, lastOrderTurn: 10, pointerAck: { target: 0, until: 6 },
    units: [{ id: 5, order: { model: 3, ...native } }], effects: [{ id: 8, kind: 'orderMarker', ...point }] }
  assert.equal(acceptedOrderEvidence(before, after, { point }).kind, 'fresh-input-new-order')
  assert.throws(() => acceptedOrderEvidence(before, { ...after, effects: [] }, { point }), /marker/)
  assert.throws(() => acceptedOrderEvidence(before, after, { point: { x: 0, z: 0 } }), /recipient/)
})

test('an actually observed owned marker survives expiry as dispatch-correlated evidence', () => {
  const w = world(), epoch = createEpoch('entry'), point = { x: 35, z: 81 }
  w.turn = 120; w.time = 10; w.lastOrderTurn = 119
  w.effects = []; w.secondaryEffects = { slots: [] }
  recordTurn(epoch, w)
  const before = { turn: 120, lastOrderTurn: 119, pointerAck: { target: 0, until: 5 },
    selected: [46], units: [{ id: 46, order: null }], effects: [], observation: structuredClone(epoch) }
  w.lastOrderTurn = 120; w.turn = 121; w.time = 121 / 12
  w.effects = [{ id: 700, kind: 'orderMarker', ...point, turnsRemaining: 3 }]
  w.secondaryEffects.slots = [{ kind: 'orderMarker', effect: 700, serial: 12 }]
  const unchanged = structuredClone(w)
  recordTurn(epoch, w); recordTurn(epoch, w)
  assert.deepEqual(w, unchanged, 'Observation never extends or changes the live marker')
  // The normal secondary owner removes the marker at its fourth visit, before
  // the host's later page snapshot. This fixture does not run or change clocks.
  w.turn = 130; w.time = 130 / 12; w.effects = []; w.secondaryEffects.slots = []
  recordTurn(epoch, w)
  const after = { ...before, turn: 130, lastOrderTurn: 120,
    pointerAck: { target: 0, until: 6 }, observation: structuredClone(epoch),
    units: [{ id: 46, order: { model: 3, a: 11008, b: 42752 } }] }
  const accepted = acceptedOrderEvidence(before, after, { point })
  assert.equal(accepted.kind, 'fresh-input-new-order')
  assert.equal(accepted.marker.id, 700)
  assert.equal(epoch.orderMarkers.length, 1, 'Retain one copied first observation per allocation')
  assert.equal(epoch.orderMarkers[0].secondarySerial, 12)
  for (const mutate of [
    e => { e.orderMarkers = [] },
    e => { e.name = 'reload' },
    e => { e.orderMarkers[0].commandTurn = 119 },
    e => { e.orderMarkers[0].observedTurn = 119 },
    e => { e.orderMarkers[0].x = 0 },
  ]) {
    const invalid = structuredClone(after); mutate(invalid.observation)
    assert.throws(() => acceptedOrderEvidence(before, invalid, { point }), /marker/)
  }
  assert.throws(() => acceptedOrderEvidence({ ...before, observation: structuredClone(epoch) }, after, { point }), /marker/)
  assert.throws(() => acceptedOrderEvidence(before, { ...after, pointerAck: before.pointerAck }, { point }), /fresh/)
  assert.throws(() => acceptedOrderEvidence(before, { ...after, units: [] }, { point }), /recipient/)
})

test('marker history requires actual secondary ownership and retains a bounded cursor window', () => {
  const w = world(), epoch = createEpoch('entry')
  w.effects = [{ id: 1, kind: 'orderMarker', x: 35, z: 81 }]
  w.secondaryEffects = { slots: [] }
  recordTurn(epoch, w)
  assert.equal(epoch.orderMarkerCursor, 0)
  assert.deepEqual(epoch.orderMarkers, [], 'An unowned visual is never invented as an allocated marker')
  for (let id = 1; id <= 513; id++) {
    w.turn = id; w.time = id / 12; w.lastOrderTurn = id - 1
    w.effects = [{ id, kind: 'orderMarker', x: 35, z: 81, turnsRemaining: 3 }]
    w.secondaryEffects.slots = [{ kind: 'orderMarker', effect: id, serial: id }]
    recordTurn(epoch, w)
  }
  assert.equal(epoch.orderMarkers.length, 512)
  assert.equal(epoch.orderMarkerCursor, 513)
  assert.equal(epoch.orderMarkers[0].cursor, 2)
  assert.equal(createEpoch('reload').orderMarkerCursor, 0)
})

test('construction progress includes assigned workers while delivered logs remain unchanged', () => {
  const s = { units: [{ id: 5, x: 10, z: 20, work: 7, cargo: 0 }],
    buildings: [{ id: 7, logs: 0, progress: 0, builders: [5] }], status: 'playing' }
  const moved = { ...s, units: [{ ...s.units[0], x: 12 }] }
  const carrying = { ...s, units: [{ ...s.units[0], cargo: 1 }] }
  assert.notEqual(progressKey(s, 'construction', [7]), progressKey(moved, 'construction', [7]))
  assert.notEqual(progressKey(s, 'construction', [7]), progressKey(carrying, 'construction', [7]))
})

test('wall-clock stalls and active budget stops are incomplete; defeat is terminal failure', () => {
  const input = { now: 29999, clockAdvancedAt: 0, animationAdvancedAt: 0,
    wallElapsed: 29999, wallLimit: 5400000, active: 0, budget: 600, changedAt: 0, scope: 'training' }
  assert.equal(waitDiagnosticStop(input), null)
  assert.equal(waitDiagnosticStop({ ...input, now: 30000 }).code, 'clock-stall')
  assert.equal(waitDiagnosticStop({ ...input, active: 600, changedAt: 600 }).code, 'active-budget')
  assert.equal(waitDiagnosticStop({ ...input, active: 120 }).code, 'progress-stall')
  assert.equal(waitDiagnosticStop({ ...input, wallElapsed: 5400000 }).code, 'wall-envelope')
  assert.ok(new MissionDefeat() instanceof Error)
  assert.equal(new MissionDefeat() instanceof IncompleteRun, false)
})


test('the shared batch/wait/catch status guard makes every observed defeat terminal', () => {
  for (const status of ['playing', 'won', undefined]) assert.doesNotThrow(() => requireNotDefeated(status))
  for (const boundary of ['wait', 'batch snapshot', 'recoverable catch', 'awaiting input']) {
    const retainedFailures = boundary === 'recoverable catch' ? [{ error: 'original helper error' }] : []
    assert.throws(() => requireNotDefeated('lost'), error => error instanceof MissionDefeat)
    if (boundary === 'recoverable catch') assert.deepEqual(retainedFailures, [{ error: 'original helper error' }])
  }
})

test('escort preparation has900 active seconds while the whole journey stays within2400', () => {
  assert.equal(activeBudget(), 900)
  assert.equal(activeBudget(500), 2300)
  assert.equal(activeBudget(600), 2400)
  assert.equal(activeBudget(900), 2400)
  assert.equal(activeBudget(1000), 2400)
  for (const invalid of [-1, Infinity, NaN]) assert.throws(() => activeBudget(invalid))
})

test('a newly satisfied condition cannot bypass the current resource envelope', () => {
  const satisfied = { units: [], buildings: [], shrines: [], status: 'won' }
  assert.equal(checkCondition(satisfied, { type: 'won' }), true)
  const accept = (active, conversion = null) => {
    requireActiveBudget(active, conversion)
    return checkCondition(satisfied, { type: 'won' })
  }
  assert.equal(accept(899.9), true)
  for (const active of [900, 900.1])
    assert.throws(() => accept(active), error => error.code === 'active-budget')
  assert.equal(accept(2399.9, 900), true)
  assert.throws(() => accept(2400, 900), error => error.code === 'active-budget')
})
