import test from 'node:test'
import assert from 'node:assert/strict'
import fixture from './fixtures/building-terrain.json' with {type:'json'}
import sinking from './fixtures/building-sinking.json' with {type:'json'}
import manifest from '../decomp/exports.json' with {type:'json'}
import {stepBuildingTerrain,stepTerrainCollapse,dockLaneClear} from '../app/building-terrain.ts'
import {stepSinkingBuilding} from '../app/building-sinking.ts'
import {createWorld,addBuilding,buildingPose,buildingObject,buildingStage,browserPosition,findPath,tick} from '../app/model.ts'
import {buildingGradeVertices} from '../app/building-shapes.ts'

test('foundation settling, flooding and dock edges match original executable captures',()=>{
 assert.equal(fixture.executableSha256,manifest.executableSha256)
 fixture.cases.forEach((c,n)=>{
  const b={...c.b},land={heights:new Int16Array(16384),flags:new Uint32Array(16384)},events=[];let indicator=+c.indicator
  c.cells.forEach(v=>{land.heights[v.index]=v.height;land.flags[v.index]=0x20000})
  stepBuildingTerrain(land,b,{indicator:()=>{if(indicator){events.push(['indicator']);indicator=0}},terrainChanged:i=>events.push(['height',i]),attachment:()=>{},occupants:()=>{},dock:()=>{if(!dockLaneClear(land.heights,b))events.push(['dock'])},collapse:()=>{b.flags2|=0x100000;b.delay=2;events.push(['collapse'])}})
  assert.deepEqual({b:Object.fromEntries(['state','flags2','h','flooded','delay','reason'].map(k=>[k,b[k]])),cells:c.cells.map(v=>[v.index,land.heights[v.index],land.flags[v.index]]),events,indicator},fixture.expected[n])
 })
})

test('original wet-side tipping, drift, spin and sinking expiry retain complete native trajectories',()=>{
 assert.equal(sinking.executableSha256,manifest.executableSha256)
 sinking.cases.forEach((c,n)=>{
  const b={...c.b},land={categories:Uint8Array.from({length:16384},(_,i)=>c.mode===0||(c.mode!==1&&((i*17+c.seed)^(i>>7))%5<3)?sinking.water:sinking.dry)};let alive=true
  const actual=Array.from({length:80},(_,i)=>{b.counter=(c.b.counter+i)&255;if(alive)alive=stepSinkingBuilding(land,b);return {b:Object.fromEntries(sinking.keys.map(k=>[k,b[k]])),alive}})
  assert.deepEqual(actual,sinking.expected[n])
 })
})

test('terrain collapse ejects before destruction, retaining its two-turn delay',()=>{
 for(const reason of [1,2]){
  const b={flooded:0,delay:2,reason},events=[]
  const effects={eject:()=>events.push('eject'),destroy:r=>events.push(r)}
  stepTerrainCollapse(b,effects);assert.deepEqual(events,['eject']);assert.equal(b.delay,1)
  stepTerrainCollapse(b,effects);assert.deepEqual(events,['eject',reason]);assert.equal(b.delay,0)
 }
})

function edit(w,b,change){
 const vertices=buildingGradeVertices(buildingPose(b))
 vertices.forEach((v,n)=>{
  const p=browserPosition({x:(v.index&127)*512,y:(v.index>>7)*512}),i=(p.z+48)*97+p.x+48
  w.terrain[i]=change(w.land.heights[v.index],n)/45
 })
 w.terrainVersion++
 findPath(w,w.units[0],b)
 assert.ok(b.terrainState?.dirty,'height notifications reach allocated buildings')
}

test('healthy buildings settle without entering repair; deformed and flooded buildings use distinct destruction',()=>{
 for(let direction=0;direction<4;direction++)for(const mode of ['settle','collapse','sink']){
  const w=createWorld();w.manaWorld.gameFlags=32
  const b=addBuilding(w,'blue','hut',{x:-2,z:32},true,{angle:direction*Math.PI/2})
  findPath(w,w.units[0],b)
  const originalObject=buildingObject(b),stage=buildingStage(b)
  const occupants=mode==='settle'?[]:w.units.filter(u=>u.team==='blue'&&u.kind==='brave').slice(0,2)
  for(const u of occupants){u.inside=b.id;u.work=b.id;u.x=b.x;u.z=b.z;u.path=[]}
  edit(w,b,(h,i)=>mode==='settle'?h+(i===0?8:0):mode==='collapse'?h+(i===0?500:0):0)
  for(let t=0;t<4;t++){
   tick(w,1/12)
   if(t<3)assert.ok(occupants.every(u=>u.hp>0&&u.inside===b.id),'occupants stay alive until the building reaches its evacuation phase')
  }
  if(mode==='settle'){
   assert.ok(w.buildings.includes(b));assert.equal(b.damageState,null)
   for(let t=0;t<64&&b.terrainState.dirty;t++)tick(w,1/12)
   assert.equal(b.terrainState.dirty,false)
   const heights=buildingGradeVertices(buildingPose(b)).map(c=>w.land.heights[c.index])
   assert.ok(heights.every(h=>h===Math.round(b.foundation*45)))
   assert.equal(b.progress,1);assert.equal(buildingObject(b),originalObject)
  }else{
   assert.ok(w.buildings.includes(b),'first collapse turn retains the model')
   assert.equal(b.damageState.state,3);assert.equal(b.terrainState.delay,1)
   assert.ok(occupants.every(u=>u.inside===null),JSON.stringify({mode,direction,occupants:occupants.map(u=>({id:u.id,inside:u.inside,hp:u.hp,work:u.work}))}))
   tick(w,1/12);assert.ok(!w.buildings.includes(b))
   if(mode==='sink'){
    const f=w.effects.find(f=>f.sinking)
    assert.ok(f);assert.equal(f.sinking.object,originalObject);assert.equal(f.sinking.stage,stage)
    for(let t=0;t<20;t++)tick(w,1/12)
    assert.ok(f.sinking.h<1);assert.ok(f.sinking.tilt||f.sinking.roll)
    assert.ok(w.effects.includes(f))
    for(let t=0;t<60;t++)tick(w,1/12)
    assert.ok(!w.effects.includes(f),'native eighty-turn expiry')
   }else assert.ok(w.effects.some(f=>f.debris),'uneven ground emits original model faces')
  }
 }
})
