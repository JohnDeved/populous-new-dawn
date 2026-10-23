import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick, selectUnit, command, cast, nativePosition } from '../app/model.ts'
import { spellTargetError } from '../app/live-command.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { campaignRules } from '../app/campaign-command-runtime.ts'
import { stepMarkerTask } from '../app/computer.ts'
import { withCampaignTribe } from '../app/campaign-runtime.ts'
import script from '../app/original-script-twenty-two.json' with { type: 'json' }

const active = w => w.campaignAIs[1].tasks.filter(t => t.flags & 1)

test('M22 recurring marker request retains its authored header, staffing order and pool boundary', () => {
  const red = script.tribes[1]
  assert.equal(red.sha256, '741f7a2aa5bdb82f993b0e4cd9692b6b8bf6b4f5b188cb206a1fa9e15565e26c')
  assert.deepEqual(
    red.codes.slice(227, 241),
    [1005, 57, 1003, 1006, 1097, 58, 59, 5, 1006, 1092, 16, 21, 36, 36]
  )
  assert.deepEqual(
    [16, 21, 36, 36].map(i => red.fields[i]),
    [
      [0, 1],
      [0, 2],
      [0, -1],
      [0, -1],
    ]
  )
  const w = createWorld(22)
  assert.deepEqual(w.campaignAIs[1].markerEntries.slice(1, 3), [
    { marker: 1, secondary: 2, quotas: [0, 2, 0, 0] },
    { marker: 3, secondary: -1, quotas: [0, 1, 0, 0] },
  ])
  while (w.turn < 254) tick(w, 1 / 12)
  assert.equal(active(w).filter(t => t.type === 24).length, 0)
  const before = structuredClone(w.campaignAIs[1].tasks)
  withCampaignTribe(w, 1, () => campaignRules(w))
  assert.deepEqual(w.campaignAIs[1].tasks, before)
  tick(w, 1 / 12)
  assert.equal(w.turn, 255)
  const due = structuredClone(w)
  withCampaignTribe(due, 1, () => campaignRules(due))
  const allocated = active(due)
  assert.deepEqual(
    allocated.map(t => t.type),
    [7, 24]
  )
  const marker = allocated[1]
  assert.deepEqual(marker.route.slice(0, 2), due.campaignAIs[1].markerEntries.slice(1, 3))
  assert.deepEqual(
    marker.route.slice(2).map(r => r.marker),
    [-1, -1]
  )
  assert.equal(marker.extra, 0)
  // Supplied quota count exercises the existing consumer without selecting anyone.
  const satisfied = structuredClone(due.campaignAIs[1])
  const markerIndex = satisfied.tasks.findIndex(t => t.flags & 1 && t.type === 24)
  const actions = stepMarkerTask(satisfied, markerIndex, {
    existing: () => 2,
    select: () => {
      throw new Error('A satisfied quota must not select people')
    },
  })
  assert.deepEqual(actions, [])
  assert.equal(satisfied.tasks[markerIndex].phase, 6)
  assert.deepEqual(satisfied.tasks[markerIndex].members, [])
  // Supplied finite-capacity boundaries at the real authored due turn.
  const full = structuredClone(w)
  full.campaignAIs[1].tasks.forEach(t => {
    t.flags |= 1
  })
  const fullBefore = structuredClone(full.campaignAIs[1].tasks)
  withCampaignTribe(full, 1, () => campaignRules(full))
  assert.deepEqual(full.campaignAIs[1].tasks, fullBefore)
  const one = structuredClone(full)
  one.campaignAIs[1].tasks[0].flags &= ~1
  withCampaignTribe(one, 1, () => campaignRules(one))
  assert.equal(
    one.campaignAIs[1].tasks[0].type,
    7,
    'the preceding staffing request owns the only free slot'
  )
  assert.deepEqual(one.campaignAIs[1].tasks.slice(1), fullBefore.slice(1))
})

test('ordinary returned Warrior resumes the authored patrol after real conversion and retreat', async () => {
  const store = await createCampaignFixtureStore([22])
  assert.equal(store.startMission(22), true)
  const w = store.getWorld(),
    s = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  // Existing focus adapter only. Mana, spell stock and actors are not supplied.
  w.manaWorld.spells[0].disabled = 0xffffffff & ~(1 << 6)
  for (let n = 0; n < 6100 && !w.shots.hypnotise && s.hp > 0; n++) tick(w, 1 / 12)
  assert.equal(w.turn, 5948)
  assert.equal(w.shots.hypnotise, 1)
  for (const goal of [
    { x: 0, z: -45 },
    { x: 20, z: -45 },
  ]) {
    selectUnit(w, s.id)
    assert.ok(command(w, goal))
    for (let n = 0; n < 1000 && Math.hypot(s.x - goal.x, s.z - goal.z) >= 2 && s.hp > 0; n++)
      tick(w, 1 / 12)
    assert.ok(Math.hypot(s.x - goal.x, s.z - goal.z) < 2)
  }
  const target = { x: 15, z: -31 }
  selectUnit(w, s.id)
  assert.ok(command(w, { x: 20, z: -41 }))
  for (let n = 0; n < 100 && spellTargetError(w, 'hypnotise', target); n++) tick(w, 1 / 12)
  assert.equal(w.turn, 6172)
  assert.equal(spellTargetError(w, 'hypnotise', target), null)
  assert.ok(cast(w, 'hypnotise', target))
  assert.equal(w.shots.hypnotise, 0)
  for (
    let n = 0;
    n < 45 && !w.effects.some(f => f.kind === 'hypnotise' && f.turnsRemaining === 12);
    n++
  )
    tick(w, 1 / 12)
  const effect = w.effects.find(f => f.kind === 'hypnotise'),
    center = nativePosition(w, effect)
  assert.deepEqual([center.x, center.y], [5888, 5888])
  assert.equal(w.turn, 6185)
  tick(w, 1 / 12)
  const converted = w.units
    .filter(u => u.hypnotise?.originalTeam === 'red' && u.kind === 'warrior')
    .sort((a, b) => a.id - b.id)[0]
  assert.ok(converted)
  selectUnit(w, converted.id, false)
  assert.deepEqual(w.selected, [converted.id])
  assert.ok(command(w, { x: 20, z: -45 }))
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const replay = store.getWorld()
  const comparable = world => {
    const copy = structuredClone(world)
    for (const i of [0, 2]) copy.shrines[i].reward ??= 'mana'
    return copy
  }
  const initialRed = new Set(w.units.filter(u => u.team === 'red').map(u => u.id))
  let restored,
    restoredOwner,
    resumed = false
  for (let n = 0; n < 1100; n++) {
    tick(w, 1 / 12)
    tick(replay, 1 / 12)
    assert.deepEqual(comparable(replay), comparable(w))
    if (!restored) {
      restored = w.units.find(
        u => u.team === 'red' && u.kind === 'warrior' && !initialRed.has(u.id)
      )
      if (restored) {
        assert.equal(w.turn, 6625)
        assert.equal(restored.hp, 79.7)
        assert.ok(!w.units.includes(converted))
        assert.ok(!w.objectCells.objects.has(converted.id))
        restoredOwner = restored.native
        assert.equal(w.objectCells.objects.get(restored.id), restoredOwner)
      }
    }
    if (restored) {
      const person = restored.native ?? restored.flight ?? restored.fight?.motion
      const order = person && currentPersonOrder(w.buildingOrders, person)
      if (order?.model === 25 && !resumed) {
        assert.equal(w.turn, 6916)
        assert.equal(person, restoredOwner)
        assert.equal(w.objectCells.objects.get(restored.id), person)
        assert.deepEqual([order.a, order.b], [5632, 5632])
        for (const id of person.commands.filter(Boolean))
          assert.ok(w.buildingOrders.records[id].references > 0)
        resumed = true
      }
    }
    if (w.turn === 7168) {
      assert.ok(restored && restored.hp > 0)
      assert.deepEqual([restored.x, restored.z], [15, -30.6875])
    }
  }
  assert.ok(restored && restored.hp > 0)
  assert.ok(resumed)
  for (const id of [137, 138, 139, 140]) {
    const owners = w.units
      .filter(u =>
        [u.native, u.flight, u.entry?.person, u.fight?.motion].some(
          p => p && (p.commands.includes(id) || p.immediateCommand === id)
        )
      )
      .map(u => u.id)
      .sort((a, b) => a - b)
    assert.equal(w.buildingOrders.records[id].references, owners.length)
    assert.deepEqual(owners, id < 139 ? [] : [99, restored.id])
  }
  assert.equal(w.objectCells.objects.get(restored.id), restored.native)
})
