import test from 'node:test'
import assert from 'node:assert/strict'
import fixture from './fixtures/drag-selection.json' with {type:'json'}
import {dragEndpoint,dragCommand,dragCommandCorners,dragCellBounds,unwrapDragCorners,inDragSelection,dragMoved} from '../app/drag-selection.ts'
import {createWorld,addUnit,selectArea,browserPosition} from '../app/model.ts'
import {createLivePerson} from '../app/live-people.ts'

test('world drag geometry matches captured native seams, camera bearings, clamps and degenerate drags',()=>{
 const point=([x,y])=>({x,y}),array=({x,y})=>[x,y]
 for(const c of fixture.cases){
  const start=point(c.start),end=dragEndpoint(start,point(c.end),c.camera)
  const command=dragCommand(start,end,c.camera)>>>0,corners=dragCommandCorners(start,command),wide=unwrapDragCorners(corners)
  assert.deepEqual({endpoint:array(end),command,corners:corners.map(array),bounds:dragCellBounds(corners,(command&1023)*2),unwrapped:wide.map(array),inside:c.queries.map(p=>inDragSelection(point(p),wide))},c.expected)
 }
 for(const c of fixture.transitions)assert.equal(dragMoved(point(c.start),point(c.end)),c.expected)
})

test('live drag selection matches native flags and group voices without changing simulation ownership',()=>{
 for(const c of fixture.groups){
  const w=createWorld();w.units=[];w.selected=[]
  for(const p of c.people){
   const u=addUnit(w,'blue',p.model===7?'shaman':p.model===3?'warrior':'brave',browserPosition(p))
   u.native=createLivePerson(w,u);Object.assign(u.native,p,{state:19})
   if(p.selectionFlags&128)w.selected.push(u.id)
  }
  const before=structuredClone(w.units),rng=w.randomState
  selectArea(w,{x:c.start[0],y:c.start[1]},c.command,c.extend)
  assert.deepEqual({people:w.units.map(u=>({flags3:u.native.flags3,selectionFlags:u.native.selectionFlags})),voices:w.sounds.map(s=>s.cue)},c.expected)
  before.forEach((u,i)=>Object.assign(u.native,c.expected.people[i]))
  assert.deepEqual(w.units,before);assert.equal(w.randomState,rng)
 }
})
