// Browser-serialized camera-only fixture. It follows one declared actor, never
// searches for a more favorable episode or forces a render. Public focus drains
// real elapsed input first; the focus-only comparison starts after that boundary.
export function installRecoilCameraFollow({ order }) {
  const scene = window.testSceneRef.current, store = window.testStore, readWorld = store.getWorld,
    world = readWorld.call(store), clock = scene.gameClock, afterTurn = clock?.afterTurn
  const observer = window.__pndMeleeObservation
  const actor = world.units.find(unit => unit.id === 54)
  const require = (condition, message) => { if (!condition) throw Error(message) }
  require(observer?.result.protocol === 'running-native-recoil-entry-v1', 'Recoil observer required')
  require(observer.result.firstAttackTurn === null && !observer.result.done, 'Follow must arm before the first recoil')
  require(order?.target === 20 && order.selected.length === 1 && order.selected[0] === 54 &&
    order.lastOrderTurn === world.lastOrderTurn && order.paused === false, 'Recorded public54-to20 order required')
  require(actor && actor.kind === 'shaman' && actor.team === 'blue' && actor.hp > 0, 'Authored actor54 required')
  require(!window.__pndRecoilCameraFollow, 'Camera follower is single-use')
  const result = { actorId: 54, orderTarget: 20, armedTurn: world.turn, armedStamp: scene.renderer.info.render.frame,
    method: 'GameScene.focus fixed actor54 after each observed render; one real input drain, then exact focus-only ownership',
    sideEffect: 'Focus retains lighting/gameplay after its real drain; only declared logical camera fields and display/tooltip change',
    visits: [], error: null, terminal: null }
  let raf, stopped = false
  const stop = (reason = 'cleanup') => {
    if (!stopped) { stopped = true; cancelAnimationFrame(raf); result.terminal = { reason, turn: world.turn, stamp: scene.renderer.info.render.frame } }
    return result
  }
  const guard = () => {
    require(!scene.disposed && scene.started, 'Camera follower requires a live started Scene')
    require(window.testSceneRef.current === scene && window.testStore === store && store.getWorld === readWorld &&
      readWorld.call(store) === world && scene.world === world && scene.gameClock === clock && clock?.afterTurn === afterTurn && window.__pndMeleeObservation === observer,
      'Camera follower lost its original Scene/World')
    require(world.units.find(unit => unit.id === 54) === actor && actor.hp > 0, 'Camera follower lost actor54')
    require(world.mode === null && !world.inputMask && !world.paused && !scene.overviewActive && !scene.overviewStage &&
      !scene.resultCamera.active && !scene.viewTransition, 'Camera focus requires inactive targeting/overview and running input')
    require(world.landVersion === world.terrainVersion, 'Camera focus must not synchronize dirty terrain')
    require(world.lastOrderTurn === order.lastOrderTurn, 'Camera follow cannot replace the public order')
  }
  guard()
  const visit = rafTimestampMs => {
    if (stopped) return
    try {
      if (observer.result.done) { stop('observer-terminal'); return }
      guard()
      const rendered = observer.result.visits.at(-1), stamp = scene.renderer.info.render.frame
      require(rendered?.rafTimestampMs === rafTimestampMs && rendered.stamp === stamp && rendered.actorInspected,
        'Camera focus must follow this frame\'s observer, never precede its pixels/bounds')
      require(result.visits.length < 75 * 240, 'Camera follow exceeded bounded visit storage')
      const invariant = () => JSON.stringify({ turn: world.turn, time: world.time, randomState: world.randomState,
        lastOrderTurn: world.lastOrderTurn, selected: world.selected, mode: world.mode, inputMask: world.inputMask, actor })
      const encode = value => JSON.stringify(value, (_key, item) => item instanceof Set ? [...item] : item)
      const descriptor = Object.getOwnPropertyDescriptor(scene, 'advanceInputTime'), original = scene.advanceInputTime,
        sampledActor = { x: actor.x, z: actor.z }, beforeDrainTurn = world.turn
      const sameDescriptor = (a,b) => a === undefined || b === undefined ? a === b :
        Reflect.ownKeys(a).length === Reflect.ownKeys(b).length &&
        Reflect.ownKeys(a).every(key => Object.hasOwn(b,key) && a[key] === b[key])
      let drainCalls = 0, before, lightingBefore, expected, expectedPoint, expectedBearing, owners,
        attempted = false, failed = false, failure, restorationError = null
      const cameraReady = () => {
        const c = world.cameras, player = world.manaWorld.playerTribe
        require(c?.phase === 'idle' && c.tribes.length === 4 && c.held.length === 4 && c.borrowed.length === 4 &&
          Number.isInteger(player) && player >= 0 && player < 4 &&
          !c.motion.active && !c.result.active && !c.overviewActive && c.overviewStage === null &&
          c.viewTransition === null && !(world.flyby.flags & 1) && !c.input.buttons &&
          c.keys.size === 0 && c.input.pointer === null && !Object.values(c.velocity).some(Boolean),
          'Camera follower requires quiescent post-drain camera owners')
        require(scene.cameraPosition === c.tribes[player] && scene.cameraMotion === c.motion &&
          scene.resultCamera === c.result && scene.keys === c.keys && scene.cameraVelocity === c.velocity &&
          scene.overviewActive === c.overviewActive && scene.overviewStage === c.overviewStage &&
          scene.viewTransition === c.viewTransition, 'Camera follower aliases changed')
        require(new Set([...c.tribes,...c.held,...c.borrowed]).size === 12 && c.held.every(p =>
          Reflect.ownKeys(p).length === 3 && ['x','y','angle'].every(k => Number.isInteger(p[k]) && p[k]>=-128 && p[k]<=127)),
          'Camera follower correction ownership unsupported')
      }
      const assertResult = () => {
        guard(); cameraReady()
        require(world.cameras === owners.cameras && scene.cameraPosition === owners.tribe &&
          scene.cameraMotion === owners.motion && world.manaWorld.playerTribe === owners.player &&
          owners.records.every((p,i)=>p === [...world.cameras.tribes,...world.cameras.held,...world.cameras.borrowed][i]),
          'Camera follower logical owner replaced')
        require(invariant() === before && encode(world.lightView) === encode(lightingBefore),
          'Camera focus changed post-drain actor/order/RNG/timeline or lighting')
        require(encode(world.cameras) === encode(expected), 'Camera focus changed undeclared logical-camera state')
        require(scene.renderer.info.render.frame === stamp && scene.cameraBearing === expectedBearing &&
          encode(scene.viewPoint) === encode(expectedPoint), 'Camera focus rendered or displayed an unexpected pose')
      }
      function drain(...args) {
        require(this === scene && ++drainCalls === 1 && scene.advanceInputTime === drain,
          'Camera follower requires one owned input drain')
        guard()
        const returned = Reflect.apply(original,this,args)
        require(!returned || typeof returned.then !== 'function','Input drain became asynchronous')
        guard()
        require(scene.advanceInputTime === drain && !observer.result.done && observer.result.error == null,
          'Camera follower lost live observation during input drain')
        cameraReady()
        before = invariant(); lightingBefore = structuredClone(world.lightView)
        const c=world.cameras, player=world.manaWorld.playerTribe, held=c.held[player],
          x=Math.round((sampledActor.x+8)*256)&65535, y=Math.round((-sampledActor.z-8)*256)&65535
        owners={cameras:c,tribe:c.tribes[player],motion:c.motion,player,records:[...c.tribes,...c.held,...c.borrowed]}
        expected=structuredClone(c); expected.navigationTime=0; expected.motion.active=0
        for(let i=0;i<4;i++)Object.assign(expected.borrowed[i],expected.held[i])
        expected.tribes[player].x=(x-held.x)&65535; expected.tribes[player].y=(y-held.y)&65535
        expectedBearing=(((c.tribes[player].angle+held.angle)&2047)*Math.PI)/1024
        expectedPoint={x:(((x-2048)<<16)>>16)/256,z:-(((y+2048)<<16)>>16)/256}
        return returned
      }
      const wrapper={value:drain,configurable:true,writable:true,enumerable:descriptor?.enumerable??false}
      try {
        require(typeof original === 'function' && scene.started && !scene.inputDepth && !scene.modalSuspended &&
          Number.isFinite(scene.previous) && (!descriptor || Object.hasOwn(descriptor,'value') && descriptor.configurable),
          'Camera follower cannot observe real input drain')
        attempted=true; Object.defineProperty(scene,'advanceInputTime',wrapper)
        scene.focus(sampledActor,{animate:false})
        require(drainCalls===1 && expected && sameDescriptor(Object.getOwnPropertyDescriptor(scene,'advanceInputTime'),wrapper),
          'Camera follower focus did not retain its single drain')
        assertResult()
      } catch(error) { failed=true; failure=error }
      finally {
        if(attempted)try {
          const current=Object.getOwnPropertyDescriptor(scene,'advanceInputTime')
          if(sameDescriptor(current,wrapper)){
            if(descriptor)Object.defineProperty(scene,'advanceInputTime',descriptor)
            else require(delete scene.advanceInputTime,'Camera follower failed to remove supplied drain wrapper')
          }else require(sameDescriptor(current,descriptor),'Camera follower refuses to overwrite foreign drain owner')
          require(sameDescriptor(Object.getOwnPropertyDescriptor(scene,'advanceInputTime'),descriptor),
            'Camera follower drain descriptor not restored')
        }catch(error){restorationError=String(error);if(!failed){failed=true;failure=error}}
      }
      if(failed){result.focusFailure={drainCalls,restorationError};throw failure}
      assertResult() // Restoration must not introduce a late mutation.
      result.visits.push({ turn:world.turn,beforeDrainTurn,afterStamp:stamp,rafTimestampMs,
        sampledActor,actor:{x:actor.x,z:actor.z},camera:{...scene.cameraPosition},
        lightingBefore,lightingAfter:{...world.lightView},drainCalls,focusGameplayUnchanged:true })
    } catch (error) { result.error = String(error); stop('error'); return }
    raf = requestAnimationFrame(visit)
  }
  window.__pndRecoilCameraFollow = { result, stop }
  raf = requestAnimationFrame(visit)
}
