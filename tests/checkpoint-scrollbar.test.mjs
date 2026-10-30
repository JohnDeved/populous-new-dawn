import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { assertCheckpointScrollbar, assertCheckpointCapsOccupied } from '../scripts/local-render/checkpoint-scrollbar-observation.mjs'
import { assertCheckpointBodyClearance } from '../scripts/local-render/checkpoint-body-clearance.mjs'
import { assertFullscreenClearance } from '../scripts/local-render/fullscreen-clearance.mjs'

// The fixture computes browser measurements independently; it does not import
// application geometry or substitute assertions for the production helper.
function fixture({ scale = 1, overflow = true, end = false, highlighted = false,
  panel = 'save', clientWidth = 432 } = {}) {
  const box = (x, y, width, height) => ({ x: x * scale, y: y * scale,
    width: width * scale, height: height * scale,
    right: (x + width) * scale, bottom: (y + height) * scale })
  const scrollTop = overflow && end ? 270 : 0
  const contentHeight = overflow ? 540 : 270
  const thumbTop = end ? 135 : 0
  const action = label => ({ label, marker: label, owner: true, cap: null,
    top: label === 'Back' ? 454 : 399,
    box: box(220, label === 'Back' ? 454 : 399, 200, label === 'Back' ? 26 : 29),
    visible: true, disabled: false, reachable: true })
  const buttons = [action('Back'), action(panel === 'save' ? 'Save checkpoint' : 'Load checkpoint')]
  const cap = direction => {
    const up = direction === 'up', height = up ? 10 : 12
    const src = `/original/help/hfx-${(up ? 451 : 452) + (highlighted ? 2 : 0)}.png`
    const capBox = box(512, 81 + thumbTop + (up ? 0 : 123), 24, height)
    return { direction, tag: 'BUTTON', label: `Scroll checkpoint details ${direction}`,
      action: null, controls: 'checkpoint-details-fixture', controlsOwner: true, owner: true,
      disabled: false, tabIndex: 0, visible: true, hit: true, highlighted, box: capBox,
      image: { count: 1, src, currentSrc: src, sameOrigin: true, complete: true,
        width: 24, height, alt: '', draggable: false, visible: true, box: { ...capBox } } }
  }
  const caps = overflow ? [cap('up'), cap('down')] : []
  return {
    panel, viewport: { width: 640 * scale, height: 480 * scale },
    hud: box(0, 0, 96, 480), frame: box(0, 0, 640, 480),
    structure: { panels: 1, wrappers: 1, scrollers: 1, namedRegions: 1,
      owned: true, targetIsScroller: true },
    body: { left: 104, top: 81, width: 432, height: 270,
      overflow, horizontalOverflow: false, box: box(104, 81, 432, 270),
      paragraphs: [{ copy: 'One browser checkpoint. No original multi-slot saves.',
        lines: [box(104 + (clientWidth - 368) / 2, 81 - scrollTop, 368, 30)] }] },
    scroller: { box: box(104, 81, 432, 270), id: 'checkpoint-details-fixture', idCount: 1,
      label: 'Checkpoint details', role: 'region', tabIndex: 0, visible: true,
      focused: true, focusVisible: true, scrollTop, scrollHeight: contentHeight,
      clientHeight: 270, scrollWidth: clientWidth, clientWidth, overflowY: 'auto',
      scrollbarWidth: overflow ? 'none' : 'thin', contentWidth: 368,
      contentBox: box(104 + (clientWidth - 368) / 2, 81 - scrollTop, 368, contentHeight) },
    buttons,
    buttonKinds: [...buttons.map(button => ({ action: button.marker, cap: null, label: button.label })),
      ...caps.map(cap => ({ action: null, cap: cap.direction, label: cap.label }))],
    art: { enabled: String(overflow), forcedColors: false,
      track: overflow ? box(512, 81, 24, 270) : null,
      thumb: overflow ? box(512, 81 + thumbTop, 24, 135) : null,
      drag: overflow ? box(512, 91 + thumbTop, 24, 113) : null,
      visible: overflow, sibling: overflow,
      background: overflow ? 'url("https://fixture.test/original/help/hfx-455.png")' : null,
      dragImage: overflow ? { path: '/original/help/hfx-455.png', sameOrigin: true } : null,
      dragVisible: overflow, dragHit: overflow,
      repeat: overflow ? 'repeat-y' : null, caps },
  }
}

function fullscreen(layout) {
  return { viewport: layout.viewport, owner: true, count: 1, hit: true,
    button: { x: 12, y: 12, width: 17, height: 14 },
    focus: { x: 9, y: 9, right: 32, bottom: 29 },
    occupied: [
      { label: 'checkpoint wrapper', ...layout.body.box },
      ...layout.art.caps.map(cap => ({ label: cap.label, checkpointCap: cap.direction, ...cap.box })),
    ] }
}

test('normal checkpoint art accepts independent Home and End geometry at every native frame scale', () => {
  for (const scale of [.5, 1, 2.25]) for (const panel of ['save', 'load'])
    for (const end of [false, true]) for (const highlighted of [false, true]) {
      const layout = fixture({ scale, panel, end, highlighted })
      assert.doesNotThrow(() => assertCheckpointScrollbar(layout, panel))
      assert.doesNotThrow(() => assertCheckpointBodyClearance(layout))
      assert.doesNotThrow(() => assertCheckpointCapsOccupied(['up', 'down'], fullscreen(layout)))
      assert.doesNotThrow(() => assertFullscreenClearance(fullscreen(layout)))
    }
})

test('nonoverflowing copy retains a focusable real region without an art track or caps', () => {
  for (const scale of [.5, 1, 2.25]) for (const panel of ['save', 'load'])
    for (const clientWidth of [432, 417]) {
      const layout = fixture({ scale, panel, overflow: false, clientWidth })
      assert.doesNotThrow(() => assertCheckpointScrollbar(layout, panel))
      assert.doesNotThrow(() => assertCheckpointBodyClearance(layout))
      assert.doesNotThrow(() => assertCheckpointCapsOccupied([], fullscreen(layout)))
    }
})

const invalid = [
  ['missing section', s => s.structure.panels = 0],
  ['duplicate section', s => s.structure.panels = 2],
  ['missing wrapper', s => s.structure.wrappers = 0],
  ['duplicate wrapper', s => s.structure.wrappers = 2],
  ['missing actual scroller', s => s.structure.scrollers = 0],
  ['duplicate actual scroller', s => s.structure.scrollers = 2],
  ['missing named region', s => s.structure.namedRegions = 0],
  ['duplicate named region', s => s.structure.namedRegions = 2],
  ['wrong wrapper or scroller owner', s => s.structure.owned = false],
  ['absent wrapper geometry', s => s.body = null],
  ['absent scroller geometry', s => s.scroller = null],
  ['wrong wrapper left', s => s.body.left = 103],
  ['wrong wrapper top', s => s.body.top = 0],
  ['wrong wrapper width', s => s.body.width = 640],
  ['wrong wrapper height', s => s.body.height = 269],
  ['wrong rendered wrapper position', s => s.body.box.x++],
  ['wrong rendered scroller position', s => s.scroller.box.y++],
  ['missing scroller ID', s => s.scroller.id = ''],
  ['duplicate scroller ID', s => s.scroller.idCount = 2],
  ['wrong scroller label', s => s.scroller.label = 'Details'],
  ['wrong scroller role', s => s.scroller.role = 'group'],
  ['missing scroller Tab stop', s => s.scroller.tabIndex = -1],
  ['hidden actual scroller', s => s.scroller.visible = false],
  ['non-scrollable actual region', s => s.scroller.overflowY = 'hidden'],
  ['zero scroll height', s => s.scroller.scrollHeight = 0],
  ['nonfinite scroll metric', s => s.scroller.clientHeight = NaN],
  ['negative scroll position', s => s.scroller.scrollTop = -1],
  ['out-of-range scroll position', s => s.scroller.scrollTop = 272],
  ['nonfinite scroll position', s => s.scroller.scrollTop = NaN],
  ['wrapper overflow used instead of actual scroller', s => s.body.overflow = false],
  ['reported horizontal overflow', s => s.body.horizontalOverflow = true],
  ['actual horizontal overflow', s => s.scroller.scrollWidth++],
  ['old 432px copy width', s => s.scroller.contentWidth = 432],
  ['off-center copy', s => s.scroller.contentBox.x++],
  ['empty copy geometry', s => s.scroller.contentBox.width = 0],
  ['missing Back', s => s.buttons.shift()],
  ['missing checkpoint action', s => s.buttons.pop()],
  ['duplicate Back', s => s.buttons.push(structuredClone(s.buttons[0]))],
  ['wrong action for panel', s => s.buttons[1].label = 'Load checkpoint'],
  ['missing action marker', s => s.buttons[1].marker = null],
  ['mismatched action marker', s => s.buttons[1].marker = 'Back'],
  ['wrong action owner', s => s.buttons[1].owner = false],
  ['cap treated as text action', s => s.buttons[1].cap = 'down'],
  ['hidden action or ancestor', s => s.buttons[1].visible = false],
  ['disabled settled action', s => s.buttons[1].disabled = true],
  ['zero action geometry', s => s.buttons[1].box.width = 0],
  ['nonfinite action geometry', s => s.buttons[1].box.right = NaN],
  ['occluded action', s => s.buttons[1].reachable = false],
  ['unknown extra button', s => s.buttonKinds.push({ action: null, cap: null, label: 'Unknown' })],
  ['unclassified existing button', s => s.buttonKinds[0].action = null],
  ['dual-marked button', s => s.buttonKinds[0].cap = 'up'],
  ['normal asset failure masquerading as fallback', s => s.art.enabled = 'false'],
  ['forced-colors exception without separate admission', s => s.art.forcedColors = true],
  ['missing up cap', s => s.art.caps.shift()],
  ['missing down cap', s => s.art.caps.pop()],
  ['duplicate cap', s => s.art.caps.push(structuredClone(s.art.caps[0]))],
  ['wrong cap direction', s => s.art.caps[0].direction = 'left'],
  ['wrong cap tag', s => s.art.caps[0].tag = 'DIV'],
  ['wrong cap accessible label', s => s.art.caps[0].label = 'Up'],
  ['cap action marker', s => s.art.caps[0].action = 'Back'],
  ['disabled cap', s => s.art.caps[0].disabled = true],
  ['missing cap Tab stop', s => s.art.caps[0].tabIndex = -1],
  ['wrong cap owner', s => s.art.caps[0].owner = false],
  ['wrong aria-controls', s => s.art.caps[0].controls = 'another-region'],
  ['unresolved aria-controls owner', s => s.art.caps[0].controlsOwner = false],
  ['hidden cap or ancestor', s => s.art.caps[0].visible = false],
  ['occluded cap', s => s.art.caps[0].hit = false],
  ['zero cap geometry', s => s.art.caps[0].box.height = 0],
  ['nonfinite cap geometry', s => s.art.caps[0].box.x = NaN],
  ['cap outside track', s => s.art.caps[0].box.right++],
  ['missing cap image', s => s.art.caps[0].image = null],
  ['duplicate cap image', s => s.art.caps[0].image.count = 2],
  ['wrong cap image source', s => s.art.caps[0].image.src = '/original/help/hfx-452.png'],
  ['wrong resolved cap image source', s => s.art.caps[0].image.currentSrc = '/other.png'],
  ['foreign-origin cap image', s => s.art.caps[0].image.sameOrigin = false],
  ['incomplete cap image', s => s.art.caps[0].image.complete = false],
  ['undecoded cap image', s => s.art.caps[0].image.width = 0],
  ['wrong cap image dimensions', s => s.art.caps[0].image.height = 12],
  ['nondecorative cap image', s => s.art.caps[0].image.alt = 'Up'],
  ['draggable cap image', s => s.art.caps[0].image.draggable = true],
  ['hidden cap image or ancestor', s => s.art.caps[0].image.visible = false],
  ['zero cap image geometry', s => s.art.caps[0].image.box.width = 0],
  ['nonfinite cap image geometry', s => s.art.caps[0].image.box.bottom = NaN],
  ['image outside cap', s => s.art.caps[0].image.box.y++],
  ['idle image used while highlighted', s => s.art.caps[0].highlighted = true],
  ['unexpected system scrollbar in art mode', s => s.scroller.scrollbarWidth = 'thin'],
  ['hidden track or ancestor', s => s.art.visible = false],
  ['track inside scrolling copy', s => s.art.sibling = false],
  ['missing track', s => s.art.track = null],
  ['zero track geometry', s => s.art.track.width = 0],
  ['nonfinite track geometry', s => s.art.track.height = NaN],
  ['track outside wrapper', s => s.art.track.x++],
  ['stale thumb at End', s => s.scroller.scrollTop = 270],
  ['wrong thumb geometry', s => s.art.thumb.height++],
  ['missing drag body', s => s.art.drag = null],
  ['zero drag geometry', s => s.art.drag.height = 0],
  ['nonfinite drag geometry', s => s.art.drag.x = NaN],
  ['wrong drag body position', s => s.art.drag.y++],
  ['wrong tiled body image', s => s.art.dragImage.path = '/original/help/hfx-451.png'],
  ['missing tiled body image', s => s.art.dragImage = null],
  ['hidden tiled body or ancestor', s => s.art.dragVisible = false],
  ['occluded tiled body', s => s.art.dragHit = false],
  ['wrong tiled body repeat', s => s.art.repeat = 'repeat-x'],
]
for (const [label, mutate] of invalid) test(`checkpoint scrollbar rejects ${label}`, () => {
  const layout = fixture(); mutate(layout)
  assert.throws(() => assertCheckpointScrollbar(layout, 'save'))
})

test('no-overflow mode cannot retain caps or any art-track geometry', () => {
  for (const mutate of [
    s => s.art.caps = fixture().art.caps,
    s => s.art.enabled = 'true',
    s => s.art.track = fixture().art.track,
    s => s.art.thumb = fixture().art.thumb,
    s => s.art.drag = fixture().art.drag,
  ]) {
    const layout = fixture({ overflow: false }); mutate(layout)
    assert.throws(() => assertCheckpointScrollbar(layout, 'save'))
  }
})

test('stale End cap geometry cannot be hidden by updating only the surrounding thumb', () => {
  for (const scale of [.5, 1, 2.25]) {
    const layout = fixture({ scale, end: true })
    layout.art.caps = fixture({ scale }).art.caps
    assert.throws(() => assertCheckpointScrollbar(layout, 'save'))
  }
})

test('independent cap witness rejects missing, duplicated and invented fullscreen occupied caps', () => {
  for (const mutate of [
    s => s.occupied.pop(),
    s => s.occupied.splice(1),
    s => delete s.occupied[1].checkpointCap,
    s => s.occupied[1].checkpointCap = 'down',
    s => s.occupied[1].checkpointCap = 'left',
    s => s.occupied.push(structuredClone(s.occupied[1])),
  ]) {
    const sample = fullscreen(fixture()); mutate(sample)
    assert.throws(() => assertCheckpointCapsOccupied(['up', 'down'], sample))
  }
  for (const expected of [null, undefined, ['up'], ['up', 'up'], ['up', 'down', 'down'], ['left', 'right']])
    assert.throws(() => assertCheckpointCapsOccupied(expected, fullscreen(fixture())))
  assert.throws(() => assertCheckpointCapsOccupied([], fullscreen(fixture())))
  assert.throws(() => assertCheckpointCapsOccupied(['up', 'down'], fullscreen(fixture({ overflow: false }))))
})

test('cap-count witness does not weaken fullscreen malformed-bounds and ring-overlap assertions', () => {
  for (const mutate of [
    s => s.occupied[1].x = NaN,
    s => s.occupied[1].bottom = Infinity,
    s => s.occupied[1].right = s.occupied[1].x,
    s => Object.assign(s.occupied[1], { x: 30, y: 12, right: 54, bottom: 22 }),
  ]) {
    const sample = fullscreen(fixture()); mutate(sample)
    assert.doesNotThrow(() => assertCheckpointCapsOccupied(['up', 'down'], sample))
    assert.throws(() => assertFullscreenClearance(sample))
  }
})

test('successful art never substitutes for body, copy, line or HUD clearance', () => {
  for (const mutate of [
    s => s.body.paragraphs = [],
    s => s.body.paragraphs[0].lines = [],
    s => s.body.paragraphs[0].lines[0].x = s.hud.right - 1,
    s => s.body.paragraphs[0].lines[0].right = s.body.box.right + 1,
    s => s.body.paragraphs[0].lines[0].bottom = NaN,
    s => s.hud.right = s.body.box.x + 1,
    s => s.viewport.width = s.body.box.right - 1,
  ]) {
    const layout = fixture(); mutate(layout)
    assert.doesNotThrow(() => assertCheckpointScrollbar(layout, 'save'))
    assert.throws(() => assertCheckpointBodyClearance(layout))
  }
})

// A matching basename is not sufficient: the production observer resolves the
// computed URL, and the host assertion must require the current origin too.
test('tiled body rejects a foreign origin even when the basename is original', () => {
  const layout = fixture()
  layout.art.background = 'url("https://foreign.invalid/original/help/hfx-455.png")'
  layout.art.dragImage.sameOrigin = false
  assert.throws(() => assertCheckpointScrollbar(layout, 'save'))
})


test('checker cap/body images remain bound to tracked original-art provenance and actual PNG bytes', () => {
  const manifest = JSON.parse(readFileSync(new URL('../references/checkpoint-scrollbar-art.json', import.meta.url)))
  assert.equal(manifest.sourceCommit, 'fd34c4a60b643c294c167ab9bcd83b5871a82fd3')
  assert.deepEqual(Object.keys(manifest.assets), ['451', '452', '453', '454', '455'])
  for (const [index, id] of [451, 452, 453, 454, 455].entries()) {
    const asset = manifest.assets[id], height = [10, 12, 10, 12, 1][index]
    assert.deepEqual([asset.url, asset.width, asset.height], [`/original/help/hfx-${id}.png`, 24, height])
    const png = readFileSync(new URL(`../public${asset.url}`, import.meta.url))
    assert.equal(createHash('sha256').update(png).digest('hex'), asset.sha256)
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [24, height])
  }
})
