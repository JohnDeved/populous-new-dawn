import assert from 'node:assert/strict'
import test from 'node:test'
import { createErosion } from '../app/erosion.ts'
import { stepLightning } from '../app/lightning.ts'
import { cast, createWorld, effect, tick } from '../app/model.ts'

test('live Erosion casting deforms terrain independently of refresh rate', () => {
  const run = schedule => {
    const w = createWorld(),
      shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
      before = Array.from(w.land.heights)
    Object.assign(shaman, { x: 0, z: 20, path: [], casting: null })
    w.selected = [shaman.id]
    w.shots.erosion = 1
    assert.ok(cast(w, 'erosion', { x: 0, z: 8 }))
    let elapsed = 0,
      frame = 0
    while (elapsed < 8 - 1e-9) {
      const dt = Math.min(schedule[frame++ % schedule.length], 8 - elapsed)
      tick(w, dt)
      elapsed += dt
    }
    assert.equal(w.shots.erosion, 0)
    assert.ok(!w.effects.some(f => f.erosion))
    assert.ok(w.land.heights.some((height, i) => height !== before[i]))
    assert.ok(w.sounds.some(sound => sound.cue === 0x7e))
    assert.ok(w.sounds.some(sound => sound.cue === 0xa9))
    return {
      heights: Array.from(w.land.heights),
      randomState: w.randomState,
      turn: w.turn,
      stats: w.stats,
      landVersion: w.landVersion,
    }
  }
  const expected = run([1 / 60])
  for (const schedule of [[1 / 5], [1 / 144], [0.002, 0.04, 0.17, 0.3]])
    assert.deepEqual(run(schedule), expected)
})

test('a newer Lightning consumes simulation RNG before Erosion', () => {
  const w = createWorld()
  Object.assign(w, { units: [], buildings: [], trees: [], shrines: [], randomState: 0x12345678 })
  const erosion = effect(w, 'erosion', { x: 0, z: 0 })
  erosion.erosion = createErosion({ x: 0x8000, y: 0x8000, h: 500 })
  erosion.duration = Infinity
  const lightning = effect(w, 'lightning', { x: 1, z: 1 })
  lightning.lightning = {
    tribe: 0,
    start: { x: 0x7000, y: 0x7000, h: 700 },
    target: { x: 0x9000, y: 0x9000, h: 300 },
    seed: 0x87654321,
    turn: 0,
    segments: [],
  }
  const expected = structuredClone(lightning.lightning)
  stepLightning(w.land, expected, { randomState: w.randomState })

  tick(w, 1 / 12)
  assert.deepEqual(lightning.lightning.segments, expected.segments)
})
