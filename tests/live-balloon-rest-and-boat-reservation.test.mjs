import assert from 'node:assert/strict'
import test from 'node:test'
import { addUnit, browserPosition, createWorld } from '../app/model.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { boardLiveVehicle, beginLiveVehiclePass, stepLiveVehicles } from '../app/live-vehicles.ts'
import { boardingVehicle, vehicleReady } from '../app/vehicle-routing.ts'
import { terrainPointHeight } from '../app/native-terrain.ts'

test('an unvisited centered authored Balloon stops and publishes terrain-relative rest height', () => {
  const w = createWorld(22)
  const v = w.vehicles.find(vehicle => vehicle.model === 3)
  assert.deepEqual([v.id, v.x, v.y, v.h, v.speed, v.passengerCount], [1, -19200, 14592, 999, -1, 0])
  const u = addUnit(w, 'blue', 'brave', browserPosition(v))
  const p = (u.native = createLivePerson(w, u))
  registerLivePerson(w, p)
  assert.ok(boardLiveVehicle(w, p, v))
  v.speed = 1 // Supply the centered below-two moving state, not an approach route.
  v.navigationFlags |= 0x10000
  assert.equal(p.speed, 0)
  assert.equal(terrainPointHeight(w.land, v), 999)
  beginLiveVehiclePass(w)
  stepLiveVehicles(w)
  assert.deepEqual([v.x, v.y, v.h, v.speed], [-19200, 14592, 1559, 0], 'terrain-relative centered Balloon stop')
  assert.equal(v.navigationFlags & 0x10000, 0)
  assert.equal(w.objectCells.objects.get(p.id), p)
  assert.equal(p.vehicle, v.id)
  assert.equal(v.passengers[0], p.id)
})

test('an authored ready Boat is rejected for computer boarding when its reservation byte is nonzero', () => {
  const w = createWorld(22)
  const v = w.vehicles.find(vehicle => vehicle.model === 1)
  assert.deepEqual([v.id, v.active, v.passengerCount], [95, true, 0])
  assert.ok(vehicleReady(w.land, v))
  assert.deepEqual(w.manaTribes.slice(0, 2).map(t => t.playerType), [2, 1])
  const cell = ((v.x >> 8) & 254) | (v.y & 0xfe00)
  assert.equal(cell, 5670)
  // Supply only the ordinary authored Boat's routing-cell projection.
  const boat = { ...v, class: 4 }
  const route = {
    flags: w.land.flags,
    categories: w.land.categories,
    cellObjects: packed => packed === cell ? [boat] : [],
    boatsEnabled: 1,
    vehicles: new Map([[v.id, boat]]),
    people: new Map(),
    tribes: w.manaTribes,
  }
  for (const [byte, computer] of [[0, v.id], [1, 0], [255, 0]]) {
    boat.reservation = byte
    assert.equal(boardingVehicle(route, { tribe: 0 }, cell), v.id, 'human boarding ignores reservation')
    assert.equal(boardingVehicle(route, { tribe: 1 }, cell), computer, 'computer boarding observes the reservation byte')
  }
})
