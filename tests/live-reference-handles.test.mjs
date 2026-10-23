import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, addUnit, command, tick, guardShaman } from '../app/model.ts'
import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import { currentPersonOrder, emptyPersonOrder, writePersonOrder } from '../app/person-orders.ts'
import { writeLivePersonOrder } from '../app/live-person-order.ts'
import { createComputerQueue, requestPreacherTask } from '../app/computer.ts'
import { requestDefenseTask } from '../app/computer-defense.ts'
import { createTimberSearches, refreshTimberSearch } from '../app/timber-search.ts'
import { advanceGame } from '../app/game-clock.ts'
import { cleanBattles } from '../app/combat-runtime.ts'

for (const id of [32768, 65536, 287375]) {
  test(`live reference payload ${id} preserves only proven object commands`, () => {
    for (let model = 0; model <= 33; model++) {
      const native = emptyPersonOrder(),
        live = emptyPersonOrder()
      writePersonOrder(native, model, id, 0x12345, 0x123)
      writeLivePersonOrder(live, model, id, 0x12345, 0x123)
      if ([22, 27, 28, 30].includes(model)) {
        assert.equal(live.a, id)
        assert.equal(native.a, id & 65535)
        live.a = native.a
      }
      assert.deepEqual(live, native)
    }
  })

  test(`public attack and real melee cleanup retain high identity ${id}`, () => {
    const w = createStartedWorld(),
      clock = { animationTime: 0, animationFrame: 0 }
    retainFixtureUnits(w, () => false)
    w.buildings = []
    w.shrines = []
    w.fights = []
    w.terrain.fill(3)
    w.terrainVersion++
    w.manaWorld.gameFlags |= 64
    w.nextId = id
    const red = addUnit(w, 'red', 'warrior', { x: 10, z: 0 })
    const blue = addUnit(w, 'blue', 'warrior', { x: 1, z: 0 })
    for (let n = 0; n < 40; n++) advanceGame(w, clock, 1 / 12)
    w.selected = [blue.id]
    assert.ok(command(w, red, { ctrlKey: true }))
    assert.equal(currentPersonOrder(w.buildingOrders, blue.native ?? blue.fight?.motion)?.a, red.id)
    for (let n = 0; n < 600 && !w.fights.some(b => !b.encounter); n++) advanceGame(w, clock, 1 / 12)
    const group = w.fights.find(b => !b.encounter)
    assert.ok(group, 'ordinary encounter produces a persistent melee group')
    assert.ok(group.id > id)
    assert.equal(blue.fight.motion.workFlags, group.id)
    assert.equal(red.fight.motion.workFlags, group.id)
    const before = [...group.members]
    cleanBattles(w)
    assert.deepEqual(group.members, before)
    assert.ok(before.includes(blue.id) && before.includes(red.id))
    const twin = structuredClone(w)
    for (let n = 0; n < 16; n++) {
      tick(w, 1 / 12)
      tick(twin, 1 / 12)
      assert.deepEqual(twin, w)
    }
  })

  test(`public guard resolves exact high Shaman ${id}`, () => {
    const w = createStartedWorld(1)
    retainFixtureUnits(w, () => false)
    w.buildings = []
    w.trees = []
    w.shrines = []
    w.terrain.fill(3)
    w.terrainVersion++
    w.manaWorld.gameFlags = 32
    w.nextId = id
    const shaman = addUnit(w, 'blue', 'shaman', { x: 0, z: 8 })
    const u = addUnit(w, 'blue', 'warrior', { x: 2, z: 8 })
    for (let i = 0; i < 40; i++) tick(w, 1 / 12)
    w.selected = [u.id]
    guardShaman(w)
    assert.equal(currentPersonOrder(w.buildingOrders, u.native).a, shaman.id)
    tick(w, 1 / 12)
    assert.equal(u.native.target, shaman.id)
    assert.equal(u.native.commandStatus, 30)
  })
}

test('AI and timber leaf adapters preserve native words and live exact references', () => {
  const id = 287375,
    identity = value => value
  for (const decoder of [undefined, identity]) {
    const expected = decoder ? id : id & 65535
    const priests = createComputerQueue()
    assert.ok(requestPreacherTask(priests, id, 0x12345, 0x800, 1, decoder))
    assert.equal(priests.tasks[0].entity, expected)
    assert.equal(priests.tasks[0].target, 0x2345)
    const defense = createComputerQueue()
    assert.ok(
      requestDefenseTask(
        defense,
        256,
        1,
        id,
        0x12345,
        () => ({
          total: 1,
          requiredBraves: 0,
          requiredWarriors: 1,
          requiredFirewarriors: 0,
          requiredPreachers: 0,
        }),
        decoder
      )
    )
    assert.equal(defense.tasks[0].entity, expected)
    assert.equal(defense.tasks[0].target, 0x2345)
    const searches = createTimberSearches(),
      owner = { searchIndex: -1 }
    const index = refreshTimberSearch(searches, owner, 0x1234, 0x12345, { id, tribe: 0 }, decoder)
    assert.equal(searches.records[index].person, expected)
    assert.equal(searches.records[index].angle, 0x2345)
  }
})

test('public boarding resolves a high vehicle handle without its low-word alias', async () => {
  const { browserPosition } = await import('../app/model.ts')
  const w = createStartedWorld(22)
  const shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  const vehicle = w.vehicles.find(v => v.model === 1)
  // Supplied identity boundary on the authored reachable craft, not acquisition evidence.
  vehicle.id = 287375
  w.nextId = Math.max(w.nextId, vehicle.id + 1)
  w.selected = [shaman.id]
  assert.ok(command(w, { ...browserPosition(vehicle), id: vehicle.id }))
  assert.equal(currentPersonOrder(w.buildingOrders, shaman.native).a, vehicle.id)
  tick(w, 1 / 12)
  assert.equal(shaman.native.target, vehicle.id)
})

test('historical Angel reconstruction and worship producer retain the allocated high shrine handle', async () => {
  const { normalizeHistoricalFixture } = await import('./helpers/historical-checkpoint.ts')
  const { worshipOrder } = await import('../app/live-worship.ts')
  const w = createWorld(5)
  w.shrines = w.shrines.filter(s => s.kind !== 'angel')
  w.nextId = 287375
  const migrated = normalizeHistoricalFixture(w)
  const shrine = migrated.shrines.find(s => s.kind === 'angel')
  assert.equal(shrine.id, 287375)
  const slot = worshipOrder(migrated, shrine)
  assert.equal(migrated.buildingOrders.records[slot].a, shrine.id)
})

test('high Balloon driver target equality does not alias at a word boundary', async () => {
  const { browserPosition } = await import('../app/model.ts')
  const { createLivePerson, registerLivePerson } = await import('../app/live-people.ts')
  const { boardLiveVehicle, selectLiveVehicleDrivers } = await import('../app/live-vehicles.ts')
  const { allocatePersonOrder, attachPersonOrder } = await import('../app/person-orders.ts')
  for (const targetOffset of [0, 65536]) {
    const w = createWorld(22),
      v = w.vehicles.find(v => v.model === 3)
    v.id = 287375
    const people = []
    for (let i = 0; i < 2; i++) {
      const u = addUnit(w, 'blue', 'brave', browserPosition(v))
      const p = (u.native = createLivePerson(w, u))
      registerLivePerson(w, p)
      w.pathfinding.people.set(p.id, p)
      assert.ok(boardLiveVehicle(w, p, v))
      const slot = allocatePersonOrder(w.buildingOrders)
      Object.assign(w.buildingOrders.records[slot], { model: i ? 3 : 22, flags: 128 })
      const fail = () => assert.fail('supplied empty command owner needs no cleanup')
      attachPersonOrder(w.buildingOrders, p, slot, 0, {
        prepare: fail,
        stopWork: fail,
        releaseSpell: fail,
        deleteObject: fail,
        releaseFight: fail,
      })
      p.commandStatus = i ? 3 : 22
      p.target = v.id + targetOffset
      people.push(p)
    }
    selectLiveVehicleDrivers(w)
    assert.equal(v.passengers[0], people[targetOffset ? 0 : 1].id)
  }
})
