import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import { createLandBridge, stepLandBridge } from '../app/land-bridge.ts'
import fixture from './fixtures/land-bridge.json' with { type: 'json' }

const digest = v => createHash('sha256').update(JSON.stringify(v)).digest('hex')
test('complete Land Bridge lifetimes match native terrain, ordered trails and notifications', () => {
  for (const c of fixture.cases) {
    const land = {
      heights: Int16Array.from(fixture.heights),
      flags: Uint32Array.from(fixture.flags),
    }
    const bridge = createLandBridge(c.start, c.target)
    for (const expected of c.timeline) {
      const trails = [],
        changed = []
      const alive = stepLandBridge(
        land,
        bridge,
        p => trails.push([p.x, p.y, p.h]),
        c => changed.push(c)
      )
      const { start, target, ...state } = bridge
      assert.deepEqual(
        {
          state,
          alive,
          heights: digest(Array.from(land.heights)),
          trails: digest(trails),
          changed: digest(changed),
        },
        expected
      )
    }
  }
})

test('live bridge terrain and particle cleanup are identical across refresh rates and stalls', async () => {
  const { createWorld, cast, tick } = await import('../app/model.ts')
  const run = schedule => {
    const w = createWorld(),
      shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    Object.assign(shaman, { x: 0, z: 20, path: [], casting: null })
    w.selected = [shaman.id]
    w.shots.bridge = 1
    assert.ok(cast(w, 'bridge', { x: 0, z: 4 }))
    let elapsed = 0,
      frame = 0
    while (elapsed < 8 - 1e-9) {
      const dt = Math.min(schedule[frame++ % schedule.length], 8 - elapsed)
      tick(w, dt)
      elapsed += dt
    }
    assert.ok(!w.effects.some(f => f.bridge || f.sprite?.sequence === 'blastTrail'))
    return {
      heights: Array.from(w.land.heights),
      random: w.randomState,
      cosmetic: w.cosmeticRandom,
      turn: w.turn,
      stats: w.stats,
    }
  }
  const expected = run([1 / 60])
  for (const schedule of [
    [1 / 5],
    [1 / 30],
    [1 / 120],
    [1 / 144],
    [1 / 240],
    [0.002, 0.009, 0.04, 0.17, 0.3],
  ])
    assert.deepEqual(run(schedule), expected)
})
