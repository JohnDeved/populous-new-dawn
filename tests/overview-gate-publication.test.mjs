import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {runInNewContext} from 'node:vm'
const source=readFileSync(new URL('../app/scene-camera-runtime.ts',import.meta.url),'utf8')
function fixture({active=false,buttons=16,mask=0,stage=null,disposed=false}={}) {
 const calls=[],input={buttons,cursor:41,time:12},keys=new Set(['arrowleft']),pointer={x:720,y:500,buttons:0}
 const scene={world:{inputMask:mask,mode:3,cameras:{input,elapsed:12,navigationTime:0.02},manaWorld:{playerTribe:0}},
  disposed,overviewStage:stage,overviewActive:active,overviewReturn:{preset:2,bearing:0.5},viewPreset:2,
  cameraPosition:{x:1,y:2,angle:128},cameraMotion:{active:1},globeMorph:{},globeMotion:{dragging:true,velocity:{x:1,y:1},position:{}},
  keys,navigationPointer:pointer,advanceInputTime(){calls.push(['drain',this.world.cameras.input.buttons])},
  captureCamera(interrupt){calls.push(['capture',interrupt,this.world.cameras.input.buttons])},updateView(){calls.push(['update'])},
  startGroundView(...args){calls.push(['ground',...args,this.world.cameras.input.buttons])}}
 const start=source.indexOf('export function overview('),end=source.indexOf('export function zoom(',start)
 assert.ok(start>=0&&end>start)
 const body=source.slice(start,end).replaceAll('export function','function').replaceAll('scene: GameScene','scene').replace('preset: number','preset')
 const functions=runInNewContext(body+';({overview,leaveOverview})',{
  previewGroundZoom:()=>false,displayedTribeCamera:()=>({angle:128}),beginGlobeMorph:(...args)=>calls.push(['morph',...args])})
 scene.leaveOverview=preset=>functions.leaveOverview(scene,preset)
 return {scene,calls,input,keys,pointer,...functions}
}
test('actual Enter overview transition neutralizes published held buttons before first render without a keyup',()=>{
 const f=fixture();f.overview(f.scene)
 assert.equal(f.scene.overviewStage,'enter');assert.equal(f.input.buttons,0)
 assert.deepEqual(f.calls.slice(0,2),[['drain',16],['capture',true,16]])
 assert.deepEqual(f.calls.at(-1),['ground',4,0,0])
 assert.equal(f.input.cursor,41);assert.equal(f.input.time,12);assert.equal(f.scene.world.cameras.elapsed,12);assert.equal(f.scene.world.cameras.navigationTime,0.02)
 assert.deepEqual([...f.keys],['arrowleft']);assert.equal(f.scene.navigationPointer,f.pointer)
})
test('actual Enter overview exit neutralizes publication while preserving held source and event identity',()=>{
 const f=fixture({active:true,buttons:4});f.overview(f.scene)
 assert.equal(f.scene.overviewStage,'exit');assert.equal(f.input.buttons,0)
 assert.equal(f.input.cursor,41);assert.equal(f.input.time,12);assert.deepEqual([...f.keys],['arrowleft'])
 assert.equal(f.scene.navigationPointer,f.pointer);assert.equal(f.scene.overviewReturn.preset,2)
 assert.deepEqual(f.calls[0],['drain',4])
})
test('direct public leaveOverview path also neutralizes without manufacturing another input event',()=>{
 const f=fixture({active:true,buttons:4});f.leaveOverview(f.scene,1)
 assert.equal(f.scene.overviewStage,'exit');assert.equal(f.input.buttons,0);assert.equal(f.input.cursor,41);assert.equal(f.input.time,12)
 assert.equal(f.scene.overviewReturn.preset,1);assert.equal(f.calls.some(x=>x[0]==='drain'),false)
})
test('disposed, masked and already transitioning overview requests preserve previous publication',()=>{
 for(const options of [{disposed:true},{mask:128},{stage:'enter'},{stage:'exit'}]) {
  const f=fixture(options);f.overview(f.scene)
  assert.equal(f.input.buttons,16);assert.equal(f.input.cursor,41);assert.equal(f.input.time,12)
  assert.deepEqual(f.calls,[['drain',16]])
 }
})
test('neutral input stays neutral and gate creation never clears raw held keys or pointer state',()=>{
 for(const active of [false,true]){
  const f=fixture({active,buttons:0});f.overview(f.scene)
  assert.equal(f.input.buttons,0);assert.deepEqual([...f.keys],['arrowleft']);assert.equal(f.scene.navigationPointer,f.pointer)
 }
})
