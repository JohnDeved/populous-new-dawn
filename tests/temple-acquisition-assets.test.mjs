import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import art from '../app/original-temple-acquisition.json' with { type: 'json' }
import effects from '../app/original-effects.json' with { type: 'json' }

const hash = value => createHash('sha256').update(value).digest('hex')
const read = path => readFileSync(new URL('../' + path, import.meta.url))
function png(name) {
  const input = read('public/original/' + name + '.png'), blocks = []
  const width = input.readUInt32BE(16), height = input.readUInt32BE(20)
  for (let at = 8; at < input.length;) {
    const size = input.readUInt32BE(at)
    if (input.toString('ascii', at + 4, at + 8) === 'IDAT') blocks.push(input.subarray(at + 8, at + 8 + size))
    at += size + 12
  }
  const raw = inflateSync(Buffer.concat(blocks)), stride = width * 4 + 1
  assert.equal(raw.length, stride * height)
  const pixels = Buffer.alloc(width * height * 4)
  for (let y = 0; y < height; y++) {
    assert.equal(raw[y * stride], 0)
    raw.copy(pixels, y * width * 4, y * stride + 1, (y + 1) * stride)
  }
  return { width, height, pixels }
}
const crop = (image, x, y, width, height) => Buffer.concat(Array.from({ length: height }, (_, row) =>
  image.pixels.subarray(((y + row) * image.width + x) * 4, ((y + row) * image.width + x + width) * 4)))

test('original c inputs remain byte-identical and p preserves every unselected atlas pixel/index', () => {
  assert.equal(hash(read('public/original/atlas.png')), 'fdb5c2af7ca43debb5d943036969df29949773b6b94c0b7ce99ffc5d946b27b0')
  assert.equal(hash(read('public/original/effects.png')), 'dabd1d661b2b7cfe82d3f717f045bccbaa082a34ae0e2b0abf812c7744052a97')
  assert.equal(hash(read('app/original-models.json')), '1665fcc36e57bbb765259ec9b7c1755a6b126db837787c9038ed955c76a8afc5')
  const c = png('atlas'), p = png(art.modelAtlas)
  assert.deepEqual([p.width, p.height], [256, 1024])
  assert.equal(hash(p.pixels), art.modelRgbaSha256)
  assert.deepEqual(art.changedTiles, [92, 93, 94, 95, 100, 101, 102, 103, 108, 123, 127, 160])
  for (let tile = 0; tile < 256; tile++) {
    const a = crop(c, tile % 8 * 32, Math.floor(tile / 8) * 32, 32, 32),
      b = crop(p, tile % 8 * 32, Math.floor(tile / 8) * 32, 32, 32)
    for (let i = 3; i < a.length; i += 4) assert.equal(b[i], a[i])
    if (!art.changedTiles.includes(tile)) assert.deepEqual(b, a, `unchanged tile${tile}`)
    const reference = art.tiles.find(row => row.tile === tile)
    if (reference) {
      assert.equal(hash(a), reference.cRgbaSha256)
      assert.equal(hash(b), reference.pRgbaSha256)
    }
  }
})

test('twelve p sparkle crops retain native dimensions/alpha and pinned DATA-derived RGB', () => {
  const c = png('effects'), p = png(art.sparkleAtlas)
  assert.deepEqual([p.width, p.height], [400, 300])
  assert.equal(hash(p.pixels), art.sparkleRgbaSha256)
  assert.deepEqual(art.frames.map(f => f.source), Array.from({ length: 12 }, (_, i) => 1288 + i))
  for (const f of art.frames) {
    const old = Object.values(effects.animations).flat().find(frame => frame.source === f.source),
      a = crop(c, old.index % 8 * 256, Math.floor(old.index / 8) * 256, old.w, old.h),
      b = crop(p, f.x, f.y, f.w, f.h)
    assert.deepEqual([f.w, f.h], [old.w, old.h])
    assert.equal(hash(b), f.rgbaSha256)
    assert.notEqual(hash(a), hash(b))
    for (let i = 3; i < a.length; i += 4) assert.equal(b[i], a[i])
  }
  assert.deepEqual(art.tints.map(t => [t.selector, t.paletteIndex]), [[-2, 138], [-1, 154], [0, 106], [1, 228], [2, 220]])
})
