import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { decodeComposedPng } from '../integration-queue/composed-png.mjs'

// Derive ink from the exact shipped atlas, never an arbitrary clipping tolerance.
export function nativeHelpInkSource(bytes, metadataBytes) {
  const metadata = JSON.parse(metadataBytes.toString()),
    image = decodeComposedPng(bytes, { width: metadata.width, height: metadata.height })
  return { url: '/original/pause-font.png', sha256: image.sha256,
    metadataSha256: createHash('sha256').update(metadataBytes).digest('hex'),
    width: image.width, height: image.height,
    cells: metadata.rects.map(cell => {
      const { x, y, w, h } = cell
      assert.ok([x, y, w, h].every(Number.isInteger) && x >= 0 && y >= 0 && w > 0 && h > 0 &&
        x + w <= image.width && y + h <= image.height, 'Native font crop is inside its exact atlas')
      let left = w, top = h, right = 0, bottom = 0
      for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) {
        if (!image.rgba[((y + dy) * image.width + x + dx) * 4 + 3]) continue
        left = Math.min(left, dx); top = Math.min(top, dy)
        right = Math.max(right, dx + 1); bottom = Math.max(bottom, dy + 1)
      }
      return { ...cell, ink: right ? { left, top, right, bottom } : null }
    }) }
}

export function readNativeHelpInk() {
  return nativeHelpInkSource(readFileSync(new URL('../../public/original/pause-font.png', import.meta.url)),
    readFileSync(new URL('../../app/original-pause-font.json', import.meta.url)))
}

export function applyNativeHelpInk(layout, source) {
  assert.equal(layout.font.sha256, source.sha256, 'Displayed native font bytes match the tested source')
  assert.equal(layout.font.path, source.url, 'Displayed native font uses the exact source asset')
  const url = new URL(source.url, layout.font.origin).href
  const fits = rect => [layout.bounds, { left: 0, top: 0, right: layout.viewport.width, bottom: layout.viewport.height }]
    .every(bounds => rect.left >= bounds.left && rect.top >= bounds.top && rect.right <= bounds.right && rect.bottom <= bounds.bottom)
  for (const field of layout.fields) {
    assert.ok(field.glyphs.length, `Native bitmap text must be present: ${field.label}`)
    let visibleInk = false
    field.ink = field.glyphs.map(glyph => {
      assert.equal(glyph.image, `url("${url}")`, 'Displayed glyph uses the verified atlas')
      assert.equal(glyph.size, 'auto', 'Native glyph keeps the atlas source scale')
      assert.equal(glyph.transform, 'none', 'Native glyph has no independent transform')
      for (const position of [glyph.positionX, glyph.positionY])
        assert.match(position, /^-?\d+(?:\.\d+)?px$/, 'Native glyph crop position uses exact pixel units')
      const cell = source.cells.find(cell => parseFloat(glyph.positionX) === -cell.x && parseFloat(glyph.positionY) === -cell.y &&
        glyph.width === cell.w && glyph.height === cell.h)
      assert.ok(cell, 'Displayed native glyph crop matches the source metadata')
      const sx = glyph.rect.width / cell.w, sy = glyph.rect.height / cell.h
      assert.ok(sx > 0 && sy > 0 && Math.abs(sx - sy) < 1e-9, 'Native glyph uses uniform panel scaling')
      if (!cell.ink) return null
      visibleInk = true
      return { left: glyph.rect.left + cell.ink.left * sx, top: glyph.rect.top + cell.ink.top * sy,
        right: glyph.rect.left + cell.ink.right * sx, bottom: glyph.rect.top + cell.ink.bottom * sy }
    })
    assert.ok(visibleInk, `Native field must contain visible text: ${field.label}`)
    field.glyphsFit = field.ink.filter(Boolean).every(fits)
  }
  layout.font.metadataSha256 = source.metadataSha256
  return layout
}
