import assert from 'node:assert/strict'
import test from 'node:test'
import { fullHutScene, makeHutSmokeScene } from './support/hut-smoke-scene.mjs'
import { migrateCheckpoint } from '../app/game-store.ts'
import effects from '../app/original-effects.json' with { type: 'json' }

const puffs = world => world.secondaryEffects.order
  .map(slot => world.secondaryEffects.slots[slot]).filter(entry => entry.kind === 'hutPuff')

// Supporting actual controller/scene binding; the rendered browser check supplies
// the fresh mission construction path with shipped pointer and menu controls.
test('real command8 full occupancy emits an original-frame child without scene-owned RNG', async () => {
  const fixture = await fullHutScene()
  const { scene, api, render, close, hut } = fixture
  let restoredFixture
  try {
    assert.equal(scene.world.units.filter(u => u.inside === hut.id).length, 3)
    let emission
    for (let visit = 0; visit < 512 && !emission; visit++) {
      api.advanceGame(scene.world, scene.gameClock, 1 / 12)
      render()
      emission = puffs(scene.world)[0]
    }
    assert.ok(emission, 'deterministic original-root gate must eventually emit for this real cohort')
    assert.equal(emission.lifetime, 16, 'the allocation turn does not process the new child')
    assert.equal(scene.hutSmokePuffs.size, puffs(scene.world).length)
    const mesh = scene.hutSmokePuffs.get(emission.serial)
    assert.equal(mesh.name, 'hut-smoke-puff')
    assert.equal(mesh.children[0].scale.x, 32)
    assert.equal(mesh.children[0].scale.y, 64)
    const frame = effects.animations.hutSmokePartial[
      (scene.world.secondaryEffects.animationFrame - emission.frameStart) % 16
    ]
    assert.deepEqual(mesh.children[0].userData.atlasTransform.toArray(), [
      32 / effects.width, 64 / effects.height,
      ((frame.index % 8) * 256) / effects.width,
      1 - (Math.floor(frame.index / 8) * 256 + 64) / effects.height,
    ])
    assert.equal(mesh.position.y, emission.position.h / 45)
    const before = structuredClone(scene.world.secondaryEffects), rng = scene.world.cosmeticRandom.randomState
    for (let i = 0; i < 8; i++) render()
    assert.deepEqual(scene.world.secondaryEffects, before, 'rendering must not age or allocate smoke')
    assert.equal(scene.world.cosmeticRandom.randomState, rng)
    scene.world.paused = true
    api.advanceGame(scene.world, scene.gameClock, 2)
    render()
    assert.deepEqual(scene.world.secondaryEffects, before)
    scene.world.paused = false

    const restored = migrateCheckpoint(structuredClone(scene.world))
    const savedChild = puffs(restored).find(child => child.serial === emission.serial)
    assert.deepEqual(savedChild, emission)
    restoredFixture = await makeHutSmokeScene(restored)
    restoredFixture.render()
    assert.ok(restoredFixture.scene.hutSmokePuffs.has(emission.serial))
    assert.equal(savedChild.lifetime, 16, 'scene reconstruction is not another visit')
    for (let visit = 1; visit <= 16; visit++) {
      restoredFixture.api.advanceGame(restored, restoredFixture.scene.gameClock, 1 / 12)
      restoredFixture.render()
      assert.equal(puffs(restored).some(child => child.serial === emission.serial), visit < 16)
    }
  } finally {
    if (restoredFixture) {
      for (const group of restoredFixture.scene.hutSmokePuffs.values())
        restoredFixture.scene.releaseGroup(group)
      restoredFixture.close()
    }
    for (const group of scene.hutSmokePuffs.values()) scene.releaseGroup(group)
    close()
  }
})
