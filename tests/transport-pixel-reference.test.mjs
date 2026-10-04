import test from 'node:test'
import assert from 'node:assert/strict'
import { composePixelLayers } from '../scripts/transport-pixel-reference.mjs'

const image = colors => ({ width: colors.length, height: 1, data: new Uint8ClampedArray(colors.flat()) })
const black = image([[0, 0, 0, 255]]), white = image([[255, 255, 255, 255]])
const layer = (image, x, y, scale, opacity = 1) => ({ image, source: { x: 0, y: 0, width: image.width, height: image.height }, x, y, scale, opacity })
const pixel = (data, width, x, y = 0) => [...data.slice((y * width + x) * 4, (y * width + x) * 4 + 4)]

test('fractional reference uses exact rectangle coverage at edges and corners', () => {
  const data = composePixelLayers(2, 2, [layer(black, 0, 0, 2), layer(white, 0.5, 0.5, 1)])
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) assert.deepEqual(pixel(data, 2, x, y), [64, 64, 64, 255])
})

test('adjacent glyph elements composite their shared fractional edge sequentially', () => {
  const data = composePixelLayers(3, 1, [layer(black, 0, 0, 3), layer(white, 0, 0, 1.5), layer(white, 1.5, 0, 1.5)])
  assert.deepEqual(pixel(data, 3, 0), [255, 255, 255, 255])
  assert.deepEqual(pixel(data, 3, 1), [191, 191, 191, 255])
  assert.deepEqual(pixel(data, 3, 2), [255, 255, 255, 255])
})

test('disabled opacity combines with coverage while transparent source pixels preserve background', () => {
  const data = composePixelLayers(3, 1, [layer(black, 0, 0, 3), layer(white, 0.5, 0, 2, 85 / 255)])
  assert.deepEqual([0, 1, 2].map(x => pixel(data, 3, x)[0]), [42, 85, 42])
  const transparent = image([[255, 0, 0, 0]])
  assert.deepEqual([...composePixelLayers(1, 1, [layer(black, 0, 0, 1), layer(transparent, 0, 0, 1)])], [0, 0, 0, 255])
})

test('source crop and nearest sampling retain native pixels without atlas bleed', () => {
  const atlas = image([[255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 255, 255]])
  const cropped = { ...layer(atlas, 0.25, 0, 2), source: { x: 1, y: 0, width: 1, height: 1 } }
  const data = composePixelLayers(3, 1, [layer(black, 0, 0, 3), cropped])
  assert.deepEqual([0, 1, 2].map(x => pixel(data, 3, x)), [[0, 192, 0, 255], [0, 255, 0, 255], [0, 64, 0, 255]])
  const pairs = image([[255, 0, 0, 255], [0, 0, 255, 255]])
  const nearest = composePixelLayers(5, 1, [layer(pairs, 0, 0, 2.5)])
  assert.deepEqual(pixel(nearest, 5, 1), [255, 0, 0, 255])
  assert.deepEqual(pixel(nearest, 5, 3), [0, 0, 255, 255])
})


test('pinned fixed8 coverage and integer interpolation explain the opaque edge without fitting', () => {
  const background = image([[239, 199, 91, 255]]), foreground = image([[135, 83, 27, 255]])
  // Right edge1.28 rounds to328/256, coverage72; opaque scale is73/256.
  // Each channel is dst + floor((src - dst) *73/256), not float round-nearest.
  const data = composePixelLayers(2, 1, [layer(background, 0, 0, 3), layer(foreground, -0.72, 0, 2)])
  assert.deepEqual(pixel(data, 2, 1), [209, 165, 72, 255])
})

test('single-pixel fixed8 rectangles and straight-alpha output retain their separate contracts', () => {
  // The native raster's one-scanline coverage is height -1 before X scaling.
  const tiny = composePixelLayers(1, 1, [layer(black, 0, 0, 2), layer(white, 0.25, 0.25, 0.5)])
  assert.deepEqual([...tiny], [63, 63, 63, 255])
  const translucent = image([[120, 60, 30, 128]])
  assert.deepEqual([...composePixelLayers(1, 1, [layer(translucent, 0, 0, 2)])], [120, 60, 30, 128])
})
