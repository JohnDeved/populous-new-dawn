import assert from 'node:assert/strict'
import test from 'node:test'
import { browserPosition, command, createWorld, nativePosition, tick } from '../app/model.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { syncLivePersonCells } from '../app/live-people.ts'
import { worshipPositions } from '../app/worship.ts'

test('Mission 5 Angel head delivers its linked hostile summon through live worship', () => {
  const world = createWorld(5),
    head = world.shrines.find(shrine => shrine.kind === 'angel'),
    follower = world.units.find(unit => unit.team === 'blue' && unit.kind === 'warrior')
  assert.deepEqual(
    {
      x: head.x,
      z: head.z,
      target: head.angelTarget,
      remaining: head.remaining,
      model: head.model,
    },
    { x: -97, z: 117, target: { x: -51, z: 15 }, remaining: 1, model: 45 }
  )

  world.inputMask = 0
  const slot = worshipPositions({
    ...nativePosition(world, head),
    angle: Math.round((head.angle * 1024) / Math.PI) & 2047,
  })[0]
  Object.assign(follower, browserPosition(slot))
  syncLivePersonCells(world)
  world.selected = [follower.id]
  assert.equal(command(world, head), true)

  for (let turn = 0; turn < 120 && !world.effects.some(effect => effect.angel); turn++)
    tick(world, 1 / 12)
  const angel = world.effects.find(effect => effect.angel)
  assert.ok(angel)
  assert.deepEqual(
    {
      x: angel.x,
      z: angel.z,
      team: angel.team,
      kind: angel.kind,
      uses: head.uses,
      active: head.active,
      model: head.model,
    },
    { x: -51, z: 15, team: 'blue', kind: 'angel', uses: 1, active: false, model: 45 }
  )
  assert.ok(world.sounds.some(sound => sound.cue === 0xd9))
  assert.ok(world.sounds.some(sound => sound.cue === 0xdb))

  const candidates = world.units.filter(unit => unit.team !== 'blue' && unit.hp > 0).slice(0, 3),
    [ally, invisible, victim] = candidates
  assert.equal(candidates.length, 3)
  for (const unit of world.units) if (unit.team !== 'blue') unit.inside = 1
  Object.assign(ally, {
    x: angel.x + 0.5,
    z: angel.z,
    team: 'yellow',
    inside: null,
    native: null,
  })
  Object.assign(invisible, {
    x: angel.x + 1,
    z: angel.z,
    team: 'red',
    inside: null,
    native: null,
    invisibility: 600,
  })
  Object.assign(victim, {
    x: angel.x + 1.9,
    z: angel.z + 1.9,
    team: 'red',
    inside: null,
    native: null,
    shield: 600,
  })
  world.outcome.alliances[0] |= 1 << 2
  const credits = world.killCredits[0][1],
    hp = victim.hp
  tick(world, 1 / 12)
  assert.equal(angel.angel.target, victim.id, 'allied and invisible nearer people are ineligible')
  assert.deepEqual(
    { phase: angel.angel.phase, timer: angel.angel.timer },
    { phase: 'striking', timer: 28 },
    'native reach is a component-wise square, including its diagonal'
  )
  for (let turn = 0; turn < 20 && victim.hp === hp; turn++) tick(world, 1 / 12)
  assert.ok(victim.hp > 0 && victim.hp < hp, 'Shield reduces the otherwise lethal strike')
  assert.equal(world.killCredits[0][1], credits)
  assert.ok(world.effects.some(effect => effect.kind === 'hit'))

  victim.shield = 0
  for (let turn = 0; turn < 80 && victim.hp > 0; turn++) tick(world, 1 / 12)
  assert.equal(victim.hp, 0)
  assert.deepEqual(
    { phase: angel.angel.phase, timer: angel.angel.timer },
    { phase: 'striking', timer: 8 }
  )
  assert.equal(world.killCredits[0][1], credits + 1)
  for (let turn = 0; turn < 7; turn++) tick(world, 1 / 12)
  assert.deepEqual(
    { phase: angel.angel.phase, timer: angel.angel.timer },
    { phase: 'striking', timer: 1 },
    'lethal impact retains the full post-strike recovery'
  )
  tick(world, 1 / 12)
  assert.equal(angel.angel.phase, 'seeking')
  assert.equal(ally.hp > 0, true)
  assert.equal(invisible.hp > 0, true)
  assert.ok(world.sounds.some(sound => sound.cue === 0xdc))

  angel.angel.lifetime = 1
  for (let turn = 0; turn < 20 && world.effects.includes(angel); turn++) tick(world, 1 / 12)
  assert.equal(world.effects.includes(angel), false)
  assert.ok(world.sounds.some(sound => sound.cue === 0xb2))
})

test('Mission 5 checkpoint migration adds only the previously omitted Angel head', () => {
  const world = createWorld(5),
    angel = world.shrines.find(shrine => shrine.kind === 'angel'),
    other = world.shrines.find(shrine => shrine !== angel),
    oldId = world.nextId
  world.shrines = world.shrines.filter(shrine => shrine !== angel)
  other.progress = 7
  const before = structuredClone(other)

  migrateCheckpoint(world)
  const restored = world.shrines.filter(shrine => shrine.kind === 'angel')
  assert.equal(restored.length, 1)
  assert.deepEqual(
    { id: restored[0].id, x: restored[0].x, z: restored[0].z, target: restored[0].angelTarget },
    { id: oldId, x: -97, z: 117, target: { x: -51, z: 15 } }
  )
  assert.equal(world.nextId, oldId + 1)
  assert.deepEqual(other, before)
  migrateCheckpoint(world)
  assert.equal(world.shrines.filter(shrine => shrine.kind === 'angel').length, 1)
})
