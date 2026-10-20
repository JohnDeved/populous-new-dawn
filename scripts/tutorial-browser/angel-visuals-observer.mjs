// Serializable, read-only Scene observer. It never ticks, renders, replaces a
// game callback or selects hits. Picker bounds touch only presentation caches.
export function installAngelVisualObserver({ ids, neighbourId, segment, waitForReplacement = false }) {
  const priorWorld = window.testStore.getWorld(), result = { segment, samples: [], crops: [], contextFrames: [], resources: [],
    visits: 0, maxVisits: 12000, maxSamples: 1200, maxCrops: 20, error: null, done: false, cleanup: null }
  let scene, world, raf, reorderTimer, stopped = false, initialized = false, lastStamp = -1
  const copies = [], listeners = [], seen = new Map(), cropKeys = new Set(), latestClips = new Map()
  const owned = [], textures = new Set(), disposed = { geometry: 0, material: 0, texture: 0 }
  const checksum = array => {
    const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength)
    let value = 2166136261
    for (const b of bytes) value = Math.imul(value ^ b, 16777619) >>> 0
    return value.toString(16).padStart(8, '0')
  }
  const listen = (object, kind) => {
    const callback = () => { disposed[kind]++ }
    object.addEventListener('dispose', callback); listeners.push([object, callback])
  }
  const stop = reason => {
    if (!stopped) {
      stopped = true; cancelAnimationFrame(raf); clearTimeout(reorderTimer)
      result.terminal = { reason, turn: world?.turn ?? null, stamp: scene?.renderer.info.render.frame ?? null }
      for (const [object, callback] of listeners) object.removeEventListener('dispose', callback)
    }
    return result
  }
  const retain = () => {
    stop('retained')
    if (result.retention) return result
    result.retention = { done: false, copies: copies.length }
    for (const { copy, context, crop } of copies) {
      try {
        const pixels = context.getImageData(0, 0, copy.width, copy.height).data, colors = new Set()
        for (let at = 0; at < pixels.length; at += 4)
          if (pixels[at + 3]) colors.add((pixels[at] << 16) | (pixels[at + 1] << 8) | pixels[at + 2])
        crop.opaqueColors = colors.size; crop.pixelChecksum = checksum(pixels)
        crop.png = copy.toDataURL('image/png')
      } catch (error) { crop.error = String(error); result.error ??= String(error) }
      finally { copy.width = 0; copy.height = 0 }
    }
    copies.length = 0; result.retention.done = true
    return result
  }
  const copyCrop = (sample, bounds, label, cleared = false) => {
    if (result.crops.length >= result.maxCrops) throw Error('Angel crop storage exceeded')
    const canvas = scene.renderer.domElement, rect = canvas.getBoundingClientRect()
    const sx = canvas.width / rect.width, sy = canvas.height / rect.height
    if (!bounds || bounds.width < 1 || bounds.height < 1 || bounds.x < 0 || bounds.y < 0 ||
        bounds.x + bounds.width > rect.width || bounds.y + bounds.height > rect.height)
      throw Error(`Angel ${label} is not wholly on canvas`)
    const clip = { x: Math.max(0, Math.floor((bounds.x - 8) * sx)), y: Math.max(0, Math.floor((bounds.y - 8) * sy)),
      width: Math.ceil((bounds.width + 16) * sx), height: Math.ceil((bounds.height + 16) * sy) }
    clip.width = Math.min(clip.width, canvas.width - clip.x); clip.height = Math.min(clip.height, canvas.height - clip.y)
    if (clip.width > 256 || clip.height > 256) throw Error('Angel crop exceeds fixed 256-pixel extent')
    const css = { x: rect.left + clip.x / sx, y: rect.top + clip.y / sy, width: clip.width / sx, height: clip.height / sy }
    const owner = document.elementFromPoint(rect.left + bounds.x + bounds.width / 2, rect.top + bounds.y + bounds.height / 2)
    const overlays = [...document.querySelectorAll('.native-hud,.paused-badge,.campaign-messages summary,.campaign-messages details[open]>div,.fps-graph,.hud-description,.world-message,.target-prompt,dialog[open],.loading-world')]
      .filter(element => { const style = getComputedStyle(element); return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 })
      .map(element => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, className: element.className } })
      .filter(r => r.width > 0 && r.height > 0 && r.x < css.x + css.width && r.x + r.width > css.x && r.y < css.y + css.height && r.y + r.height > css.y)
    if (owner !== canvas || overlays.length) throw Error(`Angel ${label} crop is obscured by HTML`)
    const copy = document.createElement('canvas'); copy.width = clip.width; copy.height = clip.height
    const context = copy.getContext('2d')
    if (!context) throw Error('Angel crop copy context unavailable')
    context.drawImage(canvas, clip.x, clip.y, clip.width, clip.height, 0, 0, clip.width, clip.height)
    const crop = { filename: `angel-${segment}-${result.crops.length}.png`, label, cleared,
      id: sample.id, stamp: sample.stamp, turn: sample.turn, pose: sample.pose, bounds: { ...bounds }, clip, canvasOwned: true, overlays }
    sample.cropFile = crop.filename; result.crops.push(crop); copies.push({ copy, context, crop })
    if (!cleared) latestClips.set(sample.id, { ...bounds })
  }
  const copyContext = (sample, label) => {
    if (result.contextFrames.length >= 2) throw Error('Angel context sequence exceeds two running frames')
    const canvas = scene.renderer.domElement
    if (canvas.width > 1440 || canvas.height > 1000) throw Error('Angel scene context exceeds fixed viewport')
    const copy = document.createElement('canvas'); copy.width = canvas.width; copy.height = canvas.height
    const context = copy.getContext('2d')
    if (!context) throw Error('Angel context copy unavailable')
    context.drawImage(canvas, 0, 0)
    const crop = { filename: `angel-${label}-context.png`, label, id: sample.id, stamp: sample.stamp,
      turn: sample.turn, pose: sample.pose, fullCanvas: true,
      clip: { x: 0, y: 0, width: canvas.width, height: canvas.height } }
    result.contextFrames.push(crop); copies.push({ copy, context, crop })
  }
  const neighbour = () => {
    const group = scene.decorations.children.find(g => g.userData.point?.id === neighbourId)
    const mesh = group?.children.find(child => child.isMesh && child.userData.nativeModel !== undefined)
    return { group, mesh }
  }
  const visit = rafTimestamp => {
    let reorder = false
    if (stopped) return
    result.visits++
    try {
      if (result.visits > result.maxVisits) throw Error('Angel RAF visit storage exceeded')
      const current = window.testStore.getWorld(), candidate = window.testSceneRef?.current
      if (!scene) {
        if (waitForReplacement && current === priorWorld) return
        if (!candidate || candidate.world !== current || !candidate.renderer.domElement.isConnected || document.querySelector('.loading-world')) return
        scene = candidate; world = current
        result.sceneWorldMatched = true; result.worldReplaced = current !== priorWorld
      }
      if (scene !== window.testSceneRef.current || world !== window.testStore.getWorld() || scene.world !== world)
        throw Error('Angel observation lost Scene/world identity')
      // Scene.animate stores the shared RAF timestamp and completes its render
      // synchronously. A different timestamp means this observer ran first.
      // Register after this RAF batch so the Scene owns the next callback first.
      if (scene.previous !== rafTimestamp) { result.orderingDeferrals = (result.orderingDeferrals ?? 0) + 1; reorder = true; return }
      const canvas = scene.renderer.domElement, stamp = scene.renderer.info.render.frame
      if (!canvas.isConnected || document.visibilityState !== 'visible') throw Error('Angel canvas disconnected or hidden')
      if (stamp === lastStamp) return
      lastStamp = stamp
      if (!initialized) {
        if (ids.some(id => !scene.fxMeshes.get(id))) return
        const adjacent = neighbour()
        if (!adjacent.mesh) throw Error('Original native-model neighbour unavailable')
        const geometryIds = new Set()
        for (const [owner, id] of ids.entries()) {
          const group = scene.fxMeshes.get(id)
          for (const mesh of group.children) {
            if (!mesh.isMesh || ![62, 69].includes(mesh.userData.nativeModel)) throw Error('Angel is not an original base mesh')
            if (geometryIds.has(mesh.geometry.uuid)) throw Error('Angel mutable geometry is shared')
            geometryIds.add(mesh.geometry.uuid); owned.push(mesh)
            listen(mesh.geometry, 'geometry'); listen(mesh.material, 'material')
            textures.add(mesh.material.map)
            result.resources.push({ id, owner, base: mesh.userData.nativeModel, bank: mesh.userData.nativeResource?.bank,
              geometry: mesh.geometry.uuid, material: mesh.material.uuid, texture: mesh.material.map.uuid,
              materialColor: mesh.material.color.toArray(), atlasUrl: mesh.material.map.image?.currentSrc || mesh.material.map.image?.src,
              neighbourSharesAtlas: mesh.material.map === adjacent.mesh.material.map,
              uv: [...mesh.geometry.getAttribute('uv').array], tiles: [...mesh.userData.nativeResource.data.tiles] })
          }
        }
        for (const texture of textures) listen(texture, 'texture')
        initialized = true
      }
      const effects = ids.map(id => world.effects.find(f => f.id === id))
      if (effects.every(f => !f)) {
        const adjacent = neighbour()
        result.cleanup = { turn: world.turn, stamp, effectsRemoved: true,
          groupsRemoved: ids.every(id => !scene.fxMeshes.has(id)), allOwnedDetached: owned.every(mesh => !mesh.parent?.parent),
          disposed: { ...disposed }, neighbourSubmitted: !!adjacent.mesh && !!scene.view.painter.source(adjacent.mesh),
          neighbourModel: adjacent.mesh?.userData.nativeModel, neighbourAtlasUnchanged: !!adjacent.mesh && textures.has(adjacent.mesh.material.map) }
        for (const id of ids) copyCrop({ id, turn: world.turn, stamp, pose: null }, latestClips.get(id), 'cleared-footprint', true)
        result.done = true; stop('ordinary-expiry'); return
      }
      for (const [owner, effect] of effects.entries()) {
        if (!effect) continue
        const state = effect.angel, pose = state.presentation.displayed, group = scene.fxMeshes.get(effect.id)
        const mesh = group?.children.find(child => child.visible)
        if (!mesh) throw Error('Live Angel has no visible base mesh')
        const key = JSON.stringify([world.turn, pose, state.phase])
        if (seen.get(effect.id) === key) continue
        seen.set(effect.id, key)
        const position = mesh.geometry.getAttribute('position').array
        const bounds = scene.picking.model(mesh, `angel-witness-${stamp}`).find(command => command.kind === 'bounds')?.bounds
        const sample = { rafTimestamp, sceneTimestamp: scene.previous, id: effect.id, owner, turn: world.turn, stamp, animationFrame: scene.gameClock.animationFrame,
          phase: state.phase, timer: state.timer, pose: { ...pose }, presentation: structuredClone(state.presentation),
          paused: world.paused, x: effect.x, z: effect.z, height: effect.height, groupY: group.position.y,
          base: mesh.userData.nativeModel, scale: mesh.userData.nativeSize,
          shaderScale: mesh.material.userData.nativeUniforms?.nativeObjectScale.value,
          visible: group.visible && mesh.visible, submitted: !!scene.view.painter.source(mesh),
          positionChecksum: checksum(position), positionCount: position.length, bounds,
          nativeTilt: group.userData.nativeTilt, nativeRoll: group.userData.nativeRoll }
        const label = segment === 'paused' ? 'paused-transition' : pose.to >= 76 ? 'transition' :
          state.phase === 'dying' ? pose.scale > 80 ? 'death-large' : 'death-small' : `base-${pose.base}`
        const cropKey = `${effect.id}:${label}`
        // Fixed first slot per declared case. No replacing failed/occluded pixels
        // with a convenient later frame. Death gets two observable scale bands.
        if (!cropKeys.has(cropKey) && (!label.startsWith('death-') || owner === 0)) {
          cropKeys.add(cropKey)
          sample.positions = [...position]
          copyCrop(sample, bounds, label)
          if (segment === 'running' && owner === 0 && ['base-62', 'death-small'].includes(label))
            copyContext(sample, label === 'base-62' ? 'loop' : 'death')
        }
        result.samples.push(sample)
        if (result.samples.length > result.maxSamples) throw Error('Angel sample storage exceeded')
      }
      if (segment === 'paused' && result.samples.length === ids.length) { result.done = true; stop('paused-transition') }
    } catch (error) { result.error = String(error); result.done = true; stop('error') }
    finally { if (!stopped) {
      if (reorder) reorderTimer = setTimeout(() => { if (!stopped) raf = requestAnimationFrame(visit) }, 0)
      else raf = requestAnimationFrame(visit)
    } }
  }
  window.__pndAngelObservation = { result, stop, retain }
  raf = requestAnimationFrame(visit)
}
