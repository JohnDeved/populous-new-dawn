import assert from 'node:assert/strict'
import test from 'node:test'
import { buildingCellValid } from '../app/building-validity.ts'
import { campaignCommand } from '../app/campaign-command-runtime.ts'
import { pauseExplicitCombatTarget } from '../app/combat-explicit-target.ts'
import { releaseLiveAttackReservation } from '../app/live-building-combat.ts'
import { splitMeleeGroup } from '../app/melee-groups.ts'
import { initializePersonCasting } from '../app/person-casting.ts'
import { stepPersonWait } from '../app/person-state.ts'

const caster = y => ({ velocity: { x: -51, y, z: 78 }, speed: 27, timer: 5, model: 2 })
const noAnimation = () => {}
test('004e96d0 casting admit zeros signed downward, not upward, vertical motion', () => {
  for (const [input, expected] of [[-20, 0], [0xfffe, 0], [19, 19]]) {
    const person = caster(input)
    initializePersonCasting(person, false, noAnimation)
    assert.equal(person.velocity.y, expected)
  }
})

test('004e96f0 casting admit zeros horizontal components independently of vertical sign', () => {
  for (const up of [-1, 44]) {
    const person = caster(up)
    initializePersonCasting(person, false, noAnimation)
    assert.deepEqual([person.velocity.x, person.velocity.z], [0, 0])
  }
})

test('004391a0 native-phase wait stops on entry, draws once at phase zero and finishes at exact zero', () => {
  const pick = seed => {
    const x = (BigInt(seed) * 0x24a1n + 0x24dfn) & 0xffffffffn
    return Number((x >> 13n | x << 19n) & 0xffffffffn)
  }
  const person = { assignment: 16 | 32, counter: 32, timer: 2, speed: 41, flags2: 2, model: 2 }
  const rng = { randomState: 42 }, animations = [], release = []
  const effects = { animation: (p, v) => animations.push([p, v]), releaseMotion: () => release.push(true) }
  assert.equal(stepPersonWait(rng, person, effects, true), false)
  assert.deepEqual([person.assignment, person.speed, person.timer, person.flags2, person.turnAngle],
    [32, 0, 1, 0x1082, pick(42) & 2047])
  assert.equal(rng.randomState, pick(42))
  assert.equal(animations.length, 1)
  assert.equal(release.length, 1)
  person.counter = 16
  assert.equal(stepPersonWait(rng, person, effects, true), true)
  assert.equal(rng.randomState, pick(42))
  assert.equal(release.length, 1)
  person.timer = -32768
  assert.equal(stepPersonWait(rng, person, effects, true), false)
  assert.equal(person.timer, 32767)
})

test('00439240 live explicit attack wait decrements without drawing on its phase boundary', () => {
  const p = { flags2: 0x40000000, renderFlags: 16, timer: 0, speed: 37, assignment: 0, substate: 12, counter: 32, model: 2, x: 10, y: 20 }
  const target = { flags2: 0, flags4: 0x400, life: 1, x: 30, y: 50 }
  const rng = { randomState: 789 }
  const effects = { animation: noAnimation, releaseMotion: () => assert.fail('No random rotation during explicit wait') }
  pauseExplicitCombatTarget(rng, p, target, effects)
  assert.deepEqual([p.timer, p.assignment, p.speed, p.substate], [6, 0, 0, 12])
  for (let remaining = 5; remaining > 0; remaining--) {
    pauseExplicitCombatTarget(rng, p, target, effects)
    assert.deepEqual([p.timer, p.substate], [remaining, 12])
  }
  pauseExplicitCombatTarget(rng, p, target, effects)
  assert.equal(p.timer, 0)
  assert.equal(p.substate, 0)
  assert.equal(rng.randomState, 789)
})

test('004c2b40 live opcode 1077 reads only low nibble of one-off Bridge stock', () => {
  const variables = Array(64).fill(99)
  const w = { outcome: { level: 16 }, shots: { bridge: 0xab }, ai: { variables } }
  const script = { fields: [[0, 0], [0, 12], [1, 7]] }
  campaignCommand(w, 1077, [0, 1, 2], script)
  assert.equal(variables[7], 0xb)
  assert.equal(variables.filter(value => value === 99).length, 63)
})

test('004baaf0 current plan overlap admits foreign Tower only, not own, other model or built', () => {
  const land = { heights: new Int16Array(16384), flags: new Uint32Array(16384),
    categories: new Uint8Array(16384), buildingIds: new Uint16Array(16384) }
  for (const [planModel, planTribe, flags, valid] of [[4, 1, 1024, true], [4, 0, 1024, false], [3, 1, 1024, false], [4, 1, 1536, false]]) {
    land.flags[0] = flags
    land.buildingIds[0] = 7
    const w = { land, landFlags: 0, levelFlags: 0, building: id => {
      assert.equal(id, 7)
      return { model: planModel, tribe: planTribe }
    }, scenery: () => [] }
    const tribe = { tribe: 0, flags: 0, playerType: 0 }
    assert.equal(buildingCellValid(w, tribe, 0, 8, 1), valid)
    assert.equal(tribe.flags, valid ? 0 : 0x800000)
  }
})

test('004a3920 failed melee split detaches only the last member per tribe and preserves their queues', () => {
  const queues = [[], [], [], []]
  const people = queues.map((commands, index) => ({ id: index + 1, tribe: index % 2, model: 2,
    flags2: 0x100, workFlags: 12, workTarget: 13, commands }))
  const world = { randomState: 1, objects: new Map(people.map(p => [p.id, p])) }
  const group = { id: 12, count: 4, tribes: [0, 1], members: [1, 2, 3, 4, 0, 0] }
  splitMeleeGroup(world, group, { allocate: () => undefined })
  assert.deepEqual(group.members, [1, 2, 0, 0, 0, 0])
  assert.equal(group.count, 2)
  assert.deepEqual(people.map(p => [p.workFlags, p.workTarget, p.flags2]),
    [[12, 13, 0x100], [12, 13, 0x100], [0, 0, 0x110], [0, 0, 0x110]])
  people.forEach((p, i) => assert.equal(p.commands, queues[i]))
})

test('0051ff40 live reservation dispatch clears just active flag and decrements nonzero byte only', () => {
  const reservation = { flags4: 0x180400, reactionTimer: 2, reactionDuration: 39 }
  const w = { fights: [{ id: 7, attackReservation: reservation }] }
  releaseLiveAttackReservation(w, 8)
  assert.deepEqual(reservation, { flags4: 0x180400, reactionTimer: 2, reactionDuration: 39 })
  releaseLiveAttackReservation(w, 7)
  assert.deepEqual(reservation, { flags4: 0x080400, reactionTimer: 1, reactionDuration: 39 })
  releaseLiveAttackReservation(w, 7)
  releaseLiveAttackReservation(w, 7)
  assert.equal(reservation.reactionTimer, 0)
})
