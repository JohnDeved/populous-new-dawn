import assert from 'node:assert/strict'
import test from 'node:test'
import {createWorld,addBuilding,addUnit,command,tick,buildingStage} from '../app/model.ts'
import {dismantleBuilding,selectBuildingOccupants,isDismantling} from '../app/live-building-entry.ts'
import {startLiveCombatResponse} from '../app/live-building-combat.ts'
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

function queuedSite(direction = 0, count = 3, marked = true) {
  const w = createWorld()
  Object.assign(w, { units: [], buildings: [], trees: [], shrines: [], inputMask: 0 })
  w.manaWorld.gameFlags = 32
  w.terrain.fill(3); w.terrainVersion++
  const b = addBuilding(w, 'blue', 'hut', { x: 0, z: 8 }, true, { angle: direction * Math.PI / 2 })
  if (marked) dismantleBuilding(w, b)
  const people = Array.from({ length: count }, (_, i) => addUnit(w, 'blue', 'brave', { x: -20 + i / 2, z: 8 }))
  w.selected = people.map(u => u.id)
  return { w, b, people }
}
const ownedPerson = u => u.native ?? u.fight?.motion ?? u.entry?.person
const orderModels = (w,u) => ownedPerson(u).commands.filter(Boolean).map(id=>w.buildingOrders.records[id].model)
const issueWork = (w,b) => {
  command(w, { x: -10, z: 8 }, { ctrlKey: true })
  command(w, b, { ctrlKey: true })
  command(w, { x: 20, z: 8 })
}

test('mixed groups queue movement, dismantling and movement without redirecting ineligible warriors', () => {
  for(let direction=0;direction<4;direction++) {
    const { w,b,people }=queuedSite(direction)
    const warrior=addUnit(w,'blue','warrior',{x:-22,z:8})
    w.selected.push(warrior.id)
    issueWork(w,b)
    const persons=people.map(ownedPerson), ids=persons[0].commands.filter(Boolean), logs=b.logs
    assert.ok(people.every(u=>orderModels(w,u).join()==='3,10,3'))
    assert.deepEqual(orderModels(w,warrior),[3,3])
    assert.ok(people.every(u=>u.work===null),'future work does not preempt the first waypoint')
    assert.equal(w.buildingOrders.records[ids[1]].references,3)
    until(w,()=>people.every(u=>isDismantling(w,u)))
    assert.ok(people.every((u,i)=>ownedPerson(u)===persons[i]))
    until(w,()=>!w.buildingOrders.active,800)
    assert.equal(b.hp,0);assert.equal(b.dismantled,true)
    assert.ok([...people,warrior].every(u=>u.hp>0&&u.x>18&&u.inside===null))
    assert.equal(people.reduce((sum,u)=>sum+u.cargo,0)+w.trees.filter(t=>t.model===11).reduce((sum,t)=>sum+t.logs,0),logs)
    assert.ok(ids.every(id=>!w.buildingOrders.records[id].references))
  }
})

test('queued building entry can become dismantling; cancellation skips work while retaining the destination', () => {
  for(const mode of ['converted','cancelled','removed']) {
    const { w,b,people:[u] }=queuedSite(0,1,mode!=='converted')
    issueWork(w,b)
    const p=ownedPerson(u),tail=p.commands[2]
    if(mode==='converted') {
      assert.deepEqual(orderModels(w,u),[3,8,3]);dismantleBuilding(w,b)
      assert.deepEqual(orderModels(w,u),[3,10,3])
    } else if(mode==='cancelled') dismantleBuilding(w,b)
    else b.hp=0
    assert.equal(w.buildingOrders.records[tail].references,1)
    until(w,()=>!w.buildingOrders.active,800)
    assert.ok(u.hp>0&&u.x>18)
    if(mode==='cancelled') assert.equal(b.progress,1)
    if(mode==='converted') assert.equal(b.dismantled,true)
  }
})

test('dismantling queue replacement and death release references while non-braves keep their current orders', () => {
  for(const mode of ['replace','death']) {
    const { w,b,people:[u] }=queuedSite(0,1)
    issueWork(w,b);until(w,()=>isDismantling(w,u))
    const ids=ownedPerson(u).commands.filter(Boolean)
    if(mode==='replace') { w.selected=[u.id];command(w,{x:-20,z:14}) }
    else u.hp=0
    tick(w,1/12)
    assert.ok(ids.every(id=>!w.buildingOrders.records[id].references))
  }
  const {w,b}=queuedSite(0,0),u=addUnit(w,'blue','warrior',{x:-20,z:8})
  w.selected=[u.id];command(w,{x:20,z:20})
  const before=structuredClone(u),orders=structuredClone(w.buildingOrders)
  command(w,b,{ctrlKey:true})
  assert.deepEqual(u,before);assert.deepEqual(w.buildingOrders,orders)
})

test('automatic combat pauses shared dismantling and resumes its retained order', () => {
  const {w,b,people}=scenario(2,2);dismantleBuilding(w,b)
  const persons=people.map(ownedPerson),order=persons[0].commands[persons[0].commandCursor],progress=b.progress
  people[0].cargo=1;persons[0].cargo=100
  const enemy=addUnit(w,'red','shaman',{x:people[0].x+.25,z:people[0].z})
  persons[0].flags3|=0x800;tick(w,1/12)
  const immediate=persons[0].immediateCommand
  assert.ok(immediate&&people.every(u=>ownedPerson(u).immediateCommand===immediate))
  assert.equal(w.buildingOrders.records[immediate].model,21);assert.equal(w.buildingOrders.records[immediate].references,2)
  assert.equal(w.buildingOrders.records[order].references,2);assert.equal(b.progress,progress)
  assert.ok(people.every((u,i)=>ownedPerson(u)===persons[i]&&ownedPerson(u).commandStatus===21))
  assert.equal(w.buildingOrders.records[order].a,b.id)
  assert.equal(people[0].cargo,1);assert.equal(persons[0].cargo,100)
  enemy.hp=0
  until(w,()=>people.every(u=>isDismantling(w,u)))
  assert.ok(people.every((u,i)=>ownedPerson(u)===persons[i]&&ownedPerson(u).commandStatus===10&&ownedPerson(u).immediateCommand===0&&u.work===b.id))
  assert.equal(w.buildingOrders.records[order].references,2);assert.equal(people[0].cargo,1);assert.equal(persons[0].cargo,100)
})

test('automatic combat completion follows the native circular dismantling queue', () => {
  const {w,b,people:[u]}=queuedSite(0,1);issueWork(w,b);until(w,()=>isDismantling(w,u))
  const p=ownedPerson(u),dismantle=p.commands[1],tail=p.commands[2]
  const enemy=addUnit(w,'red','shaman',{x:u.x+.25,z:u.z});p.flags3|=0x800;tick(w,1/12)
  assert.ok(p.immediateCommand);enemy.hp=0
  until(w,()=>p.commandStatus===3&&p.commandCursor===2)
  assert.equal(p.commands[1],dismantle);assert.equal(w.buildingOrders.records[dismantle].references,1);assert.equal(p.commands[2],tail)
  until(w,()=>isDismantling(w,u),800)
  assert.equal(ownedPerson(u),p);assert.equal(p.commandCursor,1);assert.equal(p.commands[1],dismantle)
})

test('automatic combat allocation failure keeps dismantling state intact', () => {
  const {w,b,people:[u]}=scenario(2,1);dismantleBuilding(w,b)
  const p=ownedPerson(u),order=p.commands[p.commandCursor],before={status:p.commandStatus,immediate:p.immediateCommand,cargo:u.cargo,personCargo:p.cargo,work:u.work,progress:b.progress}
  addUnit(w,'red','shaman',{x:u.x+.25,z:u.z});p.flags3|=0x800
  for(const record of w.buildingOrders.records.slice(1))record.references ||= 1
  w.buildingOrders.active=799
  assert.equal(startLiveCombatResponse(w,u),false)
  assert.deepEqual({status:p.commandStatus,immediate:p.immediateCommand,cargo:u.cargo,personCargo:p.cargo,work:u.work,progress:b.progress},before)
  assert.equal(p.commands[p.commandCursor],order);assert.equal(ownedPerson(u),p)
})

test('queued dismantling, timber and following movement agree at 5–240 Hz and irregular frames', () => {
  const run=schedule=>{
    const {w,b}=queuedSite();issueWork(w,b)
    const clock={animationTime:0,animationFrame:0}
    let elapsed=0,frame=0
    while(elapsed<40-1e-9){const dt=Math.min(40-elapsed,schedule[frame++%schedule.length]);advanceGame(w,clock,dt);elapsed+=dt}
    assert.equal(w.buildingOrders.active,0);assert.equal(b.hp,0)
    return {...w,pendingTime:0}
  }
  const baseline=run([1/60])
  for(const schedule of [[1/5],[1/30],[1/120],[1/144],[1/240],[.003,.6,.016,.09]])assert.deepEqual(run(schedule),baseline)
})
