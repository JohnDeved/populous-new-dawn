import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorldState, addUnit } from '../app/world-state.ts'
import { createLivePerson, registerLivePerson, stepLiveImpulse } from '../app/live-people.ts'
import { notifyHeightChanges } from '../app/world-terrain-runtime.ts'
import { objectsInCell } from '../app/object-cells.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

// Supplied positive-HP airborne/resting branch controls, not a natural campaign
// reproduction. The notification producer and physical-owner consumer are real.
function fixture(alias = 'null') {
  const w = createWorldState(1)
  Object.assign(w, { units: [], buildings: [], trees: [], effects: [] })
  w.manaWorld.gameFlags = 32
  w.land.heights.fill(1000)
  w.land.flags.fill(0)
  w.land.categories.fill(0)
  for (const mask of w.land.walkMasks) mask.fill(255)
  const u = addUnit(w, 'blue', 'brave', { x: 10, z: 10 })
  const p = createLivePerson(w, u)
  Object.assign(p, { state: 19, previousState: 1, substate: 5, h: 3000,
    counter: 9, timer: 20, flags2: 0x80000, flags4: p.flags4 | 0x100400,
    reactionTimer: 10, reactionDuration: 20, slowTurn: 10,
    goalX: (p.x + 2048) & 65535, goalY: p.y,
    anchorX: p.x, anchorY: p.y, velocity: { x: 40, y: 20, z: -30 } })
  u.native = alias === 'shared' ? p : alias === 'stale' ? structuredClone(p) : null
  u.flight = p
  registerLivePerson(w, p)
  assert.ok(u.hp > 0)
  return { w, u, p, cell: ((p.x >>> 8) & 254) | (p.y & 0xfe00) }
}
function registered(w, p) {
  assert.equal(w.objectCells.objects.get(p.id), p)
  const cell = ((p.x >>> 8) & 254) | (p.y & 0xfe00)
  assert.equal([...objectsInCell(w.objectCells, cell)].filter(other => other.id === p.id).length, 1)
}

for (const alias of ['null', 'stale', 'shared']) {
  test(`height notification reaches ${alias} native alias's registered flight owner before one physical visit`, () => {
    const { w, u, p, cell } = fixture(alias)
    const native = u.native, before = structuredClone(p)
    notifyHeightChanges(w, [{ cell, radius: 0 }, { cell, radius: 0 }])
    assert.equal(p.flags2 & 4, 4)
    assert.equal(p.state, 19, 'notification does not dispatch a controller')
    assert.equal(p.counter, before.counter)
    if (native) assert.equal(native.flags2 & 4, 4, 'existing native notification is preserved')
    stepLiveImpulse(w, u)
    assert.equal(p.state, 1, 'the outside-goal rest controller returns to previousState')
    assert.equal(p.previousState, 19)
    assert.ok(p.timer >= 50 && p.timer < 100, 'new wait state initializes without a second visit')
    assert.equal(p.counter, before.counter + 1)
    assert.equal(p.reactionTimer, 9)
    assert.equal(p.reactionDuration, 19)
    assert.deepEqual({ x: p.x, y: p.y, h: p.h }, {
      x: before.x + 38, y: before.y - 28, h: before.h + 20 - rules.personGravity[p.physics],
    })
    assert.equal(p.flags2 & 0x2004, 0)
    assert.equal(u.native, native)
    assert.equal(u.flight, p)
    registered(w, p)
    if (alias === 'stale') {
      assert.equal(native.state, 19)
      assert.equal(native.counter, before.counter)
      assert.equal(native.flags2 & 4, 4, 'the stale alias is not the physics consumer')
    }
    const timer = p.timer
    stepLiveImpulse(w, u)
    assert.equal(p.state, 1, 'consumed notification does not interrupt again')
    assert.equal(p.timer, timer - 1)
    assert.equal(p.counter, before.counter + 2)
    registered(w, p)
  })
}

for (const exclusion of ['outside-radius', 'inside-building', 'zero-hp']) {
  test(`height notification keeps existing ${exclusion} eligibility exclusion`, () => {
    const { w, u, p, cell } = fixture('stale')
    if (exclusion === 'inside-building') u.inside = 999
    if (exclusion === 'zero-hp') u.hp = 0
    notifyHeightChanges(w, [{ cell: exclusion === 'outside-radius' ? cell ^ 8 : cell, radius: 0 }])
    assert.equal(p.flags2 & 4, 0)
    assert.equal(u.native.flags2 & 4, 0)
    assert.equal(p.state, 19)
    registered(w, p)
  })
}

test('height notification preserves native and builder recipients without a flight owner', () => {
  const { w, u, p, cell } = fixture('shared')
  u.flight = undefined
  const builderPerson = structuredClone(p)
  u.builder = { person: builderPerson }
  notifyHeightChanges(w, [{ cell, radius: 0 }])
  assert.equal(p.flags2 & 4, 4)
  assert.equal(builderPerson.flags2 & 4, 4)
  assert.equal(u.flight, undefined)
  assert.equal(p.counter, 9)
})

test('height notification within the resting goal is consumed without leaving rest', () => {
  const { w, u, p, cell } = fixture()
  p.goalX = p.x
  notifyHeightChanges(w, [{ cell, radius: 0 }])
  assert.equal(p.flags2 & 4, 4)
  stepLiveImpulse(w, u)
  assert.equal(p.state, 19)
  assert.equal(p.stateObject, 1)
  assert.equal(p.counter, 10)
  assert.equal(p.flags2 & 0x2004, 0)
  registered(w, p)
})
