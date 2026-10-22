import test from 'node:test'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { hudContentHeight, hudScale } from '../app/hud-layout.ts'

test('ordinary compact roster fits the full reference panel without a removed-footer budget', () => {
  for (const [width, height] of [[320, 240], [640, 480], [1280, 720], [1920, 1080], [3440, 1440], [800, 600], [900, 360]]) {
    for (const preference of ['auto', '1', '2', '4']) {
      for (const count of [0, 3, 16, 17]) {
        const scale = hudScale(width, height, preference, count)
        assert.ok(480 * scale <= height + 1e-9)
        assert.ok(100 * scale <= width)
      }
    }
  }
  assert.equal(hudScale(640, 480, 'auto', 17), 1)
  assert.equal(hudScale(640, 480, '1', 17), 1)
  assert.equal(hudScale(320, 240, 'auto', 17), 0.5)
})

test('arbitrary restored and F8 rosters retain all compact rows and keyboard focus clearance', () => {
  for (const count of [19, 20]) {
    assert.equal(hudContentHeight(count), 522)
    for (const [width, height] of [[640, 480], [320, 240], [900, 360], [1920, 1080]]) {
      for (const preference of ['auto', '1', '2', '4']) {
        const scale = hudScale(width, height, preference, count)
        assert.ok((203 + 9 + 6 * 44 + 43 + 3) * scale <= height + 1e-9)
      }
    }
  }
  assert.equal(hudScale(640, 480, 'auto', 20), 480 / 522)
  assert.equal(hudContentHeight(17), 480)
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

test('content budget is bound to the actual compact-grid and keyboard-focus styles', () => {
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')
  assert.match(css, /\.command-dock\{[^}]*top:203px;[^}]*padding:9px 4px 7px/)
  assert.match(css, /\.spell-list,\.building-list,\.follower-list\{[^}]*gap:1px/)
  assert.match(css, /\.spell-card,\.building-card,\.follower-list button\{[^}]*height:43px/)
  assert.match(css, /button:focus-visible[^}]*outline:2px solid white;outline-offset:1px/)
  assert.match(css, /\.spell-list\{grid-template-columns:repeat\(3,31px\)/)
})
