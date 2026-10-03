import assert from 'node:assert/strict'
import test from 'node:test'
import { captureHutFirstVisits } from './support/hut-smoke-scene.mjs'

test('ordinary Mission2 admission includes the new smoke root in that turn’s effect visit', async () => {
  const { event, roots } = await captureHutFirstVisits()
  assert.equal(event.building, 72)
  assert.equal(event.residents.length, 1)
  assert.equal(event.level, 3)
  assert.ok(event.turn > 0)
  // 0040c4e0 -> 004edbd0 -> 0050c150, then the ordinary secondary pass
  // 004ec924 -> 004ed700 -> 0050a750 -> 0050c260. The initializer starts at
  // 16; the allocation turn is already processor visit 1, leaving 15.
  assert.deepEqual(
    roots,
    Array.from({ length: 16 }, (_, visit) => ({
      lifetime: 15 - visit,
      visible: visit < 15,
      mode: 'partial',
    }))
  )
})

// These controlled callbacks isolate before-/after-building turn ordering;
// the first test above supplies the no-injection authored Mission2 route.
const { fullHutScene, naturalHutAdmission } = await import('./support/hut-smoke-scene.mjs')
const { createHutOccupancySmoke, reconcileHutOccupancySmoke, completeHutSmokeAllocationVisit } =
  await import('../app/hut-occupancy-smoke.ts')
const { afterCurrentGameTurn, advanceGame } = await import('../app/game-clock.ts')
const { createWorld } = await import('../app/model.ts')

test('pre-building occupancy removal receives one first visit, including counter wrap', async () => {
  const fixture = await fullHutScene()
  const { scene, api, hut, residents, smoke, render, close } = fixture
  try {
    // A beforeTurn callback models the ordering of pre-building effect release.
    // It invokes the real release command, not a resident/count assignment.
    scene.gameClock.beforeTurn = () => {
      scene.gameClock.beforeTurn = undefined
      const before = hut.counter
      scene.world.selected = [residents[0].id]
      api.command(scene.world, { x: 9, z: 30 })
      assert.equal(hut.counter, before)
      assert.equal(smoke.state.root.mode, 'partial')
      assert.equal(
        smoke.state.root.lifetime,
        16,
        'pending building visit must not be counted early'
      )
    }
    api.advanceGame(scene.world, scene.gameClock, 1 / 12)
    render()
    assert.equal(smoke.state.root.lifetime, 15)
    const state = createHutOccupancySmoke(255, 0, 3, 0)
    reconcileHutOccupancySmoke(state, 1, 3, 0)
    completeHutSmokeAllocationVisit(state, state.root, 255, 0)
    assert.equal(state.root.lifetime, 16, 'wrapped pending counter delta owns its first visit')
  } finally {
    close()
  }
})

test('out-of-turn allocation survives pause; commands while paused remain rejected', async () => {
  for (const paused of [false, true]) {
    const fixture = await fullHutScene()
    const { scene, api, residents, smoke, render, close } = fixture
    try {
      scene.world.paused = paused
      scene.world.selected = [residents[0].id]
      if (paused) {
        assert.equal(api.command(scene.world, { x: 9, z: 30 }), false)
        assert.equal(smoke.state.root.mode, 'full', 'paused command must not release a resident')
        scene.world.paused = false
      }
      assert.equal(api.command(scene.world, { x: 9, z: 30 }), true)
      assert.equal(smoke.state.root.lifetime, 16)
      scene.world.paused = paused
      for (let frame = 0; frame < 3; frame++) render()
      assert.equal(smoke.state.root.lifetime, 16)
      if (paused) {
        api.advanceGame(scene.world, scene.gameClock, 1)
        render()
        assert.equal(smoke.state.root.lifetime, 16)
        scene.world.paused = false
      }
      api.advanceGame(scene.world, scene.gameClock, 1 / 12)
      render()
      assert.equal(smoke.state.root.lifetime, 15)
    } finally {
      close()
    }
  }
  const reconstructed = createHutOccupancySmoke(77, 1, 3, 19)
  assert.equal(
    reconstructed.root.lifetime,
    16,
    'reconstruction is not a proved native allocation visit'
  )
})

test('new-root completion is identity-scoped and one-shot for same-turn transitions', () => {
  const state = createHutOccupancySmoke(33, 3, 3, 0)
  reconcileHutOccupancySmoke(state, 2, 3, 0)
  const replaced = state.root
  reconcileHutOccupancySmoke(state, 3, 3, 0)
  reconcileHutOccupancySmoke(state, 1, 3, 0)
  const retained = state.root
  completeHutSmokeAllocationVisit(state, replaced, 33, 33)
  assert.equal(retained.lifetime, 16)
  reconcileHutOccupancySmoke(state, 2, 3, 0)
  completeHutSmokeAllocationVisit(state, retained, 33, 33)
  completeHutSmokeAllocationVisit(state, retained, 33, 33)
  assert.equal(state.root, retained)
  assert.equal(retained.lifetime, 15)
})

test('batched turns and repeated rendering preserve the native first lifetime', async () => {
  const fixture = await naturalHutAdmission()
  const { scene, api, hut, render, close } = fixture
  try {
    const root = scene.buildingMeshes.get(hut.id).userData.hutOccupancySmoke.state.root
    assert.equal(root.lifetime, 15)
    for (let frame = 0; frame < 5; frame++) render()
    assert.equal(root.lifetime, 15)
    api.advanceGame(scene.world, scene.gameClock, 3 / 12)
    render()
    assert.equal(root.lifetime, 12)
  } finally {
    close()
  }
})

test('turn completion callbacks are clock-specific and are discarded on a failed turn', () => {
  const world = createWorld()
  const calls = []
  const other = { animationTime: 0, animationFrame: 0 }
  const clock = {
    animationTime: 0,
    animationFrame: 0,
    beforeTurn() {
      assert.equal(
        afterCurrentGameTurn(clock, () => calls.push('current')),
        true
      )
      assert.equal(
        afterCurrentGameTurn(other, () => calls.push('other')),
        false
      )
    },
    afterTurn() {
      calls.push('after')
    },
  }
  assert.equal(
    afterCurrentGameTurn(clock, () => calls.push('outside')),
    false
  )
  advanceGame(world, clock, 1 / 12)
  assert.deepEqual(calls, ['after', 'current'])
  assert.equal(
    afterCurrentGameTurn(clock, () => calls.push('outside')),
    false
  )
  clock.beforeTurn = () => {
    afterCurrentGameTurn(clock, () => calls.push('discarded'))
    throw new Error('controlled observer failure')
  }
  assert.throws(() => advanceGame(world, clock, 1 / 12), /controlled observer failure/)
  assert.equal(
    afterCurrentGameTurn(clock, () => calls.push('outside')),
    false
  )
  assert.deepEqual(calls, ['after', 'current'])
  calls.length = 0
  clock.beforeTurn = () => {
    const expectedTurn = world.turn + 1
    assert.equal(
      afterCurrentGameTurn(clock, () => {
        assert.equal(world.turn, expectedTurn, 'callback must flush before the next catch-up turn')
        calls.push(`current:${world.turn}`)
      }),
      true
    )
  }
  clock.afterTurn = () => calls.push(`after:${world.turn}`)
  const before = world.turn
  advanceGame(world, clock, 3 / 12)
  assert.deepEqual(
    calls,
    [1, 2, 3].flatMap(offset => [`after:${before + offset}`, `current:${before + offset}`])
  )
  assert.equal(
    afterCurrentGameTurn(clock, () => calls.push('outside')),
    false
  )
})
