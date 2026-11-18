import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick, addUnit } from '../app/model.ts'
import { campaignRules } from '../app/campaign-command-runtime.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { syncLivePersonCells } from '../app/live-people.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import script from '../app/original-script-eight.json' with { type: 'json' }

function fixture(tribe) {
  // Canonicalize documented derived checkpoint fields before the supplied scenario.
  const w = migrateCheckpoint(createWorld(8)),
    team = ['blue', 'red', 'yellow', 'green'][tribe]
  const survivor = w.units.find(u => u.team === team && u.kind === 'warrior')
  w.units = w.units.filter(u => u.team !== team || u === survivor)
  w.buildings = w.buildings.filter(b => b.team !== team)
  syncLivePersonCells(w)
  w.killCredits[0][tribe] = 6
  w.activeCampaignTribe = tribe
  w.ai = w.campaignAIs[tribe]
  w.turn = 64 - tribe - 54
  return { w, survivor, team }
}

for (const tribe of [1]) {
  test(`Mission 8 tribe ${tribe} counts each completed hut model and Blue kill ownership`, () => {
    for (const level of [1, 2, 3]) {
      const { w, team } = fixture(tribe)
      const hut = { id: 60000, kind: 'hut', level, team, hp: 100, progress: 1 }
      w.buildings.push(hut)
      campaignRules(w)
      assert.equal(w.manaTribes[tribe].flags2 & 0x40, 0)
      hut.progress = 0.5
      w.killCredits[0][tribe] = 0
      w.killCredits[tribe][0] = 6
      campaignRules(w)
      assert.equal(w.manaTribes[tribe].flags2 & 0x40, 0)
      w.killCredits[0][tribe] = 6
      campaignRules(w)
      assert.equal(w.manaTribes[tribe].flags2 & 0x40, 0x40)
    }
  })
  test(`Mission 8 tribe ${tribe} last stand preserves threshold, cadence and mode bits`, () => {
    const { w, team } = fixture(tribe)
    w.manaTribes[tribe].flags2 |= 0x102
    const flags = w.manaTribes[tribe].flags2
    w.killCredits[0][tribe] = 5
    campaignRules(w)
    assert.equal(w.manaTribes[tribe].flags2, flags)
    w.killCredits[0][tribe] = 6
    const extras = Array.from({ length: 7 }, () => addUnit(w, team, 'brave', { x: 0, z: 0 }))
    campaignRules(w)
    assert.equal(w.manaTribes[tribe].flags2, flags)
    w.units = w.units.filter(u => !extras.includes(u))
    w.turn--
    campaignRules(w)
    assert.equal(w.manaTribes[tribe].flags2, flags)
    w.turn++
    campaignRules(w)
    assert.equal(w.manaTribes[tribe].flags2, flags | 0x40)
    w.manaTribes[tribe].flags2 &= ~0x40
    w.turn += 64
    campaignRules(w)
    assert.equal(w.manaTribes[tribe].flags2, flags | 0x40)
  })
  test(`Mission 8 tribe ${tribe} dispatches through tick and survives checkpoint`, () => {
    const { w, survivor } = fixture(tribe)
    const shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    tick(w, 1 / 12)
    assert.equal(w.manaTribes[tribe].flags2 & 0x40, 0x40)
    const order = currentPersonOrder(w.buildingOrders, survivor.native)
    assert.deepEqual(order && { model: order.model, target: order.a }, {
      model: 28,
      target: shaman.id,
    })
    const restored = migrateCheckpoint(structuredClone(w))
    assert.ok(restored)
    tick(w, 1 / 12)
    tick(restored, 1 / 12)
    assert.deepEqual(restored, w)
  })
}

test('Mission 8 preserves the imported last-stand program and field identities', () => {
  assert.equal(script.sha256, '441938566197d62880c924e1b1108dfbef5b95e1ee096c21ef88e9240ee63b98')
  assert.deepEqual(
    script.codes.slice(1832, 1867),
    [
      1005, 212, 213, 1003, 1000, 1020, 1013, 104, 107, 1012, 214, 37, 1003, 1007, 215, 164, 1008,
      215, 183, 1008, 215, 184, 1000, 1014, 215, 1, 1003, 1006, 1221, 1022, 1004, 1002, 1004, 1002,
      1004,
    ]
  )
  assert.deepEqual(
    [212, 213, 104, 107, 214, 37, 215, 164, 183, 184, 1].map(i => script.fields[i]),
    [
      [0, 63],
      [0, 54],
      [2, 1],
      [0, 8],
      [2, 1180],
      [0, 5],
      [1, 42],
      [2, 1066],
      [2, 1067],
      [2, 1068],
      [0, 0],
    ]
  )
})
