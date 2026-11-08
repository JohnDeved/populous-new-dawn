import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { browserScenarios, browserCapMs } from '../scripts/tutorial-browser/scenario-policy.mjs'
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8'),source=read('scripts/tutorial-browser/run.mjs')
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor
const between=(a,b)=>{const i=source.indexOf(a),j=source.indexOf(b,i+a.length);assert.ok(i>=0&&j>i);return source.slice(i,j)}
let selection
try { selection=(await import('../scripts/tutorial-browser/query-art-selection.mjs')).queryArtSelection } catch {}
const head='a'.repeat(40),event=()=>({action:'ready_for_review',pull_request:{draft:false,state:'open',head:{sha:head,repo:{full_name:'JohnDeved/populous-new-dawn'}},base:{ref:'main',repo:{full_name:'JohnDeved/populous-new-dawn'}},labels:[{name:`qart-v1:${head}`}]}})
test('exact-head Ready same-repository selection rejects stale labels, forks and unrelated events',()=>{
 assert.equal(typeof selection,'function');assert.ok(`qart-v1:${head}`.length<=50)
 assert.equal(selection(event(),'pull_request',head,'query-art-evidence'),true)
 const labeled=event();labeled.action='labeled';labeled.label={name:`qart-v1:${head}`};assert.equal(selection(labeled,'pull_request',head,'query-art-evidence'),true)
 for(const change of [e=>e.pull_request.draft=true,e=>e.pull_request.head.sha='b'.repeat(40),e=>e.pull_request.labels=[],e=>e.pull_request.head.repo.full_name='fork/repo',e=>e.pull_request.base.ref='other',e=>e.pull_request.state='closed',e=>e.action='synchronize',e=>{e.action='labeled';e.label={name:'other'}}]){
 const e=event();change(e);assert.equal(selection(e,'pull_request',head,'query-art-evidence'),false)
 }
 assert.equal(selection(event(),'workflow_dispatch',head,'query-art-evidence'),false)
 assert.equal(selection(event(),'pull_request',head,'tutorial'),false)
})
test('icon is a fixed180s scenario with no initial context or generic timer, existing launch remains owned',()=>{
 assert.ok(browserScenarios.includes('query-art-evidence'));assert.equal(browserCapMs('query-art-evidence'),180000)
 assert.ok(source.includes("else if (selectedScenario === 'query-art-evidence') receipt.browserBudget = { routeMs: 180000, maxContexts: 2 }"))
 assert.ok(source.includes("['snapshot-protocol', 'ordinary-pointer-smoke', 'ordinary-pointer-calibration', 'ordinary-pointer-trace', 'query-art-evidence'].includes(selectedScenario)"))
 assert.ok(source.includes("if (!['ordinary-pointer-calibration', 'ordinary-pointer-trace'].includes(selectedScenario)) {"))
 const pins=JSON.parse(read('scripts/tutorial-browser/capture-qualified-inputs.json'));assert.equal(pins['scripts/tutorial-browser/run.mjs'],createHash('sha256').update(source).digest('hex'))
})
test('actual dispatch binds identity and entered ownership, rejects incomplete status and preserves falsey rejection',async()=>{
 let block=between('    receipt.queryArt = {}',"  } else if (selectedScenario === 'frontend-held-escape')")
 block=block.replace("(await import('./query-art-evidence.mjs')).default",'scenario')
 const run=new AsyncFunction('assert','scenario','receipt','browser','url','out','source',block)
 const receipt={buildRevision:'revision'},browser={},src={}
 await run(assert,async a=>{assert.equal(a.browser,browser);assert.equal(a.source,src);assert.equal(a.expectedRevision,'revision');assert.equal(a.receipt,receipt.queryArt);assert.equal(receipt.queryArtEntered,true);a.receipt.status='passed'},receipt,browser,'url','out',src)
 for(const status of ['failed','incomplete',undefined])await assert.rejects(run(assert,async a=>a.receipt.status=status,receipt,browser,'url','out',src),/Query art evidence/)
 for(const error of [null,false,undefined]){let caught=false;await run(assert,async()=>{throw error},receipt,browser,'url','out',src).catch(e=>{caught=true;assert.equal(e,error)});assert.ok(caught)}
})
test('actual cleanup never duplicates entered route close and requires route settlement plus bounded server',async()=>{
 const block=between('    receipt.queryArtRunnerCleanup = {','  } else {\n    const cleanupErrors = []')
 const run=new AsyncFunction('receipt','browser','server','closeOrdinaryPointerSmokeOwner','process',block)
 for(const confirmed of [true,false])for(const settled of [true,false]){
  let bc=0,sc=0;const receipt={status:'passed',queryArtEntered:true,queryArt:{cleanupConfirmed:confirmed,operationSettled:settled}},process={}
  await run(receipt,{close:()=>bc++},{close:()=>sc++},async fn=>{await fn();return{confirmed:true}},process)
  assert.equal(bc,0);assert.equal(sc,1);assert.equal(receipt.cleanupVerified,confirmed&&settled)
  if(!receipt.cleanupVerified)assert.equal(process.exitCode,1)
 }
 let bc=0;const r={};await run(r,{close:()=>bc++},{close(){}},async fn=>{await fn();return{confirmed:true}},{})
 assert.equal(bc,1);assert.equal(r.cleanupVerified,false,'fallback cleanup cannot invent route success')
 const failedServer={queryArtEntered:true,queryArt:{cleanupConfirmed:true,operationSettled:true}}
 await run(failedServer,{}, {},async()=>({confirmed:false}),{});assert.equal(failedServer.cleanupVerified,false)
})
test('separate fixed six-minute workflow preserves default matrix and exact upload quotas',()=>{
 const workflow=read('.github/workflows/query-art-browser.yml'),normal=read('.github/workflows/tutorial-browser.yml')
 assert.match(workflow,/types: \[ready_for_review, labeled\]/);assert.match(workflow,/timeout-minutes: 6/)
 assert.match(workflow,/qart-v1:\{0\}/);assert.match(workflow,/head.repo.full_name == github.repository/)
 assert.match(workflow,/cancel-in-progress: false/);assert.match(workflow,/persist-credentials: false/)
 assert.match(workflow,/metadata <= 8 \* MiB && total <= 24 \* MiB/)
 assert.match(workflow,/screenshots <= 8/);assert.match(workflow,/stat.isFile\(\) && !stat.isSymbolicLink\(\)/)
 assert.match(workflow,/steps.query-bounds.outcome == 'success'/)
 assert.equal((normal.match(/^          - scenario:/gm)||[]).length,10);assert.ok(!normal.includes('query-art-evidence'))
})
test('actual workflow bounder rejects oversize, extra screenshots, unknown files and symlinks without large allocation',async()=>{
 const {runInNewContext}=await import('node:vm')
 const text=read('.github/workflows/query-art-browser.yml'),start=text.indexOf("<<'NODE'\n")
 assert.ok(start>0)
 let code=text.slice(start+9,text.indexOf('\n          NODE',start)).split('\n').map(line=>line.replace(/^          /,'')).join('\n')
 code=code.replace(/^import .*\n/gm,'')
 const check=entries=>runInNewContext(code,{assert,existsSync:()=>true,readdirSync:()=>Object.keys(entries),lstatSync:path=>{const entry=entries[path.split('/').at(-1)];return{size:entry.size,isFile:()=>true,isSymbolicLink:()=>!!entry.link}}})
 check({'query-art-evidence.json':{size:1024},'query-normal-scale1.png':{size:2*1024*1024},'receipt.json':{size:1024}})
 for(const entries of [{'query-art-evidence.json':{size:1024*1024+1}},{'query-normal-scale1.png':{size:2*1024*1024+1}},{'query-art-unknown.json':{size:1}},{'query-art-evidence.json':{size:1,link:true}},{'build.log':{size:8*1024*1024+1}}])assert.throws(()=>check(entries))
 assert.throws(()=>check({'query-art-8.png':{size:1}}),/Unexpected icon/)
 assert.throws(()=>check({'receipt.json':{size:5*1024*1024},'build.log':{size:4*1024*1024}}),/quota/)
 check(Object.fromEntries(['query-normal-scale1.png', 'query-hover.png', 'query-held.png', 'query-keyboard-focus.png', 'query-normal-scale1-5.png', 'query-normal-scale2.png', 'query-failed.png', 'query-failed-focus.png'].map(name=>[name,{size:2*1024*1024}]).concat([['receipt.json',{size:8*1024*1024}]])))
})
test('capture assertion inventory preserves every actual assertion and both source timers',()=>{
 const fixture=JSON.parse(read('tests/fixtures/capture/runner-baseline-lines.json'))
 assert.deepEqual(source.match(/^.*assert\..*$/gm).filter(line=>!line.includes('captureProtocolEnabled')),fixture.assertions)
 assert.deepEqual(source.match(/^.*setTimeout\(.*$/gm),fixture.timers)
})
