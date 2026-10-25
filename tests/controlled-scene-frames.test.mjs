import test from 'node:test'
import assert from 'node:assert/strict'
import { runSceneFrames } from '../scripts/controlled-scene-frames.mjs'

function fixture() {
  const world = { turn: 0, speed: 1, paused: false }
  const calls = [], yielded = [], seen = []
  const scene = { world, previous: null, animate(timestamp) {
    const elapsed = this.previous === null ? 0 : timestamp - this.previous
    this.previous = timestamp; calls.push(elapsed)
    world.turn += elapsed ? 1 : 0
  } }
  const options = { scene, currentScene: () => scene, currentWorld: () => world,
    until: () => world.turn === 3, onFrame: ({ turn }) => seen.push(turn), frameMs: 10,
    maxFrames: 8, maxTurns: 8, batchFrames: 2, deadline: 100, now: () => 1,
    yieldTask: async () => { yielded.push(calls.length) } }
  return { world, scene, calls, yielded, seen, options }
}

test('original priming consumes no elapsed progress; each frame stops before batch overshoot', async () => {
  const f = fixture(), result = await runSceneFrames(f.options)
  assert.deepEqual(f.calls, [0, 10, 10, 10]); assert.deepEqual(f.seen, [1, 2, 3])
  assert.deepEqual(f.yielded, [3, 4]); assert.equal(result.frames, 3)
  assert.equal(result.suppliedElapsedMilliseconds, 30); assert.equal(result.primed, true)
})
test('separate calls continue from the original previous timestamp without re-priming', async () => {
  const f = fixture(); await runSceneFrames(f.options)
  const result = await runSceneFrames({ ...f.options, until: () => f.world.turn === 4 })
  assert.equal(result.primed, false); assert.equal(result.frames, 1); assert.equal(f.scene.previous, 41)
})
test('a promise is never accepted as a truthy readiness predicate', async () => {
  const f = fixture()
  await assert.rejects(runSceneFrames({ ...f.options, until: async () => false }), /must be synchronous/)
  assert.deepEqual(f.calls, [0])
})
test('frame and object-turn exhaustion fail without extending a goal', async () => {
  for (const budget of [{ maxFrames: 2 }, { maxTurns: 2 }]) {
    const f = fixture()
    await assert.rejects(runSceneFrames({ ...f.options, ...budget }), /goal missed its bound/)
    assert.deepEqual(f.calls, [0, 10, 10])
  }
})
test('an explicitly bounded coastal position attempt can return unmet without hiding its limit', async () => {
  const f = fixture(), result = await runSceneFrames({ ...f.options, maxTurns: 2, requireGoal: false })
  assert.equal(result.reached, false); assert.equal(result.turns, 2)
})
test('abort and Scene/World replacement are detected across browser-task yields', async () => {
  for (const change of ['abort', 'scene', 'world']) {
    const f = fixture(); let abort = false, current = f.scene, world = f.world
    await assert.rejects(runSceneFrames({ ...f.options, currentScene: () => current,
      currentWorld: () => world, aborted: () => abort, yieldTask: async () => {
        if (change === 'abort') abort = true
        if (change === 'scene') current = { ...f.scene }
        if (change === 'world') world = { ...f.world }
      } }), /aborted|ownership changed/)
    assert.equal(f.calls.length, 3)
  }
})
test('normal speed, unpaused commands, positive finite deltas and wall bound stay mandatory', async () => {
  for (const change of [f => { f.world.speed = 0 }, f => { f.world.paused = true },
    f => { f.options.frameMs = NaN }, f => { f.options.frameMs = 0 }, f => { f.options.deadline = 1 }]) {
    const f = fixture(); change(f); await assert.rejects(runSceneFrames(f.options))
    assert.equal(f.calls.length, 0)
  }
})
test('original-frame failures propagate without another step', async () => {
  const f = fixture(), original = f.scene.animate
  f.scene.animate = function (timestamp) { if (this.previous !== null) throw Error('original frame failed'); original.call(this, timestamp) }
  await assert.rejects(runSceneFrames(f.options), /original frame failed/)
  assert.deepEqual(f.calls, [0])
})
test('unexpected automatic elapsed frames during a yield are rejected', async () => {
  const f = fixture()
  await assert.rejects(runSceneFrames({ ...f.options, yieldTask: async () => f.scene.animate(f.scene.previous + 10) }), /Unowned elapsed frame/)
})
