import assert from 'node:assert/strict'
import test from 'node:test'
import { addUnit, browserPosition, createWorld, tick } from '../app/model.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { boardLiveVehicle } from '../app/live-vehicles.ts'
import { stepLiveAboardPersonAttack } from '../app/live-building-combat.ts'
import {
  allocatePersonOrder,
  attachPersonOrder,
  currentPersonOrder,
} from '../app/person-orders.ts'
import { orderEffects } from '../app/live-movement.ts'
import { vehicleReady } from '../app/vehicle-routing.ts'

function setup({ counter = 3, ready = true } = {}) {
  const world = createWorld(22)
  const balloon = world.vehicles.find(vehicle => vehicle.model === 3)
  assert.deepEqual([balloon.id, balloon.x, balloon.y, balloon.passengerCount], [1, -19200, 14592, 0])
  const make = (team, x) => {
    const unit = addUnit(world, team, 'warrior', browserPosition({ ...balloon, x }))
    const person = (unit.native = createLivePerson(world, unit))
    registerLivePerson(world, person)
    return [unit, person]
  }
  const [attacker, person] = make('blue', balloon.x)
  const [defender, target] = make('red', balloon.x + 512)
  assert.ok(boardLiveVehicle(world, person, balloon))
  // Supply the post-admission occupied Balloon and active command, not user input.
  const orderId = allocatePersonOrder(world.buildingOrders)
  const order = Object.assign(world.buildingOrders.records[orderId], { model: 28, a: defender.id, flags: 0 })
  attachPersonOrder(world.buildingOrders, person, orderId, 0, orderEffects(world))
  Object.assign(person, {
    state: 10, substate: 0, counter,
    goalX: balloon.x, goalY: balloon.y, destinationX: balloon.x, destinationY: balloon.y,
  })
  if (!ready) balloon.navigationFlags |= 0x10000
  return { world, balloon, attacker, person, defender, target, order }
}

test('0051bf10 active explicit-target destination tracks the living person only on the fourth visit', () => {
  const { world, balloon, attacker, person, target } = setup({ counter: 2, ready: false })
  assert.ok(stepLiveAboardPersonAttack(world, attacker))
  assert.equal(person.counter, 3)
  assert.deepEqual([person.goalX, person.goalY], [balloon.x, balloon.y])
  assert.ok(stepLiveAboardPersonAttack(world, attacker))
  assert.equal(person.counter, 4)
  assert.deepEqual([person.goalX, person.goalY], [target.x, target.y])
})

test('00438af0 transport readiness blocks a close explicit target before grounded departure', () => {
  const { world, balloon, attacker, person } = setup({ ready: false })
  assert.equal(vehicleReady(world.land, balloon), false)
  assert.ok(stepLiveAboardPersonAttack(world, attacker))
  assert.deepEqual([person.vehicle, person.workTarget, balloon.passengerCount], [balloon.id, 0, 1])
  const on = setup() // Independent ready control at the same exact scan phase.
  assert.equal(vehicleReady(on.world.land, on.balloon), true)
  assert.ok(stepLiveAboardPersonAttack(on.world, on.attacker))
  assert.deepEqual([on.person.vehicle, on.person.workTarget, on.balloon.passengerCount], [0, on.target.id, 0])
})

test('0051c3c0 explicit command selects the ungrouped live person (type two), not terrain', () => {
  const { world, balloon, attacker, person, target, order } = setup()
  assert.equal(world.objectCells.objects.get(target.id), target)
  assert.ok(!target.group)
  assert.ok(stepLiveAboardPersonAttack(world, attacker))
  assert.deepEqual([person.workTarget, person.substate, person.vehicle, balloon.passengerCount], [target.id, 2, 0, 0])
  assert.equal(currentPersonOrder(world.buildingOrders, person), order)
  assert.equal(order.a, target.id)
})

test('0051fce0 invalid target releases active explicit order but preserves its acting passenger', () => {
  const { world, balloon, attacker, person, defender, order } = setup()
  defender.hp = 0 // Supplied dead owner at dispatcher boundary; not a death-path test.
  assert.equal(order.references, 1)
  assert.ok(stepLiveAboardPersonAttack(world, attacker))
  assert.equal(currentPersonOrder(world.buildingOrders, person), undefined)
  assert.deepEqual([order.references, person.vehicle, balloon.passengers[0]], [0, balloon.id, person.id])
})

test('00520250 publishes live march cues strictly below distance 1536, deferring shifted row', () => {
  const world = createWorld(6)
  const owners = world.units.filter(unit => unit.team === 'blue').slice(0, 4)
  assert.equal(owners.length, 4)
  const [a, b, c, d] = owners.map(({ id }) => id)
  const rows = [
    { count: 1, person: a, distance: 1535, a: 258, b: 2 },
    { count: 2, person: b, distance: 10, a: 260, b: 2 },
    { count: 4, person: c, distance: 0, a: 262, b: 2 },
    { count: 3, person: d, distance: 1536, a: 264, b: 2 },
  ]
  world.combatMarches.push(...rows) // Supply summaries; ordinary world simulation owns consumption.
  const cues = () => world.sounds.filter(evt => evt.owner !== undefined && evt.cue >= 45 && evt.cue <= 48)
    .map(evt => [evt.owner, evt.cue])
  tick(world, 1 / 12)
  assert.deepEqual(cues(), [[a, 45], [c, 48]])
  assert.deepEqual(world.combatMarches, [rows[1], rows[3]])
  tick(world, 1 / 12)
  assert.deepEqual(cues(), [[a, 45], [c, 48], [b, 46]])
  assert.deepEqual(world.combatMarches, [rows[3]])
  tick(world, 1 / 12)
  assert.deepEqual(cues(), [[a, 45], [c, 48], [b, 46]])
  assert.deepEqual(world.combatMarches, [rows[3]])
})
