// Measure the redundant cell reconciliation removed from ordinary fight physics.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import os from 'node:os'
import { createWorld, addUnit, tick, nativePosition } from '../app/model.ts'
import { approachLiveMelee, stepLiveMeleeMotion, syncLivePersonCells } from '../app/live-people.ts'
const fixture = createWorld()
fixture.terrain.fill(3);fixture.terrainVersion++;fixture.units=[];fixture.buildings=[];tick(fixture,1/12)
for(let i=0;i<64;i++){
  const u=addUnit(fixture,'blue','warrior',{x:i%8*3-12,z:Math.floor(i/8)*3-12})
  u.fight={group:1000+i,opponent:0,action:'approach',started:0}
  approachLiveMelee(fixture,u,nativePosition(fixture,{x:u.x+1,z:u.z}),nativePosition(fixture,u),false)
}
function run(eager){
  const w=structuredClone(fixture),start=performance.now()
  for(let turn=0;turn<24;turn++)for(const u of w.units){if(eager)syncLivePersonCells(w);stepLiveMeleeMotion(w,u)}
  return {ms:performance.now()-start,w}
}
const a=run(true),b=run(false);assert.deepEqual(b.w,a.w)
for(let i=0;i<3;i++){run(true);run(false)}
const before=[],after=[]
for(let i=0;i<9;i++){
  const pair=i&1?[run(false),run(true)].reverse():[run(true),run(false)]
  assert.deepEqual(pair[0].w,pair[1].w);before.push(pair[0].ms);after.push(pair[1].ms)
}
const median=a=>a.toSorted((a,b)=>a-b)[4]
const report={workload:'64 retained combat people x 24 physics visits. Compare eager cell reconciliation before each visit with production on-demand state context. Whole resulting worlds are equal. Nine alternating warmed samples; fixture cloning excluded. This isolates removed reconciliation cost, not a previous-release or display FPS comparison.',cpu:os.cpus()[0].model,node:process.version,eager:{medianMs:median(before),samples:before},onDemand:{medianMs:median(after),samples:after}}
writeFileSync('/private/tmp/populous-melee-motion-bench.json',JSON.stringify(report,null,2)+'\n')
console.log(report)
