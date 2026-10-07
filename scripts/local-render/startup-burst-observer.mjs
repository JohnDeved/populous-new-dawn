// Uses the maintained hut-ignition observer's passive renderer ownership contract.
// Read the actual main-scene draw; never invoke render, RAF, a clock or a game action.
export function observeStartupBurstFrames(scene) {
  const world = scene.world, renderer = scene.renderer, original = renderer.render
  const descriptor = Object.getOwnPropertyDescriptor(renderer, 'render')
  const records = [], frames = {}, errors = []
  let closed = false
  const wrapper = function (...args) {
    const result = original.apply(this, args)
    if (closed || args[0] !== scene.scene || args[1] !== scene.camera) return result
    try {
      if (scene.world !== world || window.testSceneRef.current !== scene || window.testStore.getWorld() !== world)
        throw new Error('Observed scene/world identity changed')
      const row = {
        turn: world.turn, rendererFrame: renderer.info.render.frame,
        speed: world.speed, paused: world.paused, gameplay: world.randomState,
        cosmetic: world.cosmeticRandom.randomState,
        sites: world.levelStart.map(({ tribe, phase, timer, counter, stoneTurns }) => ({ tribe, phase, timer, counter, stoneTurns: [...stoneTurns] })),
        particles: world.effects.filter(effect => effect.sprite?.sequence === 'blastTrail' && effect.animation?.speed === 60)
          .map(effect => ({ id: effect.id, team: effect.team, age: effect.age, x: effect.animation.x,
            y: effect.animation.y, h: effect.animation.h, pitch: effect.animation.pitch,
            yaw: effect.animation.yaw, state: effect.animation.state, remaining: effect.animation.remaining })),
      }
      if (!records.length || row.turn !== records.at(-1).turn) {
        if (records.length >= 96) throw new Error('Bounded startup observation exhausted')
        records.push(row)
      }
      const stoneCount = row.sites.flatMap(site => site.stoneTurns).filter(turn => turn !== null).length
      const label = row.turn < 30 && stoneCount === 0 ? 'before' : row.particles.some(particle => particle.age > 0) ? 'burst' :
        row.turn >= 70 && row.particles.length === 0 && stoneCount === 8 && row.sites.every(site => site.phase === 4) ? 'after' : null
      if (label && !frames[label]) frames[label] = { sample: row, png: renderer.domElement.toDataURL('image/png') }
    } catch (error) {
      if (errors.length < 8) errors.push(String(error?.stack ?? error))
    }
    return result
  }
  renderer.render = wrapper
  return {
    status: () => ({ before: !!frames.before, burst: !!frames.burst, after: !!frames.after, errors: [...errors] }),
    read: () => structuredClone({ records, frames, errors }),
    close() {
      if (closed) return
      closed = true
      if (renderer.render !== wrapper) throw new Error('Renderer observer ownership changed')
      if (descriptor) Object.defineProperty(renderer, 'render', descriptor)
      else delete renderer.render
    },
  }
}
