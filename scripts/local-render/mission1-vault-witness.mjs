// Serialized into the real browser. Reads cached presentation state only.
// Hooks retain state and already-rendered pixels; the host owns all UI input.
export function installMission1VaultWitness() {
  const scene = window.testSceneRef.current, world = scene.world, clock = scene.gameClock, restorers = []
  if (world !== window.testStore.getWorld()) throw Error('Scene/store identity mismatch')
  if (!Number.isSafeInteger(clock.animationFrame) || clock.animationFrame < 0) throw Error('Missing presentation clock counter')
  const vault = world.shrines.find(s => s.kind === 'vault' && s.mode === 4 && s.reward === 'camp' && s.x === -5 && s.z === -3)
  if (!vault || world.outcome.level !== 1) throw Error('Authored Mission 1 camp Vault required')
  const evidence = window.vaultEvidence = { vaultId: vault.id, giftId: null, arm: 'preflight',
    turns: 0, frames: 0, stages: {}, samples: [], errors: [], restored: false }
  const observe = fn => { try { return fn() } catch (error) { if (evidence.errors.length < 32) evidence.errors.push(String(error.stack ?? error)) } }
  const copyGift = gift => gift && { id: gift.id, x: gift.x, z: gift.z, height: gift.height,
    remaining: gift.remaining, phase: gift.phase, frame: gift.frame,
    recipient: gift.recipient, independentGlow: gift.animation !== vault.knowledgeGlow, animation: gift.animation && { ...gift.animation }, sprite: gift.sprite && { ...gift.sprite } }
  const state = () => {
    if (scene.world !== world || window.testStore.getWorld() !== world) throw Error('Observer scene/store World changed')
    return { turn: world.turn, time: world.time, paused: world.paused, speed: world.speed, landFlags: world.land.landFlags,
    presentationClock: { sameOwner: scene.gameClock === clock, animationFrame: clock.animationFrame },
    camp: world.unlockedCamp, shrine: { active: vault.active, remaining: vault.remaining,
      glow: vault.knowledgeGlow && { ...vault.knowledgeGlow } },
    gift: copyGift(world.gifts.find(g => g.id === evidence.giftId)) }
  }
  const presentation = group => group && { visible: group.visible, name: group.name,
    position: group.position.toArray(), family: group.userData.resourceFamily ?? 'legacy-unit-frames',
    body: group.userData.frame, glow: group.userData.glow && {
      visible: group.userData.glow.visible, frame: group.userData.glow.userData.frame,
      position: group.userData.glow.position.toArray() },
    children: group.children.map(c => ({ name: c.name, visible: c.visible, frame: c.userData.hfxFrame,
      scale: c.scale.toArray(), center: c.center?.toArray() })) }
  const rendered = () => ({ state: state(), marker: presentation(scene.shrineMeshes.get(vault.id)?.g.userData.vaultKnowledgeMarker),
    gift: presentation(scene.fxMeshes.get(evidence.giftId)) })
  const validateBirth = (stage, snapshot) => {
    const born = stage.afterTurn, now = snapshot.state, initial = born.gift, gift = now.gift,
      start = born.presentationClock, end = now.presentationClock,
      visits = end.animationFrame - start.animationFrame,
      validClock = start.sameOwner && end.sameOwner && Number.isSafeInteger(start.animationFrame) &&
        start.animationFrame >= 0 && Number.isSafeInteger(end.animationFrame) && Number.isSafeInteger(visits) && visits >= 0
    // game-clock.ts increments this independent counter after every presentation visit.
    // Draw43 latches before step4, wrapping its quarter-frame cursor at56.
    stage.presentation = { birthClock: start, firstRenderClock: end, visits,
      expectedCursor: validClock ? (visits % 14) * 4 : null,
      expectedLatch: validClock ? (visits ? (visits - 1) % 14 : 0) : null,
      expectedHfx: validClock ? 1417 + (visits ? (visits - 1) % 14 : 0) : null }
    const failures = [], reject = message => failures.push(message)
    if (!validClock) reject('Presentation clock identity/counter changed')
    if (initial?.frame !== 1077 || initial?.animation?.object !== 1417 || initial?.animation?.draw !== 43 ||
        initial?.animation?.f1 !== 0 || initial?.sprite?.frame !== 0 || !initial?.independentGlow ||
        initial?.phase !== 6 || initial?.remaining !== 82)
      reject('Birth must initialize independent HFX1077/draw43 cursor0/latch0 at phase6/remaining82')
    if (born.paused || now.paused || born.landFlags & 2 || now.landFlags & 2)
      reject('Birth-to-render animation eligibility changed')
    if (!snapshot.gift?.visible || !snapshot.gift?.glow?.visible || !(gift?.phase > 0) ||
        now.turn - born.turn < 0 || now.turn - born.turn >= 6)
      reject('Missed visible birth: first actual render must precede six-visit hide')
    if (!gift || gift.id !== initial?.id || snapshot.gift?.body !== 1077 || snapshot.gift?.family !== 'hfx')
      reject('First actual birth render must show the owned HFX1077 body')
    if (validClock && (gift?.animation?.f1 !== stage.presentation.expectedCursor ||
        gift?.sprite?.frame !== stage.presentation.expectedLatch || snapshot.gift?.glow?.frame !== stage.presentation.expectedHfx))
      reject('First actual birth cursor/latch/HFX must match independent presentation visits')
    stage.validationErrors = failures
    if (failures.length) {
      stage.missedRender = structuredClone(snapshot)
      evidence.errors.push(...failures)
    }
  }
  const wrap = (owner, key, factory) => {
    const own = Object.hasOwn(owner, key), original = owner[key], replacement = factory(original)
    if (typeof original !== 'function') throw Error(`Missing callback ${key}`)
    owner[key] = replacement
    restorers.push(() => {
      if (owner[key] !== replacement) throw Error(`Observer ownership changed: ${key}`)
      if (own) owner[key] = original; else delete owner[key]
    })
  }
  for (const [owner, key] of [[scene.gameClock, 'beforeTurn'], [scene.gameClock, 'afterTurn'], [scene.renderer, 'render']])
    if (typeof owner[key] !== 'function') throw Error(`Missing callback ${key}`)
  window.vaultRenderedPixels = {}
  let before = null
  const pendingRenders = []
  wrap(scene.gameClock, 'beforeTurn', original => function (...args) {
    before = observe(state)
    return original.apply(this, args)
  })
  wrap(scene.gameClock, 'afterTurn', original => function (...args) {
    const result = original.apply(this, args)
    evidence.turns++
    observe(() => {
      if (evidence.giftId === null) {
        const gift = world.gifts.find(g => g.reward === 'camp' && g.frame === 1077 && g.sprite?.sequence === 'vault-knowledge-glow')
        if (gift) evidence.giftId = gift.id
      }
      const after = state()
      if (after.gift && evidence.samples.length < 100) evidence.samples.push(after)
      const arm = evidence.arm
      if (arm === 'preflight' || arm === 'birth' && after.gift ||
          arm === 'retirement' && after.gift?.phase === 0 || arm === 'payout' && after.camp) {
        evidence.arm = ({ birth: 'retirement', retirement: 'payout' })[arm] ?? null
        evidence.stages[arm] = { beforeTurn: before, afterTurn: after }
        pendingRenders.push(arm)
      }
    })
    return result
  })
  wrap(scene.renderer, 'render', original => function (...args) {
    const result = original.apply(this, args)
    if (args[0] === scene.scene && args[1] === scene.camera) observe(() => {
      evidence.frames++
      if (pendingRenders.length) {
        const canvas = scene.renderer.domElement, snapshot = rendered(), stages = pendingRenders.splice(0)
        for (const stage of stages) evidence.stages[stage].postRender = structuredClone(snapshot)
        if (!(canvas.width > 0 && canvas.height > 0 && canvas.width * canvas.height <= 2_000_000))
          throw Error('Rendered canvas exceeds declared capture bound')
        const pixels = canvas.toDataURL('image/png')
        // Retain the first actual render even when its validation fails.
        for (const stage of stages) window.vaultRenderedPixels[stage] = pixels
        if (stages.includes('birth')) validateBirth(evidence.stages.birth, snapshot)
      }
    })
    return result
  })
  window.readVaultWitness = rendered
  window.restoreVaultWitness = () => {
    for (const restore of restorers.reverse()) observe(restore)
    evidence.restored = evidence.errors.length === 0
    delete window.restoreVaultWitness
    delete window.readVaultWitness
    return evidence
  }
}

// Pure bounded route observation. The order lookup mirrors currentPersonOrder;
// it never resolves native terrain, issues an order, or updates Scene caches.
export function readMission1VaultProgress(shamanId) {
  const s = window.testSceneRef.current, w = s.world, e = window.vaultEvidence,
    u = w.units.find(u => u.id === shamanId), p = u?.native,
    orderId = p && (p.immediateCommand || p.commands[p.commandCursor]),
    order = orderId ? w.buildingOrders.records[orderId] : undefined,
    vault = w.shrines.find(h => h.id === e.vaultId)
  return { turn: w.turn, time: w.time, paused: w.paused, status: w.status,
    camp: w.unlockedCamp, lastOrderTurn: w.lastOrderTurn,
    pointerAck: { ...s.pointerAck },
    shaman: u && { id: u.id, x: u.x, z: u.z, hp: u.hp, team: u.team, kind: u.kind, work: u.work,
      target: u.target, inside: u.inside, pathLength: u.path.length,
      vaultTask: u.vault && { ...u.vault }, state: p?.state, substate: p?.substate,
      order: order && { model: order.model, a: order.a, b: order.b, flags: order.flags } },
    vault: { active: vault.active, work: vault.work, followers: vault.followers,
      remaining: vault.remaining, forced: vault.forced },
    gifts: w.gifts.slice(0, 16).map(g => ({ id: g.id, reward: g.reward, frame: g.frame,
      recipient: g.recipient, phase: g.phase, remaining: g.remaining })),
    birthRendered: !!e.stages.birth?.postRender, observerErrors: [...e.errors] }
}
