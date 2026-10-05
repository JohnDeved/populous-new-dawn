// Serialized into the browser by the combined checker. Original callbacks are
// invoked once; observation errors are retained outside the application's path.
export async function installCombinedGroundWitness() {
  const scene = window.testSceneRef.current, world = scene.world,
    presentation = scene.worshipPresentation, canvas = presentation.canvas,
    context = canvas.getContext('2d'), restorers = [],
    { terrainPointHeight } = await import('/app/native-terrain.ts'),
    { short } = await import('/app/native-math.ts'),
    { texture } = await import('/app/scene-assets.ts'),
    art = (await import('/app/original-worship-acquisition.json')).default.bodyFrames[12],
    hud = (await import('/app/original-hud.json')).default,
    image = texture('hud').image, rectangle = hud.rects[art.source]
  if (typeof scene.gameClock.worshipVisit !== 'function' || world !== window.testStore.getWorld())
    throw Error('Combined witness requires the actual production acquisition clock and current World')
  const evidence = window.combinedBridgeEvidence = { targetGiftId: null, handoff: null, body: null,
    arrival: null, payout: null, retirement: null, errors: [], restored: false,
    visits: 0, turns: 0, cueCount: 0, groundSteps: [], scope: 'First ordinarily acquired Bridge only; later stock is earned normally' }
  const observe = fn => {
    try { return fn() } catch (error) {
      if (evidence.errors.length < 16) evidence.errors.push(String(error.stack ?? error))
    }
  }
  const snapshot = () => {
    const w = scene.world, c = w.worshipAcquisition.controllers,
      gift = w.gifts.find(g => g.id === evidence.targetGiftId)
    return { turn: w.turn, paused: w.paused, speed: w.speed, stock: w.shots.bridge, count: w.giftCounts.bridge,
      gift: gift && { id: gift.id, phase: gift.phase, remaining: gift.remaining, recipient: gift.recipient },
      requests: [...w.worshipAcquisition.requests], clock: { ...w.worshipAcquisition.clock },
      spell: c.spell && { active: c.spell.active, giftId: c.spell.giftId, model: c.spell.model,
        step: c.spell.step, visits: c.spell.visits, position: { ...c.spell.position } } }
  }
  const wrap = (owner, key, factory) => {
    const own = Object.hasOwn(owner, key), original = owner[key], replacement = factory(original)
    if (typeof original !== 'function') throw Error(`Missing original callback ${key}`)
    owner[key] = replacement
    restorers.push(() => {
      if (owner[key] !== replacement) throw Error(`Combined observer ownership changed: ${key}`)
      if (own) owner[key] = original; else delete owner[key]
    })
  }
  let beforeTurn = null, drawing = false, drawCall = null
  wrap(scene, 'onSound', original => function (...args) {
    const result = original.apply(this, args)
    if (args[0] === 0x71 && !evidence.payout) evidence.cueCount++
    return result
  })
  wrap(scene.gameClock, 'beforeTurn', original => function (...args) {
    beforeTurn = observe(snapshot)
    return original.apply(this, args)
  })
  wrap(scene.gameClock, 'afterTurn', original => function (...args) {
    if (evidence.targetGiftId === null) {
      const gift = world.gifts.find(g => world.worshipAcquisition.requests.includes(g.id) &&
        g.ordinaryWorship?.model === 12 && g.recipient === world.manaWorld.playerTribe)
      if (gift) evidence.targetGiftId = gift.id
    }
    const before = observe(snapshot), result = original.apply(this, args)
    evidence.turns++
    observe(() => {
      const after = snapshot()
      if (window.captureCombinedGroundSteps) {
        const step = window.readCombinedGround(false)
        if (!step || step.phase !== 1 || evidence.groundSteps.length >= 64) throw Error('Native phase1 ground-step bound failed')
        evidence.groundSteps.push({ ...step, stage: 'after-original-World-turn-before-frame-render' })
      }
      if (!evidence.handoff && before.gift && before.requests.includes(before.gift.id) &&
          after.spell?.giftId === before.gift.id && after.spell.active)
        evidence.handoff = { before, after }
      if (!evidence.payout && evidence.targetGiftId !== null && beforeTurn && after.count > beforeTurn.count)
        evidence.payout = { before: beforeTurn, after }
    })
    return result
  })
  wrap(scene.gameClock, 'worshipVisit', original => function (...args) {
    const before = observe(snapshot), result = original.apply(this, args)
    evidence.visits++
    observe(() => {
      const after = snapshot()
      if (!evidence.arrival && before.gift?.remaining > 1 && after.gift?.remaining === 1)
        evidence.arrival = { before, after }
    })
    return result
  })
  wrap(context, 'drawImage', original => function (...args) {
    const result = original.apply(this, args)
    if (drawing && args.length === 9 && args[0] === image &&
        args[1] === rectangle.x + art.crop.x && args[2] === rectangle.y + art.crop.y)
      observe(() => {
        const t = this.getTransform()
        drawCall = { args: args.slice(1), transform: [t.a, t.b, t.c, t.d, t.e, t.f],
          source: image.currentSrc, sourceSize: [image.naturalWidth, image.naturalHeight], alpha: this.globalAlpha }
      })
    return result
  })
  wrap(presentation, 'draw', original => function (...args) {
    const spell = world.worshipAcquisition.controllers.spell
    drawing = window.combinedDriving === true && !evidence.body && !!spell?.active && spell.giftId === evidence.targetGiftId && spell.step >= 2
    drawCall = null
    let result
    try { result = original.apply(this, args) } finally { drawing = false }
    if (drawCall && !evidence.body) observe(() => {
      if (!(canvas.width > 0 && canvas.height > 0 && canvas.width * canvas.height <= 2_000_000)) throw Error('Combined body pixel region exceeds bound')
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
      let nontransparent = 0
      for (let i = 3; i < pixels.length; i += 4) if (pixels[i]) nontransparent++
      evidence.body = { state: snapshot(), call: drawCall, hidden: canvas.hidden,
        canvas: [canvas.width, canvas.height], nontransparent, png: canvas.toDataURL(),
        limit: 'Actual native-body atlas submission and nontransparent overlay; companions may contribute alpha' }
    })
    return result
  })
  window.observeCombinedGroundFrame = () => {
    observe(() => {
      const c = world.worshipAcquisition.controllers
      if (evidence.payout && !evidence.retirement && c.spell?.giftId === evidence.targetGiftId &&
          !c.spell.active && !c.companion?.active && !c.pulse?.active && !c.drawCommands.length && canvas.hidden)
        evidence.retirement = snapshot()
    })
    if (evidence.errors.length) throw Error(evidence.errors[0])
  }
  window.readCombinedGround = (includeMesh = true) => {
    const f = world.effects.find(effect => effect.reincarnation?.team === 'blue')
    if (!f) return null
    const point = { x: short(Math.round((f.x + 8) * 256)), y: short(Math.round((-f.z - 8) * 256)) },
      g = scene.fxMeshes.get(f.id)
    return { turn: world.turn, id: f.id, x: f.x, z: f.z, phase: f.reincarnation.phase,
      ground: terrainPointHeight(world.land, point), stored: f.reincarnation.ground,
      height: Math.round(f.height * 45),
      ...(includeMesh ? { meshY: g?.position.y, visible: g?.visible, source: g?.userData.directions?.[0]?.source } : {}), remaining: Math.round(world.respawns[0] * 12),
      randomState: world.randomState, cosmeticRandom: structuredClone(world.cosmeticRandom),
      braves: world.units.filter(u => u.team === 'blue' && u.kind === 'brave').length,
      status: world.status, bridges: world.effects.filter(effect => effect.bridge).map(effect => ({ id: effect.id, turn: effect.bridge.turn })) }
  }
  window.restoreCombinedGroundWitness = () => {
    for (const restore of restorers.reverse()) observe(restore)
    evidence.diagnostics = structuredClone(presentation.diagnostics)
    evidence.restored = evidence.errors.length === 0
    delete window.restoreCombinedGroundWitness
    return evidence
  }
}
