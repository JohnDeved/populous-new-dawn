import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFileSync } from 'node:fs'
import { observeOptionsStorage, assertOptionsCopyClearance } from '../scripts/native-ui-evidence/options-copy-clearance.mjs'

const box = (x, y, right, bottom) => ({ x, y, right, bottom })
// Source-derived synthetic ownership, not fields observed by the failed Gen09 read.
function ownerFixture(skin, scale = 1) {
  const paint = { backgroundColor: skin === 'frontend' ? 'rgb(23, 19, 9)' : 'rgba(0, 0, 0, 0)',
    backgroundImage: 'none', opacity: '1', visibility: 'visible', display: 'block' }
  return { skin, main: skin === 'frontend', pause: skin === 'ingame', open: true, modal: true,
    modalCount: 1, soleModalOwner: true, box: box(0, 0, 640 * scale, 480 * scale), paint: { ...paint }, backdrop: { ...paint } }
}
function sample({ skin = 'ingame', category = 'game', fallback = false, scale = 1 } = {}) {
  const sized = b => Object.fromEntries(Object.entries(b).map(([key, value]) => [key, value * scale]))
  const text = y => ({ text: 'Safe copy', mode: fallback ? 'fallback' : 'glyphs', glyphs: fallback ? 0 : 9,
    visible: true, boxes: fallback ? [sized(box(110, y, 530, y + 28))]
      : Array.from({ length: 9 }, (_, i) => sized(box(110 + i * 20, y, 130 + i * 20, y + 28))) })
  return { optionsCount: 1, navigation: sized(box(99, 420, 241, 446)),
    layout: { viewport: { width: 640 * scale, height: 480 * scale } },
    owner: ownerFixture(skin, scale),
    hud: [{ ...sized(box(0, 0, 95, 480)), visible: true, insideOptionsDialog: false }],
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

test('retained frontend HUD geometry needs a separately source-derived opaque modal witness', () => {
  // Only these five HUD fields reproduce the actual Gen09 failing measurement.
  const retainedHudGeometry = { x: 0, y: 0, right: 96, bottom: 480, visible: true }
  const value = sample({ skin: 'frontend' })
  value.hud = [{ ...retainedHudGeometry, insideOptionsDialog: false }]
  value.browserCopy[1].texts[0].boxes[0] = box(58, 338, 74, 366)
  assertOptionsCopyClearance(value, { skin: 'frontend', category: 'game', fallback: false })
  delete value.owner
  assert.throws(() => assertOptionsCopyClearance(value, { skin: 'frontend', category: 'game', fallback: false }),
    /same-read modal ownership/, 'The historical read without a new witness is not retroactively passed')
})

for (const [name, change] of [
  ['missing owner', s => { s.owner = null }],
  ['wrong Options skin', s => { s.owner.skin = 'unknown' }],
  ['wrong dialog marker', s => { s.owner.main = !s.owner.main; s.owner.pause = !s.owner.pause }],
  ['ambiguous owner markers', s => { s.owner.main = true; s.owner.pause = true }],
  ['closed owner', s => { s.owner.open = false }],
  ['open but nonmodal owner', s => { s.owner.modal = false }],
  ['no modal owner', s => { s.owner.modalCount = 0 }],
  ['duplicate modal owners', s => { s.owner.modalCount = 2 }],
  ['different live modal', s => { s.owner.soleModalOwner = false }],
  ['partially covered viewport', s => { s.owner.box.right-- }],
  ['nonfinite owner geometry', s => { s.owner.box.x = NaN }],
  ['translucent dialog', s => { s.owner.paint.opacity = '.5' }],
  ['translucent backdrop', s => { s.owner.backdrop.opacity = '.5' }],
  ['missing paint witness', s => { delete s.owner.paint }],
  ['missing computed display', s => { delete s.owner.paint.display }],
  ['hidden dialog', s => { s.owner.paint.visibility = 'hidden' }],
  ['hidden backdrop', s => { s.owner.backdrop.display = 'none' }],
  ['unaccounted dialog image', s => { s.owner.paint.backgroundImage = 'url(opaque.png)' }],
  ['unaccounted backdrop image', s => { s.owner.backdrop.backgroundImage = 'url(opaque.png)' }],
  ['HUD inside the foreground modal', s => { s.hud[0].insideOptionsDialog = true }],
  ['missing mounted HUD', s => { s.hud = [] }],
  ['duplicate mounted HUD', s => { s.hud.push(s.hud[0]) }],
]) test(`modal ownership rejects ${name} in both contexts`, () => {
  for (const skin of ['frontend', 'ingame']) {
    const value = sample({ skin }); change(value)
    assert.throws(() => assertOptionsCopyClearance(value, { skin, category: 'game', fallback: false }))
  }
})

test('frontend requires opaque coverage while in-game Options preserves transparent exposure', () => {
  for (const skin of ['frontend', 'ingame']) for (const surface of ['paint', 'backdrop']) {
    const value = sample({ skin })
    value.owner[surface].backgroundColor = skin === 'frontend' ? 'rgba(23, 19, 9, 0.5)' : 'rgb(23, 19, 9)'
    assert.throws(() => assertOptionsCopyClearance(value, { skin, category: 'game', fallback: false }))
  }
})

test('synthetic owner fixtures stay bound to the shipped modal invocation and CSS contracts', () => {
  for (const [name, marker, background] of [['main', 'main', '#171309'], ['pause', 'pause', 'transparent']]) {
    const source = readFileSync(new URL(`../app/original-${name}-menu.tsx`, import.meta.url), 'utf8')
    const css = readFileSync(new URL(`../app/original-${name}-menu.module.css`, import.meta.url), 'utf8')
    assert.match(source, /modal\?\.showModal\(\)/)
    assert.ok(source.includes(`data-original-${marker}-menu`))
    const dialog = css.match(/\.dialog\s*\{([^}]+)\}/)[1]
    for (const declaration of ['position: fixed', 'inset: 0', 'width: 100vw', 'height: 100dvh',
      'border: 0', 'border-radius: 0', `background: ${background}`]) assert.ok(dialog.includes(`${declaration};`))
    assert.ok(css.includes(`.dialog::backdrop { background: ${background}; }`))
  }
})

for (const [name, change] of [
  ['reported native notice reaches x63 inside the x95 HUD', s => { s.browserCopy[1].texts[0].boxes[0].x = 63 }],
  ['help glyph enters the HUD while its wide button still fits viewport', s => { s.browserCopy[0].texts[0].boxes[0].x = 90 }],
  ['third notice row reaches navigation', s => { s.browserCopy[1].texts[1].boxes[0].bottom = 426 }],
  ['offscreen HUD cannot make clearance vacuous', s => { s.hud[0] = { ...s.hud[0], ...box(-100, 0, -5, 480) } }],
  ['vertically offscreen HUD', s => { s.hud[0] = { ...s.hud[0], ...box(0, -500, 95, -20) } }],
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

test('the actual observer reads same-evaluation modal ownership, glyphs and fallback fragments with original fields', () => {
  for (const skin of ['frontend', 'ingame']) for (const fallback of [false, true]) {
    const measured = box(110, 338, 130, 366), parent = box(0, 338, 640, 368)
    const glyph = { getBoundingClientRect: () => measured }
    const text = { getBoundingClientRect: () => parent,
      getAttribute: key => ({ 'data-options-font': fallback ? 'fallback' : 'glyphs', 'data-options-text': 'X' })[key],
      querySelectorAll: selector => { assert.equal(selector, 'i'); return fallback ? [] : [glyph] } }
    const line = { firstElementChild: text, offsetHeight: 30, textContent: fallback ? 'X' : '',
      querySelectorAll: () => fallback ? [] : [glyph] }
    let node
    const hud = { getBoundingClientRect: () => box(0, 0, 95, 480) }
    const dialog = { open: true, getBoundingClientRect: () => box(0, 0, 640, 480),
      matches: selector => ({ ':modal': true, '[data-original-main-menu]': skin === 'frontend', '[data-original-pause-menu]': skin === 'ingame' })[selector],
      contains: element => { assert.equal(element, hud); return false } }
    const options = { querySelectorAll: () => [node], querySelector: () => ({ getBoundingClientRect: () => box(99, 420, 241, 446) }),
      closest: selector => { assert.equal(selector, 'dialog'); return dialog },
      getAttribute: key => { assert.equal(key, 'data-skin'); return skin } }
    node = { closest: () => options, getAttribute: key => key === 'data-options-browser-copy' ? 'storage' : 'Full storage announcement',
      querySelectorAll: selector => selector === '[data-options-text]' ? [text]
        : selector === ':scope > [aria-hidden]' ? [line] : fallback ? [] : [glyph] }
    let ranges = 0, modalInventory = [dialog]
    const sandbox = { node, window: { innerWidth: 640, innerHeight: 480 },
      document: { querySelectorAll: selector => {
        assert.ok(['.native-hud', '[data-original-options]', 'dialog:modal'].includes(selector))
        return selector === '.native-hud' ? [hud] : selector === 'dialog:modal' ? modalInventory : [options]
      },
        createRange: () => ({ selectNodeContents: actual => { assert.equal(actual, text); ranges++ }, getClientRects: () => [measured] }) },
      getComputedStyle: (element, pseudo) => element === dialog ? ownerFixture(skin)[pseudo === '::backdrop' ? 'backdrop' : 'paint'] : ({ visibility: 'visible', display: 'inline', backgroundColor: 'rgba(0, 0, 0, 0)',
        backgroundImage: 'url(/original/pause-font.png)', getPropertyValue: () => '1' }) }
    const result = JSON.parse(JSON.stringify(vm.runInNewContext(`(${observeOptionsStorage.toString()})(node)`, sandbox)))
    assert.deepEqual(result.lines[0].box, parent, 'Original assertion input stays intact')
    assert.deepEqual(result.browserCopy[0].texts[0].boxes, [measured], 'New occupied box is not the parent container')
    assert.equal(result.copy, 'Full storage announcement')
    assert.equal(result.lines[0].pitch, 30)
    assert.equal(result.optionsCount, 1)
    assert.deepEqual(result.owner, ownerFixture(skin))
    assert.equal(result.hud[0].insideOptionsDialog, false)
    assert.equal(ranges, 1)
    assertOptionsCopyClearance(result, { skin, category: 'sound', fallback })
    for (const inventory of [[dialog, {}], [{}], []]) {
      modalInventory = inventory
      const ambiguous = JSON.parse(JSON.stringify(vm.runInNewContext(`(${observeOptionsStorage.toString()})(node)`, sandbox)))
      assert.equal(ambiguous.owner.modalCount, inventory.length)
      assert.equal(ambiguous.owner.soleModalOwner, false)
      assert.throws(() => assertOptionsCopyClearance(ambiguous, { skin, category: 'sound', fallback }), /modal dialog/)
    }
  }
})

test('canonical checker executes and fingerprints the occupied-copy guard', () => {
  const manifest = JSON.parse(readFileSync(new URL('../engineering/checks.json', import.meta.url)))
  const check = manifest.checks.find(item => item.id === 'native-ui-evidence-tests')
  assert.ok(check.args.includes('tests/options-copy-clearance.test.mjs'))
  for (const path of ['tests/options-copy-clearance.test.mjs', 'app/original-options.tsx',
    'app/original-main-menu.tsx', 'app/original-main-menu.module.css',
    'app/original-pause-menu.tsx', 'app/original-pause-menu.module.css']) {
    assert.ok(check.inputs.includes(path)); assert.ok(check.triggerPaths.includes(path))
  }
  assert.ok(check.inputs.includes('scripts/native-ui-evidence'))
  assert.ok(check.triggerPaths.includes('scripts/native-ui-evidence'))
})
