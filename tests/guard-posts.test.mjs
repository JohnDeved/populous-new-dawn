import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { addUnit, command, tick, cancelInteraction, nativePosition } from '../app/model.ts'
import {
  guardPostClick,
  guardPostPointAllowed,
  issueGuardPostCommand,
  liveCommandContext,
  removeHoveredGuardPost,
  resetGuardPostChain,
} from '../app/live-command.ts'
import {
  allocateGuardPost,
  guardPostCell,
  guardPostCount,
  guardPostDivisor,
  guardPostSlots,
  guardPostsInCell,
  GUARD_POST_CAP,
} from '../app/guard-posts.ts'
import { stepSecondaryEffects } from '../app/hut-smoke-runtime.ts'
import { createSecondaryEffects } from '../app/secondary-effects.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { CHECKPOINT_VERSION, createGameStore } from '../app/game-store.ts'
import { random } from '../app/native-math.ts'

// Player Guard Posts, decomp/research/guard-posts.md sections 1-8.
const A = { x: -10, z: 8 },
  B = { x: 0, z: 8 },
  C = { x: 0, z: 18 }

function world(count = 2, kind = 'brave') {
  const w = createStartedWorld(1, 'scalable')
  retainFixtureUnits(w, () => false)
  w.buildings = []
  w.shrines = []
  w.trees = []
  w.terrain.fill(3)
  w.terrainVersion++
  w.manaWorld.gameFlags = 32
  w.paused = false
  w.inputMask = 0
  w.mode = null
  for (let i = 0; i < count; i++) addUnit(w, 'blue', kind, { x: -25 + i * 0.5, z: 8 })
  w.selected = w.units.map(u => u.id)
  return w
}
const turn = (w, n) => {
  for (let i = 0; i < n; i++) tick(w, 1 / 12)
}
const cellAt = (w, point) => guardPostCell(nativePosition(w, point))
const models = (w, p) => p.commands.filter(Boolean).map(id => w.buildingOrders.records[id].model)
// One secondary traversal per game turn.
const visit = w => {
  w.turn++
  stepSecondaryEffects(w)
}
const posts = w => guardPostSlots(w.secondaryEffects).map(slot => w.secondaryEffects.slots[slot])

test('placement snaps a player-local post to the cell centre and records age 0', () => {
  const w = world(0)
  assert.equal(guardPostClick(w, A), 'placed')
  const [post] = posts(w)
  const cell = cellAt(w, A)
  assert.equal(post.cell, cell)
  assert.equal(post.position.x, ((cell & 0xfe) << 8) + 0x100)
  assert.equal(post.position.y, (cell & 0xfe00) + 0x100)
  assert.equal(post.age, 0)
  assert.equal(w.guardPostChain[0], 0, 'no selection: 004ba9b0 leaves the chain unchanged')
})

test('placement predicate 004b98f0: scenery, buildings and water reject; a post blocks only placement', () => {
  const w = world(0)
  const cell = cellAt(w, A)
  assert.equal(guardPostPointAllowed(w, cell, false), true)
  w.trees.push({ id: w.nextId++, x: A.x, z: A.z, logs: 1, model: 1 })
  assert.equal(guardPostClick(w, A), 'rejected')
  w.trees = []
  const index = ((cell >>> 9) & 127) * 128 + ((cell & 0xfe) >>> 1)
  w.land.buildingIds[index] = 77
  assert.equal(guardPostClick(w, A), 'rejected')
  w.land.buildingIds[index] = 0
  w.land.categories[index] = 2
  assert.equal(guardPostClick(w, A), 'rejected')
  w.land.categories[index] = 0
  assert.equal(guardPostClick(w, A), 'placed')
  assert.equal(guardPostPointAllowed(w, cell, false), false)
  assert.equal(guardPostPointAllowed(w, cell, true), true)
  assert.equal(guardPostClick(w, A), 'removed', 'clicking an existing post deletes it')
  assert.equal(guardPostCount(w.secondaryEffects), 0)
})

test('one post assigns every selected person, Shaman included, a shared command 11', () => {
  const w = world(2)
  addUnit(w, 'blue', 'shaman', { x: -24, z: 9 })
  w.selected = w.units.map(u => u.id)
  assert.equal(guardPostClick(w, A), 'placed')
  const cell = cellAt(w, A)
  const people = w.units.map(u => u.native)
  for (const p of people) assert.deepEqual(models(w, p), [11])
  const id = people[0].commands[0]
  assert.ok(
    people.every(p => p.commands[0] === id),
    'one shared record'
  )
  const order = w.buildingOrders.records[id]
  assert.equal(order.a, cell)
  assert.equal(order.b, 0x606, 'fixed extents 6,6')
  assert.equal(order.references, 3)
  assert.equal(w.guardPostChain[0], 1)
  assert.deepEqual(
    w.selected,
    w.units.map(u => u.id),
    'placement keeps the selection'
  )
})

test('Ctrl/Alt placement extends the chain into a command-25 patrol; 0x7a resets it', () => {
  const w = world(1)
  guardPostClick(w, A)
  guardPostClick(w, B)
  guardPostClick(w, C)
  const p = w.units[0].native
  assert.deepEqual(models(w, p), [25, 25, 25])
  assert.equal(w.guardPostChain[0], 3)
  resetGuardPostChain(w)
  assert.equal(w.guardPostChain[0], 0)
  guardPostClick(w, { x: 10, z: 8 })
  assert.deepEqual(models(w, p), [11], 'chain 0 clears the queue and starts a new guard')
  assert.equal(guardPostCount(w.secondaryEffects), 4, 'posts are markers, not order owners')
})

test('the ninth chained post is placed but assigns nothing', () => {
  const w = world(1)
  for (let i = 0; i < 9; i++) guardPostClick(w, { x: -30 + i * 4, z: 20 })
  const p = w.units[0].native
  assert.equal(models(w, p).length, 8)
  assert.ok(models(w, p).every(model => model === 25))
  assert.equal(w.guardPostChain[0], 8)
  assert.equal(guardPostCount(w.secondaryEffects), 9)
})

test('tribe command 0x62 scatters unselected idle people standing on the cell', () => {
  const w = world(1)
  const idle = addUnit(w, 'blue', 'brave', A)
  turn(w, 2)
  const idlePerson = idle.native
  assert.ok(idlePerson, 'idle brave has a native person')
  const state = idlePerson.state
  assert.ok([1, 17, 19].includes(state), `idle state ${state}`)
  w.selected = [w.units[0].id]
  assert.equal(guardPostClick(w, A), 'placed')
  assert.equal(idle.native.state, 43)
  assert.equal(idle.native.previousState, state)
})

test('the 0x62 scatter leaves people off the cell untouched', () => {
  const w = world(1)
  const away = addUnit(w, 'blue', 'brave', C)
  const before = away.native
  w.selected = [w.units[0].id]
  assert.equal(guardPostClick(w, A), 'placed')
  assert.equal(away.native, before, 'no native person is created for a distant follower')
  assert.notEqual(away.native?.state, 43)
})

test('a plain click on a post with followers selected orders command 11 there', () => {
  const w = world(1)
  w.selected = []
  guardPostClick(w, A)
  w.selected = [w.units[0].id]
  const context = liveCommandContext(w, A)
  assert.equal(context.model, 11)
  assert.equal(context.enabled, true)
  assert.equal(command(w, A), true)
  assert.deepEqual(models(w, w.units[0].native), [11])
})

test('patrol arrival resets the age of the post in the target cell', () => {
  const w = world(1)
  guardPostClick(w, A)
  guardPostClick(w, B)
  cancelInteraction(w)
  const [b, a] = posts(w)
  let resets = 0,
    last = a.age
  for (let i = 0; i < 1600; i++) {
    turn(w, 1)
    if (a.age < last) resets++
    last = a.age
  }
  assert.ok(resets >= 1, `post A age reset ${resets} times`)
  assert.ok(a.age < 1600 && b.age < 1600)
  assert.equal(guardPostCount(w.secondaryEffects), 2)
})

test('a single guard post never refreshes its own age (command 11 stays put)', () => {
  const w = world(1)
  guardPostClick(w, A)
  cancelInteraction(w)
  const [post] = posts(w)
  turn(w, 200)
  assert.equal(post.age, 200)
  assert.equal(currentPersonOrder(w.buildingOrders, w.units[0].native)?.model, 11)
})

test('age expires after 3000 and the follower order survives post removal', () => {
  const w = world(1)
  guardPostClick(w, A)
  const [post] = posts(w)
  post.age = 3000
  visit(w)
  assert.equal(post.age, 3001)
  assert.equal(guardPostCount(w.secondaryEffects), 1, 'pre-increment age 3000 survives')
  visit(w)
  assert.equal(guardPostCount(w.secondaryEffects), 0, 'pre-increment age 3001 is removed')
  assert.deepEqual(models(w, w.units[0].native), [11])
})

test('a post on a cell that turns to water is removed', () => {
  const w = world(0)
  guardPostClick(w, A)
  const cell = cellAt(w, A)
  w.land.categories[((cell >>> 9) & 127) * 128 + ((cell & 0xfe) >>> 1)] = 2
  visit(w)
  assert.equal(guardPostCount(w.secondaryEffects), 0)
})

test('Shift+right removal deletes the hovered post only outside placement mode', () => {
  const w = world(1)
  guardPostClick(w, A)
  w.mode = 'guardPost'
  assert.equal(removeHoveredGuardPost(w, A), false)
  w.mode = null
  assert.equal(removeHoveredGuardPost(w, B), false)
  assert.equal(removeHoveredGuardPost(w, A), true)
  assert.equal(guardPostCount(w.secondaryEffects), 0)
  assert.deepEqual(models(w, w.units[0].native), [11], 'guards stay in place')
})

test('divisor thresholds and the 64-post cap evict the oldest, else the farthest', () => {
  assert.deepEqual([0, 12, 13, 21, 22, 32, 33, 64].map(guardPostDivisor), [2, 2, 4, 4, 8, 8, 0, 0])
  const land = world(0).land
  const w = {
    land,
    secondaryEffects: createSecondaryEffects(),
    cosmeticRandom: { randomState: 1 },
    effectCounter: 0,
  }
  const cell = i => ((20 + (i % 32) * 2) & 0xfe) | (((40 + Math.floor(i / 32) * 2) << 8) & 0xfe00)
  for (let i = 0; i < 63; i++) allocateGuardPost(w, cell(i))
  const slots = guardPostSlots(w.secondaryEffects)
  const oldest = slots[40]
  w.secondaryEffects.slots[oldest].age = 9
  w.secondaryEffects.slots[slots[10]].age = 9
  allocateGuardPost(w, cell(63))
  assert.equal(guardPostCount(w.secondaryEffects), GUARD_POST_CAP - 1)
  assert.equal(
    w.secondaryEffects.slots[slots[10]]?.kind,
    undefined,
    'first strict maximum in list order'
  )
  assert.equal(w.secondaryEffects.slots[oldest]?.age, 9)
  for (const slot of guardPostSlots(w.secondaryEffects)) w.secondaryEffects.slots[slot].age = 0
  const newest = allocateGuardPost(w, cell(70))
  assert.equal(guardPostCount(w.secondaryEffects), GUARD_POST_CAP - 1)
  const origin = w.secondaryEffects.slots[newest].position
  const remaining = guardPostSlots(w.secondaryEffects).map(
    s => w.secondaryEffects.slots[s].position
  )
  assert.ok(
    !remaining.some(p => p.x === origin.x && p.y === origin.y && p !== origin),
    'newest kept'
  )
})

test('post updates draw only the cosmetic RNG; smoke follows the divisor gate', () => {
  const w = world(0)
  guardPostClick(w, A)
  const [post] = posts(w)
  const simulation = w.randomState
  const expected = { randomState: w.cosmeticRandom.randomState }
  post.counter = 0 // incremented to 1 before the visit: no smoke at divisor 2
  visit(w)
  random(expected)
  random(expected)
  assert.equal(w.cosmeticRandom.randomState, expected.randomState)
  assert.equal(w.randomState, simulation)
  visit(w)
  for (let i = 0; i < 4; i++) random(expected)
  assert.equal(w.cosmeticRandom.randomState, expected.randomState, 'jitter + init + lifetime')
  const smoke = w.secondaryEffects.order
    .map(slot => w.secondaryEffects.slots[slot])
    .find(effect => effect.kind === 'guardPostSmoke')
  assert.ok(smoke && smoke.lifetime >= 4 && smoke.lifetime < 36)
  assert.equal(smoke.position.h, post.position.h + 110)
})

// Every live record reference must have exactly one person owner (capacity policy).
function assertOwnership(w) {
  const owners = new Map()
  for (const u of w.units)
    for (const p of new Set([u.native, u.flight, u.fight?.motion, u.entry?.person, u.builder?.person]))
      for (const id of p ? [p.immediateCommand, ...p.commands] : [])
        if (id) owners.set(id, (owners.get(id) ?? 0) + 1)
  w.buildingOrders.records.forEach((order, id) => {
    if (id) assert.equal(order.references, owners.get(id) ?? 0, `record ${id} references`)
  })
}

test('a chained post on an occupied slot releases the old record (no orphan reference)', async () => {
  const w = world(2)
  const [u1, u2] = w.units
  for (const point of [A, B, C]) guardPostClick(w, point)
  assert.deepEqual(models(w, u2.native), [25, 25, 25])
  const old = u2.native.commands[1]
  resetGuardPostChain(w)
  w.selected = [u1.id]
  guardPostClick(w, { x: 10, z: 8 })
  w.selected = [u1.id]
  guardPostClick(w, { x: 10, z: 18 }) // chain 1 for u1 only
  w.selected = [u2.id]
  guardPostClick(w, { x: 20, z: 18 }) // chain 2: u2 slot 2 was occupied
  w.selected = [u2.id]
  assert.notEqual(u2.native.commands[2], old)
  assertOwnership(w)
  const store = createGameStore()
  Object.assign(store.getWorld(), structuredClone(w))
  store.getWorld().paused = true
  await store.saveCheckpoint()
  assert.equal(store.loadCheckpoint(), true)
  const restored = store.getWorld()
  restored.paused = w.paused = false
  for (let i = 0; i < 60; i++) {
    tick(w, 1 / 12)
    tick(restored, 1 / 12)
  }
  assert.deepEqual(restored.units, w.units)
  assertOwnership(restored)
})

test('guard death releases the shared guard record; the post stays a marker', () => {
  const w = world(2)
  guardPostClick(w, A)
  cancelInteraction(w)
  turn(w, 10)
  assert.equal(w.buildingOrders.active, 1)
  for (const u of w.units) u.hp = 0
  turn(w, 200)
  assert.equal(w.buildingOrders.active, 0)
  assert.equal(guardPostCount(w.secondaryEffects), 1)
})

test('checkpoints carry posts and the chain; a world without the chain is rejected', async () => {
  assert.equal(CHECKPOINT_VERSION, 4)
  const w = world(1)
  guardPostClick(w, A)
  guardPostClick(w, B)
  const store = createGameStore()
  Object.assign(store.getWorld(), structuredClone(w))
  const current = store.getWorld()
  current.paused = true
  await store.saveCheckpoint()
  assert.equal(store.loadCheckpoint(), true)
  const restored = store.getWorld()
  assert.notEqual(restored, current)
  assert.deepEqual(restored.guardPostChain, [2, 0, 0, 0])
  assert.equal(guardPostCount(restored.secondaryEffects), 2)
  restored.paused = current.paused = false
  for (let i = 0; i < 120; i++) {
    tick(current, 1 / 12)
    tick(restored, 1 / 12)
  }
  assert.deepEqual(posts(restored), posts(current))
  assert.deepEqual(restored.units, current.units)
  assert.equal(restored.cosmeticRandom.randomState, current.cosmeticRandom.randomState)
  const stale = createGameStore()
  Object.assign(stale.getWorld(), structuredClone(w))
  delete stale.getWorld().guardPostChain
  await assert.rejects(stale.saveCheckpoint(), /incompatible with this development version/)
})

test('enemy tribes never allocate a post and only the player owns a selection', () => {
  const w = world(0)
  const cell = cellAt(w, A)
  assert.equal(issueGuardPostCommand(w, 1, cell), false)
  assert.equal(guardPostsInCell(w.secondaryEffects, cell).length, 0)
})
