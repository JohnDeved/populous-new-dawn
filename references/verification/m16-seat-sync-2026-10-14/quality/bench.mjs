import { readFileSync } from 'node:fs'
import { deserialize } from 'node:v8'
import { gunzipSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import { performance } from 'node:perf_hooks'
import { execFileSync } from 'node:child_process'
import assert from 'node:assert/strict'
import { syncLiveVehiclePassengers as candidate } from '../../app/live-vehicles.ts'
const { syncLiveVehiclePassengers:baseline }=await import('/workspace/scratch/69fd8163d94e/m16-seat-quality-base/app/live-vehicles.ts')
const base='a550ac898d15ce5a5c58947c0cd0f8cbabc0cd06',sha=b=>createHash('sha256').update(b).digest('hex'),source=execFileSync('git',['show',`${base}:app/live-vehicles.ts`])
assert.equal(sha(source),sha(readFileSync('/workspace/scratch/69fd8163d94e/m16-seat-quality-base/app/live-vehicles.ts')))
const path='references/fixtures/m16-seat-sync/before-unload.v8.gz',bytes=readFileSync(path),inputHash=sha(bytes),rounds=[]
function run(sync){
 // Fresh immutable gzip input and fresh deserialization for every sample.
 const w=deserialize(gunzipSync(Buffer.from(bytes))),vehicles=[1337,1368,1419].map(id=>w.vehicles.find(v=>v.id===id)),start=performance.now()
 for(let i=0;i<5000;i++)for(const v of vehicles){v.x=(v.x+16)&65535;sync(w,v)}
 return performance.now()-start
}
for(let i=0;i<2;i++){run(baseline);run(candidate)}
for(let i=0;i<10;i++){
 const sample={};for(const name of i%2?['candidate','baseline']:['baseline','candidate'])sample[name]=run(name==='candidate'?candidate:baseline)
 rounds.push(sample)
}
assert.equal(sha(readFileSync(path)),inputHash);assert.equal(sha(bytes),inputHash)
const median=values=>{values.sort((a,b)=>a-b);return(values[4]+values[5])/2},b=median(rounds.map(r=>r.baseline)),c=median(rounds.map(r=>r.candidate))
console.log(JSON.stringify({scope:'Synthetic seat-sync microbenchmark only: 15000 calls/sample, three historical occupied Balloons with supplied repeated craft offsets; no gameplay/FPS claim',base,head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),fixture:path,inputSha256:inputHash,baselineLiveVehiclesSha256:sha(source),scriptSha256:sha(readFileSync('work/m16-seat-sync/bench.mjs')),rounds,medianMs:{baseline:b,candidate:c},ratio:c/b},null,2))
