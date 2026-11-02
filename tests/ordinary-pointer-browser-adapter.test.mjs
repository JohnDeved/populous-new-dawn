import test from 'node:test'
import assert from 'node:assert/strict'
import {createOrdinaryPointerCaptureBuffer} from '../scripts/browser-performance/ordinary-pointer-capture-buffer.mjs'
import {installOrdinaryPointerBrowserObserver as install} from '../scripts/browser-performance/ordinary-pointer-browser-observer.mjs'
import {captureOrdinaryPointerBrowser, replayOrdinaryPointerBrowserPacket} from '../scripts/browser-performance/ordinary-pointer-browser-adapter.mjs'
function fixture(raw=false){
 const listeners=new Map(),docListeners=new Map(),callbacks=new Map();let id=0,time=105,disposed=0
 const canvas={},boundary={fingerprintSha256:'b'.repeat(64),witness:Array(113).fill(1)}
 const metrics=moved=>({interaction:{pointerMoved:moved,viewChanged:false},terrainPickCalls:moved?1:0,objectPickCalls:moved?1:0,ordinaryTerrain:{visitedTriangles:moved?8:0}})
 const recent=[{timestampMs:99,state:'paused',pointerBreakdown:metrics(false)},{timestampMs:100,state:'paused',pointerBreakdown:metrics(false)}]
 const recorder={recentCount:2,recentCursor:2,gpuGeneration:1,timestamp:100,recentFrames(){return structuredClone(recent)}}
 const point={clientX:900,clientY:400}
 const scene={fpsGraph:{samples:recorder},renderer:{domElement:canvas},world:{paused:true,turn:70,mode:null,inputMask:0,flyby:{flags:0}},
 cameraPosition:{x:1,y:2,angle:0},viewPoint:{x:3,z:4},cameraBearing:0,viewZoom:1,viewPreset:0,modalSuspended:false,
 viewTransition:null,overviewActive:false,overviewStage:0,globeMorph:{active:false},cameraMotion:{active:0},resultCamera:{active:0},keys:new Set(),
 navigationButtons(){return 0},pointerGesture:null,navigationPointer:{x:900,y:400,buttons:0},pointerButtons:0,pointerScreen:{...point},hoveredObject:null,
 tooltipInput:{pointer:{...point},route:'world',picked:null,cell:2,inspectionTarget:null}}
 const host={innerWidth:1440,innerHeight:1000,devicePixelRatio:1,testSceneRef:{current:scene},performance:{now:()=>time},
 document:{hidden:false,elementFromPoint:()=>canvas,addEventListener:(n,f)=>docListeners.set(n,f),removeEventListener:n=>docListeners.delete(n)},
 addEventListener:(n,f)=>listeners.set(n,f),removeEventListener:n=>listeners.delete(n),
 requestAnimationFrame:f=>{callbacks.set(++id,f);return id},cancelAnimationFrame:n=>callbacks.delete(n)}
 const geometry={witnessWidth:113,writeWitness:(a,p)=>{for(let n=0;n<113;n++)a[p+n]=1},captureBoundary:async()=>boundary}
 host.__pndSnapshotGeometry=geometry
 const event=(type,x,y)=>({type,clientX:x,clientY:y,pointerId:1,pointerType:'mouse',isPrimary:true,isTrusted:true,buttons:0,
  target:canvas,timeStamp:time,getCoalescedEvents(){return [{isTrusted:true,isPrimary:true,pointerId:1,pointerType:'mouse',clientX:x,clientY:y,buttons:0,timeStamp:time}]}})
 const emit=e=>{listeners.get(e.type)?.(e);if(e.type==='pointermove'){scene.navigationPointer={x:e.clientX,y:e.clientY,buttons:e.buttons};scene.pointerScreen={clientX:e.clientX,clientY:e.clientY};scene.tooltipInput.pointer={...scene.pointerScreen}}}
 const move=(x,y)=>{if(raw)emit(event('pointerrawupdate',x,y));emit(event('pointermove',x,y))}
 let priorX=900,priorY=400
 const frame=()=>{
  recorder.recentCount++;recorder.recentCursor++;recorder.timestamp++;time+=5
  const moved=priorX!==scene.pointerScreen.clientX||priorY!==scene.pointerScreen.clientY
  priorX=scene.pointerScreen.clientX;priorY=scene.pointerScreen.clientY
  recent.push({timestampMs:recorder.timestamp,state:'paused',pointerBreakdown:metrics(moved)})
  const pending=[...callbacks.values()];callbacks.clear();for(const f of pending)f(recorder.timestamp)
 }
 const page={async evaluate(fn,arg){const old=globalThis.window;globalThis.window=host;try{return await fn(arg)}finally{globalThis.window=old}},
 mouse:{async move(x,y){move(x,y)}},async waitForFunction(fn,arg){frame();const old=globalThis.window;globalThis.window=host;try{assert.equal(fn(arg),true)}finally{globalThis.window=old}return {async dispose(){disposed++}}}}
 return {host,scene,recorder,geometry,boundary,listeners,docListeners,callbacks,event,emit,move,frame,page,get disposed(){return disposed}}
}
test('actual opt-in driver installs, moves54 public inputs, stops and replays all merged components',async()=>{
 for(const raw of [false,true]){
  const f=fixture(raw);const r=await captureOrdinaryPointerBrowser({page:f.page,enabled:true})
  assert.equal(r.outcome.status,'completed',String(r.outcome.error));assert.equal(r.outcome.value.status,'decoded-consistent-unqualified')
  assert.equal(r.outcome.value.evidence.measured.length,48);assert.equal(r.cleanupConfirmed,true);assert.equal(r.comparisonEligible,false)
  assert.equal(r.packet.rawMode,raw);assert.equal(r.packet.rawUpdates.length,raw?54*8:0)
  assert.equal(f.listeners.size,0);assert.equal(f.docListeners.size,0);assert.equal(f.callbacks.size,0);assert.equal(f.disposed,54)
 }
})
test('no default activation or side effects',async()=>{
 const f=fixture();await assert.rejects(captureOrdinaryPointerBrowser({page:f.page}),/opt-in/);assert.equal(f.listeners.size,0)
})
test('disarmed unexpected input and multiple coalesced samples are terminal',()=>{
 for(const mode of ['disarmed','coalesced']){
  const f=fixture();install(f.host,createOrdinaryPointerCaptureBuffer,f.geometry,f.boundary,'a'.repeat(64));const api=f.host.__pndOrdinaryPointerObserver
  if(mode==='coalesced')api.arm()
  const e=f.event('pointermove',903,400);if(mode==='coalesced'){const one=e.getCoalescedEvents();e.getCoalescedEvents=()=>[...one,...one]}
  f.emit(e);assert.ok(api.status().error);const p=api.stop(false);assert.equal(p.capture.status,'failed');assert.equal(f.listeners.size,0)
 }
})
test('reset-and-refill, geometry drift and unseen callback cannot be attributed',()=>{
 for(const mode of ['generation','geometry','unseen']){
  const f=fixture();install(f.host,createOrdinaryPointerCaptureBuffer,f.geometry,f.boundary,'a'.repeat(64));const api=f.host.__pndOrdinaryPointerObserver;api.arm()
  if(mode==='generation')f.recorder.gpuGeneration++
  if(mode==='geometry')f.geometry.writeWitness=(a,p)=>a[p]=2
  if(mode==='unseen')f.recorder.recentCount++
  f.move(903,400);f.frame();assert.ok(api.status().error);assert.ok(api.stop(false).error)
 }
})
test('raw/parent mismatch and raw profile change fail rather than hiding extra delivery',()=>{
 const f=fixture();install(f.host,createOrdinaryPointerCaptureBuffer,f.geometry,f.boundary,'a'.repeat(64));const api=f.host.__pndOrdinaryPointerObserver;api.arm()
 f.emit(f.event('pointerrawupdate',903,400));const e=f.event('pointermove',903,400);const one=e.getCoalescedEvents();one[0].timeStamp--;e.getCoalescedEvents=()=>one
 f.emit(e);assert.ok(api.status().error);api.stop(false)
})
test('production row identity and result witness mismatch cannot replay',async()=>{
 const f=fixture();const r=await captureOrdinaryPointerBrowser({page:f.page,enabled:true});const p=r.packet
 p.recent[2].timestampMs++;assert.throws(()=>replayOrdinaryPointerBrowserPacket(p));p.recent[2].timestampMs--
 p.rows[14]++;assert.throws(()=>replayOrdinaryPointerBrowserPacket(p))
})
test('driver primary falsey failure survives cleanup and dispatch stops',async()=>{
 const f=fixture();f.page.mouse.move=async()=>{throw null}
 const r=await captureOrdinaryPointerBrowser({page:f.page,enabled:true})
 assert.equal(r.outcome.status,'failed');assert.equal(r.outcome.error,null);assert.equal(r.cleanupConfirmed,true);assert.equal(f.listeners.size,0)
})
test('watchdog timeout requests cleanup without waiting for stalled mouse transport',async()=>{
 const f=fixture();const oldSet=globalThis.setTimeout,oldClear=globalThis.clearTimeout,oldPerf=globalThis.performance
 let fire,time=0,rejectMove
 try{
  globalThis.performance={now:()=>time}
  globalThis.setTimeout=(fn,ms)=>{if(ms===90000)fire=fn;return 1};globalThis.clearTimeout=()=>{}
  f.page.mouse.move=async()=>{time=90000;fire();return new Promise((_,reject)=>{rejectMove=reject})}
  const r=await captureOrdinaryPointerBrowser({page:f.page,enabled:true})
  assert.equal(r.outcome.status,'timed-out');assert.equal(r.cleanupConfirmed,false);assert.equal(r.observerCleanupConfirmed,true);assert.equal(r.operationSettled,false);assert.equal(f.listeners.size,0)
  rejectMove(null);await Promise.resolve();assert.equal(r.outcome.status,'timed-out')
 }finally{globalThis.setTimeout=oldSet;globalThis.clearTimeout=oldClear;globalThis.performance=oldPerf}
})
test('failed installation never stops a pre-existing different observer owner',async()=>{
 const f=fixture();let stops=0;const owner={status:()=>({epoch:'c'.repeat(64)}),stop(){stops++}}
 f.host.__pndOrdinaryPointerObserver=owner
 const r=await captureOrdinaryPointerBrowser({page:f.page,enabled:true})
 assert.equal(r.outcome.status,'failed');assert.equal(r.cleanupConfirmed,false);assert.equal(stops,0)
 assert.equal(f.host.__pndOrdinaryPointerObserver,owner)
})
test('stop detects recorder mutation during materialization and preserves newer global owner',()=>{
 const f=fixture();const original=f.recorder.recentFrames
 f.recorder.recentFrames=function(){const r=original();this.gpuGeneration++;return r}
 install(f.host,createOrdinaryPointerCaptureBuffer,f.geometry,f.boundary,'a'.repeat(64));const api=f.host.__pndOrdinaryPointerObserver
 const replacement={};f.host.__pndOrdinaryPointerObserver=replacement
 const p=api.stop(false);assert.ok(p.error);assert.equal(f.host.__pndOrdinaryPointerObserver,replacement);assert.equal(f.listeners.size,0)
})
test('raw delivery profile is fixed and cannot omit a raw update after first pair',()=>{
 const f=fixture(true);install(f.host,createOrdinaryPointerCaptureBuffer,f.geometry,f.boundary,'a'.repeat(64));const api=f.host.__pndOrdinaryPointerObserver
 api.arm();f.move(903,400);f.frame();api.arm();f.emit(f.event('pointermove',903,403))
 assert.match(api.status().error,/Missing expected raw/);api.stop(false)
})
test('partial listener installation rolls back and cleans all owned listeners',()=>{
 const f=fixture();const add=f.host.addEventListener;let count=0
 f.host.addEventListener=(n,fn)=>{add(n,fn);if(++count===4)throw Error('install')}
 assert.throws(()=>install(f.host,createOrdinaryPointerCaptureBuffer,f.geometry,f.boundary,'a'.repeat(64)),/install/)
 assert.equal(f.listeners.size,0);assert.equal(f.docListeners.size,0);assert.equal(f.host.__pndOrdinaryPointerObserver,undefined)
})
test('driver roundtrip idle callbacks preserve selected anchor+1 instead of selecting latest frame',async()=>{
 const f=fixture();const wait=f.page.waitForFunction
 f.page.waitForFunction=async(fn,arg)=>{const handle=await wait(fn,arg);f.frame();return handle}
 const r=await captureOrdinaryPointerBrowser({page:f.page,enabled:true})
 assert.equal(r.outcome.status,'completed',String(r.outcome.error))
 assert.equal(r.packet.capture.frameCount,108)
 assert.equal(r.outcome.value.evidence.measured.length,48)
 for(let n=0;n<54;n++){assert.equal(r.packet.capture.frames[n*8+3],n+1);assert.equal(r.packet.capture.frames[n*8+7],0)}
})
test('replacement between every awaited stage never invokes a foreign observer method',async()=>{
 for(const stage of ['install','arm','move','wait','status']){
  const f=fixture();let calls=0,moves=0,owned
  const foreign={epoch:'f'.repeat(64),arm(){calls++;throw Error('foreign')},status(){calls++;throw Error('foreign')},stop(){calls++;throw Error('foreign')}}
  const evaluate=f.page.evaluate,move=f.page.mouse.move,wait=f.page.waitForFunction
  f.page.evaluate=async(fn,arg)=>{
   const result=await evaluate(fn,arg),source=fn.toString()
   if(source.includes('return install(')){owned=f.host.__pndOrdinaryPointerObserver;if(stage==='install')f.host.__pndOrdinaryPointerObserver=foreign}
   if(stage==='arm'&&source.includes('return api.arm()'))f.host.__pndOrdinaryPointerObserver=foreign
   return result
  }
  f.page.mouse.move=async(x,y)=>{moves++;await move(x,y);if(stage==='move')f.host.__pndOrdinaryPointerObserver=foreign}
  f.page.waitForFunction=async(fn,arg)=>{
   if(stage==='wait')f.host.__pndOrdinaryPointerObserver=foreign
   const h=await wait(fn,arg);if(stage==='status')f.host.__pndOrdinaryPointerObserver=foreign;return h
  }
  const r=await captureOrdinaryPointerBrowser({page:f.page,enabled:true})
  assert.equal(r.outcome.status,'failed');assert.equal(calls,0);assert.equal(r.cleanupConfirmed,false)
  if(stage==='install'||stage==='arm')assert.equal(moves,0)
  assert.equal(f.host.__pndOrdinaryPointerObserver,foreign);owned?.stop(false)
 }
})
test('negative or malformed non-null IDs cannot become null sentinels, including idle frames',()=>{
 for(const field of ['picked','cell','inspectionTarget','hoveredObject'])for(const bad of [-1,undefined,NaN,Number.MAX_SAFE_INTEGER+1]){
  const f=fixture();install(f.host,createOrdinaryPointerCaptureBuffer,f.geometry,f.boundary,'a'.repeat(64));const api=f.host.__pndOrdinaryPointerObserver
  if(field==='hoveredObject')f.scene.hoveredObject=bad;else f.scene.tooltipInput[field]=bad
  f.frame();assert.match(api.status().error,/Malformed tooltip ID/);api.stop(false)
 }
})
test('post-capture replay rejects altered geometry rows and missing boundaries',async()=>{
 const f=fixture();const r=await captureOrdinaryPointerBrowser({page:f.page,enabled:true});const p=r.packet
 p.rows[16]++;assert.throws(()=>replayOrdinaryPointerBrowserPacket(p),/geometry row/);p.rows[16]--
 delete p.geometryAfter;assert.throws(()=>replayOrdinaryPointerBrowserPacket(p),/boundaries/)
})
test('coalesced primary and modifier mismatch fail before movement admission',()=>{
 for(const delta of [{isPrimary:false},{shiftKey:true}]){
  const f=fixture();install(f.host,createOrdinaryPointerCaptureBuffer,f.geometry,f.boundary,'a'.repeat(64));const api=f.host.__pndOrdinaryPointerObserver;api.arm()
  const e=f.event('pointermove',903,400),one=e.getCoalescedEvents();Object.assign(one[0],delta);e.getCoalescedEvents=()=>one
  f.emit(e);assert.ok(api.status().error);api.stop(false)
 }
})
test('failed wait-handle disposal cannot claim full cleanup after observer stop',async()=>{
 const f=fixture();const wait=f.page.waitForFunction
 f.page.waitForFunction=async(fn,arg)=>{await wait(fn,arg);return {async dispose(){throw null}}}
 const r=await captureOrdinaryPointerBrowser({page:f.page,enabled:true})
 assert.equal(r.outcome.status,'failed');assert.equal(r.outcome.error,null)
 assert.equal(r.observerCleanupConfirmed,true);assert.equal(r.operationSettled,true)
 assert.equal(r.waitCleanupFailed,true);assert.equal(r.cleanupConfirmed,false)
})
test('watchdog leaves boundary/install/wait/dispose transport settlement explicitly unconfirmed',async()=>{
 for(const stage of ['boundary','install','wait','dispose']){
  const f=fixture();const oldSet=globalThis.setTimeout,oldClear=globalThis.clearTimeout,oldPerf=globalThis.performance
  let fire,time=0,release,held=false
  const suspend=value=>{held=true;time=90000;fire();return new Promise(resolve=>{release=()=>resolve(value)})}
  try{
   globalThis.performance={now:()=>time};globalThis.setTimeout=(fn,ms)=>{if(ms===90000)fire=fn;return 1};globalThis.clearTimeout=()=>{}
   const evaluate=f.page.evaluate,wait=f.page.waitForFunction
   f.page.evaluate=async(fn,arg)=>{
    const result=await evaluate(fn,arg),source=fn.toString()
    if(!held&&((stage==='boundary'&&source.includes('return g.captureBoundary()'))||(stage==='install'&&source.includes('return install('))))return suspend(result)
    return result
   }
   f.page.waitForFunction=async(fn,arg)=>{
    if(stage==='wait')return suspend({dispose:async()=>{}})
    const h=await wait(fn,arg);if(stage==='dispose')return {dispose:()=>suspend(undefined)};return h
   }
   const r=await captureOrdinaryPointerBrowser({page:f.page,enabled:true})
   assert.equal(r.outcome.status,'timed-out');assert.equal(r.operationSettled,false);assert.equal(r.cleanupConfirmed,false)
   assert.equal(r.observerCleanupConfirmed,stage!=='boundary')
   release();await Promise.resolve();await Promise.resolve();assert.equal(r.cleanupConfirmed,false)
  }finally{globalThis.setTimeout=oldSet;globalThis.clearTimeout=oldClear;globalThis.performance=oldPerf;f.host.__pndOrdinaryPointerObserver?.stop(false)}
 }
})
test('cleanup deadline and falsey secondary cleanup error remain explicit',async()=>{
 for(const kind of ['deadline','falsey']){
  const f=fixture();const oldSet=globalThis.setTimeout,oldClear=globalThis.clearTimeout,oldPerf=globalThis.performance
  let fire,time=0
  try{
   globalThis.performance={now:()=>time}
   globalThis.setTimeout=(fn,ms)=>{if(ms===90000)fire=fn;else if(ms===2000)queueMicrotask(fn);return 1};globalThis.clearTimeout=()=>{}
   f.page.mouse.move=async()=>{time=90000;fire();return new Promise(()=>{})}
   const evaluate=f.page.evaluate
   f.page.evaluate=async(fn,arg)=>{if(fn.toString().includes('const p=api.stop(success)')){if(kind==='falsey')throw null;return new Promise(()=>{})}return evaluate(fn,arg)}
   const r=await captureOrdinaryPointerBrowser({page:f.page,enabled:true})
   assert.equal(r.outcome.status,'timed-out');assert.equal(r.cleanupFailed,true);assert.equal(r.cleanupConfirmed,false)
   if(kind==='falsey')assert.equal(r.cleanupError,null);else assert.match(String(r.cleanupError),/cleanup deadline/)
  }finally{globalThis.setTimeout=oldSet;globalThis.clearTimeout=oldClear;globalThis.performance=oldPerf;f.host.__pndOrdinaryPointerObserver?.stop(false)}
 }
})

// Actual snapshot-setup admits raw mode null. Contract mode zero is an encoding,
// not the scene's raw sentinel; never coerce arbitrary falsey values.
test('raw neutral null maps to contract zero without mutating scene mode',async()=>{
 const f=fixture();assert.equal(f.scene.world.mode,null)
 const r=await captureOrdinaryPointerBrowser({page:f.page,enabled:true})
 assert.equal(r.outcome.status,'completed',String(r.outcome.error))
 assert.equal(f.scene.world.mode,null);assert.equal(r.packet.initial.mode,0)
 for(let i=0;i<r.packet.rows.length;i+=r.packet.width)assert.equal(r.packet.rows[i+7],0)
 assert.equal(r.outcome.value.evidence.measured.length,48)
})
test('raw active and malformed modes refuse installation rather than falsey normalization',()=>{
 for(const mode of [0,1,2,20,-1,false,undefined,'',NaN]){
  const f=fixture();f.scene.world.mode=mode
  assert.throws(()=>install(f.host,createOrdinaryPointerCaptureBuffer,f.geometry,f.boundary,'a'.repeat(64)),/Scene\/recorder\/state changed/)
  assert.equal(f.listeners.size,0);assert.equal(f.callbacks.size,0)
 }
})
test('leaving raw neutral mode after installation remains terminal',()=>{
 for(const mode of [0,1,undefined,false]){
  const f=fixture();install(f.host,createOrdinaryPointerCaptureBuffer,f.geometry,f.boundary,'a'.repeat(64))
  const api=f.host.__pndOrdinaryPointerObserver;api.arm();f.scene.world.mode=mode;f.frame()
  assert.match(api.status().error,/Scene\/recorder\/state changed/);assert.equal(api.stop(false).capture.status,'failed')
 }
})

test('ordinary mouse navigation tracker is recorded, never fabricated as null',async()=>{
 const f=fixture();const r=await captureOrdinaryPointerBrowser({page:f.page,enabled:true})
 assert.equal(r.outcome.status,'completed',String(r.outcome.error));assert.equal(r.packet.width,133)
 for(let i=0;i<r.packet.rows.length;i+=133){
  assert.equal(r.packet.rows[i+129],r.packet.rows[i+3]);assert.equal(r.packet.rows[i+130],r.packet.rows[i+4])
  assert.equal(r.packet.rows[i+131],0);assert.equal(r.packet.rows[i+132],0)
 }
 for(const [column,value] of [[129,899],[130,399],[131,1],[132,1]]){
  const copy=structuredClone(r.packet);copy.rows[column]=value;assert.throws(()=>replayOrdinaryPointerBrowserPacket(copy))
 }
})
test('active navigation and malformed tracker remain forbidden',()=>{
 for(const change of [f=>f.scene.navigationButtons=()=>1,f=>f.scene.navigationPointer.buttons=1,f=>f.scene.navigationPointer=null,f=>f.scene.navigationPointer.x=NaN]){
  const f=fixture();change(f);assert.throws(()=>install(f.host,createOrdinaryPointerCaptureBuffer,f.geometry,f.boundary,'a'.repeat(64)));assert.equal(f.listeners.size,0)
 }
})
test('tracker departure and stale coordinates after installation are terminal',()=>{
 for(const change of [f=>f.scene.navigationButtons=()=>1,f=>f.scene.navigationPointer.buttons=1,f=>f.scene.navigationPointer.x=899]){
  const f=fixture();install(f.host,createOrdinaryPointerCaptureBuffer,f.geometry,f.boundary,'a'.repeat(64));change(f);f.frame()
  const api=f.host.__pndOrdinaryPointerObserver;assert.ok(api.status().error);assert.equal(api.stop(false).capture.status,'failed')
 }
})

test('stable rejection names the first failing predicate without suppressing rejection',()=>{
 for(const [change,key] of [[f=>f.scene.world.paused=false,'!scene.world.paused'],[f=>f.scene.world.mode=1,'scene.world.mode !== null'],[f=>f.scene.navigationButtons=()=>1,'scene.navigationButtons()'],[f=>f.scene.pointerButtons=1,'scene.pointerButtons !== 0']]){
  const f=fixture();change(f);assert.throws(()=>install(f.host,createOrdinaryPointerCaptureBuffer,f.geometry,f.boundary,'a'.repeat(64)),e=>e.message==='Scene/recorder/state changed: '+key)
 }
})

test('optional diagnostic boundary runs once after54 exact acknowledgments before final geometry/export',async()=>{
 const f=fixture();let calls=0,geometryCalls=0
 const original=f.host.__pndSnapshotGeometry.captureBoundary
 f.host.__pndSnapshotGeometry.captureBoundary=async()=>{geometryCalls++;return original()}
 const r=await captureOrdinaryPointerBrowser({page:f.page,enabled:true,afterInputCapture:async()=>{
  calls++;assert.equal(f.disposed,54);assert.ok(f.listeners.size>0);assert.equal(geometryCalls,1)
 }})
 assert.equal(calls,1);assert.equal(r.outcome.status,'completed');assert.equal(r.cleanupConfirmed,true)
 assert.equal(geometryCalls,2);assert.equal(r.outcome.value.evidence.measured.length,48)
})
test('falsey diagnostic boundary rejection remains primary and observer cleanup still occurs',async()=>{
 const f=fixture();let calls=0
 const r=await captureOrdinaryPointerBrowser({page:f.page,enabled:true,afterInputCapture:async()=>{calls++;throw null}})
 assert.equal(calls,1);assert.equal(r.outcome.status,'failed');assert.equal(r.outcome.error,null)
 assert.equal(r.observerCleanupConfirmed,true);assert.equal(f.listeners.size,0);assert.equal(f.disposed,54)
})
test('incomplete input sequence cannot invoke successful diagnostic boundary',async()=>{
 const f=fixture();let calls=0;f.page.mouse.move=async()=>{throw 0}
 const r=await captureOrdinaryPointerBrowser({page:f.page,enabled:true,afterInputCapture:async()=>{calls++}})
 assert.equal(calls,0);assert.equal(r.outcome.status,'failed');assert.equal(r.outcome.error,0);assert.equal(f.listeners.size,0)
})
test('diagnostic hook remains inside original watchdog and late settlement cannot upgrade result',async()=>{
 const f=fixture(),oldSet=globalThis.setTimeout,oldClear=globalThis.clearTimeout,oldPerf=globalThis.performance
 let fire,time=0,release
 try{
  globalThis.performance={now:()=>time};globalThis.setTimeout=(fn,ms)=>{if(ms===90000)fire=fn;return 1};globalThis.clearTimeout=()=>{}
  const r=await captureOrdinaryPointerBrowser({page:f.page,enabled:true,afterInputCapture:()=>{time=90000;fire();return new Promise(resolve=>{release=resolve})}})
  assert.equal(r.outcome.status,'timed-out');assert.equal(r.operationSettled,false);assert.equal(r.cleanupConfirmed,false);assert.equal(f.disposed,54)
  release();await Promise.resolve();await Promise.resolve();assert.equal(r.cleanupConfirmed,false)
 }finally{globalThis.setTimeout=oldSet;globalThis.clearTimeout=oldClear;globalThis.performance=oldPerf;f.host.__pndOrdinaryPointerObserver?.stop(false)}
})
test('post-window final geometry rejection is not hidden by a successful diagnostic hook',async()=>{
 const f=fixture();let calls=0
 const r=await captureOrdinaryPointerBrowser({page:f.page,enabled:true,afterInputCapture:()=>{calls++;f.geometry.writeWitness=(a,p)=>{for(let n=0;n<113;n++)a[p+n]=2}}})
 assert.equal(calls,1);assert.equal(r.outcome.status,'failed');assert.equal(f.disposed,54);assert.equal(f.listeners.size,0)
})
test('actual collector and adapter compose with54 acknowledgments before end and export afterward',async t=>{
 const {captureOrdinaryPointerTraceDiagnostic:collect,ordinaryTracePolicy}=await import('../scripts/browser-performance/ordinary-pointer-trace-diagnostic.mjs')
 const {EventEmitter}=await import('node:events'),{mkdtempSync,rmSync,readFileSync}=await import('node:fs'),{tmpdir}=await import('node:os'),{join}=await import('node:path')
 const output=mkdtempSync(join(tmpdir(),'pnd-window-integration-'));t.after(()=>rmSync(output,{recursive:true,force:true}))
 const f=fixture(),session=new EventEmitter(),browserSession=new EventEmitter();let ended=false,endCount=0,exportSeen=false
 const evaluate=f.page.evaluate
 f.page.evaluate=async(fn,arg)=>{if(fn.toString().includes('const p=api.stop(success)')){assert.equal(ended,true);exportSeen=true}return evaluate(fn,arg)}
 session.send=async method=>{
  if(method==='Tracing.getCategories')return {categories:ordinaryTracePolicy.categories}
  if(method==='Target.getTargetInfo')return {targetInfo:{targetId:'supplied'}}
  if(method==='Runtime.evaluate')return {result:{}}
  if(method==='Tracing.end'){assert.equal(f.disposed,54);assert.equal(exportSeen,false);ended=true;endCount++;session.emit('Tracing.tracingComplete',{dataLossOccurred:false,stream:'owned'})}
  if(method==='IO.read'){assert.equal(exportSeen,true);return {data:'{"traceEvents":[]}',eof:true}}
  return {}
 }
 browserSession.send=async method=>method==='SystemInfo.getProcessInfo'?{processInfo:[]}:{}
 session.detach=browserSession.detach=async()=>{}
 f.page.context=()=>({newCDPSession:async()=>session})
 const r=await collect({browser:{newBrowserCDPSession:async()=>browserSession},page:f.page,output,capture:captureOrdinaryPointerBrowser})
 assert.equal(endCount,1);assert.equal(r.outcome.status,'completed');assert.equal(r.outcome.value.evidence.measured.length,48)
 const receipt=JSON.parse(readFileSync(join(output,'ordinary-pointer-diagnostic/receipt.json')))
 assert.equal(receipt.inputWindowCompleted,true);assert.equal(receipt.transportCleanupConfirmed,true);assert.equal(r.cleanupConfirmed,true)
})
test('actual adapter cannot swallow collector falsey end/marker failure or post-end geometry rejection',async t=>{
 const {captureOrdinaryPointerTraceDiagnostic:collect,ordinaryTracePolicy}=await import('../scripts/browser-performance/ordinary-pointer-trace-diagnostic.mjs')
 const {EventEmitter}=await import('node:events'),{mkdtempSync,rmSync,readFileSync}=await import('node:fs'),{tmpdir}=await import('node:os'),{join}=await import('node:path')
 for(const stage of ['end','marker','geometry']){
  const output=mkdtempSync(join(tmpdir(),'pnd-window-failure-'));t.after(()=>rmSync(output,{recursive:true,force:true}))
  const f=fixture(),session=new EventEmitter(),browserSession=new EventEmitter();let endCount=0
  session.send=async(method,args)=>{
   if(method==='Tracing.getCategories')return {categories:ordinaryTracePolicy.categories}
   if(method==='Target.getTargetInfo')return {targetInfo:{targetId:'supplied'}}
   if(method==='Runtime.evaluate'){if(stage==='marker'&&args.expression.includes('capture-end'))throw false;return {result:{}}}
   if(method==='Tracing.end'){
    endCount++;if(stage==='end')throw null
    if(stage==='geometry')f.geometry.writeWitness=(a,p)=>{for(let n=0;n<113;n++)a[p+n]=2}
    session.emit('Tracing.tracingComplete',{dataLossOccurred:false,stream:'owned'})
   }
   if(method==='IO.read')return {data:'{"traceEvents":[]}',eof:true}
   return {}
  }
  browserSession.send=async method=>method==='SystemInfo.getProcessInfo'?{processInfo:[]}:{}
  session.detach=browserSession.detach=async()=>{};f.page.context=()=>({newCDPSession:async()=>session})
  let rejected=false,error
  try{await collect({browser:{newBrowserCDPSession:async()=>browserSession},page:f.page,output,capture:captureOrdinaryPointerBrowser,schedule:(fn,ms)=>setTimeout(fn,ms===2000?5:1000)})}catch(e){rejected=true;error=e}
  assert.equal(rejected,true)
  if(stage==='end')assert.equal(error,null);else if(stage==='marker')assert.equal(error,false);else assert.ok(error instanceof Error)
  const receipt=JSON.parse(readFileSync(join(output,'ordinary-pointer-diagnostic/receipt.json')))
  assert.equal(receipt.status,'failed');assert.equal(endCount,1);assert.equal(f.listeners.size,0)
  if(stage!=='geometry')assert.equal(receipt.inputWindowFailed,true);else assert.equal(receipt.captureOutcome,'failed')
 }
})
