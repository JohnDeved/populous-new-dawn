// Page-serializable test observers. These use the bound shipped Scene/Store.
// They never import app modules, assign gameplay/status/clock state, or tick it.
export function readShieldState(ids) {
  const scene = window.testSceneRef.current, world = window.testStore.getWorld()
  return { turn: world.turn, paused: world.paused, speed: world.speed, inputMask: world.inputMask,
    shots: world.shots.shield, selected: [...world.selected], mode: world.mode,
    animationFrame: scene.gameClock.animationFrame, animationTime: scene.gameClock.animationTime,
    sceneStoreMatch: scene.world === world, canvasConnected: scene.renderer.domElement.isConnected,
    people: ids.map(id => {
      const unit = world.units.find(u => u.id === id), group = scene.unitMeshes.get(id)
      return unit && { id, team: unit.team, kind: unit.kind, shield: unit.shield ?? 0,
        flags3: unit.native?.flags3 ?? 0, hp: unit.hp, x: unit.x, z: unit.z,
        fight: !!unit.fight, visible: group?.visible ?? false,
        piecesVisible: group?.userData.shield?.map(sprite => sprite.visible) ?? [] }
    }) }
}

export function shieldCastPoint(target) {
  const scene = window.testSceneRef.current, canvas = scene.renderer.domElement
  const position = scene.screen(target), rect = canvas.getBoundingClientRect()
  const point = { x: rect.x + (position.x + 1) * rect.width / 2,
    y: rect.y + (1 - position.y) * rect.height / 2 }
  if (position.z < -1 || position.z > 1 || document.elementFromPoint(point.x, point.y) !== canvas)
    throw Error('Shield target is not owned by the visible world canvas')
  return { ...point, target, canvas: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } }
}

export function shieldTextureReady(ids) {
  const scene = window.testSceneRef.current
  return ids.every(id => {
    const sprites = scene.unitMeshes.get(id)?.userData.shield
    return sprites?.length === 3 && sprites.every(sprite => sprite.visible &&
      sprite.material.map?.image?.complete && sprite.material.map.image.naturalWidth > 0)
  })
}

// Read exactly the pixels from the render whose body, UV uniforms and painter
// commands are retained. The diagnostic second draw removes only this actor's
// Shield presentation, then restores visibility and redraws in finally.
export async function captureShieldFrame({ ids, label }) {
  const scene = window.testSceneRef.current, world = window.testStore.getWorld()
  const canvas = scene.renderer.domElement, renderer = scene.renderer, gl = renderer.getContext()
  if (!world.paused || scene.world !== world || !canvas.isConnected || document.visibilityState !== 'visible')
    throw Error('Shield pixel diagnostic requires the ready visible paused scene')
  const encoded = () => JSON.stringify(window.shieldCheckpointCodec(world))
  const camera = () => JSON.stringify([scene.cameraPosition, scene.cameraBearing, scene.view.config,
    scene.camera.projectionMatrix.toArray(), scene.gameClock.animationFrame, scene.gameClock.animationTime])
  const beforeWorld = encoded(), beforeCamera = camera()
  const rect = canvas.getBoundingClientRect(), sx = canvas.width / rect.width, sy = canvas.height / rect.height
  const samples = [], framebuffers = []
  for (const id of ids) {
    const unit = world.units.find(u => u.id === id), group = scene.unitMeshes.get(id)
    const sprites = group?.userData.shield
    if (!unit || !group?.visible || sprites?.length !== 3 || !sprites.every(sprite => sprite.visible))
      throw Error(`Shield actor ${id} does not have three visible sprites`)
    const oldVisibility = sprites.map(sprite => sprite.visible)
    const copy = document.createElement('canvas')
    let sample
    try {
      scene.renderSceneFrame(null, undefined)
      const stamp = renderer.info.render.frame
      const anchor = scene.view.screen(group.position, scene.camera)
      const body = group.userData.bounds
      const layers = group.userData.layers.filter(sprite => sprite.visible)
      const describe = sprite => ({
        visible: sprite.visible, isSprite: sprite.isSprite === true, source: sprite.userData.source,
        width: sprite.scale.x, height: sprite.scale.y,
        x: -sprite.center.x * sprite.scale.x, y: (sprite.center.y - 1) * sprite.scale.y,
        uv: sprite.userData.atlasTransform.toArray(),
        uploadedUV: sprite.material.userData.nativeUniforms?.nativeAtlasTransform.value.toArray(),
        color: sprite.material.color.getHex(), opacity: sprite.material.opacity,
        transparent: sprite.material.transparent, depthWrite: sprite.material.depthWrite,
        toneMapped: sprite.material.toneMapped,
        texture: sprite.material.map.image.currentSrc || sprite.material.map.image.src,
        imageWidth: sprite.material.map.image.naturalWidth, imageHeight: sprite.material.map.image.naturalHeight,
        nearest: sprite.material.map.magFilter === 1003 && sprite.material.map.minFilter === 1003,
        mipmaps: sprite.material.map.generateMipmaps,
        command: structuredClone(scene.view.painter.source(sprite)),
        depth: scene.view.painter.depth(sprite, 0, 0),
        childIndex: group.children.indexOf(sprite),
      })
      const pieces = sprites.map(describe)
      const shieldBounds = { left: Math.min(...pieces.map(p => p.x)),
        top: Math.min(...pieces.map(p => p.y)),
        right: Math.max(...pieces.map(p => p.x + p.width)),
        bottom: Math.max(...pieces.map(p => p.y + p.height)) }
      const union = { left: Math.min(body.left, shieldBounds.left), top: Math.min(body.top, shieldBounds.top),
        right: Math.max(body.right, shieldBounds.right), bottom: Math.max(body.bottom, shieldBounds.bottom) }
      const origin = { x: (anchor.x + 1) * rect.width / 2, y: (1 - anchor.y) * rect.height / 2 }
      const bounds = { x: origin.x + union.left, y: origin.y + union.top,
        width: union.right - union.left, height: union.bottom - union.top }
      if (![...Object.values(bounds), ...Object.values(body)].every(Number.isFinite) ||
          anchor.z < -1 || anchor.z > 1 || bounds.x < 2 || bounds.y < 2 ||
          bounds.x + bounds.width + 2 > rect.width || bounds.y + bounds.height + 2 > rect.height)
        throw Error(`Shield actor ${id} local bounds are outside the live canvas`)
      const clip = { x: Math.floor((bounds.x - 2) * sx), y: Math.floor((bounds.y - 2) * sy),
        width: Math.ceil((bounds.width + 4) * sx), height: Math.ceil((bounds.height + 4) * sy) }
      if (clip.width > 256 || clip.height > 256) throw Error('Shield actor crop exceeds 256-pixel bound')
      const overlays = [...document.querySelectorAll(
        '.native-hud,.paused-badge,.campaign-messages summary,.campaign-messages details[open]>div,.fps-graph,.hud-description,.world-message,.target-prompt,dialog[open],.loading-world'
      )].filter(element => {
        const style = getComputedStyle(element), r = element.getBoundingClientRect()
        return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 &&
          r.width > 0 && r.height > 0 && r.x < rect.x + bounds.x + bounds.width &&
          r.right > rect.x + bounds.x && r.y < rect.y + bounds.y + bounds.height && r.bottom > rect.y + bounds.y
      }).map(element => element.className)
      if (overlays.length) throw Error(`Shield crop is covered by UI: ${overlays.join(', ')}`)
      const owner = document.elementFromPoint(rect.x + bounds.x + bounds.width / 2, rect.y + bounds.y + bounds.height / 2)
      if (owner !== canvas) throw Error('Shield local crop center is not canvas-owned')
      const read = () => {
        const bytes = new Uint8Array(clip.width * clip.height * 4)
        gl.readPixels(clip.x, canvas.height - clip.y - clip.height, clip.width, clip.height,
          gl.RGBA, gl.UNSIGNED_BYTE, bytes)
        if (gl.getError() !== gl.NO_ERROR) throw Error('Shield framebuffer read failed')
        return bytes
      }
      const original = read()
      copy.width = clip.width; copy.height = clip.height
      const context = copy.getContext('2d')
      if (!context) throw Error('Shield crop 2D context unavailable')
      context.drawImage(canvas, clip.x, clip.y, clip.width, clip.height, 0, 0, clip.width, clip.height)
      const cropPixels = context.getImageData(0, 0, clip.width, clip.height).data, cropColors = new Set()
      const uprightFramebuffer = new Uint8Array(original.length)
      for (let y = 0; y < clip.height; y++)
        uprightFramebuffer.set(original.subarray((clip.height - 1 - y) * clip.width * 4,
          (clip.height - y) * clip.width * 4), y * clip.width * 4)
      let nontransparentPixels = 0
      for (let at = 0; at < cropPixels.length; at += 4)
        if (cropPixels[at + 3]) {
          nontransparentPixels++
          cropColors.add((cropPixels[at] << 16) | (cropPixels[at + 1] << 8) | cropPixels[at + 2])
        }
      sample = { id, owner: group.userData.owner, team: unit.team, shield: unit.shield,
        turn: world.turn, animationFrame: scene.gameClock.animationFrame, stamp,
        bodyFrame: group.userData.frame, nativeFrameHeight: group.userData.nativeFrameHeight,
        frameHeight: group.userData.frameHeight, body: { ...body },
        bucket: group.userData.spriteBucket, config: { ...scene.view.config },
        bodyLayers: layers.map(layer => ({ childIndex: group.children.indexOf(layer),
          depth: scene.view.painter.depth(layer, 0, 0), command: structuredClone(scene.view.painter.source(layer)) })),
        anchor: { x: anchor.x, y: anchor.y, z: anchor.z }, origin, bounds, shieldBounds, clip,
        canvasScale: { x: sx, y: sy }, pieces, overlays, canvasOwned: true,
        cropStamp: renderer.info.render.frame, nontransparentPixels, cropColors: cropColors.size,
        cropMatchesFramebuffer: cropPixels.every((value, i) => value === uprightFramebuffer[i]),
        filename: `shield-${label}-${group.userData.owner}.png`, png: copy.toDataURL('image/png') }
      framebuffers.push({ sample, pixels: uprightFramebuffer })
      sprites.forEach(sprite => { sprite.visible = false })
      scene.renderSceneFrame(null, undefined)
      const without = read()
      let changed = 0, changedInsideShield = 0
      for (let at = 0; at < original.length; at += 4) {
        if (original[at] === without[at] && original[at + 1] === without[at + 1] &&
            original[at + 2] === without[at + 2]) continue
        changed++
        const pixel = at / 4, x = (clip.x + pixel % clip.width + 0.5) / sx - origin.x
        const y = (clip.y + clip.height - 1 - Math.floor(pixel / clip.width) + 0.5) / sy - origin.y
        if (pieces.some(p => x >= p.x && x < p.x + p.width && y >= p.y && y < p.y + p.height))
          changedInsideShield++
      }
      sample.causal = { withoutStamp: renderer.info.render.frame, changed, changedInsideShield,
        removedOnlyActorShield: true }
      sprites.forEach((sprite, i) => { sprite.visible = oldVisibility[i] })
      scene.renderSceneFrame(null, undefined)
      const restored = read()
      sample.causal.restoredStamp = renderer.info.render.frame
      sample.causal.exactRestoredPixels = original.every((value, i) => value === restored[i])
      samples.push(sample)
    } finally {
      sprites.forEach((sprite, i) => { sprite.visible = oldVisibility[i] })
      scene.renderSceneFrame(null, undefined)
      copy.width = 0; copy.height = 0
    }
  }
  const afterWorld = encoded(), afterCamera = camera()
  const digest = async bytes => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
    .map(value => value.toString(16).padStart(2, '0')).join('')
  const hash = text => digest(new TextEncoder().encode(text))
  for (const { sample, pixels } of framebuffers) sample.framebufferRgbaSha256 = await digest(pixels)
  return { label, samples, worldUnchanged: beforeWorld === afterWorld, cameraClockUnchanged: beforeCamera === afterCamera,
    worldBeforeSha256: await hash(beforeWorld), worldAfterSha256: await hash(afterWorld) }
}

export function watchShieldDisposal(ids) {
  const scene = window.testSceneRef.current, world = window.testStore.getWorld()
  const materials = new Set(), atlases = new Set()
  const record = { materials: 0, disposedMaterials: 0, disposedAtlas: 0 }
  for (const id of ids) {
    const group = scene.unitMeshes.get(id)
    for (const sprite of group?.userData.shield ?? []) {
      materials.add(sprite.material); atlases.add(sprite.material.map)
    }
  }
  for (const material of materials) material.addEventListener('dispose', () => record.disposedMaterials++)
  for (const atlas of atlases) atlas.addEventListener('dispose', () => record.disposedAtlas++)
  record.materials = materials.size
  window.shieldPrevious = { scene, world, record }
}

export function readShieldDisposal() {
  const { scene, world, record } = window.shieldPrevious
  return { ...record, sceneReplaced: window.testSceneRef.current !== scene,
    worldReplaced: window.testStore.getWorld() !== world, disposed: scene.disposed,
    canvasRemoved: !scene.renderer.domElement.isConnected }
}

// Capture the exact synchronous replacement boundary before Home resumes it.
export function watchShieldLoad() {
  const store = window.testStore, previous = store.getWorld()
  window.shieldRestored = null
  const unsubscribe = store.subscribe(() => {
    const world = store.getWorld()
    if (world === previous) return
    window.shieldRestored = JSON.stringify(window.shieldCheckpointCodec(world))
    unsubscribe()
  })
}

export function bindShieldHomeStore() {
  const main = document.querySelector('main')
  let fiber = main?.[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
  for (; fiber; fiber = fiber.return)
    for (let hook = fiber.memoizedState; hook; hook = hook.next)
      if (hook.memoizedState?.getWorld && hook.memoizedState?.subscribe) {
        window.testStore = hook.memoizedState
        return
      }
  throw Error('Actual Home Store unavailable before public Load Game')
}

export async function writeShieldFixture(json) {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('populous-new-dawn', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('checkpoints')
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction('checkpoints', 'readwrite')
      tx.objectStore('checkpoints').put(window.shieldCheckpointCodec(JSON.parse(json), true), 'latest')
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('checkpoints', 'readonly')
      const request = tx.objectStore('checkpoints').get('latest')
      tx.oncomplete = () => resolve(JSON.stringify(window.shieldCheckpointCodec(request.result)))
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } finally { db.close() }
}

export async function readCommittedShieldCheckpoint() {
  if (!(await indexedDB.databases()).some(db => db.name === 'populous-new-dawn'))
    throw Error('Shield committed checkpoint database missing')
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('populous-new-dawn')
    request.onupgradeneeded = () => { request.transaction.abort(); reject(Error('Unexpected new checkpoint database')) }
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
  try {
    const record = await new Promise((resolve, reject) => {
      const tx = db.transaction('checkpoints', 'readonly')
      const request = tx.objectStore('checkpoints').get('latest')
      tx.oncomplete = () => resolve(request.result)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
    return { version: record.version, world: JSON.stringify(window.shieldCheckpointCodec(record.world)) }
  } finally { db.close() }
}

export function installShieldExpiryObserver(ids) {
  const scene = window.testSceneRef.current, world = window.testStore.getWorld()
  const result = { samples: [], done: false, error: null }
  let raf, previous = null, stopped = false
  const stop = () => { stopped = true; cancelAnimationFrame(raf) }
  const visit = () => {
    if (stopped) return
    try {
      if (scene !== window.testSceneRef.current || world !== window.testStore.getWorld())
        throw Error('Shield expiry observer lost its Scene/World')
      const sample = { turn: world.turn, paused: world.paused, stamp: scene.renderer.info.render.frame,
        people: ids.map(id => {
          const unit = world.units.find(u => u.id === id), group = scene.unitMeshes.get(id)
          if (!unit || group?.userData.shield?.length !== 3) throw Error('Shield expiry actor or sprite array missing')
          return { id, remaining: unit.shield ?? 0, flags3: unit.native?.flags3 ?? 0,
            visible: group.userData.shield.map(sprite => sprite.visible) }
        }) }
      if (!previous || previous.turn !== sample.turn || previous.paused !== sample.paused) {
        if (previous) {
          const turns = (sample.turn - previous.turn) >>> 0
          for (let i = 0; i < ids.length; i++)
            if (sample.people[i].remaining !== Math.max(0, previous.people[i].remaining - turns))
              throw Error('Shield timer did not follow ordinary elapsed logical turns')
        }
        result.samples.push(sample)
        if (result.samples.length > 256) throw Error('Shield expiry sample bound exceeded')
        previous = sample
      }
      if (sample.people.every(person => person.remaining === 0 &&
          !(person.flags3 & 0x8000) && person.visible.every(visible => !visible))) {
        result.done = true; stop(); return
      }
    } catch (error) {
      result.error = String(error); stop(); return
    }
    raf = requestAnimationFrame(visit)
  }
  window.shieldExpiry = { result, stop }
  visit()
}
