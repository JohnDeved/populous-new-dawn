import test from 'node:test'
import assert from 'node:assert/strict'
import fixture from './fixtures/marching-formations.json' with {type:'json'}
import arrivals from './fixtures/move-arrival.json' with {type:'json'}
import manifest from '../decomp/exports.json' with {type:'json'}
import {updateMarchingOffsets,joinMarchingFormation,stepMarchingFormation} from '../app/marching-formations.ts'
import {personReachedOrder,stepMovementOrder} from '../app/person-orders.ts'

test('marching geometry, recruitment, cleanup, speed and poses replay complete original calls',()=>{
 assert.equal(fixture.executableSha256,manifest.executableSha256)
 for(const {mode,input,expected} of fixture.cases){
  const c=structuredClone(input),events=[]
  const w={randomState:c.randomState,poseRandom:{randomState:c.poseRandom},people:new Map(c.people.map(p=>[p.id,p]))}
  let search
  if(mode==='geometry')updateMarchingOffsets(c.g)
  else if(mode==='join'){
   const cells=new Map();search=Uint8Array.from(c.search)
   for(const p of c.people){const cell=((p.x>>8)&254)|(p.y&0xfe00),row=cells.get(cell)??[];row.unshift(p);cells.set(cell,row)}
   joinMarchingFormation({search,cellPeople:cell=>cells.get(cell)??[]},c.people[0],c.existing?[c.g]:[],leader=>{
    events.push(['allocate',{x:leader.x,y:leader.y},leader.tribe]);if(c.allocationFail)return
    Object.assign(c.g,{id:100,class:10,model:0,x:leader.x,y:leader.y,heading:0,destinationX:0,destinationY:0,shape:0,speed:0,timer:0,shapeTimer:0,count:0,freeSlot:0,members:Array(12).fill(0),offsets:Array.from({length:12},()=>({x:0,y:0}))});return c.g
   })
  } else for(let i=0;i<c.turns;i++)stepMarchingFormation(w,c.g,{
   remove:()=>events.push(['remove']),
   destination:(p,to)=>{events.push(['destination',p.id,to]);p.turnAngle=to.x;p.turnY=to.y;p.flags2=((p.flags2&~128)|4096)>>>0},
   setAnimation:(p,obj)=>{events.push(['animation',p.id,obj]);p.object=obj;p.draw=12;p.f1=2;p.f2=3},
  })
  assert.deepEqual({g:c.g,people:c.people,randomState:w.randomState,poseRandom:w.poseRandom.randomState,events,...(search?{search:[...search]}:{})},expected,mode)
 }
})

test('native movement completion preserves payload, seam and vehicle boundaries and four-turn cadence',()=>{
 assert.equal(arrivals.executableSha256,manifest.executableSha256)
 for(const c of arrivals.cases){
  const land=new Uint8Array(16384);land[(c.person.goalY>>9)*128+(c.person.goalX>>9)]=c.category
  assert.deepEqual([personReachedOrder(c.person,c.order,()=>c.vehicle),stepMovementOrder(c.person,c.order,land,()=>c.vehicle)],c.expected)
 }
})

test('marching cleanup tolerates a member whose native record was already released',()=>{
 const c=structuredClone(fixture.cases.find(entry=>entry.mode==='controller'&&entry.input.g.count>2).input),
  missing=c.g.members.find(Boolean),
  people=new Map(c.people.filter(person=>person.id!==missing).map(person=>[person.id,person]))
 assert.doesNotThrow(()=>stepMarchingFormation({randomState:c.randomState,poseRandom:{randomState:c.poseRandom},people},c.g,{
  remove:()=>{c.g.class=0},
  destination:(person,to)=>{person.turnAngle=to.x;person.turnY=to.y;person.flags2=((person.flags2&~128)|4096)>>>0},
  setAnimation:()=>{},
 }))
 assert.ok(!c.g.members.includes(missing))
})
