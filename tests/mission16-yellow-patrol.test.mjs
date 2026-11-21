import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { createGameStore } from '../app/game-store.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { campaignRules } from '../app/campaign-command-runtime.ts'
import { withCampaignTribe } from '../app/campaign-runtime.ts'
import { requestTraining } from '../app/computer.ts'
import { stepComputerTasks } from '../app/computer-runtime.ts'
import script from '../app/original-script-sixteen.json' with { type: 'json' }

const person = u => u.entry?.person ?? u.native ?? u.flight ?? u.fight?.motion
const patrols = w => w.campaignAIs[2].tasks.filter(t => t.flags & 1 && t.type === 24)

test('Yellow patrol source keeps strict population conditions and staffing-first ordering', () => {
  const s = script.tribes[2]
  assert.equal(s.sha256, '22ece8e21540d8ca760230842a2eed1dde60f229e1fbccf050a08701525d7bc7')
  assert.deepEqual(
    s.codes.slice(613, 639),
    [
      1000, 1012, 151, 15, 1003, 1006, 1092, 8, 28, 15, 56, 1004, 1002, 1000, 1012, 152, 28, 1003,
      1006, 1092, 31, 37, 57, 56, 1004, 1002,
    ]
  )
  assert.deepEqual(
    [151, 152, 15, 28].map(i => s.fields[i]),
    [
      [2, 1147],
      [2, 1148],
      [0, 3],
      [0, 2],
    ]
  )
  const w = createWorld(16)
  w.turn = 127 // Supplied boundary, with the unmodified zero specialist population.
  withCampaignTribe(w, 2, () => campaignRules(w))
  assert.equal(patrols(w).length, 0)
  assert.deepEqual(
    w.campaignAIs[2].tasks.filter(t => t.flags & 1).map(t => t.type),
    [7, 7, 7, 7, 7]
  )
})

test('ordinary Yellow trains Preachers and dispatches moving patrol/sermon orders with Save/Load', async () => {
  const store = createGameStore()
  store.startMission(16)
  const w = store.getWorld()
  assert.equal(w.units.filter(u => u.team === 'yellow' && u.kind === 'preacher').length, 0)
  let firstPatrol
  while (w.turn < 640) {
    tick(w, 1 / 12)
    if (patrols(w).length && !firstPatrol) firstPatrol = w.turn
  }
  assert.equal(firstPatrol, 640)
  assert.equal(w.units.filter(u => u.team === 'yellow' && u.kind === 'preacher').length, 3)
  assert.deepEqual(
    patrols(w)[0]
      .route.slice(0, 3)
      .map(r => r.marker),
    [17, 19, 20]
  )
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const replay = store.getWorld()
  const initial = new Map(
    w.units.filter(u => u.team === 'yellow' && u.kind === 'preacher').map(u => [u.id, [u.x, u.z]])
  )
  while (w.turn < 1000) {
    tick(w, 1 / 12)
    tick(replay, 1 / 12)
  }
  assert.deepEqual(replay, w)
  const preachers = w.units.filter(u => initial.has(u.id))
  assert.ok(preachers.some(u => u.x !== initial.get(u.id)[0] || u.z !== initial.get(u.id)[1]))
  assert.deepEqual(
    preachers
      .map(u => currentPersonOrder(w.buildingOrders, person(u))?.model)
      .sort((a, b) => a - b),
    [11, 11, 25]
  )
  for (const u of preachers) {
    assert.equal(w.objectCells.objects.get(u.id), person(u))
    assert.equal(u.hp > 0, true)
  }
})

for (const [kind, count, expected, markers] of [
  ['preacher', 2, 0, []],
  ['preacher', 3, 1, [17, 19, 20]],
  ['warrior', 3, 0, []],
  ['warrior', 4, 1, [11, 13, 15]],
])
  test(`supplied Yellow ${count} ${kind}s uses strict patrol threshold`, () => {
    const w = createWorld(16)
    // Supplied specialist census isolates the condition, not natural training.
    for (const u of w.units.filter(u => u.team === 'yellow' && u.kind === 'brave').slice(0, count))
      u.kind = kind
    w.turn = 127
    withCampaignTribe(w, 2, () => campaignRules(w))
    const active = w.campaignAIs[2].tasks.filter(t => t.flags & 1)
    assert.deepEqual(
      active.map(t => t.type),
      [7, 7, 7, 7, 7, ...Array(expected).fill(24)]
    )
    if (expected)
      assert.deepEqual(
        patrols(w)[0]
          .route.slice(0, 3)
          .map(r => r.marker),
        markers
      )
  })

for (const [model, building, attribute, preference, expected] of [
  [6, 284, 8, 80, 4],
  [5, 285, 5, 20, 2],
])
  test(`supplied model${model} task uses its school preference, not Warrior preference`, () => {
    const w = createWorld(16)
    w.turn = 1 // Avoid the ordinary producer; isolate the native task6 dispatcher.
    if (model === 5) w.buildings.find(b => b.id === building).kind = 'spyHut'
    const ai = w.campaignAIs[2]
    ai.attributes[7] = 0
    ai.attributes[attribute] = preference
    withCampaignTribe(w, 2, () => {
      assert.ok(requestTraining(ai, 0, model, 20, () => building))
      stepComputerTasks(w, 2)
    })
    const task = ai.tasks.find(t => t.flags & 1 && t.type === 6)
    assert.equal(task.remaining, expected)
  })
