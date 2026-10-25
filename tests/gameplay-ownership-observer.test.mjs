import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { registerRetiredGameplayOwnership as register, sampleRetiredGameplayOwnership as sample, clearRetiredGameplayOwnership as clear } from '../scripts/tutorial-browser/gameplay-ownership-observer.mjs'
import { captureRetiredGameplayScene } from '../scripts/tutorial-browser/gameplay-resource-observer.mjs'
import { captureGameplayThreeCycleHeapSample, captureGameplayHeapSample } from '../scripts/tutorial-browser/gameplay-heap-observer.mjs'
import { parseGameplayResourceArguments as parse, gameplayThreeCycleArgument as profile, gameplayOwnershipArgument as probe } from '../scripts/tutorial-browser/gameplay-resource-profile.mjs'
const names = ['position', 'uv', 'landUv', 'surface', 'light', 'highlight']
function fixture() {
  const originalWindow = globalThis.window, originalWeakRef = globalThis.WeakRef, targets = new Map(), refs = []
  let derefs = 0
  globalThis.WeakRef = class { constructor(value) { targets.set(this, value); refs.push(this) } deref() { derefs++; return targets.get(this) } }
  const shared = new ArrayBuffer(64), pixels = new Uint8Array(128)
  const attrs = Object.fromEntries(names.map(name => [name, { array: new Float32Array(shared) }]))
  const scene = { disposed: true, terrainLoad: { signal: { aborted: true } }, renderer: { domElement: { isConnected: false }, getContext: () => ({ isContextLost: () => true }) }, ownedSounds: new Set(), buildingPanels: new Set(), fpsGraph: null,
    terrain: { geometry: { getAttribute: name => attrs[name], index: null } }, globe: { atlas: { pixels }, map: { image: { data: pixels } } } }
  globalThis.window = { testScene: scene, testSceneRef: { current: scene }, testStore: {} }
  return { scene, attrs, refs, targets, shared, derefs: () => derefs, restore() { globalThis.window = originalWindow; globalThis.WeakRef = originalWeakRef } }
}
function primitive(v) {
  if (v === null || ['number', 'string', 'boolean'].includes(typeof v)) return
  assert.equal(typeof v, 'object'); assert.ok(Array.isArray(v) || Object.getPrototypeOf(v) === Object.prototype)
  Object.values(v).forEach(primitive)
}
test('registration deduplicates aliases without deref; state contains only weak handles and primitives', () => {
  const f = fixture(); try {
    const result = register(); assert.equal(result.registeredBuffers, 2); assert.equal(result.registeredOwners, 4)
    assert.equal(f.refs.length, 6); assert.equal(f.derefs(), 0); primitive(result)
    const state = window.__populousGameplayOwnershipV1.records[0]
    assert.deepEqual(Object.keys(state), ['retirement', 'owners', 'buffers', 'slots'])
    for (const b of state.buffers) assert.deepEqual(Object.keys(b), ['id', 'registeredByteLength', 'ref'])
    const observed = sample(); primitive(observed); assert.equal(observed.records[0].survivingBufferCount, 2)
    assert.equal(observed.records[0].survivingRegisteredByteLengths, 192); assert.ok(observed.records[0].complete)
    assert.ok(JSON.stringify(observed).length < 65536); clear(); assert.equal(window.__populousGameplayOwnershipV1, undefined)
  } finally { f.restore() }
})
test('owner and buffer survival differ; original/current detached lengths stay separately labelled', () => {
  const f = fixture(); try {
    register(); const record = window.__populousGameplayOwnershipV1.records[0]
    f.targets.delete(record.owners[0].ref); f.targets.delete(record.buffers[1].ref)
    structuredClone(f.shared, { transfer: [f.shared] }); const observed = sample().records[0]
    assert.equal(observed.owners[0].survival, 'collected'); assert.equal(observed.owners[1].survival, 'alive')
    assert.deepEqual(observed.buffers[0], { id: 0, registeredByteLength: 64, survival: 'alive', currentByteLength: 0, byteLengthChanged: true })
    assert.deepEqual(observed.buffers[1], { id: 1, registeredByteLength: 128, survival: 'collected', currentByteLength: null, byteLengthChanged: null })
    assert.equal(observed.survivingRegisteredByteLengths, 64)
  } finally { f.restore() }
})
test('missing/unsupported and optional absent inputs remain explicit', () => {
  const f = fixture(); try {
    delete f.attrs.position; f.attrs.uv.array = [1, 2]; delete f.scene.globe.atlas
    register(); const r = sample().records[0]; assert.equal(r.complete, false)
    for (const [label,status] of [['terrain.position','missing'],['terrain.uv','unsupported'],['terrain.index','absent-optional'],['globe.atlas.pixels','missing']])
      assert.equal(r.slots.find(s => s.label === label).status, status)
  } finally { f.restore() }
})
test('hard two-retirement/nine-buffer caps reject overflow rather than truncate', () => {
  const f = fixture(); try {
    names.forEach(n => { f.attrs[n].array = new Uint8Array(1) }); f.scene.terrain.geometry.index = { array: new Uint16Array(2) }; f.scene.globe.map.image.data = new Uint8Array(3)
    assert.equal(register().registeredBuffers, 9); assert.equal(register().registeredBuffers, 9); assert.throws(register, /cap/)
    assert.equal(f.refs.length, 26); assert.equal(f.derefs(), 0)
    window.__populousGameplayOwnershipV1.records[0].buffers.push({}); assert.throws(sample, /caps/)
  } finally { f.restore() }
})
test('unsupported WeakRef fails visibly, retirement finally deletes aliases', () => {
  const f = fixture(); try {
    globalThis.WeakRef = undefined
    assert.throws(() => { try { register() } finally { captureRetiredGameplayScene() } }, /WeakRef unsupported/)
    for (const key of ['testScene', 'testSceneRef', 'testStore']) assert.equal(Object.hasOwn(window,key), false)
    const source = readFileSync(new URL('../scripts/tutorial-browser/gameplay-frames.mjs',import.meta.url),'utf8')
    assert.match(source, /try \{\s*if \(ownershipProbe\) restart\.ownershipRegistration = await page\.evaluate\(registerRetiredGameplayOwnership\)\s*\} finally \{[\s\S]*?restart\.retired = await page\.evaluate\(captureRetiredGameplayScene\)/)
  } finally { f.restore() }
})
const live = () => ({ timestampMs:100,timeOriginUnixMs:10000,sceneUuid:'scene',level:2,turn:5,paused:false,inputMask:0,speed:1,visibility:'visible',disposed:false,aborted:false,canvasConnected:true,connectedBattlefieldCanvases:1,contextLost:false,rendererGeometries:2,rendererTextures:3,reachableGeometryIds:['g'],reachableTextureIds:['t'],reachableMaterialIds:['m'] })
test('awaited GC then heap then weak read; opt-out and historical policies unchanged', async () => {
  const calls=[]; let time=0
  const options={boundary:'after-cycle-1-workload',now:()=>++time,assertF8Hidden:async()=>{},observe:async()=>{calls.push('observe');return live()},
    session:{send:async method=>{calls.push(method+':start');await Promise.resolve();calls.push(method+':complete');return method==='Runtime.getIsolateId'?{id:'isolate'}:method==='Runtime.getHeapUsage'?{usedSize:1,totalSize:2,embedderHeapUsedSize:0,backingStorageSize:3}:{}}},
    afterHeapRead:async()=>{calls.push('weak');return {version:1,records:[]}}}
  const result=await captureGameplayThreeCycleHeapSample(options)
  assert.ok(calls.indexOf('weak')>calls.indexOf('Runtime.getHeapUsage:complete'))
  assert.ok(calls.indexOf('Runtime.getHeapUsage:start')>calls.indexOf('HeapProfiler.collectGarbage:complete'))
  assert.equal(calls.filter(c=>c==='weak').length,1);assert.equal(calls.filter(c=>c==='HeapProfiler.collectGarbage:start').length,1)
  assert.deepEqual(result.ownership,{version:1,records:[]})
  await assert.rejects(captureGameplayHeapSample({...options,boundary:'after-workload'}),/three-cycle/)
  assert.equal(Object.hasOwn(await captureGameplayThreeCycleHeapSample({...options,afterHeapRead:undefined}),'ownership'),false)
  let failed
  await assert.rejects(captureGameplayThreeCycleHeapSample({...options,onSample:s=>{failed=s},afterHeapRead:async()=>{throw Error('weak read failed')}}),/weak read failed/)
  assert.equal(failed.status,'failed');assert.equal(failed.gc.completed,true);assert.equal(failed.bytes.backingStorageSize,3)
})
test('explicit opt-in only alongside three-cycle, historical defaults preserved', () => {
  assert.deepEqual(parse([],'gameplay-resources'),{output:undefined,profile:undefined})
  assert.deepEqual(parse([profile],'gameplay-resources'),{output:undefined,profile:'three-cycle-v1'})
  assert.deepEqual(parse([profile,probe],'gameplay-resources'),{output:undefined,profile:'three-cycle-v1',ownershipProbe:'weak-v1'})
  for(const args of [[probe],[profile,probe,probe],[profile,'--gameplay-ownership-probe=anything']])assert.throws(()=>parse(args,'gameplay-resources'))
  assert.throws(()=>parse([profile,probe],'gameplay-frames'))
})


test('fixed post-workload boundaries require exact 0/1/2 ordered retirement records', async () => {
  const boundaries = ['after-cycle-1-workload', 'after-cycle-2-workload', 'after-cycle-3-workload']
  for (const [expected, boundary] of boundaries.entries()) {
    for (const ids of [[], [1], [1, 2], [1, 1]]) {
      const calls = []; let time = 0, retained
      const options = { boundary, now: () => ++time, onSample: value => { retained = value },
        observe: async () => live(), assertF8Hidden: async () => {},
        session: { send: async method => {
          await Promise.resolve(); calls.push(method)
          return method === 'Runtime.getIsolateId' ? { id: 'isolate' } :
            method === 'Runtime.getHeapUsage' ? { usedSize: 1, totalSize: 2, embedderHeapUsedSize: 0, backingStorageSize: 3 } : {}
        } }, afterHeapRead: async () => { calls.push('weak'); return { version: 1, records: ids.map(retirement => ({ retirement })) } } }
      if (ids.length === expected && ids.every((id, index) => id === index + 1)) {
        assert.equal((await captureGameplayThreeCycleHeapSample(options)).status, 'passed')
      } else {
        await assert.rejects(captureGameplayThreeCycleHeapSample(options), /retirement count\/order/)
        assert.equal(retained.status, 'failed'); assert.equal(retained.gc.completed, true)
        assert.equal(retained.bytes.backingStorageSize, 3)
        assert.deepEqual(retained.ownership.records.map(record => record.retirement), ids)
      }
      assert.ok(calls.indexOf('weak') > calls.indexOf('Runtime.getHeapUsage'))
      assert.ok(calls.indexOf('Runtime.getHeapUsage') > calls.indexOf('HeapProfiler.collectGarbage'))
      assert.equal(calls.filter(method => method === 'HeapProfiler.collectGarbage').length, 1)
    }
  }
})

test('lost page ownership state at either post-restart boundary fails with raw heap bytes preserved', async () => {
  const f = fixture()
  try {
    register(); clear()
    for (const boundary of ['after-cycle-2-workload', 'after-cycle-3-workload']) {
      let retained, time = 0
      await assert.rejects(captureGameplayThreeCycleHeapSample({ boundary, now: () => ++time,
        onSample: value => { retained = value }, observe: async () => live(), assertF8Hidden: async () => {},
        session: { send: async method => method === 'Runtime.getIsolateId' ? { id: 'isolate' } :
          method === 'Runtime.getHeapUsage' ? { usedSize: 1, totalSize: 2, embedderHeapUsedSize: 0, backingStorageSize: 3 } : {} },
        afterHeapRead: async () => sample() }), /retirement count\/order/)
      assert.equal(retained.status, 'failed'); assert.equal(retained.gc.completed, true)
      assert.equal(retained.bytes.backingStorageSize, 3); assert.deepEqual(retained.ownership.records, [])
    }
    assert.equal(f.derefs(), 0)
  } finally { f.restore() }
})

import { gameplayOwnershipSelection } from '../scripts/tutorial-browser/gameplay-resource-profile.mjs'
test('exact-head Ready event snapshot selects fixed mode and survives later label removal', () => {
 const head='a'.repeat(40), event={action:'ready_for_review',pull_request:{draft:false,head:{sha:head},labels:[{name:`weak-v1:${head}`}]}}
 const selection=gameplayOwnershipSelection(event,'pull_request',head,'gameplay-resources')
 assert.deepEqual(selection,{version:1,mode:'weak-v1',event:'pull_request',action:'ready_for_review',headSha:head,label:`weak-v1:${head}`,scenario:'gameplay-resources'})
 for(const mutate of [e=>{e.action='labeled'},e=>{e.action='synchronize'},e=>{e.pull_request.draft=true},e=>{e.pull_request.head.sha='b'.repeat(40)},e=>{e.pull_request.labels=[]},e=>{e.pull_request.labels=[{name:'weak-v1'}]},e=>{e.pull_request.labels=[{name:`weak-v1:${'b'.repeat(40)}`}]},e=>{e.pull_request.labels=[{name:`weak-v1:${head};echo injected`}]}]) {
  const changed=structuredClone(event);mutate(changed);assert.equal(gameplayOwnershipSelection(changed,'pull_request',head,'gameplay-resources'),undefined)
 }
 assert.equal(gameplayOwnershipSelection(event,'workflow_dispatch',head,'gameplay-resources'),undefined)
 assert.equal(gameplayOwnershipSelection(event,'pull_request',head,'tutorial'),undefined)
 event.pull_request.labels=[]
 assert.equal(selection.label,`weak-v1:${head}`);assert.equal(gameplayOwnershipSelection(event,'pull_request',head,'gameplay-resources'),undefined)
})
