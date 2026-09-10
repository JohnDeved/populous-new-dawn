import test from 'node:test'
import assert from 'node:assert/strict'
import fixture from './fixtures/worship-admission.json' with { type: 'json' }
import exports from '../decomp/exports.json' with { type: 'json' }
import models from '../app/original-models.json' with { type: 'json' }
import { countWorshippers } from '../app/worship.ts'
import { selectTrainingOccupants } from '../app/training.ts'

test('spell-head reward admission preserves native oriented cell ranges and active command eligibility', () => {
  assert.equal(fixture.executableSha256, exports.executableSha256)
  for (const c of fixture.cases)
    assert.deepEqual(
      countWorshippers(c.head, { records: [{}, ...c.orders] }, cell =>
        c.people.filter(
          p => ((p.x >> 8) & 254) === (cell & 254) && ((p.y >> 8) & 254) === ((cell >> 8) & 254)
        )
      ),
      c.expected
    )
})

test('head-group selection shares native occupant flag rules and imported panel heights match the original consumer', () => {
  for (const c of fixture.selection) {
    const people = structuredClone(c.people)
    selectTrainingOccupants(people, c.clicked, true)
    assert.deepEqual(people, c.expected)
  }
  for (const { model, height } of fixture.heights) assert.equal(models[model].panelHeight, height)
})
