import assert from 'node:assert/strict'
import test from 'node:test'
import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import { addBuilding, addUnit, command, tick } from '../app/model.ts'
import { createLivePerson, registerLivePerson, leaveLiveBuilding } from '../app/live-people.ts'
import { currentPersonOrder, emptyPersonOrder } from '../app/person-orders.ts'
import { appendLiveOrders } from '../app/live-movement.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { residentPerson } from '../app/building-resident.ts'

// Supplied unobstructed mechanics fixture; orders always enter through the
// public player command. The ordinary Mission 3 route is a separate witness.
function scenario(kind = 'camp', count = 8, team = 'blue', mission = 1) {
  const w = createStartedWorld(mission)
  retainFixtureUnits(w, u => u.kind === 'shaman')
  w.manaWorld.gameFlags = 32
  w.terrain.fill(3)
  w.terrainVersion++
  const b = addBuilding(w, team, kind, { x: -2, z: 32 }, true)
  const units = Array.from({ length: count }, (_, i) =>
    addUnit(w, team, 'brave', { x: 7 + i * 0.4, z: 33 })
  )
  const people = units.map(u => {
    u.native = createLivePerson(w, u)
    registerLivePerson(w, u.native)
    return u.native
  })
  w.selected = units.map(u => u.id)
  return { w, b, units, people }
}

function assertShared(w, b, units, people) {
  const id = people[0].commands[people[0].commandCursor]
  assert.ok(id, 'the player click attaches the training order immediately')
  assert.ok(people.every(p => p.commands[p.commandCursor] === id))
  assert.equal(w.buildingOrders.records[id].model, 8)
  assert.equal(w.buildingOrders.records[id].a, b.id)
  assert.equal(w.buildingOrders.records[id].references, units.length)
  for (const [index, u] of units.entries()) {
    assert.equal(u.entry?.person, people[index])
    assert.equal(w.objectCells.objects.get(u.id), people[index])
    assert.equal(u.entry.orders, w.buildingOrders)
    assert.equal(u.work, b.id)
  }
  return id
}

test('one ordinary group training click shares one immediately attached registered owner record', () => {
  for (const kind of ['camp', 'temple', 'spyHut', 'firewarriorHut']) {
    const { w, b, units, people } = scenario(kind)
    const cursor = w.buildingOrders.cursor
    assert.equal(command(w, b), true)
    const id = assertShared(w, b, units, people)
    assert.equal(id, cursor)
    assert.equal(w.buildingOrders.cursor, cursor + 1)
    assert.equal(w.buildingOrders.active, 1)
    tick(w, 1 / 12)
    assertShared(w, b, units, people)
    assert.equal(w.buildingOrders.active, 1, 'entry must not allocate per follower')
  }
})

test('AI Hut admission keeps its existing empty-order adapter lifetime', () => {
  const { w, b, units: [u], people: [p] } = scenario('hut', 1, 'yellow'),
    order = { ...emptyPersonOrder(), model: 8, a: b.id }
  // The normal computer task caller uses appendLiveOrders, not player replacement.
  assert.deepEqual(appendLiveOrders(w, [u], order, true), { accepted: true, count: 1 })
  const id = p.commands[p.commandCursor]
  until(w, () => u.inside === b.id)
  assert.equal(currentPersonOrder(w.buildingOrders, p), undefined)
  assert.equal(w.buildingOrders.records[id].references, 0)
  assert.equal(u.entry, undefined)
  assert.equal(u.native, null, 'fresh Hut admission must not retain a new empty-order native adapter')
  assert.equal(u.resident?.person, p)
  assert.equal(b.admission.occupants[u.resident.slot], u.id)
  tick(w, 1 / 12)
  assert.equal(u.inside, b.id)
  assert.equal(w.objectCells.objects.has(u.id), false)
})

test('one remaining command slot accepts the complete ordinary training group', () => {
  const { w, b, units, people } = scenario()
  for (let id = 1; id < 799; id++) w.buildingOrders.records[id].references = 1
  w.buildingOrders.active = 798
  assert.equal(command(w, b), true)
  assert.equal(assertShared(w, b, units, people), 799)
  assert.equal(w.buildingOrders.active, 799)
})

test('an exhausted ordinary training click has no deferred allocation retry', () => {
  const { w, b, units, people } = scenario()
  for (let id = 1; id < 800; id++) w.buildingOrders.records[id].references = 1
  w.buildingOrders.active = 799
  assert.equal(command(w, b), true)
  assert.equal(w.message, 'No command slots available.')
  assert.ok(units.every(u => u.work === null && !u.entry))
  assert.ok(people.every(p => !currentPersonOrder(w.buildingOrders, p)))
  w.buildingOrders.records[799].references = 0
  w.buildingOrders.active--
  for (let i = 0; i < 8; i++) tick(w, 1 / 12)
  assert.ok(units.every(u => u.work === null && !u.entry))
  assert.equal(w.buildingOrders.records[799].references, 0)
  assert.equal(w.buildingOrders.active, 798)
})

test('ordinary training cancels all selected queues before eligibility and before allocating', () => {
  const { w, b, units, people } = scenario('camp', 2)
  // This supplied command-ineligible model owns the only releasable slot.
  // The packet clears it even though it will not receive command 8.
  const wildman = addUnit(w, 'wild', 'brave', { x: 10, z: 33 }),
    p = (wildman.native = createLivePerson(w, wildman))
  registerLivePerson(w, p)
  for (let id = 1; id < 800; id++) w.buildingOrders.records[id].references = 1
  w.buildingOrders.active = 799
  Object.assign(w.buildingOrders.records[123], { model: 3, a: 1000, b: 1000 })
  p.commands[0] = 123
  p.commandStatus = 3
  w.selected.push(wildman.id)
  assert.equal(command(w, b), true)
  assert.equal(assertShared(w, b, units, people), 123)
  assert.equal(currentPersonOrder(w.buildingOrders, p), undefined)
  assert.equal(wildman.entry, undefined)
  assert.equal(wildman.work, null)
  assert.equal(w.buildingOrders.active, 799)
})

test('full after selected cancellation reports failure and does not keep the old order', () => {
  const { w, b, units, people } = scenario('camp', 1)
  for (let id = 1; id < 800; id++) w.buildingOrders.records[id].references = 1
  w.buildingOrders.active = 799
  Object.assign(w.buildingOrders.records[123], { model: 3, references: 2 })
  people[0].commands[0] = 123
  people[0].commandStatus = 3
  assert.equal(command(w, b), true)
  assert.equal(w.buildingOrders.records[123].references, 1, 'the unselected owner retains its reference')
  assert.equal(currentPersonOrder(w.buildingOrders, people[0]), undefined)
  assert.equal(w.message, 'No command slots available.')
  assert.equal(units[0].work, null)
  assert.equal(units[0].entry, undefined)
})

test('blocked prior entry with an exhausted pool detaches its empty order without initialization or retry', () => {
  const { w, b, units, people } = scenario()
  command(w, b)
  const shared = assertShared(w, b, units, people)
  until(w, () => b.admission?.inside === 5 && people.every(p => !p.speed))
  const queued = () => {
    const ids = []
    for (let id = b.admission.queueHead; id; ) {
      assert.ok(!ids.includes(id))
      ids.push(id)
      id = units.find(unit => unit.id === id).entry.person.reservationNext
    }
    return ids
  }
  const queueBefore = queued(),
    u = units.find(unit => unit.id === queueBefore[0]), p = u.entry.person,
    before = [p.state, p.previousState, p.substate, p.counter]
  p.flags2 |= 0x100000
  for (let id = 1; id < 800; id++)
    if (!w.buildingOrders.records[id].references) w.buildingOrders.records[id].references = 1
  w.buildingOrders.active = 799
  w.selected = [u.id]
  command(w, b)
  assert.equal(w.message, 'No command slots available.')
  assert.equal(w.buildingOrders.records[shared].references, 7)
  assert.equal(u.entry, undefined, 'an empty training queue must not remain dispatchable')
  assert.equal(u.work, null)
  assert.equal(u.native, p)
  assert.deepEqual([p.state, p.previousState, p.substate, p.counter], before)
  assert.equal(p.flags3 & 32, 0, 'physical queue cleanup preserves the other waiting followers')
  assert.deepEqual(queued(), queueBefore.slice(1))
  const free = shared === 799 ? 798 : 799
  w.buildingOrders.records[free].references = 0
  w.buildingOrders.active--
  for (let i = 0; i < 8; i++) tick(w, 1 / 12)
  assert.equal(u.entry, undefined)
  assert.equal(u.work, null)
  assert.equal(currentPersonOrder(w.buildingOrders, p), undefined)
  assert.equal(w.buildingOrders.records[free].references, 0)
})

test('training replaces registered fight, flight and blocked queues without restarting their motion', () => {
  const { w, b, units, people } = scenario('camp', 3)
  people[0].state = 25
  units[0].fight = { motion: people[0], group: 0, started: w.turn, opponent: 0 }
  people[1].state = 29
  units[1].flight = people[1]
  people[2].flags2 |= 0x100000
  people[2].motionTimer = 123
  people[2].motionMode = 3
  // A stale native alias must not displace the registered fight/flight owner.
  units[0].native = createLivePerson(w, units[0])
  units[1].native = createLivePerson(w, units[1])
  const motion = p => [p.state, p.substate, p.speed, p.x, p.y, p.h, p.object, p.frame],
    before = people.map(motion)
  assert.equal(command(w, b), true)
  const id = people[0].commands[0]
  assert.ok(id)
  assert.ok(people.every(p => p.commands[0] === id))
  assert.equal(w.buildingOrders.records[id].references, 3)
  assert.deepEqual(people.map(motion), before)
  assert.equal(people[2].motionTimer, 0, 'blocked people still receive the packet motion reset')
  assert.equal(people[2].motionMode, 0)
  assert.equal(units[0].fight.motion, people[0])
  assert.equal(units[1].flight, people[1])
  assert.equal(units[0].native, null)
  assert.equal(units[1].native, null)
  assert.ok(units.every(u => !u.entry && u.work === null))
  assert.ok(people.every(p => w.objectCells.objects.get(p.id) === p))
})

test('ordinary training restarts selected state14 through the packet previous-state zero', () => {
  const { w, b, units, people } = scenario('camp', 1)
  people[0].state = 14
  people[0].previousState = 17
  command(w, b)
  assertShared(w, b, units, people)
  assert.equal(people[0].state, 10)
  assert.equal(people[0].previousState, 0)
  assert.equal(people[0].substate, 0, 'input starts the order without visiting its training controller')
  assert.equal(b.admission, undefined, 'input does not perform admission')
})

function until(w, predicate, limit = 500) {
  for (let i = 0; !predicate() && i < limit; i++) tick(w, 1 / 12)
  assert.ok(predicate(), 'training lifecycle condition must be reached')
}

test('reissuing training retains approaching, waiting and resident owners without duplicating references', () => {
  const { w, b, units, people } = scenario()
  command(w, b)
  const first = assertShared(w, b, units, people)
  command(w, b)
  const second = assertShared(w, b, units, people)
  assert.equal(w.buildingOrders.records[first].references, 0)
  assert.notEqual(second, first)
  until(w, () => b.admission?.inside === 5 && people.every(p => !p.speed))
  const occupants = b.admission.occupants.slice()
  command(w, b)
  assertShared(w, b, units, people)
  assert.deepEqual(b.admission.occupants, occupants)
  assert.equal(w.buildingOrders.active, 1)
  for (let i = 0; i < 8; i++) tick(w, 1 / 12)
  // The native command-8 controller completes a reissued order for someone
  // already inside that same target; occupancy and waiting successors remain.
  const waiting = units.filter(u => u.inside === null),
    waitingPeople = waiting.map(u => people[units.indexOf(u)])
  assertShared(w, b, waiting, waitingPeople)
  assert.ok(units.filter(u => u.inside === b.id).every(u =>
    u.native === people[units.indexOf(u)] && !currentPersonOrder(w.buildingOrders, u.native)
  ))
  assert.deepEqual(b.admission.occupants, occupants)
})

test('checkpoint preserves shared training aliases and cancellation releases only the selected member', () => {
  for (const occupied of [false, true]) {
    const { w, b, units, people } = scenario()
    command(w, b)
    const id = assertShared(w, b, units, people)
    if (occupied) until(w, () => b.admission?.inside === 5 && people.every(p => !p.speed))
    const restored = migrateCheckpoint(structuredClone(w))
    for (const world of [w, restored]) {
      const school = world.buildings.find(target => target.id === b.id),
        group = world.units.filter(u => units.some(source => source.id === u.id)),
        owners = group.map(u => u.entry.person)
      assertShared(world, school, group, owners)
      const leaving = group.find(u => u.inside === null)
      world.selected = [leaving.id]
      command(world, { x: 9, z: 30 })
      assert.equal(world.buildingOrders.records[id].references, 7)
      assert.equal(leaving.entry, undefined)
      assert.equal(world.buildingOrders.active, 2)
      for (let i = 0; i < 10; i++) tick(world, 1 / 12)
    }
    assert.deepEqual(restored.buildingOrders, w.buildingOrders)
    assert.equal(restored.randomState, w.randomState)
  }
})

test('death and target destruction release the shared ordinary training references exactly once', () => {
  for (const occupied of [false, true]) {
    const { w, b, units, people } = scenario()
    command(w, b)
    const id = assertShared(w, b, units, people)
    if (occupied) until(w, () => b.admission?.inside === 5 && people.every(p => !p.speed))
    units.find(u => u.inside === null).hp = 0
    tick(w, 1 / 12)
    assert.equal(w.buildingOrders.records[id].references, 7)
    b.hp = 0
    until(w, () => w.buildingOrders.records[id].references === 0)
    assert.equal(w.buildingOrders.active, 0)
    for (let i = 0; i < 8; i++) tick(w, 1 / 12)
    assert.equal(w.buildingOrders.records[id].references, 0)
  }
})


test('legacy computer-team checkpoint migration retags a valid passive admitted person', () => {
  const { w, b, units: [u], people: [p] } = scenario('hut', 1, 'green', 2)
  assert.deepEqual(appendLiveOrders(w, [u], { ...emptyPersonOrder(), model: 8, a: b.id }, true),
    { accepted: true, count: 1 })
  until(w, () => u.inside === b.id)
  assert.equal(u.resident.person, p)
  const old = structuredClone(w), resident = old.units.find(unit => unit.id === u.id),
    saved = resident.resident.person, slots = old.buildings.find(building => building.id === b.id).admission.occupants.slice()
  // Old single-computer saves stored the mission's green tribe as red/1.
  for (const entity of [...old.units, ...old.buildings]) if (entity.team === 'green') entity.team = 'red'
  saved.tribe = 1
  saved.damageAttacker = 1
  delete old.campaignAIs
  assert.equal(residentPerson(old, resident), saved)
  migrateCheckpoint(old)
  assert.equal(resident.team, 'green')
  assert.equal(saved.tribe, 3)
  assert.equal(saved.damageAttacker, 3)
  assert.equal(residentPerson(old, resident), saved)
  assert.deepEqual(old.buildings.find(building => building.id === b.id).admission.occupants, slots)
  assert.equal(leaveLiveBuilding(old, resident), saved)
  assert.equal(resident.resident, undefined)
})
