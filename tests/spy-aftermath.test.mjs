import test from 'node:test'
import assert from 'node:assert/strict'
import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import { addBuilding, addUnit, command, disguiseSelectedSpies, tick } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { stepLiveBuildingAttack } from '../app/live-building-combat.ts'
import { random } from '../app/native-math.ts'
function makeIgnitionBoundary() {
  const w = createStartedWorld()
  w.manaWorld.gameFlags = 32
  retainFixtureUnits(w, u => u.kind === 'shaman')
  w.terrain.fill(3)
  w.terrainVersion++
  const school = addBuilding(w, 'blue', 'spyHut', { x: -2, z: 32 }, true, {
      angle: (3 * Math.PI) / 2,
    }),
    brave = addUnit(w, 'blue', 'brave', { x: 7, z: 33 })
  const until = (label, test, limit = 2000) => {
    for (let i = 0; i < limit && !test(); i++) tick(w, 1 / 12)
    assert.ok(test(), `${label} at ${w.turn}`)
  }
  w.selected = [brave.id]
  assert.ok(command(w, school))
  until('admitted', () => brave.inside === school.id && !brave.entry?.person.speed)
  w.manaWorld.gameFlags = 0
  school.timer = 65535
  until('trained', () => w.units.some(u => u.team === 'blue' && u.kind === 'spy'))
  const spy = w.units.find(u => u.team === 'blue' && u.kind === 'spy')
  until('departed', () => spy.path.length === 0)
  w.selected = [spy.id]
  assert.ok(disguiseSelectedSpies(w, 1))
  tick(w, 1 / 12)
  until('disguised', () => spy.native.disguise === 0x40)
  const target = addBuilding(w, 'red', 'hut', { x: 20, z: 40 }, true)
  w.selected = [spy.id]
  assert.ok(command(w, target))
  assert.equal(currentPersonOrder(w.buildingOrders, spy.native).model, 15)
  const phases = new Map()
  until(
    'phase3 final visit',
    () => {
      const phase = spy.native.substate
      if ([1, 2].includes(phase) && !phases.has(phase)) phases.set(phase, structuredClone(w))
      return phase === 3 && spy.native.timer === 1
    },
    600
  )
  return { w, phases, spyId: spy.id, targetId: target.id }
}
const baseline = makeIgnitionBoundary()
const setup = phase => {
  const w = structuredClone(phase === undefined ? baseline.w : baseline.phases.get(phase))
  return {
    w,
    spy: w.units.find(u => u.id === baseline.spyId),
    target: w.buildings.find(b => b.id === baseline.targetId),
  }
}

// Supplied school, terrain, population and funding; training/disguise/command15
// and phase arrival use real public producers. This is not a campaign route.
test('trained Spy ignition arms aftermath without revealing until the next visit', () => {
  const { w, spy, target } = setup(),
    p = spy.native,
    order = currentPersonOrder(w.buildingOrders, p)
  w.campaignAIs[1].attributes[40] = 100
  stepLiveBuildingAttack(w, spy)
  assert.ok(target.burn)
  assert.equal(p.substate, 4)
  assert.equal(p.timer, 0)
  assert.ok(p.flags2 & 0x40000000)
  assert.equal(p.disguise, 0x40)
  const expected = { randomState: w.randomState }
  random(expected)
  stepLiveBuildingAttack(w, spy)
  assert.equal(w.randomState, expected.randomState)
  assert.equal(p.timer, 23)
  assert.equal(p.flags2 & 0x40000000, 0)
  assert.equal(p.disguise, 0)
  assert.equal(currentPersonOrder(w.buildingOrders, p), order)
  const after = w.randomState
  stepLiveBuildingAttack(w, spy)
  assert.equal(w.randomState, after)
  assert.equal(p.timer, 22)
})
for (const playerType of [1, 2])
  for (const suppress of [false, true])
    for (const detector of [false, true]) {
      test(`aftermath draw ownership type${playerType} bit8=${suppress} nearby=${detector}`, () => {
        const { w, spy } = setup(),
          p = spy.native
        // Boundary controls only: same real trained Spy and owned command15.
        w.manaTribes[0].playerType = playerType
        w.campaignAIs[1].attributes[40] = 100
        if (suppress) w.land.landFlags |= 8
        if (detector) addUnit(w, 'red', 'brave', { x: spy.x, z: spy.z })
        stepLiveBuildingAttack(w, spy)
        assert.equal(p.disguise, 0x40, 'phase3 does not run proximity detection')
        const expected = { randomState: w.randomState }
        if (playerType !== 1) random(expected)
        stepLiveBuildingAttack(w, spy)
        assert.equal(w.randomState, expected.randomState)
        assert.equal(p.disguise, playerType !== 1 && !suppress ? 0 : 0x40)
        const after = w.randomState
        stepLiveBuildingAttack(w, spy)
        assert.equal(w.randomState, after)
      })
    }

const { migrateCheckpoint } = await import('../app/game-store.ts')
for (const pending of [true, false])
  test(`checkpoint ${pending ? 'before' : 'after'} aftermath entry preserves one-shot discovery`, () => {
    const { w, spy } = setup()
    w.campaignAIs[1].attributes[40] = 100
    stepLiveBuildingAttack(w, spy)
    if (!pending) stepLiveBuildingAttack(w, spy)
    const loaded = migrateCheckpoint(structuredClone(w)),
      restored = loaded.units.find(u => u.id === spy.id)
    for (let i = 0; i < 5; i++) {
      stepLiveBuildingAttack(w, spy)
      stepLiveBuildingAttack(loaded, restored)
      assert.equal(loaded.randomState, w.randomState)
      assert.deepEqual(
        [
          restored.native.substate,
          restored.native.timer,
          restored.native.disguise,
          restored.native.flags2,
        ],
        [spy.native.substate, spy.native.timer, spy.native.disguise, spy.native.flags2]
      )
    }
  })

test('legacy phase4 checkpoint without entry ownership never replays its earlier discovery', () => {
  const { w, spy } = setup()
  stepLiveBuildingAttack(w, spy)
  // Old saves serialized phase4/timer24 after the former ignition-time roll.
  spy.native.flags2 &= ~0x40000000
  spy.native.timer = 24
  const loaded = migrateCheckpoint(structuredClone(w)),
    restored = loaded.units.find(u => u.id === spy.id),
    rng = loaded.randomState,
    disguise = restored.native.disguise
  loaded.campaignAIs[1].attributes[40] = 100
  for (let i = 0; i < 23; i++) {
    stepLiveBuildingAttack(loaded, restored)
    assert.equal(loaded.randomState, rng)
    assert.equal(restored.native.disguise, disguise)
  }
  assert.equal(restored.native.timer, 1)
})

test('zero discovery chance still draws once and target removal aborts before entry', () => {
  const { w, spy, target } = setup()
  w.campaignAIs[1].attributes[40] = 0
  stepLiveBuildingAttack(w, spy)
  const expected = { randomState: w.randomState }
  random(expected)
  stepLiveBuildingAttack(w, spy)
  assert.equal(w.randomState, expected.randomState)
  assert.equal(spy.native.disguise, 0x40)
  const other = setup()
  stepLiveBuildingAttack(other.w, other.spy)
  other.w.buildings = other.w.buildings.filter(b => b.id !== other.target.id)
  const order = currentPersonOrder(other.w.buildingOrders, other.spy.native)
  stepLiveBuildingAttack(other.w, other.spy)
  assert.notEqual(currentPersonOrder(other.w.buildingOrders, other.spy.native), order)
  assert.equal(other.spy.native?.disguise, 0x40)
})

for (const phase of [1, 2])
  test(`existing phase${phase} proximity detection still reveals a nearby target-tribe Spy`, () => {
    const { w, spy } = setup(phase)
    assert.equal(spy.native.disguise, 0x40)
    addUnit(w, 'red', 'brave', { x: spy.x, z: spy.z })
    stepLiveBuildingAttack(w, spy)
    assert.equal(spy.native.disguise, 0)
  })
