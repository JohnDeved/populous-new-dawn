import test from 'node:test'
import assert from 'node:assert/strict'
import fixture from './fixtures/deselection.json' with {type:'json'}
import {deselectPerson,currentPersonOrder} from '../app/person-orders.ts'
import {createWorld,addUnit,command,cancelInteraction,tick} from '../app/model.ts'
import {createLivePerson} from '../app/live-people.ts'
import {advanceGame} from '../app/game-clock.ts'

test('deselection matches native command flags for every selection byte',()=>{
 for(const c of fixture.cases){const p={...c.person};deselectPerson(p);assert.deepEqual(p,c.expected)}
})

function scenario(){
 const w=createWorld();w.units=[];w.buildings=[];w.shrines=[];w.trees=[];w.manaWorld.gameFlags=32
 w.terrain.fill(3);w.terrainVersion++
 for(let i=0;i<6;i++)addUnit(w,'blue','brave',{x:-25+i*.5,z:8})
 w.selected=w.units.map(u=>u.id)
 const p=createLivePerson(w,w.units[0])
 assert.equal(p.state,10,'player selection is not AI reservation state 14')
 assert.equal(p.flags3&128,0);assert.equal(p.selectionFlags&128,128)
 command(w,{x:30,z:8});return w
}

test('cancel targeting first; deselection preserves shared marching orders, routes, RNG and pause',()=>{
 const w=scenario();for(let i=0;i<30;i++)tick(w,1/12)
 const order=currentPersonOrder(w.buildingOrders,w.units[0].native),before=structuredClone(w.units)
 const routes=JSON.stringify(w.motionRoutes),groups=JSON.stringify(w.marching),rng=w.randomState
 w.paused=true;w.mode='blast';cancelInteraction(w)
 assert.equal(w.mode,null);assert.equal(w.selected.length,6);assert.deepEqual(w.units,before)
 cancelInteraction(w)
 assert.deepEqual(w.selected,[]);assert.equal(order.references,6)
 assert.equal(JSON.stringify(w.motionRoutes),routes);assert.equal(JSON.stringify(w.marching),groups);assert.equal(w.randomState,rng)
 for(let i=0;i<w.units.length;i++){
  const expected=before[i];expected.native.selectionFlags=(expected.native.selectionFlags&~129)|1
  expected.native.flags3=(expected.native.flags3&~128)>>>0
  assert.deepEqual(w.units[i],expected)
 }
 w.paused=false;for(let i=0;i<340;i++)tick(w,1/12)
 assert.ok(w.units.every(u=>u.native.state===19&&u.x>25));assert.equal(order.references,0)
})

test('deselection reaches retained work representations once, leaves enemy ownership alone',()=>{
 const w=scenario(),u=w.units[0],p=u.native
 u.entry={person:p};u.builder={person:p}
 const red=addUnit(w,'red','brave',{x:20,z:20});red.native=createLivePerson(w,red)
 red.native.selectionFlags=128;red.native.flags3=128
 cancelInteraction(w)
 assert.equal(p.selectionFlags&129,1,'shared representations must not erase the previous-selection bit')
 assert.equal(red.native.selectionFlags,128);assert.equal(red.native.flags3,128)
 cancelInteraction(w);assert.equal(p.selectionFlags&129,1,'idle input does not submit another deselection command')
})

test('deselected groups retain identical mechanics and poses at 5–240 Hz and irregular frames',()=>{
 const run=schedule=>{
  const w=scenario();for(let i=0;i<30;i++)tick(w,1/12);cancelInteraction(w)
  const clock={animationTime:0,animationFrame:0};let elapsed=0,i=0
  while(elapsed<24-1e-9){const dt=Math.min(schedule[i++%schedule.length],24-elapsed);advanceGame(w,clock,dt);elapsed+=dt}
  return {units:w.units,groups:w.marching,orders:w.buildingOrders,random:w.randomState,footprints:w.footprints.cursor}
 }
 const expected=run([1/60]);assert.ok(expected.units.every(u=>u.native.state===19))
 for(const schedule of [[1/5],[1/30],[1/120],[1/144],[1/240],[.004,.13,.009,.034]])assert.deepEqual(run(schedule),expected)
})
