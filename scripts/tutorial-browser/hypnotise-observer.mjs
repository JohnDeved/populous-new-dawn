import assert from 'node:assert/strict'

export const hypnotiseLimitMs = 75000
export const hypnotiseObservationMs = 12000

// Read-only RAF observation. No game method replacement, forced ticks, hidden
// groups, changed frame/UV, stock injection or repeated camera pursuit.
export function installHypnotiseObserver({ observationMs }) {
  const scene = window.testSceneRef.current, world = window.testStore.getWorld(),
    canvas = scene.renderer.domElement, started = performance.now(), copies = [], keys = new Set(),
    result = { done: false, error: null, visits: 0, samples: [], crops: [], bornTurn: null, terminal: null }
  let raf, flash, stopped = false, lastKey
  const stop = reason => {
    if (stopped) return
    stopped = true
    cancelAnimationFrame(raf)
    result.done = true
    result.terminal = { reason, turn: world.turn, stamp: scene.renderer.info.render.frame,
      elapsedMs: performance.now() - started, present: !!flash && world.effects.includes(flash),
      meshPresent: !!flash && scene.fxMeshes.has(flash.id), remaining: flash?.turnsRemaining }
  }
  const visit = () => {
    if (stopped) return
    try {
      result.visits++
      if (performance.now() - started > observationMs || result.visits > 7200)
        throw Error('Hypnotise observation exceeded its fixed bound')
      if (window.testSceneRef.current !== scene || window.testStore.getWorld() !== world || scene.world !== world)
        throw Error('Hypnotise observer lost its original Scene/world')
      if (!canvas.isConnected || document.visibilityState !== 'visible' || world.paused || world.speed !== 1)
        throw Error('Hypnotise observation must remain connected, visible and running at normal speed')
      if (scene.renderer.getContext().isContextLost()) throw Error('Hypnotise WebGL context lost')
      if (!flash) {
        flash = world.effects.find(f => f.kind === 'hypnotise' && f.team === 'blue')
        if (!flash) { raf = requestAnimationFrame(visit); return }
        result.bornTurn = world.turn
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
        if (result.samples.length >= 2048) throw Error('Hypnotise sample storage exceeded')
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
    } catch (error) { result.error = String(error); stop('error') }
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
  raf = requestAnimationFrame(visit)
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
  const visible = observation.samples.filter(s => s.visible)
  assert.ok(new Set(visible.map(s => s.frame)).size >= 2, 'Observe actual artwork progression')
  assert.ok(observation.crops.length >= 2 && observation.crops.length <= 16)
  assert.ok(observation.samples.some(s => s.object === 0x650 && !s.visible), 'Observe terminal hiding')
  assert.ok(observation.samples.some(s => s.remaining === 12 && !s.converted.length))
  assert.ok(observation.samples.some(s => s.remaining === 11 && s.converted.length === 2),
    'Actual fifth-visit callback must replace the two authored targets')
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
