import test from 'node:test'
import assert from 'node:assert/strict'
import { addBuilding, addUnit, createWorld, tick } from '../app/model.ts'
import { buildingAdmission } from '../app/live-building-entry.ts'

function launch(team, playerType) {
  const world = createWorld(9),
    tribe = team === 'blue' ? 0 : 2
  assert.equal(world.manaTribes[tribe].playerType, playerType)
  const house = addBuilding(world, team, 'boatHouse', { x: 0, z: 0 }, true),
    braves = Array.from({ length: 4 }, (_, index) =>
      addUnit(world, team, 'brave', { x: index / 10, z: 0 })
    )
  for (const brave of braves) {
    brave.inside = house.id
    brave.work = house.id
  }
  const admission = buildingAdmission(world, house)
  assert.deepEqual(admission.occupants, [...braves.map(brave => brave.id), 0, 0])
  assert.equal(admission.inside, 4)

  house.timer = 599
  tick(world, 1 / 12)
  const boat = world.vehicles.find(vehicle => vehicle.model === 1 && vehicle.team === team)
  assert.ok(boat, `playerType ${playerType} did not launch a Boat`)
  return { world, house, braves, admission, boat }
}

test('Boat House launch matches native type-1 computer full ejection', () => {
  const { house, braves, admission, boat } = launch('yellow', 1)
  assert.deepEqual(boat.passengers, [braves[0].id])
  assert.equal(house.timer, 0)
  assert.equal(house.boatLaunched, true)
  assert.equal(admission.inside, 0)
  assert.deepEqual(admission.occupants, [0, 0, 0, 0, 0, 0])
  assert.ok(braves.every(brave => brave.inside === null))
})

test('Boat House launch matches native type-2 human driver removal with retained occupants', () => {
  const { house, braves, admission, boat } = launch('blue', 2)
  assert.deepEqual(boat.passengers, [braves[0].id])
  assert.equal(house.timer, 0)
  assert.equal(house.boatLaunched, true)
  assert.equal(braves[0].inside, null)
  assert.equal(admission.inside, 3)
  assert.deepEqual(admission.occupants, [0, braves[1].id, braves[2].id, braves[3].id, 0, 0])
  assert.deepEqual(
    braves.slice(1).map(brave => brave.inside),
    [house.id, house.id, house.id]
  )
})
