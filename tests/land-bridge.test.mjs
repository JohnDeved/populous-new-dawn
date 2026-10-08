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

test('supplied Bridge cast acknowledges effect allocation before terrain work', async () => {
  const { createWorld, cast, tick } = await import('../app/model.ts')
  const w = createWorld(),
    shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  // Component fixture: supply the established cast position and one shot, not
  // an ordinary worship or browser-input claim. Use the production cast path.
  Object.assign(shaman, { x: 0, z: 20, path: [], casting: null })
  w.selected = [shaman.id]
  w.shots.bridge = 1
  const priorMessage = w.message,
    priorDeadline = w.messageUntil
  assert.ok(cast(w, 'bridge', { x: 0, z: 4 }))
  assert.equal(w.shots.bridge, 0)
  assert.equal(w.projectiles.length, 1)
  assert.equal(w.projectiles[0].spell, 'bridge')
  assert.equal(w.projectiles[0].phase, 'windup')
  assert.equal(w.message, priorMessage, 'projectile allocation is not effect completion')
  assert.equal(w.messageUntil, priorDeadline)

  for (let turn = 0; turn < 128 && !w.effects.some(f => f.bridge); turn++) tick(w, 1 / 12)
  const effect = w.effects.find(f => f.bridge)
  assert.ok(effect, 'the real projectile must reach the effect allocator')
  assert.equal(w.projectiles.length, 0)
  assert.equal(effect.bridge.turn, 0)
  assert.equal(w.message, 'Land Bridge cast.')
  const deadline = w.time + 9
  assert.equal(w.messageUntil, deadline)
  const initialHeights = Array.from(w.land.heights)

  tick(w, 1 / 12)
  assert.equal(effect.bridge.turn, 1)
  assert.deepEqual(Array.from(w.land.heights), initialHeights, 'first visit only initializes')
  assert.equal(w.messageUntil, deadline, 'initialization does not repeat the acknowledgment')
  tick(w, 1 / 12)
  assert.equal(effect.bridge.turn, 2)
  assert.notDeepEqual(Array.from(w.land.heights), initialHeights, 'later visit deforms terrain')
  assert.equal(w.messageUntil, deadline)
})
