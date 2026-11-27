import assert from 'node:assert/strict'
import test from 'node:test'
import {loadSceneFixture} from './support/bloodlust-scene.mjs'
test('live tribe tick reads the scheduled Blue territory refresh at the signed 96/97 boundary', async () => {
 const {createWorld,tick,nativePosition}=await loadSceneFixture()
 const samples=[]
 for (const [label, active, defeatTimer] of [
  ['active healthy',true,0],['active signed negative',true,-1],
  ['active just below threshold',true,96],['inactive with no defeat timer',false,0],
  ['active at threshold',true,97],
 ]) {
  const world=createWorld(1,'scalable')
  assert.equal(world.status,'playing')
  assert.equal(world.manaWorld.playerTribe,0)
  const tribe=world.manaTribes[0]
  assert.equal(tribe.active,true)
  assert.notEqual(tribe.playerType,1)
  assert.equal(tribe.flags2 & 64,0)
  assert.equal(world.land.landFlags & (2 | 0x800000),0)
  assert.equal(world.manaWorld.gameFlags & (2 | 32),0)
  assert.equal(world.manaWorld.loadFlags & 0x200,0)
  assert.equal(world.levelFlags2 & 0x100000,0)
  const house=world.buildings.find(b=>b.team==='blue' && b.hp>0)
  assert.ok(house)
  const p=nativePosition(world,house)
  const cell=((p.y&65535)>>9)*128+((p.x&65535)>>9)
  // This is a deliberately set scheduler boundary, not a natural elapsed defeat.
  world.turn=111
  tribe.active=active
  tribe.defeatTimer=defeatTimer
  const tag=world.land.searchTag
  assert.equal(tag,255)
  const region=world.land.regions[cell]
  assert.equal(region & 16,0)
  tick(world,1/12)
  assert.equal(world.turn,112)
  const got=[world.land.searchTag,world.land.regions[cell]&16]
  samples.push([label, active, defeatTimer,cell,got])
 }
 console.log('REFRESH_WITNESS',JSON.stringify(samples))
 assert.deepEqual(samples.slice(0,4).map(v=>v[4]),[[1,16],[1,16],[1,16],[255,0]])
 assert.deepEqual(samples[4][4],[255,0],'Blue territory is not refreshed at stored timer 97')
})
