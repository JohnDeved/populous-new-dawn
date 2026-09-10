import assert from 'node:assert/strict'
import test from 'node:test'
import {createWorld,addBuilding,addUnit,command,tick,buildingStage} from '../app/model.ts'
import {dismantleBuilding,selectBuildingOccupants,isDismantling} from '../app/live-building-entry.ts'
import {currentPersonOrder} from '../app/person-orders.ts'
import {advanceGame} from '../app/game-clock.ts'

function until(w,ready,limit=400){for(let i=0;i<limit&&!ready();i++)tick(w,1/12);assert.ok(ready())}
function scenario(direction=2,count=8){
  const w=createWorld();w.inputMask=0;w.manaWorld.gameFlags=32
  w.units=w.units.filter(u=>u.kind==='shaman')
  const b=addBuilding(w,'blue','camp',{x:-2,z:32},true,{angle:direction*Math.PI/2})
  const people=Array.from({length:count},(_,i)=>addUnit(w,'blue','brave',{x:7+i*.4,z:33}))
  w.selected=people.map(u=>u.id);command(w,b)
  until(w,()=>b.admission?.inside===Math.min(5,count)&&people.every(u=>!u.entry?.person.speed))
  return{w,b,people}
}

test('training selection eligibility reads command flags, independently of motion turning flags',()=>{
  const{w,b,people}=scenario(2,2),p=people[0].entry.person
  w.selected=[];p.flags2|=128;p.flags4&=~128
  selectBuildingOccupants(w,b,people[0].id,false)
  assert.deepEqual(w.selected,[people[0].id],'turning does not prevent selection')
  selectBuildingOccupants(w,b,people[0].id,false)
  p.flags2&=~128;p.flags4|=128
  selectBuildingOccupants(w,b,people[0].id,false)
  assert.deepEqual(w.selected,[],'command eligibility blocks selection')
})

test('dismantling reassigns residents and queued braves, recovers all timber and removes the building in four orientations',()=>{
  for(let direction=0;direction<4;direction++){
    const{w,b,people}=scenario(direction),before=people.map(u=>[u.x,u.z])
    assert.ok(people.every(u=>u.entry.person.state===10),'entry owns the native order state')
    const occupants=b.admission.occupants.filter(Boolean)
    dismantleBuilding(w,b)
    assert.ok(b.admission.activity&0x8000);assert.equal(b.admission.inside,0)
    assert.deepEqual(people.map(u=>[u.x,u.z]),before,'starting never teleports occupants')
    assert.ok(people.every(u=>isDismantling(w,u)))
    assert.equal(w.buildingOrders.active,4)
    assert.equal(currentPersonOrder(w.buildingOrders,people.find(u=>u.id===occupants[0]).entry.person).references,5)
    const stages=new Set([buildingStage(b)]),phases=new Set()
    until(w,()=>{
      stages.add(buildingStage(b));for(const u of people)if(u.entry)phases.add(u.entry.person.substate)
      return b.hp<=0
    })
    assert.ok(phases.has(3)&&phases.has(5));assert.ok(stages.size>=3)
    assert.equal(people.reduce((n,u)=>n+u.cargo,0)+w.trees.filter(t=>t.model===11).reduce((n,t)=>n+t.logs,0),8)
    assert.equal(b.dismantled,true);assert.ok(!w.buildings.includes(b))
    tick(w,1/12);assert.equal(w.buildingOrders.active,0)
    assert.ok(people.every(u=>u.hp>0&&u.inside===null&&!u.entry))
  }
})

test('cancelling dismantling stops existing workers; new orders can staff an empty dismantling building',()=>{
  const{w,b,people}=scenario(2,3)
  dismantleBuilding(w,b);until(w,()=>b.progress<1)
  const remaining=b.damageState.plan.remaining
  dismantleBuilding(w,b);tick(w,1/12)
  assert.ok(!(b.admission.activity&0x8000));assert.ok(people.every(u=>!isDismantling(w,u)))
  for(let i=0;i<30;i++)tick(w,1/12)
  assert.equal(b.damageState.plan.remaining,remaining)
  dismantleBuilding(w,b)
  w.selected=people.map(u=>u.id);command(w,b)
  until(w,()=>b.hp<=0)
  assert.equal(b.dismantled,true)
})

test('dismantling outcomes and timber remain independent of render frequency',()=>{
  let baseline
  for(const hz of [5,30,60,144,240]){
    const{w,b,people}=scenario(2,5);dismantleBuilding(w,b)
    const clock={animationTime:0,animationFrame:0}
    for(let i=0;i<hz*12;i++)advanceGame(w,clock,1/hz)
    const result={turn:w.turn,rng:w.randomState,building:b.hp,people:people.map(u=>[u.x,u.z,u.cargo,u.work]),logs:w.trees.filter(t=>t.model===11).map(t=>[t.x,t.z,t.logs])}
    if(baseline)assert.deepEqual(result,baseline,`${hz} Hz`);else baseline=result
  }
})
