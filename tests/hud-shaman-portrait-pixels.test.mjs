import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { comparePortraitPixels } from '../scripts/local-render/shaman-portrait-pixels.mjs'
import descriptor from '../decomp/research/shaman-portrait/descriptor.json' with { type: 'json' }

function fixture(border, interior = [72, 44, 20]) {
  const data = [], frame = [], foreground = []
  for (let y = 0; y < 35; y++) for (let x = 0; x < 30; x++) {
    const inside = x >= 2 && x < 27 && y >= 2 && y < 32
    data.push(...(inside ? interior : border), 255)
    frame.push(180, 90, 30, 255)
    foreground.push(...(inside ? [72, 44, 20, 255] : [0, 0, 0, 0]))
  }
  return { actual: { width: 30, height: 35, data }, frame, foreground,
    background: [0, 0, 0], enabled: false, interior: [72, 44, 20] }
}

test('portrait pixel oracle distinguishes frame alpha from opaque interior on two backgrounds', () => {
  // Independent arithmetic: [180,90,30] at85/255 over black -> [60,30,10].
  const black = comparePortraitPixels(fixture([60, 30, 10]))
  assert.deepEqual(black, { borderChannels: 900, interiorChannels: 2250, mismatches: 0, maximumError: 0, scale: 1 })
  const sand = fixture([206, 153, 99]); sand.background = [219, 184, 133]
  assert.equal(comparePortraitPixels(sand).mismatches, 0)
  assert.equal(comparePortraitPixels(fixture([180, 90, 30])).mismatches, 900,
    'reject the previous full-strength disabled frame')
  assert.equal(comparePortraitPixels(fixture([60, 30, 10], [24, 15, 7])).mismatches, 2250,
    'reject applying the frame alpha to the interior too')
})

test('enabled frame oracle keeps full strength beneath observed sprite foreground', () => {
  const enabled = fixture([180, 90, 30]); enabled.enabled = true
  assert.equal(comparePortraitPixels(enabled).mismatches, 0)
  const dimmed = fixture([60, 30, 10]); dimmed.enabled = true
  assert.equal(comparePortraitPixels(dimmed).mismatches, 900)
})

test('native portrait frame overlap is confined to the later opaque interior', () => {
  assert.equal(descriptor.ordinaryGhostAlpha.value, 85)
  // 004a1f50 at30×35, using the statically recovered descriptor tables.
  // Geometry can overlap underneath the subsequent interior fill; every
  // exposed frame pixel has exactly one native piece, so composite alpha agrees.
  const boxes = [[4, 4, 4, 22, 27], [1, 8, 0, 14, 4], [7, 8, 31, 14, 4],
    [3, 0, 8, 4, 19], [5, 26, 8, 4, 19], [0, 0, 0, 8, 8],
    [2, 22, 0, 8, 8], [6, 0, 27, 8, 8], [8, 22, 27, 8, 8]]
  for (const [name, table] of Object.entries(descriptor.frameTables)) {
    const start = { normal: 713, hover: 731, selected: 722 }[name]
    assert.deepEqual(table.values, [0, 4, 1, 6, 8, 7, 2, 5, 3].map(offset => start + offset))
    const png = readFileSync(new URL(`../public/original/hud-portrait${name === 'normal' ? '' : `-${name}`}.png`, import.meta.url))
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [30, 35])
    const coverage = new Uint8Array(30 * 35)
    for (const [, left, top, width, height] of boxes) {
      for (let y = top; y < top + height; y++) for (let x = left; x < left + width; x++) coverage[y * 30 + x]++
    }
    for (let y = 0; y < 35; y++) for (let x = 0; x < 30; x++) {
      if (x >= 2 && x < 27 && y >= 2 && y < 32) continue
      assert.equal(coverage[y * 30 + x], 1, `${x},${y}`)
    }
  }
})
