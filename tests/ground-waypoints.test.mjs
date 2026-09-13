import test from 'node:test'
import assert from 'node:assert/strict'
import {createWorld,addUnit,command,tick,cancelInteraction} from '../app/model.ts'
import {advanceGame} from '../app/game-clock.ts'
import {currentPersonOrder} from '../app/person-orders.ts'

function world(count=6,kind='brave'){
 const w=createWorld();w.units=[];w.buildings=[];w.shrines=[];w.trees=[];w.terrain.fill(3);w.terrainVersion++;w.manaWorld.gameFlags=32
 for(let i=0;i<count;i++)addUnit(w,'blue',kind,{x:-25+i*.5,z:8})
 w.selected=w.units.map(u=>u.id);return w
}
const turn=(w,n)=>{for(let i=0;i<n;i++)tick(w,1/12)}

test('Ctrl starts followers immediately, appends shared waypoints and ordinary click ends the sequence',()=>{
 const w=world();command(w,{x:-4,z:8},{ctrlKey:true});const p=w.units[0].native,first=currentPersonOrder(w.buildingOrders,p)
 assert.equal(w.orderCursor,1);assert.equal(first.references,6);assert.equal(first.flags,128)
 turn(w,12);assert.ok(w.units.every(u=>u.x>-22),'movement begins before the final click')
 const x=w.units[0].x
 command(w,{x:-4,z:24},{ctrlKey:true});command(w,{x:20,z:24})
 assert.equal(w.units[0].x,x);assert.equal(currentPersonOrder(w.buildingOrders,p),first,'adding orders must retain the first destination')
 assert.equal(w.orderCursor,0);assert.equal(w.buildingOrders.active,3)
 for(const u of w.units){assert.equal(u.native.commands.filter(Boolean).length,3);assert.deepEqual(u.native.commands,p.commands)}
 assert.deepEqual(p.commands.filter(Boolean).map(id=>w.buildingOrders.records[id].flags),[128,128,0])
 const visited=new Set()
 for(let i=0;i<400;i++){turn(w,1);visited.add(p.commandCursor)}
 assert.deepEqual([...visited],[0,1,2]);assert.ok(w.units.every(u=>u.x>18&&u.z>21&&u.native.state===19))
 assert.equal(new Set(w.units.map(u=>`${u.x},${u.z}`)).size,6)
 assert.equal(w.buildingOrders.active,0);assert.equal(w.motionRoutes.active,0);assert.equal(w.marching.length,0)
 command(w,{x:-20,z:8},{ctrlKey:true});assert.equal(p.commandCursor,0,'a new sequence clears a completed circular cursor')
})

test('eighth Ctrl click and Alt final click deselect without cancelling issued orders; right-click ends staging',()=>{
 const w=world(1)
 for(let i=0;i<8;i++)command(w,{x:i*3,z:8},{ctrlKey:true,shiftKey:true})
 const p=w.units[0].native
 assert.equal(w.orderCursor,0);assert.deepEqual(w.selected,[]);assert.equal(p.commands.filter(Boolean).length,8)
 assert.deepEqual(p.commands.map(id=>w.buildingOrders.records[id].flags),[192,192,192,192,192,192,192,64])
 assert.equal(p.selectionFlags&129,1)
 turn(w,400);assert.equal(w.buildingOrders.active,0)
 w.selected=[p.id];command(w,{x:-10,z:8},{ctrlKey:true});command(w,{x:-20,z:8},{altKey:true})
 assert.deepEqual(w.selected,[]);assert.equal(p.commands.filter(Boolean).length,2)
 w.selected=[p.id];command(w,{x:10,z:8},{ctrlKey:true});const before=p.commands.slice()
 cancelInteraction(w);assert.equal(w.orderCursor,0);assert.deepEqual(p.commands,before)
})

test('queued ground movement preserves every turn, RNG, poses and footprints at 5–240 Hz and irregular frames',()=>{
 const run=schedule=>{
  const w=world();command(w,{x:-4,z:8},{ctrlKey:true});command(w,{x:-4,z:24},{ctrlKey:true});command(w,{x:20,z:24})
  const history=[],clock={animationTime:0,animationFrame:0,afterTurn:()=>history.push(w.units.map(u=>[u.x,u.z,u.native.commandCursor,u.native.state,u.native.object,u.native.frame]))}
  let elapsed=0,index=0
  while(elapsed<32-1e-9){const dt=Math.min(schedule[index++%schedule.length],32-elapsed);advanceGame(w,clock,dt);elapsed+=dt}
  assert.equal(w.buildingOrders.active,0);assert.equal(w.motionRoutes.active,0)
  return {history,units:w.units,random:w.randomState,footprints:w.footprints.cursor}
 }
 const expected=run([1/60]);for(const schedule of [[1/5],[1/30],[1/120],[1/144],[1/240],[.004,.13,.009,.034]])assert.deepEqual(run(schedule),expected)
})

test('continued queue allocation failure retains issued orders, and an ordinary replacement releases them',()=>{
 const w=world(2);command(w,{x:-4,z:8},{ctrlKey:true});const before=w.units.map(u=>u.native.commands.slice())
 for(const o of w.buildingOrders.records)if(!o.references)o.references=1
 w.buildingOrders.active=799;command(w,{x:20,z:24},{ctrlKey:true})
 assert.equal(w.orderCursor,2);assert.deepEqual(w.units.map(u=>u.native.commands),before)
 // Restore only the artificial occupancy; the real shared command stays owned.
 for(const o of w.buildingOrders.records)if(o.references===1)o.references=0
 w.buildingOrders.active=1;command(w,{x:20,z:24});assert.equal(w.buildingOrders.active,2)
 command(w,{x:-20,z:12});assert.equal(w.buildingOrders.active,1)
 assert.ok(w.units.every(u=>u.native.commands.filter(Boolean).length===1))
 turn(w,160);assert.equal(w.buildingOrders.active,0)
})

test('an enemy-person order waits behind a waypoint and advances when its target becomes unavailable',()=>{
 const direct=world(1),follower=direct.units[0],directEnemy=addUnit(direct,'red','brave',{x:0,z:20}),start={x:follower.x,z:follower.z}
 command(direct,directEnemy,{ctrlKey:true});command(direct,{x:20,z:8});assert.deepEqual(follower.native.commands.filter(Boolean).map(id=>direct.buildingOrders.records[id].model),[28,3]);turn(direct,12)
 assert.ok(follower.x!==start.x||follower.z!==start.z,'a Ctrl-started attack keeps immediate pursuit')
 directEnemy.hp=0;turn(direct,1);assert.equal(currentPersonOrder(direct.buildingOrders,follower.native)?.model,3)
 for(const unavailable of [enemy=>enemy.hp=0,enemy=>enemy.inside=999,enemy=>enemy.lift=1]){
  const w=world(1),u=w.units[0],enemy=addUnit(w,'red','brave',{x:0,z:20})
  command(w,{x:-4,z:8},{ctrlKey:true});command(w,enemy,{ctrlKey:true});command(w,{x:20,z:8})
  const p=u.native,models=()=>p.commands.filter(Boolean).map(id=>w.buildingOrders.records[id].model)
  assert.deepEqual(models(),[3,28,3]);assert.equal(u.target,null)
  for(let i=0;i<200&&currentPersonOrder(w.buildingOrders,p)?.model!==28;i++)turn(w,1)
  assert.equal(currentPersonOrder(w.buildingOrders,p)?.model,28);turn(w,1);assert.equal(u.target,enemy.id)
  const start=u.x;turn(w,8);assert.notEqual(u.x,start,'the active attack pursues its available target')
  unavailable(enemy);turn(w,1)
  assert.equal(currentPersonOrder(w.buildingOrders,p)?.model,3);assert.equal(u.target,null)
  for(let i=0;i<300&&w.buildingOrders.active;i++)turn(w,1)
  assert.ok(u.x>18);assert.equal(w.buildingOrders.active,0)
 }
})

test('ground waypoint handoff uses each playable class default initializer',()=>{
 for(const kind of ['brave','warrior','shaman']){
  const w=world(1,kind);command(w,{x:-4,z:8},{ctrlKey:true});command(w,{x:20,z:24})
  turn(w,400);const u=w.units[0]
  assert.ok(u.x>18&&u.z>21);assert.equal(u.native.state,19)
  assert.equal(w.buildingOrders.active,0);assert.equal(w.motionRoutes.active,0)
 }
})
