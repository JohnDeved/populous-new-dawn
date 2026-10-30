import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import { stagedCheckpointComparisonView, assertStagedCheckpointComparisonDomain } from './helpers/staged-checkpoint-comparison-view.mjs'
import {
  seatedAttackOrigin,
  boundedGroundAttackDeparture,
} from './helpers/seated-attack-origin.mjs'
import { settleRouteLaunch } from './helpers/route-launch-landing.mjs'
// Campaign setup supplies spell-focus masks; actors, charges and travel evolve through actual ticks.
import { vehicleReady } from '../app/vehicle-routing.ts'
import { reachMission22FlightPoint } from './helpers/mission22-flight-phase.mjs'
// Staged transport waypoint completion preserves the shared queue and seated owner.
import test from 'node:test'
import { loadHistoricalStaged } from './helpers/historical-mission22-staged.mjs'
import { stepLiveOrderQueue } from '../app/live-movement.ts'
import { boardLiveVehicle, vehicleExit } from '../app/live-vehicles.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { currentPersonOrder } from '../app/person-orders.ts'

import assert from 'node:assert/strict'
import {
  addUnit,
  browserPosition,
  cast,
  command,
  tick,
  selectUnit,
  supportsFollower,
} from '../app/model.ts'
const stepUntil = (w, done, limit) => {
    for (let i = 0; i < limit; i++) {
      tick(w, 1 / 12)
      if (done()) return
    }
    throw Error('timed out ' + w.turn)
  },
  focusCharging = (w, m) => {
    w.charging = true
    w.manaWorld.spells[0].disabled = 0xffffffff & ~(1 << (m - 1))
  },
  moveShaman = (w, s, p) => {
    selectUnit(w, s.id, false)
    assert.ok(command(w, p))
    stepUntil(w, () => Math.hypot(s.x - p.x, s.z - p.z) < 2, 1000)
  }
// Preparation supplies only the existing mana-focus mask adapter.
// Historical pins belong to the complete original3566 input. Its later idle
// combat outcome is covered by the independent complete3916 predeath witness.
const historicalPins = {
  input: [3566, 238],
  waypointCounters: [44, 124],
  retirements: [3628, 3708],
  idle: {
    acquisitionOnly: true,
    turn: 3653,
    settledPose: [16128, 32512, 44],
    events: [3881, 3886, 17],
  },
  successor: {
    references: [[3625, [1, 2]], [3628, [0, 2]], [3683, [0, 1]], [3878, [0, 0]]],
    firstRetirementTurn: 3625,
    firstRetirementCounters: [41, 112],
    firstRetirementModels: [3, 27],
    waitingActor: 1,
    secondRetirementTurn: 3628,
    secondRetirementCounters: [44, 115],
    seatTransferTurn: 3656,
    seatTransferCounters: [72, 143],
    emptyTurn: 3657,
    emptyCounters: [73, 144],
  },
}
const freshPins = {
  input: [3555, 227],
  waypointCounters: [32, 108],
  retirements: [3616, 3692],
  idle: {
    acquisitionOnly: false,
    turn: 3643,
    settledPose: [16128, 32512, 32],
    events: [3871, 3876, 10, 3979],
    retainedLife: 179, // Qualified browser-owned lethal damage retains last positive native life.
  },
  successor: {
    references: [[3616, [1, 2]], [3617, [0, 2]], [3673, [0, 1]], [3862, [0, 0]]],
    firstRetirementTurn: 3616,
    firstRetirementCounters: [32, 103],
    firstRetirementModels: [27, 3],
    waitingActor: 0,
    secondRetirementTurn: 3617,
    secondRetirementCounters: [33, 104],
    seatTransferTurn: 3645,
    seatTransferCounters: [61, 132],
    emptyTurn: 3646,
    emptyCounters: [62, 133],
  },
}

async function prepareFreshFlightPoint() {
  const store = await createCampaignFixtureStore([22])
  assert.equal(store.startMission(22), true)
  let world = store.getWorld(),
    shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
    balloon = world.vehicles.find(vehicle => vehicle.model === 3),
    boat = world.vehicles.find(vehicle => vehicle.model === 1),
    south = world.shrines.find(shrine => shrine.rewardMana === 600_000)

  focusCharging(world, 5)
  stepUntil(world, () => world.shots.swarm > 0, 1_500)
  moveShaman(world, shaman, { x: 0, z: -45 })
  moveShaman(world, shaman, { x: 20, z: -45 })
  assert.ok(cast(world, 'swarm', { x: 27, z: -29 }))
  stepUntil(world, () => world.effects.some(effect => effect.swarm?.applied), 100)

  selectUnit(world, shaman.id, false)
  assert.ok(command(world, { ...browserPosition(boat), id: boat.id }))
  stepUntil(world, () => boat.passengerCount === 1, 500)
  // A dry destination requests the native route-ground departure.
  assert.ok(supportsFollower(world, { x: -25, z: -61 }))
  assert.ok(command(world, { x: -25, z: -61 }))
  stepUntil(world, () => boat.passengerCount === 0, 2_000)
  settleRouteLaunch(world, shaman, { x: -25, z: -61 })
  assert.ok(shaman.hp > 0 && supportsFollower(world, shaman))
  assert.equal(shaman.native.vehicle, 0)

  world.charging = true
  world.manaWorld.spells[0].disabled = 0xffffffff & ~(1 << 4) & ~(1 << 11)
  selectUnit(world, shaman.id, false)
  assert.ok(command(world, { ...south, id: south.id }))
  stepUntil(world, () => south.rewardDelay === 50, 500)
  stepUntil(world, () => south.uses === 1, 150)
  stepUntil(world, () => world.shots.swarm > 0 && world.shots.bridge > 0, 2_000)

  selectUnit(world, shaman.id, false)
  assert.ok(command(world, { ...browserPosition(boat), id: boat.id }))
  stepUntil(world, () => boat.passengerCount === 1, 500)
  // A dry destination requests the native route-ground departure.
  assert.ok(supportsFollower(world, { x: -83, z: -59 }))
  assert.ok(command(world, { x: -83, z: -59 }))
  stepUntil(world, () => boat.passengerCount === 0, 2_000)
  settleRouteLaunch(world, shaman, { x: -83, z: -59 })
  assert.ok(shaman.hp > 0 && supportsFollower(world, shaman))
  assert.equal(shaman.native.vehicle, 0)
  assert.ok(cast(world, 'bridge', { x: -83, z: -69 }))
  stepUntil(world, () => !shaman.casting, 100)
  for (let turn = 0; turn < 160; turn++) tick(world, 1 / 12)

  selectUnit(world, shaman.id, false)
  assert.ok(command(world, { ...browserPosition(balloon), id: balloon.id }))
  stepUntil(world, () => balloon.passengerCount === 1, 1_000)
  assert.deepEqual(
    [balloon.team, balloon.passengers, shaman.native.vehicle],
    ['blue', [shaman.id], balloon.id]
  )

  selectUnit(world, shaman.id, false)
  assert.ok(command(world, { x: 55, z: 121 }))
  reachMission22FlightPoint(world, shaman, balloon, 18067, 31550)
  // Physical Boat launches and settling advance the campaign and passenger clock.
  return { store, world, shaman, balloon }
}

async function assertStagedTransport({ store, world, shaman, balloon, createContinuationStore = () => createCampaignFixtureStore([22]) }, pins) {
  assert.deepEqual([world.turn, shaman.native.counter], pins.input)
  const departureWorld = structuredClone(world),
    person = shaman.native,
    old = person.commands[person.commandCursor]
  for (const [i, point] of [
    { x: 55, z: 121 },
    { x: 65, z: 121 },
  ].entries()) {
    assert.ok(command(world, point, { ctrlKey: true }))
    assert.equal(world.orderCursor, i + 1)
    assert.equal(shaman.native, person)
    assert.equal(world.objectCells.objects.get(shaman.id), person)
  }
  const ids = person.commands.filter(Boolean)
  assert.equal(ids.length, 2)
  assert.equal(world.buildingOrders.records[old].references, 0)
  for (const id of ids)
    assert.deepEqual(
      [
        world.buildingOrders.records[id].model,
        world.buildingOrders.records[id].flags,
        world.buildingOrders.records[id].references,
      ],
      [3, 128, 1]
    )
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const restored = store.getWorld(),
    comparable = stagedCheckpointComparisonView
  assertStagedCheckpointComparisonDomain(world)
  assertStagedCheckpointComparisonDomain(restored)
  assert.deepEqual(
    world.shrines.flatMap((head, index) =>
      head.reward !== restored.shrines[index].reward ? [index] : []
    ),
    [0, 2]
  )
  assert.deepEqual(comparable(restored), comparable(world))
  const stagedStart = world.turn
  let first = 0,
    last = 0,
    finalTailTested = false
  for (let i = 0; i < 700; i++) {
    tick(world, 1 / 12)
    tick(restored, 1 / 12)
    assert.deepEqual(comparable(restored), comparable(world))
    assert.equal(person.vehicle, balloon.id)
    assert.equal(shaman.native, person)
    assert.equal(world.objectCells.objects.get(shaman.id), person)
    assert.deepEqual(balloon.passengers, [shaman.id])
    if (!first && !world.buildingOrders.records[ids[0]].references) {
      first = world.turn
      assert.equal(person.counter, pins.waypointCounters[0])
      assert.equal(
        currentPersonOrder(world.buildingOrders, person),
        world.buildingOrders.records[ids[1]]
      )
      assert.equal(world.buildingOrders.records[ids[1]].references, 1)
    }
    if (!last && !world.buildingOrders.records[ids[1]].references) {
      last = world.turn
      assert.equal(person.counter, pins.waypointCounters[1])
    }
    if (world.turn === stagedStart + 120) {
      finalTailTested = true
      assert.equal(world.buildingOrders.records[ids[0]].references, 0)
      assert.equal(world.buildingOrders.records[ids[1]].references, 1)
      // Supplied final-tail flag/completion boundary, separate from ordinary input.
      for (const blocked of [false, true]) {
        const control = structuredClone(world),
          unit = control.units.find(u => u.id === shaman.id),
          owner = unit.native,
          vehicle = control.vehicles.find(v => v.id === balloon.id)
        owner.flags3 |= 0x10000000
        if (blocked) control.land.flags.fill(4)
        assert.equal(vehicleExit(control, vehicle).found, !blocked)
        stepLiveOrderQueue(control, unit, owner, { 3: () => 1 })
        assert.equal(control.buildingOrders.records[ids[1]].references, 0)
        assert.equal(owner.vehicle, blocked ? vehicle.id : 0)
        assert.equal(vehicle.passengerCount, blocked ? 1 : 0)
        assert.deepEqual(vehicle.passengers, blocked ? [unit.id] : [0])
        assert.equal(unit.native, owner)
        assert.equal(control.objectCells.objects.get(unit.id), owner)
      }
    }
  }
  assert.equal(finalTailTested, true)
  // Each waypoint retires on its own four-visit clock phase. The second leg
  // starts at the first retirement's actual position, so this is not a time offset.
  assert.equal(first, pins.retirements[0])
  assert.equal(last, pins.retirements[1])
  assert.equal(person.state, 30)
  assert.equal(person.commands.filter(Boolean).length, 0)
  assert.equal(shaman.hp, 100.6)
  assert.equal(balloon.speed, 0)
  assert.deepEqual([balloon.x & 511, balloon.y & 511], [256, 256])

  // Independent ordinary rest -> Ctrl28 input. No state/counter/terrain injection.
  const idleStore = await createContinuationStore()
  idleStore.startMission(22)
  const idle = idleStore.getWorld()
  Object.assign(idle, structuredClone(departureWorld))
  const idleUnit = idle.units.find(u => u.id === shaman.id),
    idlePerson = idleUnit.native,
    idleCraft = idle.vehicles.find(v => v.id === idlePerson.vehicle),
    idleTarget = idle.units.find(u => u.id === 17)
  for (
    let i = 0;
    i < 500 &&
    (currentPersonOrder(idle.buildingOrders, idlePerson) ||
      idlePerson.state !== 30 ||
      idleCraft.speed !== 0 ||
      !vehicleReady(idle.land, idleCraft));
    i++
  )
    tick(idle, 1 / 12)
  assert.equal(idle.turn, pins.idle.turn)
  assert.equal(currentPersonOrder(idle.buildingOrders, idlePerson), undefined)
  assert.deepEqual([idlePerson.state, idleCraft.speed], [30, 0])
  assert.ok(vehicleReady(idle.land, idleCraft))
  // The delayed native model3 retirement settles in this adjacent dry cell.
  assert.deepEqual([idleCraft.x, idleCraft.y, idlePerson.counter], pins.idle.settledPose)
  const idleCounter = idlePerson.counter
  selectUnit(idle, idleUnit.id, false)
  assert.ok(command(idle, { ...idleTarget, id: idleTarget.id }, { ctrlKey: true }))
  const idleOrder = currentPersonOrder(idle.buildingOrders, idlePerson)
  assert.deepEqual(
    [idlePerson.state, idlePerson.commandStatus, idlePerson.counter],
    [10, 28, idleCounter]
  )
  assert.deepEqual([idleOrder.model, idleOrder.flags, idleOrder.references], [28, 128, 1])
  assert.equal(idleUnit.native, idlePerson)
  assert.equal(idle.objectCells.objects.get(idleUnit.id), idlePerson)
  assert.deepEqual(idleCraft.passengers, [idleUnit.id])
  await idleStore.saveCheckpoint()
  assert.ok(idleStore.loadCheckpoint())
  const idleReplay = idleStore.getWorld()
  assertStagedCheckpointComparisonDomain(idle)
  assertStagedCheckpointComparisonDomain(idleReplay)
  assert.deepEqual(
    idle.shrines.flatMap((head, index) =>
      head.reward !== idleReplay.shrines[index].reward ? [index] : []
    ),
    [0, 2]
  )
  let idleDeparture = 0,
    idleFirstFight = 0,
    idleFirstOpponent = 0,
    idleDeath = 0
  for (let i = 0; i < 1200; i++) {
    const beforeVehicle = idlePerson.vehicle,
      beforeCounter = idlePerson.counter
    const beforeSeat = { x: idleUnit.x, z: idleUnit.z }
    // Historical inputs may carry stale metadata until their first ordinary visit.
    if (beforeVehicle && i) seatedAttackOrigin(idle, idleUnit, idleCraft)
    tick(idle, 1 / 12)
    tick(idleReplay, 1 / 12)
    if (idlePerson.vehicle) seatedAttackOrigin(idle, idleUnit, idleCraft)
    assert.deepEqual(comparable(idleReplay), comparable(idle))
    if (i === 0) {
      assert.equal(idlePerson.counter, (idleCounter + 1) & 255)
      assert.equal(idleCraft.x, 16096)
    }
    if (beforeVehicle && !idlePerson.vehicle) {
      boundedGroundAttackDeparture(idleUnit, beforeSeat)
      idleDeparture = idle.turn
      assert.deepEqual([idlePerson.workTarget, idlePerson.substate], [17, 2])
      assert.equal(idlePerson.counter, (beforeCounter + 1) & 255)
    }
    if (idleUnit.fight && !idleFirstFight) {
      idleFirstFight = idle.turn
      idleFirstOpponent = idleUnit.fight.opponent
    }
    if (idleUnit.hp <= 0 && !idleDeath) idleDeath = idle.turn
    if (!idleDeath && idlePerson.vehicle) {
      assert.equal(idleUnit.native, idlePerson)
      assert.equal(idle.objectCells.objects.get(idleUnit.id), idlePerson)
    }
    if (pins.idle.acquisitionOnly && idleFirstFight) break
  }
  if (pins.idle.acquisitionOnly) {
    // Keep historical selected-target acquisition exact. Do not extend this
    // old3566 world through changed current-runtime later-combat scheduling.
    assert.deepEqual([idleDeparture, idleFirstFight, idleFirstOpponent], pins.idle.events)
    assert.equal(idle.turn, pins.idle.events[1])
    assert.equal(idleDeath, 0)
    assert.ok(idleUnit.hp > 0)
    assert.equal(idle.objectCells.objects.get(idleUnit.id), idlePerson)
    assert.equal(idleUnit.fight.motion, idlePerson)
    assert.equal(idleTarget.id, 17)
  } else {
    assert.deepEqual(
      [idleDeparture, idleFirstFight, idleFirstOpponent, idleDeath],
      pins.idle.events
    )
    // Existing browser continuation still removes the unit with positive retained
    // native life; corrected seat-origin changes its actual encounter/RNG history.
    // This existing mode1 grounded adapter is not voluntary-launch physics parity.
    assert.equal(idlePerson.life, pins.idle.retainedLife)
    assert.equal(idleUnit.hp, 0)
    assert.equal(idle.units.includes(idleUnit), false)
    assert.equal(idle.objectCells.objects.has(idleUnit.id), false)
    assert.equal(idleOrder.references, 0)
    assert.equal(idleCraft.passengerCount, 0)
    assert.deepEqual(idleCraft.passengers, [])
  }

  // Independent public Shift departure from the same genuinely acquired state.
  // The destination is ordinary dry land; no terrain or passenger fields change.
  const departureStore = await createContinuationStore()
  departureStore.startMission(22)
  const departing = departureStore.getWorld()
  Object.assign(departing, structuredClone(departureWorld))
  const unit = departing.units.find(u => u.id === shaman.id),
    owner = unit.native
  assert.ok(supportsFollower(departing, { x: 55, z: 121 }))
  selectUnit(departing, unit.id, false)
  assert.ok(command(departing, { x: 55, z: 121 }, { shiftKey: true }))
  const orderId = owner.commands[owner.commandCursor]
  assert.equal(departing.buildingOrders.records[orderId].flags, 64)
  await departureStore.saveCheckpoint()
  assert.ok(departureStore.loadCheckpoint())
  const replay = departureStore.getWorld()
  assertStagedCheckpointComparisonDomain(departing)
  assertStagedCheckpointComparisonDomain(replay)
  assert.deepEqual(
    departing.shrines.flatMap((head, index) =>
      head.reward !== replay.shrines[index].reward ? [index] : []
    ),
    [0, 2]
  )
  let launched = false,
    landed = false
  while (departing.turn < departureWorld.turn + 300) {
    tick(departing, 1 / 12)
    tick(replay, 1 / 12)
    assert.deepEqual(comparable(departing), comparable(replay))
    if (!owner.vehicle && !launched) {
      launched = true
      assert.equal(unit.flight, owner)
      assert.equal(departing.objectCells.objects.get(unit.id), owner)
      assert.ok(owner.h > 0)
    }
    if (launched && !unit.flight) landed = true
  }
  assert.ok(launched && landed)
  assert.ok(supportsFollower(departing, unit))
  assert.equal(unit.hp, 100.6)
  assert.ok(departing.units.includes(unit))
  assert.equal(departing.objectCells.objects.get(unit.id), unit.native)
  assert.equal(departing.buildingOrders.records[orderId].references, 0)

  const successorPins = pins.successor

  // Supplied second Brave/+71 phase on the genuine acquisition clone. This
  // successor handoff fills a vacated driver seat; the separate historical
  // regression proves the eligible-queue selector's physical seat swap.
  const successorStore = await createContinuationStore()
  successorStore.startMission(22)
  const successor = successorStore.getWorld()
  Object.assign(successor, structuredClone(departureWorld))
  const firstUnit = successor.units.find(u => u.id === shaman.id),
    craft = successor.vehicles.find(v => v.id === balloon.id),
    head = successor.shrines.find(s => s.id === 120),
    brave = addUnit(successor, 'blue', 'brave', browserPosition(craft))
  brave.native = createLivePerson(successor, brave)
  registerLivePerson(successor, brave.native)
  successor.pathfinding.people.set(brave.id, brave.native)
  brave.native.counter = (firstUnit.native.counter + 71) & 255
  assert.ok(boardLiveVehicle(successor, brave.native, craft))
  const members = [firstUnit, brave],
    owners = members.map(u => u.native)
  selectUnit(successor, firstUnit.id, false)
  selectUnit(successor, brave.id, true)
  assert.deepEqual(
    successor.selected,
    members.map(u => u.id)
  )
  assert.ok(command(successor, { x: 55, z: 121 }, { ctrlKey: true }))
  assert.ok(command(successor, { ...head, id: head.id }))
  const shared = owners[0].commands.filter(Boolean)
  assert.deepEqual(owners[1].commands.filter(Boolean), shared)
  assert.equal((owners[1].counter - owners[0].counter) & 255, 71)
  assert.deepEqual(
    shared.map(id => successor.buildingOrders.records[id].model),
    [3, 27]
  )
  assert.deepEqual(
    shared.map(id => successor.buildingOrders.records[id].references),
    [2, 2]
  )
  await successorStore.saveCheckpoint()
  assert.ok(successorStore.loadCheckpoint())
  const successorReplay = successorStore.getWorld()
  assertStagedCheckpointComparisonDomain(successor)
  assertStagedCheckpointComparisonDomain(successorReplay)
  assert.deepEqual(
    successor.shrines.flatMap((s, i) =>
      s.reward !== successorReplay.shrines[i].reward ? [i] : []
    ),
    [0, 2]
  )
  let waited = false,
    filled = false,
    successorAssertions = 0,
    previousReferences = [2, 2],
    referenceTransitions = 0,
    seatTransferObserved = 0,
    emptyObserved = 0
  const referenceSequence = [[1, 2], [0, 2], [0, 1], [0, 0]]
  while (successor.turn < departureWorld.turn + 400) {
    const previousDriver = craft.passengers[0],
      previousPassengerCount = craft.passengerCount
    tick(successor, 1 / 12)
    tick(successorReplay, 1 / 12)
    assert.deepEqual(comparable(successor), comparable(successorReplay))
    for (const [i, member] of members.entries()) {
      assert.ok(member.native)
      if (member.native.vehicle) assert.equal(member.native, owners[i])
      assert.equal(successor.objectCells.objects.get(member.id), member.native)
      assert.ok(member.hp > 0)
    }
    if (
      owners.every(p => p.vehicle === craft.id) &&
      craft.passengers[0] === firstUnit.id &&
      currentPersonOrder(successor.buildingOrders, owners[successorPins.waitingActor])?.model === 27 &&
      currentPersonOrder(successor.buildingOrders, owners[1 - successorPins.waitingActor])?.model === 3
    )
      waited = true
    if (craft.passengers[0] === brave.id) filled = true
    const references = shared.map(id => successor.buildingOrders.records[id].references)
    if (references.some((value, index) => value !== previousReferences[index])) {
      assert.ok(referenceTransitions < referenceSequence.length)
      assert.deepEqual(references, referenceSequence[referenceTransitions])
      assert.deepEqual([successor.turn, references], successorPins.references[referenceTransitions])
      referenceTransitions++
      previousReferences = references
    }
    if (previousDriver === firstUnit.id && craft.passengers[0] === brave.id) {
      assert.equal(seatTransferObserved, 0)
      assert.equal(referenceTransitions, 2)
      assert.equal(successor.turn, successorPins.seatTransferTurn)
      seatTransferObserved = successor.turn
    }
    if (previousPassengerCount > 0 && craft.passengerCount === 0) {
      assert.equal(emptyObserved, 0)
      assert.equal(referenceTransitions, 2)
      assert.equal(successor.turn, successorPins.emptyTurn)
      assert.equal(successor.turn, seatTransferObserved + 1)
      emptyObserved = successor.turn
    }
    const expected = new Map(successorPins.references).get(successor.turn)
    if (expected) {
      successorAssertions++
      assert.deepEqual(
        shared.map(id => successor.buildingOrders.records[id].references),
        expected
      )
    }
    // The historical input completes the passenger first; fresh input completes
    // the driver first. In either case that model27 owner waits beside model3,
    // both stay seated, and the original +71 phase remains intact here.
    if (successor.turn === successorPins.firstRetirementTurn) {
      assert.deepEqual(
        owners.map(p => p.counter),
        successorPins.firstRetirementCounters
      )
      assert.deepEqual(
        owners.map(p => currentPersonOrder(successor.buildingOrders, p)?.model),
        successorPins.firstRetirementModels
      )
      assert.deepEqual(craft.passengers, [firstUnit.id, brave.id])
      assert.deepEqual(owners.map(p => p.vehicle), [craft.id, craft.id])
      assert.equal((owners[1].counter - owners[0].counter) & 255, 71)
      assert.equal(waited, true)
    }
    if (successor.turn === successorPins.secondRetirementTurn) {
      assert.deepEqual(
        owners.map(p => p.counter),
        successorPins.secondRetirementCounters
      )
      assert.deepEqual(
        owners.map(p => currentPersonOrder(successor.buildingOrders, p)?.model),
        [27, 27]
      )
      assert.deepEqual(craft.passengers, [firstUnit.id, brave.id])
      assert.deepEqual(owners.map(p => p.vehicle), [craft.id, craft.id])
      assert.equal((owners[1].counter - owners[0].counter) & 255, 71)
    }

    if (successor.turn === successorPins.seatTransferTurn) {
      successorAssertions++
      assert.equal(craft.passengers[0], brave.id)
      assert.deepEqual(
        owners.map(p => p.vehicle),
        [0, craft.id]
      )
      assert.deepEqual(
        owners.map(p => p.counter),
        successorPins.seatTransferCounters
      )
      assert.equal(referenceTransitions, 2)
      assert.equal((owners[1].counter - owners[0].counter) & 255, 71)
    }
    if (successor.turn === successorPins.emptyTurn) {
      successorAssertions++
      assert.equal(craft.passengerCount, 0)
      assert.deepEqual(
        owners.map(p => p.vehicle),
        [0, 0]
      )
      assert.deepEqual(
        owners.map(p => p.counter),
        successorPins.emptyCounters
      )
      assert.equal(referenceTransitions, 2)
      assert.equal((owners[1].counter - owners[0].counter) & 255, 71)
    }
  }
  assert.equal(referenceTransitions, 4)
  assert.equal(seatTransferObserved, successorPins.seatTransferTurn)
  assert.equal(emptyObserved, successorPins.emptyTurn)
  assert.equal(successorAssertions, 6)
  assert.ok(waited && filled)
  assert.equal(head.uses, 1)
  assert.deepEqual(
    shared.map(id => successor.buildingOrders.records[id].references),
    [0, 0]
  )
  assert.equal(craft.passengerCount, 0)
  for (const [index, member] of members.entries()) {
    assert.equal(member.native, owners[index])
    assert.equal(successor.objectCells.objects.get(member.id), owners[index])
    assert.deepEqual(owners[index].commands, Array(8).fill(0))
    assert.equal(owners[index].immediateCommand, 0)
  }
  for (const id of shared) {
    assert.deepEqual(
      owners.filter(p => p.commands.includes(id) || p.immediateCommand === id),
      []
    )
    assert.deepEqual(
      members.filter(u => u.native.commands.includes(id) || u.native.immediateCommand === id),
      []
    )
  }
}

test('fresh supplied-focus Mission22 staged transport retains queue, idle combat, Shift departure and successor through Save/Load', async () => {
  await assertStagedTransport(await prepareFreshFlightPoint(), freshPins)
})

test('historical complete3566 research clone retains exact transport branches and selected-target acquisition', async () => {
  await assertStagedTransport(await loadHistoricalStaged(), historicalPins)
})
