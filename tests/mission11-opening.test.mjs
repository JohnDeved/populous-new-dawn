import test from 'node:test'
import assert from 'node:assert/strict'
import { createWorld } from '../app/world-initialization.ts'
import { tick } from '../app/model.ts'
import { messageText } from '../app/messages.ts'
import { missionAllowsBuilding, missionComputerTribes } from '../app/mission-data.ts'

test('Mission 11 opens with both enemy tribes and four original knowledge sites', () => {
  const world = createWorld(11)

  assert.equal(world.outcome.level, 11)
  assert.deepEqual(missionComputerTribes(11), [2, 3])
  assert.deepEqual(world.campaignAIs.map(Boolean), [false, false, true, true])
  assert.deepEqual(
    Object.fromEntries(
      ['blue', 'green', 'yellow', 'wild'].map(team => [
        team,
        world.units.filter(unit => unit.team === team).length,
      ])
    ),
    { blue: 7, green: 7, yellow: 7, wild: 155 }
  )
  assert.deepEqual(
    world.shrines.map(shrine => [shrine.kind, shrine.reward]),
    [
      ['vault', 'hypnotise'],
      ['vault', 'swamp'],
      ['flatten', 'flatten'],
      ['swamp', 'swamp'],
    ]
  )
  assert.ok([1, 4, 5, 7, 8, 13].every(model => missionAllowsBuilding(11, model)))
  const selected = world.units.find(unit => world.selected.includes(unit.id))
  assert.equal(selected?.team, 'blue')
  assert.equal(selected?.kind, 'shaman')
  assert.equal(
    messageText(world.messages.slots.find(Boolean).stringId),
    'Once again we must face two tribes. I shall crush the Matak, then I must deal with the greater threat of the Chumara.'
  )
  for (let turn = 0; turn < 24; turn++) tick(world, 1 / 12)
  assert.equal(world.status, 'playing')
})
