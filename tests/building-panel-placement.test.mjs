import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { clampPanelAnchor } from '../app/panel-viewport-clamp.ts'

// Execute the actual placement expressions, not the Scene/gameplay dependency
// graph. Projection, DOM rectangles, canvas dimensions and CSS scale are supplied.
// This proves arithmetic wiring, not browser rasterization or ordinary gameplay.
const source = readFileSync(new URL('../app/building-panels.ts', import.meta.url), 'utf8')
const start = source.indexOf('    const p = scene.screen(b),')
const end = source.indexOf('    panel.hidden = false', start)
assert.ok(start >= 0 && end > start)
const place = new Function('scene', 'b', 'canvas', 'panel', 'getComputedStyle', 'clampPanelAnchor',
  `${source.slice(start, end)}; return { left, top }`)

function placement({ x, y, width = 120, height = 68, scale = 1.44,
  viewport = { left: 12.3, top: 7.2, width: 800, height: 600 } }) {
  const scene = {
    screen: () => ({ x, y }),
    container: { getBoundingClientRect: () => ({ left: 0, top: 0 }) },
    renderer: { domElement: { getBoundingClientRect: () => viewport } },
  }
  return place(scene, {}, { width, height }, {},
    () => ({ getPropertyValue: () => String(scale) }), clampPanelAnchor)
}

// Source-derived resident/training sizes: icon75=16x23, control46=23x23,
// tail52=16x34; capacities1/3/4/5 yield48/88/104/120px widths.
for (const width of [48, 88, 104, 120]) {
  test(`building panel width ${width} uses inward fractional-scale edge limits`, () => {
    const rect = { left: 12.3, top: 7.2, width: 800, height: 600 }
    const half = width * 1.44 / 2, height = width === 120 ? 68 : 62
    const a = placement({ x: -4, y: 4, width, height, viewport: rect })
    const b = placement({ x: 4, y: -4, width, height, viewport: rect })
    assert.equal(a.left, Math.ceil(rect.left + half))
    assert.equal(a.top, Math.ceil(rect.top + height * 1.44))
    assert.equal(b.left, Math.floor(rect.left + rect.width - half))
    assert.equal(b.top, Math.floor(rect.top + rect.height))
  })
}

test('interior projected anchors keep their fractional position', () => {
  const result = placement({ x: 0.123, y: 0.217 })
  assert.equal(result.left, 12.3 + (1.123 * 800) / 2)
  assert.equal(result.top, 7.2 + ((1 - 0.217) * 600) / 2)
})

test('integer edge limits and scale remain unchanged', () => {
  assert.deepEqual(placement({ x: -4, y: 4, scale: 1,
    viewport: { left: 0, top: 0, width: 800, height: 600 } }), { left: 60, top: 68 })
})

test('a fitting interval with no integer point preserves the exact clamp', () => {
  for (const value of [-1, 10.3, 100])
    assert.equal(clampPanelAnchor(value, 10.2, 10.4), Math.max(10.2, Math.min(10.4, value)))
})

test('equal and undersized intervals retain the prior overconstraint behavior', () => {
  for (const [min, max] of [[10.2, 10.2], [20.4, 10.2]])
    for (const value of [-1, 15, 100])
      assert.equal(clampPanelAnchor(value, min, max), Math.max(min, Math.min(max, value)))
})
