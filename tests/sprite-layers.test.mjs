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

test('unit atlas retains reviewed tribe/state/direction layers when new models append', () => {
  const atlas = readFileSync(new URL(`../public/original/${units.atlas}.png`, import.meta.url))
  const digest = bytes => createHash('sha256').update(bytes).digest('hex')
  assert.equal(digest(atlas), provenance.unitAtlasSha256)
  // The entire old PNG is identified here; its decoded-pixel witness is pinned
  // independently from b020. Only the 80 proved firing rectangles may differ.
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
  assert.deepEqual([width, height, units.width, units.height], [2048, 8128, 2048, 8128])
  assert.deepEqual([units.columns, units.cell], [32, 64])
  assert.equal(firingArtwork.atlas.oldPieces, 4042)
  assert.equal(firingArtwork.pieces.length, 80)
  assert.deepEqual(units.pieces.slice(4042), firingArtwork.pieces.map(({ rgbaSha256, ...piece }) => piece),
    'Every appended source, dimension and exact atlas origin must match the original-data witness')
  const pixels = inflateSync(Buffer.concat(blocks)), stride = width * 4 + 1
  assert.equal(pixels.length, stride * height)
  for (let row = 0; row < height; row++) assert.equal(pixels[row * stride], 0)
  for (const piece of firingArtwork.pieces) {
    const { atlasX: x, atlasY: y, w, h } = piece
    assert.ok(x >= 0 && y >= 0 && x + w <= width && y + h <= height)
    assert.ok(Math.floor(y / 64) * 32 + Math.floor(x / 64) >= 4042)
    const originalPixels = createHash('sha256')
    for (let row = 0; row < h; row++) {
      const at = (y + row) * stride + 1 + x * 4
      originalPixels.update(pixels.subarray(at, at + w * 4))
    }
    assert.equal(originalPixels.digest('hex'), piece.rgbaSha256, `Original firing piece ${piece.source}`)
    // Every destination was independently proved zero in b020, including the
    // transparent texels. Clear only the exact witnessed rectangle, not its cell.
    for (let row = 0; row < h; row++) {
      const at = (y + row) * stride + 1 + x * 4
      pixels.fill(0, at, at + w * 4)
    }
  }
  const historicalPixels = createHash('sha256')
  for (let row = 0; row < height; row++)
    historicalPixels.update(pixels.subarray(row * stride + 1, (row + 1) * stride))
  assert.equal(historicalPixels.digest('hex'), firingArtwork.historical.rgbaSha256,
    'Every other decoded atlas byte retains its exact b020 value')
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
