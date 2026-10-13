import assert from 'node:assert/strict'
import { vehicleExit } from '../../app/live-vehicles.ts'
import { vehicleReady } from '../../app/vehicle-routing.ts'
import { tick } from '../../app/model.ts'
import { currentPersonOrder } from '../../app/person-orders.ts'

// Reach an observed point on the ordinary 55,121 flight, rather than assuming
// acquisition and travel occur at a fixed campaign turn. No world state is edited.
export function reachMission22FlightPoint(world, shaman, balloon, x, y) {
  const person = shaman.native,
    order = currentPersonOrder(world.buildingOrders, person)
  assert.equal(order.model, 3)
  for (let count = 0; count < 1_200 && (balloon.x !== x || balloon.y !== y); count++)
    tick(world, 1 / 12)
  assert.deepEqual([balloon.x, balloon.y, balloon.speed], [x, y, 32])
  assert.equal(shaman.native, person)
  assert.equal(world.objectCells.objects.get(shaman.id), person)
  assert.equal(currentPersonOrder(world.buildingOrders, person), order)
  assert.equal(order.references, 1)
  assert.equal(person.vehicle, balloon.id)
  assert.deepEqual(balloon.passengers, [shaman.id])
  assert.equal(balloon.passengerCount, 1)
  assert.equal(vehicleReady(world.land, balloon), false)
  assert.equal(vehicleExit(world, balloon).found, x !== 20767)
}
