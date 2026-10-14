import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { deserialize } from 'node:v8'
import { createHash } from 'node:crypto'
import {
  resumeLiveSeatedFlight,
  stepLivePhysics,
  createLivePerson,
  registerLivePerson,
} from '../app/live-people.ts'
import { tick, selectUnit, command, createWorld, addUnit, browserPosition } from '../app/model.ts'
import { boardLiveVehicle } from '../app/live-vehicles.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { withStorage } from './support/profile-storage.mjs'

// Historical ordinary browser checkpoint, not a native oracle fixture.
const checkpoint = () => {
  const bytes = gunzipSync(
    readFileSync(
      new URL('../references/fixtures/m10-seated-flight/m10-seated-flight.v8.gz', import.meta.url)
    )
  )
  assert.equal(
    createHash('sha256').update(bytes).digest('hex'),
    'eaeb004ddea177dbec826dfbde0527832f8509e317d1997970f56fc56c88d0a1'
  )
  const w = deserialize(bytes)
  assert.equal(w.turn, 1066)
  return w
}
const shaman = w => w.units.find(u => u.id === 63)

test('historical ordinary reboarding retires flight without replacing native owner or cancelling routes', () => {
  const w = checkpoint(),
    u = shaman(w),
    p = u.native
  assert.equal(u.flight, p)
  const before = structuredClone(p),
    routes = structuredClone(w.motionRoutes),
    orders = structuredClone(w.buildingOrders)
  assert.equal(resumeLiveSeatedFlight(u), true)
  assert.equal(u.native, p)
  assert.equal(w.objectCells.objects.get(p.id), p)
  assert.equal(u.flight, undefined)
  assert.equal(u.lift, 0)
  assert.deepEqual(p, before)
  assert.deepEqual(w.motionRoutes, routes)
  assert.deepEqual(w.buildingOrders, orders)
})

test('unseated or separately owned flight remains with impulse physics', () => {
  for (const change of [
    p => (p.vehicle = 0),
    p => (p.state = 30),
    p => (p.flags2 &= ~0x4000),
    (_p, u) => (u.native = structuredClone(u.native)),
  ]) {
    const w = checkpoint(),
      u = shaman(w)
    change(u.native, u)
    const before = structuredClone(u)
    assert.equal(resumeLiveSeatedFlight(u), false)
    assert.deepEqual(u, before)
  }
})

test('seated impulse preparation precedes native airborne-bit cleanup', () => {
  const w = checkpoint(),
    u = shaman(w),
    p = u.native
  p.flags2 |= 0x82000
  p.motionTimer = 3
  p.motionMode = 2
  const falling = p.flags4 & 0x400,
    counter = p.counter
  assert.ok(resumeLiveSeatedFlight(u))
  assert.equal(p.flags2 & 0x82000, 0x82000)
  stepLivePhysics(w, u, p)
  assert.equal(p.flags2 & 0x82000, 0)
  assert.equal(p.flags4 & 0x400, falling)
  assert.equal(p.counter, (counter + 1) & 255)
  assert.equal(p.motionTimer, 0)
  assert.equal(p.motionMode, 0)
})

test('historical no-order passenger keeps its seat, health and single clock through public Save/Load twins', async () => {
  await withStorage({}, async ({ freshStore }) => {
    const store = await freshStore()
    store.startMission(10)
    const w = store.getWorld()
    Object.assign(w, migrateCheckpoint(checkpoint()))
    await store.saveCheckpoint()
    assert.ok(store.loadCheckpoint())
    const twin = store.getWorld(),
      u = shaman(w),
      p = u.native,
      before = p.counter
    const flags4 = p.flags4,
      seat = { x: p.x, y: p.y, h: p.h }
    assert.deepEqual(w, twin)
    for (let n = 1; n <= 16; n++) {
      tick(w, 1 / 12)
      tick(twin, 1 / 12)
      assert.deepEqual(w, twin)
      assert.equal(u.native, p)
      assert.equal(p.counter, (before + n) & 255)
      assert.equal(u.flight, undefined)
      assert.equal(u.lift, 0)
      assert.equal(p.vehicle, 62)
      assert.equal(p.flags4, flags4)
      assert.equal(u.hp, 100)
      assert.deepEqual({ x: p.x, y: p.y, h: p.h }, seat)
      assert.equal(currentPersonOrder(w.buildingOrders, p), undefined)
    }
  })
})

test('historical seated flight resumes a public movement order without losing a clock visit', () => {
  const w = checkpoint(),
    u = shaman(w),
    p = u.native
  selectUnit(w, u.id, false)
  assert.ok(command(w, { x: -17, z: 29 }))
  const order = currentPersonOrder(w.buildingOrders, p),
    counter = p.counter
  assert.equal(order.model, 3)
  for (let i = 1; i <= 4; i++) {
    tick(w, 1 / 12)
    assert.equal(p.counter, (counter + i) & 255)
  }
  assert.equal(u.native, p)
  assert.equal(u.flight, undefined)
  assert.equal(p.counter, (counter + 4) & 255)
  assert.ok(
    w.vehicles.find(v => v.id === 62).speed > 0,
    'driver controller must make progress within its native four-turn phase'
  )
  assert.equal(currentPersonOrder(w.buildingOrders, p), order)
})

// Supplied owner controls isolate both craft types; these are not acquisition evidence.
for (const model of [1, 3])
  for (const ordered of [false, true]) {
    test(`supplied model-${model} seated ${ordered ? 'ordered' : 'no-order'} control has one preparation/reaction visit per turn`, () => {
      const w = createWorld(22),
        v = w.vehicles.find(v => v.model === model)
      const u = addUnit(w, 'blue', 'brave', browserPosition(v)),
        p = (u.native = createLivePerson(w, u))
      registerLivePerson(w, p)
      w.pathfinding.people.set(p.id, p)
      assert.ok(boardLiveVehicle(w, p, v))
      p.state = 10
      p.flags4 |= 0x400
      u.flight = p
      u.lift = 1
      if (ordered) {
        selectUnit(w, u.id, false)
        assert.ok(command(w, { x: 55, z: 121 }))
      }
      p.flags4 |= 0x100000
      p.reactionTimer = 10
      p.reactionDuration = 20
      const start = p.counter,
        hp = u.hp
      for (let n = 1; n <= 8; n++) {
        tick(w, 1 / 12)
        assert.equal(p.counter, (start + n) & 255)
        assert.equal(u.native, p)
        assert.equal(u.flight, undefined)
        assert.equal(u.lift, 0)
        assert.equal(p.vehicle, v.id)
        assert.equal(u.hp, hp)
        assert.ok(p.flags4 & 0x400)
        assert.deepEqual(v.passengers, [u.id])
        assert.equal(p.reactionDuration, 20 - n)
        if (!ordered) assert.equal(currentPersonOrder(w.buildingOrders, p), undefined)
        else assert.equal(currentPersonOrder(w.buildingOrders, p)?.model, 3)
      }
    })
  }
