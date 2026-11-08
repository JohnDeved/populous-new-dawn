import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,writeFileSync,readFileSync,rmSync,symlinkSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import run,{ordinaryPointerCalibrationFiles} from '../scripts/browser-performance/ordinary-pointer-calibration.mjs'
import {ordinaryPointerCalibrationSelection as select,ordinaryPointerCalibrationPolicy as P,
  summarizeOrdinaryPointerSession as summarize,ordinaryPointerCalibrationEnvelope as envelope,
  ordinaryPointerHeldout as heldout} from '../scripts/browser-performance/ordinary-pointer-calibration-policy.mjs'

function result(spacing=70){
 const all=[],recent=[]
 for(let i=0;i<54;i++){
  const serial=i*7+7,timestamp=serial*spacing/7
  while(recent.length<serial)recent.push({timestampMs:(recent.length+1)*spacing/7,state:'paused'})
  recent[serial-1].pointerBreakdown={terrainPickCalls:1,objectPickCalls:2,terrainPickMs:1,
   ordinaryTerrain:{version:1,visitedTriangles:29376,triangleScanMs:1},interaction:{pointerMoved:true,viewChanged:false}}
  all.push({sequence:i+1,phase:i<6?'warmup':'measured',point:[[903,400],[903,403],[900,403],[897,400],[900,397],[900,400]][i%6],
   anchorSerial:serial-1,serial,callbackRafTimestampMs:timestamp,timestampMs:timestamp-10,observedCompletedAtMs:timestamp,
   terrainCalls:1,objectCalls:2,ordinaryTriangles:29376,resultWitness:{route:'world',picked:null,cell:23712,inspectionTarget:null,hoveredObject:null}})
 }
 return {outcome:{status:'completed',value:{status:'decoded-consistent-unqualified',evidence:{status:'records-consistent-unqualified',comparisonEligible:false,
  warmup:all.slice(0,6),measured:all.slice(6),observedFrames:378,elapsedMs:54*spacing,geometrySha256:'a'.repeat(64)}}},
  packet:{rawMode:true,recent},comparisonEligible:false,cleanupConfirmed:true,observerCleanupConfirmed:true,operationSettled:true,waitCleanupFailed:false}
}
function options(change=()=>{}){
 const output=mkdtempSync(join(tmpdir(),'pnd-calibration-')),owners=[],receipt={};let sessions=0
 writeFileSync(join(output,'supplied-browser'),'inert fixture')
 const o={output,receipt,browserIdentity:{path:join(output,'supplied-browser'),sha256:createHash('sha256').update('inert fixture').digest('hex'),version:'supplied'},source:{commit:'a'.repeat(40)},expectedRevision:'a'.repeat(40),dist:'supplied',url:'supplied',launch:{chromiumSandbox:true},
  chromium:{async launch(config){assert.equal(config.chromiumSandbox,true);const owner={closed:0,version:()=> 'pinned',async close(){this.closed++}};owners.push(owner);return owner}},
  async runSession({browser,output,receipt}){const index=sessions++,raw=result();change({index,raw,receipt,output})
   Object.assign(receipt,{status:'passed',readerAdmission:'admitted',operationSettled:true,contextCleanup:{confirmed:true},browserCleanup:{confirmed:true},
    preparation:{provenance:{dependencies:{sha256:'dep'},bundle:{sha256:'bundle'},readerSource:{profile:'p'},readerProvenance:{sha256:'reader'}}}})
   writeFileSync(join(output,'ordinary-pointer-raw.json'),JSON.stringify(raw));await browser.close()
  }}
 return {o,owners,get sessions(){return sessions},cleanup(){rmSync(output,{recursive:true,force:true})}}
}
test('selection requires dispatch on exact trusted main, never PR or stale SHA',()=>{
 const sha='a'.repeat(40),e={inputs:{expected_sha:sha}}
 assert.equal(select(e,'workflow_dispatch','refs/heads/main',sha,'ordinary-pointer-calibration'),true)
 for(const args of [[e,'pull_request','refs/heads/main',sha],[e,'workflow_dispatch','refs/heads/other',sha],[e,'workflow_dispatch','refs/heads/main','b'.repeat(40)]])
  assert.equal(select(...args,'ordinary-pointer-calibration'),false)
})
test('CPU nearest rank remains separate from scheduling median and all48 contribute',()=>{
 const r=result();r.outcome.value.evidence.measured.forEach((v,i)=>{r.packet.recent[v.serial-1].pointerBreakdown.ordinaryTerrain.triangleScanMs=i+1})
 const s=summarize(r);assert.equal(s.cpu.scanP50,24);assert.equal(s.cpu.scanP95,46);assert.equal(s.samples,48)
 assert.equal(s.schedule.delayP50,10);assert.equal(s.schedule.gapP50,60);assert.equal(s.cycles.length,8)
})
test('missing/tampered work, callback identity, metric or cleanup refuses summary',()=>{
 for(const mutate of [r=>r.cleanupConfirmed=false,r=>r.packet.rawMode=false,r=>r.outcome.value.evidence.measured.pop(),
  r=>r.packet.recent[48].timestampMs++,r=>r.packet.recent[48].pointerBreakdown.terrainPickCalls=0,
  r=>r.packet.recent[48].pointerBreakdown.ordinaryTerrain.triangleScanMs=NaN]){const r=result();mutate(r);assert.throws(()=>summarize(r))}
})
test('three calibration summaries freeze explicit floors and reject excessive spread',()=>{
 const s=summarize(result()),e=envelope([s,s,s]);assert.equal(e.status,'stable');assert.equal(e.bounds.delayP50.delta,2.5)
 assert.equal(e.bounds.gapP50.delta,50)
 const changed=structuredClone(s);changed.schedule.gapP50=1000;assert.equal(envelope([s,changed,s]).status,'inconclusive')
})
test('A/A labels honor alternating order; directional signal and spread stay inconclusive',()=>{
 const s=summarize(result()),e=envelope([s,s,s]);assert.equal(heldout(e,Array(6).fill(s)).status,'feasible')
 const v=Array.from({length:6},()=>structuredClone(s));for(const i of [1,2,5])v[i].cpu.scanP50=2
 const h=heldout(e,v);assert.equal(h.status,'inconclusive');assert.deepEqual(h.cpu.scanP50.differences,[1,1,1])
})
test('actual aggregate runs9 sequential fresh supplied owners and freezes envelope before heldout',async()=>{
 const f=options(({index,output})=>{if(index>=3)assert.equal(JSON.parse(readFileSync(join(output,'../calibration-envelope.json'))).status,'stable')})
 try{const r=await run(f.o);assert.equal(r.status,'passed');assert.equal(r.qualification,'feasible');assert.equal(r.comparisonEligible,false)
  assert.equal(f.sessions,9);assert.equal(f.owners.length,9);assert.ok(f.owners.every(o=>o.closed===1));assert.equal(r.cleanupVerified,true)
  assert.deepEqual(r.sessions.map(s=>s.label),P.order)
 }finally{f.cleanup()}
})
test('calibration instability stops before heldout, without replacement',async()=>{
 const f=options(({index,raw})=>{if(index===1)Object.assign(raw,result(1000))})
 try{const r=await run(f.o);assert.equal(r.status,'inconclusive');assert.equal(f.sessions,3)}finally{f.cleanup()}
})
test('timing-only heldout failure retains all6 and never filters slow session',async()=>{
 const f=options(({index,raw})=>{if(index===3)Object.assign(raw,result(1000))})
 try{const r=await run(f.o);assert.equal(r.status,'inconclusive');assert.equal(f.sessions,9);assert.ok(r.heldout.scheduling.length)}finally{f.cleanup()}
})
test('hard validity failure stops further launches and closes current owner',async()=>{
 const f=options(({index,raw})=>{if(index===3)raw.cleanupConfirmed=false})
 try{await assert.rejects(run(f.o));assert.equal(f.sessions,4);assert.ok(f.owners.every(o=>o.closed>=1));assert.equal(f.o.receipt.status,'failed')}finally{f.cleanup()}
})
test('frozen envelope tampering fails before next session launch',async()=>{
 const f=options(({index,output})=>{if(index===3)writeFileSync(join(output,'../calibration-envelope.json'),'{}')})
 try{await assert.rejects(run(f.o),/Frozen envelope changed/);assert.equal(f.sessions,4)}finally{f.cleanup()}
})
test('falsey primary remains primary even when owner cleanup fails',async()=>{
 const f=options();f.o.runSession=async()=>{throw null};f.o.closeOwner=async()=>({confirmed:false,error:'secondary'})
 try{let caught=false;try{await run(f.o)}catch(e){caught=true;assert.equal(e,null)}assert.equal(caught,true);assert.equal(f.owners.length,1)}finally{f.cleanup()}
})
test('aggregate timeout closes late launch and cannot start a session or change frozen receipt',async()=>{
 const f=options();let fire,release,time=0
 f.o.now=()=>time;f.o.schedule=fn=>{fire=fn;return 1};f.o.cancel=()=>{}
 const late={closed:0,async close(){this.closed++},version:()=> 'pinned'}
 f.o.chromium.launch=()=>{time=P.aggregateMs;fire();return new Promise(resolve=>{release=resolve})}
 try{await assert.rejects(run(f.o),/Aggregate wall deadline/);const snapshot=JSON.stringify(f.o.receipt)
  release(late);await new Promise(resolve=>setImmediate(resolve));assert.equal(late.closed,1);assert.equal(f.sessions,0)
  assert.equal(JSON.stringify(f.o.receipt),snapshot);assert.equal(f.o.receipt.cleanupVerified,false)
 }finally{f.cleanup()}
})
test('session artifact quotas reject symlinks and excess without truncation',()=>{
 const dir=mkdtempSync(join(tmpdir(),'pnd-quota-'))
 try{writeFileSync(join(dir,'one.json'),'123');assert.throws(()=>ordinaryPointerCalibrationFiles(dir,2),/total cap/)
  symlinkSync(join(dir,'one.json'),join(dir,'link.json'));assert.throws(()=>ordinaryPointerCalibrationFiles(dir),/regular file/)
 }finally{rmSync(dir,{recursive:true,force:true})}
})

test('browser binary changes stop qualification without launching a replacement',async()=>{
 const f=options(({index})=>{if(index===1)writeFileSync(f.o.browserIdentity.path,'changed')})
 try{await assert.rejects(run(f.o),/Browser executable changed/);assert.equal(f.sessions,2)}finally{f.cleanup()}
})
test('falsey timer cleanup failure cannot yield passed status',async()=>{
 const f=options();f.o.schedule=()=>1;f.o.cancel=()=>{throw undefined}
 try{let caught=false;try{await run(f.o)}catch(e){caught=true;assert.equal(e,undefined)}assert.equal(caught,true);assert.equal(f.o.receipt.status,'failed')}finally{f.cleanup()}
})
test('backward aggregate clock fails before any session launch',async()=>{
 const f=options();let calls=0;f.o.now=()=>calls++===0?10:9
 try{await assert.rejects(run(f.o),/monotonic/);assert.equal(f.sessions,0)}finally{f.cleanup()}
})

test('final clock throw cannot replace falsey primary or skip terminal receipt',async()=>{
 const f=options();let final=false;f.o.runSession=async()=>{final=true;throw null};f.o.now=()=>{if(final)throw Error('final clock');return 1}
 try{let caught=false;try{await run(f.o)}catch(e){caught=true;assert.equal(e,null)}assert.equal(caught,true)
  assert.equal(f.o.receipt.status,'failed');assert.match(f.o.receipt.clockError.message,/final clock/)
  const saved=JSON.parse(readFileSync(join(f.o.output,'ordinary-pointer-calibration/aggregate.json')));assert.equal(saved.status,'failed')
 }finally{f.cleanup()}
})
test('clock-only final falsey throw still writes failed receipt',async()=>{
 const f=options();let final=false;f.o.cancel=timer=>{clearTimeout(timer);final=true};f.o.now=()=>{if(final)throw undefined;return 1}
 try{let caught=false;try{await run(f.o)}catch(e){caught=true;assert.equal(e,undefined)}assert.equal(caught,true)
  assert.equal(f.o.receipt.clockFailed,true);assert.equal(f.o.receipt.status,'failed')
  assert.equal(JSON.parse(readFileSync(join(f.o.output,'ordinary-pointer-calibration/aggregate.json'))).status,'failed')
 }finally{f.cleanup()}
})
test('initial clock throw is recorded and cannot launch a browser',async()=>{
 const f=options();f.o.now=()=>{throw null}
 try{let caught=false;try{await run(f.o)}catch(e){caught=true;assert.equal(e,null)}assert.equal(caught,true);assert.equal(f.owners.length,0)
  assert.equal(JSON.parse(readFileSync(join(f.o.output,'ordinary-pointer-calibration/aggregate.json'))).status,'failed')
 }finally{f.cleanup()}
})

test('noncloneable thrown value stays primary and terminal session evidence detaches',async()=>{
 const f=options(),primary=()=>{};f.o.runSession=async()=>{throw primary}
 try{let caught=false;try{await run(f.o)}catch(e){caught=true;assert.equal(e,primary)}assert.equal(caught,true)
  assert.equal(f.o.receipt.status,'failed');assert.equal(f.o.receipt.detachmentFailed,true)
  assert.equal(JSON.parse(readFileSync(join(f.o.output,'ordinary-pointer-calibration/aggregate.json'))).status,'failed')
 }finally{f.cleanup()}
})
test('calibration raw evidence tampering fails before heldout launch',async()=>{
 const f=options(({index,output})=>{if(index===3)writeFileSync(join(output,'../C1/ordinary-pointer-raw.json'),'{}')})
 try{await assert.rejects(run(f.o),/Calibration raw evidence changed/);assert.equal(f.sessions,4)}finally{f.cleanup()}
})
