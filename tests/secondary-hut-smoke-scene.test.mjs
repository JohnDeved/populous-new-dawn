import assert from 'node:assert/strict'
import test from 'node:test'
import { fullHutScene, makeHutSmokeScene } from './support/hut-smoke-scene.mjs'
import { migrateCheckpoint } from '../app/game-store.ts'
import effects from '../app/original-effects.json' with { type: 'json' }

const puffs = world =>
  world.secondaryEffects.order
    .map(slot => world.secondaryEffects.slots[slot])
    .filter(entry => entry.kind === 'hutPuff')

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
    assert.ok(
      emission,
      'deterministic original-root gate must eventually emit for this real cohort'
    )
    assert.equal(emission.lifetime, 16, 'the allocation turn does not process the new child')
    assert.equal(scene.hutSmokePuffs.size, puffs(scene.world).length)
    const mesh = scene.hutSmokePuffs.get(emission.serial)
    assert.equal(mesh.name, 'hut-smoke-puff')
    assert.equal(mesh.children[0].scale.x, 32)
    assert.equal(mesh.children[0].scale.y, 64)
    const frame =
      effects.animations.hutSmokePartial[
        (scene.world.secondaryEffects.animationFrame - emission.frameStart) % 16
      ]
    assert.deepEqual(mesh.children[0].userData.atlasTransform.toArray(), [
      32 / effects.width,
      64 / effects.height,
      ((frame.index % 8) * 256) / effects.width,
      1 - (Math.floor(frame.index / 8) * 256 + 64) / effects.height,
    ])
    assert.equal(mesh.position.y, emission.position.h / 45)
    const before = structuredClone(scene.world.secondaryEffects),
      rng = scene.world.cosmeticRandom.randomState
    for (let i = 0; i < 8; i++) render()
    assert.deepEqual(
      scene.world.secondaryEffects,
      before,
      'rendering must not age or allocate smoke'
    )
    assert.equal(scene.world.cosmeticRandom.randomState, rng)
    scene.world.paused = true
    api.advanceGame(scene.world, scene.gameClock, 2)
    render()
    assert.deepEqual(scene.world.secondaryEffects, before)
    scene.world.paused = false

    const restored = migrateCheckpoint(structuredClone(scene.world))
    const savedChild = puffs(restored).find(child => child.serial === emission.serial)
    assert.deepEqual(savedChild, emission)
    const restoredOwner = structuredClone(restored.secondaryEffects)
    restoredFixture = await makeHutSmokeScene(restored)
    restoredFixture.render()
    assert.deepEqual(restored.secondaryEffects, restoredOwner)
    assert.ok(restoredFixture.scene.hutSmokePuffs.has(emission.serial))
    assert.equal(savedChild.lifetime, 16, 'scene reconstruction is not another visit')
    for (let visit = 1; visit <= 16; visit++) {
      restoredFixture.api.advanceGame(restored, restoredFixture.scene.gameClock, 1 / 12)
      restoredFixture.render()
      assert.equal(
        puffs(restored).some(child => child.serial === emission.serial),
        visit < 16
      )
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

test('equal elapsed turns preserve secondary state across frame schedules with no bolt draws', async () => {
  const fixture = await fullHutScene()
  const { scene, api, render, close } = fixture
  try {
    for (let visit = 0; visit < 512 && !puffs(scene.world).length; visit++) {
      api.advanceGame(scene.world, scene.gameClock, 1 / 12)
      render()
    }
    assert.ok(puffs(scene.world).length, 'start with a naturally allocated child')
    const schedules = [...[30, 60, 120, 144].map(hz => [1 / hz]), [0.007, 0.013, 0.28, 0.6, 0.1]]
    const results = schedules.map(schedule => {
      const world = structuredClone(scene.world),
        clock = { ...scene.gameClock }
      let remaining = 4
      for (let frame = 0; remaining > 1e-10; frame++) {
        const dt = Math.min(remaining, schedule[frame % schedule.length])
        api.advanceGame(world, clock, dt)
        remaining -= dt
      }
      return {
        secondary: world.secondaryEffects,
        turn: world.turn,
        cosmetic: world.cosmeticRandom.randomState,
        gameplay: world.randomState,
      }
    })
    for (const result of results) assert.deepEqual(result, results[0])
  } finally {
    for (const group of scene.hutSmokePuffs.values()) scene.releaseGroup(group)
    close()
  }
})

test('legacy missing-history roots bootstrap on first render without inventing past visits', async () => {
  const fixture = await fullHutScene()
  let legacyFixture
  try {
    const { world } = fixture.scene
    const legacy = structuredClone(world)
    delete legacy.secondaryEffects
    migrateCheckpoint(legacy)
    assert.deepEqual(legacy.secondaryEffects.roots, {})
    assert.deepEqual(legacy.secondaryEffects.order, [])
    // This real admission fixture is not on the next periodic building sample.
    assert.notEqual(fixture.hut.counter & 31, 31)
    const withoutRender = structuredClone(legacy)
    fixture.api.advanceGame(withoutRender, { animationTime: 0, animationFrame: 0 }, 1 / 12)
    assert.equal(withoutRender.secondaryEffects.roots[fixture.hut.id], undefined)
    legacyFixture = await makeHutSmokeScene(legacy)
    legacyFixture.render()
    const record = legacy.secondaryEffects.roots[fixture.hut.id]
    const root = legacy.secondaryEffects.slots[record.slot]
    assert.equal(record.state.root.mode, 'full')
    assert.equal(
      root.counter,
      legacy.effectCounter,
      'bootstrap copies the current phase without a visit'
    )
    assert.equal(legacy.secondaryEffects.order.length, 1)
    assert.equal(puffs(legacy).length, 0, 'legacy data contains no historical children')
    const bootstrapped = structuredClone(legacy.secondaryEffects)
    legacyFixture.render()
    assert.deepEqual(legacy.secondaryEffects, bootstrapped)
  } finally {
    legacyFixture?.close()
    for (const group of fixture.scene.hutSmokePuffs.values()) fixture.scene.releaseGroup(group)
    fixture.close()
  }
})
