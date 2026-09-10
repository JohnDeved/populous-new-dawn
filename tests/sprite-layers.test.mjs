import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { spriteLayers } from '../app/sprite-layers.ts'
import units from '../app/original-units.json' with { type: 'json' }
import fixtures from './fixtures/unit-sprites.json' with { type: 'json' }

test('unit atlas and all tribe/state/direction layers match reviewed original-engine fixtures', () => {
  const atlas = readFileSync(new URL(`../public/original/${units.atlas}.png`, import.meta.url))
  assert.equal(createHash('sha256').update(atlas).digest('hex'), fixtures.atlasSha256, 'Atlas changed: compare original RGBA before updating fixtures')
  assert.equal(units.pieces.length, fixtures.pieceHashes.length)
  assert.equal(fixtures.cases.length, 576)
  for (const c of fixtures.cases) {
    const cycle = units.animations[c.signature][c.state][c.direction]
    assert.equal(cycle.frames[c.step], c.frame)
    assert.equal(cycle.flip, !!(c.options.flags & 1))
    assert.deepEqual(spriteLayers(units.frames[c.frame].layers, units.pieces, c.options, c.view), c.draws, `${c.signature}/${c.state}/${c.direction}`)
    assert.deepEqual(spriteLayers(units.frames[c.frame].layers, units.pieces, {...c.options,scale:c.signature.endsWith('shaman'),levelFlags:0}, {...c.view,shamanScale:256}), c.pixels)
  }
})
