import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, command, tick, cast, placeBuilding, addUnit } from '../app/model.ts'
import { advanceGame } from '../app/game-clock.ts'
import { UnitMotion } from '../app/unit-motion.ts'

const schedules = [
  ...[5, 30, 60, 120, 144, 240].map(hz => [1 / hz]),
  [0.007, 0.013, 0.28, 0.6, 0.1],
]
function advance(w, clock, seconds, schedule) {
  for (let i = 0; seconds > 1e-10; i++) {
    const dt = Math.min(seconds, schedule[i % schedule.length])
    advanceGame(w, clock, dt)
    seconds -= dt
  }
}
test('render cadence cannot change gameplay, RNG or owned animation state', () => {
  for (const scenario of ['movement', 'celebration', 'construction', 'blast', 'combat'])
    for (const speed of [0.25, 1, 2]) {
      const results = schedules.map((schedule, index) => {
        const w = createWorld(),
          clock = { animationTime: 0, animationFrame: 0 }
        // The first schedule is the unchanged simulation; all others observe turns.
        if (index) {
          const motion = new UnitMotion()
          clock.beforeTurn = () => motion.beforeTurn(w)
          clock.afterTurn = () => motion.afterTurn(w)
        }
        w.speed = speed
        if (scenario === 'celebration') {
          w.units = w.units.filter(u => u.team === 'blue')
          w.turn = 31
          w.ai.variables[57] = 1
          tick(w, 1 / 12)
          assert.equal(w.status, 'won')
        } else if (scenario === 'construction') {
          w.manaWorld.gameFlags = 32
          w.selected = w.units.filter(u => u.team === 'blue' && u.kind === 'brave').map(u => u.id)
          assert.ok(placeBuilding(w, 'hut', { x: -2, z: 32 }))
          const working = () =>
            w.units.some(
              u => u.builder?.task === 2 && u.builder.phase === 4 && u.builder.person?.timer > 2
            )
          for (let i = 0; i < 1000 && !working(); i++) {
            tick(w, 1 / 12)
          }
          assert.ok(working(), 'construction setup must reach an active work pose')
        } else if (scenario === 'blast') {
          w.manaWorld.gameFlags = 32
          const shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
          w.selected = [shaman.id]
          assert.ok(cast(w, 'blast', { x: shaman.x + 2, z: shaman.z + 2 }))
          assert.ok(w.projectiles.length)
        } else if (scenario === 'combat') {
          w.terrain.fill(3)
          w.terrainVersion++
          w.units = []
          w.buildings = []
          const a = addUnit(w, 'blue', 'warrior', { x: 0, z: 0 }),
            b = addUnit(w, 'red', 'brave', { x: 180 / 256, z: 0 }),
            group = { id: w.nextId++, x: 0, z: 0, angle: 512, members: [a.id, b.id] }
          w.fights = [group]
          for (const [unit, other] of [
            [a, b],
            [b, a],
          ])
            unit.fight = {
              group: group.id,
              opponent: other.id,
              action: 'ready',
              started: 0,
              until: 0,
            }
        } else {
          w.selected = w.units.filter(u => u.team === 'blue').map(u => u.id)
          command(w, { x: 7, z: 33 })
        }
        advance(w, clock, 4, schedule)
        assert.equal(clock.animationFrame, 96)
        assert.ok(clock.animationTime < 1e-9)
        assert.ok(w.pendingTime < 1e-9)
        return { ...w, pendingTime: 0 }
      })
      for (const result of results)
        for (const key of Object.keys(result))
          assert.deepEqual(result[key], results[0][key], `${scenario}, speed=${speed}, ${key}`)
    }
})
test('paused time stays paused; long active frames retain elapsed time', () => {
  const w = createWorld(),
    clock = { animationTime: 0, animationFrame: 0 },
    turn = w.turn
  advanceGame(w, clock, 2)
  assert.equal(w.turn, turn + 24)
  assert.equal(clock.animationFrame, 48)
  const snapshot = JSON.stringify(w)
  w.paused = true
  advanceGame(w, clock, 300)
  w.paused = false
  assert.equal(JSON.stringify(w), snapshot)
  assert.equal(clock.animationFrame, 48)
  for (const dt of [-1, NaN, Infinity]) assert.throws(() => advanceGame(w, clock, dt), RangeError)
})
