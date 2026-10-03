import assert from 'node:assert/strict'
import test from 'node:test'
import {
  automaticWorshipPanelActive,
  automaticWorshipPanelFamily,
  recordWorshipPanelActivity,
} from '../app/worship-panel-activity.ts'

const ordinary = overrides => ({
  kind: 'bridge',
  mode: 0,
  target: 28,
  active: true,
  panelActivity: undefined,
  ...overrides,
})

test('automatic worship-panel activity is written only by a supported completed mode-0 sample', () => {
  const head = ordinary()
  assert.equal(automaticWorshipPanelFamily(head), true)
  assert.equal(automaticWorshipPanelActive(head), false)

  assert.equal(recordWorshipPanelActivity(head, 120, 3), true)
  assert.deepEqual(head.panelActivity, { turn: 120, count: 3 })
  assert.equal(automaticWorshipPanelActive(head), true)

  assert.equal(recordWorshipPanelActivity(head, 124, 0), true)
  assert.deepEqual(head.panelActivity, { turn: 124, count: 0 })
  assert.equal(automaticWorshipPanelActive(head), false)

  assert.equal(recordWorshipPanelActivity(head, 128, 1), true)
  assert.deepEqual(head.panelActivity, { turn: 128, count: 1 })
  assert.equal(automaticWorshipPanelActive(head), true)
})

test('automatic producer keeps unproven families out of the first shipped slice', () => {
  for (const head of [
    ordinary({ mode: 3 }),
    ordinary({ mode: 5 }),
    ordinary({ target: 0 }),
    ordinary({ kind: 'vault', mode: 4 }),
    ordinary({ kind: 'mana' }),
    ordinary({ kind: 'inert' }),
    ordinary({ rewardMana: 1024 }),
  ]) {
    assert.equal(automaticWorshipPanelFamily(head), false, JSON.stringify(head))
    assert.equal(recordWorshipPanelActivity(head, 120, 2), false)
    assert.equal(head.panelActivity, undefined)
    assert.equal(automaticWorshipPanelActive(head), false)
  }
})

test('automatic retention reads the last player-specific sample rather than generic follower state', () => {
  const head = ordinary({ followers: 9 })
  assert.equal(automaticWorshipPanelActive(head), false)
  recordWorshipPanelActivity(head, 44, 0)
  head.followers = 12
  assert.equal(automaticWorshipPanelActive(head), false)
  recordWorshipPanelActivity(head, 48, 2)
  head.followers = 0
  assert.equal(automaticWorshipPanelActive(head), true)
})

test('automatic retention releases an inactive completed head even after a positive last sample', () => {
  const head = ordinary()
  recordWorshipPanelActivity(head, 80, 1)
  assert.equal(automaticWorshipPanelActive(head), true)
  head.active = false
  assert.equal(automaticWorshipPanelActive(head), false)
})
