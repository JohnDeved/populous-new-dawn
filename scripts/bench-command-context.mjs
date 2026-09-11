// Paired complete group-order CPU cost. Excludes rendering and simulation ticks.
import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {writeFile,rm} from 'node:fs/promises'
import {cpus} from 'node:os'
import {createWorld,addUnit,addBuilding,command} from '../app/model.ts'
const baseline=process.argv[2]??'9dbfb2fcfe8454c9537ff8661eb99acb08649f44'
const source=new URL('../app/.command-context-baseline.ts',import.meta.url)
try {
 await writeFile(source,execFileSync('git',['show',baseline+':app/model.ts']))
 const previous=(await import(source.href)).command
 const seed=createWorld();seed.units=[];seed.buildings=[];seed.shrines=[];seed.trees=[]
 seed.terrain.fill(3);seed.terrainVersion++;seed.manaWorld.gameFlags=32
 for(let i=0;i<12;i++)addBuilding(seed,'blue','hut',{x:-30+i*5,z:-18},true)
 for(let i=0;i<200;i++)addUnit(seed,'blue','brave',{x:-10+(i%20)*.5,z:8+Math.floor(i/20)*.5})
 seed.selected=seed.units.map(u=>u.id)
 const worlds=[structuredClone(seed),structuredClone(seed)],invoke=[previous,command],samples=[[],[]]
 const snapshot=w=>({people:w.units.map(u=>({target:u.target,work:u.work,path:u.path,native:u.native})),orders:w.buildingOrders,marching:w.marching,random:w.randomState})
 for(let i=0;i<500;i++){
  const point={x:12+(i%2)*2,z:12}
  for(const mode of i%2?[1,0]:[0,1]){
   const start=performance.now();invoke[mode](worlds[mode],point)
   if(i>=100)samples[mode].push(performance.now()-start)
  }
  assert.ok(worlds.every(w=>w.units.every(u=>u.native?.commandStatus===3)),'all 200 followers must receive a live movement order')
  assert.deepEqual(snapshot(worlds[1]),snapshot(worlds[0]),'optimization must preserve complete person/orders/RNG results')
 }
 const stats=raw=>{const a=raw.toSorted((x,y)=>x-y);return {median:a[a.length/2],p95:a[Math.floor(a.length*.95)]}}
 console.log(JSON.stringify({baseline,cpu:cpus()[0].model,node:process.version,people:200,buildings:12,warmups:100,pairedSamples:400,milliseconds:{before:stats(samples[0]),after:stats(samples[1]),pairedDifference:stats(samples[1].map((value,i)=>value-samples[0][i]))},samples,scope:'Complete group input CPU only; no rendering/GPU/FPS claim. Person records, orders, marching and RNG equal after every paired input.'}))
} finally {await rm(source,{force:true})}
