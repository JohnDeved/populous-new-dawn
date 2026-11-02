// One explicitly selected diagnostic. Import does not launch Chrome or collect data.
import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync,readdirSync,lstatSync,openSync,readSync,closeSync,writeSync} from 'node:fs'
import {resolve} from 'node:path'
import {createHash} from 'node:crypto'
import {initializeOrdinaryTraceService} from './ordinary-pointer-trace-initialization.mjs'
import {captureOrdinaryPointerTraceDiagnostic} from './ordinary-pointer-trace-diagnostic.mjs'
import {closeOrdinaryPointerSmokeOwner,ordinaryPointerSmokeArtifact} from './ordinary-pointer-smoke-policy.mjs'

export const ordinaryPointerTraceRoutePolicy=Object.freeze({version:1,role:'one-trace-functional-diagnostic-not-comparison',
  routeMs:180000,activeMs:178000,cleanupMs:2000,launchMs:30000,jobMinutes:6,
  traceBytes:8*1024*1024,sessionBytes:32*1024*1024,metadataBytes:1024*1024,totalBytes:41*1024*1024})
const P=ordinaryPointerTraceRoutePolicy
const hash=bytes=>createHash('sha256').update(bytes).digest('hex')
function fileHash(path){const fd=openSync(path,'r'),buffer=Buffer.alloc(1024*1024),digest=createHash('sha256');try{let n;while((n=readSync(fd,buffer,0,buffer.length,null))>0)digest.update(buffer.subarray(0,n));return digest.digest('hex')}finally{closeSync(fd)}}
function boundedJson(path,cap){const stat=lstatSync(path);assert.ok(stat.isFile()&&!stat.isSymbolicLink()&&stat.size<=cap,'Bounded regular diagnostic JSON required');return JSON.parse(readFileSync(path,'utf8'))}
export function ordinaryPointerTraceFiles(output){
  let sessionBytes=0,traceBytes=0,metadataBytes=0;const files=[]
  const visit=(path,group)=>{if(!lstatSync(path).isDirectory())throw Error('Diagnostic directory required');for(const name of readdirSync(path).sort()){
    const file=resolve(path,name),s=lstatSync(file);assert.ok(!s.isSymbolicLink(),'Diagnostic symlink forbidden')
    if(s.isDirectory()){assert.equal(group,'session');assert.ok(['ordinary-pointer-diagnostic','ordinary-pointer-trace-initialization'].includes(name),'Unexpected artifact directory');visit(file,name==='ordinary-pointer-trace-initialization'?'initialization':'diagnostic');continue}
    assert.ok(s.isFile(),'Diagnostic regular artifact required');assert.ok(s.size<=P.traceBytes,'Individual artifact cap')
    const rel=file.slice(resolve(output).length+1)
    if((group==='diagnostic'||group==='initialization')&&name==='trace.json.partial'){if(group==='initialization')assert.ok(s.size<=1024*1024,'Initialization trace cap');traceBytes+=s.size}
    else if(group==='session')sessionBytes+=s.size
    else metadataBytes+=s.size
    files.push({path:rel,bytes:s.size,sha256:fileHash(file)})
  }}
  const root=resolve(output,'ordinary-pointer-trace');
  for(const name of readdirSync(root).sort()){
    const file=resolve(root,name),s=lstatSync(file);assert.ok(!s.isSymbolicLink())
    if(name==='session'){assert.ok(s.isDirectory());visit(file,'session')}
    else {assert.ok(s.isFile()&&s.size<=P.metadataBytes);metadataBytes+=s.size;files.push({path:file.slice(resolve(output).length+1),bytes:s.size,sha256:fileHash(file)})}
  }
  for(const name of ['receipt.json','build.log']){const file=resolve(output,name);try{const s=lstatSync(file);assert.ok(s.isFile()&&!s.isSymbolicLink()&&s.size<=P.metadataBytes);metadataBytes+=s.size}catch(e){if(e.code!=='ENOENT')throw e}}
  assert.ok(traceBytes<=P.traceBytes&&sessionBytes<=P.sessionBytes&&metadataBytes<=P.metadataBytes,'Diagnostic artifact group cap')
  assert.ok(traceBytes+sessionBytes+metadataBytes<=P.totalBytes,'Diagnostic total cap')
  return {sessionBytes,traceBytes,metadataBytes,totalBytes:sessionBytes+traceBytes+metadataBytes,files}
}

export default async function ordinaryPointerTraceRoute({chromium,launch,url,output,source,expectedRevision,dist,browserIdentity,admit,receipt={},
  runSmoke=async args=>(await import('./ordinary-pointer-smoke.mjs')).default(args),
  capture=async args=>(await import('./ordinary-pointer-browser-adapter.mjs')).captureOrdinaryPointerBrowser(args),
  collector=captureOrdinaryPointerTraceDiagnostic,initialize=initializeOrdinaryTraceService,
  observe=async send=>(await import('./ordinary-pointer-trace-qualification.mjs')).observeOrdinaryTraceTarget(send),
  qualify=async evidence=>(await import('./ordinary-pointer-trace-qualification.mjs')).qualifyOrdinaryTrace(evidence),
  closeOwner=closeOrdinaryPointerSmokeOwner,now=()=>performance.now(),schedule=setTimeout,cancel=clearTimeout}){
  assert.equal(source.commit,expectedRevision);assert.match(source.commit,/^[a-f0-9]{40}$/);assert.match(browserIdentity.sha256,/^[a-f0-9]{64}$/);assert.equal(typeof admit,'function')
  const root=resolve(output,'ordinary-pointer-trace'),sessionOutput=resolve(root,'session');mkdirSync(root);mkdirSync(sessionOutput)
  Object.assign(receipt,{version:1,role:P.role,policy:P,status:'incomplete',comparisonEligible:false,interpretationEligible:false,
    sourceCommit:source.commit,expectedRevision,browserIdentity:{...browserIdentity}})
  let owner,metadataSession,timer,stopped=false,finalized=false,failed=false,primary,operationSettled=false,launchPending=false,
    started,last,sharedTraceBytes=0,initialClockFailed=false,initialClockError,smokeReceipt={},captureSettled=false,captureTask
  const safeClose=async action=>{try{return await closeOwner(action)}catch(error){return {confirmed:false,error}}}
  const verifyBrowser=()=>assert.equal(fileHash(browserIdentity.path),browserIdentity.sha256,'Exact Chrome binary changed')
  const save=()=>{if(!finalized){const text=ordinaryPointerSmokeArtifact(receipt);assert.ok(Buffer.byteLength(text)<=P.metadataBytes);writeFileSync(resolve(root,'route.json'),text)}}
  try{started=now();assert.ok(Number.isFinite(started)&&started>=0);last=started}catch(e){initialClockFailed=true;initialClockError=e;receipt.initialClockFailed=true}
  const check=()=>{if(initialClockFailed)throw initialClockError;const t=now();assert.ok(Number.isFinite(t)&&t>=last,'Monotonic trace route clock');last=t;assert.ok(!stopped&&t-started<P.activeMs,'Trace route deadline/terminal')}
  // Both raw streams share the existing cap; no extra allowance for initialization.
  const traceWrite=(fd,bytes)=>{check();assert.ok(sharedTraceBytes+bytes.length<=P.traceBytes,'Shared trace output cap');const count=writeSync(fd,bytes);sharedTraceBytes+=count;return count}
  const execute=async()=>{
    try{
      check();verifyBrowser();receipt.admission=await admit();check();save()
      assert.equal(receipt.admission.sha,source.commit);assert.equal(receipt.admission.currentMainVerified,true)
      launchPending=true;try{owner=await chromium.launch({...launch,timeout:P.launchMs})}finally{launchPending=false}
      check();receipt.browserVersion=owner.version();save()
      await runSmoke({browser:owner,url,output:sessionOutput,source,expectedRevision,dist,receipt:smokeReceipt,
        capture:args=>{
          captureTask=(async()=>{
          check();let value,localFailed=false,localError
          try{
            // This also consumes the unchanged smoke watchdog; it does not grant 90+10 seconds.
            assert.ok(P.activeMs-(last-started)>=102000,'Insufficient remaining fixed route budget for initialization and trace owner')
            const initialization=await initialize({browser:owner,page:args.page,output:sessionOutput,write:traceWrite});check()
            assert.equal(initialization.status,'initialized-unqualified','Initialization status')
            assert.equal(initialization.transportCleanupConfirmed,true,'Initialization cleanup')
            assert.equal(initialization.operationSettled,true,'Initialization pending operation')
            assert.equal(initialization.streamEof,true,'Initialization EOF');assert.equal(initialization.streamClosed,true,'Initialization stream close')
            assert.equal(initialization.interpretationEligible,false);assert.equal(initialization.comparisonEligible,false)
            receipt.initialization={status:initialization.status,bytes:initialization.bytes,transportCleanupConfirmed:true,interpretationEligible:false,comparisonEligible:false};save()
            metadataSession=await args.page.context().newCDPSession(args.page);check()
            const send=async(method,params)=>{check();const result=await metadataSession.send(method,params);check();return result}
            const before=await observe(send);check()
            const bindingPath=resolve(root,'binding.json')
            const saveBinding=(value,first=false)=>{check();const text=ordinaryPointerSmokeArtifact(value);assert.ok(Buffer.byteLength(text)<=P.metadataBytes);writeFileSync(bindingPath,text,first?{flag:'wx'}:undefined)}
            saveBinding({status:'observed-before',before},true)
            assert.ok(P.activeMs-(last-started)>=92000,'Insufficient remaining fixed route budget for trace owner')
            value=await collector({browser:owner,page:args.page,capture,output:sessionOutput,write:traceWrite});check()
            const after=await observe(send);check();saveBinding({status:'observed-before-after',before,after})
            const collectorReceipt=boundedJson(resolve(sessionOutput,'ordinary-pointer-diagnostic/receipt.json'),P.metadataBytes)
            assert.equal(collectorReceipt.status,'raw-stream-only-unqualified');assert.equal(collectorReceipt.streamEof,true)
            assert.equal(collectorReceipt.transportCleanupConfirmed,true);assert.equal(collectorReceipt.operationSettled,true)
            const tracePath=resolve(sessionOutput,'ordinary-pointer-diagnostic/trace.json.partial'),stat=lstatSync(tracePath)
            assert.ok(stat.isFile()&&!stat.isSymbolicLink()&&stat.size<=P.traceBytes)
            const bytes=readFileSync(tracePath)
            const qualification=await qualify({bytes,collector:collectorReceipt,before,after,browserVersion:receipt.browserVersion});check()
            receipt.qualification=qualification;receipt.traceSha256=hash(bytes)
            assert.equal(qualification.status,'target-envelope-bound-unqualified','Unsupported trace target envelope')
            assert.equal(qualification.traceSha256,hash(bytes),'Qualified trace identity mismatch')
            assert.equal(qualification.interpretationEligible,false);assert.equal(qualification.comparisonEligible,false)
            saveBinding({status:'target-envelope-bound-unqualified',before,after,qualification});save()
          }catch(e){localFailed=true;localError=e}
          finally{captureSettled=true;if(metadataSession){const session=metadataSession;const cleanup=await safeClose(()=>session.detach());if(!finalized)receipt.metadataSessionCleanup=cleanup;if(cleanup.confirmed)metadataSession=undefined;else if(!localFailed){localFailed=true;localError=Error('Metadata CDP cleanup unconfirmed')}}}
          if(localFailed)throw localError;return value
          })();return captureTask
        }})
      check();verifyBrowser();assert.equal(smokeReceipt.status,'passed');assert.equal(smokeReceipt.readerAdmission,'admitted')
      assert.equal(smokeReceipt.contextCleanup?.confirmed,true);assert.equal(smokeReceipt.browserCleanup?.confirmed,true);assert.equal(smokeReceipt.operationSettled,true)
      receipt.smoke={status:smokeReceipt.status,readerAdmission:smokeReceipt.readerAdmission,contextCleanup:true,browserCleanup:true,operationSettled:true};owner=undefined
      receipt.status='passed'
    }finally{
      // Await our capture promise as well as the smoke result: the smoke watchdog
      // may finish before an outstanding CDP operation settles. No second capture.
      if(captureTask)try{await captureTask}catch{}
      if(stopped&&owner){const lateOwner=owner;const cleanup=await safeClose(()=>lateOwner.close());if(!finalized)receipt.lateOwnerCleanup=cleanup;if(cleanup.confirmed&&owner===lateOwner)owner=undefined}
      operationSettled=true
    }
  }
  const operation=Promise.resolve().then(execute)
  try{save();await Promise.race([operation,new Promise((_,reject)=>{timer=schedule(()=>{stopped=true;reject(Error('Trace route active deadline'))},P.activeMs)})]);check()}
  catch(e){failed=true;primary=e;receipt.status='failed';receipt.failure=e}
  finally{
    stopped=true;try{cancel(timer)}catch(e){receipt.timerCleanupFailed=true;receipt.timerCleanupError=e;receipt.status='failed';if(!failed){failed=true;primary=e}}
    if(owner){const browser=owner;receipt.ownerCleanup=await safeClose(()=>browser.close());if(receipt.ownerCleanup.confirmed)owner=undefined}
    receipt.operationSettled=operationSettled;receipt.launchPending=launchPending;receipt.captureSettled=captureSettled
    receipt.cleanupVerified=operationSettled&&!launchPending&&!owner&&!metadataSession&&smokeReceipt.browserCleanup?.confirmed===true
    if(!receipt.cleanupVerified&&!failed){failed=true;primary=Error('Trace owner/operation cleanup uncertain');receipt.status='failed'}
    try{const ended=now();assert.ok(!initialClockFailed&&Number.isFinite(ended)&&ended>=last&&ended-started<P.routeMs,'Trace route deadline/clock');last=ended;receipt.elapsedMs=ended-started}
    catch(e){receipt.clockFailed=true;receipt.clockError=e;receipt.status='failed';if(!failed){failed=true;primary=e}}
    try{save();receipt.artifacts={phase:'before-final-receipt-write',...ordinaryPointerTraceFiles(output)};save();ordinaryPointerTraceFiles(output)}catch(e){receipt.artifactFailure=e;receipt.status='failed';if(!failed){failed=true;primary=e};try{save()}catch{}}
    // Artifact hashing and writes are part of this same fixed route budget.
    // Check again after them, and once after the final successful receipt write.
    try{
      const ended=now();assert.ok(!initialClockFailed&&Number.isFinite(ended)&&ended>=last&&ended-started<P.routeMs,'Trace finalization deadline/clock');last=ended
      receipt.elapsedMs=ended-started;save();ordinaryPointerTraceFiles(output)
      const returned=now();assert.ok(Number.isFinite(returned)&&returned>=last&&returned-started<P.routeMs,'Trace final receipt deadline/clock')
      // The outer runner retains this returned-object checkpoint; route.json's
      // elapsedMs is the immediately preceding persisted checkpoint.
      receipt.returnElapsedMs=returned-started
    }catch(e){receipt.clockFailed=true;receipt.clockError=e;receipt.status='failed';if(!failed){failed=true;primary=e};try{save()}catch(writeError){receipt.finalWriteFailed=true;receipt.finalWriteError=writeError}}
    finalized=true;operation.catch(()=>{})
  }
  if(failed)throw primary
  return receipt
}
