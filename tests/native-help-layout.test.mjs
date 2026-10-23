import test from 'node:test'
import assert from 'node:assert/strict'
import { assertNativeHelpLayout } from '../scripts/tutorial-browser/selector-inspection.mjs'
import { nativeHelpInkSource, readNativeHelpInk, applyNativeHelpInk } from '../scripts/tutorial-browser/native-help-ink.mjs'
import { deflateSync } from 'node:zlib'

const layout = () => ({ focused: true, scrollTop: 0, scrollHeight: 482, clientHeight: 480,
  documentOverflow: false, fields: ['Browser compatibility and help', 'Select Level', '1× game speed',
    'Performance', 'HUD size : <Automatic>', '♫ Enable sound', 'Back to Options'].map(label =>
    ({ label, fits: true, glyphsFit: true, actionable: true })) })

test('native help accepts all visible and reachable fields without inventing long-document overflow', () => {
  for (const scrollHeight of [480, 482]) assertNativeHelpLayout({ ...layout(), scrollHeight })
})

test('native help still rejects missing mandatory content, clipped text and unreachable Back', () => {
  for (const index of [0, 1, 2, 3, 4, 5, 6]) {
    const missing = layout(); missing.fields.splice(index, 1)
    assert.throws(() => assertNativeHelpLayout(missing), /Required native help/)
  }
  for (const field of ['fits', 'glyphsFit', 'actionable']) {
    const clipped = layout(); clipped.fields.at(-1)[field] = false
    assert.throws(() => assertNativeHelpLayout(clipped), /Back to Options/)
  }
  assert.throws(() => assertNativeHelpLayout({ ...layout(), documentOverflow: true }), /overflow/)
  assert.throws(() => assertNativeHelpLayout({ ...layout(), scrollTop: 20 }), /start at the top/)
  assert.throws(() => assertNativeHelpLayout({ ...layout(), focused: false }))
})

function measured(source, cell, scale = 1) {
  return { bounds: { left: 0, top: 0, right: 640 * scale, bottom: 480 * scale },
    viewport: { width: 640 * scale, height: 480 * scale },
    font: { path: source.url, origin: 'https://game.test', sha256: source.sha256 },
    fields: [{ label: 'Back to Options', glyphCellsFit: false, glyphs: [{
      image: 'url("https://game.test/original/pause-font.png")', size: 'auto', transform: 'none',
      positionX: `${-cell.x}px`, positionY: `${-cell.y}px`, width: cell.w, height: cell.h,
      rect: { left: 300 * scale, top: 454 * scale, width: cell.w * scale, height: cell.h * scale },
    }] }] }
}

test('exact native Back ink fits at native and scaled sizes despite transparent atlas-cell overhang', () => {
  const source = readNativeHelpInk()
  assert.match(source.sha256, /^[a-f0-9]{64}$/)
  assert.match(source.metadataSha256, /^[a-f0-9]{64}$/)
  for (const [letter, bottom] of [['B', 23], ['a', 23], ['c', 23], ['k', 25]]) {
    const cell = source.cells[letter.charCodeAt(0) - 32]
    assert.equal(cell.h, 28); assert.equal(cell.ink.bottom, bottom)
    for (const scale of [0.75, 1, 1.5, 2]) {
      const result = applyNativeHelpInk(measured(source, cell, scale), source)
      assert.equal(result.fields[0].glyphCellsFit, false, 'Cell overhang remains in the evidence')
      assert.equal(result.fields[0].glyphsFit, true)
      assert.ok(result.fields[0].ink[0].bottom <= 480 * scale)
    }
  }
})

function alphaFixture(lastInkRow) {
  const chunk = (type, data = Buffer.alloc(0)) => {
    const bytes = Buffer.alloc(data.length + 12); bytes.writeUInt32BE(data.length); bytes.write(type, 4); data.copy(bytes, 8)
    let crc = 0xffffffff
    for (const byte of bytes.subarray(4, -4)) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0) }
    bytes.writeUInt32BE((crc ^ 0xffffffff) >>> 0, bytes.length - 4); return bytes
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(1); header.writeUInt32BE(28, 4); header[8] = 8; header[9] = 6
  const rgba = Buffer.alloc(28 * 5)
  rgba[lastInkRow * 5 + 1] = 255; rgba[lastInkRow * 5 + 4] = 255
  const bytes = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', header), chunk('IDAT', deflateSync(rgba)), chunk('IEND')])
  return nativeHelpInkSource(bytes, Buffer.from(JSON.stringify({ width: 1, height: 28, rects: [{ x: 0, y: 0, w: 1, h: 28 }] })))
}

test('one nontransparent pixel outside the native frame fails without a clipping tolerance', () => {
  for (const [lastInkRow, expected] of [[25, true], [26, false]]) {
    const source = alphaFixture(lastInkRow), result = applyNativeHelpInk(measured(source, source.cells[0]), source)
    assert.equal(result.fields[0].glyphsFit, expected)
    const complete = layout(); complete.fields.at(-1).glyphsFit = result.fields[0].glyphsFit
    if (expected) assertNativeHelpLayout(complete)
    else assert.throws(() => assertNativeHelpLayout(complete), /Complete native help text must fit: Back to Options/)
  }
})

test('ink witness rejects wrong asset bytes, path, displayed crop, size and absent text', () => {
  const source = readNativeHelpInk(), cell = source.cells['B'.charCodeAt(0) - 32]
  for (const damage of [
    row => { row.font.sha256 = '0'.repeat(64) },
    row => { row.font.path = '/wrong.png' },
    row => { row.fields[0].glyphs[0].image = 'url("https://game.test/wrong.png")' },
    row => { row.fields[0].glyphs[0].positionX = `${-cell.x - 0.5}px` },
    row => { row.fields[0].glyphs[0].positionX = `${-cell.x}%` },
    row => { row.fields[0].glyphs[0].positionY = `${-cell.y}em` },
    row => { row.fields[0].glyphs[0].width++ },
    row => { row.fields[0].glyphs[0].size = '100% 100%' },
    row => { row.fields[0].glyphs[0].transform = 'scale(2)' },
    row => { row.fields[0].glyphs = [] },
  ]) {
    const row = measured(source, cell); damage(row)
    assert.throws(() => applyNativeHelpInk(row, source))
  }
  assert.throws(() => applyNativeHelpInk(measured(source, cell), alphaFixture(25)), /bytes match the tested source/)
})
