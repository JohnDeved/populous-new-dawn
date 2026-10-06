import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { inflateSync } from 'node:zlib'
import { spriteLayers } from '../app/sprite-layers.ts'
import units from '../app/original-units.json' with { type: 'json' }
import fixtures from './fixtures/unit-sprites.json' with { type: 'json' }
import provenance from '../public/original/provenance.json' with { type: 'json' }
import firingArtwork from './fixtures/firewarrior-firing-artwork.json' with { type: 'json' }
import preacherArtwork from './fixtures/preacher-gesture-artwork.json' with { type: 'json' }

test('unit atlas retains reviewed tribe/state/direction layers when new models append', () => {
  const atlas = readFileSync(new URL(`../public/original/${units.atlas}.png`, import.meta.url))
  const digest = bytes => createHash('sha256').update(bytes).digest('hex')
  assert.equal(digest(atlas), provenance.unitAtlasSha256)
  // The entire old PNG is identified here; its decoded-pixel witness is pinned
  // independently from b020. Only the 80 firing and 48 Preacher rectangles differ.
  assert.equal(firingArtwork.historical.pngSha256,
    '9bdbe47bc816c0c75036c7899a6bccdb8aeb47931dc0f49d541c957082afbcbd')
  assert.equal(atlas.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  const blocks = [], kinds = []
  let width, height
  for (let at = 8; at < atlas.length;) {
    const length = atlas.readUInt32BE(at), kind = atlas.toString('ascii', at + 4, at + 8)
    const data = atlas.subarray(at + 8, at + 8 + length)
    kinds.push(kind)
    if (kind === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4)
      assert.deepEqual([...data.subarray(8)], [8, 6, 0, 0, 0])
    }
    if (kind === 'IDAT') blocks.push(data)
    at += length + 12
  }
  assert.deepEqual(kinds, ['IHDR', 'IDAT', 'IEND'])
  assert.deepEqual([width, height, units.width, units.height], [2048, 8192, 2048, 8192])
  assert.deepEqual([units.columns, units.cell], [32, 64])
  assert.equal(firingArtwork.atlas.oldPieces, 4042)
  assert.equal(firingArtwork.pieces.length, 80)
  assert.deepEqual(units.pieces.slice(4042, 4122), firingArtwork.pieces.map(({ rgbaSha256, ...piece }) => piece),
    'Every firing source, dimension and exact atlas origin must match the original-data witness')
  assert.equal(preacherArtwork.measurementSha256, 'f9a471e8472bd54f460d8cfc900d6fe970dea8c1d16614b604e2300b6fe81953')
  assert.equal(preacherArtwork.checkerSha256, digest(readFileSync(new URL('../scripts/check-preacher-gesture-assets.py', import.meta.url))))
  assert.equal(preacherArtwork.pieces.length, 48)
  assert.deepEqual(units.pieces.slice(4122), preacherArtwork.pieces.map(({ rgbaSha256, ...piece }) => piece),
    'Only the 48 measured Preacher rectangles append after the fixed firing prefix')
  for (const [offset, piece] of preacherArtwork.pieces.entries()) {
    const cell = 4062 + Math.floor(offset / 4)
    assert.deepEqual([piece.atlasX, piece.atlasY],
      [cell % 32 * 64 + offset % 2 * 32, Math.floor(cell / 32) * 64 + Math.floor(offset / 2) % 2 * 32])
    assert.ok(piece.w > 0 && piece.w <= 32 && piece.h > 0 && piece.h <= 32)
    assert.equal(piece.atlasY < 8128, offset < 8, 'eight old-tail slots precede the forty new-row slots')
  }
  const pixels = inflateSync(Buffer.concat(blocks)), stride = width * 4 + 1
  assert.equal(pixels.length, stride * height)
  for (let row = 0; row < height; row++) assert.equal(pixels[row * stride], 0)
  for (const piece of [...firingArtwork.pieces, ...preacherArtwork.pieces]) {
    const { atlasX: x, atlasY: y, w, h } = piece
    assert.ok(x >= 0 && y >= 0 && x + w <= width && y + h <= height)
    assert.ok(Math.floor(y / 64) * 32 + Math.floor(x / 64) >= 4042)
    const originalPixels = createHash('sha256')
    for (let row = 0; row < h; row++) {
      const at = (y + row) * stride + 1 + x * 4
      originalPixels.update(pixels.subarray(at, at + w * 4))
    }
    assert.equal(originalPixels.digest('hex'), piece.rgbaSha256, `Original appended piece ${piece.source}`)
    // Old-area destinations were independently proved zero; the new row starts
    // empty. Clear only the exact verified rectangle, including transparent texels.
    for (let row = 0; row < h; row++) {
      const at = (y + row) * stride + 1 + x * 4
      pixels.fill(0, at, at + w * 4)
    }
  }
  const historicalPixels = createHash('sha256')
  assert.equal(firingArtwork.atlas.height, 8128)
  for (let row = 0; row < 8128; row++)
    historicalPixels.update(pixels.subarray(row * stride + 1, (row + 1) * stride))
  assert.equal(historicalPixels.digest('hex'), firingArtwork.historical.rgbaSha256,
    'Every other decoded byte in the original 8128 rows retains its exact b020 value')
  assert.equal(pixels.subarray(8128 * stride).some(byte => byte !== 0), false,
    'Every new-row byte outside the exact verified Preacher rectangles remains zero')
  assert.equal(fixtures.pieceHashes.length, 3216)
  assert.ok(units.pieces.length >= fixtures.pieceHashes.length)
  assert.equal(fixtures.cases.length, 576)
  for (const c of fixtures.cases) {
    const cycle = units.animations[c.signature][c.state][c.direction]
    assert.equal(cycle.frames[c.step], c.frame)
    assert.equal(cycle.flip, !!(c.options.flags & 1))
    assert.deepEqual(spriteLayers(units.frames[c.frame].layers, units.pieces, c.options, c.view), c.draws, `${c.signature}/${c.state}/${c.direction}`)
    assert.deepEqual(spriteLayers(units.frames[c.frame].layers, units.pieces, {...c.options,scale:c.signature.endsWith('shaman'),levelFlags:0}, {...c.view,shamanScale:256}), c.pixels)
  }
})

test('brave carry animations retain the baked timber body layer', () => {
  const sources = state =>
    units.animations['blue-brave'][state].map(direction =>
      direction.frames.map(frame => {
        const body = units.frames[frame].layers[1]
        assert.equal(body.flags, 0)
        return units.pieces[body.piece].source
      })
    )

  assert.deepEqual(sources('carry'), [
    [330, 331, 332, 333],
    [334, 335, 336, 337],
    [338, 339, 340, 341],
    [342, 343, 344, 345],
    [346, 347, 348, 349],
    [342, 343, 344, 345],
    [338, 339, 340, 341],
    [334, 335, 336, 337],
  ])
  assert.deepEqual(sources('carryIdle'), [[350], [351], [352], [353], [354], [353], [352], [351]])
})
