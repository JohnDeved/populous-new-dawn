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

test('gameplay has no footer control or fullscreen placement while menu/loading placements remain explicit', () => {
  assert.doesNotMatch(global, /\.top-actions/)
  assert.doesNotMatch(css, /top-actions/)
  assert.doesNotMatch(read('page.tsx'), /SoundControl|data-sound-control|top-actions/)
  assert.match(read('page.tsx'), /<FullscreenControl \/>/, 'the browser Escape session remains mounted')
  assert.match(read('fullscreen-session.ts'), /doc\.querySelector\('\.loading-world'\) \? doc\.body : null/)
  assert.match(read('fullscreen-session.ts'), /host\.remove\(\)/)
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
    assert.ok(rule(css, target + suffix), `Every frontend panel retains compact menu treatment: ${suffix}`)
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

test('logo and loading compact fullscreen keep original controls and the scrolling recovery column clear', () => {
  const pixels = (declarations, name) => Number(declarations.match(new RegExp(`(?:^|;)\\s*${name}: (\\d+)px(?:;|$)`))?.[1])
  const recoveryScroll = read('checkpoint-scroll-area.module.css')
  const focus = rule(css, '.control button:focus-visible')
  const ring = Number(focus.match(/outline: (\d+)px/)[1]) + pixels(focus, 'outline-offset')
  for (const target of [':global(dialog[data-startup-logo]) > .control', ':global(body:has(.loading-world)) > .control']) {
    const dock = rule(css,target), button = rule(css,target+' button')
    assert.match(dock, /right: auto; bottom: auto/)
    assert.match(rule(css,target+' .compactFrame'), /display: block/)
    assert.match(rule(css,target+' .label'), /display: none/)
    assert.equal(pixels(button,'width'),17); assert.equal(pixels(button,'height'),14)
    const control = { left:pixels(dock,'left')-ring, top:pixels(dock,'top')-ring,
      right:pixels(dock,'left')+pixels(button,'width')+ring, bottom:pixels(dock,'top')+pixels(button,'height')+ring }
    const media = recoveryScroll.match(/@media\s*\(max-width:\s*(\d+)px\)\s*\{\s*\.loadingContent\s*\{\s*padding-left:\s*(\d+)px/)
    assert.ok(media, 'The actual compact loading scroll content reserves the fullscreen gutter')
    assert.match(global, /\.loading-world\[data-loading-phase=failed\]\{overflow:hidden\}/)
    assert.match(rule(recoveryScroll, '.viewport'), /overflow: auto/)
    assert.match(rule(recoveryScroll, '.loadingContent'), /padding: 28px 32px/)
    assert.match(read('original-loading-screen.tsx'), /failed \? <CheckpointScrollArea purpose="loading">/)
    assert.match(read('checkpoint-scroll-area.tsx'), /className=\{loading \? styles.loadingContent : styles.content\}/)
    assert.match(read('startup-logo.module.css'), /\.focusOnly:not\(:focus-visible\)\s*\{\s*opacity: 0/)
    assert.match(read('startup-logo.module.css'), /aspect-ratio: 20 \/ 11/)
    for (const [width,height] of [[320,240],[640,480],[680,360],[681,360],[900,360],[1280,800],[1920,1080]]) {
      assert.ok(control.left >= 0 && control.top >= 0 && control.right <= width && control.bottom <= height)
      const scale = frontendScale(width,height)
      const video = { left:(width-640*scale)/2, right:(width+640*scale)/2,
        top:(height-352*scale)/2, bottom:(height+352*scale)/2 }
      assert.equal(intersects(control,video),false, 'Original movie artwork stays clear')
      // Reserve the entire recovery column, not only one scroll position. Include
      // a conservative 17px classic scrollbar at wider sizes.
      const columnLeft = width <= Number(media[1]) ? Number(media[2]) : Math.max(32, (width-17-576)/2)
      assert.ok(control.right < columnLeft, `${width}x${height}: scrolled diagnostics and footer clear the focus ring`)
      const mask = {left:Math.floor((width-130)/2),right:Math.floor((width-130)/2)+130,
        top:Math.floor((height-161)/2)-26,bottom:Math.floor((height-161)/2)+161}
      assert.equal(intersects(control,mask),false,'Pending loading mask and label retain their centered geometry')
    }
  }
})

test('pause portal uses the native compact frame above rows and right of the live HUD', () => {
  const target = ':global(dialog[data-original-pause-menu]) > .control'
  const dock = rule(css, target), button = rule(css, target + ' button')
  for (const declaration of ['top: 12px', 'right: 12px', 'left: auto', 'bottom: auto']) assert.ok(dock.includes(declaration))
  for (const declaration of ['width: 17px', 'height: 14px', 'min-height: 0', 'padding: 0', 'border: 0', 'background: none']) assert.ok(button.includes(declaration))
  assert.match(rule(css, target + ' .compactFrame'), /display: block/)
  assert.match(rule(css, target + ' .label'), /display: none/)
  assert.match(rule(css, target + ' p'), /top: 20px; right: 0; bottom: auto/)
  const pixels = (declarations, name) => Number(declarations.match(new RegExp(`(?:^|;)\\s*${name}: (\\d+)px(?:;|$)`))?.[1])
  const focus = rule(css, '.control button:focus-visible')
  const ring = Number(focus.match(/outline: (\d+)px/)[1]) + pixels(focus, 'outline-offset')
  for (const [width, height] of [[320,240],[640,480],[800,450],[900,360],[1920,1080],[3440,1440]]) {
    const scale = frontendScale(width, height), y = (height-480*scale)/2
    const right = width-pixels(dock,'right'), top = pixels(dock,'top')
    const control = { left:right-pixels(button,'width')-ring, right:right+ring, top:top-ring, bottom:top+pixels(button,'height')+ring }
    assert.ok(Object.values(control).every(Number.isFinite))
    assert.ok(control.left >= 0 && control.top >= 0 && control.right <= width && control.bottom <= height)
    for (const preference of ['auto','1','2','4']) {
      const hud = { left:0, right:100*hudScale(width,height,preference), top:0, bottom:height }
      assert.equal(intersects(control,hud),false,'Native HUD and minimap remain clear')
    }
    for (const [name,start,end] of [['root and confirmation rows',159,480],['Options rows and category navigation',79,480],['checkpoint body and actions',81,480]])
      assert.equal(intersects(control,{left:0,right:width,top:y+start*scale,bottom:y+end*scale}),false,`${width}x${height}: ${name}`)
  }
})

test('candidate pause episode separates native text from the browser portal and proves real keyboard clearance', () => {
  const episode = readFileSync(new URL('../scripts/local-render/original-pause-checkpoint-style.mjs', import.meta.url), 'utf8')
  assert.match(episode, /observeFullscreenClearance, assertFullscreenClearance/)
  assert.match(episode, /page\.keyboard\.press\('Tab'\)/)
  assert.match(episode, /assertFullscreenClearance\(sample\)/)
  assert.match(episode, /assert\.equal\(sample\.focusVisible, true/)
  assert.match(episode, /:scope > :not\(\[data-fullscreen-control\]\) button/)
  assert.match(episode, /\.native-hud, dialog\[data-original-pause-menu\]/)
  assert.match(episode, /\['Game', 'Sound', 'Graphics'\]/)
  assert.match(episode, /pause-options-fullscreen-fallback-320x240\.png/)
  assert.ok(episode.includes('[data-original-options] [data-menu-tooltip], [data-original-options] label[for]'))
  assert.doesNotMatch(episode, /button\('Fullscreen'\)\.focus\(/)
})
