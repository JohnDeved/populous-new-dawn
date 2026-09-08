import test from 'node:test'
import assert from 'node:assert/strict'
import fixture from './fixtures/tree-growth.json' with {type:'json'}
import manifest from '../decomp/exports.json' with {type:'json'}
import rules from '../app/original-rules.json' with {type:'json'}
import { stepTreeGrowth, replantDelay, stepReplant, findReplantSite } from '../app/tree-growth.ts'
import { createWorld, tick, distance, nativePosition } from '../app/model.ts'
import { clearLivePath } from '../app/live-pathfinding.ts'

test('tree growth and complete replant searches match native captures',()=>{
  assert.equal(fixture.executableSha256,manifest.executableSha256)
  fixture.growth.forEach((c,i)=>{const t={...c};stepTreeGrowth(t);assert.deepEqual({wood:t.wood,growth:t.growth},fixture.growthExpected[i])})
  fixture.delays.forEach((c,i)=>assert.equal(replantDelay(c.model,c.computer),fixture.delayExpected[i]))
  fixture.cases.forEach((c,i)=>{
    const land={flags:new Uint32Array(16384),categories:new Uint8Array(16384),walkMasks:[new Uint8Array(8192).fill(c.walk)],landFlags:c.landFlags},objects=new Map()
    for(const v of c.cells){land.flags[v.cell]=v.flags;land.categories[v.cell]=v.category;objects.set(v.cell,v.objects)}
    const pool=Uint8Array.from(c.pool),request={...c};let allocated=null,wood=0,growth=0
    const removed=stepReplant(request,()=>{
      allocated=findReplantSite(land,pool,c,i=>objects.get(i)??[])
      if(!allocated||c.allocationFails)return false
      wood=100;growth=rules.sceneryGrowth[c.model];return true
    })
    assert.deepEqual({remaining:request.remaining,removed,allocated,wood,growth,pool:[...pool]},fixture.expected[i])
  })
})

test('depleted timber replants after its full delay and grows on its own phase',()=>{
  const w=createWorld(),b=w.buildings.find(b=>b.team==='blue'&&b.kind==='hut'),u=w.units.find(u=>u.team==='blue'&&u.kind==='brave')
  const tree=w.trees.filter(t=>t.model===1).sort((a,c)=>distance(a,b)-distance(c,b))[0],ids=new Set(w.trees.map(t=>t.id))
  tree.logs=1;clearLivePath(w,u);Object.assign(u,{x:tree.x,z:tree.z,work:b.id,inside:null,tree:tree.id,cargo:0,harvest:{remaining:1}})
  b.progress=0;b.logs=0;tick(w,1/12)
  assert.equal(tree.logs,0);assert.equal(w.replants.length,1);assert.equal(w.replants[0].remaining,4000)
  // Keep this test's sapling available for observing its growth.
  for(const p of w.units){clearLivePath(w,p);p.work=null;p.tree=null;p.harvest=undefined;p.guard=true}
  const saplings=()=>w.trees.filter(t=>!ids.has(t.id)&&t.model===tree.model)
  for(let i=0;i<3999;i++)tick(w,1/12)
  assert.equal(saplings().length,0);assert.equal(w.replants[0].remaining,1)
  tick(w,1/12)
  const sapling=saplings()[0];assert.ok(sapling);assert.equal(sapling.logs,1);assert.equal(w.replants.length,0)
  const point=nativePosition(w,sapling)
  assert.equal(point.x&511,256);assert.equal(point.y&511,256)
  const startingPhase=sapling.counter
  for(let n=1;n<=16;n++){tick(w,1/12);assert.equal(sapling.logs,startingPhase+n>=16?1.02:1)}
  for(let n=0;n<2400;n++)tick(w,1/12)
  assert.equal(sapling.logs,4)
})

test('burning depletion also queues one replant without reviving the old tree',()=>{
  const w=createWorld(),t=w.trees.find(t=>t.model===1)
  t.logs=1;t.burn={remaining:76,started:true,wood:100,scale:100}
  tick(w,1/12);assert.equal(t.logs,0);assert.equal(w.replants.length,1)
  for(let n=0;n<20;n++)tick(w,1/12)
  assert.equal(t.logs,0);assert.equal(w.replants.length,1);assert.equal(w.replants[0].remaining,3980)
  const expired=createWorld(),other=expired.trees.find(t=>t.model===1)
  other.burn={remaining:0,started:true,wood:400,scale:100}
  tick(expired,1/12);assert.equal(other.logs,0);assert.equal(expired.replants.length,0,'expiry removal must not invent a depletion allocation')
})
