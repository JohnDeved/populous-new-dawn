import test from 'node:test'
import assert from 'node:assert/strict'
import { createWorld } from '../app/world-initialization.ts'
import { tick } from '../app/model.ts'
import { messageText } from '../app/messages.ts'

test('Mission 10 runs its first Totem deadline and second Totem Erosion sequence', () => {
  const world = createWorld(10),
    firstTotem = world.shrines.find(shrine => shrine.kind === 'linkedEffects')

  assert.equal(world.outcome.level, 10)
  assert.equal(world.units.length, 46)
  assert.deepEqual(
    world.vehicles.map(vehicle => [vehicle.model, vehicle.team, vehicle.active]),
    [[1, 'blue', true]]
  )
  assert.ok(firstTotem)
  assert.deepEqual(
    [firstTotem.x, firstTotem.z, firstTotem.remaining, firstTotem.required, firstTotem.target],
    [29, -67, 1, 2, 64]
  )
  assert.equal(world.shrines.some(shrine => shrine.name === 'Erosion Totem Pole'), false)
  assert.equal(
    messageText(world.messages.slots.find(Boolean).stringId),
    'I have had a terrible vision with scenes of death and destruction as our settlement sank into the sea! I must move swiftly if I am to save my tribe and wreak revenge upon our Enemies.'
  )

  // Let the native reset visit complete, then exercise the trigger's reviewed force path.
  tick(world, 1 / 12)
  firstTotem.forced = true
  tick(world, 1 / 12)
  assert.equal(firstTotem.remaining, 0)
  assert.equal(firstTotem.active, false)
  assert.equal(world.effects.filter(effect => effect.earthquake).length, 2)
  assert.equal(world.shrines.some(shrine => shrine.name === 'Erosion Totem Pole'), true)

  while (!world.ai.variables[9] && world.turn < 32) tick(world, 1 / 12)
  assert.equal(world.turn, 6)
  assert.equal(world.ai.variables[7], 1)
  assert.equal(world.ai.variables[9], 1)
  assert.equal(world.campaignTimer, 5760)
  assert.equal(world.inputMask & 0x40, 0x40)
  assert.equal(world.flyby.events.length, 10)

  const checkpoint = structuredClone(world)
  tick(world, 10 / 12)
  assert.equal(world.campaignTimer, 5750)
  assert.equal(checkpoint.campaignTimer, 5760)
  assert.equal(checkpoint.shrines.some(shrine => shrine.name === 'Erosion Totem Pole'), true)
  assert.equal(
    checkpoint.shrines.find(shrine => shrine.kind === 'linkedEffects').linkedShrine,
    undefined
  )

  const secondTotem = world.shrines.find(shrine => shrine.name === 'Erosion Totem Pole'),
    beforeHeights = Array.from(world.land.heights),
    beforeGreenBuildings = world.buildings.filter(building => building.team === 'green').length
  assert.ok(secondTotem)
  secondTotem.forced = true
  while (secondTotem.active && world.turn < 64) tick(world, 1 / 12)
  while (!world.ai.variables[6] && world.turn < 64) tick(world, 1 / 12)
  assert.equal(secondTotem.remaining, 0)
  assert.equal(secondTotem.uses, 1)
  assert.equal(world.campaignTimer, null)
  assert.equal(world.ai.variables[6], 1)
  assert.equal(world.ai.variables[18], 63)
  assert.equal(world.inputMask & 0x40, 0x40)
  assert.deepEqual(
    world.flyby.events.map(event => [event.kind, event.value, event.start, event.duration]),
    [
      [2, 186, 1, 34],
      [1, 49152, 2, 30],
      [1, 50190, 32, 30],
      [2, 1497, 36, 30],
      [1, 57346, 63, 30],
      [2, 1009, 66, 28],
    ]
  )

  while (world.ai.variables[18] > 0 && world.turn < 128) tick(world, 1 / 12)
  const forcedHead = world.shrines.find(
    shrine => shrine !== secondTotem && shrine.kind === 'erosionEffect' && shrine.uses === 1
  )
  assert.ok(forcedHead)
  assert.equal(world.ai.variables[18], 0)
  assert.deepEqual(
    world.effects.filter(effect => effect.erosion).map(effect => [effect.x, effect.z]),
    [
      [3, 49],
      [9, 59],
      [-3, 61],
      [7, 65],
      [-11, 59],
      [-7, 41],
      [-17, 55],
      [-7, 53],
      [-3, 47],
      [7, 43],
    ]
  )
  assert.ok(world.land.heights.some((height, index) => height !== beforeHeights[index]))
  for (let turn = 0; turn < 120; turn++) tick(world, 1 / 12)
  assert.ok(
    world.buildings.filter(building => building.team === 'green').length < beforeGreenBuildings
  )
  assert.equal(world.status, 'playing')

  const restarted = createWorld(10)
  assert.equal(restarted.campaignTimer, null)
  assert.equal(restarted.ai.variables[9], 0)
  assert.equal(restarted.ai.variables[6], 0)
  assert.equal(restarted.ai.variables[18], 0)
  assert.equal(restarted.shrines.find(shrine => shrine.kind === 'linkedEffects').remaining, 1)
  assert.equal(restarted.shrines.some(shrine => shrine.name === 'Erosion Totem Pole'), false)
})
