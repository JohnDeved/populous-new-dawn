import test from 'node:test'
import assert from 'node:assert/strict'
import { layoutHelpText, helpPanelLayout, helpScroll } from '../app/help-layout.ts'
import art from '../app/original-help.json' with { type: 'json' }

// Independently transcribed addressed-source fixtures, not native runtime captures.
test('640×480 actual100px HUD uses native three regions, gaps and navigation', () => {
  const layout = helpPanelLayout(640, 480, 100)
  assert.deepEqual(layout.inner, {
    contents: { x: 154, y: 54, width: 192, height: 160 },
    preview: { x: 154, y: 262, width: 192, height: 160 },
    article: { x: 394, y: 54, width: 192, height: 368 },
  })
  assert.deepEqual(layout.navigation, [61, 96, 131, 166].map(y => ({ x: 316, y, width: 24, height: 28 })))
  assert.deepEqual(layout.scrollbar, { x: 602, y: 54, width: 24, height: 368 })
})
test('source Query markup keeps original glyph heights, run breaks and trailing spaces', () => {
  const layout = layoutHelpText(art.topics['1051'].text, 192)
  assert.equal(layout.height, 174)
  assert.deepEqual(layout.rows.map(row => [row.y, row.height, row.width, row.text]), [
    [0, 20, 126, 'Query Button'], [24, 10, 0, ''],
    [38, 10, 184, 'The Query Button allows you to '],
    [52, 10, 182, 'go directly to a section of this '],
    [66, 10, 168, 'Encyclopaedia by clicking on a '],
    [80, 10, 173, 'specific icon or object. To use, '],
    [94, 10, 176, 'left-click on the icon and your '],
    [108, 10, 174, 'mouse pointer will change to a '],
    [122, 10, 183, 'question mark. You can then left-'],
    [136, 10, 197, 'click on any icon or object on the '],
    [150, 10, 165, 'screen and go straight to its '],
    [164, 10, 173, 'explanation in the Encyclopaedia.'],
  ])
  assert.deepEqual(art.topics['1051'].illustration, { kind: 255, args: [0, 0, 0] })
})
test('original contents links and unavailable prose do not receive invented headings or styles', () => {
  const contents = layoutHelpText(art.topics['983'].text, 192)
  assert.equal(contents.height, 117)
  assert.deepEqual(contents.rows.flatMap(row => row.nodes.filter(node => node.link >= 0 && node.text).map(node => node.link)), [63, 2, 12, 22, 39, 46])
  const unavailable = layoutHelpText(art.topics['1057'].text, 192)
  assert.equal(unavailable.height, 38)
  assert.deepEqual(unavailable.rows.map(row => row.text), ['Information on this item is ', "unavailable because you haven't ", 'discovered it yet.'])
  assert.ok(unavailable.rows.every(row => row.nodes.every(node => node.font === 4)))
  const bold = layoutHelpText('A<b>B</b>C', 100)
  assert.ok(bold.rows.flatMap(row => row.nodes).every(node => node.font === 4))
})
test('narrow-pane safety terminates; unresolved image markup is rejected rather than silently omitted', () => {
  assert.equal(layoutHelpText('AB', 1).rows.map(row => row.text).join(''), 'AB')
  assert.throws(() => layoutHelpText('<i 1>', 200), /Unsupported/)
  assert.throws(() => layoutHelpText('abc', 0), /Invalid/)
})
test('article scroll uses proportional native thumb state, not seven text pixels per arrow', () => {
  assert.deepEqual(helpScroll(174, 368, 300, 16, 7), { thumb: 0, maximum: 0, position: 0, pixels: 0 })
  assert.deepEqual(helpScroll(1000, 368, 300, 16, 7), { thumb: 110, maximum: 190, position: 7, pixels: 23 })
  assert.equal(helpScroll(1000, 368, 300, 16, 1000).pixels, 632)
})
