// Ordinary M22 recruitment route; only the existing spell-focus adapter is supplied.
import test from 'node:test'
import { createGameStore } from '../app/game-store.ts'
import assert from 'node:assert/strict'
import { browserPosition, cast, command, tick } from '../app/model.ts'
test('grounded staged boarding retains and visits the preceding waypoint', async () => {
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
      w.selected = [s.id]
      assert.ok(command(w, p))
      stepUntil(w, () => Math.hypot(s.x - p.x, s.z - p.z) < 2, 1000)
    }
  const store = createGameStore()
  store.startMission(22)
  let world = store.getWorld(),
    shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
    boat = world.vehicles.find(vehicle => vehicle.model === 1)

  focusCharging(world, 5)
  stepUntil(world, () => world.shots.swarm > 0, 1_500)
  moveShaman(world, shaman, { x: 0, z: -45 })
  moveShaman(world, shaman, { x: 20, z: -45 })
  assert.ok(cast(world, 'swarm', { x: 27, z: -29 }))
  stepUntil(world, () => world.effects.some(effect => effect.swarm?.applied), 100)

  const p = shaman.native
  assert.equal(p.vehicle, 0)
  world.selected = [shaman.id]
  assert.ok(command(world, { x: 0, z: -45 }, { ctrlKey: true }))
  const first = p.commands.find(Boolean)
  assert.equal(world.buildingOrders.records[first].flags, 128)
  const control = structuredClone(world),
    controlShaman = control.units.find(u => u.id === shaman.id)
  assert.ok(command(world, { ...browserPosition(boat), id: boat.id }, { ctrlKey: true }))
  const after = shaman.native
  assert.equal(world.buildingOrders.records[first].references, 1)
  assert.equal(after, p)
  const second = after.commands[1],
    record = world.buildingOrders.records[second]
  assert.deepEqual(
    [record.model, record.flags, record.references, record.a, record.b],
    [22, 128, 1, boat.id, ((boat.x >>> 8) & 255) | (boat.y & 0xff00)]
  )
  assert.equal(world.orderCursor, 2)
  assert.equal(world.objectCells.objects.get(shaman.id), p)
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const restored = store.getWorld()
  const comparable = world => {
    const copy = structuredClone(world)
    for (const index of [0, 2])
      if (copy.shrines[index].reward === undefined) copy.shrines[index].reward = 'mana'
    return copy
  }
  // Historical adapter records omitted the clicked cell. Preserve that legacy
  // boundary without fabricating the original click or claiming distance parity.
  const legacy = structuredClone(world)
  legacy.buildingOrders.records[second].b = 0
  let closest = Infinity,
    controlClosest = Infinity,
    boarded = null
  for (let n = 0; n < 300; n++) {
    tick(world, 1 / 12)
    tick(control, 1 / 12)
    tick(restored, 1 / 12)
    tick(legacy, 1 / 12)
    assert.deepEqual(comparable(restored), comparable(world))
    closest = Math.min(closest, Math.hypot(shaman.x, shaman.z + 45))
    controlClosest = Math.min(controlClosest, Math.hypot(controlShaman.x, controlShaman.z + 45))
    if (boat.passengerCount && boarded === null) boarded = world.turn
  }
  assert.ok(controlClosest < 1)
  assert.ok(closest < 1)
  assert.ok(boarded)
  assert.equal(world.buildingOrders.records[first].references, 0)
  assert.equal(world.buildingOrders.records[second].references, 0)
  assert.equal(after.vehicle, boat.id)
  assert.deepEqual(boat.passengers, [shaman.id])
  assert.equal(world.objectCells.objects.get(shaman.id), after)
  assert.equal(legacy.units.find(u => u.id === shaman.id).native.vehicle, boat.id)
  assert.equal(legacy.buildingOrders.records[second].references, 0)
  assert.equal(after.commands.filter(Boolean).length, 0)
})
