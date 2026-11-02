import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {browserScenarios,browserCapMs} from '../scripts/tutorial-browser/scenario-policy.mjs'
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8')
const source=read('scripts/tutorial-browser/run.mjs')
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor
function between(a,b){const start=source.indexOf(a),end=source.indexOf(b,start);assert.ok(start>=0&&end>start);return source.slice(start,end)}
test('trace is explicit 180s, all other caps remain unchanged; runner pin exact',()=>{
 assert.ok(browserScenarios.includes('ordinary-pointer-trace'));assert.equal(browserCapMs('ordinary-pointer-trace'),180000)
 assert.equal(browserCapMs('ordinary-pointer-calibration'),1200000);assert.equal(browserCapMs('ordinary-pointer-smoke'),90000);assert.equal(browserCapMs('tutorial'),240000)
 assert.equal(JSON.parse(read('scripts/tutorial-browser/capture-qualified-inputs.json'))['scripts/tutorial-browser/run.mjs'],createHash('sha256').update(source).digest('hex'))
 assert.ok(source.includes("['snapshot-protocol', 'ordinary-pointer-smoke', 'ordinary-pointer-calibration', 'ordinary-pointer-trace', 'query-art-evidence'].includes(selectedScenario)"))
 assert.match(source,/ordinaryPointerTraceSelection\(JSON.parse\(readFileSync\(process.env.GITHUB_EVENT_PATH, 'utf8'\)\),\s*traceCommentEnvironment\)/)
 assert.match(source,/ordinary-pointer-trace\/route.json/)
})
test('actual owner token snapshot precedes deletion and descendant environment; no unrelated deletion',()=>{
 const block=between('const calibrationCommentEnvironment =','const root =')
 const run=new Function('process','captureDescendantEnvironment',block+';return {traceCommentEnvironment,calibrationCommentEnvironment,descendantEnv}')
 for(const scenario of ['ordinary-pointer-trace','ordinary-pointer-calibration','tutorial']){
  const process={env:{POPULOUS_BROWSER_SCENARIO:scenario,GITHUB_EVENT_NAME:'issue_comment',GH_TOKEN:'owner-only'}}
  const result=run(process,env=>({...env}))
  if(scenario==='ordinary-pointer-trace')assert.equal(result.traceCommentEnvironment.GH_TOKEN,'owner-only')
  if(scenario==='ordinary-pointer-calibration')assert.equal(result.calibrationCommentEnvironment.GH_TOKEN,'owner-only')
  assert.equal(result.descendantEnv.GH_TOKEN,scenario==='tutorial'?'owner-only':undefined)
 }
})
test('actual launch block creates no preliminary browser for trace, preserves smoke',async()=>{
 const block=between("  if (!['ordinary-pointer-calibration', 'ordinary-pointer-trace'].includes(selectedScenario)) {",'  receipt.browserCapMs')
 const run=new AsyncFunction('selectedScenario','chromium','captureProtocolEnabled','browserConfig','descendantEnv','receipt','save','let browser;'+block+';return browser')
 let launches=0;const chromium={launch:async()=>{launches++;return{version:()=> 'version'}}}
 assert.equal(await run('ordinary-pointer-trace',chromium,false,{launch:{}},{},{},()=>{}),undefined);assert.equal(launches,0)
 await run('ordinary-pointer-smoke',chromium,false,{launch:{}},{},{},()=>{});assert.equal(launches,1)
})
test('actual trace dispatch retains identity/admission/receipt and rejects incomplete status or falsey failure',async()=>{
 let block=between('    receipt.ordinaryPointerTrace = {}',"  } else if (selectedScenario === 'query-art-evidence')")
 block=block.replace("(await import('../browser-performance/ordinary-pointer-trace-route.mjs')).default",'route');assert.ok(!block.includes('import('))
 const run=new AsyncFunction('assert','route','chromium','browserConfig','url','out','source','dist','browserPath','browserBinaryVersion','receipt','verifyOrdinaryPointerTraceEnvironment','traceCommentEnvironment',block)
 const receipt={buildRevision:'exact',browserSha256:'hash'},env={GH_TOKEN:'owner-only'},launch={},chromium={},src={};let admissions=0
 const invoke=route=>run(assert,route,chromium,{launch},'url','out',src,'dist','/chrome','version',receipt,async e=>{assert.equal(e,env);admissions++;return{admitted:true}},env)
 await invoke(async args=>{assert.equal(args.receipt,receipt.ordinaryPointerTrace);assert.equal(args.chromium,chromium);assert.equal(args.launch,launch);assert.equal(args.source,src);assert.equal(args.expectedRevision,'exact');assert.deepEqual(args.browserIdentity,{path:'/chrome',sha256:'hash',version:'version'});await args.admit();args.receipt.status='passed'})
 assert.equal(admissions,1)
 for(const status of ['incomplete','failed',undefined]){await assert.rejects(invoke(async a=>{a.receipt.status=status}),/Trace diagnostic incomplete/);assert.equal(receipt.ordinaryPointerTrace.status,status)}
 for(const error of [null,false,0,undefined]){let caught=false;await invoke(async()=>{throw error}).catch(e=>{caught=true;assert.equal(e,error)});assert.ok(caught)}
})
test('actual trace cleanup requires route ownership and bounded server proof, no duplicate browser close',async()=>{
 const block=between('    receipt.traceRunnerCleanup = {',"  } else if (selectedScenario === 'ordinary-pointer-calibration') {")
 const run=new AsyncFunction('receipt','server','closeOrdinaryPointerSmokeOwner','process',block)
 for(const route of [true,false,undefined])for(const serverOk of [true,false]){
  let calls=0;const receipt={status:'passed',ordinaryPointerTrace:{cleanupVerified:route}},process={}
  await run(receipt,{close:()=>{calls++}},async close=>{await close();return{confirmed:serverOk}},process)
  assert.equal(calls,1);assert.equal(receipt.cleanupVerified,route===true&&serverOk)
  if(!receipt.cleanupVerified){assert.equal(receipt.status,'failed');assert.equal(process.exitCode,1)}
 }
})
