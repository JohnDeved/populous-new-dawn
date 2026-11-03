import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {stripTypeScriptTypes} from 'node:module'
const fixture=readFileSync(new URL('./ordinary-numeric-constructor.test.mjs',import.meta.url),'utf8')
const scene=readFileSync(new URL('../app/scene.ts',import.meta.url),'utf8')
const store=readFileSync(new URL('../app/game-store.ts',import.meta.url),'utf8')
const pointerSource=fixture.slice(fixture.indexOf('  const pointer = (type,'),fixture.indexOf('  return { ...f, store, mount, pointer,'))
const listenerSource=scene.slice(scene.indexOf('  listen(target:'),scene.indexOf('  setSize()',scene.indexOf('  listen(target:')))
const Listener=Function('return '+stripTypeScriptTypes(`function build(){class Listener {${listenerSource}};return Listener}`))()()
test('actual Home pointer fixture shares supplied zero/subtick clock with actual ordered Scene listener',()=>{
 let now=0;const window=new EventTarget(),delivered=[],events=[]
 const pointer=Function('window','performance',pointerSource+'return pointer')(window,{now:()=>now})
 const owner=new Listener();Object.assign(owner,{disposed:false,inputDepth:0,disposeListeners:[],advanceInputTime:t=>delivered.push(t),publishCameraInput:()=>{}})
 owner.listen(window,'pointermove',e=>events.push([e.clientX,e.buttons,e.timeStamp]))
 pointer('pointermove');now=12.5;pointer('pointermove',{clientX:1199})
 assert.deepEqual(delivered,[0,12.5]);assert.deepEqual(events,[[0,0,0],[1199,0,12.5]])
 assert.equal(owner.inputDepth,0);for(const dispose of owner.disposeListeners)dispose()
})
test('actual durable fixture provides EventTarget database for real open/cache-close contract',async()=>{
 const start=fixture.indexOf('const durableSettle ='),end=fixture.indexOf('// Sequential reference/replay',start)
 let source=fixture.slice(start,end)
 const original="const { createGameStore } = await import(`../app/game-store.ts?durable-constructor=${++durableSession}`)"
 assert.equal(source.split(original).length,2)
 source=source.replace(original,'const createGameStore = suppliedCreateStore')
 const withStorage=Function('assert','suppliedCreateStore',source+'return withDurableStorage')(assert,()=>({}))
 const openSource=store.slice(store.indexOf('function openCheckpointDatabase()'),store.indexOf('async function readStoredState()'))
 await withStorage(async f=>{
  const probe=indexedDB.open();await f.open();const db=probe.result
  assert.equal(typeof db.addEventListener,'function');assert.equal(typeof db.dispatchEvent,'function')
  const open=Function('return '+stripTypeScriptTypes('function build(CHECKPOINT_DATABASE,CHECKPOINT_STORE){let checkpointDatabase;'+openSource+'return openCheckpointDatabase}'))()('supplied','checkpoints')
  const first=open();await f.open();assert.equal(await first,db);assert.equal(open(),first)
  db.dispatchEvent(new Event('close'));const second=open();assert.notEqual(second,first);await f.open();assert.equal(await second,db)
 })
})
