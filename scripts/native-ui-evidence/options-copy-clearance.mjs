import assert from 'node:assert/strict'

// One read retains the original storage sample and actual browser-added copy
// geometry. Do not use the 540/640 px button/status containers as text bounds.
export function observeOptionsStorage(node) {
  const bounds = element => {
    const r = element.getBoundingClientRect()
    return { x: r.x, y: r.y, right: r.right, bottom: r.bottom }
  }
  const options = node.closest('[data-original-options]')
  const dialog = options.closest('dialog'), modals = [...document.querySelectorAll('dialog:modal')]
  const paint = style => ({ backgroundColor: style.backgroundColor, backgroundImage: style.backgroundImage,
    opacity: style.opacity, visibility: style.visibility, display: style.display })
  // A mounted HUD is not necessarily exposed: Main menu paints an opaque modal,
  // whereas Pause leaves the game visible. Retain this witness in the same read.
  const owner = dialog && { skin: options.getAttribute('data-skin'), main: dialog.matches('[data-original-main-menu]'),
    pause: dialog.matches('[data-original-pause-menu]'), open: dialog.open, modal: dialog.matches(':modal'),
    modalCount: modals.length, soleModalOwner: modals.length === 1 && modals[0] === dialog, box: bounds(dialog),
    paint: paint(getComputedStyle(dialog)), backdrop: paint(getComputedStyle(dialog, '::backdrop')) }
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
    browserCopy: copy, owner, hud: hud.map(element => ({ ...bounds(element), insideOptionsDialog: dialog?.contains(element) ?? false,
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
  const owner = sample.owner
  assert.ok(owner, 'A same-read modal ownership witness is required')
  assert.equal(owner.skin, skin, 'The observed Options skin matches its episode')
  assert.equal(owner.main, skin === 'frontend', 'Main-menu ownership must be unambiguous')
  assert.equal(owner.pause, skin === 'ingame', 'Pause ownership must be unambiguous')
  assert.equal(owner.open, true, 'The owning dialog remains open')
  assert.equal(owner.modal, true, 'The owning dialog must actually be modal, not merely open')
  assert.equal(owner.modalCount, 1, 'Exactly one live modal dialog is required')
  assert.equal(owner.soleModalOwner, true, 'Options belongs to that unique modal dialog')
  assert.ok(valid(owner.box) && owner.box.x <= 0 && owner.box.y <= 0 &&
    owner.box.right >= viewport.width && owner.box.bottom >= viewport.height, 'The modal owner covers the viewport')
  for (const paint of [owner.paint, owner.backdrop]) {
    assert.ok(paint, 'Both dialog and backdrop paint witnesses are required')
    assert.equal(paint.visibility, 'visible')
    assert.ok(typeof paint.display === 'string' && paint.display.length > 0 && paint.display !== 'none')
    assert.equal(paint.opacity, '1')
    assert.equal(paint.backgroundImage, 'none')
    assert.equal(paint.backgroundColor, skin === 'frontend' ? 'rgb(23, 19, 9)' : 'rgba(0, 0, 0, 0)',
      'Frontend positively occludes the underlying HUD; in-game Options must leave it exposed')
  }
  assert.equal(sample.hud?.length, 1, 'The mounted native HUD must be uniquely observed in both contexts')
  assert.equal(sample.hud[0].insideOptionsDialog, false, 'The HUD remains behind the modal, not a child painted above it')
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
