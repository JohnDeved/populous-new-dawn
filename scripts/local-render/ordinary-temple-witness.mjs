import assert from 'node:assert/strict'

// Page-serializable passive observer. The original renderer/callbacks run once,
// unchanged. Only naturally submitted Temple meshes and returned pixels qualify.
export function installOrdinaryTempleObserver({ ids = null } = {}) {
  const scene = window.testSceneRef?.current,
    store = window.testStore,
    world = store?.getWorld(),
    renderer = scene?.renderer,
    canvas = renderer?.domElement
  if (!scene || scene.world !== world || !canvas?.isConnected)
    throw Error('Ordinary Temple observer requires the current Scene/World')
  const original = renderer.render,
    descriptor = Object.getOwnPropertyDescriptor(renderer, 'render'),
    errors = [],
    frames = [],
    seen = new Map()
  let closed = false
  const fail = error => errors.push(String(error?.stack ?? error))
  const owner = () => {
    if (
      window.testSceneRef.current !== scene ||
      store.getWorld() !== world ||
      scene.disposed ||
      !canvas.isConnected ||
      document.querySelector('.loading-world')
    )
      throw Error('Ordinary Temple observer owner changed')
  }
  function wrapped(...args) {
    if (closed || errors.length || args[0] !== scene.scene || args[1] !== scene.camera)
      return original.apply(this, args)
    const hooks = [],
      submitted = [],
      beforeFrame = renderer.info.render.frame
    let resource
    try {
      owner()
      if (
        world.status !== 'playing' ||
        world.speed !== 1 ||
        world.paused ||
        world.inputMask ||
        world.flyby.flags & 1 ||
        scene.overviewStage ||
        scene.viewTransition ||
        scene.cameraMotion.active
      )
        return original.apply(this, args)
      resource = scene.templeResourceSnapshot
      if (!resource || resource !== store.getPresentationSnapshot() || !Object.isFrozen(resource))
        throw Error('Temple drawing must use the current immutable shared snapshot')
      for (const building of world.buildings) {
        if (
          building.kind !== 'temple' ||
          building.hp <= 0 ||
          building.preparation ||
          (ids && !ids.includes(building.id))
        )
          continue
        const group = scene.buildingMeshes.get(building.id),
          mesh = group?.children[0]
        if (!mesh || !group.visible || !mesh.visible) continue
        const stage = mesh.userData.stage,
          prior = seen.get(building.id) ?? []
        if (
          stage === 4
            ? prior.filter(row => row.stage === 4).length >= 2 ||
              prior.some(row => row.stage === 4 && row.tile === resource.tile)
            : prior.some(row => row.stage === stage)
        )
          continue
        const clip = scene.view.screen(group.position, scene.camera),
          projected = scene.view.project(group.position, (group.position.y * 128) / 45)
        if (
          ![clip.x, clip.y, clip.z].every(Number.isFinite) ||
          Math.abs(clip.x) > 0.85 ||
          Math.abs(clip.y) > 0.85 ||
          (scene.overviewActive ? clip.z === 2 : projected.flags & 0x1e)
        )
          continue
        const callback = mesh.onAfterRender,
          property = Object.getOwnPropertyDescriptor(mesh, 'onAfterRender')
        const hook = function (...drawArgs) {
          const result = callback.apply(this, drawArgs)
          try {
            if (
              drawArgs[0] !== renderer ||
              drawArgs[1] !== scene.scene ||
              drawArgs[2] !== scene.camera ||
              drawArgs[3] !== mesh.geometry ||
              drawArgs[4] !== mesh.material
            )
              throw Error('Temple callback does not describe its real submitted mesh')
            const image = mesh.material.map?.image,
              binding = mesh.userData.nativeResource,
              offset = mesh.userData.templeTileOffset?.value,
              position = mesh.geometry.getAttribute('position'),
              uv = mesh.geometry.getAttribute('uv'),
              mode = mesh.geometry.getAttribute('textureMode')
            if (!image?.complete || !image.naturalWidth || !binding || !Object.isFrozen(binding))
              throw Error('Submitted Temple resource/image is not ready')
            submitted.push({
              id: building.id,
              team: building.team,
              x: building.x,
              z: building.z,
              hp: building.hp,
              progress: building.progress,
              logs: building.logs,
              model: mesh.userData.nativeModel,
              stage,
              bank: binding.bank,
              source: image.src,
              encoded: mesh.material.map.userData.encodedColors === true,
              alphaTest: mesh.material.alphaTest,
              side: mesh.material.side,
              program: mesh.material.customProgramCacheKey(),
              offset: offset ? [offset.x, offset.y] : null,
              epoch: mesh.userData.templeResourceEpoch ?? null,
              clip: { x: clip.x, y: clip.y, z: clip.z },
              positions: new Float32Array(position.array),
              uv: new Float32Array(uv.array),
              modes: new Float32Array(mode.array),
              vertices: position.count,
              mode32Vertices: Array.from(mode.array).filter(value => value === 32).length,
              capVertices: Array.from(mode.array).filter(value => value === 7).length,
              trustedRenderSubmission: true,
            })
          } catch (error) {
            fail(error)
          }
          return result
        }
        mesh.onAfterRender = hook
        hooks.push({ mesh, callback, property, hook })
      }
    } catch (error) {
      fail(error)
    }
    let result
    try {
      result = original.apply(this, args)
    } finally {
      for (const { mesh, callback, property, hook } of hooks) {
        if (mesh.onAfterRender !== hook) fail(Error('Temple callback ownership changed'))
        else if (property) Object.defineProperty(mesh, 'onAfterRender', property)
        else {
          delete mesh.onAfterRender
          if (mesh.onAfterRender !== callback) fail(Error('Temple inherited callback changed'))
        }
      }
    }
    try {
      if (submitted.length && !errors.length) {
        owner()
        if (renderer.info.render.frame !== beforeFrame + 1)
          throw Error('Temple sample lacks a fresh natural renderer return')
        if (
          scene.templeResourceSnapshot !== resource ||
          store.getPresentationSnapshot() !== resource
        )
          throw Error('Shared Temple phase changed during the natural draw')
        if (frames.length >= 32 || canvas.width * canvas.height > 2_000_000)
          throw Error('Ordinary Temple capture bound exceeded')
        const gl = renderer.getContext(),
          debug = gl.getExtension('WEBGL_debug_renderer_info')
        if (gl.isContextLost()) throw Error('Temple WebGL context lost')
        frames.push({
          level: world.outcome.level,
          turn: world.turn,
          paused: world.paused,
          resource: structuredClone(resource),
          environment: structuredClone(scene.environment),
          beforeFrame,
          afterFrame: renderer.info.render.frame,
          buildings: submitted,
          viewport: [innerWidth, innerHeight],
          canvas: [canvas.width, canvas.height],
          dpr: devicePixelRatio,
          camera: structuredClone({
            position: scene.cameraPosition,
            center: scene.view.rawCenter,
            projection: scene.view.projection,
            preset: scene.viewPreset,
            overview: scene.overviewActive,
          }),
          renderer: gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
          png: canvas.toDataURL('image/png'),
        })
        for (const row of submitted) {
          const prior = seen.get(row.id) ?? []
          prior.push({ stage: row.stage, tile: resource.tile })
          seen.set(row.id, prior)
        }
      }
    } catch (error) {
      fail(error)
    }
    return result
  }
  renderer.render = wrapped
  return {
    status: () => ({
      closed,
      errors: [...errors],
      seen: [...seen].map(([id, samples]) => ({ id, samples })),
    }),
    async read() {
      const sha = async bytes =>
        Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), value =>
          value.toString(16).padStart(2, '0')
        ).join('')
      const result = structuredClone({ errors, closed, frames })
      for (const frame of result.frames)
        for (const building of frame.buildings)
          for (const field of ['positions', 'uv', 'modes']) {
            building[`${field}Sha256`] = await sha(building[field])
            delete building[field]
          }
      return result
    },
    close() {
      if (!closed) {
        if (renderer.render !== wrapped) fail(Error('Temple renderer ownership changed'))
        else if (descriptor) Object.defineProperty(renderer, 'render', descriptor)
        else delete renderer.render
        closed = true
      }
      return { closed, errors: [...errors] }
    },
  }
}

export function requireOrdinaryTempleFrame(frame, expected) {
  assert.equal(frame.level, expected.level)
  assert.equal(frame.paused, false)
  assert.equal(frame.afterFrame, frame.beforeFrame + 1)
  assert.equal(frame.resource.bank, expected.bank)
  assert.equal(frame.resource.modelAtlas, expected.atlas)
  assert.equal(frame.environment.landscape.bank, expected.bank)
  assert.equal(frame.environment.landscape.modelAtlas, expected.atlas)
  assert.ok(frame.buildings.length)
  for (const row of frame.buildings) {
    assert.ok(row.trustedRenderSubmission)
    assert.equal(new URL(row.source).pathname, `/original/${expected.atlas}.png`)
    assert.equal(row.encoded, true)
    assert.equal(row.bank, expected.objects)
    assert.equal(row.alphaTest, 0.5)
    assert.equal(row.side, row.stage === 4 ? 1 : 2)
    const model = expected.models[`${row.model}:${row.stage}`]
    assert.ok(model, `Missing independently imported model ${row.model}:${row.stage}`)
    for (const field of [
      'positionsSha256',
      'uvSha256',
      'modesSha256',
      'vertices',
      'mode32Vertices',
      'capVertices',
    ])
      assert.equal(row[field], model[field], `Actual Temple ${field}`)
    if (row.stage === 4) {
      assert.equal(row.program, 'native-mesh-true-false-native-model-light-temple')
      assert.equal(row.epoch, frame.resource.epoch)
      assert.deepEqual(row.offset, [
        ((frame.resource.tile & 7) - 4) / 8,
        -((frame.resource.tile >> 3) - 11) / 32,
      ])
      assert.ok(row.mode32Vertices > 0)
    } else {
      assert.equal(row.program, 'native-mesh-true-false-native-model-light')
      assert.equal(row.offset, null)
      assert.equal(row.epoch, null)
      assert.equal(row.mode32Vertices, 0)
      assert.ok(row.capVertices > 0)
    }
  }
}

export function requireTempleCoverage(report, { ids, construction = false }) {
  assert.deepEqual(report.errors, [])
  assert.equal(report.closed, true)
  for (const id of ids) {
    const samples = report.frames.flatMap(frame =>
      frame.buildings
        .filter(row => row.id === id)
        .map(row => ({ ...row, resource: frame.resource }))
    )
    const complete = samples.filter(row => row.stage === 4)
    assert.ok(
      new Set(complete.map(row => row.resource.tile)).size >= 2,
      `Temple ${id} needs two naturally rendered shared tiles`
    )
    assert.equal(new Set(complete.map(row => row.resource.epoch)).size, 1)
    if (construction)
      assert.ok(
        samples.some(row => row.stage < 4 && row.progress < 1 && row.capVertices > 0),
        'Actual Temple construction cap is required'
      )
  }
}
