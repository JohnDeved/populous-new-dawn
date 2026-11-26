import assert from 'node:assert/strict'
import test from 'node:test'
import { addBuilding, addUnit, browserPosition, createWorld, nativePosition, tick } from '../app/model.ts'
import { buildingInsidePoint, buildingOutsidePoint, buildingPose } from '../app/building-shapes.ts'
import { BuilderTask } from '../app/building-workers.ts'
import { processBuilderWork } from '../app/live-construction-runtime.ts'
import { stepLiveMovement, startLiveOrder } from '../app/live-movement.ts'
import { createLivePerson } from '../app/live-people.ts'
import { allocatePersonOrder, attachPersonOrder, currentPersonOrder } from '../app/person-orders.ts'

const cell = ({ x, y }) => (y >> 9) * 128 + (x >> 9)
function suppliedFetch(phase) {
  // An authored world and timber record, with intentionally supplied worker,
  // plan and controller phase. This does not test client order admission.
  const world = createWorld(7, 'scalable')
  const tree = world.trees.find(item => item.id === 146)
  assert.deepEqual([tree.x, tree.z, tree.logs], [-129, -129, 4])
  const point = nativePosition(world, tree)
  const goal = { x: point.x & 65535, y: point.y & 65535 }
  const site = addBuilding(world, 'blue', 'temple', { x: -73, z: 25 }, false, { plan: true })
  const unit = addUnit(world, 'blue', 'brave', browserPosition({ x: goal.x + 111, y: goal.y }))
  const person = createLivePerson(world, unit)
  unit.work = site.id
  unit.native = null
  unit.builder = { task: BuilderTask.Fetch, busy: 0, phase, restart: false, person }
  person.assignment |= 16
  return { world, tree, goal, site, unit, person }
}

test('the live builder approach keeps its first timber goal and admits only an even near visit', () => {
  const { world, tree, goal, site, unit, person } = suppliedFetch(24)
  person.target = tree.id
  function visit(turn, offset) {
    world.turn = turn
    Object.assign(unit, browserPosition({ x: goal.x + offset, y: goal.y }))
    processBuilderWork(world, unit, site)
    assert.equal(unit.builder.person, person)
    assert.equal(unit.tree, tree.id)
    assert.deepEqual([person.goalX, person.goalY], [goal.x, goal.y], 'published timber goal moved')
    return [unit.builder.phase, person.timer]
  }
  assert.deepEqual(visit(101, 111), [24, 1023], 'odd visit must not admit approach')
  tree.x += 8
  assert.notEqual(nativePosition(world, tree).x & 65535, goal.x)
  assert.deepEqual(visit(102, 112), [24, 1022], '112 exact is outside arrival')
  assert.deepEqual(visit(103, 111), [24, 1021], 'odd retained-goal visit cannot arrive')
  assert.deepEqual(visit(104, 111), [4, 1020], 'even retained-goal visit hands control to harvest')
  assert.equal(person.assignment & 16, 16)
  assert.equal(tree.logs, 4)
})

test('the construction door counts three consecutive clear cells under real world ticks', () => {
  const { world, site, unit, person } = suppliedFetch(22)
  const pose = buildingPose(site)
  const occupied = buildingInsidePoint(pose)
  const clear = buildingOutsidePoint(pose)
  assert.notEqual(cell(occupied), cell(clear))
  assert.equal(world.land.buildingIds[cell(clear)] & 1023, 0)
  assert.equal(world.trees.some(tree => tree.logs > 0 && cell(nativePosition(world, tree)) === cell(clear)), false)
  // Supply occupancy and worker pose between visits, without changing the
  // world clock. Site and worker continue through the normal task dispatcher.
  world.land.buildingIds[cell(occupied)] = site.id & 1023
  assert.notEqual(world.land.buildingIds[cell(occupied)], 0)
  function visit(point) {
    Object.assign(unit, browserPosition(point))
    const before = world.turn
    tick(world, 1 / 12)
    assert.equal(world.turn, before + 1)
    assert.equal(unit.builder.person, person)
    return [unit.builder.phase, person.timer]
  }
  assert.deepEqual(visit(occupied), [22, 3])
  assert.deepEqual(visit(clear), [22, 2])
  assert.deepEqual(visit(occupied), [22, 3], 're-entry into an occupied cell must reset the count')
  assert.deepEqual(visit(clear), [22, 2])
  assert.deepEqual(visit(clear), [22, 1])
  assert.deepEqual(visit(clear), [17, 0], 'third clear visit should enter timber search')
  assert.equal(person.assignment & 16, 16)
})

test('the live advancing queue replaces command 31 by friendly entry or movement', () => {
  for (const friendly of [true, false]) {
    const world = createWorld(5)
    for (let i = 0; i < 12; i++) tick(world, 1 / 12)
    assert.equal(world.turn, 12)
    const site = world.buildings.find(item => item.id === 61)
    assert.deepEqual([site.kind, site.team], ['temple', 'blue'])
    const pose = buildingPose(site)
    const target = buildingInsidePoint(pose)
    assert.equal(world.land.buildingIds[cell(target)] & 1023, site.id)
    assert.equal(world.land.flags[cell(target)] & 512, 512)
    if (!friendly) site.team = 'green'
    const unit = world.units.find(item => item.id === 111)
    const pool = world.buildingOrders
    const first = allocatePersonOrder(pool)
    assert.equal(world.vehicles.some(vehicle => vehicle.id === 65534), false)
    Object.assign(pool.records[first], { model: 22, a: 65534, b: 0 })
    startLiveOrder(world, unit, first)
    const person = unit.native
    assert.equal(world.objectCells.objects.get(unit.id), person)
    const second = allocatePersonOrder(pool)
    Object.assign(pool.records[second], { model: 31, a: target.x, b: target.y })
    attachPersonOrder(pool, person, second, 1, {})
    assert.equal(currentPersonOrder(pool, person), pool.records[first])
    assert.deepEqual([person.commands[1], pool.records[second].references], [second, 1])
    stepLiveMovement(world, unit)
    assert.deepEqual([person.commands[0], pool.records[first].references, pool.records[second].references], [0, 0, 0])
    assert.ok(person.commands[1] && person.commands[1] !== second)
    const after = currentPersonOrder(pool, person)
    const outside = buildingOutsidePoint(pose)
    assert.deepEqual([after.model, after.a, after.b, after.references],
      friendly ? [8, site.id, 0, 1] : [3, outside.x, outside.y, 1])
  }
})
