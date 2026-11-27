import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { campaignRules } from '../app/campaign-command-runtime.ts'
import { withCampaignTribe } from '../app/campaign-runtime.ts'
import { createGameStore } from '../app/game-store.ts'
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
    const store = createGameStore()
    store.startMission(18)
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
  const store = createGameStore()
  store.startMission(18)
  const w = store.getWorld()
  const blueShaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  assert.ok(blueShaman)
  const freshBlueOpener = w.levelStart.some(
    site => site.tribe === 0 && site.shaman === blueShaman.id && site.phase === 0 && site.entering
  )
  assert.equal(w.levelStart.length, freshBlueOpener ? 1 : 0)
  const expectedArrival = freshBlueOpener ? 1817 : 1777
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
  // A fresh Blue opening can allocate earlier slots in the shared order pool.
  // Bind the incumbent by this Preacher's real order, not by allocation order.
  const previousOrder = currentPersonOrder(w.buildingOrders, p),
    previousOrderId = p.commands.find(id => id > 0 && w.buildingOrders.records[id] === previousOrder) ?? 0
  assert.ok(previousOrderId > 0)
  assert.deepEqual([previousOrder.model, previousOrder.a, previousOrder.b], [17, 25856, 47360])
  assert.equal(previousOrder.references, 1)
  assert.deepEqual(owners(previousOrderId), [430])
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
    preaching = 0,
    replacementOrder = 0,
    arrival = 0
  while (w.turn < 3600) {
    tick(w, 1 / 12)
    tick(replay, 1 / 12)
    assert.deepEqual(replay, w)
    const person = u.native,
      order = currentPersonOrder(w.buildingOrders, person)
    assert.equal(w.objectCells.objects.get(430), person)
    // Computer marker patrols keep cycling, so the type-24 marker task no longer
    // holds the selection lock at 1474..1485 re-selecting idled patrollers.
    if (w.turn === 1474) assert.equal(ai.selectionOwner, taskIndex)
    if (!commit && order && order !== previousOrder) {
      replacementOrder =
        person.commands.find(id => id > 0 && w.buildingOrders.records[id] === order) ?? 0
      assert.ok(replacementOrder > 0)
      assert.notEqual(replacementOrder, previousOrderId)
      assert.deepEqual([order.model, order.a, order.b], [17, 25728, 640])
      assert.deepEqual(person.commands.filter(Boolean), [replacementOrder])
      commit = w.turn
      assert.equal(person, p)
      assert.equal(ai.selectionOwner === taskIndex, false)
      assert.equal(w.buildingOrders.records[previousOrderId].references, 0)
      assert.deepEqual(owners(previousOrderId), [])
      assert.deepEqual(owners(replacementOrder), [430])
      assert.equal(order.references, 1)
    }
    if (commit) {
      assert.deepEqual(person.commands.filter(Boolean), [replacementOrder])
      assert.equal(order, w.buildingOrders.records[replacementOrder])
      assert.equal(order.references, 1)
      assert.deepEqual(owners(replacementOrder), [430])
    }
    if (commit && !arrival && person.substate === 2) {
      arrival = w.turn
      const signed = n => (n << 16) >> 16
      assert.ok(Math.abs(signed(person.goalX - person.x)) < 12)
      assert.ok(Math.abs(signed(person.goalY - person.y)) < 12)
      assert.deepEqual([person.goalX, person.goalY], [25728, 640])
      assert.equal(person.speed, 0)
      assert.equal(person.timer, 7, 'original opening animation has seven ticks left after entry')
    }
    if (commit && !preaching && order?.model === 17 && person.substate === 3) preaching = w.turn
    if (w.turn === 3521) assert.equal(active(w).filter(t => t.type === 11).length, 0)
  }
  assert.equal(commit, 1478)
  assert.ok(arrival > commit, 'the live follower reaches the sermon goal before its animation')
  assert.equal(preaching, arrival + 7)
  // The fresh Blue opening advances the shared RNG and changes this route's
  // movement speed draw (68 without it, 60 with it), not the seven animation ticks.
  assert.equal(arrival, expectedArrival)
  assert.equal(preaching, freshBlueOpener ? 1824 : 1784)
  assert.equal(u.native, p)
  assert.ok(
    u.x !== origin.x || u.z !== origin.z,
    'real movement precedes preaching; no exact marker-arrival claim'
  )
  const order = currentPersonOrder(w.buildingOrders, u.native)
  assert.deepEqual([order.model, order.a, order.b], [17, 25728, 640])
  assert.equal(order.references, 1)
  assert.deepEqual(owners(replacementOrder), [430])
  assert.equal(w.buildingOrders.records[previousOrderId].references, 0)
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
