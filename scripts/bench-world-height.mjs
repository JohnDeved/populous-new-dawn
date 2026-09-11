// Compare 200 live position/height queries; terrain correctness is checked separately.
import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {writeFile,rm} from 'node:fs/promises'
import {cpus} from 'node:os'
import {createWorld,nativePosition} from '../app/model.ts'
import {terrainPointHeight} from '../app/native-terrain.ts'
const baseline=process.argv[2]??'f7a5dead6527d1143939a83929e32d4deb4f9a04'
const source=new URL('../app/.world-height-baseline.ts',import.meta.url)
try {
 await writeFile(source,execFileSync('git',['show',baseline+':app/model.ts']))
 const previous=(await import(source.href)).nativePosition,w=createWorld()
 nativePosition(w,{x:0,z:0}) // Synchronize compatibility edits before measuring steady queries.
 const points=Array.from({length:200},(_,i)=>i<100?{x:(i%10)*4-20,z:Math.floor(i/10)*6-30}:{x:(i*71%256)-128,z:(i*43%256)-128})
 for(const point of points){const p=nativePosition(w,point);assert.equal(p.h,terrainPointHeight(w.land,p))}
 const samples=[[],[]],invoke=[previous,nativePosition];let checksum=0
 for(let trial=0;trial<100;trial++)for(const mode of trial%2?[1,0]:[0,1]) {
  const start=performance.now()
  for(let repeat=0;repeat<100;repeat++)for(const point of points)checksum+=invoke[mode](w,point).h
  if(trial>=20)samples[mode].push((performance.now()-start)/100)
 }
 const stats=raw=>{const a=raw.toSorted((a,b)=>a-b);return {median:a[a.length/2],p95:a[Math.floor(a.length*.95)]}}
 console.log(JSON.stringify({date:new Date().toISOString(),baseline,cpu:cpus()[0].model,node:process.version,queries:200,repeatsPerSample:100,warmups:20,pairedSamples:80,milliseconds:{before:stats(samples[0]),after:stats(samples[1])},samples,checksum,scope:'Steady-state live position plus terrain-height CPU queries, half in the opening crop and half across the world. Terrain synchronization performed before timing. Previous crop-clamped heights are intentionally corrected; no equivalence or GPU/FPS claim. No larger grid, copies or renderer passes introduced.'}))
} finally {await rm(source,{force:true})}
