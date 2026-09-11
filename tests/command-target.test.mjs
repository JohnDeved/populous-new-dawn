import test from 'node:test'
import assert from 'node:assert/strict'
import {createWorld,addUnit,addBuilding,command} from '../app/model.ts'

function scenario(){
 const w=createWorld();w.units=[];w.buildings=[];w.shrines=[];w.trees=[]
 w.terrain.fill(3);w.terrainVersion++;w.manaWorld.gameFlags=32
 const follower=addUnit(w,'blue','brave',{x:-12,z:8})
 const first=addUnit(w,'red','brave',{x:0,z:8})
 const target=addUnit(w,'red','warrior',{x:.5,z:8})
 w.selected=[follower.id]
 return {w,follower,first,target}
}

test('object commands retain the chosen identity through overlaps and array reordering',()=>{
 const {w,follower,target}=scenario()
 command(w,target);assert.equal(follower.target,target.id,'the second enemy was clicked')
 const hut=addBuilding(w,'blue','hut',{x:0,z:8},true)
 command(w,target);assert.equal(follower.target,target.id,'a building cannot steal a clicked enemy')
 command(w,hut);assert.equal(follower.work,hut.id,'a nearby enemy cannot steal a clicked building')
 const secondHut=addBuilding(w,'blue','hut',{x:2,z:8},true)
 command(w,secondHut);assert.equal(follower.work,secondHut.id,'overlapping building selection is exact')
 w.units.reverse();w.buildings.reverse();command(w,hut);assert.equal(follower.work,hut.id)
 w.buildings.reverse()
 const ally=addUnit(w,'blue','warrior',{x:hut.x,z:hut.z})
 command(w,ally);assert.equal(follower.work,hut.id,'ordering through an ally uses building context')
 assert.equal(follower.target,null,'building context cannot also assign a nearby enemy')
 const before=structuredClone(follower)
 command(w,{id:65535,x:hut.x,z:hut.z});assert.deepEqual(follower,before,'removed targets do not select a nearby replacement')
})

test('live target choice follows captured native ownership for both tribes',async()=>{
 const {default:fixture}=await import('./fixtures/command-target.json',{with:{type:'json'}})
 for(const c of fixture.cases.filter(c=>c.category===0)){
  const w=createWorld();w.units=[];w.buildings=[];w.shrines=[];w.trees=[]
  w.terrain.fill(3);w.terrainVersion++;w.manaWorld.gameFlags=32
  const team=c.player?'red':'blue',enemy=c.player?'blue':'red'
  const follower=addUnit(w,team,({2:'brave',3:'warrior',7:'shaman'})[c.selected],{x:-12,z:8})
  const objects={
   30:addUnit(w,enemy,'brave',{x:0,z:8}),
   31:addUnit(w,c.friendly?team:enemy,'warrior',{x:.5,z:8}),
   20:addBuilding(w,c.buildingOwner?'red':'blue','hut',{x:0,z:8},true),
  }
  w.selected=[follower.id];command(w,objects[c.clicked])
  // The enemy-building lifecycle still uses the existing attack adapter; native
  // command 19's complete area dispatch is not certified by this target check.
  assert.equal(c.model===8?follower.work:follower.target,objects[c.resolved].id)
  if(c.model!==19)assert.equal(c.packet[2]>>>16,c.target,'direct object identity is encoded intact')
 }
})
