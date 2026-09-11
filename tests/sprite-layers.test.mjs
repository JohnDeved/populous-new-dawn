import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { spriteLayers } from '../app/sprite-layers.ts'
import units from '../app/original-units.json' with { type: 'json' }
import fixtures from './fixtures/unit-sprites.json' with { type: 'json' }
import provenance from '../public/original/provenance.json' with { type: 'json' }

test('unit atlas retains reviewed tribe/state/direction layers when new models append', () => {
  const atlas = readFileSync(new URL(`../public/original/${units.atlas}.png`, import.meta.url))
  const reviewedAtlas = '07230c4c0ffa01aa1d763e7a31378809aae735987109c1e9ca2de6ad31c23d97'
  assert.equal(createHash('sha256').update(atlas).digest('hex'), reviewedAtlas)
  assert.equal(provenance.unitAtlasSha256, reviewedAtlas)
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
