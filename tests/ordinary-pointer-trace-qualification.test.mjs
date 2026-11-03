import test from 'node:test'
import assert from 'node:assert/strict'
import {observeOrdinaryTraceTarget,qualifyOrdinaryTrace} from '../scripts/browser-performance/ordinary-pointer-trace-qualification.mjs'
function fixture(){
 const before={targetInfo:{targetId:'target-different-from-frame',type:'page',url:'http://fixture/?x=1#retained',browserContextId:'exclusive'},
  rootFrame:{id:'root-frame-token',loaderId:'loader-1',url:'http://fixture/?x=1#retained'},isolateId:'isolate-observed',domains:[{name:'Page',version:'1.3'},{name:'Runtime',version:'1.3'}]}
 const collector={version:2,traceOwner:'page-cdp',status:'raw-stream-only-unqualified',streamEof:true,streamClosed:true,targetDetached:true,sessionDetached:true,
  traceStartConfirmed:true,operationSettled:true,transportCleanupConfirmed:true,observerCleanupConfirmed:true,traceDataLossOccurred:false,clockFailed:false,
  comparisonEligible:false,interpretationEligible:false,pending:0,errors:[],browser:{product:'Chrome/156.0.8078.47'},target:before.targetInfo,
  processesBefore:[{id:42,type:'renderer',cpuTime:1}],processesAfter:[{id:42,type:'renderer',cpuTime:2}]}
 const events=[
  {name:'TracingStartedInBrowser',cat:'disabled-by-default-devtools.timeline',ph:'I',pid:5,tid:6,ts:100,args:{data:{persistentIds:true,frames:[{frame:'root-frame-token',processId:42,url:'http://fixture/?x=1',isOutermostMainFrame:true}]}}},
  {name:'thread_name',cat:'__metadata',ph:'M',pid:42,tid:43,ts:0,args:{name:'CrRendererMain'}},
  {name:'pnd-ordinary-diagnostic-capture-start',cat:'blink.user_timing',ph:'R',pid:42,tid:43,ts:200,args:{data:{}}},
  {name:'pnd-ordinary-diagnostic-capture-end',cat:'blink.user_timing',ph:'R',pid:42,tid:43,ts:400,args:{data:{}}},
 ]
 const f={collector,before,after:structuredClone(before),browserVersion:'156.0.8078.47',events}
 f.args=()=>{const bytes=Buffer.from(JSON.stringify({traceEvents:events}));collector.bytes=bytes.length;return {bytes,collector,before,after:f.after,browserVersion:f.browserVersion}}
 return f
}
test('observed root-frame mapping binds distinct target token without causal or stack claims',()=>{
 const f=fixture(),r=qualifyOrdinaryTrace(f.args());assert.equal(r.status,'target-envelope-bound-unqualified')
 assert.deepEqual(r.binding,{targetId:'target-different-from-frame',rootFrameId:'root-frame-token',rendererPid:42,mainThreadTid:43})
 assert.equal(r.captureEnvelope.startTraceUs,200);assert.equal(r.processCpu.afterSeconds-r.processCpu.beforeSeconds,1)
 assert.equal(r.interpretationEligible,false);assert.equal(r.comparisonEligible,false)
 for(const key of ['isolateThreadBinding','samplingSchema','gcCoverage','stackSourceBinding','clockToFrames'])assert.equal(r[key],'unqualified')
})
test('missing, ambiguous and changed frame process mappings reject',()=>{
 for(const mutate of [f=>f.events[0].args.data.frames=[],f=>f.events[0].args.data.frames.push({...f.events[0].args.data.frames[0]}),
  f=>f.events[0].args.data.frames[0].frame=f.before.targetInfo.targetId,f=>f.events[0].args.data.frames[0].processId=99,
  f=>f.events[0].args.data.frames[0].url='http://fixture/?x=2',f=>f.events[0].args.data.frames[0].isOutermostMainFrame=false,
  f=>f.events[0].cat='devtools.timeline']){
  const f=fixture();mutate(f);assert.throws(()=>qualifyOrdinaryTrace(f.args()))
 }
})
test('unstable target navigation isolate and protocol observations reject',()=>{
 for(const mutate of [f=>f.after.targetInfo.targetId='replacement',f=>f.after.rootFrame.loaderId='new',f=>f.after.rootFrame.id='different',
  f=>f.after.isolateId='new-isolate',f=>f.after.domains=[],f=>f.collector.target={...f.before.targetInfo,targetId:'other'},
  f=>f.after.targetInfo.browserContextId='other',f=>f.before.rootFrame.parentId='parent']){
  const f=fixture();mutate(f);assert.throws(()=>qualifyOrdinaryTrace(f.args()))
 }
})
test('renderer main-thread and marker mismatches cannot qualify',()=>{
 for(const mutate of [f=>f.events[1].args.name='WorkerThread',f=>f.events.push({...f.events[1],tid:44}),
  f=>f.events[2].pid=5,f=>f.events[3].tid=44,f=>f.events[3].ts=199,f=>f.events.push({...f.events[2]}),
  f=>f.events.pop(),f=>f.events[2].cat='console',f=>f.events[2].ph='X']){
  const f=fixture();mutate(f);assert.throws(()=>qualifyOrdinaryTrace(f.args()))
 }
})
test('process transition or deletion metadata rejects even with matching endpoints',()=>{
 for(const event of [{name:'FrameCommittedInBrowser',processId:99,url:'http://fixture/?x=1'},
  {name:'ProcessReadyInBrowser',processId:99},{name:'FrameDeletedInBrowser'},
  {name:'FrameCommittedInBrowser',processId:42,url:'http://fixture/?x=2'}]){
  const f=fixture(),{name,...data}=event;f.events.push({name,cat:'disabled-by-default-devtools.timeline',ph:'I',pid:5,tid:6,ts:300,args:{data:{frame:'root-frame-token',...data}}})
  assert.throws(()=>qualifyOrdinaryTrace(f.args()))
 }
})
test('partial lost pending or failed collector evidence cannot qualify',()=>{
 for(const mutate of [f=>f.collector.version=1,f=>f.collector.traceOwner='browser-cdp',f=>f.collector.streamEof=false,
  f=>f.collector.traceDataLossOccurred=true,f=>f.collector.pending=1,f=>f.collector.cleanupFailed=true,
  f=>f.collector.operationSettled=false,f=>f.collector.errors=['error'],f=>f.collector.transportCleanupConfirmed=false,
  f=>f.collector.invalidCompletion={duplicate:true},f=>f.collector.status='failed']){
  const f=fixture();mutate(f);assert.throws(()=>qualifyOrdinaryTrace(f.args()))
 }
})
test('renderer process must persist uniquely with monotonic all-thread CPU counter',()=>{
 for(const mutate of [f=>f.collector.processesAfter=[],f=>f.collector.processesAfter.push({...f.collector.processesAfter[0]}),
  f=>f.collector.processesAfter[0].cpuTime=.5,f=>f.collector.processesBefore[0].type='browser',f=>f.browserVersion='other']){
  const f=fixture();mutate(f);assert.throws(()=>qualifyOrdinaryTrace(f.args()))
 }
})
test('bounded JSON syntax and exact raw byte count are required',()=>{
 const f=fixture(),a=f.args();assert.throws(()=>qualifyOrdinaryTrace({...a,bytes:Buffer.from('{')}))
 assert.throws(()=>qualifyOrdinaryTrace({...a,bytes:Buffer.alloc(8*1024*1024+1)}))
 assert.throws(()=>qualifyOrdinaryTrace({...a,collector:{...a.collector,bytes:1}}))
 const bytes=Buffer.from([0xff]);assert.throws(()=>qualifyOrdinaryTrace({...a,bytes,collector:{...a.collector,bytes:1}}))
})
test('observation helper uses actual separate CDP facts and does not invent frame target equality',async()=>{
 const f=fixture(),calls=[];const observed=await observeOrdinaryTraceTarget(async method=>{
  calls.push(method);return {'Target.getTargetInfo':{targetInfo:f.before.targetInfo},'Page.getFrameTree':{frameTree:{frame:f.before.rootFrame}},
   'Runtime.getIsolateId':{id:f.before.isolateId},'Schema.getDomains':{domains:f.before.domains}}[method]
 });assert.deepEqual(observed,f.before);assert.deepEqual(calls,['Target.getTargetInfo','Page.getFrameTree','Runtime.getIsolateId','Schema.getDomains'])
})
test('observation helper rejects missing root and propagates falsey transport failure',async()=>{
 await assert.rejects(observeOrdinaryTraceTarget(async()=>({})))
 let caught=false;try{await observeOrdinaryTraceTarget(async()=>{throw null})}catch(e){caught=true;assert.equal(e,null)}assert.equal(caught,true)
})
