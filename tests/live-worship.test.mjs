import test from 'node:test'
import assert from 'node:assert/strict'
import { createWorld, command, tick, unitAnimationSource, nativePosition } from '../app/model.ts'
import { advanceGame } from '../app/game-clock.ts'
import { liveWorshippers, worshipHeadPose } from '../app/live-worship.ts'
import { worshipPositions } from '../app/worship.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { planLivePath } from '../app/live-pathfinding.ts'
import { terrainPointHeight } from '../app/native-terrain.ts'
import { initializeLivePanic } from '../app/live-people.ts'

function scenario() {
  const w = createWorld()
  w.manaWorld.gameFlags = 32
  w.units = w.units.filter(u => u.team === 'blue')
  w.selected = w.units.map(u => u.id)
  const head = w.shrines.find(s => s.kind === 'bridge')
  command(w, head)
  return { w, head, clock: { animationTime: 0, animationFrame: 0 } }
}
function advance(w, clock, turns) {
  for (let i = 0; i < turns; i++) advanceGame(w, clock, 1 / 12)
}

test('live worship shares an order, occupies exact slots, prays, earns gifts and releases interrupted/dead members', () => {
  const { w, head, clock } = scenario(), order = currentPersonOrder(w.buildingOrders, w.units[0].native)
  assert.equal(order.model, 27)
  assert.equal(order.references, 7)
  const person = w.units[0].native
  const before = [person.motionGroup, person.motionIndex, person.goalX, person.goalY, w.motionRoutes.active]
  assert.ok(planLivePath(w, w.units[0], head, person, true))
  assert.deepEqual([person.motionGroup, person.motionIndex, person.goalX, person.goalY, w.motionRoutes.active], before, 'a feasibility probe must not replace or release the current route')
  advance(w, clock, 150)
  const people = liveWorshippers(w, head)
  assert.equal(people.length, 7)
  assert.equal(new Set(people.map(p => `${p.x},${p.y}`)).size, 7)
  const slots = worshipPositions(worshipHeadPose(w, head))
  for (const p of people) {
    assert.ok(slots.some(s => s.x === p.x && s.y === p.y))
    assert.equal(p.speed, 0)
    assert.ok([2, 3].includes(p.substate))
    assert.ok([64, 744].includes(p.object))
    assert.equal(p.h, terrainPointHeight(w.land, p))
    assert.equal(unitAnimationSource(w.units.find(u => u.id === p.id)), p)
    assert.equal(p.motionGroup, 0)
  }
  assert.equal(head.nextSlot, 0)
  const roster = people.map(p => p.id)
  w.units[0].work = null
  assert.deepEqual(liveWorshippers(w, head).map(p => p.id), roster, 'standing admission does not depend on the browser work marker')
  w.units[0].work = head.id
  advance(w, clock, 90)
  assert.ok(head.uses >= 1 && w.shots.bridge >= 1)
  const victim = w.units[1]
  victim.hp = 0
  w.selected = [w.units[0].id]
  command(w, { x: 2, z: 30 })
  assert.equal(w.units[0].native, person)
  assert.equal(person.commandStatus, 3)
  advance(w, clock, 2)
  assert.equal(order.references, 5)
  assert.ok(!liveWorshippers(w, head).some(p => p.id === person.id || p.id === victim.id))
  const worshipper = w.units.find(u => u.native.commandStatus === 27)
  initializeLivePanic(w, worshipper)
  advance(w, clock, 180)
  assert.equal(worshipper.native.commandStatus, 27)
  assert.ok([2, 3].includes(worshipper.native.substate))
  const paused = JSON.stringify(w.units)
  w.paused = true
  advance(w, clock, 24)
  assert.equal(JSON.stringify(w.units), paused)
})

test('worship motion, prayer frames, pose RNG and rewards are identical at 5–240 Hz and irregular frames', () => {
  const run = schedule => {
    const { w, head, clock } = scenario(), history = []
    clock.afterTurn = () => history.push(w.units.map(u => [u.x, u.z, u.native.h, u.native.substate, u.native.object, u.native.f1, u.native.f2]))
    let elapsed = 0, i = 0
    while (elapsed < 24 - 1e-9) {
      const dt = Math.min(schedule[i++ % schedule.length], 24 - elapsed)
      advanceGame(w, clock, dt)
      elapsed += dt
    }
    assert.ok(w.shots.bridge > 0)
    assert.ok(history.some(row => row[0][3] === 3), 'braves must reach the pause after their final prayer frame')
    return { history, head, units: w.units, random: w.randomState, pose: w.cosmeticRandom }
  }
  const expected = run([1 / 60])
  for (const schedule of [[1/5], [1/30], [1/120], [1/144], [1/240], [.004, .13, .009, .034]])
    assert.deepEqual(run(schedule), expected)
})

test('an unreachable head preserves the existing command without entering an unported retry state', () => {
  const { w } = scenario(), u = w.units[0], p = u.native
  w.selected = [u.id]
  const old = p.commands.slice(), location = nativePosition(w, u)
  command(w, w.shrines.find(s => s.kind === 'lightning'))
  assert.deepEqual(p.commands, old)
  assert.deepEqual(nativePosition(w, u), location)
  tick(w, 1/12)
  assert.equal(p.commandStatus, 27)
})
