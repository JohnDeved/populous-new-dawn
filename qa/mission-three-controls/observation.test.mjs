import assert from 'node:assert/strict'
import test from 'node:test'
import { createEpoch, recordTurn, attachObserver, requireConversion, progressKey, checkCondition } from './observation.mjs'
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
