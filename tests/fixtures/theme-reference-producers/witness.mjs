import assert from 'node:assert/strict'
import { checkpointObservation } from './checkpoint-observer.mjs'
import { waitForCheckpointReadback } from '../checkpoint-readback.mjs'

// Page-serializable. Observe the real trusted click and its synchronous store
// notification. Never call a store mutator, dispatch an event, or stop the clock.
export function armThemeAction({ kind, label }) {
  if (!['save', 'load', 'restart', 'start'].includes(kind)) throw Error('Unknown theme action')
  if (Object.hasOwn(globalThis, 'worldThemeCheckpoint')) throw Error('Theme action already owned')
  const main = document.querySelector('main')
  let fiber = main?.[Object.keys(main).find(key => key.startsWith('__reactFiber'))],
    store
  for (; fiber && !store; fiber = fiber.return)
    for (let hook = fiber.memoizedState; hook; hook = hook.next)
      if (hook.memoizedState?.getWorld && hook.memoizedState?.subscribe) {
        store = hook.memoizedState
        break
      }
  if (!store) throw Error('Current document store unavailable')
  const before = store.getWorld(),
    report = { kind, label, captured: false, closed: false, errors: [] }
  let active = null,
    snapshot = null,
    unsubscribe = () => {},
    detached = false
  globalThis.worldThemeCheckpoint = null
  const capture = event => {
    const button = event.target?.closest?.('button')
    if ((button?.getAttribute('aria-label') ?? button?.textContent.trim()) !== label) return
    active = event
  }
  const end = event => {
    if (active === event) active = null
  }
  const detach = () => {
    if (detached) return
    detached = true
    unsubscribe()
    document.removeEventListener('click', capture, true)
    document.removeEventListener('click', end)
    active = null
  }
  document.addEventListener('click', capture, true)
  document.addEventListener('click', end)
  unsubscribe = store.subscribe(() => {
    if (!active || report.captured || report.errors.length) return
    try {
      const world = store.getWorld(),
        replaced = world !== before
      if (!active.isTrusted || active.button !== 0)
        throw Error('Action requires its trusted primary click')
      if ((kind === 'save') === replaced) throw Error('Unexpected store replacement boundary')
      if (kind === 'save' && !world.paused) throw Error('Save boundary must be paused by Settings')
      snapshot = structuredClone({ version: 1, world })
      globalThis.worldThemeCheckpoint = snapshot
      report.boundary = {
        trusted: active.isTrusted,
        replaced,
        before: { level: before.outcome.level, turn: before.turn },
        after: { level: world.outcome.level, turn: world.turn, paused: world.paused },
      }
      report.captured = true
    } catch (error) {
      report.errors.push(String(error?.stack ?? error))
    } finally {
      detach()
    }
  })
  return {
    read: () => structuredClone(report),
    close() {
      if (!report.closed) {
        detach()
        if (globalThis.worldThemeCheckpoint !== snapshot)
          report.errors.push('Checkpoint observer ownership changed')
        else delete globalThis.worldThemeCheckpoint
        report.closed = true
      }
      return structuredClone(report)
    },
  }
}

export async function observeThemeAction({ page, signal, kind, label, click }) {
  signal.throwIfAborted()
  const handle = await page.evaluateHandle(armThemeAction, { kind, label })
  let evidence, digest
  try {
    await click()
    signal.throwIfAborted()
    evidence = await handle.evaluate(observer => observer.read())
    assert.deepEqual(evidence.errors, [])
    assert.equal(evidence.captured, true, `Missing synchronous ${label} boundary`)
    digest = await page.evaluate(checkpointObservation, { observationName: 'worldThemeCheckpoint' })
    signal.throwIfAborted()
  } finally {
    try {
      const closed = await handle.evaluate(observer => observer.close())
      assert.equal(closed.closed, true)
      assert.deepEqual(closed.errors, [])
      if (evidence) evidence.cleanup = closed.closed
    } finally {
      await handle.dispose()
    }
  }
  return { evidence, digest }
}

export function requireThemeCheckpoint(actual, expected) {
  assert.ok(actual && expected, 'Missing committed or synchronous checkpoint')
  for (const checkpoint of [actual, expected]) {
    assert.equal(checkpoint.version, 1)
    assert.ok(Number.isInteger(checkpoint.level) && Number.isInteger(checkpoint.turn))
    assert.ok(Number.isFinite(checkpoint.time))
    for (const field of ['actorsSha256', 'terrainSha256', 'stockSha256'])
      assert.match(checkpoint[field], /^[a-f0-9]{64}$/)
  }
  for (const field of [
    'version',
    'level',
    'turn',
    'time',
    'actorsSha256',
    'terrainSha256',
    'stockSha256',
  ])
    assert.deepEqual(actual[field], expected[field], `Checkpoint ${field}`)
}

export async function waitForThemeSave({ observeCheckpoint, expected, signal, pause }) {
  let observed
  const committed = await waitForCheckpointReadback(
    async () => {
      signal.throwIfAborted()
      observed = await observeCheckpoint('Theme UI save committed')
      signal.throwIfAborted()
      if (
        observed.checkpoint?.level !== expected.level ||
        observed.checkpoint?.turn !== expected.turn
      )
        return false
      requireThemeCheckpoint(observed.checkpoint, expected)
      assert.match(expected.checkpointSha256, /^[a-f0-9]{64}$/)
      assert.equal(
        observed.checkpoint.checkpointSha256,
        expected.checkpointSha256,
        'Committed Save must preserve the complete typed checkpoint graph'
      )
      return true
    },
    { attempts: 100, pause }
  )
  assert.equal(committed, true, 'Theme Save did not commit its exact boundary')
  return observed
}

// Read-only pose brackets also work on the baseline before resource fields exist.
export function readThemePose() {
  const scene = window.testSceneRef?.current,
    world = window.testStore?.getWorld()
  if (!scene || scene.world !== world || !scene.renderer.domElement.isConnected)
    throw Error('Theme pose Scene/World ownership changed')
  return structuredClone({
    level: world.outcome.level,
    turn: world.turn,
    speed: world.speed,
    paused: world.paused,
    inputMask: world.inputMask,
    overview: scene.overviewActive,
    overviewStage: scene.overviewStage,
    preset: scene.viewPreset,
    camera: scene.cameraPosition,
    viewCenter: scene.view.rawCenter,
    projection: scene.view.projection,
    viewport: [innerWidth, innerHeight],
    dpr: devicePixelRatio,
    canvas: [scene.renderer.domElement.width, scene.renderer.domElement.height],
  })
}

// One natural render-return world sample, followed by a separately bracketed
// minimap copy after the synchronous animate callback finishes its HUD update.
// Digests run after those copies. No forced draw, camera adjustment, or per-frame hash.
export function installThemeFrame({ requireIdentity = true } = {}) {
  const scene = window.testSceneRef?.current,
    store = window.testStore,
    world = store?.getWorld()
  if (!scene || scene.world !== world) throw Error('Theme frame has no current Scene/World')
  const renderer = scene.renderer,
    canvas = renderer.domElement,
    original = renderer.render,
    descriptor = Object.getOwnPropertyDescriptor(renderer, 'render')
  let frame = null,
    minimap = null,
    closed = false
  const errors = []
  const restore = () => {
    if (renderer.render !== wrapped) throw Error('Theme render observer ownership changed')
    if (descriptor) Object.defineProperty(renderer, 'render', descriptor)
    else delete renderer.render
  }
  const fail = error => errors.push(String(error?.stack ?? error))
  const requireOwner = () => {
    if (
      window.testSceneRef.current !== scene ||
      store.getWorld() !== world ||
      !canvas.isConnected ||
      scene.disposed ||
      document.querySelector('.loading-world')
    )
      throw Error('Theme frame owner replaced')
  }
  const pose = () =>
    structuredClone({
      rendererFrame: renderer.info.render.frame,
      level: world.outcome.level,
      turn: world.turn,
      speed: world.speed,
      paused: world.paused,
      inputMask: world.inputMask,
      overview: scene.overviewActive,
      overviewStage: scene.overviewStage,
      preset: scene.viewPreset,
      camera: scene.cameraPosition,
      viewCenter: scene.view.rawCenter,
      projection: scene.view.projection,
      viewport: [innerWidth, innerHeight],
      dpr: devicePixelRatio,
      canvas: [canvas.width, canvas.height],
    })
  function wrapped(...args) {
    const beforeFrame = renderer.info.render.frame
    const result = original.apply(this, args)
    if (args[0] !== scene.scene || args[1] !== scene.camera || frame || errors.length) return result
    try {
      requireOwner()
      if (renderer.info.render.frame !== beforeFrame + 1)
        throw Error('Missing fresh natural render')
      if (
        world.status !== 'playing' ||
        world.paused ||
        world.speed !== 1 ||
        world.inputMask ||
        world.flyby.flags & 1 ||
        scene.overviewStage
      )
        throw Error('Theme sample requires settled ordinary play')
      if (requireIdentity && (!Object.isFrozen(scene.environment) || !scene.environment))
        throw Error('Missing immutable environment identity')
      if (canvas.width <= 0 || canvas.height <= 0 || canvas.width * canvas.height > 2_000_000)
        throw Error('Theme frame exceeds capture bound')
      const textures = scene.terrainTextures
      if (!textures) throw Error('Terrain is not ready')
      const terrain = new Uint8Array(386048)
      let offset = 0
      for (const field of ['palette', 'colors', 'cliffs', 'detail', 'fade']) {
        const view = textures[field]
        terrain.set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength), offset)
        offset += view.byteLength
      }
      if (offset !== terrain.length) throw Error('Invalid live terrain slices')
      const trees = [],
        materials = [],
        sampled = new Set(),
        visibleTreeIds = []
      const material = mesh => {
        const image = mesh.material?.map?.image,
          resource = mesh.userData.nativeResource
        if (!image?.complete || !image.naturalWidth)
          throw Error('Native material image is not loaded')
        if (
          requireIdentity &&
          (!resource || !Object.isFrozen(resource) || resource.id !== mesh.userData.nativeModel)
        )
          throw Error('Missing bound native mesh resource')
        const row = {
          model: mesh.userData.nativeModel,
          bank: resource?.bank ?? null,
          src: image.src,
          width: image.naturalWidth,
          height: image.naturalHeight,
          encoded: mesh.material.map.userData.encodedColors === true,
        }
        materials.push(row)
        return resource
      }
      for (const group of scene.decorations.children) {
        const tree = group.userData.point
        if (!tree || tree.model === 11) continue
        if (!world.trees.includes(tree))
          throw Error('Decoration does not own an authored world tree')
        const clip = scene.view.screen(group.position, scene.camera),
          projected = scene.view.project(group.position, (group.position.y * 128) / 45)
        let visible = group.visible && group.children[0]?.visible !== false
        for (let parent = group.parent; parent; parent = parent.parent) visible &&= parent.visible
        if (
          visible &&
          Number.isFinite(clip.x) &&
          Number.isFinite(clip.y) &&
          Math.abs(clip.x) <= 1 &&
          Math.abs(clip.y) <= 1 &&
          (scene.overviewActive ? clip.z !== 2 : !(projected.flags & 0x1e)) &&
          visibleTreeIds.length < 32
        )
          visibleTreeIds.push(tree.id)
        const mesh = group.children[0],
          resource = material(mesh),
          id = mesh.userData.nativeModel
        if (sampled.has(id)) continue
        sampled.add(id)
        trees.push({
          tree: { id: tree.id, model: tree.model, x: tree.x, z: tree.z, logs: tree.logs },
          model: id,
          bank: resource?.bank ?? null,
          stage: mesh.userData.stage,
          shapes: resource ? [...resource.shapeIndices] : null,
          data: resource ? JSON.stringify(resource.data, Object.keys(resource.data).sort()) : null,
          positions: new Float32Array(mesh.geometry.getAttribute('position').array),
          uv: new Float32Array(mesh.geometry.getAttribute('uv').array),
        })
      }
      for (const group of scene.buildingMeshes.values())
        for (const child of group.children)
          if (child.userData.nativeModel !== undefined) material(child)
      if (!trees.length) throw Error('No authored tree geometry observed')
      const gl = renderer.getContext(),
        debug = gl.getExtension('WEBGL_debug_renderer_info')
      if (gl.isContextLost()) throw Error('Theme WebGL context lost')
      frame = {
        level: world.outcome.level,
        turn: world.turn,
        rendererFrame: renderer.info.render.frame,
        environment: structuredClone(scene.environment ?? null),
        terrain,
        trees,
        materials,
        visibleTreeIds,
        camera: structuredClone({
          position: scene.cameraPosition,
          center: scene.view.rawCenter,
          projection: scene.view.projection,
          preset: scene.viewPreset,
          overview: scene.overviewActive,
        }),
        viewport: [innerWidth, innerHeight],
        dpr: devicePixelRatio,
        canvas: [canvas.width, canvas.height],
        renderer: gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
        png: canvas.toDataURL('image/png'),
      }
      queueMicrotask(() => {
        if (closed) return
        try {
          requireOwner()
          const before = pose(),
            png = scene.mini.toDataURL('image/png'),
            after = pose()
          requireOwner()
          if (JSON.stringify(before) !== JSON.stringify(after))
            throw Error('Minimap pose changed during copy')
          minimap = { boundary: 'post-animate-microtask', before, after, png }
        } catch (error) {
          fail(error)
        }
      })
    } catch (error) {
      fail(error)
    } finally {
      try {
        restore()
      } catch (error) {
        fail(error)
      }
    }
    return result
  }
  renderer.render = wrapped
  return {
    status: () => ({ captured: !!frame && !!minimap, errors: [...errors], closed }),
    async read() {
      if (!frame || !minimap || errors.length)
        throw Error(errors.join('\n') || 'Theme frame not captured')
      const sha = async bytes =>
        Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), value =>
          value.toString(16).padStart(2, '0')
        ).join('')
      const result = {
        ...frame,
        minimap: structuredClone(minimap),
        terrainSha256: await sha(frame.terrain),
      }
      delete result.terrain
      result.trees = await Promise.all(
        frame.trees.map(async tree => {
          const row = {
            ...tree,
            positionsSha256: await sha(tree.positions),
            uvSha256: await sha(tree.uv),
            vertices: tree.positions.length / 3,
            dataSha256: tree.data === null ? null : await sha(new TextEncoder().encode(tree.data)),
          }
          delete row.positions
          delete row.uv
          delete row.data
          return row
        })
      )
      return result
    },
    close() {
      if (!closed) {
        if (renderer.render === wrapped) {
          try {
            restore()
          } catch (error) {
            fail(error)
          }
        } else if (!frame && !errors.length)
          fail(Error('Theme render observer replaced before capture'))
        closed = true
      }
      return { captured: !!frame && !!minimap, errors: [...errors], closed }
    },
  }
}
