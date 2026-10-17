import test from 'node:test'
import assert from 'node:assert/strict'
import { createWorld, addUnit, browserPosition, tick } from '../app/model.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { boardLiveVehicle, syncLiveVehiclePassengers } from '../app/live-vehicles.ts'
import { allocatePersonOrder, attachPersonOrder } from '../app/person-orders.ts'
import { migrateCheckpoint } from '../app/game-store.ts'

// Supplied source-valid terminal-state reconstruction of the retained historical
// +71 failure. This is not another ordinary acquisition or a native clock claim.
test('lagging Balloon passenger becomes driver and returns to both retained shared waypoints', () => {
  const w = createWorld(22),
    v = w.vehicles.find(v => v.model === 3),
    members = []
  Object.assign(v, { x: 18901, y: -32683, h: 560, heading: 1.7134667764498108, speed: 32 })
  for (const kind of ['shaman', 'brave']) {
    const u = addUnit(w, 'blue', kind, browserPosition(v)),
      p = (u.native = createLivePerson(w, u))
    registerLivePerson(w, p)
    w.pathfinding.people.set(p.id, p)
    assert.ok(boardLiveVehicle(w, p, v))
    members.push(u)
  }
  const [driver, passenger] = members.map(u => u.native)
  Object.assign(driver, {
    state: 30,
    counter: 24,
    goalX: 19050,
    goalY: 32874,
    destinationX: 19050,
    destinationY: 32874,
    turnAngle: 19050,
    turnY: 32874,
    anchorX: 19200,
    anchorY: 33024,
    flags2: 0x40025000,
    flags3: 0x40800,
    flags4: 0x2a000100,
    speed: 0,
  })
  Object.assign(passenger, {
    state: 10,
    counter: 95,
    goalX: 16256,
    goalY: 32640,
    destinationX: 16256,
    destinationY: 32640,
    turnAngle: 16256,
    turnY: 32640,
    anchorX: 17606,
    anchorY: 31623,
    flags2: 0x42025200,
    flags3: 0x40000,
    flags4: 0x2a000100,
    commandStatus: 3,
    speed: 79,
  })
  const unused = () => assert.fail('empty slot attachment has no release side effects'),
    effects = {
      prepare: unused,
      stopWork: unused,
      releaseSpell: unused,
      deleteObject: unused,
      releaseFight: unused,
    }
  const ids = [
    [16256, 32640],
    [19050, 32874],
  ].map(([a, b], slot) => {
    const id = allocatePersonOrder(w.buildingOrders)
    Object.assign(w.buildingOrders.records[id], { model: 3, flags: 128, a, b })
    attachPersonOrder(w.buildingOrders, passenger, id, slot, effects)
    return id
  })
  syncLiveVehiclePassengers(w, v)
  assert.ok(Math.abs(v.x - 16256) >= 353)
  assert.equal(driver.commands.filter(Boolean).length, 0)
  assert.deepEqual(
    ids.map(id => w.buildingOrders.records[id].references),
    [1, 1]
  )
  const restored = migrateCheckpoint(structuredClone(w)),
    comparable = world => {
      const copy = structuredClone(world)
      for (const [index, id] of [
        [0, 102],
        [2, 120],
      ]) {
        assert.equal(copy.shrines[index].id, id)
        if (copy.shrines[index].reward === undefined) copy.shrines[index].reward = 'mana'
      }
      return copy
    }
  assert.deepEqual(
    w.shrines.flatMap((head, index) =>
      head.reward !== restored.shrines[index].reward ? [index] : []
    ),
    [0, 2]
  )
  assert.deepEqual(comparable(restored), comparable(w))
  let first = 0,
    last = 0
  for (let n = 1; n <= 200; n++) {
    tick(w, 1 / 12)
    tick(restored, 1 / 12)
    assert.deepEqual(comparable(restored), comparable(w))
    assert.deepEqual(v.passengers, [passenger.id, driver.id])
    for (const [i, u] of members.entries()) {
      assert.equal(u.native, [driver, passenger][i])
      assert.equal(w.objectCells.objects.get(u.id), u.native)
      assert.equal(u.native.vehicle, v.id)
    }
    if (!first && !w.buildingOrders.records[ids[0]].references) first = n
    if (!last && !w.buildingOrders.records[ids[1]].references) last = n
  }
  assert.deepEqual([first, last], [77, 153])
  assert.deepEqual(
    ids.map(id => w.buildingOrders.records[id].references),
    [0, 0]
  )
  assert.equal(passenger.commands.filter(Boolean).length, 0)
  assert.equal(passenger.state, 30)
})
