import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import { scalableReferenceIds } from './helpers/scalable-reference-ids.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { computerSelectionWorld, stepComputerTasks } from '../app/computer-runtime.ts'
import { availableTrainingPeople } from '../app/computer-selection.ts'
import { random } from '../app/native-math.ts'
import { withCampaignTribe } from '../app/campaign-runtime.ts'

// The paired producer trace pins classic Tower allocations234/235/236 at turns
// 62/63/64. Scalable construction uses reserved low handles instead, consuming
// no general IDs. All later training ordinals and gameplay assertions stay exact.
const referenceId = scalableReferenceIds(12, [234, 235, 236])

const training = w => w.campaignAIs[1].tasks.filter(t => t.flags & 1 && t.type === 6)
const person = u => u?.entry?.person ?? u?.native ?? u?.flight ?? u?.fight?.motion

test('ordinary M12 capacity admission produces real Warriors and replays the training lifecycle', async () => {
  const store = await createCampaignFixtureStore([12])
  assert.equal(store.startMission(12), true)
  const w = store.getWorld(),
    authoredBuildings = new Set(w.buildings.map(b => b.id)),
    built = []
  while (w.turn < 126) {
    tick(w, 1 / 12)
    for (const b of w.buildings) if (!authoredBuildings.has(b.id)) {
      authoredBuildings.add(b.id)
      built.push([w.turn, b.id, b.team, b.kind, b.x, b.z])
    }
  }
  assert.deepEqual(built, [
    [62, 1023, 'green', 'tower', 9.11328125, 65.12890625],
    [63, 1022, 'yellow', 'tower', 0.87109375, -28.88671875],
    [64, 1021, 'red', 'tower', -43.12890625, 45.11328125],
  ])
  assert.equal(training(w).length, 0)
  withCampaignTribe(w, 1, () =>
    assert.equal(availableTrainingPeople(computerSelectionWorld(w, 1).world), 7)
  )
  tick(w, 1 / 12)
  const task = training(w).find(t => t.target === 176)
  assert.ok(task)
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const replay = store.getWorld()
  assert.deepEqual(replay, w)
  const students = [217, 218],
    arrivals = new Map(),
    conversions = new Map()
  const school = w.buildings.find(b => b.id === 176)
  while (w.turn < 2200) {
    tick(w, 1 / 12)
    tick(replay, 1 / 12)
    assert.deepEqual(replay, w)
    for (const id of students) {
      const u = w.units.find(u => u.id === id)
      if (u?.inside === 176 && !arrivals.has(id)) {
        arrivals.set(id, w.turn)
        const p = person(u),
          o = currentPersonOrder(w.buildingOrders, p)
        assert.equal(w.objectCells.objects.get(id), p)
        assert.equal(o.model, 8)
        assert.equal(o.a, 176)
        assert.equal(p.commands[p.commandCursor], 4)
      }
    }
    if (w.turn === 168) assert.equal(w.buildingOrders.records[4].references, 2)
    for (const u of w.units.filter(u => u.team === 'red' && u.kind === 'warrior'))
      if (!conversions.has(u.id)) conversions.set(u.id, w.turn)
    if (w.turn === 372) {
      for (const id of students) {
        assert.equal(
          w.units.some(u => u.id === id),
          false
        )
        assert.equal(w.objectCells.objects.has(id), false)
      }
      for (const id of [261, 262].map(referenceId)) {
        const u = w.units.find(u => u.id === id)
        assert.equal(u.kind, 'warrior')
        assert.equal(u.hp, 90)
        assert.equal(w.objectCells.objects.get(id), person(u))
      }
      assert.equal(w.buildingOrders.records[4].references, 0)
      assert.equal(school.admission.inside, 0)
      assert.ok(school.admission.occupants.every(id => !id))
    }
  }
  assert.deepEqual(
    [...arrivals],
    [
      [217, 164],
      [218, 168],
    ]
  )
  assert.deepEqual(
    [...conversions],
    [
      [referenceId(261), 372],
      [referenceId(262), 372],
      [referenceId(269), 628],
      [referenceId(270), 628],
      [referenceId(293), 1292],
      [referenceId(294), 1292],
      [referenceId(335), 1964],
      [referenceId(344), 2156],
    ]
  )
  assert.equal(training(w).length, 0)
})

test('supplied M12 availability4/5/6 retains the pre-rejection model draw and capacity equality', () => {
  const base = createWorld(12)
  while (base.turn < 126) tick(base, 1 / 12)
  for (const count of [4, 5, 6]) {
    const w = structuredClone(base)
    withCampaignTribe(w, 1, () => {
      const selection = computerSelectionWorld(w, 1).world
      const eligible = selection.people.filter(
        p => availableTrainingPeople({ ...selection, people: [p] }) === 1
      )
      assert.equal(eligible.length, 7)
      // Supplied busy flags reduce availability without altering population,
      // actors, school capacity or the already completed producer prefix.
      for (const p of eligible.slice(count)) {
        const u = w.units.find(u => u.id === p.id),
          owner = person(u)
        assert.ok(owner)
        owner.computerAssignment = 1
      }
      assert.equal(availableTrainingPeople(computerSelectionWorld(w, 1).world), count)
      const expected = { randomState: w.randomState }
      random(expected)
      stepComputerTasks(w, 1)
      assert.equal(
        w.randomState,
        expected.randomState,
        'chosen-model draw occurs even on capacity rejection'
      )
      const tasks = training(w)
      assert.equal(tasks.length, Number(count >= 5))
      if (tasks.length) assert.equal(tasks[0].target, 176)
    })
  }
})
