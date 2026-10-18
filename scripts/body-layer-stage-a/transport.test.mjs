import test from 'node:test'
import assert from 'node:assert/strict'
import { checkpointCodec } from '../tutorial-browser/checkpoint-codec.mjs'
import { packObservation, unpackObservation } from './transport.mjs'

test('gzip observation transport preserves every encoded edge, alias, pixel and metadata field', async () => {
  const shared = { v: -0 }
  const world = { shared, alias: shared, n: NaN, p: Infinity, m: -Infinity, u: undefined }
  world.self = world
  const pixels = Buffer.from(Array.from({ length: 4096 }, (_, i) => i % 256))
  const old = {
    state: checkpointCodec(world),
    initialState: checkpointCodec({ world }),
    pixels: pixels.toString('base64'),
    width: 32,
    height: 32,
    extra: { target: undefined, center: [-0, NaN] },
    memory: { unknown: undefined },
    step: 1,
  }
  const packed = await packObservation(old, checkpointCodec)
  const decoded = unpackObservation(packed, checkpointCodec)
  assert.deepEqual(decoded, old)
  assert.deepEqual(Buffer.from(decoded.pixels, 'base64'), pixels)
  const restored = checkpointCodec(decoded.state, true)
  assert.equal(restored.shared, restored.alias)
  assert.equal(restored.self, restored)
  assert.ok(Object.is(restored.shared.v, -0))
  assert.ok(Number.isNaN(restored.n))
  assert.equal(restored.p, Infinity)
  assert.equal(restored.m, -Infinity)
  assert.ok(Object.hasOwn(restored, 'u'))
  assert.ok(Object.hasOwn(decoded.extra, 'target'))
  assert.ok(Object.is(decoded.extra.center[0], -0))
  for (const alter of [
    p => (p.gzip = p.gzip.slice(0, -8)),
    p => (p.gzip = '!'),
    p => p.rawBytes++,
    p => (p.sha256 = '0'.repeat(64)),
    p => p.compressedBytes++,
    p => (p.rawBytes = 2 ** 30),
  ]) {
    const corrupt = structuredClone(packed)
    alter(corrupt)
    assert.throws(() => unpackObservation(corrupt, checkpointCodec))
  }
})
