import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorldState, addUnit } from '../app/world-state.ts'
import { nativeCellPoint } from '../app/world-coordinates.ts'
import { nativePosition } from '../app/world-terrain-runtime.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { withCampaignTribe } from '../app/campaign-runtime.ts'
import { stepComputerTasks } from '../app/computer-runtime.ts'
import { moveObjectInCells, removeObjectFromCell } from '../app/object-cells.ts'
import { collectDefenseTargets } from '../app/computer-defense.ts'
import { spiralCell } from '../app/native-math.ts'
import { migrateCheckpoint } from '../app/game-store.ts'

// Supplied composition controls for the ordinary M6 transient owner observed at8116.
// The phase15 dispatcher itself owns the mixed Warrior19/Preacher17 orders.
function fixture({ mixed = true } = {}) {
  const w = createWorldState(6),
    ai = w.campaignAIs[2]
  Object.assign(w, { units: [], buildings: [], fights: [], selected: [], turn: 0 })
  w.objectCells.objects.clear()
  w.objectCells.heads.fill(0)
  w.pathfinding.people.clear()
  ai.tasks.forEach(t => {
    t.flags = 0
  })
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
    flags: 1,
    type: 20,
    phase: 15,
    entity: 65530,
    target: 0x383a,
    origin: 0x383a,
    members: members.map(u => u.id),
    requested: members.length,
    retreatPercent: 25,
    damage: 0,
    extra: 20,
  })
  const step = () => {
    ai.cursor = 0
    withCampaignTribe(w, 2, () => stepComputerTasks(w, 2))
  }
  step()
  assert.equal(task.phase, 16)
  assert.deepEqual(
    members.map(u => currentPersonOrder(w.buildingOrders, u.native)?.model),
    mixed ? [19, 17] : [19]
  )
  assert.equal(
    w.units.some(u => u.id === task.entity),
    false
  )
  return { w, ai, task, warrior, preacher, enemy, members, step }
}

function relocate(c, cell) {
  Object.assign(c.enemy, nativeCellPoint(cell))
  const position = nativePosition(c.w, c.enemy)
  moveObjectInCells(c.w.objectCells, c.enemy.native, position)
  assert.equal(c.w.objectCells.objects.get(c.enemy.id), c.enemy.native)
}

function retained(c) {
  const before = structuredClone({ orders: c.w.buildingOrders, random: c.w.randomState })
  for (let n = 0; n < 40; n++) c.step()
  assert.deepEqual([c.task.phase, c.task.retries, c.task.target], [16, 0, 0x383a])
  assert.deepEqual({ orders: c.w.buildingOrders, random: c.w.randomState }, before)
}

for (const sharedFightOwner of [false, true])
  test(`raid collection retains registered state29 ${sharedFightOwner ? 'shared flight/fight' : 'supplied flight-only'} ownership through checkpoint`, () => {
    const c = fixture(),
      p = c.enemy.native
    Object.assign(p, { state: 29, flags2: 2757248, flags4: 536879360, disguise: 0 })
    c.enemy.native = null
    c.enemy.flight = p
    if (sharedFightOwner)
      c.enemy.fight = {
        motion: p,
        group: 1,
        opponent: c.warrior.id,
        action: 'push',
        started: c.w.turn,
      }
    assert.equal(c.w.objectCells.objects.get(c.enemy.id), p)
    assert.ok(p.flags2 & 0x20000)
    assert.equal(p.flags2 & 0x10000, 0)
    assert.equal(p.flags4 & 0x1000, 0)
    const restored = migrateCheckpoint(structuredClone(c.w)),
      enemy = restored.units.find(u => u.id === c.enemy.id)
    assert.equal(enemy.native, null)
    assert.equal(enemy.flight.id, enemy.id)
    if (sharedFightOwner) assert.equal(enemy.flight, enemy.fight.motion)
    assert.equal(restored.objectCells.objects.get(enemy.id), enemy.flight)
    retained(c)
    const ai = restored.campaignAIs[2],
      task = ai.tasks[0],
      before = structuredClone({ orders: restored.buildingOrders, random: restored.randomState })
    for (let n = 0; n < 40; n++) {
      ai.cursor = 0
      withCampaignTribe(restored, 2, () => stepComputerTasks(restored, 2))
    }
    assert.deepEqual([task.phase, task.retries, task.target], [16, 0, 0x383a])
    assert.deepEqual({ orders: restored.buildingOrders, random: restored.randomState }, before)
  })

for (const [name, change] of [
  [
    'native exclusion flag',
    c => {
      c.enemy.native.flags2 |= 0x10000
    },
  ],
  [
    'native invisibility flag',
    c => {
      c.enemy.native.flags4 |= 0x1000
    },
  ],
  [
    'conversion state',
    c => {
      c.enemy.native.state = 23
    },
  ],
  [
    'completed matching Spy disguise',
    c => {
      c.enemy.kind = 'spy'
      c.enemy.native.model = 5
      c.enemy.native.disguise = 128
    },
  ],
  [
    'allied tribe',
    c => {
      c.w.outcome.alliances[2] |= 1
    },
  ],
  [
    'unlinked physical owner',
    c => {
      removeObjectFromCell(c.w.objectCells, c.enemy.native)
    },
  ],
])
  test('raid collector rejects ' + name, () => {
    const c = fixture()
    change(c)
    c.step()
    assert.deepEqual([c.task.phase, c.task.retries], [16, 1])
  })

test('raid collection includes an opposing non-Blue tribe', () => {
  const c = fixture()
  c.enemy.team = 'red'
  c.enemy.native.tribe = 1
  c.w.outcome.alliances[2] &= ~2
  retained(c)
})

for (const [name, cell, eligible] of [
  ['last included spiral cell', spiralCell(0x383a, 222, 0), true],
  ['omitted final spiral cell', spiralCell(0x383a, 223, 0), false],
  ['eighth axial cell formerly admitted by circle', 0x483a, false],
])
  test('raid collection respects ' + name, () => {
    const c = fixture()
    relocate(c, cell)
    if (eligible) retained(c)
    else {
      c.step()
      assert.deepEqual([c.task.phase, c.task.retries], [16, 1])
    }
  })

test('native collection retains ordered independent ten-person and ten-building caps', () => {
  const object = (id, extra = {}) => ({
    id,
    class: 1,
    model: 2,
    state: 17,
    tribe: 0,
    x: 0x3a00,
    y: 0x3800,
    flags2: 0,
    flags4: 0,
    assignment: 0,
    disguise: 0,
    ...extra,
  })
  const people = Array.from({ length: 11 }, (_, i) => object(i + 1)),
    buildings = Array.from({ length: 11 }, (_, i) =>
      object(i + 101, { class: 2, model: 1, flags2: 0x10000, flags4: 0x1000, state: 23 })
    )
  const row = people.flatMap((p, i) => [p, buildings[i]]),
    before = structuredClone(row)
  const found = collectDefenseTargets(2, 4, 0x383a, cell => (cell === 0x383a ? row : []))
  assert.deepEqual(
    found.people.map(p => p.id),
    Array.from({ length: 10 }, (_, i) => i + 1)
  )
  assert.deepEqual(
    found.buildings.map(p => p.id),
    Array.from({ length: 10 }, (_, i) => i + 101)
  )
  assert.deepEqual(row, before)
})

test('native person collector preserves wild/Angel exclusion and Spy disguise distinctions', () => {
  const person = (id, extra = {}) => ({
    id,
    class: 1,
    model: 3,
    state: 17,
    tribe: 0,
    x: 0x3a00,
    y: 0x3800,
    flags2: 0,
    flags4: 0,
    assignment: 0,
    disguise: 0,
    ...extra,
  })
  const row = [
    person(1, { model: 1 }),
    person(2, { model: 8 }),
    person(3, { model: 5, disguise: 128 }),
    person(4, { model: 5, disguise: 129 }),
    person(5, { model: 5, disguise: 64 }),
  ]
  const found = collectDefenseTargets(2, 4, 0x383a, cell => (cell === 0x383a ? row : []))
  assert.deepEqual(
    found.people.map(p => p.id),
    [4, 5]
  )
  assert.deepEqual(found.buildings, [])
})
