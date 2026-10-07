import test from 'node:test'
import assert from 'node:assert/strict'
import { observeHutIgnitionFrames } from '../scripts/local-render/hut-smoke-ignition-observer.mjs'

function fixture(original, own = false, readback = () => 'data:image/png;base64,AA==') {
  const prototype = { render: original }, renderer = Object.create(prototype)
  if (own) Object.defineProperty(renderer, 'render', { value: original, writable: true, configurable: true, enumerable: false })
  renderer.info = { render: { frame: 9 } }
  renderer.domElement = { toDataURL: readback }
  const world = {
    buildings: [{ id: 7, level: 1, progress: 1, hp: 100 }], units: [],
    secondaryEffects: { roots: {}, order: [], slots: [], animationFrame: 0 },
    turn: 10, speed: 1, paused: true, status: 'playing', effectCounter: 3,
    cosmeticRandom: { randomState: 123 }, randomState: 456,
  }
  const scene = { world, renderer, scene: {}, camera: {}, buildingMeshes: new Map(), hutSmokePuffs: new Map() }
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
    observer = observeHutIgnitionFrames(scene, 7)
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
    observer = observeHutIgnitionFrames(f.scene, 7)
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
    observer = observeHutIgnitionFrames(f.scene, 7)
    f.world.buildings[0].damageState = { state: 4 }
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
    observer = observeHutIgnitionFrames(f.scene, 7)
    f.renderer.render = replacement
    assert.throws(() => observer.close(), /ownership changed/)
    assert.equal(f.renderer.render, replacement)
    observer.close(); assert.equal(f.renderer.render, replacement)
  } finally { f.restoreWindow() }
})
