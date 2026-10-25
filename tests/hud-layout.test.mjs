import test from 'node:test'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { hudScale } from '../app/hud-layout.ts'

test('scaled native panel and bottom-row digits remain above the modern footer', () => {
  for (const [width, height] of [[1280, 720], [1920, 1080], [3440, 1440], [800, 600]]) {
    for (const preference of ['auto', '1', '2', '4']) {
      const scale = hudScale(width, height, preference)
      // Native dock top204 + height277; footer bottom3 + height14.
      const panelBottom = 481 * scale, rowBottom = 469 * scale
      const footerTop = height - 17 * scale
      assert.ok(footerTop >= 483 * scale - 1e-9, JSON.stringify({ width, height, preference, scale, footerTop }))
      assert.ok(panelBottom < footerTop && rowBottom < footerTop)
    }
  }
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
