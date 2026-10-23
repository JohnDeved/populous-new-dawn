import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { deserialize } from 'node:v8'
import { createHash } from 'node:crypto'
import { vehicleSeat } from '../app/vehicle-seats.ts'
import { syncLiveVehiclePassengers } from '../app/live-vehicles.ts'
import { advanceGame } from '../app/game-clock.ts'
import { browserPosition } from '../app/world-coordinates.ts'
import { supportsFollower } from '../app/world-terrain-runtime.ts'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import { canUnloadVehicle } from '../app/vehicle-panel-runtime.ts'
import { normalizeHistoricalFixture, createHistoricalFixtureHarness } from './helpers/historical-checkpoint.ts'

const groups = [
  [1337, 603, 112],
  [1368, 569, 113],
  [1419, 673, 114],
]
const distance = (a, b) =>
  Math.hypot(
    ...['x', 'z'].map(k => {
      const d = Math.abs(a[k] - b[k])
      return Math.min(d, 256 - d)
    })
  )
const checkpoint = () => {
  const bytes = gunzipSync(
    readFileSync(
      new URL('../references/fixtures/m16-seat-sync/before-unload.v8.gz', import.meta.url)
    )
  )
  assert.equal(
    createHash('sha256').update(bytes).digest('hex'),
    'c8414664eaf3a65b7d8cc653134bab8af87f21a38d5d5bd460e28d90b1f5906c'
  )
  const w = deserialize(bytes)
  assert.equal(w.turn, 10183)
  return normalizeHistoricalFixture(w)
}
// Historical ordinary campaign checkpoint; no supplied positions or actor edits.
// Uses shipped simulation/animation clock, not a rendered browser/camera witness.
test('retired route-map Balloon occupants launch from actual seats through public panel and historical clone/normalization', async () => {
  await loadSceneFixture()
  const { ObjectPanels } = await import('../app/object-panels.ts')
  {
    const store = createHistoricalFixtureHarness()
    store.startMission(16)
    const w = store.getWorld()
    const historical = checkpoint()
    for (const key of Object.keys(w)) if (!Object.hasOwn(historical, key)) delete w[key]
    Object.assign(w, historical)
    assert.deepEqual(w, historical, 'no fresh-world fields may leak into the archive')
    assert.ok(await store.saveCheckpoint())
    assert.ok(store.loadCheckpoint())
    const twin = store.getWorld()
    const clocks = [w, twin].map(() => ({ animationTime: 0, animationFrame: 0 })),
      ids = groups.flatMap(([, a, b]) => [a, b]),
      owners = ids.map(id => w.units.find(u => u.id === id).native)
    for (const id of ids) {
      assert.equal(w.pathfinding.people.has(id), false)
      assert.equal(w.objectCells.objects.get(id), w.units.find(u => u.id === id).native)
    }
    const frame = () => {
      for (const [i, world] of [w, twin].entries()) advanceGame(world, clocks[i], 1 / 12)
      assert.deepEqual(w, twin)
    }
    for (let n = 0; n < 3; n++) {
      frame()
      for (const [vehicleId, ...passengers] of groups) {
        const v = w.vehicles.find(v => v.id === vehicleId)
        for (const id of passengers) {
          const u = w.units.find(u => u.id === id),
            p = u.native,
            seat = vehicleSeat(v, v.passengers.indexOf(id))
          assert.deepEqual({ x: p.x, y: p.y, h: p.h }, seat)
          assert.equal(distance(u, browserPosition(p)), 0)
          assert.equal(
            w.pathfinding.people.has(id),
            false,
            'Seat update does not recreate a retired route'
          )
          assert.equal(w.objectCells.objects.get(id), p)
          const cell = ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9),
            seen = new Set()
          let next = w.objectCells.heads[cell]
          while (next && next !== id) {
            assert.ok(!seen.has(next))
            seen.add(next)
            next = w.objectCells.objects.get(next).cellNext
          }
          assert.equal(next, id, 'Native owner is linked in the actual seat cell')
        }
      }
    }
    for (const [vehicleId, pilot, passenger] of groups) {
      for (const world of [w, twin]) {
        const v = world.vehicles.find(v => v.id === vehicleId)
        assert.equal(canUnloadVehicle(world, v), true)
        let sounds = 0,
          changes = 0
        ObjectPanels.prototype.vehicleAction.call(
          {
            scene: {
              world,
              overviewActive: false,
              onSound() {
                sounds++
              },
              onChange() {
                changes++
              },
            },
          },
          vehicleId,
          pilot,
          true,
          false,
          false
        )
        assert.equal(sounds, 1)
        assert.equal(changes, 1)
        assert.equal(v.passengerCount, 0)
        for (const id of [pilot, passenger]) {
          const u = world.units.find(u => u.id === id)
          assert.equal(u.flight, u.native)
          assert.equal(u.native.vehicle, 0)
        }
      }
      assert.deepEqual(w, twin)
    }
    for (let n = 0; n < 100; n++) {
      const before = ids.map(id => {
        const u = w.units.find(u => u.id === id)
        return { x: u.x, z: u.z }
      })
      frame()
      for (const [i, id] of ids.entries()) {
        const u = w.units.find(u => u.id === id)
        if (u.flight) {
          assert.equal(u.native, owners[i])
          assert.equal(u.flight, u.native)
          assert.equal(w.objectCells.objects.get(id), u.native)
        }
        assert.ok(
          distance(u, before[i]) < 2,
          `person ${id} displaced ${distance(u, before[i])} in one tick`
        )
        assert.ok(u.hp > 0)
        if (u.flight) assert.equal(distance(u, browserPosition(u.native)), 0)
      }
      if (ids.every(id => !w.units.find(u => u.id === id).flight)) break
    }
    assert.ok(
      ids.every(id => {
        const u = w.units.find(u => u.id === id)
        return !u.flight && !u.native?.vehicle && supportsFollower(w, u)
      })
    )
  }
})

// Supplied owner-resolution controls, separate from the ordinary checkpoint replay.
test('Boat and Balloon seat sync retain route-map precedence and existing fallback ownership', () => {
  for (const model of [1, 3]) {
    for (const owner of ['route', 'native', 'legacy']) {
      const source = checkpoint(),
        original = source.units.find(u => u.id === 112).native,
        p = structuredClone(original),
        other = structuredClone(original)
      const v = {
        ...source.vehicles.find(v => v.id === 1337),
        model,
        passengers: [112],
        passengerCount: 1,
        x: 12000,
        y: 18000,
        h: 600,
        heading: 0,
      }
      const unit = { id: 112, x: 0, z: 0, heading: 0, native: owner === 'legacy' ? null : other },
        people = new Map(),
        objects = new Map()
      if (owner === 'route') people.set(112, p)
      const w = {
        units: [unit],
        pathfinding: { people },
        objectCells: { objects, heads: new Float64Array(16384) },
      }
      const before = structuredClone(other),
        seat = vehicleSeat(v, 0),
        selected = owner === 'route' ? p : other
      syncLiveVehiclePassengers(w, v)
      assert.equal(distance(unit, browserPosition(seat)), 0)
      assert.equal(people.size, owner === 'route' ? 1 : 0, 'No route record allocation')
      assert.equal(objects.size, 0, 'Unregistered supplied owner remains unregistered')
      assert.equal(
        unit.native,
        owner === 'legacy' ? null : other,
        'Native identity is never replaced'
      )
      if (owner !== 'legacy') {
        assert.deepEqual({ x: selected.x, y: selected.y, h: selected.h }, seat)
        assert.ok(selected.flags2 & 0x4000)
        assert.deepEqual(selected.commands, before.commands)
        assert.equal(selected.motionGroup, before.motionGroup)
      }
      if (owner === 'route')
        assert.deepEqual(
          other,
          before,
          'Existing route owner takes precedence over distinct native fallback'
        )
    }
  }
})
