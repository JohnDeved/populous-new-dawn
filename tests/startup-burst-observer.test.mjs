import test from 'node:test'
import assert from 'node:assert/strict'
import { observeStartupBurstFrames, armStartupBurstFrames } from '../scripts/local-render/startup-burst-observer.mjs'

function fixture(original, own = false, readback = () => 'data:image/png;base64,AA==') {
  const prototype = { render: original }, renderer = Object.create(prototype)
  if (own) Object.defineProperty(renderer, 'render', { value: original, writable: true, configurable: true, enumerable: false })
  renderer.info = { render: { frame: 9 } }
  renderer.domElement = { toDataURL: readback, isConnected: true }
  const world = {
    levelStart: [{ tribe: 0, phase: 0, timer: 0, counter: 0, stoneTurns: Array(8).fill(null) }], effects: [],
    turn: 10, speed: 1, paused: false, cosmeticRandom: { randomState: 123 }, randomState: 456,
  }
  const scene = { world, renderer, scene: {}, camera: {} }
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
  globalThis.document = { querySelector: () => null }
  globalThis.window = { testSceneRef: { current: scene }, testStore: { getWorld: () => world } }
  return { scene, renderer, world, restoreWindow() {
    if (previous) Object.defineProperty(globalThis, 'window', previous)
    else delete globalThis.window
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument)
    else delete globalThis.document
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
  f.world.land = { heights: new Int16Array(16384).fill(7), flags: new Uint32Array(16384) }
  try {
    const draw = () => f.renderer.render(f.scene.scene, f.scene.camera)
    const unchanged = structuredClone(f.world)
    draw()
    assert.deepEqual(f.world, unchanged, 'observation leaves the world untouched')
    assert.equal(observer.read().frames.before.sample.turn, 10)
    f.world.turn = 37
    f.world.levelStart[0].stoneTurns[7] = 37
    f.world.effects.push({ id: 5, age: 0, height: 3 / 45, sprite: { sequence: 'blastTrail' },
      animation: { x: 1, y: 2, h: 3, yaw: 815, pitch: 326, speed: 60, state: 3, remaining: 2 } })
    const beforeBirthRead = structuredClone(f.world)
    draw()
    assert.deepEqual(f.world, beforeBirthRead, 'particle height and terrain sampling leave the world untouched')
    const [sampled] = observer.read().records.at(-1).particles
    assert.equal(sampled.h, 3)
    assert.equal(sampled.ground, 7)
    assert.equal(sampled.effectHeight, 3 / 45)
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


function discoveryFixture(f) {
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
  const previousObserver = Object.getOwnPropertyDescriptor(globalThis, 'MutationObserver')
  const ref = { current: f.scene }, main = { __reactFiberTest: {
    memoizedState: { memoizedState: ref, next: { memoizedState: window.testStore } },
  } }
  let callback, connected = false, disconnects = 0, loading = true
  f.world.outcome = { level: 1 }
  f.scene.started = false
  f.scene.unitMeshes = new Map()
  f.renderer.domElement.isConnected = false
  globalThis.document = { documentElement: {}, querySelector: selector => selector === 'main' ? main : loading ? {} : null }
  globalThis.MutationObserver = class {
    constructor(fn) { callback = fn }
    observe(target, options) { assert.equal(target, document.documentElement); assert.deepEqual(options, { childList: true, subtree: true }); connected = true }
    disconnect() { connected = false; disconnects++ }
  }
  return { ref, setLoading: value => { loading = value }, notify: () => callback(), connected: () => connected, disconnects: () => disconnects,
    restore() {
      if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument)
      else delete globalThis.document
      if (previousObserver) Object.defineProperty(globalThis, 'MutationObserver', previousObserver)
      else delete globalThis.MutationObserver
    } }
}

test('pre-Mission discovery binds the owned loading scene without starting or drawing it', () => {
  let calls = 0
  const f = fixture(() => { calls++ }), discovery = discoveryFixture(f)
  let observer
  try {
    const before = structuredClone(f.world)
    observer = armStartupBurstFrames()
    assert.equal(observer.status().installed, false)
    assert.equal(discovery.connected(), true)
    f.renderer.domElement.isConnected = true
    discovery.notify()
    assert.equal(observer.status().installed, true)
    assert.deepEqual(observer.status().installation, { level: 1, turn: 10, speed: 1, paused: false, started: false, loading: true, canvasConnected: true, rendererFrame: 9 })
    assert.equal(calls, 0)
    assert.deepEqual(f.world, before)
    assert.equal(discovery.connected(), false)
    f.renderer.render(f.scene.scene, f.scene.camera)
    assert.equal(calls, 1)
    assert.equal(observer.status().before, true)
    const sample = observer.read().frames.before.sample
    assert.equal(sample.loadingOverlay, true)
    assert.equal(sample.canvasConnected, true)
    assert.equal(sample.presented, false, 'a loading-covered draw is not labelled as presented')
  } finally { observer?.close(); discovery.restore(); f.restoreWindow() }
})

test('pre-Mission discovery retains failed guard facts without installing or changing the world', () => {
  const f = fixture(() => {}), discovery = discoveryFixture(f)
  let observer
  try {
    f.world.turn = 38
    f.renderer.domElement.isConnected = true
    const original = f.renderer.render, before = structuredClone(f.world)
    observer = armStartupBurstFrames()
    assert.equal(observer.status().installed, false)
    assert.equal(observer.read().installation.turn, 38)
    assert.equal(observer.read().installation.loading, true)
    assert.match(observer.read().errors[0], /Startup installation preconditions/)
    assert.equal(discovery.connected(), false)
    assert.equal(f.renderer.render, original)
    assert.deepEqual(f.world, before)
  } finally { observer?.close(); discovery.restore(); f.restoreWindow() }
})

test('closing an unbound pre-Mission observer disconnects discovery and prevents later capture', () => {
  const f = fixture(() => {}), discovery = discoveryFixture(f)
  let observer
  try {
    const original = f.renderer.render
    observer = armStartupBurstFrames()
    observer.close()
    f.renderer.domElement.isConnected = true
    discovery.notify()
    assert.equal(observer.status().installed, false)
    assert.equal(discovery.connected(), false)
    assert.equal(f.renderer.render, original)
  } finally { observer?.close(); discovery.restore(); f.restoreWindow() }
})


test('pre-Mission discovery waits for matching refs after the first canvas mutation', () => {
  const f = fixture(() => {}), discovery = discoveryFixture(f)
  let observer
  try {
    observer = armStartupBurstFrames()
    f.renderer.domElement.isConnected = true
    discovery.ref.current = null
    discovery.notify()
    assert.equal(observer.status().installed, false)
    assert.equal(observer.read().installation, null)
    assert.equal(discovery.connected(), true)
    discovery.ref.current = f.scene
    discovery.setLoading(false)
    discovery.notify()
    assert.equal(observer.status().installed, true)
    assert.equal(observer.read().installation.loading, false)
    assert.equal(discovery.connected(), false)
    f.renderer.render(f.scene.scene, f.scene.camera)
    assert.equal(observer.read().frames.before.sample.presented, true)
  } finally { observer?.close(); discovery.restore(); f.restoreWindow() }
})
