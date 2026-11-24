import assert from 'node:assert/strict'
import test from 'node:test'
import { stepGhostArmy, stepTeleport } from '../app/spell-effects-runtime.ts'
import { createWorld } from '../app/world-initialization.ts'

function setup({ withGhost = false, ordinaryAlive = true } = {}) {
  const world = createWorld(1)
  const ordinary = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  assert.ok(ordinary?.native?.flags4 & 0x20000000)
  let ghost
  if (withGhost) {
    stepGhostArmy(world, { team: 'blue', x: ordinary.x, z: ordinary.z, turnsRemaining: 0 })
    ghost = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman' && unit.ghost)
    assert.ok(ghost?.native?.flags4 & 0x800)
    assert.ok(ghost?.native?.flags4 & 0x20000000)
    // Isolate selection order without inventing a ghost or replacing the live controller.
    world.units.splice(world.units.indexOf(ghost), 1)
    world.units.unshift(ghost)
  }
  if (!ordinaryAlive) ordinary.hp = 0
  return { world, ordinary, ghost }
}

const coordinates = unit => [unit.x, unit.z]
const relocation = world =>
  stepTeleport(world, { team: 'blue', teleport: { visits: 11, target: { x: 0x4000, y: 0x4000, h: 0 } } })

test('Teleport chooses a living ordinary Shaman even when a real Ghost Army Shaman is first', () => {
  const { world, ordinary, ghost } = setup({ withGhost: true })
  const original = coordinates(ordinary)
  const ghostOrigin = coordinates(ghost)
  assert.equal(relocation(world), false)
  assert.notDeepEqual(coordinates(ordinary), original)
  assert.deepEqual(coordinates(ghost), ghostOrigin)
})

test('Teleport with only a living ghost Shaman performs no relocation or departure effect work', () => {
  const { world, ghost } = setup({ withGhost: true, ordinaryAlive: false })
  const origin = coordinates(ghost)
  const rng = world.randomState
  const effects = world.effects.length
  assert.equal(relocation(world), false)
  assert.deepEqual(coordinates(ghost), origin)
  assert.equal(world.randomState, rng)
  assert.equal(world.effects.length, effects)
})

test('Teleport still moves a lone living ordinary Shaman', () => {
  const { world, ordinary } = setup()
  const origin = coordinates(ordinary)
  assert.equal(relocation(world), false)
  assert.notDeepEqual(coordinates(ordinary), origin)
})

test('Teleport without any living Shaman still has no departure effects', () => {
  const { world } = setup({ ordinaryAlive: false })
  const rng = world.randomState
  const effects = world.effects.length
  assert.equal(relocation(world), false)
  assert.equal(world.randomState, rng)
  assert.equal(world.effects.length, effects)
})
