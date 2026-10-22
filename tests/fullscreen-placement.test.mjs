import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { hudScale } from '../app/hud-layout.ts'
import { frontendScale, frontendRows, frontendRowY } from '../app/frontend-composition.ts'
const read = file => readFileSync(new URL('../app/' + file, import.meta.url), 'utf8')
const css = read('fullscreen-control.module.css'), global = read('globals.css'), selector = read('world-selector.module.css')
const rule = (source, name) => {
  const declarations = new Map()
  for (const [, selectors, body] of source.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    if (!selectors.split(',').some(selector => selector.trim() === name)) continue
    for (const declaration of body.split(';').filter(value => value.trim())) {
      const [property, ...value] = declaration.split(':')
      declarations.set(property.trim(), value.join(':').trim())
    }
  }
  return [...declarations].map(([property,value]) => `${property}: ${value};`).join(' ')
}
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
    const scale = frontendScale(width, height)
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

test('all frontend panels share the native compact frame in the empty upper-left dialog corner', () => {
  const target = ':global(dialog[data-original-main-menu]) > .control'
  const dock = rule(css, target)
  for (const declaration of ['top: 12px', 'left: 12px', 'right: auto', 'bottom: auto']) assert.ok(dock.includes(declaration))
  // The portal belongs to the persistent dialog, not a nested panel that disappears
  // during Main/Options/Tutorial/Quit transitions.
  assert.match(read('fullscreen-session.ts'), /const target = dialogs\[dialogs.length - 1\]/)
  assert.match(read('original-main-menu.tsx'), /<div ref=\{frame\} className=\{styles.frame\}>/)
  assert.match(read('original-main-menu.tsx'), /<dialog[\s\S]*?data-original-main-menu/)
  for (const suffix of [' button', ' .compactFrame', ' .label']) {
    assert.ok(css.includes(target + suffix + ',\n:global(.top-actions) > .control' + suffix + ' {'),
      `Every frontend panel shares unchanged native footer treatment: ${suffix}`)
  }
  assert.match(rule(css, target + ' p'), /top: 20px; left: 0; right: auto; bottom: auto/)
  const menu = read('original-main-menu.module.css')
  assert.match(menu, /\.logo \{ left: 181px; top: 10px; width: 290px; height: 101px/)
  assert.match(read('original-options.tsx'), /choice\(text, 170 \+ index \* 150, 420/)
  assert.match(read('original-options.tsx'), /choice\('Back', 320, 454/)
  // Conservative full-width row bands cover both bitmap and font-fallback rows.
  // Rendered fallback-title glyph bounds remain a browser-evidence requirement.
  for (const [width, height] of [[320,240],[640,480],[800,600],[900,360],[1280,720],[1920,1080],[3440,1440]]) {
    const scale = frontendScale(width, height)
    const x = (width - 640 * scale) / 2, y = (height - 480 * scale) / 2
    const native = (left, top, right, bottom) => ({ left:x+left*scale, top:y+top*scale, right:x+right*scale, bottom:y+bottom*scale })
    // Derive the control and its focus ring from the shipped declarations rather
    // than duplicating a passing rectangle that could outlive a CSS regression.
    const pixels = (declarations, name) => {
      const value = declarations.match(new RegExp(`(?:^|;)\\s*${name}: (\\d+)px(?:;|$)`))
      assert.ok(value, `Missing ${name} pixel declaration`)
      return Number(value[1])
    }
    const button = rule(css, target + ' button')
    const focus = rule(css, '.control button:focus-visible')
    const outline = Number(focus.match(/outline: (\d+)px/)[1]) + pixels(focus, 'outline-offset')
    const left = pixels(dock, 'left'), top = pixels(dock, 'top')
    const control = { left:left-outline, top:top-outline,
      right:left+pixels(button,'width')+outline, bottom:top+pixels(button,'height')+outline }
    assert.ok(control.left >= 0 && control.top >= 0 && control.right <= width && control.bottom <= height,
      `${width}x${height}: control and keyboard focus remain unclipped`)
    for (const [name, bounds] of [
      ['native logo', native(173,0,480,120)],
      ['main menu rows', native(0,frontendRowY(0),640,frontendRowY(frontendRows.length-1)+29)],
      ['checkpoint recovery notices and Retry', native(0,414,640,480)],
      ['tutorial recommendation and Quit choices', native(0,139,640,480)],
      ['option/help/storage rows, bitmap or fallback', native(0,139,640,390)],
      ['category navigation and Direct3D link', native(0,390,640,446)],
      ['Back', native(0,454,640,480)],
      ['Bullfrog badge', native(4,386,79,477)],
      ['QSound badge', native(568,415,637,477)],
    ]) assert.equal(intersects(control,bounds),false, `${width}x${height}: ${name}`)
  }
})
