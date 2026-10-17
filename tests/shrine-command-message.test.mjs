import test from 'node:test'
import assert from 'node:assert/strict'
import { browserPosition, command, createWorld, setSelection } from '../app/model.ts'
import { syncLivePersonCells } from '../app/live-people.ts'
import { worshipHeadPose } from '../app/live-worship.ts'
import { worshipApproach } from '../app/worship.ts'

// Supplied approach positions isolate command feedback, not earned acquisition.
function commandAtHead(mission, id, kind = 'brave') {
  const world = createWorld(mission)
  const head = world.shrines.find(head => head.id === id)
  const unit =
    world.units.find(unit => unit.team === 'blue' && unit.kind === kind && unit.inside === null) ??
    world.units.find(unit => unit.team === 'blue' && unit.kind === kind)
  Object.assign(unit, browserPosition(worshipApproach(worshipHeadPose(world, head))), {
    inside: null,
    native: null,
  })
  syncLivePersonCells(world)
  setSelection(world, [unit.id])
  assert.equal(command(world, head), true)
  return { world, head }
}

test('authored multi-follower heads report required count, not selected or admitted count', () => {
  for (const [mission, id, required, kind] of [
    [14, 47, 6],
    [14, 46, 5],
    [16, 6, 6],
    [5, 109, 6, 'warrior'],
  ]) {
    const { world, head } = commandAtHead(mission, id, kind)
    assert.equal(head.required, required)
    assert.equal(world.message, `Worshipping ${head.name}. ${required} followers are required.`)
    assert.equal(head.uses, 0)
  }
})

test('single-follower head keeps singular feedback', () => {
  const { world, head } = commandAtHead(1, 29)
  assert.equal(head.required, 1)
  assert.equal(world.message, `Worshipping ${head.name}. One follower is enough.`)
})

test('Shaman-only authored head identifies its required worshipper', () => {
  const { world, head } = commandAtHead(15, 138, 'shaman')
  assert.equal(head.mode, 3)
  assert.equal(world.message, `Worshipping ${head.name}. Only your shaman can worship here.`)
})

test('Vault commands retain their separate queued-command feedback', () => {
  const { world, head } = commandAtHead(1, 2, 'shaman')
  assert.equal(head.kind, 'vault')
  assert.equal(world.message, 'Your followers are on the move.')
})
