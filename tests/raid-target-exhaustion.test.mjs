import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorldState, addUnit } from '../app/world-state.ts'
import { nativeCellPoint } from '../app/world-coordinates.ts'
import { nativePosition } from '../app/world-terrain-runtime.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { withCampaignTribe } from '../app/campaign-runtime.ts'
import { stepComputerTasks } from '../app/computer-runtime.ts'

// Supplied live-caller regression for the ordinary M6 failure observed at turn8098.
// The phase15 dispatcher itself owns the mixed Warrior19/Preacher17 orders.
function fixture({ mixed = true } = {}) {
  const w = createWorldState(6), ai = w.campaignAIs[2]
  Object.assign(w, { units: [], buildings: [], fights: [], selected: [], turn: 0 })
  w.objectCells.objects.clear()
  w.objectCells.heads.fill(0)
  w.pathfinding.people.clear()
  ai.tasks.forEach(t => { t.flags = 0 })
  const make = (team, kind, cell) => {
    const u = addUnit(w, team, kind, nativeCellPoint(cell))
    u.native = createLivePerson(w, u)
    registerLivePerson(w, u.native)
    return u
  }
  const warrior = make('yellow', 'warrior', 0x383a)
  const preacher = mixed ? make('yellow', 'preacher', 0x383a) : null
  const enemy = make('blue', 'shaman', 0x343a)
  enemy.native.state = 19
  const members = [warrior, ...(preacher ? [preacher] : [])]
  for (const u of members) u.native.computerAssignment = 1
  const task = ai.tasks[0]
  Object.assign(task, {
    flags: 1, type: 20, phase: 15, entity: 65530, target: 0x383a,
    origin: 0x383a, members: members.map(u => u.id), requested: members.length,
    retreatPercent: 25, damage: 0, extra: 20,
  })
  const step = () => {
    ai.cursor = 0
    withCampaignTribe(w, 2, () => stepComputerTasks(w, 2))
  }
  step()
  assert.equal(task.phase, 16)
  assert.deepEqual(members.map(u => currentPersonOrder(w.buildingOrders, u.native)?.model),
    mixed ? [19, 17] : [19])
  assert.equal(w.units.some(u => u.id === task.entity), false)
  return { w, ai, task, warrior, preacher, enemy, members, step }
}

for (const mixed of [true, false]) {
  test(`missing cached target retains eligible nearby Shaman (${mixed ? 'mixed' : 'warrior'} raid)`, () => {
    const { w, task, enemy, step } = fixture({ mixed })
    const p = nativePosition(w, enemy)
    assert.equal(((p.x >>> 8) & 254) | (p.y & 0xfe00), 0x343a)
    const before = structuredClone({ orders: w.buildingOrders, random: w.randomState })
    for (let n = 0; n < 40; n++) step()
    assert.deepEqual([task.phase, task.retries, task.target], [16, 0, 0x383a])
    assert.deepEqual({ orders: w.buildingOrders, random: w.randomState }, before)
  })
}

test('genuinely empty target area retains all32 retries and the33rd staging return', () => {
  const { w, task, enemy, members, step } = fixture()
  enemy.hp = 0
  const random = w.randomState
  for (let n = 1; n <= 32; n++) {
    step()
    assert.deepEqual([task.phase, task.retries], [16, n])
  }
  assert.notEqual(w.randomState, random)
  step()
  assert.deepEqual([task.phase, task.fallback, task.retries], [6, 23, 33])
  assert.ok(members.every(u => currentPersonOrder(w.buildingOrders, u.native)?.model === 3))
})

for (const [name, exclude] of [
  ['wrong owner', c => { c.enemy.team = 'yellow' }],
  ['inside building', c => { c.enemy.inside = 123 }],
  ['state23', c => { c.enemy.native.state = 23 }],
  ['airborne', c => { c.enemy.flight = {} }],
  ['outside radius', c => { Object.assign(c.enemy, nativeCellPoint(0x543a)) }],
]) {
  test(`target collection still rejects ${name}`, () => {
    const c = fixture()
    exclude(c)
    c.step()
    assert.deepEqual([c.task.phase, c.task.retries], [16, 1])
  })
}

test('cached-entity branch still refreshes mixed member orders', () => {
  const c = fixture()
  c.task.entity = c.enemy.id
  // Match the cached entity location so this exercises order refresh, not movement.
  c.task.target = 0x343a
  const warriorOrder = currentPersonOrder(c.w.buildingOrders, c.warrior.native)
  warriorOrder.a = 0x343a
  const sermon = currentPersonOrder(c.w.buildingOrders, c.preacher.native)
  sermon.a = 0
  c.step()
  assert.equal(c.task.retries, 0)
  assert.equal(currentPersonOrder(c.w.buildingOrders, c.preacher.native).a, 0x8080)
})

test('cached-entity branch still refreshes missing orders and moved targets', () => {
  for (const moved of [false, true]) {
    const c = fixture({ mixed: false })
    c.task.entity = c.enemy.id
    c.task.target = moved ? 0x383a : 0x343a
    const order = currentPersonOrder(c.w.buildingOrders, c.warrior.native)
    order.model = moved ? 19 : 17
    order.a = c.task.target
    c.step()
    assert.equal(c.task.target, 0x343a)
    assert.equal(c.task.retries, 0)
    const current = currentPersonOrder(c.w.buildingOrders, c.warrior.native)
    assert.deepEqual([current.model, current.a], [19, 0x343a])
  }
})
