import assert from 'node:assert/strict'
import test from 'node:test'
import { createGift, createWorld, tick } from '../app/model.ts'
import { chargingSpells } from '../app/mana.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { stepLiveRestingState } from '../app/live-resting.ts'

function rewardFixture(shots, gifts) {
  const w = createWorld(1)
  w.shots.bridge = shots
  w.giftCounts.bridge = gifts
  const head = w.shrines.find(s => s.kind === 'bridge')
  assert.ok(head)
  const gift = createGift(w, 'bridge', head)
  assert.equal(gift.remaining, 82)
  const advance = n => { for (let i = 0; i < n; i++) tick(w, 1 / 12) }
  return { w, gift, advance }
}

test('004c2aa0: a live spell reward increments the gift counter even at full stock and saturates at 15', () => {
  for (const initial of [13, 14, 15]) {
    const { w, gift, advance } = rewardFixture(4, initial)
    advance(81)
    assert.equal(w.gifts.includes(gift), true)
    assert.equal(w.giftCounts.bridge, initial)
    advance(1)
    assert.equal(w.gifts.includes(gift), false)
    assert.equal(w.giftCounts.bridge, Math.min(15, initial + 1))
    assert.equal(w.shots.bridge, 4)
  }
})

test('004c2cd0: live ordinary reward increments only stock below the cap', () => {
  for (const initial of [2, 3, 4, 5]) {
    const { w, gift, advance } = rewardFixture(initial, 2)
    advance(81)
    assert.equal(gift.remaining, 1)
    assert.equal(w.shots.bridge, initial)
    advance(1)
    assert.equal(w.shots.bridge, initial < 4 ? initial + 1 : initial)
    assert.equal(w.giftCounts.bridge, 3)
  }
})

test('004c2d50: player charging reads distinct normal and alternate limits for bridge', () => {
  for (const [flag, shots, active] of [[0, 3, 1], [0, 4, 0], [32, 4, 1], [32, 5, 0]]) {
    const w = createWorld(1)
    const m = w.manaWorld
    const stock = m.spells[0]
    stock.available = 1 << 12
    stock.disabled = 0
    m.gameFlags = (m.gameFlags & ~32) | flag
    stock.stocks[12] = 0x70 | shots
    const charging = chargingSpells(m, 0)
    w.shots.bridge = shots
    w.manaTribes[0].available = 500
    tick(w, 1 / 12)
    assert.equal(w.manaTribes[0].estimatedRate > 0, Boolean(active))
    assert.deepEqual(charging, { active, paused: 0, highest: active ? 12 : 0 })
  }
})

test('004d3dd0: live resting arrival matches both native cell coordinates, not the subcell', () => {
  for (const [goalX, goalY, state] of [[0xffff, 0xffff, 19], [0, 0xffff, 17], [0xffff, 0, 17]]) {
    const w = createWorld(1)
    const u = w.units.find(u => u.team === 'blue' && u.kind === 'brave')
    const p = (u.native = createLivePerson(w, u))
    registerLivePerson(w, p)
    assert.ok(p)
    Object.assign(p, { x: 0xfe00, y: 0xff00, goalX, goalY, state: 17, slowTurn: false, flags2: 0 })
    stepLiveRestingState(w, u, p)
    assert.equal(p.state, state)
  }
})
