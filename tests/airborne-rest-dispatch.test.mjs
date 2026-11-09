import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorldState, addUnit } from '../app/world-state.ts'
import { createLivePerson, registerLivePerson, stepLivePhysics } from '../app/live-people.ts'
import { objectsInCell } from '../app/object-cells.ts'
import { random } from '../app/native-math.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

// Supplied branch controls, not campaign or original-executable observations.
// The person is genuinely airborne in the live physics adapter, but the state,
// terrain, velocity and interruption boundary are explicitly supplied.
function fixture(state = 19) {
  const w = createWorldState(1)
  w.manaWorld.gameFlags = 32
  w.land.heights.fill(1000)
  w.land.flags.fill(0)
  w.land.categories.fill(0)
  for (const mask of w.land.walkMasks) mask.fill(255)
  const u = addUnit(w, 'blue', 'brave', { x: 10, z: 10 })
  const p = createLivePerson(w, u)
  Object.assign(p, { state, previousState: 17, substate: 5, h: 3000,
    counter: 9, timer: 20, flags2: 0x80000, flags4: p.flags4 | 0x100400,
    reactionTimer: 10, reactionDuration: 20, slowTurn: 10,
    goalX: p.x, goalY: p.y, anchorX: p.x, anchorY: p.y,
    velocity: { x: 40, y: 20, z: -30 } })
  u.native = p
  u.flight = p
  registerLivePerson(w, p)
  return { w, u, p }
}
function registered(w, p) {
  assert.equal(w.objectCells.objects.get(p.id), p)
  const cell = ((p.x >>> 8) & 254) | (p.y & 0xfe00)
  assert.equal([...objectsInCell(w.objectCells, cell)].filter(other => other.id === p.id).length, 1)
}

for (const state of [1, 17, 19]) test(`supplied airborne state ${state} has one preparation, reaction and physics visit`, () => {
  const { w, u, p } = fixture(state)
  const { x, y, h } = p, initial = structuredClone(p)
  stepLivePhysics(w, u, p)
  assert.equal(p.counter, initial.counter + 1)
  assert.equal(p.slowTurn, 9)
  assert.equal(p.reactionTimer, 9)
  assert.equal(p.reactionDuration, 19)
  assert.deepEqual({ x: p.x, y: p.y, h: p.h }, {
    x: x + 38, y: y - 28, h: h + 20 - rules.personGravity[p.physics],
  })
  assert.equal(p.state, state)
  if (state === 1) assert.equal(p.timer, 19)
  if (state === 19) assert.equal(p.stateObject, initial.stateObject + 1)
  assert.equal(u.native, p)
  assert.equal(u.flight, p)
  registered(w, p)
})

for (const bit of [4, 0x2000]) test(`supplied state 1 consumes interruption ${bit} before clearing it on detached flight owner`, () => {
  const { w, u, p } = fixture(1)
  const stale = structuredClone(p)
  u.native = stale
  p.flags2 |= bit
  stepLivePhysics(w, u, p)
  assert.equal(p.state, 10)
  assert.equal(p.previousState, 1)
  assert.equal(p.flags2 & 0x2004, 0)
  assert.equal(u.native, stale)
  assert.equal(stale.state, 1)
  assert.equal(stale.timer, 20)
  assert.equal(u.flight, p)
  registered(w, p)
})

test('supplied state 1 signed timer expiry transitions once without re-running the new controller', () => {
  const { w, u, p } = fixture(1)
  p.timer = -32768
  stepLivePhysics(w, u, p)
  assert.equal(p.timer, 32767)
  assert.equal(p.state, 1, 'signed-word decrement wraps before the expiry comparison')
  p.timer = 1
  stepLivePhysics(w, u, p)
  assert.equal(p.state, 10)
  assert.equal(p.previousState, 1)
  assert.equal(p.counter, 11)
})

test('supplied state 17 approach uses post-physics position and does not visit state 19 twice', () => {
  const { w, u, p } = fixture(17)
  p.slowTurn = 1
  // Physics crosses into the goal cell on this visit.
  p.x = (p.x & 0xfe00) + 500
  p.goalX = (p.x + 38) & 65535
  p.goalY = p.y - 28
  assert.notEqual(p.x >>> 9, p.goalX >>> 9)
  stepLivePhysics(w, u, p)
  assert.equal(p.state, 19)
  assert.equal(p.previousState, 17)
  assert.equal(p.substate, 0, 'state-19 initialization runs, its controller waits until next visit')
  assert.equal(p.stateObject, 0)
  assert.ok(p.assignment & 1)
  registered(w, p)
})

test('supplied state 19 honors interruption before clearing it and transitions the actual owner', () => {
  const { w, u, p } = fixture()
  u.native = null
  p.previousState = 1
  p.goalX = (p.x + 2048) & 65535
  p.flags2 |= 4
  stepLivePhysics(w, u, p)
  assert.equal(p.state, 1)
  assert.ok(p.timer >= 50 && p.timer < 100, 'new wait timer is initialized, not decremented again')
  assert.equal(p.flags2 & 0x2004, 0)
  assert.equal(u.native, null)
  assert.equal(u.flight, p)
  registered(w, p)
})

test('supplied state 19 advances gameplay RNG twice at its idle phase and preserves cosmetic RNG', () => {
  const { w, u, p } = fixture()
  p.counter = 31
  const expected = { randomState: w.randomState }, cosmetic = w.cosmeticRandom.randomState
  random(expected)
  random(expected)
  stepLivePhysics(w, u, p)
  assert.equal(w.randomState, expected.randomState)
  assert.equal(w.cosmeticRandom.randomState, cosmetic)
  assert.equal(p.counter, 32)
  assert.equal(p.stateObject, 1)
})

for (const substate of [4, 8]) test(`supplied state 19 substate ${substate} publishes its single timber drop`, () => {
  const { w, u, p } = fixture()
  p.substate = substate
  p.timer = 1
  p.cargo = 200
  u.cargo = 2
  p.flags2 |= 0x40000000
  const trees = w.trees.length, nextId = w.nextId
  stepLivePhysics(w, u, p)
  assert.equal(p.cargo, 0)
  assert.equal(u.cargo, 0)
  assert.equal(w.trees.length, trees + 2)
  assert.equal(w.nextId, nextId + 2)
  assert.equal(p.stateObject, 1)
  stepLivePhysics(w, u, p)
  assert.equal(w.trees.length, trees + 2)
})

test('supplied state 19 retains its controller when interrupted within its goal and clears the bits afterward', () => {
  const { w, u, p } = fixture()
  p.flags2 |= 4
  stepLivePhysics(w, u, p)
  assert.equal(p.state, 19)
  assert.equal(p.stateObject, 1)
  assert.equal(p.flags2 & 0x2004, 0)
  assert.equal(p.substate, 5)
})

test('supplied detached resting owner acquires a real slot after physics without replacing the stale native alias', () => {
  const { w, u, p } = fixture()
  const stale = structuredClone(p)
  u.native = stale
  p.assignment = 1
  p.substate = 0
  p.slowTurn = 0
  stepLivePhysics(w, u, p)
  assert.equal(p.state, 19)
  assert.equal(p.stateObject, 1)
  assert.ok(p.anchorFlags & 15)
  assert.ok([2, 4].includes(p.substate))
  assert.equal(u.native, stale)
  assert.equal(stale.anchorFlags, 0)
  assert.equal(u.flight, p)
  registered(w, p)
})
