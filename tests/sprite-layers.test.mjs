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
  const reviewedAtlas = 'c8911ddbcf595d1cdadbd3e74bebbf22945a1134422ae12820ac548d38d5f751'
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
