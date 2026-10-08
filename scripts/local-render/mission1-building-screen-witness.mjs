// Page-serializable passive observation. Original callbacks remain the only
// owners of turns, UI visits, geometry feedback, RNG, and GPU drawing.
export function installMission1BuildingScreenWitness({ shamanId, birth = null } = {}) {
  if (window.m1BuildingScreen) throw Error('A building-screen observer is already installed')
  const scene = window.testSceneRef.current, world = scene.world, clock = scene.gameClock,
    presentation = scene.worshipPresentation, restorers = []
  const vault = world.shrines.find(s => s.kind === 'vault' && s.mode === 4 && s.reward === 'camp' && s.x === -5 && s.z === -3)
  if (world !== window.testStore.getWorld() || world.outcome.level !== 1 || !vault ||
      !Object.hasOwn(world.worshipAcquisition.controllers, 'building')) throw Error('Current authored M1 screen product required')
  const evidence = { source: { level: 1, vaultId: vault.id, shamanId }, birth: birth && structuredClone(birth),
    handoffs: 0, worldVisits: 0, uiVisits: 0, draws: 0, grants: 0, stages: {}, phases: {},
    recentUi: [], frames: {}, errors: [], restored: false }
  let giftId = birth?.gift.id ?? null, beforeTurn = null, closed = false,
    controller = world.worshipAcquisition.controllers.building
  const error = failure => { if (evidence.errors.length < 16) evidence.errors.push(String(failure?.stack ?? failure)) }
  const observe = fn => { try { return fn() } catch (failure) { error(failure) } }
  const call = (original, receiver, args) => {
    try { return original.apply(receiver, args) } catch (failure) { error(failure); throw failure }
  }
  const check = (condition, message) => { if (!condition) throw Error(message) }
  const state = () => {
    check(scene.world === world && window.testStore.getWorld() === world, 'Observed World identity changed')
    const actor = world.units.find(unit => unit.id === shamanId)
    check(actor?.hp > 0 && actor.kind === 'shaman' && actor.team === 'blue', 'Original Shaman lost during acquisition')
    const gift = world.gifts.find(gift => gift.id === giftId)
    return { turn: world.turn, paused: world.paused, speed: world.speed, mode: world.mode,
      camp: world.unlockedCamp, gift: gift && structuredClone(gift), active: vault.active,
      animationFrame: clock.animationFrame, acquisition: structuredClone(world.worshipAcquisition),
      cosmeticRandom: structuredClone(world.cosmeticRandom) }
  }
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
  const capture = (label, command) => {
    if (evidence.frames[label]) return
    const canvas = presentation.canvas, surface = presentation.buildingSurface, gpu = surface?.renderer?.domElement
    check(canvas && canvas.width > 0 && canvas.height > 0 && canvas.width * canvas.height <= 2_000_000,
      'Screen overlay exceeds declared capture bounds')
    // Retain actual already-drawn PNGs before checking state or visible pixels.
    const frame = evidence.frames[label] = { overlayHidden: canvas.hidden }
    if (!canvas.hidden) frame.overlayPng = canvas.toDataURL('image/png')
    if (command && gpu && gpu.width * gpu.height <= 2_000_000) frame.buildingPng = gpu.toDataURL('image/png')
    frame.state = state(); frame.hud = hud(); frame.command = command && structuredClone(command)
    frame.draw = evidence.draws
    frame.worldGiftVisible = scene.fxMeshes.get(giftId)?.visible ?? false
    frame.vertices = surface?.geometry.drawRange.count ?? 0
    if (command && frame.vertices > 0) {
      const gl = surface.renderer.getContext(), pixels = new Uint8Array(gpu.width * gpu.height * 4)
      gl.readPixels(0, 0, gpu.width, gpu.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
      frame.opaquePixels = 0
      for (let offset = 3; offset < pixels.length; offset += 4) if (pixels[offset]) frame.opaquePixels++
      check(frame.opaquePixels > 0, 'Actual submitted building GPU frame is empty')
    }
    if (label === 'handoff') check(!frame.worldGiftVisible, 'Gift body/glow group remains visible after hide')
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
        evidence.uiVisits++
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
      const before = observe(frozen), result = call(original, this, args)
      observe(() => {
        evidence.draws++
        const building = world.worshipAcquisition.controllers.building,
          command = world.worshipAcquisition.controllers.drawCommands.find(c => c.kind === 'building' && c.giftId === giftId)
        if (command && evidence.stages.handoff) capture('handoff', command)
        if (command?.whole && presentation.buildingSurface?.geometry.drawRange.count > 0) capture('whole', command)
        if (command && !command.whole && command.submissions.some(face => face.flight > 0) &&
            presentation.buildingSurface?.geometry.drawRange.count > 0) capture('flight', command)
        if (building?.giftId === giftId && !building.active && world.unlockedCamp) capture('terminal', command)
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
      buildingActive: world.worshipAcquisition.controllers.building?.active ?? false, errors: [...evidence.errors] }),
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
