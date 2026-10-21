import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8')
const component = read('app/fullscreen-control.tsx'), css = read('app/fullscreen-control.module.css')
const hud = JSON.parse(read('app/original-hud.json'))

test('fullscreen uses original unscaled HUD bitmap metrics and a documented new pixel symbol', () => {
  assert.match(component, /import hud from '\.\/original-hud\.json'/)
  assert.match(component, /font0-\$\{letter\.charCodeAt\(0\) - 32\}/)
  assert.match(component, /width: glyph\.w/)
  assert.match(component, /height: glyph\.h/)
  assert.match(component, /backgroundPosition: `-\$\{glyph\.x\}px -\$\{glyph\.y\}px`/)
  assert.match(css, /background: url\('\/original\/hud\.png'\) no-repeat/)
  assert.match(component, /New browser-only symbol, not an original-game sprite/)
  assert.match(component, /width="11"[\s\S]*height="10"[\s\S]*viewBox="0 0 11 10"/)
  assert.doesNotMatch(component, /[⛶↙]/)
  assert.doesNotMatch(css, /Arial|background-size|scale\(/)
  assert.match(css, /border-image: url\('\/original\/hud-button\.png'\) 8 fill repeat/)
  assert.match(css, /:global\(\.top-actions\) > \.control button \{[^}]*border-image: none/)
  for (const color of css.match(/#[\da-f]{6}/g)) assert.ok(hud.colors.includes(color), `${color} is from PAL0-C`)
  for (const label of ['Fullscreen', 'Exit fullscreen']) {
    const glyphs = [...label].map(letter => hud.rects[`font0-${letter.charCodeAt(0) - 32}`])
    assert.ok(glyphs.every(glyph => glyph && glyph.h === 10))
    assert.ok(glyphs.reduce((width, glyph) => width + glyph.w, 0) + 11 + 5 + 16 <= 150)
  }
})

test('fullscreen keeps an accessible atlas-failure fallback, status and focus treatment', () => {
  assert.match(component, /\[\.\.\.text\]\.some/,'unsupported glyphs retain a readable fallback')
  assert.match(component, /image\.src = '\/original\/hud\.png'/)
  assert.match(component, /\.decode\(\)/)
  assert.match(component, /if \(mounted\) setBitmapReady\(true\)/)
  assert.match(component, /bitmapReady \? \([\s\S]*BitmapText text=\{label\}[\s\S]*styles\.fallback/)
  assert.match(component, /aria-label=\{label\}/)
  assert.match(component, /aria-pressed=\{state\.active\}/)
  assert.match(component, /aria-disabled=\{state\.pending\}/)
  assert.match(component, /role="status"/)
  assert.match(component, /bitmapReady \? styles\.visuallyHidden : styles\.fallback/)
  assert.match(css, /button:focus-visible \{ outline: 1px solid #fff7bb; outline-offset: 2px/)
  assert.match(css, /button\[aria-pressed='true'\]/)
  assert.match(css, /button\[aria-disabled='true'\]/)
})
