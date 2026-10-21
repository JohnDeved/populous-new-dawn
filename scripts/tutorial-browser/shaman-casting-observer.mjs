// Serialized into the existing campaign document. All writes below belong to
// this observer, not World. Wrappers call the original callback exactly once and
// preserve its receiver, result and thrown object. No clock/render is driven.
export function installShamanCastingObserver() {
  if (window.shamanCastingObserver) throw Error('Casting observer already installed')
  const scene = window.testSceneRef.current, world = window.testStore.getWorld(),
    clock = scene.gameClock, renderer = scene.renderer, canvas = renderer.domElement,
    originalTurn = clock.afterTurn, originalRender = renderer.render,
    turnDescriptor = Object.getOwnPropertyDescriptor(clock, 'afterTurn'),
    renderDescriptor = Object.getOwnPropertyDescriptor(renderer, 'render')
  const result = { casts: [], holds: [], errors: [], closed: false, restored: false }, copies = []
  let armed = null, pending = null, active = null, closed = false
  const check = (condition, message) => { if (!condition) throw Error(message) }
  const observe = callback => {
    if (closed || result.errors.length) return
    try { return callback() } catch (error) { result.errors.push(String(error)) }
  }
  const owner = () => {
    check(window.testSceneRef.current === scene && window.testStore.getWorld() === world &&
      scene.world === world && scene.gameClock === clock && scene.renderer === renderer &&
      renderer.domElement === canvas && canvas.isConnected, 'Casting Scene/World/clock/canvas changed')
    check(clock.afterTurn === turnWrapper && renderer.render === renderWrapper,
      'Casting observation callback ownership changed')
  }
  const read = () => {
    owner()
    const u = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman' && unit.hp > 0),
      p = u?.native,
      order = p && world.buildingOrders?.records[p.immediateCommand || p.commands?.[p.commandCursor]]
    check(u && p, 'Living authored Shaman must have a native person')
    return {
      turn: world.turn, paused: world.paused, suspended: scene.modalSuspended,
      speed: world.speed, level: world.outcome.level, inputMask: world.inputMask,
      mode: world.mode, cheatsUsed: window.testStore.hasUsedCheats(),
      stock: world.shots.blast, storedStock: world.manaWorld.spells[0].stocks[2] & 15,
      casts: world.stats.cast, nativeCasts: world.spellCasts[0][2],
      cooldown: world.castingTribes[0].cooldown, tribeFlags: world.castingTribes[0].flags,
      gameFlags: world.manaWorld.gameFlags, mana: world.manaTribes[0].available,
      person: { id: u.id, hp: u.hp, state: p.state, previousState: p.previousState,
        object: p.object, draw: p.draw, f1: p.f1, f2: p.f2, timer: p.timer,
        angle: p.angle, heading: p.heading, turnAngle: p.turnAngle, turnY: p.turnY,
        counter: p.counter, stamp: p.stamp, vehicle: p.vehicle, flags2: p.flags2,
        flags4: p.flags4, flight: !!u.flight, lift: u.lift, casting: !!u.casting,
        orderModel: order?.model ?? 0, sameOwner: !active || active.person === p },
      projectiles: world.projectiles.filter(shot => shot.team === 'blue' && shot.spell === 'blast')
        .map(shot => ({ id: shot.id, caster: shot.caster, phase: shot.phase, remaining: shot.remaining })),
      waves: world.effects.filter(effect => effect.kind === 'blastWave' && effect.wave?.tribe === 0)
        .map(effect => effect.id),
    }
  }
  const beforeInput = event => observe(() => {
    if (!armed || event.target !== canvas || event.button !== 0 || world.mode !== 'blast') return
    check(!pending, 'Nested cast pointer input')
    pending = { label: armed, trusted: event.isTrusted, button: event.button,
      point: { x: event.clientX, y: event.clientY }, before: read() }
  })
  const afterInput = event => observe(() => {
    if (!pending || event.target !== canvas || event.button !== 0) return
    const after = read(), prior = new Set(pending.before.projectiles.map(shot => shot.id)),
      shots = after.projectiles.filter(shot => !prior.has(shot.id))
    check(shots.length === 1 && after.casts === pending.before.casts + 1,
      'Real pointer input must allocate exactly one Blast')
    const record = { ...pending, after, shot: shots[0].id, logical: [], frames: [], crops: [],
      done: false, terminal: null }
    active = { record, person: world.units.find(unit => unit.id === after.person.id).native,
      phases: new Set() }
    result.casts.push(record)
    pending = null; armed = null
  })
  function turnWrapper(...args) {
    const returned = originalTurn?.apply(this, args)
    observe(() => {
      if (!active || active.record.done) return
      const state = read(), record = active.record
      check(record.logical.length < 12, 'Casting logical observation exceeded twelve visits')
      record.logical.push(state)
      if (state.turn >= record.after.turn + 12) {
        record.done = true
        record.terminal = { turn: state.turn, reason: 'twelve-natural-visits' }
      }
    })
    return returned
  }
  function renderWrapper(...args) {
    const returned = originalRender.apply(this, args)
    if (args[0] !== scene.scene || args[1] !== scene.camera) return returned
    observe(() => {
      if (!active || active.record.done) return
      const state = read(), record = active.record, u = world.units.find(u => u.id === state.person.id),
        group = scene.unitMeshes.get(u.id), stamp = renderer.info.render.frame
      check(record.frames.length < 600, 'Casting render observation exceeded 600 samples')
      const camera = Math.round(scene.cameraBearing * 1024 / Math.PI),
        heading = Math.round((Math.PI - u.heading) * 1024 / Math.PI),
        direction = ((((camera << 16) >> 16) - ((heading << 16) >> 16) - 0x380) & 0x700) >> 8,
        layers = (group?.userData.layers ?? []).filter(layer => layer.visible),
        frame = { ...state, at: performance.now(), stamp, direction,
          cameraBearing: scene.cameraBearing, heading: u.heading, visible: group?.visible === true,
          submittedLayers: layers.filter(layer => scene.view.painter.source(layer)).length,
          frame: group?.userData.frame, flip: group?.userData.frameFlip,
          renderedDraw: group?.userData.draw, cropPlanned: false }
      record.frames.push(frame)
      // Capture the first two distinct running phases per cast. Paused/modal
      // frames remain evidence but cannot replace an ordinary visible crop.
      if (state.person.state !== 22 || state.paused || state.suspended ||
        active.phases.has(state.person.f2) || active.phases.size >= 2) return
      active.phases.add(state.person.f2); frame.cropPlanned = true
      const rect = canvas.getBoundingClientRect(), bounds = scene.picking.personBounds(u.id, rect)
      check(bounds && bounds.width > 1 && bounds.height > 1, 'Cast body lacks bounds')
      const center = { x: rect.left + bounds.x + bounds.width / 2,
        y: rect.top + bounds.y + bounds.height / 2 }
      frame.bodyCanvasOwned = document.elementFromPoint(center.x, center.y) === canvas
      frame.bodyInCanvas = bounds.x >= 0 && bounds.y >= 0 &&
        bounds.x + bounds.width <= rect.width && bounds.y + bounds.height <= rect.height
      const sx = canvas.width / rect.width, sy = canvas.height / rect.height,
        x = Math.max(0, Math.floor((bounds.x - 8) * sx)),
        y = Math.max(0, Math.floor((bounds.y - 8) * sy)),
        width = Math.min(256, canvas.width - x, Math.ceil((bounds.width + 16) * sx)),
        height = Math.min(256, canvas.height - y, Math.ceil((bounds.height + 16) * sy)),
        clip = { x: rect.left + x / sx, y: rect.top + y / sy, width: width / sx, height: height / sy }
      const overlays = [...document.querySelectorAll(
        '.native-hud,[data-original-pause-status],.campaign-messages summary,.campaign-messages details[open] [data-native-campaign-panel],.fps-graph,.hud-description,.world-message,.target-prompt,dialog[open],.loading-world')]
        .filter(element => {
          const style = getComputedStyle(element), r = element.getBoundingClientRect()
          return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 &&
            r.width > 0 && r.height > 0 && r.x < clip.x + clip.width && r.x + r.width > clip.x &&
            r.y < clip.y + clip.height && r.y + r.height > clip.y
        })
      frame.cropOverlayClear = overlays.length === 0
      check(frame.bodyCanvasOwned && frame.bodyInCanvas && frame.cropOverlayClear,
        'First reserved cast crop is obscured; no later replacement')
      check(width > 1 && height > 1, 'Cast crop is empty')
      const copy = document.createElement('canvas')
      copy.width = width; copy.height = height
      const context = copy.getContext('2d')
      check(context, 'Cast crop requires 2D canvas')
      context.drawImage(canvas, x, y, width, height, 0, 0, width, height)
      frame.cropFile = `shaman-casting-${record.label}-${record.crops.length}.png`
      const crop = { file: frame.cropFile, turn: state.turn, stamp, f2: state.person.f2,
        frame: frame.frame, clip: { x, y, width, height } }
      record.crops.push(crop); copies.push({ copy, context, crop })
    })
    return returned
  }
  const restore = () => {
    if (clock.afterTurn === turnWrapper) {
      if (turnDescriptor) Object.defineProperty(clock, 'afterTurn', turnDescriptor)
      else delete clock.afterTurn
    }
    if (renderer.render === renderWrapper) {
      if (renderDescriptor) Object.defineProperty(renderer, 'render', renderDescriptor)
      else delete renderer.render
    }
    window.removeEventListener('pointerup', beforeInput, true)
    window.removeEventListener('pointerup', afterInput, false)
    result.restored = clock.afterTurn === originalTurn && renderer.render === originalRender
  }
  try {
    clock.afterTurn = turnWrapper
    renderer.render = renderWrapper
    owner()
    window.addEventListener('pointerup', beforeInput, true)
    window.addEventListener('pointerup', afterInput, false)
  } catch (error) { restore(); throw error }
  window.shamanCastingObserver = {
    arm(label) {
      owner()
      check(!closed && !result.errors.length && !armed && !pending && (!active || active.record.done),
        'Previous casting observation is incomplete')
      check(label === ['ordinary', 'subsequent'][result.casts.length], 'Unexpected casting case')
      armed = label
      return read()
    },
    status() {
      return { errors: [...result.errors], casts: result.casts.map(record => ({
        label: record.label, done: record.done, turn: record.after.turn, visits: record.logical.length,
      })) }
    },
    beginHold() {
      owner()
      check(!closed && !result.errors.length && active?.record.label === 'subsequent' &&
        !active.record.done && !result.holds.length, 'One active subsequent-cast hold required')
      const state = read()
      check(state.person.state === 22 && state.person.casting && !state.paused && state.suspended,
        'F9 must suspend an active, otherwise unpaused cast')
      result.holds.push({ label: active.record.label,
        before: { at: performance.now(), stamp: renderer.info.render.frame, state }, after: null })
    },
    endHold() {
      owner()
      const hold = result.holds[0]
      check(!closed && hold && !hold.after, 'Active cast hold must be open')
      hold.after = { at: performance.now(), stamp: renderer.info.render.frame, state: read() }
    },
    finish() {
      if (!closed) {
        observe(owner)
        closed = true; result.closed = true
        restore()
        // Readback/encoding is outside every logical/render callback. Each copy
        // remains tied to its first reserved frame, never replaced on failure.
        for (const { copy, context, crop } of copies) {
          try {
            const pixels = context.getImageData(0, 0, copy.width, copy.height).data, colors = new Set()
            for (let i = 0; i < pixels.length; i += 4)
              if (pixels[i + 3]) colors.add((pixels[i] << 16) | (pixels[i + 1] << 8) | pixels[i + 2])
            crop.opaqueColors = colors.size
            crop.png = copy.toDataURL('image/png')
          } catch (error) { result.errors.push(String(error)); crop.error = String(error) }
          finally { copy.width = 0; copy.height = 0 }
        }
        copies.length = 0
      }
      return result
    },
  }
}
