import test from 'node:test'
import assert from 'node:assert/strict'
import {EventEmitter} from 'node:events'
import {mkdtempSync,readFileSync,existsSync,rmSync,writeSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {captureOrdinaryPointerTraceDiagnostic as run,ordinaryTracePolicy as P} from '../scripts/browser-performance/ordinary-pointer-trace-diagnostic.mjs'
function fixture(t,options={}){
 const output=mkdtempSync(join(tmpdir(),'pnd-trace-test-'));t.after(()=>rmSync(output,{recursive:true,force:true}))
 const calls=[],session=new EventEmitter(),target={}
 let reads=0
 session.send=async(method,args)=>{calls.push([method,args]);if(options.send)return options.send(method,args,session,calls)
  if(method==='Tracing.getCategories')return {categories:P.categories}
  if(method==='Browser.getVersion')return {product:'supplied-browser',protocolVersion:'supplied'}
  if(method==='SystemInfo.getProcessInfo')return {processInfo:[{type:'renderer',id:42,cpuTime:1}]}
  if(method==='Tracing.end'){session.emit('Tracing.tracingComplete',{dataLossOccurred:!!options.loss,stream:'owned'});return {}}
  if(method==='IO.read')return options.chunk?.(reads++)??{data:'{"traceEvents":[]}',eof:true}
  if(method==='IO.close'&&options.closeError)throw options.closeError
  return {}
 }
 session.detach=async()=>{calls.push(['browser-detach']);if(options.detachPending)return new Promise(()=>{})}
 target.send=async(method,args)=>{calls.push([method,args]);if(method==='Target.getTargetInfo')return {targetInfo:{targetId:'owned',type:'page',url:'http://fixture/'}};return {result:{}}}
 target.detach=async()=>{calls.push(['target-detach'])}
 const browser={newBrowserCDPSession:async()=>session},page={context:()=>({newCDPSession:async()=>target})}
 const value={observerCleanupConfirmed:true,comparisonEligible:false}
 const capture=async()=>{calls.push(['capture']);if(options.capture)return options.capture(session);return value}
 const args={browser,page,capture,output,...options.args}
 return {args,calls,session,target,value,output,receipt:()=>JSON.parse(readFileSync(join(output,'ordinary-pointer-diagnostic/receipt.json'),'utf8'))}
}
test('owned capture wrapper records explicit bounded settings and remains unqualified',async t=>{
 const f=fixture(t);assert.equal(await run(f.args),f.value)
 const receipt=f.receipt();assert.equal(receipt.status,'raw-stream-only-unqualified');assert.equal(receipt.comparisonEligible,false);assert.equal(receipt.interpretationEligible,false)
 assert.equal(receipt.transportCleanupConfirmed,true);assert.equal(receipt.bytes,18);assert.equal(receipt.schemaQualification,'not-performed')
 const config=f.calls.find(x=>x[0]==='Tracing.start')[1];assert.equal(config.traceConfig.traceBufferSizeInKb,8192);assert.equal(config.traceConfig.recordMode,'recordUntilFull');assert.equal(config.traceConfig.enableSystrace,false)
 assert.ok(f.calls.findIndex(x=>x[0]==='capture')>f.calls.findIndex(x=>x[0]==='Tracing.start'))
 assert.ok(f.calls.findIndex(x=>x[0]==='IO.close')<f.calls.findIndex(x=>x[0]==='browser-detach'))
 assert.equal(existsSync(join(f.output,'ordinary-pointer-diagnostic/trace.json.partial')),true)
})
test('falsey capture failure survives secondary stream close failure',async t=>{
 const f=fixture(t,{capture:()=>{throw null},closeError:Error('secondary')});let seen=false
 try{await run(f.args)}catch(e){seen=true;assert.equal(e,null)}assert.equal(seen,true)
 const r=f.receipt();assert.equal(r.status,'failed');assert.ok(r.errors.some(x=>x.message==='null'));assert.ok(r.errors.some(x=>x.message.includes('secondary')))
 assert.ok(f.calls.some(x=>x[0]==='target-detach'));assert.ok(f.calls.some(x=>x[0]==='browser-detach'))
})
test('trace loss is incomplete and cannot produce accepted or renamed trace',async t=>{
 const f=fixture(t,{loss:true});await assert.rejects(run(f.args),/Trace incomplete/);assert.equal(f.receipt().streamEof,undefined)
 assert.ok(existsSync(join(f.output,'ordinary-pointer-diagnostic/trace.json.partial')))
})
test('chunk decoding rejects malformed base64 without publishing complete bytes',async t=>{
 const f=fixture(t,{chunk:()=>({data:'@bad',base64Encoded:true,eof:true})});await assert.rejects(run(f.args),/Malformed base64/);assert.equal(f.receipt().bytes,0)
})
test('decoded chunk limit enforced before file write',async t=>{
 const f=fixture(t,{chunk:()=>({data:'a'.repeat(P.chunkBytes+1),eof:true})});await assert.rejects(run(f.args),/Decoded chunk bound/);assert.equal(f.receipt().bytes,0)
})
test('total trace limit retains bounded partial bytes without accepting truncation',async t=>{
 const f=fixture(t,{chunk:()=>({data:'a'.repeat(P.chunkBytes),eof:false})});await assert.rejects(run(f.args),/Trace output cap/);assert.equal(f.receipt().bytes,P.traceBytes);assert.equal(f.receipt().streamEof,undefined)
})
test('unexpected dataCollected fails closed without event accumulation',async t=>{
 const f=fixture(t,{capture:s=>{s.emit('Tracing.dataCollected',{value:[{arbitrary:'not retained'}]});return {observerCleanupConfirmed:true}}})
 await assert.rejects(run(f.args),/Diagnostic terminal/);assert.equal(f.receipt().unexpectedDataCollected,true)
})
test('stalled trace end stops at independent cleanup boundary and remains unconfirmed',async t=>{
 const f=fixture(t,{send:async(method)=>{if(method==='Tracing.getCategories')return {categories:P.categories};if(method==='SystemInfo.getProcessInfo')return {processInfo:[]};if(method==='Tracing.end')return new Promise(()=>{});return {}},args:{schedule:(fn,ms)=>setTimeout(fn,ms===P.cleanupMs?5:1000)}})
 await assert.rejects(run(f.args),/cleanup deadline/);const r=f.receipt();assert.equal(r.transportCleanupConfirmed,false);assert.equal(r.cleanupFailed,true);assert.equal(r.pending,1)
})
test('missing category aborts before workload with no fallback',async t=>{
 const f=fixture(t,{send:async method=>method==='Tracing.getCategories'?{categories:[]}:{}})
 await assert.rejects(run(f.args),/Required trace category/);assert.equal(f.calls.some(x=>x[0]==='capture'),false)
})
test('metadata overflow rejects before tracing and capture',async t=>{
 const f=fixture(t,{send:async method=>method==='Browser.getVersion'?{huge:'x'.repeat(P.metadataBytes)}:method==='Tracing.getCategories'?{categories:P.categories}:{}})
 await assert.rejects(run(f.args),/metadata cap/);assert.equal(f.calls.some(x=>x[0]==='capture'),false)
 assert.equal(f.receipt().status,'failed');assert.equal(f.receipt().browser,undefined)
})
test('late capture after active timeout cannot change frozen receipt or send end marker',async t=>{
 let settle
 const f=fixture(t,{capture:()=>new Promise(r=>{settle=r}),args:{schedule:(fn,ms)=>setTimeout(fn,ms===P.activeMs?5:100)}})
 await assert.rejects(run(f.args),/active deadline/);const before=JSON.stringify(f.receipt()),calls=f.calls.length
 assert.equal(f.receipt().operationSettled,false);assert.equal(f.receipt().transportCleanupConfirmed,false)
 settle({observerCleanupConfirmed:true});await new Promise(r=>setTimeout(r,0))
 assert.equal(JSON.stringify(f.receipt()),before);assert.equal(f.calls.length,calls)
})
test('pending detach is recorded and cannot be promoted to cleanup confirmed',async t=>{
 const f=fixture(t,{detachPending:true,args:{schedule:(fn,ms)=>setTimeout(fn,ms===P.cleanupMs?5:100)}})
 await assert.rejects(run(f.args),/cleanup deadline/);assert.equal(f.receipt().transportCleanupConfirmed,false);assert.equal(f.receipt().pending,1)
})
test('initial falsey clock failure retains bounded receipt and no workload',async t=>{
 const f=fixture(t,{args:{now:()=>{throw 0}}});let seen=false
 try{await run(f.args)}catch(e){seen=true;assert.equal(e,0)}assert.equal(seen,true)
 assert.equal(f.receipt().status,'failed');assert.equal(f.receipt().clockFailed,true);assert.equal(f.calls.some(x=>x[0]==='capture'),false)
})
test('empty nonterminal stream chunk rejects rather than spinning',async t=>{
 const f=fixture(t,{chunk:()=>({data:'',eof:false})});await assert.rejects(run(f.args),/Empty nonterminal/);assert.equal(f.receipt().bytes,0)
})
test('premature completion fails closed instead of accepting capture truncation',async t=>{
 const f=fixture(t,{capture:s=>{s.emit('Tracing.tracingComplete',{dataLossOccurred:false,stream:'early'});return {observerCleanupConfirmed:true}}})
 await assert.rejects(run(f.args));assert.equal(f.receipt().status,'failed');assert.equal(f.receipt().transportCleanupConfirmed,false)
 assert.ok(f.receipt().invalidCompletion);assert.equal(f.calls.find(x=>x[0]==='IO.close')[1].handle,'early')
})
test('duplicate completion retains first owned handle and fails collection',async t=>{
 const f=fixture(t),send=f.session.send
 f.session.send=async(m,a)=>{const r=await send(m,a);if(m==='Tracing.end')f.session.emit('Tracing.tracingComplete',{dataLossOccurred:false,stream:'foreign-second'});return r}
 await assert.rejects(run(f.args));assert.equal(f.receipt().invalidCompletion.duplicate,true)
 assert.equal(f.calls.find(x=>x[0]==='IO.close')[1].handle,'owned');assert.equal(f.receipt().transportCleanupConfirmed,false)
})
test('elapsed cleanup deadline rejects exact boundary even when timer delivery is withheld',async t=>{
 let time=0;const f=fixture(t,{args:{now:()=>time,schedule:()=>1,cancel:()=>{}}})
 f.session.detach=async()=>{time=P.cleanupMs}
 await assert.rejects(run(f.args),/cleanup deadline/);assert.equal(f.receipt().transportCleanupConfirmed,false);assert.equal(f.receipt().cleanupFailed,true)
})
test('short write retains actual count and never labels full trace',async t=>{
 const f=fixture(t,{args:{write:(fd,bytes)=>writeSync(fd,bytes.subarray(0,3))}});await assert.rejects(run(f.args),/Short trace write/)
 assert.equal(f.receipt().bytes,3);assert.equal(readFileSync(join(f.output,'ordinary-pointer-diagnostic/trace.json.partial')).length,3);assert.equal(f.receipt().streamEof,undefined);assert.equal(existsSync(join(f.output,'ordinary-pointer-diagnostic/trace.json')),false)
})
test('syntax and schema are not claimed by raw stream-only collection',async t=>{
 const f=fixture(t,{chunk:()=>({data:'not valid JSON',eof:true})});await run(f.args)
 assert.equal(f.receipt().status,'raw-stream-only-unqualified');assert.equal(f.receipt().interpretationEligible,false)
 assert.equal(existsSync(join(f.output,'ordinary-pointer-diagnostic/trace.json')),false)
 assert.equal(readFileSync(join(f.output,'ordinary-pointer-diagnostic/trace.json.partial'),'utf8'),'not valid JSON')
})
test('unbounded stream handle is rejected and never used for IO',async t=>{
 const f=fixture(t),send=f.session.send
 f.session.send=async(m,a)=>{if(m==='Tracing.end'){f.session.emit('Tracing.tracingComplete',{dataLossOccurred:false,stream:'x'.repeat(257)});return {}}return send(m,a)}
 await assert.rejects(run(f.args));assert.equal(f.receipt().invalidStreamHandle,true);assert.equal(f.calls.some(x=>x[0].startsWith('IO.')),false)
})
