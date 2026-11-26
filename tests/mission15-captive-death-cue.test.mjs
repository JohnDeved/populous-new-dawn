import assert from 'node:assert/strict'
import test from 'node:test'
import { createLivePerson, strikeLiveLightning } from '../app/live-people.ts'
import { createWorld, nativePosition, tick } from '../app/model.ts'

const captive = world => world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')

test('naturally authored Mission 15 prison Lightning queues one positional player Shaman death cue', () => {
  const world = createWorld(15, 'scalable'), shaman = captive(world)
  const prison = world.buildings.find(building => building.kind === 'prison')
  const caster = world.units.find(unit => unit.team === 'yellow' && unit.kind === 'shaman')
  while (world.turn < 5421 && world.status === 'playing') tick(world, 1 / 12)
  assert.equal(world.turn, 5421)
  assert.equal(shaman.inside, prison.id)
  assert.equal(shaman.hp, 100)
  assert.equal(shaman.native, null)
  const bolt = world.effects.find(effect => effect.lightning?.turn === -1)
  assert.equal(bolt.lightning.tribe, 2)
  const ambient = structuredClone(world.sounds), serial = world.soundSerial
  tick(world, 1 / 12)
  assert.equal(world.turn, 5422)
  assert.equal(prison.hp, 260)
  assert.ok(caster.hp > 0)
  assert.equal(shaman.native.previousState, 42)
  assert.equal(shaman.native.state, 3)
  assert.equal(shaman.native.damageAttacker, 2)
  assert.equal(world.units.includes(shaman), false)
  assert.equal(world.killCredits[2][0], 1)
  assert.equal(world.sounds.some(event => event.owner === shaman.id && event.cue === 0x0f && event.turn < 5422), false)
  assert.deepEqual(world.sounds, [
    ...ambient,
    { serial: serial + 1, cue: 0xa2, x: bolt.x, z: bolt.z, turn: 5422 },
    { serial: serial + 2, cue: 0x0f, x: shaman.x, z: shaman.z, turn: 5422, owner: shaman.id },
  ])
  for (let i = 0; i < 20; i++) tick(world, 1 / 12)
  assert.equal(world.killCredits[2][0], 1)
  assert.equal(world.sounds.filter(event => event.cue === 0x0f && event.owner === shaman.id).length, 1)
})

test('supplied captive record distinguishes native flags4 exclusions from unrelated flags3', () => {
  for (const [flags3, flags4, expected] of [[0x4800, 0, 1], [0, 0x800, 0], [0, 0x4000, 0]]) {
    const world = createWorld(15, 'scalable'), shaman = captive(world)
    shaman.native = createLivePerson(world, shaman)
    shaman.native.flags3 |= flags3
    shaman.native.flags4 |= flags4
    strikeLiveLightning(world, nativePosition(world, shaman), 2)
    assert.equal(shaman.native.state, 3)
    assert.equal(shaman.native.previousState, 42)
    assert.equal(world.sounds.filter(event => event.owner === shaman.id && event.cue === 0x0f).length, expected)
  }
})
