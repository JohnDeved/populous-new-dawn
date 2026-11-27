import assert from 'node:assert/strict'
import test from 'node:test'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

test('the ordinary game clock visits lightning drawing during pause without advancing a simulation turn', async () => {
  const { createWorld, advanceGame } = await loadSceneFixture()
  const { lightningDrawVisit } = await import('../app/scene-effects.ts')
  const world = createWorld(1)
  const before = world.randomState
  const point = (x, y) => ({ x: 2048 + 256 * x, y: -2048 + 256 * y, h: 0 })
  const lightning = { segments: [{ from: point(10, 13), to: point(40, 30) }] }
  world.effects = [{ lightning }]
  world.cosmeticRandom.randomState = 1
  world.paused = true
  const scene = {
    container: { clientWidth: 128, clientHeight: 128 },
    view: { project: p => ({ screenX: p.x, screenY: -p.z, flags: 0 }) },
    world,
  }
  const clock = { animationTime: 0, animationFrame: 0, drawVisit: () => lightningDrawVisit(scene) }
  advanceGame(world, clock, 1 / 48)
  assert.equal(world.cosmeticRandom.randomState, 1, 'one half-interval is not a draw visit')
  advanceGame(world, clock, 1 / 48)
  assert.equal(world.cosmeticRandom.randomState, 0xa56708bf, 'real draw branch runs on the paired half-interval')
  assert.equal(world.turn, 0)
  assert.equal(world.randomState, before, 'simulation RNG unchanged')
  assert.equal(clock.animationFrame, 0, 'ordinary animation does not advance with the paused draw visit')
})
