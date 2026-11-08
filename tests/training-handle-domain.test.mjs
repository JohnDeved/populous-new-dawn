import assert from 'node:assert/strict'
import test from 'node:test'
import { withStorage } from './support/profile-storage.mjs'
import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import { addBuilding, addUnit, command, tick } from '../app/model.ts'
import {
  trainingQueuePerson,
  trainingQueuePredecessor,
  appendTrainingQueue,
} from '../app/training.ts'

for (const firstId of [10000, 32768, 65536, 287375]) {
  test(`public training queue preserves browser handles from ${firstId}`, async () => {
    await withStorage({}, async ({ freshStore }) => {
      const w = createStartedWorld(1, 'scalable')
      w.manaWorld.gameFlags = 32 // Supplied fixture freezes conversion, retaining a full queue.
      retainFixtureUnits(w, u => u.kind === 'shaman')
      w.terrain.fill(3)
      w.terrainVersion++
      const camp = addBuilding(w, 'blue', 'camp', { x: -2, z: 32 }, true)
      w.nextId = firstId
      const people = Array.from({ length: 8 }, (_, i) =>
        addUnit(w, 'blue', 'brave', { x: 7 + i * 0.4, z: 33 })
      )
      const until = condition => {
        for (let i = 0; i < 600 && !condition(); i++) tick(w, 1 / 12)
        assert.ok(condition(), `training condition at turn ${w.turn}`)
      }
      w.selected = people.map(u => u.id)
      assert.ok(command(w, camp))
      until(() => camp.admission?.inside === 5 && people.every(u => !u.entry?.person.speed))
      const queue = () => {
        const ids = []
        for (let id = camp.admission.queueHead; id;) {
          assert.ok(!ids.includes(id))
          ids.push(id)
          id = people.find(u => u.id === id).entry.person.reservationNext
        }
        return ids
      }
      const before = queue()
      assert.equal(before.length, 3)
      w.selected = [before[1]]
      assert.ok(command(w, { x: 9, z: 30 }))
      assert.deepEqual(queue(), [before[0], before[2]])
      const resident = camp.admission.occupants.find(Boolean)
      w.selected = [resident]
      assert.ok(command(w, { x: 8, z: 30 }))
      until(() => people.find(u => u.id === before[0]).inside === camp.id)
      assert.equal(people.find(u => u.id === before[2]).inside, null)
      assert.equal(
        people.find(u => u.id === before[2]).entry.person.substate,
        5,
        'same admission pipeline as low-ID baseline'
      )
      assert.equal(camp.admission.inside, 5)
      const store = await freshStore()
      store.startMission(1)
      Object.assign(store.getWorld(), w)
      assert.ok(await store.saveCheckpoint())
      assert.ok(store.loadCheckpoint())
      const replay = store.getWorld()
      assert.deepEqual(replay, w)
      for (let i = 0; i < 32; i++) {
        tick(w, 1 / 12)
        tick(replay, 1 / 12)
        assert.deepEqual(replay, w)
      }
    })
  })
}

test('queue lookups keep native unsigned-word defaults and live aliases distinct', () => {
  const person = id => ({ id, class: 1, flags2: 0, flags3: 0, reservationNext: 0 })
  const low = person(25231),
    high = person(287375),
    next = person(352911)
  const people = new Map([low, high, next].map(p => [p.id, p]))
  const native = { people },
    live = { people, personId: id => id }
  const b = { queueHead: high.id }
  assert.equal(trainingQueuePerson(native, b, 0), low)
  assert.equal(trainingQueuePerson(live, b, 0), high)
  appendTrainingQueue(live, b, next)
  assert.equal(high.reservationNext, next.id)
  assert.equal(low.reservationNext, 0)
  assert.equal(trainingQueuePerson(live, b, -1), next)
  assert.equal(trainingQueuePredecessor(live, b, next), high)
})

test('native head comparison stays signed while the live head decoder preserves identity', async () => {
  const { stepTrainingPerson } = await import('../app/training.ts')
  for (const decoder of [undefined, id => id]) {
    const p = {
      id: 32768,
      class: 1,
      model: 2,
      flags2: 0,
      flags3: 32,
      flags4: 0,
      assignment: 0,
      state: 10,
      substate: 3,
      target: 7,
      workTarget: 7,
      speed: 0,
      x: 100,
      y: 100,
      goalX: 100,
      goalY: 100,
      commandAux: 0,
      commandPhase: 0,
      counter: 1,
      reservationNext: 0,
      commands: [],
      commandCursor: 0,
      immediateCommand: 0,
    }
    const b = {
      id: 7,
      class: 2,
      model: 7,
      flags2: 0,
      activity: 8,
      inside: 0,
      entering: 0,
      entryDelay: 0,
      queueHead: p.id,
    }
    const world = {
      randomState: 1,
      people: new Map([[p.id, p]]),
      buildings: new Map([[b.id, b]]),
      orders: { records: [] },
      personId: decoder,
    }
    const noEffect = () => assert.fail('head decision does not require an external effect')
    stepTrainingPerson(world, p, {
      setAnimation: noEffect,
      releaseMotion: noEffect,
      adjacentBuilding: noEffect,
      setDestination: noEffect,
      directDestination: noEffect,
      dropCargo: noEffect,
      enterBuilding: noEffect,
      workInside: noEffect,
    })
    assert.equal(p.substate, decoder ? 6 : 3)
    assert.equal(b.entryDelay, decoder ? 16 : 0)
  }
})
