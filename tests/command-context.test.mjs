import test from 'node:test'
import assert from 'node:assert/strict'
import priorities from './fixtures/command-context.json' with {type:'json'}
import cells from './fixtures/command-cells.json' with {type:'json'}
import feedback from './fixtures/command-feedback.json' with {type:'json'}
import {chooseContextCommand,commandMarkerPoint} from '../app/command-context.ts'
import {liveCommandContext} from '../app/live-command.ts'
import {createWorld,addBuilding,addUnit,browserPosition,nativePosition,syncLandscapeObjects,command,distance,tick} from '../app/model.ts'
import {buildingFootprintCells} from '../app/building-shapes.ts'
import {buildingPose} from '../app/model.ts'
import {currentPersonOrder} from '../app/person-orders.ts'
import {advanceGame} from '../app/game-clock.ts'

test('automatic contextual priority matches original single and mixed-class captures',()=>{
 for(const c of priorities.cases)assert.equal(chooseContextCommand(c.flags,c.people),c.model,JSON.stringify(c))
})

test('live ground context follows native registered cells through rotations and world seams',()=>{
 const w=createWorld();w.units=[];w.buildings=[];w.trees=[];w.shrines=[]
 const u=addUnit(w,'blue','brave',{x:-12,z:8}),b=addBuilding(w,'blue','hut',{x:0,z:0},true)
 w.selected=[u.id];let key=''
 for(const c of cells.cases){
  const next=[c.angle,c.owner,c.anchor].join()
  if(next!==key){key=next;b.object=107;b.angle=c.angle*Math.PI/2;b.anchor={x:c.anchor,y:c.anchor};b.team=c.owner?'red':'blue';syncLandscapeObjects(w)}
  u.kind=({2:'brave',3:'warrior',7:'shaman'})[c.selected]
  assert.equal(liveCommandContext(w,browserPosition(c)).model,c.model,JSON.stringify(c))
 }
})

test('ground beside a hut moves the group, while its occupied cell enters it',()=>{
 const w=createWorld();w.units=[];w.buildings=[];w.trees=[];w.shrines=[]
 w.terrain.fill(3);w.terrainVersion++;w.manaWorld.gameFlags=32
 const u=addUnit(w,'blue','brave',{x:-12,z:8}),b=addBuilding(w,'blue','hut',{x:0,z:8},true)
 w.selected=[u.id];syncLandscapeObjects(w)
 let outside
 for(let x=b.x-3;x<=b.x+3;x+=.5)for(let z=b.z-3;z<=b.z+3;z+=.5){
  const p={x,z}
  if(distance(p,b)<3.1&&liveCommandContext(w,p).model===3)outside=p
 }
 assert.ok(outside,'fixture must exercise the removed circular proximity rule')
 command(w,outside);assert.equal(u.work,null);assert.equal(u.target,null)
 assert.equal(u.native.commandStatus,3)
 const cell=buildingFootprintCells(buildingPose(b))[0]
 const inside=browserPosition({x:(cell%128)*512+256,y:Math.floor(cell/128)*512+256})
 command(w,inside);assert.equal(u.work,b.id)
})

test('an exact tree click harvests, seeks a timber plan and otherwise returns to rest',()=>{
 const w=createWorld();w.units=[];w.buildings=[];w.trees=[];w.shrines=[]
 w.terrain.fill(3);w.terrainVersion++;w.manaWorld.gameFlags=32
 const u=addUnit(w,'blue','brave',{x:-12,z:8}),tree={id:w.nextId++,x:-8,z:8,model:1,logs:4}
 const plan=addBuilding(w,'blue','hut',{x:4,z:8},false,{plan:true})
 const fallback=addBuilding(w,'blue','hut',{x:12,z:8},false,{plan:true})
 w.trees.push(tree);w.selected=[u.id]
 assert.equal(liveCommandContext(w,tree).model,7)
 assert.equal(command(w,tree),true);assert.equal(u.tree,tree.id)
 let started=0,completed=0
 for(let turns=1;turns<=240&&!u.cargo;turns++){
  tick(w,1/12)
  if(!started&&u.harvest)started=turns
  if(u.cargo)completed=turns
 }
 assert.equal(completed-started+1,20)
 assert.equal(u.cargo,1);assert.equal(tree.logs,3);assert.equal(u.tree,null)
 assert.equal(u.work,null);assert.equal(u.delivery?.target,plan.id)
 plan.hp=0;tick(w,1/12)
 assert.equal(u.delivery?.target,fallback.id);assert.ok(u.path.length)
 for(let turns=0;turns<240&&u.cargo;turns++)tick(w,1/12)
 assert.equal(u.cargo,0);assert.equal(u.work,null);assert.equal(u.delivery,undefined)
 assert.ok(w.trees.some(t=>t.model===11&&distance(t,fallback)<6))

 const idle=createWorld();idle.units=[];idle.buildings=[];idle.trees=[];idle.shrines=[]
 idle.terrain.fill(3);idle.terrainVersion++;idle.manaWorld.gameFlags=32
 const resting=addUnit(idle,'blue','brave',{x:-12,z:8}),source={id:idle.nextId++,x:-8,z:8,model:1,logs:4}
 idle.trees.push(source)
 idle.selected=[resting.id];command(idle,source)
 for(let turns=0;turns<480&&!idle.trees.some(t=>t.model===11);turns++)tick(idle,1/12)
 assert.ok(source.logs<4);assert.equal(resting.tree,null)
 assert.equal(resting.cargo,0);assert.equal(resting.work,null)
 assert.ok(idle.trees.some(t=>t.model===11))
})

test('a queued ordinary-tree harvest keeps its cargo and advances the existing waypoint',()=>{
 const run=schedule=>{
  const w=createWorld();w.units=[];w.buildings=[];w.trees=[];w.shrines=[]
  w.terrain.fill(3);w.terrainVersion++;w.manaWorld.gameFlags=32
  const u=addUnit(w,'blue','brave',{x:-12,z:8}),tree={id:w.nextId++,x:-8,z:8,model:1,logs:4}
  w.trees.push(tree);w.selected=[u.id]
  assert.equal(command(w,tree,{ctrlKey:true}),true)
  const p=u.native,treeId=p.commands[0],treeOrder=w.buildingOrders.records[treeId],point=nativePosition(w,tree)
  assert.deepEqual([treeOrder.model,treeOrder.flags,treeOrder.a,treeOrder.b],[7,0x84,(point.x&0xff00)+128,(point.y&0xff00)+128])
  assert.equal(command(w,{x:12,z:8}),true)
  const waypointId=p.commands[1],waypoint=w.buildingOrders.records[waypointId]
  assert.equal(waypoint.model,3)
  const history=[]
  let elapsed=0,index=0,advanced,started
  const clock={animationTime:0,animationFrame:0,afterTurn:()=>{
   if(started===undefined&&u.harvest)started=w.turn
   if(!advanced&&currentPersonOrder(w.buildingOrders,p)===waypoint)
    advanced={turn:w.turn,harvestTurns:w.turn-started+1,cargo:u.cargo,logs:tree.logs,x:u.x,z:u.z,treeSlot:p.commands[0],waypointSlot:p.commands[1]}
   history.push([w.turn,u.x,u.z,u.cargo,tree.logs,p.commandCursor,currentPersonOrder(w.buildingOrders,p)?.model??0])
  }}
  while(elapsed<20&&!advanced){
   const dt=Math.min(schedule[index++%schedule.length],20-elapsed)
   advanceGame(w,clock,dt);elapsed+=dt
  }
  assert.ok(advanced)
  assert.deepEqual(advanced,{turn:advanced.turn,harvestTurns:20,cargo:1,logs:3,x:advanced.x,z:advanced.z,treeSlot:0,waypointSlot:waypointId})
  const start=advanced.x
  while(elapsed<24){const dt=Math.min(schedule[index++%schedule.length],24-elapsed);advanceGame(w,clock,dt);elapsed+=dt}
  assert.ok(u.x>start,'the brave visibly continues toward the queued waypoint')
  return {history,advanced,treeId,waypointId,random:w.randomState,x:u.x,z:u.z,cargo:u.cargo,logs:tree.logs}
 }
 const expected=run([1/60])
 for(const schedule of [[1/5],[1/30],[1/144],[1/240],[.004,.13,.009,.034]])assert.deepEqual(run(schedule),expected)
})

test('input feedback matches native ground-cell centers and suppresses flashes over pointed objects',()=>{
 for(const c of feedback)assert.deepEqual(commandMarkerPoint(c.point,c.target),c.expected)
})
