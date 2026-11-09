import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {browserScenarios,browserCapMs} from '../scripts/tutorial-browser/scenario-policy.mjs'
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8')
const source=read('scripts/tutorial-browser/run.mjs')
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor
function between(a,b){const start=source.indexOf(a),end=source.indexOf(b,start);assert.ok(start>=0&&end>start);return source.slice(start,end)}

test('aggregate is explicit with fixed cap; all original caps retained',()=>{
 assert.ok(browserScenarios.includes('ordinary-pointer-calibration'))
 assert.equal(browserCapMs('ordinary-pointer-calibration'),1200000)
 assert.equal(browserCapMs('ordinary-pointer-smoke'),90000)
 assert.equal(browserCapMs('snapshot-protocol'),90000)
 assert.equal(browserCapMs('building-panel-edges'),90000)
 assert.equal(browserCapMs('tutorial'),240000)
 for(const s of browserScenarios.filter(x=>!['ordinary-pointer-calibration','ordinary-pointer-smoke','snapshot-protocol','tutorial','building-panel-edges'].includes(x)))assert.equal(browserCapMs(s),180000)
})
test('actual launch branch skips initial browser for aggregate and owned trace route',async()=>{
 const block=between("  if (!['ordinary-pointer-calibration', 'ordinary-pointer-trace'].includes(selectedScenario)) {","  receipt.browserCapMs")
 let launches=0;const chromium={launch:async()=>{launches++;return{version:()=> 'same-version'}}}
 const run=new AsyncFunction('selectedScenario','chromium','captureProtocolEnabled','browserConfig','descendantEnv','receipt','save','let browser;'+block+';return browser')
 const receipt={}
 assert.equal(await run('ordinary-pointer-calibration',chromium,false,{launch:{}},{},receipt,()=>{}),undefined)
 assert.equal(launches,0)
 await run('ordinary-pointer-smoke',chromium,false,{launch:{}},{},receipt,()=>{})
 assert.equal(launches,1);assert.equal(receipt.browserVersion,'same-version')
})
test('actual aggregate dispatch binds browser identity and shared receipt',async()=>{
 let block=between("    receipt.ordinaryPointerCalibration = {}","  } else if (selectedScenario === 'ordinary-pointer-trace')")
 block=block.replace("(await import('../browser-performance/ordinary-pointer-calibration.mjs')).default",'aggregate')
 assert.equal(block.includes('import('),false)
 const invoke=new AsyncFunction('assert','aggregate','chromium','browserConfig','url','out','source','dist','browserPath','browserBinaryVersion','receipt',block)
 const run=(...args)=>invoke(assert,...args)
 const receipt={buildRevision:'exact-main',browserSha256:'exact-hash'},launch={},chromium={},src={}
 await run(async args=>{assert.equal(args.chromium,chromium);assert.equal(args.launch,launch);assert.equal(args.source,src);assert.equal(args.receipt,receipt.ordinaryPointerCalibration);assert.deepEqual(args.browserIdentity,{path:'/official/chrome',sha256:'exact-hash',version:'version'});assert.equal(args.expectedRevision,'exact-main');args.receipt.cleanupVerified=true;args.receipt.status='passed'},chromium,{launch},'url','out',src,'dist','/official/chrome','version',receipt)
 assert.equal(receipt.ordinaryPointerCalibration.cleanupVerified,true)
 for(const status of ['inconclusive','failed',undefined]){
  await assert.rejects(run(async args=>{args.receipt.status=status;args.receipt.cleanupVerified=true},chromium,{launch},'url','out',src,'dist','/official/chrome','version',receipt),/Calibration inconclusive or failed/)
  assert.equal(receipt.ordinaryPointerCalibration.status,status,'inner evidence retained')
 }
 for(const error of [null,false,0,undefined]){
  let caught=false;await run(async()=>{throw error},chromium,{launch},'url','out',src,'dist','/official/chrome','version',receipt).catch(e=>{caught=true;assert.equal(e,error)});assert.ok(caught)
 }
})
test('actual cleanup requires aggregate and server proof, never launches or closes extra browser',async()=>{
 const block=between('    receipt.calibrationRunnerCleanup = {',"  } else if (selectedScenario === 'ordinary-pointer-smoke') {")
 const run=new AsyncFunction('receipt','server','closeOrdinaryPointerSmokeOwner','process',block)
 for(const aggregate of [true,false,undefined])for(const serverOk of [true,false]){
  let calls=0;const receipt={status:'passed',ordinaryPointerCalibration:{cleanupVerified:aggregate}},process={}
  await run(receipt,{close:()=>{calls++}},async close=>{await close();return{confirmed:serverOk}},process)
  assert.equal(calls,1);assert.equal(receipt.cleanupVerified,aggregate===true&&serverOk)
  if(!receipt.cleanupVerified){assert.equal(receipt.status,'failed');assert.equal(process.exitCode,1)}
 }
})
test('aggregate bypasses generic context/timer; smoke budget and diagnostic runner pin remain exact',()=>{
 assert.ok(source.includes("if (!['snapshot-protocol', 'ordinary-pointer-smoke', 'ordinary-pointer-calibration', 'ordinary-pointer-trace', 'query-art-evidence', 'building-icon-evidence', 'building-panel-edges'].includes(selectedScenario))"))
 assert.match(source,/else if \(selectedScenario === 'ordinary-pointer-calibration'\) receipt.browserBudget = ordinaryPointerCalibrationPolicy\s+else if \(selectedScenario === 'query-art-evidence'\) receipt\.browserBudget = \{ routeMs: 180000, maxContexts: 2 \}\s+else if \(selectedScenario === 'building-icon-evidence'\) receipt\.browserBudget = \{ routeMs: 180000, maxContexts: 2 \}\s+else if \(selectedScenario === 'ordinary-pointer-trace'\) receipt.browserBudget = \{ routeMs: 180000, interpretationEligible: false \}\s+else\s+timer = setTimeout/)
 assert.match(source,/ordinaryPointerCalibrationSelection\(JSON.parse\(readFileSync\(process.env.GITHUB_EVENT_PATH, 'utf8'\)\),\s*process.env.GITHUB_EVENT_NAME, process.env.GITHUB_REF, process.env.GITHUB_SHA, selectedScenario, process.env\)/)
 const pins=JSON.parse(read('scripts/tutorial-browser/capture-qualified-inputs.json'))
 assert.equal(pins['scripts/tutorial-browser/run.mjs'],createHash('sha256').update(source).digest('hex'))
})
