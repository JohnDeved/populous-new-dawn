// Opt-in failure-first suite: node --test tests/bloodlust-runtime.pending.mjs
// Intentionally outside tests/*.test.mjs, not skipped or marked todo/xfail.
// These assertions must become green through the later runtime implementation.
import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import artwork from '../app/original-bloodlust.json' with { type: 'json' }
import {
  normalBloodlustWorld,
  makeSceneFixture,
  loadSceneFixture,
} from './support/bloodlust-scene.mjs'
import {
  observeBloodlust,
  assertOriginalOverlay,
  expectedOverlay,
  criticalState,
} from '../scripts/lib/bloodlust-acceptance.mjs'

async function withScene(run, options) {
  const world = await normalBloodlustWorld()
  const fixture = await makeSceneFixture(world, options)
  try {
    return await run(
      fixture,
      world.units.find(unit => unit.bloodlust)
    )
  } finally {
    fixture.close()
  }
}

test('prerequisite assets and normal authored acquisition/cast remain intact', async t => {
  const bytes = readFileSync(new URL('../public/original/bloodlust.png', import.meta.url))
  assert.equal(createHash('sha256').update(bytes).digest('hex'), artwork.pngSHA256)
  assert.deepEqual(
    artwork.frames.map(f => f.source),
    Array.from({ length: 10 }, (_, i) => 1478 + i)
  )
  const world = await normalBloodlustWorld()
  assert.equal(world.turn, 1403)
  assert.equal(world.shots.bloodlust, 0)
  assert.equal(world.giftCounts.bloodlust, 1)
  assert.equal(world.shrines.find(s => s.reward === 'bloodlust' && s.x < 0).uses, 1)
  assert.equal(world.units.filter(u => u.bloodlust === 1440).length, 6)
  t.diagnostic(
    'Normal engine path only: authored six Braves walk/pray; Shaman walks/casts. No stock/work/position injection.'
  )
})

test('R1: actual current unit renderer consumes HFX1478 instead of a procedural torus', async t => {
  await withScene(({ scene, render }, unit) => {
    const before = JSON.stringify(scene.world)
    render()
    assert.equal(JSON.stringify(scene.world), before, 'unit renderer must not mutate simulation')
    const observed = observeBloodlust(scene, unit.id)
    t.diagnostic(JSON.stringify(observed))
    assertOriginalOverlay(observed)
  })
})

test('R2: first/second presentation visits and all ten frames follow the existing clock', async t => {
  await withScene(({ scene, render, api }, unit) => {
    scene.world.speed = 0
    const initial = criticalState(scene.world),
      captures = []
    render()
    captures.push(observeBloodlust(scene, unit.id))
    for (let i = 0; i < 20; i++) {
      api.advanceGame(scene.world, scene.gameClock, 1 / 24)
      const before = JSON.stringify(scene.world)
      render()
      assert.equal(JSON.stringify(scene.world), before)
      captures.push(observeBloodlust(scene, unit.id))
    }
    assert.deepEqual(
      criticalState(scene.world),
      initial,
      'presentation alone cannot spend mana, consume stock or RNG'
    )
    assert.deepEqual(
      captures.map(c => c.animationFrame),
      Array.from({ length: 21 }, (_, i) => i)
    )
    t.diagnostic(
      JSON.stringify(
        captures
          .slice(0, 3)
          .map(c => ({ animationFrame: c.animationFrame, uv: c.uv, geometry: c.geometry }))
      )
    )
    assert.deepEqual(
      captures.map(c => c.uv),
      captures.map(c => expectedOverlay(c).uv),
      'HFX1478 at frame0,1479/1480 after actual first/second visits, then wrap10'
    )
    for (const capture of captures) assertOriginalOverlay(capture)
  })
})

test('R3: original dimensions/anchor hold for scaled, unscaled and rotated body poses', async () => {
  for (const scaled of [false, true])
    for (const heading of [0, Math.PI / 2]) {
      await withScene(
        ({ scene, render }, unit) => {
          render()
          const capture = observeBloodlust(scene, unit.id),
            expected = expectedOverlay(capture)
          assert.deepEqual(
            capture.scale,
            [expected.width, expected.height],
            'HFX dimensions, not unit-sized ring'
          )
          assertOriginalOverlay(capture)
        },
        { scaled, heading, depth: 2400, frame: 7 }
      )
    }
})

test('R4: expiry blink follows the person counter, not the global world turn', async t => {
  await withScene(({ scene, render }, unit) => {
    const captures = []
    // Independent presentation boundary fixtures on a clone of the normal-path
    // world; no simulation step or production mutation is used to create them.
    for (const [remaining, counter, globalTurn] of [
      [120, 2, 0],
      [120, 0, 2],
      [128, 2, 2],
      [0, 0, 0],
    ]) {
      unit.bloodlust = remaining
      unit.native.counter = counter
      scene.world.turn = globalTurn
      const before = JSON.stringify(scene.world)
      render()
      assert.equal(JSON.stringify(scene.world), before)
      captures.push(observeBloodlust(scene, unit.id))
    }
    t.diagnostic(
      JSON.stringify(
        captures.map(c => ({ remaining: c.remaining, counter: c.counter, visible: c.visible }))
      )
    )
    assert.deepEqual(
      captures.map(c => c.visible),
      [false, true, true, false],
      'independent person-counter blink boundary'
    )
  })
})

test('rendering, pause and checkpoint migration preserve full world and critical state', async () => {
  await withScene(({ scene, render, api }, unit) => {
    scene.world.paused = true
    const before = JSON.stringify(scene.world),
      critical = criticalState(scene.world)
    for (let i = 0; i < 30; i++) {
      api.advanceGame(scene.world, scene.gameClock, 0.01)
      render()
    }
    assert.equal(JSON.stringify(scene.world), before)
    assert.deepEqual(criticalState(scene.world), critical)
    const saved = structuredClone(scene.world)
    const restored = api.migrateCheckpoint(structuredClone(saved))
    assert.deepEqual(criticalState(restored), critical)
    assert.deepEqual(
      restored.units.find(u => u.id === unit.id),
      unit
    )
    assert.equal(
      JSON.stringify(saved),
      before,
      'migration must not alter its stored checkpoint copy'
    )
  })
})

test('R5: a new scene from a checkpoint reconstructs the original frame without replay', async () => {
  const api = await loadSceneFixture(),
    world = await normalBloodlustWorld()
  const before = criticalState(world),
    restored = api.migrateCheckpoint(structuredClone(world))
  const fixture = await makeSceneFixture(restored, { frame: 0 })
  try {
    fixture.render()
    const unit = restored.units.find(u => u.bloodlust)
    assert.deepEqual(criticalState(restored), before)
    assertOriginalOverlay(observeBloodlust(fixture.scene, unit.id))
    // Existing GameScene starts a new presentation clock after load; this task
    // does not invent global animationFrame/fractional-time persistence.
    fixture.api.advanceGame(restored, fixture.scene.gameClock, 0)
    fixture.render()
    assert.deepEqual(criticalState(restored), before)
  } finally {
    fixture.close()
  }
})

test('render-schedule pairs preserve mana, stock, both RNGs and all simulation data', async () => {
  for (const schedule of [[1 / 30], [1 / 60], [1 / 144], [0.007, 0.08, 0.013]]) {
    await withScene(({ scene, render, api }) => {
      const control = structuredClone(scene.world),
        cc = { animationTime: 0, animationFrame: 0 }
      let remaining = 0.5
      for (let i = 0; remaining > 1e-10; i++) {
        const dt = Math.min(remaining, schedule[i % schedule.length])
        api.advanceGame(scene.world, scene.gameClock, dt)
        api.advanceGame(control, cc, dt)
        render()
        remaining -= dt
      }
      assert.deepEqual(
        scene.world,
        control,
        'rendered and nonrendered copies have identical chronological steps'
      )
      assert.deepEqual(criticalState(scene.world), criticalState(control))
      assert.equal(scene.gameClock.animationFrame, cc.animationFrame)
    })
  }
})
