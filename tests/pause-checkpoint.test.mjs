import test from 'node:test'
import assert from 'node:assert/strict'
import {createGameStore} from '../app/game-store.ts'
test('modal checkpoint pause override affects the clone, never the live world',async()=>{
 const store=createGameStore(),world=store.getWorld()
 world.paused=true
 assert.equal(await store.saveCheckpoint(false),false)
 assert.equal(world.paused,true)
 assert.equal(store.hasCheckpoint(),true)
 assert.equal(store.loadCheckpoint(),true)
 assert.notEqual(store.getWorld(),world)
 assert.equal(store.getWorld().paused,false)
})
test('ordinary saves retain explicitly paused state and replacement does not mutate the old world',async()=>{
 const store=createGameStore(),old=store.getWorld()
 old.paused=true
 await store.saveCheckpoint()
 store.restart()
 assert.equal(old.paused,true)
 store.loadCheckpoint()
 assert.equal(store.getWorld().paused,true)
})
