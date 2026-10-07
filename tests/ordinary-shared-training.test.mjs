import assert from 'node:assert/strict'
import test from 'node:test'
import { trainingObservation, assertSharedTraining, trainingOwnersToReassign } from '../scripts/local-render/ordinary-shared-training.mjs'

// Observer/assertion tests only. These supplied objects are never browser input.
function fixture(t) {
  const original = globalThis.window
  t.after(() => { if (original === undefined) delete globalThis.window; else globalThis.window = original })
  const people = [1, 2].map(id => ({ id, commands: [1, 0], commandCursor: 0,
    immediateCommand: 0, commandStatus: 8, state: 10, flags2: 0, flags3: 0, flags4: 0 }))
  const pool = { active: 1, cursor: 2, records: [null, { model: 8, a: 10, b: 0, references: 2 }] }
  const world = { outcome: { level: 3 }, turn: 100, time: 8, paused: true, speed: 1,
    status: 'playing', inputMask: 0, selected: [1, 2], mode: null, lastOrderTurn: 99,
    unlockedTemple: true, buildingOrders: pool, objectCells: { objects: new Map(people.map(p => [p.id, p])) },
    units: people.map(p => ({ id: p.id, kind: 'brave', team: 'blue', hp: 30, x: p.id, z: 70,
      inside: null, work: 10, target: null, path: [{ x: 24, z: 70 }], native: null,
      entry: { person: p, orders: pool } })),
    buildings: [{ id: 10, kind: 'temple', team: 'blue', progress: 1, hp: 200, admission: { queueHead: 1, occupants: [] } }],
    shrines: [] }
  globalThis.window = { testSceneRef: { current: { world } } }
  const read = source => trainingObservation({ source, ids: [1, 2], school: 10, order: 1 })
  return { world, people, read }
}

test('training observer proves pool/registered-person aliases and copies mutable queues/paths', t => {
  const f = fixture(t), observed = f.read()
  assert.equal(assertSharedTraining(observed, [1, 2], 10), 1)
  f.people[0].commands[0] = 0
  f.world.units[0].path[0].x = 90
  assert.equal(observed.members[0].person.commands[0], 1)
  assert.equal(observed.members[0].path[0].x, 24)
  f.world.units[1].entry.person = structuredClone(f.people[1])
  assert.throws(() => assertSharedTraining(f.read(), [1, 2], 10))
})

test('a structured checkpoint boundary retains exact ownership and aliases', t => {
  const f = fixture(t)
  window.trainingSavedWorld = structuredClone(f.world)
  window.trainingLoadedWorld = structuredClone(window.trainingSavedWorld)
  assert.deepEqual(f.read('loaded'), f.read('saved'))
  assert.equal(assertSharedTraining(f.read('loaded'), [1, 2], 10), 1)
  window.trainingLoadedWorld.buildingOrders.records[1].references = 1
  assert.notDeepEqual(f.read('loaded'), f.read('saved'))
})

test('later converted identities do not invalidate the exact earlier checkpoint boundary', t => {
  const f = fixture(t)
  window.trainingSavedWorld = structuredClone(f.world)
  window.trainingLoadedWorld = structuredClone(f.world)
  f.world.units.pop()
  f.world.objectCells.objects.delete(2)
  f.world.buildingOrders.records[1].references = 1
  assert.deepEqual(f.read('loaded'), f.read('saved'))
  assert.deepEqual(trainingOwnersToReassign(f.read(), [1, 2], 10, 1), [1])
  f.world.buildingOrders.records[1].references = 2
  assert.throws(() => trainingOwnersToReassign(f.read(), [1, 2], 10, 1))
})

test('reassignment refuses lost owners, replacement actors and unexplained references', t => {
  const f = fixture(t), observed = f.read()
  assert.throws(() => trainingOwnersToReassign(observed, [1], 10, 1), /Never substitute/)
  assert.throws(() => trainingOwnersToReassign({ ...observed, trackedOwners: [1, 2, 3] }, [1, 2], 10, 1))
  assert.throws(() => trainingOwnersToReassign({ ...observed, members: [{ id: 1, absent: true }, { id: 2, absent: true }] }, [1, 2], 10, 1), /No original training owner/)
})
