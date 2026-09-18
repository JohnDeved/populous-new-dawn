import assert from 'node:assert/strict'
import test from 'node:test'

import { migrateCheckpoint } from '../app/game-store.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import {
  boardLiveVehicle,
  leaveLiveVehicle,
  stepLiveVehicle,
  syncLiveVehiclePassengers,
} from '../app/live-vehicles.ts'
import { objectsInCell } from '../app/object-cells.ts'
import { browserPosition } from '../app/world-coordinates.ts'
import { createWorld } from '../app/world-initialization.ts'

const short = n => (n << 16) >> 16
const packedCell = p => ((p.x >>> 8) & 254) | (p.y & 0xfe00)
const occupants = (world, point) =>
  [...objectsInCell(world.objectCells, packedCell(point))].map(person => person.id)

function vehicleScenario(mission, model) {
  const world = createWorld(mission),
    vehicle = world.vehicles.find(candidate => candidate.model === model),
    unit = world.units.find(candidate => candidate.team === 'blue' && candidate.inside === null)
  assert.ok(vehicle, `Mission ${mission} should provide vehicle model ${model}`)
  assert.ok(unit, `Mission ${mission} should provide a Blue passenger`)
  vehicle.active = true
  world.pathfinding.people.clear()
  const person = createLivePerson(world, unit)
  unit.native = person
  world.pathfinding.people.set(unit.id, person)
  registerLivePerson(world, person)
  Object.assign(vehicle, { x: person.x, y: person.y, h: person.h, passengers: [], passengerCount: 0 })
  Object.assign(unit, browserPosition(person))
  return { world, vehicle, unit, person }
}

function orderState(person) {
  return {
    commands: [...person.commands],
    commandCursor: person.commandCursor,
    immediateCommand: person.immediateCommand,
    orderLocation: person.orderLocation,
    commandStatus: person.commandStatus,
    workTarget: person.workTarget,
  }
}

for (const [label, mission, model] of [
  ['Boat', 5, 1],
  ['Balloon', 22, 3],
]) {
  test(`${label} travel and exit keep registered passenger object-cell membership current`, () => {
    const { world, vehicle, unit, person } = vehicleScenario(mission, model),
      initialCell = packedCell(person),
      beforeOrder = orderState(person),
      randomState = world.randomState
    assert.deepEqual(occupants(world, person).filter(id => id === person.id), [person.id])
    assert.ok(boardLiveVehicle(world, person, vehicle))
    assert.equal(packedCell(person), initialCell)
    assert.deepEqual(occupants(world, person).filter(id => id === person.id), [person.id])

    person.destinationX = short(person.x + 2_048)
    person.destinationY = person.y
    for (let turn = 0; packedCell(vehicle) === initialCell && turn < 128; turn++)
      assert.ok(stepLiveVehicle(world, person))
    assert.notEqual(packedCell(vehicle), initialCell, 'ordinary vehicle travel should cross a cell')
    assert.equal(vehicle.passengerCount, 1)
    assert.deepEqual(vehicle.passengers, [person.id])
    assert.equal(person.vehicle, vehicle.id)
    assert.deepEqual(
      occupants(world, vehicle).filter(id => id === person.id),
      [person.id],
      'registered passenger should move to the vehicle cell'
    )
    assert.equal(
      occupants(world, { x: (initialCell & 254) << 8, y: initialCell & 0xfe00 }).includes(person.id),
      false,
      'registered passenger should leave the previous cell chain'
    )

    const travelCell = packedCell(person),
      exit = { x: short(person.x + 2_048), y: person.y }
    leaveLiveVehicle(world, vehicle, person, exit)
    assert.equal(vehicle.passengerCount, 0)
    assert.deepEqual(vehicle.passengers, [])
    assert.equal(person.vehicle, 0)
    assert.equal(packedCell(person), packedCell(exit))
    assert.deepEqual(occupants(world, person).filter(id => id === person.id), [person.id])
    assert.equal(
      occupants(world, { x: (travelCell & 254) << 8, y: travelCell & 0xfe00 }).includes(person.id),
      false
    )
    assert.deepEqual(orderState(person), beforeOrder)
    assert.equal(world.randomState, randomState)
    assert.deepEqual([unit.x, unit.z], [browserPosition(person).x, browserPosition(person).z])
  })
}

test('same-cell passenger sync preserves one linked membership and never allocates an unregistered person', () => {
  const { world, vehicle, person } = vehicleScenario(5, 1),
    cell = packedCell(person),
    links = { previous: person.cellPrevious, next: person.cellNext },
    sameCell = { x: short(person.x + 64), y: person.y, h: person.h }
  Object.assign(vehicle, sameCell, { passengers: [person.id], passengerCount: 1 })
  person.vehicle = vehicle.id
  syncLiveVehiclePassengers(world, vehicle)
  assert.equal(packedCell(person), cell)
  assert.deepEqual({ previous: person.cellPrevious, next: person.cellNext }, links)
  assert.deepEqual(occupants(world, person).filter(id => id === person.id), [person.id])

  const unit = world.units.find(candidate => candidate.id !== person.id && candidate.team === 'blue')
  assert.ok(unit)
  const unregistered = createLivePerson(world, unit)
  world.pathfinding.people.set(unit.id, unregistered)
  vehicle.passengers = [unregistered.id]
  vehicle.passengerCount = 1
  unregistered.vehicle = vehicle.id
  vehicle.x = short(vehicle.x + 2_048)
  syncLiveVehiclePassengers(world, vehicle)
  assert.equal(world.objectCells.objects.has(unregistered.id), false)
  assert.deepEqual([unregistered.x, unregistered.y, unregistered.h], [vehicle.x & 65_535, vehicle.y & 65_535, short(vehicle.h)])
})

test('checkpoint clone retains passenger cell identity and wrapped exit reindexes without duplicates', () => {
  const { world, vehicle, person } = vehicleScenario(22, 3)
  assert.ok(boardLiveVehicle(world, person, vehicle))
  person.destinationX = short(person.x + 2_048)
  person.destinationY = person.y
  for (let turn = 0, cell = packedCell(person); packedCell(vehicle) === cell && turn < 128; turn++)
    assert.ok(stepLiveVehicle(world, person))

  const restored = migrateCheckpoint(structuredClone(world)),
    restoredVehicle = restored.vehicles.find(candidate => candidate.id === vehicle.id),
    restoredUnit = restored.units.find(candidate => candidate.id === person.id),
    restoredPerson = restored.pathfinding.people.get(person.id)
  assert.equal(restoredUnit.native, restoredPerson)
  assert.equal(restored.objectCells.objects.get(person.id), restoredPerson)
  assert.deepEqual(occupants(restored, restoredPerson).filter(id => id === person.id), [person.id])

  const oldCell = packedCell(restoredPerson),
    wrappedExit = { x: -128, y: restoredPerson.y }
  leaveLiveVehicle(restored, restoredVehicle, restoredPerson, wrappedExit)
  assert.equal(restoredPerson.x, 65_408)
  assert.deepEqual(occupants(restored, restoredPerson).filter(id => id === person.id), [person.id])
  assert.equal(
    occupants(restored, { x: (oldCell & 254) << 8, y: oldCell & 0xfe00 }).includes(person.id),
    oldCell === packedCell(restoredPerson)
  )
  assert.equal(new Set(occupants(restored, restoredPerson)).size, occupants(restored, restoredPerson).length)
})
