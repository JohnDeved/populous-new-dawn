import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
// Ordinary M22 recruitment route; only the existing spell-focus adapter is supplied.
import test from 'node:test'
import assert from 'node:assert/strict'
import { stepMovementOrder } from '../app/person-orders.ts'
import { browserPosition, cast, command, tick, selectUnit } from '../app/model.ts'
test('grounded staged boarding retains and visits the preceding waypoint', async () => {
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
  const store = await createCampaignFixtureStore([22])
  assert.equal(store.startMission(22), true)
  let world = store.getWorld(),
    shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
    boat = world.vehicles.find(vehicle => vehicle.model === 1)

  focusCharging(world, 5)
  stepUntil(world, () => world.shots.swarm > 0, 1_500)
  moveShaman(world, shaman, { x: 0, z: -45 })
  moveShaman(world, shaman, { x: 20, z: -45 })
  assert.ok(cast(world, 'swarm', { x: 27, z: -29 }))
  stepUntil(world, () => world.effects.some(effect => effect.swarm?.applied), 100)

  // Keep the old western detour as an ordinary lethal contrast: source-backed
  // Swarm pursuit changes enemy/RNG outcomes, not the queue's ownership contract.
  const lethal = structuredClone(world),
    lethalShaman = lethal.units.find(u => u.id === shaman.id),
    lethalBoat = lethal.vehicles.find(v => v.id === boat.id)
  selectUnit(lethal, lethalShaman.id, false)
  assert.ok(command(lethal, { x: 0, z: -45 }, { ctrlKey: true }))
  const lethalFirst = lethalShaman.native.commands[0]
  assert.ok(
    command(lethal, { ...browserPosition(lethalBoat), id: lethalBoat.id }, { ctrlKey: true })
  )
  const lethalSecond = lethalShaman.native.commands[1]
  let lethalFight = 0,
    lethalOpponent = 0,
    lethalDeath = 0,
    lethalClosest = Infinity

  const p = shaman.native
  assert.equal(p.vehicle, 0)
  selectUnit(world, shaman.id, false)
  // A real approach waypoint avoids the now-active western interception.
  assert.ok(command(world, { x: 22, z: -39 }, { ctrlKey: true }))
  const first = p.commands.find(Boolean)
  assert.equal(world.buildingOrders.records[first].flags, 128)
  const control = structuredClone(world),
    controlShaman = control.units.find(u => u.id === shaman.id),
    controlOwner = controlShaman.native,
    controlMovement = structuredClone(control.buildingOrders.records[first])
  assert.deepEqual([controlMovement.model,controlMovement.flags,controlMovement.a,controlMovement.b],[3,128,7808,8064])
  assert.ok(command(world, { ...browserPosition(boat), id: boat.id }, { ctrlKey: true }))
  const after = shaman.native
  assert.equal(world.buildingOrders.records[first].references, 1)
  assert.equal(after, p)
  const second = after.commands[1],
    record = world.buildingOrders.records[second]
  assert.deepEqual(
    [record.model, record.flags, record.references, record.a, record.b],
    [22, 128, 1, boat.id, ((boat.x >>> 8) & 255) | (boat.y & 0xff00)]
  )
  assert.equal(world.orderCursor, 2)
  assert.equal(world.objectCells.objects.get(shaman.id), p)
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const restored = store.getWorld()
  const comparable = world => {
    const copy = structuredClone(world)
    for (const index of [0, 2])
      if (copy.shrines[index].reward === undefined) copy.shrines[index].reward = 'mana'
    return copy
  }
  let closest = Infinity,
    controlRetirements = 0,
    boarded = null
  for (let n = 0; n < 300; n++) {
    tick(world, 1 / 12)
    tick(lethal, 1 / 12)
    lethalClosest = Math.min(lethalClosest, Math.hypot(lethalShaman.x, lethalShaman.z + 45))
    if (lethalShaman.fight && !lethalFight) {
      lethalFight = lethal.turn
      lethalOpponent = lethalShaman.fight.opponent
    }
    if (lethalShaman.hp <= 0 && !lethalDeath) lethalDeath = lethal.turn
    const controlHadReference = control.buildingOrders.records[first].references,
      controlBefore = controlHadReference ? structuredClone(controlOwner) : null,
      controlOrderBefore = controlHadReference ? structuredClone(control.buildingOrders.records[first]) : null
    tick(control, 1 / 12)
    if (controlHadReference && !control.buildingOrders.records[first].references) {
      controlRetirements++
      assert.equal(controlHadReference, 1)
      assert.deepEqual(
        [controlOrderBefore.model, controlOrderBefore.flags, controlOrderBefore.a, controlOrderBefore.b],
        [3, 128, 7808, 8064]
      )
      assert.equal(controlBefore.commands[controlBefore.commandCursor],first)
      assert.equal(controlBefore.state,10)
      assert.equal(controlShaman.native,controlOwner)
      assert.equal(control.objectCells.objects.get(controlShaman.id),controlOwner)
      assert.equal(controlShaman.hp,100)
      assert.deepEqual([controlOwner.model,controlOwner.vehicle,controlOwner.flags4&0x4000000],[7,0,0])
      assert.equal(controlOwner.counter,(controlBefore.counter+1)&255)
      assert.equal(controlOwner.counter & 3, 0)
      // Original model7 extent160 plus target extent56, strict on each axis.
      assert.ok(Math.abs(controlOwner.x - controlMovement.a) < 216)
      assert.ok(Math.abs(controlOwner.y - controlMovement.b) < 216)
      const noVehicle = () => { throw Error('grounded waypoint cannot request vehicle position') }
      assert.equal(stepMovementOrder(controlBefore,controlMovement,control.land.categories,noVehicle),false)
      assert.equal(stepMovementOrder(controlOwner,controlMovement,control.land.categories,noVehicle),true)
      assert.deepEqual([controlOwner.goalX,controlOwner.goalY],[controlMovement.a,controlMovement.b])
      assert.deepEqual(controlOwner.commands.filter(Boolean),[])
      assert.equal(controlOwner.immediateCommand,0)
    }
    tick(restored, 1 / 12)
    assert.deepEqual(comparable(restored), comparable(world))
    closest = Math.min(closest, Math.hypot(shaman.x - 22, shaman.z + 39))
    if (boat.passengerCount && boarded === null) boarded = world.turn
  }
  assert.ok(lethalClosest < 1)
  assert.deepEqual([lethalFight, lethalOpponent, lethalDeath], [1460, 97, 1476])
  assert.equal(lethalShaman.hp, 0)
  assert.equal(lethal.units.includes(lethalShaman), false)
  assert.equal(lethal.objectCells.objects.has(lethalShaman.id), false)
  assert.equal(lethal.buildingOrders.records[lethalFirst].references, 0)
  assert.equal(lethal.buildingOrders.records[lethalSecond].references, 0)
  assert.deepEqual(lethalBoat.passengers, [])
  // Command3 completes against its prepared native point and square arrival
  // extent, on every fourth person visit. The clicked-point Euclidean distance
  // is not that contract; both predecessor and one actual retirement are checked.
  assert.equal(controlRetirements,1)
  assert.ok(closest < 1)
  assert.equal(boarded, 1376)
  assert.equal(shaman.hp, 100.6)
  assert.equal(world.buildingOrders.records[first].references, 0)
  assert.equal(world.buildingOrders.records[second].references, 0)
  assert.equal(after.vehicle, boat.id)
  assert.deepEqual(boat.passengers, [shaman.id])
  assert.equal(world.objectCells.objects.get(shaman.id), after)
  assert.equal(after.commands.filter(Boolean).length, 0)
})
