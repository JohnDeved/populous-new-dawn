import assert from 'node:assert/strict'
import test from 'node:test'
import { createFlatten, stepFlatten } from '../app/flatten.ts'

test('Flatten follows the native 15-turn terrain and orbit lifecycle', () => {
  const land = {
      heights: new Int16Array(16384).fill(500),
      flags: new Uint32Array(16384),
    },
    flatten = createFlatten(land, { x: 0xff00, y: 0x0100, h: 0 })
  land.heights.fill(0)

  const events = [],
    terrainRadii = [],
    visualRadii = [],
    orbitHeights = [],
    sparkleHeights = [],
    sunlight = [],
    removed = []
  let nextId = 1,
    alive = true
  for (let turn = 0; alive; turn++) {
    alive = stepFlatten(land, flatten, {
      orbit: (position, lit) => {
        const attempt = sunlight.length
        orbitHeights.push(position.h)
        sunlight.push(lit)
        events.push('orbit')
        return attempt === 3 || attempt === 19 ? null : nextId++
      },
      terrain: cell => {
        terrainRadii.push(flatten.terrainRadius)
        events.push(`terrain:${cell}`)
      },
      sparkle: position => {
        sparkleHeights.push(position.h)
        visualRadii.push(flatten.visualRadius)
        events.push('sparkle')
      },
      move: () => events.push('move'),
      remove: id => removed.push(id),
    })
    assert.ok(turn < 15)
  }

  assert.deepEqual(
    terrainRadii,
    [380, 721, 1062, 1403, 1744, 2085, 2426, 2767, 3108, 3449, 3790, 4132, 4474, 4816, 5158]
  )
  assert.deepEqual(
    visualRadii.filter((_, i) => i % 30 === 0),
    [0, 341, 682, 1023, 1364, 1705, 2046, 2387, 2728, 3069, 3410, 3752, 4094, 4436, 4778]
  )
  assert.deepEqual(
    sunlight,
    Array.from({ length: 32 }, (_, i) => i % 5 === 0)
  )
  assert.equal(events[31], 'orbit')
  assert.match(events[32], /^terrain:/)
  assert.equal(events[33], 'sparkle')
  assert.ok(orbitHeights.every(height => height === 500))
  assert.ok(sparkleHeights.every(height => height === 500))
  assert.equal(removed.length, 30)
  assert.deepEqual(
    {
      remaining: flatten.remaining,
      terrainRadius: flatten.terrainRadius,
      visualRadius: flatten.visualRadius,
      expansionBudget: flatten.expansionBudget,
    },
    { remaining: 0, terrainRadius: 5500, visualRadius: 5120, expansionBudget: 0 }
  )
  assert.equal(land.heights.filter(height => height === 500).length, 45)
})

test('live Flatten casting is refresh-rate independent', async () => {
  const { cast, createWorld, tick } = await import('../app/model.ts')
  const run = schedule => {
    const w = createWorld(),
      shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    Object.assign(shaman, { x: 0, z: 20, path: [], casting: null })
    w.selected = [shaman.id]
    w.shots.flatten = 1
    assert.ok(cast(w, 'flatten', { x: 0, z: 8 }))
    let elapsed = 0,
      frame = 0
    while (elapsed < 8 - 1e-9) {
      const dt = Math.min(schedule[frame++ % schedule.length], 8 - elapsed)
      tick(w, dt)
      elapsed += dt
    }
    assert.equal(w.shots.flatten, 0)
    assert.ok(!w.effects.some(f => f.flatten))
    return {
      heights: Array.from(w.land.heights),
      turn: w.turn,
      stats: w.stats,
      landVersion: w.landVersion,
    }
  }
  const expected = run([1 / 60])
  for (const schedule of [[1 / 5], [1 / 30], [1 / 144], [0.002, 0.009, 0.04, 0.17, 0.3]])
    assert.deepEqual(run(schedule), expected)
})
