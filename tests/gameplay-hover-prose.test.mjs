import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const page = source('app/page.tsx'), css = source('app/globals.css')

// Source-only guard: rendered/native tooltip behavior has separate scene/browser
// coverage. Removing the invented prose must not remove its shared HUD owners.
test('normal gameplay has no invented hover or selected-mode description panel', () => {
  assert.doesNotMatch(page, /hud-description|focused\.(?:name|description)/)
  assert.doesNotMatch(css, /\.hud-description\b/)
})

test('native tooltip session, HUD acquisition, and canvas presentation remain wired', () => {
  assert.match(page, /tooltipSession = useRef\(createTooltipSession\(\)\)/)
  assert.match(page, /store\.bindPresentation\(world\),\s*tooltipSession\.current/)
  assert.match(page, /data-tooltip-hud=\{s\.id === 'blast' && !undiscovered \? 'blast' : undefined\}/)
  const scene = source('app/scene.ts')
  assert.match(scene, /this\.tooltipElement\.className = 'native-tooltip'/)
  assert.match(scene, /this\.tooltipElement\.appendChild\(this\.tooltipCanvas\)/)
  assert.match(css, /\.native-tooltip\s*\{/)
  assert.match(css, /\.native-tooltip canvas\s*\{/)
})

test('spell and building hover feedback and targeting selection remain available', () => {
  assert.match(page, /engine\.current\.hoveredSpell =\s*tab === 'spells' \? \(SPELLS\.find\(s => s\.id === hover\)\?\.model \?\? 0\) : 0/)
  assert.match(page, /hovered: !undiscovered && hover === s\.id/)
  assert.match(page, /selected: interactive && world\.mode === s\.id/)
  for (const item of ['s', 'b']) {
    assert.ok(page.includes(`setHover(${item}.id)`))
    assert.ok(page.includes(`w.mode = w.mode === ${item}.id ? null : ${item}.id`))
    assert.match(page, new RegExp(`aria-pressed=\\{(?:interactive && )?world\\.mode === ${item}\\.id\\}`))
  }
})
