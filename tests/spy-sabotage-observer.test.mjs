import assert from 'node:assert/strict'
import test from 'node:test'
import { spySnapshot, observeSpyTurns, requireSabotageTrace } from '../scripts/local-render/spy-sabotage-observer.mjs'

// Supplied observer data only. These tests do not construct or run a game World.
function fixture() {
  const person = { id: 1, commands: [2], commandCursor: 0, immediateCommand: 0,
    state: 10, substate: 0, counter: 0, x: 50, y: 50, goalX: 50, goalY: 50,
    speed: 10, timer: 37, flags2: 0x40000000, flags4: 0, disguise: 192, commandStatus: 15 }
  const unit = { id: 1, team: 'blue', kind: 'spy', hp: 30, x: 0, z: 0, inside: null,
    work: null, target: 10, native: person, path: [{ x: 1, z: 2 }] }
  const target = { id: 10, team: 'green', kind: 'hut', hp: 100, progress: 1 }
  const world = { turn: 10, time: 1, speed: 1, paused: false, status: 'playing', mode: null,
    selected: [1], lastOrderTurn: 10, units: [unit], buildings: [target],
    objectCells: { objects: new Map([[1, person]]) },
    buildingOrders: { records: [null, null, { model: 15, references: 1, a: 100, b: 100 }] } }
  return { world, person, unit, target }
}

test('passive Spy hook preserves receiver/arguments/return and copies state without writes', () => {
  const f = fixture(), calls = [], clock = { afterTurn(...args) { calls.push([this, args]); return 'native-return' } }
  const original = clock.afterTurn, before = structuredClone(f.world)
  const observer = observeSpyTurns(clock, f.world, 1, 10, () => true)
  assert.deepEqual(f.world, before)
  f.world.turn++
  const afterTick = structuredClone(f.world)
  assert.equal(clock.afterTurn('one', 2), 'native-return')
  assert.deepEqual(f.world, afterTick)
  assert.equal(calls.length, 1); assert.equal(calls[0][0], clock); assert.deepEqual(calls[0][1], ['one', 2])
  f.person.commands[0] = 9; f.unit.path[0].x = 99
  const trace = observer.finish()
  assert.equal(trace.samples[0].person.commands[0], 2)
  assert.equal(trace.samples[0].actor.path[0].x, 1)
  assert.equal(trace.restored, true); assert.equal(clock.afterTurn, original)
  assert.deepEqual(observer.finish(), trace)
})

test('native afterTurn exceptions propagate unchanged without diagnostic execution', () => {
  const f = fixture(), error = Error('original failure'), clock = { afterTurn() { throw error } }
  const observer = observeSpyTurns(clock, f.world, 1, 10, () => true)
  f.world.turn++
  assert.throws(() => clock.afterTurn(), value => value === error)
  const result = observer.finish(); assert.deepEqual(result.samples, []); assert.deepEqual(result.errors, [])
})

test('identity, missing turns and overflow fail observation without interrupting the game', () => {
  for (const failure of ['identity', 'turn', 'bound']) {
    const f = fixture(); let calls = 0
    const clock = { afterTurn() { calls++; return 8 } }
    const observer = observeSpyTurns(clock, f.world, 1, 10, () => failure !== 'identity', 1)
    f.world.turn += failure === 'turn' ? 2 : 1
    assert.equal(clock.afterTurn(), 8)
    if (failure === 'bound') { f.world.turn++; assert.equal(clock.afterTurn(), 8) }
    assert.ok(observer.status().errors.length)
    assert.equal(calls, failure === 'bound' ? 2 : 1)
    assert.equal(observer.finish().restored, true)
  }
})

test('Spy observer does not overwrite a replacement hook during cleanup', () => {
  const f = fixture(), clock = {}, replacement = () => 'other-owner'
  const observer = observeSpyTurns(clock, f.world, 1, 10, () => true)
  clock.afterTurn = replacement
  const trace = observer.finish()
  assert.equal(clock.afterTurn, replacement); assert.equal(trace.restored, false)
  assert.match(trace.errors[0], /ownership changed/)
})

function validTrace() {
  const f = fixture(), input = { before: spySnapshot(f.world, 1, 10), after: spySnapshot(f.world, 1, 10) }
  const samples = []
  const capture = changes => {
    Object.assign(f.person, changes); f.person.counter++; f.world.turn++
    samples.push(spySnapshot(f.world, 1, 10))
  }
  capture({ goalX: 100, goalY: 100, flags2: 0 })
  capture({ x: 90, y: 90, substate: 1, flags2: 0x40000000 })
  capture({ substate: 1, flags2: 0, timer: 9 })
  capture({ substate: 2, timer: 5 })
  f.target.burn = { remaining: 127 }; f.target.damageState = { attacker: 0, state: 4 }
  capture({ substate: 4, timer: 24 })
  return { trace: { samples, errors: [], restored: true }, input, goals: [{ x: 100, y: 100 }] }
}

test('trace validates actual input, approach, armed arrival, next visit and ignition', () => {
  const f = validTrace(), proof = requireSabotageTrace(f.trace, f.input, 10, f.goals)
  assert.deepEqual([proof.approachTurn, proof.armedTurn, proof.nextVisitTurn, proof.ignitionTurn], [11, 12, 13, 15])
})

test('trace rejects eager planning, wrapped arrival, skipped controller visits and transient replacement', () => {
  const eager = validTrace(); eager.input.after.person.goalX++
  assert.throws(() => requireSabotageTrace(eager.trace, eager.input, 10, eager.goals), /eagerly plan/)
  const seam = validTrace(); Object.assign(seam.trace.samples[1].person, { x: 32767, goalX: 32768 })
  assert.throws(() => requireSabotageTrace(seam.trace, seam.input, 10, seam.goals), /signed goal axes/)
  const skipped = validTrace(); skipped.trace.samples[2].person.counter++
  assert.throws(() => requireSabotageTrace(skipped.trace, skipped.input, 10, skipped.goals), /next actual controller/)
  const replaced = validTrace(); replaced.trace.samples[3].current = 99
  assert.throws(() => requireSabotageTrace(replaced.trace, replaced.input, 10, replaced.goals), /retain command15/)
})
