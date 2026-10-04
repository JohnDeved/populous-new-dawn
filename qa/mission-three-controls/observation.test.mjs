import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createEpoch, recordTurn, attachObserver, requireConversion, progressKey, checkCondition, observeBuilding, IncompleteRun, MissionDefeat, authoredVictimIdentity, acceptedOrderEvidence, waitDiagnosticStop, requireNotDefeated } from './observation.mjs'
const world = () => ({ turn: 0, time: 0, speed: 1, outcome: { level: 3 }, units: [] })

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

test('progress ignores turn-only changes but retains training mana and sermon timer', () => {
  const s = { turn: 1, units: [{ id: 53, timer: 98 }], buildings: [{ id: 4, trainingMana: 4 }],
    shrines: [], effects: [], status: 'playing', observation: {} }
  assert.equal(progressKey(s, 'training'), progressKey({ ...s, turn: 100 }, 'training'))
  assert.notEqual(progressKey(s, 'training'), progressKey({ ...s, buildings: [{ id: 4, trainingMana: 5 }] }, 'training'))
  assert.notEqual(progressKey(s, 'sermon'), progressKey({ ...s, units: [{ id: 53, timer: 97 }] }, 'sermon'))
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
