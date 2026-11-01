import assert from 'node:assert/strict'

export const hypnotiseLimitMs = 75000
export const hypnotiseObservationMs = 12000

// RAF artwork observation plus an owned, transparent afterTurn witness. No
// forced ticks, hidden groups, changed frame/UV, stock injection or camera pursuit.
export function installHypnotiseObserver({ observationMs }) {
  const scene = window.testSceneRef.current, world = window.testStore.getWorld(),
    clock = scene.gameClock,
    canvas = scene.renderer.domElement, started = performance.now(), copies = [], keys = new Set(),
    result = { done: false, error: null, visits: 0, samples: [], turnSamples: [], nonAdvancingCallbacks: 0, crops: [], bornTurn: null,
      terminal: null, hook: { installed: false, restored: false, foreign: false } }
  let raf, flash, stopped = false, lastKey, lastObservedTurn, originalDescriptor, ownedDescriptor, hookActive = false
  const sameDescriptor = (a, b) => !!a && !!b &&
    ['value', 'writable', 'get', 'set', 'enumerable', 'configurable'].every(key => a[key] === b[key])
  const recordError = error => {
    try { result.error ??= String(error) }
    catch { result.error ??= 'Hypnotise observer error could not be represented' }
  }
  const restoreHook = () => {
    if (!hookActive) return
    hookActive = false
    // Inspect descriptors, not a possibly foreign getter. Never overwrite a successor.
    if (!sameDescriptor(Object.getOwnPropertyDescriptor(clock, 'afterTurn'), ownedDescriptor)) {
      result.hook.foreign = true
      throw Error('Hypnotise observer lost its owned afterTurn descriptor')
    }
    Object.defineProperty(clock, 'afterTurn', originalDescriptor)
    result.hook.restored = sameDescriptor(Object.getOwnPropertyDescriptor(clock, 'afterTurn'), originalDescriptor)
    if (!result.hook.restored) throw Error('Hypnotise afterTurn restoration failed')
  }
  const stop = reason => {
    if (stopped) return
    stopped = true
    result.done = true
    try { cancelAnimationFrame(raf) } catch (error) { recordError(error) }
    try { restoreHook() } catch (error) { recordError(error) }
    try {
      result.terminal = { reason, turn: world.turn, stamp: scene.renderer.info.render.frame,
        elapsedMs: performance.now() - started, present: !!flash && world.effects.includes(flash),
        meshPresent: !!flash && scene.fxMeshes.has(flash.id), remaining: flash?.turnsRemaining }
    } catch (error) { recordError(error); result.terminal = { reason, snapshotFailed: true } }
  }
  const current = () => {
    if (window.testSceneRef.current !== scene || window.testStore.getWorld() !== world ||
      scene.world !== world || scene.gameClock !== clock)
      throw Error('Hypnotise observer lost its original Scene/world/clock')
    if (hookActive && !sameDescriptor(Object.getOwnPropertyDescriptor(clock, 'afterTurn'), ownedDescriptor))
      throw Error('Hypnotise observer lost its owned afterTurn descriptor')
  }
  const reserveSample = () => {
    if (result.samples.length + result.turnSamples.length >= 2048)
      throw Error('Hypnotise sample storage exceeded')
  }
  function afterTurn(...args) {
    let returned, failure, threw = false
    try { returned = Reflect.apply(originalDescriptor.value, this, args) }
    catch (value) { failure = value; threw = true }
    if (!stopped) {
      try {
        if (threw) throw failure
        current()
        if (flash) {
          // Restore at logical expiry, but keep the existing post-render RAF terminal witness.
          if (!world.effects.includes(flash)) restoreHook()
          else if (world.turn === lastObservedTurn) result.nonAdvancingCallbacks++
          else {
            if (world.turn !== lastObservedTurn + 1)
              throw Error('Hypnotise observer missed a consecutive advancing World turn')
            reserveSample()
            // afterTurn follows the fixed World turn, before deferred phases/animation/presentation.
            result.turnSamples.push({ turn: world.turn, id: flash.id, remaining: flash.turnsRemaining,
              converted: world.units.filter(u => u.hypnotise?.originalTeam === 'red' && u.team === 'blue').map(u => u.id) })
            lastObservedTurn = world.turn
          }
        }
      } catch (error) { recordError(error); stop('error') }
    }
    if (threw) throw failure
    return returned
  }
  const visit = () => {
    if (stopped) return
    try {
      result.visits++
      if (performance.now() - started > observationMs || result.visits > 7200)
        throw Error('Hypnotise observation exceeded its fixed bound')
      current()
      if (!canvas.isConnected || document.visibilityState !== 'visible' || world.paused || world.speed !== 1)
        throw Error('Hypnotise observation must remain connected, visible and running at normal speed')
      if (scene.renderer.getContext().isContextLost()) throw Error('Hypnotise WebGL context lost')
      if (!flash) {
        flash = world.effects.find(f => f.kind === 'hypnotise' && f.team === 'blue')
        if (!flash) { raf = requestAnimationFrame(visit); return }
        result.bornTurn = world.turn
        lastObservedTurn = world.turn
        result.birth = { id: flash.id, remaining: flash.turnsRemaining,
          stock: world.shots.hypnotise, x: flash.x, z: flash.z,
          cue: world.sounds.some(s => s.cue === 0x2a && s.turn === world.turn && s.x === flash.x && s.z === flash.z) }
      }
      if (!world.effects.includes(flash)) { stop('logical-expiry'); return }
      const group = scene.fxMeshes.get(flash.id), sprite = group?.userData.sprite,
        animation = flash.animation, stamp = scene.renderer.info.render.frame,
        key = `${world.turn}:${animation.object}:${animation.f1}:${stamp}`
      if (key !== lastKey) {
        lastKey = key
        const frame = animation.object === 0x650 ? null : animation.object + (animation.f1 >>> 2),
          sample = { turn: world.turn, stamp, elapsedMs: performance.now() - started,
            id: flash.id, remaining: flash.turnsRemaining, x: flash.x, z: flash.z,
            converted: world.units.filter(u => u.hypnotise?.originalTeam === 'red' && u.team === 'blue').map(u => u.id), object: animation.object, draw: animation.draw,
            f1: animation.f1, flags: animation.renderFlags, palette: animation.palette, frame,
            sequence: group?.userData.sequence, visible: !!group?.visible && !!sprite?.visible,
            submitted: !!sprite && !!scene.view.painter.source(sprite), opacity: sprite?.material.opacity,
            uv: sprite?.userData.atlasTransform?.toArray(), size: sprite?.scale.toArray(),
            center: sprite?.center.toArray(), texture: sprite?.material.map?.image?.currentSrc ?? sprite?.material.map?.image?.src }
        reserveSample()
        result.samples.push(sample)
        if (sample.visible && frame !== null && !keys.has(frame) && keys.size < 16) {
          keys.add(frame) // A failed original frame slot is never replaced by later pixels.
          if (!sample.submitted) throw Error('Visible hypnotise frame was not submitted to painter')
          const rect = canvas.getBoundingClientRect(), point = scene.screen(flash, flash.height),
            px = (point.x + 1) * canvas.width / 2, py = (1 - point.y) * canvas.height / 2,
            width = 192, height = 192, x = Math.floor(px - width / 2), y = Math.floor(py - 144)
          if (x < 0 || y < 0 || x + width > canvas.width || y + height > canvas.height)
            throw Error('Hypnotise crop falls outside the actual canvas')
          const clip = { x: rect.left + x * rect.width / canvas.width,
            y: rect.top + y * rect.height / canvas.height,
            width: width * rect.width / canvas.width, height: height * rect.height / canvas.height },
            owner = document.elementFromPoint(rect.left + px * rect.width / canvas.width,
              rect.top + (py - 50) * rect.height / canvas.height)
          if (owner !== canvas) throw Error('Hypnotise artwork center is covered by UI')
          const copy = document.createElement('canvas')
          copy.width = width; copy.height = height
          const context = copy.getContext('2d'), copyStart = performance.now()
          if (!context) throw Error('Hypnotise canvas copy context unavailable')
          context.drawImage(canvas, x, y, width, height, 0, 0, width, height)
          const crop = { filename: `spell-hypnotise-frame-${result.crops.length}.png`, frame,
            turn: world.turn, stamp, clip, copyMs: performance.now() - copyStart }
          sample.cropFile = crop.filename
          result.crops.push(crop); copies.push({ copy, context, crop })
        }
      }
      if (world.turn > result.bornTurn + 16) throw Error('Hypnotise owner exceeded sixteen logical visits')
      raf = requestAnimationFrame(visit)
    } catch (error) { recordError(error); stop('error') }
  }
  window.__pndHypnotiseObservation = {
    result,
    retain() {
      if (!stopped) stop('retained-before-completion')
      for (const { copy, context, crop } of copies) {
        try {
          const bytes = context.getImageData(0, 0, copy.width, copy.height).data, colors = new Set()
          for (let i = 0; i < bytes.length; i += 4)
            if (bytes[i + 3]) colors.add((bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2])
          crop.colors = colors.size
          crop.png = copy.toDataURL('image/png')
        } catch (error) { crop.error = String(error); result.error ??= String(error) }
        finally { copy.width = 0; copy.height = 0 }
      }
      copies.length = 0
      return result
    },
  }
  try {
    originalDescriptor = Object.getOwnPropertyDescriptor(clock, 'afterTurn')
    if (!originalDescriptor || typeof originalDescriptor.value !== 'function')
      throw Error('Hypnotise requires the actual own afterTurn callback')
    ownedDescriptor = { ...originalDescriptor, value: afterTurn }
    Object.defineProperty(clock, 'afterTurn', ownedDescriptor)
    hookActive = true
    result.hook.installed = true
    raf = requestAnimationFrame(visit)
  } catch (error) { recordError(error); stop('error') }
}

export function validateHypnotiseObservation(observation, atlas) {
  assert.equal(observation.error, null)
  assert.equal(observation.terminal.reason, 'logical-expiry')
  assert.equal(observation.terminal.turn - observation.bornTurn, 16)
  assert.equal(observation.terminal.present, false)
  assert.equal(observation.terminal.meshPresent, false)
  assert.equal(observation.terminal.remaining, 0)
  assert.equal(observation.birth.remaining, 16)
  assert.equal(observation.birth.stock, 0)
  assert.equal(observation.birth.cue, true)
  assert.deepEqual(observation.hook, { installed: true, restored: true, foreign: false })
  assert.ok(observation.samples.length + observation.turnSamples.length <= 2048)
  const visible = observation.samples.filter(s => s.visible)
  assert.ok(new Set(visible.map(s => s.frame)).size >= 2, 'Observe actual artwork progression')
  assert.ok(observation.crops.length >= 2 && observation.crops.length <= 16)
  assert.ok(observation.samples.some(s => s.object === 0x650 && !s.visible), 'Observe terminal hiding')
  const fourth = observation.turnSamples.find(s => s.remaining === 12 && !s.converted.length)
  const fifth = observation.turnSamples.find(s => s.remaining === 11 && s.converted.length === 2)
  assert.ok(fourth)
  assert.ok(fifth,
    'Actual fifth-visit callback must replace the two authored targets')
  assert.equal(fourth.id, observation.birth.id)
  assert.equal(fifth.id, observation.birth.id)
  assert.equal(fourth.turn, observation.bornTurn + 4)
  assert.equal(fifth.turn, fourth.turn + 1)
  for (const sample of visible) {
    assert.equal(sample.id, observation.birth.id)
    assert.equal(sample.draw, 44); assert.equal(sample.object, 1264)
    assert.equal(sample.frame, 1264 + (sample.f1 >>> 2))
    assert.equal(sample.sequence, 'hypnotise'); assert.equal(sample.flags, 0x104)
    assert.equal(sample.palette, 0); assert.equal(sample.opacity, 1); assert.equal(sample.submitted, true)
    assert.match(sample.texture, /\/original\/effects\.png(?:\?|$)/)
    const frame = atlas.animations.hypnotise[sample.frame - 1264]
    assert.ok(frame && frame.source === sample.frame)
    assert.deepEqual(sample.size, [100, 100, 1]); assert.deepEqual(sample.center, [0.5, 0])
    assert.deepEqual(sample.uv, [100 / atlas.width, 100 / atlas.height,
      frame.index % 8 * 256 / atlas.width, 1 - (Math.floor(frame.index / 8) * 256 + 100) / atlas.height])
  }
  for (const crop of observation.crops) {
    assert.ok(!crop.error && crop.colors > 1, 'Actual copied canvas must not be blank')
    assert.ok(visible.some(s => s.cropFile === crop.filename && s.frame === crop.frame &&
      s.turn === crop.turn && s.stamp === crop.stamp), 'Crop must bind its synchronous render sample')
  }
}
