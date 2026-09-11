// Cost of 200 simultaneous recovery requests, including actual person physics.
import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {writeFile,rm} from 'node:fs/promises'
import {cpus} from 'node:os'
import {createWorld,addUnit,addBuilding,command,tick} from '../app/model.ts'
import {stepLivePhysics} from '../app/live-people.ts'
const baseline=process.argv[2]??'b9802a93766c08e979a8e7db40e6fd9a372a8b05'
const source=new URL('../app/.route-recovery-baseline.ts',import.meta.url)
try {
 await writeFile(source,execFileSync('git',['show',baseline+':app/live-people.ts']))
 const previous=(await import(source.href)).stepLivePhysics
 const seed=createWorld();seed.units=[];seed.buildings=[];seed.shrines=[];seed.trees=[];seed.manaWorld.gameFlags=32
 seed.terrain.fill(3);seed.terrainVersion++
 for(let i=0;i<200;i++)addUnit(seed,'blue','brave',{x:-20+(i%20)*.25,z:8+Math.floor(i/20)*.25})
 seed.selected=seed.units.map(u=>u.id);command(seed,{x:30,z:8})
 addBuilding(seed,'blue','hut',{x:0,z:8},true);tick(seed,1/12)
 for(const u of seed.units)u.native.flags2=((u.native.flags2|0x80000000)&~128)>>>0
 const samples=[[],[]],invoke=[previous,stepLivePhysics],searches=[]
 for(let trial=0;trial<80;trial++)for(const mode of trial%2?[1,0]:[0,1]) {
  const w=structuredClone(seed),orders=JSON.stringify(w.buildingOrders)
  w.pathfinding.solver.attempts=0
  const start=performance.now()
  for(const u of w.units)invoke[mode](w,u,u.native)
  const elapsed=performance.now()-start
  assert.equal(JSON.stringify(w.buildingOrders),orders,'recovery preserves all orders and references')
  assert.ok(w.units.every(u=>mode?u.native.motionGroup>0:!u.native.motionGroup),'new planner retains paths; baseline discards them')
  if(trial>=20){samples[mode].push(elapsed);if(mode)searches.push(w.pathfinding.solver.attempts)}
 }
 const stats=raw=>{const a=raw.toSorted((a,b)=>a-b);return {median:a[a.length/2],p95:a[Math.floor(a.length*.95)]}}
 console.log(JSON.stringify({date:new Date().toISOString(),baseline,cpu:cpus()[0].model,node:process.version,people:200,warmups:20,pairedSamples:60,milliseconds:{before:stats(samples[0]),after:stats(samples[1])},samples,searches,scope:'One forced recovery physics visit for every person, with a hut added after order acceptance. Includes planning and native route reuse; excludes other turn work, rendering and GPU. Baseline discards routes incorrectly, so this measures the cost of corrected behavior, not an equivalent-work speedup. Shared orders must remain identical.'}))
} finally {await rm(source,{force:true})}
