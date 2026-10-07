import effects from '../../app/original-effects.json' with { type: 'json' }

// Observe actual main-scene render returns. Never invoke a renderer, advance a
// clock, cancel RAF, pause the game, or change an entity from this observer.
export function observeHutIgnitionFrames(scene, hutId) {
  const world = scene.world, renderer = scene.renderer, original = renderer.render
  const descriptor = Object.getOwnPropertyDescriptor(renderer, 'render')
  const records = [], frames = {}, errors = []
  let ordinal = 0, closed = false
  const sample = () => {
    if (scene.world !== world || window.testSceneRef.current !== scene || window.testStore.getWorld() !== world)
      throw Error('Observed scene/world identity changed')
    const hut = world.buildings.find(building => building.id === hutId)
    if (!hut) throw Error('Observed hut disappeared')
    const owner = world.secondaryEffects, record = owner.roots[hutId]
    const root = record?.state.root, group = scene.buildingMeshes.get(hutId)
    const smoke = group?.userData.hutOccupancySmoke
    const sequence = root ? (root.mode === 'full' ? 'hutSmokeFull' : 'hutSmokePartial') : null
    const frame = root ? ((owner.animationFrame - root.frameStart) % 16 + 16) % 16 : null
    return {
      ordinal: ++ordinal, at: performance.now(), rendererFrame: renderer.info.render.frame,
      turn: world.turn, speed: world.speed, paused: world.paused, status: world.status,
      hut: { id: hut.id, level: hut.level, progress: hut.progress, hp: hut.hp,
        state: hut.damageState?.state ?? null, timer: hut.burn?.remaining ?? null },
      residents: world.units.filter(unit => unit.inside === hutId && unit.hp > 0).map(unit => unit.id),
      admissionSlots: [...(hut.admission?.occupants ?? [])],
      rootRecord: structuredClone(record ?? null),
      roots: owner.order.flatMap(slot => {
        const entry = owner.slots[slot]
        return entry?.kind === 'hutRoot' && entry.building === hutId ? [{ slot, ...structuredClone(entry) }] : []
      }),
      children: owner.order.flatMap(slot => {
        const entry = owner.slots[slot]
        if (entry?.kind !== 'hutPuff') return []
        const mesh = scene.hutSmokePuffs.get(entry.serial)
        return [{ slot, ...structuredClone(entry), rendered: !!mesh?.visible }]
      }),
      rootVisible: !!smoke?.group.visible,
      asset: sequence === null ? null : { sequence, frame, ...effects.animations[sequence][frame] },
      atlasTransform: smoke?.sprite.userData.atlasTransform?.toArray() ?? null,
      spriteSize: smoke ? [smoke.sprite.scale.x, smoke.sprite.scale.y] : null,
      animationFrame: owner.animationFrame, primaryPhase: world.effectCounter,
      cosmetic: world.cosmeticRandom.randomState, gameplay: world.randomState,
    }
  }
  const retainFrame = (label, row) => {
    // Called synchronously after the actual draw, while its backbuffer exists.
    // This readback records a frame that was rendered even if ordinary Pause
    // arrives later; it does not force the engine to draw an intermediate turn.
    frames[label] = { sample: row, png: renderer.domElement.toDataURL('image/png') }
  }
  const wrapper = function (...args) {
    const result = original.apply(this, args)
    if (closed || args[0] !== scene.scene || args[1] !== scene.camera) return result
    try {
      const row = sample(), previous = records.at(-1)
      if (!previous || row.turn !== previous.turn || row.paused !== previous.paused) {
        if (records.length >= 256) throw Error('Bounded ignition observation exhausted')
        records.push(row)
      }
      if (!frames.before && row.rootVisible && row.rootRecord?.state.root?.mode === 'full' && row.hut.timer === null)
        retainFrame('before', row)
      if (!frames.burning && row.hut.state === 4) retainFrame('burning', row)
      if (frames.burning && !frames.evacuated && row.hut.state === 4 && !row.residents.length)
        retainFrame('evacuated', row)
    } catch (error) {
      if (errors.length < 8) errors.push(String(error?.stack ?? error))
    }
    return result
  }
  renderer.render = wrapper
  return {
    status: () => ({ before: !!frames.before, burning: !!frames.burning,
      evacuated: !!frames.evacuated, errors: [...errors] }),
    read: () => structuredClone({ records, frames, errors }),
    close() {
      if (closed) return
      closed = true
      if (renderer.render !== wrapper) throw Error('Renderer observer ownership changed')
      if (descriptor) Object.defineProperty(renderer, 'render', descriptor)
      else delete renderer.render
    },
  }
}
