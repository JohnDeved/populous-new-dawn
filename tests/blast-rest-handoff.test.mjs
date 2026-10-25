import assert from 'node:assert/strict'
import test from 'node:test'
import { addUnit, command, cast, tick, unitAnimationSource } from '../app/model.ts'
import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import { objectsInCell } from '../app/object-cells.ts'
import { createBlastWave } from '../app/blast-wave.ts'
import { stepLiveBlastWave } from '../app/spell-effects-runtime.ts'

function suppliedRestingFollower(w) {
  // Supplied flat terrain and actors isolate the production caller. This is
  // neither an authored campaign run nor actual-browser persistence evidence.
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

test('public Blast launch preserves the actual resting owner and ring assignment', () => {
  const w = createStartedWorld(), u = suppliedRestingFollower(w), before = u.native
  const slot = [before.formationCell, before.anchorFlags]
  const p = launch(w, u)
  assert.equal(p, before)
  assert.ok(p.assignment & 1)
  assert.deepEqual([p.formationCell, p.anchorFlags], slot)
  assert.ok(p.flags2 & 0x80000, 'the public spell actually launches the person')
})

for (const state of [1, 17, 19, 10]) {
  test(`supplied state ${state} Blast handoff preserves its person while clearing browser tasks`, () => {
    const w = createStartedWorld(), u = suppliedRestingFollower(w), p = u.native
    // Explicit supplied boundary states isolate release cleanup. They are not
    // evidence that public commands produced state 1 or 17 at spell impact.
    p.state = state
    u.work = 999; u.target = { x: 4, z: 4 }; u.path = [{ x: 4, z: 4 }]
    const before = { assignment: p.assignment, anchorFlags: p.anchorFlags,
      formationCell: p.formationCell, stateObject: p.stateObject, counter: p.counter }
    const wave = createBlastWave(p, 0)
    wave.remaining = 1
    stepLiveBlastWave(w, wave)
    assert.equal(u.flight, p)
    assert.equal(u.native, p)
    assert.equal(p.state, state)
    assert.equal(p.counter, before.counter, 'handoff does not run person preparation')
    assert.equal(p.stateObject, before.stateObject, 'handoff does not run the resting controller')
    if (state !== 10) {
      assert.equal(p.assignment, before.assignment)
      assert.equal(p.anchorFlags, before.anchorFlags)
      assert.equal(p.formationCell, before.formationCell)
    }
    assert.equal(u.work, null)
    assert.equal(u.target, null)
    assert.deepEqual(u.path, [])
    assertRegistered(w, u, p)
  })
}

test('supplied panic Blast still transitions the resting owner and clears browser tasks', () => {
  const w = createStartedWorld(), u = suppliedRestingFollower(w), p = u.native
  u.work = 999; u.path = [{ x: 4, z: 4 }]
  const wave = createBlastWave(p, 0)
  wave.remaining = 1
  wave.panic = true
  stepLiveBlastWave(w, wave)
  assert.equal(u.native, p)
  assert.equal(u.flight, p)
  assert.equal(p.state, 26)
  assert.equal(p.timer, 64)
  assert.equal(u.work, null)
  assert.deepEqual(u.path, [])
  assertRegistered(w, u, p)
})
