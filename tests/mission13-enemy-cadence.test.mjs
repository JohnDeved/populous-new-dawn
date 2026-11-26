import assert from 'node:assert/strict'
import test from 'node:test'
import { createGameStore } from '../app/game-store.ts'
import { syncLivePersonCells } from '../app/live-people.ts'
import { addUnit, campaignPersonCount, tick } from '../app/model.ts'
import { beginCast } from '../app/spell-casting.ts'

const models = [2, 17, 5, 6, 19, 12, 3, 7, 4, 11, 15, 14, 10, 8, 13, 16]
const early = [8, 8, 32, 40, 48, 66, 64, 70, 72, 80, 100, 140, 168, 64, 152, 128]
const late = [4, 4, 16, 20, 24, 33, 32, 35, 36, 40, 50, 70, 84, 180, 204, 64]
const flag = 0x40000
const profile = (w, tribe) => models.map(model => w.castingTribes[tribe].spells[model].interval)
const hasCadence = (w, tribe) => Boolean(w.campaignAIs[tribe].flags & flag)
const team = tribe => tribe === 2 ? 'yellow' : 'green'
const shaman = (w, tribe) => w.units.find(u => u.team === team(tribe) && u.kind === 'shaman' && u.hp > 0)
function advance(w, turn) {
  while (w.turn < turn) {
    const before = w.turn
    tick(w, 1 / 12)
    assert.equal(w.turn, before + 1)
  }
}
function mission() {
  const store = createGameStore()
  store.startMission(13)
  return store
}
function supply(w, tribe, count) {
  const leader = shaman(w, tribe)
  assert.ok(leader)
  const needed = count - campaignPersonCount(w, tribe)
  assert.ok(needed >= 0)
  for (let i = 0; i < needed; i++)
    addUnit(w, team(tribe), 'brave', {
      x: leader.x + ((i % 9) - 4) * 0.4,
      z: leader.z + (Math.floor(i / 9) - 4) * 0.4,
    })
  syncLivePersonCells(w)
  assert.equal(campaignPersonCount(w, tribe), count)
}
test('M13 retains Yellow flyby input lock on its unaided schedule', () => {
  const w = mission().getWorld()
  advance(w, 6)
  assert.equal(w.inputMask & 64, 0)
  advance(w, 7)
  assert.equal(w.inputMask & 64, 64)
})
test('M13 Matak and Chumara cadence starts on different authored turns from natural startup', () => {
  const w = mission().getWorld()
  advance(w, 121)
  const untouched = [profile(w, 0), profile(w, 1), profile(w, 2), profile(w, 3)]
  assert.deepEqual([hasCadence(w, 2), hasCadence(w, 3)], [false, false])
  advance(w, 122)
  assert.deepEqual([hasCadence(w, 2), hasCadence(w, 3)], [false, true])
  assert.deepEqual(profile(w, 2), untouched[2])
  assert.deepEqual(profile(w, 3), early)
  advance(w, 123)
  assert.ok(hasCadence(w, 2))
  assert.deepEqual(profile(w, 2), early)
  assert.deepEqual([profile(w, 0), profile(w, 1)], untouched.slice(0, 2))
})
for (const [count, mana, expected] of [[25, 499999, 499999], [26, 500000, 500000], [26, 499999, 507499]]) {
  test(`M13 aid follows strict population and mana boundaries at ${count}/${mana}`, () => {
    const w = mission().getWorld()
    advance(w, 121)
    for (const tribe of [2, 3]) {
      supply(w, tribe, count)
      w.manaTribes[tribe].mana = mana
    }
    const blue = w.manaTribes[0].mana
    advance(w, 122)
    assert.equal(w.manaTribes[3].mana, expected)
    assert.equal(w.manaTribes[2].mana, mana)
    advance(w, 123)
    assert.equal(w.manaTribes[3].mana, expected)
    assert.equal(w.manaTribes[2].mana, expected)
    assert.equal(w.manaTribes[0].mana, blue)
  })
}
test('M13 next staggered profile visits keep each in-flight Lightning cooldown intact', () => {
  const w = mission().getWorld()
  advance(w, 121)
  supply(w, 2, 72)
  supply(w, 3, 72)
  advance(w, 123)
  assert.deepEqual(profile(w, 2), early)
  assert.deepEqual(profile(w, 3), early)
  for (const tribe of [2, 3]) {
    const caster = shaman(w, tribe)
    beginCast(w, caster, 'lightning', { x: caster.x + 4, z: caster.z })
    assert.ok(w.projectiles.some(p => p.spell === 'lightning' && p.caster === caster.id))
    assert.equal(w.castingTribes[tribe].spells[3].remaining, 4096)
  }
  advance(w, 377)
  supply(w, 2, 73)
  supply(w, 3, 73)
  assert.deepEqual([profile(w, 2), profile(w, 3)], [early, early])
  advance(w, 378)
  assert.deepEqual([profile(w, 2), profile(w, 3)], [early, late])
  advance(w, 379)
  assert.deepEqual([profile(w, 2), profile(w, 3)], [late, late])
  assert.deepEqual([2, 3].map(t => w.castingTribes[t].spells[3].remaining), [3840, 3840])
})
