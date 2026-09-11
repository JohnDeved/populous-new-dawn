// Emulate the previous eager collision snapshot beside the current lazy consumer.
import assert from 'node:assert/strict'
import {performance} from 'node:perf_hooks'
import {writeFileSync} from 'node:fs'
import {createWorld,addUnit,command} from '../app/model.ts'
import {collisionWorld} from '../app/live-people.ts'
import {stepLiveMovement,stepLiveMarchingFormations} from '../app/live-movement.ts'
const samples={eager:[],lazy:[]},outcomes={}
for(let trial=0;trial<14;trial++)for(const mode of trial%2?['eager','lazy']:['lazy','eager']){
 const w=createWorld();w.units=[];w.buildings=[];w.shrines=[];w.trees=[];w.manaWorld.gameFlags=32
 w.terrain.fill(3);w.terrainVersion++
 for(let i=0;i<200;i++)addUnit(w,'blue','brave',{x:-35+(i%20)*.25,z:4+Math.floor(i/20)*.25})
 w.selected=w.units.map(u=>u.id);command(w,{x:35,z:4})
 const start=performance.now()
 for(let turn=0;turn<60;turn++){
  w.turn++
  stepLiveMarchingFormations(w)
  for(const u of w.units){if(mode==='eager')void collisionWorld(w).objects;stepLiveMovement(w,u)}
 }
 samples[mode].push((performance.now()-start)/60)
 outcomes[mode]=JSON.stringify({units:w.units,formations:w.marching,orders:w.buildingOrders,random:w.randomState,pose:w.cosmeticRandom,heads:[...w.objectCells.heads],routes:[...w.motionRoutes.records]})
}
assert.equal(outcomes.eager,outcomes.lazy,'exact positions, commands, formations, RNGs, retained cells and routes')
const median=a=>a.slice(4).sort((a,b)=>a-b)[5]
const date=new Date().toISOString().slice(0,10)
const report={date,runtime:process.version,platform:process.platform,people:200,turns:60,medianMsPerTurn:{eager:median(samples.eager),lazy:median(samples.lazy)},samples,limits:'Node CPU microbenchmark of native movement and formation visits on flat terrain. Eager mode explicitly materializes the previous collision snapshot once per person. Excludes renderer, automatic combat scans and world setup; this is not whole-game hardware FPS.'}
writeFileSync(`references/performance/${date}-marching.json`,JSON.stringify(report,null,2)+'\n')
console.log('PASS: identical movement state;',report.medianMsPerTurn)
