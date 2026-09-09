import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import {
  minimapTerrain,
  minimapScroll,
  minimapTransform,
  minimapMarkers,
  minimapPick,
} from '../app/minimap.ts'
import { readTerrainTextures } from '../app/terrain-texture.ts'
import terrain from './fixtures/minimap.json' with { type: 'json' }
import markers from './fixtures/minimap-markers.json' with { type: 'json' }
import hud from '../app/original-hud.json' with { type: 'json' }

test('minimap pixels, camera wrapping, rotated UVs and markers match native captures', () => {
  assert.equal(terrain.executableSha256, hud.executableSha256)
  assert.equal(markers.executableSha256, hud.executableSha256)
  const raw = readFileSync(new URL('../public/original/landscape.bin', import.meta.url)),
    textures = readTerrainTextures(
      raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength)
    ),
    hash = pixels => createHash('sha256').update(pixels).digest('hex')
  for (const c of terrain.cases) {
    const { width: w, height: h } = c,
      pixels = minimapTerrain(terrain.land, terrain.land.brightness, textures, w, h, c.fog),
      scroll = minimapScroll(w, h, c.center),
      wrapped = new Uint8Array(w * h),
      m = minimapTransform(w, h, c.heading)
    assert.equal(hash(pixels), c.terrain)
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        wrapped[y * w + x] = pixels[((y + scroll.y) % h) * w + ((x + scroll.x) % w)]
    assert.equal(hash(wrapped), c.wrapped)
    for (const [x, y, u, v] of c.quad) {
      assert.ok(Math.abs((m[0] * x + m[2] * y + m[4]) / c.textureSize - u) < 1e-6)
      assert.ok(Math.abs((m[1] * x + m[3] * y + m[5]) / c.textureSize - v) < 1e-6)
    }
    // Clicks invert the displayed terrain; this is not native command ownership.
    for (const [x, y] of [
      [w / 2, h / 2],
      [w / 3, h / 3],
    ]) {
      const p = minimapPick(w, h, c.center, c.heading, { x, y }),
        u = ((p.x / 65536) * w - scroll.x + w) % w,
        v = (h - 1 - (p.y / 65536) * h - scroll.y + h) % h,
        expected = [(m[0] * x + m[2] * y + m[4] + w) % w, (m[1] * x + m[3] * y + m[5] + h) % h]
      assert.ok(
        Math.min(Math.abs(u - expected[0]), w - Math.abs(u - expected[0])) <= w / 65536 + 1e-9
      )
      assert.ok(
        Math.min(Math.abs(v - expected[1]), h - Math.abs(v - expected[1])) <= h / 65536 + 1e-9
      )
    }
  }
  for (const c of markers.cases) {
    const actual = minimapMarkers(
      c.objects,
      c.width,
      c.height,
      c.center,
      c.flags,
      c.turn,
      c.scale
    ).flatMap(m => {
      if (m.sprite !== undefined) {
        if (m.sprite !== 59) return [m]
        const r = hud.rects[m.sprite]
        return [{ ...m, x: m.x - (r.w >> 1), y: m.y - (r.h >> 1) }]
      }
      return (
        m.size === 1
          ? [[0, 0]]
          : [
              [0, 0],
              [1, 1],
              [0, 1],
              [1, 0],
            ]
      ).map(([x, y]) => ({ x: m.x + x, y: m.y + y, color: m.color }))
    })
    assert.deepEqual(actual, c.expected)
  }
})
