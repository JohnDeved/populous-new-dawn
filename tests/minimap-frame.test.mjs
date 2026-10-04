import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'
import artwork from '../app/original-minimap-frame.json' with { type: 'json' }
import { minimapFrameDraws, drawMinimapFrame } from '../app/minimap-frame.ts'

const png = readFileSync(new URL('../public/original/minimap-frame.png', import.meta.url))
const blocks = []
for (let offset = 8; offset < png.length;) {
  const length = png.readUInt32BE(offset), kind = png.toString('ascii', offset + 4, offset + 8)
  if (kind === 'IDAT') blocks.push(png.subarray(offset + 8, offset + 8 + length))
  offset += length + 12
}
const raw = inflateSync(Buffer.concat(blocks)), stride = artwork.width * 4 + 1
assert.equal(raw.length, stride * artwork.height)
for (let y = 0; y < artwork.height; y++) assert.equal(raw[y * stride], 0)
const pixel = (x, y) => raw.subarray(y * stride + x * 4 + 1, y * stride + x * 4 + 5)
const spritePixel = (id, x, y) => pixel(artwork.rects[id].x + x, artwork.rects[id].y + y)

function raster(width, height, viewport) {
  const pixels = Buffer.alloc(width * height * 4), calls = []
  const context = {
    clearRect() { pixels.fill(0) },
    drawImage(atlas, sx, sy, sw, sh, dx, dy, dw, dh) {
      assert.equal(sw, dw); assert.equal(sh, dh)
      calls.push([sx, sy, sw, sh, dx, dy])
      for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
        if (dx + x < 0 || dy + y < 0 || dx + x >= width || dy + y >= height) continue
        const source = pixel(sx + x, sy + y)
        if (source[3]) source.copy(pixels, ((dy + y) * width + dx + x) * 4)
      }
    },
  }
  drawMinimapFrame(context, {}, width, height, viewport)
  assert.equal(context.imageSmoothingEnabled, false)
  return { calls, pixel: (x, y) => pixels.subarray((y * width + x) * 4, (y * width + x + 1) * 4) }
}

test('native descriptor threshold chooses exact small and large corner dimensions', () => {
  assert.deepEqual(artwork.descriptors.large, [690, 694, 691, 696, 0, 697, 692, 695, 693])
  assert.deepEqual(artwork.descriptors.small, [86, 694, 87, 696, 0, 697, 88, 695, 89])
  assert.equal(minimapFrameDraws(80, 96, 512).at(-4).sprite, '86')
  assert.equal(minimapFrameDraws(80, 96, 513).at(-4).sprite, '690')
  assert.deepEqual(minimapFrameDraws(49, 96, 513), [])
  assert.deepEqual(minimapFrameDraws(100, 48, 513), [])
})

test('1x frame overlaps native corners in a 100x96 rectangle, bottom corners last', () => {
  assert.deepEqual(minimapFrameDraws(100, 96, 640), [
    { sprite: '690', x: 0, y: 0, width: 50, height: 49 },
    { sprite: '691', x: 50, y: 0, width: 50, height: 49 },
    { sprite: '692', x: 0, y: 46, width: 50, height: 50 },
    { sprite: '693', x: 50, y: 46, width: 50, height: 50 },
  ])
  const result = raster(100, 96, 640)
  assert.deepEqual(result.pixel(0, 46), spritePixel('692', 0, 0))
  assert.deepEqual(result.pixel(99, 95), spritePixel('693', 49, 49))
})

test('2x and partial tiles retain exact 1:1 corner/edge pixels and a transparent center', () => {
  for (const [width, height] of [[200, 192], [203, 197], [250, 240]]) {
    const result = raster(width, height, 1440)
    for (const [id, dx, dy] of [['690', 0, 0], ['691', width - 50, 0], ['692', 0, height - 50], ['693', width - 50, height - 50]]) {
      const { w, h } = artwork.rects[id]
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        assert.deepEqual(result.pixel(dx + x, dy + y), spritePixel(id, x, y))
      }
    }
    for (let x = 50; x < width - 50; x++) for (let y = 0; y < 3; y++) {
      assert.deepEqual(result.pixel(x, y), spritePixel('694', (x - 50) % 8, y))
      assert.deepEqual(result.pixel(x, height - 3 + y), spritePixel('695', (x - 50) % 8, y))
    }
    assert.deepEqual([...result.pixel(Math.floor(width / 2), Math.floor(height / 2))], [0, 0, 0, 0])
    assert.equal(result.calls.some(([, , w]) => w > 0 && w < 8), true)
  }
})

test('frame is a separate overlay and does not change terrain, markers or click ownership', () => {
  const page = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')
  assert.match(page, /<MinimapFrame key=\{hudSize\} \/>/)
  assert.match(css, /\.minimap-wrap>\.map-frame\{[^}]*pointer-events:none/)
  assert.match(css, /\.minimap-wrap>canvas:not\(\.map-frame\)\{/)
  assert.doesNotMatch(css.match(/\.minimap-wrap>canvas:not\(\.map-frame\)\{[^}]*\}/)[0], /border-radius/)
})
