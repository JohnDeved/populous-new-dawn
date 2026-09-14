import test from 'node:test'
import assert from 'node:assert/strict'
import {createWorld,addUnit,command,nativePosition,supportsFollower,GRID} from '../app/model.ts'
import {queueTerrain,updateWalkMasks} from '../app/native-terrain.ts'
import {advanceGame} from '../app/game-clock.ts'
import {unitPosition} from '../app/unit-motion.ts'

function world() {
 const w=createWorld();w.units=[];w.buildings=[];w.shrines=[];w.trees=[];w.manaWorld.gameFlags=32
 w.terrain.fill(3);w.terrainVersion++;w.land.heights.fill(135)
 queueTerrain(w.land,0,64,1,{surface(){},globe(){}});updateWalkMasks(w.land,0,64)
 w.landVersion=w.terrainVersion
 return w
}
const delta=(a,b)=>(((a-b+128)%256+256)%256)-128

test('followers cross the former crop and both world seams, then settle at every frame rate',()=>{
 const scenarios=[[[44,8],[55,8]],[[-44,8],[-55,8]],[[8,44],[8,55]],[[8,-44],[8,-55]],
  [[125,8],[-120,8]],[[-125,8],[120,8]],[[8,125],[8,-120]],[[8,-125],[8,120]]]
 for(const [from,to] of scenarios) {
  const run=schedule=>{
   const w=world(),goal={x:to[0],z:to[1]}
   for(let i=0;i<6;i++)addUnit(w,'blue','brave',{x:from[0],z:from[1]})
   w.selected=w.units.map(u=>u.id)
   assert.ok(supportsFollower(w,goal));assert.ok(command(w,goal))
   assert.ok(w.units.every(u=>u.native?.state===10))
   const history=[],clock={animationTime:0,animationFrame:0,afterTurn:()=>history.push(w.units.map(u=>[u.x,u.z,u.native.h,u.native.state,u.native.anchorFlags]))}
   let elapsed=0,i=0
   while(elapsed<20-1e-9){const dt=Math.min(schedule[i++%schedule.length],20-elapsed);advanceGame(w,clock,dt);elapsed+=dt}
   assert.equal(w.units.length,6)
   assert.ok(w.units.every(u=>u.native.state===19&&Math.abs(delta(u.x,goal.x))<4&&Math.abs(delta(u.z,goal.z))<4))
   assert.equal(new Set(w.units.map(u=>`${u.x},${u.z}`)).size,6)
   assert.equal(w.buildingOrders.active,0);assert.equal(w.motionRoutes.active,0)
   for(let i=1;i<history.length;i++)for(let person=0;person<6;person++)
    assert.ok(Math.hypot(delta(history[i][person][0],history[i-1][person][0]),delta(history[i][person][1],history[i-1][person][1]))<1,'seam crossing must remain a short physical step')
   return {history,random:w.randomState,pose:w.cosmeticRandom,footprints:w.footprints.cursor}
  }
  const expected=run([1/60])
  for(const schedule of [[1/5],[1/30],[1/120],[1/144],[1/240],[.004,.13,.009,.034]])assert.deepEqual(run(schedule),expected)
 }
})

test('direct attacks take the short route and engage across both world seams',()=>{
 for(const [from,to] of [[[-135,0],[119,0]],[[0,-135],[0,119]]]){
  const w=world(),attacker=addUnit(w,'blue','brave',{x:from[0],z:from[1]}),target=addUnit(w,'red','warrior',{x:to[0],z:to[1]})
  w.selected=[attacker.id]
  const separation=()=>Math.hypot(delta(target.x,attacker.x),delta(target.z,attacker.z))
  assert.ok(command(w,target))
  const before=separation(),clock={animationTime:0,animationFrame:0}
  advanceGame(w,clock,1/12)
  assert.ok(separation()<before,'direct pursuit must move along the shortest wrapped displacement')
  let fought=!!w.fights.length
  for(let i=0;i<47&&!fought;i++){
   advanceGame(w,clock,1/12)
   fought=!!w.fights.length
  }
  assert.ok(fought,'direct pursuit must enter melee across the seam')
 }
})

test('live heights and sprite grounding read native terrain outside the compatibility grid',()=>{
 const w=world(),point={x:52,z:52},n=nativePosition(w,point),cell=((n.y&65535)>>9)*128+((n.x&65535)>>9)
 w.land.heights[cell]=420
 assert.equal(nativePosition(w,point).h,420)
 assert.equal(nativePosition(w,{x:point.x+256,z:point.z-256}).h,420)
 const u=addUnit(w,'blue','brave',point)
 assert.equal(unitPosition(w,u).y,420/128+.04*45/128)
 w.terrain.fill(4);w.terrainVersion++
 assert.equal(nativePosition(w,{x:0,z:0}).h,180,'compatibility edits still synchronize once before queries')
 assert.equal(nativePosition(w,point).h,420,'crop synchronization must not overwrite the rest of the world')
 assert.equal(w.terrain.length,GRID*GRID,'full-map queries require no larger compatibility grid')
 w.land.categories[cell]=1
 assert.equal(supportsFollower(w,point),false,'removing the crop must not remove water support checks')
})
