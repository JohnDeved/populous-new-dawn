import assert from 'node:assert/strict'
import { test } from 'node:test'
import fixture from './fixtures/unit-interpolation.json' with { type: 'json' }
import camera from '../app/original-camera.json' with { type: 'json' }
import { createWorld, addUnit, command, browserPosition } from '../app/model.ts'
import { relativeCoordinate } from '../app/projection.ts'
import { UnitMotion, unitPosition, interpolateUnitPosition } from '../app/unit-motion.ts'
import { advanceGame } from '../app/game-clock.ts'

const close = (a, b, epsilon = 1e-9) => {
  for (const key of Object.keys(a)) assert.ok(Math.abs(a[key]-b[key]) <= epsilon, `${key}: ${a[key]} != ${b[key]}`)
}
test('continuous positions follow captured native body/shadow interpolation', () => {
  assert.equal(fixture.executableSha256, camera.executableSha256)
  for (const c of fixture.cases) {
    const fraction = c.enabled && !c.paused && c.fps ? c.turns*c.frames/c.fps : 0
    const from = { ...browserPosition({ x: c.x-c.dx, y: c.y-c.dy }), y: (c.h-c.dh+c.support)/128 }
    const to = { ...browserPosition(c), y: (c.h+c.support)/128 }
    const p = interpolateUnitPosition(from, to, fraction)
    const x = Math.round((p.x+8)*256)&65535, y = Math.round((-p.z-8)*256)&65535
    const point = [relativeCoordinate(x,c.cx),p.y*128,relativeCoordinate(y,c.cy)]
    point.forEach((v,i) => assert.ok(Math.abs(v-c.body[i]) <= 1+1e-8))
    assert.equal(c.body[0], c.shadow[0])
    assert.equal(c.body[2], c.shadow[2])
  }
  close(interpolateUnitPosition({x:127.9,y:3,z:-127.9},{x:-127.9,y:5,z:127.9},.5), {x:-128,y:4,z:-128})
})

test('every elapsed-time schedule reaches the same displayed position without changing simulation', () => {
  const schedules = [...[5,12,24,30,60,120,144,240].map(hz => [1/hz]), [.003,.017,.7,.08]]
  const samples = [.01,.09,.17,.25,.333,.5,.77,1,1.37,2]
  const results = schedules.map(schedule => {
    const w = createWorld(), motion = new UnitMotion(), clock = {
      animationTime: 0, animationFrame: 0,
      beforeTurn: () => motion.beforeTurn(w), afterTurn: () => motion.afterTurn(w),
    }
    const u = w.units.find(u => u.team === 'blue' && u.kind === 'brave')
    w.selected = [u.id]
    command(w,{x:u.x+3,z:u.z+1})
    assert.ok(u.path.length)
    let time = 0, frame = 0
    const positions = []
    for (const sample of samples) {
      while (sample-time > 1e-10) {
        const dt = Math.min(sample-time, schedule[frame++%schedule.length])
        advanceGame(w,clock,dt)
        time += dt
      }
      positions.push(motion.position(w,u))
    }
    assert.notDeepEqual(positions[0],positions.at(-1))
    return { positions, world: { ...w, pendingTime: 0 } }
  })
  for (const r of results) {
    assert.deepEqual(r.world,results[0].world)
    r.positions.forEach((p,i) => close(p,results[0].positions[i]))
  }
})

test('pause, endpoints, placement, entry, conversion and new people never replay stale movement', () => {
  const w = createWorld(), motion = new UnitMotion()
  const u = w.units[0], start = { ...u }
  motion.beforeTurn(w)
  u.x += 1
  motion.afterTurn(w)
  w.pendingTime = 1/24
  const half = motion.position(w,u)
  assert.equal(half.x,start.x+.5)
  w.paused = true
  advanceGame(w,{animationTime:0,animationFrame:0},100)
  assert.deepEqual(motion.position(w,u),half)
  w.paused = false
  w.pendingTime = 1/12
  assert.deepEqual(motion.position(w,u),unitPosition(w,u))
  u.x += 10 // Explicit placement outside a turn.
  assert.deepEqual(motion.position(w,u),unitPosition(w,u))
  for (const change of [u => u.inside = 123, u => u.inside = null, u => u.kind = 'warrior', u => u.team = 'red']) {
    motion.beforeTurn(w)
    change(u)
    u.z += 4
    motion.afterTurn(w)
    w.pendingTime = 0
    assert.deepEqual(motion.position(w,u),unitPosition(w,u))
  }
  const replacement = addUnit(w,'blue','brave',{x:3,z:4})
  replacement.id = u.id // Object identity prevents stale history after ID reuse.
  assert.deepEqual(motion.position(w,replacement),unitPosition(w,replacement))
  motion.beforeTurn(w)
  motion.afterTurn(w)
  assert.deepEqual(motion.position(w,u),unitPosition(w,u))
})
