import assert from 'node:assert/strict'
import test from 'node:test'
import {createWorld,addUnit,command,tick} from '../app/model.ts'
import fixture from './fixtures/formation-phase.json' with {type:'json'}
import manifest from '../decomp/exports.json' with {type:'json'}

function world(count) {
 const w=createWorld();w.units=[];w.buildings=[];w.shrines=[];w.trees=[];w.manaWorld.gameFlags=32
 w.terrain.fill(3);w.terrainVersion++
 for(let i=0;i<count;i++)addUnit(w,'blue','brave',{x:-18+(i%3)*.5,z:8+Math.floor(i/3)*.5})
 w.selected=w.units.map(u=>u.id);command(w,{x:30,z:8})
 return w
}

test('live turn preserves native tribe order, inactive skipping and next-turn formation admission',()=>{
 assert.equal(fixture.executableSha256,manifest.executableSha256)
 for(const c of fixture.cases) {
  const w=world(c.objects.length),events=[]
  // Supply empty controllers, as the native traversal probe does. Counters observe
  // real live person physics; all non-person object phases remain outside this check.
  const formation=(id,tribe)=>{
   let visited=-1
   return {id,tribe,class:c.dead.includes(id)?0:10,members:Array(12).fill(0),
    get count(){if(visited!==w.turn){events.push(['formation',id,c.initial]);visited=w.turn}return 0}}
  }
  w.marching=c.tribes[0].flatMap((_,slot)=>[3,2,1,0].map(tribe=>formation(c.tribes[tribe][slot],tribe)))
  let recruited=false
  w.units.forEach((u,i)=>{
   let counter=c.initial
   Object.defineProperty(u.native,'counter',{configurable:true,get:()=>counter,set:value=>{
    counter=value;events.push(['object',c.objects[i],value])
    if(!recruited){w.marching.unshift(formation(30,0));recruited=true}
   }})
  })
  w.paused=c.paused
  for(const expected of [c.first,c.second]) {
   tick(w,1/12)
   assert.deepEqual(events,expected.filter(([kind,id])=>kind==='formation'||kind==='object'&&c.objects.includes(id)))
   events.length=0
  }
 }
})

test('actual recruited groups wait a turn and then steer before member physics',()=>{
 const w=world(24),visits=[]
 for(let turn=0;turn<70;turn++) {
  const existing=new Set(w.marching.map(g=>g.id))
  // Observe formation movement without replacing the controller or person physics.
  w.marching.unshift=function(g){
   let x=g.x
   Object.defineProperty(g,'x',{enumerable:true,configurable:true,get:()=>x,set:value=>{
    visits.push({id:g.id,turn:w.turn,counters:w.units.filter(u=>g.members.includes(u.id)).map(u=>u.native.counter)})
    x=value
   }})
   return Array.prototype.unshift.call(this,g)
  }
  const counters=new Map(w.units.map(u=>[u.id,u.native.counter]))
  const start=visits.length
  tick(w,1/12)
  for(const visit of visits.slice(start)) {
   assert.ok(existing.has(visit.id),'newly recruited formation must not move in its creation turn')
   const g=w.marching.find(g=>g.id===visit.id)
   assert.ok(g)
   assert.deepEqual(visit.counters,w.units.filter(u=>g.members.includes(u.id)).map(u=>counters.get(u.id)),
    'steering sees preceding-turn counters, before this turn\'s member physics')
  }
 }
 assert.ok(visits.length>20,'real multi-person formations must advance')
 assert.ok(w.marching.length>=2)
})
