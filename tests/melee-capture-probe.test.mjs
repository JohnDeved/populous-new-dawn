import assert from 'node:assert/strict'
import { captureProbeFixture as fixture } from './support/capture-probe-fixture.mjs'
import { createHash, webcrypto } from 'node:crypto'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { installCaptureProbe } from '../scripts/tutorial-browser/capture-probe.mjs'

const { compareRgba } = installCaptureProbe()
const tests = []
const test = async (name, run) => { await run(); tests.push({ name, status: 'passed' }) }
const png = 'data:image/png;base64,' + Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0]).toString('base64')
// Supplied recording APIs only. This header is not a decodable PNG and is never
// represented as browser/file/pixel evidence. The later route still needs its
// existing PNG decoder/nonblank checks and actual visual inspection.

await test('strict RGBA8 comparator: exact bytes and 11 malformed/mismatch controls', () => {
  const a = { width: 2, height: 1, data: new Uint8ClampedArray([1,2,3,255,4,5,6,255]) }
  assert.equal(compareRgba(a, structuredClone(a)).equal, true)
  for (const b of [ { ...a, width: 1, height: 2 },
    { ...a, data: new Uint8ClampedArray([1,2,4,255,4,5,6,255]) },
    { ...a, data: new Uint8ClampedArray([1,2,3,254,4,5,6,255]) },
    { ...a, data: new Uint8ClampedArray([4,5,6,255,1,2,3,255]) } ]) assert.equal(compareRgba(a,b).equal,false)
  for (const b of [ { ...a, data: [1,2,3,255,4,5,6,255] }, { ...a, data: new Uint8Array(8) },
    { ...a, data: new Float32Array(8) }, { ...a, data: new Uint8ClampedArray(4) },
    { ...a, width: 0 }, { ...a, width: 257 }, { ...a, width: 1.5 } ]) assert.throws(() => compareRgba(a,b))
})
await test('four immutable pairs, exact geometry, AB/BA/BA/AB, deferred readback, real API digests of supplied bytes', async () => {
  const f = fixture({}, { crypto: webcrypto, setTimer: setTimeout, clearTimer: clearTimeout })
  for (let slot=0; slot<4; slot++) { f.capture(); f.next() }
  assert.equal(f.trace.filter(call => call[0] === 'read').length, 0)
  assert.deepEqual(f.trace.filter(call => call[0] === 'context').map(call => call[3]?.willReadFrequently ? 'B' : 'A'), ['A','B','B','A','B','A','A','B'])
  for (const draw of f.trace.filter(call => call[0] === 'draw')) assert.deepEqual(draw.slice(2), [true,10,20,2,2,0,0,2,2])
  assert.equal(f.capture().reserved, false)
  f.probe.stop({ reason: 'entry-complete' })
  const result = await f.probe.retain(), before = f.trace.length
  assert.equal(result.retention.status, 'complete-comparison-only')
  assert.equal(result.allocations, 8); assert.equal(result.drawCalls, 8)
  assert.equal(result.peakReadbackArrays, 2); assert.equal(result.cleanup.confirmed, true)
  assert.equal(result.canonicalGate, 'unassessed-external-v2-required')
  for (const pair of result.pairs) {
    assert.equal(pair.comparison.equal, true)
    assert.equal(pair.arms.A.filename, `melee-attack-frame-${pair.slot}.png`)
    assert.equal(pair.arms.B.filename, `diagnostic-melee-B-frame-${pair.slot}.png`)
    const expected = createHash('sha256').update(new Uint8ClampedArray(Array.from({length:16},(_,i)=>i))).digest('hex')
    assert.equal(pair.arms.A.rawPixelSha256, expected)
    for (const arm of ['A','B']) {
      assert.equal(pair.arms[arm].pngSha256, createHash('sha256').update(Buffer.from(png.split(',')[1],'base64')).digest('hex'))
      const times=pair.arms[arm].timings
      assert.ok(times.beforeSize <= times.afterSize && times.beforeContext <= times.afterContext && times.beforeDraw <= times.afterDraw)
      assert.equal(pair.arms[arm].drawCallMs,times.afterDraw-times.beforeDraw)
      assert.match(pair.arms[arm].copyMsSemantics,/instrumented/)
    }
  }
  await f.probe.retain(); f.probe.cleanup(); assert.equal(f.trace.length, before)
  assert.ok(f.canvases.every(canvas => canvas.width === 0 && canvas.height === 0))
})
await test('reservation before eligibility, duplicate pose consumes no slot, no missing-A replacement', async () => {
  const f = fixture()
  assert.equal(f.capture(() => ({ eligible: false, reason: 'invisible first crop' })).status, 'missing')
  assert.equal(f.capture().reason, 'duplicate-pose')
  for (let slot=1; slot<5; slot++) { f.next(); f.capture() }
  f.probe.stop(); const result = await f.probe.retain()
  assert.equal(result.pairs.length,4); assert.equal(result.pairs[0].arms.A,undefined)
  assert.equal(result.pairs[1].order[0],'B'); assert.equal(result.drawCalls,6)
  assert.equal(result.retention.status,'failed')
})
for (const kind of ['context','contextThrow','draw','lost']) for (const index of [0,1,2,3]) await test(`${kind} failure at allocation ${index} stops with owned cleanup`, async () => {
  const f = fixture({ [kind]: index })
  if (index >= 2) { f.capture(); f.next() }
  assert.throws(() => f.capture())
  assert.ok(f.probe.report().firstError)
  assert.equal(f.probe.report().cleanup.confirmed,index < 2)
  assert.throws(() => f.capture())
  const retained = await f.probe.retain()
  assert.equal(retained.cleanup.confirmed,true)
  if(index >= 2) assert.ok(retained.pairs[0].arms.A.png, 'Earlier complete pair must survive failure for retention')
  assert.ok(f.canvases.every(canvas => canvas.width === 0 && canvas.height === 0))
  const before=f.trace.length; await f.probe.retain(); assert.equal(f.trace.length,before)
})
for (const [label, mutate] of [
  ['source object', ({state,source}) => { state.source = {...source} }],
  ['source width', ({state,source}) => { source.width--; state.width-- }],
  ['renderer stamp', ({state}) => { state.stamp++ }],
  ['world identity', ({state}) => { state.world={} }],
  ['physical person', ({state}) => { state.person={} }],
  ['profile', ({state}) => { state.profile='changed' }],
  ['paused', ({state}) => { state.paused=true }],
  ['death', ({state}) => { state.hp=0 }],
  ['disconnect', ({source}) => { source.isConnected=false }],
]) await test(`source-bound ${label} drift inside pair fails before second arm`, () => {
  const f=fixture({afterDraw: mutate}); assert.throws(()=>f.capture()); assert.equal(f.probe.report().drawCalls,1)
  assert.equal(f.probe.report().cleanup.confirmed,true)
})
await test('post-yield selection rejected with zero draw calls', () => {
  const f=fixture(); assert.throws(()=>f.capture(()=>Promise.resolve(f.selection)), /Post-yield/)
  assert.equal(f.probe.report().drawCalls,0)
})
await test('wrong caller metadata rejected, no caller-controlled B source/order/slot', () => {
  const f=fixture(); const sample=f.sample(); sample.stamp++
  assert.throws(()=>f.probe.capture(sample,()=>f.selection), /metadata mismatch/)
  assert.equal(f.probe.report().drawCalls,0)
})
for (const [label, edit] of [['negative clip', s=>{s.clip.x=-1}], ['oversize clip',s=>{s.clip.width=257}],
  ['overlay',s=>{s.visibility.cropOverlayClear=false}], ['not canvas owned',s=>{s.visibility.bodyCanvasOwned=false}]])
  await test(`${label} rejected`,()=>{ const f=fixture(); edit(f.selection); assert.throws(()=>f.capture()); assert.equal(f.probe.report().drawCalls,0) })
await test('reused destination/source/context identities rejected without cleaning the source', () => {
  let f=fixture({ create: ({source})=>source }); assert.throws(()=>f.capture()); assert.equal(f.source.width,960)
  f=fixture({ reuseContext:true }); assert.throws(()=>f.capture()); assert.equal(f.probe.report().drawCalls,1)
  f=fixture({ reuseCanvas:true }); assert.throws(()=>f.capture(), /identity reused/); assert.equal(f.probe.report().drawCalls,1)
})
for (const kind of ['read','encode']) await test(`${kind} error retains failure, releases all, no retention retry`, async()=>{
  const f=fixture({[kind]:1}); f.capture(); f.probe.stop()
  const result=await f.probe.retain(), calls=f.trace.length
  assert.equal(result.retention.status,'failed'); assert.equal(result.cleanup.confirmed,true)
  await f.probe.retain(); assert.equal(f.trace.length,calls)
})
await test('same RGBA with different PNG bytes is not a pixel mismatch', async()=>{
  const f=fixture({png:number=>number===1 ? 'data:image/png;base64,' + Buffer.from([137,80,78,71,13,10,26,10,1,0,0,0]).toString('base64') : png})
  for(let i=0;i<4;i++){f.capture();f.next()}
  f.probe.stop();const r=await f.probe.retain()
  assert.equal(r.pairs[0].comparison.equal,true)
  assert.notEqual(r.pairs[0].arms.A.png,r.pairs[0].arms.B.png)
})
await test('RGBA mismatch stays failed with both retained PNGs',async()=>{
  const f=fixture({mismatch:1});for(let i=0;i<4;i++){f.capture();f.next()};f.probe.stop()
  const r=await f.probe.retain();assert.equal(r.retention.status,'failed')
  assert.equal(r.pairs[0].comparison.equal,false);assert.ok(r.pairs[0].arms.A.png);assert.ok(r.pairs[0].arms.B.png)
})
await test('cleanup failure explicit and idempotent',async()=>{
  const f=fixture({cleanup:0});f.capture();f.probe.stop();const r=await f.probe.retain()
  assert.equal(r.cleanup.confirmed,false);assert.ok(r.cleanup.errors.length)
  const before=f.trace.length;f.probe.cleanup();assert.equal(f.trace.length,before)
})
await test('nonresetting outer/case/launcher deadlines and capture after stop', async()=>{
  for(const overrides of [{routeStartMs:-179990},{caseStartMs:-74990,routeStartMs:-74990},{launcherDeadlineMs:11}]){
    const f=fixture({},overrides);assert.throws(()=>f.capture(), /deadline/);assert.equal(f.probe.report().drawCalls,0)
  }
  const f=fixture();f.capture();f.probe.stop();f.setNow(75000)
  const r=await f.probe.retain();assert.equal(r.retention.status,'failed');assert.equal(r.cleanup.confirmed,true)
  assert.throws(()=>f.capture(), /terminal/)
})
await test('retention before stop fails once and closes capture without retry',async()=>{
  const f=fixture();f.capture();const r=await f.probe.retain()
  assert.equal(r.retention.status,'failed');assert.equal(r.cleanup.confirmed,true)
  const before=f.trace.length;await f.probe.retain();assert.equal(f.trace.length,before)
  assert.throws(()=>f.capture())
})
await test('WebCrypto abort: no retry, no late output, cleanup unconfirmed until pending operation settles',async()=>{
  let settle, calls=0
  const crypto={subtle:{digest:()=>{calls++;return new Promise(resolve=>{settle=resolve})}}}
  const f=fixture({}, {crypto,setTimer:setTimeout,clearTimer:clearTimeout})
  f.capture();f.probe.stop();const controller=new AbortController()
  const retained=f.probe.retain({signal:controller.signal});await Promise.resolve();await Promise.resolve()
  controller.abort();const r=await retained
  assert.equal(r.retention.status,'failed');assert.equal(r.cleanup.confirmed,false);assert.equal(calls,1)
  assert.equal(r.pairs[0].arms.A.rawPixelSha256,null)
  settle(new ArrayBuffer(32));await Promise.resolve();await Promise.resolve()
  assert.equal(f.probe.report().cleanup.confirmed,true)
  assert.equal(f.probe.report().pairs[0].arms.A.rawPixelSha256,null)
  await f.probe.retain();assert.equal(calls,1)
})
await test('WebCrypto timeout uses remaining original deadline, no late result accepted',async()=>{
  let timeout, settle, delay
  const f=fixture({}, {crypto:{subtle:{digest:()=>new Promise(resolve=>{settle=resolve})}},
    setTimer:(callback,ms)=>{timeout=callback;delay=ms;return 1},clearTimer:()=>{}})
  f.capture();f.probe.stop();const retained=f.probe.retain();await Promise.resolve();await Promise.resolve()
  assert.ok(delay>0&&delay<75000);timeout();const r=await retained
  assert.match(r.retention.error,/deadline/);assert.equal(r.cleanup.confirmed,false)
  settle(new ArrayBuffer(32));await Promise.resolve();await Promise.resolve()
  assert.equal(f.probe.report().cleanup.confirmed,true)
})
await test('256 square/8 destinations reaches 2MiB nominal backing; stop releases all',async()=>{
  const f=fixture();f.selection.clip={x:0,y:0,width:256,height:256}
  for(let i=0;i<4;i++){f.capture();f.next()}
  assert.equal(f.probe.report().peakNominalBackingBytes,2097152)
  f.probe.stop();const r=await f.probe.retain();assert.equal(r.peakReadbackArrays,2);assert.equal(r.cleanup.confirmed,true)
})

await test('wrong slot/order/source instructions explicitly rejected', () => {
  for(const [key,value] of [['slot',1],['order',['B','A']],['arm','B'],['source',{}],['clip',{}]]) {
    const f=fixture();assert.throws(()=>f.probe.capture({...f.sample(),[key]:value},()=>f.selection), /Caller-selected/)
  }
  const f=fixture();assert.throws(()=>f.capture(()=>({...f.selection,source:{}})), /Caller-selected/)
})
await test('source profile changed before a later reservation cannot create more copies',()=>{
  const f=fixture();f.capture();f.next();f.state.profile='different'
  assert.throws(()=>f.capture(), /profile/);assert.equal(f.probe.report().drawCalls,2)
  f.probe.cleanup();assert.equal(f.probe.report().cleanup.confirmed,true)
})
await test('readback dimensions, canonical budget and oversize encoding fail closed',async()=>{
  for(const [alter,overrides] of [[{readDimensions:0},{}],[{}, {canonicalPngByteLimit:1}],
    [{png:()=> 'data:image/png;base64,'+'A'.repeat(1398108)},{}]]) {
    const f=fixture(alter,overrides);f.capture();f.probe.stop();const r=await f.probe.retain()
    assert.equal(r.retention.status,'failed');assert.equal(r.cleanup.confirmed,true)
  }
})
await test('allocation failure and failed selection do not reserve replacement copies',async()=>{
  const f=fixture({create:()=>{throw Error('supplied create failure')}})
  assert.throws(()=>f.capture(), /create failure/);assert.equal(f.probe.report().pairs.length,1)
  assert.equal(f.probe.report().cleanup.confirmed,true)
  const g=fixture();assert.throws(()=>g.capture(()=>{throw Error('browser closed')}), /browser closed/)
  assert.equal(g.probe.report().cleanup.confirmed,true)
})

await test('actual serialized installer owns one namespace, no arbitrary callback injection, independent dispose',async()=>{
  const f=fixture(), person=f.state.person
  const unit={id:54,kind:'shaman',team:'blue',hp:30,fight:{motion:person,started:379,opponent:19,group:1,action:'special'}}
  const world={turn:379,speed:1,paused:false,units:[unit]}
  f.source.getBoundingClientRect=()=>({left:0,top:0,width:960,height:720})
  const scene={world,renderer:{domElement:f.source,info:{render:{frame:453}}},gameClock:{animationFrame:10},
    picking:{personBounds:()=>({x:22,y:32,width:2,height:2})}}
  const document={createElement:()=>f.canvases.length===0 ? (()=>{ f.capture(); return f.canvases[0] })() : (()=>{throw Error('stop supplied installer test')})(),
    visibilityState:'visible',elementFromPoint:()=>f.source,querySelectorAll:()=>[]}
  const context=vm.createContext({document,performance:{now:()=>10},structuredClone,innerWidth:960,innerHeight:720,devicePixelRatio:1,
    window:{testSceneRef:{current:scene},testStore:{getWorld:()=>world}},setTimeout,clearTimeout,Uint8ClampedArray,TextEncoder,atob})
  // Compile only this module's trusted exported function, never caller text.
  vm.runInContext(`${installCaptureProbe.toString()};this.install=installCaptureProbe`,context,{timeout:1000})
  const config={episodeId:'installer',routeStartMs:0,caseStartMs:0,launcherDeadlineMs:180000,canonicalPngByteLimit:8388608,sourceProfile:'supplied',requestDigests:false}
  const metadata=context.install(config)
  assert.deepEqual(JSON.parse(JSON.stringify(metadata)),{installed:true,namespace:'__pndMeleeCaptureDiagnostic',episodeId:'installer',runtimeAdmitted:false})
  let owned=context.__pndMeleeCaptureDiagnostic
  assert.throws(()=>context.install(config), /occupied/)
  scene.renderer.domElement={...f.source}
  assert.throws(()=>owned.capture(f.sample()), /guard failed/)
  assert.equal(f.canvases.length,0)
  assert.equal(owned.dispose().sourceAliasesCleared,true)
  scene.renderer.domElement=f.source
  context.install({...config,episodeId:'second'})
  owned=context.__pndMeleeCaptureDiagnostic
  const before=JSON.stringify({world,scene:scene.gameClock,stamp:scene.renderer.info.render.frame})
  assert.throws(()=>owned.capture(f.sample()), /stop supplied installer/)
  assert.equal(JSON.stringify({world,scene:scene.gameClock,stamp:scene.renderer.info.render.frame}),before)
  const replacement={foreign:true};Object.defineProperty(context,'__pndMeleeCaptureDiagnostic',{value:replacement,configurable:true})
  assert.throws(()=>owned.report(),/ownership changed/)
  const disposal=owned.dispose();assert.equal(disposal.namespaceOwned,false);assert.equal(context.__pndMeleeCaptureDiagnostic,replacement)
  assert.equal(disposal.sourceAliasesCleared,true)
  assert.throws(()=>owned.capture(f.sample()),/ownership changed/)
  assert.throws(()=>owned.retain(),/ownership changed/)
  assert.throws(()=>owned.stop(),/ownership changed/)
  assert.deepEqual(owned.dispose(),disposal)
  vm.runInContext('delete globalThis.__pndMeleeCaptureDiagnostic', context, { timeout: 1000 })
  context.install({...config,episodeId:'installer2'})
  context.performance.now=()=>NaN
  const badTimerDisposal=context.__pndMeleeCaptureDiagnostic.dispose()
  assert.equal(badTimerDisposal.removed,true)
  assert.equal(badTimerDisposal.sourceAliasesCleared,true)
  assert.equal(badTimerDisposal.cleanup.confirmed,true)
  assert.match(badTimerDisposal.error,/timer/)
  assert.equal(Object.hasOwn(context,'__pndMeleeCaptureDiagnostic'),false)
})
await test('unknown, mismatched or unapplied effective context attributes cannot complete the comparison', async () => {
  for (const attributes of [() => ({}), ({ number, args }) => ({ alpha: true, colorSpace: 'srgb', colorType: 'unorm8',
    desynchronized: number === 1, willReadFrequently: args[1]?.willReadFrequently ?? false }),
  () => ({ alpha: true, colorSpace: 'srgb', colorType: 'unorm8', desynchronized: false, willReadFrequently: false })]) {
    const f = fixture({ attributes })
    for (let i = 0; i < 4; i++) { f.capture(); f.next() }
    f.probe.stop()
    const report = await f.probe.retain()
    assert.equal(report.retention.status, 'failed')
    assert.match(report.firstError, /color interpretation/)
    assert.equal(report.cleanup.confirmed, true)
  }
})
await test('equal unknown color enums and invalid attribute types fail closed', async () => {
  for (const invalid of [{ colorSpace: 'unknown' }, { colorSpace: 'display-p3' }, { colorType: 'float16' },
    { colorType: 'unknown' }, { alpha: 'true' }, { desynchronized: 'false' }]) {
    const f = fixture({ attributes: ({ args }) => ({ alpha: true, colorSpace: 'srgb', colorType: 'unorm8',
      desynchronized: false, willReadFrequently: args[1]?.willReadFrequently ?? false, ...invalid }) })
    for (let i = 0; i < 4; i++) { f.capture(); f.next() }
    f.probe.stop(); const result = await f.probe.retain()
    assert.equal(result.retention.status, 'failed'); assert.equal(result.cleanup.confirmed, true)
  }
})
console.log(JSON.stringify({schema:'capture-probe-source-controls-v1',status:'passed',node:process.version,
  scope:'Supplied browser APIs, states, RGBA and PNG-header bytes only; no actual canvas/browser/rendering/timing result.',
  sourceSha256:createHash('sha256').update(readFileSync(new URL('../scripts/tutorial-browser/capture-probe.mjs',import.meta.url))).digest('hex'),tests},null,2))
