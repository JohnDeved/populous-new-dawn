// Compare lazy context creation with the former per-person world reconciliation.
import assert from 'node:assert/strict'
import {performance} from 'node:perf_hooks'
import {writeFileSync} from 'node:fs'
import {createWorld,addUnit} from '../app/model.ts'
import {createLivePerson,registerLivePerson,changeLivePersonState,syncLivePersonCells} from '../app/live-people.ts'
const samples={eager:[],lazy:[]},outcomes={}
for(let trial=0;trial<16;trial++)for(const mode of trial%2?['eager','lazy']:['lazy','eager']){
 const w=createWorld();w.units=[];w.buildings=[];w.shrines=[];w.trees=[]
 for(let i=0;i<200;i++){
  const u=addUnit(w,'blue','brave',{x:(i%20)*2-20,z:Math.floor(i/20)*2})
  u.native=createLivePerson(w,u);registerLivePerson(w,u.native)
 }
 const start=performance.now()
 for(const u of w.units){if(mode==='eager')syncLivePersonCells(w);changeLivePersonState(w,u,19)}
 samples[mode].push(performance.now()-start)
 outcomes[mode]=JSON.stringify({random:w.randomState,people:w.units,heads:[...w.objectCells.heads]})
 assert.equal(w.objectCells.objects.size,200)
}
assert.equal(outcomes.eager,outcomes.lazy,'same person fields, RNG and retained cell order')
const median=a=>a.slice(4).sort((a,b)=>a-b)[6]
const report={date:'2026-09-10',runtime:process.version,platform:process.platform,people:200,medianMs:{eager:median(samples.eager),lazy:median(samples.lazy)},samples,limits:'Node CPU microbenchmark of 200 state-19 initializations, excluding setup. Eager alternative explicitly performs the prior full world reconciliation per person. This does not measure browser frame rate or whole-game hardware performance.'}
writeFileSync('references/performance/2026-09-10-resting.json',JSON.stringify(report,null,2)+'\n')
console.log('PASS: identical state and cell lists;',report.medianMs)
