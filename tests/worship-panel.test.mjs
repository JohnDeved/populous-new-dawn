import test from 'node:test'
import assert from 'node:assert/strict'
import fixture from './fixtures/worship-panel.json' with { type: 'json' }
import exports from '../decomp/exports.json' with { type: 'json' }
import { worshipPanel } from '../app/worship-panel.ts'
import { worshipPositions } from '../app/worship.ts'

test('worship panels preserve native progress, recharge, slots and artwork without clipping the second row', () => {
  assert.equal(fixture.executableSha256, exports.executableSha256)
  for (const { state, expected } of fixture.cases) {
    const extraRow = state.required >= 8 ? 28 : 0
    assert.deepEqual(worshipPanel(state), { ...expected, height: expected.height + extraRow })
  }
  for (const { head, expected } of fixture.positions)
    assert.deepEqual(worshipPositions(head), expected)
})
