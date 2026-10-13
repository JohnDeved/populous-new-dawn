import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { createGameStore } from '../app/game-store.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { campaignRules } from '../app/campaign-command-runtime.ts'
import { withCampaignTribe, campaignInternal } from '../app/campaign-runtime.ts'
import script from '../app/original-script-sixteen.json' with { type: 'json' }

const active = w => w.campaignAIs[1].tasks.filter(t => t.flags & 1)
const runAt = (w, turn) => {
  w.turn = turn // Explicit supplied boundary; ordinary continuation is separate.
  withCampaignTribe(w, 1, () => campaignRules(w))
}

test('M16 Red patrol preserves complete population guards after all six staffing requests', () => {
  const s = script.tribes[1]
  assert.deepEqual(
    s.codes.slice(703, 729),
    [
      1000, 1012, 159, 21, 1003, 1006, 1092, 9, 29, 21, 51, 1004, 1002, 1000, 1012, 160, 29, 1003,
      1006, 1092, 15, 37, 48, 51, 1004, 1002,
    ]
  )
  assert.deepEqual(
    [159, 160, 21, 29].map(i => s.fields[i]),
    [
      [2, 1147],
      [2, 1148],
      [0, 3],
      [0, 2],
    ]
  )
  const w = createWorld(16)
  runAt(w, 127)
  assert.equal(active(w).length, 0)
  runAt(w, 128)
  assert.deepEqual(
    active(w).map(t => t.type),
    [7, 7, 7, 7, 7, 7, 24, 24]
  )
  assert.deepEqual(
    active(w)
      .slice(0, 6)
      .map(t => t.target),
    [254, 253, 252, 251, 250, 249]
  )
  for (const [task, indices] of [
    [active(w)[6], [1, 2, 3]],
    [active(w)[7], [4, 5, 6]],
  ]) {
    assert.deepEqual(
      task.route.slice(0, 3),
      indices.map(i => w.campaignAIs[1].markerEntries[i])
    )
    assert.equal(task.route[3].marker, -1)
  }
  const before = structuredClone(w.campaignAIs[1].tasks)
  runAt(w, 129)
  assert.deepEqual(w.campaignAIs[1].tasks, before)
})

for (const [warriors, preachers, markers] of [
  [3, 2, []],
  [4, 2, [1]],
  [3, 3, [7]],
  [4, 3, [1, 7]],
])
  test(`supplied patrol population ${warriors} Warriors/${preachers} Preachers respects independent strict guards`, () => {
    const w = createWorld(16)
    for (const [kind, count] of [
      ['warrior', warriors],
      ['preacher', preachers],
    ])
      for (const u of w.units.filter(u => u.team === 'red' && u.kind === kind).slice(count))
        u.hp = 0
    withCampaignTribe(w, 1, () => {
      assert.equal(campaignInternal(w, 1147), warriors)
      assert.equal(campaignInternal(w, 1148), preachers)
    })
    runAt(w, 128)
    assert.equal(active(w).filter(t => t.type === 7).length, 6)
    assert.deepEqual(
      active(w)
        .filter(t => t.type === 24)
        .map(t => t.route[0].marker),
      markers
    )
  })

for (const free of [0, 5, 6, 7, 8])
  test(`supplied ${free} free task slots retain staffing-before-patrol priority`, () => {
    const w = createWorld(16),
      tasks = w.campaignAIs[1].tasks
    tasks.forEach((t, i) => {
      t.flags = i < free ? 0 : 1
    })
    const occupied = structuredClone(tasks.slice(free))
    runAt(w, 128)
    assert.deepEqual(tasks.slice(free), occupied)
    assert.deepEqual(
      tasks.slice(0, free).map(t => t.type),
      [7, 7, 7, 7, 7, 7, 24, 24].slice(0, free)
    )
  })

test('ordinary Red staffing and mixed patrols share selection and retire exact shared references', async () => {
  const store = createGameStore()
  store.startMission(16)
  const w = store.getWorld()
  while (w.turn < 129) tick(w, 1 / 12)
  assert.deepEqual(
    active(w).map(t => t.type),
    [7, 7, 7, 7, 7, 7, 24, 24]
  )
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const replay = store.getWorld()
  assert.deepEqual(replay, w)
  const first = [258, 259, 260, 265, 266, 267, 268, 269, 270],
    initial = new Map(
      first.map(id => {
        const u = w.units.find(u => u.id === id)
        return [id, [u.x, u.z]]
      })
    )
  const owner = u => u.entry?.person ?? u.native ?? u.flight ?? u.fight?.motion
  const owners = id =>
    w.units
      .filter(u => {
        const p = owner(u)
        return p?.commands.includes(id) || p?.immediateCommand === id
      })
      .map(u => u.id)
  while (w.turn < 1200) {
    tick(w, 1 / 12)
    tick(replay, 1 / 12)
    assert.deepEqual(replay, w)
    if (w.turn === 194) {
      assert.equal(w.campaignAIs[1].selectionOwner, 6)
      for (const id of [258, 259, 260]) assert.ok(w.campaignAIs[1].tasks[6].members.includes(id))
    }
    if (w.turn === 218) {
      for (const id of [29, 30]) {
        assert.equal(w.buildingOrders.records[id].references, 9)
        assert.deepEqual(owners(id), first)
      }
      assert.deepEqual(first.map(id => w.units.find(u => u.id === id).kind).sort(), [
        'firewarrior',
        'firewarrior',
        'firewarrior',
        'preacher',
        'preacher',
        'warrior',
        'warrior',
        'warrior',
        'warrior',
      ])
    }
  }
  assert.ok(
    first.some(id => {
      const u = w.units.find(u => u.id === id),
        xy = initial.get(id)
      return u.x !== xy[0] || u.z !== xy[1]
    })
  )
  for (let id = 1; id < w.buildingOrders.records.length; id++) {
    const r = w.buildingOrders.records[id]
    if (r.model !== 25) continue
    const actual = owners(id)
    assert.equal(r.references, actual.length)
    for (const uid of actual) {
      const u = w.units.find(u => u.id === uid)
      assert.equal(w.objectCells.objects.get(uid), owner(u))
    }
  }
  for (const [id, expected] of [
    [91, [265, 270, 273, 274]],
    [92, [265, 270, 273, 274]],
    [100, [260, 266, 267, 268, 269, 272, 277]],
    [101, [260, 266, 267, 268, 269, 272, 277]],
    [102, [275, 278]],
    [103, [275, 278]],
    [104, [258, 264, 276]],
    [105, [258, 264, 276]],
  ])
    assert.deepEqual(owners(id), expected)
  for (const id of [29, 30, 7, 18, 19, 25, 26, 27, 28, 35, 36, 37, 38, 64]) {
    assert.equal(w.buildingOrders.records[id].references, 0)
    assert.deepEqual(owners(id), [])
  }
  assert.equal(
    w.units.filter(
      u =>
        u.team === 'red' && owner(u) && currentPersonOrder(w.buildingOrders, owner(u))?.model === 25
    ).length,
    16
  )
})
