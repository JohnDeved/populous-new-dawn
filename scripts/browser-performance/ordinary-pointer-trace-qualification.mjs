// Passive observed-envelope validation only. No browser launch, trace or causal inference.
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
const maxBytes=8*1024*1024,maxEvents=100000
const text=(v,max=256)=>typeof v==='string'&&v.length>0&&v.length<=max
const id=v=>Number.isSafeInteger(v)&&v>=0
const positive=v=>id(v)&&v>0
const finite=v=>Number.isFinite(v)&&v>=0
const traceUrl=value=>{const url=new URL(value);url.hash='';return url.href}
const hash=bytes=>createHash('sha256').update(bytes).digest('hex')
function observation(value){
 assert.ok(value&&typeof value==='object')
 const t=value.targetInfo,f=value.rootFrame
 assert.ok(t&&text(t.targetId)&&t.type==='page'&&text(t.url,4096))
 assert.ok(f&&text(f.id)&&text(f.loaderId)&&text(f.url,4096)&&f.parentId===undefined,'Owned root frame required')
 assert.ok(t.browserContextId===undefined||text(t.browserContextId));assert.equal(t.url,f.url,'Target/root URL differs');assert.ok(text(value.isolateId),'Isolate observation required')
 assert.ok(Array.isArray(value.domains)&&value.domains.length<=128)
 assert.ok(value.domains.every(d=>text(d.name,64)&&text(d.version,64)));assert.equal(new Set(value.domains.map(d=>d.name)).size,value.domains.length)
 return value
}
// Caller supplies its exclusively owned page CDP send with outer deadline/cleanup.
// This helper does not own or detach that session, and installs no listeners.
export async function observeOrdinaryTraceTarget(send){
 assert.equal(typeof send,'function')
 const bounded=async method=>{const r=await send(method);assert.ok(Buffer.byteLength(JSON.stringify(r))<=128*1024,'Target observation byte cap');return r}
 const t=await bounded('Target.getTargetInfo'),f=await bounded('Page.getFrameTree'),i=await bounded('Runtime.getIsolateId'),s=await bounded('Schema.getDomains')
 const targetInfo={targetId:t.targetInfo?.targetId,type:t.targetInfo?.type,url:t.targetInfo?.url,
  ...(t.targetInfo?.browserContextId!==undefined?{browserContextId:t.targetInfo.browserContextId}:{})}
 const root=f.frameTree?.frame,rootFrame={id:root?.id,loaderId:root?.loaderId,url:root?.url,
  ...(root?.parentId!==undefined?{parentId:root.parentId}:{})}
 return observation({targetInfo,rootFrame,isolateId:i.id,domains:s.domains?.map(d=>({name:d.name,version:d.version})).sort((a,b)=>a.name.localeCompare(b.name))})
}
function traceEvent(e){
 assert.ok(e&&typeof e==='object'&&text(e.name)&&text(e.ph,1)&&typeof e.cat==='string'&&e.cat.length<=1024,'Malformed trace event')
 assert.ok(id(e.pid)&&id(e.tid)&&finite(e.ts),'Malformed trace event identity/time')
 return e
}
const category=(e,name)=>e.cat.split(',').includes(name)
function stableObservation(before,after){
 observation(before);observation(after)
 assert.deepEqual(before.targetInfo,after.targetInfo,'Target changed')
 assert.deepEqual(before.rootFrame,after.rootFrame,'Root frame/navigation changed')
 assert.equal(before.isolateId,after.isolateId,'Observed isolate changed')
 assert.deepEqual(before.domains,after.domains,'Observed protocol domains changed')
}
export function qualifyOrdinaryTrace({bytes,collector,before,after,browserVersion}){
 assert.ok(Buffer.isBuffer(bytes)&&bytes.length>0&&bytes.length<=maxBytes,'Trace byte cap')
 assert.ok(collector&&collector.version===2&&collector.traceOwner==='page-cdp','Owned page collector required')
 assert.equal(collector.status,'raw-stream-only-unqualified')
 assert.equal(collector.bytes,bytes.length,'Trace byte receipt mismatch')
 for(const key of ['streamEof','streamClosed','targetDetached','sessionDetached','traceStartConfirmed','operationSettled','transportCleanupConfirmed','observerCleanupConfirmed'])assert.equal(collector[key],true,`Incomplete collector ${key}`)
 for(const key of ['traceDataLossOccurred','clockFailed','comparisonEligible','interpretationEligible'])assert.equal(collector[key],false,`Invalid collector ${key}`)
 for(const key of ['cleanupFailed','errorOverflow','invalidCompletion','invalidStreamHandle','unexpectedDataCollected'])assert.equal(collector[key],undefined,`Failed collector ${key}`)
 assert.equal(collector.pending,0);assert.deepEqual(collector.errors,[])
 assert.ok(text(browserVersion,128));assert.ok(['Chrome/','HeadlessChrome/'].some(prefix=>collector.browser?.product===prefix+browserVersion),'Browser version mismatch')
 stableObservation(before,after)
 assert.equal(collector.target?.targetId,before.targetInfo.targetId,'Collector target differs')
 assert.equal(collector.target?.url,before.targetInfo.url,'Collector target URL differs')
 const parsed=JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(bytes))
 assert.ok(parsed&&Array.isArray(parsed.traceEvents)&&parsed.traceEvents.length>0&&parsed.traceEvents.length<=maxEvents,'Trace event cap/schema')
 const events=parsed.traceEvents.map(traceEvent),frame=before.rootFrame.id
 const starts=events.filter(e=>e.name==='TracingStartedInBrowser')
 assert.equal(starts.length,1,'One browser frame-tree trace metadata event required')
 const start=starts[0];assert.equal(start.ph,'I');assert.ok(category(start,'disabled-by-default-devtools.timeline'))
 assert.equal(start.args?.data?.persistentIds,true)
 assert.ok(Array.isArray(start.args.data.frames)&&start.args.data.frames.length<=128,'Bounded trace frame tree required')
 const matches=start.args.data.frames.filter(f=>f.frame===frame)
 assert.equal(matches.length,1,'Missing/ambiguous observed root-frame mapping')
 const mapped=matches[0];assert.ok(positive(mapped.processId),'Renderer process mapping required')
 assert.equal(mapped.url,traceUrl(before.rootFrame.url));assert.equal(mapped.parent,undefined);assert.equal(mapped.isOutermostMainFrame,true)
 const pid=mapped.processId
 for(const list of [collector.processesBefore,collector.processesAfter]){
  assert.ok(Array.isArray(list)&&list.length<=32)
  const rows=list.filter(p=>p.id===pid);assert.equal(rows.length,1,'Renderer process inventory absent/ambiguous')
  assert.equal(rows[0].type,'renderer');assert.ok(finite(rows[0].cpuTime))
 }
 const cpuBefore=collector.processesBefore.find(p=>p.id===pid).cpuTime,cpuAfter=collector.processesAfter.find(p=>p.id===pid).cpuTime
 assert.ok(cpuAfter>=cpuBefore,'Renderer CPU counter reversed')
 for(const e of events.filter(e=>['FrameCommittedInBrowser','ProcessReadyInBrowser','FrameDeletedInBrowser'].includes(e.name)&&e.args?.data?.frame===frame)){
  assert.notEqual(e.name,'FrameDeletedInBrowser','Root frame deleted during trace')
  assert.equal(e.args.data.processId,pid,'Renderer process changed during trace')
  if(e.args.data.url!==undefined)assert.equal(e.args.data.url,mapped.url,'Frame URL changed during trace')
 }
 const mains=events.filter(e=>e.ph==='M'&&e.name==='thread_name'&&e.pid===pid&&e.args?.name==='CrRendererMain')
 const tids=[...new Set(mains.map(e=>e.tid))];assert.equal(tids.length,1,'Renderer main thread absent/ambiguous');const tid=tids[0];assert.ok(positive(tid),'Invalid renderer main thread')
 const marks=['pnd-ordinary-diagnostic-capture-start','pnd-ordinary-diagnostic-capture-end'].map(name=>{
  const found=events.filter(e=>e.name===name);assert.equal(found.length,1,'Missing/duplicate capture marker')
  const e=found[0];assert.ok(category(e,'blink.user_timing')&&['I','R','n'].includes(e.ph),'Invalid observed user timing mark schema')
  assert.equal(e.pid,pid,'Marker renderer mismatch');assert.equal(e.tid,tid,'Marker thread mismatch');return e
 })
 assert.ok(marks[1].ts>marks[0].ts&&start.ts<=marks[0].ts,'Capture marker chronology invalid')
 return {version:1,status:'target-envelope-bound-unqualified',traceSha256:hash(bytes),events:events.length,
  binding:{targetId:before.targetInfo.targetId,rootFrameId:frame,rendererPid:pid,mainThreadTid:tid},
  captureEnvelope:{startTraceUs:marks[0].ts,endTraceUs:marks[1].ts,scope:'whole capture wrapper, not projection spans'},
  processCpu:{beforeSeconds:cpuBefore,afterSeconds:cpuAfter,scope:'all renderer threads, not projection CPU'},
  observedStableIsolateId:before.isolateId,isolateThreadBinding:'unqualified',
  samplingSchema:'unqualified',gcCoverage:'unqualified',stackSourceBinding:'unqualified',clockToFrames:'unqualified',
  interpretationEligible:false,comparisonEligible:false}
}
