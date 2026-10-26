// Browser-serialized camera-only fixture. It follows one declared actor, never
// searches for a more favorable episode, renders, or advances the simulation. Supported focus updates camera lighting metadata.
export function installRecoilCameraFollow({ order }) {
  const scene = window.testSceneRef.current, world = window.testStore.getWorld()
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
    method: 'GameScene.focus fixed actor54 after each observed render; no forced render or World advance',
    sideEffect: 'Supported focus clears an already-null world.mode, resets scene tooltip.draw, and updates world.lightView for camera-relative terrain lighting',
    visits: [], error: null, terminal: null }
  let raf, stopped = false
  const stop = (reason = 'cleanup') => {
    if (!stopped) { stopped = true; cancelAnimationFrame(raf); result.terminal = { reason, turn: world.turn, stamp: scene.renderer.info.render.frame } }
    return result
  }
  const guard = () => {
    require(window.testSceneRef.current === scene && window.testStore.getWorld() === world && scene.world === world,
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
      const before = invariant(), heading = scene.cameraBearing, lightingBefore = { ...world.lightView }
      scene.focus({ x: actor.x, z: actor.z }, { animate: false })
      require(invariant() === before, 'Camera focus changed actor/order/RNG or World timeline')
      require(scene.renderer.info.render.frame === stamp && scene.cameraBearing === heading,
        'Camera focus must not render or rotate the sampled view')
      require(world.lightView.x === (scene.cameraPosition.x << 16 >> 16) &&
        world.lightView.y === (scene.cameraPosition.y << 16 >> 16), 'Camera lighting view must match focused position')
      result.visits.push({ turn: world.turn, afterStamp: stamp, rafTimestampMs,
        actor: { x: actor.x, z: actor.z }, camera: { ...scene.cameraPosition }, lightingBefore, lightingAfter: { ...world.lightView }, gameplayUnchanged: true })
    } catch (error) { result.error = String(error); stop('error'); return }
    raf = requestAnimationFrame(visit)
  }
  window.__pndRecoilCameraFollow = { result, stop }
  raf = requestAnimationFrame(visit)
}
