import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick, addUnit } from '../app/model.ts'
import { campaignRules } from '../app/campaign-command-runtime.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { syncLivePersonCells } from '../app/live-people.ts'
import { currentPersonOrder } from '../app/person-orders.ts'

function fixture(tribe) {
  const w = createWorld(23), team = ['blue', 'red', 'yellow', 'green'][tribe]
  const survivor = w.units.find(u => u.team === team && u.kind === 'brave')
  w.units = w.units.filter(u => u.team !== team || u === survivor)
  w.buildings = w.buildings.filter(b => b.team !== team)
  syncLivePersonCells(w)
  w.killCredits[0][tribe] = 11
  w.activeCampaignTribe = tribe
  w.ai = w.campaignAIs[tribe]
  w.turn = 64 - tribe
  return { w, survivor, team }
}

for (const tribe of [1, 2, 3]) {
  test(`Mission 23 tribe ${tribe} counts each completed hut model and Blue kill ownership`, () => {
    for (const level of [1, 2, 3]) {
      const { w, team } = fixture(tribe)
      const hut = { id: 60000, kind: 'hut', level, team, hp: 100, progress: 1 }
      w.buildings.push(hut)
      campaignRules(w)
      assert.equal(w.manaTribes[tribe].flags2 & 0x40, 0)
      hut.progress = 0.5
      w.killCredits[0][tribe] = 0
      w.killCredits[tribe][0] = 11
      campaignRules(w)
      assert.equal(w.manaTribes[tribe].flags2 & 0x40, 0)
      w.killCredits[0][tribe] = 11
      campaignRules(w)
      assert.equal(w.manaTribes[tribe].flags2 & 0x40, 0x40)
    }
  })
  test(`Mission 23 tribe ${tribe} last stand preserves threshold, cadence and mode bits`, () => {
    const { w, team } = fixture(tribe)
    w.manaTribes[tribe].flags2 |= 0x102
    const flags = w.manaTribes[tribe].flags2
    w.killCredits[0][tribe] = 10
    campaignRules(w)
    assert.equal(w.manaTribes[tribe].flags2, flags)
    w.killCredits[0][tribe] = 11
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
  test(`Mission 23 tribe ${tribe} dispatches through tick and survives checkpoint`, () => {
    const { w, survivor } = fixture(tribe)
    const shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    tick(w, 1 / 12)
    assert.equal(w.manaTribes[tribe].flags2 & 0x40, 0x40)
    const order = currentPersonOrder(w.buildingOrders, survivor.native)
    assert.deepEqual(order && { model: order.model, target: order.a }, { model: 28, target: shaman.id })
    const restored = migrateCheckpoint(structuredClone(w))
    assert.ok(restored)
    tick(w, 1 / 12)
    tick(restored, 1 / 12)
    assert.deepEqual(restored, w)
  })
}
