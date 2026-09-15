import test from 'node:test'
import assert from 'node:assert/strict'
import { createWorld } from '../app/world-initialization.ts'
import { tick } from '../app/model.ts'
import { messageText } from '../app/messages.ts'

test('Mission 10 opens with its stranded Boat and starts its native deadline after the first Totem', () => {
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

  const restarted = createWorld(10)
  assert.equal(restarted.campaignTimer, null)
  assert.equal(restarted.ai.variables[9], 0)
  assert.equal(restarted.shrines.find(shrine => shrine.kind === 'linkedEffects').remaining, 1)
  assert.equal(restarted.shrines.some(shrine => shrine.name === 'Erosion Totem Pole'), false)
})
