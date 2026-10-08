// Page-serializable observation only. The game owns all input handling, clocks,
// camera state and draws. Adapted from startup-burst-observer's return hook.
export function installOrdinaryZoomWitness() {
  if (window.ordinaryZoom) throw new Error('Ordinary zoom witness already installed')
  const scene = window.testSceneRef.current,
    { world, gameClock: clock, renderer } = scene,
    canvas = renderer.domElement,
    original = renderer.render,
    descriptor = Object.getOwnPropertyDescriptor(renderer, 'render'),
    startedAt = performance.now()
  const records = [],
    frames = {},
    cases = [],
    errors = [],
    pending = new WeakMap()
  let phase = null,
    lastRender = null,
    ordinal = 0,
    closed = false
  const fail = error => {
    if (errors.length < 8) errors.push(String(error?.stack ?? error))
  }
  const check = (condition, message) => {
    if (!condition) throw new Error(message)
  }
  const owner = () => {
    check(
      window.testSceneRef.current === scene &&
        scene.world === world &&
        window.testStore.getWorld() === world &&
        scene.gameClock === clock &&
        scene.renderer === renderer &&
        renderer.domElement === canvas &&
        canvas.isConnected,
      'Observed Scene/World/clock/canvas ownership changed'
    )
    check(renderer.render === wrapper, 'Renderer observer ownership changed')
  }
  const budget = () =>
    check(performance.now() - startedAt <= 15000, '15-second zoom observation exhausted')
  const sample = () => {
    owner()
    budget()
    const transition = scene.viewTransition
    return structuredClone({
      at: performance.now(),
      turn: world.turn,
      speed: world.speed,
      paused: world.paused,
      status: world.status,
      inputMask: world.inputMask,
      flyby: world.flyby.flags,
      animationFrame: clock.animationFrame,
      gameplayRandom: world.randomState,
      cosmeticRandom: world.cosmeticRandom.randomState,
      preset: scene.viewPreset,
      remaining: transition?.remaining ?? 0,
      fraction: transition?.previewFraction ?? 0,
      hasPreview: !!transition?.preview,
      zoomTime: transition?.time ?? null,
      cameraTime: scene.cameraTime,
      config: scene.view.config,
      projection: scene.view.projection,
      center: scene.view.rawCenter,
      point: scene.viewPoint,
      bearing: scene.cameraBearing,
      overview: scene.overviewActive,
      overviewStage: scene.overviewStage,
      keys: [...scene.keys],
      rendererFrame: renderer.info.render.frame,
    })
  }
  const stamp = row =>
    JSON.stringify([
      row.preset,
      row.remaining,
      row.fraction,
      row.config,
      row.projection,
      row.center,
      row.point,
      row.bearing,
    ])
  const append = row => {
    check(records.length < 512, '512-row zoom observation exhausted')
    row.ordinal = ++ordinal
    records.push(row)
    return row
  }
  const observe = action => {
    if (closed || errors.length) return
    try {
      return action()
    } catch (error) {
      fail(error)
    }
  }
  const retain = (label, row) => {
    const key = `${phase.name}-${label}`
    if (frames[key]) return
    check(Object.keys(frames).length < 12, '12-PNG zoom observation exhausted')
    check(
      canvas.width > 0 && canvas.height > 0 && canvas.width * canvas.height <= 2_000_000,
      'Zoom canvas exceeds declared capture bounds'
    )
    frames[key] = { ordinal: row.ordinal, png: canvas.toDataURL('image/png') }
    phase.captures.push(key)
  }
  const begin = event =>
    observe(() => {
      if (!['-', '=', 'w', 'q'].includes(event.key.toLowerCase())) return
      const row = append({
        kind: 'keyboard',
        phase: phase?.name ?? null,
        type: event.type,
        key: event.key.toLowerCase(),
        code: event.code,
        trusted: event.isTrusted,
        repeat: event.repeat,
        eventTime: event.timeStamp,
        modifiers: {
          alt: event.altKey,
          ctrl: event.ctrlKey,
          meta: event.metaKey,
          shift: event.shiftKey,
        },
        target: event.target?.tagName ?? null,
        before: sample(),
        after: null,
        lastRender: lastRender?.ordinal ?? null,
      })
      row.matchesLastRender = !!lastRender && stamp(lastRender.state) === stamp(row.before)
      pending.set(event, row)
    })
  const end = event =>
    observe(() => {
      const row = pending.get(event)
      if (!row) return
      pending.delete(event)
      row.after = sample()
      row.defaultPrevented = event.defaultPrevented
      if (!phase || row.type !== 'keydown') return
      if (
        row.key === '-' &&
        row.before.preset === 0 &&
        row.after.preset === 2 &&
        row.after.remaining > 0
      )
        phase.started = true
      if (phase.name === 'reversal' && row.key === '=' && !phase.reversal) {
        const { before } = row
        phase.reversal = {
          ordinal: row.ordinal,
          fractional:
            row.trusted &&
            !row.repeat &&
            row.matchesLastRender &&
            before.preset === 2 &&
            before.remaining > 0 &&
            before.hasPreview &&
            before.fraction > 0 &&
            before.fraction < 1 &&
            row.after.preset === 0 &&
            row.after.remaining === 18 &&
            JSON.stringify(before.config) === JSON.stringify(row.after.config),
        }
      }
    })
  const wrapper = function (...args) {
    // Preserve the original receiver, result and thrown object exactly. A failed
    // original draw never becomes a successful observed frame.
    const result = original.apply(this, args)
    if (args[0] !== scene.scene || args[1] !== scene.camera) return result
    observe(() => {
      const state = sample()
      if (!phase || phase.done) return
      check(
        state.speed === 1 &&
          !state.paused &&
          !state.inputMask &&
          !(state.flyby & 1) &&
          state.status === 'playing' &&
          !state.overview &&
          !state.overviewStage &&
          !document.querySelector('.loading-world'),
        'Ordinary zoom prerequisites changed'
      )
      const rows = scene.view.bounds,
        { data } = scene.view.boundsTexture.image
      const row = append({
        kind: 'render',
        phase: phase.name,
        state,
        bounds: rows.map(span => [...span]),
        sharedRows:
          data.length === rows.length * 2 &&
          [...data].every((value, i) => value === rows[i >> 1][i & 1]),
        terrain: { count: scene.terrain.geometry.drawRange.count, copies: scene.terrain.count },
        painterSlots: scene.view.painter.commandsBySlot.length,
      })
      lastRender = row
      check(row.sharedRows, 'CPU and GPU bounds rows disagree')
      if (!phase.started) {
        retain('before', row)
        phase.before = true
        return
      }
      if (phase.name === 'out') {
        if (state.remaining >= 13 && state.fraction > 0) retain('early', row)
        if (state.remaining >= 4 && state.remaining <= 12) retain('middle', row)
        if (state.remaining > 0 && state.remaining <= 3) retain('late', row)
      } else if (phase.name === 'reversal') {
        if (
          !phase.reversal &&
          state.remaining > 0 &&
          state.remaining < 18 &&
          state.fraction > 0 &&
          state.fraction < 1
        ) {
          retain('outgoing', row)
          phase.fractionSeen = true
        }
        if (phase.reversal && state.remaining > 0) retain('reversed', row)
      } else if (
        state.remaining > 0 &&
        state.keys.includes('w') &&
        state.keys.includes('q') &&
        (state.point.x !== phase.initial.point.x || state.point.z !== phase.initial.point.z) &&
        state.bearing !== phase.initial.bearing
      ) {
        retain('moving', row)
        phase.moving = true
      }
      const target = phase.name === 'reversal' ? 0 : 2
      if (
        !state.remaining &&
        state.preset === target &&
        (phase.name !== 'reversal' || phase.reversal)
      ) {
        retain('endpoint', row)
        phase.done = true
      }
    })
    return result
  }
  renderer.render = wrapper
  const listeners = [
    ['keydown', begin, true],
    ['keydown', end, false],
    ['keyup', begin, true],
    ['keyup', end, false],
  ]
  try {
    owner()
    for (const args of listeners) window.addEventListener(...args)
  } catch (error) {
    for (const args of listeners) window.removeEventListener(...args)
    if (renderer.render === wrapper) {
      if (descriptor) Object.defineProperty(renderer, 'render', descriptor)
      else delete renderer.render
    }
    throw error
  }
  const api = {
    arm(name) {
      owner()
      budget()
      check(
        !closed && !errors.length && (!phase || phase.done),
        'Previous zoom observation incomplete'
      )
      check(
        name === ['out', 'reversal', 'combined'][cases.length],
        'Unexpected zoom observation order'
      )
      const initial = sample()
      check(
        initial.preset === 0 && !initial.remaining,
        'Zoom case must begin in naturally settled normal view'
      )
      phase = { name, initial, started: false, before: false, done: false, captures: [] }
      cases.push(phase)
    },
    status() {
      observe(() => {
        owner()
        budget()
      })
      return structuredClone({
        phase: phase && {
          name: phase.name,
          before: phase.before,
          done: phase.done,
          fractionSeen: !!phase.fractionSeen,
          moving: !!phase.moving,
          reversal: phase.reversal,
        },
        errors,
        closed,
      })
    },
    read: () => structuredClone({ startedAt, records, frames, cases, errors, closed }),
    close() {
      if (closed) return
      closed = true
      for (const args of listeners) window.removeEventListener(...args)
      check(renderer.render === wrapper, 'Renderer observer ownership changed during cleanup')
      if (descriptor) Object.defineProperty(renderer, 'render', descriptor)
      else delete renderer.render
    },
  }
  window.ordinaryZoom = api
  return api
}
