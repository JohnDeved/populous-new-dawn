import assert from 'node:assert/strict'
import test from 'node:test'
import { addUnit, command, cast, tick, unitAnimationSource } from '../app/model.ts'
import { finishLevelStart, retainFixtureUnits } from './level-start-fixture.mjs'
import { withStorage } from './support/profile-storage.mjs'
import { objectsInCell } from '../app/object-cells.ts'

function suppliedRestingFollower(w) {
  // Supplied flat terrain and actors isolate the production caller. This is
  // neither an authored campaign run nor actual-browser persistence evidence.
  finishLevelStart(w)
  retainFixtureUnits(w, () => false)
  w.buildings = []; w.trees = []; w.shrines = []
  w.manaWorld.gameFlags = 32
  w.terrain.fill(3); w.terrainVersion++
  addUnit(w, 'blue', 'shaman', { x: -8, z: 8 })
  const follower = addUnit(w, 'blue', 'brave', { x: 0, z: 8 })
  w.selected = [follower.id]
  command(w, { x: 10, z: 8 })
  for (let i = 0; i < 200; i++) tick(w, 1 / 12)
  assert.equal(follower.native.state, 19, 'ordinary movement finishes in native rest')
  assert.ok(follower.native.assignment & 1)
  assert.equal(follower.native.anchorFlags, 17, 'one actual follower owns slot 1 of a one-person ring')
  return follower
}

function assertRegistered(w, u, p) {
  assert.equal(w.objectCells.objects.get(u.id), p, 'cell registry retains the actual person')
  const cell = ((p.x >>> 8) & 254) | (p.y & 0xfe00)
  assert.equal([...objectsInCell(w.objectCells, cell)].filter(other => other.id === u.id).length, 1)
  assert.equal(unitAnimationSource(u), p, 'presentation uses the same owner')
}

function launch(w, u) {
  const p = u.native
  assert.ok(cast(w, 'blast', { x: u.x - 3, z: u.z }), 'public Blast cast succeeds')
  for (let i = 0; !u.flight && i < 60; i++) tick(w, 1 / 12)
  assert.equal(u.flight, p, 'Blast launches the retained resting person')
  assert.equal(u.native, p)
  assert.equal(p.state, 19, 'launch handoff preserves the resting controller')
  assertRegistered(w, u, p)
  return p
}

function stepAirborne(w, u, p) {
  const before = { counter: p.counter, state: p.state, stateObject: p.stateObject }
  tick(w, 1 / 12)
  assert.equal(p.counter, (before.counter + 1) & 255, 'exactly one person preparation visit per turn')
  if (before.state === 19 && p.state === 19) {
    assert.equal(p.stateObject, (before.stateObject + 1) & 65535, 'exactly one resting controller visit after physics')
    assert.ok(p.assignment & 1)
    assert.equal(p.anchorFlags, 17, 'the existing ring slot remains coherent')
  }
  if (u.flight) {
    assert.equal(u.flight, p)
    assert.equal(u.native, p)
    assertRegistered(w, u, p)
  }
}

test('public Blast visits retained rest once per airborne turn and Save/Load preserves the continuation', async t => {
  await withStorage({}, async ({ freshStore }) => {
    const store = await freshStore(), w = store.getWorld()
    const u = suppliedRestingFollower(w), p = launch(w, u)
    stepAirborne(w, u, p)
    assert.equal(p.state, 19, 'the regression observes a genuine airborne resting visit')
    assert.ok(u.flight)
    assert.equal(await store.saveCheckpoint(), true)
    const twinStore = await freshStore()
    assert.equal(await twinStore.restoreCheckpoint(), true)
    assert.equal(twinStore.loadCheckpoint(), true)
    const twin = twinStore.getWorld(), twinUnit = twin.units.find(other => other.id === u.id)
    const twinPerson = twinUnit.native
    assert.notEqual(twinPerson, p)
    assert.equal(twinUnit.flight, twinPerson, 'restored flight/native alias is preserved')
    assertRegistered(twin, twinUnit, twinPerson)
    assert.deepEqual(twinPerson, p)
    let airborneVisits = 0
    while (u.flight && airborneVisits < 100) {
      stepAirborne(w, u, p)
      stepAirborne(twin, twinUnit, twinPerson)
      assert.deepEqual(twin.units, w.units)
      assert.deepEqual(twin.objectCells, w.objectCells)
      assert.equal(twin.randomState, w.randomState)
      assert.deepEqual(twin.cosmeticRandom, w.cosmeticRandom)
      airborneVisits++
    }
    assert.ok(airborneVisits > 0 && airborneVisits < 100, 'natural physics reaches landing without injected progression')
    assert.equal(u.flight, undefined)
    assert.equal(twinUnit.flight, undefined)
    // Existing landing policy returns this unqueued person to the legacy owner.
    // Record that boundary rather than broadening native ownership in this fix.
    assert.equal(p.state, 10)
    assert.equal(u.native, null)
    assert.equal(twinUnit.native, null)
    assert.equal(w.objectCells.objects.has(u.id), false, 'landing removes the released native record')
    assert.equal(twin.objectCells.objects.has(u.id), false)
    const landingCell = ((p.x >>> 8) & 254) | (p.y & 0xfe00)
    assert.equal([...objectsInCell(w.objectCells, landingCell)].filter(other => other === p).length, 0)
    t.diagnostic(`Natural landing after ${airborneVisits + 1} post-launch turns: state ${p.state}, flight cleared, native null, former owner removed from cell registry`)
    for (let i = 0; i < 20; i++) {
      tick(w, 1 / 12); tick(twin, 1 / 12)
      assert.deepEqual(twin.units, w.units)
      assert.equal(twin.randomState, w.randomState)
    }
  })
})
