import test from 'node:test'
import assert from 'node:assert/strict'
import { URL,APP,LIMITS,Budget,Counts,HeldStartup,admitTarget,guardDocumentResponse,admitDeployment,admitRuntime,hydrationDiagnostic } from './policy.mjs'
const deployment=()=>({version:1,sha:APP,source:42236689124,sourceAttempt:1,pr:885,status:'preview-published',output:'Worker Version ID: 49ad051f-3138-456f-ac4e-2fdf91bc1cb3\nVersion Preview URL: '+URL.slice(0,-1)+'\n'})
test('exact deployment and admission are required before browser import/launch',()=>{
  admitDeployment(deployment());admitRuntime({approved:true,bindingSha256:'bound'},'bound')
  for(const [key,value] of [['sha','81beb'],['source',1],['sourceAttempt',2],['pr',1],['status','prepared'],['version',2],['output','Version Preview URL: https://alias.example/']])assert.throws(()=>admitDeployment({...deployment(),[key]:value}))
  assert.throws(()=>admitRuntime({approved:false,bindingSha256:'bound'},'bound'))
  assert.throws(()=>admitRuntime({approved:true,bindingSha256:'old'},'bound'))
})
test('fixed top-level request identity rejects aliases and redirected requests',()=>{
  admitTarget(URL,false)
  for(const value of ['https://example.com/',URL+'?probe=1',URL+'other',URL.replace('49ad051f-','')])assert.throws(()=>admitTarget(value,false))
  assert.throws(()=>admitTarget(URL,true))
})
for(const failure of ['none','same-origin-redirect','off-origin-redirect','bad-status','wrong-url','non-html','oversized','timeout','fetch-error','body-error','fulfill-error','wrong-request','redirected-request'])test('actual document decision: '+failure,async()=>{
  let fetched=0,fulfilled=0,disposed=0,continued=0
  const body=Buffer.from('<html>original</html>')
  const response={
    url:()=>failure==='wrong-url'?'https://example.com/':URL,
    status:()=>failure.endsWith('-redirect')?302:failure==='bad-status'?503:200,
    headers:()=>({'content-type':failure==='non-html'?'text/plain':'text/html',location:failure==='off-origin-redirect'?'https://example.com/':URL}),
    body:async()=>{if(failure==='body-error')throw Error('body failure');return failure==='oversized'?{length:LIMITS.htmlBytes+1}:body},
    dispose:async()=>{disposed++}
  }
  const route={
    request:()=>({url:()=>failure==='wrong-request'?'https://example.com/':URL,redirectedFrom:()=>failure==='redirected-request'?{}:null}),
    fetch:async options=>{fetched++;assert.deepEqual(options,{maxRedirects:0,maxRetries:0,timeout:37});if(['timeout','fetch-error'].includes(failure))throw Error(failure);return response},
    fulfill:async options=>{fulfilled++;assert.equal(options.response,response);assert.equal(options.body,body);if(failure==='fulfill-error')throw Error('fulfill failed')},
    continue:async()=>{continued++;throw Error('Forbidden fallback')}
  }
  if(failure==='none')await guardDocumentResponse(route,37)
  else await assert.rejects(guardDocumentResponse(route,37))
  const requestRejected=['wrong-request','redirected-request'].includes(failure)
  assert.equal(fetched,requestRejected?0:1)
  assert.equal(fulfilled,['none','fulfill-error'].includes(failure)?1:0)
  assert.equal(disposed,requestRejected||['timeout','fetch-error'].includes(failure)?0:1)
  assert.equal(continued,0)
})
test('fixed deadlines clip nested waits and never reset',()=>{
  let now=0;const b=new Budget(()=>now,45000,40000);assert.equal(b.left(5000),5000)
  now=39000;assert.equal(b.left(5000),1000);now=40000;assert.throws(()=>b.left())
})
test('successful held observation precedes release and original response completion',()=>{
  let now=0;const held=new HeldStartup(()=>now);held.intercept();now=2000;held.observation();now=2100;assert.equal(held.release('observed'),true);assert.equal(held.release('cleanup'),false);now=2500;held.complete(200);held.verify()
})
for(const failure of ['missing','duplicate','late-observation','released-before-observation','deadline-release','late-release','missing-response','bad-response'])test('held negative: '+failure,()=>{
  let now=0;const h=new HeldStartup(()=>now)
  assert.throws(()=>{
    if(failure==='missing'){h.observation();return}
    h.intercept();if(failure==='duplicate'){h.intercept();return}
    if(failure==='late-observation')now=3001
    if(failure==='released-before-observation')h.release('deadline')
    h.observation();now=failure==='late-release'?4001:2100;h.release(failure==='deadline-release'?'deadline':'observed')
    if(failure!=='missing-response')h.complete(failure==='bad-response'?500:200)
    h.verify()
  })
})
test('finite context/navigation counters reject overflow',()=>{
  const c=new Counts();for(let i=0;i<LIMITS.contexts;i++)c.context();assert.throws(()=>c.context())
  for(let i=0;i<LIMITS.navigations;i++)c.navigation(URL,false);assert.throws(()=>c.navigation(URL,false))
})
test('saved evidence budgets reject excess without allocating large images',()=>{
  const c=new Counts();assert.throws(()=>c.record('image',LIMITS.imageBytes+1));assert.equal(c.images,0)
  for(let i=0;i<8;i++)c.record('image',1);assert.throws(()=>c.record('image',1))
  for(let i=0;i<6;i++)c.record('html',1);assert.throws(()=>c.record('html',1))
  assert.throws(()=>c.record('json',LIMITS.evidenceBytes));assert.throws(()=>c.record('html',-1))
})
test('diagnostic overflow and hydration recovery cannot disappear as success',()=>{
  const c=new Counts();assert.throws(()=>c.diagnostic('x'.repeat(LIMITS.diagnosticChars+1)))
  for(const text of ['Hydration failed','server-rendered mismatch','Minified React error #418;'])assert.equal(hydrationDiagnostic(text),true)
  assert.equal(hydrationDiagnostic('software renderer warning'),false)
})
