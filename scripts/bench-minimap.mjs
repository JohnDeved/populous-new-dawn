// Pixel-equivalent before/after allocation benchmark; not a full-game fps claim.
import assert from 'node:assert/strict'
import { cpus, platform, arch } from 'node:os'
import { readFileSync } from 'node:fs'
import { minimapRGBA } from '../app/minimap.ts'
import { readTerrainTextures } from '../app/terrain-texture.ts'

const raw = readFileSync(new URL('../public/original/landscape.bin', import.meta.url)),
  { palette } = readTerrainTextures(
    raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength)
  )
function previous(indexed, palette) {
  const pixels = new Uint8ClampedArray(indexed.length * 4)
  indexed.forEach((color, i) =>
    pixels.set([...palette.subarray(color * 4, color * 4 + 3), 255], i * 4)
  )
  return pixels
}
const results = []
for (const [width, height] of [
  [100, 96],
  [225, 200],
  [600, 432],
]) {
  const indexed = Uint8Array.from({ length: width * height }, (_, i) => i & 255)
  assert.deepEqual(minimapRGBA(indexed, palette), previous(indexed, palette))
  for (let i = 0; i < 20; i++) {
    previous(indexed, palette)
    minimapRGBA(indexed, palette)
  }
  const times = [[], []]
  for (let round = 0; round < 9; round++)
    for (const which of [round % 2, 1 - (round % 2)]) {
      const fn = [previous, minimapRGBA][which],
        start = performance.now()
      for (let i = 0; i < 10; i++) fn(indexed, palette)
      times[which].push((performance.now() - start) / 10)
    }
  const median = values => values.sort((a, b) => a - b)[4],
    before = median(times[0]),
    after = median(times[1])
  results.push({ width, height, previousMs: before, optimizedMs: after, speedup: before / after })
}
console.log(
  JSON.stringify(
    {
      runtime: process.version,
      platform: platform(),
      arch: arch(),
      cpu: cpus()[0].model,
      method:
        '20 warmups; 9 alternating-order batches of 10 conversions; medians; identical full RGBA output',
      results,
    },
    null,
    2
  )
)
