import assert from 'node:assert/strict'
import {cpus} from 'node:os'
import {writeFileSync} from 'node:fs'
import {createWorld,addUnit,command,tick} from '../app/model.ts'
const setup=()=>{
 const w=createWorld();w.units=[];w.buildings=[];w.shrines=[];w.trees=[];w.terrain.fill(3);w.terrainVersion++;w.manaWorld.gameFlags=32
 for(let i=0;i<200;i++)addUnit(w,'blue','brave',{x:-25+i%8*.5,z:8+Math.floor(i/8)*.5})
 w.selected=w.units.map(u=>u.id);command(w,{x:-4,z:8},{ctrlKey:true});return w
}
const samples=[]
for(let i=0;i<70;i++){
 const w=setup(),start=performance.now();command(w,{x:20,z:24})
 const elapsed=performance.now()-start
 assert.equal(w.buildingOrders.active,2)
 assert.ok(w.units.every(u=>u.native.commands.filter(Boolean).length===2))
 if(i>=20)samples.push(elapsed)
}
const w=setup();command(w,{x:20,z:24});const turns=[]
for(let i=0;i<600;i++){const start=performance.now();tick(w,1/12);turns.push(performance.now()-start)}
assert.equal(w.buildingOrders.active,0);assert.equal(w.motionRoutes.active,0)
const stats=a=>{const s=a.toSorted((a,b)=>a-b);return {median:s[Math.floor(s.length/2)],p95:s[Math.floor(s.length*.95)],max:s.at(-1)}}
const report={date:new Date().toISOString(),cpu:cpus()[0].model,node:process.version,people:200,warmups:20,samples:50,
 milliseconds:{append:stats(samples),simulationTurn:stats(turns)},raw:{append:samples,simulationTurn:turns},
 scope:'CPU only: append a second shared ground order to 200 already moving people, including native current-order restart and route planning; separately time 600 complete turns to settled arrival. Existing order pool, shared route cache and marching controller reused. No per-render waypoint processing or second queue. This is added functionality, not an equivalent before/after speedup or a GPU/FPS benchmark.'}
writeFileSync(new URL('../references/performance/2026-09-11-ground-waypoints.json',import.meta.url),JSON.stringify(report)+'\n')
console.log(JSON.stringify({...report,raw:undefined}))
