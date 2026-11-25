import assert from 'node:assert/strict'
import test from 'node:test'
import { cast, createWorld, nativePosition, tick } from '../app/model.ts'
import { terrainPointHeight } from '../app/native-terrain.ts'

function castAtWildFollower(special = false) {
  const world = createWorld(6)
  for (let i = 0; i < 100; i++) tick(world, 1 / 12)
  assert.equal(world.inputMask, 0, 'authored introduction has released input')
  assert.equal(world.manaWorld.loadFlags & 0x04000000, 0)
  if (special) world.manaWorld.loadFlags |= 0x04000000 // supplied original mode, not an authored flag
  const victim = world.units.find(unit => unit.id === 348)
  assert.deepEqual([victim.team, victim.hp, victim.x, victim.z], ['wild', 50, 53, -61])
  assert.equal(world.effects.filter(fx => fx.wave).length, 0)
  assert.ok(cast(world, 'blast', victim, victim.id), 'live command accepts the authored visible follower')
  const target = nativePosition(world, victim)
  const ground = terrainPointHeight(world.land, target)
  for (let i = 0; i < 8; i++) tick(world, 1 / 12)
  assert.equal(world.turn, 108)
  const waves = world.effects.filter(fx => fx.wave)
  assert.equal(waves.length, 1, 'no supplied wave state')
  return { world, victim, target, ground, fx: waves[0] }
}

test('authored Mission 6 Blast emits a grounded default wave and one impact-local cue', () => {
  const {world, victim, target, ground, fx} = castAtWildFollower()
  const wave = fx.wave
  assert.deepEqual([wave.x, wave.y, wave.h, wave.tribe],
    [target.x & 65535, target.y & 65535, ground, 0])
  assert.deepEqual([wave.remaining, wave.radius, wave.maxRadius, wave.range, wave.spread,
    wave.horizontal, wave.vertical, wave.friendlyFire, wave.panic, wave.applied, wave.scatter],
    [3, 2, 5, 1280, 2, 140, 98, true, false, false, true], 'default initializer tuple')
  const cues = world.sounds.filter(e => e.turn === world.turn && e.cue === 0xa1)
  assert.deepEqual(cues.map(e => [e.x, e.z]), [[victim.x, victim.z]])
})

test('the registered Mission 6 Blast wave grows, clamps and retires in the world loop', () => {
  const {world, fx} = castAtWildFollower()
  const wave = fx.wave
  const history = []
  for (let i = 0; i < 3; i++) {
    tick(world, 1 / 12)
    history.push([world.turn, wave.remaining, wave.radius, wave.applied, world.effects.includes(fx)])
  }
  assert.deepEqual(history, [
    [109, 2, 4, true, true],
    [110, 1, 5, true, true],
    [111, 0, 5, true, false],
  ], 'live indexed wave lifetime and radius cap')
})

test('authored wild follower takes no damage and only moves at the final pulse', () => {
  const {world, victim} = castAtWildFollower()
  for (let i = 0; i < 2; i++) {
    tick(world, 1 / 12)
    assert.equal(victim.hp, 50, 'neutral target is not hurt on the early hostile passes')
    assert.deepEqual([victim.x, victim.z], [53, -61])
    assert.equal(victim.flight, undefined)
  }
  tick(world, 1 / 12)
  assert.equal(victim.hp, 50, 'neutral target remains undamaged after the final pulse')
  assert.ok(victim.flight, 'the neutral rule is distinguished from a missed target')
  assert.deepEqual([victim.x, victim.z], [53, -59.5078125])
})

test('a supplied original load mode shortens the same public Blast without removing its cue', () => {
  const {world, fx} = castAtWildFollower(true)
  const wave = fx.wave
  assert.deepEqual([wave.remaining, wave.radius, wave.maxRadius, wave.range, wave.horizontal, wave.vertical],
    [3, 2, 2, 512, 140, 30])
  assert.equal(world.sounds.filter(e => e.turn === world.turn && e.cue === 0xa1).length, 1)
  for (let i = 0; i < 2; i++) {
    tick(world, 1 / 12)
    assert.equal(wave.radius, 2)
  }
})
