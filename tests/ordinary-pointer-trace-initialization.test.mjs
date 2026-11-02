import test from 'node:test'
import assert from 'node:assert/strict'
import {EventEmitter} from 'node:events'
import {mkdtempSync,readFileSync,rmSync,writeSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {initializeOrdinaryTraceService as run,ordinaryTraceInitializationPolicy as P} from '../scripts/browser-performance/ordinary-pointer-trace-initialization.mjs'
function fixture(t,o={}) {
 const output=mkdtempSync(join(tmpdir(),'pnd-init-'));t.after(()=>rmSync(output,{recursive:true,force:true}))
 const pageSession=new EventEmitter(),browserSession=new EventEmitter(),calls=[];let queries=0
 const send=owner=>async(method,args)=>{
  calls.push([method,args,owner]);if(o.hook){const r=await o.hook(method,args,pageSession);if(r!==undefined)return r}
  if(method==='Target.getTargetInfo')return {targetInfo:{targetId:'owned',type:'page'}}
  if(method==='Browser.getVersion')return {product:'supplied'}
  if(method==='Tracing.getCategories')return {categories:queries++===0?(o.before??[]):(o.after??P.categories)}
  if(method==='Tracing.end'){pageSession.emit('Tracing.tracingComplete',{stream:'owned',dataLossOccurred:!!o.loss});if(o.duplicate)pageSession.emit('Tracing.tracingComplete',{stream:'foreign',dataLossOccurred:false});return {}}
  if(method==='IO.read')return o.chunk??{data:'{"traceEvents":[]}',eof:true}
  return {}
 }
 pageSession.send=send('page');browserSession.send=send('browser')
 pageSession.detach=async()=>{calls.push(['detach-page']);if(o.detach)await o.detach()}
 browserSession.detach=async()=>{calls.push(['detach-browser'])}
 const args={output,page:{context:()=>({newCDPSession:async()=>pageSession})},browser:{newBrowserCDPSession:async()=>browserSession},...o.args}
 return {args,calls,pageSession,receipt:()=>JSON.parse(readFileSync(join(output,'ordinary-pointer-trace-initialization/receipt.json'),'utf8')),bytes:()=>readFileSync(join(output,'ordinary-pointer-trace-initialization/trace.json.partial'))}
}
test('one metadata-only start/end retains cold inventory and strict post inventory, no workload API',async t=>{
 const f=fixture(t),r=await run(f.args);assert.equal(r.status,'initialized-unqualified');assert.equal(r.interpretationEligible,false);assert.equal(r.comparisonEligible,false)
 assert.deepEqual(r.beforeInitialization.returnedCategories,[]);assert.deepEqual(r.afterInitialization.returnedCategories,P.categories);assert.equal(r.transportCleanupConfirmed,true)
 const starts=f.calls.filter(x=>x[0]==='Tracing.start');assert.equal(starts.length,1);assert.deepEqual(starts[0][1],{transferMode:'ReturnAsStream',streamFormat:'json',streamCompression:'none',traceConfig:{recordMode:'recordUntilFull',traceBufferSizeInKb:64,enableSampling:false,enableSystrace:false,includedCategories:[],excludedCategories:['*']}})
 assert.equal(f.calls.filter(x=>x[0]==='Tracing.end').length,1);assert.equal(f.calls.filter(x=>x[0]==='Tracing.getCategories').length,2)
 assert.ok(f.calls.filter(x=>/^Tracing\.|^IO\./.test(x[0])).every(x=>x[2]==='page'))
 assert.equal(f.calls.some(x=>x[0]==='Runtime.evaluate'||x[0]==='capture'),false);assert.equal(r.bytes,f.bytes().length)
 r.beforeInitialization.returnedCategories.push('mutated');assert.deepEqual(f.receipt().beforeInitialization.returnedCategories,[])
})
test('empty post inventory stays failure, no repeated initialization or query',async t=>{
 const f=fixture(t,{after:[]});await assert.rejects(run(f.args),/Required trace category unavailable after initialization/)
 assert.equal(f.receipt().status,'failed');assert.equal(f.calls.filter(x=>x[0]==='Tracing.start').length,1);assert.equal(f.calls.filter(x=>x[0]==='Tracing.getCategories').length,2)
 assert.equal(f.receipt().transportCleanupConfirmed,false) // conservative status after post-query refusal
})
test('existing trace conflict never claims initialization or cleanup',async t=>{
 const f=fixture(t,{hook:m=>{if(m==='Tracing.start')throw Error('already started')}})
 await assert.rejects(run(f.args),/already started/);assert.equal(f.receipt().traceStartConfirmed,undefined);assert.equal(f.calls.some(x=>x[0]==='Tracing.end'),false);assert.equal(f.receipt().transportCleanupConfirmed,false)
})
test('loss refuses post inventory',async t=>{const f=fixture(t,{loss:true});await assert.rejects(run(f.args),/Trace incomplete/);assert.equal(f.calls.filter(x=>x[0]==='Tracing.getCategories').length,1)})
test('duplicate completion preserves first handle and rejects',async t=>{const f=fixture(t,{duplicate:true});await assert.rejects(run(f.args),/Invalid trace completion/);assert.equal(f.calls.find(x=>x[0]==='IO.close')[1].handle,'owned')})
test('unexpected push transport is terminal',async t=>{
 const f=fixture(t,{hook:(m,a,s)=>{if(m==='Tracing.start')s.emit('Tracing.dataCollected',{value:[]})}})
 await assert.rejects(run(f.args));assert.equal(f.receipt().unexpectedDataCollected,true)
})
test('malformed category inventory fails before initialization',async t=>{const f=fixture(t,{before:[null]});await assert.rejects(run(f.args),/Invalid bounded/);assert.equal(f.calls.some(x=>x[0]==='Tracing.start'),false)})
test('oversized inventory fails bounded before start',async t=>{const f=fixture(t,{before:Array(2049).fill('x')});await assert.rejects(run(f.args),/inventory bound/);assert.equal(f.receipt().beforeInitialization.retained,false)})
test('invalid encoding and zero progress reject',async t=>{
 for(const chunk of [{data:'@',base64Encoded:true,eof:true},{data:'',eof:false}]){const f=fixture(t,{chunk});await assert.rejects(run(f.args));assert.equal(f.receipt().bytes,0)}
})
test('raw metadata cap retains bounded partial bytes, no successful truncation',async t=>{
 const f=fixture(t,{chunk:{data:'a'.repeat(P.chunkBytes),eof:false}});await assert.rejects(run(f.args),/output cap/);assert.equal(f.bytes().length,P.traceBytes);assert.equal(f.receipt().streamEof,undefined)
})
test('actual short write is reflected exactly and rejected',async t=>{
 const f=fixture(t,{args:{write:(fd,b)=>writeSync(fd,b.subarray(0,3))}});await assert.rejects(run(f.args),/Short trace write/);assert.equal(f.receipt().bytes,3);assert.equal(f.bytes().length,3)
})
test('falsey primary start error is retained without ending unowned trace',async t=>{
 const f=fixture(t,{hook:m=>{if(m==='Tracing.start')throw null}});let seen=false
 try{await run(f.args)}catch(e){seen=true;assert.equal(e,null)}assert.ok(seen);assert.equal(f.receipt().status,'failed')
})
test('monotonic cleanup rejects delayed timer at exact two-second boundary',async t=>{
 let now=0;const f=fixture(t,{detach:()=>{now=2000},args:{now:()=>now}});await assert.rejects(run(f.args),/cleanup deadline/);assert.equal(f.receipt().transportCleanupConfirmed,false)
})
test('stalled start settles receipt as failed, never upgrades late completion',async t=>{
 let resolve;const f=fixture(t,{hook:m=>m==='Tracing.start'?new Promise(r=>{resolve=r}):undefined,args:{schedule:(fn,ms)=>setTimeout(fn,ms===P.activeMs?5:100)}})
 await assert.rejects(run(f.args),/active deadline/);const prior=JSON.stringify(f.receipt());assert.equal(f.receipt().operationSettled,false)
 resolve({});await new Promise(r=>setTimeout(r,0));assert.equal(JSON.stringify(f.receipt()),prior)
})
test('stalled detach remains unconfirmed under cleanup timer',async t=>{
 const f=fixture(t,{detach:()=>new Promise(()=>{}),args:{schedule:(fn,ms)=>setTimeout(fn,ms===P.cleanupMs?5:100)}});await assert.rejects(run(f.args),/cleanup deadline/);assert.equal(f.receipt().transportCleanupConfirmed,false)
})
test('premature completion never closes its unowned handle',async t=>{
 const f=fixture(t,{hook:(m,a,s)=>{if(m==='Tracing.start')s.emit('Tracing.tracingComplete',{stream:'foreign-early',dataLossOccurred:false})}})
 await assert.rejects(run(f.args));assert.equal(f.calls.some(x=>x[0]==='IO.close'&&x[1].handle==='foreign-early'),false);assert.equal(f.receipt().invalidCompletion.premature,true)
})
test('final missing one required category is not admitted as partial support',async t=>{
 const f=fixture(t,{after:P.categories.slice(1)});await assert.rejects(run(f.args),/Required trace category/);assert.deepEqual(f.receipt().afterInitialization.missingRequired,[P.categories[0]])
})
