import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { levelStartBurstParticle } from '../app/level-start.ts'
import { createSpellTrail, stepSpellTrail } from '../app/spell-trails.ts'
import retained from './fixtures/startup-burst-native.json' with { type: 'json' }

// Decode original offsets directly: the old level-start probe swapped their names.
function nativeTrail(hex) {
  const raw = Buffer.from(hex, 'hex')
  return {
    x: raw.readUInt16LE(0x3d),
    y: raw.readUInt16LE(0x3f),
    h: raw.readInt16LE(0x41),
    yaw: raw.readUInt16LE(0x57),
    pitch: raw.readUInt16LE(0x59),
    speed: raw.readInt16LE(0x5f),
    remaining: raw.readInt16LE(0x6c),
    state: raw[0x2c],
    velocity: {
      x: raw.readInt16LE(0x49),
      y: raw.readInt16LE(0x4b),
      z: raw.readInt16LE(0x4d),
    },
  }
}

function comparable(trail) {
  return Object.fromEntries(Object.keys(nativeTrail(retained.particles[0].birthHex))
    .map(key => [key, structuredClone(trail[key])]))
}

test('default burst draws match all 32 retained original birth records', () => {
  const gameplay = { randomState: retained.particles[0].gameplayBefore }
  for (const [index, particle] of retained.particles.entries()) {
    assert.equal(gameplay.randomState, particle.gameplayBefore, `child ${particle.handle} input`)
    const birth = nativeTrail(particle.birthHex)
    assert.deepEqual(levelStartBurstParticle(gameplay), {
      remaining: birth.remaining, speed: birth.speed, pitch: birth.pitch, yaw: birth.yaw,
    }, `child ${particle.handle}: second draw belongs to +0x59/pitch, third to +0x57/yaw`)
    if (index + 1 < retained.particles.length)
      assert.equal(gameplay.randomState, retained.particles[index + 1].gameplayBefore)
  }
  assert.equal(gameplay.randomState, 1172462824, '96 gameplay draws preserve the original final word')
})

test('burst initializer composes with SpellTrail through all 139 retained native visits', () => {
  const land = { heights: new Int16Array(16384).fill(retained.groundHeight), flags: new Uint16Array(16384) }
  for (const particle of retained.particles) {
    const birth = nativeTrail(particle.birthHex)
    const trail = createSpellTrail(land, birth, 3, 0, { randomState: particle.cosmeticBefore })
    trail.flags4 &= ~0x100
    Object.assign(trail, levelStartBurstParticle({ randomState: particle.gameplayBefore }))
    trail.flags2 |= 0x1080
    assert.deepEqual(comparable(trail), birth, `child ${particle.handle} birth`)
    for (const visit of particle.visits) {
      const alive = stepSpellTrail(land, trail)
      assert.deepEqual(comparable(trail), nativeTrail(visit.recordHex), `child ${particle.handle}, native call ${visit.turn}`)
      assert.equal(alive, visit.turn < particle.retired, `child ${particle.handle} retirement`)
    }
  }
})

test('ordinary Mission 1–3 startup assigns each observed draw to the native angle owner', () => {
  for (const [level, sites] of [[1, 1], [2, 1], [3, 2]]) {
    const world = createWorld(level)
    const particles = new Map()
    let randomState = world.randomState
    // Observe writes without supplying entities, RNG values, effects or startup state.
    // The normal world caller allocates the effect before the three gameplay draws.
    Object.defineProperty(world, 'randomState', {
      enumerable: true,
      configurable: true,
      get: () => randomState,
      set: value => {
        randomState = value
        const effect = world.effects.at(-1)
        if (effect?.kind !== 'trail' || effect.animation) return
        if (!particles.has(effect.id)) particles.set(effect.id, { effect, draws: [], turn: world.turn })
        particles.get(effect.id).draws.push(value)
      },
    })
    for (let turn = 1; turn <= 70; turn++) {
      tick(world, 1 / 12)
      for (const { effect, draws, turn: born } of particles.values()) {
        if (born !== turn || effect.sprite?.sequence !== 'blastTrail') continue
        assert.equal(draws.length, 3, `Mission ${level}, effect ${effect.id}: exactly three gameplay draws`)
        assert.deepEqual(
          { remaining: effect.animation.remaining, speed: effect.animation.speed, pitch: effect.animation.pitch, yaw: effect.animation.yaw },
          { remaining: draws[0] % 2 + 1, speed: 60, pitch: draws[1] & 2047, yaw: draws[2] & 2047 },
          `Mission ${level}, turn ${turn}, effect ${effect.id}: actual stoneBurst caller`,
        )
      }
    }
    const bursts = [...particles.values()].filter(({ effect }) => effect.sprite?.sequence === 'blastTrail')
    assert.equal(bursts.length, sites * 8 * 32)
    assert.ok(world.levelStart.every(site => site.phase === 4))
    assert.equal(world.levelStart.flatMap(site => site.stoneTurns).filter(turn => turn !== null).length, sites * 8)
  }
})
