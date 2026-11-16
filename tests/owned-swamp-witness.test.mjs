import test from 'node:test'
import assert from 'node:assert/strict'
import { assertLive, assertCancelled, assertRetired } from '../scripts/owned-swamp-evidence/witness.mjs'
const live = { current: true, effectPresent: true, meshPresent: true, remaining: 32000 }
test('live controls reject absent, cancelled and stale traps', () => {
  assertLive(live)
  for (const change of [{ current: false }, { effectPresent: false }, { meshPresent: false }, { remaining: 0 }])
    assert.throws(() => assertLive({ ...live, ...change }))
})
test('cancellation is distinct from retirement and an unchanged live trap', () => {
  assertCancelled({ ...live, remaining: 0 })
  for (const change of [{ remaining: 2 }, { remaining: -1 }, { effectPresent: false }, { meshPresent: false }, { current: false }])
    assert.throws(() => assertCancelled({ ...live, remaining: 0, ...change }))
})
test('retirement requires logical removal, renderer removal and actual group detachment', () => {
  const retired = { current: true, effectPresent: false, meshPresent: false, groupDetached: true, remaining: -1 }
  assertRetired(retired)
  for (const change of [{ current: false }, { effectPresent: true }, { meshPresent: true }, { groupDetached: false }, { remaining: 0 }])
    assert.throws(() => assertRetired({ ...retired, ...change }))
})
