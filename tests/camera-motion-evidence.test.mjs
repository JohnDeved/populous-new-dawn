import test from 'node:test'
import assert from 'node:assert/strict'
import { runInNewContext } from 'node:vm'
import { mkdtempSync,readFileSync,rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { installCameraMotionObserver } from '../scripts/tutorial-browser/camera-motion-observer.mjs'
import { acceptCameraMotionCase } from '../scripts/tutorial-browser/camera-motion-acceptance.mjs'
import cameraMotionEvidence from '../scripts/tutorial-browser/camera-motion-evidence.mjs'

function observerFixture({throwValue,throws=false}={}) {
  const calls=[],listeners=[],world={turn:1,time:1,inputMask:0,paused:false,flyby:{flags:0},
    cameras:{elapsed:1,navigationTime:0,input:{buttons:0,cursor:0}}}
  const scene={world,started:true,disposed:false,scene:{},camera:{},cameraPosition:{x:1,y:2,angle:3},viewPoint:{x:4,z:5},
    cameraBearing:0,overviewActive:false,overviewStage:null,viewPreset:0,keys:new Set(),navigationPointer:null}
  const sentinel={return:true},original=function(...args){calls.push({receiver:this,args});if(throws)throw throwValue;this.info.render.frame++;return sentinel}
  world.manaWorld={playerTribe:0};world.cameras.tribes=[scene.cameraPosition]
  const renderer=scene.renderer={domElement:{isConnected:true},info:{render:{frame:0}},render:original}
  const window={testSceneRef:{current:scene},testStore:{getWorld:()=>world},
    addEventListener(type,fn,capture){listeners.push({type,fn,capture})},
    removeEventListener(type,fn,capture){const i=listeners.findIndex(x=>x.type===type&&x.fn===fn&&x.capture===capture);if(i>=0)listeners.splice(i,1)}}
  runInNewContext('('+installCameraMotionObserver.toString()+')()', {window,performance:{now:()=>10}})
  return {window,scene,renderer,original,sentinel,calls,listeners}
}
test('actual observer preserves renderer receiver/arguments/result and restores descriptor',()=>{
  const f=observerFixture(),before=Object.getOwnPropertyDescriptor(f.renderer,'render')
  const result=f.renderer.render(f.scene.scene,f.scene.camera,'extra')
  assert.equal(result,f.sentinel);assert.equal(f.calls.length,1);assert.equal(f.calls[0].receiver,f.renderer)
  assert.equal(f.calls[0].args[2],'extra')
  const report=f.window.__pndCameraMotion.stop()
  assert.equal(report.frames.length,1);assert.equal(report.failed,false);assert.equal(report.restored,true)
  assert.equal(f.renderer.render,f.original);assert.equal(f.listeners.length,0)
  assert.equal(Object.getOwnPropertyDescriptor(f.renderer,'render').enumerable,before.enumerable)
})
test('original falsey render throw is propagated exactly and never recorded as a completed frame',()=>{
  for(const value of [null,undefined,false,0,'']) {
    const f=observerFixture({throws:true,throwValue:value});let failed=false,error
    try{f.renderer.render(f.scene.scene,f.scene.camera)}catch(e){failed=true;error=e}
    assert.equal(failed,true);assert.equal(error,value)
    assert.equal(f.window.__pndCameraMotion.stop().frames.length,0)
  }
})
test('foreign render owner is not overwritten during cleanup',()=>{
  const f=observerFixture(),foreign=()=>{}
  f.renderer.render=foreign
  const r=f.window.__pndCameraMotion.stop()
  assert.equal(r.failed,true);assert.equal(r.restored,false);assert.equal(f.renderer.render,foreign)
  assert.equal(f.listeners.length,0)
})
test('retired world fails observation without throwing through successful production render',()=>{
  const f=observerFixture();f.scene.disposed=true
  assert.equal(f.renderer.render(f.scene.scene,f.scene.camera),f.sentinel)
  const r=f.window.__pndCameraMotion.stop();assert.equal(r.failed,true);assert.equal(r.frames.length,0)
})
test('actual event boundaries retain before/after clocks and trust without changing event',()=>{
  const f=observerFixture(),event={type:'keydown',key:'ArrowLeft',isTrusted:true,timeStamp:9,defaultPrevented:false}
  f.listeners.find(x=>x.type==='keydown'&&x.capture).fn(event)
  f.scene.world.cameras.elapsed=2;f.scene.keys.add('arrowleft')
  f.listeners.find(x=>x.type==='keydown'&&!x.capture).fn(event)
  const row=f.window.__pndCameraMotion.stop().events[0]
  assert.equal(row.before.cameraElapsed,1);assert.equal(row.after.cameraElapsed,2)
  assert.equal(row.trusted,true);assert.equal(event.defaultPrevented,false)
})
function validCase() {
 const row=(frame,phase,more={})=>({frame,phase,observedAt:frame,inputMask:0,overviewStage:null,flyby:false,
   suspended:false,paused:false,inputButtons:1,inputCursor:4,pose:[frame,2,3],overview:phase==='entered',...more})
 const frames=[row(1,'ground',{overviewStage:'enter',inputButtons:0}),...Array.from({length:4},(_,i)=>row(i+2,'entered')),
   row(6,'transition',{overviewStage:'exit',inputButtons:0}),...Array.from({length:4},(_,i)=>row(i+7,'exited'))]
 return {kind:'overview-key',observation:{failed:false,stopped:true,restored:true,frames,
   events:[{type:'keydown',key:'ArrowLeft',trusted:true,before:{},after:{}}]},captures:[0,1,2].map(i=>({bytes:1,sha256:String(i).repeat(64),before:{frame:7},after:{frame:8}}))}
}
test('validator admits scoped natural-frame sequence but rejects refreshed input, no motion and untrusted event',()=>{
 assert.equal(acceptCameraMotionCase(validCase()).status,'passed')
 for(const mutate of [r=>r.observation.frames.at(-1).inputCursor++,r=>r.observation.frames.filter(x=>x.phase==='exited').forEach(x=>x.pose=[1,2,3]),r=>r.observation.events[0].trusted=false]) {
   const r=validCase();mutate(r);assert.throws(()=>acceptCameraMotionCase(r))
 }
})
test('release-negative must really release while gated and cannot resurrect navigation',()=>{
 const r=validCase();r.kind='overview-key-release';r.captures=[]
 r.observation.frames.forEach(x=>x.inputButtons=0)
 r.observation.events.push({type:'keyup',key:'ArrowLeft',trusted:true,before:{overviewStage:'enter'},after:{overviewStage:'enter',observedAt:0}})
 assert.equal(acceptCameraMotionCase(r).status,'passed')
 r.observation.events[1].before.overviewStage=null;assert.throws(()=>acceptCameraMotionCase(r))
})
async function routeCase(perform,now,overrides={}) {
 const output=mkdtempSync(join(tmpdir(),'pnd-camera-motion-')),receipt={},calls=[]
 const browser={close:async()=>calls.push('browser-close')};let failed=false,error
 try {await cameraMotionEvidence({browser,url:'http://127.0.0.1:4000',output,source:{commit:'a'.repeat(40)},expectedRevision:'a'.repeat(40),receipt,perform,now,...overrides})}
 catch(e){failed=true;error=e}
 let disk
 try{disk=JSON.parse(readFileSync(join(output,'camera-motion.json'),'utf8'))}catch(error){if(error.code!=='ENOENT')throw error;disk=null}finally{rmSync(output,{recursive:true,force:true})}
 return {failed,error,receipt,disk,calls}
}
test('route preserves falsey primary and closes owned browser',async()=>{
 const r=await routeCase(async()=>{throw null})
 assert.equal(r.failed,true);assert.equal(r.error,null);assert.deepEqual(r.calls,['browser-close'])
 assert.equal(r.disk.status,'failed');assert.equal(r.receipt.operationSettled,true)
})
test('route does not allow a late completed operation past fixed budget',async()=>{
 let now=0
 const r=await routeCase(async({receipt})=>{receipt.cases=Array.from({length:6},()=>({acceptance:{status:'passed'}}));now=178000},()=>now)
 assert.equal(r.failed,true);assert.equal(r.disk.status,'failed')
})
test('cleanup-time runtime error fails a previously successful procedure',async()=>{
 const r=await routeCase(async({receipt,ownContext})=>{
   ownContext({close:async()=>receipt.errors.push('cleanup runtime error')})
   receipt.cases=Array.from({length:6},()=>({acceptance:{status:'passed'}}))
 })
 assert.equal(r.failed,true);assert.equal(r.disk.status,'failed')
})
test('failed context close is retained, not retried, and browser owner is still closed',async()=>{
 let closes=0
 const r=await routeCase(async({ownContext,releaseContext})=>{
   const context={close:async()=>{closes++;throw false}}
   ownContext(context);await releaseContext(context)
 })
 assert.equal(closes,1);assert.equal(r.failed,true)
 assert.equal(r.disk.cleanupConfirmed,false);assert.deepEqual(r.calls,['browser-close'])
})
test('natural flyby edge requires preserved pointer and masked key remains rejected',()=>{
 const r=validCase();r.kind='flyby-edge'
 r.observation.frames.forEach((row,i)=>{row.phase=i<2?'flyby':'released';row.overview=false;row.overviewStage=null;row.flyby=i<2;row.inputMask=i<2?64:0;row.inputButtons=i<2?0:1;row.navigationPointer={x:1,y:500,buttons:0}})
 r.observation.events=[{type:'pointermove',x:1,trusted:true,before:{flyby:true,inputMask:64},after:{observedAt:1,flyby:true,inputMask:64}}]
 assert.equal(acceptCameraMotionCase(r).status,'passed')
 r.observation.frames.at(-1).navigationPointer.x=2;assert.throws(()=>acceptCameraMotionCase(r))
 r.kind='flyby-masked-key';r.captures=[];r.observation.frames.forEach(row=>row.inputButtons=0)
 r.observation.events=[{type:'keydown',key:'ArrowLeft',trusted:true,before:{flyby:true,inputMask:64},after:{keys:[],observedAt:1,flyby:true,inputMask:64}}]
 assert.equal(acceptCameraMotionCase(r).status,'passed')
 r.observation.events[0].after.keys.push('arrowleft');assert.throws(()=>acceptCameraMotionCase(r))
})

test('preflight rejection still owns one bounded browser close and preserves falsey primary',async()=>{
 for(const overrides of [{expectedRevision:'bad'},{source:null},{now:()=>{throw null}}]){
  let invoked=false
  const r=await routeCase(async()=>{invoked=true},undefined,overrides)
  assert.equal(invoked,false);assert.equal(r.failed,true);assert.deepEqual(r.calls,['browser-close'])
  assert.equal(r.disk.status,'failed')
  if(overrides.now)assert.equal(r.error,null)
 }
})

test('validator rejects a missed input gate and stale first post-gate publication',()=>{
 const r=validCase()
 const transitional={...r.observation.frames[1],phase:'ground',inputButtons:0}
 r.observation.frames.splice(1,0,transitional)
 r.observation.frames.forEach((row,i)=>{row.frame=i+1;row.observedAt=i+1})
 assert.throws(()=>acceptCameraMotionCase(r),/First completed post-gate/)
 const flyby=validCase();flyby.kind='flyby-edge'
 flyby.observation.frames.forEach((row,i)=>{row.phase=i<2?'flyby':'released';row.overview=false;row.overviewStage=null;row.flyby=i<2;row.inputMask=i<2?64:0;row.inputButtons=i<2?0:1;row.navigationPointer={x:1,y:500,buttons:0}})
 flyby.observation.events=[{type:'pointermove',x:1,trusted:true,before:{flyby:true,inputMask:64},after:{observedAt:1,flyby:false,inputMask:0}}]
 assert.throws(()=>acceptCameraMotionCase(flyby),/Input must finish/)
})

test('overview negative requires release completion and neutral rendered evidence before gate exit',()=>{
 const base=validCase();base.kind='overview-key-release';base.captures=[]
 base.observation.frames.forEach(x=>x.inputButtons=0)
 base.observation.events.push({type:'keyup',key:'ArrowLeft',trusted:true,before:{overviewStage:'enter'},after:{overviewStage:null,observedAt:0}})
 assert.throws(()=>acceptCameraMotionCase(base),/Release must finish/)
 base.observation.events[1].after.overviewStage='enter'
 base.observation.events[1].after.observedAt=2
 assert.throws(()=>acceptCameraMotionCase(base),/Completed gated frame/)
 base.observation.events[1].after.observedAt=0
 assert.equal(acceptCameraMotionCase(base).status,'passed')
})

test('observer rejects authoritative camera owner, tribe, pose and started-state changes',()=>{
 for(const mutate of [
  f=>f.scene.world.cameras={...f.scene.world.cameras},
  f=>f.scene.world.manaWorld.playerTribe=1,
  f=>f.scene.world.cameras.tribes[0]={...f.scene.cameraPosition},
  f=>f.scene.cameraPosition={...f.scene.cameraPosition},
  f=>f.scene.started=false,
 ]) {
  const f=observerFixture();mutate(f)
  assert.equal(f.renderer.render(f.scene.scene,f.scene.camera),f.sentinel)
  assert.equal(f.window.__pndCameraMotion.stop().failed,true)
 }
})
test('receipt fallback stays bounded even for oversized report and primary error',async()=>{
 const r=await routeCase(async({receipt})=>{receipt.oversized='x'.repeat(2*1024*1024);throw 'y'.repeat(2*1024*1024)})
 assert.equal(r.failed,true);assert.equal(r.error.length,2*1024*1024)
 assert.equal(r.disk.status,'failed');assert.equal(r.disk.detailsOmitted,true)
 assert.ok(Buffer.byteLength(JSON.stringify(r.disk))<1024*1024)
})

async function preparationCase({naturalFlyby=false,flyby=true,inputMask=64,clickFailure,clickThrows=false,startFlybyOnWait=false,clock=()=>0}={}) {
 const source=readFileSync(new URL('../scripts/tutorial-browser/camera-motion-evidence.mjs',import.meta.url),'utf8')
 const start=source.indexOf('    await step(()=>bindGame(page))')
 const end=source.indexOf("    await step(()=>page.locator('.world-viewport canvas').focus())",start)
 assert.ok(start>=0&&end>start)
 const body=source.slice(start,end),helperStart=source.indexOf('export async function prepareCameraIntroduction(')
 const helper=helperStart<0?'':source.slice(helperStart,source.indexOf('export async function runCameraMotionCases',helperStart)).replace('export ','')
 const world={flyby:{flags:flyby?1:0},inputMask},calls=[],receipt={}
 const page={evaluate:async fn=>runInNewContext('('+fn.toString()+')()',{window:{testScene:{world}}}),
  locator:selector=>({click:async()=>{calls.push(selector);if(clickThrows)throw clickFailure;world.flyby.flags=0;world.inputMask=0}})}
 const step=async fn=>fn(),wait=async(p,fn)=>{calls.push('wait-ground');if(startFlybyOnWait&&world.flyby.flags===0&&world.inputMask===128){world.flyby.flags=1;world.inputMask=64}if(!await p.evaluate(fn))throw Error('supplied gate remains active')}
 const execute=runInNewContext(helper+'\n(async()=>{'+body+'})',{assert,performance:{now:clock},page,naturalFlyby,receipt,step,wait,bindGame:async()=>calls.push('bind')})
 let failed=false,error;try{await execute()}catch(e){failed=true;error=e}
 return {failed,error,calls,receipt,world}
}
test('actual overview preparation dismisses active introduction through public locator before unchanged ground predicate',async()=>{
 const r=await preparationCase();assert.equal(r.failed,false)
 assert.deepEqual(r.calls,['bind','.skip-introduction','wait-ground'])
 assert.equal(r.receipt.preparations[0].skipClicked,true)
 assert.equal(r.receipt.preparations[0].stage,'complete')
})
test('actual natural flyby preparation remains untouched and missed gate fails without skip',async()=>{
 const r=await preparationCase({naturalFlyby:true});assert.equal(r.failed,false);assert.deepEqual(r.calls,['bind']);assert.equal(r.world.flyby.flags,1)
 const missed=await preparationCase({naturalFlyby:true,flyby:false,inputMask:0});assert.equal(missed.failed,true);assert.deepEqual(missed.calls,['bind'])
})
test('already grounded overview does not click and unrelated input mask is not bypassed',async()=>{
 const r=await preparationCase({flyby:false,inputMask:0});assert.equal(r.failed,false);assert.deepEqual(r.calls,['bind','wait-ground'])
 const blocked=await preparationCase({flyby:false,inputMask:64});assert.equal(blocked.failed,true);assert.deepEqual(blocked.calls,['bind','wait-ground'])
 assert.equal(blocked.receipt.preparations[0].stage,'await-startup')
 assert.equal(blocked.receipt.preparations[0].before.inputMask,64)
})
test('public skip falsey failure is retained with bounded stage attribution and no retry',async()=>{
 const r=await preparationCase({clickThrows:true,clickFailure:null});assert.equal(r.failed,true);assert.equal(r.error,null)
 assert.deepEqual(r.calls,['bind','.skip-introduction']);assert.equal(r.receipt.preparations[0].stage,'public-skip');assert.equal(r.receipt.preparations[0].skipClicked,false)
})


test('startup script mask is awaited before overview public skip and never cleared by harness',async()=>{
 const r=await preparationCase({flyby:false,inputMask:128,startFlybyOnWait:true})
 assert.equal(r.failed,false);assert.deepEqual(r.calls,['bind','wait-ground','.skip-introduction','wait-ground'])
 assert.equal(r.receipt.preparations[0].before.inputMask,128)
 assert.equal(r.receipt.preparations[0].startup.flyby,true)
 assert.equal(r.receipt.preparations[0].startup.inputMask,64)
})
test('startup transition admits natural flyby without skipping or waiting for its end',async()=>{
 const r=await preparationCase({naturalFlyby:true,flyby:false,inputMask:128,startFlybyOnWait:true})
 assert.equal(r.failed,false);assert.deepEqual(r.calls,['bind','wait-ground'])
 assert.equal(r.world.flyby.flags,1);assert.equal(r.world.inputMask,64)
})
test('startup and ground preparation share one fixed15s deadline without renewal',async()=>{
 let reads=0
 const r=await preparationCase({flyby:false,inputMask:128,startFlybyOnWait:true,clock:()=>++reads>=3?15000:0})
 assert.equal(r.failed,true);assert.match(String(r.error),/deadline/)
 assert.deepEqual(r.calls,['bind','wait-ground'])
})
