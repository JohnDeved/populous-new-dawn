// Explicit opt-in functional adapter. Nothing installs/runs on import; no CLI,
// workflow, cohort registry or performance comparator is changed.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { installOrdinaryPointerBrowserObserver } from './ordinary-pointer-browser-observer.mjs'
import { ordinaryPointerRepeatContract as C } from './ordinary-pointer-repeat-contract.mjs'
import { ordinaryPointerWallWatchdog, assertOrdinaryPointerCallbackAck } from './ordinary-pointer-driver-primitives.mjs'
import { decodeOrdinaryPointerCapture } from './ordinary-pointer-capture-decoder.mjs'
import { ordinaryPointerResultWitness } from './ordinary-pointer-result-witness.mjs'

// Called after the existing reviewed snapshot setup/geometry installation and
// F8 preparation. It never loads worlds or mutates scene/picker state itself.
export async function captureOrdinaryPointerBrowser({ page, enabled = false, afterInputCapture }) {
  assert.equal(enabled, true, 'Explicit functional adapter opt-in required')
  assert.ok(afterInputCapture===undefined||typeof afterInputCapture==='function','Diagnostic boundary must be callable')
  const captureSource = readFileSync(new URL('./ordinary-pointer-capture-buffer.mjs', import.meta.url), 'utf8')
  assert.equal((captureSource.match(/export function createOrdinaryPointerCaptureBuffer/g) ?? []).length, 1)
  const epoch = randomBytes(32).toString('hex')
  let installed=false, packet=null, cleanupError=null, cleanupFailed=false, operationSettled=false, waitCleanupFailed=false
  const outcome=await ordinaryPointerWallWatchdog(async signal=>{
    try {
    const check=()=>{if(signal.aborted)throw signal.reason}
    check()
    const boundary=await page.evaluate(async()=>{
      const g=window.__pndSnapshotGeometry
      if(!g)throw Error('Reviewed snapshot geometry prerequisite missing')
      return g.captureBoundary()
    })
    check()
    installed=true // installation requested; uncertain completion still requires cleanup
    await page.evaluate(({source,observer,boundary,epoch})=>{
      const create=(0,eval)(`(()=>{${source.replace('export function createOrdinaryPointerCaptureBuffer','function createOrdinaryPointerCaptureBuffer')};return createOrdinaryPointerCaptureBuffer})()`)
      const install=(0,eval)(`(${observer})`)
      return install(window,create,window.__pndSnapshotGeometry,boundary,epoch)
    },{source:captureSource,observer:installOrdinaryPointerBrowserObserver.toString(),boundary,epoch})
    installed=true;check()
    for(let sequence=1;sequence<=54;sequence++){
      check();const armed=await page.evaluate(epoch=>{
        const api=window.__pndOrdinaryPointerObserver
        if(api?.epoch!==epoch)throw Error('Observer epoch changed before arm')
        return api.arm()
      },epoch)
      assert.equal(armed.sequence,sequence);assert.deepEqual(armed.point,C.offsets[(sequence-1)%6].map((v,i)=>C.origin[i]+v));check()
      await page.evaluate(epoch=>{if(window.__pndOrdinaryPointerObserver?.epoch!==epoch)throw Error('Observer epoch changed before dispatch')},epoch);check()
      await page.mouse.move(armed.point[0],armed.point[1]);check()
      const eventAck=await page.evaluate(epoch=>{
        const api=window.__pndOrdinaryPointerObserver
        if(api?.epoch!==epoch)throw Error('Observer epoch changed before event acknowledgment')
        return api.status()
      },epoch)
      assert.equal(eventAck.error,null);assert.equal(eventAck.inputSequence,sequence);assert.equal(eventAck.epoch,epoch)
      const expected={sequence,epoch,anchorSerial:eventAck.anchorSerial,anchorTimestampMs:eventAck.anchorTimestampMs}
      let handle, failed=false, primary
      try {
        handle=await page.waitForFunction(({sequence,epoch})=>{
          const api=window.__pndOrdinaryPointerObserver
          if(api?.epoch!==epoch)throw Error('Observer epoch changed while waiting')
          const state=api.status()
          return !!state.error || state.completed>=sequence
        },{sequence,epoch},{timeout:90000})
      } catch(error){failed=true;primary=error}
      finally { if(handle)try{await handle.dispose()}catch(error){waitCleanupFailed=true;if(!failed){failed=true;primary=error}} }
      if(failed)throw primary
      check();const status=await page.evaluate(epoch=>{
        const api=window.__pndOrdinaryPointerObserver
        if(api?.epoch!==epoch)throw Error('Observer epoch changed before callback acknowledgment')
        return api.status()
      },epoch)
      assert.equal(status.error,null);assert.equal(status.completed,sequence)
      assertOrdinaryPointerCallbackAck(expected,status)
    }
    check()
    // Optional diagnostic boundary only: all54 exact acknowledgments are complete.
    // Final geometry, observer stop, export and replay remain mandatory afterward.
    if(afterInputCapture){await afterInputCapture({completed:54});check()}
    const after=await page.evaluate(epoch=>{
      const api=window.__pndOrdinaryPointerObserver
      if(api?.epoch!==epoch)throw Error('Observer epoch changed before final geometry')
      return api.boundary()
    },epoch);check()
    assert.equal(after.fingerprintSha256,boundary.fingerprintSha256,'Geometry bytes changed across capture')
    assert.deepEqual(after.witness,boundary.witness,'Final geometry witness changed')
    packet=await stop(true);installed=false;check()
    assert.equal(packet.error,null)
    packet.geometryBefore=boundary;packet.geometryAfter=after
    return replayOrdinaryPointerBrowserPacket(packet)
    } finally { operationSettled=true }
  })
  // Stop is bounded independently of a possibly blocked page. It is not proof
  // of page/process termination. No forced close of caller-owned resources.
  async function stop(success){
    const wire=await page.evaluate(({success,epoch})=>{
      const api=window.__pndOrdinaryPointerObserver
      if(!api)return null
      if(api.epoch!==epoch)throw Error('Refuse cleanup of another observer epoch')
      const p=api.stop(success)
      for(const [owner,key] of [[p,'rows'],[p,'events'],[p,'rawUpdates'],[p.capture,'inputs'],[p.capture,'frames']]){
        const a=owner[key],bytes=new Uint8Array(a.buffer,a.byteOffset,a.byteLength)
        let binary='';for(let i=0;i<bytes.length;i++)binary+=String.fromCharCode(bytes[i])
        owner[key]={float64Base64:btoa(binary),length:a.length,littleEndian:new Uint8Array(new Uint16Array([1]).buffer)[0]===1}
      }
      const text=JSON.stringify(p,(_,v)=>typeof v==='number'&&(!Number.isFinite(v)||Object.is(v,-0))?{__pndNumber:Object.is(v,-0)?'-0':String(v)}:v)
      if(new TextEncoder().encode(text).length>4*1024*1024)throw Error('Adapter output cap exceeded')
      return text
    },{success,epoch})
    assert.equal(typeof wire,'string','Observer output unavailable')
    assert.ok(Buffer.byteLength(wire)<=4*1024*1024)
    const p=JSON.parse(wire,(_,v)=>v&&typeof v==='object'&&Object.keys(v).length===1&&Object.hasOwn(v,'__pndNumber')?
      ({NaN:NaN,Infinity:Infinity,'-Infinity':-Infinity,'-0':-0})[v.__pndNumber]:v)
    for(const [owner,key,max] of [[p,'rows',1200*129],[p,'events',55*8],[p,'rawUpdates',55*8],[p.capture,'inputs',550],[p.capture,'frames',4800]]){
      const v=owner[key];assert.ok(Number.isSafeInteger(v?.length)&&v.length>=0&&v.length<=max)
      assert.equal(typeof v.float64Base64,'string');assert.ok(v.float64Base64.length<=Math.ceil(max*8/3)*4)
      assert.equal(v.littleEndian,new Uint8Array(new Uint16Array([1]).buffer)[0]===1,'Cross-endian transport is unsupported')
      const b=Buffer.from(v.float64Base64,'base64');assert.equal(b.length,v.length*8)
      assert.equal(b.toString('base64'),v.float64Base64)
      owner[key]=new Float64Array(Uint8Array.from(b).buffer)
    }
    return p
  }
  if(installed){
    let timer
    try { packet=await Promise.race([stop(false),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Observer cleanup deadline')),2000)})]);installed=false }
    catch(error){cleanupFailed=true;cleanupError=error}
    finally{clearTimeout(timer)}
  }
  const observerCleanupConfirmed=!installed && !!packet && packet.cleanupErrors.length===0
  return { outcome,packet,cleanupError,cleanupFailed,observerCleanupConfirmed,operationSettled,waitCleanupFailed,
    cleanupConfirmed:observerCleanupConfirmed && operationSettled && !waitCleanupFailed && !outcome.timerCleanupFailed,comparisonEligible:false }
}

// Post-capture only. Exact serial-indexed production rows, not an opportunistic
// timestamp search, supply metrics. GPU completion reflects stop-time state.
export function replayOrdinaryPointerBrowserPacket(packet){
  assert.equal(packet.error,null)
  assert.ok(Array.isArray(packet.geometryWitness)&&packet.geometryWitness.length===113&&packet.geometryWitness.every(Number.isFinite))
  assert.ok(packet.geometryBefore&&packet.geometryAfter,'Missing geometry boundaries')
  {
    assert.equal(packet.geometryBefore.fingerprintSha256,packet.initial.geometrySha256)
    assert.equal(packet.geometryAfter.fingerprintSha256,packet.initial.geometrySha256)
    assert.deepEqual(packet.geometryBefore.witness,packet.geometryWitness);assert.deepEqual(packet.geometryAfter.witness,packet.geometryWitness)
  }
  const c=packet.capture;assert.equal(packet.width,133);assert.equal(packet.eventWidth,8)
  assert.ok(packet.rows instanceof Float64Array&&packet.rows.length===c.frameCount*133)
  assert.ok(Array.isArray(packet.recent)&&packet.recent.length===c.initialSerial+c.frameCount)
  assert.ok(packet.events instanceof Float64Array&&packet.events.length===c.inputCount*8)
  assert.ok(packet.rawUpdates instanceof Float64Array)
  assert.ok(packet.events.every(Number.isFinite)&&packet.rawUpdates.every(Number.isFinite),'Nonfinite event telemetry')
  assert.equal(typeof packet.rawMode,'boolean')
  assert.equal(packet.rawUpdates.length,packet.rawMode?c.inputCount*8:0)
  for(let n=0;n<c.inputCount;n++){
    const i=n*10,e=n*8
    for(const [a,b] of [[0,1],[1,2],[5,6],[6,7],[7,8]])assert.equal(packet.events[e+a],c.inputs[i+b])
    assert.ok(Number.isSafeInteger(packet.events[e+2])&&packet.events[e+2]>=0)
    if(n)assert.equal(packet.events[e+2],packet.events[2])
    assert.ok(Number.isFinite(packet.events[e+3])&&Number.isFinite(packet.events[e+4])&&packet.events[e+4]>=0&&packet.events[e+4]<=packet.events[e+3])
    if(packet.rawMode){
      for(const k of [0,1,2,4])assert.equal(packet.rawUpdates[e+k],packet.events[e+k])
      assert.ok(packet.rawUpdates[e+3]>=packet.rawUpdates[e+4]&&packet.rawUpdates[e+3]<=packet.events[e+3])
      assert.ok(packet.rawUpdates[e+5]<=packet.events[e+5]&&packet.rawUpdates[e+6]<=packet.events[e+6])
    }
  }
  const inputs=Array.from({length:c.inputCount},(_,rowIndex)=>{
    const p=rowIndex*10
    return {rowIndex,sequence:c.inputs[p+9],epoch:packet.initial.epoch,timestampMs:c.inputs[p+6],
      anchorSerial:c.inputs[p+7],anchorTimestampMs:c.inputs[p+8]}
  })
  const frames=Array.from({length:c.frameCount},(_,rowIndex)=>{
    const i=rowIndex*133,serial=packet.rows[i],timestampMs=packet.rows[i+1],observedCompletedAtMs=packet.rows[i+2]
    assert.equal(serial,c.initialSerial+rowIndex+1)
    for(let n=0;n<113;n++)assert.equal(packet.rows[i+16+n],packet.geometryWitness[n],'Recorded geometry row differs')
    const production=packet.recent[serial-1];assert.equal(production.timestampMs,timestampMs);assert.equal(production.state,'paused')
    const metrics=production.pointerBreakdown;assert.ok(metrics?.interaction&&metrics.ordinaryTerrain)
    const point=[packet.rows[i+3],packet.rows[i+4]],nullable=x=>x===-1?null:x
    const resultWitness=ordinaryPointerResultWitness({mode:packet.rows[i+7],navigationPointer:{x:packet.rows[i+129],y:packet.rows[i+130],buttons:packet.rows[i+131]},navigationButtons:packet.rows[i+132],
      pointerScreen:{clientX:point[0],clientY:point[1]},hoveredObject:nullable(packet.rows[i+13]),
      tooltipInput:{pointer:{clientX:packet.rows[i+14],clientY:packet.rows[i+15]},
        route:['world','unmapped-cell','unmapped-object'][packet.rows[i+9]],picked:nullable(packet.rows[i+10]),
        cell:nullable(packet.rows[i+11]),inspectionTarget:nullable(packet.rows[i+12])}},point)
    assert.equal(packet.rows[i+5],1)
    return {rowIndex,serial,timestampMs,observedCompletedAtMs,epoch:packet.initial.epoch,
      geometrySha256:packet.initial.geometrySha256,point,paused:true,turn:packet.rows[i+6],mode:packet.rows[i+7],buttons:packet.rows[i+8],
      pointerMoved:metrics.interaction.pointerMoved,viewChanged:metrics.interaction.viewChanged,
      terrainCalls:metrics.terrainPickCalls,objectCalls:metrics.objectPickCalls,ordinaryTriangles:metrics.ordinaryTerrain.visitedTriangles,resultWitness}
  })
  const decoded=decodeOrdinaryPointerCapture(c,{initial:packet.initial,inputs,frames})
  assert.equal(decoded.status,'decoded-consistent-unqualified',decoded.error)
  return decoded
}
