// These functions are serialized into the real browser. No production import,
// renderer replacement, F8 observer, or ownership helper is installed. Startup scheduling is latched separately.
export async function preparePage({ viewport, admittedCanvas, initialNow, codecSource }) {
  const s = window.testSceneRef.current,
    fail = m => {
      throw Error(m)
    }
  if (s.fpsGraph || s.world !== window.testStore.getWorld() || s.modalSuspended)
    fail('Unexpected scene/diagnostic ownership')
  if (
    s !== window.__bodyLatchedScene ||
    s.previous !== null ||
    s.frame !== 0 ||
    window.__bodyStartCalls !== 1
  )
    fail('Unexpected pre-bootstrap callbacks')
  window.__bodyCodec = (0, eval)(`(${codecSource})`)
  const r = s.renderer,
    c = r.domElement
  if (
    innerWidth !== viewport.width ||
    innerHeight !== viewport.height ||
    devicePixelRatio !== 1 ||
    r.getPixelRatio() !== 1
  )
    fail('Canonical outer viewport/pixel ratio mismatch')
  window.__bodySetupWorld = JSON.stringify(window.__bodyCodec(s.world))
  window.__bodyInitialNow = initialNow
  window.__bodyStep = 0
  const gl = r.getContext(),
    rect = c.getBoundingClientRect()
  if (
    gl.isContextLost() ||
    !(gl instanceof WebGL2RenderingContext) ||
    r.capabilities.logarithmicDepthBuffer ||
    r.capabilities.reversedDepthBuffer
  )
    fail('Unsupported GL configuration')
  if (
    gl.drawingBufferWidth !== Math.floor(rect.width) ||
    gl.drawingBufferHeight !== Math.floor(rect.height) ||
    ['left', 'top', 'width', 'height'].some(key => rect[key] !== admittedCanvas[key])
  )
    fail('Actual HUD canvas/drawing-buffer mismatch')
  if (r.info.autoReset !== true || r.getRenderTarget() !== null)
    fail('Unexpected render counter/framebuffer state')
  const debug = gl.getExtension('WEBGL_debug_renderer_info')
  return {
    viewport: { width: innerWidth, height: innerHeight },
    width: gl.drawingBufferWidth,
    height: gl.drawingBufferHeight,
    rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
    pixelRatio: r.getPixelRatio(),
    devicePixelRatio,
    version: gl.getParameter(gl.VERSION),
    renderer: gl.getParameter(gl.RENDERER),
    vendor: gl.getParameter(gl.VENDOR),
    unmaskedRenderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null,
    unmaskedVendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : null,
    capabilities: {
      logarithmicDepthBuffer: r.capabilities.logarithmicDepthBuffer,
      reversedDepthBuffer: r.capabilities.reversedDepthBuffer,
    },
  }
}

export function assetsReady() {
  const s = window.testSceneRef?.current
  if (!s) return false
  let ready = true
  s.scene.traverse(o => {
    for (const m of o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []) {
      for (const value of [
        ...Object.values(m),
        ...Object.values(m.uniforms ?? {}).map(u => u.value),
      ])
        if (value?.isTexture) {
          const image = value.image
          if (!image || image.complete === false) ready = false
        }
    }
  })
  return ready
}

export function callbackAndPixels({ now, cohort, expectedAngle }) {
  const s = window.testSceneRef.current
  if (
    s.fpsGraph ||
    s.modalSuspended ||
    s.world.inputMask ||
    s.world !== window.testStore.getWorld()
  )
    throw Error('Callback precondition drift')
  cancelAnimationFrame(s.frame)
  s.world.paused = cohort === 'camera'
  if (expectedAngle !== null && s.cameraPosition.angle !== expectedAngle)
    throw Error('Literal input angle mismatch')
  const callbackStarted = performance.now()
  try {
    s.animate(now)
  } finally {
    cancelAnimationFrame(s.frame)
  }
  window.__bodyPhases = { callbackMs: performance.now() - callbackStarted }
  window.__bodyStep++
  return window.__bodyCapture()
}

export function bootstrapAndPixels() {
  const s = window.testSceneRef.current
  if (
    s !== window.__bodyLatchedScene ||
    s.previous !== null ||
    s.frame !== 0 ||
    window.__bodyStartCalls !== 1
  )
    throw Error('Unexpected bootstrap identity')
  if (JSON.stringify(window.__bodyCodec(s.world)) !== window.__bodySetupWorld)
    throw Error('World drifted before bootstrap')
  const initialState = window.__bodyCodec({
    world: s.world,
    camera: { position: s.cameraPosition, bearing: s.cameraBearing, viewPoint: s.viewPoint },
    gameClock: {
      animationTime: s.gameClock.animationTime,
      animationFrame: s.gameClock.animationFrame,
    },
  })
  // First original callback uses previous ?? now, hence dt is exactly zero.
  const callbackStarted = performance.now()
  try {
    s.animate(window.__bodyInitialNow)
  } finally {
    cancelAnimationFrame(s.frame)
  }
  window.__bodyPhases = { callbackMs: performance.now() - callbackStarted }
  if (s.previous !== window.__bodyInitialNow) throw Error('Bootstrap timestamp drift')
  delete window.__bodyStartLatch
  delete window.__bodyVerifyStart
  return { ...window.__bodyCapture(), initialState }
}

export function capturePage() {
  const captureStarted = performance.now()
  const s = window.testSceneRef.current
  if (
    s.view.painter.transparentMeshes.length ||
    s.view.painter.renderLeaseBases.length ||
    (s.view.painter.suppressedBodyMaterials?.length ?? 0)
  )
    throw Error('Painter lease restoration leaked')
  const gl = s.renderer.getContext()
  if (gl.isContextLost() || gl.getError() !== gl.NO_ERROR) throw Error('GL failure')
  if (s.renderer.getRenderTarget() !== null) throw Error('Unexpected framebuffer')
  const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
  const readbackStarted = performance.now()
  gl.readPixels(
    0,
    0,
    gl.drawingBufferWidth,
    gl.drawingBufferHeight,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    pixels
  )
  window.__bodyPhases.readbackMs = performance.now() - readbackStarted
  if (gl.getError() !== gl.NO_ERROR) throw Error('Pixel read failed')
  let text = ''
  for (let i = 0; i < pixels.length; i += 32768)
    text += String.fromCharCode(...pixels.subarray(i, i + 32768))
  const layers = [],
    materialAliases = new Map(),
    resourceHandles = []
  for (const [id, g] of s.unitMeshes)
    for (const [layerIndex, l] of (g.userData.layers ?? []).entries()) {
      if (l.material.visible !== true) throw Error('Leaked body material visibility')
      if (!materialAliases.has(l.material)) materialAliases.set(l.material, materialAliases.size)
      resourceHandles.push({ id, layerIndex, objectUuid: l.uuid, materialUuid: l.material.uuid })
      layers.push({
        materialAlias: materialAliases.get(l.material),
        id,
        layerIndex,
        visible: l.visible,
        materialVisible: l.material.visible,
        groupVisible: g.visible,
        transparent: l.material.transparent,
        opacity: l.material.opacity,
        depthWrite: l.material.depthWrite,
        atlas: l.userData.atlasTransform?.toArray(),
        center: l.center.toArray(),
        scale: l.scale.toArray(),
        matrix: l.matrixWorld.elements,
        range: s.view.painter.ranges.get(l) ?? null,
      })
    }
  const submittedUniforms = []
  for (const [id, g] of s.unitMeshes)
    for (const [index, l] of (g.userData.layers ?? []).entries()) {
      const range = s.view.painter.ranges.get(l),
        mode = s.view.uniforms.nativeMode.value
      if (
        !g.visible ||
        !l.visible ||
        (!mode ? false : !range || s.view.painter.texture.image.data[range[0]] === 2)
      )
        continue
      const values = Object.fromEntries(
        Object.entries(l.material.userData.nativeUniforms ?? {}).map(([key, u]) => [
          key,
          u.value?.toArray
            ? u.value.toArray()
            : ArrayBuffer.isView(u.value)
              ? Array.from(u.value)
              : u.value,
        ])
      )
      submittedUniforms.push({ id, index, values })
    }
  const terrains = []
  s.terrain.traverse(o => {
    if (!o.geometry) return
    const g = o.geometry,
      i = g.index
    terrains.push({
      position: Array.from(g.getAttribute('position').array),
      positionVersion: g.getAttribute('position').version,
      index: i ? Array.from(i.array) : null,
      indexVersion: i?.version ?? null,
      drawRange: g.drawRange,
      instances: o.instanceMatrix ? Array.from(o.instanceMatrix.array) : null,
      instanceVersion: o.instanceMatrix?.version ?? null,
      count: o.count ?? null,
    })
  })
  const state = {
    world: s.world,
    gameClock: {
      animationTime: s.gameClock.animationTime,
      animationFrame: s.gameClock.animationFrame,
    },
    previous: s.previous,
    camera: {
      position: s.cameraPosition,
      bearing: s.cameraBearing,
      viewPoint: s.viewPoint,
      zoom: s.viewZoom,
      overview: s.overviewActive,
    },
    layers,
    submittedUniforms,
    terrains,
    commands: s.view.painter.commandsBySlot,
    depth: Array.from(s.view.painter.texture.image.data),
  }
  // Encode the complete graph and numeric edge cases, not lossy JSON arithmetic.
  const result = {
    step: window.__bodyStep,
    rafHandle: s.frame,
    resourceHandles,
    extra: window.__bodyExtra
      ? {
          visible: window.__bodyExtra.visible,
          materialVisible: window.__bodyExtra.material.visible,
          calls: window.__bodyExtra.userData.calls ?? 0,
          target: window.__bodyExtra.userData.target,
          freshBody: window.__bodyExtra.userData.freshBody,
          frustumCulled: window.__bodyExtra.frustumCulled,
          center: window.__bodyExtra.center?.toArray() ?? null,
        }
      : null,
    width: gl.drawingBufferWidth,
    height: gl.drawingBufferHeight,
    pixels: btoa(text),
    state: window.__bodyCodec(state),
    counters: { ...s.renderer.info.render },
    memory: { ...s.renderer.info.memory, programs: s.renderer.info.programs?.length ?? null },
  }
  window.__bodyPhases.captureTotalMs = performance.now() - captureStarted
  return result
}

export function picksAfterPixels() {
  const s = window.testSceneRef.current,
    r = s.renderer.domElement.getBoundingClientRect(),
    rows = []
  const objectPath = object => {
    const path = []
    while (object !== s.scene) {
      if (!object.parent) throw Error('Candidate outside scene')
      path.unshift(object.parent.children.indexOf(object))
      object = object.parent
    }
    return path
  }
  const candidate = c => (c ? { ...c, object: objectPath(c.object) } : null)
  const query = (kind, id, x, y) => {
    const p = { clientX: r.left + x, clientY: r.top + y },
      mouse = new window.__bodyThree.Vector2((x * 2) / r.width - 1, 1 - (y * 2) / r.height)
    const object = s.picking.pick(p),
      objectKind = s.picking.lastKind
    const native = s.view.pickCandidates(mouse, [s.terrain], s.camera, true),
      nativeWinner = s.view.resolvePickCandidates(native)
    const ground = s.pick(p),
      ordinary = s.view.pickCandidates(mouse, [s.terrain], s.camera, false),
      ordinaryWinner = s.view.resolvePickCandidates(ordinary)
    rows.push({
      kind,
      id,
      x,
      y,
      object,
      objectKind,
      ground,
      native: native.map(candidate),
      nativeWinner: candidate(nativeWinner),
      ordinary: ordinary.map(candidate),
      ordinaryWinner: candidate(ordinaryWinner),
    })
  }
  for (const x of [0.2, 0.5, 0.8])
    for (const y of [0.2, 0.5, 0.8])
      query('grid', null, Math.trunc(r.width * x), Math.trunc(r.height * y))
  for (const [id, g] of s.unitMeshes) {
    const b = s.picking.personBounds(id)
    if (b && g.userData.layers.some(l => s.view.painter.source(l)))
      query('person-center', id, Math.trunc(b.x + b.width / 2), Math.trunc(b.y + b.height / 2))
  }
  return window.__bodyCodec(rows)
}

export function controlRender({ name, size }) {
  const s = window.testSceneRef.current,
    T = window.__bodyThree
  cancelAnimationFrame(s.frame)
  if (!window.__bodyControl) {
    const entry = [...s.unitMeshes].find(
      ([, g]) =>
        g.visible &&
        g.userData.layers?.some(
          l =>
            l.visible &&
            !l.material.transparent &&
            l.material.opacity === 1 &&
            l.material.depthWrite &&
            s.view.painter.depth(l, 0, 0) === 3
        )
    )
    if (!entry) throw Error('No naturally clipped body for control')
    const [id, g] = entry,
      u = s.world.units.find(u => u.id === id)
    if (!u) throw Error('Control unit missing')
    window.__bodyControl = {
      id,
      u,
      index: s.world.units.indexOf(u),
      drawFlags: g.userData.drawFlags,
      layerIndex: g.userData.layers.findIndex(
        l =>
          l.visible &&
          !l.material.transparent &&
          l.material.opacity === 1 &&
          l.material.depthWrite &&
          s.view.painter.depth(l, 0, 0) === 3
      ),
    }
  }
  const c = window.__bodyControl
  if (window.__bodyExtra) {
    s.scene.remove(window.__bodyExtra)
    window.__bodyExtra.geometry.dispose()
    if (!window.__bodyExtra.userData.shared) window.__bodyExtra.material.dispose()
    delete window.__bodyExtra
  }
  if (s.scene.overrideMaterial) {
    s.scene.overrideMaterial.dispose()
    s.scene.overrideMaterial = null
  }
  s.world.paused = true
  s.overviewActive = name === 'overview'
  s.updateView()
  let g = s.unitMeshes.get(c.id)
  if (name === 'removed') {
    s.world.units.splice(
      s.world.units.findIndex(u => u.id === c.id),
      1
    )
    s.updateUnitsFrame()
  } else if (name === 'recreated') {
    s.world.units.splice(c.index, 0, c.u)
    s.updateUnitsFrame()
    g = s.unitMeshes.get(c.id)
  } else if (name === 'hidden') g.visible = false
  else if (name === 'shown') g.visible = true
  else if (name === 'blended' || name === 'opaque-return') {
    g.userData.drawFlags = name === 'blended' ? c.drawFlags | 4 : c.drawFlags
    if (!Number.isInteger(g.userData.frame)) throw Error('Missing actual displayed body frame')
    const directions = Array.from({ length: 8 }, () => ({
      frames: [g.userData.frame],
      flip: g.userData.frameFlip,
    }))
    s.animatePerson(g, c.u.heading, directions, 0, false, 0)
  } else if (name === 'override')
    s.scene.overrideMaterial = new T.ShaderMaterial({
      vertexShader: 'void main(){gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader: 'void main(){gl_FragColor=vec4(1.,0.,1.,1.);}',
    })
  else if (name === 'shared-points' || name === 'ignored-points' || name === 'points-hook') {
    // Each sharing/control case starts with a newly registered factory body.
    // A previous shared material permanently revokes ownership and cannot be reused.
    const previousGroup = g,
      index = s.world.units.findIndex(u => u.id === c.id)
    if (index < 0) throw Error('Sharing control unit missing')
    s.world.units.splice(index, 1)
    s.updateUnitsFrame()
    if (s.unitMeshes.has(c.id)) throw Error('Body removal did not retire the old factory object')
    s.world.units.splice(index, 0, c.u)
    s.updateUnitsFrame()
    g = s.unitMeshes.get(c.id)
    if (!g || g === previousGroup) throw Error('Sharing control did not create a fresh body')
    const layer = g.userData.layers[c.layerIndex]
    if (!layer?.visible) throw Error('Fixed sharing target layer is unavailable')
    const extra = new T.Points(
      new T.BufferGeometry().setAttribute('position', new T.Float32BufferAttribute([0, 0, 0], 3)),
      name === 'points-hook' ? new T.PointsMaterial({ color: 0x00ff00 }) : layer.material
    )
    // Three's SpriteMaterial uniform upload requires object.center even on Points.
    extra.center = layer.center.clone()
    extra.frustumCulled = false
    extra.userData.target = { id: c.id, layerIndex: c.layerIndex }
    extra.userData.freshBody = true
    extra.userData.shared = name !== 'points-hook'
    extra.userData.nativeIgnore = name === 'ignored-points'
    if (name === 'points-hook')
      extra.material.onBeforeRender = () => {
        extra.userData.calls = (extra.userData.calls ?? 0) + 1
      }
    window.__bodyExtra = extra
    s.scene.add(extra)
  }
  if (size) {
    s.container.style.width = `${size.width}px`
    s.container.style.height = `${size.height}px`
    s.renderer.domElement.style.width = `${size.width}px`
    s.renderer.domElement.style.height = `${size.height}px`
    s.renderer.setSize(size.width, size.height, false)
    s.updateView()
  }
  const renderStarted = performance.now()
  s.renderSceneFrame(null, undefined)
  window.__bodyPhases = { controlRenderMs: performance.now() - renderStarted }
  if (window.__bodyExtra) {
    if (s.renderer.info.render.points !== 1)
      throw Error('Points control was not actually submitted exactly once')
    if (name === 'points-hook' && !(window.__bodyExtra.userData.calls > 0))
      throw Error('Points callback control was not exercised')
    if (name === 'shared-points' || name === 'ignored-points') {
      const layer = g.userData.layers[c.layerIndex]
      if (
        !g.visible ||
        !layer.visible ||
        layer.material !== window.__bodyExtra.material ||
        s.view.painter.depth(layer, 0, 0) !== 3
      )
        throw Error('Shared Points target is not a clipped body')
    }
  }
  window.__bodyStep++
  return window.__bodyCapture()
}
