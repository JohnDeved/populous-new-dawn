import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { hudScale } from '../app/hud-layout.ts'
const read = file => readFileSync(new URL('../app/' + file, import.meta.url), 'utf8')
const css = read('fullscreen-control.module.css'), global = read('globals.css'), selector = read('world-selector.module.css')
const rule = (source, name) => source.split(name + ' {')[1]?.split('}')[0] ?? ''
const intersects = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top

test('selector dock clears native Start/glyph band, Browser controls and direct-mission header', () => {
  const dock = rule(css, ':global([data-world-selector]) > .control')
  for (const declaration of ['top: 12px', 'left: 12px', 'right: auto', 'bottom: auto']) assert.ok(dock.includes(declaration))
  assert.match(rule(css, ':global([data-world-selector]) > .control button'), /max-width: 150px/)
  assert.match(selector, /\.compatibilityToggle \{[^}]*top: 8px; right: 8px/)
  assert.match(selector, /\.compatibility \{[^}]*top: 60px/)
  assert.match(selector, /\.direct \{ padding: 68px/)
  assert.match(selector, /\.start \{[^}]*left: calc\(576 \/ 638 \* 100%\)/)
  assert.match(selector, /\.panel \{[^}]*bottom: 0/)
  for (const [width, height, dpr] of [[640,480,1],[800,600,1],[1024,768,2],[1920,1080,1],[1920,1080,2],[3440,1440,2],[3840,2160,2]]) {
    const scale = Math.min(width / 640, height / 480)
    // Conservative English label width bound, source-clamped to150. Browser
    // Controls uses its existing top-right strip; its rendered hit-test is a
    // separate hosted gate, not inferred from this source geometry regression.
    const dock = { left:12, top:12, right:162, bottom:44 }
    const panel = { left:(width - 638 * scale)/2, right:(width + 638 * scale)/2, top:height - 61 * scale, bottom:height }
    const start = { left:panel.left + 576 * scale, right:panel.left + 576 * scale + Math.max(44,37 * scale),
      top:panel.top + 11 * scale, bottom:panel.top + 11 * scale + Math.max(44,37 * scale) }
    assert.equal(intersects(dock, panel), false, `${width}x${height}@${dpr}: native panel`)
    assert.equal(intersects(dock, start), false, 'Start remains clear')
    assert.equal(intersects(dock, { left:width-168, right:width-8, top:8, bottom:52 }), false, 'Browser controls strip')
    assert.ok(dock.bottom < 60 && dock.bottom < 68, 'drawer/direct content starts below dock')
  }
})

test('gameplay fullscreen shares native action-row layout, never compact Resume/F8/status coordinates', () => {
  const dock = rule(css, ':global(.top-actions) > .control'), button = rule(css, ':global(.top-actions) > .control button')
  assert.match(dock, /position: relative; inset: auto/)
  for (const declaration of ['width: 17px', 'height: 14px', 'min-height: 0', 'padding: 0']) assert.ok(button.includes(declaration))
  assert.match(rule(css, ':global(.top-actions) > .control .label'), /display: none/)
  assert.match(read('fullscreen-control.tsx'), /aria-label=\{label\}/)
  assert.match(global, /\.top-actions\{position:absolute;left:4px;bottom:3px;display:flex;gap:4px\}/)
  for (const [width,height,dpr] of [[640,480,1],[640,480,2],[800,600,1],[900,360,1],[1024,768,2],[1920,1080,2],[3440,1440,2]]) {
    for (const preference of ['auto','1','2','4']) {
      const scale = hudScale(width,height,preference), side = 100 * scale
      const actions = Array.from({ length:4 }, (_, index) => ({ left:(4+21*index)*scale, right:(21+21*index)*scale,
        top:height-17*scale, bottom:height-3*scale }))
      for (let i=0;i<actions.length;i++) {
        assert.ok(actions[i].right <= side, `${width}x${height}@${dpr} ${preference}: action fits HUD`)
        assert.ok(actions[i].top >= 481*scale, 'does not overwrite native dock rows')
        for (let j=i+1;j<actions.length;j++) assert.equal(intersects(actions[i],actions[j]),false)
      }
      assert.equal(intersects(actions[3], { left:side, right:width, top:0, bottom:height }),false,
        'fullscreen is outside battlefield-owned Resume/status/F8/message space')
    }
  }
})
