import test from 'node:test'
import assert from 'node:assert/strict'
import level from './fixtures/building-level.json' with {type:'json'}
import plans from './fixtures/unbuilt-plan.json' with {type:'json'}
import manifest from '../decomp/exports.json' with {type:'json'}
import {stepUnbuiltPlan} from '../app/building-workers.ts'
import {stepBuildingLevel} from '../app/building-preparation.ts'
import {setPersonAnimation} from '../app/animation.ts'
import sprites from '../app/original-units.json' with {type:'json'}
import rules from '../app/original-rules.json' with {type:'json'}
import {createMotionRoutes,setDirectPersonDestination} from '../app/person-routes.ts'
import {createWorld,placeBuilding,tick,buildingPose,command,browserPosition,nativePosition} from '../app/model.ts'
import {buildingGradeVertices,buildingFootprintCells} from '../app/building-shapes.ts'
import {AUDIO_CUES} from '../app/audio.ts'

test('unbuilt plan priorities, validation, allocation and abandonment match native decisions',()=>{
 assert.equal(plans.executableSha256,manifest.executableSha256)
 plans.cases.forEach((c,i)=>{
  const plan={...c.plan},workers=structuredClone(c.workers)
  const action=stepUnbuiltPlan(plan,workers,()=>c.valid,()=>c.obstacles)
  assert.deepEqual({plan,workers,action},plans.expected[i])
 })
})
test('leveling movement, animation, timers, terrain and sound match complete native task 8',()=>{
 assert.equal(level.executableSha256,manifest.executableSha256)
 level.cases.forEach((c,i)=>{
  const p={...c.person,motionGroup:0,motionIndex:0},task={...c.task},plan={...c.plan},rng={randomState:c.seed},events=[]
  const land={heights:new Int16Array(16384),flags:new Uint32Array(16384)}
  c.vertices.forEach((v,i)=>{land.heights[v.index]=c.heights[i]})
  const result=stepBuildingLevel(rng,p,task,plan,land,()=>c.vertices,{
   animation:(_,id)=>{events.push(['animation',id]);setPersonAnimation(p,id,{playerTribe:0,gameFlags:0,sessionSubstate:null,tribes:Array.from({length:4},()=>({flags:0,playerType:0})),objects:new Map()},sprites)},
   destination:to=>{events.push(['destination',to]);setDirectPersonDestination(createMotionRoutes(),p,to)},
   releaseMotion:()=>events.push(['releaseMotion']),terrainChanged:i=>events.push(['terrain',i]),sound:(cue,flags)=>events.push(['sound',cue,flags]),
  })??0
  delete p.motionGroup;delete p.motionIndex
  assert.deepEqual({person:p,task,plan,heights:c.vertices.map(v=>land.heights[v.index]),randomState:rng.randomState,events,result},level.expected[i])
 })
})

test('live plans retain uneven ground, level visibly and wait for timber and crew clearance',()=>{
 assert.ok(AUDIO_CUES.includes(2))
 for(const kind of ['hut','camp'])for(let direction=0;direction<4;direction++){
  const w=createWorld();w.manaWorld.gameFlags=32;w.unlockedCamp=true;w.buildingDirections[kind]=direction
  w.selected=w.units.filter(u=>u.team==='blue'&&u.kind==='brave').map(u=>u.id)
  const before=w.land.heights.slice(),seed=w.randomState
  assert.ok(placeBuilding(w,kind,{x:4,z:32}))
  const b=w.buildings.at(-1),plan=b.preparation,vertices=buildingGradeVertices(buildingPose(b)),mask=new Set(vertices.map(v=>v.index))
  assert.ok(plan);assert.deepEqual(w.land.heights,before,'placement must not terraform')
  // Route creation may draw speed/RNG; the hut family is selected only at allocation.
  assert.equal(b.object,rules.buildingObjects[plan.model]);assert.equal(b.progress,0)
  let changed=false,stamped=false,cleared=false,last=w.land.heights.slice()
  for(let turn=0;turn<4000&&b.preparation;turn++){
   const previous=structuredClone(b.preparation),crew=w.units.filter(u=>u.work===b.id)
   const occupied=new Set(buildingFootprintCells(buildingPose(b)))
   const crewInside=crew.some(u=>{const p=nativePosition(w,u);return occupied.has(((p.y&65535)>>9)*128+((p.x&65535)>>9))})
   cleared ||= !crewInside&&crew.some(u=>u.builder?.task===9&&u.builder.phase===6)
   stamped ||= crew.some(u=>u.builder?.task===8&&u.builder.person?.object===96)
   tick(w,1/12)
   w.land.heights.forEach((h,i)=>{if(h!==last[i]){changed=true;assert.ok(mask.has(i),'only native grade vertices change')}})
   last=w.land.heights.slice()
   if(b.preparation)assert.equal(b.progress,0,'no scaffold while preparing')
   else {
    assert.equal(previous.work,100,'allocation requires initial timber')
    assert.ok(cleared,'allocation waits for a ready worker outside the footprint')
    assert.ok(vertices.every(v=>Math.abs(w.land.heights[v.index]-plan.height)<=1))
    assert.equal(b.progress,100/rules.buildingLife[plan.model])
   }
  }
  assert.equal(b.preparation,undefined,`${kind}/${direction} must allocate`)
  assert.ok(changed);assert.ok(stamped);assert.notEqual(w.randomState,seed)
  assert.ok(w.sounds.some(s=>s.cue===2))
  assert.equal(w.landVersion,w.terrainVersion)
  for(let n=0;n<4000&&(b.progress<1||b.builders.some(Boolean));n++)tick(w,1/12)
  assert.equal(b.progress,1);assert.ok(b.builders.every(id=>!id))
 }
})

test('unattended plans expire and redirected leveling workers release their sprite and route',()=>{
 const w=createWorld();w.manaWorld.gameFlags=32
 w.units=w.units.filter(u=>u.kind!=='brave')
 assert.ok(placeBuilding(w,'hut',{x:4,z:32}))
 const b=w.buildings.at(-1);assert.ok(b.preparation);assert.ok(!b.builders.some(Boolean))
 b.preparation.timeout=50;b.counter=127;tick(w,1/12)
 assert.ok(!w.buildings.includes(b));assert.ok(!w.land.buildingIds.some(id=>(id&1023)===b.id))
 const v=createWorld();v.manaWorld.gameFlags=32;v.selected=v.units.filter(u=>u.kind==='brave'&&u.team==='blue').map(u=>u.id)
 assert.ok(placeBuilding(v,'hut',{x:4,z:32}))
 const plan=v.buildings.at(-1)
 for(let n=0;n<1000&&!v.units.some(u=>u.builder?.task===8);n++)tick(v,1/12)
 const worker=v.units.find(u=>u.builder?.task===8);assert.ok(worker)
 v.selected=[worker.id];command(v,{x:9,z:33});assert.equal(worker.builder,undefined)
 tick(v,1/12);assert.ok(!plan.builders.includes(worker.id))
})

test('preparation adapters clear on-site timber before allocation without deleting its resource',()=>{
 const w=createWorld();w.manaWorld.gameFlags=32
 w.selected=w.units.filter(u=>u.kind==='brave'&&u.team==='blue').map(u=>u.id)
 assert.ok(placeBuilding(w,'hut',{x:4,z:32}))
 const b=w.buildings.at(-1),i=buildingFootprintCells(buildingPose(b))[0]
 // Use the public native coordinate adapter at the wrapped map seam.
 const tree=w.trees.find(t=>t.model===1&&t.logs===4)
 assert.ok(tree)
 const center={x:(i&127)*512+256,y:(i>>7)*512+256}
 Object.assign(tree,browserPosition(center))
 const seen=new Set()
 for(let n=0;n<4000&&b.preparation;n++){
  tick(w,1/12)
  for(const u of w.units.filter(u=>u.work===b.id))seen.add(u.builder?.task)
 }
 assert.equal(b.preparation,undefined);assert.ok(seen.has(3));assert.equal(tree.logs,0)
 assert.ok(w.trees.some(t=>t.model===11&&t.logs>0),'cleared wood remains available at the entrance')
})
