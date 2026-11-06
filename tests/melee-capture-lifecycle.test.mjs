import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import vm from 'node:vm'
import { installCaptureProbe } from '../scripts/tutorial-browser/capture-probe.mjs'

import { captureProbeFixture as fixture, suppliedHeaderPng as png } from './support/capture-probe-fixture.mjs'
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const tests = []
const test = async (name, run) => { await run(); tests.push({ name, status: 'passed' }) }
const fill = f => { for (let i = 0; i < 4; i++) { f.capture(); f.next() }; f.probe.stop() }
const retainedFields = state => state.pairs.map(pair => Object.fromEntries(['A','B'].map(arm => [arm, {
  raw: pair.arms[arm].rawPixelSha256, png: pair.arms[arm].png, pngHash: pair.arms[arm].pngSha256,
}])))

await test('timer invalid at retention entry returns failed evidence and releases all eight copies', async () => {
  const f = fixture(); fill(f); f.setNow(NaN)
  const result = await f.probe.retain()
  assert.equal(result.retention.status, 'failed'); assert.equal(result.retention.done, true)
  assert.match(result.retention.error, /Non-monotonic timer/)
  assert.equal(result.retention.startedMs, null); assert.equal(result.retention.endedMs, null)
  assert.equal(result.cleanup.confirmed, true); assert.equal(result.nominalBackingBytes, 0)
  assert.ok(f.canvases.every(canvas => canvas.width === 0 && canvas.height === 0))
  assert.equal(f.trace.filter(call => call[0] === 'read').length, 0)
  const before = f.trace.length; f.setNow(1000); await f.probe.retain(); assert.equal(f.trace.length, before)
})
await test('timer throws at retention entry/finalization without escaping cleanup', async () => {
  let broken = false, clock = 0
  const f = fixture({}, { now: () => { if (broken) throw Error('supplied timer throw'); return ++clock } })
  fill(f); broken = true
  const result = await f.probe.retain()
  assert.equal(result.retention.status, 'failed'); assert.equal(result.retention.done, true)
  assert.match(result.retention.error, /timer throw/); assert.equal(result.cleanup.confirmed, true)
})
for (const requestDigests of [false, true]) await test(`last PNG crosses deadline; digest selection ${requestDigests}`, async () => {
  let f, digests = 0
  f = fixture({ png: number => { if (number === 7) f.setNow(75000); return png } }, requestDigests ? {
    crypto: { subtle: { digest: async () => { digests++; return new ArrayBuffer(32) } } },
    setTimer: setTimeout, clearTimer: clearTimeout,
  } : {})
  fill(f); const result = await f.probe.retain()
  assert.equal(result.retention.status, 'failed'); assert.match(result.firstError, /deadline/)
  assert.ok(result.retention.endedMs >= result.deadline); assert.equal(result.cleanup.confirmed, true)
  assert.equal(result.pairs[3].arms.B.png, null); assert.equal(result.pairs[3].arms.B.pngSha256, null)
  assert.equal(digests, requestDigests ? 15 : 0)
})
await test('timer invalidated by final PNG cannot escape cleanup or publish the last output', async () => {
  let f
  f = fixture({ png: number => { if (number === 7) f.setNow(NaN); return png } })
  fill(f); const result = await f.probe.retain()
  assert.equal(result.retention.status, 'failed'); assert.equal(result.retention.done, true)
  assert.equal(result.retention.endedMs, null); assert.equal(result.cleanup.confirmed, true)
  assert.equal(result.pairs[3].arms.B.png, null)
})
await test('direct cleanup invalidates no-digest in-flight retention before any publication', async () => {
  const f = fixture(); fill(f)
  const pending = f.probe.retain(); f.probe.cleanup()
  const result = await pending
  assert.equal(result.retention.status, 'failed'); assert.match(result.retention.error, /invalidated/)
  assert.equal(result.cleanup.confirmed, true)
  assert.ok(retainedFields(result).every(pair => ['A','B'].every(arm => pair[arm].png === null && pair[arm].raw === null)))
})

function installFixture(f, crypto) {
  let now = 10
  const unit = { id:54,kind:'shaman',team:'blue',hp:30,
    fight:{ motion:f.state.person,started:379,opponent:19,group:1,action:'special' } }
  const world = { turn:379,speed:1,paused:false,units:[unit] }
  f.source.getBoundingClientRect = () => ({ left:0,top:0,width:960,height:720 })
  const scene = { world,renderer:{ domElement:f.source,info:{render:{frame:453}} },
    gameClock:{animationFrame:10},picking:{personBounds:()=>({x:22,y:32,width:2,height:2})} }
  Object.assign(f.document,{ visibilityState:'visible',elementFromPoint:()=>f.source,querySelectorAll:()=>[] })
  const context = vm.createContext({ document:f.document,performance:{now:()=>++now},structuredClone,
    innerWidth:960,innerHeight:720,devicePixelRatio:1,
    window:{testSceneRef:{current:scene},testStore:{getWorld:()=>world}},
    crypto,setTimeout,clearTimeout,Uint8ClampedArray,Uint8Array,ArrayBuffer,TextEncoder,atob })
  vm.runInContext(`${installCaptureProbe.toString()};this.install=installCaptureProbe`,context,{timeout:1000})
  context.install({episodeId:'lifecycle',routeStartMs:0,caseStartMs:0,launcherDeadlineMs:180000,
    canonicalPngByteLimit:8388608,sourceProfile:'supplied',requestDigests:true})
  const owned = context.__pndMeleeCaptureDiagnostic
  for(let i=0;i<4;i++) {
    owned.capture(f.sample()); f.next();world.turn=f.state.turn
    scene.renderer.info.render.frame=f.state.stamp;scene.gameClock.animationFrame=f.state.animationFrame
  }
  owned.stop({reason:'entry-complete'})
  return {owned,context}
}
for (let ordinal = 1; ordinal <= 16; ordinal++) await test(`serialized installer disposal during digest ${ordinal} invalidates pending retention`, async () => {
  const f = fixture()
  let settle, digests = 0
  const crypto = { subtle: { digest: () => {
    digests++
    if(digests === ordinal) return new Promise((resolve,reject) => { settle = ordinal % 2 ? resolve : () => reject(Error('supplied late native rejection')) })
    return Promise.resolve(new ArrayBuffer(32))
  } } }
  const {owned,context} = installFixture(f,crypto)
  const pending = owned.retain()
  for(let i=0;i<300&&!settle;i++) await Promise.resolve()
  assert.equal(digests,ordinal)
  const before = retainedFields(owned.report()), calls = f.trace.length
  const disposal = owned.dispose()
  assert.equal(disposal.removed,true);assert.equal(disposal.sourceAliasesCleared,true)
  assert.equal(disposal.cleanup.confirmed,false)
  assert.equal(Object.hasOwn(context,'__pndMeleeCaptureDiagnostic'),false)
  // Completion of the failed retention does not require native crypto to settle.
  const result = await pending
  assert.equal(result.retention.status,'failed');assert.match(result.firstError,/invalidated/)
  assert.equal(result.retention.done,true);assert.equal(result.cleanup.confirmed,false)
  assert.equal(result.digestOutstanding,true);assert.equal(result.liveReadbackArrays,0)
  assert.equal(result.nominalBackingBytes,0)
  assert.deepEqual(retainedFields(result),before)
  const afterCleanup = f.trace.length
  assert.ok(afterCleanup >= calls)
  assert.ok(f.canvases.every(canvas=>canvas.width===0&&canvas.height===0))
  settle(new ArrayBuffer(32))
  for(let i=0;i<10;i++) await Promise.resolve()
  assert.equal(owned.dispose().cleanup.confirmed,true)
  assert.equal(digests,ordinal);assert.equal(f.trace.length,afterCleanup)
  assert.throws(()=>owned.retain(),/ownership changed/)
  // The result delivered before late settlement remains failed and unchanged.
  assert.deepEqual(retainedFields(result),before)
})
await test('verified destination ownership precedes afterCreate timer failure', () => {
  const canvas = { width:300,height:150 }
  let created = false
  const f = fixture({create:()=>{created=true;return canvas}}, {
    now:()=>{if(created)throw Error('afterCreate timer failure');return 10},
  })
  assert.throws(()=>f.capture(),/timer failure/)
  assert.equal(canvas.width,0);assert.equal(canvas.height,0)
  assert.equal(f.probe.report().allocations,1)
  assert.equal(f.probe.report().cleanup.confirmed,true)
})
await test('callback timing accepts only finite numbers or absent/null, not references', () => {
  for(const key of ['rafTimestampMs','callbackEntryMs']) for(const value of [{scene:{}},[],NaN,Infinity,'10']) {
    const f = fixture()
    assert.throws(()=>f.probe.capture({...f.sample(),[key]:value},()=>f.selection),/timing metadata/)
    assert.equal(f.probe.report().allocations,0)
  }
  for(const value of [undefined,null,0,1.5]) {
    const f = fixture()
    f.probe.capture({...f.sample(),rafTimestampMs:value,callbackEntryMs:value},()=>f.selection)
    f.probe.cleanup();assert.equal(f.probe.report().cleanup.confirmed,true)
  }
})
console.log(JSON.stringify({schema:'capture-probe-lifecycle-controls-v1',status:'passed',node:process.version,
  scope:'Supplied APIs and authenticated fixture; actual serialized installer lifecycle only, no browser or pixels.',
  helperSha256:hash(readFileSync(new URL('../scripts/tutorial-browser/capture-probe.mjs',import.meta.url))),tests},null,2))
