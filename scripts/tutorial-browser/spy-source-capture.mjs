// Version 2 is controlled-elapsed full-Scene capture, not natural RAF timing.
// Only this Scene's RAF successor is held. Other browser callbacks are forwarded.
export function installSpyCapture({ deadlineAt }) {
  const scene = window.testSceneRef.current, world = window.testStore.getWorld(),
    clock = scene.gameClock, animate = scene.animate,
    originalRAF = Object.getOwnPropertyDescriptor(window, 'requestAnimationFrame'),
    originalCancel = Object.getOwnPropertyDescriptor(window, 'cancelAnimationFrame')
  const result = { version: 2, method: 'controlled-full-scene', frameMs: 1000 / 24,
    maxFrames: 384, maxTurns: 192, frames: 0, turns: 0, startTurn: world.turn,
    deadlineAt, suppliedElapsedMilliseconds: 0, installed: false, released: false,
    rafRestored: false, cancelRestored: false, foreign: false, resumedRAF: false,
    handback: null, error: null }
  let active = false, pending = null, nextHandle = -1, ownedRAF, ownedCancel
  const installed = new Set()
  const same = (a, b) => !!a && !!b &&
    ['value', 'writable', 'get', 'set', 'enumerable', 'configurable'].every(k => a[k] === b[k])
  const current = () => {
    if (window.testSceneRef.current !== scene || window.testStore.getWorld() !== world ||
      scene.world !== world || scene.gameClock !== clock || scene.animate !== animate ||
      !scene.started || scene.disposed || !scene.renderer.domElement.isConnected)
      throw Error('Spy capture lost original live Scene/world/clock/animate')
  }
  const owns = () => same(Object.getOwnPropertyDescriptor(window, 'requestAnimationFrame'), ownedRAF) &&
    same(Object.getOwnPropertyDescriptor(window, 'cancelAnimationFrame'), ownedCancel)
  const check = () => {
    current()
    if (!active || !owns()) throw Error('Spy capture lost owned RAF descriptors')
    if (Date.now() >= deadlineAt) throw Error('Spy capture exhausted existing episode deadline')
    if (document.hidden || world.speed !== 1) throw Error('Spy capture requires visible normal-speed gameplay')
    if (scene.renderer.getContext().isContextLost()) throw Error('Spy capture lost WebGL context')
  }
  function request(callback, ...args) {
    if (callback !== animate) return Reflect.apply(originalRAF.value, this, [callback, ...args])
    current()
    if (!active || !owns()) throw Error('Spy capture request lost ownership')
    if (pending !== null) throw Error('Spy capture received duplicate Scene successor')
    pending = nextHandle--
    return pending
  }
  function cancel(handle, ...args) {
    if (handle === pending && pending !== null) { pending = null; return }
    if (Number.isSafeInteger(handle) && handle < 0 && handle > nextHandle) return
    return Reflect.apply(originalCancel.value, this, [handle, ...args])
  }
  const consume = () => {
    check()
    if (pending === null || scene.frame !== pending) throw Error('Spy capture missing owned Scene successor')
    pending = null
  }
  const restore = () => {
    // Restore each owned descriptor independently; never invoke or overwrite a successor.
    for (const [key, owned, original, field] of [
      ['requestAnimationFrame', ownedRAF, originalRAF, 'rafRestored'],
      ['cancelAnimationFrame', ownedCancel, originalCancel, 'cancelRestored'],
    ]) {
      if (result[field]) continue
      if (!installed.has(key)) {
        result[field] = same(Object.getOwnPropertyDescriptor(window, key), original)
        if (!result[field]) result.foreign = true
        continue
      }
      if (!same(Object.getOwnPropertyDescriptor(window, key), owned)) { result.foreign = true; continue }
      Object.defineProperty(window, key, original)
      result[field] = same(Object.getOwnPropertyDescriptor(window, key), original)
    }
    active = false
    pending = null // Negative handles never represent real browser-scheduled callbacks.
    result.released = result.rafRestored && result.cancelRestored && !result.foreign
  }
  const abandon = () => {
    if (!active && !installed.size) return result
    try { restore() } catch (error) { result.error ??= String(error) }
    return result // Failure closes the owning context, never restarts an unpaused Scene.
  }
  const api = {
    result,
    async drive(runSceneFrames, observe, until) {
      check()
      if (world.paused) throw Error('Public Resume must precede controlled capture')
      const start = result.startTurn
      while (!until()) {
        if (result.frames >= result.maxFrames || world.turn - start >= result.maxTurns)
          throw Error('Spy capture exhausted fixed aggregate frame/turn bound')
        consume()
        const beforeTurn = world.turn
        await runSceneFrames({ scene, currentScene: () => window.testSceneRef.current,
          currentWorld: () => window.testStore.getWorld(), until: () => false,
          maxFrames: 1, maxTurns: result.maxTurns - (world.turn - start), batchFrames: 1,
          frameMs: result.frameMs, requireGoal: false,
          deadline: performance.now() + Math.max(0, deadlineAt - Date.now()),
          validate: check,
          onFrame: () => {
            if (world.turn - beforeTurn < 0 || world.turn - beforeTurn > 1)
              throw Error('Controlled Spy frame skipped a logical turn')
            if (pending === null || scene.frame !== pending)
              throw Error('Original Scene failed to register its sole held successor')
            result.frames++; result.turns = world.turn - start
            result.suppliedElapsedMilliseconds = result.frames * result.frameMs
            observe() // Synchronous state and pixels after the complete original render.
          } })
      }
      return result
    },
    release() {
      if (result.released) return result
      check()
      if (!world.paused) throw Error('Public Pause must precede Spy clock handback')
      const spyId = window.__pndSpySourceObservation.result.spyId
      const frozen = () => JSON.stringify({ turn: world.turn, animationFrame: clock.animationFrame,
        animationTime: clock.animationTime, spy: world.units.find(u => u.id === spyId) })
      const before = frozen(), previous = scene.previous, now = performance.now()
      consume()
      // The ordinary paused full frame reconciles synthetic vs real time itself.
      // No direct previous/pendingTime/animation clock write and no evidence crop.
      Reflect.apply(animate, scene, [now])
      if (scene.previous !== now || frozen() !== before)
        throw Error('Paused full-frame clock handback changed Spy or simulation clock')
      check()
      if (pending === null || scene.frame !== pending) throw Error('Handback Scene successor missing')
      result.handback = { previous, timestamp: now, turn: world.turn,
        stamp: scene.renderer.info.render.frame, spyAndAnimationUnchanged: true, evidence: false }
      restore()
      if (!result.released) throw Error('Spy capture could not restore owned RAF descriptors')
      current()
      if (!same(Object.getOwnPropertyDescriptor(window, 'requestAnimationFrame'), originalRAF) ||
        !same(Object.getOwnPropertyDescriptor(window, 'cancelAnimationFrame'), originalCancel))
        throw Error('Spy capture restoration changed before restart')
      scene.frame = Reflect.apply(originalRAF.value, window, [animate])
      result.resumedRAF = true
      return result
    },
    abandon,
  }
  window.__pndSpyCapture = api
  try {
    current()
    if (!Number.isFinite(scene.previous)) throw Error('Spy capture requires an already rendered Scene')
    if (!world.paused || world.speed !== 1) throw Error('Spy capture acquisition requires public pause at normal speed')
    if (!Number.isFinite(deadlineAt) || Date.now() >= deadlineAt) throw Error('Invalid existing Spy deadline')
    if (typeof originalRAF?.value !== 'function' || typeof originalCancel?.value !== 'function')
      throw Error('Spy capture requires own browser RAF data descriptors')
    ownedRAF = { ...originalRAF, value: request }; ownedCancel = { ...originalCancel, value: cancel }
    Object.defineProperty(window, 'requestAnimationFrame', ownedRAF)
    installed.add('requestAnimationFrame')
    Object.defineProperty(window, 'cancelAnimationFrame', ownedCancel)
    installed.add('cancelAnimationFrame')
    Reflect.apply(originalCancel.value, window, [scene.frame])
    active = true; result.installed = true
    scene.frame = Reflect.apply(request, window, [animate])
  } catch (error) { result.error = String(error); abandon(); throw error }
  return result
}
