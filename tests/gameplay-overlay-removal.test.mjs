import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { pauseStatusLayout } from '../app/pause-status-layout.ts'
import hud from '../app/original-hud.json' with { type: 'json' }

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('normal gameplay removes invented skip, targeting, desktop and pause cards', () => {
  const page = read('app/page.tsx'), css = read('app/globals.css')
  for (const selector of ['skip-introduction', 'target-prompt', 'desktop-recommendation', 'paused-badge']) {
    assert.ok(!page.includes(selector), `${selector} has no production DOM or click exception`)
    assert.ok(!css.includes(selector), `${selector} has no obsolete presentation rule`)
  }
  assert.doesNotMatch(page, /WORLD PAUSED|Click to resume|Skip introduction/)
  assert.match(page, /className="game-a11y-status" role="status">\s*\{world\.message\}/)
  assert.match(page, /Choose where to[\s\S]*?Escape cancels\./)
  assert.match(css, /\.game-a11y-status\{[^}]*clip-path:inset\(50%\)/)
  assert.match(page, /<OriginalPauseStatus \/>/)
})

test('the original Space skip and existing browser Escape compatibility remain in the public keyboard handler', () => {
  const page = read('app/page.tsx')
  assert.match(page, /if \(world\.inputMask\) \{\s*if \(\(e\.code === 'Space' \|\| e\.key === 'Escape'\) && world\.flyby\.flags & 1\) \{\s*e\.preventDefault\(\)\s*engine\.current\?\.skipIntroduction\(\)/)
  assert.match(page, /if \(e\.code === 'Space' && !\(e\.target as HTMLElement\)\.closest\('button'\)\)/)
  assert.match(page, /if \(!e\.repeat\) \{\s*store\.change\(w => \{\s*if \(rotateBuildingPlan\(w\)\)/)
  assert.match(page, /if \(e\.key === 'Escape'\)[\s\S]*?store\.change\(cancelInteraction\)/)
})

test('native Paused uses raw F00T glyph geometry and total-screen-area font selection', () => {
  for (const [width, height, font] of [[640,480,3],[639,480,4],[1024,300,3],[900,341,4],[900,342,3],[320,960,3]]) {
    const layout = pauseStatusLayout(width,height)
    assert.equal(layout.font,font)
    assert.equal(layout.height,hud.rects[`f00t${font}-33`].h)
    assert.deepEqual(layout.glyphs,[...'Paused'].map(char => hud.rects[`f00t${font}-${char.charCodeAt(0)-32}`]))
  }
  const component = read('app/original-pause-status.tsx'), css = read('app/original-pause-status.module.css')
  assert.match(component,/const label = 'Paused'/)
  assert.match(component,/role="status"/)
  assert.match(component,/aria-label=\{label\}/)
  assert.match(component,/window\.addEventListener\('resize', resize\)/)
  assert.match(component,/window\.removeEventListener\('resize', resize\)/)
  assert.doesNotMatch(component,/<button|onClick|onKeyDown/)
  assert.match(css,/right: 2px;/)
  assert.match(css,/bottom: 0;/)
  assert.match(css,/pointer-events: none;/)
  assert.match(css,/background-image: url\('\/original\/hud\.png'\)/)
  assert.doesNotMatch(css,/border|padding|filter|text-shadow|background-color/)
})
