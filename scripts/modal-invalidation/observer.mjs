// Serialized into one disposable game document. Never drives the game clock or
// renderer. The wrapper calls the original exactly once, including on failure.
export function installModalInvalidationObserver() {
  if (window.modalInvalidationObserver) throw Error('Modal observer already installed')
  const scene = window.testSceneRef.current, world = window.testStore.getWorld(),
    renderer = scene.renderer, canvas = renderer.domElement, clock = scene.gameClock,
    original = renderer.render, descriptor = Object.getOwnPropertyDescriptor(renderer, 'render'),
    fixture = window.__pndModalInvalidationFixture
  if (!fixture) throw Error('Missing opt-in modal fixture')
  const errors = [], events = [], samples = []
  let closed = false, raf = null, sampling = null, drawCount = 0, lastPixels = null,
    person = null, unit = null, shot = null, observedTexture = null, readyResult = null, lossExtension = null
  const check = (ok, message) => { if (!ok) throw Error(message) }
  const owner = () => {
    check(!closed && window.testSceneRef.current === scene && window.testStore.getWorld() === world &&
      scene.world === world && scene.gameClock === clock && scene.renderer === renderer &&
      renderer.domElement === canvas && canvas.isConnected && renderer.render === wrapper,
    'Scene/World/clock/renderer/canvas/observer owner changed')
    if (person) check(world.units.includes(unit) && unit.native === person && world.projectiles.includes(shot),
      'Frozen native person/projectile owner changed')
  }
  const capture = () => {
    // Read during the original submit, before the default drawing buffer is
    // discarded. The narrow upper sky crop avoids HUD and modal DOM overlays.
    const gl = renderer.getContext(), width = gl.drawingBufferWidth, height = gl.drawingBufferHeight
    check(!gl.isContextLost() && width >= 64 && height >= 64, 'Unavailable drawing buffer')
    const crop = { x: Math.floor(width * .05), y: Math.floor(height * .88),
      width: Math.min(128, Math.floor(width * .9)), height: Math.min(32, Math.floor(height * .1)) }
    const bytes = new Uint8Array(crop.width * crop.height * 4)
    gl.readPixels(crop.x, crop.y, crop.width, crop.height, gl.RGBA, gl.UNSIGNED_BYTE, bytes)
    let nonempty = false
    for (let i = 0; i < bytes.length; i += 4) nonempty ||= bytes[i + 3] > 0 && !!(bytes[i] || bytes[i + 1] || bytes[i + 2])
    lastPixels = { at: performance.now(), drawCount, crop, nonempty, bytes: [...bytes] }
  }
  function wrapper(...args) {
    drawCount++
    // Do not mask or replace the renderer's returned value or thrown object.
    const returned = original.apply(this, args)
    try {
      owner()
      check(this === renderer && args[0] === scene.scene && args[1] === scene.camera,
        'Unexpected render receiver or scene/camera')
      capture()
    } catch (error) { errors.push(String(error)) }
    return returned
  }
  const snapshot = () => {
    owner()
    check(person && shot && scene.modalSuspended, 'A real cast must be held by the modal')
    return { at: performance.now(), observedDrawCount: drawCount, modalSuspended: scene.modalSuspended,
      ownerUnchanged: true, frozenState: {
        turn: world.turn, time: world.time, pendingTime: world.pendingTime,
        paused: world.paused, speed: world.speed, inputMask: world.inputMask,
        person: [unit.id, unit.x, unit.z, unit.hp, person.state, person.timer, person.stamp],
        shot: [shot.id, shot.caster, shot.remaining],
        nativePerson: JSON.stringify(person), projectile: JSON.stringify(shot),
        casting: JSON.stringify(unit.casting), cooldown: world.castingTribes[0].cooldown,
        shots: JSON.stringify(world.shots), mana: world.manaTribes[0].available,
      } }
  }
  const lost = event => events.push({ kind: 'lost', at: performance.now(), trusted: event.isTrusted,
    contextLost: renderer.getContext().isContextLost() })
  const restored = event => events.push({ kind: 'restored', at: performance.now(), trusted: event.isTrusted,
    contextLost: renderer.getContext().isContextLost() })
  renderer.render = wrapper
  canvas.addEventListener('webglcontextlost', lost)
  canvas.addEventListener('webglcontextrestored', restored)
  const observer = window.modalInvalidationObserver = {
    bindHeldCast() {
      owner()
      unit = world.units.find(u => u.team === 'blue' && u.kind === 'shaman' && u.hp > 0)
      person = unit?.native
      shot = world.projectiles.find(s => s.caster === unit?.id && s.spell === 'blast' && s.phase === 'windup' && s.remaining > 0)
      check(person && shot && unit.casting?.remaining > 0 && scene.modalSuspended,
        'Public cast did not reach the modal while a real windup was alive')
      return snapshot()
    },
    sample(duration = 400) {
      owner(); check(duration >= 350 && duration <= 1000 && !sampling, 'Invalid or overlapping RAF sample')
      return new Promise((resolve, reject) => {
        const rows = [], started = performance.now()
        sampling = { reject }
        const tick = () => {
          raf = null
          try {
            check(errors.length === 0, errors.join('; ')); rows.push(snapshot())
            check(rows.length <= 512, 'RAF sample bound exceeded')
            if (rows.at(-1).at - rows[0].at >= duration) {
              samples.push(...rows); sampling = null; resolve(rows)
            } else {
              check(performance.now() - started <= 2500, 'RAF sampling deadline exceeded')
              raf = requestAnimationFrame(tick)
            }
          } catch (error) { sampling = null; errors.push(String(error)); reject(error) }
        }
        raf = requestAnimationFrame(tick)
      })
    },
    watchSky() {
      owner()
      const sky = scene.skyBackdrop
      check(sky.visible && sky.parent === scene.scene && sky.material.visible &&
        sky.material.uniforms.height.value > .15, 'Sky is not visible in the held scene')
      // The constructor already requested this exact texture. The fixture checks
      // identity before returning its cache entry; no new asset is substituted.
      observedTexture = fixture.skyAsset(scene)
      check(observedTexture.status === 'loading', 'Sky was not actually delayed')
      void observedTexture.ready.then(result => { if (!closed) readyResult = result })
      return observer.texture()
    },
    texture() {
      owner(); check(observedTexture, 'Sky observation not installed')
      const image = observedTexture.texture.image, sky = scene.skyBackdrop
      return { status: observedTexture.status, revision: fixture.revision(), readyResult,
        usedByVisibleMaterial: sky.visible && sky.parent === scene.scene && sky.material.visible &&
          sky.material.uniforms.map.value === observedTexture.texture && sky.material.uniforms.height.value > .15,
        realImageDecode: image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0 && image.naturalHeight > 0,
        imageUrl: image?.currentSrc ?? null }
    },
    lose() {
      owner(); check(events.length === 0 && scene.modalSuspended, 'Context trigger is not fresh/held')
      const gl = renderer.getContext(), extension = gl.getExtension('WEBGL_lose_context')
      check(extension && !gl.isContextLost(), 'WEBGL_lose_context unavailable')
      lossExtension = extension
      const at = performance.now(); extension.loseContext(); return at
    },
    restore() {
      owner(); const gl = renderer.getContext()
      check(events.length === 1 && events[0].kind === 'lost' && events[0].trusted && gl.isContextLost(),
        'Restoration requires the actual trusted context loss')
      // Three keeps this original context object and handles its normal events.
      check(lossExtension, 'Loss extension was not retained'); lossExtension.restoreContext()
    },
    read() { owner(); return { drawCount, pixels: lastPixels, events: [...events], errors: [...errors] } },
    close() {
      if (closed) return { closed: true, restored: renderer.render === original, observers: 0 }
      closed = true
      if (raf !== null) cancelAnimationFrame(raf)
      raf = null
      sampling?.reject(Error('Modal observation closed')); sampling = null
      canvas.removeEventListener('webglcontextlost', lost); canvas.removeEventListener('webglcontextrestored', restored)
      const owned = renderer.render === wrapper
      if (owned) {
        if (descriptor) Object.defineProperty(renderer, 'render', descriptor)
        else delete renderer.render
      } else errors.push('Renderer wrapper was replaced before cleanup')
      const result = { closed: true, restored: owned && renderer.render === original, observers: 0,
        errors: [...errors], events: [...events], samples: [...samples], pixels: lastPixels }
      delete window.modalInvalidationObserver
      return result
    },
  }
}
