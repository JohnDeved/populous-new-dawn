import test from 'node:test'
import assert from 'node:assert/strict'
import { swampContainsPoint, stepSwamp } from '../app/swamp.ts'
import { removeOwnedSwamp } from '../app/swamp-removal.ts'

const trap = (tribe = 0, x = 0x4080, y = 0x8080) => ({
  center: { x, y, h: 0 }, tribe, remaining: 100, counter: 1, kills: 0, variant: 0,
})
const fixture = () => ({
  paused: false, status: 'playing', inputMask: 0, mode: null, selected: [],
  manaWorld: { playerTribe: 0 }, randomState: 123,
  land: { flags: new Uint16Array(16384), buildingIds: new Uint16Array(16384) },
  buildings: [], objectCells: { objects: new Map() },
  effects: [{ id: 1, age: 0, duration: Infinity, swamp: trap() }],
})
const point = { x: 0x4000, y: 0x8000 }

test('targeting preserves wrapped per-axis limits and unsnapped click cells', () => {
  for (const [x,y] of [[0,0],[255,255],[64,128],[1,253]]) {
    const swamp=trap(0,x*256+127,y*256+255)
    for(let dx=-5;dx<=5;dx++) for(let dy=-5;dy<=5;dy++) {
      const px=(x+dx)&255,py=(y+dy)&255
      const distance=(a,b)=>Math.min(Math.abs(a-b),256-Math.abs(a-b))
      assert.equal(swampContainsPoint(swamp,{x:px*256,y:py*256}),
        distance(x&254,px)<=3 && distance(y&254,py)<=3)
    }
  }
})

test('zero lifetime retires before sound, cell queries or victim mutation', () => {
  for(const remaining of [-1,0,1]) {
    const swamp={...trap(),remaining}, events=[]
    assert.equal(stepSwamp({},swamp,false,{
      sound:()=>events.push('sound'),cell:()=>{events.push('cell');return[]},
      kill:()=>events.push('kill'),remove:()=>events.push('remove'),
    }),false)
    assert.deepEqual(events,[])
    assert.equal(swamp.remaining,remaining-1)
  }
})

test('owned newest matching trap is marked without splicing or resource changes', () => {
  const w=fixture(),first=w.effects[0]
  const enemy={id:2,age:0,duration:Infinity,swamp:trap(1)}
  const newest={id:3,age:0,duration:Infinity,swamp:trap()}
  w.effects.push(enemy,newest)
  const effects=w.effects, snapshot=structuredClone(w)
  assert.equal(removeOwnedSwamp(w,point),true)
  assert.equal(w.effects,effects)
  assert.equal(newest.swamp.remaining,0)
  snapshot.effects[2].swamp.remaining=0
  assert.deepEqual(w,snapshot)
  assert.equal(first.swamp.remaining,100)
  assert.equal(removeOwnedSwamp(w,point),true,'repeat before logical retirement targets the same trap')
  assert.equal(first.swamp.remaining,100)
})

test('wrong tribe, expired effects, out-of-range and unavailable player never mutate', () => {
  for(const mutate of [w=>w.effects[0].swamp.tribe=1,w=>w.effects[0].duration=0,
    w=>w.effects[0].swamp.center.x=0x8000,w=>w.manaWorld.playerTribe=-1,w=>w.manaWorld.playerTribe=4]) {
    const w=fixture();mutate(w);const before=structuredClone(w)
    assert.equal(removeOwnedSwamp(w,point),false);assert.deepEqual(w,before)
  }
})

for(const [name,mutate] of Object.entries({
  pause:w=>w.paused=true,terminal:w=>w.status='won',loss:w=>w.status='lost',
  mask:w=>w.inputMask=1,placement:w=>w.mode='hut',spell:w=>w.mode='blast',selection:w=>w.selected=[1],
})) test(`${name} preserves existing ownership instead of removing a Swamp`,()=>{
  const w=fixture();mutate(w);const before=structuredClone(w)
  assert.equal(removeOwnedSwamp(w,point),false);assert.deepEqual(w,before)
})

test('owned cell building precedence, enemy and stale building controls', () => {
  for(const [team,hp,expected] of [['blue',100,false],['red',100,true],['blue',0,true]]) {
    const w=fixture(),cell=64*128+32
    w.land.flags[cell]=0x400;w.land.buildingIds[cell]=7
    w.buildings=[{id:7,team,hp}]
    assert.equal(removeOwnedSwamp(w,point),expected)
  }
})

test('registered class-10/model-16 precedence with stale/missing controls', () => {
  for(const [flags2,model,expected] of [[0,16,false],[1,16,true],[0,17,true]]) {
    const w=fixture();w.objectCells.objects.set(5,{id:5,class:10,model,flags2})
    assert.equal(removeOwnedSwamp(w,point,5),expected)
  }
  assert.equal(removeOwnedSwamp(fixture(),point,999),true)
})

test('nonfinite points are rejected before coordinate coercion',()=>{
  for(const p of [{x:NaN,y:0},{x:0,y:Infinity}]) {
    const w=fixture(),before=structuredClone(w)
    assert.equal(removeOwnedSwamp(w,p),false);assert.deepEqual(w,before)
  }
})

// Actual pointerUp owner with supplied terrain/DOM/feedback ports; not rendered input.
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
const source=readFileSync(new URL('../app/scene-input-runtime.ts',import.meta.url),'utf8')
const owner=source.slice(source.indexOf('export function pointerUp('),source.indexOf('export function keyDown(')).replace('export ','')
const createPointerUp=new Function('removeOwnedSwamp','nativePosition','queueBuildingInspection','cancelInteraction',
  'cancelPointerGesture','commandMarkerPoint','effect','browserPosition',
  `${stripTypeScriptTypes(owner)}; return pointerUp`)
function pointerFixture() {
  const world=fixture(),events=[]
  const scene={world,modalSuspended:false,pointerGesture:{pointerId:1,button:2},
    pointerButtons:2,globeMotion:{dragging:true},overviewStage:0,overviewActive:false,
    drag:null,dragActive:{value:false},down:{x:10,y:10},
    pick:()=>point,picking:{pick:()=>undefined},
    onChange:()=>events.push('change'),onSound:id=>events.push(['sound',id]),
    acknowledgePointer:id=>events.push(['ack',id])}
  const up=createPointerUp(removeOwnedSwamp,(_w,p)=>p,()=>{},w=>{events.push('cancel');w.mode=null;w.selected=[]},
    s=>{s.pointerGesture=null},p=>p,(_w,kind,p)=>events.push(['effect',kind,p]),p=>p)
  const event={pointerId:1,button:2,buttons:0,clientX:10,clientY:10,shiftKey:true,ctrlKey:false,altKey:false,metaKey:false}
  return {world,scene,events,run:()=>up(scene,event),event}
}
test('actual right release removes a trap and emits existing command feedback',()=>{
  const f=pointerFixture();f.run()
  assert.equal(f.world.effects[0].swamp.remaining,0)
  assert.deepEqual(f.events,[['effect','orderMarker',point],['ack',0],['sound',0x6a],'change'])
  assert.equal(f.scene.pointerGesture,null)
  f.run();assert.equal(f.events.length,4,'repeated release without a new gesture has no effect')
})
for(const [name,edit] of Object.entries({
  plain:f=>f.event.shiftKey=false,ctrl:f=>f.event.ctrlKey=true,alt:f=>f.event.altKey=true,meta:f=>f.event.metaKey=true,
  modal:f=>f.scene.modalSuspended=true,mask:f=>f.world.inputMask=1,overview:f=>f.scene.overviewActive=true,
  transition:f=>f.scene.overviewStage=1,drag:f=>f.event.clientX=18,
  replacement:f=>f.scene.pointerGesture=null,wrongPointer:f=>f.event.pointerId=2,
  placement:f=>f.world.mode='hut',selection:f=>f.world.selected=[7],missingTerrain:f=>f.scene.pick=()=>null,
})) test(`actual pointer ${name} does not remove the trap`,()=>{
  const f=pointerFixture();edit(f);f.run();assert.equal(f.world.effects[0].swamp.remaining,100)
  assert.equal(f.events.some(e=>Array.isArray(e)&&e[0]==='sound'),false)
})

test('actual live wrapper retires before reading units or creating person state',()=>{
  const text=readFileSync(new URL('../app/spell-effects-runtime.ts',import.meta.url),'utf8')
  const body=text.slice(text.indexOf('export function stepLiveSwamp('),text.indexOf('export function stepLiveConvertWild(')).replace('export ','')
  const live=new Function(`${stripTypeScriptTypes(body)}; return stepLiveSwamp`)()
  for(const remaining of [-1,0,1]) {
    const swamp={...trap(),counter:255,remaining}
    const world={get units(){assert.fail('expired trap must not inspect or materialize people')}}
    assert.equal(live(world,swamp),false)
    assert.equal(swamp.remaining,remaining-1)
    assert.equal(swamp.counter,0)
  }
})

const liveSource=readFileSync(new URL('../app/spell-effects-runtime.ts',import.meta.url),'utf8')
const liveBody=liveSource.slice(liveSource.indexOf('export function stepLiveSwamp('),liveSource.indexOf('export function stepLiveConvertWild(')).replace('export ','')
function liveWrapper(events) {
  return new Function('stepSwamp','sound','browserPosition',
    `${stripTypeScriptTypes(liveBody)}; return stepLiveSwamp`)(stepSwamp,(_w,id)=>events.push(['sound',id]),p=>p)
}

test('positive lifetimes keep counter, single decrement, sound and alive behavior',()=>{
  const events=[],live=liveWrapper(events)
  const w={units:[],land:{},manaWorld:{gameFlags:2}}
  for(const counter of [0,3,254,255]) for(const remaining of [2,31,32000]) {
    const swamp={...trap(),counter,remaining},before=events.length
    assert.equal(live(w,swamp),true)
    assert.equal(swamp.counter,(counter+1)&255)
    assert.equal(swamp.remaining,remaining-1)
    assert.deepEqual(events.slice(before),[['sound',0xaa]])
  }
})

test('actual effect-pass and renderer reconciliation retire only the cancelled trap',()=>{
  // Full effect-pass source, not the rest of tick: other gameplay phases are not executed.
  const turnSource=readFileSync(new URL('../app/world-turn.ts',import.meta.url),'utf8')
  const first=turnSource.indexOf('  const effectCount = w.effects.length,')
  const last=turnSource.indexOf('  stepFirewarriorShots(w)',first)
  assert.ok(first>=0 && last>first)
  const effectPass=stripTypeScriptTypes(`function pass(w: World, dt: number) {\n${turnSource.slice(first,last)}\n}`)
  const events=[],live=liveWrapper(events)
  const pass=new Function('stepLiveSwamp',`${effectPass}; return pass`)(live)
  const w=fixture();w.units=[];w.manaWorld.gameFlags=2
  const cancelled=w.effects[0]
  const survivor={id:2,kind:'swamp',age:0,duration:Infinity,swamp:trap(1)}
  cancelled.kind='swamp';w.effects.push(survivor)
  const cancelledState=cancelled.swamp
  assert.equal(removeOwnedSwamp(w,point),true)
  pass(w,1/12)
  assert.deepEqual(w.effects,[survivor])
  assert.equal(cancelled.swamp,cancelledState)
  assert.equal(cancelledState.remaining,-1)
  assert.equal(cancelled.duration,cancelled.age)
  assert.equal(survivor.swamp.remaining,99)
  assert.deepEqual(events,[['sound',0xaa]],'only the uncancelled trap sounds')

  const sceneSource=readFileSync(new URL('../app/scene-effects.ts',import.meta.url),'utf8')
  const start=sceneSource.indexOf('export function updateEffectsFrame(')
  assert.ok(start>=0)
  const reconcileBody=sceneSource.slice(start).replace('export ','')
  const reconcile=new Function('effectFrameIds',`${stripTypeScriptTypes(reconcileBody)}; return updateEffectsFrame`)(new WeakMap())
  const cleanup=[],gone={removeFromParent:()=>cleanup.push('detach')},kept={position:{}}
  const scene={world:w,fxMeshes:new Map([[cancelled.id,gone],[survivor.id,kept]]),
    releaseGroup:g=>{assert.equal(g,gone);cleanup.push('release')},
    locate(){},projectileMotion:{position(){}},animateFx(){},
    makeFx:()=>assert.fail('existing survivor must be reused')}
  reconcile(scene)
  assert.deepEqual(cleanup,['detach','release'])
  assert.deepEqual([...scene.fxMeshes],[[survivor.id,kept]])
  reconcile(scene)
  assert.deepEqual(cleanup,['detach','release'],'subsequent frames do not double-release')
  pass(w,1/12)
  assert.equal(survivor.swamp.remaining,98)
  assert.equal(cancelledState.remaining,-1,'retired trap cannot run again')
})
