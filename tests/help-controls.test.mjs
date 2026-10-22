import test from 'node:test'
import assert from 'node:assert/strict'
import { helpNavigationFrame, helpNavigationPlan, helpNavigationTiles, helpScrollbarPlan } from '../app/help-controls.ts'
import { helpPanelLayout } from '../app/help-layout.ts'

const panels = helpPanelLayout(640, 480, 100)
const draw = { counter: 0, leftDown: false, leftUp: false }

test('native frame selection is counter-driven, with pressed precedence', () => {
  for (let counter = 0; counter < 16; counter++) {
    assert.equal(helpNavigationFrame(false, false, counter), 'normal')
    assert.equal(helpNavigationFrame(true, false, counter), counter & 4 ? 'hover' : 'normal')
    assert.equal(helpNavigationFrame(true, true, counter), 'held')
    assert.equal(helpNavigationFrame(false, true, counter), 'held')
  }
  for (const counter of [undefined, -1, 0x100000000, 0.5, NaN]) assert.throws(() => helpNavigationFrame(true, false, counter), /counter/)
})

test('original navigation glyph order, centering, and retained frame URLs', () => {
  const plans = panels.navigation.map((rect, i) => helpNavigationPlan(rect, i, false, draw))
  assert.deepEqual(plans.map(p => p.action), ['back', 'forward', 'home', 'close'])
  assert.deepEqual(plans.map(p => p.icon.id), [439, 440, 442, 441])
  assert.deepEqual(plans.map(p => [p.iconX, p.iconY]), [[5, 3], [5, 3], [4, 3], [4, 4]])
  assert.ok(plans.every(p => p.frameUrl === '/original/hud-button.png'))
  const hovered = helpNavigationPlan(panels.navigation[0], 0, true, { ...draw, counter: 4 })
  assert.equal(hovered.frameUrl, '/original/hud-button-selected.png')
  const held = helpNavigationPlan(panels.navigation[0], 0, true, { ...draw, leftDown: true })
  assert.equal(held.frameUrl, '/original/hud-button-hover.png')
  assert.equal(held.icon.id, 447)
  assert.equal(helpNavigationPlan(panels.navigation[0], 0, true, { ...draw, leftDown: true, leftUp: true }).icon.id, 439)
  assert.equal(helpNavigationPlan(panels.navigation[0], 0, false, { ...draw, leftDown: true }).icon.id, 439)
})

test('8px repeats cover 24x28 without a centered half-tile phase change', () => {
  const tiles = helpNavigationTiles(), coverage = new Uint8Array(24 * 28)
  for (const tile of tiles) for (let y = tile.y; y < tile.y + tile.height; y++)
    for (let x = tile.x; x < tile.x + tile.width; x++) coverage[y * 24 + x]++
  assert.ok(coverage.every(n => n === 1))
  assert.deepEqual(tiles.find(p => p.x === 8 && p.y === 16), { x: 8, y: 16, width: 8, height: 4, sourceX: 8, sourceY: 8 })
})

test('scroll arrows move with the thumb, retain native caps, and vanish for Query', () => {
  const empty = helpScrollbarPlan(panels.scrollbar, 174, 368, 0, null)
  assert.deepEqual([empty.up, empty.down, empty.body], [null, null, null])
  const scroll = helpScrollbarPlan(panels.scrollbar, 736, 368, 14, 'up')
  assert.equal(scroll.thumb, 184)
  assert.equal(scroll.maximum, 184)
  assert.equal(scroll.pixels, 28)
  assert.equal(scroll.up.id, 453)
  assert.equal(scroll.up.y, 68)
  assert.equal(scroll.down.id, 452)
  assert.equal(scroll.down.y, 240)
  assert.equal(scroll.body.y, 78)
  assert.equal(scroll.body.height, 162)
  const clamped = helpScrollbarPlan(panels.scrollbar, 100000, 368, 1000, 'down')
  assert.equal(clamped.thumb, 22)
  assert.equal(clamped.position, 346)
  assert.equal(clamped.body.height, 0)
  assert.equal(clamped.down.id, 454)
})
