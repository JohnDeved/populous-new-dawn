import assert from 'node:assert/strict'
import test from 'node:test'
import fixture from './fixtures/person-panic.json' with { type: 'json' }
import manifest from '../decomp/exports.json' with { type: 'json' }
import { stepPersonPanic, stepPersonFireTrail } from '../app/person-panic.ts'
import {
  createWorld,
  tick,
  cast,
  select,
  addBuilding,
  nativePosition,
  unitAnimationSource,
} from '../app/model.ts'
import { advanceGame } from '../app/game-clock.ts'

test('panic and personal fire trails retain original timer, sound, anchor and allocation decisions', () => {
  assert.equal(fixture.executableSha256, manifest.executableSha256)
  for (const { case: c, expected } of fixture.controller) {
    const p = structuredClone(c.person),
      events = []
    const result = stepPersonPanic(p, c.gameFlags, {
      sound: () => events.push('sound'),
      outside: () => c.outside,
    })
    assert.deepEqual(
      {
        timer: p.timer,
        anchorX: p.anchorX,
        anchorY: p.anchorY,
        anchorFlags: p.anchorFlags,
        result,
        events,
      },
      expected
    )
  }
  for (const { case: c, expected } of fixture.emitters) {
    const p = structuredClone(c.person),
      events = []
    stepPersonFireTrail(p, c.displacement, (model, position) => {
      const particle =
        c.fail & (1 << events.length) ? undefined : { flags2: c.flags2, flags3: c.flags3 }
      events.push({ model, position, particle: particle ?? null })
      return particle
    })
    assert.deepEqual({ burnTrail: p.burnTrail, events }, expected)
  }
})

function burningOccupant(direction = 0) {
  const w = createWorld()
  w.manaWorld.gameFlags = 32
  const b = addBuilding(w, 'blue', 'hut', { x: -2, z: 32 }, true, {
    angle: (direction * Math.PI) / 2,
  })
  const u = w.units.find(u => u.team === 'blue' && u.kind === 'brave')
  Object.assign(u, { x: b.x, z: b.z, inside: b.id, work: b.id, path: [] })
  w.shots.lightning = 1
  select(w, 'shaman')
  assert.ok(cast(w, 'lightning', b))
  for (let i = 0; i < 100 && u.inside !== null; i++) tick(w, 1 / 12)
  assert.equal(u.inside, null)
  assert.equal(u.native?.state, 26)
  return { w, b, u }
}

test('burning huts eject running followers with distinct panic and trail lifetimes in all orientations', () => {
  for (let direction = 0; direction < 4; direction++) {
    const { w, b, u } = burningOccupant(direction)
    const p = u.native,
      start = { x: u.x, z: u.z },
      particles = new Map()
    assert.equal(p.timer, 63)
    assert.equal(p.speed, 110)
    assert.equal(u.burnTrail, 23)
    assert.equal(unitAnimationSource(u), p)
    assert.equal(w.selected.includes(u.id), false)
    for (let i = 0; i < 64; i++) {
      for (const fx of w.effects) if (fx.animation?.displacement) particles.set(fx.id, fx)
      tick(w, 1 / 12)
      if (i < 63) assert.equal(u.native?.state, 26)
      assert.equal(u.inside, null)
    }
    assert.equal(u.native, null)
    assert.equal(u.burnTrail, 0)
    assert.ok(Math.hypot(u.x - start.x, u.z - start.z) > 0.2, 'panic uses actual native movement')
    assert.equal(particles.size, 40, '24 sparks plus 16 bright particles')
    assert.ok([...particles.values()].every(f => f.animation.flags2 & 0x4000))
    assert.ok([...particles.values()].some(f => f.sprite.sequence === 'blastShot'))
    assert.ok(w.sounds.some(e => e.cue === 0x51 && e.owner === u.id))
    assert.ok(
      w.effects.every(f => !f.animation?.displacement),
      'all personal particles expire'
    )
    assert.ok(b.burn)
  }
})

test('panic motion, animation and fire trails are independent of presentation frame rate', () => {
  const run = steps => {
    const { w, u } = burningOccupant(),
      clock = { animationTime: 0, animationFrame: 0 }
    for (const dt of steps) advanceGame(w, clock, dt)
    return {
      turn: w.turn,
      random: w.randomState,
      cosmetic: w.cosmeticRandom,
      person: u.native,
      position: nativePosition(w, u),
      trails: u.burnTrail,
      particles: w.effects
        .filter(f => f.animation?.displacement)
        .map(f => ({ ...f, age: undefined, duration: undefined })),
    }
  }
  const expected = run(Array(144).fill(1 / 144))
  for (const hz of [5, 30, 60, 120, 240]) assert.deepEqual(run(Array(hz).fill(1 / hz)), expected)
  assert.deepEqual(run([0.37, 0.01, 0.4, 0.02, 0.2]), expected)
})
