import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,symlinkSync,existsSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createHash} from 'node:crypto'
import route,{ordinaryPointerTraceFiles as files,ordinaryPointerTraceRoutePolicy as policy} from '../scripts/browser-performance/ordinary-pointer-trace-route.mjs'
const hash=b=>createHash('sha256').update(b).digest('hex'),sha='a'.repeat(40)
const turn=()=>new Promise(resolve=>setImmediate(resolve))
function fixture(t){
 const output=mkdtempSync(join(tmpdir(),'trace-route-'));t.after(()=>rmSync(output,{recursive:true,force:true}))
 const binary=join(output,'chrome');writeFileSync(binary,'supplied binary')
 const calls=[],receipt={};let timer,time=0
 const session={send:async name=>{calls.push(name);return{}},detach:async()=>{calls.push('detach')}}
 const browser={version:()=> 'supplied Chrome',close:async()=>{calls.push('close')}}
 const args={output,url:'http://localhost:5198',source:{commit:sha},expectedRevision:sha,dist:'supplied',launch:{headless:true},
 browserIdentity:{path:binary,sha256:hash('supplied binary'),version:'supplied Chrome'},receipt,
 chromium:{launch:async config=>{assert.equal(config.timeout,30000);calls.push('launch');return browser}},
 admit:async()=>{calls.push('admit');return{sha,currentMainVerified:true}},
 observe:async send=>{await send('supplied-observe');return{target:'same'}},
 collector:async({output,capture,page,browser:actual})=>{assert.equal(actual,browser);calls.push('collector');const dir=join(output,'ordinary-pointer-diagnostic');mkdirSync(dir);writeFileSync(join(dir,'receipt.json'),JSON.stringify({status:'raw-stream-only-unqualified',streamEof:true,transportCleanupConfirmed:true,operationSettled:true}));writeFileSync(join(dir,'trace.json.partial'),'{}');return capture({page,enabled:true})},
 capture:async({enabled})=>{assert.equal(enabled,true);calls.push('capture');return{packet:'supplied'}},
 qualify:({bytes,before,after})=>{assert.deepEqual(before,after);calls.push('qualify');return{status:'target-envelope-bound-unqualified',traceSha256:hash(bytes),interpretationEligible:false,comparisonEligible:false}},
 runSmoke:async({capture,receipt})=>{calls.push('smoke');await capture({page:{context:()=>({newCDPSession:async()=>session})}});Object.assign(receipt,{status:'passed',readerAdmission:'admitted',contextCleanup:{confirmed:true},browserCleanup:{confirmed:true},operationSettled:true});await browser.close()},
 closeOwner:async action=>{try{await action();return{confirmed:true}}catch(error){return{confirmed:false,error}}},
 now:()=>time,schedule:fn=>{timer=fn;return 1},cancel:()=>{calls.push('cancel')}}
 return{args,calls,receipt,browser,session,setTime:v=>time=v,fire:()=>timer()}
}
test('one admitted capture binds before/after target, binary and bounded artifacts without qualification claim',async t=>{
 const f=fixture(t);const result=await route(f.args)
 assert.equal(result.status,'passed');assert.equal(result.cleanupVerified,true);assert.equal(result.operationSettled,true)
 assert.equal(result.interpretationEligible,false);assert.equal(result.comparisonEligible,false)
 assert.deepEqual(f.calls,['admit','launch','smoke','supplied-observe','collector','capture','supplied-observe','qualify','detach','close','cancel'])
 assert.equal(JSON.parse(readFileSync(join(f.args.output,'ordinary-pointer-trace/route.json'))).status,'passed')
 assert.equal(files(f.args.output).traceBytes,2);assert.equal(policy.routeMs,180000);assert.equal(policy.activeMs,178000)
})
test('admission and binary refusal happen before launching any browser',async t=>{
 for(const kind of ['admission','binary']){const f=fixture(t);if(kind==='admission')f.args.admit=async()=>({sha:'b'.repeat(40),currentMainVerified:true});else writeFileSync(f.args.browserIdentity.path,'changed');await assert.rejects(route(f.args));assert.equal(f.calls.includes('launch'),false);assert.equal(f.receipt.cleanupVerified,false)}
})
test('unsupported target envelope and changed binary fail closed after actual capture leaves',async t=>{
 for(const kind of ['schema','hash','binary']){const f=fixture(t);const qualify=f.args.qualify;f.args.qualify=e=>{const result=qualify(e);if(kind==='schema')result.status='unknown';if(kind==='hash')result.traceSha256='0'.repeat(64);if(kind==='binary')writeFileSync(f.args.browserIdentity.path,'changed');return result};await assert.rejects(route(f.args));assert.equal(f.receipt.status,'failed');assert.ok(f.calls.includes('detach'));assert.ok(f.calls.includes('close'))}
})
test('falsey primary capture failures survive metadata/browser cleanup failures',async t=>{
 for(const primary of [null,false,0,undefined]){const f=fixture(t);f.args.collector=async()=>{throw primary};f.session.detach=async()=>{throw Error('detach')};f.browser.close=async()=>{throw Error('close')};let caught=false;await route(f.args).catch(error=>{caught=true;assert.equal(error,primary)});assert.ok(caught);assert.equal(f.receipt.cleanupVerified,false);assert.equal(f.receipt.metadataSessionCleanup.confirmed,false)}
})
test('successful capture with failed metadata detach is not accepted',async t=>{
 const f=fixture(t);f.session.detach=async()=>{throw null};await assert.rejects(route(f.args),/Metadata CDP cleanup/);assert.equal(f.receipt.cleanupVerified,false)
})
test('remaining fixed route budget refuses starting a 90-second collector too late',async t=>{
 const f=fixture(t);f.args.observe=async()=>{f.setTime(86001);return{}};await assert.rejects(route(f.args),/Insufficient remaining/);assert.equal(f.calls.includes('collector'),false)
})
test('clock boundary and invalid clocks fail closed without granting fresh budget',async t=>{
 for(const value of [178000,NaN,-1]){const f=fixture(t);f.args.admit=async()=>{f.setTime(value);return{sha,currentMainVerified:true}};await assert.rejects(route(f.args));assert.equal(f.calls.includes('launch'),false)}
})
test('pending capture timeout preserves uncertainty and cannot overwrite finalized evidence',async t=>{
 const f=fixture(t);let release;const pending=new Promise(resolve=>release=resolve)
 f.args.collector=async()=>{await pending;return {late:true}}
 const result=route(f.args);while(!f.calls.includes('supplied-observe'))await turn();await turn();f.setTime(178000);f.fire()
 await assert.rejects(result,/active deadline/);assert.equal(f.receipt.operationSettled,false);assert.equal(f.receipt.cleanupVerified,false)
 const path=join(f.args.output,'ordinary-pointer-trace/route.json'),frozen=readFileSync(path,'utf8');release();await turn();await turn();assert.equal(readFileSync(path,'utf8'),frozen);assert.equal(f.receipt.status,'failed')
})
test('late browser launch is owned and closed without rewriting frozen receipt',async t=>{
 const f=fixture(t);let release;f.args.chromium.launch=()=>new Promise(resolve=>release=resolve)
 const result=route(f.args);while(!release)await turn();f.setTime(178000);f.fire();await assert.rejects(result);assert.equal(f.receipt.launchPending,true)
 const path=join(f.args.output,'ordinary-pointer-trace/route.json'),frozen=readFileSync(path,'utf8');release(f.browser);await turn();await turn();assert.ok(f.calls.includes('close'));assert.equal(readFileSync(path,'utf8'),frozen)
})
test('artifact bounds include outer metadata and reject symlinks and unknown subdirectories',async t=>{
 for(const kind of ['metadata','trace','symlink','directory']){const f=fixture(t);await route(f.args);const root=join(f.args.output,'ordinary-pointer-trace');if(kind==='metadata')writeFileSync(join(f.args.output,'build.log'),Buffer.alloc(1024*1024));if(kind==='trace')writeFileSync(join(root,'session/ordinary-pointer-diagnostic/trace.json.partial'),Buffer.alloc(8*1024*1024+1));if(kind==='symlink')symlinkSync(f.args.browserIdentity.path,join(root,'linked'));if(kind==='directory')mkdirSync(join(root,'session/other'));assert.throws(()=>files(f.args.output))}
})
test('unsupported observed schema retains before/after identity and raw trace without fabricated qualification',async t=>{
 const f=fixture(t);f.args.qualify=()=>{throw Error('Unsupported exact trace schema')};await assert.rejects(route(f.args),/Unsupported exact/)
 const binding=JSON.parse(readFileSync(join(f.args.output,'ordinary-pointer-trace/binding.json'),'utf8'))
 assert.equal(binding.status,'observed-before-after');assert.deepEqual(binding.before,binding.after);assert.equal(binding.qualification,undefined)
 assert.equal(readFileSync(join(f.args.output,'ordinary-pointer-trace/session/ordinary-pointer-diagnostic/trace.json.partial'),'utf8'),'{}')
})
test('final clock or evidence write failures do not mask falsey primary capture failure',async t=>{
 for(const kind of ['clock','write']){const f=fixture(t);f.args.collector=async()=>{if(kind==='clock')f.args.now=()=>NaN;else{const path=join(f.args.output,'ordinary-pointer-trace/route.json');rmSync(path);mkdirSync(path)};throw false}
 if(kind==='clock'){let broken=false;f.args.now=()=>broken?NaN:0;f.args.collector=async()=>{broken=true;throw false}}
 let caught=false;await route(f.args).catch(e=>{caught=true;assert.equal(e,false)});assert.ok(caught);assert.equal(f.receipt.status,'failed')
 }
})
test('deadline equality after completed work cannot become success before delayed timer delivery',async t=>{
 const f=fixture(t),smoke=f.args.runSmoke;f.args.runSmoke=async args=>{await smoke(args);f.setTime(178000)}
 await assert.rejects(route(f.args),/deadline/);assert.equal(f.receipt.status,'failed');assert.equal(f.receipt.operationSettled,true)
})

test('artifact finalization crossing the same route deadline cannot return a stale passed receipt',async t=>{
 const f=fixture(t),path=join(f.args.output,'ordinary-pointer-trace/route.json')
 f.args.now=()=>existsSync(path)&&readFileSync(path,'utf8').includes('"artifacts"')?180000:0
 await assert.rejects(route(f.args),/finalization deadline/)
 assert.equal(f.receipt.status,'failed');assert.equal(JSON.parse(readFileSync(path,'utf8')).status,'failed')
})

test('backward clock between finalization checkpoints fails closed',async t=>{
 const f=fixture(t),path=join(f.args.output,'ordinary-pointer-trace/route.json');let cancelled=false
 f.args.cancel=()=>{cancelled=true}
 f.args.now=()=>!cancelled?0:existsSync(path)&&readFileSync(path,'utf8').includes('"artifacts"')?150:200
 await assert.rejects(route(f.args),/finalization deadline\/clock/)
 assert.equal(f.receipt.status,'failed');assert.equal(JSON.parse(readFileSync(path,'utf8')).status,'failed')
})
