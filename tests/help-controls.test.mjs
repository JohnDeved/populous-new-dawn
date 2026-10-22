import test from 'node:test'
import assert from 'node:assert/strict'
import { helpNavigationFrame, helpNavigationPlan, helpNavigationTiles, helpScrollbarPlan, helpScrollbarAssets, helpScrollbarHover, helpScrollStep, createHelpScrollController } from '../app/help-controls.ts'
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


test('scrollbar preflights both ordinary and hovered caps plus the original one-pixel body', () => {
  assert.deepEqual(helpScrollbarAssets().map(({ id, width, height }) => [id, width, height]), [
    [451, 24, 10], [452, 24, 12], [453, 24, 10], [454, 24, 12], [455, 24, 1],
  ])
})

test('hover uses the current native half-open cap/body rectangles, not a captured DOM target', () => {
  const plan = helpScrollbarPlan(panels.scrollbar, 736, 368, 14, null)
  const hit = (x, y) => helpScrollbarHover(plan, { x, y })
  assert.equal(helpScrollbarHover(plan, null), null)
  assert.equal(hit(601, 68), null)
  assert.equal(hit(602, 67), null)
  assert.equal(hit(602, 68), 'up')
  assert.equal(hit(625, 77), 'up')
  assert.equal(hit(626, 77), null)
  assert.equal(hit(602, 78), 'drag')
  assert.equal(hit(625, 239), 'drag')
  assert.equal(hit(602, 240), 'down')
  assert.equal(hit(625, 251), 'down')
  assert.equal(hit(625, 252), null)
  const moved = helpScrollbarPlan(panels.scrollbar, 736, 368, 21, null)
  assert.equal(helpScrollbarHover(moved, { x: 602, y: 78 }), 'up')
  const minimum = helpScrollbarPlan(panels.scrollbar, 100000, 368, 0, null)
  assert.equal(helpScrollbarHover(minimum, { x: 602, y: 64 }), 'down')
  assert.equal(helpScrollbarHover(helpScrollbarPlan(panels.scrollbar, 174, 368, 0, null), { x: 602, y: 54 }), null)
  assert.throws(() => hit(602.5, 78), /coordinates/)
})

test('scrollbar cap focus survives pointer leave or hovering the other cap', () => {
  const plan = (hover, focus) => helpScrollbarPlan(panels.scrollbar, 736, 368, 0, hover, focus)
  assert.deepEqual([plan(null, 'up').up.id, plan(null, 'up').down.id], [453, 452])
  assert.deepEqual([plan('down', 'up').up.id, plan('down', 'up').down.id], [453, 454])
  assert.deepEqual([plan('up', 'down').up.id, plan('up', 'down').down.id], [453, 454])
  assert.deepEqual([plan(null, null).up.id, plan(null, null).down.id], [451, 452])
})

test('cap actions clamp seven track units rather than seven article pixels', () => {
  assert.equal(helpScrollStep(14, 184, 'up'), 7)
  assert.equal(helpScrollStep(14, 184, 'down'), 21)
  assert.equal(helpScrollbarPlan(panels.scrollbar, 736, 368, 21, null).pixels, 42)
  assert.equal(helpScrollStep(2, 184, 'up'), 0)
  assert.equal(helpScrollStep(180, 184, 'down'), 184)
  assert.equal(helpScrollStep(0, 0, 'down'), 0)
  assert.throws(() => helpScrollStep(0x7fffffff, 0x7fffffff, 'down'), /overflow is unsupported/)
  for (const [position, maximum] of [[-1, 100], [101, 100], [1.5, 100], [0, -1], [0, NaN], [0, 0x80000000]])
    assert.throws(() => helpScrollStep(position, maximum, 'down'), /position/)
})

const sample = (counter, mouseY, leftDown = true, leftUp = false) => ({ counter, mouseY, leftDown, leftUp })

test('drag requires its anchor, applies only once per actual draw and retains no position copy', () => {
  const controller = createHelpScrollController()
  assert.equal(controller.sample(20, 100, sample(0, 60)), 20)
  controller.begin(50)
  assert.equal(controller.sample(20, 100, sample(1, 55)), 25)
  assert.equal(controller.sample(25, 100, sample(1, 80)), 25)
  assert.equal(controller.sample(25, 100, sample(2, 60)), 30)
  // The caller may change position; the next sample uses that value, not shadow state.
  assert.equal(controller.sample(50, 100, sample(3, 65)), 55)
})

test('drag updates its anchor even when clamped and preserves the native zero sentinel', () => {
  const controller = createHelpScrollController()
  controller.begin(50)
  assert.equal(controller.sample(95, 100, sample(1, 100)), 100)
  assert.equal(controller.sample(100, 100, sample(2, 95)), 95)
  controller.begin(100)
  assert.equal(controller.sample(2, 100, sample(3, 90)), 0)
  assert.equal(controller.sample(0, 100, sample(4, 95)), 5)
  assert.equal(controller.sample(5, 100, sample(5, 0)), 0)
  assert.equal(controller.sample(0, 100, sample(6, 50)), 0)
  controller.begin(0)
  assert.equal(controller.sample(20, 100, sample(7, 60)), 20)
})

test('either native release condition clears dragging, including before applying a delta', () => {
  for (const [down, up] of [[false, false], [true, true], [false, true]]) {
    const controller = createHelpScrollController()
    controller.begin(50)
    assert.equal(controller.sample(20, 100, sample(1, 80, down, up)), 20)
    assert.equal(controller.sample(20, 100, sample(2, 90)), 20)
  }
})

test('drag reset is idempotent, counter wrap is valid, and invalid native inputs stay unsupported', () => {
  const controller = createHelpScrollController()
  controller.begin(50)
  assert.equal(controller.sample(20, 100, sample(0xffffffff, 60)), 30)
  assert.equal(controller.sample(30, 100, sample(0, 65)), 35)
  controller.reset()
  controller.reset()
  assert.equal(controller.sample(35, 100, sample(1, 100)), 35)
  for (const y of [NaN, 1.5, undefined, -0x80000001, 0x80000000]) assert.throws(() => controller.begin(y), /mouse Y/)
  for (const counter of [NaN, -1, 0x100000000, 0.5])
    assert.throws(() => controller.sample(35, 100, sample(counter, 65)), /counter/)
  assert.throws(() => controller.sample(101, 100, sample(2, 65)), /position/)
  assert.throws(() => controller.sample(35, 100, sample(2, NaN)), /mouse Y/)
})


test('native hover signed-word boundaries are accepted and impossible coordinates rejected', () => {
  const plan = helpScrollbarPlan(panels.scrollbar, 736, 368, 0, null)
  for (const value of [-0x8000, 0x7fff]) {
    assert.equal(helpScrollbarHover(plan, { x: value, y: 54 }), null)
    assert.equal(helpScrollbarHover(plan, { x: 602, y: value }), null)
  }
  for (const value of [-0x8001, 0x8000, NaN, 0.5]) {
    assert.throws(() => helpScrollbarHover(plan, { x: value, y: 54 }), /signed16/)
    assert.throws(() => helpScrollbarHover(plan, { x: 602, y: value }), /signed16/)
  }
})

test('drag signed-DWORD subtraction and addition wrap before clamping', () => {
  const controller = createHelpScrollController()
  controller.begin(-0x80000000)
  assert.equal(controller.sample(0, 0x7fffffff, sample(1, 0x7fffffff)), 0,
    'MAX - MIN wraps to -1, then the native negative clamp applies')
  controller.begin(0x7fffffff)
  assert.equal(controller.sample(0, 0x7fffffff, sample(2, -0x80000000)), 1,
    'MIN - MAX wraps to +1, not an unbounded negative value')
  controller.begin(1)
  assert.equal(controller.sample(0x7fffffff, 0x7fffffff, sample(3, 2)), 0,
    'valid delta +1 can also overflow the native position addition')
  assert.throws(() => controller.sample(0, 100, sample(4, 0x80000000)), /signed32/)
  assert.throws(() => controller.sample(0, 0x80000000, sample(4, 1)), /position/)
})
