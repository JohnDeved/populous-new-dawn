// Serialized into the real browser. Reads cached presentation state only.
// The sole action is an ordinary Pause button click after a completed turn.
export async function installVaultWitness() {
  const scene = window.testSceneRef.current, world = scene.world,
    { afterCurrentGameTurn } = await import('/app/game-clock.ts'), restorers = []
  if (world !== window.testStore.getWorld()) throw Error('Scene/store identity mismatch')
  const vault = world.shrines.find(s => s.kind === 'vault' && s.reward === 'temple')
  if (!vault || world.outcome.level !== 3) throw Error('Authored Mission 3 Temple Vault required')
  const evidence = window.vaultEvidence = { vaultId: vault.id, giftId: null, arm: 'preflight',
    turns: 0, frames: 0, pauses: [], stages: {}, samples: [], errors: [], restored: false }
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
  let before = null, pendingRender = null
  wrap(scene.gameClock, 'beforeTurn', original => function (...args) {
    before = observe(state)
    return original.apply(this, args)
  })
  wrap(scene.gameClock, 'afterTurn', original => function (...args) {
    const result = original.apply(this, args)
    evidence.turns++
    observe(() => {
      if (evidence.giftId === null) {
        const gift = world.gifts.find(g => g.reward === 'temple' && g.recipient === world.manaWorld.playerTribe)
        if (gift) evidence.giftId = gift.id
      }
      const after = state()
      if (after.gift && evidence.samples.length < 100) evidence.samples.push(after)
      const arm = evidence.arm
      if (arm === 'preflight' || arm === 'birth' && after.gift ||
          arm === 'retirement' && after.gift?.phase === 0 || arm === 'payout' && after.temple) {
        evidence.arm = null
        evidence.stages[arm] = { beforeTurn: before, afterTurn: after }
        if (!afterCurrentGameTurn(scene.gameClock, () => observe(() => {
          const button = document.querySelector('button[aria-label="Pause game"]')
          if (!(button instanceof HTMLButtonElement) || world.paused) throw Error('Ordinary Pause control unavailable')
          button.click()
          if (!world.paused) throw Error('Ordinary Pause did not take effect synchronously')
          evidence.pauses.push({ stage: arm, turn: world.turn, mechanism: 'public Pause game button after current real turn' })
          pendingRender = arm
        }))) throw Error('Turn boundary no longer active')
      }
    })
    return result
  })
  wrap(scene.renderer, 'render', original => function (...args) {
    const result = original.apply(this, args)
    if (args[0] === scene.scene && args[1] === scene.camera) observe(() => {
      evidence.frames++
      if (pendingRender) {
        evidence.stages[pendingRender].postRender = rendered()
        pendingRender = null
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
