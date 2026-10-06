// Install at the Start dialog, before scene/context creation. This function is
// self-contained so Playwright can evaluate it without importing application code.
export function installTextureObserver(realm = globalThis) {
  if (realm.firewarriorTextureObserver) throw Error('Texture observer already installed')
  const prototype = realm.WebGL2RenderingContext?.prototype
  if (!prototype) throw Error('WebGL2 upload observation is unsupported')
  const names = ['texStorage2D', 'texImage2D', 'texSubImage2D']
  const originals = names.map(name => [name, Object.getOwnPropertyDescriptor(prototype, name)])
  if (originals.some(([, descriptor]) => !descriptor?.configurable || typeof descriptor.value !== 'function'))
    throw Error('WebGL2 upload methods cannot be observed transparently')
  const records = [], contexts = new WeakMap(), textures = new WeakMap(), images = new WeakMap()
  const limits = { calls: 200000, records: 2048, contexts: 4, textures: 1024, images: 1024, ms: 60000 }
  const counts = { calls: 0, contexts: 0, textures: 0, images: 0, thrownCalls: 0 }
  const started = realm.performance.now(), wrappers = new Map()
  let active = true, failure = null, restored = false
  const fail = reason => { failure ??= reason; active = false }
  const identity = (map, object, kind) => {
    if (!object || typeof object !== 'object') return null
    if (!map.has(object)) {
      if (counts[kind] >= limits[kind]) throw Error(`Texture observer ${kind} bound`)
      map.set(object, ++counts[kind])
    }
    return map.get(object)
  }
  const imageInfo = image => {
    if (!image || typeof image !== 'object') return null
    const htmlImage = !!realm.HTMLImageElement && image instanceof realm.HTMLImageElement
    return { id: identity(images, image, 'images'), htmlImage,
      width: image.width ?? null, height: image.height ?? null,
      naturalWidth: htmlImage ? image.naturalWidth : null,
      naturalHeight: htmlImage ? image.naturalHeight : null,
      complete: htmlImage ? image.complete : null,
      url: htmlImage ? image.currentSrc || image.src : null }
  }
  const observe = (gl, name, args, before) => {
    if (!active) return
    if (++counts.calls > limits.calls || realm.performance.now() - started > limits.ms)
      return fail('Texture observer call/time bound')
    const context = identity(contexts, gl, 'contexts')
    // Query the binding on the CURRENT active texture unit. Tracking only the
    // last bindTexture call would be wrong when activeTexture changes units.
    if (args[0] !== gl.TEXTURE_2D) return
    const bound = gl.getParameter(gl.TEXTURE_BINDING_2D)
    const texture = identity(textures, bound, 'textures')
    if (records.length >= limits.records) return fail('Texture observer record bound')
    const row = { context, texture, method: name, argumentCount: args.length,
      target: args[0], returnedNormally: true, supported: false,
      immutable: bound ? gl.getTexParameter(gl.TEXTURE_2D, gl.TEXTURE_IMMUTABLE_FORMAT) : null,
      immutableLevels: bound ? gl.getTexParameter(gl.TEXTURE_2D, gl.TEXTURE_IMMUTABLE_LEVELS) : null }
    if (name === 'texStorage2D' && args.length === 5) {
      Object.assign(row, { supported: true, bindingUnchanged: before?.bound === bound, immutableBefore: before?.immutable, levels: args[1], internalFormat: args[2], width: args[3], height: args[4] })
    } else if (name === 'texImage2D' && args.length === 6) {
      Object.assign(row, { supported: true, level: args[1], internalFormat: args[2], format: args[3], type: args[4], image: imageInfo(args[5]) })
      row.width = row.image?.width; row.height = row.image?.height
    } else if (name === 'texSubImage2D' && args.length === 7) {
      Object.assign(row, { supported: true, level: args[1], x: args[2], y: args[3], format: args[4], type: args[5], image: imageInfo(args[6]) })
      row.width = row.image?.width; row.height = row.image?.height
    }
    // Other overloads remain explicit unsupported records. They cannot satisfy
    // the required original-HTMLImageElement upload for the actual unit map.
    records.push(row)
  }
  const finish = () => {
    active = false
    if (!restored) {
      for (const [name, descriptor] of originals) {
        if (Object.getOwnPropertyDescriptor(prototype, name)?.value === wrappers.get(name))
          Object.defineProperty(prototype, name, descriptor)
        else fail(`Texture observer no longer owns ${name}`)
      }
      restored = true
    }
    return { failure, active, restored, counts: { ...counts }, limits: { ...limits },
      recordCount: records.length, records: records.map(row => structuredClone(row)) }
  }
  try {
    for (const [name, descriptor] of originals) {
      const wrapper = function (...args) {
        let result, before
        if (active && name === 'texStorage2D' && args[0] === this.TEXTURE_2D) {
          try {
            const bound = this.getParameter(this.TEXTURE_BINDING_2D)
            before = { bound, immutable: bound ? this.getTexParameter(this.TEXTURE_2D, this.TEXTURE_IMMUTABLE_FORMAT) : null }
          } catch { fail('Observation failed before texStorage2D') }
        }
        try { result = Reflect.apply(descriptor.value, this, args) }
        catch (error) {
          if (active) { counts.thrownCalls++; fail(`Original ${name} threw`) }
          throw error
        }
        // Observation must not change the original result or exception behavior.
        try { observe(this, name, args, before) } catch { fail(`Observation failed after ${name}`) }
        return result
      }
      wrappers.set(name, wrapper)
      Object.defineProperty(prototype, name, { ...descriptor, value: wrapper })
    }
  } catch (error) { finish(); throw error }
  const observer = {
    read(gl, texture, image) {
      if (active && realm.performance.now() - started > limits.ms) fail('Texture observer time bound')
      if (active && names.some(name => prototype[name] !== wrappers.get(name))) fail('Texture observer wrapper changed')
      const context = contexts.get(gl) ?? null, textureId = textures.get(texture) ?? null
      return { failure, active, restored, context, texture: textureId, image: images.get(image) ?? null,
        counts: { ...counts }, limits: { ...limits }, elapsedMs: realm.performance.now() - started,
        records: records.filter(row => row.context === context && row.texture === textureId).map(row => structuredClone(row)),
        semantics: 'Calls returned normally; no getError consumption, GPU readback, manual upload or manual render.' }
    },
    finish,
  }
  realm.firewarriorTextureObserver = observer
  return { installed: true, limits }
}

// Read only an already initialized material map and existing renderer property.
// has() precedes get(): Three's get() otherwise creates a new property record.
export function captureUnitTexture(id = null) {
  const scene = window.testSceneRef.current, renderer = scene.renderer, gl = renderer.getContext()
  const groups = id === null ? [...scene.unitMeshes.values()] : [scene.unitMeshes.get(id)]
  const layers = groups.flatMap(group => group?.userData.layers ?? []).filter(layer => layer.visible)
  if (!layers.length) throw Error('No actual visible unit material map')
  const map = layers[0].material.map, image = map?.image
  if (!map || !image || !layers.every(layer => layer.material.isSpriteMaterial && layer.material.map === map))
    throw Error('Actual unit SpriteMaterials do not share one atlas')
  const allLayers = [...scene.unitMeshes.values()].flatMap(group => group.userData.layers ?? [])
  if (!allLayers.every(layer => layer.material.map === map)) throw Error('Unit atlas map identity diverged')
  if (!renderer.properties.has(map)) throw Error('Unit map has no existing renderer property')
  const properties = renderer.properties.get(map), texture = properties.__webglTexture
  if (!texture || properties.__webglInit !== true) throw Error('Unit map was not initialized normally')
  if (!renderer.properties.has(map.source)) throw Error('Unit source has no existing renderer property')
  const sourceProperties = renderer.properties.get(map.source)
  const observation = window.firewarriorTextureObserver.read(gl, texture, image)
  return { maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE), rendererMaxTextureSize: renderer.capabilities.maxTextureSize,
    contextLost: gl.isContextLost(), isTexture: gl.isTexture(texture), materialCount: layers.length, sharedMaterialCount: allLayers.length,
    mapUuid: map.uuid, sourceUuid: map.source.uuid, textureVersion: map.version, sourceVersion: map.source.version,
    rendererTextureVersion: properties.__version, rendererSourceVersion: sourceProperties.__version, htmlImage: image instanceof HTMLImageElement,
    imageComplete: image.complete, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight,
    imageWidth: image.width, imageHeight: image.height, url: image.currentSrc || image.src,
    observation }
}
