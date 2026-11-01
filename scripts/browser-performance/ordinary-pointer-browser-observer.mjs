// Explicit installation only. No top-level browser effects or benchmark entry.
// Self-contained for trusted Playwright evaluate; injected factory is exact reviewed
// capture-buffer source, not a production callback wrapper.
export function installOrdinaryPointerBrowserObserver(host, createCapture, geometry, boundary, epoch) {
  const scene = host.testSceneRef?.current, recorder = scene?.fpsGraph?.samples
  if (!scene || !recorder || host.__pndOrdinaryPointerObserver) throw Error('Missing or occupied observer owner')
  if (!geometry || geometry.witnessWidth !== 113 || boundary.witness?.length !== 113 || !boundary.witness.every(Number.isFinite) ||
      !/^[a-f0-9]{64}$/.test(boundary.fingerprintSha256) || !/^[a-f0-9]{64}$/.test(epoch)) throw Error('Missing geometry/epoch')
  if(host.innerWidth!==1440||host.innerHeight!==1000||host.devicePixelRatio!==1)throw Error('Unsupported viewport')
  const writeWitness=geometry.writeWitness, captureBoundary=geometry.captureBoundary
  const baselineWitness=boundary.witness.slice()
  const canvas = scene.renderer.domElement, width = 16 + 113, rows = new Float64Array(1200 * width)
  const eventRows = new Float64Array(55 * 8), rawRows = new Float64Array(55 * 8)
  const routes = ['world', 'unmapped-cell', 'unmapped-object']
  const offsets = [[3,0],[3,3],[0,3],[-3,0],[0,-3],[0,0]]
  const generation = recorder.gpuGeneration
  if (!Number.isSafeInteger(generation) || generation < 0 || recorder.recentCursor !== recorder.recentCount) throw Error('Unsupported recorder layout')
  const materialize = recorder.recentFrames
  if (typeof materialize !== 'function') throw Error('Missing recorder materializer')
  const initialSerial = recorder.recentCount, initialRaf = recorder.timestamp, initialObserved = host.performance.now()
  const capture = createCapture(initialSerial, initialRaf, initialObserved)
  const pose = [scene.cameraPosition.x,scene.cameraPosition.y,scene.cameraPosition.angle,
    scene.viewPoint.x,scene.viewPoint.z,scene.cameraBearing,scene.viewZoom,scene.viewPreset]
  let serial = initialSerial, selectedSerial = initialSerial, raf = initialRaf, completed = 0, count = 0, eventCount = 0, rawCount = 0
  let armed = false, pending = false, rawPending = false, pointerId = null, error = null, stopped = false, handle
  let rawMode = null, offending = null, coalescedCount = null
  let expectedX = 900, expectedY = 400, rawX, rawY, rawStamp, rawId, pendingAnchor, pendingStamp
  const encodeId = value => {
    if(value===null)return -1
    if(!Number.isSafeInteger(value)||value<0)throw Error('Malformed tooltip ID')
    return value
  }
  const finite = n => typeof n === 'number' && Number.isFinite(n)
  const fail = message => { error ??= String(message).slice(0,512); capture.abort(); return false }
  const stable = () => {
    if (host.__pndSnapshotGeometry!==geometry || geometry.writeWitness!==writeWitness || geometry.captureBoundary!==captureBoundary ||
        host.innerWidth!==1440||host.innerHeight!==1000||host.devicePixelRatio!==1||scene !== host.testSceneRef.current || recorder !== scene.fpsGraph?.samples || recorder.gpuGeneration !== generation || recorder.recentFrames !== materialize ||
        recorder.recentCursor !== recorder.recentCount || scene.disposed ||
        !scene.world.paused || scene.world.turn !== 70 || scene.world.mode !== null || scene.world.inputMask ||
        scene.modalSuspended || (scene.world.flyby.flags & 1) || scene.viewTransition !== null ||
        scene.overviewActive || scene.overviewStage || scene.globeMorph.active || scene.cameraMotion.active ||
        scene.resultCamera.active || scene.keys.size || scene.navigationButtons() || scene.pointerGesture !== null ||
        scene.navigationPointer || scene.pointerButtons !== 0 || host.document.hidden ||
        scene.cameraPosition.x !== pose[0] || scene.cameraPosition.y !== pose[1] || scene.cameraPosition.angle !== pose[2] ||
        scene.viewPoint.x !== pose[3] || scene.viewPoint.z !== pose[4] || scene.cameraBearing !== pose[5] ||
        scene.viewZoom !== pose[6] || scene.viewPreset !== pose[7]) throw Error('Scene/recorder/state changed')
  }
  stable()
  if (scene.pointerScreen?.clientX !== 900 || scene.pointerScreen?.clientY !== 400 ||
      host.document.elementFromPoint(900,400) !== canvas) throw Error('Origin is not the ordinary canvas pointer')
  if (!pose.every(Number.isFinite)) throw Error('Nonfinite camera pose')
  const initial = { serial: initialSerial, timestampMs: initialRaf, observedCompletedAtMs: initialObserved,
    epoch, geometrySha256: boundary.fingerprintSha256, point: [900,400], paused:true,turn:70,mode:0,buttons:0,viewChanged:false }
  // Parent and raw update each contain exactly one trusted underlying sample.
  // They are two delivery views of the same input, not two gameplay moves.
  const sample = event => {
    if (!event.isTrusted || event.pointerType !== 'mouse' || event.isPrimary !== true || event.buttons !== 0 ||
        event.altKey || event.ctrlKey || event.shiftKey || event.metaKey || event.target !== canvas ||
        typeof event.getCoalescedEvents !== 'function') throw Error('Unsupported pointer event')
    const list = event.getCoalescedEvents()
    coalescedCount = list.length
    if (list.length !== 1) throw Error('Missing or multiple coalesced samples')
    const value = list[0]
    if (!value.isTrusted || value.isPrimary!==event.isPrimary || value.altKey!==event.altKey ||
        value.ctrlKey!==event.ctrlKey || value.shiftKey!==event.shiftKey || value.metaKey!==event.metaKey || value.pointerId !== event.pointerId || value.pointerType !== 'mouse' ||
        value.clientX !== event.clientX || value.clientY !== event.clientY || value.buttons !== 0 ||
        !finite(value.timeStamp) || value.timeStamp < 0 || !finite(event.timeStamp) || value.timeStamp > event.timeStamp ||
        !Number.isSafeInteger(event.pointerId) || event.pointerId < 0) throw Error('Coalesced sample mismatch')
    if (pointerId !== null && pointerId !== event.pointerId) throw Error('Pointer owner changed')
    pointerId ??= event.pointerId
    return value.timeStamp
  }
  const writeEvent = (buffer,index,event,stamp,at) => {
    let i=index*8
    buffer[i++]=event.clientX;buffer[i++]=event.clientY;buffer[i++]=event.pointerId
    buffer[i++]=event.timeStamp;buffer[i++]=stamp;buffer[i++]=at;buffer[i++]=recorder.recentCount;buffer[i++]=recorder.timestamp
  }
  const input = event => {
    if (stopped || error) return
    try {
      if(host.__pndOrdinaryPointerObserver!==api)throw Error('Observer owner replaced')
      stable();coalescedCount=null
      if (recorder.recentCount !== serial || recorder.timestamp !== raf) throw Error('Input arrived before callback observation')
      const at=host.performance.now()
      if (event.type !== 'pointermove' && event.type !== 'pointerrawupdate') {
        capture.input(2,event.clientX,event.clientY,event.buttons,event.isTrusted,0,at,serial,raf)
        throw Error(`Unexpected input: ${event.type}`)
      }
      const stamp=sample(event)
      if (!armed || pending || event.clientX !== expectedX || event.clientY !== expectedY) throw Error('Unexpected or duplicate pointer delivery')
      if (event.type === 'pointerrawupdate') {
        if (rawMode === false || rawPending || rawCount >= 55) throw Error('Duplicate raw update')
        writeEvent(rawRows,rawCount++,event,stamp,at)
        rawPending=true;rawX=event.clientX;rawY=event.clientY;rawStamp=stamp;rawId=event.pointerId
        return
      }
      if (rawMode === true && !rawPending) throw Error('Missing expected raw update')
      rawMode ??= rawPending
      if (rawPending && (rawX!==event.clientX || rawY!==event.clientY || rawStamp!==stamp || rawId!==event.pointerId)) throw Error('Raw/parent sample mismatch')
      if (eventCount >= 55) throw Error('Event capacity')
      writeEvent(eventRows,eventCount++,event,stamp,at)
      if (!capture.input(1,event.clientX,event.clientY,0,true,0,at,serial,raf)) throw Error('Capture rejected input')
      pending=true;rawPending=false;pendingAnchor=serial;pendingStamp=raf
    } catch (e) { offending ??= {type:String(event.type).slice(0,64),x:event.clientX,y:event.clientY,pointerId:event.pointerId,timeStamp:event.timeStamp,coalescedCount}; fail(e) }
  }
  const names=['pointermove','pointerrawupdate','pointerdown','pointerup','pointercancel','pointerover','pointerout',
    'wheel','keydown','keyup','click','dblclick','contextmenu','blur','resize','scroll','visibilitychange']
  const visibility = event => input(event)
  const tick = now => {
    if (stopped || error) return
    try {
      if(host.__pndOrdinaryPointerObserver!==api)throw Error('Observer owner replaced')
      stable()
      if (recorder.recentCount !== serial) {
        if (recorder.recentCount !== serial+1 || recorder.timestamp !== now || recorder.recentCount >= 1200 || count>=1200) throw Error('Callback identity/order/bound changed')
        const p=scene.pointerScreen,t=scene.tooltipInput
        if (!p || !t?.pointer || p.clientX!==t.pointer.clientX || p.clientY!==t.pointer.clientY) throw Error('Missing or stale tooltip pointer')
        let i=count*width
        rows[i++]=recorder.recentCount;rows[i++]=now;rows[i++]=0
        rows[i++]=p.clientX;rows[i++]=p.clientY;rows[i++]=1;rows[i++]=scene.world.turn;rows[i++]=0; // Strict raw null was checked by stable(); contract mode is numeric zero.
        rows[i++]=scene.pointerButtons
        rows[i++]=routes.indexOf(t.route);rows[i++]=encodeId(t.picked);rows[i++]=encodeId(t.cell)
        rows[i++]=encodeId(t.inspectionTarget);rows[i++]=encodeId(scene.hoveredObject)
        rows[i++]=t.pointer.clientX;rows[i++]=t.pointer.clientY
        writeWitness.call(geometry,rows,i,scene)
        for(let n=0;n<113;n++)if(rows[i+n]!==baselineWitness[n])throw Error('Geometry witness changed')
        const at=host.performance.now();rows[count*width+2]=at
        if(!capture.frame(recorder.recentCount,now,at))throw Error('Capture rejected callback')
        count++;serial=recorder.recentCount;raf=now
        if(pending){completed++;selectedSerial=serial;pending=false;armed=false}
      }
    } catch(e){fail(e)}
    if(!stopped&&!error)handle=host.requestAnimationFrame(tick)
  }
  const api=Object.freeze({
    epoch,
    async boundary(){
      if(host.__pndOrdinaryPointerObserver!==api)throw Error('Observer owner replaced')
      stable();const result=await captureBoundary.call(geometry);stable();return result
    },
    arm(){
      if(stopped||error||armed||pending||completed>=54)throw Error(error??'Invalid arm')
      stable();if(!capture.arm())throw Error('Capture arm rejected')
      const offset=offsets[completed%6];expectedX=900+offset[0];expectedY=400+offset[1];armed=true
      return {sequence:completed+1,point:[expectedX,expectedY]}
    },
    status(){return {error,completed,pending,armed,sequence:completed,inputSequence:eventCount,epoch,anchorSerial:pendingAnchor,
      anchorTimestampMs:pendingStamp,serial:selectedSerial,latestSerial:serial}},
    stop(success=false){
      if(stopped)throw Error('Observer already stopped')
      stopped=true;const cleanupErrors=[]
      try{host.cancelAnimationFrame(handle)}catch(e){cleanupErrors.push(String(e).slice(0,256));fail(e)}
      for(const name of names)try{host.removeEventListener(name,input,true)}catch(e){cleanupErrors.push(String(e).slice(0,256));fail(e)}
      try{host.document.removeEventListener('visibilitychange',visibility,true)}catch(e){cleanupErrors.push(String(e).slice(0,256));fail(e)}
      if(rawPending)fail('Unpaired raw update')
      if(success&&!error){if(!capture.finish())fail('Incomplete capture')}
      else capture.abort()
      // One synchronous post-capture materialization, before JS yields. Serial
      // never reaches ring rollover, so production row index is serial minus 1.
      let recent=null
      try{stable();if(recorder.recentCount!==serial||recorder.timestamp!==raf)throw Error('Unobserved final callback');recent=materialize.call(recorder);
        stable();if(recorder.recentCount!==serial||recorder.timestamp!==raf||recent.length!==serial)throw Error('Recorder changed during materialization')}
      catch(e){fail(e)}
      if(host.__pndOrdinaryPointerObserver===api)delete host.__pndOrdinaryPointerObserver
      else fail('Observer owner replaced')
      return {initial,geometryWitness:baselineWitness.slice(),capture:capture.export(),rows:rows.slice(0,count*width),width,
        events:eventRows.slice(0,eventCount*8),rawUpdates:rawRows.slice(0,rawCount*8),eventWidth:8,recent,error,offending,rawMode,cleanupErrors,
        comparisonEligible:false}
    },
  })
  // Installation is explicit; caller owns try/finally and out-of-page watchdog.
  try {
    for(const name of names)host.addEventListener(name,input,{capture:true,passive:true})
    host.document.addEventListener('visibilitychange',visibility,{capture:true,passive:true})
    host.__pndOrdinaryPointerObserver=api
    handle=host.requestAnimationFrame(tick)
  } catch(error) {
    // Best effort rollback even if listener/RAF installation partially failed.
    try{api.stop(false)}catch{};throw error
  }
  return initial
}
