import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync, symlinkSync, openSync, ftruncateSync, closeSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { EventEmitter } from 'node:events'
import { execFileSync } from 'node:child_process'
import { startDiagnostic, enforceOutputLimit, retainBundles, limits, closeOwned, createBudget, removeOwned } from '../scripts/browser-performance/causal-profiler.mjs'
function fixture(t, extra = {}) {
 const dir = mkdtempSync(resolve(tmpdir(), 'causal-test-')); t.after(() => rmSync(dir, { recursive: true, force: true }))
 const calls = []
 function client(scope) {
  const cdp = new EventEmitter(); let queries = 0
  cdp.send = async (method, params) => {
   calls.push([method, params, scope])
   if (method.startsWith('Tracing.') || method.startsWith('IO.')) assert.equal(scope, 'browser')
   if (method.startsWith('Profiler.') || method.startsWith('Performance.')) assert.equal(scope, 'page')
   if (method === 'Tracing.getCategories') {
    if (extra.categoryError) throw Error('mock categories unsupported')
    return { categories: extra.categoryResults?.[queries++] ?? ['devtools.timeline', 'v8'] }
   }
   if (method === 'Tracing.start' && extra.startError) throw Error('mock tracing unsupported')
   if (method === 'Performance.getMetrics') return { metrics: [] }
   if (method === 'Tracing.end') cdp.emit('Tracing.tracingComplete', { stream: 'one', dataLossOccurred: false })
   if (method === 'IO.read') return { data: '{}', eof: true }
   if (method === 'Profiler.stop') return { profile: extra.profile ?? { nodes: [], samples: [] } }
   return {}
  }
  cdp.detach = async () => { calls.push(['detach', null, scope]) }
  return cdp
 }
 const cdp = client('page'), traceCdp = client('browser')
 const page = { context: () => ({ newCDPSession: async () => cdp, browser: () => ({ newBrowserCDPSession: async () => traceCdp }) }), evaluate: async () => ({ menu: 0, badges: 0 }) }

 return { dir, cdp, traceCdp, calls, page }
}
test('bounded diagnostic starts/stops profile only around ordinary hover and preserves trace', async t => {
 const f=fixture(t), session={};const d=await startDiagnostic(f.page,f.dir,session,()=>{})
 await d.boundary('before-native-hover');await d.boundary('after-native-hover')
 assert.equal(f.calls.some(([m])=>m==='Profiler.start'),false)
 await d.boundary('before-ordinary-hover');await d.boundary('after-ordinary-hover');await d.stop()
 assert.equal(f.calls.filter(([m])=>m==='Profiler.start').length,1)
 assert.equal(f.calls.filter(([m])=>m==='Profiler.stop').length,1)
 assert.equal(session.diagnostic.status,'complete');assert.equal(session.diagnostic.timingComparable,false)
 assert.equal(readFileSync(resolve(f.dir,'trace.json'),'utf8'),'{}')
 assert.ok(session.diagnostic.missingCategories.includes('disabled-by-default-v8.gc'))
 assert.equal(f.calls.find(([m])=>m==='Tracing.start')[1].traceConfig.recordMode,'recordUntilFull')
})
test('trace pressure is preserved as incomplete, not clean absence',async t=>{
 const f=fixture(t),session={};const d=await startDiagnostic(f.page,f.dir,session,()=>{})
 f.traceCdp.emit('Tracing.bufferUsage',{percentFull:0.95});await assert.rejects(d.stop(),/incomplete/)
 assert.equal(session.diagnostic.traceStoppedEarly,true)
})
test('oversized profile retained only to explicit byte limit and capture fails',async t=>{
 const f=fixture(t,{profile:{payload:'x'.repeat(limits.profile)}}),session={};const d=await startDiagnostic(f.page,f.dir,session,()=>{})
 await d.boundary('before-ordinary-hover');await assert.rejects(d.boundary('after-ordinary-hover'),/byte cap/)
 assert.equal(readFileSync(resolve(f.dir,'ordinary-hover.cpuprofile.partial')).length,limits.profile)
 await d.stop()
})
test('output guard counts files but never follows asset symlinks',t=>{
 const f=fixture(t);writeFileSync(resolve(f.dir,'small'),'ok');symlinkSync('/dev',resolve(f.dir,'assets'))
 assert.equal(enforceOutputLimit(f.dir),2)
 const fd=openSync(resolve(f.dir,'large'),'w');ftruncateSync(fd,limits.total);closeSync(fd)
 assert.throws(()=>enforceOutputLimit(f.dir),/128 MiB/)
})
test('emitted-byte manifest retains real JS and map hashes',t=>{
 const f=fixture(t),dist=resolve(f.dir,'dist');mkdirSync(dist);writeFileSync(resolve(dist,'scene.js'),'a');writeFileSync(resolve(dist,'scene.js.map'),'b')
 retainBundles(f.dir,{base:dist});const m=JSON.parse(readFileSync(resolve(f.dir,'emitted-bundles.json')))
 assert.equal(m.total,2);assert.equal(m.entries.base.length,2)
})
test('capture modifications are only optional diagnostic hooks and prefix phase selection',()=>{
 let current=readFileSync(new URL('../scripts/browser-performance/snapshot-capture.mjs',import.meta.url),'utf8')
 current=current.replace('exportSnapshotRaw({ page, output, record, diagnostic = null })','exportSnapshotRaw({ page, output, record })')
 current=current.replace('  if (diagnostic) await diagnostic.download(download, resolve(output, record.rawFile))\n  else await download.saveAs(resolve(output, record.rawFile))','  await download.saveAs(resolve(output, record.rawFile))')
 current=current.replaceAll('exportSnapshotRaw({ page, output, record, diagnostic })','exportSnapshotRaw({ page, output, record })')
 current=current.replace('  const write = diagnostic ? diagnostic.write : writeFileSync\n','')
 current=current.replace('const save = () => write(', 'const save = () => writeFileSync(')
 current=current.replace('(name, summary) => write(resolve(output, name),','(name, summary) => writeFileSync(resolve(output, name),')
 current=current.replace('      write(resolve(output, record.summaryFile),','      writeFileSync(resolve(output, record.summaryFile),')
 current=current.replace('getErrorCount = () => 0, diagnostic = null })','getErrorCount = () => 0 })')
 current=current.replace("for (const name of diagnostic ? ['native-hover', 'ordinary-hover'] : shards[shard]) {\n      if (diagnostic) await diagnostic.boundary(`before-${name}`)", 'for (const name of shards[shard]) {')
 current=current.replace('\n      if (diagnostic) await diagnostic.boundary(`after-${name}`)','')
 const original=execFileSync('git',['show','2048a88a17983a4de619a649426b7f9554a7d319:scripts/browser-performance/snapshot-capture.mjs'],{encoding:'utf8'})
 assert.equal(current,original)
 const runner=readFileSync(new URL('../scripts/browser-performance/causal-run.mjs',import.meta.url),'utf8')
 assert.ok(runner.includes("['base', 'head'].entries()"));assert.ok(runner.includes('}, 90000)'))
 assert.equal(runner.includes('compareReports'),false)
})

test('owned close rejection is observed and recorded, including watchdog fire-and-forget', async () => {
 const owner = {}, resource = { close: async () => { throw Error('mock close failure') } }
 assert.equal(await closeOwned(resource, owner, 'failure'), false)
 assert.match(owner.failure, /mock close failure/)
 assert.equal(await closeOwned(null, owner, 'none'), true)
})

test('shared budget refuses writes and copies before touching destination, reserves metadata', t => {
 const f=fixture(t), budget=createBudget(f.dir,100,20), path=resolve(f.dir,'data')
 budget.write(path,Buffer.alloc(80))
 assert.throws(()=>budget.write(resolve(f.dir,'overflow'),Buffer.alloc(1)),/before write/)
 assert.equal(budget.used(),80)
 assert.throws(()=>readFileSync(resolve(f.dir,'overflow')),/ENOENT/)
 budget.write(resolve(f.dir,'receipt'),Buffer.alloc(20),true)
 assert.equal(budget.used(),100)
 assert.throws(()=>budget.write(resolve(f.dir,'other'),Buffer.alloc(1),true),/before write/)
 budget.write(path,Buffer.alloc(10));assert.equal(budget.used(),30)
 const source=resolve(f.dir,'source');writeFileSync(source,Buffer.alloc(60))
 assert.throws(()=>budget.copy(source,resolve(f.dir,'copy')),/before write/)
 assert.throws(()=>readFileSync(resolve(f.dir,'copy')),/ENOENT/)
})
test('stream append checks shared limit before appending bytes',t=>{
 const f=fixture(t),budget=createBudget(f.dir,100,20),path=resolve(f.dir,'stream')
 budget.write(path,Buffer.alloc(0));const fd=openSync(path,'a')
 try {budget.append(path,fd,Buffer.alloc(80));assert.throws(()=>budget.append(path,fd,Buffer.alloc(1)),/before write/)} finally{closeSync(fd)}
 assert.equal(readFileSync(path).length,80)
})

test('owned directory removal failure cannot skip subsequent receipt preparation', () => {
 const owner = {}
 assert.equal(removeOwned('/mock', owner, 'removalFailure', () => { throw Error('mock removal failure') }), false)
 owner.endedAt = 'completed cleanup attempt'
 assert.match(owner.removalFailure, /mock removal failure/)
 assert.equal(owner.endedAt, 'completed cleanup attempt')
})
test('runner initializes budget and owned scratch before first report write', () => {
 const runner=readFileSync(new URL('../scripts/browser-performance/causal-run.mjs',import.meta.url),'utf8')
 assert.ok(runner.indexOf('const budget = createBudget(out)') > 0)
 assert.ok(runner.indexOf('const budget = createBudget(out)') < runner.indexOf('const save ='))
 assert.ok(runner.includes("const scratch = mkdtempSync(resolve(root, '.causal-build-'))"))
 assert.equal(runner.includes('rmSync(profile'), false)
 assert.equal(runner.includes('rmSync(scratch'), false)
})
test('runner initial save and failed setup preserve report/receipt without any build or browser', async t => {
 const f=fixture(t),fs=await import('node:fs'),os=await import('node:os'),path=await import('node:path')
 let source=readFileSync(new URL('../scripts/browser-performance/causal-run.mjs',import.meta.url),'utf8')
 source=source.split('\n').filter(line=>!line.startsWith('import ')).join('\n')
 source=source.replaceAll('import.meta.dirname',JSON.stringify(resolve(f.dir,'scripts/browser-performance')))
 const fakeProcess={env:{PR_NUMBER:'636',PR_BASE_SHA:'2'.repeat(40),PR_HEAD_SHA:'f'.repeat(40),GITHUB_RUN_ID:'1',GITHUB_RUN_ATTEMPT:'1'},version:process.version}
 const mocks={...fs,...os,...path,startDiagnostic,retainBundles,enforceOutputLimit,closeOwned,createBudget,removeOwned,
   assert,process:fakeProcess,console:{log(){},error(){}},Buffer,setTimeout,clearTimeout,
   readFileSync:(name,...args)=>String(name).endsWith('package-lock.json')||String(name).endsWith('browsers.json')?Buffer.from('{}'):fs.readFileSync(name,...args),
   execFileSync:()=> 'wrong-revision',spawn:()=>{throw Error('Build must never start')},preview:()=>{throw Error('Server must never start')},chromium:{launch(){throw Error('Browser must never start')}},
   repository:'JohnDeved/populous-new-dawn',shards:{world:[]},plan:{},sha256:()=> 'a'.repeat(64),protocolHash:()=> 'b'.repeat(64),
 }
 delete mocks.default
 const run=new (Object.getPrototypeOf(async function(){}).constructor)(...Object.keys(mocks),source)
 await run(...Object.values(mocks))
 const report=JSON.parse(fs.readFileSync(resolve(f.dir,'outputs/causal-profile/report.json')))
 const receipt=JSON.parse(fs.readFileSync(resolve(f.dir,'outputs/causal-profile/receipt.json')))
 assert.equal(report.status,'incomplete');assert.equal(fakeProcess.exitCode,1)
 assert.match(receipt.failure,/AssertionError/);assert.doesNotMatch(receipt.failure,/ReferenceError/)
 assert.ok(receipt.endedAt);assert.equal(receipt.finalReportFailure,undefined)
})

test('unchanged Vite fixture root retains trusted node_modules ancestry', () => {
 const runner=readFileSync(new URL('../scripts/browser-performance/causal-run.mjs',import.meta.url),'utf8')
 assert.ok(runner.includes("mkdtempSync(resolve(root, '.causal-build-'))"))
 assert.ok(runner.includes('const output = resolve(scratch, `build-${side}`)'))
 const builder=readFileSync(new URL('../scripts/browser-performance/build.mjs',import.meta.url),'utf8')
 assert.ok(builder.includes("const fixture = resolve(output, 'fixture')"))
 // diagnostic/.causal-build-*/build-side/fixture -> diagnostic/node_modules.
 assert.equal(resolve('/diagnostic/.causal-build-x/build-base/fixture','../../..','node_modules'),'/diagnostic/node_modules')
})

test('empty browser categories retain CPU/DOM capture, never infer no activity', async t => {
 const f=fixture(t,{categoryResults:[[],[],[]]}),session={};const d=await startDiagnostic(f.page,f.dir,session,()=>{})
 await d.boundary('before-ordinary-hover');await d.boundary('after-ordinary-hover');await d.stop()
 assert.equal(session.diagnostic.categoryAttempts.length,3)
 assert.equal(session.diagnostic.traceStatus,'unavailable')
 assert.match(session.diagnostic.traceUnavailableReason,/activity remains unknown/)
 assert.equal(session.diagnostic.status,'complete-cpu-profile-only')
 assert.equal(session.diagnostic.boundaries.length,2)
 assert.equal(f.calls.filter(([m])=>m==='Profiler.start').length,1)
 assert.equal(f.calls.filter(([m])=>m==='Tracing.start').length,0)
 assert.ok(readFileSync(resolve(f.dir,'ordinary-hover.cpuprofile')).length>0)
})
test('bounded category readiness retains every response then starts browser trace',async t=>{
 const f=fixture(t,{categoryResults:[[],['v8'],['devtools.timeline','v8']]}),session={};const d=await startDiagnostic(f.page,f.dir,session,()=>{})
 await d.stop();assert.equal(session.diagnostic.categoryAttempts.length,3);assert.equal(session.diagnostic.traceStatus,'complete')
})
test('tracing protocol rejection does not abort page profiler',async t=>{
 for(const options of [{categoryError:true},{startError:true}]){
  const f=fixture(t,options),session={};const d=await startDiagnostic(f.page,f.dir,session,()=>{})
  await d.boundary('before-ordinary-hover');await d.boundary('after-ordinary-hover');await d.stop()
  assert.equal(session.diagnostic.traceStatus,'unavailable');assert.equal(session.diagnostic.status,'complete-cpu-profile-only')
  assert.match(session.diagnostic.traceUnavailableReason,/unsupported/)
  assert.equal(f.calls.filter(([m])=>m==='detach').length,2)
 }
})
