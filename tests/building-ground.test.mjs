import test from 'node:test'
import assert from 'node:assert/strict'
import fixture from './fixtures/building-ground.json' with {type:'json'}
import manifest from '../decomp/exports.json' with {type:'json'}
import shapes from '../app/original-shapes.json' with {type:'json'}
import {buildingPosition,levelBuildingGround,buildingPlanHeight,buildingGradeVertices} from '../app/building-shapes.ts'
import {terrainPointHeight} from '../app/native-terrain.ts'
import {createWorld,addBuilding,syncLandscapeObjects,findPath,HOME,buildingPose,buildingModel,nativePosition,worldPoint,browserPosition} from '../app/model.ts'

test('native building origins, exact ground writes and plan height initialization',()=>{
 assert.equal(fixture.executableSha256,manifest.executableSha256)
 fixture.cases.forEach((c,n)=>{
  const heights=Int16Array.from({length:16384},(_,i)=>c.flat??(((i*17+c.seed)^(i>>7))%1500-100))
  const flags=Uint32Array.from({length:16384},(_,i)=>(i+c.seed)&1),land={heights,flags}
  const shape=shapes.shapes[shapes.objects[c.pose.object][c.pose.angle/512]]
  const current=terrainPointHeight(land,{x:c.pose.anchorX-shape.x*256,y:c.pose.anchorY-shape.y*256})
  const position=buildingPosition(c.pose),positionHeight=terrainPointHeight(land,position)
  const planHeight=fixture.expected[n].planHeight===null?null:buildingPlanHeight(land,c.pose,c.model,current,c.levelFlags)
  const before=heights.slice(),events=[]
  levelBuildingGround(heights,c.pose,c.model,(cell,radius)=>events.push([cell,radius,1]))
  const changes=[];heights.forEach((h,i)=>{if(h!==before[i])changes.push([i,h])})
  assert.deepEqual({position,positionHeight,changes,events,planHeight},fixture.expected[n])
 })
})

test('live rotated foundations use native vertices and preserve surrounding terrain',()=>{
 for(const kind of ['hut','tower','temple','camp'])for(let direction=0;direction<4;direction++){
  const w=createWorld(),before=w.land.heights.slice(),b=addBuilding(w,'blue',kind,{x:4,z:32},false,{angle:direction*Math.PI/2})
  const pose=buildingPose(b),vertices=buildingGradeVertices(pose),mask=new Set(vertices.map(c=>c.index))
  const target=b.foundation*45
  assert.equal(target%64,0,'new plans choose the original quantized foundation')
  assert.deepEqual({x:b.x,z:b.z},browserPosition(buildingPosition(pose)))
  let changed=0
  w.land.heights.forEach((h,i)=>{if(h!==before[i]){changed++;assert.ok(mask.has(i),'no oversized square pad')}})
  assert.ok(changed>0)
  for(const {index} of vertices){
   assert.ok(Math.abs(w.land.heights[index]-target)<1e-9)
   const p=browserPosition({x:(index&127)*512,y:(index>>7)*512})
   assert.ok(Math.abs(worldPoint(w.terrain,p).y-target/128)<1e-9,'picking and rendered native terrain agree')
  }
  assert.equal(nativePosition(w,b).h,Math.round(target))
  assert.equal(w.landVersion,w.terrainVersion)
  assert.equal(buildingModel(b),{hut:1,tower:4,temple:5,camp:7}[kind])
 }
})

test('buildings retain distinct terrain handles after long effect-heavy games',()=>{
 const w=createWorld()
 w.nextId=8192
 const used=new Set([w.units,w.buildings,w.trees,w.shrines,w.effects,w.fights,w.projectiles].flatMap(objects=>objects.map(o=>o.id)))
 for(const x of [-8,8]){
  const b=addBuilding(w,'blue','hut',{x,z:32})
  assert.ok(b.id>0&&b.id<1024&&!used.has(b.id))
  used.add(b.id)
  syncLandscapeObjects(w)
  assert.ok(w.land.buildingIds.some(value=>(value&1023)===b.id))
  const brave=w.units.find(u=>u.kind==='brave'&&u.team==='blue')
  assert.doesNotThrow(()=>findPath(w,{...brave,x:b.x,z:b.z},HOME))
 }
})
