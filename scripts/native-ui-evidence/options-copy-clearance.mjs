import assert from 'node:assert/strict'

// One read retains the original storage sample and actual browser-added copy
// geometry. Do not use the 540/640 px button/status containers as text bounds.
export function observeOptionsStorage(node) {
  const bounds = element => {
    const r = element.getBoundingClientRect()
    return { x: r.x, y: r.y, right: r.right, bottom: r.bottom }
  }
  const options = node.closest('[data-original-options]')
  const hud = [...document.querySelectorAll('.native-hud')]
  const copy = [...options.querySelectorAll('[data-options-browser-copy]')].map(owner => ({
    kind: owner.getAttribute('data-options-browser-copy'),
    ownerValid: owner === node || owner.matches('button[data-compatibility]'),
    texts: [...owner.querySelectorAll('[data-options-text]')].map(text => {
      const mode = text.getAttribute('data-options-font'), glyphs = [...text.querySelectorAll('i')]
      const range = document.createRange()
      range.selectNodeContents(text)
      const boxes = mode === 'glyphs' ? glyphs.map(bounds)
        : [...range.getClientRects()].map(r => ({ x: r.x, y: r.y, right: r.right, bottom: r.bottom }))
      return { text: text.getAttribute('data-options-text'), mode, glyphs: glyphs.length, boxes,
        visible: getComputedStyle(text).visibility === 'visible' && getComputedStyle(text).display !== 'none' }
    }),
  }))
  return { copy: node.getAttribute('aria-label'), glyphs: node.querySelectorAll('i').length,
    lines: [...node.querySelectorAll(':scope > [aria-hidden]')].map(line => ({ box: bounds(line.firstElementChild), pitch: line.offsetHeight,
      text: line.textContent, glyphs: line.querySelectorAll('i').length })),
    navigation: bounds(options.querySelector('nav [data-option-key]')), background: getComputedStyle(node).backgroundColor,
    images: [...new Set([...node.querySelectorAll('i')].map(glyph => getComputedStyle(glyph).backgroundImage))],
    layout: { viewport: { width: window.innerWidth, height: window.innerHeight },
      frontendScale: getComputedStyle(node).getPropertyValue('--frontend-scale').trim() },
    browserCopy: copy, hud: hud.map(element => ({ ...bounds(element),
      visible: getComputedStyle(element).visibility === 'visible' && getComputedStyle(element).display !== 'none' })), optionsCount: document.querySelectorAll('[data-original-options]').length }
}

export function assertOptionsCopyClearance(sample, { skin, category, fallback }) {
  const valid = box => box && ['x', 'y', 'right', 'bottom'].every(key => Number.isFinite(box[key])) &&
    box.right > box.x && box.bottom > box.y
  const viewport = sample.layout?.viewport
  assert.ok(viewport && [viewport.width, viewport.height].every(n => Number.isFinite(n) && n > 0))
  assert.equal(sample.optionsCount, 1, 'Exactly one live Options owner is required')
  assert.ok(valid(sample.navigation), 'Live category navigation geometry is required')
  assert.ok(['frontend', 'ingame'].includes(skin) && ['game', 'sound'].includes(category))
  assert.equal(typeof fallback, 'boolean')
  assert.deepEqual(sample.browserCopy?.map(copy => copy.kind).sort(), category === 'game' ? ['help', 'storage'] : ['storage'],
    'Every expected browser copy owner remains present exactly once')
  assert.equal(sample.hud?.length, skin === 'ingame' ? 1 : 0, 'The live native HUD must be uniquely observed in-game')
  if (skin === 'ingame') {
    assert.ok(valid(sample.hud[0]), 'Live HUD geometry must be finite and positive-area')
    assert.equal(sample.hud[0].visible, true, 'The native HUD remains visible')
    const hud = sample.hud[0]
    assert.ok(hud.x < viewport.width && hud.right > 0 && hud.y < viewport.height && hud.bottom > 0,
      'Live native HUD geometry must intersect the viewport')
  }
  for (const copy of sample.browserCopy) {
    assert.equal(copy.ownerValid, true, 'Browser copy retains its actual status/button owner')
    assert.ok(copy.texts.length > 0, 'Browser copy cannot disappear')
    for (const text of copy.texts) {
      assert.equal(text.visible, true, 'Browser copy remains visible')
      assert.equal(text.mode, fallback ? 'fallback' : 'glyphs')
      assert.ok(typeof text.text === 'string' && text.text.trim().length > 0)
      assert.equal(text.glyphs, fallback ? 0 : [...text.text].length, 'Every native glyph remains represented')
      assert.ok(text.boxes.length > 0, 'Actual glyphs or fallback line fragments are required')
      if (!fallback) assert.equal(text.boxes.length, text.glyphs)
      for (const box of text.boxes) {
        assert.ok(valid(box), 'Occupied text bounds must be finite and positive-area')
        assert.ok(box.x >= 0 && box.y >= 0 && box.right <= viewport.width && box.bottom <= viewport.height,
          'Browser-added copy remains inside the viewport')
        assert.ok(box.bottom < sample.navigation.y, 'Browser-added copy clears category navigation')
        if (skin === 'ingame') assert.ok(box.x >= sample.hud[0].right,
          'Actual browser-added glyphs and fallback text must clear the live native HUD')
      }
    }
  }
}
