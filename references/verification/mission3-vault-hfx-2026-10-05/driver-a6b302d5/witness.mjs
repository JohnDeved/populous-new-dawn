// Serialized into the real browser. Reads cached presentation state only.
// Hooks retain state and already-rendered pixels; the host owns all UI input.
export async function installVaultWitness() {
  const scene = window.testSceneRef.current, world = scene.world, restorers = []
  if (world !== window.testStore.getWorld()) throw Error('Scene/store identity mismatch')
  const vault = world.shrines.find(s => s.kind === 'vault' && s.reward === 'temple')
  if (!vault || world.outcome.level !== 3) throw Error('Authored Mission 3 Temple Vault required')
  const evidence = window.vaultEvidence = { vaultId: vault.id, giftId: null, arm: 'preflight',
    turns: 0, frames: 0, stages: {}, samples: [], errors: [], restored: false }
  const observe = fn => { try { return fn() } catch (error) { evidence.errors.push(String(error.stack ?? error)) } }
  const copyGift = gift => gift && { id: gift.id, x: gift.x, z: gift.z, height: gift.height,
    remaining: gift.remaining, phase: gift.phase, frame: gift.frame,
    recipient: gift.recipient, animation: gift.animation && { ...gift.animation }, sprite: gift.sprite && { ...gift.sprite } }
  const state = () => ({ turn: world.turn, time: world.time, paused: world.paused, speed: world.speed,
    temple: world.unlockedTemple, shrine: { active: vault.active, remaining: vault.remaining,
      glow: vault.knowledgeGlow && { ...vault.knowledgeGlow } },
    gift: copyGift(world.gifts.find(g => g.id === evidence.giftId)) })
  const presentation = group => group && { visible: group.visible, name: group.name,
    position: group.position.toArray(), family: group.userData.resourceFamily ?? 'legacy-unit-frames',
    body: group.userData.frame, glow: group.userData.glow && {
      visible: group.userData.glow.visible, frame: group.userData.glow.userData.frame,
      position: group.userData.glow.position.toArray() },
    children: group.children.map(c => ({ name: c.name, visible: c.visible, frame: c.userData.hfxFrame,
      scale: c.scale.toArray(), center: c.center?.toArray() })) }
  const rendered = () => ({ state: state(), marker: presentation(scene.shrineMeshes.get(vault.id)?.g.userData.vaultKnowledgeMarker),
    gift: presentation(scene.fxMeshes.get(evidence.giftId)) })
  const wrap = (owner, key, factory) => {
    const own = Object.hasOwn(owner, key), original = owner[key], replacement = factory(original)
    if (typeof original !== 'function') throw Error(`Missing callback ${key}`)
    owner[key] = replacement
    restorers.push(() => {
      if (owner[key] !== replacement) throw Error(`Observer ownership changed: ${key}`)
      if (own) owner[key] = original; else delete owner[key]
    })
  }
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
        const gift = world.gifts.find(g => g.reward === 'temple' && g.frame === 1079 && g.sprite?.sequence === 'vault-knowledge-glow')
        if (gift) evidence.giftId = gift.id
      }
      const after = state()
      if (after.gift && evidence.samples.length < 100) evidence.samples.push(after)
      const arm = evidence.arm
      if (arm === 'preflight' || arm === 'birth' && after.gift ||
          arm === 'retirement' && after.gift?.phase === 0 || arm === 'payout' && after.temple) {
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
        const canvas = scene.renderer.domElement, snapshot = rendered()
        if (!(canvas.width > 0 && canvas.height > 0 && canvas.width * canvas.height <= 2_000_000))
          throw Error('Rendered canvas exceeds declared capture bound')
        const pixels = canvas.toDataURL('image/png')
        for (const stage of pendingRenders) {
          evidence.stages[stage].postRender = structuredClone(snapshot)
          window.vaultRenderedPixels[stage] = pixels
        }
        pendingRenders.length = 0
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
export function readVaultProgress(shamanId) {
  const s = window.testSceneRef.current, w = s.world, e = window.vaultEvidence,
    u = w.units.find(u => u.id === shamanId), p = u?.native,
    orderId = p && (p.immediateCommand || p.commands[p.commandCursor]),
    order = orderId ? w.buildingOrders.records[orderId] : undefined,
    vault = w.shrines.find(h => h.id === e.vaultId)
  return { turn: w.turn, time: w.time, paused: w.paused, status: w.status,
    temple: w.unlockedTemple, lastOrderTurn: w.lastOrderTurn,
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
