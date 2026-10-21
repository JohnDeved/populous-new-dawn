import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { tick } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { objectsInCell } from '../app/object-cells.ts'
import { campaignRules } from '../app/campaign-command-runtime.ts'
import { withCampaignTribe } from '../app/campaign-runtime.ts'
import script from '../app/original-script-twenty-two.json' with { type: 'json' }

const activeStaffing = world => world.campaignAIs[1].tasks.filter(t => t.type === 7 && t.flags & 1)

test('ordinary M22 authored EVERY255 requests a real Firewarrior Tower garrison', async () => {
  const red = script.tribes[1]
  assert.equal(red.sha256, '741f7a2aa5bdb82f993b0e4cd9692b6b8bf6b4f5b188cb206a1fa9e15565e26c')
  assert.deepEqual(red.codes.slice(227, 235), [1005, 57, 1003, 1006, 1097, 58, 59, 5])
  assert.deepEqual(
    [57, 58, 59, 5].map(i => red.fields[i]),
    [
      [0, 255],
      [2, 1205],
      [0, 16],
      [0, 14],
    ]
  )
  // The following marker request retains this order within the partial block;
  // conditional emergency1086 and the rest of the recurring script stay excluded.
  assert.deepEqual(red.codes.slice(235, 241), [1006, 1092, 16, 21, 36, 36])
  const store = await createCampaignFixtureStore([22])
  assert.equal(store.startMission(22), true)
  const w = store.getWorld(),
    tower = w.buildings.find(b => b.id === 90),
    fw = w.units.find(u => u.id === 96)
  for (let n = 0; n < 255; n++) {
    assert.equal(activeStaffing(w).length, 0)
    tick(w, 1 / 12)
  }
  assert.equal(activeStaffing(w).length, 0)
  assert.equal(fw.inside, null)
  // Supplied absent/dead/wrong-tribe targets cannot create the task at this
  // actual due-turn boundary. No actor or clock is changed in the real branch.
  for (const boundary of ['missing', 'dead', 'team']) {
    const clone = structuredClone(w),
      b = clone.buildings.find(b => b.id === tower.id)
    if (boundary === 'missing') clone.buildings = clone.buildings.filter(b => b.id !== tower.id)
    else if (boundary === 'dead') b.hp = 0
    else b.team = 'blue'
    withCampaignTribe(clone, 1, () => campaignRules(clone))
    assert.equal(activeStaffing(clone).length, 0, boundary)
  }
  const full = structuredClone(w)
  for (const task of full.campaignAIs[1].tasks) task.flags |= 1
  const fullTasks = structuredClone(full.campaignAIs[1].tasks)
  withCampaignTribe(full, 1, () => campaignRules(full))
  assert.deepEqual(full.campaignAIs[1].tasks, fullTasks)
  tick(w, 1 / 12)
  assert.equal(w.turn, 256)
  const task = activeStaffing(w)[0]
  assert.ok(task)
  assert.equal(task.requested, 6)
  assert.equal(task.target, tower.id)
  assert.equal(task.phase, 3)
  assert.equal(
    w.campaignAIs[2].tasks.some(t => t.type === 7 && t.flags & 1),
    false
  )
  assert.equal(
    w.campaignAIs[3].tasks.some(t => t.type === 7 && t.flags & 1),
    false
  )
  tick(w, 1 / 12)
  assert.deepEqual(task.members, []) // The following marker task gets this visit.
  tick(w, 1 / 12)
  assert.deepEqual(task.members, [fw.id])
  assert.equal(task.phase, 4)
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const restored = store.getWorld()
  const comparable = world => {
    const copy = structuredClone(world)
    for (const i of [0, 2]) copy.shrines[i].reward ??= 'mana'
    return copy
  }
  assert.deepEqual(comparable(restored), comparable(w))
  let orderId = 0,
    entered = 0
  for (let n = 0; n < 942; n++) {
    tick(w, 1 / 12)
    tick(restored, 1 / 12)
    assert.deepEqual(comparable(restored), comparable(w))
    const p = fw.native ?? fw.entry?.person,
      order = p && currentPersonOrder(w.buildingOrders, p)
    if (order?.model === 8) {
      assert.equal(order.a, tower.id)
      orderId = p.commands[p.commandCursor]
    }
    if (fw.inside === tower.id && !entered) entered = w.turn
  }
  // Browser outcome, not a native completion-time parity claim.
  assert.equal(entered, 274)
  assert.equal(w.turn, 1200)
  assert.equal(fw.inside, tower.id)
  assert.equal(fw.hp, 35)
  assert.ok(tower.admission.occupants.includes(fw.id))
  assert.equal(tower.admission.inside, 1)
  const person = fw.entry.person
  assert.equal(person.state, 21)
  assert.equal(w.objectCells.objects.get(fw.id), person)
  assert.ok(
    [...objectsInCell(w.objectCells, (person.y & 0xfe00) | ((person.x >>> 8) & 254))].includes(
      person
    )
  )
  assert.ok(orderId)
  assert.equal(w.buildingOrders.records[orderId].references, 0)
  assert.equal(activeStaffing(w).length, 0)
  assert.ok(task.members.length === 0)
  // Ordinary later due visits must not allocate another task for an already
  // correctly staffed Tower. Continue to the next real mask boundary.
  while (w.turn < 1280) tick(w, 1 / 12)
  assert.equal(fw.inside, tower.id)
  assert.equal(activeStaffing(w).length, 0)
})
