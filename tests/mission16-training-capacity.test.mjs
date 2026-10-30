import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import { scalableReferenceIds } from './helpers/scalable-reference-ids.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { currentPersonOrder } from '../app/person-orders.ts'
import { createWorld, tick } from '../app/model.ts'
import { computerSelectionWorld, stepComputerTasks } from '../app/computer-runtime.ts'
import { availableTrainingPeople } from '../app/computer-selection.ts'
import { random } from '../app/native-math.ts'
import { withCampaignTribe } from '../app/campaign-runtime.ts'
const training = w => w.campaignAIs[1].tasks.filter(t => t.flags & 1 && t.type === 6)
const person = u => u?.entry?.person ?? u?.native ?? u?.flight ?? u?.fight?.motion

const referenceId = scalableReferenceIds(16)

test('supplied M16 availability4/5/6 retains the pre-rejection model draw and capacity equality', () => {
  const base = createWorld(16)
  while (base.turn < 126) tick(base, 1 / 12)
  for (const count of [4, 5, 6]) {
    const w = structuredClone(base)
    withCampaignTribe(w, 1, () => {
      const selection = computerSelectionWorld(w, 1).world
      const eligible = selection.people.filter(
        p => availableTrainingPeople({ ...selection, people: [p] }) === 1
      )
      assert.equal(eligible.length, 29)
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
      if (tasks.length) assert.equal(tasks[0].target, 235)
    })
  }
})

test('ordinary M16 capacity admission trains actual followers with complete checkpoint replay', async () => {
  const store = await createCampaignFixtureStore([16])
  assert.equal(store.startMission(16), true)
  const w = store.getWorld(),
    initialIds = new Set(w.units.map(u => u.id))
  while (w.turn < 126) tick(w, 1 / 12)
  assert.equal(training(w).length, 0)
  withCampaignTribe(w, 1, () =>
    assert.equal(availableTrainingPeople(computerSelectionWorld(w, 1).world), 29)
  )
  tick(w, 1 / 12)
  assert.ok(training(w).some(t => t.target === 235))
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const replay = store.getWorld()
  assert.deepEqual(replay, w)
  const students = [111, 110, 106],
    arrivals = new Map(),
    conversions = new Map(),
    school = w.buildings.find(b => b.id === 235)
  while (w.turn < 2200) {
    tick(w, 1 / 12)
    tick(replay, 1 / 12)
    assert.deepEqual(replay, w)
    for (const id of students) {
      const u = w.units.find(u => u.id === id)
      if (u?.inside === 235 && !arrivals.has(id)) {
        arrivals.set(id, w.turn)
        const p = person(u),
          order = currentPersonOrder(w.buildingOrders, p)
        assert.equal(w.objectCells.objects.get(id), p)
        assert.equal(order.model, 8)
        assert.equal(order.a, 235)
        assert.equal(p.commands[p.commandCursor], 38)
      }
    }
    if (w.turn === 384) assert.equal(w.buildingOrders.records[38].references, 3)
    for (const u of w.units.filter(
      u => u.team === 'red' && u.kind === 'warrior' && !initialIds.has(u.id)
    ))
      if (!conversions.has(u.id)) conversions.set(u.id, w.turn)
    if (w.turn === 584) {
      for (const id of students) {
        assert.equal(
          w.units.some(u => u.id === id),
          false
        )
        assert.equal(w.objectCells.objects.has(id), false)
      }
      for (const id of [358, 359, 360].map(referenceId)) {
        const u = w.units.find(u => u.id === id)
        assert.equal(u.kind, 'warrior')
        assert.equal(u.hp, 90)
        assert.equal(w.objectCells.objects.get(id), person(u))
      }
      assert.equal(w.buildingOrders.records[38].references, 0)
      assert.equal(school.admission.inside, 0)
      assert.ok(school.admission.occupants.every(id => !id))
    }
  }
  assert.deepEqual(
    [...arrivals],
    [
      [111, 374],
      [110, 380],
      [106, 386],
    ]
  )
  assert.deepEqual(
    [...conversions],
    [
      [referenceId(358), 584],
      [referenceId(359), 584],
      [referenceId(360), 584],
      [referenceId(438), 1540],
      [referenceId(439), 1540],
      [referenceId(454), 1680],
    ]
  )
})
