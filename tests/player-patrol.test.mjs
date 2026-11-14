import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  addBuilding,
  addUnit,
  command,
  tick,
  cancelInteraction,
  guardShaman,
  releasePlayerPatrols,
  nativePosition,
} from '../app/model.ts'
import { liveCommandContext } from '../app/live-command.ts'
import { stopLivePatrols } from '../app/live-movement.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { random } from '../app/native-math.ts'

// Ctrl+Alt left release (action 0x7f with Alt bit 0x800) and N (tribe command
// 0x68); decomp/research/player-patrol.md P1-P8.
const route = { ctrlKey: true, altKey: true }
const A = { x: -10, z: 8 }, B = { x: 0, z: 8 }, C = { x: 0, z: 18 }

function world(count = 2, kind = 'brave') {
  const w = createStartedWorld()
  retainFixtureUnits(w, () => false)
  w.buildings = []
  w.shrines = []
  w.trees = []
  w.terrain.fill(3)
  w.terrainVersion++
  w.manaWorld.gameFlags = 32
  for (let i = 0; i < count; i++) addUnit(w, 'blue', kind, { x: -25 + i * 0.5, z: 8 })
  w.selected = w.units.map(u => u.id)
  return w
}
const turn = (w, n) => { for (let i = 0; i < n; i++) tick(w, 1 / 12) }
const cellOf = (w, point) => {
  const n = nativePosition(w, point)
  return ((n.y & 65535) >> 9) * 128 + ((n.x & 65535) >> 9)
}
const models = (w, p) => p.commands.filter(Boolean).map(id => w.buildingOrders.records[id].model)
const near = (u, point, r = 1.5) => Math.hypot(u.x - point.x, u.z - point.z) < r

test('Ctrl+Alt points share one record per click, convert to a route and cycle at least twice', () => {
  const w = world()
  for (const point of [A, B, C]) assert.equal(command(w, point, route), true)
  const [first, second] = w.units.map(u => u.native)
  assert.equal(w.orderCursor, 3, 'Ctrl+Alt stays in the staged family and keeps planning')
  assert.deepEqual(w.selected, w.units.map(u => u.id))
  assert.deepEqual(models(w, first), [25, 25, 25])
  assert.deepEqual(first.commands, second.commands, 'each click is one shared record')
  for (const id of first.commands.filter(Boolean)) {
    assert.equal(w.buildingOrders.records[id].references, 2)
    assert.equal(w.buildingOrders.records[id].flags & 128, 128)
  }
  assert.ok(first.flags2 & 16)
  const cursors = [first.commandCursor]
  const visits = [[], [], []]
  for (let i = 0; i < 3000 && cursors.length < 8; i++) {
    turn(w, 1)
    if (first.commandCursor !== cursors.at(-1)) cursors.push(first.commandCursor)
    visits[first.commandCursor].push(w.units[0])
  }
  assert.deepEqual(cursors.slice(0, 7), [0, 1, 2, 0, 1, 2, 0], 'two full cycles 0→1→2→0')
  assert.equal(first.state, 10)
  assert.deepEqual(models(w, first), [25, 25, 25], 'route slots stay queued')
  assert.equal(w.buildingOrders.active, 3)
})

test('a route actually walks to each point and back', () => {
  const w = world(1)
  command(w, A, route)
  command(w, B, route)
  cancelInteraction(w)
  const u = w.units[0]
  let reachedA = 0, reachedB = 0
  for (let i = 0; i < 2400; i++) {
    turn(w, 1)
    if (near(u, A)) reachedA++
    if (near(u, B)) reachedB++
  }
  assert.ok(reachedA > 0 && reachedB > 0, `visited A ${reachedA} and B ${reachedB}`)
  assert.deepEqual(models(w, u.native), [25, 25], 'right-click deselect keeps the patrol')
  assert.deepEqual(w.selected, [])
})

test('a single Ctrl+Alt point stays an area guard (command 11) and never completes', () => {
  const w = world(1)
  command(w, A, route)
  cancelInteraction(w)
  const p = w.units[0].native
  assert.deepEqual(models(w, p), [11])
  turn(w, 600)
  assert.equal(currentPersonOrder(w.buildingOrders, p)?.model, 11)
  assert.ok(near(w.units[0], A, 3), 'the guard holds its area')
})

test('invalid Ctrl+Alt points are ignored without a move fallback', () => {
  const cases = {
    scenery: w => w.trees.push({ id: w.nextId++, x: A.x, z: A.z, logs: 1, model: 1 }),
    water: w => {
      const cell = cellOf(w, A)
      w.land.categories[cell] = 1
    },
    // Coastal cells are valid moves but not strict resting cells.
    coast: w => {
      const cell = cellOf(w, A)
      w.land.categories[cell] = 2
    },
    building: w => {
      const cell = cellOf(w, A)
      w.land.buildingIds[cell] = 77
    },
  }
  for (const [name, mutate] of Object.entries(cases)) {
    const w = world(1)
    mutate(w)
    const context = liveCommandContext(w, A, route)
    assert.equal(context.model, 11, name)
    assert.equal(context.enabled, false, name)
    // command() syncs landscape objects; reapply the cell mutation afterwards.
    assert.equal(command(w, A, route), false, name)
    assert.deepEqual(models(w, w.units[0].native ?? { commands: [] }), [], name)
    assert.equal(w.orderCursor, 0, name)
  }
  // A dormant tree (scenery model 0x11) does not block a point.
  const w = world(1)
  w.trees.push({ id: w.nextId++, x: A.x, z: A.z, logs: 1, model: 17 })
  assert.equal(liveCommandContext(w, A, route).enabled, true)
  // Without Ctrl+Alt the same ground is an ordinary move.
  assert.equal(liveCommandContext(world(1), A).model, 3)
  assert.equal(liveCommandContext(world(1), A, { ctrlKey: true }).model, 3)
  assert.equal(liveCommandContext(world(1), A, { altKey: true }).model, 3)
})

test('Ctrl+Alt or Shift over the own Shaman issues Shaman guard (command 30)', () => {
  for (const modifiers of [route, { shiftKey: true }]) {
    const w = world(2)
    const shaman = addUnit(w, 'blue', 'shaman', { x: 10, z: 8 })
    w.selected = w.units.filter(u => u.kind === 'brave').map(u => u.id)
    assert.equal(liveCommandContext(w, shaman, modifiers).model, 30)
    assert.equal(command(w, shaman, modifiers), true)
    const p = w.units[0].native
    assert.deepEqual(models(w, p), [30])
    assert.equal(currentPersonOrder(w.buildingOrders, p).a, shaman.id)
    turn(w, 300)
    assert.ok(w.units.filter(u => u.kind === 'brave').every(u => Math.hypot(u.x - shaman.x, u.z - shaman.z) < 5))
  }
  const w = world(2)
  const shaman = addUnit(w, 'blue', 'shaman', { x: 10, z: 8 })
  w.selected = w.units.filter(u => u.kind === 'brave').map(u => u.id)
  assert.equal(liveCommandContext(w, shaman).model, 3, 'a plain click on the Shaman stays a move')
})

test('the eighth Ctrl+Alt point finalizes and deselects; Alt on a plain final click deselects', () => {
  const w = world(1)
  for (let i = 0; i < 8; i++) command(w, { x: -20 + i * 3, z: 8 }, route)
  const p = w.units[0].native
  assert.equal(w.orderCursor, 0)
  assert.deepEqual(w.selected, [])
  assert.deepEqual(models(w, p), [25, 25, 25, 25, 25, 25, 25, 25])
  assert.deepEqual(p.commands.map(id => w.buildingOrders.records[id].flags & 128), [128, 128, 128, 128, 128, 128, 128, 0])
  const before = w.buildingOrders.active
  w.selected = [p.id]
  command(w, A, route)
  assert.equal(w.buildingOrders.active, 1, 'a new sequence (slot 0) replaces the full route')
  assert.ok(before === 8)
  command(w, B, { ctrlKey: true, altKey: true, shiftKey: true })
  assert.deepEqual(p.commands.filter(Boolean).map(id => w.buildingOrders.records[id].flags & 64), [0, 64])
  command(w, C, { altKey: true })
  assert.deepEqual(w.selected, [], 'Alt inverts keep-selection on the final plain click')
  assert.deepEqual(models(w, p), [25, 25, 3])
})

test('queued move before a route runs first; actions after a route wait', () => {
  const w = world(1)
  command(w, A, { ctrlKey: true })
  command(w, B, route)
  command(w, C, route)
  cancelInteraction(w)
  const p = w.units[0].native
  assert.deepEqual(models(w, p), [3, 25, 25])
  const cursors = [p.commandCursor]
  for (let i = 0; i < 3000 && cursors.length < 6; i++) {
    turn(w, 1)
    if (p.commandCursor !== cursors.at(-1)) cursors.push(p.commandCursor)
  }
  assert.deepEqual(cursors.slice(0, 5), [0, 1, 2, 1, 2])
  assert.deepEqual(models(w, p), [25, 25], 'the completed move is removed')

  const after = world(1)
  command(after, A, route)
  command(after, B, route)
  command(after, C, { ctrlKey: true })
  cancelInteraction(after)
  const q = after.units[0].native
  assert.deepEqual(models(after, q), [25, 25, 3])
  const seen = new Set()
  for (let i = 0; i < 2400; i++) {
    turn(after, 1)
    seen.add(q.commandCursor)
  }
  assert.deepEqual([...seen].sort(), [0, 1], 'the queued move waits behind the route')
})

test('N switches every tribe patroller with a later action with one RNG step each', () => {
  const w = world(3)
  // Two patrollers with a later move, issued as one selection.
  w.selected = [w.units[0].id, w.units[1].id]
  command(w, A, route)
  command(w, B, route)
  command(w, C, { ctrlKey: true })
  command(w, { x: 10, z: 18 }, route)
  // A third patroller has nothing queued after its route.
  w.selected = [w.units[2].id]
  command(w, A, route)
  command(w, B, route)
  cancelInteraction(w)
  const [a, b, c] = w.units.map(u => u.native)
  assert.deepEqual(models(w, a), [25, 25, 3, 11])
  turn(w, 40)
  const lone = c.commands.slice()
  assert.equal(stopLivePatrols(w, 1), 0, 'other tribes are not affected')
  // Fighting people (state != 10) are untouched.
  b.state = 12
  // A non-empty selection that does not include the switched person stays.
  w.selected = [w.units[2].id]
  // 0x4364d0 slot removal also releases a fight/formation assignment (bit 32)
  // with its own 0x4d4f40 draw; the restart itself draws exactly once.
  const probe = { randomState: w.randomState }
  for (let i = a.assignment & 32 ? 2 : 1; i--; ) random(probe)
  assert.equal(releasePlayerPatrols(w), 1)
  assert.equal(w.randomState, probe.randomState, 'one restart draw for the one switched person')
  assert.equal(currentPersonOrder(w.buildingOrders, a).model, 3)
  assert.equal(a.commandCursor, 2)
  assert.deepEqual(a.commands.slice(0, 2), [0, 0], 'earlier route slots are removed')
  assert.equal(w.buildingOrders.records[a.commands[3]].model, 11, 'later route slots survive')
  assert.deepEqual(models(w, b), [25, 25, 3, 11])
  assert.deepEqual(c.commands, lone, 'a route with nothing queued after it continues')
  assert.deepEqual(w.selected, [w.units[2].id], 'selection is unchanged')
  assert.equal(w.orderCursor, 0, 'planning is unchanged')
  b.state = 10
  // Unselected people are switched too, and the move actually executes.
  assert.equal(releasePlayerPatrols(w), 1)
  const reached = new Set()
  for (let i = 0; i < 400; i++) {
    turn(w, 1)
    for (const u of w.units.slice(0, 2)) if (near(u, C, 2)) reached.add(u.id)
  }
  assert.equal(reached.size, 2, 'both released people walk to the queued move')
  // The surviving later point (slot 3) is a single area guard and holds.
  for (const p of [a, b]) assert.equal(currentPersonOrder(w.buildingOrders, p).model, 11)
})

test('N exits a single-point area guard into its queued action', () => {
  const w = world(1)
  command(w, A, route)
  command(w, C, { ctrlKey: true })
  cancelInteraction(w)
  const p = w.units[0].native
  assert.deepEqual(models(w, p), [11, 3])
  turn(w, 30)
  assert.equal(currentPersonOrder(w.buildingOrders, p).model, 11)
  assert.equal(p.assignment & 32, 0)
  const probe = { randomState: w.randomState }
  random(probe)
  assert.equal(releasePlayerPatrols(w), 1)
  assert.equal(w.randomState, probe.randomState, 'exactly one RNG step')
  assert.equal(currentPersonOrder(w.buildingOrders, p).model, 3)
  turn(w, 300)
  assert.ok(near(w.units[0], C, 2))
  assert.equal(w.buildingOrders.active, 0)
})

test('N hands the queued action to its live owner (hut entry, tree, attack)', () => {
  // Hut entry (command 8) needs the entry adapter after the restart.
  {
    const w = world(1)
    const hut = addBuilding(w, 'blue', 'hut', { x: 10, z: 18 }, true)
    command(w, A, route)
    command(w, B, route)
    command(w, hut, { ctrlKey: true })
    cancelInteraction(w)
    const u = w.units[0]
    assert.deepEqual(models(w, u.native), [25, 25, 8])
    turn(w, 30)
    assert.equal(releasePlayerPatrols(w), 1)
    assert.equal(u.work, hut.id)
    for (let i = 0; i < 600 && u.inside !== hut.id; i++) turn(w, 1)
    assert.equal(u.inside, hut.id, 'the released brave enters the queued hut')
  }
  // Queued tree (command 7) and enemy (command 28) continue the same way.
  {
    const w = world(1)
    w.trees.push({ id: w.nextId++, x: 8, z: 20, logs: 4, model: 1 })
    const tree = w.trees.at(-1)
    command(w, A, route)
    command(w, B, route)
    command(w, tree, { ctrlKey: true })
    cancelInteraction(w)
    const u = w.units[0]
    assert.deepEqual(models(w, u.native), [25, 25, 7])
    turn(w, 30)
    assert.equal(releasePlayerPatrols(w), 1)
    let cargo = 0
    for (let i = 0; i < 1200 && !cargo; i++) {
      turn(w, 1)
      cargo = u.cargo
    }
    assert.ok(cargo > 0, 'the released brave gathers the queued tree')
  }
  {
    const w = world(1)
    const enemy = addUnit(w, 'red', 'brave', { x: 6, z: 20 })
    w.selected = [w.units[0].id]
    command(w, A, route)
    command(w, B, route)
    command(w, enemy, { ctrlKey: true })
    cancelInteraction(w)
    const u = w.units[0]
    assert.deepEqual(models(w, u.native), [25, 25, 28])
    turn(w, 30)
    assert.equal(releasePlayerPatrols(w), 1)
    const hp = enemy.hp
    for (let i = 0; i < 600 && enemy.hp === hp; i++) turn(w, 1)
    assert.ok(enemy.hp < hp, 'the released brave attacks the queued enemy')
  }
  // Queued construction (command 6) and enemy-building attack (command 19).
  {
    const w = world(1)
    const plan = addBuilding(w, 'blue', 'hut', { x: 10, z: 18 }, false)
    command(w, A, route)
    command(w, B, route)
    command(w, plan, { ctrlKey: true })
    cancelInteraction(w)
    const u = w.units[0]
    assert.deepEqual(models(w, u.native), [25, 25, 6])
    turn(w, 30)
    assert.equal(releasePlayerPatrols(w), 1)
    // Without timber the plan cannot progress; the ordinary [3, 6] queue ends
    // in this same builder state (crew slot, work, standing at the plan).
    for (let i = 0; i < 600 && !plan.builders?.includes(u.id); i++) turn(w, 1)
    turn(w, 300)
    assert.ok(plan.builders.includes(u.id), 'the released brave joins the construction crew')
    assert.equal(u.work, plan.id)
    assert.ok(u.builder)
    assert.equal(currentPersonOrder(w.buildingOrders, u.builder.person ?? u.native).model, 6)
    assert.ok(Math.hypot(u.x - plan.x, u.z - plan.z) < 4)
  }
  {
    const w = world(1)
    const target = addBuilding(w, 'red', 'hut', { x: 10, z: 18 }, true)
    command(w, A, route)
    command(w, B, route)
    command(w, target, { ctrlKey: true })
    cancelInteraction(w)
    const u = w.units[0]
    assert.deepEqual(models(w, u.native), [25, 25, 19])
    turn(w, 30)
    assert.equal(releasePlayerPatrols(w), 1)
    const hp = target.hp
    for (let i = 0; i < 1200 && target.hp === hp; i++) turn(w, 1)
    assert.ok(target.hp < hp, 'the released brave attacks the queued building')
  }
})

test('a new plain command replaces the patrol', () => {
  const w = world(1)
  command(w, A, route)
  command(w, B, route)
  command(w, C)
  const p = w.units[0].native
  assert.deepEqual(models(w, p), [25, 25, 3])
  w.selected = [p.id]
  command(w, { x: 10, z: 18 })
  assert.deepEqual(models(w, p), [3])
  assert.equal(w.buildingOrders.active, 1)
})

test('G replaces a selected patrol with Shaman guard', () => {
  const w = world(2)
  const shaman = addUnit(w, 'blue', 'shaman', { x: 10, z: 8 })
  w.selected = w.units.filter(u => u.kind === 'brave').map(u => u.id)
  command(w, A, route)
  command(w, B, route)
  turn(w, 60)
  guardShaman(w)
  for (const u of w.units.filter(u => u.kind === 'brave')) {
    assert.deepEqual(models(w, u.native), [30])
    assert.equal(w.buildingOrders.records[u.native.commands[0]].a, shaman.id)
  }
  assert.equal(w.buildingOrders.active, 1, 'the shared route records are released')
})

test('death releases the shared route references', () => {
  const w = world(2)
  command(w, A, route)
  command(w, B, route)
  cancelInteraction(w)
  turn(w, 10)
  assert.equal(w.buildingOrders.active, 2)
  for (const u of w.units) u.hp = 0
  turn(w, 200)
  assert.equal(w.buildingOrders.active, 0)
})

test('save/load mid-cycle continues identically', () => {
  const w = world(2)
  command(w, A, route)
  command(w, B, route)
  command(w, C, route)
  cancelInteraction(w)
  turn(w, 200)
  const resumed = migrateCheckpoint(structuredClone(w))
  for (let i = 0; i < 600; i++) {
    tick(w, 1 / 12)
    tick(resumed, 1 / 12)
  }
  assert.deepEqual(
    resumed.units.map(u => [u.x, u.z, u.native.commandCursor, u.native.state]),
    w.units.map(u => [u.x, u.z, u.native.commandCursor, u.native.state])
  )
  assert.equal(resumed.randomState, w.randomState)
})
