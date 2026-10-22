import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { objectsInCell } from '../app/object-cells.ts'
import { campaignRules } from '../app/campaign-command-runtime.ts'
import { withCampaignTribe, campaignInternal } from '../app/campaign-runtime.ts'
import script from '../app/original-script-sixteen.json' with { type: 'json' }

const targets = [254, 253, 252, 251, 250, 249]
const staffing = w => w.campaignAIs[1].tasks.filter(t => t.flags & 1 && t.type === 7)
const runAt = (w, turn) => {
  w.turn = turn // Supplied script-clock boundary; ordinary continuation is separate.
  withCampaignTribe(w, 1, () => campaignRules(w))
}

test('M16 Red retains two complete population gates and six ordered requests', () => {
  const s = script.tribes[1]
  assert.equal(s.sha256, '9b240b926ace6dbef810038cfa5a1cc9620ffc819c6a53d0be45d9070a8b289e')
  assert.deepEqual(
    s.codes.slice(655, 703),
    [
      1005, 104, 146, 1003, 1000, 1012, 147, 9, 1003, 1006, 1097, 143, 148, 145, 1006, 1097, 143,
      149, 150, 1006, 1097, 143, 151, 152, 1004, 1002, 1000, 1012, 147, 21, 1003, 1006, 1097, 143,
      153, 154, 1006, 1097, 143, 155, 156, 1006, 1097, 143, 157, 158, 1004, 1002,
    ]
  )
  assert.deepEqual(
    [104, 146, 147, 9, 21, 143].map(i => s.fields[i]),
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
  runAt(w, 127)
  assert.equal(staffing(w).length, 0)
  runAt(w, 128)
  assert.deepEqual(
    staffing(w).map(t => t.target),
    targets
  )
  assert.ok(staffing(w).every(t => t.requested === 6 && t.phase === 0))
  const before = structuredClone(w.campaignAIs[1].tasks)
  runAt(w, 129)
  assert.deepEqual(w.campaignAIs[1].tasks, before)
})

for (const count of [0, 1, 2, 3, 4, 10])
  test(`supplied Red living Firewarrior population ${count} respects strict thresholds`, () => {
    const w = createWorld(16)
    for (const id of [255, 256, 257, 258, 259, 260, 261, 262, 263, 264].slice(count))
      w.units.find(u => u.id === id).hp = 0
    withCampaignTribe(w, 1, () => assert.equal(campaignInternal(w, 1150), count))
    runAt(w, 128)
    assert.deepEqual(
      staffing(w).map(t => t.target),
      count > 3 ? targets : count > 1 ? targets.slice(0, 3) : []
    )
  })

test('supplied Red task capacity retains original six-request ordering', () => {
  for (const free of [0, 1, 3]) {
    const w = createWorld(16),
      tasks = w.campaignAIs[1].tasks
    tasks.forEach((t, i) => {
      t.flags = i < free ? 0 : 1
    })
    const occupied = structuredClone(tasks.slice(free))
    runAt(w, 128)
    assert.deepEqual(tasks.slice(free), occupied)
    assert.deepEqual(
      tasks.slice(0, free).map(t => t.target),
      targets.slice(0, free)
    )
  }
})

test('ordinary M16 Red recurring requests physically garrison all six Towers and replay through public Save/Load', async () => {
  const store = await createCampaignFixtureStore([16])
  assert.equal(store.startMission(16), true)
  const w = store.getWorld(),
    ids = [255, 256, 257, 258, 259, 260, 261, 262, 263, 264]
  while (w.turn < 128) tick(w, 1 / 12)
  assert.equal(staffing(w).length, 0)
  assert.ok(ids.every(id => w.units.find(u => u.id === id).inside === null))
  tick(w, 1 / 12)
  assert.equal(w.turn, 129)
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
      const u = w.units.find(u => u.id === id)
      assert.ok(u, 'all ten original Firewarriors survive this requalified campaign')
      const p = u.entry?.person ?? u.native
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
  // The restored training task precedes staffing and changes shared scheduling.
  assert.deepEqual(
    [...entries].sort((a, b) => a[0] - b[0]),
    [
      [255, [249, 276]],
      [256, [250, 258]],
      [257, [251, 240]],
      [258, [252, 224]],
      [259, [253, 192]],
      [260, [254, 164]],
    ]
  )
  assert.deepEqual(
    [...orders].sort((a, b) => a - b),
    [18, 27, 29, 30, 31, 32]
  )
  for (const id of orders) assert.equal(w.buildingOrders.records[id].references, 0)
  for (const id of entries.keys()) {
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
  assert.equal(w.units.find(u => u.id === 257).inside, 251)
  assert.ok(originalTasks.every(t => t.members.length === 0))
})
