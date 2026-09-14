// Complete turn CPU comparison; corrected scheduling intentionally changes trajectories.
import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {writeFile,rm} from 'node:fs/promises'
import {cpus} from 'node:os'
import {createWorld,addUnit,command,tick} from '../app/model.ts'
const baseline=process.argv[2]??'34aef667bd6541d4910c61f77c7943740bc341a9'
const source=new URL('../app/.formation-phase-baseline.ts',import.meta.url)
const movement=new URL('../app/.formation-movement-baseline.ts',import.meta.url)
const turn=new URL('../app/.formation-world-turn-baseline.ts',import.meta.url)
const show=path=>{try{return execFileSync('git',['show',`${baseline}:app/${path}`],{encoding:'utf8',stdio:['ignore','pipe','ignore']})}catch{return null}}
try {
 const model=show('model.ts'),previousMovement=show('live-movement.ts'),previousTurn=show('world-turn.ts')
 assert.ok(model&&previousMovement,'baseline must contain model and movement modules')
 await writeFile(movement,previousMovement)
 let previousModel=model
 if(previousTurn){
  assert.ok(previousModel.includes("'./world-turn.ts'"),'baseline model must import its world turn')
  assert.ok(previousTurn.includes("'./live-movement.ts'"),'baseline world turn must import live movement')
  await writeFile(turn,previousTurn.replace("'./live-movement.ts'","'./.formation-movement-baseline.ts'"))
  previousModel=previousModel.replace("'./world-turn.ts'","'./.formation-world-turn-baseline.ts'")
 }else{
  assert.ok(previousModel.includes("'./live-movement.ts'"),'baseline model must contain live movement import')
  previousModel=previousModel.replace("'./live-movement.ts'","'./.formation-movement-baseline.ts'")
 }
 await writeFile(source,previousModel)
 const previous=(await import(source.href)).tick
 const seed=createWorld();seed.units=[];seed.buildings=[];seed.shrines=[];seed.trees=[];seed.manaWorld.gameFlags=32
 seed.terrain.fill(3);seed.terrainVersion++
 for(let i=0;i<200;i++)addUnit(seed,'blue','brave',{x:-35+(i%20)*.25,z:4+Math.floor(i/20)*.25})
 seed.selected=seed.units.map(u=>u.id);command(seed,{x:35,z:4})
 const samples=[[],[]],peaks=[[],[]],invoke=[previous,tick]
 for(let trial=0;trial<28;trial++)for(const mode of trial%2?[1,0]:[0,1]) {
  const w=structuredClone(seed);let total=0,peak=0
  for(let turn=0;turn<120;turn++) {
   const start=performance.now();invoke[mode](w,1/12);total+=performance.now()-start
   peak=Math.max(peak,w.marching.length)
  }
  assert.equal(w.turn,120);assert.equal(w.units.length,200);assert.ok(peak>=10,'measured turns must contain real marching formations')
  if(trial>=8){samples[mode].push(total/120);peaks[mode].push(peak)}
 }
 const stats=raw=>{const a=raw.toSorted((a,b)=>a-b);return {median:a[a.length/2],p95:a[Math.floor(a.length*.95)]}}
 console.log(JSON.stringify({date:new Date().toISOString(),baseline,cpu:cpus()[0].model,node:process.version,people:200,turns:120,warmups:8,pairedSamples:20,millisecondsPerTurn:{before:stats(samples[0]),after:stats(samples[1]),pairedDifference:stats(samples[1].map((v,i)=>v-samples[0][i]))},samples,peaks,scope:'Complete simulation turn CPU on flat ground, including world processors and automatic combat scans. Baseline loads previous model and movement modules; unchanged dependencies shared. No renderer, GPU or cross-hardware FPS claim. Trajectories intentionally differ with corrected scheduling; native phase traces and separate 5–240 Hz replay establish correctness.'}))
} finally {await rm(source,{force:true});await rm(movement,{force:true});await rm(turn,{force:true})}
