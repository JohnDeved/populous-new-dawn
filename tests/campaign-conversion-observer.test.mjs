import test from 'node:test'
import assert from 'node:assert/strict'
import { observeCampaignConversions } from '../scripts/campaign-conversion-observer.mjs'

const preacher = { id: 1, kind: 'preacher', team: 'blue', hp: 100, native: { state: 21 } }
const victim = { id: 2, kind: 'brave', team: 'yellow', hp: 30, native: { state: 23, workTarget: 1 } }
const replacement = { id: 3, kind: 'brave', team: 'blue', hp: 30, native: { flags3: 0x1000000, flags4: 0x40000 } }
const world = (turn, units, level = 3) => ({ turn, units, outcome: { level } })

test('conversion observation requires the native victim-owner and replacement flags without world mutation', () => {
  const before = world(100, [preacher, victim]), after = world(101, [preacher, replacement])
  const savedBefore = structuredClone(before), savedAfter = structuredClone(after)
  const result = observeCampaignConversions(after, observeCampaignConversions(before))
  assert.deepEqual(before, savedBefore); assert.deepEqual(after, savedAfter)
  assert.equal(result.events.length, 1)
  assert.equal(result.events[0].victims[0].id, 2)
  assert.equal(result.events[0].replacements[0].id, 3)
})

test('death, ordinary births, startup conversion flags and enemy preacher ownership are not credited', () => {
  const tracker = observeCampaignConversions(world(100, [preacher, victim]))
  for (const units of [[preacher], [preacher, { ...replacement, native: {} }],
    [preacher, { ...replacement, native: { flags4: 0x40000 } }],
    [preacher, { ...replacement, id: victim.id }]])
    assert.deepEqual(observeCampaignConversions(world(101, units), tracker).events, [])
  const enemyOwner = observeCampaignConversions(world(100, [{ ...preacher, team: 'yellow' }, victim]))
  assert.deepEqual(observeCampaignConversions(world(101, [replacement]), enemyOwner).events, [])
})

test('observation resets at mission boundaries and does not infer events across unobserved turns', () => {
  const tracker = observeCampaignConversions(world(100, [preacher, victim]))
  assert.deepEqual(observeCampaignConversions(world(102, [preacher, replacement]), tracker).events, [])
  assert.deepEqual(observeCampaignConversions(world(101, [preacher, replacement], 4), tracker).events, [])
})
