import assert from 'node:assert/strict'
import test from 'node:test'
import { addUnit, createWorld, nativePosition, tick } from '../app/model.ts'
import { joinBattle, processBattles } from '../app/combat-runtime.ts'
import { collisionWorld } from '../app/live-people.ts'
import { validFightSite } from '../app/melee-placement.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

function prepare({ immediateFight = false } = {}) {
  const world = createWorld(10)
  for (let i = 0; i < 100; i++) tick(world, 1 / 12)
  const attacker = world.units.find(unit => unit.id === 112)
  assert.deepEqual([world.turn, attacker?.team, attacker?.kind, attacker?.x, attacker?.z],
    [100, 'blue', 'warrior', 27, -5])
  // The rival and initial combat admission are supplied, not authored task AI.
  const defender = addUnit(world, 'green', 'brave', { x: attacker.x + 0.1, z: attacker.z })
  if (immediateFight) world.manaWorld.gameFlags |= 64
  else world.manaWorld.gameFlags &= ~64
  return { world, attacker, defender }
}

const cell = ({ x, y }) => ((y & 65535) >> 9) * 128 + ((x & 65535) >> 9)
const members = ({ attacker, defender }) => [defender.id, attacker.id]

test('004d5010 assigns an authored Warrior running-speed draw at live admission', () => {
  const { world, attacker, defender } = prepare()
  joinBattle(world, attacker, defender)
  const p = attacker.fight?.motion
  assert.ok(p)
  const run = rules.personRunningSpeeds[p.physics]
  assert.equal(run, 110)
  assert.equal(p.speed, 125)
  assert.ok(p.speed >= run && p.speed < run + (run >> 2))
  assert.deepEqual([p.timer, p.goalX, p.goalY], [39, 8986, 64768])
})

test('00518630 strike sets the defender knockback exactly at attacker timer two', () => {
  const { world, attacker, defender } = prepare()
  joinBattle(world, attacker, defender)
  const p = attacker.fight?.motion, q = defender.fight?.motion
  assert.ok(p && q)
  assert.deepEqual([p.substate, q.substate], [6, 4])
  for (const timer of [5, 4, 3]) {
    processBattles(world)
    assert.deepEqual([p.state, p.substate, p.speed, p.timer, q.substate], [29, 6, 0, timer, 4])
  }
  processBattles(world)
  assert.deepEqual([p.timer, q.substate, q.timer, q.object], [2, 7, 1, 128])
  assert.ok(q.flags2 & 0x80000)
  const cuesBefore = world.sounds.length
  processBattles(world)
  processBattles(world)
  assert.equal(p.substate, 8)
  assert.deepEqual(world.sounds.slice(cuesBefore).map(event => event.cue), [13])
})

test('0051e4b0 validates an owned battle center, then rejects its native exclusion bit', () => {
  const fixture = prepare({ immediateFight: true })
  const { world, attacker, defender } = fixture
  joinBattle(world, attacker, defender)
  processBattles(world)
  const fight = world.fights[0]
  assert.equal(fight.encounter, undefined)
  assert.deepEqual(fight.members, members(fixture))
  const place = nativePosition(world, fight), tile = cell(place)
  assert.equal(tile, 16145)
  const probe = { ...place, id: fight.id, angle: fight.angle, counter: world.turn,
    model: 8, tribe: 255, flags2: 0, flags4: 0, workTarget: 0, target: 0 }
  const site = { collision: collisionWorld(world), search: world.indexedSearch,
    occupied: () => false, outside: () => { throw Error('not an occupied building cell') },
    height: () => place.h }
  assert.equal(validFightSite(site, probe, place), true)
  world.land.flags[tile] |= 2
  assert.equal(validFightSite(site, probe, place), false)
})

test('00519d10 owned battle stays on a blocked cell until the next periodic relocation visit', () => {
  const fixture = prepare({ immediateFight: true })
  const { world, attacker, defender } = fixture
  joinBattle(world, attacker, defender)
  processBattles(world)
  const fight = world.fights[0], original = nativePosition(world, fight), tile = cell(original)
  assert.equal(tile, 16145)
  world.land.flags[tile] |= 4
  world.turn = 127
  processBattles(world)
  assert.deepEqual(nativePosition(world, fight), original)
  world.turn = 128
  processBattles(world)
  assert.deepEqual(nativePosition(world, fight), { x: 9472, y: -768, h: 88 })
  assert.deepEqual(fight.members, members(fixture))
})
