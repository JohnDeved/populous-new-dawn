import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, command, setSelection, tick } from '../app/model.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { advanceGame } from '../app/game-clock.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import rules from '../app/original-rules.json' with { type: 'json' }
import { observeCampaignConversions } from '../scripts/campaign-conversion-observer.mjs'
import { naturalPreacherJourney } from '../scripts/mission3-natural-preacher-scenario.mjs'

function requireReplacement(world, observation, victimId) {
  const event = observation.events.find(event => event.victims.some(victim => victim.id === victimId))
  assert.ok(event, 'Require preceding state23, Blue preacher owner and same-turn flagged replacement')
  assert.equal(event.victims.length, 1)
  assert.equal(event.replacements.length, 1)
  assert.ok(!world.units.some(unit => unit.id === victimId))
  const replacement = world.units.find(unit => unit.id === event.replacements[0].id)
  assert.ok(replacement && replacement.id !== victimId)
  assert.equal(replacement.team, 'blue')
  assert.equal(replacement.kind, 'brave')
  assert.equal(replacement.native.flags3 & 0x1000000, 0x1000000)
  assert.equal(replacement.native.flags4 & 0x40000, 0x40000)
  return event
}

test('Mission 3 naturally trains a Blue Preacher, converts an authored Brave and resumes its mid-conversion checkpoint', () => {
  const journey = naturalPreacherJourney(createWorld(3)), { world, victim, preacher } = journey
  assert.equal(world.status, 'playing')
  assert.equal(victim.team, 'yellow')
  assert.equal(victim.native.model, 2)
  assert.ok(rules.personModels[victim.native.model].flags & 32)
  assert.equal(world.manaTribes[victim.native.tribe].flags2 & 64, 0, 'No forced-conversion tribe flag')
  assert.equal(world.manaWorld.loadFlags & 0x4000000, 0, 'Use ordinary conversion probability')
  assert.equal(currentPersonOrder(world.buildingOrders, preacher.native)?.model, 17)
  assert.ok(victim.native.timer >= 94 && victim.native.timer <= 105)
  assert.ok(!world.units.some(unit => unit.id === journey.traineeId), 'Training replaced the actual Brave')
  const restored = migrateCheckpoint(structuredClone(world))
  let resumedObservation = observeCampaignConversions(restored), elapsed = 0
  while (!journey.observation().events.length && elapsed++ < 1200) {
    journey.step()
    tick(restored, 1 / 12)
    resumedObservation = observeCampaignConversions(restored, resumedObservation)
    assert.equal(restored.randomState, world.randomState)
    assert.deepEqual(restored.units, world.units)
    assert.deepEqual(restored.buildingOrders, world.buildingOrders)
  }
  assert.deepEqual(resumedObservation.events, journey.observation().events)
  const event = requireReplacement(world, journey.observation(), journey.authoredVictimId)
  requireReplacement(restored, resumedObservation, journey.authoredVictimId)
  assert.ok(event.turnAfter - journey.milestones.at(-1).turn > 90, 'Natural delay was not bypassed')
})

test('a real movement command cancels the naturally acquired Blue sermon without converting its listener', () => {
  const { world, preacher, victim, step, observation } = naturalPreacherJourney(createWorld(3))
  const id = victim.id
  setSelection(world, [preacher.id])
  assert.ok(command(world, { x: -33, z: -113 }))
  assert.equal(currentPersonOrder(world.buildingOrders, preacher.native)?.model, 3)
  assert.notEqual(victim.native.state, 23)
  assert.equal(victim.native.workTarget, 0)
  assert.equal(victim.native.flags4 & 128, 0)
  assert.equal(victim.native.flags2 & 0x200000, 0)
  for (let turn = 0; turn < 12; turn++) step()
  assert.ok(world.units.some(unit => unit.id === id && unit.team === 'yellow' && unit.hp > 0))
  assert.equal(observation().events.length, 0)
})

test('natural Mission 3 conversion follows elapsed game time across display schedules', () => {
  const { world, authoredVictimId } = naturalPreacherJourney(createWorld(3))
  const run = schedule => {
    const current = migrateCheckpoint(structuredClone(world))
    let observation = observeCampaignConversions(current), seconds = 0, frame = 0
    const clock = { animationTime: 0, animationFrame: 0,
      afterTurn: () => { observation = observeCampaignConversions(current, observation) } }
    while (seconds < 40 - 1e-9) {
      const elapsed = Math.min(schedule[frame++ % schedule.length], 40 - seconds)
      advanceGame(current, clock, elapsed)
      seconds += elapsed
    }
    requireReplacement(current, observation, authoredVictimId)
    return { events: observation.events, turn: current.turn, rng: current.randomState,
      units: current.units, orders: current.buildingOrders, animations: clock.animationFrame }
  }
  const expected = run([1 / 60])
  for (const hz of [30, 120, 144]) assert.deepEqual(run([1 / hz]), expected)
  assert.deepEqual(run([1 / 144, 1 / 24, 0.18, 1 / 60, 0.003]), expected)
})
