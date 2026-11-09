import assert from 'node:assert/strict'
import test from 'node:test'
import { swampPresentation } from '../app/swamp-presentation.ts'
import { createSwamp, stepSwamp } from '../app/swamp.ts'
import { createNativeTerrain } from '../app/native-terrain.ts'
import { createGameStore } from '../app/game-store.ts'
import { effect } from '../app/model.ts'
import { advanceGame } from '../app/game-clock.ts'
import art from '../app/original-swamp.json' with { type: 'json' }

test('Swamp presentation reads terrain and global animation without changing gameplay', () => {
  const land = createNativeTerrain(new Int16Array(16384).fill(100)),
    game = { randomState: 123 }, swamp = createSwamp({ x: 0, y: 65535, h: -999 }, 0, 255, game),
    before = structuredClone({ swamp, game }), first = swampPresentation(land, swamp, 11, 9)
  assert.equal(first.length, 14)
  assert.ok(first.every(s => s.visible && s.x >= 0 && s.x <= 65535 && s.y >= 0 && s.y <= 65535))
  assert.ok(first.slice(0, 9).every(s => s.h === 68))
  assert.ok(first.slice(9).every(s => s.h === 100))
  assert.deepEqual({ swamp, game }, before)
  assert.deepEqual(swampPresentation(land, { ...swamp, counter: 0, remaining: 1, kills: 9 }, 11, 9), first)
  const next = swampPresentation(land, swamp, 11, 10)
  assert.notDeepEqual(next.slice(0, 9).map(s => s.frame), first.slice(0, 9).map(s => s.frame))
  assert.deepEqual(next.slice(9), first.slice(9))
  for (const variant of [0, 1, 2, 3]) {
    const samples = swampPresentation(land, { ...swamp, variant }, 11, 0)
    assert.deepEqual(samples.slice(0, 9), swampPresentation(land, { ...swamp, variant: 0 }, 11, 0).slice(0, 9))
    assert.deepEqual(samples.slice(9).map(s => art.frames[s.frame].source),
      Array.from({ length: 5 }, (_, i) => 537 + (11 + i * variant) % 12))
  }
  land.cliffs.fill(128)
  assert.ok(swampPresentation(land, swamp, 11, 0).every(s => !s.visible))
  land.cliffs.fill(0)
  land.categories.fill(1)
  assert.ok(swampPresentation(land, swamp, 11, 0).every(s => !s.visible))
})

test('drawing throughout the complete 32000-visit lifetime changes neither expiry nor RNG', () => {
  const land = createNativeTerrain(new Int16Array(16384).fill(100)),
    game = { randomState: 42 }, swamp = createSwamp({ x: 4096, y: 8192, h: 100 }, 0, 3, game),
    state = game.randomState, callbacks = { cell: () => [], kill() {}, remove() {}, sound() {} }
  for (let i = 1; i <= 32000; i++) {
    swamp.counter = (swamp.counter + 1) & 255
    swampPresentation(land, swamp, 42, i * 2)
    assert.equal(stepSwamp(land, swamp, false, callbacks), i < 32000)
  }
  assert.equal(swamp.remaining, 0)
  assert.equal(swamp.kills, 0)
  assert.equal(game.randomState, state)
})

test('four Swamp variants and global frame survive current Save/Load and paused rendering', async () => {
  const store = createGameStore(), w = store.getWorld(), clock = { animationTime: 0, animationFrame: 0 }
  for (let variant = 0; variant < 4; variant++) {
    const fx = effect(w, 'swamp', { x: variant * 8, z: 20 })
    fx.swamp = { ...createSwamp({ x: variant * 2048, y: 12000, h: 50 }, 0, variant, w), variant }
    fx.duration = Infinity
  }
  w.secondaryEffects.animationFrame = 1234
  w.paused = true
  const snapshot = world => world.effects.filter(f => f.swamp).map(f =>
    ({ state: structuredClone(f.swamp), samples: swampPresentation(world.land, f.swamp, f.id, world.secondaryEffects.animationFrame) }))
  const before = snapshot(w), random = w.randomState
  advanceGame(w, clock, 30)
  assert.deepEqual(snapshot(w), before)
  await store.saveCheckpoint()
  assert.equal(store.loadCheckpoint(), true)
  assert.deepEqual(snapshot(store.getWorld()), before)
  assert.equal(store.getWorld().randomState, random)
})

test('elapsed presentation clock gives the same Swamp frame at 30/60/120/144Hz and irregular cadence', () => {
  const run = schedule => {
    const w = createGameStore().getWorld(), clock = { animationTime: 0, animationFrame: 0 },
      swamp = createSwamp({ x: 4096, y: 8192, h: 100 }, 0, 0, w)
    w.speed = 0
    w.paused = false
    let elapsed = 0, i = 0
    while (elapsed < 1) {
      const dt = Math.min(schedule[i++ % schedule.length], 1 - elapsed)
      advanceGame(w, clock, dt)
      elapsed += dt
    }
    return { frame: w.secondaryEffects.animationFrame, samples: swampPresentation(w.land, swamp, 17, w.secondaryEffects.animationFrame) }
  }
  const expected = run([1 / 60])
  assert.equal(expected.frame, 24)
  for (const schedule of [[1 / 30], [1 / 120], [1 / 144], [0.002, 0.04, 0.17, 0.3]])
    assert.deepEqual(run(schedule), expected)
})
