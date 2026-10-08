// Page-serializable passive observation. Original callbacks remain the only
// owners of turns, UI visits, geometry feedback, RNG, and GPU drawing.
export function installMission1BuildingScreenWitness({ shamanId, birth = null, mapDraw = null } = {}) {
  if (window.m1BuildingScreen) throw Error('A building-screen observer is already installed')
  const installation = window.m1BuildingScreenInstallation = { resumed: !!birth, state: null }
  const scene = window.testSceneRef.current, world = scene.world, clock = scene.gameClock,
    presentation = scene.worshipPresentation, renderer = scene.renderer, mainCanvas = renderer.domElement, restorers = []
  const vault = world.shrines.find(s => s.kind === 'vault' && s.mode === 4 && s.reward === 'camp' && s.x === -5 && s.z === -3)
  if (world !== window.testStore.getWorld() || world.outcome.level !== 1 || !vault ||
      !Object.hasOwn(world.worshipAcquisition.controllers, 'building')) throw Error('Current authored M1 screen product required')
  const evidence = { source: { level: 1, vaultId: vault.id, shamanId }, birth: birth && structuredClone(birth),
    handoffs: 0, worldVisits: 0, uiVisits: 0, draws: 0, grants: 0, stages: {}, phases: {},
    recentUi: [], skippedGpuDraws: 0, skippedGpuSamples: [], frames: {}, samples: {}, errors: [], restored: false }
  let giftId = birth?.gift.id ?? null, beforeTurn = null, closed = false,
    controller = world.worshipAcquisition.controllers.building, sample = null, resources = null, referenceGeometry = null
  const error = failure => { if (evidence.errors.length < 16) evidence.errors.push(String(failure?.stack ?? failure)) }
  const observe = fn => { try { return fn() } catch (failure) { error(failure) } }
  const call = (original, receiver, args) => {
    try { return original.apply(receiver, args) } catch (failure) { error(failure); throw failure }
  }
  const check = (condition, message) => { if (!condition) throw Error(message) }
  const checkOwner = () => {
    check(window.testSceneRef.current === scene && scene.world === world && window.testStore.getWorld() === world, 'Observed Scene/World identity changed')
    check(scene.gameClock === clock && scene.worshipPresentation === presentation && scene.renderer === renderer &&
      renderer.domElement === mainCanvas, 'Observed clock/presentation/main-canvas ownership changed')
  }
  const state = () => {
    checkOwner()
    const actor = world.units.find(unit => unit.id === shamanId)
    check(actor?.hp > 0 && actor.kind === 'shaman' && actor.team === 'blue', 'Original Shaman lost during acquisition')
    const gift = world.gifts.find(gift => gift.id === giftId)
    return { turn: world.turn, paused: world.paused, speed: world.speed, mode: world.mode,
      camp: world.unlockedCamp, gift: gift && structuredClone(gift), active: vault.active,
      animationFrame: clock.animationFrame, acquisition: structuredClone(world.worshipAcquisition),
      cosmeticRandom: structuredClone(world.cosmeticRandom) }
  }
  installation.state = state()
  evidence.installation = structuredClone(installation)
  if (birth) check(installation.state.gift?.id === birth.gift.id &&
    installation.state.gift.remaining > 0 && controller?.giftId === birth.gift.id && controller.active &&
    !installation.state.camp, 'Missed resumed active-gift/controller/locked-knowledge boundary')
  const hud = () => {
    const root = scene.container.parentElement, tab = root.querySelector('[aria-label="buildings B"]'),
      card = root.querySelector('[aria-label="Warrior Training Hut, 8 wood"]'),
      panel = root.querySelector('.native-hud'), shell = root.getBoundingClientRect(),
      rect = card?.getBoundingClientRect(), view = scene.container.getBoundingClientRect()
    return { selected: tab?.getAttribute('aria-pressed') === 'true', disabled: card?.disabled ?? null,
      rectangle: rect && { x: rect.x - shell.x, y: rect.y - shell.y, width: rect.width, height: rect.height },
      viewport: { x: view.x - shell.x, y: view.y - shell.y, width: view.width, height: view.height },
      hudScale: panel ? panel.getBoundingClientRect().width / panel.offsetWidth : null }
  }
  const frozen = () => JSON.stringify({ acquisition: world.worshipAcquisition, cosmeticRandom: world.cosmeticRandom })
  const gpuState = () => {
    const surface = presentation.buildingSurface, renderer = surface?.renderer
    return { surface, renderer, canvas: renderer?.domElement, frame: renderer?.info.render.frame ?? null }
  }
  const capture = (label, command, gpuProof) => {
    if (evidence.frames[label]) return
    const canvas = presentation.canvas, surface = presentation.buildingSurface, gpu = surface?.renderer?.domElement
    check(canvas && canvas.width > 0 && canvas.height > 0 && canvas.width * canvas.height <= 2_000_000,
      'Screen overlay exceeds declared capture bounds')
    // Retain actual already-drawn PNGs before checking state or visible pixels.
    const frame = evidence.frames[label] = { overlayHidden: canvas.hidden }
    if (!canvas.hidden) frame.overlayPng = canvas.toDataURL('image/png')
    if (command && gpuProof.fresh && gpu && gpu.width * gpu.height <= 2_000_000) frame.buildingPng = gpu.toDataURL('image/png')
    frame.state = state(); frame.hud = hud(); frame.command = command && structuredClone(command)
    frame.draw = evidence.draws; frame.gpu = gpuProof
    frame.worldGiftVisible = scene.fxMeshes.get(giftId)?.visible ?? false
    frame.vertices = surface?.geometry.drawRange.count ?? 0
    if (command && gpuProof.fresh && frame.vertices > 0) {
      const gl = surface.renderer.getContext(), pixels = new Uint8Array(gpu.width * gpu.height * 4)
      gl.readPixels(0, 0, gpu.width, gpu.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
      frame.opaquePixels = 0
      for (let offset = 3; offset < pixels.length; offset += 4) if (pixels[offset]) frame.opaquePixels++
      if (label === 'whole' || label === 'flight' || label.startsWith('resize-'))
        check(frame.opaquePixels > 0, 'Actual submitted building GPU frame is empty')
    }
    if (label === 'handoff') check(!frame.worldGiftVisible, 'Gift body/glow group remains visible after hide')
  }
  const sampleResources = () => {
    const surface = presentation.buildingSurface, mesh = surface?.scene.children[0]
    check(surface && mesh && !surface.disposed && mesh.geometry === surface.geometry && mesh.material === surface.material,
      'Missing existing acquisition surface/mesh')
    check(surface.material.uniforms.atlas.value === surface.atlas, 'Acquisition atlas owner changed')
    const refs = [surface, surface.renderer, surface.renderer.domElement, surface.geometry, surface.material,
      surface.atlas, surface.scene, surface.camera, mesh, surface.material.uniforms.atlas.value]
    let bytes = 0
    for (const [field, name, size] of [['position', 'position', 3], ['uv', 'uv', 2], ['light', 'faceLight', 1], ['cutout', 'alphaCutout', 1]]) {
      const attribute = surface[field], array = attribute?.array
      check(attribute === surface.geometry.attributes[name] && array instanceof Float32Array &&
        attribute.itemSize === size && array.length === 525 * size, 'Acquisition fixed attribute capacity changed')
      refs.push(attribute, array, array.buffer); bytes += array.byteLength
    }
    check(bytes === 14700, 'Acquisition attribute byte capacity changed')
    if (resources) check(refs.every((ref, index) => ref === resources[index]), 'Acquisition resources were replaced')
    else resources = refs
    return bytes
  }
  const sampleDraw = (command, gpuProof) => {
    if (!sample || sample.count === 16) return
    check(world.paused && controller?.active && world.gifts.some(g => g.id === giftId) && !world.unlockedCamp,
      'Resize sample lost its actual paused active gift')
    const shell = scene.container.parentElement, canvas = presentation.canvas, gpu = presentation.buildingSurface?.renderer.domElement,
      ratio = devicePixelRatio || 1
    if (innerWidth !== sample.width || innerHeight !== sample.height ||
      canvas.width !== Math.round(shell.clientWidth * ratio) || canvas.height !== Math.round(shell.clientHeight * ratio) ||
      gpu?.width !== canvas.width || gpu?.height !== canvas.height) return
    if (!command || !gpuProof.fresh || presentation.buildingSurface.geometry.drawRange.count === 0) return
    if (!sample.count) capture(`resize-${sample.label}`, command, gpuProof)
    const measured = hud(), surface = presentation.buildingSurface, vertices = surface.geometry.drawRange.count
    check(measured.selected && measured.disabled && measured.rectangle?.width > 0, 'Resize sample needs the actual locked Buildings card')
    check(JSON.stringify(controller.geometry) === referenceGeometry && JSON.stringify(command.geometry) === referenceGeometry,
      'Resize mutated the frozen acquisition geometry')
    const bytes = sampleResources(), current = { viewport: measured.viewport, targetRect: measured.rectangle, hudScale: measured.hudScale },
      expected = mapDraw(command, current, shell.clientWidth, shell.clientHeight, presentation.previousBuilding), r = measured.rectangle, scale = measured.hudScale,
      target = { x: r.x + Math.trunc(r.width / scale / 2) * scale, y: r.y + Math.trunc(r.height / scale / 2) * scale }
    check(expected.target.x === target.x && expected.target.y === target.y, 'Resized endpoint missed the actual card')
    check(vertices === expected.triangles.length * 3 && vertices > 0 && vertices <= 525, 'Resized submitted triangle count differs')
    let vertex = 0
    for (const triangle of expected.triangles) for (const point of triangle.points) {
      check(surface.position.array[vertex * 3] === Math.fround(point.x) &&
        surface.position.array[vertex * 3 + 1] === Math.fround(point.y) && surface.position.array[vertex * 3 + 2] === 0,
      'Actual submitted corner differs from current production mapping')
      vertex++
    }
    if (!sample.count) {
      sample.first = { hud: measured, target, corners: Array.from(surface.position.array.slice(0, 9)), gpuFrame: gpuProof.afterFrame,
        canvas: { width: canvas.width, height: canvas.height }, attributeBytes: bytes, vertexCapacity: 525, triangleCapacity: 175 }
      sample.startedAt = performance.now()
    }
    sample.count++; sample.lastGpuFrame = gpuProof.afterFrame
    sample.minVertices = Math.min(sample.minVertices ?? vertices, vertices); sample.maxVertices = Math.max(sample.maxVertices ?? vertices, vertices)
    sample.resourcesStable = true; sample.referenceGeometryUnchanged = true; sample.submittedMappingMatches = true
    if (sample.count === 16) { sample.finishedAt = performance.now(); sample.elapsedMs = sample.finishedAt - sample.startedAt }
  }
  const wrap = (owner, key, factory) => {
    const descriptor = Object.getOwnPropertyDescriptor(owner, key), original = owner[key]
    check(typeof original === 'function', `Missing callback ${key}`)
    const wrapped = factory(original)
    owner[key] = wrapped
    restorers.push(() => {
      check(owner[key] === wrapped, `Observer ownership changed: ${key}`)
      if (descriptor) Object.defineProperty(owner, key, descriptor); else delete owner[key]
    })
  }
  try {
    // All hooks are validated before installing any wrapper.
    for (const [owner, key] of [[clock, 'beforeTurn'], [clock, 'afterTurn'], [presentation, 'visit'], [presentation, 'draw']])
      check(typeof owner[key] === 'function', `Missing callback ${key}`)
    wrap(clock, 'beforeTurn', original => function (...args) {
      observe(() => { beforeTurn = state() })
      return call(original, this, args)
    })
    wrap(clock, 'afterTurn', original => function (...args) {
      const result = call(original, this, args)
      observe(() => {
        evidence.worldVisits++
        if (giftId === null) {
          const gift = world.gifts.find(g => g.buildingAcquisition?.mission === 1 && g.buildingAcquisition.model === 7)
          if (gift) giftId = gift.id
        }
        const after = state(), gift = after.gift, building = world.worshipAcquisition.controllers.building
        if (gift && !evidence.birth) {
          evidence.birth = after
          const tag = gift.buildingAcquisition
          check(gift.reward === 'camp' && gift.recipient === world.manaWorld.playerTribe &&
            tag.mission === 1 && tag.head === 1 && tag.reward === 2 && tag.slot === 0 && tag.rewardClass === 2 && tag.model === 7,
          'Gift is not the authored local M1 camp reward')
          check(gift.phase === 6 && gift.remaining === 82 && !after.camp, 'Wrong natural gift birth state')
        }
        if (building !== controller) {
          evidence.handoffs++; controller = building
          const target = hud()
          evidence.stages.handoff = { before: beforeTurn, after, hud: target,
            sourceAnchor: structuredClone(presentation.anchors.get(giftId) ?? null) }
          check(building?.giftId === giftId && building.active, 'Wrong building handoff owner')
          check(beforeTurn.mode === after.mode, 'Automatic Buildings selection changed input mode')
          check(target.selected && target.disabled && target.rectangle?.width > 0 && target.rectangle.height > 0,
            'Handoff did not select the actual locked Buildings card')
          const { rectangle: r, hudScale: scale } = target, geometry = building.geometry
          check(Number.isFinite(scale) && scale > 0, 'Invalid measured HUD scale')
          check(geometry.target.x === Math.trunc((r.x + Math.trunc(r.width / scale / 2) * scale) / scale) &&
            geometry.target.y === Math.trunc((r.y + Math.trunc(r.height / scale / 2) * scale) / scale),
          'Screen destination does not match the actual locked card')
        }
        if (!evidence.birth) return
        const visit = after.turn - evidence.birth.turn
        if (gift) {
          check(gift.remaining === 82 - visit && gift.phase === Math.max(0, 6 - visit), 'Gift timer/phase changed outside its object visits')
          check(!after.camp, 'Knowledge granted before the independent visit82')
        }
        if (visit === 6) {
          evidence.stages.hide = after
          check(gift?.remaining === 76 && gift.phase === 0 && !after.camp, 'Six-visit hide mismatch')
          check(building?.giftId === giftId && building.active && evidence.handoffs === 1,
            'Sixth visit did not create the one matching active building handoff')
        }
        if (visit === 81) evidence.stages.beforeGrant = after
        if (!beforeTurn.camp && after.camp) {
          evidence.grants++
          evidence.stages.grant = { before: beforeTurn, after }
          check(visit === 82 && beforeTurn.gift?.remaining === 1 && !gift, 'Knowledge grant is not the independent visit82')
        }
      })
      return result
    })
    wrap(presentation, 'visit', original => function (...args) {
      const result = call(original, this, args)
      observe(() => {
        checkOwner(); evidence.uiVisits++
        const building = world.worshipAcquisition.controllers.building
        if (!building || building.giftId !== giftId) return
        const row = { turn: world.turn, paused: world.paused, phase: building.phase, visits: building.visits,
          active: building.active, selected: world.worshipAcquisition.controllers.drawCommands
            .find(command => command.kind === 'building')?.selected ?? [],
          remaining: world.gifts.find(gift => gift.id === giftId)?.remaining ?? null }
        if (!evidence.phases[row.phase]) evidence.phases[row.phase] = state()
        if (evidence.recentUi.length === 32) evidence.recentUi.shift()
        evidence.recentUi.push(row)
      })
      return result
    })
    wrap(presentation, 'draw', original => function (...args) {
      const before = observe(frozen), priorGpu = observe(gpuState) ?? { failed: true }, result = call(original, this, args)
      observe(() => {
        checkOwner(); evidence.draws++
        const building = world.worshipAcquisition.controllers.building,
          command = world.worshipAcquisition.controllers.drawCommands.find(c => c.kind === 'building' && c.giftId === giftId),
          currentGpu = gpuState(), created = !priorGpu.surface && !!currentGpu.surface,
          sameSurface = priorGpu.surface === currentGpu.surface,
          sameRenderer = priorGpu.renderer === currentGpu.renderer, sameCanvas = priorGpu.canvas === currentGpu.canvas,
          fresh = !priorGpu.failed && !!currentGpu.surface && !!currentGpu.renderer && !!currentGpu.canvas && Number.isSafeInteger(currentGpu.frame) &&
            (created ? currentGpu.frame > 0 : sameSurface && sameRenderer && sameCanvas && Number.isSafeInteger(priorGpu.frame) && currentGpu.frame === priorGpu.frame + 1),
          gpuProof = { beforeFrame: priorGpu.frame, afterFrame: currentGpu.frame, created, sameSurface, sameRenderer, sameCanvas, fresh }
        // Three WebGLRenderer.render increments info.render.frame; clear/reset do
        // not. This drawer calls render once only for a nonempty current pass.
        if (command && evidence.stages.handoff) capture('handoff', command, gpuProof)
        if (command && !fresh) {
          evidence.skippedGpuDraws++
          if (evidence.skippedGpuSamples.length < 8) evidence.skippedGpuSamples.push({ turn: world.turn, whole: command.whole, gpu: gpuProof })
        }
        if (fresh && command?.whole && presentation.buildingSurface.geometry.drawRange.count > 0) capture('whole', command, gpuProof)
        if (fresh && command && !command.whole && command.submissions.some(face => face.flight > 0) &&
            presentation.buildingSurface.geometry.drawRange.count > 0) capture('flight', command, gpuProof)
        if (building?.giftId === giftId && !building.active && world.unlockedCamp) capture('terminal', command, gpuProof)
        sampleDraw(command, gpuProof)
        check(frozen() === before, 'RAF draw mutated saved acquisition/RNG state')
      })
      return result
    })
  } catch (failure) {
    for (const restore of restorers.reverse()) observe(restore)
    throw failure
  }
  const api = {
    status: () => ({ giftId, birth: evidence.birth?.turn ?? null, handoffs: evidence.handoffs, grants: evidence.grants,
      whole: !!evidence.frames.whole, flight: !!evidence.frames.flight, terminal: !!evidence.frames.terminal,
      buildingActive: world.worshipAcquisition.controllers.building?.active ?? false,
      samples: Object.fromEntries(Object.entries(evidence.samples).map(([label, entry]) => [label, entry.count])), errors: [...evidence.errors] }),
    armDrawSample({ label, width, height }) {
      checkOwner()
      check(typeof mapDraw === 'function' && (!sample || sample.count === 16), 'Draw sample cannot be armed')
      check(label === 'before' && !sample && width === 1440 && height === 1000 ||
        label === 'after' && sample?.label === 'before' && width === 1280 && height === 960, 'Only the declared single resize is supported')
      check(world.paused && controller?.active && controller.giftId === giftId && world.gifts.some(g => g.id === giftId),
        'Draw sample requires actual paused active ownership')
      sampleResources(); referenceGeometry ??= JSON.stringify(controller.geometry)
      sample = evidence.samples[label] = { label, width, height, count: 0,
        limits: '16 natural production draws; attribute bytes exclude atlas/framebuffer/total GPU memory. Elapsed wall time includes observation overhead and is not CPU time or a hardware rate.' }
    },
    read: () => structuredClone(evidence),
    close() {
      check(!closed, 'Building-screen observer already closed'); closed = true
      let restored = true
      for (const restore of restorers.reverse()) try { restore() } catch (failure) { restored = false; error(failure) }
      evidence.restored = restored
      if (window.m1BuildingScreen !== api) { error('Building-screen observer global ownership changed'); evidence.restored = false }
      else delete window.m1BuildingScreen
      return structuredClone(evidence)
    },
  }
  window.m1BuildingScreen = api
  return api.status()
}
