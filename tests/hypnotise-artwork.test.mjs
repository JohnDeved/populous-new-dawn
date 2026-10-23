import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick, addUnit } from '../app/model.ts'
import { effect } from '../app/world-effects.ts'
import { nativePosition } from '../app/world-terrain-runtime.ts'
import { browserPosition } from '../app/world-coordinates.ts'
import { terrainPointHeight } from '../app/native-terrain.ts'
import { animateLiveObjects } from '../app/live-people.ts'
import { hypnotiseTargets } from '../app/spell-effects-runtime.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { advanceGame } from '../app/game-clock.ts'
import atlas from '../app/original-effects.json' with { type: 'json' }

// Supplied effect isolates initialization/animation; the earned Mission22 cast in
// hypnotise-order.test.mjs separately proves the shipped casting/controller path.
function fixture(x = 0x2001, y = 0x21ff) {
  const world = createWorld()
  const flash = effect(world, 'hypnotise', browserPosition({ x, y }))
  flash.team = 'blue'
  flash.duration = Infinity
  return { world, flash }
}

test('Hypnotise uses original sixteen-frame artwork, descriptor and single initialization cue', () => {
  const { world, flash } = fixture()
  assert.equal(flash.sprite.sequence, 'hypnotise')
  assert.deepEqual([flash.animation.object, flash.animation.draw, flash.animation.palette,
    flash.animation.renderFlags, flash.animation.flags3], [1264, 44, 0, 0x104, 0])
  assert.equal(flash.turnsRemaining, 16)
  const cue = world.sounds.filter(s => s.cue === 0x2a)
  assert.equal(cue.length, 1)
  assert.deepEqual([cue[0].x, cue[0].z], [flash.x, flash.z])
  assert.deepEqual(atlas.animations.hypnotise.map(f => [f.source, f.w, f.h]),
    Array.from({ length: 16 }, (_, i) => [1264 + i, 100, 100]))
  const rng = world.randomState, serial = world.nextId, counter = world.effectCounter
  for (let frame = 0; frame < 16; frame++) {
    assert.equal(flash.animation.object + (flash.animation.f1 >>> 2), 1264 + frame)
    animateLiveObjects(world)
  }
  assert.equal(flash.animation.object, 0x650)
  assert.equal(flash.turnsRemaining, 16)
  assert.deepEqual([world.randomState, world.nextId, world.effectCounter], [rng, serial, counter])
})

test('Hypnotise snaps cell boundaries and signed wrap, then samples ground at that center', () => {
  for (const [input, expected] of [[0, 0x100], [0x1ff, 0x100], [0x200, 0x300],
    [0x7fff, 0x7f00], [0x8000, -0x7f00], [0xffff, -0x100]]) {
    const { world, flash } = fixture(input, input)
    const position = nativePosition(world, flash)
    assert.deepEqual([position.x, position.y], [expected, expected])
    assert.equal(flash.height, terrainPointHeight(world.land, position) / 45)
  }
})

test('cell-center origin keeps the same footprint but corrects nearest-six tie ranking', () => {
  const { world, flash } = fixture(0x2001, 0x2100)
  world.units = []
  const people = [0x2100, 0x2100, 0x2100, 0x2100, 0x2100, 0x2080, 0x2180]
    .map(x => addUnit(world, 'red', 'brave', browserPosition({ x, y: 0x2100 })))
  const ids = point => hypnotiseTargets(world, point, 'blue').map(({ u }) => u.id)
  assert.ok(ids(browserPosition({ x: 0x2001, y: 0x2100 })).includes(people[5].id))
  assert.ok(!ids(browserPosition({ x: 0x2001, y: 0x2100 })).includes(people[6].id))
  assert.ok(!ids(flash).includes(people[5].id))
  assert.ok(ids(flash).includes(people[6].id))
  assert.deepEqual(ids(flash), ids(browserPosition({ x: 0x2100, y: 0x2100 })))
})

test('Hypnotise pauses and restores current animation, retaining sixteen logical visits', () => {
  const { world, flash } = fixture()
  world.paused = true
  const frozen = structuredClone(flash)
  tick(world, 5)
  animateLiveObjects(world)
  assert.deepEqual(flash, frozen)
  world.paused = false
  animateLiveObjects(world)
  const restored = migrateCheckpoint(structuredClone(world))
  for (let visit = 1; visit <= 16; visit++) {
    tick(world, 1 / 12)
    tick(restored, 1 / 12)
    assert.deepEqual(restored.effects, world.effects)
    if (visit < 16) assert.equal(flash.turnsRemaining, 16 - visit)
    else assert.ok(!world.effects.includes(flash))
  }
})

test('Hypnotise elapsed animation is display-rate independent at 30/60/120/144 Hz and irregular cadence', () => {
  const { world: initial, flash } = fixture()
  const schedules = [30, 60, 120, 144].map(hz => Array(hz).fill(1 / hz))
  schedules.push([0.01, 0.09, 0.025, 0.125, 0.05, 0.2, 0.1, 0.15, 0.25])
  const states = schedules.map(schedule => {
    const world = structuredClone(initial), timing = { animationTime: 0, animationFrame: 0 }
    for (const dt of schedule) advanceGame(world, timing, dt)
    const f = world.effects.find(f => f.id === flash.id)
    return [world.turn, f.turnsRemaining, f.animation.object, f.animation.f1]
  })
  for (const state of states) assert.deepEqual(state, states[0])
  assert.equal(states[0][2], 0x650)
})
