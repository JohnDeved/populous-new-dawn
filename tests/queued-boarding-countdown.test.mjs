// Supplied settled seats, registry, countdown and animation sentinels supplement the ordinary route.
import test from 'node:test'
import { createGameStore } from '../app/game-store.ts'
import assert from 'node:assert/strict'
import { browserPosition, cast, command, tick, selectUnit } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { addUnit, setSelection } from '../app/model.ts'
import { boardLiveVehicle } from '../app/live-vehicles.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { stepLiveMovement } from '../app/live-movement.ts'
import { releasePersonRoute } from '../app/person-routes.ts'
import { vehicleReady } from '../app/vehicle-routing.ts'
test('supplied ready driver and passenger countdown retain then retire boarding orders', () => {
  const stepUntil = (w, done, limit) => {
      for (let i = 0; i < limit; i++) {
        tick(w, 1 / 12)
        if (done()) return
      }
      throw Error('timed out ' + w.turn)
    },
    focusCharging = (w, m) => {
      w.charging = true
      w.manaWorld.spells[0].disabled = 0xffffffff & ~(1 << (m - 1))
    },
    moveShaman = (w, s, p) => {
      selectUnit(w, s.id, false)
      assert.ok(command(w, p))
      stepUntil(w, () => Math.hypot(s.x - p.x, s.z - p.z) < 2, 1000)
    }
  const store = createGameStore()
  assert.equal(store.startDebugMission(22), true)
  let world = store.getWorld(),
    shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
    boat = world.vehicles.find(vehicle => vehicle.model === 1)

  focusCharging(world, 5)
  stepUntil(world, () => world.shots.swarm > 0, 1_500)
  moveShaman(world, shaman, { x: 0, z: -45 })
  moveShaman(world, shaman, { x: 20, z: -45 })
  assert.ok(cast(world, 'swarm', { x: 27, z: -29 }))
  stepUntil(world, () => world.effects.some(effect => effect.swarm?.applied), 100)

  for (const role of ['driver', 'non-driver']) {
    const w = structuredClone(world),
      v = w.vehicles.find(x => x.id === boat.id),
      driver = w.units.find(x => x.id === shaman.id)
    let u = driver
    assert.ok(command(w, { ...browserPosition(v), id: v.id }))
    assert.ok(boardLiveVehicle(w, driver.native, v)) // Supplied early settled admission, not ordinary boarding timing.
    if (role === 'non-driver') {
      u = addUnit(w, 'blue', 'brave', browserPosition(v))
      u.native = createLivePerson(w, u)
      registerLivePerson(w, u.native)
      w.pathfinding.people.set(u.id, u.native)
      setSelection(w, [u.id])
      assert.ok(command(w, { ...browserPosition(v), id: v.id }))
      assert.ok(boardLiveVehicle(w, u.native, v))
    }
    const p = u.native,
      id = p.commands.find(Boolean)
    assert.equal(currentPersonOrder(w.buildingOrders, p).model, 22)
    w.pathfinding.people.set(driver.id, driver.native)
    w.pathfinding.people.set(p.id, p)
    releasePersonRoute(w.motionRoutes, p)
    u.path = []
    p.goalX = p.destinationX = v.x
    p.goalY = p.destinationY = v.y
    assert.ok(vehicleReady(w.land, v))
    p.slowTurn = 2
    p.object = 0
    p.f1 = 17
    p.f2 = 23 // Supplied countdown and sentinel animation fields.
    const states = []
    for (let i = 0; i < 2; i++) {
      const counter = p.counter
      stepLiveMovement(w, u)
      assert.equal(p.counter, (counter + 1) & 255)
      states.push({
        slowTurn: p.slowTurn,
        ref: w.buildingOrders.records[id].references,
        object: p.object,
        f1: p.f1,
        f2: p.f2,
        state: p.state,
        vehicle: p.vehicle,
      })
      assert.equal(u.native, p)
      assert.equal(w.objectCells.objects.get(u.id), p)
    }
    assert.equal(states[0].slowTurn, 1)
    assert.equal(states[0].ref, 1)
    assert.equal(states[0].object, 0)
    assert.equal(states[0].f2, 23)
    assert.equal(states[1].slowTurn, 0)
    assert.equal(states[1].ref, 0)
    assert.notEqual(states[1].object, 0)
    assert.equal(p.vehicle, v.id)
  }
})
