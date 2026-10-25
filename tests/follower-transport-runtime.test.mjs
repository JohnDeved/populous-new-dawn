import test from 'node:test'
import assert from 'node:assert/strict'
import { createWorld, addUnit, browserPosition, disguiseSelectedSpies, tick } from '../app/model.ts'
import { createLivePerson } from '../app/live-people.ts'
import { boardLiveVehicle, leaveLiveVehicle, stepLiveVehicles } from '../app/live-vehicles.ts'
import { hudTransports, selectFollowerTransport } from '../app/follower-transports-runtime.ts'
import { hudTaskPeople } from '../app/follower-tasks-runtime.ts'
import { transportCounts, focusTransport } from '../app/hud-transports.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { canUnloadVehicle, unloadLiveVehicle } from '../app/vehicle-panel-runtime.ts'
function setup(kind=1) {
 const world=createWorld(22),vehicle=world.vehicles.find(v=>v.model===kind)
 world.units=[];world.pathfinding.people.clear()
 const add=(type='brave',team='blue')=>{
  const u=addUnit(world,team,type,browserPosition(vehicle));u.native=createLivePerson(world,u);u.native.state=19
  world.pathfinding.people.set(u.id,u.native);return u
 }
 return {world,vehicle,add}
}
const counts=w=>transportCounts(hudTransports(w),hudTaskPeople(w,false),{x:0,y:0})
test('ordinary live boarding exposes class vehicle counts, all passengers and independent owner fields',()=>{
 for(const kind of [1,3]){
  const {world,vehicle,add}=setup(kind),brave=add(),warrior=add('warrior')
  assert.equal(counts(world)[kind].present,false)
  assert.ok(boardLiveVehicle(world,brave.native,vehicle));assert.ok(boardLiveVehicle(world,warrior.native,vehicle))
  assert.equal(vehicle.team,'blue');assert.equal(vehicle.apparentTribe,0)
  assert.equal(counts(world)[kind].counts[2],1);assert.equal(counts(world)[kind].counts[3],1)
  const before={orders:structuredClone(world.buildingOrders),rng:world.randomState}
  selectFollowerTransport(world,kind,2,vehicle,'single')
  assert.deepEqual(world.selected,[brave.id,warrior.id]);assert.deepEqual({orders:world.buildingOrders,rng:world.randomState},before)
  leaveLiveVehicle(world,vehicle,warrior.native,{x:vehicle.x,y:vehicle.y})
  assert.equal(counts(world)[kind].counts[3],0);assert.equal(counts(world)[kind].counts[2],1)
  leaveLiveVehicle(world,vehicle,brave.native,{x:vehicle.x,y:vehicle.y})
  assert.equal(counts(world)[kind].present,true);assert.equal(counts(world)[kind].counts[0],0)
 }
})
test('Spy boarding uses immediate target bits, later boarding rewrites owner and exit preserves apparent owner',()=>{
 const {world,vehicle,add}=setup(),spy=add('spy'),brave=add()
 spy.native.disguise=(2<<6)|63
 assert.ok(boardLiveVehicle(world,spy.native,vehicle));assert.equal(vehicle.apparentTribe,2)
 assert.equal(counts(world)[1].counts[5],1)
 assert.equal(focusTransport(hudTransports(world),hudTaskPeople(world,false),1,5,vehicle,0),0)
 assert.ok(boardLiveVehicle(world,brave.native,vehicle));assert.equal(vehicle.apparentTribe,0)
 leaveLiveVehicle(world,vehicle,brave.native,{x:vehicle.x,y:vehicle.y});assert.equal(vehicle.apparentTribe,0)
 leaveLiveVehicle(world,vehicle,spy.native,{x:vehicle.x,y:vehicle.y});assert.equal(vehicle.apparentTribe,0)
 assert.ok(boardLiveVehicle(world,spy.native,vehicle));assert.equal(vehicle.apparentTribe,2)
})
test('split owner and occupied selection survive checkpoint, legacy vehicles use real team fallback',()=>{
 const {world,vehicle,add}=setup(),spy=add('spy')
 spy.native.disguise=2<<6;boardLiveVehicle(world,spy.native,vehicle)
 const restored=migrateCheckpoint(structuredClone(world)),v=restored.vehicles.find(v=>v.id===vehicle.id)
 assert.equal(v.apparentTribe,2);assert.equal(counts(restored)[1].counts[5],1)
 assert.equal(hudTransports(restored).find(v=>v.id===vehicle.id).owner,2)
 delete v.apparentTribe
 assert.equal(hudTransports(migrateCheckpoint(restored)).find(v=>v.id===vehicle.id).owner,0)
})
test('destroyed last vehicle keeps presence during its visible wreck and cannot select or focus',()=>{
 const {world,vehicle,add}=setup(),spy=add('spy')
 spy.native.disguise=2<<6;boardLiveVehicle(world,spy.native,vehicle)
 vehicle.life=1;stepLiveVehicles(world)
 assert.equal(vehicle.active,false);assert.equal(vehicle.apparentTribe,2)
 assert.equal(counts(world)[1].present,true);assert.equal(counts(world)[1].counts[0],0)
 vehicle.destructionState=0
 assert.equal(counts(world)[1].present,false)
})

test('shipped disguise command aboard publishes apparent ownership through completion and countdown',()=>{
 const {world,vehicle,add}=setup(),spy=add('spy')
 world.manaWorld.gameFlags=32
 boardLiveVehicle(world,spy.native,vehicle);world.selected=[spy.id]
 assert.equal(disguiseSelectedSpies(world,2),true)
 tick(world,1/12)
 assert.equal(vehicle.team,'blue');assert.equal(vehicle.apparentTribe,2)
 assert.equal(spy.native.vehicle,vehicle.id);assert.equal(spy.native.disguise,(2<<6)|63)
 for(let i=0;i<63;i++)tick(world,1/12)
 assert.equal(vehicle.apparentTribe,2);assert.equal(spy.native.disguise,2<<6)
 assert.equal(counts(world)[1].counts[5],1)
})

// Legacy saves have no apparent field. Establish its fallback before the real
// owner changes, just as native 004659d0 preserves +2f while replacing +a1.
test('legacy occupied checkpoint retains apparent fallback across voluntary unload',()=>{
 for(const kind of [1,3]){
  const {world,vehicle,add}=setup(kind),first=add(),last=add('warrior','red')
  boardLiveVehicle(world,first.native,vehicle);boardLiveVehicle(world,last.native,vehicle)
  // Old saves retained the first boarding tribe and had no split owner field.
  vehicle.team='blue';delete vehicle.apparentTribe
  world.land.flags.fill(0);world.land.categories.fill(2);world.land.walkMasks[0].fill(255);world.land.heights.fill(0)
  vehicle.speed=-1
  const restored=migrateCheckpoint(structuredClone(world)),v=restored.vehicles.find(v=>v.id===vehicle.id)
  assert.equal(hudTransports(restored).find(item=>item.id===v.id).owner,0)
  assert.equal(canUnloadVehicle(restored,v),true);assert.equal(unloadLiveVehicle(restored,v),true)
  assert.equal(v.team,'red');assert.equal(v.passengerCount,0)
  assert.equal(hudTransports(restored).find(item=>item.id===v.id).owner,0,'unload preserves the pre-exit apparent fallback')
  assert.equal(v.apparentTribe,0)
  const again=migrateCheckpoint(structuredClone(restored)),saved=again.vehicles.find(item=>item.id===v.id)
  assert.equal(saved.apparentTribe,0);assert.equal(saved.team,'red')
 }
})

test('first and later boarding, either exit and reuse preserve the native two-owner contract',()=>{
 for(const kind of [1,3])for(const spy of [false,true])for(const timer of [0,1,63]){
  const {world,vehicle,add}=setup(kind),first=add(spy?'spy':'brave'),last=add(spy?'spy':'brave','red')
  first.native.disguise=(2<<6)|timer;last.native.disguise=(3<<6)|timer
  assert.ok(boardLiveVehicle(world,first.native,vehicle))
  assert.equal(vehicle.team,'blue');assert.equal(vehicle.apparentTribe,spy?2:0)
  assert.ok(boardLiveVehicle(world,last.native,vehicle))
  assert.equal(vehicle.team,'red');assert.equal(vehicle.apparentTribe,spy?3:1)
  assert.equal(counts(world)[kind].present,false,'real owner follows every successful boarding')
  leaveLiveVehicle(world,vehicle,first.native,vehicle)
  assert.equal(vehicle.team,'blue');assert.equal(vehicle.apparentTribe,spy?3:1)
  assert.equal(counts(world)[kind].present,true,'driver promotion does not replace the departing real owner')
  leaveLiveVehicle(world,vehicle,last.native,vehicle)
  assert.equal(vehicle.team,'red');assert.equal(vehicle.apparentTribe,spy?3:1)
  const next=add('brave','yellow');assert.ok(boardLiveVehicle(world,next.native,vehicle))
  assert.equal(vehicle.team,'yellow');assert.equal(vehicle.apparentTribe,2)
 }
})
test('occupied class reads rebuild from current passengers rather than stale row totals',()=>{
 const {world,vehicle,add}=setup(),first=add(),last=add()
 boardLiveVehicle(world,first.native,vehicle);boardLiveVehicle(world,last.native,vehicle)
 assert.equal(counts(world)[1].counts[2],1)
 // Supporting class-transition state: the live unit and person publish their new class.
 last.kind='warrior';last.native.model=3
 assert.equal(counts(world)[1].counts[2],1);assert.equal(counts(world)[1].counts[3],1)
 first.kind='warrior';first.native.model=3
 assert.equal(counts(world)[1].counts[2],0);assert.equal(counts(world)[1].counts[3],1)
})
