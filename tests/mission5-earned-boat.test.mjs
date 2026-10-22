import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import { scalableReferenceIds } from './helpers/scalable-reference-ids.mjs'
// Genuine campaign inputs: earn Convert, occupy the authored Tower, convert a
// wild follower near the disconnected head, then earn and board the linked Boat.
import test from 'node:test'
import assert from 'node:assert/strict'
import { browserPosition, cast, command, selectUnit, supportsFollower, tick } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { spellInRange, spellRange } from '../app/spell-casting.ts'
import { vehicleReady } from '../app/vehicle-routing.ts'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

const referenceId = scalableReferenceIds(5)

test('earned Mission5 Boat is allocated, retires its template, and boards a real converted follower', async () => {
  await loadSceneFixture()
  const { skipIntroduction } = await import('../app/scene-camera-runtime.ts')
  const store = await createCampaignFixtureStore([5])
  assert.equal(store.startMission(5), true)
  const world = store.getWorld(),
    warrior = world.units.find(u => u.id === 112),
    head = world.shrines.find(s => s.kind === 'boat'),
    convertHead = world.shrines.find(s => s.kind === 'convertWild'),
    source = world.vehicles.find(v => v.id === head.rewardVehicle)
  // Authored source100/head101 map to runtime97/98.
  assert.deepEqual([source.id, head.id], [97, 98])
  while (!(world.flyby.flags & 1) && world.turn < 40) tick(world, 1 / 12)
  assert.ok(world.flyby.warmup > 0)
  skipIntroduction({ world, flybyCamera: { x: 0, y: 0, angle: 0, zoom: 0 }, onChange() {} })
  assert.equal(world.inputMask, 0)
  selectUnit(world, warrior.id, false)
  assert.ok(command(world, { ...head, id: head.id }))
  assert.equal(currentPersonOrder(world.buildingOrders, warrior.native), undefined)
  assert.match(world.message, /No land route/i)
  assert.ok(command(world, { ...convertHead, id: convertHead.id }))
  assert.equal(currentPersonOrder(world.buildingOrders, warrior.native)?.model, 27)
  while (!world.shots.convertWild && world.turn < 1500) tick(world, 1 / 12)
  assert.equal(world.turn, 326)
  assert.ok(world.shots.convertWild > 0)

  const shaman = world.units.find(u => u.id === 111),
    tower = world.buildings.find(b => b.id === 96)
  selectUnit(world, shaman.id, false)
  assert.ok(command(world, { ...tower, id: tower.id }))
  while (shaman.inside !== tower.id && world.turn < 2000) tick(world, 1 / 12)
  assert.deepEqual([world.turn, shaman.inside], [592, tower.id])
  const wild = world.units.find(u => u.id === 107 && u.team === 'wild')
  assert.ok(wild)
  assert.ok(spellRange(world, shaman, 17) > 48)
  assert.ok(spellInRange(world, shaman, 17, wild))
  selectUnit(world, shaman.id, false)
  assert.ok(cast(world, 'convertWild', { x: wild.x, z: wild.z }))
  while (!world.units.some(u => u.team === 'blue' && u.kind === 'brave') && world.turn < 800)
    tick(world, 1 / 12)
  const actor = world.units
    .filter(u => u.team === 'blue' && u.kind === 'brave')
    .sort(
      (a, b) => Math.hypot(a.x - head.x, a.z - head.z) - Math.hypot(b.x - head.x, b.z - head.z)
    )[0]
  assert.deepEqual([world.turn, actor.id], [612, referenceId(339)])
  selectUnit(world, actor.id, false)
  assert.ok(command(world, { ...head, id: head.id }))
  const worship = currentPersonOrder(world.buildingOrders, actor.native)
  assert.equal(worship.model, 27)
  const worshipId =
    actor.native.immediateCommand || actor.native.commands[actor.native.commandCursor]
  while (world.turn < 715) tick(world, 1 / 12)
  assert.deepEqual(
    [
      head.uses,
      head.work,
      source.active,
      source.speed,
      source.counter,
      world.vehicleAllocationSeed,
    ],
    [0, 19, false, 0, 0, 1]
  )
  assert.deepEqual(
    world.vehicles.map(v => v.id),
    [97]
  )

  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const restored = store.getWorld()
  assert.deepEqual(restored, world)
  const step = () => {
    tick(world, 1 / 12)
    tick(restored, 1 / 12)
    assert.deepEqual(restored, world)
  }
  step()
  const boat = world.vehicles.find(v => v.active && v.model === 1)
  assert.ok(boat)
  assert.deepEqual(
    [boat.id, boat.x, boat.y, boat.counter, boat.life, boat.speed, world.vehicleAllocationSeed],
    [referenceId(489), 58340, 12314, 1, 4999, 0, 2]
  )
  assert.deepEqual(boat.rewardInitialization, {
    state: 1,
    counter: 1,
    direction: 0,
    emptyTemplate: true,
  })
  assert.equal(world.vehicles.includes(source), false)
  assert.equal(world.shrines.includes(head), false)
  assert.ok(vehicleReady(world.land, { ...boat }))
  step()
  assert.deepEqual([boat.counter, boat.life], [2, 4998])
  assert.equal(worship.references, 0)
  const retiredOwners = world.units.flatMap(unit =>
    [unit.native, unit.entry?.person, unit.flight, unit.fight?.motion]
      .filter(Boolean)
      .filter(owner => owner.immediateCommand === worshipId || owner.commands?.includes(worshipId))
  )
  assert.deepEqual(retiredOwners, [])
  const pendingHeads = [...world.shrines],
    seenHeads = new Set()
  for (const retained of pendingHeads) {
    if (seenHeads.has(retained)) continue
    seenHeads.add(retained)
    assert.notEqual(retained.id, head.id)
    assert.notEqual(retained.rewardVehicle, source.id)
    if (retained.linkedShrine) pendingHeads.push(retained.linkedShrine)
  }
  for (const state of [world, restored]) {
    selectUnit(state, actor.id, false)
    assert.ok(command(state, { ...browserPosition(boat), id: boat.id }))
  }
  assert.deepEqual(restored, world)
  const person = actor.native,
    boarding = currentPersonOrder(world.buildingOrders, person)
  assert.equal(boarding.model, 22)
  while (!boat.passengers.includes(actor.id) && world.turn < 1700) step()
  assert.equal(world.turn, 754)
  assert.equal(actor.native, person)
  assert.equal(world.objectCells.objects.get(actor.id), person)
  assert.deepEqual([boat.passengerCount, person.vehicle], [1, boat.id])
  for (let i = 0; i < 120; i++) step()
  assert.equal(actor.native, person)
  assert.equal(world.objectCells.objects.get(actor.id), person)
  assert.ok(actor.hp > 0)
  assert.deepEqual([worship.references, boarding.references, person.vehicle], [0, 0, boat.id])
  assert.deepEqual(boat.passengers, [actor.id])
  assert.equal(world.vehicles.length, 1, 'retired source cannot grant again')
  const origin = browserPosition(boat),
    dispatch = point => {
      for (const state of [world, restored]) {
        selectUnit(state, actor.id, false)
        assert.ok(command(state, point))
      }
      assert.deepEqual(restored, world)
      return currentPersonOrder(world.buildingOrders, actor.native)
    }
  const sail = dispatch({ x: -33, z: -53 })
  assert.equal(sail.model, 3)
  for (let i = 0; i < 24; i++) step()
  assert.deepEqual([world.turn, boat.x, boat.y], [898, 59042, 11603])
  assert.equal(actor.native, person)
  assert.equal(world.objectCells.objects.get(actor.id), person)
  assert.equal(person.vehicle, boat.id)
  const back = dispatch(origin)
  // Native plain completion retains the passenger; the old whole-crew adapter
  // ejected at904 and stranded an unready craft. Requalify actual arrival first.
  while (
    (currentPersonOrder(world.buildingOrders, person) || boat.speed > 0) &&
    actor.hp > 0 &&
    world.turn < 1498
  )
    step()
  assert.equal(world.turn, 916)
  assert.deepEqual(
    [boat.x, boat.y, boat.speed, person.state, person.commandStatus],
    [58624, 12032, 0, 30, 0]
  )
  assert.equal(person.vehicle, boat.id)
  assert.deepEqual(boat.passengers, [actor.id])
  assert.deepEqual([sail.references, back.references], [0, 0])
  assert.equal(currentPersonOrder(world.buildingOrders, person), undefined)
  assert.equal(actor.hp, 50)
  // A separate ordinary dry-land route takes the existing route-ground-leg
  // departure. No boat/actor position, passenger, order or terrain fields change.
  const shore = { x: -39, z: -59 }
  assert.ok(supportsFollower(world, shore))
  const land = dispatch(shore)
  const launches = []
  while ((person.vehicle || actor.flight) && actor.hp > 0 && world.turn < 1498) {
    const wasSeated = person.vehicle,
      before = { x: actor.x, z: actor.z }
    step()
    assert.ok(Math.hypot(actor.x - before.x, actor.z - before.z) < 2)
    if (wasSeated && !person.vehicle) {
      assert.equal(actor.flight, person)
      assert.equal(actor.lift, 1)
      launches.push(world.turn)
    }
  }
  assert.deepEqual(launches, [922])
  assert.equal(world.turn, 926)
  assert.equal(actor.native, person)
  assert.equal(world.objectCells.objects.get(actor.id), person)
  assert.equal(actor.hp, 50)
  assert.ok(supportsFollower(world, actor))
  assert.equal(person.vehicle, 0)
  assert.equal(actor.flight, undefined)
  assert.equal(boat.passengerCount, 0)
  assert.ok(boat.passengers.every(id => !id))
  assert.ok(vehicleReady(world.land, boat))
  const reboard = dispatch({ ...browserPosition(boat), id: boat.id })
  assert.equal(reboard.model, 22)
  while (!person.vehicle && actor.hp > 0 && world.turn < 1600) step()
  assert.equal(world.turn, 927)
  assert.deepEqual(boat.passengers, [actor.id])
  assert.equal(person.vehicle, boat.id)
  assert.equal(actor.hp, 50)
  assert.equal(actor.native, person)
  assert.equal(world.objectCells.objects.get(actor.id), person)
  assert.equal(land.references, 0)
})
