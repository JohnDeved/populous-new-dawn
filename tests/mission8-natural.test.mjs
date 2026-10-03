import test from 'node:test'
import assert from 'node:assert/strict'
import { createWorld, command, findPath, setSelection } from '../app/model.ts'
import { missionData, missionNumbers } from '../app/mission-data.ts'

const sourceSha256 = 'd0137f2a58736912598e62130e547051313f41cda1467a2c1d6affbae24622e1'

test('Mission8 natural acceptance starts from the shipped seven-person Blue and eleven-person Red roster', () => {
  const level = missionData(8).level,
    world = createWorld(8)
  assert.equal(level.sourceSha256, sourceSha256)
  const roster = team => world.units.filter(unit => unit.team === team)
  assert.equal(roster('blue').length, 7)
  assert.equal(roster('red').length, 11)
  assert.equal(roster('wild').length, 112)
  assert.deepEqual(
    roster('blue')
      .map(unit => unit.kind)
      .sort(),
    [...Array(6).fill('brave'), 'shaman']
  )
  assert.equal(roster('red').filter(unit => unit.kind === 'warrior').length, 4)
  assert.equal(world.buildings.length, 0)
  assert.equal(world.vehicles.length, 0)
  assert.equal(world.turn, 0)
  assert.equal(world.status, 'playing')
  assert.equal(world.shots.blast, 4)
  assert.equal(world.outcome.completedLevel, null)
  assert.equal(missionNumbers[missionNumbers.indexOf(8) + 1], 9)
})

test('Mission8 attack staging is a land order for the original party, not a transport or worship prerequisite', () => {
  const world = createWorld(8)
  const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  const party = world.units.filter(unit => unit.team === 'blue')
  const staging = { x: -41, z: -33 }
  const positions = party.map(({ id, x, z, hp }) => ({ id, x, z, hp }))
  const path = findPath(world, shaman, staging)
  assert.ok(path.length > 0)
  setSelection(
    world,
    party.map(unit => unit.id)
  )
  assert.equal(command(world, staging), true)
  assert.deepEqual(
    party.map(({ id, x, z, hp }) => ({ id, x, z, hp })),
    positions
  )
  assert.ok(party.every(unit => unit.path.length > 0))
  assert.ok(world.shrines.every(shrine => shrine.uses === 0))
  assert.equal(world.stats.cast, 0)
  assert.equal(world.turn, 0)
})
