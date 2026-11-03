import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { checkpointCodec } from '../scripts/tutorial-browser/checkpoint-codec.mjs'
import { prepareSnapshotCamera, snapshotCameraOwner } from '../scripts/browser-performance/snapshot-camera-setup.mjs'
import * as helpers from '../scripts/browser-performance/snapshot-camera-setup.mjs'
const setup = readFileSync(new URL('../scripts/browser-performance/snapshot-setup.mjs', import.meta.url), 'utf8')
const body = setup.slice(setup.indexOf('export function assertSnapshotAdmission('), setup.indexOf('\nexport async function loadSnapshot('))
const admission = Function('assert', 'snapshotFinalCamera', body.replace('export ', '') + '; return assertSnapshotAdmission')(assert, helpers.snapshotFinalCamera)
const source = readFileSync(new URL('../app/camera-input.ts', import.meta.url), 'utf8')
// Actual rotate branch; the unused pan dependency must not execute.
const js = stripTypeScriptTypes(source).replace(/^import .*\n/gm, '').replace(/^export /gm, '')
const drag = Function('movePosition', js + '; return dragCamera')(() => { throw Error('Unexpected pan') })
function fixture(angle=256) {
  return {expected:checkpointCodec({cameras:{tribes:[{x:39936,y:23808,angle,h:59,initialized:true}]},manaWorld:{playerTribe:0}}),receipt:{focus:{x:149,z:-101},admittedSimulationSha256:'simulation',selected:[]}}
}
function pageFixture(f, options={}) {
  const pose=snapshotCameraOwner(f), events=[], velocity={turn:0,forward:0,side:0}
  let x=0,y=0,down=false,moves=0
  const canvas={getBoundingClientRect:()=>({left:0,top:0,width:1440,height:1000})}
  const scene={renderer:{domElement:canvas},cameraPosition:pose,cameraMotion:{active:0}}
  const page={
    locator:selector=>({focus:async()=>{assert.equal(selector,'canvas.battlefield');events.push('focus')}}),
    keyboard:{press:async key=>{assert.equal(key,'f');pose.x=40192;pose.y=23808;if(options.wrongHeading)pose.angle=17}},
    waitForFunction:async fn=>assert.equal(Function('window',`return (${fn})()`)({testSceneRef:{current:scene}}),true),
    evaluate:async fn=>Function('window','document',`return (${fn})()`)(
      {testSceneRef:{current:scene}}, {elementFromPoint:px=>options.obstructLeft&&px===688?null:canvas}),
    mouse:{
      move:async(nx,ny)=>{if(down){moves++;if(options.failMove)throw Error('move failed');drag(pose,velocity,true,nx-x,ny-y);events.push(['drag',nx-x]);assert.ok(Math.abs(nx-720)<=32)}x=nx;y=ny},
      down:async args=>{assert.deepEqual(args,{button:'right'});down=true},
      up:async args=>{assert.deepEqual(args,{button:'right'});down=false;events.push('up')},
      click:async(nx,ny,args)=>{assert.equal(nx,720);assert.equal(ny,500);assert.deepEqual(args,{button:'right'});events.push('clear')},
    },
  }
  return {page,pose,events,velocity,get down(){return down},get moves(){return moves}}
}
for(const angle of [0,256,1024,2047])test(`public preparation reaches exact zero pose from persisted heading ${angle}`,async()=>{
 const f=fixture(angle),p=pageFixture(f),before=JSON.stringify(f)
 await prepareSnapshotCamera(p.page,f)
 assert.deepEqual(p.pose,{x:40192,y:23808,angle:0,h:59,initialized:true})
 assert.deepEqual(p.velocity,{turn:0,forward:0,side:0});assert.equal(p.down,false)
 assert.ok(p.moves<=34);assert.deepEqual(p.events.filter(Array.isArray).slice(-2),[['drag',32],['drag',-32]])
 assert.equal(p.events.at(-1),'clear');assert.equal(JSON.stringify(f),before)
})
test('unexpected focused heading is not silently normalized',async()=>{
 const f=fixture(),p=pageFixture(f,{wrongHeading:true});await assert.rejects(prepareSnapshotCamera(p.page,f),/authored heading/);assert.equal(p.moves,0)
})
test('left endpoint obstruction prevents all pointer gestures',async()=>{
 const f=fixture(),p=pageFixture(f,{obstructLeft:true});await assert.rejects(prepareSnapshotCamera(p.page,f),/owned by battlefield/);assert.equal(p.moves,0)
})
test('failed rotation releases owned pointer button and preserves failure',async()=>{
 const f=fixture(),p=pageFixture(f,{failMove:true});await assert.rejects(prepareSnapshotCamera(p.page,f),/move failed/);assert.equal(p.down,false);assert.equal(p.events.at(-1),'up')
})
test('persisted camera shape and bounds fail closed',()=>{
 for(const change of [p=>p.angle=2048,p=>p.x=-1,p=>p.h=NaN,p=>p.initialized=false,p=>p.extra=1]){
  const f=fixture(),world=checkpointCodec(f.expected,true);change(world.cameras.tribes[0]);f.expected=checkpointCodec(world);assert.throws(()=>snapshotCameraOwner(f))
 }
})
function state(f){return {level:2,paused:true,sameScene:true,sceneConnected:true,latchRemoved:true,visibility:'visible',inputMask:0,flybyActive:false,modalSuspended:false,simulationSha256:'simulation',selected:[],mode:null,viewport:{width:1440,height:1000,devicePixelRatio:1,canvas:{width:1440,height:1000}},camera:{viewPoint:{...f.receipt.focus},position:{x:40192,y:23808,angle:0,h:59,initialized:true},presetMatches:true,projection:{width:1440,height:1000},bearing:0,preset:0,zoom:0,transition:false,overview:false,pointerGesture:false,navigation:0,motion:0,resultMotion:0,pointerButtons:0,preview:null,keys:[],velocity:{turn:0,forward:0,side:0}},unitsSha256:'u',terrainSha256:'t',timestampMs:1}}
test('actual admission retains final view and complete persisted owner fields',()=>{
 const f=fixture(),s=state(f);admission(s,f)
 for(const change of [s=>s.camera.position.angle=256,s=>s.camera.position.h++,s=>s.camera.position.extra=1,s=>s.camera.bearing=1,s=>s.simulationSha256='changed',s=>s.camera.viewPoint.x++]){
  const bad=structuredClone(s);change(bad);assert.throws(()=>admission(bad,f))
 }
})
test('actual admission retains complete camera stability across observation boundaries',()=>{
 const f=fixture(),before=state(f),after=structuredClone(before);after.timestampMs=2;admission(after,f,before)
 after.camera.extra='changed';assert.throws(()=>admission(after,f,before),/exactly stable/)
})
test('actual loader calls public preparation before both unchanged admission checks',()=>{
 assert.match(setup,/await prepareSnapshotCamera\(page, fixture\)\s+const first = await page\.evaluate\(observeSnapshotState\)\s+assertSnapshotAdmission\(first, fixture\)/)
 assert.match(setup,/assertSnapshotAdmission\(admitted, fixture, first\)/)
})
