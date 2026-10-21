import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import {
  originalTornadoPixels,
  originalTornadoPairs,
  checkTornadoReadback,
} from '../scripts/lib/tornado-pixel-oracle.mjs'
const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/tornado-original.json', import.meta.url))
)
test('browser oracle independently decodes retained PSFB frame hashes', () => {
  fixture.frames.forEach((frame, index) =>
    assert.equal(
      createHash('sha256').update(originalTornadoPixels(fixture, index)).digest('hex'),
      frame.rgbaSHA256
    )
  )
})
test('readback oracle checks color and fractional alpha, rejecting color-space drift', () => {
  const pairs = originalTornadoPairs(fixture, 0, 4),
    histogram = Object.fromEntries(pairs.map(({ pair }) => [pair.join(','), 10])),
    good = checkTornadoReadback(histogram, pairs)
  assert.equal(good.mismatches, 0)
  assert.ok(good.visible > 0 && good.fractional > 0 && good.transparent > 0)
  assert.equal(checkTornadoReadback({ '255,0,255,255,0,255': 7 }, pairs).mismatches, 7)
  const p = pairs.find(p => p.alpha >= 170 && p.alpha < 255).pair
  const drift = p.map((v, i) => (i % 3 === 0 ? Math.min(255, v + 5) : v))
  assert.equal(checkTornadoReadback({ [drift.join(',')]: 1 }, pairs).mismatches, 1)
})
