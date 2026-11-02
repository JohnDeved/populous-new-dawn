// Explicit supplied capture wrapper only; import never starts tracing or a browser.
import assert from 'node:assert/strict'
import {mkdirSync,lstatSync,openSync,writeSync,closeSync,writeFileSync} from 'node:fs'
import {resolve} from 'node:path'

export const ordinaryTraceInitializationPolicy=Object.freeze({version:1,role:'metadata-only-service-initialization-experiment',
  activeMs:8000,cleanupMs:2000,totalMs:10000,traceBytes:1024*1024,chunkBytes:64*1024,metadataBytes:1024*1024,
  processes:32,errors:64,categories:Object.freeze(['devtools.timeline','disabled-by-default-devtools.timeline','v8','disabled-by-default-v8.gc',
    'disabled-by-default-v8.cpu_profiler','blink.user_timing'])})
const P=ordinaryTraceInitializationPolicy
const describe=e=>{try{return String(e).slice(0,256)}catch{return 'Unprintable error'}}
function decodedChunk(row){
  assert.ok(row&&typeof row.data==='string'&&typeof row.eof==='boolean','Invalid trace chunk')
  assert.ok(row.data.length<=P.chunkBytes*2,'Encoded chunk bound')
  assert.ok(row.base64Encoded===undefined||typeof row.base64Encoded==='boolean')
  if(row.base64Encoded)assert.match(row.data,/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,'Malformed base64')
  const bytes=Buffer.from(row.data,row.base64Encoded?'base64':'utf8')
  assert.ok(bytes.length<=P.chunkBytes,'Decoded chunk bound')
  assert.ok(bytes.length>0||row.eof,'Empty nonterminal trace chunk')
  return bytes
}

// Dormant prerequisite experiment only. Caller owns an exclusive browser and the outer
// route deadline. No workload callback exists; normal collector admission remains required.
export async function initializeOrdinaryTraceService({browser,page,output,
  now=()=>performance.now(),schedule=setTimeout,cancel=clearTimeout,write=writeSync}){
  assert.ok(lstatSync(output).isDirectory()&&!lstatSync(output).isSymbolicLink())
  const directory=resolve(output,'ordinary-pointer-trace-initialization');mkdirSync(directory,{mode:0o700})
  const path=resolve(directory,'trace.json.partial'),fd=openSync(path,'wx',0o600)
  const receipt={version:1,traceOwner:'page-cdp',role:P.role,comparisonEligible:false,interpretationEligible:false,status:'incomplete',
    policy:P,bytes:0,errors:[],pending:0,observerCleanupConfirmed:false,transportCleanupConfirmed:false,
    boundaries:'initialization only; no workload, sampling or category capability claim',schemaQualification:'not-performed'}
  let session,target,stream,complete,traceStarted=false,endRequested=false,completionInvalid=false,traceStartRequested=false,stopped=false,frozen=false,failed=false,primary,
    activeTimer,cleanupTimer,cleanupStarted,operationSettled=false,fdClosed=false,last,start,clockFailed=false
  const error=(stage,e)=>{if(frozen)return;if(receipt.errors.length<P.errors)receipt.errors.push({stage,message:describe(e)});else receipt.errorOverflow=true}
  const clock=()=>{const t=now();assert.ok(Number.isFinite(t)&&t>=0&&(last===undefined||t>=last),'Monotonic diagnostic clock');last=t;return t}
  const check=()=>{assert.equal(stopped,false,'Diagnostic terminal');assert.ok(clock()-start<P.activeMs,'Diagnostic active deadline')}
  const cleanupCheck=()=>{const t=clock();assert.ok(!frozen&&t-cleanupStarted<P.cleanupMs&&t-start<P.totalMs,'Diagnostic cleanup deadline')}
  const send=async(s,method,args,cleanup=false)=>{
    if(!cleanup)check();else cleanupCheck();assert.equal(frozen,false,'Diagnostic receipt frozen');receipt.pending++
    try{const result=await s.send(method,args);if(cleanup)cleanupCheck();return result}finally{if(!frozen)receipt.pending--}
  }
  let resolveComplete
  const completion=new Promise(resolve=>{resolveComplete=resolve})
  const onComplete=row=>{if(frozen)return;
    if(!endRequested||complete!==undefined){completionInvalid=true;stopped=true;receipt.invalidCompletion={premature:!endRequested,duplicate:complete!==undefined,streamPresent:typeof row?.stream==='string'};error('trace-complete','Premature or duplicate completion')}
    if(!endRequested)return // Never retain or close an unowned premature stream.
    if(complete===undefined){
      const valid=typeof row?.stream==='string'&&row.stream.length>0&&row.stream.length<=256
      if(!valid){completionInvalid=true;stopped=true;receipt.invalidStreamHandle=true;error('trace-complete','Invalid bounded stream handle')}
      complete={dataLossOccurred:row?.dataLossOccurred};receipt.traceDataLossOccurred=row?.dataLossOccurred;if(valid)stream=row.stream;resolveComplete(complete)
    }
  }
  const onData=()=>{if(!frozen){receipt.unexpectedDataCollected=true;stopped=true;error('trace','Unexpected dataCollected; stream mode required')}}
  const metadata=()=>{const text=JSON.stringify(receipt,null,2)+'\n';assert.ok(Buffer.byteLength(text)<=P.metadataBytes,'Diagnostic metadata cap');return text}
  const retain=(key,value)=>{assert.ok(Buffer.byteLength(JSON.stringify(value))<=128*1024,'Diagnostic metadata cap');receipt[key]=value;metadata()}
  const inventory=async(label,cleanup=false)=>{
    const available=await send(target,'Tracing.getCategories',{},cleanup),categories=available?.categories
    receipt[label]={returnedCount:Array.isArray(categories)?categories.length:null,retained:false};metadata()
    assert.ok(Array.isArray(categories)&&categories.length<=2048,'Trace category inventory bound')
    assert.ok(Array.from(categories).every(c=>typeof c==='string'&&c.length>0&&c.length<=256),'Invalid bounded trace category name')
    retain(label,{returnedCount:categories.length,retained:true,returnedCategories:[...categories],missingRequired:P.categories.filter(c=>!categories.includes(c))})
    return categories
  }
  const operation=Promise.resolve().then(async()=>{
    try{
      check();receipt.pending++;try{session=await browser.newBrowserCDPSession()}finally{if(!frozen)receipt.pending--}check()
      
      receipt.pending++;try{target=await page.context().newCDPSession(page)}finally{if(!frozen)receipt.pending--}check()
      target.on('Tracing.tracingComplete',onComplete);target.on('Tracing.dataCollected',onData)
      retain('target',(await send(target,'Target.getTargetInfo')).targetInfo)
      retain('browser',await send(session,'Browser.getVersion'))
      await inventory('beforeInitialization')
      traceStartRequested=true;receipt.traceStartRequested=true
      await send(target,'Tracing.start',{transferMode:'ReturnAsStream',streamFormat:'json',streamCompression:'none',
        traceConfig:{recordMode:'recordUntilFull',traceBufferSizeInKb:64,enableSampling:false,enableSystrace:false,
          includedCategories:[],excludedCategories:['*']}})
      traceStarted=true;receipt.traceStartConfirmed=true;check()
    }finally{operationSettled=true}
  })
  try{
    start=clock()
    await Promise.race([operation,new Promise((_,reject)=>{activeTimer=schedule(()=>{stopped=true;reject(Error('Diagnostic active deadline'))},P.activeMs)})])
    check()
  }catch(e){failed=true;primary=e;error('capture-or-trace',e)}
  finally{
    stopped=true
    try{cancel(activeTimer)}catch(e){error('active-timer',e);if(!failed){failed=true;primary=e}}
    try{cleanupStarted=clock()}catch(e){cleanupStarted=last;error('cleanup-clock',e);if(!failed){failed=true;primary=e}}
    const cleanup=Promise.resolve().then(async()=>{
      let drainFailed=false,drainError
      try{
        if(traceStarted){endRequested=true;await send(target,'Tracing.end',{},true);await completion
          assert.equal(completionInvalid,false,'Invalid trace completion ordering')
          assert.ok(complete&&complete.dataLossOccurred===false&&typeof stream==='string','Trace incomplete/loss or missing stream')
          assert.equal(receipt.unexpectedDataCollected,undefined,'Unexpected trace transport')
          while(true){const row=await send(target,'IO.read',{handle:stream,size:P.chunkBytes},true),bytes=decodedChunk(row)
            assert.equal(frozen,false);assert.ok(receipt.bytes+bytes.length<=P.traceBytes,'Trace output cap')
            const written=write(fd,bytes);assert.ok(Number.isInteger(written)&&written>=0&&written<=bytes.length,'Invalid write count');receipt.bytes+=written;assert.equal(written,bytes.length,'Short trace write');assert.equal(completionInvalid,false,'Invalid trace completion ordering');if(row.eof){assert.ok(receipt.bytes>0,'Empty trace stream');receipt.streamEof=true;break}}
          await send(target,'IO.close',{handle:stream},true);receipt.streamClosed=true
          const categories=await inventory('afterInitialization',true)
          assert.ok(P.categories.every(c=>categories.includes(c)),'Required trace category unavailable after initialization')
        }
      }catch(e){drainFailed=true;drainError=e;error('trace-drain',e)}finally{
        let cleanupFailure=false,cleanupError
        const finish=async(stage,fn)=>{if(frozen)return;receipt.pending++;try{cleanupCheck();await fn();cleanupCheck()}catch(e){error(stage,e);if(!cleanupFailure){cleanupFailure=true;cleanupError=e}}finally{if(!frozen)receipt.pending--}}
        if(stream&&target&&!receipt.streamClosed)await finish('stream-close',async()=>{await send(target,'IO.close',{handle:stream},true);if(!frozen)receipt.streamClosed=true})
        if(target)await finish('target-detach',async()=>{target.off('Tracing.tracingComplete',onComplete);target.off('Tracing.dataCollected',onData);await target.detach();if(!frozen)receipt.targetDetached=true})
        if(session)await finish('session-detach',async()=>{await session.detach();if(!frozen)receipt.sessionDetached=true})
        if(cleanupFailure&&!drainFailed){drainFailed=true;drainError=cleanupError}
      }
      if(drainFailed)throw drainError
    })
    try{await Promise.race([cleanup,new Promise((_,reject)=>{cleanupTimer=schedule(()=>reject(Error('Diagnostic cleanup deadline')),P.cleanupMs)})])}
    catch(e){error('cleanup',e);receipt.cleanupFailed=true;if(!failed){failed=true;primary=e}}
    finally{try{cancel(cleanupTimer)}catch(e){error('cleanup-timer',e);if(!failed){failed=true;primary=e}}}
    try{cleanupCheck()}catch(e){receipt.cleanupFailed=true;error('cleanup-boundary',e);if(!failed){failed=true;primary=e}}
    if(completionInvalid){receipt.cleanupFailed=true;if(!failed){failed=true;primary=Error('Invalid trace completion ordering')}}
    receipt.operationSettled=operationSettled
    receipt.transportCleanupConfirmed=operationSettled&&receipt.pending===0&&!!receipt.sessionDetached&&!!receipt.targetDetached&&(!traceStartRequested||receipt.streamClosed===true)&&!receipt.cleanupFailed
    receipt.observerCleanupConfirmed=false // No observer or workload was installed.
    if(!receipt.transportCleanupConfirmed&&!failed){failed=true;primary=Error('Diagnostic transport cleanup unconfirmed');error('cleanup',primary)}
    try{receipt.elapsedMs=clock()-start}catch(e){clockFailed=true;error('clock',e);if(!failed){failed=true;primary=e}}
    receipt.clockFailed=clockFailed;receipt.status=failed?'failed':'initialized-unqualified'
    try{closeSync(fd);fdClosed=true;// Raw partial-name file deliberately retained: syntax/schema/markers are not qualified here.
      writeFileSync(resolve(directory,'receipt.json'),metadata(),{flag:'wx',mode:0o600})}
    catch(e){if(!failed){failed=true;primary=e}}finally{frozen=true;if(!fdClosed)try{closeSync(fd)}catch{}}
    operation.catch(()=>{});cleanup.catch(()=>{})
  }
  if(failed)throw primary
  return structuredClone(receipt)
}
