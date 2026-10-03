import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { advanceGame } from '../app/game-clock.ts'
import { createGameStore } from '../app/game-store.ts'

for (const [level, phase] of [[1, 0], [2, 1], [3, 1]]) {
  test(`Mission ${level} counts authored primary effects before the opening`, () => {
    const w = createWorld(level)
    assert.equal(w.effectCounter, phase)
    assert.equal(w.effects.length, 0, 'linked authored effects must not become active visuals')
    assert.equal(w.turn, 0)
    tick(w, 13 / 12)
    assert.equal(w.effectCounter, phase, 'turn progression alone cannot advance the seed')
    tick(w, 1 / 12)
    assert.equal(w.effectCounter, phase + (level === 3 ? 2 : 1), 'real opening wave allocations')
  })

  test(`Mission ${level} keeps the allocation phase across pause, checkpoint and restart`, async () => {
    const store = createGameStore()
    store.startMission(level)
    let w = store.getWorld()
    tick(w, 4)
    const phaseAtSave = w.effectCounter
    await store.saveCheckpoint()
    tick(w, 4)
    assert.ok(store.loadCheckpoint())
    w = store.getWorld()
    assert.equal(w.effectCounter, phaseAtSave, 'restore never adds authored allocation again')
    w.paused = true
    tick(w, 1)
    assert.equal(w.effectCounter, phaseAtSave)
    store.restart()
    assert.equal(store.getWorld().effectCounter, phase)
  })
}

test('early-level effect phase remains fixed-turn owned across frame schedules', () => {
  const snapshot = schedule => {
    const w = createWorld(2), clock = { animationTime: 0, animationFrame: 0 }
    for (const elapsed of schedule) advanceGame(w, clock, elapsed)
    return {
      turn: w.turn,
      phase: w.effectCounter,
      gameplayRandom: w.randomState,
      cosmeticRandom: w.cosmeticRandom.randomState,
    }
  }
  const seconds = 6, expected = snapshot([seconds])
  assert.equal(expected.turn, 72)
  for (const hz of [30, 60, 120, 144])
    assert.deepEqual(snapshot(Array(hz * seconds).fill(1 / hz)), expected, `${hz}Hz`)
  assert.deepEqual(snapshot([0.017, 0.5, 0.002, 2.131, 0.05, 3.3]), expected, 'irregular catch-up')
})
