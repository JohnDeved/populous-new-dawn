import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { campaignRules } from '../app/campaign-command-runtime.ts'
import { withCampaignTribe } from '../app/campaign-runtime.ts'
import script from '../app/original-script-eighteen.json' with { type: 'json' }

const runAt = (w, turn) => {
  w.turn = turn // Explicit supplied script-clock boundary; ordinary route is separate.
  withCampaignTribe(w, 1, () => campaignRules(w))
}
const active = w => w.campaignAIs[1].tasks.filter(t => t.flags & 1)

test('M18 delivers its complete first recurring block with the original guard producer', () => {
  const red = script.tribes[1]
  assert.equal(red.sha256, 'bfe23efdd9c012d660649a0151db17d193cfc0261fabdc5eefbe0d894adf3e2e')
  assert.deepEqual(
    red.codes.slice(624, 663),
    [
      1005, 132, 133, 1003, 1000, 1014, 70, 1, 1003, 1006, 1092, 6, 9, 86, 86, 1006, 1074, 22, 1004,
      1002, 1004, 1005, 132, 87, 1003, 1000, 1020, 1012, 134, 67, 1014, 70, 1, 1003, 1007, 70, 6,
      1004, 1002,
    ]
  )
  assert.deepEqual(
    [132, 133, 87, 70, 134, 67].map(i => red.fields[i]),
    [
      [0, 2047],
      [0, 575],
      [0, 63],
      [1, 2],
      [2, 1180],
      [0, 9],
    ]
  )
  const w = createWorld(18),
    before = structuredClone(w.campaignAIs[1].tasks)
  runAt(w, 1471)
  assert.deepEqual(w.campaignAIs[1].tasks, before)
  runAt(w, 1472)
  const newTasks = active(w).filter(t => t.type === 11)
  assert.equal(newTasks.length, 1)
  assert.equal(newTasks[0].phase, 4)
  assert.ok(newTasks[0].entity)
  assert.equal(
    active(w).filter(t => t.type === 24).length,
    before.filter(t => t.flags & 1 && t.type === 24).length + 1
  )
  const owned = structuredClone(newTasks[0])
  runAt(w, 3520)
  assert.equal(active(w).filter(t => t.type === 11).length, 1)
  assert.deepEqual(
    active(w).find(t => t.type === 11),
    owned,
    'recurrence does not replace an owned Preacher task'
  )
  const full = createWorld(18)
  full.campaignAIs[1].tasks.forEach(t => {
    t.flags |= 1
  })
  const pool = structuredClone(full.campaignAIs[1].tasks)
  runAt(full, 1472)
  assert.deepEqual(full.campaignAIs[1].tasks, pool)
})

for (const kills of [9, 10])
  test(`supplied Blue kill count ${kills} respects the native due-turn shutoff`, async () => {
    const store = await createCampaignFixtureStore([18])
    assert.equal(store.startMission(18), true)
    const w = store.getWorld(),
      ai = w.campaignAIs[1]
    w.killCredits[0][1] = kills
    runAt(w, 1983)
    assert.equal(ai.variables[2], 0)
    const tasks = structuredClone(ai.tasks)
    runAt(w, 1984)
    assert.equal(ai.variables[2], kills === 10 ? 1 : 0)
    assert.deepEqual(ai.tasks, tasks, 'the guard transition does not cancel already-owned tasks')
    await store.saveCheckpoint()
    assert.ok(store.loadCheckpoint())
    const replay = store.getWorld()
    assert.deepEqual(replay, w)
    runAt(w, 3520)
    runAt(replay, 3520)
    assert.deepEqual(replay, w)
    if (kills === 10) assert.deepEqual(ai.tasks, tasks)
    else assert.equal(active(w).filter(t => t.type === 11).length, 1)
  })

for (const value of [1, 2, 3, 4, 5])
  test(`supplied nonzero gate ${value} stays closed without phase rewriting`, () => {
    const w = createWorld(18),
      ai = w.campaignAIs[1]
    ai.variables[2] = value
    w.killCredits[0][1] = 10
    const before = structuredClone(ai.tasks)
    runAt(w, 1984)
    assert.equal(ai.variables[2], value)
    runAt(w, 3520)
    assert.deepEqual(ai.tasks, before)
  })

test('ordinary M18 recurring dispatch replaces the old sermon and preserves live ownership through public Save/Load', async () => {
  const store = await createCampaignFixtureStore([18])
  assert.equal(store.startMission(18), true)
  const w = store.getWorld()
  while (w.turn < 1472) tick(w, 1 / 12)
  const ai = w.campaignAIs[1],
    u = w.units.find(u => u.id === 430),
    p = u.native
  const owners = id =>
    w.units
      .filter(u => {
        const p = u.native ?? u.entry?.person ?? u.flight ?? u.fight?.motion
        return p?.commands.includes(id) || p?.immediateCommand === id
      })
      .map(u => u.id)
  assert.equal(ai.variables[2], 0)
  assert.equal(
    active(w).some(t => t.type === 11),
    false
  )
  assert.equal(w.objectCells.objects.get(430), p)
  assert.equal(w.buildingOrders.records[3].references, 1)
  assert.deepEqual(owners(3), [430])
  const origin = { x: u.x, z: u.z }
  tick(w, 1 / 12) // Original input1472 is visible in post-world1473.
  const taskIndex = ai.tasks.findIndex(t => t.flags & 1 && t.type === 11)
  assert.ok(taskIndex >= 0)
  assert.equal(ai.tasks[taskIndex].entity, 430)
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const replay = store.getWorld()
  assert.deepEqual(replay, w)
  let commit = 0,
    preaching = 0
  while (w.turn < 3600) {
    tick(w, 1 / 12)
    tick(replay, 1 / 12)
    assert.deepEqual(replay, w)
    const person = u.native,
      order = currentPersonOrder(w.buildingOrders, person)
    assert.equal(w.objectCells.objects.get(430), person)
    if (w.turn === 1486) assert.equal(ai.selectionOwner, taskIndex)
    if (!commit && person.commands.includes(45)) {
      commit = w.turn
      assert.equal(person, p)
      assert.equal(ai.selectionOwner === taskIndex, false)
      assert.equal(w.buildingOrders.records[3].references, 0)
      assert.deepEqual(owners(3), [])
      assert.deepEqual(owners(45), [430])
      assert.equal(order.references, 1)
    }
    if (commit && !preaching && order?.model === 17 && person.substate === 3) preaching = w.turn
    if (w.turn === 3521) assert.equal(active(w).filter(t => t.type === 11).length, 0)
  }
  assert.equal(commit, 1490)
  assert.equal(preaching, 1849)
  assert.equal(u.native, p)
  assert.ok(
    u.x !== origin.x || u.z !== origin.z,
    'real movement precedes preaching; no exact marker-arrival claim'
  )
  const order = currentPersonOrder(w.buildingOrders, u.native)
  assert.deepEqual([order.model, order.a, order.b], [17, 25728, 640])
  assert.equal(order.references, 1)
  assert.deepEqual(owners(45), [430])
  assert.equal(w.buildingOrders.records[3].references, 0)
  assert.equal(u.native.substate, 3)
  assert.ok(u.hp > 0)
  // Supplied kill credit closes future requests without canceling this real sermon.
  const before = structuredClone({ u, orders: w.buildingOrders })
  w.killCredits[0][1] = 10
  runAt(w, 1984)
  runAt(w, 3520)
  assert.equal(ai.variables[2], 1)
  assert.deepEqual({ u, orders: w.buildingOrders }, before)
})
