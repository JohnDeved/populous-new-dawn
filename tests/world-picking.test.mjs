import test from 'node:test'
import assert from 'node:assert/strict'
import {personInCompletedTower} from '../app/person-selection.ts'
import fixture from './fixtures/world-picking.json' with {type:'json'}
import {pickQueuedObjects, roundPixel, personHitBounds, modelHitBounds, inHitBounds} from '../app/world-picking.ts'

test('mixed picking follows captured native painter ownership and pixel edges', () => {
  for (const c of fixture.cases)
    assert.deepEqual(pickQueuedObjects(c.commands, c.point), c.expected)
  for (const c of fixture.rectangles) {
    const bounds = personHitBounds(c.point,c.frame,c.bucket,c.flags,c.view,c.scaled)
    assert.deepEqual(inHitBounds(c.point,bounds) ? bounds : null,c.expected)
  }
  for (const c of fixture.occupants) assert.equal(!personInCompletedTower(c.person,c.building),c.expected)
  for (const c of fixture.boxes) assert.deepEqual(modelHitBounds(c.points),c.expected)
  assert.deepEqual([-2.5,-1.5,-.5,.5,1.5,2.5].map(roundPixel),[-2,-2,0,0,2,2])
  const bounds = {x:0,y:0,width:300,height:300}
  const face = id => ({kind:'model',id,points:[{x:0,y:0},{x:300,y:0},{x:0,y:300}]})
  const point = {x:100,y:100}
  // A consumed model cannot reclaim the pointer with its later faces.
  assert.deepEqual(pickQueuedObjects([
    {kind:'bounds',id:1,bounds},face(1),
    {kind:'person',id:2,bounds,eligible:true},face(1),
  ],point),{kind:'person',id:2})
  // Deliberate modern correction: four overlapping candidates do not overflow.
  assert.deepEqual(pickQueuedObjects([
    ...[1,2,3,4].map(id=>({kind:'bounds',id,bounds})),face(1),
  ],point),{kind:'model',id:1})
})

test('live pointer eligibility uses the active record and recorded cell building',async()=>{
  const {createWorld,addUnit,canPickUnit}=await import('../app/model.ts')
  const w=createWorld();w.units=[]
  const u=addUnit(w,'blue','brave',{x:0,z:0})
  for(const c of fixture.occupants){
    u.native={state:19,x:0,y:0,flags2:c.person.flags2,renderFlags:128}
    u.inside=100
    w.land.flags[0]=c.building?512:0;w.land.buildingIds[0]=100|0x4000
    w.buildings=c.building?[{id:100,kind:({1:'hut',4:'tower',5:'temple'})[c.building.model],level:1,progress:c.building.state===2?1:.5}]:[]
    assert.equal(canPickUnit(w,u),c.expected)
    u.native.renderFlags=0;assert.equal(canPickUnit(w,u),false)
  }
  u.native=undefined;assert.equal(canPickUnit(w,u),false)
  u.inside=null;assert.equal(canPickUnit(w,u),true)
})
