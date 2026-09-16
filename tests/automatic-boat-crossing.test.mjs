import assert from 'node:assert/strict'
import test from 'node:test'

import { createLivePerson } from '../app/live-people.ts'
import { boardLiveVehicle, nearestLiveBoat, stepLiveVehicle } from '../app/live-vehicles.ts'
import { attachPersonRoute } from '../app/person-routes.ts'
import { createWorld } from '../app/world-initialization.ts'

test('automatic Boat search filters native-ineligible vehicles and boarding shares the driver route', () => {
  const world = createWorld(5),
    boat = world.vehicles[0],
    [driverUnit, passengerUnit, unrelatedUnit] = world.units.filter(
      unit => unit.team === 'blue' && unit.kind === 'warrior'
    ),
    enemyUnit = world.units.find(unit => unit.team !== 'blue' && unit.team !== 'wild'),
    driver = createLivePerson(world, driverUnit),
    passenger = createLivePerson(world, passengerUnit),
    enemy = createLivePerson(world, enemyUnit),
    unrelated = createLivePerson(world, unrelatedUnit),
    center = { x: boat.x, y: boat.y },
    boatCell = ((boat.y & 65_535) >> 9) * 128 + ((boat.x & 65_535) >> 9)
  boat.active = true
  world.land.flags[boatCell] = 0
  world.land.categories[boatCell] = 2
  assert.equal(nearestLiveBoat(world, driver, center, 0, 2_048), boat)

  boat.passengerCount = 5
  assert.equal(nearestLiveBoat(world, driver, center, 0, 2_048), undefined)
  boat.passengerCount = 1
  boat.passengers = [enemy.id]
  world.pathfinding.people.set(enemy.id, enemy)
  assert.equal(nearestLiveBoat(world, driver, center, 0, 2_048), undefined)

  boat.passengerCount = 0
  boat.passengers = []
  boat.reservation = 1
  world.manaTribes[driver.tribe].playerType = 1
  assert.equal(nearestLiveBoat(world, driver, center, 0, 2_048), undefined)
  world.manaTribes[driver.tribe].playerType = 2
  assert.equal(nearestLiveBoat(world, driver, center, 0, 2_048), boat)

  world.pathfinding.people.set(driver.id, driver)
  world.pathfinding.people.set(passenger.id, passenger)
  Object.assign(driver, { goalX: 10_000, goalY: 12_000 })
  Object.assign(passenger, { goalX: 10_200, goalY: 12_200 })
  attachPersonRoute(world.motionRoutes, driver, 1)
  attachPersonRoute(world.motionRoutes, passenger, 2)
  driver.motionIndex = 3
  assert.ok(boardLiveVehicle(world, driver, boat))
  assert.ok(boardLiveVehicle(world, passenger, boat))
  assert.deepEqual(
    [passenger.motionGroup, passenger.motionIndex, boat.passengerCount, boat.passengers],
    [driver.motionGroup, driver.motionIndex, 2, [driver.id, passenger.id]]
  )

  world.pathfinding.people.set(unrelated.id, unrelated)
  Object.assign(unrelated, { x: boat.x, y: boat.y })
  attachPersonRoute(world.motionRoutes, unrelated, 3)
  driver.destinationX = (boat.x + 1_024) & 65_535
  driver.destinationY = boat.y
  const before = boat.x
  assert.ok(stepLiveVehicle(world, driver))
  assert.notEqual(boat.x, before, 'a nearby land-only route must not hold the Boat')
})
