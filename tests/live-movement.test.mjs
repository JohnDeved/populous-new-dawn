import test from 'node:test'
import assert from 'node:assert/strict'
import {createWorld,addUnit,addBuilding,command,tick,unitAnimationSource} from '../app/model.ts'
import {advanceGame} from '../app/game-clock.ts'
import {initializeLivePanic,moveLivePerson} from '../app/live-people.ts'
import {currentPersonOrder} from '../app/person-orders.ts'

function scenario(count=24) {
 const w=createWorld();w.units=[];w.buildings=[];w.shrines=[];w.trees=[];w.manaWorld.gameFlags=32
 w.terrain.fill(3);w.terrainVersion++
 for(let i=0;i<count;i++)addUnit(w,'blue','brave',{x:-25+i%3*.5,z:8+Math.floor(i/3)*.5})
 w.selected=w.units.map(u=>u.id);command(w,{x:30,z:8});return w
}
function turns(w,n){for(let i=0;i<n;i++)tick(w,1/12)}

test('live marching uses shared commands, original poses, separate slots and releases interruption/death/arrival ownership',()=>{
 const w=scenario(),order=currentPersonOrder(w.buildingOrders,w.units[0].native)
 assert.equal(w.buildingOrders.active,1);assert.equal(order.references,24)
 assert.ok(w.units.every(u=>currentPersonOrder(w.buildingOrders,u.native)===order&&u.native.object===40&&unitAnimationSource(u)===u.native))
 turns(w,60)
 assert.ok(w.marching.length>=2)
 assert.ok(w.marching.every(g=>g.count>=2&&g.count<=11))
 const members=w.marching.flatMap(g=>g.members.filter(Boolean))
 assert.equal(new Set(members).size,members.length);assert.ok(members.length>=20)
 assert.ok(new Set(w.units.map(u=>`${u.x},${u.z}`)).size>=20,'followers visibly spread into marching slots')
 const paused=JSON.stringify({units:w.units,groups:w.marching,random:w.randomState})
 w.paused=true;tick(w,2);assert.equal(JSON.stringify({units:w.units,groups:w.marching,random:w.randomState}),paused);w.paused=false
 const leaving=w.units.find(u=>members.includes(u.id)),person=leaving.native
 w.selected=[leaving.id];command(w,{x:-25,z:12})
 assert.equal(leaving.native,person);assert.equal(order.references,23)
 assert.equal(person.assignment&32,0);assert.equal(person.commandStatus,3)
 const victim=w.units.find(u=>u!==leaving&&members.includes(u.id));victim.hp=0
 turns(w,2)
 assert.equal(order.references,22);assert.ok(!w.units.includes(victim))
 assert.ok(w.marching.every(g=>!g.members.includes(victim.id)&&!g.members.includes(leaving.id)))
 turns(w,300)
 assert.equal(w.buildingOrders.active,0);assert.equal(order.references,0);assert.equal(w.marching.length,0)
 assert.ok(w.units.every(u=>u.native.state===19&&!(u.native.assignment&32)))
 assert.ok(leaving.x<-20);assert.ok(w.units.filter(u=>u!==leaving).every(u=>u.x>25))
 assert.equal(new Set(w.units.map(u=>`${u.x},${u.z}`)).size,w.units.length)
})

test('marching and resting preserve mechanics, footprints and sprite frames at 5–240 Hz and irregular frames',()=>{
 const run=schedule=>{
  const w=scenario(12),history=[],clock={animationTime:0,animationFrame:0,afterTurn:()=>history.push(w.units.map(u=>[u.x,u.z,u.heading,u.native.state,u.native.assignment,u.native.object]))}
  let elapsed=0,i=0
  while(elapsed<24-1e-9){const dt=Math.min(schedule[i++%schedule.length],24-elapsed);advanceGame(w,clock,dt);elapsed+=dt}
  assert.ok(history.some(row=>row.some(p=>p[4]&32)))
  assert.equal(w.buildingOrders.active,0)
  return {history,random:w.randomState,pose:w.cosmeticRandom,units:w.units,footprints:w.footprints.cursor}
 }
 const expected=run([1/60])
 for(const schedule of [[1/5],[1/30],[1/120],[1/144],[1/240],[.004,.13,.009,.034]])assert.deepEqual(run(schedule),expected)
})

test('exhausted command pool preserves the previous movement and group ownership',()=>{
 const w=scenario(2),before=w.units.map(u=>u.native.commands.slice())
 for(const order of w.buildingOrders.records)order.references=1
 w.buildingOrders.active=799
 command(w,{x:20,z:15})
 assert.deepEqual(w.units.map(u=>u.native.commands),before)
 assert.ok(w.units.every(u=>u.native.goalX===38*256))
})


test('panic retains the real movement command and resumes its route after recovery',()=>{
 const w=scenario(2);turns(w,30)
 const u=w.units[0],p=u.native,order=currentPersonOrder(w.buildingOrders,p)
 initializeLivePanic(w,u)
 assert.equal(p.state,26);assert.equal(currentPersonOrder(w.buildingOrders,p),order)
 turns(w,65)
 assert.equal(u.native,p);assert.equal(p.state,10);assert.equal(p.commandStatus,3)
 assert.equal(currentPersonOrder(w.buildingOrders,p),order)
 assert.equal(w.pathfinding.people.get(u.id),p);assert.ok(p.motionGroup)
 turns(w,250)
 assert.equal(w.buildingOrders.active,0);assert.equal(p.state,19);assert.ok(u.x>25)
})


test('obstacle recovery replans the owned group order and settles identically at 5–240 Hz',()=>{
 const run=schedule=>{
  const w=scenario(24),order=currentPersonOrder(w.buildingOrders,w.units[0].native)
  // Change the route after acceptance. Real collision must request recovery.
  addBuilding(w,'blue','hut',{x:0,z:8},true)
  let retries=0,retrying=new Set()
  const history=[],clock={animationTime:0,animationFrame:0,afterTurn:()=>{
   for(const u of w.units) {
    const p=u.native
    if(retrying.has(u.id))assert.ok(p.motionGroup,'a retry around this hut must retain a planned route, not reset direct steering')
    if(p.flags2&0x80000000){retries++;assert.equal(currentPersonOrder(w.buildingOrders,p),order)}
    if(p.motionGroup)assert.equal(w.pathfinding.people.get(u.id),p,'the replanned route retains the live person owner')
   }
   retrying=new Set(w.units.filter(u=>u.native.flags2&0x80000000).map(u=>u.id))
   history.push(w.units.map(u=>[u.x,u.z,u.native.state,u.native.motionGroup,u.native.motionIndex]))
  }}
  let time=0,i=0
  while(time<42-1e-9){const dt=Math.min(schedule[i++%schedule.length],42-time);advanceGame(w,clock,dt);time+=dt}
  assert.ok(retries>0,'collision must actually request a new route')
  assert.ok(w.units.every(u=>u.x>25&&u.native.state===19),'the entire group must get around the new hut and settle')
  assert.equal(w.buildingOrders.active,0);assert.equal(order.references,0)
  assert.equal(w.motionRoutes.active,0);assert.equal(w.pathfinding.people.size,0)
  return {history,retries,people:w.units,random:w.randomState,pose:w.cosmeticRandom,footprints:w.footprints.cursor}
 }
 const expected=run([1/60])
 for(const schedule of [[1/5],[1/30],[1/120],[1/144],[1/240],[.004,.13,.009,.034]])assert.deepEqual(run(schedule),expected)
})


test('shared ground motion advances a retained route once before any state controller',()=>{
 const w=scenario(1),u=w.units[0],p=u.native,id=p.motionGroup,data=w.motionRoutes.records
 assert.ok(id)
 p.speed=0;p.motionIndex=0;p.x=(p.x&0xfe00)+256;p.y=(p.y&0xfe00)+256
 data[id*109+108]=3
 // Coincident waypoints expose accidental double advancement in the same visit.
 for(let i=0;i<3;i++)data.set([p.x>>8,p.y>>8,0,0],id*109+12+i*4)
 moveLivePerson(w,u,p)
 assert.equal(p.motionGroup,id);assert.equal(p.motionIndex,1)
 assert.equal(p.turnAngle,p.destinationX);assert.equal(p.turnY,p.destinationY)
})
