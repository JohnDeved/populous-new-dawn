import test from 'node:test'
import assert from 'node:assert/strict'
import fixture from './fixtures/building-workers.json' with {type:'json'}
import manifest from '../decomp/exports.json' with {type:'json'}
import {assignBuilder,pruneBuilders,stepConstructionCrew,BuilderTask} from '../app/building-workers.ts'
import {createWorld,placeBuilding,command,tick,entrance} from '../app/model.ts'
import crewFixture from './fixtures/construction-crew.json' with {type:'json'}
import smokeFixture from './fixtures/repair-smoke.json' with {type:'json'}
import {buildingRepairArea} from '../app/building-shapes.ts'
import {releaseTimberReservation,reserveTimber,stepTimberReservations} from '../app/timber.ts'
import {dispatchConstructionCrew} from '../app/construction-runtime.ts'
import {createLivePerson} from '../app/live-people.ts'
import {random} from '../app/native-math.ts'

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

test('construction dispatch, repair clocks and departure gates match native plan calls',()=>{
  assert.equal(crewFixture.executableSha256,manifest.executableSha256)
  crewFixture.cases.forEach((c,i)=>{
    const plan={...c},workers=structuredClone(c.workers),events=[]
    const removed=stepConstructionCrew(plan,workers,{resume:()=>events.push('resume'),evacuate:w=>events.push('evacuate:'+w.id)})
    if(removed)events.push('remove')
    assert.deepEqual({repairDelay:plan.repairDelay,workers,events,linked:removed?0:42},crewFixture.expected[i])
  })
})

test('scheduled burning plans panic only unlocked builders on building cells',()=>{
  const w=createWorld(),b=w.buildings.find(b=>b.team==='blue'&&b.kind==='hut')
  b.counter=0;b.burn={remaining:110,soundPlaying:false}
  const workers=w.units.filter(u=>u.team==='blue'&&u.kind==='brave').slice(0,3)
  for(const [i,u] of workers.entries()){
    Object.assign(u,{x:i===1?b.x+12:b.x,z:b.z,work:b.id,inside:null,path:[],builder:{task:BuilderTask.Work,busy:0,phase:0,restart:true}})
    u.builder.person=createLivePerson(w,u)
  }
  workers[2].builder.person.flags2|=0x100000
  b.builders=workers.map(u=>u.id)
  const [onBuilding,offBuilding,locked]=workers.map(u=>u.builder.person)
  const cell=p=>((p.y&65535)>>9)*128+((p.x&65535)>>9)
  assert.ok(w.land.buildingIds[cell(onBuilding)]&1023)
  assert.equal(w.land.buildingIds[cell(offBuilding)]&1023,0)
  const expected={randomState:w.randomState}
  random(expected);const angle=random(expected)&2047
  dispatchConstructionCrew(w,b,workers)
  assert.deepEqual([onBuilding.state,onBuilding.timer,onBuilding.turnAngle],[26,64,angle])
  assert.equal(w.randomState,expected.randomState)
  assert.equal(offBuilding.state,10)
  assert.equal(locked.state,10)
  assert.ok(workers.every(u=>u.work===null&&!u.builder))
})

test('repair smoke footprint and terrain refresh match native cell traversal',()=>{
  assert.equal(smokeFixture.executableSha256,manifest.executableSha256)
  smokeFixture.cases.forEach((c,i)=>{
    const a=buildingRepairArea(c.pose),cells=new Set(a.cells)
    const lifetimes=c.records.map(s=>s.model===76&&s.lifetime>0&&cells.has(s.cell)?16:s.lifetime)
    assert.deepEqual({lifetimes,refresh:[{center:a.center,radius:a.radius,texture:1}]},smokeFixture.expected[i])
  })
})

test('two live builders dispatch one hauler on the original sixteen-turn phase',()=>{
  const w=createWorld(),b=w.buildings.find(b=>b.team==='blue'&&b.kind==='hut')
  b.progress=0;b.logs=0;b.counter=0;w.manaWorld.gameFlags=32
  const workers=w.units.filter(u=>u.team==='blue'&&u.kind==='brave').slice(0,2)
  for(const u of workers)Object.assign(u,{...entrance(w,b),work:b.id,inside:null,path:[],cargo:0,tree:null,builder:{task:BuilderTask.Work,busy:0,phase:0,restart:true}})
  for(let turn=1;turn<16;turn++){
    tick(w,1/12)
    assert.ok(workers.every(u=>u.builder.task===BuilderTask.Work&&u.tree===null))
    assert.equal(b.progress,0)
  }
  tick(w,1/12)
  assert.equal(workers.filter(u=>u.builder.task===BuilderTask.Fetch).length,1)
  for(let turn=0;turn<1200&&b.progress<1;turn++){
    tick(w,1/12)
    assert.ok(workers.filter(u=>u.builder?.task===BuilderTask.Fetch).length<=1)
  }
  assert.equal(b.progress,1,'scheduled hauling connects to completed construction')
  assert.ok(workers.every(u=>u.builder&&u.work===b.id),'delivery leaves the original departure gate active')
  for(let turn=0;turn<600&&workers.some(u=>u.builder);turn++)tick(w,1/12)
  assert.ok(workers.every(u=>!u.builder&&u.work===null),'departure releases task ownership')
})
test('later construction haulers skip timber reserved by an earlier search',()=>{
  const w=createWorld(),b=w.buildings.find(b=>b.team==='blue'&&b.kind==='hut')
  b.progress=0;b.logs=0;b.counter=0;w.manaWorld.gameFlags=32
  for(const tree of w.trees)tree.logs=1
  const workers=w.units.filter(u=>u.team==='blue'&&u.kind==='brave').slice(0,4)
  for(const u of workers)Object.assign(u,{...entrance(w,b),work:b.id,inside:null,path:[],cargo:0,tree:null,builder:{task:BuilderTask.Work,busy:0,phase:0,restart:true}})
  for(let turn=0;turn<33;turn++)tick(w,1/12)
  const fetchers=workers.filter(u=>u.builder?.task===BuilderTask.Fetch)
  assert.equal(fetchers.length,2)
  assert.equal(fetchers[0].tree,fetchers[1].tree,'same-turn native searches are not atomic')
  const first=fetchers[0].tree,tree=w.trees.find(tree=>tree.id===first)
  assert.deepEqual([tree.reservations,tree.flags4&0x100000,tree.reservationTimer],[1,0x100000,64])
  workers[2].builder={task:BuilderTask.Fetch,busy:0,phase:0,restart:true}
  for(let turn=0;turn<40&&!workers[2].tree;turn++)tick(w,1/12)
  assert.ok(workers[2].tree)
  assert.notEqual(workers[2].tree,first)
})
test('timber reservations reopen, drain and release on native transitions',()=>{
  const tree={wood:100}
  reserveTimber(tree,tree.wood)
  assert.deepEqual(tree,{wood:100,flags4:0x100000,reservations:1,reservationTimer:64})
  for(let turn=0;turn<63;turn++)stepTimberReservations(tree)
  assert.deepEqual(tree,{wood:100,flags4:0,reservations:1,reservationTimer:1})
  stepTimberReservations(tree);stepTimberReservations(tree)
  assert.deepEqual(tree,{wood:100,flags4:0,reservations:0,reservationTimer:0})
  reserveTimber(tree,tree.wood);releaseTimberReservation(tree)
  assert.deepEqual(tree,{wood:100,flags4:0,reservations:0,reservationTimer:64})
})
test('live plan capacities, duplicate orders and replacement workers share registration',()=>{
  for(const [kind,limit] of [['hut',6],['camp',16]]){
    const w=createWorld();w.unlockedCamp=true
    const original=w.units.find(u=>u.team==='blue'&&u.kind==='brave')
    const people=Array.from({length:limit+2},()=>({...original,id:w.nextId++,path:[],work:null,inside:null}))
    w.units.push(...people);w.selected=people.map(u=>u.id)
    assert.ok(placeBuilding(w,kind,{x:-2,z:32}))
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
