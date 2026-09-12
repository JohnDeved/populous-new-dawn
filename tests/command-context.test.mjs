import test from 'node:test'
import assert from 'node:assert/strict'
import priorities from './fixtures/command-context.json' with {type:'json'}
import cells from './fixtures/command-cells.json' with {type:'json'}
import feedback from './fixtures/command-feedback.json' with {type:'json'}
import {chooseContextCommand,commandMarkerPoint} from '../app/command-context.ts'
import {liveCommandContext} from '../app/live-command.ts'
import {createWorld,addBuilding,addUnit,browserPosition,syncLandscapeObjects,command,distance,tick} from '../app/model.ts'
import {buildingFootprintCells} from '../app/building-shapes.ts'
import {buildingPose} from '../app/model.ts'

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

test('an exact tree click walks a brave through native-timed harvest and transfer',()=>{
 const w=createWorld();w.units=[];w.buildings=[];w.trees=[];w.shrines=[]
 w.terrain.fill(3);w.terrainVersion++;w.manaWorld.gameFlags=32
 const u=addUnit(w,'blue','brave',{x:-12,z:8}),tree={id:w.nextId++,x:-8,z:8,model:1,logs:4}
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
 assert.equal(u.cargo,1);assert.equal(tree.logs,3);assert.equal(u.tree,tree.id)
 addBuilding(w,'blue','hut',{x:-2,z:8},true)
 for(let turns=0;turns<64;turns++)tick(w,1/12)
 assert.equal(u.work,null,'the unevidenced tail must not auto-route carried timber to a nearby hut')
})

test('input feedback matches native ground-cell centers and suppresses flashes over pointed objects',()=>{
 for(const c of feedback)assert.deepEqual(commandMarkerPoint(c.point,c.target),c.expected)
})
