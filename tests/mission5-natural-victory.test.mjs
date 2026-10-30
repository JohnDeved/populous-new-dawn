import { nativeCampaignProfile } from './support/campaign-fixture.mjs'
import { scalableReferenceIds } from './helpers/scalable-reference-ids.mjs'
// Genuine campaign inputs: earn Convert, occupy the authored Tower, convert a
// wild follower near the disconnected head, then earn and board the linked Boat.
import test from 'node:test'
import assert from 'node:assert/strict'
import { withStorage } from './support/profile-storage.mjs'
import {
  browserPosition,
  cast,
  command,
  selectUnit,
  tick,
  cancelInteraction,
} from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { spellInRange, spellRange } from '../app/spell-casting.ts'
import { vehicleReady } from '../app/vehicle-routing.ts'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

const referenceId = scalableReferenceIds(5)

test('declared Mission5 prerequisite supports natural victory, native selector exit and fresh-session Mission6', async () => {
  await withStorage({ profile: nativeCampaignProfile({ available: [5] }) }, async ({ freshStore, records, drain }) => {
    await loadSceneFixture()
    const { skipIntroduction } = await import('../app/scene-camera-runtime.ts')
    const store = await freshStore()
    await store.restoreCheckpoint()
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
        .filter(
          owner => owner.immediateCommand === worshipId || owner.commands?.includes(worshipId)
        )
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

    const orderFor = id => {
      const owner = world.units.find(unit => unit.id === id)?.native
      return owner && currentPersonOrder(world.buildingOrders, owner)
    }
    const group = [111, 112, 113, 114, 115, referenceId(339)],
      first = world.shrines.find(s => s.id === 109)
    for (const state of [world, restored]) {
      for (const [i, id] of group.entries()) selectUnit(state, id, i > 0)
      assert.deepEqual(
        [...state.selected].sort((a, b) => a - b),
        group
      )
      assert.ok(command(state, { ...first, id: first.id }))
    }
    assert.deepEqual(restored, world)
    assert.equal(group.filter(id => orderFor(id)?.a === first.id).length, 5)
    while (first.active && world.turn < 3000) step()
    assert.equal(first.uses, 1)
    assert.equal(world.turn, 2652)
    for (let i = 0; i < 120; i++) step()
    assert.equal(
      world.effects.some(e => e.bridge),
      false
    )
    // These actual additive clicks toggle the existing group, leaving [339,111].
    // Only Shaman111 admits the second head; this is not a five-person second order.
    const five = [111, 112, 113, 114, 115],
      second = world.shrines.find(s => s.id === 94)
    for (const state of [world, restored]) {
      for (const [i, id] of five.entries()) selectUnit(state, id, i > 0)
      assert.deepEqual(state.selected, [referenceId(339), 111])
      assert.ok(command(state, { ...second, id: second.id }))
    }
    assert.deepEqual(restored, world)
    assert.equal(orderFor(111)?.a, second.id)
    while (second.active && world.turn < 4600) step()
    assert.equal(second.uses, 1)
    assert.equal(world.turn, 3016)
    for (let i = 0; i < 120; i++) step()
    assert.equal(
      world.effects.some(e => e.bridge),
      false
    )
    const angelHead = world.shrines.find(s => s.id === 95)
    for (const state of [world, restored]) {
      cancelInteraction(state)
      assert.deepEqual(state.selected, [])
      for (const [i, id] of five.entries()) selectUnit(state, id, i > 0)
      assert.deepEqual(
        [...state.selected].sort((a, b) => a - b),
        five
      )
      assert.ok(command(state, { ...angelHead, id: angelHead.id }))
    }
    assert.deepEqual(restored, world)
    assert.ok(five.some(id => orderFor(id)?.a === angelHead.id))
    while (!world.effects.some(e => e.angel) && world.turn < 5700) step()
    const angel = world.effects.find(e => e.angel)
    assert.ok(angel)
    assert.deepEqual([world.turn, angel.id, angel.team], [3844, referenceId(5337), 'blue'])
    let conditionTurn
    const latch = []
    while (world.status === 'playing' && world.effects.includes(angel) && world.turn < 6500) {
      step()
      store.update()
      if (
        conditionTurn === undefined &&
        !world.units.some(u => u.team === 'red' && u.kind === 'shaman')
      ) {
        conditionTurn = world.turn
      }
      if (conditionTurn !== undefined && world.turn % 32 === 0) {
        const entry = {
          turn: world.turn,
          var13: world.campaignAIs[1].variables[13],
          status: world.status,
        }
        latch.push(entry)
      }
    }
    assert.equal(world.status, 'won')
    assert.equal(world.turn, 4320)
    assert.equal(world.outcome.completedLevel, 4)
    assert.deepEqual(
      latch.map(e => e.var13),
      [1, 2, 3, 4, 9]
    )
    assert.deepEqual(store.getCompletedMissions(), [5])
    assert.equal(conditionTurn, 4189)
    assert.equal(world.units.filter(unit => unit.team === 'red' && unit.hp > 0).length, 29)
    assert.ok(
      world.effects.includes(angel),
      'the live Blue Angel and absent Red Shaman trigger the authored override'
    )
    // Admit the actual earned result before checkpoint replacement clears its session owner.
    assert.equal(store.enterCampaignSelector(store.getWorld()), true)
    assert.equal(store.getCampaignSelection().progressionMission, 6)
    await store.saveCheckpoint()
    assert.ok(store.loadCheckpoint())
    assert.deepEqual(store.getWorld(), world)
    assert.deepEqual(store.getCompletedMissions(), [5])
    await drain()
    assert.deepEqual(records.get('profile').completed, [5])
    assert.equal(records.get('latest').world.status, 'won')
    const secondStore = await freshStore()
    assert.equal(await secondStore.restoreCheckpoint(), true)
    assert.deepEqual(secondStore.getCompletedMissions(), [5])
    assert.ok(secondStore.loadCheckpoint())
    assert.deepEqual(secondStore.getWorld(), world)
    // Native result exit persisted availability; fresh-session campaign launch
    // uses the real gate. This is not rendered input or an earned Missions 1-4 route.
    assert.ok(secondStore.getCampaignSelection().available.includes(6))
    assert.equal(secondStore.startMission(6), true)
    assert.equal(secondStore.getWorld().outcome.level, 6)
    assert.equal(secondStore.getWorld().status, 'playing')
    assert.deepEqual(secondStore.getCompletedMissions(), [5])
    assert.equal(await secondStore.saveCheckpoint(), true)
    await drain()
    const thirdStore = await freshStore()
    assert.equal(await thirdStore.restoreCheckpoint(), true)
    assert.deepEqual(thirdStore.getCompletedMissions(), [5])
    assert.ok(thirdStore.loadCheckpoint())
    assert.equal(thirdStore.getWorld().outcome.level, 6)
    assert.equal(thirdStore.getWorld().status, 'playing')
    assert.equal(thirdStore.getWorld().outcome.completedLevel, null)
  })
})
