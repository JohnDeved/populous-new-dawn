import test from 'node:test'
import assert from 'node:assert/strict'
import { createCaptureProtocolCollector } from '../scripts/tutorial-browser/capture-protocol-collector.mjs'
const request = (id=1,sessionId='SESSION',method='Page.captureScreenshot') => `pw:protocol SEND ► ${JSON.stringify({id,method,params:{secret:'DO_NOT_RETAIN'},sessionId})}\n`
const response = (id=1,sessionId='SESSION',error=false) => `pw:protocol ◀ RECV ${JSON.stringify({id,[error?'error':'result']:{data:'DO_NOT_RETAIN'},sessionId})}\n`
test('targeted sends with invalid identities are counted rather than silently lost',()=>{
  const c=createCaptureProtocolCollector({enabled:true})
  for(const [id,sessionId] of [[0,'S'],[9007199254740992,'S'],[1,''],[1,'bad space'],[1,null]])
    c.push(`pw:protocol SEND ► ${JSON.stringify({id,method:'Page.captureScreenshot',sessionId})}\n`)
  const r=c.finish();assert.equal(r.malformed,5);assert.equal(r.events.length,0)
})
test('astral character crossing UTF-16 carry bound is discarded before append',()=>{
  const c=createCaptureProtocolCollector({enabled:true});c.push('x'.repeat(2047)+'😀\n')
  assert.equal(c.finish().overlongLines,1)
})
test('duplicate pending identity cannot produce a falsely paired response',()=>{
  const c=createCaptureProtocolCollector({enabled:true});c.push(request()+request()+response())
  const r=c.finish();assert.equal(r.malformed,1);assert.equal(r.unfinished,1)
  assert.deepEqual(r.events.map(x=>x.phase),['sent','censored']);assert.equal(r.events[1].ambiguous,true)
})
test('unrelated SEND reusing a pending identity also invalidates response pairing',()=>{
  const c=createCaptureProtocolCollector({enabled:true});c.push(request()+request(1,'SESSION','Runtime.evaluate')+response())
  const r=c.finish();assert.equal(r.malformed,1);assert.equal(r.unfinished,1)
  assert.deepEqual(r.events.map(x=>x.phase),['sent','censored']);assert.equal(r.events[1].ambiguous,true)
})
test('default disabled does not coerce input or call clock',()=>{
  const c=createCaptureProtocolCollector({clock:()=>assert.fail('clock')});c.push({toString:()=>assert.fail('coercion')})
  assert.deepEqual(c.finish().events,[])
})
test('split chunks correlate two inner commands and retain only bounded metadata',()=>{
  let n=10;const c=createCaptureProtocolCollector({enabled:true,clock:()=>n+=5})
  const text=request(1,'S','Page.getLayoutMetrics')+response(1,'S')+request(2,'S')+response(2,'S')
  for(let i=0;i<text.length;i+=7)c.push(text.slice(i,i+7))
  const r=c.finish();assert.equal(r.events.length,4);assert.deepEqual(r.events.filter(e=>e.intervalMs).map(e=>e.intervalMs),[5,5])
  assert.doesNotMatch(JSON.stringify(r),/DO_NOT_RETAIN|params|data|SESSION/)
})
test('capped response identity is correlated without retaining PNG base64',()=>{
  const c=createCaptureProtocolCollector({enabled:true});c.push(request());c.push('pw:protocol ◀ RECV {"id":1,"result":{"data":"DO_NOT_RETAIN <<<<<( LOG TRUNCATED )>>>>> DO_NOT_RETAIN"},"sessionId":"SESSION"}\n')
  const r=c.finish();assert.equal(r.events[1].phase,'response');assert.equal(r.events[1].truncated,true);assert.doesNotMatch(JSON.stringify(r),/DO_NOT_RETAIN/)
})
test('non-JSON truncation only recovers anchored top-level response identity',()=>{
  const c=createCaptureProtocolCollector({enabled:true});c.push(request());
  c.push('pw:protocol ◀ RECV {"id":1,"result":{"data":"DO_NOT_RETAIN <<<<<( LOG TRUNCATED )>>>>> ,"sessionId":"SESSION"}\n')
  const r=c.finish();assert.equal(r.events[1].phase,'response');assert.equal(r.events[1].truncated,true);assert.doesNotMatch(JSON.stringify(r),/DO_NOT_RETAIN/)
})
test('enabled collector requires decoded strings rather than splitting UTF-8 arrows',()=>{
  const c=createCaptureProtocolCollector({enabled:true});assert.throws(()=>c.push(Buffer.from('raw')),TypeError)
})
test('unmatched session and unrelated methods cannot settle a capture',()=>{
  const c=createCaptureProtocolCollector({enabled:true});c.push(request()+response(1,'OTHER')+request(2,'S','Runtime.evaluate')+response(2,'S'))
  const r=c.finish();assert.equal(r.unfinished,1);assert.deepEqual(r.events.map(x=>x.phase),['sent','censored'])
})
test('error response retained as outcome only and unfinished capture stays censored',()=>{
  const c=createCaptureProtocolCollector({enabled:true});c.push(request()+response(1,'SESSION',true)+request(2))
  const r=c.finish();assert.deepEqual(r.events.map(x=>x.phase),['sent','error-response','sent','censored']);assert.equal(r.unfinished,1)
})
test('malformed or incomplete response cannot create success',()=>{
  const c=createCaptureProtocolCollector({enabled:true});c.push(request()+'pw:protocol ◀ RECV {"id":1,"sessionId":"SESSION"}\n'+'pw:protocol ◀ RECV broken\n')
  const r=c.finish();assert.equal(r.malformed,2);assert.equal(r.unfinished,1)
})
test('overlong unbroken input is discarded with bounded carry and parser resumes',()=>{
  const c=createCaptureProtocolCollector({enabled:true});c.push('X'.repeat(100000));c.push('\n'+request()+response())
  const r=c.finish();assert.equal(r.overlongLines,1);assert.equal(r.events.length,2)
})
test('clock failure and reversal do not manufacture duration',()=>{
  for(const clock of [()=>{throw null},(()=>{let n=10;return ()=>--n})()]){
    const c=createCaptureProtocolCollector({enabled:true,clock});c.push(request()+response());assert.equal(c.finish().events[1].intervalMs,null)
  }
})
test('pending and event caps remain bounded; finish is idempotent and closes ingestion',()=>{
  const c=createCaptureProtocolCollector({enabled:true});for(let id=1;id<=200;id++)c.push(request(id)+response(id))
  for(let id=201;id<=250;id++)c.push(request(id))
  const r=c.finish();assert.equal(r.events.length,128);assert.equal(r.unfinished,16);assert.ok(r.dropped>0)
  c.push(request(999));assert.deepEqual(c.finish(),r);assert.ok(JSON.stringify(r).length<32768)
})
