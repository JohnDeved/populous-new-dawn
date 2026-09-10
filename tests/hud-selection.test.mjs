import test from 'node:test'
import assert from 'node:assert/strict'
import fixture from './fixtures/hud-selection.json' with {type:'json'}
import {selectHudPeople,focusHudPerson} from '../app/hud-selection.ts'
import {createWorld,addUnit,hudPeople,selectFollowers,nativePosition,command,tick} from '../app/model.ts'

test('HUD selection and focus match captured original commands without changing other person fields',()=>{
 for(const c of fixture.selection){
  const people=structuredClone(c.people)
  const result=selectHudPeople(people,c.model,c.point,c.mode,c.nearby)
  assert.deepEqual({people,cues:result.cues},c.expected)
 }
 for(const c of fixture.focus){
  const people=structuredClone(c.people)
  assert.equal(focusHudPerson(people,c.model,c.point,c.previous,c.includeReserved,c.nearby),c.expected)
  assert.deepEqual(people,c.people)
 }
 const people=fixture.focus[0].people
 assert.equal(focusHudPerson(people,0,{x:0,y:0},65535),focusHudPerson(people,0,{x:0,y:0},0),'removed cached identity safely falls back to nearest')
})

test('HUD controls add followers without stealing simulation ownership or replacing marching orders',()=>{
 const w=createWorld();w.units=[];w.buildings=[];w.trees=[];w.shrines=[]
 w.terrain.fill(3);w.terrainVersion++;w.manaWorld.gameFlags=32
 for(let i=0;i<8;i++)addUnit(w,'blue',i===7?'shaman':'brave',{x:i*.7,z:8})
 const before=structuredClone(w.units),point=nativePosition(w,{x:0,z:8})
 selectFollowers(w,2,point,'single');assert.equal(w.selected.length,1)
 selectFollowers(w,2,point,'five');assert.equal(w.selected.length,6)
 selectFollowers(w,0,point,'all');assert.equal(w.selected.length,7)
 selectFollowers(w,7,point,'single');assert.equal(w.selected.length,8)
 assert.deepEqual(w.units,before,'legacy selection must not attach native people')
 command(w,{x:30,z:8});for(let i=0;i<30;i++)tick(w,1/12)
 w.selected=[]
 const moving=structuredClone(w.units),orders=structuredClone(w.buildingOrders),rng=w.randomState
 selectFollowers(w,2,point,'five');assert.equal(w.selected.length,5)
 for(const u of moving){u.native.selectionFlags=(u.native.selectionFlags&~128)|(w.selected.includes(u.id)?128:0);if(w.selected.includes(u.id))u.native.flags3&=~0x10000000}
 assert.deepEqual(w.units,moving);assert.deepEqual(w.buildingOrders,orders);assert.equal(w.randomState,rng)
 const readOnly=structuredClone(w.units)
 focusHudPerson(hudPeople(w),0,point,0)
 assert.deepEqual(w.units,readOnly)
 // Dormant construction records retain flags/priority, but not the active location.
 const u=w.units[0];u.builder={person:u.native};u.native=undefined;u.builder.active=false;u.x=-20
 assert.equal(hudPeople(w)[0].x,nativePosition(w,u).x)
 assert.equal(hudPeople(w)[0].assignment,u.builder.person.assignment)
})
