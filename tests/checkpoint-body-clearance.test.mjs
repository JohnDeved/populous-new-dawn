import assert from 'node:assert/strict'
import test from 'node:test'
import { assertCheckpointBodyClearance } from '../scripts/local-render/checkpoint-body-clearance.mjs'

const fixture = () => ({
  viewport: { width: 640, height: 480 }, hud: { x: 0, y: 0, right: 96, bottom: 480 },
  body: { box: { x: 104, y: 81, right: 536, bottom: 351 },
    paragraphs: [{ copy: 'Browser checkpoint explanation', lines: [{ x: 120, y: 81, right: 520, bottom: 111 }] }] },
})

test('checkpoint containment accepts scaled native/fallback line geometry and vertically scrolled copy', () => {
  for (const scale of [.5, 1, 2.25]) {
    const layout = fixture()
    layout.viewport.width *= scale; layout.viewport.height *= scale
    layout.body.paragraphs[0].lines.push({ x: 120, y: 360, right: 520, bottom: 390 })
    for (const box of [layout.hud, layout.body.box, ...layout.body.paragraphs[0].lines])
      for (const key of ['x', 'y', 'right', 'bottom']) box[key] *= scale
    assert.doesNotThrow(() => assertCheckpointBodyClearance(layout))
  }
})

test('checkpoint containment rejects the retained 640px body/HUD defect and painted text overhang', () => {
  const original = fixture()
  original.body.box = { x: 32, y: 81, right: 608, bottom: 351 }
  original.body.paragraphs[0].lines = [{ x: 54, y: 81, right: 586, bottom: 111 }]
  assert.throws(() => assertCheckpointBodyClearance(original), /must clear the live native HUD/)
  for (const key of ['x', 'right']) {
    const layout = fixture()
    layout.body.paragraphs[0].lines[0][key] = key === 'x' ? 94 : 540
    assert.throws(() => assertCheckpointBodyClearance(layout), /stays inside its HUD-safe body/)
  }
})

test('checkpoint containment fails closed for absent or malformed body, HUD or rendered text', () => {
  for (const change of [s => s.viewport = null, s => s.viewport.width = Infinity, s => s.viewport.height = 0,
    s => s.hud = null, s => s.hud.right = NaN, s => s.body.box.right = 641,
    s => s.body.paragraphs = [], s => s.body.paragraphs[0].lines = [],
    s => s.body.paragraphs[0].lines[0].bottom = Infinity]) {
    const layout = fixture(); change(layout)
    assert.throws(() => assertCheckpointBodyClearance(layout))
  }
})
