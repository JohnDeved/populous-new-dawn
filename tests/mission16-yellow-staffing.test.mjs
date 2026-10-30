import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { objectsInCell } from '../app/object-cells.ts'
import { campaignRules } from '../app/campaign-command-runtime.ts'
import { withCampaignTribe, campaignInternal } from '../app/campaign-runtime.ts'
import script from '../app/original-script-sixteen.json' with { type: 'json' }

const targets = [289, 290, 292, 293, 291]
const staffing = w => w.campaignAIs[2].tasks.filter(t => t.flags & 1 && t.type === 7)
const runAt = (w, turn) => {
  w.turn = turn // Supplied script-clock boundary; ordinary continuation is separate.
  withCampaignTribe(w, 2, () => campaignRules(w))
}

test('M16 Yellow retains both complete population gates and five ordered requests', () => {
  const s = script.tribes[2]
  assert.equal(s.sha256, '22ece8e21540d8ca760230842a2eed1dde60f229e1fbccf050a08701525d7bc7')
  assert.deepEqual(
    s.codes.slice(570, 613),
    [
      1005, 106, 141, 1003, 1000, 1012, 142, 8, 1003, 1006, 1097, 143, 144, 145, 1006, 1097, 143,
      146, 147, 1006, 1097, 143, 138, 148, 1004, 1002, 1000, 1012, 142, 15, 1003, 1006, 1097, 143,
      149, 150, 1006, 1097, 143, 144, 138, 1004, 1002,
    ]
  )
  assert.deepEqual(
    [106, 141, 142, 8, 15, 143].map(i => s.fields[i]),
    [
      [0, 255],
      [0, 127],
      [2, 1150],
      [0, 1],
      [0, 3],
      [2, 1205],
    ]
  )
  const w = createWorld(16)
  runAt(w, 126)
  assert.equal(staffing(w).length, 0)
  runAt(w, 127)
  assert.deepEqual(
    staffing(w).map(t => t.target),
    targets
  )
  assert.ok(staffing(w).every(t => t.requested === 6 && t.phase === 0))
  const before = structuredClone(w.campaignAIs[2].tasks)
  runAt(w, 128)
  assert.deepEqual(w.campaignAIs[2].tasks, before)
})

for (const count of [0, 1, 2, 3, 4, 5])
  test(`supplied M16 living Firewarrior population ${count} respects strict authored thresholds`, () => {
    const w = createWorld(16)
    for (const id of [294, 295, 296, 297, 298].slice(count)) w.units.find(u => u.id === id).hp = 0
    withCampaignTribe(w, 2, () => assert.equal(campaignInternal(w, 1150), count))
    runAt(w, 127)
    assert.deepEqual(
      staffing(w).map(t => t.target),
      count > 3 ? targets : count > 1 ? targets.slice(0, 3) : []
    )
  })

test('supplied M16 task-pool capacity preserves source request ordering', () => {
  for (const free of [0, 1, 3]) {
    const w = createWorld(16),
      tasks = w.campaignAIs[2].tasks
    tasks.forEach((t, i) => {
      t.flags = i < free ? 0 : 1
    })
    const occupied = structuredClone(tasks.slice(free))
    runAt(w, 127)
    assert.deepEqual(tasks.slice(free), occupied)
    assert.deepEqual(
      tasks.slice(0, free).map(t => t.target),
      targets.slice(0, free)
    )
  }
})

test('ordinary M16 recurring requests physically garrison all five Towers and replay through public Save/Load', async () => {
  const store = await createCampaignFixtureStore([16])
  assert.equal(store.startMission(16), true)
  const w = store.getWorld(),
    ids = [294, 295, 296, 297, 298]
  while (w.turn < 127) tick(w, 1 / 12)
  assert.equal(staffing(w).length, 0)
  assert.ok(ids.every(id => w.units.find(u => u.id === id).inside === null))
  tick(w, 1 / 12)
  assert.equal(w.turn, 128)
  assert.deepEqual(
    staffing(w).map(t => t.target),
    targets
  )
  const originalTasks = [...staffing(w)]
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const replay = store.getWorld()
  assert.deepEqual(replay, w)
  const entries = new Map(),
    occupiedOwners = new Map(),
    orders = new Set()
  while (w.turn < 1410) {
    tick(w, 1 / 12)
    tick(replay, 1 / 12)
    assert.deepEqual(replay, w)
    for (const id of ids) {
      const u = w.units.find(u => u.id === id),
        p = u.entry?.person ?? u.native
      assert.equal(w.objectCells.objects.get(id), p)
      const order = currentPersonOrder(w.buildingOrders, p)
      if (order?.model === 8) orders.add(p.commands[p.commandCursor])
      if (u.inside && !entries.has(id)) {
        entries.set(id, [u.inside, w.turn])
        occupiedOwners.set(id, p)
      }
      if (occupiedOwners.has(id)) assert.equal(p, occupiedOwners.get(id))
    }
    if (w.turn >= 1200)
      assert.equal(staffing(w).length, 0, 'already staffed Towers do not need replacement tasks')
  }
  // Restored Red staffing consumes shared movement RNG and entry-order slots.
  // These measured Yellow outcomes retain the same physical ownership contract.
  assert.deepEqual(
    ids.map(id => [id, ...entries.get(id)]),
    [
      [294, 293, 154],
      [295, 291, 168],
      [296, 289, 180],
      [297, 290, 192],
      [298, 292, 200],
    ]
  )
  assert.deepEqual(
    [...orders].sort((a, b) => a - b),
    [7, 19, 25, 26, 28]
  )
  for (const id of orders) assert.equal(w.buildingOrders.records[id].references, 0)
  for (const id of ids) {
    const u = w.units.find(u => u.id === id),
      p = u.entry.person,
      b = w.buildings.find(b => b.id === u.inside)
    assert.equal(u.hp, 35)
    assert.equal(p.state, 21)
    assert.equal(p.commands.some(Boolean), false)
    assert.equal(b.admission.inside, 1)
    assert.deepEqual(b.admission.occupants.filter(Boolean), [id])
    assert.equal(w.objectCells.objects.get(id), p)
    assert.ok([...objectsInCell(w.objectCells, (p.y & 0xfe00) | ((p.x >>> 8) & 254))].includes(p))
  }
  assert.ok(originalTasks.every(t => t.members.length === 0))
})
