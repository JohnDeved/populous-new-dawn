// Execute the actual prepared observer, pointer wrapper, finish helper and dispatch
// against synthetic DOM/world objects. No browser, game model, turns or storage.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createOrdinaryInput } from './ordinary-input.mjs'
import { createOrderDispatch } from './ground-and-dispatch.mjs'
import { acceptedInputBoundary, requireOrdinaryMoveContinuation } from './input-boundary.mjs'
const dataModule=source=>import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))
const probeText=readFileSync(new URL('./browser-probes.mjs',import.meta.url),'utf8')
const probes=await dataModule(probeText.replace(/^import .*\n/gm,'')+`\nconst liveCommandContext=(...args)=>globalThis.contractRuntime.context(...args);\nconst syncNativeTerrain=w=>{w.cloneTerrain=true};\nconst syncLandscapeObjects=w=>{w.cloneLandscape=true};\n`)
const observerText=readFileSync(new URL('./observer.mjs',import.meta.url),'utf8')
const observer=await dataModule(observerText.replaceAll("await import('/app/model.ts')",'globalThis.contractRuntime.model')
  .replaceAll("await import('/app/building-shapes.ts')",'globalThis.contractRuntime.buildings')
  .replaceAll("await import('/app/world-types.ts')",'globalThis.contractRuntime.types')
  .replaceAll("await import('/app/original-rules.json')",'({default:{animationDescriptors:[]}})')
  .replaceAll("await import('/scripts/campaign-start-readiness.mjs')",'({campaignShamanReadiness:()=>({ready:true})})'))

async function fixture({entity=false,short=false,existing=false,omitMarker=false,diagnosticFailure=false,handlerError=null}={}) {
  const records=Array.from({length:10},()=>({model:0,flags:0,references:0,object:0,a:0,b:0}))
  const native={id:176,class:1,model:6,state:19,commandStatus:0,guardInputPending:null,target:0,flags2:0,flags3:0,flags4:0,vehicle:0,workFlags:0,
    commands:Array(8).fill(0),commandCursor:0,immediateCommand:0}
  const unit={id:176,team:'blue',kind:'firewarrior',hp:35,x:23,z:-3,inside:null,work:null,target:null,native}
  const world={turn:10,time:1,lastOrderTurn:1,status:'playing',paused:false,speed:1,inputMask:0,mode:null,selected:[176],units:[unit],
    buildings:[{id:98,x:20,z:-8}],effects:[],secondaryEffects:{slots:[]},buildingOrders:{records}}
  const point={x:31,z:-11}, record={model:entity?8:3,flags:0,references:1,object:0,a:entity?98:9984,b:entity?0:768}
  if(existing){records[2]={...record};native.commands[0]=2}
  const logs=[],appErrors=[],handlerResults=[],mapCalls=[],listeners=new Map(),canvas={getBoundingClientRect:()=>({left:0,top:0,width:1000,height:1000})}
  canvas.addEventListener=(type,fn,capture=false)=>{const rows=listeners.get(type)??[];rows.push({fn,capture});listeners.set(type,rows)}
  canvas.removeEventListener=(type,fn,capture=false)=>listeners.set(type,(listeners.get(type)??[]).filter(r=>r.fn!==fn||r.capture!==capture))
  const scene={world,renderer:{domElement:canvas},container:{getBoundingClientRect:()=>({x:0,y:0,width:1000,height:1000})},
    cameraPosition:{x:0,y:0},cameraBearing:0,cameraMotion:{active:false},view:{center:{},rawCenter:{},projection:{}},gameClock:{animationFrame:0},frame:1,
    pointerAck:{target:0,until:1},screen:()=>({x:0,y:0}),pick:()=>({...point}),pickUnit:()=>null,pickWorldObject:()=>entity?world.buildings[0]:null,
    picking:{lastKey:'old-cache',lastId:null,lastKind:null,pickPerson:()=>entity?98:null,pick:()=>null}}
  globalThis.contractRuntime={context:(_w,target)=>({model:target.id?8:3,enabled:true,building:target.id?world.buildings[0]:null}),
    model:{unitAnimationSource:u=>u.native,unitAnimation:()=>''},buildings:{buildingModel:()=>8,buildingPose:()=>({})},types:{tribeForTeam:()=>0}}
  globalThis.window={testSceneRef:{current:scene},testStore:{getWorld:()=>world},nativeGuardProbes:probes}
  globalThis.document={elementFromPoint:()=>canvas,visibilityState:'visible'}
  await observer.installNativeGuardObserver()
  const realReader=window.nativeGuardReadInput
  const pickResult=Object.freeze({...point});let lastPickEvent
  scene.pick=function(event){assert.equal(this,scene);lastPickEvent=event;return pickResult}
  if(diagnosticFailure)window.nativeGuardReadInput=()=>{throw {[Symbol.toPrimitive](){throw Error('unsafe error text')}}}
  const originalPick=scene.pick,originalHandler=function(event){
    assert.equal(this,canvas);assert.equal(event.type,'pointerup')
    assert.equal(scene.pick(event),pickResult);assert.equal(lastPickEvent,event)
    if(handlerError)throw handlerError
    world.lastOrderTurn=world.turn;records[2]={...record};native.commands[0]=2;native.commandStatus=0
    if(entity)unit.work=98
    else if(!omitMarker){world.effects.push({id:90,kind:'orderMarker',x:31,z:-11,turnsRemaining:4});world.secondaryEffects.slots.push({kind:'orderMarker',effect:90,serial:1})}
    scene.pointerAck={target:entity?98:0,until:200}
    return 'original-handler-result'
  }
  canvas.addEventListener('pointerup',originalHandler)
  const dispatchDOM=event=>{
    for(const capture of [true,false])for(const row of [...(listeners.get(event.type)??[])].filter(r=>r.capture===capture)){
      try{const result=row.fn.call(canvas,event);if(row.fn===originalHandler)handlerResults.push(result)}catch(error){appErrors.push(error)}
    }
  }
  const page={evaluate:async(fn,arg)=>fn(arg),mouse:{click:async(x,y)=>{
    for(const type of ['pointerdown','pointerup'])dispatchDOM({type,clientX:x,clientY:y,button:0,buttons:type==='pointerdown'?1:0,isTrusted:true,target:canvas})
  },move:async()=>{world.turn+=5;world.time+=0.5;world.effects=[];world.secondaryEffects.slots=[];if(short){native.commands.fill(0);native.commandStatus=0;native.state=19}}}}
  const read=async()=>structuredClone(realReader())
  const health=()=>assert.deepEqual(appErrors,[],'Original application errors remain fatal')
  const ordinary=createOrdinaryInput({page,read,log:e=>logs.push(e),signal:new AbortController().signal,health,pollUI:async()=>{throw Error('unexpected wait')}})
  const dispatch=createOrderDispatch({page,read,log:e=>logs.push(e),health,signal:new AbortController().signal,
    pollUI:async()=>{throw Error('unexpected wait')},ordinary:{...ordinary,map:async p=>mapCalls.push(p)}})
  const hit={x:500,y:500,point,...(entity?{id:98,collection:'buildings'}:{})}
  return {scene,world,unit,native,logs,read,dispatch,hit,appErrors,handlerResults,originalPick,originalHandler,mapCalls,listeners,
    cleanup:()=>{delete globalThis.window;delete globalThis.document;delete globalThis.contractRuntime}}
}

async function acceptedFixture(options={}) {
  const f=await fixture(options)
  try{
    const result=await f.dispatch.clickOrder(f.hit)
    const delivery=f.logs.find(e=>e.action==='entity-delivered-pointer-observation').observed
    return {result,delivery,hit:f.hit}
  }finally{f.cleanup()}
}

test('actual adapter captures pre/post handler marker and queue before delayed expiry',async()=>{
  const f=await fixture()
  try{
    const result=await f.dispatch.move('firewarrior')
    const earned=f.logs.find(e=>e.action==='ordinary-ground-move-accepted')
    assert.deepEqual(earned.actualPoint,{x:31,z:-11});assert.deepEqual(earned.acceptance.recipientIds,[176])
    assert.equal(result.after.effects.length,0);assert.equal(result.after.turn,15)
    assert.equal(result.inputBefore.turn,10);assert.equal(result.inputAfter.turn,10)
    assert.equal(result.inputAfter.units[0].native.commandStatus,0,'Queued input is not called adopted')
    assert.equal(result.inputAfter.units[0].order.model,3)
    assert.equal(result.acceptance.marker.secondaryOwner.serial,1)
    assert.deepEqual(f.handlerResults,['original-handler-result']);assert.equal(f.scene.pick,f.originalPick)
    assert.equal(f.listeners.get('pointerup').length,1);assert.equal(f.listeners.get('pointerup')[0].fn,f.originalHandler)
    assert.equal(f.world.cloneTerrain,undefined);assert.equal(f.world.cloneLandscape,undefined)
  }finally{f.cleanup()}
})

test('completed short-move queue may disappear later without inventing completion',async()=>{
  const {result}=await acceptedFixture({short:true})
  assert.equal(result.inputAfter.units[0].order.model,3);assert.equal(result.after.units[0].order,null)
  const current=structuredClone(result.after),u=current.units[0]
  Object.assign(u,{fighting:false,path:[],busy:{ghost:false,flight:false,fight:false,casting:false,lift:false,entry:false,builder:false,harvest:false,delivery:false,vault:false,attackReservation:false,otherRegisteredRoute:false,registeredRouteIsNative:false,tree:null}})
  const observation=requireOrdinaryMoveContinuation(result.inputAfter,current,176)
  assert.match(observation.meaning,/no completed-Move inference/)
  current.units[0].nativeIdentity++
  assert.throws(()=>requireOrdinaryMoveContinuation(result.inputAfter,current,176))
})

test('fresh same-target current record retains unchanged generic helper semantics',async()=>{
  const {result}=await acceptedFixture({existing:true})
  assert.equal(result.acceptance.kind,'fresh-input-existing-order')
  assert.equal(result.acceptance.marker.id,90)
})

test('entity training acceptance also uses the actual post-handler owner/work envelope',async()=>{
  const {result}=await acceptedFixture({entity:true})
  assert.equal(result.inputAfter.units[0].work,98);assert.equal(result.acceptance.marker,null)
})

test('missing marker remains fatal in the executed adapter',async()=>{
  const f=await fixture({omitMarker:true})
  try{await assert.rejects(f.dispatch.clickOrder(f.hit),/No fresh ground marker/)}finally{f.cleanup()}
})

test('stale same-cell, wrong dispatch/epoch/secondary owner and later-slot records fail',async()=>{
  const captured=await acceptedFixture(),base=captured.result
  const check=mutate=>{const d=structuredClone(captured.delivery);mutate(d);assert.throws(()=>acceptedInputBoundary(base.before,base.after,captured.hit,d))}
  check(d=>d.events[1].state.input.effects.push(structuredClone(d.events[1].after.input.effects[0])))
  check(d=>{d.events[1].after.input.lastOrderTurn=1})
  check(d=>{d.events[1].after.input.pointerAck.until=d.events[1].state.input.pointerAck.until})
  check(d=>{d.events[1].after.input.epoch++})
  check(d=>{d.events[1].after.input.effects[0].x+=2})
  check(d=>{d.events[1].after.input.effects[0].secondaryOwner.effect=91})
  check(d=>{d.events[1].after.input.effects[0].secondaryOwner=null})
  check(d=>{d.events[1].after.input.units[0].commandOwnerIdentity++})
  check(d=>{const u=d.events[1].after.input.units[0];u.commandOwner.commands=[3,2,0,0,0,0,0,0];u.commandOwner.activeId=3;u.commandOwner.orders.push({id:3,record:{...u.order,a:1,b:1}})})
  check(d=>{d.events[1].after.input.units[0].order.a=1})
})

test('Load resets the actual epoch; old pointer envelopes cannot cross worlds',async()=>{
  const captured=await acceptedFixture(),later=structuredClone(captured.result.after)
  later.epoch++;later.worldIdentity++;later.sceneIdentity++
  assert.throws(()=>acceptedInputBoundary(captured.result.before,later,captured.hit,captured.delivery))
  const f=await fixture()
  try{
    const oldReader=window.nativeGuardReadInput,old=f.scene.world
    f.scene.world=structuredClone(old);window.testStore={getWorld:()=>f.scene.world}
    assert.throws(()=>oldReader(),/scene\/world changed/)
    await observer.installNativeGuardObserver()
    const current=window.nativeGuardReadInput();assert.equal(current.epoch,1);assert.equal(current.effects.length,0)
  }finally{f.cleanup()}
})

test('diagnostic failure never stops the handler, and original handler failure is untouched',async()=>{
  const diagnostic=await fixture({diagnosticFailure:true})
  try{
    await assert.rejects(diagnostic.dispatch.clickOrder(diagnostic.hit))
    assert.deepEqual(diagnostic.handlerResults,['original-handler-result'])
    assert.deepEqual(diagnostic.appErrors,[]);assert.equal(diagnostic.scene.pick,diagnostic.originalPick)
    const raw=diagnostic.logs.find(e=>e.action==='entity-delivered-pointer-observation').observed
    assert.ok(raw.errors.some(e=>e==='Unprintable diagnostic failure'))
  }finally{diagnostic.cleanup()}
  const error=Error('original handler error'),broken=await fixture({handlerError:error})
  try{
    await assert.rejects(broken.dispatch.clickOrder(broken.hit),/Original application errors/)
    assert.equal(broken.appErrors[0],error);assert.equal(broken.scene.pick,broken.originalPick)
  }finally{broken.cleanup()}
})

test('command owner follows campaign priority while renderer identity remains separate',async()=>{
  const f=await fixture()
  try{
    const builder=structuredClone(f.native);builder.commands[0]=3
    f.world.buildingOrders.records[3]={model:8,flags:0,references:1,object:0,a:98,b:0}
    f.unit.builder={person:builder}
    const u=window.nativeGuardReadInput().units[0]
    assert.equal(u.commandOwnerIdentity,u.commandOwnerSlots[0]);assert.notEqual(u.commandOwnerIdentity,u.nativeIdentity)
    assert.equal(u.sourceIdentity,u.nativeIdentity);assert.equal(u.order.model,8)
    const observed=probes.observeEntityPointer(f.scene,document,null,window.nativeGuardReadInput),replacement=()=>null
    f.scene.pick=replacement
    const closed=observed.finish();assert.equal(closed.restored,false);assert.equal(f.scene.pick,replacement)
    assert.ok(closed.errors.some(e=>e.includes('Unexpected replacement')))
  }finally{f.cleanup()}
})

test('browser boundary module stays self-contained under either runtime-origin assembly',()=>{
  for(const [root,origin]of [['native-shaman-guard-before','http://127.0.0.1:4392'],['native-shaman-guard-fix','http://127.0.0.1:4393']]){
    const assembled=probeText.replaceAll("from '/app/",`from '${origin}/app/`)
    const decoded=Buffer.from(('data:text/javascript;base64,'+Buffer.from(assembled).toString('base64')).split(',')[1],'base64').toString()
    assert.equal(decoded,assembled)
    const imports=[...decoded.matchAll(/^import .* from '([^']+)'/gm)].map(match=>match[1])
    assert.equal(imports.length,2)
    for(const url of imports){assert.ok(url.startsWith(origin+'/app/'));assert.ok(readFileSync(new URL('../../../../'+root+new URL(url).pathname,import.meta.url)).length>0)}
    assert.ok(!/from ['"]\.{1,2}\//.test(decoded))
  }
})
