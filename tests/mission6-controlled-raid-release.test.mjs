import assert from 'node:assert/strict'
import test from 'node:test'
import { createGameStore } from '../app/game-store.ts'
import { tick } from '../app/model.ts'
import { requestAttack } from '../app/computer.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { nativePosition } from '../app/world-terrain-runtime.ts'

// Fresh shipping world with a controlled current ATTACK producer request, not
// an authored campaign journey or original-runtime measurement. Actors, HP,
// population, terrain, clocks and RNG are never injected. The real dispatcher
// selects its crew; both current marker fields are explicitly present.
test('current controlled Mission6 raid releases blocked owners and checkpoint references', async () => {
  const store = createGameStore()
  store.startMission(6)
  assert.equal(store.getWorld().capacityPolicy.mode, 'scalable')
  assert.ok(store.getWorld().objectCells.heads instanceof Float64Array)
  const world = store.getWorld(), ai = world.campaignAIs[3]
  for (let turn = 0; turn < 1024 && !(ai.states & (1 << 20)); turn++) tick(world, 1 / 12)
  assert.ok(ai.states & (1 << 20), 'ordinary initialization enables the current producer')
  const blue = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman' && unit.hp > 0)
  assert.ok(blue)
  const position = nativePosition(world, blue),
    target = ((position.x >>> 8) & 254) | (position.y & 0xfe00),
    index = ai.tasks.findIndex(task => !(task.flags & 1))
  assert.ok(index >= 0)
  requestAttack(ai, target, 0, 5, 128, [80, 0, 0, 0, 0, 20], ai.attributes[28],
    !!(ai.states & (1 << 20)), 3, 0, [], { staging: -1, spell: -1 })
  const task = ai.tasks[index]
  assert.equal(task.type, 20)
  assert.ok(task.flags & 1)
  assert.deepEqual([task.stagingMarker, task.spellMarker], [-1, -1])
  assert.deepEqual(task.spells, [0, 0, 0])
  const phaseLimit = world.turn + 4096
  while (world.turn < phaseLimit && task.phase !== 9 && task.flags & 1) tick(world, 1 / 12)
  assert.equal(task.phase, 9)
  // Capture the admitted input cohort BEFORE phase9 publishes the shared order.
  // Generated IDs are not copied from the transition output or hard-coded.
  const owners = task.members.map(id => {
    const unit = world.units.find(candidate => candidate.id === id),
      person = world.objectCells.objects.get(id)
    assert.ok(unit && unit.hp > 0 && person)
    assert.equal(unit.native, person)
    return { id, unit, person, hp: unit.hp }
  })
  assert.equal(owners.length, 5, 'four ordinary Braves plus the selected Shaman')
  assert.deepEqual(owners.map(({ unit }) => unit.kind), ['brave', 'brave', 'brave', 'brave', 'shaman'])
  while (world.turn < phaseLimit && task.phase === 9) tick(world, 1 / 12)
  assert.equal(task.phase, 10)
  assert.deepEqual(task.members, owners.map(({ id }) => id))
  const first = owners[0].person,
    orderId = first.immediateCommand || first.commands[first.commandCursor],
    order = world.buildingOrders.records[orderId]
  assert.equal(order.model, 3)
  assert.equal(order.references, owners.length)
  assert.deepEqual([order.a, order.b], [((target & 254) << 8) + 128, (target & 0xfe00) + 128])
  for (const { id, unit, person } of owners) {
    assert.equal(world.units.find(candidate => candidate.id === id), unit)
    assert.equal(world.objectCells.objects.get(id), person)
    assert.equal(currentPersonOrder(world.buildingOrders, person), order)
  }
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const replay = store.getWorld()
  assert.deepEqual(replay, world)
  assert.deepEqual([replay.campaignAIs[3].tasks[index].stagingMarker,
    replay.campaignAIs[3].tasks[index].spellMarker], [-1, -1])
  const released = new Set(), releaseLimit = world.turn + 512
  const advance = () => {
    const before = task.members.map(id => {
      const person = world.objectCells.objects.get(id)
      return { id, state: person.state, substate: person.substate, animationMode: person.animationMode }
    })
    tick(world, 1 / 12)
    tick(replay, 1 / 12)
    assert.deepEqual(replay, world)
    for (const { id, unit, person, hp } of owners) {
      assert.equal(world.units.find(candidate => candidate.id === id), unit)
      assert.equal(unit.hp, hp)
      assert.equal(unit.native, person)
      assert.equal(world.objectCells.objects.get(id), person)
      assert.equal(replay.objectCells.objects.get(id), replay.units.find(candidate => candidate.id === id).native)
    }
    for (const person of before) if (!task.members.includes(person.id)) {
      assert.equal(person.state, 33, 'the real blocked route reaches state33 before release')
      assert.ok(person.substate === 3 || (person.substate === 2 && person.animationMode > 4))
      assert.ok(!released.has(person.id), 'each admitted owner is released once')
      released.add(person.id)
    }
    assert.equal(order.references, owners.length - released.size)
  }
  while (world.turn < releaseLimit && task.phase !== 23) advance()
  assert.equal(task.phase, 23)
  assert.deepEqual(task.members, [])
  assert.deepEqual([...released].sort((a, b) => a - b), owners.map(({ id }) => id).sort((a, b) => a - b))
  assert.equal(order.references, 0)
  for (const { id, unit, person, hp } of owners) {
    assert.equal(world.units.find(candidate => candidate.id === id), unit)
    assert.equal(unit.hp, hp)
    assert.equal(unit.native, person)
    assert.equal(world.objectCells.objects.get(id), person)
    assert.ok(!person.commands.includes(orderId))
    assert.notEqual(person.immediateCommand, orderId)
    assert.equal(currentPersonOrder(world.buildingOrders, person), undefined)
  }
  while (world.turn < releaseLimit && task.flags & 1) advance()
  assert.equal(task.flags & 1, 0)
  assert.equal(order.references, 0)
  assert.equal(world.stats.bridges, 0, 'this controlled failed route does not create a land connection')
})
