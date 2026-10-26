import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick, command } from '../app/model.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { animateLiveObjects } from '../app/live-people.ts'
import { nativePosition } from '../app/world-terrain-runtime.ts'
import { browserPosition } from '../app/world-coordinates.ts'
import { terrainPointHeight } from '../app/native-terrain.ts'
import { advanceGame } from '../app/game-clock.ts'
import atlas from '../app/original-effects.json' with { type: 'json' }

// Ordinary Mission3 AI spends its authored Convert Wild stock. No injected
// people, stock, cast or conversion callback supplies this visual owner.
function ordinaryConversion() {
  const world = createWorld(3)
  for (let turn = 0; turn < 2500; turn++) {
    tick(world, 1 / 12)
    const flash = world.effects.find(f => f.startConversionLink !== undefined &&
      world.units.some(u => u.id === f.startConversionLink && u.team === 'yellow'))
    if (flash) return { world, flash }
  }
  assert.fail('Ordinary Mission3 Convert Wild did not emit its linked flash')
}

test('ordinary Convert Wild emits one neutral effect58, not birth artwork', () => {
  const { world, flash } = ordinaryConversion()
  const brave = world.units.find(u => u.id === flash.startConversionLink)
  assert.ok(world.spellCasts[2][17] > 0)
  assert.equal(brave.kind, 'brave')
  assert.equal(flash.team, undefined)
  assert.equal(flash.kind, 'trail')
  assert.equal(flash.sprite.sequence, 'startConversion')
  assert.equal(flash.turnsRemaining, 8)
  assert.equal(flash.animation.object, 1240)
  assert.equal(flash.animation.draw, 45)
  assert.equal(flash.animation.palette, 0)
  assert.equal(flash.animation.renderFlags, 0x104)
  assert.equal(flash.animation.f1, 0)
  assert.equal(flash.height, terrainPointHeight(world.land, nativePosition(world, brave)) / 45)
  assert.equal(world.effects.filter(f => f.startConversionLink === brave.id).length, 1)
  assert.ok(!world.effects.some(f => f.kind === 'birth' && f.x === flash.x && f.z === flash.z))
  assert.ok(world.sounds.some(s => s.cue === 5 && s.turn === world.turn && s.x === flash.x && s.z === flash.z))
  assert.deepEqual(atlas.animations.startConversion.map(f => [f.source, f.w, f.h]),
    Array.from({ length: 8 }, (_, i) => [1240 + i, 100, 100]))
  const randomState = world.randomState, effectCounter = world.effectCounter, nextId = world.nextId
  for (let frame = 0; frame < 8; frame++) {
    assert.equal(flash.animation.object + (flash.animation.f1 >>> 2), 1240 + frame)
    animateLiveObjects(world)
  }
  assert.equal(flash.animation.object, 0x650, 'source animator hides the exhausted sequence')
  assert.equal(flash.turnsRemaining, 8, 'presentation is separate from processor lifetime')
  assert.equal(world.randomState, randomState)
  assert.equal(world.effectCounter, effectCounter)
  assert.equal(world.nextId, nextId)
})

test('spell conversion flash follows its Brave, pauses, restores and expires on visit eight', () => {
  const { world, flash } = ordinaryConversion()
  const brave = world.units.find(u => u.id === flash.startConversionLink)
  world.selected = [brave.id]
  assert.ok(command(world, { x: brave.x + 5, z: brave.z }))
  world.paused = true
  const paused = structuredClone(flash)
  tick(world, 5)
  assert.deepEqual(flash, paused)
  world.paused = false
  const restored = migrateCheckpoint(structuredClone(world))
  for (let visit = 1; visit <= 8; visit++) {
    const point = nativePosition(world, brave)
    tick(world, 1 / 12)
    tick(restored, 1 / 12)
    if (visit < 8) {
      assert.equal(flash.turnsRemaining, 8 - visit)
      assert.deepEqual({ x: flash.x, z: flash.z }, browserPosition(point))
      assert.equal(flash.height, terrainPointHeight(world.land, point) / 45)
    } else assert.ok(!world.effects.includes(flash))
    assert.deepEqual(restored.effects, world.effects)
    assert.equal(restored.randomState, world.randomState)
    assert.deepEqual(restored.units, world.units)
  }
  assert.ok(brave.native.flags4 & 0x40000)
})

test('conversion uses the existing elapsed 24 Hz adapter independently of display rate', () => {
  const initial = ordinaryConversion().world
  const states = []
  const schedules = [30, 60, 120, 144].map(hz => Array(hz / 2).fill(1 / hz))
  schedules.push([0.01, 0.09, 0.025, 0.125, 0.05, 0.2])
  for (const schedule of schedules) {
    const world = structuredClone(initial)
    const flash = world.effects.find(f => f.startConversionLink !== undefined &&
      world.units.some(u => u.id === f.startConversionLink && u.team === 'yellow'))
    const timing = { animationTime: 0, animationFrame: 0 }
    for (const dt of schedule) advanceGame(world, timing, dt)
    states.push([world.turn, flash.animation.object, flash.animation.f1, flash.turnsRemaining])
  }
  for (const state of states) assert.deepEqual(state, states[0])
  assert.equal(states[0][1], 0x650)
  // This verifies the existing modern clock adapter, not original wall-clock,
  // native depth-bucket sizing, painter ordering or final GPU blend equivalence.
})
