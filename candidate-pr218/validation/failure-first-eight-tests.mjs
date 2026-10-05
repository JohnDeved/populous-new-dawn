import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld } from '../app/model.ts'
import { advanceGame, afterCurrentGameTurn } from '../app/game-clock.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import {
  createStoneHeadAnimation, initializeStoneHead, stoneHeadFrame, syncStoneHeadPresentation,
} from '../app/stone-head-animation.ts'

const clock = () => ({ animationTime: 0, animationFrame: 0 })
function scenario() {
  const world = createWorld(1)
  world.manaWorld.gameFlags = 32
  const head = world.shrines.find(s => s.kind === 'bridge')
  return { world, head, state: head.stoneHead, timing: clock() }
}

test('authored45 constructors retain the original logical animation gate', () => {
  const { head, state } = scenario()
  assert.equal(state.flags3 & 0x40000, 0x40000)
  assert.equal(createStoneHeadAnimation(false, state).flags3 & 0x40000, 0x40000)
  assert.equal(head.model, 45)
})

test('ordinary body frames wait for logical turns without changing the24Hz presentation clock', () => {
  const { world, state, timing } = scenario()
  advanceGame(world, timing, 1 / 24)
  assert.equal(world.turn, 0)
  assert.equal(stoneHeadFrame(state), 0)
  advanceGame(world, timing, 1 / 24)
  assert.equal(world.turn, 1)
  assert.equal(stoneHeadFrame(state), 1)
  assert.equal(state.stamp, 1)
  assert.equal(timing.animationFrame, 2)
  world.speed = 0
  const before = structuredClone(state)
  advanceGame(world, timing, 1)
  assert.equal(timing.animationFrame, 26)
  assert.deepEqual(state, before, 'speed0 supplies no new ordinary logical visit')
})

test('each catch-up controller and observer sees the prior body frame before one logical advance', () => {
  const { world, state, timing } = scenario(), events = []
  world.speed = 4
  timing.beforeTurn = () => {
    events.push(['before', stoneHeadFrame(state)])
    assert.equal(afterCurrentGameTurn(timing, () => events.push(['queued', stoneHeadFrame(state)])), true)
  }
  timing.afterTurn = () => events.push(['after', stoneHeadFrame(state)])
  advanceGame(world, timing, 1 / 4)
  assert.equal(world.turn, 12)
  assert.equal(timing.animationFrame, 6)
  assert.deepEqual(events, Array.from({ length: 12 }, (_, turn) => [
    ['before', turn], ['after', turn], ['queued', turn],
  ]).flat())
  assert.equal(stoneHeadFrame(state), 12)
  assert.equal(state.stamp, 12)
})

test('mode4 transition remains exclusively presentation-owned despite the gate bit', () => {
  const { world, state, timing } = scenario()
  state.flags3 |= 0x40000
  state.renderFlags |= 0x1000
  state.morphFrames = 20
  advanceGame(world, timing, 1 / 12)
  assert.equal(state.morphTimer, 8)
  assert.equal(state.f1, 0)
  assert.equal(state.stamp, 0, 'presentation must not invent a logical body stamp')
})

test('lazy, post-turn allocated and removed bodies obey the completed-turn boundary', () => {
  const lazy = scenario()
  delete lazy.head.stoneHead
  advanceGame(lazy.world, lazy.timing, 1 / 24)
  assert.equal(lazy.head.stoneHead.f1, 0)
  advanceGame(lazy.world, lazy.timing, 1 / 24)
  assert.equal(lazy.head.stoneHead.f1, 4)
  assert.equal(lazy.head.stoneHead.stamp, 1)

  const born = scenario()
  born.world.shrines = born.world.shrines.filter(s => s !== born.head)
  delete born.head.stoneHead
  born.timing.afterTurn = () => { born.world.shrines.push(born.head) }
  advanceGame(born.world, born.timing, 1 / 12)
  assert.equal(born.head.stoneHead.f1, 4)
  assert.equal(born.head.stoneHead.stamp, 1)

  const removed = scenario()
  removed.timing.afterTurn = () => { removed.world.shrines = removed.world.shrines.filter(s => s !== removed.head) }
  advanceGame(removed.world, removed.timing, 1 / 12)
  assert.equal(removed.state.f1, 0, 'removed body receives no logical or trailing presentation visit')
})

test('legacy body checkpoints gain only the gate and a new Scene clock does not replay a turn', () => {
  const { world, head, state } = scenario()
  Object.assign(state, { flags3: 0x100, stamp: 77, f1: 28 })
  const restored = migrateCheckpoint(structuredClone(world)),
    loaded = restored.shrines.find(s => s.id === head.id), timing = clock()
  initializeStoneHead(loaded, restored.outcome.level)
  assert.equal(loaded.stoneHead.flags3, 0x40100)
  assert.equal(loaded.stoneHead.f1, 28)
  assert.equal(loaded.stoneHead.stamp, 77)
  advanceGame(restored, timing, 1 / 24)
  assert.equal(loaded.stoneHead.f1, 28)
  advanceGame(restored, timing, 1 / 24)
  assert.equal(loaded.stoneHead.f1, 32)
  assert.equal(loaded.stoneHead.stamp, 1)
})

test('disable and refill notifications retain raw phase then reset before their owned visit', () => {
  const { world, head, state, timing } = scenario()
  advanceGame(world, timing, 1 / 12)
  assert.equal(state.f1, 4)
  timing.afterTurn = () => {
    head.enabled = world.turn !== 2
    syncStoneHeadPresentation(head)
  }
  advanceGame(world, timing, 1 / 12)
  assert.equal(state.f1, 4)
  assert.equal(stoneHeadFrame(state), 1)
  assert.equal(state.stamp, 2)
  advanceGame(world, timing, 1 / 12)
  assert.equal(state.f1, 4, 'refill resets before exactly one animation visit')
  assert.equal(state.stamp, 3)
})

test('trigger exhaustion, pause, land pause and turn wrap preserve the separate decorative owner', () => {
  const { world, head, state, timing } = scenario()
  head.active = false
  head.remaining = 0
  advanceGame(world, timing, 1 / 24)
  assert.equal(state.f1, 0)
  advanceGame(world, timing, 1 / 24)
  assert.equal(state.f1, 4)
  const before = structuredClone(state)
  world.paused = true
  advanceGame(world, timing, 1)
  assert.deepEqual(state, before)
  world.paused = false
  world.land.landFlags |= 2
  advanceGame(world, timing, 1)
  assert.deepEqual(state, before)
  world.land.landFlags &= ~2
  world.turn = 0xffffffff
  advanceGame(world, timing, 1 / 12)
  assert.equal(world.turn, 0)
  assert.equal(state.stamp, 0)
  assert.equal(state.f1, 8)
})
