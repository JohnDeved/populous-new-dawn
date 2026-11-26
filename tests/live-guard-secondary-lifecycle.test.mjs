import test from 'node:test'
import assert from 'node:assert/strict'
import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import { addUnit, nativePosition } from '../app/model.ts'
import { createGameStore } from '../app/game-store.ts'
import { allocateGuardPost, guardPostCell, guardPostLandIndex, guardPostsInCell } from '../app/guard-posts.ts'
import { guardPostClick, removeHoveredGuardPost } from '../app/live-command.ts'
import { allocateSecondaryEffect } from '../app/secondary-effects.ts'
import { stepSecondaryEffects } from '../app/hut-smoke-runtime.ts'
import { currentPersonOrder } from '../app/person-orders.ts'

const clearWorld = () => {
  const w = createStartedWorld(1, 'scalable')
  retainFixtureUnits(w, () => false)
  w.buildings = []
  w.shrines = []
  w.trees = []
  w.terrain.fill(3)
  w.terrainVersion++
  w.manaWorld.gameFlags = 32
  w.paused = false
  w.inputMask = 0
  w.mode = null
  return w
}
const effects = (w, kind) => w.secondaryEffects.order
  .map(slot => w.secondaryEffects.slots[slot]).filter(effect => effect.kind === kind)
const A = { x: -10, z: 8 }, B = { x: 0, z: 8 }, C = { x: 10, z: 8 }
const cellAt = (w, point) => guardPostCell(nativePosition(w, point))
const visit = w => { w.turn++; stepSecondaryEffects(w) }

test('00503230: checkpointed posts recover the real cosmetic cadence, excluding other secondary records', async () => {
  for (const [count, expected] of [[12,[1,1,1]], [13,[0,1,1]], [21,[0,1,1]],
    [22,[0,0,1]], [32,[0,0,1]], [33,[0,0,0]]]) {
    const w = clearWorld()
    for (let i = 0; i < count; i++) {
      const cell = (40 + 2*(i%11)) | ((40 + 2*Math.floor(i/11)) << 8)
      assert.notEqual(allocateGuardPost(w,cell),null)
    }
    const [probe] = effects(w,'guardPost')
    const home = {...probe.position}
    for (let i=0;i<3;i++) assert.notEqual(allocateSecondaryEffect(w.secondaryEffects,{
      kind:'hutPuff', counter:0, lifetime:20, frameStart:0, position:{...home}
    }),null)
    const store = createGameStore()
    Object.assign(store.getWorld(),w)
    store.getWorld().paused = true
    assert.equal(await store.saveCheckpoint(false),false,'memory checkpoint, no IndexedDB')
    assert.equal(store.loadCheckpoint(),true)
    const restored = store.getWorld()
    assert.equal(effects(restored,'guardPost').length,count)
    assert.equal(effects(restored,'hutPuff').length,3)
    for (const p of effects(restored,'guardPost')) restored.land.categories[guardPostLandIndex(p.cell)] = 0
    const actual = []
    for (const counter of [1,3,7]) {
      for (const p of effects(restored,'guardPost'))
        p.counter = p.cell===probe.cell ? counter : 0
      const before = effects(restored,'guardPostSmoke').length
      visit(restored)
      actual.push(effects(restored,'guardPostSmoke').length-before)
    }
    assert.deepEqual(actual,expected,`restored post-only smoke at ${count} posts`)
  }
})

test('004ee1e0: removing a middle player guard record unindexes its cell and reuses its secondary slot', () => {
  const w = clearWorld()
  const u = addUnit(w,'blue','brave',{x:-25,z:8})
  w.selected = [u.id]
  assert.equal(guardPostClick(w,A),'placed')
  assert.equal(guardPostClick(w,B),'placed')
  assert.equal(guardPostClick(w,C),'placed')
  const state=w.secondaryEffects
  const [c,b,a] = state.order
  const surviving = [state.slots[c],state.slots[a]]
  const retired = state.slots[b]
  const commands = [...u.native.commands]
  const current = currentPersonOrder(w.buildingOrders,u.native)
  assert.ok(current)
  assert.equal(removeHoveredGuardPost(w,B),true)
  assert.equal(state.slots[b],null)
  assert.deepEqual(state.order,[c,a])
  assert.equal(state.free.at(-1),b)
  assert.equal(guardPostsInCell(state,cellAt(w,B)).length,0)
  assert.equal(state.slots[c],surviving[0])
  assert.equal(state.slots[a],surviving[1])
  w.selected=[]
  assert.equal(guardPostClick(w,B),'placed')
  assert.deepEqual(state.order,[b,c,a])
  assert.equal(guardPostsInCell(state,cellAt(w,B))[0].slot,b)
  assert.notEqual(state.slots[b].serial,retired.serial)
  assert.deepEqual(u.native.commands,commands)
  assert.equal(currentPersonOrder(w.buildingOrders,u.native),current)
})
