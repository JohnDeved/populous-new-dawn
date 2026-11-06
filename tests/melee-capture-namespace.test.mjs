import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import vm from 'node:vm'
import { installCaptureProbe } from '../scripts/tutorial-browser/capture-probe.mjs'

import { captureProbeFixture as fixture } from './support/capture-probe-fixture.mjs'
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const tests = []
const fields = result => result.pairs.map(pair => Object.fromEntries(['A','B'].map(arm => [arm, {
  raw: pair.arms[arm].rawPixelSha256, png: pair.arms[arm].png, pngHash: pair.arms[arm].pngSha256,
}])))
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
for (const mutation of ['replacement', 'deletion']) for (let ordinal=1; ordinal<=16; ordinal++) {
  const f=fixture()
  let settle, digests=0
  const crypto={subtle:{digest:()=>{
    digests++
    if(digests===ordinal) return new Promise(resolve=>{settle=resolve})
    return Promise.resolve(new ArrayBuffer(32))
  }}}
  const {owned,context}=installFixture(f,crypto)
  const pending=owned.retain()
  for(let i=0;i<300&&!settle;i++) await Promise.resolve()
  assert.equal(digests,ordinal)
  const before=fields(owned.report())
  const reads=f.trace.filter(call=>call[0]==='read').length
  const encodes=f.trace.filter(call=>call[0]==='encode').length
  const foreign={foreign:true}
  if(mutation==='replacement') Object.defineProperty(context,'__pndMeleeCaptureDiagnostic',{value:foreign,configurable:true})
  else vm.runInContext('delete globalThis.__pndMeleeCaptureDiagnostic',context,{timeout:1000})
  // Do not call any old-instance method between namespace mutation and awaited
  // continuation. Only the in-flight guard may detect the lost ownership.
  settle(new ArrayBuffer(32))
  const result=await pending
  assert.equal(result.retention.status,'failed')
  assert.equal(result.retention.done,true)
  assert.match(result.firstError,/invalidated/)
  assert.match(result.retention.error,/ownership changed/)
  assert.equal(result.cleanup.confirmed,true)
  assert.equal(result.digestOutstanding,false)
  assert.equal(result.liveReadbackArrays,0)
  assert.equal(result.nominalBackingBytes,0)
  assert.deepEqual(fields(result),before)
  assert.equal(digests,ordinal)
  assert.equal(f.trace.filter(call=>call[0]==='read').length,reads)
  assert.equal(f.trace.filter(call=>call[0]==='encode').length,encodes)
  assert.ok(f.canvases.every(canvas=>canvas.width===0&&canvas.height===0))
  if(mutation==='replacement') assert.equal(context.__pndMeleeCaptureDiagnostic,foreign)
  else assert.equal(Object.hasOwn(context,'__pndMeleeCaptureDiagnostic'),false)
  const calls=f.trace.length,disposal=owned.dispose()
  assert.equal(disposal.namespaceOwned,false)
  assert.equal(disposal.removed,false)
  assert.equal(disposal.sourceAliasesCleared,true)
  assert.equal(disposal.cleanup.confirmed,true)
  assert.equal(f.trace.length,calls)
  assert.throws(()=>owned.retain(),/ownership changed/)
  tests.push({name:`namespace ${mutation} during digest ${ordinal}: no late publication or success`,status:'passed'})
}
console.log(JSON.stringify({schema:'capture-probe-namespace-continuation-controls-v1',status:'passed',node:process.version,
  scope:'Supplied APIs and actual serialized installer only; no browser/pixels/runtime wiring.',
  helperSha256:hash(readFileSync(new URL('../scripts/tutorial-browser/capture-probe.mjs',import.meta.url))),tests},null,2))
