// Browser-side observation only: no RAF, clock, camera, input or world writes.
export function installCameraMotionObserver({ maximumFrames = 12000 } = {}) {
  if (maximumFrames !== 12000) throw Error('Fixed camera evidence frame cap required')
  if (Object.hasOwn(window, '__pndCameraMotion')) throw Error('Camera evidence already installed')
  const scene = window.testSceneRef?.current, world = window.testStore?.getWorld()
  if (!scene || scene.world !== world || !scene.renderer?.domElement?.isConnected)
    throw Error('Current camera evidence owner missing')
  const renderer = scene.renderer, camera = scene.camera, renderScene = scene.scene
  const cameraOwner=world.cameras,playerTribe=world.manaWorld?.playerTribe,tribeCamera=cameraOwner?.tribes?.[playerTribe]
  if(!scene.started||!Number.isSafeInteger(playerTribe)||!tribeCamera||scene.cameraPosition!==tribeCamera)throw Error('Authoritative tribe camera missing')
  const descriptor = Object.getOwnPropertyDescriptor(renderer, 'render'), original = renderer.render
  if (typeof original !== 'function' || (descriptor && (!('value' in descriptor) || !descriptor.configurable)))
    throw Error('Unsupported renderer ownership')
  const frames = [], events = [], pending = new WeakMap(), listeners = []
  let failed = false, failure, stopped = false, eventSerial = 0, phase = 'setup', phaseStart = 0
  const fail = error => { if (!failed) { failed = true; failure = String(error).slice(0,2000) } }
  const read = () => {
    if (!scene.started || scene.disposed || world.cameras!==cameraOwner || world.manaWorld.playerTribe!==playerTribe ||
        cameraOwner.tribes[playerTribe]!==tribeCamera || scene.cameraPosition!==tribeCamera || window.testSceneRef.current !== scene || window.testStore.getWorld() !== world ||
        scene.renderer !== renderer || scene.camera !== camera || scene.scene !== renderScene ||
        !renderer.domElement.isConnected) throw Error('Camera observation owner changed')
    const c = world.cameras, p = scene.cameraPosition, v = scene.viewPoint
    const result = { observedAt: performance.now(), turn: world.turn, time: world.time,
      cameraElapsed: c.elapsed, navigationTime: c.navigationTime, phase,
      frame: renderer.info.render.frame, inputMask: world.inputMask,
      flyby: !!(world.flyby.flags & 1), overview: !!scene.overviewActive,
      overviewStage: scene.overviewStage ?? null, viewPreset: scene.viewPreset,
      paused: !!world.paused, suspended: !!scene.modalSuspended,
      inputButtons: c.input.buttons, inputCursor: c.input.cursor,
      keys: [...scene.keys], pose: [p.x, p.y, p.angle],
      displayed: [v.x, v.z, scene.cameraBearing],
      navigationPointer: scene.navigationPointer ? { ...scene.navigationPointer } : null }
    if (result.keys.length > 32 || ![result.observedAt,result.turn,result.time,result.cameraElapsed,
      result.navigationTime,result.frame,result.inputMask,result.inputButtons,result.inputCursor,
      ...result.pose,...result.displayed].every(Number.isFinite)) throw Error('Invalid camera observation')
    return result
  }
  function wrapper(...args) {
    // Never change the renderer's receiver, arguments, return value or throw.
    const result = Reflect.apply(original, this, args)
    if (!stopped && !failed && this === renderer && args[0] === renderScene && args[1] === camera) {
      try {
        if (frames.length >= maximumFrames) throw Error('Camera frame cap exceeded')
        frames.push(read())
      } catch (error) { fail(error) }
    }
    return result
  }
  const relevant = e => e.type === 'pointermove' || ['ArrowLeft','ArrowRight','=','-','Enter'].includes(e.key)
  const before = e => {
    if (stopped || failed || !relevant(e)) return
    try {
      if (events.length >= 2048) throw Error('Camera input event cap exceeded')
      const row = { sequence: ++eventSerial, type: e.type, trusted: e.isTrusted,
        key: e.key ?? null, repeat: !!e.repeat, x: e.clientX ?? null, y: e.clientY ?? null,
        buttons: e.buttons ?? null, eventTimestamp: e.timeStamp, before: read(), after: null }
      pending.set(e,row); events.push(row)
    } catch (error) { fail(error) }
  }
  const after = e => {
    if (stopped || failed) return
    const row = pending.get(e)
    if (row) try { row.after = read(); row.defaultPrevented = e.defaultPrevented }
    catch (error) { fail(error) }
  }
  const stop = () => {
    if (!stopped) {
      stopped = true
      for (const [type,fn,capture] of listeners) window.removeEventListener(type,fn,capture)
      if (renderer.render !== wrapper) fail(Error('Renderer observer owner replaced'))
      else if (descriptor) Object.defineProperty(renderer,'render',descriptor)
      else delete renderer.render
    }
    return { stopped, restored: renderer.render === original, failed, failure,
      frames: frames.slice(), events: events.slice() }
  }
  try {
    read()
    Object.defineProperty(renderer,'render',{value:wrapper,writable:true,configurable:true,
      enumerable:descriptor?.enumerable ?? false})
    for (const type of ['keydown','keyup','pointermove']) for (const [fn,capture] of [[before,true],[after,false]]) {
      window.addEventListener(type,fn,capture); listeners.push([type,fn,capture])
    }
    Object.defineProperty(window,'__pndCameraMotion',{value:{
      mark(value) { if (stopped || failed || typeof value !== 'string' || value.length > 64) throw Error('Invalid phase'); phase=value; phaseStart=frames.length; return read() },
      read, status() { return { failed,failure,count:frames.length,phaseStart,last:frames.at(-1),events:events.length } }, stop,
    },configurable:true})
    return { installed:true,maximumFrames,maximumEvents:2048 }
  } catch (error) { stop(); throw error }
}
