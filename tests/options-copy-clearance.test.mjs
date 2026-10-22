import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFileSync } from 'node:fs'
import { observeOptionsStorage, assertOptionsCopyClearance } from '../scripts/native-ui-evidence/options-copy-clearance.mjs'

const box = (x, y, right, bottom) => ({ x, y, right, bottom })
function sample({ skin = 'ingame', category = 'game', fallback = false, scale = 1 } = {}) {
  const sized = b => Object.fromEntries(Object.entries(b).map(([key, value]) => [key, value * scale]))
  const text = y => ({ text: 'Safe copy', mode: fallback ? 'fallback' : 'glyphs', glyphs: fallback ? 0 : 9,
    visible: true, boxes: fallback ? [sized(box(110, y, 530, y + 28))]
      : Array.from({ length: 9 }, (_, i) => sized(box(110 + i * 20, y, 130 + i * 20, y + 28))) })
  return { optionsCount: 1, navigation: sized(box(99, 420, 241, 446)),
    layout: { viewport: { width: 640 * scale, height: 480 * scale } },
    hud: skin === 'ingame' ? [{ ...sized(box(0, 0, 95, 480)), visible: true }] : [],
    browserCopy: [...(category === 'game' ? [{ kind: 'help', ownerValid: true, texts: [text(289)] }] : []),
      { kind: 'storage', ownerValid: true, texts: [text(338), text(368)] }] }
}

test('native and fallback browser copy clear the real HUD at compact, native and wide scales', () => {
  for (const skin of ['frontend', 'ingame']) for (const category of ['game', 'sound'])
    for (const fallback of [false, true]) for (const scale of [.5, 1, 1.5]) {
      const args = { skin, category, fallback, scale }
      assertOptionsCopyClearance(sample(args), args)
    }
})

for (const [name, change] of [
  ['reported native notice reaches x63 inside the x95 HUD', s => { s.browserCopy[1].texts[0].boxes[0].x = 63 }],
  ['help glyph enters the HUD while its wide button still fits viewport', s => { s.browserCopy[0].texts[0].boxes[0].x = 90 }],
  ['third notice row reaches navigation', s => { s.browserCopy[1].texts[1].boxes[0].bottom = 426 }],
  ['hidden HUD', s => { s.hud[0].visible = false }],
  ['missing HUD', s => { s.hud = [] }],
  ['duplicate HUD', s => { s.hud.push(s.hud[0]) }],
  ['missing help copy', s => { s.browserCopy.shift() }],
  ['duplicate storage copy', s => { s.browserCopy.push(s.browserCopy[1]) }],
  ['wrong copy owner', s => { s.browserCopy[1].ownerValid = false }],
  ['missing glyph', s => { s.browserCopy[1].texts[0].glyphs-- }],
  ['empty glyph geometry', s => { s.browserCopy[1].texts[0].boxes = [] }],
  ['nonfinite geometry', s => { s.browserCopy[1].texts[0].boxes[0].x = NaN }],
  ['zero-area geometry', s => { s.browserCopy[1].texts[0].boxes[0].right = 110 }],
  ['hidden copy', s => { s.browserCopy[1].texts[0].visible = false }],
  ['duplicate Options owner', s => { s.optionsCount = 2 }],
  ['wrong rendering mode', s => { s.browserCopy[1].texts[0].mode = 'fallback' }],
]) test(`occupied-copy guard rejects ${name}`, () => {
  const value = sample(); change(value)
  assert.throws(() => assertOptionsCopyClearance(value, { skin: 'ingame', category: 'game', fallback: false }))
})

test('fallback uses actual text fragments, not a passing 640 px parent or a missing line', () => {
  for (const change of [s => { s.browserCopy[1].texts[0].boxes[0].x = 90 },
    s => { s.browserCopy[1].texts[0].boxes = [] }]) {
    const value = sample({ fallback: true }); change(value)
    assert.throws(() => assertOptionsCopyClearance(value, { skin: 'ingame', category: 'game', fallback: true }))
  }
})

test('the actual browser observer reads glyph boxes and fallback Range fragments with original storage fields', () => {
  for (const fallback of [false, true]) {
    const measured = box(110, 338, 130, 366), parent = box(0, 338, 640, 368)
    const glyph = { getBoundingClientRect: () => measured }
    const text = { getBoundingClientRect: () => parent,
      getAttribute: key => ({ 'data-options-font': fallback ? 'fallback' : 'glyphs', 'data-options-text': 'X' })[key],
      querySelectorAll: selector => { assert.equal(selector, 'i'); return fallback ? [] : [glyph] } }
    const line = { firstElementChild: text, offsetHeight: 30, textContent: fallback ? 'X' : '',
      querySelectorAll: () => fallback ? [] : [glyph] }
    let node
    const options = { querySelectorAll: () => [node], querySelector: () => ({ getBoundingClientRect: () => box(99, 420, 241, 446) }) }
    node = { closest: () => options, getAttribute: key => key === 'data-options-browser-copy' ? 'storage' : 'Full storage announcement',
      querySelectorAll: selector => selector === '[data-options-text]' ? [text]
        : selector === ':scope > [aria-hidden]' ? [line] : fallback ? [] : [glyph] }
    let ranges = 0
    const sandbox = { node, window: { innerWidth: 640, innerHeight: 480 },
      document: { querySelectorAll: selector => selector === '.native-hud'
        ? [{ getBoundingClientRect: () => box(0, 0, 95, 480) }] : [options],
        createRange: () => ({ selectNodeContents: actual => { assert.equal(actual, text); ranges++ }, getClientRects: () => [measured] }) },
      getComputedStyle: () => ({ visibility: 'visible', display: 'inline', backgroundColor: 'rgba(0, 0, 0, 0)',
        backgroundImage: 'url(/original/pause-font.png)', getPropertyValue: () => '1' }) }
    const result = JSON.parse(JSON.stringify(vm.runInNewContext(`(${observeOptionsStorage.toString()})(node)`, sandbox)))
    assert.deepEqual(result.lines[0].box, parent, 'Original assertion input stays intact')
    assert.deepEqual(result.browserCopy[0].texts[0].boxes, [measured], 'New occupied box is not the parent container')
    assert.equal(result.copy, 'Full storage announcement')
    assert.equal(result.lines[0].pitch, 30)
    assert.equal(result.optionsCount, 1)
    assert.equal(ranges, 1)
    assertOptionsCopyClearance(result, { skin: 'ingame', category: 'sound', fallback })
  }
})

test('canonical checker executes and fingerprints the occupied-copy guard', () => {
  const manifest = JSON.parse(readFileSync(new URL('../engineering/checks.json', import.meta.url)))
  const check = manifest.checks.find(item => item.id === 'native-ui-evidence-tests')
  assert.ok(check.args.includes('tests/options-copy-clearance.test.mjs'))
  for (const path of ['tests/options-copy-clearance.test.mjs', 'app/original-options.tsx']) {
    assert.ok(check.inputs.includes(path)); assert.ok(check.triggerPaths.includes(path))
  }
  assert.ok(check.inputs.includes('scripts/native-ui-evidence'))
  assert.ok(check.triggerPaths.includes('scripts/native-ui-evidence'))
})
