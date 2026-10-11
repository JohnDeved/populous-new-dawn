import assert from 'node:assert/strict'
import test from 'node:test'
import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import { addBuilding, addUnit, command, tick, maxHp, unitInvisibilityRenderFlag } from '../app/model.ts'
import { createLivePerson, stepLivePersonHealth } from '../app/live-people.ts'
import { startLiveCombatResponse } from '../app/live-building-combat.ts'
import { automaticMeleeTarget, allocateLiveCombatResponse } from '../app/live-combat.ts'
import { stepBuildingEntry } from '../app/live-building-entry.ts'
import { orderEffects } from '../app/live-movement.ts'
import { useLegacyPersonClock } from '../app/person-clock.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { makeSceneFixture } from './support/bloodlust-scene.mjs'

let base
function field() {
  if (!base) {
    base = createStartedWorld()
    retainFixtureUnits(base, () => false)
    base.buildings = []; base.fights = []; base.trees = []; base.shrines = []
    base.terrain.fill(3); base.terrainVersion++; tick(base, 1 / 6)
    base.land.categories.fill(0); base.land.flags.fill(0)
    base.land.buildingIds.fill(0); base.land.owners.fill(0)
  }
  return structuredClone(base)
}
function fighter(world, kind = 'warrior') {
  const unit = addUnit(world, 'blue', kind, { x: 0, z: 0 })
  unit.native = createLivePerson(world, unit)
  unit.native.state = 17; unit.native.flags3 &= ~0x800
  addUnit(world, 'red', 'shaman', { x: 1.75, z: 0 })
  return unit
}
function phase(world, unit, counter, turn) {
  world.turn = turn; unit.personCounter = counter
  if (unit.native) unit.native.counter = counter
  if (unit.entry) unit.entry.person.counter = counter
}
const unchangedClock = (w, u) => [w.personClock.next, u.personCounter]

// 004d4690 tests +2e & scanMask. Both adapters must consume the same byte;
// 004d4690 itself, unlike 004ec6f0, neither allocates nor increments a person.
for (const [counter, turn, expected] of [[4, 1, true], [5, 4, false]]) {
  test(`ordinary response actual caller uses retained phase ${counter}, not world ${turn}`, () => {
    const w = field(), u = fighter(w), p = u.native
    phase(w, u, counter, turn)
    const before = unchangedClock(w, u)
    assert.equal(startLiveCombatResponse(w, u), expected)
    assert.equal(u.native, p)
    assert.deepEqual(unchangedClock(w, u), before)
    assert.equal(p.counter, counter)
    assert.equal(w.buildingOrders.active, expected ? 1 : 0)
    if (expected) {
      assert.equal(w.buildingOrders.records[p.immediateCommand].model, 21)
      assert.equal(w.buildingOrders.records[p.immediateCommand].references, 1)
    }
  })
  test(`direct response allocator uses retained phase ${counter}, not world ${turn}`, () => {
    const w = field(), u = fighter(w), p = u.native
    phase(w, u, counter, turn)
    const before = unchangedClock(w, u)
    const id = allocateLiveCombatResponse(w, u, p, () => [p], orderEffects(w))
    assert.equal(!!id, expected)
    assert.deepEqual(unchangedClock(w, u), before)
    assert.equal(u.native, p)
  })
  test(`target query uses retained phase ${counter}, not world ${turn}`, () => {
    const w = field(), u = fighter(w), p = u.native, enemy = w.units.at(-1)
    phase(w, u, counter, turn)
    const before = unchangedClock(w, u)
    assert.equal(automaticMeleeTarget(w, u), expected ? enemy : undefined)
    assert.deepEqual(unchangedClock(w, u), before)
    assert.equal(u.native, p)
  })
}

test('pending scan bypasses phase and is consumed even when the level suppresses response', () => {
  for (const suppressed of [false, true]) {
    const w = field(), u = fighter(w), p = u.native
    phase(w, u, 5, 1); p.flags3 |= 0x800
    if (suppressed) w.levelFlags2 |= 0x2000000
    const before = unchangedClock(w, u)
    assert.equal(startLiveCombatResponse(w, u), !suppressed)
    assert.equal(p.flags3 & 0x800, 0)
    assert.deepEqual(unchangedClock(w, u), before)
    assert.equal(u.native, p)
  }
})

let occupiedTower
function tower() {
  if (!occupiedTower) {
    const w = createStartedWorld()
    w.inputMask = 0; w.manaWorld.gameFlags = 32
    retainFixtureUnits(w, u => u.kind === 'shaman')
    const b = addBuilding(w, 'blue', 'tower', { x: -2, z: 32 }, true)
    const u = addUnit(w, 'blue', 'firewarrior', { x: 7, z: 33 })
    w.selected = [u.id]; assert.equal(command(w, b), true)
    for (let i = 0; i < 300 && u.inside !== b.id; i++) tick(w, 1 / 12)
    assert.equal(u.inside, b.id, 'real command and entry must acquire the tower')
    assert.equal(u.entry.person.state, 21)
    occupiedTower = { w, id: u.id, building: b.id }
  }
  const { w, id, building } = structuredClone(occupiedTower)
  return { w, u: w.units.find(u => u.id === id), b: w.buildings.find(b => b.id === building) }
}
for (const [counter, turn, shots] of [[3, 1, 2], [4, 4, 0]]) {
  test(`real occupied tower visit scans advanced person ${counter + 1}, not global ${turn}`, () => {
    const { w, u, b } = tower(), p = u.entry.person
    const enemy = addUnit(w, 'red', 'brave', { x: u.x + 2, z: u.z })
    phase(w, u, counter, turn); p.flags3 &= ~0x800; u.cooldown = 0
    const next = w.personClock.next
    stepBuildingEntry(w, u, b)
    const fired = w.effects.filter(fx => fx.firewarriorShot)
    assert.equal(fired.length, shots)
    assert.ok(fired.every(fx => fx.firewarriorShot.target === enemy.id && fx.firewarriorShot.tower))
    assert.equal(u.personCounter, counter + 1)
    assert.equal(p.counter, counter + 1)
    assert.equal(u.entry.person, p)
    assert.equal(w.personClock.next, next)
    assert.equal(b.admission.inside, 1)
  })
}

// 004ec6f0 increments before 004d32b0 -> 0051fed0. Read the updated byte
// before the state body; no second visit and no world-phase substitution.
for (const [counter, turn, timer] of [[1, 0, 1], [2, 1, 2]]) {
  test(`ordinary tick reservation consumes advanced phase ${counter + 1} before the body`, () => {
    const w = field(), u = addUnit(w, 'blue', 'brave', { x: 0, z: 0 })
    u.native = createLivePerson(w, u); u.native.state = 14
    phase(w, u, counter, turn)
    u.attackReservation = { flags4: 0x100000, reactionTimer: 2, reactionDuration: 10 }
    const next = w.personClock.next
    tick(w, 1 / 12)
    assert.equal(u.attackReservation.reactionTimer, timer)
    assert.equal(u.attackReservation.reactionDuration, 9)
    assert.equal(u.personCounter, counter + 1)
    assert.equal(u.native.counter, counter + 1)
    assert.equal(w.personClock.next, next)
  })
}
test('inactive state has no primary visit and cannot age a person reservation', () => {
  const w = field(), u = addUnit(w, 'blue', 'brave', { x: 0, z: 0 })
  u.native = createLivePerson(w, u); u.native.state = 0
  phase(w, u, 1, 1)
  u.attackReservation = { flags4: 0x100000, reactionTimer: 2, reactionDuration: 10 }
  const before = structuredClone(u.attackReservation)
  tick(w, 1 / 12)
  assert.deepEqual(u.attackReservation, before)
  assert.equal(u.personCounter, 1)
})

test('legacy scanner and reservation keep their previous world phase', () => {
  for (const turn of [1, 4]) {
    const w = field(), u = fighter(w)
    useLegacyPersonClock(w, 'checkpoint')
    w.turn = turn; u.native.counter = turn === 1 ? 4 : 5
    assert.equal(startLiveCombatResponse(w, u), turn === 4)
    assert.equal(u.personCounter, undefined)
  }
  const w = field(), u = addUnit(w, 'blue', 'brave', { x: 0, z: 0 })
  u.native = createLivePerson(w, u); u.native.state = 14
  useLegacyPersonClock(w, 'checkpoint'); w.turn = 1; u.native.counter = 3
  u.attackReservation = { flags4: 0x100000, reactionTimer: 2, reactionDuration: 10 }
  tick(w, 1 / 12)
  assert.equal(u.attackReservation.reactionTimer, 1)
  assert.equal(u.personCounter, undefined)
})

test('saved Unit phase controls real Bloodlust renderer without simulation or other clock changes', async () => {
  const original = field(), source = addUnit(original, 'blue', 'brave', { x: 0, z: 0 })
  source.native = createLivePerson(original, source); source.native.state = 17
  source.bloodlust = 120; source.shield = 8; source.invisibility = 8
  const w = migrateCheckpoint(structuredClone(original)), u = w.units.find(u => u.id === source.id)
  const fixture = await makeSceneFixture(w)
  try {
    for (const [counter, turn, remaining, visible] of [[2, 0, 120, false], [0, 2, 120, true], [2, 2, 128, true], [0, 0, 0, false]]) {
      phase(w, u, counter, turn); u.bloodlust = remaining
      const before = structuredClone(w)
      fixture.render()
      assert.equal(fixture.scene.unitMeshes.get(u.id).userData.bloodlust.visible, visible)
      assert.equal(fixture.scene.unitMeshes.get(u.id).userData.shield.visible, true)
      assert.equal(unitInvisibilityRenderFlag(w, u), turn & 1 ? 0x4000 : 0)
      assert.deepEqual(w, before, 'rendering consumes no visit, RNG, duration or allocation')
    }
    useLegacyPersonClock(w, 'checkpoint'); u.bloodlust = 120; u.native.counter = 0; w.turn = 2
    fixture.render()
    assert.equal(fixture.scene.unitMeshes.get(u.id).userData.bloodlust.visible, false)
    w.turn = 0; u.native.counter = 2; fixture.render()
    assert.equal(fixture.scene.unitMeshes.get(u.id).userData.bloodlust.visible, true)
  } finally { fixture.close() }
})

test('global health and invisibility clocks stay independent of retained allocation phase', () => {
  const w = field(), u = addUnit(w, 'blue', 'brave', { x: 0, z: 0 })
  u.native = createLivePerson(w, u); u.native.state = 17; u.invisibility = 8
  phase(w, u, 3, 8); u.hp = maxHp(u.kind) - 2
  const next = unchangedClock(w, u), before = u.hp
  stepLivePersonHealth(w)
  assert.equal(u.hp, before + 4 / 20)
  assert.equal(unitInvisibilityRenderFlag(w, u), 0)
  w.turn = 9; u.personCounter = 8; u.native.counter = 8
  const health = u.hp
  stepLivePersonHealth(w)
  assert.equal(u.hp, health)
  assert.equal(unitInvisibilityRenderFlag(w, u), 0x4000)
  assert.equal(w.personClock.next, next[0])
  assert.equal(u.personCounter, 8)
})
