import assert from 'node:assert/strict'
import { supportsFollower, tick } from '../../app/model.ts'

// Observe the native voluntary launch already produced by a public route.
// This only advances real world turns; it never relocates or repairs the actor.
export function settleRouteLaunch(world, unit, target) {
  const person = unit.native,
    hp = unit.hp
  assert.equal(person.vehicle, 0)
  assert.equal(unit.flight, person)
  assert.equal(unit.lift, 1)
  for (let count = 0; count < 64 && unit.flight; count++) {
    const before = { x: unit.x, z: unit.z },
      counter = person.counter
    tick(world, 1 / 12)
    assert.equal(person.counter, (counter + 1) & 255)
    assert.equal(unit.native, person)
    assert.equal(world.objectCells.objects.get(unit.id), person)
    assert.ok(Math.hypot(unit.x - before.x, unit.z - before.z) < 2)
    assert.equal(unit.hp, hp)
  }
  assert.equal(unit.flight, undefined)
  assert.equal(unit.lift ?? 0, 0)
  assert.ok(world.units.includes(unit) && unit.hp > 0)
  assert.ok(supportsFollower(world, unit))
  if (target) assert.ok(Math.hypot(unit.x - target.x, unit.z - target.z) < 4)
}
