import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = path => readFileSync(new URL(`../app/${path}`, import.meta.url), 'utf8')

// Source/geometry regression only. Rendered focus, glyphs and fallback still need
// browser captures; this test does not simulate CSS layout or the DOM.
test('pause Back keeps its focus outline inside the native frame edge', () => {
  const pause = source('original-pause-menu.module.css')
  const shared = source('original-main-menu.module.css')
  const component = source('original-pause-menu.tsx')
  assert.match(component, /label="Back"\s+y=\{454\}/)
  assert.match(component, /height: label === 'Back' \? 26 : 29/)
  assert.match(pause, /\.frame \{[^}]*height: 480px/)
  assert.match(pause, /\.dialog \{[^}]*overflow: hidden/)
  const commonFocus = shared.match(/\.rows button:focus-visible \{([^}]+)\}/)?.[1]
  assert.ok(commonFocus)
  assert.match(commonFocus, /outline: 1px solid #fff1bb/)
  const backFocus = pause.match(/\.rows button\[aria-label="Back"\]:focus-visible \{([^}]+)\}/)?.[1]
  assert.ok(backFocus, 'Back needs its own inset focus rule')
  assert.equal(backFocus.trim(), 'outline-offset: -1px;')
  // The extra attribute makes the override more specific than the shared rule,
  // independent of CSS-module load order. Preserve the shared style for others.
  assert.match(commonFocus, /outline-offset: 1px/)
  assert.match(source('frontend-composition.ts'), /Math\.min\(width \/ 640, height \/ 480\)/)
  const top = 454, height = 26, outline = 1, offset = -1
  for (const [width, viewportHeight] of [[640, 480], [1920, 1080], [800, 450], [2560, 1080]]) {
    const scale = Math.min(width / 640, viewportHeight / 480)
    const frameTop = (viewportHeight - 480 * scale) / 2
    const outlineBottom = frameTop + (top + height + offset + outline) * scale
    assert.ok(outlineBottom <= viewportHeight, `${width}x${viewportHeight} outline exceeds viewport`)
  }
})
