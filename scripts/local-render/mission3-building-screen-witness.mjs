// Derived from PR274/a409893c's accepted synchronous visit/latched-draw witness.
// Resize sampling is omitted. The original callbacks alone own turns, UI visits,
// geometry feedback, shared-resource advancement, RNG and GPU drawing.
export function installMission3BuildingScreenWitness({
  shamanId,
  birth = null,
  templeArt,
  templeSpriteMaterial,
  templeTileOffset,
  mapDraw,
} = {}) {
  if (window.m3BuildingScreen) throw new Error('A building-screen observer is already installed')
  window.m3BuildingScreenInstallation = { resumed: !!birth, state: null }
  const installation = window.m3BuildingScreenInstallation
  const scene = window.testSceneRef.current,
    world = scene.world,
    clock = scene.gameClock,
    presentation = scene.worshipPresentation,
    renderer = scene.renderer,
    mainCanvas = renderer.domElement,
    restorers = []
  const vault = world.shrines.find(
    s => s.kind === 'vault' && s.mode === 4 && s.reward === 'temple' && s.x === -37 && s.z === -133
  )
  if (
    world !== window.testStore.getWorld() ||
    world.outcome.level !== 3 ||
    !vault ||
    !Object.hasOwn(world.worshipAcquisition.controllers, 'building') ||
    typeof window.testStore.getPresentationSnapshot !== 'function' ||
    typeof templeSpriteMaterial !== 'function' ||
    typeof templeTileOffset !== 'function' ||
    typeof mapDraw !== 'function' ||
    templeArt?.modelAtlas !== 'temple-model-p' ||
    templeArt?.sparkleAtlas !== 'temple-sparkles-p'
  )
    throw new Error('Current authored M3 screen/material product required')
  const evidence = {
    source: { level: 3, vaultId: vault.id, shamanId },
    birth: birth && structuredClone(birth),
    handoffs: 0,
    worldVisits: 0,
    uiVisits: 0,
    draws: 0,
    grants: 0,
    stages: {},
    phases: {},
    recentUi: [],
    skippedGpuDraws: 0,
    skippedGpuSamples: [],
    frames: {},
    materialSamples: [],
    materialOwners: {},
    worldTempleSamples: [],
    errors: [],
    restored: false,
  }
  let giftId = birth?.gift.id ?? null,
    beforeTurn = null,
    closed = false,
    controller = world.worshipAcquisition.controllers.building
  const error = failure => {
    if (evidence.errors.length < 16) evidence.errors.push(String(failure?.stack ?? failure))
  }
  const observe = fn => {
    try {
      return fn()
    } catch (failure) {
      error(failure)
    }
  }
  const call = (original, receiver, args) => {
    try {
      return original.apply(receiver, args)
    } catch (failure) {
      error(failure)
      throw failure
    }
  }
  const check = (condition, message) => {
    if (!condition) throw new Error(message)
  }
  const checkOwner = () => {
    check(
      window.testSceneRef.current === scene &&
        scene.world === world &&
        window.testStore.getWorld() === world,
      'Observed Scene/World identity changed'
    )
    check(
      scene.gameClock === clock &&
        scene.worshipPresentation === presentation &&
        scene.renderer === renderer &&
        renderer.domElement === mainCanvas,
      'Observed clock/presentation/main-canvas ownership changed'
    )
  }
  const state = () => {
    checkOwner()
    const actor = world.units.find(unit => unit.id === shamanId)
    check(
      actor?.hp > 0 && actor.kind === 'shaman' && actor.team === 'blue',
      'Original Shaman lost during acquisition'
    )
    const gift = world.gifts.find(gift => gift.id === giftId)
    return {
      turn: world.turn,
      paused: world.paused,
      speed: world.speed,
      mode: world.mode,
      temple: world.unlockedTemple,
      gift: gift && structuredClone(gift),
      active: vault.active,
      animationFrame: clock.animationFrame,
      acquisition: structuredClone(world.worshipAcquisition),
      cosmeticRandom: structuredClone(world.cosmeticRandom),
      resourceLive: structuredClone(window.testStore.getPresentationSnapshot()),
      resourceLatched: structuredClone(scene.templeResourceSnapshot),
    }
  }
  installation.state = state()
  evidence.installation = structuredClone(installation)
  if (birth)
    check(
      installation.state.gift?.id === birth.gift.id &&
        installation.state.gift.remaining > 0 &&
        controller?.giftId === birth.gift.id &&
        controller.active &&
        !installation.state.temple,
      'Missed resumed active-gift/controller/locked-knowledge boundary'
    )
  const hud = () => {
    const root = scene.container.parentElement,
      tab = root.querySelector('[aria-label="buildings B"]'),
      card = root.querySelector('[aria-label="Temple, 8 wood"]'),
      panel = root.querySelector('.native-hud'),
      shell = root.getBoundingClientRect(),
      rect = card?.getBoundingClientRect(),
      view = scene.container.getBoundingClientRect()
    return {
      selected: tab?.getAttribute('aria-pressed') === 'true',
      disabled: card?.disabled ?? null,
      rectangle: rect && {
        x: rect.x - shell.x,
        y: rect.y - shell.y,
        width: rect.width,
        height: rect.height,
      },
      viewport: {
        x: view.x - shell.x,
        y: view.y - shell.y,
        width: view.width,
        height: view.height,
      },
      hudScale: panel ? panel.getBoundingClientRect().width / panel.offsetWidth : null,
    }
  }
  const frozen = () =>
    JSON.stringify({
      acquisition: world.worshipAcquisition,
      cosmeticRandom: world.cosmeticRandom,
      resource: window.testStore.getPresentationSnapshot(),
    })
  // Logical visits occur inside advanceGame before the Scene latches its final
  // snapshot. Equality is required only at actual draw/renderer boundaries.
  const drawResource = () => {
    const resource = scene.templeResourceSnapshot,
      live = window.testStore.getPresentationSnapshot()
    check(
      resource?.bank === 'p' && resource === live,
      'Draw did not use the one current latched p resource'
    )
    return structuredClone(resource)
  }
  const imageSource = map => map?.image?.currentSrc || map?.image?.src || null
  const modelMaterial = (surface, command) => {
    const atlas = surface?.atlas,
      src = imageSource(atlas)
    check(
      src?.split('?')[0].endsWith(`/${templeArt.modelAtlas}.png`),
      'Actual acquisition material is not the p atlas'
    )
    check(
      atlas.image.width === 256 && atlas.image.height === 1024 && atlas.colorSpace === '',
      'Actual p model atlas dimensions or encoded color space changed'
    )
    check(
      surface.material.uniforms.atlas.value === atlas &&
        atlas.source === surface.atlasSource.source,
      'Acquisition atlas clone/uniform owner changed'
    )
    const submittedUv = surface.uv.array.slice(0, surface.geometry.drawRange.count * 2)
    const uv = [...submittedUv]
    const current = presentation.bridge.measure(command.model, command.geometry),
      shell = scene.container.parentElement
    check(current, 'Actual screen target measurement disappeared')
    const interval =
      world.worshipAcquisition.clock.nextVisit - world.worshipAcquisition.clock.lastVisit
    const fraction =
      world.paused || world.land.landFlags & 2 || !interval
        ? 1
        : Math.max(
            0,
            Math.min(
              1,
              (world.worshipAcquisition.clock.elapsed - world.worshipAcquisition.clock.lastVisit) /
                interval
            )
          )
    const triangles = mapDraw(
      command,
      current,
      shell.clientWidth,
      shell.clientHeight,
      presentation.previousBuilding,
      fraction,
      scene.templeResourceSnapshot
    )
    check(
      triangles.length * 3 === surface.geometry.drawRange.count,
      'Actual screen triangle count differs from the latched production mapping'
    )
    let vertex = 0,
      sharedVertices = 0
    for (const triangle of triangles)
      for (const point of triangle.points) {
        check(
          uv[vertex * 2] === Math.fround(point.u) && uv[vertex * 2 + 1] === Math.fround(point.v),
          'Actual submitted screen UV does not consume the recorded p resource'
        )
        if (triangle.mode === 32) sharedVertices++
        vertex++
      }
    const tiles = [
      ...new Set(
        Array.from(
          { length: uv.length / 2 },
          (_, index) =>
            Math.floor(((1 - uv[index * 2 + 1]) * 1024) / 32) * 8 +
            Math.floor((uv[index * 2] * 256) / 32)
        )
      ),
    ]
    return {
      src,
      colorSpace: atlas.colorSpace,
      minFilter: atlas.minFilter,
      magFilter: atlas.magFilter,
      uv,
      tiles,
      uvValidated: true,
      sharedVertices,
    }
  }
  const gpuState = () => {
    const surface = presentation.buildingSurface,
      renderer = surface?.renderer
    return {
      surface,
      renderer,
      canvas: renderer?.domElement,
      frame: renderer?.info.render.frame ?? null,
    }
  }
  const capture = (label, command, gpuProof) => {
    if (evidence.frames[label]) return
    const canvas = presentation.canvas,
      surface = presentation.buildingSurface,
      gpu = surface?.renderer?.domElement
    check(
      canvas && canvas.width > 0 && canvas.height > 0 && canvas.width * canvas.height <= 2_000_000,
      'Screen overlay exceeds declared capture bounds'
    )
    // Retain actual already-drawn PNGs before checking state or visible pixels.
    evidence.frames[label] = { overlayHidden: canvas.hidden }
    const frame = evidence.frames[label]
    if (!canvas.hidden) frame.overlayPng = canvas.toDataURL('image/png')
    if (command && gpuProof.fresh && gpu && gpu.width * gpu.height <= 2_000_000)
      frame.buildingPng = gpu.toDataURL('image/png')
    frame.state = state()
    frame.hud = hud()
    frame.command = command && structuredClone(command)
    frame.draw = evidence.draws
    frame.gpu = gpuProof
    frame.resource = drawResource()
    frame.worldGiftVisible = scene.fxMeshes.get(giftId)?.visible ?? false
    frame.vertices = surface?.geometry.drawRange.count ?? 0
    if (command && gpuProof.fresh && frame.vertices > 0) {
      check(
        command.model === 5 && command.geometryModel === 95,
        'Latched screen command is not the actual Temple geometry'
      )
      frame.material = modelMaterial(surface, command)
      const gl = surface.renderer.getContext(),
        pixels = new Uint8Array(gpu.width * gpu.height * 4)
      gl.readPixels(0, 0, gpu.width, gpu.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
      frame.opaquePixels = 0
      for (let offset = 3; offset < pixels.length; offset += 4)
        if (pixels[offset]) frame.opaquePixels++
      if (label === 'whole' || label === 'flight')
        check(frame.opaquePixels > 0, 'Actual submitted building GPU frame is empty')
    }
    if (label === 'handoff')
      check(!frame.worldGiftVisible, 'Gift body/glow group remains visible after hide')
  }
  const wrap = (owner, key, factory) => {
    const descriptor = Object.getOwnPropertyDescriptor(owner, key),
      original = owner[key]
    check(typeof original === 'function', `Missing callback ${key}`)
    const wrapped = factory(original)
    owner[key] = wrapped
    restorers.push(() => {
      check(owner[key] === wrapped, `Observer ownership changed: ${key}`)
      if (descriptor) Object.defineProperty(owner, key, descriptor)
      else delete owner[key]
    })
  }
  try {
    // All hooks are validated before installing any wrapper.
    for (const [owner, key] of [
      [clock, 'beforeTurn'],
      [clock, 'afterTurn'],
      [presentation, 'visit'],
      [presentation, 'draw'],
      [presentation, 'sprite'],
      [renderer, 'render'],
    ])
      check(typeof owner[key] === 'function', `Missing callback ${key}`)
    wrap(
      clock,
      'beforeTurn',
      original =>
        function (...args) {
          observe(() => {
            beforeTurn = state()
          })
          return call(original, this, args)
        }
    )
    wrap(
      clock,
      'afterTurn',
      original =>
        function (...args) {
          const result = call(original, this, args)
          observe(() => {
            evidence.worldVisits++
            if (giftId === null) {
              const gift = world.gifts.find(
                g => g.buildingAcquisition?.mission === 3 && g.buildingAcquisition.model === 5
              )
              if (gift) giftId = gift.id
            }
            const after = state(),
              gift = after.gift,
              building = world.worshipAcquisition.controllers.building
            if (gift && !evidence.birth) {
              evidence.birth = after
              const tag = gift.buildingAcquisition
              check(
                gift.reward === 'temple' &&
                  gift.recipient === world.manaWorld.playerTribe &&
                  tag.mission === 3 &&
                  tag.head === 91 &&
                  tag.reward === 92 &&
                  tag.slot === 0 &&
                  tag.rewardClass === 2 &&
                  tag.model === 5,
                'Gift is not the authored local M3 Temple reward'
              )
              check(
                gift.phase === 6 && gift.remaining === 82 && !after.temple,
                'Wrong natural gift birth state'
              )
            }
            if (building !== controller) {
              evidence.handoffs++
              controller = building
              const target = hud()
              evidence.stages.handoff = {
                before: beforeTurn,
                after,
                hud: target,
                sourceAnchor: structuredClone(presentation.anchors.get(giftId) ?? null),
              }
              check(building?.giftId === giftId && building.active, 'Wrong building handoff owner')
              check(
                beforeTurn.mode === after.mode,
                'Automatic Buildings selection changed input mode'
              )
              check(
                target.selected &&
                  target.disabled &&
                  target.rectangle?.width > 0 &&
                  target.rectangle.height > 0,
                'Handoff did not select the actual locked Buildings card'
              )
              const { rectangle: r, hudScale: scale } = target,
                geometry = building.geometry
              check(Number.isFinite(scale) && scale > 0, 'Invalid measured HUD scale')
              check(
                geometry.target.x ===
                  Math.trunc((r.x + Math.trunc(r.width / scale / 2) * scale) / scale) &&
                  geometry.target.y ===
                    Math.trunc((r.y + Math.trunc(r.height / scale / 2) * scale) / scale),
                'Screen destination does not match the actual locked card'
              )
            }
            if (!evidence.birth) return
            const visit = after.turn - evidence.birth.turn
            if (gift) {
              check(
                gift.remaining === 82 - visit && gift.phase === Math.max(0, 6 - visit),
                'Gift timer/phase changed outside its object visits'
              )
              check(!after.temple, 'Knowledge granted before the independent visit82')
            }
            if (visit === 6) {
              evidence.stages.hide = after
              check(
                gift?.remaining === 76 && gift.phase === 0 && !after.temple,
                'Six-visit hide mismatch'
              )
              check(
                building?.giftId === giftId && building.active && evidence.handoffs === 1,
                'Sixth visit did not create the one matching active building handoff'
              )
            }
            if (visit === 81) evidence.stages.beforeGrant = after
            if (!beforeTurn.temple && after.temple) {
              evidence.grants++
              evidence.stages.grant = { before: beforeTurn, after }
              check(
                visit === 82 && beforeTurn.gift?.remaining === 1 && !gift,
                'Knowledge grant is not the independent visit82'
              )
            }
          })
          return result
        }
    )
    wrap(
      presentation,
      'visit',
      original =>
        function (...args) {
          const result = call(original, this, args)
          observe(() => {
            checkOwner()
            evidence.uiVisits++
            const building = world.worshipAcquisition.controllers.building
            if (!building || building.giftId !== giftId) return
            const row = {
              turn: world.turn,
              paused: world.paused,
              phase: building.phase,
              visits: building.visits,
              active: building.active,
              selected:
                world.worshipAcquisition.controllers.drawCommands.find(
                  command => command.kind === 'building'
                )?.selected ?? [],
              remaining: world.gifts.find(gift => gift.id === giftId)?.remaining ?? null,
              resourceLive: structuredClone(window.testStore.getPresentationSnapshot()),
            }
            if (!evidence.phases[row.phase]) evidence.phases[row.phase] = state()
            if (evidence.recentUi.length === 32) evidence.recentUi.shift()
            evidence.recentUi.push(row)
          })
          return result
        }
    )
    wrap(
      presentation,
      'sprite',
      original =>
        function (...args) {
          const result = call(original, this, args)
          observe(() => {
            const command = args[0]
            if (
              !result ||
              command?.family !== 'building' ||
              command.giftId !== giftId ||
              command.palette === 'ghost'
            )
              return
            checkOwner()
            const resource = drawResource(),
              resolved = templeSpriteMaterial(
                command.frame,
                command.palette,
                scene.templeResourceSnapshot
              )
            const key = `${resolved.atlas}:${command.frame}:${resolved.rgb}`
            check(
              resolved.atlas === templeArt.sparkleAtlas && presentation.sprites.get(key) === result,
              'Actual shared sprite did not consume the resolved p crop/tint cache entry'
            )
            check(
              result.width === resolved.crop.w && result.height === resolved.crop.h,
              'Shared p crop dimensions changed'
            )
            const sample = {
              key,
              owner: command.owner,
              frame: command.frame,
              palette: command.palette,
              commandRgb: command.rgb,
              resolvedRgb: resolved.rgb,
              crop: structuredClone(resolved.crop),
              resource,
              width: result.width,
              height: result.height,
            }
            evidence.materialOwners[command.owner] ??= sample
            if (
              evidence.materialSamples.length < 32 &&
              !evidence.materialSamples.some(
                prior => prior.key === key && prior.owner === command.owner
              )
            )
              evidence.materialSamples.push(sample)
          })
          return result
        }
    )
    wrap(
      renderer,
      'render',
      original =>
        function (...args) {
          let pending
          observe(() => {
            if (args[0] !== scene.scene) return
            checkOwner()
            const resource = drawResource()
            for (const building of world.buildings) {
              if (
                building.team !== 'blue' ||
                building.kind !== 'temple' ||
                building.object !== 95 ||
                building.progress !== 1 ||
                building.hp <= 0
              )
                continue
              const group = scene.buildingMeshes.get(building.id),
                mesh = group?.children[0]
              check(
                group?.visible &&
                  group.parent === scene.objects &&
                  mesh?.userData.nativeModel === 95 &&
                  mesh.userData.stage === 4,
                'Completed Temple did not reach its actual world mesh'
              )
              const offset = mesh.userData.templeTileOffset?.value,
                expected = templeTileOffset(resource.tile),
                src = imageSource(mesh.material?.map)
              check(
                offset?.x === expected[0] &&
                  offset.y === expected[1] &&
                  mesh.userData.templeResourceEpoch === resource.epoch,
                'World Temple did not consume the same latched p tile/epoch'
              )
              check(
                src?.split('?')[0].endsWith(`/${templeArt.modelAtlas}.png`),
                'Actual world Temple material is not p'
              )
              pending = {
                id: building.id,
                hp: building.hp,
                logs: building.logs,
                x: building.x,
                z: building.z,
                turn: world.turn,
                resource,
                offset: [offset.x, offset.y],
                src,
                beforeFrame: renderer.info.render.frame,
              }
            }
          })
          const result = call(original, this, args)
          observe(() => {
            if (!pending) return
            pending.afterFrame = renderer.info.render.frame
            check(
              pending.afterFrame === pending.beforeFrame + 1,
              'World Temple has no fresh natural renderer frame'
            )
            evidence.worldTemple ??= pending
            if (
              evidence.worldTempleSamples.length < 9 &&
              !evidence.worldTempleSamples.some(
                sample => sample.resource.tile === pending.resource.tile
              )
            )
              evidence.worldTempleSamples.push(pending)
          })
          return result
        }
    )
    wrap(
      presentation,
      'draw',
      original =>
        function (...args) {
          const before = observe(frozen),
            priorGpu = observe(gpuState) ?? { failed: true },
            result = call(original, this, args)
          observe(() => {
            checkOwner()
            evidence.draws++
            const building = world.worshipAcquisition.controllers.building,
              command = world.worshipAcquisition.controllers.drawCommands.find(
                c => c.kind === 'building' && c.giftId === giftId
              ),
              currentGpu = gpuState(),
              created = !priorGpu.surface && !!currentGpu.surface,
              sameSurface = priorGpu.surface === currentGpu.surface,
              sameRenderer = priorGpu.renderer === currentGpu.renderer,
              sameCanvas = priorGpu.canvas === currentGpu.canvas,
              fresh =
                !priorGpu.failed &&
                !!currentGpu.surface &&
                !!currentGpu.renderer &&
                !!currentGpu.canvas &&
                Number.isSafeInteger(currentGpu.frame) &&
                (created
                  ? currentGpu.frame > 0
                  : sameSurface &&
                    sameRenderer &&
                    sameCanvas &&
                    Number.isSafeInteger(priorGpu.frame) &&
                    currentGpu.frame === priorGpu.frame + 1),
              gpuProof = {
                beforeFrame: priorGpu.frame,
                afterFrame: currentGpu.frame,
                created,
                sameSurface,
                sameRenderer,
                sameCanvas,
                fresh,
              }
            // Three WebGLRenderer.render increments info.render.frame; clear/reset do
            // not. This drawer calls render once only for a nonempty current pass.
            if (command && evidence.stages.handoff) capture('handoff', command, gpuProof)
            if (command && !fresh) {
              evidence.skippedGpuDraws++
              if (evidence.skippedGpuSamples.length < 8)
                evidence.skippedGpuSamples.push({
                  turn: world.turn,
                  whole: command.whole,
                  gpu: gpuProof,
                })
            }
            if (
              fresh &&
              command?.whole &&
              presentation.buildingSurface.geometry.drawRange.count > 0
            )
              capture('whole', command, gpuProof)
            if (
              fresh &&
              command &&
              !command.whole &&
              command.submissions.some(face => face.flight > 0) &&
              presentation.buildingSurface.geometry.drawRange.count > 0
            )
              capture('flight', command, gpuProof)
            if (
              !evidence.frames.sharedTile &&
              fresh &&
              command &&
              scene.templeResourceSnapshot.tile !== 92 &&
              presentation.buildingSurface.geometry.drawRange.count > 0 &&
              modelMaterial(presentation.buildingSurface, command).sharedVertices > 0
            )
              capture('sharedTile', command, gpuProof)
            if (building?.giftId === giftId && !building.active && world.unlockedTemple)
              capture('terminal', command, gpuProof)
            check(frozen() === before, 'RAF draw mutated saved acquisition/RNG state')
          })
          return result
        }
    )
  } catch (failure) {
    for (const restore of restorers.reverse()) observe(restore)
    throw failure
  }
  const api = {
    status: () => ({
      giftId,
      birth: evidence.birth?.turn ?? null,
      handoffs: evidence.handoffs,
      grants: evidence.grants,
      whole: !!evidence.frames.whole,
      flight: !!evidence.frames.flight,
      terminal: !!evidence.frames.terminal,
      buildingActive: world.worshipAcquisition.controllers.building?.active ?? false,
      worldTemple: !!evidence.worldTemple,
      errors: [...evidence.errors],
    }),
    read: () => structuredClone(evidence),
    close() {
      check(!closed, 'Building-screen observer already closed')
      closed = true
      let restored = true
      for (const restore of restorers.reverse())
        try {
          restore()
        } catch (failure) {
          restored = false
          error(failure)
        }
      evidence.restored = restored
      if (window.m3BuildingScreen !== api) {
        error('Building-screen observer global ownership changed')
        evidence.restored = false
      } else delete window.m3BuildingScreen
      return structuredClone(evidence)
    },
  }
  window.m3BuildingScreen = api
  return api.status()
}
