import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { launchCelebrationShots, launchFirewarrior, stepFirewarriorShots } from '../app/firewarrior.ts'
import { browserPosition } from '../app/world-coordinates.ts'
import { short } from '../app/native-math.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

function fixture() {
  const world = createWorld(), source = world.units.find(unit => unit.team === 'blue' && unit.kind === 'brave')
  source.kind = 'firewarrior'
  world.land.heights.fill(128)
  world.landVersion = world.terrainVersion
  world.effects = []
  world.sounds = []
  return { world, source }
}
const shots = world => world.effects.filter(effect => effect.firewarriorShot)
const alive = world => shots(world).filter(effect => effect.age < effect.duration)
const geometry = effect => ({
  x: short(Math.round((effect.x + 8) * 256)),
  y: short(Math.round((-effect.z - 8) * 256)),
  h: Math.round(effect.height * 45),
})

// These are source-derived port regressions, not fresh original-executable comparisons.
test('celebration launch preserves the caller point, heading, paired offsets and sound ownership', () => {
  const { world, source } = fixture(),
    person = { x: 32750, y: -32750, h: 1000, heading: 512 },
    point = { x: 34030, y: -32750, h: 4072 },
    randomState = world.randomState,
    pointBefore = structuredClone(point),
    tracked = launchCelebrationShots(world, source, person, point),
    pair = shots(world)
  assert.equal(pair.length, 2)
  assert.equal(tracked, pair[1].id)
  assert.deepEqual(pair.map(geometry), [
    { x: 32750, y: -32654, h: 1080 },
    { x: 32750, y: 32690, h: 1080 },
  ])
  for (const effect of pair) {
    assert.deepEqual(effect.firewarriorShot.pointTarget, { x: -31506, y: -32750, h: 4072 })
    assert.equal(effect.firewarriorShot.target, undefined)
    assert.equal(effect.firewarriorShot.remaining, undefined)
    assert.equal(effect.firewarriorShot.source, source.id)
    assert.equal(effect.firewarriorShot.attacker, 0)
    assert.deepEqual(effect.sprite, { sequence: 'blastShot', frame: 0, fixed: true })
  }
  assert.notEqual(pair[0].firewarriorShot.pointTarget, pair[1].firewarriorShot.pointTarget)
  assert.deepEqual(pair.map(effect => effect.firewarriorShot.impact), [false, true])
  assert.deepEqual(world.sounds.map(sound => [sound.cue, sound.x, sound.z]),
    pair.map(effect => [0xa1, effect.x, effect.z]))
  assert.deepEqual(point, pointBefore)
  assert.equal(source.cooldown, 25 / 12)
  assert.equal(world.randomState, randomState)
})

test('point shots preserve strict arrival timing, final movement and one harmless terminal cue', () => {
  const { world, source } = fixture(),
    point = { x: 0, y: 512, h: 128 },
    beforeUnits = structuredClone(world.units),
    beforeBuildings = structuredClone(world.buildings)
  launchCelebrationShots(world, source, { x: 0, y: 0, h: 128, heading: 0 }, point)
  const pair = shots(world)
  for (const effect of pair) {
    Object.assign(effect, browserPosition({ x: 0, y: 0 }), { height: 128 / 45 })
  }
  // Source cooldown is a launch effect, not projectile impact damage.
  beforeUnits.find(unit => unit.id === source.id).cooldown = source.cooldown
  stepFirewarriorShots(world)
  assert.equal(alive(world).length, 2, 'distance exactly512 is not arrival')
  assert.deepEqual(pair.map(geometry), [point, point])
  assert.deepEqual(world.sounds.map(sound => sound.cue), [0xa1, 0xa1])
  stepFirewarriorShots(world)
  assert.equal(alive(world).length, 0)
  assert.deepEqual(world.sounds.map(sound => sound.cue), [0xa1, 0xa1, 0xb2])
  stepFirewarriorShots(world)
  assert.deepEqual(world.sounds.map(sound => sound.cue), [0xa1, 0xa1, 0xb2], 'expired point shots cannot replay arrival')
  assert.deepEqual(world.units, beforeUnits)
  assert.deepEqual(world.buildings, beforeBuildings)
  assert.equal(world.effects.some(effect => effect.kind === 'hit'), false)

  const second = fixture()
  launchCelebrationShots(second.world, second.source, { x: 0, y: 0, h: 128, heading: 0 }, { x: 0, y: 256, h: 128 })
  for (const effect of shots(second.world)) Object.assign(effect, browserPosition({ x: 0, y: 0 }), { height: 128 / 45 })
  stepFirewarriorShots(second.world)
  assert.deepEqual(shots(second.world).map(geometry), [
    { x: 0, y: 240, h: 128 }, { x: 0, y: 240, h: 128 },
  ], 'arrival still performs15/16 distance movement before removal')
})

test('point flight clamps terrain, survives more than16 visits and ignores absent source/nearby entities', () => {
  const { world, source } = fixture()
  launchCelebrationShots(world, source, { x: 0, y: 0, h: 128, heading: 0 }, { x: 0, y: 0, h: 8000 })
  source.hp = 0
  const before = structuredClone(world.units)
  for (let turn = 0; turn < 16; turn++) stepFirewarriorShots(world)
  assert.equal(alive(world).length, 2, 'point mode has no invented16-turn lifetime')
  for (let turn = 16; turn < 64 && alive(world).length; turn++) stepFirewarriorShots(world)
  assert.equal(alive(world).length, 0)
  assert.deepEqual(world.units, before)
  assert.deepEqual(world.sounds.map(sound => sound.cue), [0xa1, 0xa1, 0xb2])

  const below = fixture()
  launchCelebrationShots(below.world, below.source, { x: 0, y: 0, h: -100, heading: 0 }, { x: 0, y: 512, h: -100 })
  stepFirewarriorShots(below.world)
  for (const effect of shots(below.world)) {
    assert.equal(effect.firewarriorShot.pointTarget.h, 128)
    assert.ok(geometry(effect).h >= 128)
  }
})

test('entity shots retain their existing target, timeout, destination and launch cue', () => {
  const { world, source } = fixture(), target = world.units.find(unit => unit.team === 'red')
  launchFirewarrior(world, source, target)
  for (const effect of shots(world)) {
    assert.equal(effect.firewarriorShot.target, target.id)
    assert.equal(effect.firewarriorShot.remaining, 16)
    assert.equal(effect.firewarriorShot.pointTarget, undefined)
    assert.equal(effect.firewarriorShot.destination.h, 208)
  }
  assert.deepEqual(world.sounds.map(sound => sound.cue), [0xa1])
})

test('normal outcome ticks reach repeated Firewarrior volleys and resume an occupied-shot checkpoint', () => {
  // Class and outcome prerequisites are supplied. The native controller chooses
  // the firing state itself; this is not a natural acquisition/victory witness.
  const world = createWorld()
  world.units = world.units.filter(unit => unit.team === 'blue')
  const source = world.units.find(unit => unit.kind === 'brave')
  source.kind = 'firewarrior'
  world.turn = 31
  world.ai.variables[57] = 1
  tick(world, 1 / 12)
  assert.equal(world.status, 'won')
  assert.equal(source.native.state, 41)
  while (world.turn < 113) tick(world, 1 / 12)
  const pair = alive(world), person = source.native
  assert.equal(pair.length, 2, 'failure-first turn113 now launches the required pair')
  const expectedPoint = {
    x: short(person.x + (Math.imul(rules.sine[person.heading & 2047], 1280) >> 16)),
    y: short(person.y + (Math.imul(rules.sine[(person.heading + 512) & 2047], 1280) >> 16)),
    h: short(person.h + 3072),
  }
  assert.deepEqual(pair.map(effect => effect.firewarriorShot.pointTarget), [expectedPoint, expectedPoint])
  const restored = migrateCheckpoint(structuredClone(world)), initialIds = pair.map(effect => effect.id), allIds = new Set(initialIds)
  assert.deepEqual(restored, world)
  for (let turn = 0; turn < 300; turn++) {
    tick(world, 1 / 12)
    tick(restored, 1 / 12)
    for (const effect of alive(world)) allIds.add(effect.id)
    assert.ok(alive(world).length <= 2, 'completed pairs do not accumulate')
  }
  assert.deepEqual(restored, world)
  assert.ok(allIds.size >= 4, 'celebration reaches a later volley')
  assert.equal(world.effects.some(effect => initialIds.includes(effect.id)), false)
  assert.equal(source.native.state, 41)
  assert.equal(world.status, 'won')
})

test('point arrival keeps the original signed-axis gate across the coordinate seam', () => {
  const { world, source } = fixture()
  launchCelebrationShots(world, source, { x: 32760, y: 0, h: 128, heading: 512 }, { x: -32760, y: 0, h: 128 })
  for (const effect of shots(world)) Object.assign(effect, browserPosition({ x: 32760, y: 0 }), { height: 128 / 45 })
  stepFirewarriorShots(world)
  assert.equal(alive(world).length, 2, 'small wrapped distance alone does not satisfy the signed-axis gate')
  assert.deepEqual(shots(world).map(geometry), [
    { x: -32264, y: 0, h: 128 }, { x: -32264, y: 0, h: 128 },
  ])
  stepFirewarriorShots(world)
  assert.equal(alive(world).length, 0)
  assert.deepEqual(shots(world).map(geometry), [
    { x: -32729, y: 0, h: 128 }, { x: -32729, y: 0, h: 128 },
  ])
})
