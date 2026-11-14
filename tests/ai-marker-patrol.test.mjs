import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { addUnit, command, cancelInteraction, tick, nativePosition, releasePlayerPatrols } from '../app/model.ts'
import { createGameStore, migrateCheckpoint } from '../app/game-store.ts'
import { appendLiveGuardOrders } from '../app/live-movement.ts'
import { currentPersonOrder } from '../app/person-orders.ts'

// Computer two-marker guards (task 24 through 0x4cedd0) queue two command-11
// records that 0x43b010 rewrites to a command-25 route. Command 25 completes
// through the shared movement body and 0x4366b0 keeps the repeat slot, for every
// tribe (decomp/research/player-patrol.md P5-P6, guard-posts.md section 6).
const A = { x: -10, z: 8 }, B = { x: 0, z: 18 }

function world(count = 2) {
  const w = createStartedWorld()
  retainFixtureUnits(w, () => false)
  w.buildings = []
  w.shrines = []
  w.trees = []
  w.terrain.fill(3)
  w.terrainVersion++
  w.manaWorld.gameFlags = 32
  for (let i = 0; i < count; i++) addUnit(w, 'red', 'brave', { x: -25 + i * 0.5, z: 8 })
  return w
}
const turn = (w, n) => {
  for (let i = 0; i < n; i++) tick(w, 1 / 12)
}
// 0x4cedd0 marker words carry the cell-aligned native x/y bytes.
const marker = (w, point) => {
  const n = nativePosition(w, point)
  return ((n.x >>> 8) & 254) | (n.y & 0xfe00)
}
const models = (w, p) => p.commands.filter(Boolean).map(id => w.buildingOrders.records[id].model)
const near = (u, point, r = 1.5) => Math.hypot(u.x - point.x, u.z - point.z) < r

function patrol(w, units = w.units.filter(u => u.team === 'red')) {
  appendLiveGuardOrders(w, units, marker(w, A), marker(w, B))
  return units
}

test('a computer two-marker guard becomes a shared command-25 route that walks and cycles', () => {
  const w = world()
  const [first, second] = patrol(w).map(u => u.native)
  assert.deepEqual(models(w, first), [25, 25])
  assert.deepEqual(first.commands, second.commands, 'the group shares one record per marker')
  assert.ok(first.flags2 & 16)
  const u = w.units[0],
    cursors = [first.commandCursor],
    reached = new Set()
  for (let i = 0; i < 4000 && cursors.length < 6; i++) {
    turn(w, 1)
    if (first.commandCursor !== cursors.at(-1)) cursors.push(first.commandCursor)
    if (near(u, A)) reached.add('A')
    if (near(u, B)) reached.add('B')
    assert.equal(first.state, 10, `turn ${w.turn}: the patroller never falls idle`)
  }
  assert.deepEqual(cursors, [0, 1, 0, 1, 0, 1], 'repeats 0→1→0 at least twice')
  assert.deepEqual([...reached].sort(), ['A', 'B'], 'it actually walks to both markers')
  assert.deepEqual(models(w, first), [25, 25], 'route slots stay queued')
  assert.equal(currentPersonOrder(w.buildingOrders, second).model, 25)
})

test('N releases only player patrols; a computer route keeps cycling', () => {
  const w = world(1)
  const [red] = patrol(w)
  // A distant player patroller with a later move proves N actually fired.
  const blue = addUnit(w, 'blue', 'brave', { x: -25, z: -40 })
  w.selected = [blue.id]
  command(w, { x: -10, z: -40 }, { ctrlKey: true, altKey: true })
  command(w, { x: 0, z: -30 }, { ctrlKey: true, altKey: true })
  command(w, { x: 10, z: -40 }, { ctrlKey: true })
  cancelInteraction(w)
  turn(w, 40)
  const commands = red.native.commands.slice(),
    cursor = red.native.commandCursor
  assert.equal(releasePlayerPatrols(w), 1)
  assert.equal(currentPersonOrder(w.buildingOrders, blue.native).model, 3)
  assert.deepEqual(red.native.commands, commands, 'computer route slots are untouched')
  assert.equal(red.native.commandCursor, cursor)
  const cursors = [cursor]
  for (let i = 0; i < 4000 && cursors.length < 4; i++) {
    turn(w, 1)
    if (red.native.commandCursor !== cursors.at(-1)) cursors.push(red.native.commandCursor)
  }
  assert.equal(cursors.length, 4, 'the computer route continues cycling after N')
  assert.equal(red.native.state, 10)
})

test('save/load mid-cycle continues a computer route identically', () => {
  const w = world(2)
  patrol(w)
  const p = w.units[0].native,
    cursors = [p.commandCursor]
  for (let i = 0; i < 4000 && cursors.length < 3; i++) {
    turn(w, 1)
    if (p.commandCursor !== cursors.at(-1)) cursors.push(p.commandCursor)
  }
  assert.deepEqual(cursors, [0, 1, 0], 'saved after one full cycle')
  turn(w, 30)
  const resumed = migrateCheckpoint(structuredClone(w)),
    sample = v =>
      v.units.map(u => [u.x, u.z, u.native.commandCursor, u.native.state, models(v, u.native)])
  for (let i = 0; i < 1200; i++) {
    tick(w, 1 / 12)
    tick(resumed, 1 / 12)
  }
  assert.deepEqual(sample(resumed), sample(w))
  assert.equal(resumed.randomState, w.randomState)
})

test('ordinary M16 Red marker patrols cycle through public Save/Load and are never re-issued', async () => {
  const store = createGameStore()
  store.startMission(16)
  const w = store.getWorld()
  const patrols = v =>
    v.units.filter(u => {
      const p = u.native
      return u.team === 'red' && u.hp > 0 && p && currentPersonOrder(v.buildingOrders, p)?.model === 25
    })
  while (w.turn < 400) tick(w, 1 / 12)
  const routeRecords = v =>
      v.buildingOrders.records.flatMap((r, id) => (r.model === 25 && r.references ? [id] : [])),
    records = routeRecords(w),
    watched = patrols(w).map(u => u.id),
    routes = new Map(patrols(w).map(u => [u.id, u.native.commands.slice()]))
  assert.ok(watched.length >= 8, 'both authored type-24 patrol groups are staffed')
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const replay = store.getWorld(),
    transitions = new Map(watched.map(id => [id, 0])),
    last = new Map(watched.map(id => [id, w.units.find(u => u.id === id).native.commandCursor]))
  while (w.turn < 1200) {
    tick(w, 1 / 12)
    tick(replay, 1 / 12)
    for (const id of watched) {
      const u = w.units.find(u => u.id === id)
      if (!u || u.hp <= 0) continue
      assert.equal(u.native.state, 10, `turn ${w.turn}: patroller ${id} stays on its route`)
      if (u.native.commandCursor !== last.get(id)) transitions.set(id, transitions.get(id) + 1)
      last.set(id, u.native.commandCursor)
    }
  }
  assert.deepEqual(replay, w)
  for (const id of watched) {
    const u = w.units.find(u => u.id === id)
    if (!u || u.hp <= 0) continue
    assert.ok(transitions.get(id) >= 2, `patroller ${id} cycled ${transitions.get(id)} times`)
    assert.deepEqual(u.native.commands, routes.get(id), `patroller ${id} keeps its original route`)
  }
  // Task 24 counts the cycling people (0x4cedd0 existing count), so their route
  // records are never retired and replaced; later records only add new people.
  const live = routeRecords(w)
  for (const id of records) assert.ok(live.includes(id), `route record ${id} stays live`)
})
