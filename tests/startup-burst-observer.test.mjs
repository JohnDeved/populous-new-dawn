import test from 'node:test'
import assert from 'node:assert/strict'
import { observeStartupBurstFrames } from '../scripts/local-render/startup-burst-observer.mjs'

function fixture(original, own = false, readback = () => 'data:image/png;base64,AA==') {
  const prototype = { render: original }, renderer = Object.create(prototype)
  if (own) Object.defineProperty(renderer, 'render', { value: original, writable: true, configurable: true, enumerable: false })
  renderer.info = { render: { frame: 9 } }
  renderer.domElement = { toDataURL: readback }
  const world = {
    levelStart: [{ tribe: 0, phase: 0, timer: 0, counter: 0, stoneTurns: Array(8).fill(null) }], effects: [],
    turn: 10, speed: 1, paused: false, cosmeticRandom: { randomState: 123 }, randomState: 456,
  }
  const scene = { world, renderer, scene: {}, camera: {} }
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window')
  globalThis.window = { testSceneRef: { current: scene }, testStore: { getWorld: () => world } }
  return { scene, renderer, world, restoreWindow() {
    if (previous) Object.defineProperty(globalThis, 'window', previous)
    else delete globalThis.window
  } }
}

test('observer forwards each original render receiver, arguments and exact result without a synthetic call', () => {
  const calls = [], result = {}, original = function (...args) { calls.push({ receiver: this, args }); return result }
  const f = fixture(original), { scene, renderer } = f
  let observer
  try {
    observer = observeStartupBurstFrames(scene)
    assert.equal(calls.length, 0)
    const receiver = {}, trailing = {}, args = [scene.scene, scene.camera, trailing]
    assert.equal(renderer.render.call(receiver, ...args), result)
    assert.equal(calls.length, 1); assert.equal(calls[0].receiver, receiver)
    assert.deepEqual(calls[0].args, args)
    assert.equal(observer.read().records.length, 1)
    assert.equal(renderer.render({}, scene.camera), result)
    assert.equal(calls.length, 2); assert.equal(observer.read().records.length, 1)
    observer.close(); observer.close()
    assert.equal(renderer.render, original)
    assert.equal(Object.hasOwn(renderer, 'render'), false)
  } finally { observer?.close(); f.restoreWindow() }
})

test('observer propagates the exact original render exception and never takes a successful-frame sample', () => {
  const failure = new Error('original render failed'); let calls = 0
  const original = function () { calls++; throw failure }
  const f = fixture(original, true); let observer
  const descriptor = Object.getOwnPropertyDescriptor(f.renderer, 'render')
  try {
    observer = observeStartupBurstFrames(f.scene)
    assert.throws(() => f.renderer.render(f.scene.scene, f.scene.camera), error => error === failure)
    assert.equal(calls, 1); assert.deepEqual(observer.read().records, [])
    assert.deepEqual(observer.read().errors, [])
    observer.close()
    assert.deepEqual(Object.getOwnPropertyDescriptor(f.renderer, 'render'), descriptor)
  } finally { observer?.close(); f.restoreWindow() }
})

test('diagnostic identity and readback errors remain bounded without changing original render results', () => {
  const result = {}; let calls = 0
  const original = () => { calls++; return result }
  const f = fixture(original, true, () => { throw new Error('readback unavailable') }); let observer
  try {
    observer = observeStartupBurstFrames(f.scene)
    assert.equal(f.renderer.render(f.scene.scene, f.scene.camera), result)
    assert.match(observer.read().errors[0], /readback unavailable/)
    assert.deepEqual(observer.read().frames, {})
    window.testSceneRef.current = {}
    for (let n = 0; n < 12; n++) assert.equal(f.renderer.render(f.scene.scene, f.scene.camera), result)
    assert.equal(calls, 13); assert.equal(observer.read().errors.length, 8)
    assert.ok(observer.read().errors.slice(1).every(error => error.includes('identity changed')))
    observer.close(); assert.equal(f.renderer.render, original)
  } finally { observer?.close(); f.restoreWindow() }
})

test('observer refuses to overwrite a later renderer owner during close', () => {
  const original = () => 'original', replacement = () => 'replacement'
  const f = fixture(original); let observer
  try {
    observer = observeStartupBurstFrames(f.scene)
    f.renderer.render = replacement
    assert.throws(() => observer.close(), /ownership changed/)
    assert.equal(f.renderer.render, replacement)
    observer.close(); assert.equal(f.renderer.render, replacement)
  } finally { f.restoreWindow() }
})


test('three captures use the actual same-call state and wait for a moved burst particle', () => {
  const f = fixture(() => {}), observer = observeStartupBurstFrames(f.scene)
  try {
    const draw = () => f.renderer.render(f.scene.scene, f.scene.camera)
    const unchanged = structuredClone(f.world)
    draw()
    assert.deepEqual(f.world, unchanged, 'observation leaves the world untouched')
    assert.equal(observer.read().frames.before.sample.turn, 10)
    f.world.turn = 37
    f.world.levelStart[0].stoneTurns[7] = 37
    f.world.effects.push({ id: 5, age: 0, sprite: { sequence: 'blastTrail' },
      animation: { x: 1, y: 2, h: 3, yaw: 815, pitch: 326, speed: 60, state: 3, remaining: 2 } })
    draw()
    assert.equal(observer.status().burst, false, 'coincident birth points do not show angle-driven motion yet')
    f.world.turn = 38
    f.world.effects[0].age = 1 / 12
    draw()
    assert.equal(observer.read().frames.burst.sample.turn, 38)
    f.world.turn = 70
    f.world.effects[0].age = 0
    f.world.levelStart[0].phase = 4
    f.world.levelStart[0].stoneTurns.fill(37)
    draw()
    assert.equal(observer.status().after, false, 'an age-zero particle tail is not completed startup')
    f.world.effects = []
    draw()
    assert.equal(observer.read().frames.after.sample.turn, 70)
    assert.equal(observer.read().records.length, 4)
    assert.deepEqual(observer.read().errors, [])
  } finally { observer.close(); f.restoreWindow() }
})
