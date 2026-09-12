import assert from 'node:assert/strict'
import test from 'node:test'
import { createFirestorm, stepFirestorm } from '../app/firestorm.ts'
import { createLivePerson } from '../app/live-people.ts'
import { addBuilding, addUnit, browserPosition, cast, createWorld, tick } from '../app/model.ts'

const land = () => ({ heights: new Int16Array(16384), flags: new Uint32Array(16384) })
const nextRandom = seed => {
  const n = (Math.imul(seed, 0x24a1) + 0x24df) >>> 0
  return ((n >>> 13) | (n << 19)) >>> 0
}

test('Firestorm emits its complete native 220-turn rain sequence', () => {
  const game = { randomState: 0x12345678 },
    firestorm = createFirestorm({ x: 0x0200, y: 0xfe00, h: 50 }, 2),
    shots = []
  const visits = []
  while (stepFirestorm(land(), firestorm, game, shot => {
    visits.push(firestorm.remaining)
    shots.push(shot)
  })) {}
  assert.equal(firestorm.remaining, 0)
  assert.deepEqual(visits, Array.from({ length: 54 }, (_, i) => 216 - i * 4))
  assert.equal(shots.length, 54)
  assert.deepEqual(shots[0], {
    origin: { x: 64667, y: 510, h: 1200 },
    target: { x: 64667, y: 510, h: -20 },
  })
  let expected = 0x12345678
  for (let i = 0; i < 108; i++) expected = nextRandom(expected)
  assert.equal(game.randomState, expected)
})

test('live Firestorm composes fire, panic Blast and building ignition independently of refresh rate', () => {
  const run = schedule => {
    const w = createWorld(),
      shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    w.units = [shaman]
    w.buildings = []
    w.trees = []
    w.land.buildingIds.fill(0)
    w.land.flags.forEach((flags, i) => { w.land.flags[i] = flags & ~512 })
    Object.assign(shaman, { x: 0, z: 20, path: [], casting: null })
    w.selected = [shaman.id]
    w.shots.firestorm = 1
    assert.ok(cast(w, 'firestorm', { x: 0, z: 8 }))
    for (let i = 0; !w.effects.some(f => f.firestorm) && i < 64; i++) tick(w, 1 / 12)
    const controller = w.effects.find(f => f.firestorm)
    assert.ok(controller)

    controller.firestorm.armed = true
    controller.firestorm.remaining = 5
    w.randomState = 0x12345678
    tick(w, 1 / 12)
    const shot = w.projectiles.find(p => p.fireball)
    assert.ok(shot)
    const target = shot.destination,
      point = browserPosition(target)
    const victim = addUnit(w, 'red', 'brave', point)
    victim.native = createLivePerson(w, victim)
    victim.native.state = 14
    const building = addBuilding(w, 'red', 'hut', point),
      targetIndex = ((target.y & 65535) >> 9) * 128 + ((target.x & 65535) >> 9)
    w.land.buildingIds[targetIndex] = building.id
    w.land.flags[targetIndex] |= 512

    let elapsed = 0,
      frame = 0
    while (elapsed < 1) {
      const dt = Math.min(schedule[frame++ % schedule.length], 1 - elapsed)
      tick(w, dt)
      elapsed += dt
    }
    assert.ok(w.effects.some(f => f.fire))
    assert.ok(building.burn)
    assert.equal(building.damageState.attacker, 0)
    assert.ok(victim.flight)
    assert.ok(victim.burnTrail > 0)
    assert.ok(victim.hp < 100)
    for (const cue of [0x7c, 0xb3, 0xb6, 0xa1]) assert.ok(w.sounds.some(sound => sound.cue === cue))
    return {
      turn: w.turn,
      shots: w.shots.firestorm,
      randomState: w.randomState,
      buildingState: building.damageState.state,
      victimHp: victim.hp,
      burnTrail: victim.burnTrail,
    }
  }
  const expected = run([1 / 60])
  for (const schedule of [[1 / 5], [1 / 144], [0.002, 0.04, 0.17, 0.3]])
    assert.deepEqual(run(schedule), expected)
})
