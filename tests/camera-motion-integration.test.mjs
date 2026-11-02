import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { browserScenarios, browserCapMs } from '../scripts/tutorial-browser/scenario-policy.mjs'
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8'),source=read('scripts/tutorial-browser/run.mjs')
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor
const between=(a,b)=>{const i=source.indexOf(a),j=source.indexOf(b,i+a.length);assert.ok(i>=0&&j>i);return source.slice(i,j)}
let selection
try { selection=(await import('../scripts/tutorial-browser/camera-motion-selection.mjs')).cameraMotionSelection } catch {}
const head='a'.repeat(40),event=()=>({action:'ready_for_review',pull_request:{draft:false,state:'open',head:{sha:head,repo:{full_name:'JohnDeved/populous-new-dawn'}},base:{ref:'main',repo:{full_name:'JohnDeved/populous-new-dawn'}},labels:[{name:`cam-v1:${head}`}]}})
test('exact-head Ready same-repository selection rejects stale labels, forks and unrelated events',()=>{
 assert.equal(typeof selection,'function')
 assert.equal(selection(event(),'pull_request',head,'camera-motion-evidence'),true)
 const labeled=event();labeled.action='labeled';labeled.label={name:`cam-v1:${head}`};assert.equal(selection(labeled,'pull_request',head,'camera-motion-evidence'),true)
 for(const change of [e=>e.pull_request.draft=true,e=>e.pull_request.head.sha='b'.repeat(40),e=>e.pull_request.labels=[],e=>e.pull_request.head.repo.full_name='fork/repo',e=>e.pull_request.base.ref='other',e=>e.pull_request.state='closed',e=>e.action='synchronize',e=>{e.action='labeled';e.label={name:'other'}}]){
 const e=event();change(e);assert.equal(selection(e,'pull_request',head,'camera-motion-evidence'),false)
 }
 assert.equal(selection(event(),'workflow_dispatch',head,'camera-motion-evidence'),false)
 assert.equal(selection(event(),'pull_request',head,'tutorial'),false)
})
test('camera is a fixed180s scenario with no initial context or generic timer, existing launch remains owned',()=>{
 assert.ok(browserScenarios.includes('camera-motion-evidence'));assert.equal(browserCapMs('camera-motion-evidence'),180000)
 assert.ok(source.includes("else if (selectedScenario === 'camera-motion-evidence') receipt.browserBudget = { routeMs: 180000, maxContexts: 3 }"))
 assert.ok(source.includes("['snapshot-protocol', 'ordinary-pointer-smoke', 'ordinary-pointer-calibration', 'ordinary-pointer-trace', 'camera-motion-evidence', 'snapshot-arm-witness'].includes(selectedScenario)"))
 assert.ok(source.includes("if (!['ordinary-pointer-calibration', 'ordinary-pointer-trace'].includes(selectedScenario)) {"))
 const pins=JSON.parse(read('scripts/tutorial-browser/capture-qualified-inputs.json'));assert.equal(pins['scripts/tutorial-browser/run.mjs'],createHash('sha256').update(source).digest('hex'))
})
test('actual dispatch binds identity and entered ownership, rejects incomplete status and preserves falsey rejection',async()=>{
 let block=between('    receipt.cameraMotion = {}',"  } else if (selectedScenario === 'frontend-held-escape')")
 block=block.replace("(await import('./camera-motion-evidence.mjs')).default",'scenario')
 const run=new AsyncFunction('assert','scenario','receipt','browser','url','out','source',block)
 const receipt={buildRevision:'revision'},browser={},src={}
 await run(assert,async a=>{assert.equal(a.browser,browser);assert.equal(a.source,src);assert.equal(a.expectedRevision,'revision');assert.equal(a.receipt,receipt.cameraMotion);assert.equal(receipt.cameraMotionEntered,true);a.receipt.status='passed'},receipt,browser,'url','out',src)
 for(const status of ['failed','incomplete',undefined])await assert.rejects(run(assert,async a=>a.receipt.status=status,receipt,browser,'url','out',src),/Camera motion evidence/)
 for(const error of [null,false,undefined]){let caught=false;await run(assert,async()=>{throw error},receipt,browser,'url','out',src).catch(e=>{caught=true;assert.equal(e,error)});assert.ok(caught)}
})
test('actual cleanup never duplicates entered route close and requires route settlement plus bounded server',async()=>{
 const block=between('    receipt.cameraRunnerCleanup = {','  } else {\n    try { await context?.close();')
 const run=new AsyncFunction('receipt','browser','server','closeOrdinaryPointerSmokeOwner','process',block)
 for(const confirmed of [true,false])for(const settled of [true,false]){
  let bc=0,sc=0;const receipt={status:'passed',cameraMotionEntered:true,cameraMotion:{cleanupConfirmed:confirmed,operationSettled:settled}},process={}
  await run(receipt,{close:()=>bc++},{close:()=>sc++},async fn=>{await fn();return{confirmed:true}},process)
  assert.equal(bc,0);assert.equal(sc,1);assert.equal(receipt.cleanupVerified,confirmed&&settled)
  if(!receipt.cleanupVerified)assert.equal(process.exitCode,1)
 }
 let bc=0;const r={};await run(r,{close:()=>bc++},{close(){}},async fn=>{await fn();return{confirmed:true}},{})
 assert.equal(bc,1);assert.equal(r.cleanupVerified,false,'fallback cleanup cannot invent route success')
 const failedServer={cameraMotionEntered:true,cameraMotion:{cleanupConfirmed:true,operationSettled:true}}
 await run(failedServer,{}, {},async()=>({confirmed:false}),{});assert.equal(failedServer.cleanupVerified,false)
})
test('separate fixed six-minute workflow preserves default matrix and exact upload quotas',()=>{
 const workflow=read('.github/workflows/camera-motion-browser.yml'),normal=read('.github/workflows/tutorial-browser.yml')
 assert.match(workflow,/types: \[ready_for_review, labeled\]/);assert.match(workflow,/timeout-minutes: 6/)
 assert.match(workflow,/cam-v1:\{0\}/);assert.match(workflow,/head.repo.full_name == github.repository/)
 assert.match(workflow,/cancel-in-progress: false/);assert.match(workflow,/persist-credentials: false/)
 assert.match(workflow,/scenario <= 24 \* MiB && outer <= 8 \* MiB && scenario \+ outer <= 32 \* MiB/)
 assert.match(workflow,/screenshots <= 9/);assert.match(workflow,/stat.isFile\(\) && !stat.isSymbolicLink\(\)/)
 assert.match(workflow,/steps.camera-bounds.outcome == 'success'/)
 assert.equal((normal.match(/^          - scenario:/gm)||[]).length,9);assert.ok(!normal.includes('camera-motion-evidence'))
})
test('actual workflow bounder rejects oversize, extra screenshots, unknown files and symlinks without large allocation',async()=>{
 const {runInNewContext}=await import('node:vm')
 const text=read('.github/workflows/camera-motion-browser.yml'),start=text.indexOf("<<'NODE'\n")
 assert.ok(start>0)
 let code=text.slice(start+9,text.indexOf('\n          NODE',start)).split('\n').map(line=>line.replace(/^          /,'')).join('\n')
 code=code.replace(/^import .*\n/gm,'')
 const check=entries=>runInNewContext(code,{assert,existsSync:()=>true,readdirSync:()=>Object.keys(entries),lstatSync:path=>{const entry=entries[path.split('/').at(-1)];return{size:entry.size,isFile:()=>true,isSymbolicLink:()=>!!entry.link}}})
 check({'camera-motion.json':{size:1024},'camera-overview-key-0.png':{size:2*1024*1024},'receipt.json':{size:1024}})
 for(const entries of [{'camera-motion.json':{size:1024*1024+1}},{'camera-overview-key-0.png':{size:2*1024*1024+1}},{'camera-unknown.json':{size:1}},{'camera-motion.json':{size:1,link:true}},{'build.log':{size:8*1024*1024+1}}])assert.throws(()=>check(entries))
 const ten={};for(const kind of ['overview-key','overview-edge','overview-key-release','overview-edge-away'])for(let i=0;i<3&&Object.keys(ten).length<10;i++)ten[`camera-${kind}-${i}.png`]={size:1}
 assert.throws(()=>check(ten),/Screenshot count/)
})
