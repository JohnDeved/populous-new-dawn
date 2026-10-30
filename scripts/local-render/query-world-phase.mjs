import assert from 'node:assert/strict'

// This function is serialized by Playwright. All application/ownership reads and
// the complete serialization occur synchronously in the same browser evaluation.
// Its only writes are to a private observer handle, never World/Scene/DOM state.
export function queryWorldOperation({kind,state,phase}) {
  const world=window.testStore.getWorld(),scene=window.testSceneRef.current
  const now=performance.now(),actual=JSON.stringify(world)
  const roots=[document],dialogs=[]
  for(let i=0;i<roots.length;i++){
    dialogs.push(...roots[i].querySelectorAll('dialog'))
    for(const node of roots[i].querySelectorAll('*'))if(node.shadowRoot)roots.push(node.shadowRoot)
  }
  const pauses=dialogs.filter(node=>node.hasAttribute('data-original-pause-menu'))
  const modals=dialogs.filter(node=>node.matches(':modal'))
  const menu=pauses.length===1?pauses[0]:null
  const witness={paused:world.paused,sameWorld:kind==='capture'||world===state.world,
    sameScene:kind==='capture'||scene===state.scene,sceneOwnsWorld:scene?.world===world,
    sceneSuspended:scene?.modalSuspended,pauseCount:pauses.length,modalCount:modals.length,
    pauseOpen:menu?.open??false,pauseModal:menu?.matches(':modal')??false,
    modalOwnsPause:!!menu&&modals.length===1&&modals[0]===menu,
    menuLabel:menu?.getAttribute('aria-label')?.slice(0,128)??null,menuConnected:menu?.isConnected??false,
    sameMenu:!state?.menuOwner||state.menuOwner===menu,visible:document.visibilityState==='visible',observedAt:now}
  const epsilon=1e-7 // Same visit-boundary tolerance as app/game-clock.ts.
  const fail=(reason,expected=state?.setup??actual)=>({ok:false,reason,actual,expected,witness})
  const plain=value=>!!value&&typeof value==='object'&&!Array.isArray(value)
  const clockOf=value=>plain(value)&&plain(value.worshipAcquisition)&&plain(value.worshipAcquisition.clock)?value.worshipAcquisition.clock:null
  function periodOf(clock) {
    const helperRate=clock.limiter&2?14:clock.limiter&4?20:clock.limiter&1?24:60
    const normalRate=Math.max(12,Math.min(60,Math.trunc(clock.normalRate)))
    return Math.trunc(1000/(clock.limiter?helperRate:normalRate))
  }
  function validClock(clock) {
    if(!plain(clock)||!['elapsed','nextVisit','lastVisit','limiter','normalRate'].every(k=>Object.hasOwn(clock,k)&&Number.isFinite(clock[k])))return false
    if(clock.elapsed<0||!Number.isSafeInteger(clock.nextVisit)||!Number.isSafeInteger(clock.lastVisit)||clock.lastVisit<0)return false
    if(!Number.isInteger(clock.limiter)||clock.limiter<0||clock.limiter>0x7fffffff)return false
    const period=periodOf(clock)
    // The mission has already run: require a settled visit, not the special
    // createWorld zero-clock state before its first frame.
    return clock.nextVisit-clock.lastVisit===period&&clock.lastVisit<=clock.elapsed+epsilon&&clock.elapsed+epsilon<clock.nextVisit
  }
  function idle(value){
    const acquisition=value?.worshipAcquisition,controllers=acquisition?.controllers
    return plain(acquisition)&&plain(controllers)&&['building','spell','companion','pulse'].every(k=>Object.hasOwn(controllers,k)&&controllers[k]===null)&&
      [acquisition.requests,acquisition.previousDrawCommands,controllers.drawCommands].every(list=>Array.isArray(list)&&list.length===0)&&acquisition.clock?.limiter===0
  }
  const ordinary=()=>witness.visible&&witness.paused===true&&witness.sameWorld&&witness.sameScene&&witness.sceneOwnsWorld&&
    witness.sceneSuspended===false&&witness.modalCount===0&&witness.pauseCount===0
  const suspended=()=>witness.visible&&witness.paused===true&&witness.sameWorld&&witness.sameScene&&witness.sceneOwnsWorld&&
    witness.sceneSuspended===true&&witness.pauseCount===1&&witness.modalCount===1&&witness.pauseOpen===true&&witness.pauseModal===true&&
    witness.modalOwnsPause&&witness.menuConnected&&witness.sameMenu&&witness.menuLabel==='Game menu'
  if(kind==='capture') {
    const parsed=JSON.parse(actual),clock=clockOf(parsed),acquisition=parsed?.worshipAcquisition,controllers=acquisition?.controllers
    const bounded=value=>typeof value==='number'?{type:'number',finite:Number.isFinite(value),value:Number.isFinite(value)?value:null}:
      typeof value==='string'?{type:'string',length:value.length,preview:value.slice(0,80)}:{type:value===null?'null':typeof value}
    const captureObservation={valid:false,reason:null,witness,
      clock:Object.fromEntries(['elapsed','nextVisit','lastVisit','limiter','normalRate'].map(k=>[k,bounded(clock?.[k])])),
      idle:{valid:idle(parsed),controllers:Object.fromEntries(['building','spell','companion','pulse'].map(k=>[k,{present:!!controllers&&Object.hasOwn(controllers,k),null:controllers?.[k]===null}])),
        requests:Array.isArray(acquisition?.requests)?acquisition.requests.length:null,
        drawCommands:Array.isArray(controllers?.drawCommands)?controllers.drawCommands.length:null,
        previousDrawCommands:Array.isArray(acquisition?.previousDrawCommands)?acquisition.previousDrawCommands.length:null},
      raf:{previous:bounded(scene?.previous),observedAt:bounded(now)}}
    if(!ordinary())captureObservation.reason='Query setup baseline requires the live visible ordinary-paused owner without a modal'
    else if(!idle(parsed))captureObservation.reason='Query requires the verified idle-acquisition fixture, not active or retained controllers'
    else if(!validClock(clock))captureObservation.reason='Query setup clock is not finite and source-settled'
    else if(!Number.isFinite(now)||now<0||!Number.isFinite(scene.previous)||scene.previous<0||scene.previous>now)captureObservation.reason='Missing finite prior RAF timestamp for the setup clock bound'
    else captureObservation.valid=true
    const observer={mode:'ordinary',menu:null,menuOwner:null,closeChecked:false,activeClockTime:scene?.previous,activeClockElapsed:clock?.elapsed,previousClock:Object.freeze({...clock}),previousObservedAt:now,lastWitness:witness}
    Object.defineProperties(observer,{
      setup:{value:actual,enumerable:true},world:{value:world},scene:{value:scene},
      frameAtSetup:{value:scene?.previous,enumerable:true},capturedAt:{value:now,enumerable:true},
      captureObservation:{value:Object.freeze(captureObservation),enumerable:true}
    })
    return Object.seal(observer)
  }
  if(kind!=='observe'||!['ordinary','enter-menu','menu','before-menu-close'].includes(phase))return fail('Unknown Query observation operation or phase')
  if(state?.captureObservation?.valid!==true)return fail('No valid initial capture')
  if(!Number.isFinite(now)||now<state.previousObservedAt)return fail('Observer time moved backwards')
  if(!(phase==='ordinary'?ordinary():suspended()))return fail(`Wrong or ambiguous ${phase} owner`)
  if(phase==='enter-menu'&&(state.mode!=='ordinary'||state.menu!==null||state.menuOwner!==null||state.closeChecked))return fail('Duplicate or reentrant Menu entry')
  if(phase==='ordinary'&&state.mode==='menu'&&!state.closeChecked)return fail('Menu exit lacks the immediately preceding full-equality close check',state.menu)
  if(phase==='menu'||phase==='before-menu-close') {
    if(state.mode!=='menu'||state.closeChecked)return fail('Menu observation lacks a live one-time entry or close is already pending')
    // Menu baseline is immutable until a positively observed ordinary exit.
    if(typeof state.menu!=='string')return fail('Missing Menu-entry snapshot')
    if(actual!==state.menu)return fail('Full World changed during positively suspended Menu',state.menu)
    state.previousObservedAt=now;state.lastWitness=witness
    if(phase==='before-menu-close')state.closeChecked=true
    return {ok:true,phase,guarantee:'full-serialized-World-equality',witness,clock:state.previousClock}
  }
  const expected=JSON.parse(state.setup),observed=JSON.parse(actual)
  const before=clockOf(expected),clock=clockOf(observed),previous=state.previousClock
  if(!idle(expected)||!idle(observed))return fail('Idle-acquisition fixture precondition is false')
  if(!validClock(before)||!validClock(clock))return fail('Clock is not finite and source-settled')
  if(clock.limiter!==before.limiter||clock.normalRate!==before.normalRate)return fail('Non-exempt clock controls changed')
  const period=periodOf(before)
  for(const key of ['elapsed','nextVisit','lastVisit']) {
    if(clock[key]<before[key]||clock[key]<previous[key])return fail(`Clock ${key} moved backwards`)
  }
  if((clock.nextVisit-before.nextVisit)%period!==0||(clock.lastVisit-before.lastVisit)%period!==0)return fail('Clock visit cadence left the unchanged source schedule')
  // UI elapsed time is unscaled RAF dt, unlike simulation speed. Include the
  // setup frame's pre-snapshot tail; do not invent a tighter host RPC bound.
  const exiting=state.mode==='menu'
  // setModalSuspended resets Scene.previous at both boundaries. A frozen Menu
  // interval cannot become catch-up time, either at exit or a later read. The
  // full close check is a conservative earliest-resume bound, not the setup RAF.
  const activeTime=exiting?state.previousObservedAt:state.activeClockTime
  const activeElapsed=exiting?previous.elapsed:state.activeClockElapsed
  if(clock.elapsed-activeElapsed>now-activeTime+epsilon)return fail('Clock elapsed exceeds available source RAF time outside suspended Menu')
  const currentClock=Object.freeze({...clock})
  // Parse only an isolated serialization copy. Restore exactly three existing
  // numeric values. This is not a broad object-level ignore or a live World mutation.
  for(const key of ['elapsed','nextVisit','lastVisit'])clock[key]=before[key]
  if(JSON.stringify(observed)!==state.setup)return fail('A non-exempt World field or serialized structure changed')
  const entering=phase==='enter-menu'
  // Publication happens only after every owner, clock and non-clock check.
  state.activeClockTime=activeTime;state.activeClockElapsed=activeElapsed
  state.previousClock=currentClock;state.previousObservedAt=now;state.lastWitness=witness
  state.menu=entering?actual:null;state.menuOwner=entering?menu:null;state.closeChecked=false;state.mode=entering?'menu':'ordinary'
  return {ok:true,phase,guarantee:entering?'entry-non-clock-equality-then-full-snapshot':'all-World-except-three-source-clock-fields',
    menuSnapshotCaptured:entering,witness,clock:currentClock,
    allowedClockPaths:['/worshipAcquisition/clock/elapsed','/worshipAcquisition/clock/nextVisit','/worshipAcquisition/clock/lastVisit']}
}

export async function captureQueryWorld(page,{publish=()=>{},secondary=()=>{},check=()=>{}}={}) {
  let handle,primary,failed=false
  try {
    check()
    handle=await page.evaluateHandle(queryWorldOperation,{kind:'capture'})
    check() // Handle is already owned, even if this late completion is rejected.
    const observation=await handle.evaluate(state=>state.captureObservation)
    check()
    // Retain the original same-evaluation observations before the new checks.
    await publish(observation)
    check()
    assert.equal(observation.valid,true,observation.reason)
    return handle
  } catch(error){primary=error;failed=true;throw error}
  finally {
    if(failed&&handle)try{await handle.dispose()}
    catch(error){try{await secondary(error,primary)}catch{ /* Never mask the primary failure. */ }}
  }
}
export async function assertQueryWorld(page,snapshot,phase) {
  const result=await page.evaluate(queryWorldOperation,{kind:'observe',state:snapshot,phase})
  if(!result.ok) {
    let failure
    try { assert.equal(result.actual,result.expected,result.reason) }
    catch(error){failure=error}
    if(!failure)failure=Object.assign(new Error(result.reason),{actual:result.actual,expected:result.expected})
    failure.queryWorldWitness=result.witness;failure.queryWorldReason=result.reason
    throw failure
  }
  return result
}
