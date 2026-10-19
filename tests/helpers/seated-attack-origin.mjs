import assert from 'node:assert/strict'
import { vehicleSeat } from '../../app/vehicle-seats.ts'
import { browserPosition, wrappedDistance } from '../../app/world-coordinates.ts'

// The mode1 grounded attack adapter must start from the actual physical seat.
// It remains separate from voluntary-launch flight/landing equivalence.
export function seatedAttackOrigin(world, unit, vehicle) {
  const person = unit.native,
    slot = vehicle.passengers.indexOf(unit.id)
  assert.ok(slot >= 0)
  const seat = vehicleSeat(vehicle, slot)
  assert.equal(person.vehicle, vehicle.id)
  assert.equal(world.objectCells.objects.get(unit.id), person)
  assert.deepEqual({ x: person.x & 65535, y: person.y & 65535, h: person.h }, seat)
  assert.equal(wrappedDistance(unit, browserPosition(person)), 0)
  return { x: unit.x, z: unit.z }
}

export function boundedGroundAttackDeparture(unit, origin) {
  // These fixtures take the existing768-unit ground-exit branch; rounding can
  // contribute less than one native coordinate unit per axis.
  assert.ok(wrappedDistance(unit, origin) < 3.01)
}
