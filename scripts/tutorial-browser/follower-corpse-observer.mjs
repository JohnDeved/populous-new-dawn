// Page-serializable read-only RAF observer. No model/clock/renderer method is
// replaced, no phase is assigned, and the observer never issues input or pauses.
export function installFollowerCorpseObserver({ actorId, effectId = null, segment = 'original' }) {
  const scene = window.testSceneRef.current, world = window.testStore.getWorld()
  const canvas = scene.renderer.domElement, initialEffects = new Set(world.effects.map(f => f.id))
  const result = { actorId, effectId, segment, death: null, samples: [], crops: [],
    error: null, done: false, visits: 0, terminal: null, retention: null }
  const copies = [], cropPhases = new Set()
  let raf, stopped = false, previous = null, lastKey = null
  const stop = (reason = 'stopped') => {
    if (!stopped) {
      stopped = true; cancelAnimationFrame(raf)
      result.terminal = { reason, turn: world.turn, stamp: scene.renderer.info.render.frame }
    }
    return result
  }
  const retain = () => {
    stop()
    if (result.retention) return result
    result.retention = { startedMs: performance.now(), done: false }
    for (const { copy, context, crop } of copies) {
      try {
        const pixels = context.getImageData(0, 0, copy.width, copy.height).data, colors = new Set()
        for (let at = 0; at < pixels.length; at += 4)
          if (pixels[at + 3]) colors.add((pixels[at] << 16) | (pixels[at + 1] << 8) | pixels[at + 2])
        crop.opaqueColors = colors.size
        crop.png = copy.toDataURL('image/png')
      } catch (error) { crop.error = String(error); result.error ??= `Corpse crop retention: ${error}` }
      finally { copy.width = 0; copy.height = 0 }
    }
    copies.length = 0
    result.retention.done = true
    result.retention.durationMs = performance.now() - result.retention.startedMs
    return result
  }
  const visit = () => {
    if (stopped) return
    try {
      if (++result.visits > 75 * 240) throw Error('Corpse observation exceeded bounded visit storage')
      if (window.testSceneRef.current !== scene || window.testStore.getWorld() !== world || scene.world !== world)
        throw Error('Corpse observer lost its bound Scene/world')
      if (!canvas.isConnected || document.visibilityState !== 'visible') throw Error('Corpse canvas disconnected or hidden')
      const actor = world.units.find(unit => unit.id === actorId)
      if (actor) previous = { id: actor.id, kind: actor.kind, team: actor.team, hp: actor.hp,
        x: actor.x, z: actor.z, heading: actor.heading, turn: world.turn,
        fight: actor.fight && { group: actor.fight.group, opponent: actor.fight.opponent, action: actor.fight.action } }
      if (result.effectId === null && !actor && previous) {
        const candidates = world.effects.filter(f => !initialEffects.has(f.id) && f.corpse &&
          f.unit?.team === previous.team && f.unit.kind === previous.kind &&
          Math.hypot(f.x - previous.x, f.z - previous.z) < 2)
        if (candidates.length !== 1) throw Error(`Expected exactly one newly produced corpse for follower ${actorId}, got ${candidates.length}`)
        const f = candidates[0]
        result.effectId = f.id
        result.death = { before: previous, absent: true, newEffect: true,
          effectId: f.id, phase: f.corpse.phase, turn: world.turn, x: f.x, z: f.z }
        if (!previous.fight || previous.hp <= 0 || f.corpse.phase !== 0)
          throw Error('Corpse lacks observed living combat participant and native death entry')
      }
      const f = world.effects.find(f => f.id === result.effectId)
      if (!f) { raf = requestAnimationFrame(visit); return }
      const g = scene.fxMeshes.get(f.id), animation = f.animation
      if (!g || !animation || !f.corpse) throw Error('Follower corpse lacks its ordinary effect renderer')
      if (f.corpse.phase > 3) throw Error('Corpse observer missed the complete native rise window')
      const cameraHeading = Math.round(scene.cameraBearing * 1024 / Math.PI)
      const objectHeading = Math.round((Math.PI - f.unit.heading) * 1024 / Math.PI)
      const direction = ((((cameraHeading << 16) >> 16) - ((objectHeading << 16) >> 16) - 0x380) & 0x700) >> 8
      const key = JSON.stringify([world.turn, f.corpse.phase, f.corpse.displayedFrame, direction, world.paused])
      if (key !== lastKey) {
        lastKey = key
        const layers = (g.userData.layers ?? []).filter(layer => layer.visible)
        const sample = { effectId: f.id, turn: world.turn, stamp: scene.renderer.info.render.frame,
          animationFrame: scene.gameClock.animationFrame, timestampMs: performance.now(),
          phase: f.corpse.phase, remaining: f.corpse.remaining, kind: f.unit.kind, team: f.unit.team,
          object: animation.object, draw: animation.draw, f1: animation.f1, nextFrame: animation.f2,
          displayedFrame: f.corpse.displayedFrame, renderedDraw: g.userData.draw,
          drawFlags: g.userData.drawFlags, frame: g.userData.frame, flip: g.userData.frameFlip,
          heading: f.unit.heading, cameraBearing: scene.cameraBearing, direction,
          directionSource: g.userData.directions?.[direction]?.source, visible: g.visible,
          submittedLayers: layers.filter(layer => scene.view.painter.source(layer)).length,
          pieces: layers.map(layer => layer.userData.piece), canvasConnected: canvas.isConnected,
          sceneStoreMatch: scene.world === world, speed: world.speed, paused: world.paused,
          documentVisible: document.visibilityState === 'visible' }
        if (!world.paused && !cropPhases.has(sample.phase) && sample.phase <= 3) {
          // Reserve the phase's first running sample. Never substitute later
          // pixels if bounds/DOM ownership fail or this immutable copy is blank.
          cropPhases.add(sample.phase)
          const rect = canvas.getBoundingClientRect(), anchor = scene.view.screen(g.position, scene.camera)
          const b = g.userData.bounds
          if (!b || ![b.left, b.top, b.right, b.bottom].every(Number.isFinite)) throw Error('Corpse rendered bounds unavailable')
          const bounds = { x: (anchor.x + 1) * rect.width / 2 + b.left,
            y: (1 - anchor.y) * rect.height / 2 + b.top, width: b.right - b.left, height: b.bottom - b.top }
          sample.bodyInCanvas = anchor.z >= -1 && anchor.z <= 1 && bounds.x >= 0 && bounds.y >= 0 &&
            bounds.x + bounds.width <= rect.width && bounds.y + bounds.height <= rect.height
          const owner = document.elementFromPoint(rect.left + bounds.x + bounds.width / 2, rect.top + bounds.y + bounds.height / 2)
          sample.bodyCanvasOwned = owner === canvas
          const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height
          const x = Math.max(0, Math.floor((bounds.x - 12) * scaleX)), y = Math.max(0, Math.floor((bounds.y - 12) * scaleY))
          const width = Math.min(256, canvas.width - x, Math.ceil((bounds.width + 24) * scaleX))
          const height = Math.min(256, canvas.height - y, Math.ceil((bounds.height + 24) * scaleY))
          if (width <= 1 || height <= 1) throw Error('Corpse crop lies outside the live canvas')
          const clip = { x: rect.left + x / scaleX, y: rect.top + y / scaleY, width: width / scaleX, height: height / scaleY }
          const overlays = [...document.querySelectorAll('.native-hud,[data-original-pause-status],.campaign-messages summary,.campaign-messages details[open] [data-native-campaign-panel],.fps-graph,.hud-description,.world-message,.target-prompt,dialog[open],.loading-world')]
            .filter(element => { const s = getComputedStyle(element); return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) !== 0 })
            .map(element => { const r = element.getBoundingClientRect(); return { className: element.className, x: r.x, y: r.y, width: r.width, height: r.height } })
            .filter(r => r.width > 0 && r.height > 0 && r.x < clip.x + clip.width && r.x + r.width > clip.x && r.y < clip.y + clip.height && r.y + r.height > clip.y)
          sample.cropOverlayClear = overlays.length === 0
          sample.cropVisibility = { bounds, clip, overlays, owner: { tag: owner?.tagName, className: owner?.className } }
          const copy = document.createElement('canvas'); copy.width = width; copy.height = height
          const context = copy.getContext('2d')
          if (!context) throw Error('Corpse copy context unavailable')
          const started = performance.now()
          context.drawImage(canvas, x, y, width, height, 0, 0, width, height)
          sample.cropFile = `follower-corpse-${segment}-${sample.phase}.png`
          const crop = { filename: sample.cropFile, effectId: f.id, turn: sample.turn, stamp: sample.stamp,
            frame: sample.frame, phase: sample.phase, clip: { x, y, width, height }, copyMs: performance.now() - started }
          result.crops.push(crop); copies.push({ copy, context, crop })
        }
        result.samples.push(sample)
        if (result.samples.length > 1200) throw Error('Corpse observation exceeded bounded sample storage')
        if (!world.paused && sample.phase === 3) { result.done = true; stop('rise-observed'); return }
      }
    } catch (error) { result.error = String(error); stop('error'); return }
    raf = requestAnimationFrame(visit)
  }
  window.__pndCorpseObservation = { result, stop, retain }
  raf = requestAnimationFrame(visit)
}

export function readFollowerCorpseHold(effectId) {
  const scene = window.testSceneRef.current, world = window.testStore.getWorld()
  return { turn: world.turn, paused: world.paused, animationFrame: scene.gameClock.animationFrame,
    animationTime: scene.gameClock.animationTime,
    effect: structuredClone(world.effects.find(f => f.id === effectId)) }
}

// Observe the ready Scene separately from the synchronous store-replacement
// notification: Home deliberately resumes a checkpoint after that notification.
export function readFollowerCorpseReady(effectId) {
  const scene = window.testSceneRef.current, world = window.testStore.getWorld()
  return { turn: world.turn, paused: world.paused,
    sceneReplaced: scene !== window.__pndCorpsePreviousScene,
    worldReplaced: world !== window.__pndCorpsePreviousWorld,
    sceneStoreMatch: scene.world === world, canvasConnected: scene.renderer.domElement.isConnected,
    effect: structuredClone(world.effects.find(f => f.id === effectId)) }
}

// Read the actual committed record's corpse, not the in-memory store checkpoint.
// Opening a missing database is aborted; this observer never creates or writes it.
export async function readCommittedFollowerCorpse(effectId) {
  if (!(await indexedDB.databases()).some(db => db.name === 'populous-new-dawn'))
    throw Error('Committed corpse checkpoint database is missing')
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('populous-new-dawn')
    request.onupgradeneeded = () => { request.transaction.abort(); reject(Error('Checkpoint database unexpectedly missing')) }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  try {
    const record = await new Promise((resolve, reject) => {
      const transaction = db.transaction('checkpoints', 'readonly')
      const request = transaction.objectStore('checkpoints').get('latest')
      transaction.oncomplete = () => resolve(request.result)
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error ?? Error('Corpse checkpoint read aborted'))
    })
    const effects = record?.world?.effects?.filter(f => f.id === effectId) ?? []
    if (effects.length !== 1 || !effects[0].corpse) throw Error('Committed follower corpse is missing or ambiguous')
    return { version: record.version, level: record.world.outcome.level, turn: record.world.turn,
      effect: structuredClone(effects[0]) }
  } finally { db.close() }
}
