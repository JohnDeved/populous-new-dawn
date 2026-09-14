import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { missionEnemyTribe } from '../app/mission-data.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { buildingFootprintCells, buildingModel, buildingPose } from '../app/building-shapes.ts'

test('Mission 5 runs its imported opening flyby once through ordinary turns', () => {
  const world = createWorld(5)
  assert.equal(world.inputMask, 128)
  assert.equal(world.ai.variables[10], 1)

  for (let turn = 0; turn < 15; turn++) tick(world, 1 / 12)
  assert.equal(world.flyby.flags & 1, 0)
  assert.equal(world.inputMask, 128)

  tick(world, 1 / 12)
  assert.equal(world.turn, 16)
  assert.equal(world.flyby.flags & 1, 1)
  assert.equal(world.inputMask, 64)
  assert.equal(world.flyby.warmup, 6)
  assert.deepEqual(
    world.flyby.events.map(({ kind, flags, value, start, duration }) => [
      kind,
      flags,
      value,
      start,
      duration,
    ]),
    [
      [1, 0, 33446, 1, 10], [2, 0, 300, 1, 60], [3, 0, 204, 1, 50],
      [1, 0, 5338, 51, 40], [3, 0, 65460, 55, 70], [2, 0, 1996, 61, 40],
      [1, 0, 15062, 110, 30], [2, 0, 300, 130, 45], [3, 0, 204, 130, 55],
      [3, 0, 0, 190, 30], [2, 0, 1500, 190, 30], [1, 0, 254, 190, 30],
    ]
  )
  assert.deepEqual(world.flyby.end, { x: 254, y: 0, angle: 1500, zoom: 0 })
  assert.equal(world.ai.variables[10], 2)

  const events = world.flyby.events
  for (let turn = 0; turn < 2048; turn++) tick(world, 1 / 12)
  assert.equal(world.flyby.events, events)
  assert.equal(world.flyby.events.length, 12)
})

test('Mission 5 launches its surviving Dakini at the player Shaman', () => {
  const world = createWorld(5), enemy = missionEnemyTribe(5)
  for (let turn = 0; turn < 16; turn++) tick(world, 1 / 12)
  const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
    red = world.units.filter(unit => unit.team === 'red'),
    survivors = [red.at(-1), ...red.slice(0, 6)],
    survivorIds = new Set(survivors.map(unit => unit.id)),
    attacker = survivors.find(unit => unit.kind === 'warrior')
  world.units = world.units.filter(unit => unit.team !== 'red' || survivorIds.has(unit.id))
  world.buildings = world.buildings.filter(building => building.team !== 'red')
  Object.assign(attacker, { x: shaman.x - 12, z: shaman.z })
  attacker.native = undefined
  world.killCredits[0][enemy] = 11
  const initialDistance = Math.hypot(attacker.x - shaman.x, attacker.z - shaman.z)

  for (let turn = 0; turn < 64 && !(world.manaTribes[enemy].flags2 & 0x40); turn++)
    tick(world, 1 / 12)
  assert.ok(world.manaTribes[enemy].flags2 & 0x40)
  for (const unit of survivors) {
    assert.equal(unit.target, shaman.id)
    assert.equal(currentPersonOrder(world.buildingOrders, unit.native)?.model, 28)
  }
  for (let turn = 0; turn < 120 && !attacker.fight && Math.hypot(attacker.x - shaman.x, attacker.z - shaman.z) >= initialDistance; turn++)
    tick(world, 1 / 12)
  assert.ok(attacker.fight || Math.hypot(attacker.x - shaman.x, attacker.z - shaman.z) < initialDistance)
})

test('Mission 5 staffs its original Dakini tower with a Preacher', () => {
  const world = createWorld(5),
    cell = ((178 & 254) >>> 1) * 128 + ((194 & 254) >>> 1),
    tower = world.buildings.find(building =>
      building.team === 'red' &&
      buildingModel(building) === 4 &&
      buildingFootprintCells(buildingPose(building)).includes(cell)
    )
  assert.ok(tower)
  for (let turn = 0; turn < 256 && !world.ai.tasks.some(task => task.flags & 1 && task.target === tower.id); turn++)
    tick(world, 1 / 12)
  const task = world.ai.tasks.find(task => task.flags & 1 && task.target === tower.id)
  assert.equal(task?.requested, 4)
  for (let turn = 0; turn < 128 && !world.units.some(unit => unit.inside === tower.id); turn++)
    tick(world, 1 / 12)
  const occupant = world.units.find(unit => unit.inside === tower.id)
  assert.deepEqual([occupant?.team, occupant?.kind], ['red', 'preacher'])
})
