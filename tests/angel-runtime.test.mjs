import assert from 'node:assert/strict'
import test from 'node:test'
import { createGameStore, CHECKPOINT_VERSION } from '../app/game-store.ts'
import { createAngel } from '../app/world-effects.ts'
import { animateLiveObjects } from '../app/live-people.ts'
import { advanceGame } from '../app/game-clock.ts'
import { requestAngelBase, validAngelPresentation } from '../app/angel-presentation.ts'

function fixture() {
  const store = createGameStore(), world = store.getWorld()
  world.manaWorld.loadFlags |= 0x200
  const angel = createAngel(world, 'blue', { x: 0, z: 0 })
  return { store, world, angel }
}

test('live presentation owner displays phase0 before counter4 and respects both pauses and logical-only calls', () => {
  const { world, angel } = fixture()
  assert.equal(angel.angel.presentation.f1, 0)
  animateLiveObjects(world, 'logical')
  assert.equal(angel.angel.presentation.f1, 0)
  animateLiveObjects(world)
  assert.deepEqual([angel.angel.presentation.displayed.from, angel.angel.presentation.displayed.frame, angel.angel.presentation.f1], [70, 0, 4])
  const snapshot = structuredClone(angel)
  world.paused = true
  animateLiveObjects(world)
  advanceGame(world, { animationTime: 0, animationFrame: 0 }, 1)
  assert.deepEqual(angel, snapshot)
  world.paused = false
  world.land.landFlags |= 2
  animateLiveObjects(world)
  assert.deepEqual(angel, snapshot)
  world.land.landFlags &= ~2
  animateLiveObjects(world)
  assert.deepEqual([angel.angel.presentation.displayed.frame, angel.angel.presentation.f1], [1, 8])
})

test('30/60/120/144Hz and irregular schedules reach the same live Angel state', () => {
  const { world: seed } = fixture()
  const results = []
  for (const schedule of [[1 / 30], [1 / 60], [1 / 120], [1 / 144], [0.007, 0.061, 0.013, 0.1, 0.019]]) {
    const world = structuredClone(seed), clock = { animationTime: 0, animationFrame: 0 }
    let elapsed = 0, index = 0
    while (elapsed < 2 - 1e-10) {
      const seconds = Math.min(schedule[index++ % schedule.length], 2 - elapsed)
      advanceGame(world, clock, seconds)
      elapsed += seconds
    }
    const angel = world.effects.find(effect => effect.angel)
    assert.ok(angel)
    results.push({ turn: world.turn, angel: structuredClone(angel.angel), x: angel.x, z: angel.z, animationFrame: clock.animationFrame })
  }
  for (const result of results.slice(1)) assert.deepEqual(result, results[0])
  assert.equal(results[0].animationFrame, 48)
})

test('current checkpoints preserve displayed and next states in both loops and every transition stage', async () => {
  const { store, angel } = fixture()
  const id = angel.id
  for (const base of [62, 69]) {
    for (let stage = 0; stage < 8; stage++) {
      let world = store.getWorld(), active = world.effects.find(effect => effect.id === id)
      requestAngelBase(active.angel.presentation, base)
      animateLiveObjects(world)
      const before = structuredClone(active.angel.presentation)
      await store.saveCheckpoint(false)
      assert.equal(store.loadCheckpoint(), true)
      world = store.getWorld()
      active = world.effects.find(effect => effect.id === id)
      assert.deepEqual(active.angel.presentation, before)
      const twin = structuredClone(world)
      animateLiveObjects(world)
      animateLiveObjects(twin)
      assert.deepEqual(world.effects.find(effect => effect.id === id).angel.presentation, twin.effects.find(effect => effect.id === id).angel.presentation)
    }
  }
})

test('live death entry plus countdown retain every displayed scale and expire at the unchanged turn', () => {
  const { world, angel } = fixture()
  angel.angel.lifetime = 1
  const clock = { animationTime: 0, animationFrame: 0 }, scales = []
  const entry = world.turn + 1
  for (let turn = 0; turn < 16; turn++) {
    advanceGame(world, clock, 1 / 12)
    assert.ok(world.effects.includes(angel))
    assert.equal(angel.angel.phase, 'dying')
    assert.equal(angel.angel.timer, 16 - turn)
    scales.push(angel.angel.presentation.displayed.scale)
  }
  advanceGame(world, clock, 1 / 12)
  assert.equal(world.turn, entry + 16)
  assert.ok(!world.effects.includes(angel))
  assert.deepEqual(scales, [160, 150, 140, 130, 120, 110, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10])
})

test('missing or malformed presentation is rejected without replacing a valid memory checkpoint', async () => {
  assert.equal(CHECKPOINT_VERSION, 4)
  const { store, angel } = fixture()
  await store.saveCheckpoint(false)
  const valid = structuredClone(angel.angel.presentation)
  assert.equal(validAngelPresentation(valid), true)
  for (const alter of [
    state => { state.displayed = null },
    state => { state.displayed.from = 0 },
    state => { state.displayed.duration = 0 },
    state => { state.f1 = NaN },
    state => { state.renderFlags |= 0x1000 },
  ]) {
    const malformed = structuredClone(valid)
    alter(malformed)
    assert.equal(validAngelPresentation(malformed), false)
  }
  delete angel.angel.presentation
  await assert.rejects(store.saveCheckpoint(false), /incompatible/)
  assert.equal(store.loadCheckpoint(), true)
  assert.deepEqual(store.getWorld().effects.find(effect => effect.angel).angel.presentation, valid)
})

test('obsolete v3 stored data is reported incompatible without writes or deletion', async () => {
  const { world } = fixture()
  const saved = { version: 3, world: structuredClone(world) }, before = structuredClone(saved)
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB')
  const writes = []
  const database = {
    transaction() {
      const transaction = new EventTarget()
      transaction.objectStore = () => ({
        get: key => ({ result: key === 'latest' ? structuredClone(saved) : undefined }),
        put: (...args) => writes.push(args),
        delete: (...args) => writes.push(args),
      })
      queueMicrotask(() => transaction.dispatchEvent(new Event('complete')))
      return transaction
    },
  }
  Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: {
    open() {
      const request = new EventTarget()
      request.result = database
      queueMicrotask(() => request.dispatchEvent(new Event('success')))
      return request
    },
  } })
  try {
    const fresh = await import('../app/game-store.ts?angel-v3-rejection')
    const store = fresh.createGameStore(), active = store.getWorld()
    assert.equal(await store.restoreCheckpoint(), false)
    assert.equal(store.getCheckpointReadStatus(), 'incompatible')
    assert.equal(store.getWorld(), active)
    assert.deepEqual(saved, before)
    assert.deepEqual(writes, [])
  } finally {
    if (previous) Object.defineProperty(globalThis, 'indexedDB', previous)
    else delete globalThis.indexedDB
  }
})
