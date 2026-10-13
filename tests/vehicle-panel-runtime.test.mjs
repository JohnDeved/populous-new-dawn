import test from 'node:test'
import assert from 'node:assert/strict'
import {createWorld,addUnit,browserPosition,command,tick,supportsFollower} from '../app/model.ts'
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

test('supplied passengers retain actual prepared Mission22 unload trajectories until settling',()=>{
 for(const model of [1,3]){
  const w=createWorld(22),v=w.vehicles.find(v=>v.model===model)
  w.units=[];w.pathfinding.people.clear();w.manaWorld.gameFlags=32
  const exit=vehicleExit(w,v),point=browserPosition(exit.point);assert.ok(exit.found&&supportsFollower(w,point),'supplied follower starts on valid land')
  const u=addUnit(w,'blue','brave',point);w.selected=[u.id]
  assert.equal(command(w,{...browserPosition(v),id:v.id}),true)
  for(let turn=0;turn<24&&!u.native?.vehicle;turn++)tick(w,1/12)
  assert.equal(u.native.vehicle,v.id)
  const retained=u.native
  assert.equal(unloadLiveVehicle(w,v),true)
  if(model===1) {
   assert.deepEqual([retained.x,retained.y,retained.h],[10330,6177,48])
   assert.deepEqual(retained.velocity,{x:-118,y:60,z:-109})
  }
  let turns=0
  for(;u.flight&&turns<200;turns++)stepLiveImpulse(w,u)
  assert.ok(turns>1,`model${model}: impulse must not be discarded on its first tick`)
  assert.equal(u.flight,undefined)
  assert.equal(retained.flags4&0x400,0)
  assert.equal(retained.life,1000)
  if(model===1) {
   // The prepared seat launches toward a valid exit, but this supplied direct
   // unload settles in water first. The existing adapter clears browser HP;
   // native life remains positive. This is not native death parity.
   assert.equal(turns,4)
   assert.deepEqual([retained.x,retained.y,retained.h],[9878,5761,0])
   assert.equal(supportsFollower(w,u),false)
   assert.equal(u.hp,0)
  } else {
   assert.equal(turns,5)
   assert.deepEqual([retained.x,retained.y,retained.h],[46336,15298,931])
   assert.equal(supportsFollower(w,u),true)
   assert.equal(u.hp,50)
  }
 }
})

// Explicitly supplied terrain control, separate from the authored shoreline above.
test('supplied dry neighborhood preserves living Boat and Balloon unload landings',()=>{
 for(const model of [1,3]) {
  const {w,v,units}=setup(model)
  w.land.categories.fill(0)
  w.land.categories[((v.y&65535)>>9)*128+((v.x&65535)>>9)]=2
  assert.equal(canUnloadVehicle(w,v),true)
  assert.equal(unloadLiveVehicle(w,v),true)
  for(const u of units) {
   const person=u.flight,hp=u.hp
   let steps=0
   for(;u.flight&&steps<200;steps++)stepLiveImpulse(w,u)
   assert.equal(steps,model===1?6:7)
   assert.equal(u.flight,undefined)
   assert.equal(person.vehicle,0)
   assert.equal(person.flags4&0x400,0)
   assert.equal(supportsFollower(w,u),true)
   assert.equal(u.hp,hp)
  }
  assert.equal(v.passengerCount,0)
 }
})
