import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { deserialize } from 'node:v8'
import { createHash } from 'node:crypto'
import { tick, browserPosition } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { withStorage } from './support/profile-storage.mjs'

const ids = [63, 111, 112, 113, 114]
const checkpoint = () => {
  const bytes = gunzipSync(
    readFileSync(
      new URL('../references/fixtures/m10-route-launch/before-departure.v8.gz', import.meta.url)
    )
  )
  assert.equal(
    createHash('sha256').update(bytes).digest('hex'),
    '0dc9273cca6214ca7ab3794d1f8c9f1e2be37145f5919c4fd02894969be77792'
  )
  const w = deserialize(bytes)
  assert.equal(w.turn, 3800)
  return w
}
const party = w => ids.map(id => w.units.find(u => u.id === id))
const distance = (a, b) =>
  Math.hypot(
    ...['x', 'z'].map(key => {
      const d = Math.abs(a[key] - b[key])
      return Math.min(d, 256 - d)
    })
  )

// Historical browser checkpoint before the observed discontinuity. This does
// not certify earlier route history or a complete authentic campaign crossing.
test('route-advance departure launches every matching passenger without moving them to a distant ground waypoint', async () => {
  await withStorage({}, async ({ freshStore }) => {
    const store = await freshStore()
    store.startMission(10)
    const w = store.getWorld()
    Object.assign(w, migrateCheckpoint(checkpoint()))
    await store.saveCheckpoint()
    assert.ok(store.loadCheckpoint())
    const twin = store.getWorld(),
      boat = w.vehicles.find(v => v.id === 62),
      people = party(w),
      owners = people.map(u => u.native),
      clocks = owners.map(p => p.counter)
    const order = currentPersonOrder(w.buildingOrders, owners[0]),
      group = owners[0].motionGroup
    assert.equal(order.model, 3)
    assert.equal(order.references, 5)
    assert.ok(
      owners.every(
        p => p.motionGroup === group && currentPersonOrder(w.buildingOrders, p) === order
      )
    )
    let departures = 0,
      maxStep = 0
    for (let n = 1; n <= 100; n++) {
      const previous = people.map(u => ({ x: u.x, z: u.z, vehicle: u.native.vehicle })),
        previousBoat = browserPosition(boat)
      tick(w, 1 / 12)
      tick(twin, 1 / 12)
      assert.deepEqual(w, twin)
      assert.ok(
        distance(browserPosition(boat), previousBoat) < 1,
        'craft remains within native110 movement bound'
      )
      for (const [i, u] of people.entries()) {
        assert.equal(u.native, owners[i])
        assert.equal(w.objectCells.objects.get(u.id), owners[i])
        assert.equal(
          owners[i].counter,
          (clocks[i] + n) & 255,
          'one preparation/physics visit per logical turn'
        )
        assert.ok(u.hp > 0)
        const moved = distance(u, previous[i])
        maxStep = Math.max(maxStep, moved)
        assert.ok(moved < 2, `person ${u.id} moved ${moved} in one turn`)
        if (previous[i].vehicle && !u.native.vehicle) {
          departures++
          assert.equal(w.turn, 3822)
          assert.equal(u.flight, u.native)
          assert.equal(u.lift, 1)
          assert.ok(
            distance(u, browserPosition(boat)) < 2,
            'launch originates at the craft, not next ground waypoint'
          )
          assert.equal(u.native.motionGroup, group)
          assert.equal(currentPersonOrder(w.buildingOrders, u.native), order)
        }
      }
      if (departures) {
        assert.equal(boat.passengerCount, 0)
        assert.ok(boat.passengers.every(id => id === 0))
      }
    }
    assert.equal(
      departures,
      5,
      'repeated passenger enumeration must visit promoted driver slots too'
    )
    assert.equal(order.references, 5, 'launch does not cancel retained commands')
    assert.ok(maxStep > 0)
    assert.ok(
      people.every(u => !u.flight && !u.lift && !u.native.vehicle),
      'ordinary physics completes these launches'
    )
    assert.ok(
      people.every(u => distance(u, { x: -13, z: 35 }) > 40),
      'this receipt does not fabricate mainland arrival'
    )
  })
})
