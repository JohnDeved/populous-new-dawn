import assert from 'node:assert/strict'
import test from 'node:test'
import fixtures from './fixtures/melee-groups.json' with { type: 'json' }
import { joinMeleeGroup, splitMeleeGroup } from '../app/melee-groups.ts'
import { createWorld, addUnit, command } from '../app/model.ts'
import { advanceGame } from '../app/game-clock.ts'

test('native fight admission, replacement and splitting retain original slots, flags and RNG', () => {
  for (const fixture of fixtures) {
    const c = structuredClone(fixture.input)
    const w = { randomState: c.randomState, objects: new Map(c.people.map(p => [p.id, p])) }
    const events = []; let created = null
    const effects = {
      enter: p => { p.previousState = p.state; events.push(['empty', p.id]); p.state = 25; events.push(['initialize', p.id]) },
      allocate: () => {
        events.push(['allocate', 10, 8, 255, [1000, 2000, 300]])
        if (!c.allocationFails) return created = { id: 101, members: [0,0,0,0,0,0], tribes: [0,0], count: 0, center: 0, angle: 0 }
      },
    }
    const result = c.mode === 'join' ? joinMeleeGroup(w, c.group, c.people[6], effects) : !!splitMeleeGroup(w, c.group, effects)
    assert.deepEqual({ result, group: c.group, created, people: c.people, events, randomState: w.randomState }, fixture.expected)
  }
})

function field() {
  const w = createWorld()
  w.units = []; w.buildings = []; w.shrines = []; w.fights = []
  w.terrain.fill(3); w.terrainVersion++; w.manaWorld.gameFlags |= 64
  const clock = { animationTime: 0, animationFrame: 0 }
  const defender = addUnit(w, 'red', 'warrior', { x: 0, z: 0 })
  const attacker = addUnit(w, 'blue', 'brave', { x: 1, z: 0 })
  const attack = (u, target) => { w.selected = [u.id]; command(w, target); advanceGame(w, clock, 1 / 12) }
  attack(attacker, defender)
  return { w, clock, defender, attacker, attack }
}

function reinforce(f, team, kind, target) {
  const u = addUnit(f.w, team, kind, { x: target.x + .5, z: target.z })
  f.attack(u, target)
  return u
}

test('stronger reinforcements replace the first weaker ally and preserve a three-person tribe limit', () => {
  const f = field(), { w, attacker, defender } = f
  reinforce(f, 'blue', 'brave', defender)
  reinforce(f, 'blue', 'brave', defender)
  assert.equal(w.fights[0].members.length, 4)
  const rejected = reinforce(f, 'blue', 'brave', defender)
  assert.equal(rejected.fight, null)
  const previous = attacker.fight.motion
  const warrior = reinforce(f, 'blue', 'warrior', defender)
  assert.equal(attacker.fight, null)
  assert.equal(previous.workFlags, 0)
  assert.equal(previous.workTarget, 0)
  assert.ok(previous.flags2 & 16)
  assert.equal(warrior.fight.group, w.fights[0].id)
  assert.equal(w.fights[0].slots[1], warrior.id, 'replace first weaker friendly slot, retaining slot order')
  assert.equal(w.fights[0].members.length, 4)
})

test('two-sided reinforcements split the last fighter of each tribe into a new live fight', () => {
  const f = field(), { w, defender, attacker } = f
  const blue = reinforce(f, 'blue', 'warrior', defender)
  const original = w.fights[0]
  const red = reinforce(f, 'red', 'warrior', attacker)
  assert.equal(w.fights.length, 2)
  const split = w.fights.find(b => b !== original)
  assert.deepEqual(original.slots, [defender.id, attacker.id, 0, 0, 0, 0])
  assert.deepEqual(split.slots, [red.id, blue.id, 0, 0, 0, 0])
  assert.equal(original.center, 0)
  assert.ok(split.angle >= 0 && split.angle < 360)
  for (const u of [blue, red]) {
    assert.equal(u.fight.group, split.id)
    assert.equal(u.fight.motion.workFlags, split.id)
    assert.equal(u.fight.motion.substate, 0)
    assert.ok(u.fight.motion.flags2 & 0x40000000)
  }
  advanceGame(w, f.clock, 1 / 12)
  assert.equal(w.fights.length, 2)
  assert.equal(original.center, defender.id)
  assert.equal(split.center, red.id)
  assert.equal(new Set(w.fights.flatMap(b => b.members)).size, 4)
})

test('reinforced group motion and combat remain identical at every render cadence', () => {
  const run = frames => {
    const f = field()
    reinforce(f, 'blue', 'warrior', f.defender)
    reinforce(f, 'red', 'warrior', f.attacker)
    for (const dt of frames) advanceGame(f.w, f.clock, dt)
    return { units: f.w.units, groups: f.w.fights, randomState: f.w.randomState, turn: f.w.turn, sounds: f.w.sounds }
  }
  const baseline = run(Array(120).fill(1 / 60))
  for (const fps of [5, 30, 120, 144, 240]) assert.deepEqual(run(Array(fps * 2).fill(1 / fps)), baseline)
  assert.deepEqual(run(Array.from({ length: 20 }, () => [.01, .09]).flat()), baseline)
})

test('center changes preserve original membership slots for subsequent splits', () => {
  const f = field(), { w, attacker, defender } = f
  const red = reinforce(f, 'red', 'warrior', attacker)
  advanceGame(w, f.clock, 1 / 12)
  const original = w.fights[0]
  assert.equal(original.members[0], attacker.id)
  assert.deepEqual(original.slots, [defender.id, attacker.id, red.id, 0, 0, 0])
  const blue = reinforce(f, 'blue', 'warrior', defender)
  const split = w.fights.find(b => b !== original)
  assert.deepEqual(split.slots, [red.id, blue.id, 0, 0, 0, 0])
  assert.deepEqual(original.slots, [defender.id, attacker.id, 0, 0, 0, 0])
})
