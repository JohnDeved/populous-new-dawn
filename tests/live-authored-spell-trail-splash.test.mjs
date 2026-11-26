import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, nativePosition, tick } from '../app/model.ts'
import { createSpellTrail } from '../app/spell-trails.ts'
import { supportsFollower } from '../app/world-terrain-runtime.ts'

function atTurn(w, target) {
  const turns = target - w.turn
  assert.ok(Number.isSafeInteger(turns) && turns >= 0 && turns <= 120, 'bounded turn range')
  for (let i = 0; i < turns; i++) {
    const previous = w.turn
    assert.equal(w.status, 'playing')
    tick(w, 1 / 12)
    assert.equal(w.turn, previous + 1, 'the ordinary tick must progress')
  }
  assert.equal(w.turn, target)
}

function suppliedBurn(turns) {
  const w = createWorld(6)
  atTurn(w, 100)
  const brave = w.units.find(u => u.team === 'blue' && u.kind === 'brave')
  assert.equal(brave.id, 281)
  assert.equal(w.objectCells.objects.get(brave.id), brave.native)
  assert.deepEqual(nativePosition(w, brave), { x: 15104, y: 13156, h: 192 })
  assert.ok(!brave.burnTrail)
  brave.burnTrail = brave.native.burnTrail = turns // Supply only existing burn-trail state.
  const first = w.nextId
  atTurn(w, 101)
  assert.equal(brave.burnTrail, turns - 1)
  return { w, first }
}

test('ordinary model-3 spark visit branches at signed palette -16 and carries its object into expiry', () => {
  const trailState = fx => [
    fx.animation.object, fx.animation.state, fx.animation.draw, fx.animation.remaining,
  ]
  for (const [palette, draw] of [[240, 1], [241, 29]]) {
    const { w, first } = suppliedBurn(1)
    const fx = w.effects.find(f => f.id >= first && f.sprite?.sequence === 'blastTrail')
    assert.ok(fx)
    assert.deepEqual(trailState(fx), [314, 3, 1, 4])
    assert.equal(fx.animation.palette, 240)
    fx.animation.palette = palette // Exact boundary pair, one unmodified and one supplied.
    atTurn(w, 104)
    assert.deepEqual(trailState(fx), [314, 3, 1, 1])
    atTurn(w, 105)
    assert.deepEqual(trailState(fx), [318, 4, draw, 3])
    atTurn(w, 107)
    assert.ok(w.effects.includes(fx))
    assert.equal(fx.animation.remaining, 1)
    atTurn(w, 108)
    assert.ok(!w.effects.includes(fx))
  }
})

test('ordinary burn trail allocates and initializes the model-10 particle above the threshold', () => {
  const { w, first } = suppliedBurn(9)
  const particles = () => w.effects.filter(f => f.id >= first && f.sprite?.sequence === 'blastShot')
  const [fx, ...others] = particles()
  assert.ok(fx)
  assert.equal(others.length, 0)
  const t = fx.animation
  assert.deepEqual([t.x, t.y, t.h, t.state, t.remaining, t.draw, t.object], [
    15104, 13156, 208, 9, 4, 29, 1120,
  ])
  assert.deepEqual([t.flags2, t.flags3], [0x44080, 0x100])
  const terrainProbe = createSpellTrail(
    w.land, { x: 15104, y: 13156, h: 1 }, 10, 0, { randomState: 0 }
  )
  assert.deepEqual([terrainProbe.h, terrainProbe.flags2], [192, 0x40080])
  atTurn(w, 102)
  assert.equal(particles().length, 1, 'no new model-10 particle at threshold eight')
  assert.equal(particles()[0], fx)
})

test('ordinary supplied water-respawn visit allocates a grounded splash with cue and sixteen turns', () => {
  for (const [point, supported] of [[{ x: 0, z: 0 }, false], [{ x: 57, z: -61 }, true]]) {
    const w = createWorld(6)
    atTurn(w, 100)
    assert.equal(supportsFollower(w, point), supported)
    assert.ok(!w.effects.some(f => f.kind === 'splash'))
    const first = w.nextId
    w.respawns[0] = 336 / 12
    w.respawnPoints[0] = point // Supply only the starting respawn phase and location.
    atTurn(w, 101)
    const splashes = w.effects.filter(f => f.id >= first && f.kind === 'splash')
    const cues = w.sounds.filter(s => s.cue === 0x2c && s.turn === 101)
    if (supported) {
      assert.equal(splashes.length, 0)
      assert.equal(cues.length, 0)
      continue
    }
    assert.equal(splashes.length, 1)
    assert.equal(cues.length, 1)
    assert.deepEqual([cues[0].x, cues[0].z], [point.x, point.z])
    const [fx] = splashes
    assert.equal(fx.height, 0)
    assert.equal(fx.turnsRemaining, 16)
    assert.deepEqual(
      [fx.animation.draw, fx.animation.object, fx.animation.morph, fx.animation.flags3],
      [44, 1304, 0xd3, 0x40400]
    )
    atTurn(w, 116)
    assert.equal(fx.turnsRemaining, 1)
    assert.ok(w.effects.includes(fx))
    atTurn(w, 117)
    assert.ok(!w.effects.includes(fx))
  }
})
