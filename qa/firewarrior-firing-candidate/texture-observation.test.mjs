// Fake GL verifies observer transparency and acceptance guards, not browser/GPU behavior.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { installTextureObserver } from './texture-observation.mjs'
import { requireUnitTexture, requireSameUnitTexture } from './texture-assertions.mjs'

function fixture() {
  const calls = [], result = {}, bindings = new Map(), immutable = new WeakMap()
  let now = 0, failure = null
  class Image {
    width = 2048; height = 8128; naturalWidth = 2048; naturalHeight = 8128
    complete = true; currentSrc = 'http://127.0.0.1:4401/original/unit-layers.png'
  }
  class GL {
    TEXTURE_2D = 3553; TEXTURE_BINDING_2D = 32873; TEXTURE_IMMUTABLE_FORMAT = 37167; TEXTURE_IMMUTABLE_LEVELS = 33503; activeUnit = 0
    getParameter(name) { assert.equal(name, this.TEXTURE_BINDING_2D); return bindings.get(this.activeUnit) ?? null }
    getTexParameter(target, name) {
      assert.equal(target, this.TEXTURE_2D)
      const levels = immutable.get(bindings.get(this.activeUnit)) ?? 0
      if (name === this.TEXTURE_IMMUTABLE_FORMAT) return levels > 0
      assert.equal(name, this.TEXTURE_IMMUTABLE_LEVELS); return levels
    }
    getError() { throw Error('Observer must never consume the GL error queue') }
    bindTexture(...args) {
      calls.push({ method: 'bindTexture', receiver: this, args })
      if (failure) throw failure
      bindings.set(this.activeUnit, args[1]); return result
    }
    texStorage2D(...args) {
      const value = invoke(this, 'texStorage2D', args)
      immutable.set(bindings.get(this.activeUnit), args[1]); return value
    }
    texImage2D(...args) { return invoke(this, 'texImage2D', args) }
    texSubImage2D(...args) { return invoke(this, 'texSubImage2D', args) }
  }
  function invoke(receiver, method, args) {
    calls.push({ method, receiver, args })
    if (failure) throw failure
    return result
  }
  const realm = { WebGL2RenderingContext: GL, HTMLImageElement: Image, performance: { now: () => now } }
  const originals = Object.fromEntries(['bindTexture', 'texStorage2D', 'texImage2D', 'texSubImage2D']
    .map(name => [name, Object.getOwnPropertyDescriptor(GL.prototype, name)]))
  installTextureObserver(realm)
  const gl = new GL(), image = new Image(), texture = {}
  const observer = realm.firewarriorTextureObserver
  const upload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texStorage2D(gl.TEXTURE_2D, 1, 35907, 2048, 8128)
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 6408, 5121, image)
  }
  const sample = () => ({ contextLost: false, isTexture: true, maxTextureSize: 8192, rendererMaxTextureSize: 8192,
    materialCount: 2, sharedMaterialCount: 16, htmlImage: true, imageComplete: true,
    naturalWidth: 2048, naturalHeight: 8128, imageWidth: 2048, imageHeight: 8128,
    mapUuid: 'map', sourceUuid: 'source', textureVersion: 1, sourceVersion: 1, rendererTextureVersion: 1, rendererSourceVersion: 1,
    url: image.currentSrc, observation: observer.read(gl, texture, image) })
  return { GL, gl, image, texture, realm, observer, calls, originals, result, upload, sample,
    setTime(value) { now = value }, setFailure(value) { failure = value } }
}

test('each original receives unchanged receiver, arguments and object identity exactly once', () => {
  const f = fixture(), cases = [
    ['bindTexture', [3553, f.texture]], ['texStorage2D', [3553, 1, 35907, 2048, 8128]],
    ['texImage2D', [3553, 0, 35907, 6408, 5121, f.image]],
    ['texSubImage2D', [3553, 0, 0, 0, 6408, 5121, f.image]],
  ]
  for (const [method, args] of cases) {
    const before = f.calls.length
    assert.equal(f.gl[method](...args), f.result)
    assert.equal(f.calls.length, before + 1)
    assert.equal(f.calls.at(-1).receiver, f.gl)
    for (const [index, value] of args.entries()) assert.equal(f.calls.at(-1).args[index], value)
  }
  assert.equal(f.observer.read(f.gl, f.texture, f.image).records.length, 3)
})

test('normal allocation and original-image upload pass at an 8192 texture limit', () => {
  const f = fixture(); f.upload()
  assert.ok(requireUnitTexture(f.sample(), [], 'http://127.0.0.1:4401'))
  const before = f.sample(); f.observer.finish()
  assert.ok(requireUnitTexture(f.sample(), ['Unrelated retained warning'], 'http://127.0.0.1:4401'))
  requireSameUnitTexture(before, f.sample())
})

test('current active unit binding, not last bind call, identifies the upload', () => {
  const f = fixture(), other = {}
  f.gl.bindTexture(3553, f.texture)
  f.gl.activeUnit = 1; f.gl.bindTexture(3553, other)
  f.gl.activeUnit = 0; f.gl.texStorage2D(3553, 1, 35907, 2048, 8128)
  assert.equal(f.observer.read(f.gl, f.texture, f.image).records.length, 1)
  assert.equal(f.observer.read(f.gl, other, f.image).records.length, 0)
})

test('original exceptions retain identity and create no successful upload record', () => {
  const f = fixture(), error = new Error('Original failure')
  f.gl.bindTexture(3553, f.texture); f.setFailure(error)
  assert.throws(() => f.gl.texStorage2D(3553, 1, 35907, 2048, 8128), value => value === error)
  assert.equal(f.calls.length, 2)
  const read = f.observer.read(f.gl, f.texture, f.image)
  assert.equal(read.records.length, 0); assert.match(read.failure, /Original texStorage2D threw/)
})

test('invalid receiver still reaches the original once and preserves its exception', () => {
  const f = fixture(), error = new Error('Original invalid receiver')
  f.setFailure(error)
  assert.throws(() => f.gl.texStorage2D.call(null, 3553, 1, 35907, 2048, 8128), value => value === error)
  assert.equal(f.calls.length, 1); assert.equal(f.calls[0].receiver, null)
})

test('observation faults preserve the original return, and fail evidence closed', () => {
  const f = fixture(); f.gl.bindTexture(3553, f.texture)
  f.gl.getParameter = () => { throw Error('Read unavailable') }
  assert.equal(f.gl.texStorage2D(3553, 1, 35907, 2048, 8128), f.result)
  assert.match(f.observer.read(f.gl, f.texture, f.image).failure, /Observation failed/)
})

test('cleanup restores exact owned descriptors without clobbering a replacement', () => {
  const f = fixture(), foreign = () => 'foreign'
  f.GL.prototype.texImage2D = foreign
  const stopped = f.observer.finish()
  assert.match(stopped.failure, /no longer owns texImage2D/)
  assert.equal(f.GL.prototype.texImage2D, foreign)
  for (const name of ['bindTexture', 'texStorage2D', 'texSubImage2D'])
    assert.deepEqual(Object.getOwnPropertyDescriptor(f.GL.prototype, name), f.originals[name])
  f.observer.finish(); assert.equal(f.GL.prototype.texImage2D, foreign)
})

test('record and time bounds stop recording while originals keep running', () => {
  const f = fixture(); f.gl.bindTexture(3553, f.texture)
  for (let i = 0; i < 2050; i++) assert.equal(f.gl.texStorage2D(3553, 1, 35907, 2048, 8128), f.result)
  const read = f.observer.read(f.gl, f.texture, f.image)
  assert.equal(read.records.length, 2048); assert.match(read.failure, /record bound/)
  assert.equal(f.calls.length, 2051)
  const timed = fixture(); timed.setTime(60001); timed.upload()
  assert.match(timed.sample().observation.failure, /bound/); assert.equal(timed.calls.length, 3)
})

for (const [name, mutate] of [
  ['old oversize atlas', s => { s.naturalHeight = 8256 }],
  ['capability disagreement', s => { s.rendererMaxTextureSize = 16384 }],
  ['capability too small', s => { s.maxTextureSize = s.rendererMaxTextureSize = 4096 }],
  ['context loss', s => { s.contextLost = true }],
  ['allocation did not become immutable', s => { s.observation.records[0].immutable = false }],
  ['already allocated texture', s => { s.observation.records[0].immutableBefore = true }],
  ['foreign image identity', s => { s.observation.records[1].image.id++ }],
  ['resized canvas source', s => { s.observation.records[1].image.htmlImage = false }],
  ['resized allocation', s => { s.observation.records[0].width = 2032 }],
  ['resized upload', s => { s.observation.records[1].height = 8192 }],
  ['missing allocation', s => { s.observation.records.shift() }],
  ['extra reallocation', s => { s.observation.records.push(s.observation.records[0]) }],
  ['unsupported upload overload', s => { s.observation.records[1].supported = false }],
  ['uninitialized renderer texture', s => { s.rendererTextureVersion = undefined }],
]) test(`reject ${name}`, () => {
  const f = fixture(); f.upload(); const sample = f.sample(); mutate(sample)
  assert.throws(() => requireUnitTexture(sample, [], 'http://127.0.0.1:4401'))
})

test('resize warning fails even without a unit filename; later texture replacement fails', () => {
  const f = fixture(); f.upload()
  assert.throws(() => requireUnitTexture(f.sample(), ['THREE.WebGLRenderer: Texture has been resized from (2048x8256) to (2032x8192).'], 'http://127.0.0.1:4401'))
  const changed = f.sample(); changed.observation.texture++
  assert.throws(() => requireSameUnitTexture(f.sample(), changed))
})

test('unsupported 9-argument upload is forwarded intact and cannot pass acceptance', () => {
  const f = fixture(); f.gl.bindTexture(3553, f.texture)
  const bytes = new Uint8Array(4), args = [3553, 0, 6408, 1, 1, 0, 6408, 5121, bytes]
  assert.equal(f.gl.texImage2D(...args), f.result)
  assert.equal(f.calls.at(-1).args[8], bytes)
  assert.equal(f.sample().observation.records[0].supported, false)
  assert.throws(() => requireUnitTexture(f.sample(), [], 'http://127.0.0.1:4401'))
})
