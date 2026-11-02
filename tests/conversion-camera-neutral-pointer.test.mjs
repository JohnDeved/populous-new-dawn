import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { stripTypeScriptTypes } from 'node:module'

// Actual browser helper only. No model, Scene, Three or browser imports.
const source = readFileSync(new URL('../scripts/tutorial-browser/spell-conversion.mjs', import.meta.url), 'utf8')
const body = source.slice(source.indexOf('export function setupConversionCamera('), source.indexOf('// Logical records use the existing fixed-turn boundary'))
const setup = new vm.Script(body.replace('export function', 'function') + '\nsetupConversionCamera')
function fixture(pointer = null, effective = 0, mutate = () => {}, drain = () => {}) {
  const records = () => Array.from({length:4},()=>({x:0,y:0,angle:0}))
  const c = { phase:'idle', motion:{active:0}, result:{active:0}, resultRequest:0,
    overviewActive:false, overviewStage:null, viewTransition:null, input:{buttons:0,pointer,cursor:12},
    keys:new Set(), velocity:{x:0,y:0}, tribes:records(), held:records(), borrowed:records(),
    viewZoom:1,viewPreset:0,navigationTime:0,elapsed:7 }
  const w = { cameras:c, outcome:{level:3,cameraRequest:0}, paused:false,speed:1,inputMask:0,
    spellCasts:Array.from({length:3},()=>Array(18).fill(0)), manaWorld:{playerTribe:0,spells:Array.from({length:3},()=>({stocks:Array(18).fill(1)}))},
    effects:[],flyby:{flags:92},landVersion:1,terrainVersion:1,turn:64,pendingTime:0,mode:null }
  let drains=0,focuses=0
  const original=function(){ assert.equal(this,scene); drains++; w.turn++; drain(scene,w) }
  const scene={world:w,gameClock:{afterTurn(){}},advanceInputTime:original,started:true,inputDepth:0,modalSuspended:false,previous:1000,
    cameraPosition:c.tribes[0],cameraMotion:c.motion,resultCamera:c.result,cameraVelocity:c.velocity,keys:c.keys,
    overviewActive:false,overviewStage:null,viewTransition:null,viewZoom:1,viewPreset:0,
    navigationButtons:()=>effective,renderer:{getContext:()=>({RENDERER:1,getParameter:()=> 'supplied'})},
    // Supplied focus leaf models only the admitted exact owner writes, not native gameplay.
    focus(p){this.advanceInputTime(); if(this.disposed) return; focuses++;w.mode=null;c.navigationTime=0;c.motion.active=0;
      c.borrowed.forEach((v,i)=>Object.assign(v,c.held[i]));
      const x=Math.round((p.x+8)*256)&65535,y=Math.round((-p.z-8)*256)&65535;
      c.tribes[0].x=(x-c.held[0].x)&65535;c.tribes[0].y=(y-c.held[0].y)&65535;
      this.viewPoint={x:(((x-2048)<<16)>>16)/256,z:-(((y+2048)<<16)>>16)/256};this.cameraBearing=0;mutate(w,scene)
    }}
  const window={testSceneRef:{current:scene},testStore:{getWorld:()=>w},__pndConversionObservation:{result:{done:false,error:null}}}
  const context=vm.createContext({window,structuredClone,performance:{now:()=>1000}})
  const fn=setup.runInContext(context), codec=value=>JSON.parse(JSON.stringify(value,(_k,v)=>v instanceof Set?[...v]:v))
  return {scene,w,window,run:()=>fn(codec),counts:()=>({drains,focuses}),original}
}
function restored(f){assert.equal(f.scene.advanceInputTime,f.original);assert.equal(f.window.__pndConversionCameraSetup.restoration.restored,true)}
test('null tracker remains admitted and exact drain/focus ownership is retained',()=>{
 const f=fixture();assert.equal(f.run().status,'passed');assert.deepEqual(f.counts(),{drains:1,focuses:1});restored(f)
})
test('finite released interior tracker is preserved rather than normalized to null',()=>{
 const p={x:480,y:360,buttons:0},f=fixture(p);assert.equal(f.run().status,'passed');
 assert.equal(f.w.cameras.input.pointer,p);assert.deepEqual(p,{x:480,y:360,buttons:0});restored(f)
})
test('active raw buttons and malformed tracker values remain refused',()=>{
 for(const p of [{x:480,y:360,buttons:1},{x:480,y:360,buttons:2},{x:NaN,y:360,buttons:0},{x:480,y:Infinity,buttons:0},{x:480,y:360},Object.create({x:480,y:360,buttons:0})]){
  const f=fixture(p);assert.throws(f.run,/owner is unsupported/);assert.equal(f.counts().focuses,0);restored(f)
 }
})
test('effective edge navigation and malformed falsey outputs fail even with neutral raw input',()=>{
 for(const effective of [1,4,false,null,undefined,NaN]){
  const f=fixture({x:480,y:360,buttons:0},effective===undefined?'undefined':effective);
  if(effective===undefined)f.scene.navigationButtons=()=>undefined
  assert.throws(f.run,/owner is unsupported/);assert.equal(f.window.__pndConversionCameraSetup.ownerFailure.predicate,'effective-buttons');restored(f)
 }
})
test('existing preceding owner predicates remain fail closed and keyed before effective lookup',()=>{
 const cases=[['phase',c=>c.phase='draw'],['motion',c=>c.motion.active=1],['result',c=>c.result.active=1],['result-request',c=>c.resultRequest=1],['overview',c=>c.overviewActive=true],['overview-stage',c=>c.overviewStage=0],['view-transition',c=>c.viewTransition={}],['logical-buttons',c=>c.input.buttons=1],['keys',c=>c.keys.add('w')],['velocity',c=>c.velocity.x=1]]
 for(const [key,change]of cases){const f=fixture();change(f.w.cameras);f.scene.navigationButtons=()=>{throw Error('must not read later input')};assert.throws(f.run,/owner is unsupported/);assert.equal(f.window.__pndConversionCameraSetup.ownerFailure.predicate,key);restored(f)}
})
test('same-value replacement of pointer owner is rejected after focus',()=>{
 const p={x:480,y:360,buttons:0},f=fixture(p,0,w=>{w.cameras.input.pointer={...p}})
 assert.throws(f.run,/outside exact post-drain focus ownership/);restored(f)
})
test('post-focus pointer mutation and unrelated world mutation remain rejected',()=>{
 for(const mutate of [w=>w.cameras.input.pointer.x++,w=>w.turn++]){
  const f=fixture({x:480,y:360,buttons:0},0,mutate);assert.throws(f.run,/outside exact post-drain focus ownership/);restored(f)
 }
})

test('actual mouse tracker and navigation calculation distinguish interior release from edge movement',()=>{
 const input=readFileSync(new URL('../app/scene-input-runtime.ts',import.meta.url),'utf8'),
   camera=readFileSync(new URL('../app/camera-input.ts',import.meta.url),'utf8')
 const track=input.slice(input.indexOf('  const trackNavigation ='),input.indexOf("  for (const event of ['pointermove'")),
   nav=input.slice(input.indexOf('export function navigationButtons('),input.indexOf('export function chooseFollowers(')).replace('export function','function'),
   edge=camera.slice(camera.indexOf('export const mergeCameraInput'),camera.indexOf('// 0x442880')).replace('export const','const').replace('export function','function')
 const f=fixture(), scene=f.scene
 Object.defineProperty(scene,'navigationPointer',{get:()=>f.w.cameras.input.pointer,set:v=>{f.w.cameras.input.pointer=v}})
 const context=vm.createContext({scene,document:{querySelector:()=>null,documentElement:{clientWidth:960,clientHeight:720}}})
 const functions=new vm.Script(stripTypeScriptTypes(edge+nav+track+'\n({trackNavigation,navigationButtons})')).runInContext(context)
 scene.navigationButtons=()=>functions.navigationButtons(scene)
 functions.trackNavigation({pointerType:'mouse',clientX:480,clientY:360,buttons:0})
 const pointer=scene.navigationPointer
 assert.equal(scene.navigationButtons(),0);assert.equal(f.run().status,'passed');assert.equal(scene.navigationPointer,pointer)
 functions.trackNavigation({pointerType:'mouse',clientX:0,clientY:360,buttons:0})
 assert.equal(scene.navigationButtons(),4)
})

test('initially disposed and post-drain retired owners cannot pass even at coincident focus target',()=>{
 for(const retirement of ['disposed','stopped']){
  const f=fixture(null,0,()=>{},scene=>{if(retirement==='disposed')scene.disposed=true;else scene.started=false})
  Object.assign(f.w.cameras.tribes[0],{x:56064,y:21248,angle:0})
  f.scene.viewPoint={x:-45,z:-91};f.scene.cameraBearing=0
  assert.throws(f.run,/original Scene/);assert.equal(f.window.__pndConversionCameraSetup.status,'failed');restored(f)
 }
 const f=fixture();f.scene.disposed=true
 assert.throws(f.run,/original Scene/);assert.deepEqual(f.counts(),{drains:0,focuses:0})
 assert.equal(f.scene.advanceInputTime,f.original)
 assert.equal(f.window.__pndConversionCameraSetup.restoration.attempted,false)
})
