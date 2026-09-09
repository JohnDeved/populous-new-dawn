import test from 'node:test'
import assert from 'node:assert/strict'
import fixture from './fixtures/building-workers.json' with {type:'json'}
import manifest from '../decomp/exports.json' with {type:'json'}
import {assignBuilder,pruneBuilders} from '../app/building-workers.ts'
import {createWorld,placeBuilding,command,tick} from '../app/model.ts'

test('builder admission and stale-slot pruning match complete native calls',()=>{
  assert.equal(fixture.executableSha256,manifest.executableSha256)
  fixture.cases.forEach((c,i)=>{
    const slots=[...c.slots],accepted=assignBuilder(slots,c.id)
    assert.deepEqual({slots,accepted,count:slots.filter(Boolean).length},fixture.expected[i])
  })
  fixture.pruning.forEach((c,i)=>{
    const slots=[...c.slots]
    pruneBuilders(slots,id=>{const p=c.records.find(p=>p.id===id);return !!p&&!(p.flags&1)&&p.cls!==0&&p.hp>0&&p.state===10&&p.owner===c.owner&&p.plan===42})
    assert.deepEqual({slots,count:slots.filter(Boolean).length},fixture.pruned[i])
  })
})
test('live plan capacities, duplicate orders and replacement workers share registration',()=>{
  for(const [kind,limit] of [['hut',6],['camp',16]]){
    const w=createWorld();w.unlockedCamp=true
    const original=w.units.find(u=>u.team==='blue'&&u.kind==='brave')
    const people=Array.from({length:limit+2},()=>({...original,id:w.nextId++,path:[],work:null,inside:null}))
    w.units.push(...people);w.selected=people.map(u=>u.id)
    assert.ok(placeBuilding(w,kind,{x:4,z:32}))
    const b=w.buildings.at(-1)
    assert.equal(b.builders.filter(Boolean).length,limit)
    assert.equal(people.filter(u=>u.work===b.id).length,limit)
    const assigned=[...b.builders],spare=people.find(u=>u.work!==b.id)
    const references=()=>Array.from({length:400},(_,i)=>new DataView(w.motionRoutes.records.buffer).getInt16((i+1)*109,true))
    const before=references()
    w.selected=[spare.id];command(w,b)
    assert.deepEqual(references(),before,'rejected workers must not allocate an unowned route')
    w.selected=[assigned[0],spare.id];command(w,b)
    assert.deepEqual(b.builders,assigned,'duplicate registration cannot consume another slot')
    assert.equal(spare.work,null,'full plans reject surplus workers')
    const removed=people.find(u=>u.id===assigned[1]);removed.hp=0
    w.selected=[spare.id];command(w,b)
    assert.equal(b.builders[1],spare.id,'the first freed slot is reused')
    assert.equal(spare.work,b.id)
    w.selected=[assigned[0]];command(w,{x:original.x+2,z:original.z})
    tick(w,1/12)
    assert.equal(b.builders[0],0,'redirected workers no longer occupy a plan slot')
    assert.equal(b.builders.filter(Boolean).length,limit-1)
  }
})
