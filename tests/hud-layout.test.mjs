import test from 'node:test'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { hudScale } from '../app/hud-layout.ts'

test('footer removal retains the existing fit budget and complete panel bounds pending coordinate proof', () => {
  for (const [width, height] of [[320, 240], [640, 480], [1280, 720], [1920, 1080], [3440, 1440], [800, 600], [900, 360]]) {
    for (const preference of ['auto', '1', '2', '4']) {
      const scale = hudScale(width, height, preference)
      // These are the current implementation coordinates, not native-raster proof.
      const panelBottom = 481 * scale, rowBottom = 469 * scale
      assert.ok(scale <= height / 500, 'existing fit cap is unchanged until the coordinate gate closes')
      assert.ok(panelBottom <= height && rowBottom < panelBottom)
      assert.ok(100 * scale <= width)
    }
  }
  assert.equal(hudScale(640, 480, 'auto'), 0.96, 'footer removal is not a claimed 1x geometry correction')
  assert.equal(hudScale(640, 480, '1'), 0.96, 'manual preference keeps the same fit guard')
})

test('HUD keeps preferred manual sizes and the original nominal auto steps when they fit', () => {
  assert.equal(hudScale(1920, 1080, 'auto'), 2)
  assert.equal(hudScale(3440, 1440, 'auto'), 2.5)
  assert.equal(hudScale(1920, 1080, '1'), 1)
  assert.equal(hudScale(3440, 2160, '4'), 4)
  assert.equal(hudScale(800, 1200, '4'), 1.25)
})

test('HUD extraction retains the page client-component directive', () => {
  assert.match(readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8'), /^'use client'\s/)
})
