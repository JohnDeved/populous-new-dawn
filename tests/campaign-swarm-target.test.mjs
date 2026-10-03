import assert from 'node:assert/strict'
import test from 'node:test'
import { cast, command, createWorld, tick, spellTargetError } from '../app/model.ts'
import { missionThreeSwarmDiagnostic } from '../scripts/campaign-swarm-target.mjs'

function opening() {
  const world = createWorld(3)
  assert.ok(command(world, world.shrines.find(shrine => shrine.kind === 'vault')))
  for (let turn = 0; !world.unlockedTemple && world.status === 'playing' && turn < 10_000; turn++)
    tick(world, 1 / 12)
  assert.ok(world.unlockedTemple)
  // Portable fixture mirrors the introduction input-bit release. The browser
  // diagnostic uses the shipped Skip introduction control instead.
  world.inputMask &= ~64
  return world
}

test('Mission 3 Swarm target observation is read-only and chooses an actually castable enemy', () => {
  const world = opening(), before = structuredClone(world), diagnostic = missionThreeSwarmDiagnostic(world)
  assert.deepEqual(world, before)
  const shaman = world.units.find(unit => unit.id === diagnostic.shaman.id)
  assert.equal(diagnostic.shaman.state, shaman.native?.state)
  assert.equal(diagnostic.shaman.flags2, shaman.native?.flags2)
  assert.equal(diagnostic.shaman.flags4, shaman.native?.flags4)
  assert.ok(diagnostic.candidates.some(candidate => candidate.error?.code === -2), 'authored enemies include out-of-range targets')
  assert.ok(diagnostic.target)
  assert.equal(spellTargetError(world, 'swarm', diagnostic.target), null)
  const enemy = world.units.find(unit => unit.id === diagnostic.target.id)
  assert.equal(enemy.team, 'yellow')
  assert.notEqual(enemy.kind, 'shaman')
  assert.equal(enemy.inside, null)
  assert.ok(cast(world, 'swarm', enemy))
  assert.equal(world.shots.swarm, before.shots.swarm - 1)
})

test('Mission 3 Swarm eligibility does not depend on distance to the vault or unit array order', () => {
  const world = opening(), target = missionThreeSwarmDiagnostic(world).target
  assert.ok(target)
  // Change only the test fixture's reference shrine: targeting must use the
  // shaman's actual cast eligibility, never proximity to a completed objective.
  const rejected = missionThreeSwarmDiagnostic(world).candidates.find(candidate => candidate.error?.code === -2)
  Object.assign(world.shrines.find(shrine => shrine.kind === 'vault'), { x: rejected.x, z: rejected.z })
  world.units.reverse()
  const diagnostic = missionThreeSwarmDiagnostic(world)
  assert.equal(diagnostic.legacyTarget.id, rejected.id)
  assert.equal(diagnostic.legacyTarget.error.code, -2)
  assert.deepEqual(diagnostic.target, target)
})

test('Mission 3 Swarm diagnostic refuses missing stock, blocked input, cooldown and invalid enemies', () => {
  const original = opening()
  for (const mutate of [
    world => { world.shots.swarm = 0 },
    world => { world.paused = true },
    world => { world.inputMask = 1 },
    world => { world.status = 'won' },
    world => { world.castingTribes[0].cooldown = 12 },
    world => { world.units = world.units.filter(unit => unit.team !== 'blue' || unit.kind !== 'shaman') },
    world => { world.units = world.units.filter(unit => unit.team !== 'yellow' || spellTargetError(world, 'swarm', unit)) },
    world => { for (const unit of world.units) if (unit.team === 'yellow') unit.hp = 0 },
    world => { for (const unit of world.units) if (unit.team === 'yellow') unit.inside = 123 },
  ]) {
    const world = structuredClone(original)
    mutate(world)
    const before = structuredClone(world), diagnostic = missionThreeSwarmDiagnostic(world)
    assert.equal(diagnostic.target, null)
    assert.deepEqual(world, before)
  }
})
