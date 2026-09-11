import test from 'node:test'
import assert from 'node:assert/strict'
import { createWorld, addUnit, addBuilding, command, tick, joinBattle } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { advanceGame } from '../app/game-clock.ts'

const person = u => u.fight?.motion ?? u.native ?? u.entry?.person
function scenario(kind = 'ground', existing = true) {
  const w = createWorld()
  w.units = []
  w.buildings = []
  w.trees = []
  w.terrain.fill(3)
  w.terrainVersion++
  w.manaWorld.gameFlags = 32 | (existing ? 64 : 0)
  const head = w.shrines.find(s => s.kind === 'bridge')
  Object.assign(head, { x: 20, z: 8 })
  w.shrines = kind === 'head' ? [head] : []
  const red = addUnit(w, 'red', 'brave', { x: 0, z: 0 })
  const ally = addUnit(w, 'blue', 'warrior', { x: 1, z: 0 })
  if (existing) joinBattle(w, ally, red)
  const u = addUnit(w, 'blue', 'brave', { x: 2, z: 0 })
  const hut = kind === 'building' ? addBuilding(w, 'blue', 'hut', { x: 20, z: 8 }) : undefined
  w.selected = [u.id]
  if (kind === 'ground') {
    command(w, { x: 12, z: 8 }, { ctrlKey: true })
    command(w, { x: 20, z: 8 })
  } else command(w, hut ?? head)
  if (kind === 'building') tick(w, 1 / 12)
  const p = person(u),
    ids = p.commands.filter(Boolean)
  joinBattle(w, u, red)
  return { w, u, p, ids, red, ally, hut, head }
}
function until(w, done, limit = 700) {
  for (let i = 0; i < limit && !done(); i++) tick(w, 1 / 12)
  assert.ok(done())
}

test('reinforcements and new encounters retain the same person and resume ground, building and worship orders', () => {
  for (const existing of [true, false])
    for (const kind of ['ground', 'building', 'head']) {
      const { w, u, p, ids, red, hut, head } = scenario(kind, existing)
      assert.equal(u.fight.motion, p, `${kind}: combat must retain the ordered person`)
      assert.deepEqual(p.commands.filter(Boolean), ids)
      assert.ok(ids.every(id => w.buildingOrders.records[id].references === 1))
      assert.equal(u.entry, undefined, 'combat exclusively owns the person')
      assert.equal(u.native, null)
      red.hp = 0
      until(w, () => !u.fight && person(u)?.state === 10)
      assert.equal(person(u), p)
      assert.equal(currentPersonOrder(w.buildingOrders, p), w.buildingOrders.records[ids[0]])
      if (kind === 'ground') {
        until(w, () => w.buildingOrders.active === 0)
        assert.ok(u.x > 18 && u.z > 6, 'the full waypoint tail completes')
      } else if (kind === 'building') {
        assert.equal(u.work, hut.id)
        until(w, () => u.inside === hut.id)
        assert.equal(w.buildingOrders.active, 0)
      } else {
        assert.equal(u.work, head.id)
        until(w, () => [2, 3].includes(p.substate) && p.speed === 0 && [64, 744].includes(p.object))
        assert.ok([64, 744].includes(p.object), 'original prayer pose resumes')
      }
    }
})

test('replacing or killing a reinforcement releases every retained command reference', () => {
  for (const action of ['replace', 'death']) {
    const { w, u, ids } = scenario()
    if (action === 'replace') {
      w.selected = [u.id]
      command(w, { x: -20, z: 8 })
    } else u.hp = 0
    tick(w, 2 / 12)
    assert.ok(ids.every(id => !w.buildingOrders.records[id].references))
    assert.equal(w.buildingOrders.active, action === 'replace' ? 1 : 0)
  }
})

test('a displaced fighter retains its queue and a split keeps both followers’ original records', () => {
  const { w, u, p, ids, red } = scenario()
  const extra = addUnit(w, 'blue', 'brave', { x: 1, z: 1 })
  joinBattle(w, extra, red)
  const replacement = addUnit(w, 'blue', 'warrior', { x: 1, z: 1 })
  joinBattle(w, replacement, red)
  assert.equal(u.fight, null)
  assert.equal(u.native, p)
  assert.ok(p.flags2 & 16)
  assert.deepEqual(p.commands.filter(Boolean), ids)
  red.hp = 0
  until(w, () => w.buildingOrders.active === 0)
  assert.ok(u.x > 18)

  const f = scenario()
  const recruit = addUnit(f.w, 'red', 'warrior', { x: 1, z: 1 })
  f.w.selected = [recruit.id]
  command(f.w, { x: -20, z: 8 })
  const motion = recruit.native,
    orders = motion.commands.slice()
  joinBattle(f.w, recruit, f.ally)
  assert.equal(f.w.fights.length, 2)
  assert.equal(recruit.fight.motion, motion)
  assert.equal(f.u.fight.motion, f.p)
  assert.equal(recruit.fight.group, f.u.fight.group)
  assert.deepEqual(motion.commands, orders)
  assert.deepEqual(f.p.commands.filter(Boolean), f.ids)
})

test('combat interruption and resumed orders preserve simulation and poses across render rates', () => {
  const run = schedule => {
    const { w, red } = scenario()
    const clock = {
      animationTime: 0,
      animationFrame: 0,
      afterTurn: () => {
        if (w.turn === 24) red.hp = 0
      },
    }
    let elapsed = 0,
      frame = 0
    while (elapsed < 12 - 1e-9) {
      const dt = Math.min(12 - elapsed, schedule[frame++ % schedule.length])
      advanceGame(w, clock, dt)
      elapsed += dt
    }
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

test('combat removes a waiting trainee from its physical line while retaining its training order', () => {
  const w = createWorld()
  w.units = []
  w.buildings = []
  w.shrines = []
  w.trees = []
  w.terrain.fill(3)
  w.terrainVersion++
  w.manaWorld.gameFlags = 96
  const b = addBuilding(w, 'blue', 'camp', { x: 0, z: 0 })
  const people = Array.from({ length: 8 }, (_, i) =>
    addUnit(w, 'blue', 'brave', { x: 9 + i * 0.4, z: 1 })
  )
  w.selected = people.map(u => u.id)
  command(w, b)
  until(w, () => b.admission?.inside === 5 && people.every(u => !u.entry?.person.speed))
  const u = people.find(u => u.entry.person.flags3 & 32),
    p = person(u)
  const record = currentPersonOrder(w.buildingOrders, p)
  const red = addUnit(w, 'red', 'warrior', { x: u.x + 1, z: u.z })
  const ally = addUnit(w, 'blue', 'warrior', { x: u.x + 2, z: u.z })
  joinBattle(w, ally, red)
  joinBattle(w, u, red)
  assert.equal(u.fight.motion, p)
  assert.equal(p.flags3 & 32, 0)
  assert.equal(p.reservationNext, 0)
  assert.equal(currentPersonOrder(w.buildingOrders, p), record)
  assert.equal(record.references, 1)
  const queue = []
  for (let id = b.admission.queueHead; id; ) {
    assert.ok(!queue.includes(id))
    queue.push(id)
    id = person(people.find(u => u.id === id)).reservationNext
  }
  assert.equal(queue.length, 2)
  assert.ok(!queue.includes(u.id))
  red.hp = 0
  until(w, () => !!(p.flags3 & 32))
  assert.equal(u.entry.person, p)
  assert.equal(u.work, b.id)
  assert.equal(record.references, 1)
})
