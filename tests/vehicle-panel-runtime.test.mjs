import test from 'node:test'
import assert from 'node:assert/strict'
import {createWorld,addUnit,browserPosition,command,tick} from '../app/model.ts'
import {createLivePerson,stepLiveImpulse} from '../app/live-people.ts'
import {boardLiveVehicle,vehicleExit,vehicleExitTarget} from '../app/live-vehicles.ts'
import {canUnloadVehicle,unloadLiveVehicle,selectVehiclePassenger} from '../app/vehicle-panel-runtime.ts'
import {migrateCheckpoint} from '../app/game-store.ts'
function setup(model=1){
 const w=createWorld(22),v=w.vehicles.find(v=>v.model===model)
 w.units=[];w.pathfinding.people.clear();w.land.flags.fill(0);w.land.categories.fill(2);w.land.walkMasks[0].fill(255);w.land.heights.fill(0)
 v.h=256;v.speed=-1
 const units=['brave','warrior'].map(kind=>{const u=addUnit(w,'blue',kind,browserPosition(v));u.native=createLivePerson(w,u);u.native.state=10;w.pathfinding.people.set(u.id,u.native);boardLiveVehicle(w,u.native,v);return u})
 return {w,v,units}
}
test('success-bearing exit preserves existing public point API and real failure',()=>{
 const {w,v}=setup();assert.deepEqual(vehicleExit(w,v).point,vehicleExitTarget(w,v));assert.equal(vehicleExit(w,v).found,true)
 w.land.flags.fill(4);assert.equal(vehicleExit(w,v).found,false);assert.deepEqual(vehicleExitTarget(w,v),{x:v.x&65535,y:v.y&65535})
})
test('live panel selection only changes native selection flags and preserves unrelated selections/orders/RNG',()=>{
 const {w,v,units}=setup();w.selected=[999]
 const before={rng:w.randomState,orders:structuredClone(w.buildingOrders)}
 selectVehiclePassenger(w,v,units[0].id,false);assert.deepEqual(w.selected,[999,units[0].id]);assert.ok(units[0].native.flags3&0x10000000)
 selectVehiclePassenger(w,v,units[1].id,true);assert.deepEqual(w.selected,[999,units[0].id,units[1].id])
 selectVehiclePassenger(w,v,units[0].id,false);assert.deepEqual(w.selected,[999]);assert.deepEqual({rng:w.randomState,orders:w.buildingOrders},before)
})
test('Boat and Balloon unload launch without teleporting, clear orders, and survive occupied/airborne checkpoints',()=>{
 for(const model of [1,3]){
  const initial=setup(model),w=migrateCheckpoint(structuredClone(initial.w)),v=w.vehicles.find(v=>v.id===initial.v.id),units=initial.units.map(u=>w.units.find(p=>p.id===u.id))
  const before=units.map(u=>({state:u.native.state,x:u.native.x,y:u.native.y,h:u.native.h,anchorX:u.native.anchorX,anchorY:u.native.anchorY,flags2:u.native.flags2}))
  for(const u of units)u.native.savedVehicle=999
  assert.equal(canUnloadVehicle(w,v),true);assert.equal(unloadLiveVehicle(w,v),true);assert.equal(v.passengerCount,0)
  for(const [i,u]of units.entries()){
   const p=u.native;assert.equal(p.vehicle,0);assert.equal(p.savedVehicle,0);assert.equal(u.flight,p)
   assert.deepEqual({state:p.state,x:p.x,y:p.y,h:p.h,anchorX:p.anchorX,anchorY:p.anchorY,flags2:p.flags2},{...before[i],flags2:before[i].flags2&~0x4000})
   assert.equal(p.velocity.y,60);assert.equal(p.flags4&0x1000400,0x1000400)
  }
  const restored=migrateCheckpoint(structuredClone(w)),u=restored.units.find(u=>u.id===units[0].id),p=u.flight
  assert.ok(p);const point=[p.x,p.y,p.h];stepLiveImpulse(restored,u)
  assert.notDeepEqual([p.x,p.y,p.h],point);assert.equal(u.flight,p,'voluntary impulse is not discarded before landing')
  assert.equal(unloadLiveVehicle(w,v),false,'repeated unload cannot replay a launch')
 }
})
test('unload click rechecks speed, occupancy and terrain after rendered enabled state',()=>{
 const {w,v,units}=setup();assert.equal(canUnloadVehicle(w,v),true)
 v.speed=12;assert.equal(unloadLiveVehicle(w,v),false);assert.equal(v.passengerCount,2)
 v.speed=-1;w.land.flags.fill(4);assert.equal(unloadLiveVehicle(w,v),false)
 assert.ok(units.every(u=>u.native.vehicle===v.id))
})

test('authored Mission22 Boat and Balloon unload retain launch until a living landing',()=>{
 for(const model of [1,3]){
  const w=createWorld(22),v=w.vehicles.find(v=>v.model===model)
  w.units=[];w.pathfinding.people.clear();w.manaWorld.gameFlags=32
  const u=addUnit(w,'blue','brave',browserPosition(v));w.selected=[u.id]
  assert.equal(command(w,{...browserPosition(v),id:v.id}),true)
  for(let turn=0;turn<24&&!u.native?.vehicle;turn++)tick(w,1/12)
  assert.equal(u.native.vehicle,v.id);assert.equal(unloadLiveVehicle(w,v),true)
  let turns=0
  for(;u.flight&&turns<200;turns++)stepLiveImpulse(w,u)
  assert.ok(turns>1,`model${model}: impulse must not be discarded on its first tick`)
  assert.equal(u.flight,undefined);assert.ok(u.hp>0,`model${model}: living landing`)
 }
})
