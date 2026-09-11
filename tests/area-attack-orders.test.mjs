import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createWorld,
  addUnit,
  addBuilding,
  command,
  tick,
  syncLandscapeObjects,
} from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { selectLiveCombatTarget } from '../app/live-combat.ts'
import { advanceGame } from '../app/game-clock.ts'

function scenario(count = 1, waypoints = true) {
  const w = createWorld()
  Object.assign(w, { units: [], buildings: [], trees: [], shrines: [] })
  w.manaWorld.gameFlags = 96
  w.terrain.fill(3)
  w.terrainVersion++
  const b = addBuilding(w, 'red', 'hut', { x: 0, z: 0 })
  const units = Array.from({ length: count }, (_, i) =>
    addUnit(w, 'blue', 'warrior', { x: i / 10, z: 20 })
  )
  w.selected = units.map(u => u.id)
  if (waypoints) command(w, { x: 0, z: 12 }, { ctrlKey: true })
  command(w, b, { ctrlKey: true })
  command(w, { x: 16, z: 12 })
  const people = units.map(u => u.native),
    ids = people[0].commands.filter(Boolean)
  return { w, b, units, people, ids }
}
function until(w, done, limit = 1500) {
  for (let i = 0; i < limit && !done(); i++) tick(w, 1 / 12)
  assert.ok(done(), 'scenario completes within the bounded turn budget')
}

test('six followers share ground → area attack → ground orders, destroy the hut and regroup', () => {
  const { w, b, units, people, ids } = scenario(6)
  assert.deepEqual(
    ids.map(id => w.buildingOrders.records[id].model),
    [3, 19, 3]
  )
  assert.equal(
    w.buildingOrders.records[ids[1]].b,
    0,
    'ordinary clicks encode a zero-extent area, never a building ID'
  )
  assert.ok(people.every(p => p.commands.filter(Boolean).join() === ids.join()))
  assert.ok(ids.every(id => w.buildingOrders.records[id].references === 6))
  let grouped = false,
    attacked = false
  until(w, () => {
    grouped ||= w.marching.some(g => g.count === 6)
    attacked ||= (b.damageState?.damage ?? 0) > 0
    return !w.buildingOrders.active
  })
  assert.ok(grouped && attacked)
  assert.equal(b.hp, 0)
  assert.ok(units.every((u, i) => u.native === people[i] && u.x > 14 && u.z > 9 && u.hp > 0))
  assert.equal(new Set(units.map(u => `${u.x},${u.z}`)).size, 6)
  assert.ok(ids.every(id => w.buildingOrders.records[id].references === 0))
})

test('losing an acquired building rescans the area, fights a new person and retains the waypoint tail', () => {
  const {
    w,
    b,
    units: [u],
    people: [p],
    ids,
  } = scenario(1, false)
  until(w, () => p.substate === 3)
  b.hp = 0
  const enemy = addUnit(w, 'red', 'brave', { x: 1, z: -1 })
  tick(w, 1 / 12)
  assert.equal(currentPersonOrder(w.buildingOrders, p).model, 19)
  assert.equal(p.substate, 0, 'invalid target restarts search instead of completing the order')
  until(w, () => !!u.fight)
  assert.equal(u.fight.motion, p)
  assert.equal(u.fight.opponent, enemy.id)
  assert.deepEqual(p.commands.filter(Boolean), ids)
  enemy.hp = 0
  until(w, () => !w.buildingOrders.active)
  assert.equal(u.native, p)
  assert.ok(u.x > 14 && u.z > 9)
})

test('cancelling a reserved fight releases its reservation and the entire staged tail', () => {
  const {
    w,
    units: [u],
    people: [p],
    ids,
  } = scenario(1, false)
  const fight = {
    id: w.nextId++,
    members: [],
    x: 0,
    z: 0,
    attackReservation: { flags4: 0x300000, reactionTimer: 2, reactionDuration: 7 },
  }
  w.fights.push(fight)
  p.substate = 1
  p.workTarget = fight.id
  w.selected = [u.id]
  command(w, { x: -12, z: 8 })
  assert.deepEqual(fight.attackReservation, {
    flags4: 0x200000,
    reactionTimer: 1,
    reactionDuration: 7,
  })
  assert.ok(ids.every(id => !w.buildingOrders.records[id].references))
  assert.equal(w.buildingOrders.active, 1)
})

test('area targeting distinguishes an unbuilt plan from a partially constructed building', () => {
  for (const plan of [false, true]) {
    const {
      w,
      b,
      units: [u],
      people: [p],
    } = scenario(1, false)
    w.buildings = []
    const replacement = addBuilding(w, 'red', 'hut', b, false, { plan })
    if (!plan) replacement.progress = 0.5
    syncLandscapeObjects(w)
    const selected = selectLiveCombatTarget(w, u, currentPersonOrder(w.buildingOrders, p))
    assert.equal(selected.owner, replacement)
    assert.equal(selected.type, plan ? 4 : 3)
    assert.equal(selected.target.class, plan ? 9 : 2)
    until(w, () => replacement.hp <= 0)
    until(w, () => !w.buildingOrders.active)
    assert.ok(u.x > 14)
  }
})

test('arrival voices count approaching followers and fire once when they near the ordered area', () => {
  for (const count of [1, 2, 3, 6]) {
    const { w, units } = scenario(count, false)
    tick(w, 1 / 12)
    assert.equal(w.combatMarches[0].count, count)
    assert.ok(
      units.every(u => u.native.marchCooldown === 15),
      'person epilogue decrements the newly set cooldown'
    )
    assert.equal(w.sounds.filter(s => s.cue >= 45 && s.cue <= 48).length, 0)
    until(w, () => !w.combatMarches.length, 150)
    assert.deepEqual(
      w.sounds.filter(s => s.cue >= 45 && s.cue <= 48).map(s => s.cue),
      [count <= 3 ? 44 + count : 48]
    )
  }
})

test('area approach, combat, arrival voices and queued destinations agree at 5–240 Hz and irregular rendering', () => {
  const run = schedule => {
    const { w } = scenario(6, false),
      clock = { animationTime: 0, animationFrame: 0 }
    let elapsed = 0,
      frame = 0
    while (elapsed < 45 - 1e-9) {
      const dt = Math.min(45 - elapsed, schedule[frame++ % schedule.length])
      advanceGame(w, clock, dt)
      elapsed += dt
    }
    assert.equal(w.buildingOrders.active, 0)
    return { ...w, pendingTime: 0 }
  }
  const baseline = run([1 / 60])
  for (const schedule of [
    [1 / 5],
    [1 / 30],
    [1 / 120],
    [1 / 144],
    [1 / 240],
    [0.003, 0.7, 0.02, 0.16],
  ])
    assert.deepEqual(run(schedule), baseline)
})
